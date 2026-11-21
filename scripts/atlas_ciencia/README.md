# Atlas de estudo — Hull, séries temporais e crédito

As três páginas estão na raiz do repositório, com URLs estáveis:

- `01_hull_risk_management.html`
- `02_series_temporais_python.html`
- `03_deep_credit_risk_python.html`

Abra qualquer HTML no navegador. Não há build, CDN, serviço de dados ou chamada de API; a única dependência remota são as fontes Spectral e IBM Plex (Google Fonts), com fallback local se estiverem indisponíveis. Para compartilhar os arquivos fora deste repositório, mantenha junto a pasta `assets/atlas-ciencia/`.

## Camada Atlas Plus (21/11/2026)

- `assets/atlas-ciencia/capas/`: capas em alta resolução (Hull 6ª ed. via Amazon, Huang & Petukhina via Springer cover-hires, Deep Credit Risk via Amazon), exibidas como livro 3D grosso que folheia ao passar o mouse e depois acompanha o cursor.
- `assets/atlas-ciencia/plus.css` / `plus.js`: motor compartilhado — temas derivados das cores de cada capa, conceitos em negrito colorido com tooltip (`PLUS.cx`), fórmulas anotadas (`.fx`), fluxogramas animados (`.xflow`), gráficos em canvas com transição e hover, simuladores declarativos (`PLUS.sim(id, spec)`), heróis animados e contadores.
- `assets/atlas-ciencia/plus-<livro>.js` (`hull`, `series`, `credit`) e `plus-<livro>.css`: dicionário de conceitos e simuladores de cada livro.
- `scripts/atlas_ciencia/aplicar_plus.py`: aplicou cabeçalho, marca, assinatura, capa 3D e scripts às três páginas (idempotente).
- `scripts/atlas_ciencia/plus/<livro>_inserir.py` + fonte HTML (`hull_deep.html`, `series_blocos.html`, `credit_blocks.html`): reinserem os blocos `.deep` de cada tópico antes de `<details class="lesson-details">` (idempotentes). Edite a fonte e rode o script do livro.

Cada tópico ganhou um bloco de aprofundamento (texto denso, cartões laterais, fórmula anotada, fluxo animado, simulador e leitura executiva). As tags de capítulo seguem os sumários oficiais (Wiley TOC da 6ª ed., Springer link, deepcreditrisk.com/contents); literatura de base aparece como `src lit` e extensões contemporâneas como `src ext`.

## Organização

- `assets/atlas-ciencia/base.css`: estilos estruturais dos arquivos de referência fornecidos.
- `assets/atlas-ciencia/atlas.css`: interface reformulada, responsividade, impressão e paletas das capas.
- `assets/atlas-ciencia/laboratorios.js`: simulações determinísticas, métricas e gráficos calculados no navegador.
- `assets/atlas-ciencia/atlas.js`: busca local, navegação, restauração de parâmetros, placar dos exercícios e impressão.
- `scripts/atlas_ciencia/verificar.py`: verificações locais, com Chrome em perfil temporário e servidor restrito a `127.0.0.1`.

O conteúdo foi ampliado com 32 tópicos, perguntas centrais, exemplos aplicados, três casos resolvidos e nove trechos Python autocontidos. As rotas são uma organização educacional autoral, não uma reprodução da ordem dos capítulos dos livros.

## Escolhas metodológicas

Os laboratórios usam exclusivamente dados sintéticos e sementes fixas. O motor de crédito não implementa staging, fluxos completos de recuperação ou payoff; o tópico de eventos concorrentes explica esse último mecanismo sem atribuí-lo ao simulador. O exemplo de IRRBB é uma sensibilidade de título, não um motor bancário de EVE/NII. O ranking temporal seleciona o vencedor na própria janela de teste e informa essa limitação.

As equações, fontes e limites dos arquivos fornecidos foram preservados e complementados. Foram corrigidos os dois limites de referência da ACF, o tratamento de empates em AUC/KS, o rótulo da intensidade de cenário e o desenho das janelas completas do exemplo rolling-origin. O texto sobre Brier explicita que ele não isola calibração.

Fontes complementares consultadas em 20/11/2026:

- [Sumário oficial de Deep Credit Risk](https://www.deepcreditrisk.com/contents.html).
- [Documentação de calibração probabilística do scikit-learn](https://scikit-learn.org/stable/modules/calibration.html).
- [Forecasting: Principles and Practice — avaliação e validação temporal](https://otexts.com/fpp3/toolbox.html).
- [BCBS — IRRBB, documento de 2016](https://www.bis.org/bcbs/publ/d368.htm), tratado como referência histórica, com status consolidado.
- [IFRS Foundation — IFRS 9](https://www.ifrs.org/issued-standards/list-of-standards/ifrs-9-financial-instruments/).

## Verificação

Execute `python scripts/atlas_ciencia/verificar.py` com `beautifulsoup4` e `websocket-client` disponíveis e Chrome instalado no caminho padrão do Windows. Para conferir a preservação das equações de referência, o teste procura os HTMLs originais em `~/Downloads/`; a aplicação não depende deles.

A verificação cobre IDs e âncoras, recursos locais, fórmulas de referência, codificação, inicialização sem exceções, 14 controles, restauração, busca com e sem resultados, cópia de código, exercícios e reinício, larguras 320/390/768/1024/1440, movimento reduzido, saída para impressão e abertura por `file:`. Inclui casos com empates na AUC/KS e zeros no sMAPE.

Os nove exemplos foram executados separadamente em Python 3.11, com NumPy 2.4.6, pandas 3.1.1, SciPy 1.17.1, statsmodels 0.15.0 e scikit-learn 1.9.1 em pasta temporária. Essas versões registram o ambiente de verificação; não são dependências das páginas.

A publicação usa o GitHub Pages do repositório após o merge do pull request. Os arquivos originais de Downloads não foram sobrescritos.
