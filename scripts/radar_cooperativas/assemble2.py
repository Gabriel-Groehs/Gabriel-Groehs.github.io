import base64, json, os, sys
SP = os.path.dirname(os.path.abspath(__file__))
out = sys.argv[1]
tpl = open(os.path.join(SP, 'app', 'tpl.html'), encoding='utf-8').read()
gz = open(os.path.join(SP, 'data', 'radar2.json.gz'), 'rb').read()
b64 = base64.b64encode(gz).decode()
covers = {}
cd = os.path.join(SP, 'covers')
for f in sorted(os.listdir(cd)):
    if f.endswith('.webp') and not f.startswith('_'):
        covers[f[:-5]] = 'data:image/webp;base64,' + base64.b64encode(open(os.path.join(cd, f), 'rb').read()).decode()
files = ('core.js', 'ui.js', 'views_a.js', 'views_b.js', 'views_c.js', 'fx2.js', 'views_d.js')
js = '\n'.join(open(os.path.join(SP, 'app', n), encoding='utf-8').read() for n in files)
assert '</script' not in js.lower()
loader = r'''
async function RADAR_LOAD() {
  const el = document.getElementById('radar-data');
  const s = atob(el.textContent.trim()); const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  if (!('DecompressionStream' in window)) throw new Error('Este navegador não suporta DecompressionStream; use uma versão recente do Chrome, Edge, Firefox ou Safari.');
  const txt = await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  el.remove();
  return JSON.parse(txt);
}
'''
app = '<script>\n' + loader + '(async () => {\n  let D;\n  try { D = await RADAR_LOAD(); } catch (err) { document.getElementById("splashMsg").textContent = "Falha ao carregar os dados: " + err.message; return; }\n' + js + '\n  init();\n  const sp = document.getElementById("splash"); sp.classList.add("out"); setTimeout(() => sp.remove(), 600);\n})();\n</script>'
html = tpl.replace('<!--DATA-->', '<script id="radar-data" type="application/octet-stream">' + b64 + '</script>')
html = html.replace('<!--COVERS-->', '<script id="radar-covers" type="application/json">' + json.dumps(covers, separators=(',', ':')) + '</script>')
html = html.replace('<!--APP-->', app)
html = html.replace('\r\n', '\n').replace('\n', '\r\n')
open(out, 'w', encoding='utf-8', newline='').write(html)
print('ok', len(html.encode('utf-8')), 'bytes')
