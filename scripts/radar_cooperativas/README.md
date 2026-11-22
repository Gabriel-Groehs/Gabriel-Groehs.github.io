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
  meses ÷ saldo médio do período (uma aproximação da divisão pela soma dos saldos mensais).

## Integridade dos números (Onda 0)

- **Páginas repetidas no Olinda.** Os relatórios de set/25 vieram com cada linha triplicada; `load()` no
  `build_v2.py` descarta linhas idênticas. Os carregadores gravam por chave (não somam), então não houve
  distorção, mas a deduplicação protege coletas futuras.
- **Nada de dado futuro.** Com a coleta de 21/11/2026, os relatórios 7, 10, 11 e 13 existem para todos os
  trimestres (`AVQ` = 0…5). Se uma coleta falhar de novo, o build ainda usa o perfil mais próximo e a tela avisa;
  nesse caso, trate o perfil como indisponível nas séries históricas.
- **Ausência ≠ zero.** Cada instituição leva `AV = {r2, r4, r5}` por trimestre: `1` relatório presente, `0` ausente
  com a instituição ativa, `-` nenhum relatório na data. O acumulado de 12 meses só usa os pontos de que a conta
  depende (até jun = dez + jun); se faltar um, a instituição fica sem o indicador e a DRE mostra o motivo; nos
  agregados, a tela informa a cobertura. As séries trimestrais usam `flowQ` (NaN quando falta o trimestre ou, em
  jun/dez, o anterior).
- **Mínimo de capital por instituição** (`capReq` em `core.js`): regime completo = 8% de PR + adicional de capital
  principal informado no IF.data (campo `acp`: 2,5% de conservação; ~3,5% nos grandes bancos S1, com o adicional
  sistêmico) — Res. CMN 4.958; regime simplificado do S5 (sem capital principal informado) = 12% do RWAS5 na
  singular filiada a central e 17% nas demais — Res. CMN 4.606, art. 12. Agregados: mínimo médio ponderado pelo
  RWA, folga = soma das folgas individuais e contagem de instituições abaixo do próprio mínimo.
- **Estágios.** Metodologia completa (E1–E3, denominador próprio) e simplificada (sem/com problema de
  recuperação) ficam separadas; `pbR` = (E3 + problemáticos da simplificada) ÷ total é o indicador comparável.
- **Perímetros e divisores.** Carteira = 1.6 + outros créditos + arrendamento no cartão e na série; rendimento da
  tesouraria com centralização média; ROE só com PL médio positivo; eficiência só com receita positiva.

## Ondas 1 a 5 (22/11/2026)

- **Modelos declarados como o que são.** Vasicek com premissas e PD como hipótese; backtesting de VaR rotulado
  como experimento didático (Kupiec tratando o caso de todas as exceções); estresse sem "½ ΔEVE" no PR; capital
  econômico sem dupla contagem de mercado, com checagem de Cholesky da matriz de correlação e rótulo de exercício
  ilustrativo; RAROC com a hipótese de 60% das despesas no crédito à vista (`OPX_CRED`); rating com cobertura,
  redistribuição de pesos e sensibilidade a ±20% nos pesos.
- **Nomes.** CAMELS · proxy, PEARLS adaptado (P1*/P2*), Limites estilo RAS, grandes bancos, atraso > 90 dias (SCR),
  margem financeira antes da PE.
- **Precisão e contexto.** Saldo médio pela regra do trapézio; pares por porte (até R$ 250 mi, R$ 250 mi a 2 bi,
  acima de R$ 2 bi) e sistemas com sistemas (`peerSet`); NIM sobre ativos rentáveis, RORWA e DuPont; HHI e número
  efetivo de modalidades, participação do agro; capital social ÷ PL (COSIF 6.1.1); quadro de qualidade dos dados.
- **Séries.** Leitura da série no Painel (variações, 12 meses só com 5 pontos, real, base 100, maior queda,
  descritivos marcados) e faixa P25–P75 dos pares. Ponte de resultado 12m × 12m anteriores fica para quando houver
  8 trimestres.
- **Gráficos** (mesmos tipos): radar marca eixo "sem dado"; histograma informa quantos valores foram agrupados nas
  pontas; PEARLS separa a inadimplência das razões perto de 70%.
- **Narrativa.** Resumo executivo como tela de entrada (forças, pontos de atenção e o que mudou no trimestre) e
  navegação por pergunta.

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
