"""Insere (ou reinsere) os blocos de aprofundamento do Hull em 01_hull_risk_management.html.

Fonte: scripts/atlas_ciencia/plus/hull_deep.html, com marcadores <!--@lesson-ID--> e <!--@bookmap-->.
Idempotente: cada bloco fica entre <!--deep:ID--> e <!--/deep:ID--> e é substituído a cada execução.
Uso: python scripts/atlas_ciencia/plus/hull_inserir.py
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[3]
PAGE = ROOT / '01_hull_risk_management.html'
SRC = Path(__file__).with_name('hull_deep.html')


def blocks():
    text = SRC.read_text(encoding='utf-8')
    parts = re.split(r'<!--@([\w-]+)-->', text)
    return {parts[i]: parts[i + 1].strip() for i in range(1, len(parts), 2)}


def main():
    with open(PAGE, encoding='utf-8', newline='') as fh:
        html = fh.read()
    # remove o piloto antigo (sem marcadores), se ainda existir
    i = html.find('<div class="deep" id="deep-var-es">')
    if i >= 0 and '<!--deep:lesson-var-es-->' not in html:
        j = html.find('<details class="lesson-details">', i)
        html = html[:i] + html[j:]
    for key, block in blocks().items():
        html = re.sub(rf'<!--deep:{re.escape(key)}-->.*?<!--/deep:{re.escape(key)}-->', '', html, flags=re.S)
        wrapped = f'<!--deep:{key}-->{block}<!--/deep:{key}-->'
        if key == 'bookmap':
            k = html.find('<div class="study-map">')
            assert k > 0, 'study-map não encontrado'
            html = html[:k] + wrapped + html[k:]
            continue
        m = re.search(rf'<article class="lesson[^"]*" id="{re.escape(key)}"', html)
        assert m, key
        s = m.start()
        d = html.find('<details class="lesson-details">', s)
        nxt = html.find('<article class="lesson', s + 10)
        assert d > 0 and (nxt < 0 or d < nxt), ('details fora da lição', key)
        html = html[:d] + wrapped + html[d:]
    with open(PAGE, 'w', encoding='utf-8', newline='') as fh:
        fh.write(html)
    print('ok', len(html), 'bytes;', html.count('class="deep"'), 'blocos deep;', html.count('class="sim"'), 'simuladores')


if __name__ == '__main__':
    main()
