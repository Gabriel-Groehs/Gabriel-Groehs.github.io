"""Insere os blocos de aprofundamento (credit_blocks.html) em 03_deep_credit_risk_python.html.

Idempotente: cada bloco tem um id próprio (deep-*, mapa-livro-dcr); se já existir no HTML,
o bloco antigo é substituído pela versão atual do arquivo de blocos.
Uso: python scripts/atlas_ciencia/plus/credit_inserir.py
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[3]
PAGE = ROOT / '03_deep_credit_risk_python.html'
BLOCKS = Path(__file__).with_name('credit_blocks.html')


def blocks():
    txt = BLOCKS.read_text(encoding='utf-8')
    return {m.group(1): m.group(2).strip() for m in re.finditer(r'<!--block:([\w-]+)-->\s*(.*?)\s*<!--/block-->', txt, re.S)}


def outer_div_span(html, start):
    """Fim (exclusivo) do elemento que começa em `start` (div ou figure), contando aninhamento."""
    tag = re.match(r'<(\w+)', html[start:]).group(1)
    depth, i = 0, start
    pat = re.compile(rf'<{tag}[\s>]|</{tag}>')
    for m in pat.finditer(html, start):
        depth += 1 if m.group(0) != f'</{tag}>' else -1
        if depth == 0:
            return m.end()
    raise ValueError('elemento sem fechamento')


def remove_existing(html, el_id):
    i = html.find(f' id="{el_id}"')
    if i < 0:
        return html
    s = html.rfind('<', 0, i)
    e = outer_div_span(html, s)
    return html[:s] + html[e:]


def main():
    with open(PAGE, encoding='utf-8', newline='') as fh:
        html = fh.read()
    B = blocks()
    # mapa do livro logo após a barra de roteiro da cidade
    html = remove_existing(html, 'mapa-livro-dcr')
    i = html.find('<div class="storybar">')
    j = html.find('</div>', i) + len('</div>')
    html = html[:j] + B['bookmap'] + html[j:]
    for key, block in B.items():
        if not key.startswith('lesson-'):
            continue
        deep_id = re.search(r'id="(deep-[\w-]+)"', block).group(1)
        html = remove_existing(html, deep_id)
        a = html.find(f' id="{key}"')
        assert a > 0, key
        nxt = html.find('<article', a + 10)
        d = html.find('<details class="lesson-details">', a)
        assert d > 0 and (nxt < 0 or d < nxt), ('details fora da lição', key)
        html = html[:d] + block + html[d:]
    with open(PAGE, 'w', encoding='utf-8', newline='') as fh:
        fh.write(html)
    print('ok', len(html), 'blocos:', len(B))


if __name__ == '__main__':
    main()
