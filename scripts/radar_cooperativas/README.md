# Radar de Riscos — pipeline de dados

Gera `radar_cooperativas.html` (arquivo único, na raiz do site) a partir de dados públicos do Banco Central.
O nome do arquivo continua o mesmo para não quebrar links.

## Ordem de execução

Rode tudo de dentro desta pasta (Python 3.11; Pillow só é necessário para as capas). Os downloads brutos
(~300 MB) ficam em `data/`, `b4010/` e `sgs/`, que não devem ser versionados.

1. `python fetch_ifdata.py data AAAAMM` — IF.data (Olinda) do trimestre mais recente: cadastro e relatórios
   1, 2, 3, 4, 5, 7, 10, 11, 13 e 16 (tipo 1 = conglomerados prudenciais e instituições independentes).
2. `python fetch_hist.py` — cinco trimestres anteriores do IF.data e 12 meses de balancetes COSIF
   (4010 cooperativas, 4060 conglomerados prudenciais, combinados cooperativos 4413/4423/4433).
   Ajuste as listas de trimestres/meses no topo do script e em `build_v2.py` (`QS`, `MS`).
3. `python fetch_more.py` — relatórios 7, 10, 11 e 13 (indexador, clientes, prazos PF/PJ) dos trimestres
   anteriores e os balancetes do primeiro trimestre da série. Se o Olinda falhar, o build usa o perfil do
   trimestre mais próximo e a tela avisa.
4. Relação de cooperativas (filiação às centrais):
   `https://olinda.bcb.gov.br/olinda/servico/Instituicoes_em_funcionamento/versao/v1/odata/SedesCooperativas?$top=10000&$format=json`
   salvo como `data/coops_reg.json`.
5. `python fetch_sgs.py` — séries do SGS.
6. `RADAR_MAXLVL=4 python build_v2.py <raiz-do-site>` — monta `data/radar2.json` e `radar2.json.gz`
   (base completa por trimestre para a data-base selecionável; lê também o agregado SCR.data embutido em
   `cidade_credito.html`).
7. `python assemble2.py <raiz-do-site>/radar_cooperativas.html` — embute a base em gzip+base64
   (descompactada no navegador com `DecompressionStream`), as capas (`covers/*.webp`) e o app
   (`app/tpl.html` + `core.js`, `ui.js`, `views_a.js` … `views_d.js`, `fx2.js`).

## URLs úteis

- IF.data: `https://olinda.bcb.gov.br/olinda/servico/IFDATA/versao/v1/odata/`
- Balancetes: `https://www.bcb.gov.br/content/estabilidadefinanceira/cosif/{Cooperativas-de-credito|Conglomerados-prudenciais|Combinados-cooperativos}/AAAAMM{COOPERATIVAS|BLOPRUDENCIAL|COMBINADOS}.csv.zip`
  (combinados só existem em meses de fim de trimestre).

## Armadilhas conhecidas

- A DRE do IF.data é acumulada no semestre (mar = 1º tri, jun = 1º semestre, set = 3º tri, dez = 2º semestre).
- 593 singulares S5 informam só PR e RWAS5 (sem capital principal, nível I, exposição e IRRBB).
- A centralização financeira das cooperativas está em "outros ativos realizáveis" e sua remuneração em
  "outras receitas" no IF.data; o build traz do 4010 a conta 1.4.5 e os ingressos 7.1.9.86 (os dispêndios
  8.1.9.86 já estão nas despesas de captação do IF.data).
- No COSIF, o nível 4 (título) usa dois dígitos (1.6.3.05 é nível 4).
- DRE gerencial por segmento (v2.1): o build guarda as sublinhas f1–f6 (perda esperada por ativo) e
  l1–l3 (transações de pagamento) do relatório 4 e, do balancete, 1.8.8.79 + 1.4.1.50 (base de cartões),
  1.4.2 (créditos vinculados), 8.1.9.18/19/81 (custos diretos de pagamentos) e 8.1.9.50/52 (cessão e
  descontos em renegociação). `IQ` guarda só os ingressos 7.1.9.86: os dispêndios 8.1.9.86 já estão nas
  despesas de captação do IF.data (linha g4).
- Testes no Chrome headless: o navegador ignora trocas de endereço depois de ~200 em 10 s; rode lotes
  com menos de 200 navegações por processo. O app roda dentro de uma função assíncrona: para testar os
  internos, gere uma cópia que exponha o que for preciso em `window` logo antes de `init();`.
- Taxas ao mês × ao ano (Spread e DRE gerencial, escolha compartilhada em `ST.ui.tx`): fluxo do período ÷ nº de
  meses ÷ saldo médio do período. As séries trimestrais usam `flowQ`, que devolve NaN quando falta o relatório 4
  do trimestre (ou do anterior, em jun/dez) — sem isso, jun e dez carregariam o semestre inteiro.

## Interface

- Trocar instituição, data-base, tema ou qualquer controle dentro da mesma tela chama `render(false)`, que
  remonta a visão **no lugar**: guarda a posição na tela do elemento clicado (ou do primeiro bloco visível), o foco
  e as rolagens internas (`keepSnap`/`keepRestore` em `ui.js`) e desliga as animações de entrada (`STILL`).
  Controles que disparam `render(false)` devem ter uma chave `data-*` estável (`data-k`, `data-seg`, `data-code`…)
  para a âncora reencontrá-los. Trocar de tela (`go`) continua começando do topo.

## Música de abertura

- `assets/radar/sarabanda-handel.mp3` (na raiz do site, ao lado de `radar_cooperativas.html`): Sarabanda da Suíte
  em ré menor HWV 437 de G. F. Händel (domínio público), arranjo e gravação de **zero-project**
  (https://zero-project.gr/music/tracks/sarabande/), licença **CC BY 4.0** — o crédito aparece no rodapé, no
  botão e na Metodologia e deve acompanhar o arquivo.
- Gerado a partir do Ogg Vorbis do site do autor com `encode_music.py <entrada.ogg> <prefixo> 0.6` (pico
  normalizado a 0,95, silêncio das pontas aparado, fade-out de 1,5 s, MP3 VBR ~120 kbps). Requer `soundfile`
  (`pip install --target pylibs soundfile numpy`).
- O navegador só libera som depois de um gesto: a música começa ao abrir quando permitido, senão no primeiro
  clique, toque ou tecla. O botão no canto inferior direito liga/desliga; a escolha fica em `localStorage`
  (`radar-music`) e a música pausa com a aba em segundo plano. Se o MP3 não carregar, o botão some.
- Capas: Open Library (`books_ol.py`); a API do Google Books costuma estourar a cota anônima.

## Bloqueio de inspeção casual

O template e o HTML final bloqueiam o menu de contexto e os atalhos usuais de inspeção e visualização de código (F12, Ctrl/Cmd+U, Ctrl/Cmd+Shift+I/J/C/K e Cmd+Option+I/J/C/U). O clique esquerdo, a seleção, a cópia e os controles do Radar continuam disponíveis. Essa barreira de interface não protege o código entregue ao navegador e não substitui controle de acesso.
