"""Insere os blocos de aprofundamento (series_blocos.html) em 02_series_temporais_python.html.

Idempotente: cada bloco fica entre <!--plus:NOME--> e <!--/plus:NOME--> e é substituído a cada execução.
Uso: python scripts/atlas_ciencia/plus/series_inserir.py
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[3]
PAGE = ROOT / '02_series_temporais_python.html'
SRC = Path(__file__).with_name('series_blocos.html')


def esc_attr(block):
    # data-d recebe HTML (sub/sup); dentro de atributo os sinais < > ficam como entidades
    return re.sub(r'data-d="([^"]*)"', lambda m: 'data-d="' + m.group(1).replace('<', '&lt;').replace('>', '&gt;') + '"', block)


def wrap_terms(block):
    # cada termo da fórmula anotada é um grid de 2 colunas: a definição precisa ser um único item
    return re.sub(r'(<li data-k="[^"]+"><b>.*?</b>)(.*?)(</li>)', lambda m: m.group(1) + ('<span>' + m.group(2) + '</span>' if not m.group(2).startswith('<span>') else m.group(2)) + m.group(3), block)


def main():
    with open(PAGE, encoding='utf-8', newline='') as fh:
        html = fh.read()
    raw = SRC.read_text(encoding='utf-8')
    parts = re.split(r'<!--@([\w-]+)-->', raw)
    blocks = {parts[i]: wrap_terms(esc_attr(parts[i + 1].strip())) for i in range(1, len(parts), 2)}

    # remove inserções anteriores
    html = re.sub(r'<!--plus:([\w-]+)-->.*?<!--/plus:\1-->', '', html, flags=re.S)

    # mapa do livro logo depois da storybar
    i = html.find('<div class="storybar">')
    j = html.find('</div>', i) + len('</div>')
    assert i > 0 and j > i
    html = html[:j] + '<!--plus:bookmap-->' + blocks.pop('bookmap') + '<!--/plus:bookmap-->' + html[j:]

    for name, block in blocks.items():
        lid = name.replace('lesson-', '')
        i = html.find(f'id="{name}"')
        assert i > 0, name
        j = html.find('<details class="lesson-details">', i)
        assert j > 0, name
        tag = f'deep-{lid}'
        html = html[:j] + f'<!--plus:{tag}-->' + block + f'<!--/plus:{tag}-->' + html[j:]

    # capítulos corretos do tópico de estacionariedade (cap. 1, 3 e 9 segundo o sumário da Springer)
    html = html.replace('03 · Hipóteses estocásticas · Huang &amp; Petukhina, cap. 3 e 5', '03 · Hipóteses estocásticas · Huang &amp; Petukhina, cap. 1, 3 e 9')

    css = '<link href="assets/atlas-ciencia/plus.css" rel="stylesheet"/>'
    extra = '<link href="assets/atlas-ciencia/plus-series.css" rel="stylesheet"/>'
    if extra not in html:
        html = html.replace(css, css + extra, 1)

    with open(PAGE, 'w', encoding='utf-8', newline='') as fh:
        fh.write(html)
    print('ok', len(html), 'blocos:', len(blocks) + 1)


if __name__ == '__main__':
    main()
