"""Local browser checks for the three educational atlases.
Requires beautifulsoup4 and websocket-client, plus an existing Chrome installation.
Starts a loopback-only server and an isolated headless Chrome; closes both on exit.
"""
from pathlib import Path
from bs4 import BeautifulSoup
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import base64, contextlib, json, math, os, subprocess, sys, tempfile, threading, time, urllib.request
import websocket

ROOT = Path(__file__).resolve().parents[2]
FILES = ['01_hull_risk_management.html', '02_series_temporais_python.html', '03_deep_credit_risk_python.html']
ARTIFACTS = Path(tempfile.mkdtemp(prefix='atlas-qa-'))
CHROME = Path(os.environ.get('PROGRAMFILES', 'C:/Program Files')) / 'Google/Chrome/Application/chrome.exe'

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

class LocalServer(ThreadingHTTPServer):
    def handle_error(self, request, client_address):
        if not isinstance(sys.exception(), (ConnectionResetError, BrokenPipeError)):
            super().handle_error(request, client_address)

class CDP:
    def __init__(self, url):
        self.ws = websocket.create_connection(url, timeout=15, suppress_origin=True)
        self.n = 0
        self.errors = []
    def call(self, method, **params):
        self.n += 1
        request_id = self.n
        self.ws.send(json.dumps({'id': request_id, 'method': method, 'params': params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get('method') == 'Runtime.exceptionThrown':
                self.errors.append(msg['params']['exceptionDetails'])
            if msg.get('id') == request_id:
                if 'error' in msg:
                    raise RuntimeError(msg['error'])
                return msg.get('result', {})
    def evaluate(self, expression):
        result = self.call('Runtime.evaluate', expression=expression, returnByValue=True, awaitPromise=True)
        if 'exceptionDetails' in result:
            raise RuntimeError(result['exceptionDetails'])
        return result.get('result', {}).get('value')
    def snapshot(self, filename):
        result = self.call('Page.captureScreenshot', format='png', captureBeyondViewport=False)
        (ARTIFACTS / filename).write_bytes(base64.b64decode(result['data']))


def static_checks():
    for file in FILES:
        soup = BeautifulSoup((ROOT/file).read_text(encoding='utf-8'), 'html.parser')
        ids = [el['id'] for el in soup.select('[id]')]
        assert len(ids) == len(set(ids)), ('duplicate ID', file)
        for a in soup.select('a[href^="#"]'):
            assert a['href'][1:] in ids, (file, a['href'])
        for el in soup.select('[src],link[href],a[href]'):
            url = el.get('src') or el.get('href')
            if not url or url.startswith(('data:', 'http:', 'https:', '#', 'mailto:')):
                continue
            assert (ROOT / url.split('#')[0]).exists(), (file, url)
        original = BeautifulSoup((Path.home()/'Downloads'/file).read_text(encoding='utf-8'), 'html.parser')
        for before, after in zip(original.select('.lesson'), soup.select('.lesson')):
            # Preserve every original scientific lesson, including formulas and details.
            assert before.select_one('.equation').get_text(' ', strip=True) == after.select_one('.equation').get_text(' ', strip=True), (file, before['id'])
            assert after.select_one('.worked-example'), (file, before['id'])
        assert len(soup.select('.lesson')) == len(original.select('.lesson')) + (1 if file.startswith('03') else 0)
        assert [r.get_text(' ', strip=True).replace(' ↗','') for r in original.select('.reference')] == [r.get_text(' ', strip=True) for r in soup.select('.reference')]
        assert not any('\ufffd' in str(t) for t in soup.find_all(string=True)), ('invalid Unicode', file)
        import re
        assert not any(re.search(r'[A-Za-z]\?[A-Za-z]',str(t)) for t in soup.find_all(string=True) if t.parent.name!='script'), ('damaged accent',file)
        print('STATIC OK', file, flush=True)


def browser_checks():
    handler = partial(QuietHandler, directory=str(ROOT))
    server = LocalServer(('127.0.0.1', 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    port = server.server_port
    profile = tempfile.mkdtemp(prefix='atlas-chrome-')
    process = subprocess.Popen([str(CHROME), '--headless=new', '--remote-debugging-port=0', '--user-data-dir='+profile, '--no-first-run', '--disable-background-networking', '--disable-extensions', '--disable-features=Translate', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=subprocess.CREATE_NO_WINDOW)
    cdp = None
    try:
        portfile = Path(profile)/'DevToolsActivePort'
        for _ in range(200):
            if portfile.exists():
                break
            if process.poll() is not None:
                raise RuntimeError('Chrome exited before debugging became available')
            time.sleep(.1)
        debug_port = int(portfile.read_text().splitlines()[0])
        targets = json.load(urllib.request.urlopen(f'http://127.0.0.1:{debug_port}/json'))
        cdp = CDP(next(t['webSocketDebuggerUrl'] for t in targets if t['type']=='page'))
        cdp.call('Page.enable'); cdp.call('Runtime.enable')
        for file in FILES:
            slug = file[:2]
            cdp.errors = []
            cdp.call('Emulation.setDeviceMetricsOverride', width=1440, height=1050, deviceScaleFactor=1, mobile=False)
            cdp.call('Page.navigate', url=f'http://127.0.0.1:{port}/{file}')
            for _ in range(150):
                if cdp.evaluate("document.readyState==='complete' && !!document.querySelector('.reset-lab')"):
                    break
                time.sleep(.1)
            assert cdp.evaluate("document.querySelector('.reset-lab')!==null"), ('page initialization failed', file, cdp.errors)
            assert not cdp.errors, (file, cdp.errors)
            cdp.snapshot(slug+'-desktop.png')
            # Every range input must update its associated output; reset restores defaults.
            sliders = cdp.evaluate("[...document.querySelectorAll('input[type=range]')].map(e=>({id:e.id,min:e.min,max:e.max,value:e.value}))")
            for slider in sliders:
                test_value = slider['max'] if slider['value'] != slider['max'] else slider['min']
                changed = cdp.evaluate("""(()=>{const e=document.getElementById(%s),o=document.querySelector('output[for="'+e.id+'"]');const before=o.textContent;e.value=%s;e.dispatchEvent(new Event('input',{bubbles:true}));return {before,after:o.textContent,finite:![...document.querySelectorAll('.bigmetric')].some(e=>/NaN|Infinity/.test(e.textContent))}})()""" % (json.dumps(slider['id']), json.dumps(test_value)))
                assert changed['before'] != changed['after'] and changed['finite'], (file, slider, changed)
                cdp.evaluate("document.querySelectorAll('.reset-lab').forEach(b=>b.click())")
            # Independently check known monetary and probability results, not only DOM changes.
            if slug == '01':
                actual = cdp.evaluate("document.getElementById('h-pv').textContent")
                expected = sum(cf/1.09**t for t,cf in enumerate([6,6,6,6,106], 1))
                assert abs(float(actual.replace('.', '').replace(',', '.')) - expected) < .01, (actual, expected)
                cdp.evaluate("document.getElementById('h-tail').value=0;document.getElementById('h-tail').dispatchEvent(new Event('input'))")
                vals = cdp.evaluate("['h-var','h-es'].map(id=>document.getElementById(id).textContent)")
                tofloat = lambda x:float(x.split()[0].replace('.', '').replace(',', '.'))
                assert tofloat(vals[1]) >= tofloat(vals[0])
            elif slug == '02':
                rows = cdp.evaluate("document.querySelectorAll('#t-ranking tr').length")
                assert rows == 5
                bounds = cdp.evaluate("document.getElementById('t-acf').querySelectorAll('line[stroke-dasharray]').length")
                assert bounds == 2, bounds
            else:
                actual = cdp.evaluate("document.getElementById('c-pd').textContent")
                expected = 100/(1+math.exp(-(-3.55+.057*6+.03*7)))
                assert abs(float(actual.strip('%').replace(',','.'))-expected)<.01
                # Independent monthly default-mass sum for the published defaults.
                total = 0
                for weight,mult in [(.2,.68),(.55,1),(.25,2.04)]:
                    hazard = 1-(1-.03*mult)**(1/12)
                    total += weight*sum((1-hazard)**(t-1)*hazard*.45*100e6*(1-.75*t/36)/(1.1**(t/12)) for t in range(1,37))
                text = cdp.evaluate("document.getElementById('c-ecl').textContent")
                actual = float(text.split()[1].replace('.', '').replace(',','.'))*1e6
                assert abs(actual-total)<5001, (actual,total)
            cdp.evaluate("document.querySelectorAll('.reset-lab').forEach(b=>b.click())")
            # Search tolerates accents and has a meaningful empty state.
            query = {'01':'liquidez','02':'estacionariedade','03':'calibracao'}[slug]
            cdp.evaluate("document.querySelector('[data-search]').click()")
            cdp.evaluate("const q=document.getElementById('topic-query');q.value="+json.dumps(query)+";q.dispatchEvent(new Event('input'))")
            assert cdp.evaluate("document.querySelectorAll('#search-results a').length")>0
            cdp.evaluate("document.getElementById('topic-query').value='zzzzzzzz';document.getElementById('topic-query').dispatchEvent(new Event('input'))")
            assert cdp.evaluate("!!document.querySelector('.search-empty')")
            cdp.evaluate("document.getElementById('topic-search').close()")
            # Copy handler must copy the complete example without changing the system clipboard.
            cdp.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text}}});document.querySelector('.copycode').click()")
            assert cdp.evaluate("window.__copied===document.querySelector('.codecard pre').textContent")
            # Each answer shows feedback and can be retried.
            quiz = cdp.evaluate("""(()=>{const cards=[...document.querySelectorAll('[data-question]')];cards.forEach(c=>c.querySelectorAll('.q-options button')[+c.dataset.correct].click());return {disabled:document.querySelectorAll('.q-options button:disabled').length,score:document.querySelector('.quiz-score').textContent}})()""")
            assert quiz['disabled'] > 0 and '4 corretas' in quiz['score'], quiz
            cdp.evaluate("document.querySelector('.quiz-actions button').click()")
            assert cdp.evaluate("document.querySelectorAll('.q-options button:disabled').length")==0
            # Breakpoints, full-page overflow, mobile navigation and reduced motion.
            for width in [390, 320, 768, 1024, 1440]:
                cdp.call('Emulation.setDeviceMetricsOverride', width=width, height=900 if width>650 else 844, deviceScaleFactor=1, mobile=width<=650)
                cdp.evaluate("window.scrollTo({top:0,behavior:'instant'})")
                time.sleep(.15)
                dims = cdp.evaluate("({page:document.documentElement.scrollWidth,view:innerWidth})")
                assert dims['page'] <= dims['view']+1, (file, width, dims)
                if width==390:
                    cdp.snapshot(slug+'-mobile.png')
                    cdp.evaluate("document.querySelector('.mobile-nav').open=true")
                    assert cdp.evaluate("document.querySelector('.mobile-nav nav').getBoundingClientRect().right<=innerWidth")
                    cdp.evaluate("document.querySelector('.mobile-nav').open=false")
            cdp.call('Emulation.setEmulatedMedia', features=[{'name':'prefers-reduced-motion','value':'reduce'}])
            assert cdp.evaluate("getComputedStyle(document.documentElement).scrollBehavior")=='auto'
            cdp.call('Emulation.setEmulatedMedia', features=[])
            cdp.call('Emulation.setDeviceMetricsOverride', width=1440, height=1050, deviceScaleFactor=1, mobile=False)
            cdp.evaluate("document.getElementById('laboratorio').scrollIntoView({behavior:'instant'})")
            time.sleep(.2);cdp.snapshot(slug+'-lab.png')
            pdf = cdp.call('Page.printToPDF', printBackground=True, preferCSSPageSize=True)
            pdfpath = ARTIFACTS/(slug+'-print.pdf');pdfpath.write_bytes(base64.b64decode(pdf['data']))
            assert pdfpath.stat().st_size>10000
            assert not cdp.errors, (file, cdp.errors)
            print('BROWSER OK', file, 'sliders',len(sliders),'breakpoints 320–1440; PDF',pdfpath.stat().st_size,flush=True)
        # Math edge cases run from the same source in this isolated test browser.
        source=(ROOT/'assets/atlas-ciencia/laboratorios.js').read_text(encoding='utf-8')
        instrumented=source.replace("window.addEventListener('DOMContentLoaded'", "window.__qa={validation,quantile,accuracy,forecastModels};window.addEventListener('DOMContentLoaded'")
        cdp.evaluate(instrumented)
        ties=cdp.evaluate("__qa.validation([{p:.5,y:1},{p:.5,y:0}])")
        assert ties['auc']==.5 and ties['ks']==0 and ties['brier']==.25, ties
        assert cdp.evaluate("__qa.quantile([0,10],.95)")==9.5
        assert cdp.evaluate("__qa.accuracy([0,0],[0,0]).smape")==0
        print('MATH EDGE CASES OK',flush=True)
        # Open the atlas from disk too; there is no build or network dependency.
        cdp.call('Page.navigate',url=(ROOT/FILES[0]).as_uri())
        for _ in range(100):
            if cdp.evaluate("document.readyState==='complete' && !!document.querySelector('.reset-lab')"):
                break
            time.sleep(.1)
        assert cdp.evaluate("location.protocol==='file:' && document.querySelector('.reset-lab')!==null")
        print('FILE/OFFLINE OK',flush=True)
    finally:
        if cdp:
            with contextlib.suppress(Exception):cdp.call('Browser.close')
            with contextlib.suppress(Exception):cdp.ws.close()
        if process.poll() is None:
            process.terminate()
        with contextlib.suppress(Exception):process.wait(timeout=10)
        server.shutdown();server.server_close()

if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    print('ARTIFACTS',ARTIFACTS,flush=True)
    static_checks()
    browser_checks()
