"""Aplica a camada Atlas Plus às três páginas (idempotente).

- fontes editoriais + assets/atlas-ciencia/plus.css
- marca pessoal (kamon) no topo e assinatura dourada sob o título
- capa nova (arquivo em assets/atlas-ciencia/capas/) montada como livro 3D grosso
- faixa de métricas com contadores automáticos
- scripts plus.js + plus-<livro>.js

Uso: python scripts/atlas_ciencia/aplicar_plus.py
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
LOGO = ('<span aria-hidden="true" class="brandmark logo"><svg viewBox="0 0 100 100"><g fill="currentColor">'
        '<g transform="translate(50 50) rotate(45) translate(-50 -50)"><rect x="12" y="21.5" width="76" height="8"/>'
        '<rect x="12" y="70.5" width="76" height="8"/><rect x="21.5" y="12" width="8" height="76"/>'
        '<rect x="70.5" y="12" width="8" height="76"/></g><g transform="translate(50 50) rotate(-20) scale(1.04)">'
        '<path d="M0,-19 A19,19 0 0 1 16.45,9.5 A13.5,13.5 0 0 0 3.6,-6.3 A6.6,6.6 0 1 1 0,-19 Z"/>'
        '<path transform="rotate(120)" d="M0,-19 A19,19 0 0 1 16.45,9.5 A13.5,13.5 0 0 0 3.6,-6.3 A6.6,6.6 0 1 1 0,-19 Z"/>'
        '<path transform="rotate(240)" d="M0,-19 A19,19 0 0 1 16.45,9.5 A13.5,13.5 0 0 0 3.6,-6.3 A6.6,6.6 0 1 1 0,-19 Z"/>'
        '</g></g></svg></span>')
FONTS = ('<link href="https://fonts.googleapis.com" rel="preconnect"/><link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>'
         '<link href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700'
         '&amp;family=IBM+Plex+Sans:wght@400;500;600;700&amp;family=IBM+Plex+Mono:wght@400;500;600&amp;display=swap" rel="stylesheet"/>')
BOOKS = {
    '01_hull_risk_management.html': dict(slug='hull', img='hull-risk-management-6ed.jpg', ar='1.426', w='250px', t='86px',
        spine='Risk Management and Financial Institutions', small='HULL · WILEY', alt='Capa de Risk Management and Financial Institutions, 6ª edição, John C. Hull (Wiley Finance Series)',
        metrics=[('sim', 'simuladores e laboratórios'), ('fx', 'equações anotadas'), ('flow', 'fluxos animados'), ('cx', 'conceitos com definição no hover')]),
    '02_series_temporais_python.html': dict(slug='series', img='huang-petukhina-time-series.jpg', ar='1.554', w='240px', t='80px',
        spine='Applied Time Series Analysis and Forecasting with Python', small='SPRINGER', alt='Capa de Applied Time Series Analysis and Forecasting with Python, de Changquan Huang e Alla Petukhina (Springer, Statistics and Computing)',
        metrics=[('sim', 'simuladores e laboratórios'), ('fx', 'equações anotadas'), ('flow', 'fluxos animados'), ('cx', 'conceitos com definição no hover')]),
    '03_deep_credit_risk_python.html': dict(slug='credit', img='rosch-scheule-deep-credit-risk.jpg', ar='1.233', w='270px', t='82px',
        spine='Deep Credit Risk', small='RÖSCH · SCHEULE', alt='Capa de Deep Credit Risk: Machine Learning with Python, de Daniel Rösch e Harald Scheule',
        metrics=[('sim', 'simuladores e laboratórios'), ('fx', 'equações anotadas'), ('flow', 'fluxos animados'), ('cx', 'conceitos com definição no hover')]),
}


def apply(name, cfg):
    path = ROOT / name
    with open(path, encoding='utf-8', newline='') as fh:
        html = fh.read()
    if 'atlas-ciencia/plus.css' in html:
        print('já aplicado', name)
        return
    html = html.replace('<link href="assets/atlas-ciencia/atlas.css" rel="stylesheet"/>',
                        '<link href="assets/atlas-ciencia/atlas.css" rel="stylesheet"/>' + FONTS +
                        '<link href="assets/atlas-ciencia/plus.css" rel="stylesheet"/>'
                        f'<meta content="https://gabriel-groehs.github.io/assets/atlas-ciencia/capas/{cfg["img"]}" property="og:image"/>', 1)
    html = re.sub(r'<span aria-hidden="true" class="brandmark">[^<]*</span>', LOGO, html, count=1)
    html = html.replace('Obra de refer?ncia e capa fotografada', 'Obra de referência e capa em 3D').replace('Caminho da p?gina', 'Caminho da página')
    book = (f'<div aria-label="{cfg["alt"]}. Passe o mouse para folhear." class="book3d" data-leaves="12" role="img" '
            f'style="--ar:{cfg["ar"]};--w:{cfg["w"]};--t:{cfg["t"]}" tabindex="0"><div class="b3"><div class="b3-back"></div>'
            f'<div class="b3-spine"><span>{cfg["spine"]}</span><small>{cfg["small"]}</small></div>'
            '<div class="b3-top"></div><div class="b3-bottom"></div><div class="b3-edge"></div><div class="b3-paper"></div>'
            f'<div class="b3-front"><div class="face"><img alt="{cfg["alt"]}" decoding="async" src="assets/atlas-ciencia/capas/{cfg["img"]}"/></div>'
            '<div class="inside"></div></div><div class="b3-glare"></div></div><div class="b3-shadow"></div></div>'
            '<p class="book3d-hint">passe o mouse · o livro folheia</p>')
    html, n = re.subn(r'<div class="cover-frame"><img alt="[^"]*" src="data:image/[^"]+"/></div>', lambda m: book, html, count=1)
    assert n == 1, ('capa não encontrada', name)
    html, n = re.subn(r'(<h1 id="headline">.*?</h1>)', r'\1<p class="signature">Site idealizado e revisado por<strong>Gabriel Groehs</strong></p>', html, count=1, flags=re.S)
    assert n == 1, ('h1 não encontrado', name)
    strip = '<div class="metrics-strip">' + ''.join(
        f'<div class="metric-intro"><strong data-count="{k}">0</strong><span>{label}</span></div>' for k, label in cfg['metrics']) + '</div>'
    html, n = re.subn(r'<div class="metrics-strip">.*?</div></div>(?=<div class="layout">)', lambda m: strip, html, count=1, flags=re.S)
    assert n == 1, ('faixa de métricas não encontrada', name)
    html = html.replace('<script defer="" src="assets/atlas-ciencia/atlas.js"></script>',
                        '<script defer="" src="assets/atlas-ciencia/atlas.js"></script>'
                        '<script defer="" src="assets/atlas-ciencia/plus.js"></script>'
                        f'<script defer="" src="assets/atlas-ciencia/plus-{cfg["slug"]}.js"></script>', 1)
    with open(path, 'w', encoding='utf-8', newline='') as fh:
        fh.write(html)
    print('ok', name, len(html))


if __name__ == '__main__':
    for name, cfg in BOOKS.items():
        apply(name, cfg)
