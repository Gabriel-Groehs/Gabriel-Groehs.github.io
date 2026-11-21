/* Atlas Plus · Hull, Risk Management and Financial Institutions (6ª ed., Wiley, 2023)
   Conceitos (tooltip) e simuladores deste livro. Requer plus.js carregado antes.
   Capítulos conferidos no sumário oficial da Wiley (catalogimages.wiley.com, 9781119932482.toc.pdf). */
(()=>{'use strict';
const P=window.PLUS,{f,pct,n}=P;
const tpdf=P.tpdf,tinv=P.tinv;
const mi=(v,d=1)=>(v<0?'−':'')+'R$ '+f(Math.abs(v),d)+' mi';
const bp=v=>(v>0?'+':v<0?'−':'')+f(Math.abs(v),0)+' bp';

/* ---------- conceitos: t = termo PT, en = termo original, d = definição, f = fórmula, c = categoria ---------- */
P.cx=Object.assign(P.cx||{},{
 // cap. 1–4 · instituições e trade-off risco-retorno
 fronteira:{t:'Fronteira eficiente',en:'efficient frontier',c:'mod',m:['fronteira eficiente','efficient frontier'],d:'Conjunto de carteiras com o maior retorno esperado para cada nível de volatilidade (Markowitz). Abaixo dela há carteiras dominadas.',f:'min<sub>w</sub> wᵀΣw  s.a.  wᵀμ = μ*, wᵀ1 = 1'},
 capm:{t:'Modelo de precificação de ativos de capital',en:'Capital Asset Pricing Model (CAPM)',c:'mod',m:['CAPM'],d:'Só o risco sistemático (β) é remunerado; o risco idiossincrático é diversificável e não recebe prêmio.',f:'E[R<sub>i</sub>] = r<sub>f</sub> + β<sub>i</sub>(E[R<sub>m</sub>] − r<sub>f</sub>)'},
 apt:{t:'Teoria de precificação por arbitragem',en:'Arbitrage Pricing Theory (APT)',c:'mod',m:['APT','precificação por arbitragem'],d:'Generaliza o CAPM: o retorno esperado depende das exposições a vários fatores sistemáticos.'},
 sharpe:{t:'Índice de Sharpe',en:'Sharpe ratio',c:'m',m:['índice de Sharpe','Sharpe'],d:'Excesso de retorno sobre a taxa livre de risco por unidade de volatilidade. A carteira de tangência maximiza esse índice.',f:'S = (E[R<sub>p</sub>] − r<sub>f</sub>)/σ<sub>p</sub>'},
 riscosist:{t:'Risco sistemático',en:'systematic risk',m:['risco sistemático','sistemático'],d:'Parte do risco ligada ao mercado como um todo; não desaparece com diversificação e por isso é precificada.'},
 alavancagem:{t:'Alavancagem',en:'leverage',c:'m',m:['alavancagem'],d:'Uso de capital de terceiros para ampliar a exposição. Multiplica o retorno sobre o patrimônio e, na mesma proporção, a perda sobre ele.'},
 segdep:{t:'Seguro de depósitos',en:'deposit insurance',c:'reg',m:['seguro de depósitos','seguro de depósito'],d:'Garantia pública ou mutual aos depositantes. Reduz corridas bancárias, mas cria risco moral — motivo central para exigir capital.'},
 riscomoral:{t:'Risco moral',en:'moral hazard',m:['risco moral','moral hazard'],d:'Quem está protegido de uma perda passa a se expor mais a ela (segurado, banco com depósitos garantidos).'},
 selecao:{t:'Seleção adversa',en:'adverse selection',m:['seleção adversa','adverse selection'],d:'A parte com mais informação escolhe aderir quando o contrato a favorece (ex.: quem sabe que tem maior risco compra mais seguro).'},
 resseguro:{t:'Resseguro',en:'reinsurance',m:['resseguro'],d:'Seguro da seguradora: transfere parte dos riscos (sobretudo catastróficos) a outra companhia.'},
 hedgefund:{t:'Fundo multimercado alavancado',en:'hedge fund',m:['hedge funds','hedge fund'],d:'Fundo pouco regulado, com alavancagem e estratégias livres; a taxa de performance funciona como uma opção do gestor sobre o resultado.'},
 rating:{t:'Classificação de crédito',en:'credit rating',m:['ratings','rating'],d:'Opinião ordinal de agência sobre a qualidade de crédito. Tende a ser “through-the-cycle” e muda devagar.'},
 // cap. 5–7, 10, 15 · instrumentos e valuation
 otc:{t:'Mercado de balcão',en:'over-the-counter (OTC) market',c:'reg',m:['OTC','mercado de balcão'],d:'Negociação bilateral fora de bolsa. Após 2008, derivativos padronizados passaram a ser liquidados em contraparte central e a exigir margem.'},
 ccp:{t:'Contraparte central',en:'central counterparty (CCP)',c:'reg',m:['CCP','contraparte central'],d:'Entidade que se interpõe entre as partes, faz a compensação multilateral e exige margem inicial e de variação.'},
 securitizacao:{t:'Securitização',en:'securitization',m:['securitização'],d:'Transformação de carteiras de empréstimos em títulos com tranches de prioridade. Esteve no centro da crise de 2007–2008.'},
 riskneutral:{t:'Valuation neutra ao risco',en:'risk-neutral valuation',c:'mod',m:['neutra ao risco','neutro ao risco','risk-neutral'],d:'Preço = valor esperado descontado à taxa livre de risco em um mundo em que todos os ativos rendem r. Serve para precificar; não para prever perdas.'},
 realworld:{t:'Mundo real',en:'real world (physical measure)',c:'mod',m:['mundo real'],d:'Probabilidades efetivas dos cenários futuros; usadas em análise de cenários e mensuração de risco.'},
 delta:{t:'Delta',en:'delta (Δ)',c:'m',m:['delta'],d:'Sensibilidade do valor do derivativo ao preço do ativo-objeto: ∂V/∂S.',f:'Δ<sub>call</sub> = N(d<sub>1</sub>)'},
 gamma:{t:'Gama',en:'gamma (Γ)',c:'m',m:['gamma'],d:'Taxa de variação do delta: curvatura do valor em relação ao ativo-objeto. Mede o erro da aproximação linear.',f:'Γ = ∂²V/∂S² = φ(d<sub>1</sub>)/(Sσ√T)'},
 bsm:{t:'Black–Scholes–Merton',en:'Black–Scholes–Merton model',c:'mod',m:['Black–Scholes–Merton','Black-Scholes','Black–Scholes'],d:'Fórmula de preço de opções europeias sob log-normalidade e volatilidade constante.',f:'c = S N(d<sub>1</sub>) − K e<sup>−rT</sup> N(d<sub>2</sub>)'},
 // cap. 8–9 · volatilidade e dependência
 volimp:{t:'Volatilidade implícita',en:'implied volatility',c:'m',m:['volatilidade implícita','implied volatility'],d:'Volatilidade que, inserida na fórmula de opções, reproduz o preço de mercado. Olha para frente; a histórica olha para trás.'},
 ewma:{t:'Média móvel exponencial',en:'Exponentially Weighted Moving Average (EWMA)',c:'mod',m:['EWMA'],d:'Variância atualizada com peso λ na estimativa anterior e 1−λ no último retorno ao quadrado. O RiskMetrics usou λ = 0,94.',f:'σ²<sub>n</sub> = λσ²<sub>n−1</sub> + (1−λ)u²<sub>n−1</sub>'},
 garch:{t:'GARCH(1,1)',en:'Generalized Autoregressive Conditional Heteroskedasticity',c:'mod',m:['GARCH(1,1)','GARCH'],d:'Variância condicional com reversão a uma variância de longo prazo V<sub>L</sub>. α+β mede a persistência dos choques.',f:'σ²<sub>n</sub> = ω + αu²<sub>n−1</sub> + βσ²<sub>n−1</sub>'},
 varlp:{t:'Variância de longo prazo',en:'long-run variance rate',c:'m',m:['variância de longo prazo','V_L'],d:'Nível ao qual o GARCH(1,1) reverte. Só existe se α+β < 1.',f:'V<sub>L</sub> = ω/(1 − α − β)'},
 mle:{t:'Máxima verossimilhança',en:'maximum likelihood estimation',c:'mod',m:['máxima verossimilhança'],d:'Escolhe os parâmetros que tornam mais provável a amostra observada; é o método usual para estimar EWMA e GARCH.'},
 powerlaw:{t:'Lei de potência',en:'power law',c:'mod',m:['lei de potência','power law'],d:'Para valores grandes de x, P(v > x) ≈ K·x<sup>−α</sup>. Descreve bem a cauda de variações de preços e de perdas operacionais.'},
 caudadep:{t:'Dependência de cauda',en:'tail dependence',c:'m',m:['dependência de cauda','tail dependence'],d:'Probabilidade de uma variável estar em sua cauda dado que a outra está. Zero na cópula gaussiana; positiva na cópula t.',f:'λ<sub>L</sub> = lim<sub>q→0</sub> P(U<sub>2</sub> ≤ q | U<sub>1</sub> ≤ q)'},
 copgauss:{t:'Cópula gaussiana',en:'Gaussian copula',c:'mod',m:['cópula gaussiana','Gaussian copula'],d:'Mapeia cada marginal na normal padrão percentil a percentil e impõe dependência normal multivariada. Não tem dependência de cauda.'},
 copt:{t:'Cópula t',en:'Student t copula',c:'mod',m:['cópula t','t copula'],d:'Como a gaussiana, mas com um choque comum de escala: produz extremos conjuntos mais frequentes.'},
 covmat:{t:'Matriz de covariâncias',en:'variance-covariance matrix',m:['matriz de covariâncias','matriz de covariância'],d:'Precisa ser positiva semidefinida para ser internamente consistente; atualizar correlações uma a uma pode violar isso.'},
 // cap. 11–13 · risco de mercado
 var:{t:'Valor em risco',en:'Value at Risk (VaR)',c:'m',m:['VaR','Value at Risk','valor em risco'],d:'Perda que não é excedida com probabilidade α em um horizonte definido: um quantil da distribuição de perdas. Não diz nada sobre o tamanho da perda além do limiar.',f:'VaR<sub>α</sub> = F<sub>L</sub><sup>−1</sup>(α)'},
 es:{t:'Perda esperada na cauda',en:'Expected Shortfall (ES)',c:'m',m:['Expected Shortfall','ES','perda esperada na cauda'],d:'Média das perdas condicionada a estarem além do VaR. É subaditiva (coerente) e passou a ser a medida-base do FRTB, calibrada a 97,5%.',f:'ES<sub>α</sub> = (1−α)<sup>−1</sup>∫<sub>α</sub><sup>1</sup> VaR<sub>u</sub> du'},
 quantil:{t:'Quantil',en:'quantile',m:['quantil','quantis'],d:'Valor abaixo do qual está uma fração α da distribuição. O VaR é o quantil α das perdas.',f:'Q<sub>α</sub>(L) = inf{ℓ : P(L ≤ ℓ) ≥ α}'},
 coerente:{t:'Medida de risco coerente',en:'coherent risk measure',c:'mod',m:['medida coerente','medidas coerentes','medida de risco coerente'],d:'Medida monotônica, invariante a translação, homogênea e subaditiva (Artzner et al., 1999). ES é coerente; VaR pode violar a subaditividade.'},
 euler:{t:'Alocação de Euler',en:"Euler's theorem / Euler allocation",c:'mod',m:['teorema de Euler','alocação de Euler','Euler'],d:'Para medidas homogêneas de grau 1, a soma das contribuições marginais (x<sub>i</sub>·∂R/∂x<sub>i</sub>) reproduz exatamente o risco total.',f:'R = Σ<sub>i</sub> x<sub>i</sub> ∂R/∂x<sub>i</sub>'},
 backtest:{t:'Teste retrospectivo',en:'back-testing',c:'mod',m:['backtesting','back-testing','backtest'],d:'Comparação entre o VaR previsto ex ante e o P&L realizado. Conta exceções (dias em que a perda superou o VaR) e testa se a frequência é compatível com 1−α.'},
 excecao:{t:'Exceção de VaR',en:'VaR exception',c:'m',m:['exceções','exceção'],d:'Dia em que a perda realizada excede o VaR do dia. Com VaR de 99% em 250 dias, espera-se 2,5 exceções.'},
 kupiec:{t:'Teste de Kupiec',en:'proportion of failures (POF) test',c:'mod',m:['Kupiec'],d:'Teste de razão de verossimilhança para a proporção de exceções. Sob H₀ a estatística segue χ² com 1 grau de liberdade.',f:'LR = −2 ln[(1−p)<sup>n−x</sup>p<sup>x</sup>] + 2 ln[(1−x/n)<sup>n−x</sup>(x/n)<sup>x</sup>]'},
 semaforo:{t:'Semáforo de Basileia',en:'Basel traffic light',c:'reg',m:['semáforo','traffic light'],d:'Zonas para o número de exceções em 250 dias a 99%: verde (0–4), amarela (5–9, acréscimo ao multiplicador) e vermelha (10+).'},
 caudapesada:{t:'Cauda pesada',en:'fat tails / heavy tails',m:['caudas pesadas','cauda pesada','fat tails'],d:'Probabilidade de eventos extremos maior do que a normal prevê. Variações diárias de preços costumam ter curtose acima de 3.'},
 tstudent:{t:'Distribuição t de Student',en:'Student t distribution',c:'mod',m:['t de Student','Student-t'],d:'Família simétrica com caudas mais pesadas que a normal; ν (graus de liberdade) controla a cauda. Com ν → ∞ converge para a normal.'},
 raizt:{t:'Regra da raiz do tempo',en:'square-root-of-time rule',c:'mod',m:['raiz do tempo','raiz quadrada do tempo'],d:'Escala o VaR de 1 dia para T dias multiplicando por √T. Supõe retornos i.i.d. de média zero; falha com autocorrelação e volatilidade que muda.',f:'VaR<sub>T</sub> ≈ √T · VaR<sub>1</sub>'},
 hs:{t:'Simulação histórica',en:'historical simulation',c:'mod',m:['simulação histórica','historical simulation'],d:'Reaplica à carteira atual as variações observadas dos fatores de risco em cada um dos últimos N dias e lê o quantil das perdas resultantes.'},
 evt:{t:'Teoria de valores extremos',en:'Extreme Value Theory (EVT)',c:'mod',m:['EVT','teoria de valores extremos'],d:'Resultados assintóticos para a cauda: acima de um limiar alto, os excessos seguem aproximadamente uma Pareto generalizada.'},
 gpd:{t:'Distribuição de Pareto generalizada',en:'Generalized Pareto Distribution (GPD)',c:'mod',m:['GPD','Pareto generalizada'],d:'Distribuição limite dos excessos sobre um limiar alto; ξ > 0 indica cauda pesada (lei de potência).',f:'G<sub>ξ,β</sub>(y) = 1 − (1 + ξy/β)<sup>−1/ξ</sup>'},
 modelbuild:{t:'Abordagem de construção de modelo',en:'model-building approach',c:'mod',m:['abordagem de construção de modelo','delta-normal','model-building'],d:'VaR a partir das sensibilidades da carteira e da matriz de covariâncias dos fatores (paramétrico). Rápido, mas linear e normal.',f:'σ<sub>P</sub>² = δᵀΣδ'},
 pl:{t:'Lucros e perdas',en:'P&L (profit and loss)',m:['P&L'],d:'Resultado diário marcado a mercado de uma carteira; é o que o back-testing compara com o VaR.'},
 // cap. 14 · juros
 dv01:{t:'DV01',en:'dollar value of a basis point',c:'m',m:['DV01'],d:'Variação de valor de uma posição para um deslocamento de 1 ponto-base (0,01%) na taxa.',f:'DV01 ≈ −∂P/∂y × 10<sup>−4</sup>'},
 duration:{t:'Duration modificada',en:'modified duration',c:'m',m:['duration','Duration'],d:'Sensibilidade percentual do preço a uma variação pequena da taxa. Aproximação de primeira ordem.',f:'D<sub>mod</sub> = −(1/P)·∂P/∂y'},
 convexidade:{t:'Convexidade',en:'convexity',c:'m',m:['convexidade'],d:'Curvatura da relação preço–taxa; corrige a aproximação por duration em choques grandes.',f:'ΔP/P ≈ −D·Δy + ½·C·(Δy)²'},
 partial:{t:'Duration parcial (por vértice)',en:'partial duration / key rate',c:'m',m:['duration parcial','durations parciais','key rate','key rates'],d:'Sensibilidade a um choque em um único vértice da curva. A soma das durations parciais dá a duration total.'},
 pca:{t:'Análise de componentes principais',en:'principal components analysis (PCA)',c:'mod',m:['componentes principais','PCA'],d:'Reduz os movimentos da curva a poucos fatores ortogonais — nível, inclinação e curvatura costumam explicar quase toda a variação.'},
 nii:{t:'Margem financeira líquida',en:'net interest income (NII)',c:'m',m:['NII','margem financeira'],d:'Receita de juros menos despesa de juros em um horizonte (em geral 12 meses). Sensível ao descasamento de repactuação.'},
 eve:{t:'Valor econômico do patrimônio',en:'economic value of equity (EVE)',c:'m',m:['EVE'],d:'Valor presente dos fluxos de ativos menos o dos passivos. ΔEVE mede o impacto de um choque de juros sobre o valor do banco.'},
 irrbb:{t:'Risco de juros na carteira bancária',en:'interest rate risk in the banking book (IRRBB)',c:'reg',m:['IRRBB'],d:'Risco de que movimentos de taxa afetem valor econômico (EVE) e margem (NII) das posições fora da carteira de negociação. O padrão do BCBS (2016) usa seis cenários de choque.'},
 // cap. 17–19 · crédito
 pd:{t:'Probabilidade de default',en:'probability of default (PD)',c:'m',m:['PD'],d:'Probabilidade de o devedor inadimplir em um horizonte. Pode ser histórica (mundo real) ou implícita em preços (neutra ao risco).'},
 lgd:{t:'Perda dado o default',en:'loss given default (LGD)',c:'m',m:['LGD'],d:'Fração da exposição perdida no default: 1 − taxa de recuperação.',f:'LGD = 1 − R'},
 ead:{t:'Exposição no default',en:'exposure at default (EAD)',c:'m',m:['EAD'],d:'Valor exposto no momento do default, incluindo saques futuros de linhas.'},
 recup:{t:'Taxa de recuperação',en:'recovery rate',c:'m',m:['taxa de recuperação','recovery rate'],d:'Fração do valor de face recuperada após o default. Tende a cair quando as taxas de default sobem.'},
 hazard:{t:'Intensidade de default',en:'hazard rate / default intensity',c:'m',m:['intensidade de default','hazard rate'],d:'Probabilidade instantânea de default condicional à sobrevivência. Do spread: λ ≈ s/(1−R).',f:'Q(t) = 1 − e<sup>−λ̄t</sup>'},
 cds:{t:'Swap de default de crédito',en:'credit default swap (CDS)',c:'mod',m:['CDS'],d:'Seguro contra o default de uma entidade de referência; o prêmio anual (spread) revela a PD neutra ao risco.'},
 spread:{t:'Spread de crédito',en:'credit spread',c:'m',m:['spread de crédito','spreads de crédito'],d:'Excesso de rendimento sobre a taxa livre de risco exigido para carregar o risco de crédito.'},
 merton:{t:'Modelo de Merton',en:'Merton model',c:'mod',m:['modelo de Merton','Merton'],d:'O patrimônio é uma opção de compra sobre os ativos da firma com preço de exercício igual à dívida; default ocorre se V<sub>T</sub> < D.',f:'E<sub>0</sub> = V<sub>0</sub>N(d<sub>1</sub>) − De<sup>−rT</sup>N(d<sub>2</sub>)'},
 dd:{t:'Distância ao default',en:'distance to default',c:'m',m:['distância ao default','distance to default'],d:'Quantos desvios-padrão o valor dos ativos está acima da dívida no horizonte; no Merton, d<sub>2</sub>.',f:'PD = N(−d<sub>2</sub>)'},
 ee:{t:'Exposição esperada',en:'expected exposure (EE)',c:'m',m:['exposição esperada','expected exposure'],d:'Média da exposição positiva futura a uma contraparte em cada data: E[max(V<sub>t</sub>, 0)].'},
 pfe:{t:'Exposição potencial futura',en:'potential future exposure (PFE)',c:'m',m:['PFE','exposição potencial futura'],d:'Quantil alto (ex.: 97,5%) da exposição futura em cada data; usado para limites de contraparte.'},
 cva:{t:'Ajuste de valor de crédito',en:'Credit Value Adjustment (CVA)',c:'m',m:['CVA'],d:'Desconto no valor de derivativos pela possibilidade de default da contraparte.',f:'CVA = (1−R) Σ q<sub>i</sub> v<sub>i</sub>'},
 dva:{t:'Ajuste de valor de débito',en:'Debit Value Adjustment (DVA)',c:'m',m:['DVA'],d:'Simétrico do CVA: valor do próprio default para a instituição. Controverso porque cresce quando o crédito do banco piora.'},
 xva:{t:'Ajustes de valor',en:'xVAs (CVA, DVA, FVA, MVA, KVA)',c:'m',m:['xVAs','xVA'],d:'Família de ajustes ao valor livre de risco de derivativos: crédito, funding, margem inicial e capital.'},
 wwr:{t:'Risco de correlação adversa',en:'wrong-way risk',m:['wrong-way risk'],d:'A exposição à contraparte cresce exatamente quando a qualidade de crédito dela piora.'},
 vasicek:{t:'Modelo de Vasicek',en:"Vasicek's model",c:'mod',m:['Vasicek'],d:'Cópula gaussiana de um fator para carteiras de crédito granulares: dá a taxa de default que não é excedida com confiança X.',f:'WCDR = N[(N<sup>−1</sup>(PD) + √ρ N<sup>−1</sup>(X))/√(1−ρ)]'},
 wcdr:{t:'Taxa de default de pior caso',en:'worst-case default rate (WCDR)',c:'m',m:['WCDR'],d:'Quantil X da taxa de default da carteira no modelo de Vasicek; base da fórmula IRB de Basileia II a 99,9%.'},
 creditvar:{t:'Credit VaR',en:'credit value at risk',c:'m',m:['Credit VaR','VaR de crédito'],d:'Quantil da distribuição de perdas de crédito em um horizonte (em geral 1 ano).'},
 creditmetrics:{t:'CreditMetrics',en:'CreditMetrics',c:'mod',m:['CreditMetrics'],d:'Simula migrações de rating (matriz de transição) e reprecifica a carteira; perdas incluem rebaixamentos, não só defaults.'},
 transicao:{t:'Matriz de transição de ratings',en:'ratings transition matrix',c:'mod',m:['matriz de transição','matrizes de transição'],d:'Probabilidades de migrar de um rating para outro em um período.'},
 irb:{t:'Abordagem baseada em ratings internos',en:'internal ratings-based approach (IRB)',c:'reg',m:['IRB'],d:'Basileia II: o banco estima PD (e no avançado LGD e EAD); a fórmula de capital é o modelo de Vasicek a 99,9%.'},
 // cap. 20–24 · outros riscos
 lda:{t:'Abordagem de distribuição de perdas',en:'loss distribution approach (LDA)',c:'mod',m:['LDA','distribuição de perdas agregadas'],d:'Combina distribuição de frequência (ex.: Poisson) e de severidade (ex.: lognormal) por Monte Carlo para obter a perda anual agregada.'},
 sma:{t:'Abordagem padronizada de mensuração',en:'Standardized Measurement Approach (SMA)',c:'reg',m:['SMA'],d:'Método de Basileia III para capital de risco operacional: componente de indicador de negócio (BIC) × multiplicador de perdas internas (ILM).'},
 riscoop:{t:'Risco operacional',en:'operational risk',m:['risco operacional'],d:'Perdas por falhas ou inadequação de processos, pessoas e sistemas, ou por eventos externos (definição de Basileia).'},
 lcr:{t:'Índice de cobertura de liquidez',en:'Liquidity Coverage Ratio (LCR)',c:'reg',m:['LCR'],d:'Ativos líquidos de alta qualidade divididos pelas saídas líquidas de 30 dias de estresse; mínimo de 100%.',f:'LCR = HQLA / saídas líquidas<sub>30d</sub> ≥ 100%'},
 nsfr:{t:'Índice de funding estável líquido',en:'Net Stable Funding Ratio (NSFR)',c:'reg',m:['NSFR'],d:'Funding estável disponível dividido pelo funding estável requerido, horizonte de 1 ano; mínimo de 100%.'},
 hqla:{t:'Ativos líquidos de alta qualidade',en:'high-quality liquid assets (HQLA)',c:'reg',m:['HQLA'],d:'Ativos que podem ser convertidos em caixa sem perda relevante mesmo em estresse (reservas, títulos soberanos…).'},
 blackhole:{t:'Buraco negro de liquidez',en:'liquidity black hole',m:['buraco negro de liquidez','buracos negros de liquidez','liquidity black hole'],d:'Liquidez some quando muitos participantes querem vender ao mesmo tempo (negociação de realimentação positiva).'},
 riscomodelo:{t:'Risco de modelo',en:'model risk',m:['risco de modelo'],d:'Perdas por modelos errados ou mal usados. A orientação SR 11-7 do Fed exige inventário, validação independente e governança.'},
 stress:{t:'Teste de estresse',en:'stress testing',c:'mod',m:['stress testing','teste de estresse','testes de estresse'],d:'Avalia o impacto de cenários extremos, porém plausíveis, que podem não estar na janela histórica dos modelos.'},
 reverse:{t:'Teste de estresse reverso',en:'reverse stress testing',c:'mod',m:['estresse reverso','reverse stress testing'],d:'Parte do resultado (a instituição quebra) e procura os cenários que o produziriam.'},
 riscotrans:{t:'Risco de transição',en:'transition risk',m:['risco de transição'],d:'Perdas decorrentes da passagem para uma economia de baixo carbono: política climática, tecnologia, preferências.'},
 riscofis:{t:'Risco físico',en:'physical risk',m:['risco físico'],d:'Perdas por eventos climáticos agudos (enchentes, secas) ou crônicos (elevação do mar, calor).'},
 esg:{t:'ESG',en:'environmental, social and governance',c:'reg',m:['ESG'],d:'Critérios ambientais, sociais e de governança; dados ainda heterogêneos e sujeitos a greenwashing.'},
 erm:{t:'Gestão integrada de riscos',en:'Enterprise Risk Management (ERM)',m:['ERM','gestão integrada de riscos'],d:'Visão do conjunto dos riscos da instituição, ligada ao apetite a risco, à cultura e à estratégia.'},
 apetite:{t:'Apetite a risco',en:'risk appetite',m:['apetite a risco','apetite de risco'],d:'Quantidade e tipos de risco que o conselho aceita assumir para atingir os objetivos; desdobra-se em limites.'},
 // cap. 25–28 · regulação e capital
 basel2:{t:'Basileia II',en:'Basel II',c:'reg',m:['Basileia II'],d:'Acordo de 2004 com três pilares: capital mínimo (crédito, mercado, operacional), supervisão e disciplina de mercado.'},
 basel3:{t:'Basileia III',en:'Basel III',c:'reg',m:['Basileia III'],d:'Resposta à crise: mais capital de melhor qualidade (CET1), colchões, alavancagem, LCR e NSFR.'},
 cet1:{t:'Capital principal',en:'Common Equity Tier 1 (CET1)',c:'reg',m:['CET1'],d:'Capital de maior qualidade (ações e lucros retidos menos deduções). Mínimo de 4,5% dos RWA mais colchão de conservação de 2,5%.'},
 rwa:{t:'Ativos ponderados pelo risco',en:'risk-weighted assets (RWA)',c:'reg',m:['RWA','ativos ponderados pelo risco'],d:'Denominador dos índices de capital: exposições ponderadas por risco; capital = 8% × RWA no Pilar 1.',f:'RWA = 12,5 × K × EAD'},
 capecon:{t:'Capital econômico',en:'economic capital',c:'m',m:['capital econômico'],d:'Capital que a própria instituição julga necessário para absorver perdas inesperadas com a confiança do rating-alvo.',f:'CE = VaR<sub>X</sub>(L) − E[L]'},
 frtb:{t:'Revisão fundamental da carteira de negociação',en:'Fundamental Review of the Trading Book (FRTB)',c:'reg',m:['FRTB'],d:'Reforma de Basileia para risco de mercado: troca VaR 99% por ES 97,5%, horizontes de liquidez por fator e fronteira mais rígida entre trading e banking book.'},
 raroc:{t:'Retorno ajustado ao risco sobre capital',en:'risk-adjusted return on capital (RAROC)',c:'m',m:['RAROC'],d:'Resultado depois de custos e perda esperada dividido pelo capital econômico consumido.',f:'RAROC = (Receita − Custos − EL) / Capital econômico'},
 el:{t:'Perda esperada',en:'expected loss (EL)',c:'m',m:['perda esperada','perdas esperadas'],d:'Média da distribuição de perdas; é custo do negócio e deve estar no preço, não no capital.',f:'EL = PD × LGD × EAD'},
 ul:{t:'Perda inesperada',en:'unexpected loss',c:'m',m:['perda inesperada','perdas inesperadas'],d:'Diferença entre um quantil alto da distribuição de perdas e a perda esperada; é o que o capital cobre.'}
});

/* =====================================================================
   H01 · fronteira eficiente (cap. 1)
   ===================================================================== */
P.sim('sim-h-frontier',{
 tag:'Simulador 01 · fronteira eficiente',
 title:'Dois ativos, uma correlação: quanto risco a diversificação elimina',
 lede:'Ativo A (renda fixa ilustrativa): retorno esperado 6% e volatilidade 10% ao ano. Ativo B (ações ilustrativas): 12% e 22%. Mude a correlação e o peso em B; com a taxa livre de risco, a linha do mercado de capitais toca a fronteira na carteira de tangência.',
 controls:[
  {k:'rho',label:'ρ · correlação entre A e B',min:-1,max:1,step:.05,value:.2,fmt:v=>f(v,2),tip:'ρ = 1 elimina o ganho de diversificação; ρ = −1 permite uma carteira sem risco.'},
  {k:'w',label:'Peso em B',min:0,max:1,step:.01,value:.4,fmt:v=>pct(v,0),tip:'Sem vendas a descoberto: pesos entre 0% e 100%.'},
  {k:'rf',label:'Taxa livre de risco',min:0,max:.05,step:.0025,value:.03,fmt:v=>pct(v,2)}],
 kpis:[
  {k:'s',label:'<span class="nt">σ</span> da carteira',color:'c1',tip:'Volatilidade anual da combinação escolhida.'},
  {k:'m',label:'Retorno esperado',color:'c2'},
  {k:'sh',label:'Índice de Sharpe',color:'gold',tip:'(E[R] − r<sub>f</sub>)/σ'},
  {k:'d',label:'Risco eliminado',color:'c3',tip:'Quanto σ<sub>p</sub> fica abaixo da média ponderada das volatilidades.'},
  {k:'wt',label:'Tangência: peso em B',color:'c4',tip:'Carteira arriscada que maximiza o índice de Sharpe.'}],
 charts:[{k:'fr',title:'Retorno esperado × volatilidade (% ao ano)'}],
 model(p){
  const mA=.06,sA=.10,mB=.12,sB=.22;
  const S=w=>Math.sqrt(Math.max(0,(1-w)**2*sA*sA+w*w*sB*sB+2*w*(1-w)*p.rho*sA*sB)),M=w=>(1-w)*mA+w*mB;
  const ws=P.linspace(0,1,101),fr=ws.map(w=>[S(w)*100,M(w)*100]);
  let wt=0,best=-1e9;for(const w of ws){const s=S(w);if(s>1e-6){const sh=(M(w)-p.rf)/s;if(sh>best){best=sh;wt=w}}}
  const sT=S(wt),mT=M(wt),xe=Math.max(.24,sT*1.4);
  const wmv=P.clamp((sA*sA-p.rho*sA*sB)/((sA*sA+sB*sB-2*p.rho*sA*sB)||1e-9),0,1);
  const s=S(p.w),m=M(p.w),lin=(1-p.w)*sA+p.w*sB,sh=(m-p.rf)/Math.max(s,1e-9);
  return{kpi:{s:pct(s,2),m:pct(m,2),sh:s>1e-6?f(sh,2):'∞',d:{v:pct((lin-s)/lin,1),s:`vs. ${pct(lin,1)} se ρ = 1`},wt:{v:pct(wt,0),s:`Sharpe máximo ${f(best,2)}`}},
   charts:{fr:{x:{min:0,max:26,label:'volatilidade σ (%)',fmt:v=>f(v,0)+'%',name:'σ'},y:{min:0,max:14,fmt:v=>f(v,0)+'%'},
    series:[{name:'Fronteira (0% a 100% em B)',data:fr,color:'c1',w:2.6},
     {name:'Linha do mercado de capitais',data:[[0,p.rf*100],[xe*100,(p.rf+best*xe)*100]],color:'gold',dash:[6,4],w:1.6},
     {name:'Mínima variância',type:'dots',r:5,color:'c3',data:[[S(wmv)*100,M(wmv)*100]]},
     {name:'Tangência',type:'dots',r:6,color:'gold',data:[[sT*100,mT*100]]},
     {name:'Sua carteira',type:'dots',r:7,color:'c2',data:[[s*100,m*100]]}],
    labels:[{x:sA*100,y:mA*100,text:'A',dx:6,dy:-8,color:'muted'},{x:sB*100,y:mB*100,text:'B',dx:6,dy:-8,color:'muted'}]}},
   eq:`σ<sub>p</sub> = √[(1−w)²σ<sub>A</sub>² + w²σ<sub>B</sub>² + 2w(1−w)ρσ<sub>A</sub>σ<sub>B</sub>] = √[${n(1-p.w,2)}²·${n(10,0)}%² + ${n(p.w,2)}²·${n(22,0)}%² + 2·${n(p.w,2)}·${n(1-p.w,2)}·${n(p.rho,2)}·${n(10,0)}%·${n(22,0)}%] = ${n(s*100,2)}%`,
   take:p.rho>=.95?'Com correlação perfeita a fronteira vira uma reta: combinar ativos não reduz risco, apenas o média.':p.rho<=-.95?`Com ρ = −1 existe uma carteira de risco zero (${pct(wmv,0)} em B): a diversificação é total.`:`Com ρ = ${f(p.rho,2)}, a carteira escolhida elimina ${pct((lin-s)/lin,0)} do risco “médio”. A melhor combinação arriscada tem ${pct(wt,0)} em B e Sharpe ${f(best,2)}.`};
 }
});

/* =====================================================================
   H02 · reprecificação total × delta × delta-gama (cap. 10 e 15; apêndices E e G)
   ===================================================================== */
const bs=(S,K,r,s,T)=>{const v=s*Math.sqrt(T),d1=(Math.log(S/K)+(r+s*s/2)*T)/v,d2=d1-v;return{c:S*P.N(d1)-K*Math.exp(-r*T)*P.N(d2),d:P.N(d1),g:P.npdf(d1)/(S*v),d1,d2}};
P.sim('sim-h-option',{
 tag:'Simulador 02 · análise de cenários de derivativos',
 title:'Reprecificar ou aproximar? Opção de compra sob choque no ativo-objeto',
 lede:'Opção de compra europeia sobre ação a R$ 100, juro de 3% ao ano. Escolha o choque instantâneo e compare a reprecificação completa por Black–Scholes–Merton com as aproximações de Taylor de primeira (delta) e segunda ordem (delta-gama).',
 controls:[
  {k:'K',label:'Preço de exercício K',min:80,max:120,step:1,value:100,fmt:v=>'R$ '+f(v,0),tip:'K < 100: opção dentro do dinheiro; K > 100: fora do dinheiro.'},
  {k:'sig',label:'Volatilidade σ',min:.1,max:.6,step:.01,value:.25,fmt:v=>pct(v,0)},
  {k:'T',label:'Prazo até o vencimento',min:.1,max:2,step:.05,value:.5,fmt:v=>f(v,2)+' ano'},
  {k:'sh',label:'Choque no ativo-objeto',min:-.3,max:.3,step:.01,value:.15,fmt:v=>(v>0?'+':'')+pct(v,0),tip:'Variação instantânea do preço da ação no cenário.'}],
 kpis:[
  {k:'c',label:'Prêmio hoje',color:'c1'},
  {k:'dg',label:'Delta · gama',color:'c2',tip:'Δ = N(d<sub>1</sub>); Γ = φ(d<sub>1</sub>)/(Sσ√T)'},
  {k:'full',label:'Δ valor · reprecificação',color:'gold'},
  {k:'e1',label:'Erro da aproximação delta',color:'c3'},
  {k:'e2',label:'Erro delta-gama',color:'c4'}],
 charts:[{k:'v',title:'Valor da opção × preço da ação (R$)'}],
 model(p){
  const S0=100,r=.03,b0=bs(S0,p.K,r,p.sig,p.T),Ss=P.linspace(50,150,101);
  const full=Ss.map(S=>[S,bs(S,p.K,r,p.sig,p.T).c]),dl=Ss.map(S=>[S,b0.c+b0.d*(S-S0)]),dg=Ss.map(S=>[S,b0.c+b0.d*(S-S0)+.5*b0.g*(S-S0)**2]),pay=Ss.map(S=>[S,Math.max(S-p.K,0)]);
  const S1=S0*(1+p.sh),dS=S1-S0,v1=bs(S1,p.K,r,p.sig,p.T).c,dv=v1-b0.c,a1=b0.d*dS,a2=a1+.5*b0.g*dS*dS;
  const rel=a=>Math.abs(dv)<1e-6?0:(a-dv)/Math.abs(dv);
  return{kpi:{c:'R$ '+f(b0.c,2),dg:`${f(b0.d,3)} · ${f(b0.g,4)}`,full:{v:(dv>=0?'+':'−')+'R$ '+f(Math.abs(dv),2),s:`de R$ ${f(b0.c,2)} para R$ ${f(v1,2)}`},
    e1:{v:(rel(a1)>=0?'+':'')+pct(rel(a1),1),s:`aproximação: ${a1>=0?'+':'−'}R$ ${f(Math.abs(a1),2)}`},e2:{v:(rel(a2)>=0?'+':'')+pct(rel(a2),1),s:`aproximação: ${a2>=0?'+':'−'}R$ ${f(Math.abs(a2),2)}`}},
   charts:{v:{x:{min:50,max:150,label:'preço da ação S (R$)',fmt:v=>f(v,0),name:'S'},y:{min:-10,max:75,fmt:v=>f(v,0)},
    series:[{name:'Payoff no vencimento',data:pay,color:'c3',dash:[4,4],w:1.4},{name:'Reprecificação completa (BSM)',data:full,color:'c1',fill:.18,w:2.6},{name:'Aproximação delta',data:dl,color:'c2',w:1.6},{name:'Aproximação delta-gama',data:dg,color:'c4',w:1.6,dash:[7,4]},
     {name:'cenário',type:'dots',r:5,color:'gold',data:[[S1,v1]]}],
    marks:[{x:S0,label:'S₀',color:'muted'},{x:S1,label:'cenário',color:'gold',ly:24}]}},
   eq:`ΔV ≈ Δ·ΔS + ½Γ·ΔS² = ${n(b0.d,3)}·${n(dS,1)} + ½·${n(b0.g,4)}·${n(dS,1)}² = ${n(a2,2)} &nbsp;vs.&nbsp; reprecificação: ${n(dv,2)}`,
   take:Math.abs(p.sh)<.04?'Para choques pequenos as três medidas coincidem: delta basta.':Math.abs(rel(a1))>.2?`Com choque de ${pct(p.sh,0)}, o delta erra ${pct(Math.abs(rel(a1)),0)} do resultado; o gama corrige a maior parte, mas cenários extremos pedem reprecificação completa.`:`O erro do delta é ${pct(Math.abs(rel(a1)),0)}; aumente o choque ou reduza o prazo (gama maior) para ver a curvatura dominar.`};
 },
 note:'Black–Scholes–Merton sem dividendos; o choque é instantâneo (mesmo prazo e volatilidade). Ilustra a lógica do apêndice de opções e das letras gregas do livro, com números próprios.'
});

/* =====================================================================
   H03 · EWMA × GARCH(1,1) (cap. 8)
   ===================================================================== */
P.sim('sim-h-garch',{
 tag:'Simulador 03 · volatilidade condicional',
 title:'EWMA e GARCH(1,1) perseguindo uma volatilidade que muda',
 lede:'500 dias simulados por um GARCH(1,1) “verdadeiro” (ω = 0,000002; α = 0,08; β = 0,90 → volatilidade de longo prazo de 1% ao dia). Ajuste os parâmetros dos dois estimadores e reproduza os dias: o EWMA não tem âncora; o GARCH reverte a V<sub>L</sub>.',
 controls:[
  {k:'lam',label:'λ do EWMA',min:.8,max:.99,step:.005,value:.94,fmt:v=>f(v,3),tip:'Peso da estimativa anterior. λ alto = memória longa e reação lenta.'},
  {k:'a',label:'α do GARCH',min:.02,max:.2,step:.01,value:.1,fmt:v=>f(v,2),tip:'Reação ao último retorno ao quadrado.'},
  {k:'b',label:'β do GARCH',min:.7,max:.96,step:.01,value:.87,fmt:v=>f(v,2),tip:'Persistência da variância anterior. Se α+β ≥ 1 não há reversão.'},
  {k:'sl',label:'σ de longo prazo do GARCH',min:.005,max:.02,step:.0005,value:.01,fmt:v=>pct(v,2)+'/dia',tip:'Define ω = V<sub>L</sub>(1 − α − β).'}],
 play:{label:'▶ Reproduzir 500 dias',dur:7000},
 kpis:[
  {k:'ew',label:'<span class="nt">σ</span> hoje · EWMA',color:'c1'},
  {k:'ga',label:'<span class="nt">σ</span> hoje · GARCH',color:'c2'},
  {k:'tr',label:'<span class="nt">σ</span> verdadeiro',color:'c4'},
  {k:'hl',label:'Meia-vida dos choques',color:'gold',tip:'ln 0,5 / ln(α+β): dias para metade do desvio em relação a V<sub>L</sub> desaparecer.'},
  {k:'rm',label:'Erro médio (EWMA · GARCH)',color:'c3',tip:'Raiz do erro quadrático médio da volatilidade diária estimada contra a verdadeira.'}],
 charts:[{k:'vol',title:'Volatilidade diária estimada × verdadeira (%)',h:300},{k:'term',title:'Estrutura a termo da volatilidade prevista (% ao ano)',h:300}],
 cols:2,
 model(p,memo){
  if(!memo.u){const r=P.rng(808),u=[],sv=[];let v=1e-4;for(let i=0;i<500;i++){sv.push(Math.sqrt(v));const x=Math.sqrt(v)*P.randn(r);u.push(x);v=2e-6+.08*x*x+.9*v}memo.u=u;memo.sv=sv}
  const u=memo.u,sv=memo.sv,N=u.length,days=Math.max(2,Math.round(p.t*N));
  const ab=Math.min(p.a+p.b,.999),VL=p.sl*p.sl,om=VL*(1-ab);
  const e=[],g=[];let ve=1e-4,vg=VL;
  for(let i=0;i<N;i++){e.push(Math.sqrt(ve));g.push(Math.sqrt(vg));ve=p.lam*ve+(1-p.lam)*u[i]*u[i];vg=om+p.a*u[i]*u[i]+Math.min(p.b,.999-p.a)*vg}
  const k=days-1,rmse=a=>Math.sqrt(P.mean(a.slice(0,days).map((v,i)=>(v-sv[i])**2)));
  const cut=(a,sc=100)=>a.map((v,i)=>[i+1,i<days?v*sc:NaN]);
  const aa=Math.log(1/ab),V0=g[k]**2,Ts=P.linspace(5,250,50),term=Ts.map(T=>[T,Math.sqrt(252*(VL+(1-Math.exp(-aa*T))/(aa*T)*(V0-VL)))*100]),flat=Ts.map(T=>[T,e[k]*Math.sqrt(252)*100]);
  const hl=Math.log(.5)/Math.log(ab);
  return{kpi:{ew:pct(e[k],2),ga:pct(g[k],2),tr:pct(sv[k],2),hl:{v:f(hl,0)+' dias',s:`α+β = ${f(ab,3)}`},rm:`${f(rmse(e)*100,3)} · ${f(rmse(g)*100,3)} pp`},
   charts:{vol:{x:{min:1,max:N,label:'dia',fmt:v=>f(v,0),name:'dia'},y:{min:0,max:3.6,fmt:v=>f(v,1)+'%'},
     series:[{name:'|retorno| do dia',type:'bars',bw:.9,a:.22,color:'c3',data:u.map((x,i)=>[i+1,i<days?Math.abs(x)*100:NaN])},{name:'σ verdadeiro',data:cut(sv),color:'c4',dash:[5,4],w:1.4},{name:'EWMA',data:cut(e),color:'c1',w:1.8},{name:'GARCH(1,1)',data:cut(g),color:'c2',w:1.8,end:true}],
     marks:[{y:p.sl*100,label:'σ de longo prazo',color:'gold'}]},
    term:{x:{min:0,max:250,label:'horizonte T (dias úteis)',fmt:v=>f(v,0),name:'T'},y:{min:0,max:50,fmt:v=>f(v,0)+'%'},
     series:[{name:'GARCH: reverte a V_L',data:term,color:'c2',w:2.4,fill:.12},{name:'EWMA: constante',data:flat,color:'c1',dash:[6,4],w:1.8}],
     marks:[{y:p.sl*Math.sqrt(252)*100,label:'√252·σ_L',color:'gold'}]}},
   eq:`σ²<sub>n</sub> = ω + αu²<sub>n−1</sub> + βσ²<sub>n−1</sub> = ${n(om*1e6,2)}×10<sup>−6</sup> + ${n(p.a,2)}·(${n(u[Math.max(0,k-1)]*100,2)}%)² + ${n(p.b,2)}·(${n(g[Math.max(0,k-1)]*100,2)}%)² → σ<sub>n</sub> = ${n(g[k]*100,2)}%`,
   take:p.t<1?'Os dias estão passando: depois de um choque grande, o EWMA salta e decai devagar; o GARCH salta e é puxado de volta a V<sub>L</sub>.':(p.a+p.b>=.999?'Com α+β ≥ 1 o GARCH vira EWMA (IGARCH): não há variância de longo prazo e as previsões ficam planas.':`Volatilidade hoje ${pct(g[k],2)} vs. longo prazo ${pct(p.sl,2)}: o GARCH projeta ${g[k]>p.sl?'queda':'alta'} gradual (meia-vida de ${f(hl,0)} dias); o EWMA projeta o nível de hoje para sempre.`)};
 },
 note:'Retornos simulados (semente fixa). No livro, os parâmetros são estimados por máxima verossimilhança; aqui você os escolhe para ver o efeito de cada um.'
});

/* =====================================================================
   H04 · cópula gaussiana × cópula t (cap. 9)
   ===================================================================== */
function tTable(nu){const h=.02,M=2000,c=new Float64Array(M+1);c[0]=.5;let prev=tpdf(0,nu);for(let i=1;i<=M;i++){const x=i*h,cur=tpdf(x,nu),mid=tpdf(x-h/2,nu);c[i]=c[i-1]+h*(prev+4*mid+cur)/6;prev=cur}
 return x=>{const a=Math.abs(x)/h;if(a>=M)return x>0?1:0;const i=Math.floor(a),v=c[i]+(c[i+1]-c[i])*(a-i);return x>=0?Math.min(v,1):Math.max(1-v,0)}}
P.sim('sim-h-copula',{
 tag:'Simulador 04 · dependência de cauda',
 title:'Mesma correlação, extremos diferentes: cópula gaussiana × cópula t',
 lede:'1.500 pares de perdas com as mesmas marginais (uniformes, percentil a percentil) e a mesma correlação. A única diferença é a cópula. Os pontos vermelhos são dias em que as duas posições estão simultaneamente entre os q% piores resultados.',
 controls:[
  {k:'rho',label:'ρ · correlação da cópula',min:-.2,max:.95,step:.05,value:.3,fmt:v=>f(v,2)},
  {k:'nu',label:'ν · graus de liberdade da cópula t',min:3,max:30,step:1,value:3,fmt:v=>f(v,0),tip:'Quanto menor ν, maior a dependência de cauda.'},
  {k:'q',label:'q · cauda conjunta analisada',min:.01,max:.1,step:.005,value:.05,fmt:v=>pct(v,1)}],
 play:{label:'▶ Sortear os 1.500 pares',dur:4500},
 kpis:[
  {k:'g',label:'Extremos conjuntos · gaussiana',color:'c1',tip:'Frequência de pares com U₁ ≤ q e U₂ ≤ q.'},
  {k:'t',label:'Extremos conjuntos · t',color:'c2'},
  {k:'ind',label:'Se fossem independentes',color:'c3',tip:'q² × tamanho da amostra'},
  {k:'lam',label:'<span class="nt">λ</span> de cauda teórico (t)',color:'gold',tip:'λ = 2·t<sub>ν+1</sub>(−√[(ν+1)(1−ρ)/(1+ρ)]). Na gaussiana, λ = 0.'}],
 charts:[{k:'g',title:'Cópula gaussiana · (U₁, U₂)',h:300},{k:'t',title:'Cópula t · (U₁, U₂)',h:300}],
 cols:2,
 model(p,memo){
  const Np=1500;if(!memo.z){const r=P.rng(4242);memo.z=Array.from({length:Np},()=>[P.randn(r),P.randn(r)])}
  if(memo.nu!==p.nu){const r=P.rng(99+p.nu);memo.w=Array.from({length:Np},()=>2*P.rgamma(r,p.nu/2));memo.T=tTable(p.nu);memo.nu=p.nu}
  const shown=Math.round(p.t*Np),c=Math.sqrt(1-p.rho*p.rho),G=[],T=[];let cg=0,ct=0;
  for(let i=0;i<Np;i++){const[z1,z2]=memo.z[i],x1=z1,x2=p.rho*z1+c*z2,s=Math.sqrt(memo.w[i]/p.nu);
   const g=[P.N(x1),P.N(x2)],t=[memo.T(x1/s),memo.T(x2/s)];const tg=g[0]<=p.q&&g[1]<=p.q,tt=t[0]<=p.q&&t[1]<=p.q;
   if(i<shown){cg+=tg;ct+=tt}
   G.push(i<shown?[g[0],g[1],tg?'bad':P.alpha('c1',.38),tg?3.6:1.8]:[g[0],NaN]);T.push(i<shown?[t[0],t[1],tt?'bad':P.alpha('c2',.38),tt?3.6:1.8]:[t[0],NaN])}
  const lam=2*P.tcdf(-Math.sqrt((p.nu+1)*(1-p.rho)/(1+p.rho)),p.nu+1),ind=p.q*p.q*shown;
  const sp=(data)=>({x:{min:0,max:1,fmt:v=>f(v,1),name:'U₁'},y:{min:0,max:1,fmt:v=>f(v,1)},hover:false,series:[{type:'dots',data,color:'c1'}],shade:[{x0:0,x1:p.q,y0:0,y1:p.q,color:'bad',a:.12}],marks:[{x:p.q,color:'bad',dash:[3,3],w:1},{y:p.q,color:'bad',dash:[3,3],w:1}]});
  return{kpi:{g:{v:`${cg} pares`,s:pct(cg/Math.max(1,shown),2)},t:{v:`${ct} pares`,s:pct(ct/Math.max(1,shown),2),tone:ct>cg*1.5&&ct>2?'bad':null},ind:{v:f(ind,1)+' pares',s:'q² × amostra'},lam:{v:f(lam,3),s:'gaussiana: 0'}},
   charts:{g:sp(G),t:sp(T)},
   eq:`λ<sub>L</sub><sup>t</sup> = 2·t<sub>ν+1</sub>(−√[(ν+1)(1−ρ)/(1+ρ)]) = 2·t<sub>${p.nu+1}</sub>(−√[${n(p.nu+1,0)}·${n(1-p.rho,2)}/${n(1+p.rho,2)}]) = ${n(lam,3)}`,
   take:p.t<1?'Os pares estão sendo sorteados…':`Com ρ = ${f(p.rho,2)}, a cópula t gerou ${ct} extremos conjuntos contra ${cg} da gaussiana (${f(ind,1)} se fossem independentes). A correlação linear é a mesma — o que muda é a cauda conjunta, exatamente onde o capital é consumido.`};
 },
 note:'Mesmos choques normais nas duas cópulas; a t divide ambos por √(W/ν), W ~ χ²<sub>ν</sub> comum. Marginais transformadas em uniformes (percentil a percentil).'
});

/* =====================================================================
   H05 · VaR × ES, normal × t (cap. 11)  [piloto]
   ===================================================================== */
P.sim('sim-h-es',{
 tag:'Simulador 05 · caudas e medidas de risco',
 title:'Mesma volatilidade, caudas diferentes: VaR e ES sob normal e t de Student',
 lede:'As duas distribuições têm o mesmo desvio-padrão diário. Reduza ν para engrossar a cauda e observe que, perto de 97,5%, o VaR das duas quase coincide, mas o ES e o VaR de 99% se afastam — é por isso que o FRTB trocou o VaR 99% pelo ES 97,5%.',
 controls:[
  {k:'nu',label:'ν · graus de liberdade da t',min:3,max:30,step:1,value:4,fmt:v=>f(v,0),tip:'Quanto menor ν, mais pesada a cauda. ν = 30 já é quase normal.'},
  {k:'a',label:'α · nível de confiança',min:.9,max:.995,step:.0025,value:.975,fmt:v=>pct(v,2)},
  {k:'h',label:'Horizonte (dias, regra √T)',min:1,max:10,step:1,value:1,fmt:v=>f(v,0)+' d'},
  {k:'pos',label:'Posição (R$ milhões)',min:10,max:500,step:10,value:100,fmt:v=>'R$ '+f(v,0)+' mi'}],
 kpis:[
  {k:'vn',label:'VaR normal',color:'c3',tip:'σ·z<sub>α</sub>·√T × posição'},
  {k:'vt',label:'VaR t de Student',color:'c1'},
  {k:'en',label:'ES normal',color:'c3',tip:'σ·φ(z<sub>α</sub>)/(1−α)·√T × posição'},
  {k:'et',label:'ES t de Student',color:'c1'},
  {k:'r',label:'ES t ÷ ES normal',color:'gold',tip:'Quanto a cauda pesada encarece a medida de cauda.'}],
 charts:[{k:'dens',title:'Densidade das perdas diárias (σ = 1,5%) · cauda à direita'}],
 model(p){
  const s=.015,sq=Math.sqrt(p.h),sc=Math.sqrt((p.nu-2)/p.nu),z=P.Ninv(p.a),tq=tinv(p.a,p.nu);
  const vn=s*z,en=s*P.npdf(z)/(1-p.a),vt=s*sc*tq,et=s*sc*(tpdf(tq,p.nu)/(1-p.a))*((p.nu+tq*tq)/(p.nu-1));
  const xs=P.linspace(-.06,.08,141),N=xs.map(x=>[x*100,P.npdf(x/s)/s/100]),T=xs.map(x=>[x*100,tpdf(x/(s*sc),p.nu)/(s*sc)/100]);
  const M=v=>'R$ '+f(v*p.pos*sq,2)+' mi';
  return{kpi:{vn:M(vn),vt:M(vt),en:M(en),et:{v:M(et),tone:et/en>1.15?'bad':null},r:{v:f(et/en,2)+'×',s:et/en>1.15?'a cauda pesada pesa':'próximas'}},
   charts:{dens:{x:{label:'perda diária (%)',fmt:v=>f(v,1)+'%',name:'perda'},y:{min:0,fmt:v=>f(v,2)},
    series:[{name:'Normal',data:N,color:'c3',w:1.8,dash:[5,4]},{name:`t de Student (ν=${p.nu})`,data:T,color:'c1',fill:.22}],
    shade:[{x0:vt*100,x1:8,color:'c1',a:.1}],
    marks:[{x:vn*100,label:'VaR N',color:'c3'},{x:vt*100,label:'VaR t',color:'c1',ly:24},{x:et*100,label:'ES t',color:'bad',ly:38},{x:en*100,label:'ES N',color:'c3',ly:52}]}},
   eq:`ES<sub>t</sub> = σ·√((ν−2)/ν)·g(t<sub>α</sub>)/(1−α)·(ν+t<sub>α</sub>²)/(ν−1) = ${n(1.5,1)}% × ${n(sc,3)} × ${n(tpdf(tq,p.nu)/(1-p.a),3)} × ${n((p.nu+tq*tq)/(p.nu-1),3)} = ${n(et*100,3)}% · VaR<sub>t</sub> = ${n(vt*100,3)}% · VaR<sub>N</sub> = ${n(vn*100,3)}%`,
   take:p.a<.96?`A ${pct(p.a,1)}, o VaR das duas distribuições difere ${f(Math.abs(vt/vn-1)*100,0)}%: o limiar é cego para o formato da cauda.`:`Na cauda (${pct(p.a,1)}), a t com ν = ${p.nu} gera ES ${f(et/en,2)}× o da normal. Medir só o limiar subestima a severidade.`};
 }
});

/* =====================================================================
   H06 · back-testing com semáforo (cap. 11.10; cap. 25 para o multiplicador)  [piloto]
   ===================================================================== */
const chi1=x=>P.chi2cdf(x,1);
P.sim('sim-h-backtest',{
 tag:'Simulador 06 · back-testing animado',
 title:'250 dias de P&L contra o VaR 99%: exceções, Kupiec e semáforo',
 lede:'O modelo estima o VaR supondo volatilidade de 1,0% ao dia. A volatilidade verdadeira é a do controle. Aperte “Reproduzir” para ver os dias passarem: cada barra vermelha é uma exceção.',
 controls:[
  {k:'vm',label:'Volatilidade real ÷ modelada',min:.8,max:1.6,step:.05,value:1.2,fmt:v=>f(v,2)+'×',tip:'1,00× = modelo correto. Acima de 1, o modelo subestima o risco.'},
  {k:'cl',label:'Agrupamento de volatilidade',min:0,max:.9,step:.05,value:.5,fmt:v=>f(v,2),tip:'Persistência de regimes de alta volatilidade (tipo GARCH). Exceções tendem a vir em grupos.'},
  {k:'seed',label:'Amostra (semente)',min:1,max:40,step:1,value:7,fmt:v=>'#'+f(v,0)}],
 play:{label:'▶ Reproduzir 250 dias',dur:7000},
 kpis:[{k:'x',label:'Exceções observadas',color:'bad'},{k:'zone',label:'Zona de Basileia',color:'gold'},{k:'lr',label:'Kupiec LR · p-valor',color:'c2',tip:'H₀: frequência de exceções = 1%. p &lt; 5% rejeita o modelo.'},{k:'k',label:'Multiplicador de capital',color:'c1',tip:'3 + acréscimo da zona amarela (0,40 a 0,85) ou 4 na vermelha.'}],
 charts:[{k:'pl',title:'P&L diário (R$ mi) e −VaR 99% do modelo'}],
 model(p,memo){
  const key=p.vm+'|'+p.cl+'|'+p.seed;
  if(memo.key!==key){const r=P.rng(1000+p.seed*97),d=[];let h=1;for(let i=0;i<250;i++){h=Math.max(.35,1+p.cl*(h-1)+.35*P.randn(r)*Math.sqrt(1-p.cl*p.cl));d.push(P.randn(r)*p.vm*h)}memo.key=key;memo.d=d}
  const V=2.326,days=Math.max(1,Math.round(p.t*250)),d=memo.d.slice(0,days),ex=d.map((x,i)=>-x>V?i:-1).filter(i=>i>=0),x=ex.length,nn=days,pp=.01;
  const ll=q=>(nn-x)*Math.log(1-q)+x*Math.log(q);const lr=x===0?-2*ll(pp):-2*ll(pp)+2*((nn-x)*Math.log(1-x/nn||1)+x*Math.log(x/nn));
  const pv=1-chi1(lr);const z=x<=4?'Verde':x<=9?'Amarela':'Vermelha',add=[0,0,0,0,0,.4,.5,.65,.75,.85][x]??1;
  return{kpi:{x:{v:`${x} de ${nn} dias`,s:`esperado ≈ ${f(nn*.01,1)}`,tone:x>4?'bad':'good'},zone:{v:z,tone:z==='Verde'?'good':'bad'},lr:{v:`${f(lr,2)} · ${pv<.001?'<0,1%':pct(pv,1)}`,tone:pv<.05?'bad':'good'},k:f(3+add,2)},
   charts:{pl:{x:{min:0,max:250,label:'dia',fmt:v=>f(v,0),name:'dia'},y:{min:-7,max:7,fmt:v=>f(v,0)},
    series:[{name:'P&L',type:'bars',bw:.8,data:d.map((v,i)=>[i,v,-v>V?'bad':(v<0?'c2':'c1')]),a:.7},{name:'exceção',type:'dots',r:4,color:'bad',data:ex.map(i=>[i,d[i]])}],
    marks:[{y:-V,label:'−VaR 99% do modelo',color:'gold',name:'−VaR 99%'}]}},
   eq:`LR<sub>POF</sub> = −2 ln[(0,99)<sup>${nn-x}</sup>(0,01)<sup>${x}</sup>] + 2 ln[(1−${n(x/nn,3)})<sup>${nn-x}</sup>(${n(x/nn,3)})<sup>${x}</sup>] = ${n(lr,2)} → p ${pv<.001?'&lt; '+n(.1,1,'%'):'= '+n(pv*100,1,'%')}`,
   take:p.t<1?'Os dias estão passando: repare como as exceções aparecem em grupos quando o agrupamento de volatilidade é alto.':(x<=4?`Com ${x} exceções o modelo fica na zona verde, mesmo com volatilidade real ${f(p.vm,2)}× a modelada — 250 dias têm pouco poder estatístico.`:`${x} exceções colocam o banco na zona ${z.toLowerCase()}: o multiplicador sobe para ${f(3+add,2)} e o capital de mercado cresce ${f(add/3*100,0)}%.`)};
 }
});

/* =====================================================================
   H09 · simulação histórica × EVT/GPD (cap. 12)
   ===================================================================== */
P.sim('sim-h-evt',{
 tag:'Simulador 07 · cauda extrema',
 title:'Simulação histórica ou Pareto generalizada? Estimando VaR além dos dados',
 lede:'Uma amostra de perdas diárias é gerada por uma t de Student (σ = 1, unidade R$ mi). A simulação histórica lê o quantil empírico; a EVT ajusta uma Pareto generalizada aos excessos acima do limiar u e extrapola a cauda. Compare ambos com o VaR verdadeiro.',
 controls:[
  {k:'nobs',label:'Tamanho da amostra (dias)',min:250,max:2000,step:250,value:1000,fmt:v=>f(v,0)},
  {k:'nu',label:'ν da distribuição verdadeira',min:3,max:12,step:1,value:4,fmt:v=>f(v,0),tip:'ξ verdadeiro da cauda ≈ 1/ν.'},
  {k:'u',label:'Limiar u (percentil)',min:.9,max:.98,step:.005,value:.95,fmt:v=>pct(v,1),tip:'Limiar alto demais: poucos excessos (variância). Baixo demais: aproximação assintótica falha (viés).'},
  {k:'q',label:'Confiança do VaR',min:.99,max:.999,step:.0005,value:.998,fmt:v=>pct(v,2)},
  {k:'seed',label:'Amostra (semente)',min:1,max:40,step:1,value:20,fmt:v=>'#'+f(v,0),tip:'Outra amostra da mesma distribuição: veja como as estimativas de cauda oscilam.'}],
 kpis:[
  {k:'nu',label:'Excessos <span class="nt">n<sub>u</sub></span>',color:'c3'},
  {k:'xi',label:'<span class="nt">ξ</span> estimado · verdadeiro',color:'gold',tip:'Estimador de momentos ponderados por probabilidade (Hosking e Wallis, 1987).'},
  {k:'hs',label:'VaR · simulação histórica',color:'c2'},
  {k:'ev',label:'VaR · EVT',color:'c1'},
  {k:'tr',label:'VaR verdadeiro',color:'c4'}],
 charts:[{k:'tail',title:'Probabilidade de exceder a perda x (escala log)'}],
 model(p,memo){
  if(memo.k!==p.nu+'|'+p.seed){const r=P.rng(p.seed*131+p.nu),sc=Math.sqrt((p.nu-2)/p.nu);memo.L=Array.from({length:2000},()=>P.randn(r)/Math.sqrt(2*P.rgamma(r,p.nu/2)/p.nu)*sc);memo.k=p.nu+'|'+p.seed}
  const L=memo.L.slice(0,p.nobs).sort((a,b)=>a-b),nn=L.length,u=P.quantile(L,p.u),ys=L.filter(x=>x>u).map(x=>x-u).sort((a,b)=>a-b),m=ys.length;
  const a0=P.mean(ys),a1=ys.reduce((s,y,i)=>s+(1-(i+1-.35)/m)*y,0)/m,den=a0-2*a1;let beta=den>0?2*a0*a1/den:a0,xi=den>0?2-a0/den:0;xi=P.clamp(xi,-.45,.9);if(!(beta>0))beta=a0;
  const evVaR=Math.abs(xi)<1e-6?u+beta*Math.log(m/(nn*(1-p.q))):u+beta/xi*(Math.pow(nn/m*(1-p.q),-xi)-1),evES=(evVaR+beta-xi*u)/(1-xi);
  const hs=P.quantile(L,p.q),sc=Math.sqrt((p.nu-2)/p.nu),tr=sc*tinv(p.q,p.nu);
  const emp=[];for(let i=nn-1;i>=Math.floor(nn*.8);i--)emp.push([L[i],Math.log10((nn-i)/(nn+1))]);
  const xmax=Math.max(evVaR,tr,L[nn-1])*1.12,xs=P.linspace(u,xmax,60);
  const gpd=xs.map(x=>[x,Math.log10(m/nn*Math.pow(Math.max(1e-12,1+xi*(x-u)/beta),-1/xi))]);
  const tru=xs.map(x=>[x,Math.log10(Math.max(1e-9,1-P.tcdf(x/sc,p.nu)))]);
  const err=v=>Math.abs(v/tr-1),best=err(evVaR)<err(hs)?'ev':'hs';
  return{kpi:{nu:{v:f(m,0),s:`acima de u = ${f(u,2)}`},xi:{v:`${f(xi,2)} · ${f(1/p.nu,2)}`},hs:{v:mi(hs,2),s:`erro ${pct(hs/tr-1,0)}`,tone:best==='hs'?'good':null},ev:{v:mi(evVaR,2),s:`ES ${mi(evES,2)} · erro ${pct(evVaR/tr-1,0)}`,tone:best==='ev'?'good':null},tr:mi(tr,2)},
   charts:{tail:{x:{min:Math.max(0,L[Math.floor(nn*.8)]-.2),max:xmax,label:'perda x (R$ mi)',fmt:v=>f(v,1),name:'x'},y:{min:-4,max:-.6,fmt:v=>f(10**v*100,v<-2.5?2:1)+'%'},
    series:[{name:'Empírico (simulação histórica)',type:'dots',r:2.6,color:'c2',data:emp},{name:'GPD ajustada (EVT)',data:gpd,color:'c1',w:2.4},{name:'Cauda verdadeira (t)',data:tru,color:'c4',dash:[5,4],w:1.6}],
    marks:[{x:u,label:'u',color:'muted'},{x:hs,label:'VaR HS',color:'c2',ly:24},{x:evVaR,label:'VaR EVT',color:'c1',ly:38},{y:Math.log10(1-p.q),label:`1 − q = ${pct(1-p.q,2)}`,color:'gold',align:'left'}]}},
   eq:`VaR = u + (β/ξ){[(n/n<sub>u</sub>)(1−q)]<sup>−ξ</sup> − 1} = ${n(u,2)} + (${n(beta,3)}/${n(xi,3)})·{[(${nn}/${m})·${n(1-p.q,4)}]<sup>−${n(xi,3)}</sup> − 1} = ${n(evVaR,2)} · ES = (VaR + β − ξu)/(1−ξ) = ${n(evES,2)}`,
   take:(1-p.q)*nn<2?`Com ${nn} dias e confiança de ${pct(p.q,2)}, a simulação histórica tem só ${f((1-p.q)*nn,1)} observação(ões) além do quantil: a EVT extrapola com a forma da cauda.`:`A simulação histórica erra ${pct(Math.abs(hs/tr-1),0)}; a EVT, ${pct(Math.abs(evVaR/tr-1),0)}. Mude o limiar u e veja o dilema viés × variância.`};
 },
 note:'Estimação de ξ e β por momentos ponderados por probabilidade (válida para ξ &lt; 0,5); o livro apresenta a estimação por máxima verossimilhança. As fórmulas de VaR e ES pela GPD são as da abordagem de picos acima do limiar.'
});

/* =====================================================================
   H10 · choques não paralelos e ΔEVE (cap. 14; BCBS IRRBB 2016)
   ===================================================================== */
const VT=[.25,.5,1,2,3,5,7,10,15,20],VL=['3m','6m','1a','2a','3a','5a','7a','10a','15a','20a'];
const SHORTF=[.25,.2,.2,.15,.1,.1,0,0,0,0],LONGF=[0,0,0,0,0,.25,.25,.25,.15,.1],LIAB=[28,20,15,10,8,7,4,0,0,0];
const SCN=['Paralelo ↑','Paralelo ↓','Inclinação','Achatamento','Curto ↑','Curto ↓'];
const r0=t=>.04+.015*(1-Math.exp(-t/3));
function shockFn(k,M){const Sp=M/1e4,Ss=1.5*M/1e4,Sl=.75*M/1e4,sh=t=>Ss*Math.exp(-t/4),lo=t=>Sl*(1-Math.exp(-t/4));
 return[t=>Sp,t=>-Sp,t=>-.65*sh(t)+.9*lo(t),t=>.8*sh(t)-.6*lo(t),t=>sh(t),t=>-sh(t)][k]}
function eveOf(A,dr){let pa=0,pl=0,parts=[];VT.forEach((t,i)=>{const d0=Math.exp(-r0(t)*t),d1=Math.exp(-(r0(t)+dr(t))*t);pa+=A[i]*d1;pl+=LIAB[i]*d1;parts.push((A[i]-LIAB[i])*(d1-d0))});return{eve:pa-pl,pa,pl,parts}}
P.sim('sim-h-curve',{
 tag:'Simulador 08 · risco de juros na carteira bancária',
 title:'Seis formatos de choque, um balanço: onde o valor econômico se perde',
 lede:'Banco ilustrativo: passivos concentrados no curto prazo (depósitos) e ativos com parcela longa ajustável. Escolha o cenário do padrão IRRBB do BCBS e a magnitude: o gráfico de barras mostra a contribuição de cada vértice para a variação do EVE.',
 controls:[
  {k:'sc',type:'seg',label:'Cenário de choque',options:SCN,value:0,tip:'Os seis cenários padronizados do BCBS (2016): paralelos, inclinação, achatamento e choques de curto prazo.'},
  {k:'M',label:'Magnitude do choque paralelo',min:50,max:400,step:25,value:200,fmt:v=>f(v,0)+' bp',tip:'Choque curto = 1,5×, choque longo = 0,75× (proporções semelhantes às de moedas como o dólar).'},
  {k:'s',label:'Parcela longa dos ativos',min:.1,max:.8,step:.05,value:.35,fmt:v=>pct(v,0),tip:'Fração dos fluxos de ativos em 5–20 anos (financiamento imobiliário, títulos longos).'}],
 kpis:[
  {k:'eve',label:'EVE base',color:'c1',tip:'VP dos ativos (normalizado em R$ 100) − VP dos passivos (fluxos de R$ 92).'},
  {k:'d',label:'ΔEVE no cenário',color:'c2'},
  {k:'pc',label:'ΔEVE ÷ EVE',color:'gold',tip:'Teste de outlier do BCBS compara ΔEVE com 15% do capital nível 1; aqui o EVE base serve de proxy.'},
  {k:'w',label:'Pior dos seis cenários',color:'c3'},
  {k:'dg',label:'Gap de duration',color:'c4',tip:'D<sub>A</sub> − (VP<sub>L</sub>/VP<sub>A</sub>)·D<sub>L</sub> (durations de Macaulay com capitalização contínua).'}],
 charts:[{k:'c',title:'Curva de juros base × choque (% ao ano)',h:260},{k:'b',title:'Contribuição de cada vértice ao ΔEVE (R$)',h:260}],
 cols:2,
 model(p){
  const A0=VT.map((_,i)=>(1-p.s)*SHORTF[i]+p.s*LONGF[i]),pv0=A0.reduce((a,c,i)=>a+c*Math.exp(-r0(VT[i])*VT[i]),0),A=A0.map(c=>c*100/pv0),dr=shockFn(p.sc,p.M),base=eveOf(A,()=>0),sh=eveOf(A,dr),dE=sh.eve-base.eve;
  const all=SCN.map((nm,k)=>({nm,d:eveOf(A,shockFn(k,p.M)).eve-base.eve})),worst=all.reduce((a,b)=>b.d<a.d?b:a);
  let da=0,dl=0;VT.forEach((t,i)=>{const d=Math.exp(-r0(t)*t);da+=t*A[i]*d;dl+=t*LIAB[i]*d});da/=base.pa;dl/=base.pl;const gap=da-base.pl/base.pa*dl;
  const ts=P.linspace(0,20,41);
  return{kpi:{eve:'R$ '+f(base.eve,2),d:{v:(dE<0?'−':'+')+'R$ '+f(Math.abs(dE),2),tone:dE<0?'bad':'good'},pc:{v:(dE<0?'−':'+')+pct(Math.abs(dE/base.eve),1),tone:dE/base.eve<-.15?'bad':null,s:dE/base.eve<-.15?'acima do limite de 15%':'abaixo de 15%'},w:{v:worst.nm,s:(worst.d<0?'−':'+')+'R$ '+f(Math.abs(worst.d),2)},dg:f(gap,2)+' anos'},
   charts:{c:{x:{min:0,max:20,label:'prazo (anos)',fmt:v=>f(v,0),name:'prazo'},y:{min:0,max:11,fmt:v=>f(v,0)+'%'},
     series:[{name:'Curva base',data:ts.map(t=>[t,r0(t)*100]),color:'c3',w:1.6,dash:[5,4]},{name:SCN[p.sc],data:ts.map(t=>[t,Math.max(0,(r0(t)+dr(t))*100)]),color:'c1',w:2.6,fill:.1}]},
    b:{x:{cats:VL,name:'vértice'},y:{zero:true,fmt:v=>f(Math.abs(v)<1e-9?0:v,1)},series:[{name:'ΔEVE por vértice',type:'bars',data:sh.parts.map((v,i)=>[i,v,v<0?'bad':'good'])}]}},
   eq:`ΔEVE = Σ<sub>k</sub>(A<sub>k</sub> − L<sub>k</sub>)·[e<sup>−(r<sub>k</sub>+Δr<sub>k</sub>)t<sub>k</sub></sup> − e<sup>−r<sub>k</sub>t<sub>k</sub></sup>] = ${sh.parts.map((v,i)=>(i?(v<0?' − ':' + '):(v<0?'−':''))+n(Math.abs(v),2)).join('')} = ${dE<0?'−':''}${n(Math.abs(dE),2)}`,
   take:`No cenário “${SCN[p.sc]}”, o EVE varia ${dE<0?'−':'+'}${pct(Math.abs(dE/base.eve),1)}. O pior caso entre os seis é “${worst.nm}”: com gap de duration de ${f(gap,1)} anos, ${gap>0?'altas de juros longos destroem valor':'quedas de juros destroem valor'} — e choques não paralelos podem mudar o sinal vértice a vértice.`};
 },
 note:'Fluxos fixos (sem opcionalidade, pré-pagamento ou depósitos sem vencimento modelados), capitalização contínua e curva base ilustrativa. Formas de choque conforme o padrão IRRBB do BCBS (2016); magnitudes escolhidas pelo usuário.'
});

/* =====================================================================
   H11 · Merton (cap. 17.8)
   ===================================================================== */
P.sim('sim-h-merton',{
 tag:'Simulador 09 · PD a partir do valor dos ativos',
 title:'Modelo de Merton: o patrimônio como opção sobre os ativos da firma',
 lede:'Firma com dívida de face D = R$ 100 vencendo em T anos e juro de 3%. O default ocorre se o valor dos ativos ficar abaixo de D no vencimento. Reproduza para ver trajetórias neutras ao risco dos ativos; as vermelhas terminam em default.',
 controls:[
  {k:'V',label:'Valor dos ativos V₀',min:60,max:200,step:1,value:130,fmt:v=>'R$ '+f(v,0)},
  {k:'s',label:'Volatilidade dos ativos σ<sub>V</sub>',min:.05,max:.6,step:.01,value:.25,fmt:v=>pct(v,0)},
  {k:'T',label:'Horizonte T',min:1,max:5,step:.5,value:1,fmt:v=>f(v,1)+' ano'}],
 play:{label:'▶ Simular trajetórias',dur:5000},
 kpis:[
  {k:'E',label:'Patrimônio <span class="nt">E<sub>0</sub> · σ<sub>E</sub></span>',color:'c1',tip:'E₀ = V₀N(d₁) − De<sup>−rT</sup>N(d₂); σ<sub>E</sub>E₀ = N(d₁)σ<sub>V</sub>V₀'},
  {k:'pd',label:'PD neutra ao risco',color:'bad',tip:'N(−d₂)'},
  {k:'dd',label:'Distância ao default',color:'gold',tip:'d₂: desvios-padrão entre o valor esperado dos ativos e a dívida.'},
  {k:'sp',label:'Spread implícito',color:'c2',tip:'s = −ln[B/(De<sup>−rT</sup>)]/T, com B = V₀ − E₀.'},
  {k:'emp',label:'Defaults nas trajetórias',color:'c3'}],
 charts:[{k:'paths',title:'Trajetórias do valor dos ativos (R$) e barreira de default',h:290},{k:'pd',title:'Estrutura a termo da PD (neutra ao risco)',h:290}],
 cols:2,
 model(p,memo){
  const D=100,r=.03,NP=26,ST=48;
  if(!memo.z){const g=P.rng(1717);memo.z=Array.from({length:NP},()=>Array.from({length:ST},()=>P.randn(g)))}
  const v=p.s*Math.sqrt(p.T),d1=(Math.log(p.V/D)+(r+p.s*p.s/2)*p.T)/v,d2=d1-v,E=p.V*P.N(d1)-D*Math.exp(-r*p.T)*P.N(d2),sE=P.N(d1)*p.s*p.V/Math.max(E,1e-9),pd=P.N(-d2),B=p.V-E,spr=-Math.log(B/(D*Math.exp(-r*p.T)))/p.T;
  const shown=Math.round(p.t*ST),dt=p.T/ST;let def=0;
  const series=memo.z.map((zz,j)=>{let lv=Math.log(p.V);const pts=[[0,p.V]];for(let i=0;i<ST;i++){lv+=(r-p.s*p.s/2)*dt+p.s*Math.sqrt(dt)*zz[i];pts.push([(i+1)*dt,Math.exp(lv)])}const isDef=pts[ST][1]<D;if(isDef&&p.t>=1)def++;
   return{data:pts.map((q,i)=>[q[0],i<=shown?q[1]:NaN]),color:p.t>=1?(isDef?'bad':P.alpha('c1',.55)):P.alpha('c1',.55),w:isDef&&p.t>=1?1.6:1.1,hover:false}});
  const Ts=P.linspace(.25,10,40),pdt=Ts.map(T=>{const vv=p.s*Math.sqrt(T),dd2=(Math.log(p.V/D)+(r-p.s*p.s/2)*T)/vv;return[T,P.N(-dd2)*100]});
  return{kpi:{E:{v:'R$ '+f(E,2),s:`σ<sub>E</sub> = ${pct(sE,1)}`},pd:{v:pct(pd,2),tone:pd>.05?'bad':pd<.01?'good':null},dd:f(d2,2)+' σ',sp:{v:f(spr*1e4,0)+' bp',s:`dívida vale R$ ${f(B,2)}`},emp:{v:p.t>=1?`${def} de ${NP}`:'—',s:p.t>=1?'trajetórias abaixo de D':'reproduza a simulação'}},
   charts:{paths:{x:{min:0,max:p.T,label:'tempo (anos)',fmt:v=>f(v,1),name:'t'},y:{min:0,max:Math.max(260,p.V*1.9),fmt:v=>f(v,0)},series,marks:[{y:D,label:'dívida D = 100',color:'bad',align:'left'}]},
    pd:{x:{min:0,max:10,label:'horizonte (anos)',fmt:v=>f(v,0),name:'T'},y:{min:0,max:Math.max(10,pdt[39][1]*1.15),fmt:v=>f(v,0)+'%'},series:[{name:'PD acumulada N(−d₂)',data:pdt,color:'c2',w:2.4,fill:.16}],marks:[{x:p.T,label:'T',color:'gold'}]}},
   eq:`d<sub>2</sub> = [ln(V<sub>0</sub>/D) + (r − σ²/2)T]/(σ√T) = [ln(${n(p.V,0)}/100) + (0,03 − ${n(p.s*p.s/2,4)})·${n(p.T,1)}]/${n(v,3)} = ${n(d2,3)} → PD = N(−d<sub>2</sub>) = ${n(pd*100,2,'%')}`,
   take:`Com ativos ${f(p.V/D,2)}× a dívida e volatilidade de ${pct(p.s,0)}, a firma está a ${f(d2,2)} desvios-padrão do default em ${f(p.T,1)} ano(s). ${pd>.05?'É crédito especulativo: o patrimônio se comporta como uma opção perto do dinheiro.':'Volatilidade maior dos ativos aumenta a PD mesmo sem mudar a alavancagem.'}`};
 },
 note:'PD neutra ao risco (drift r). Na prática, V<sub>0</sub> e σ<sub>V</sub> não são observáveis: resolvem-se as duas equações a partir de E<sub>0</sub> e σ<sub>E</sub>, como no livro; a PD do mundo real exige o retorno esperado dos ativos.'
});

/* =====================================================================
   H12 · CVA com perfil de exposição (cap. 17.6 e 18)
   ===================================================================== */
P.sim('sim-h-cva',{
 tag:'Simulador 10 · xVA',
 title:'CVA de um swap: perfil de exposição × intensidade de default',
 lede:'Swap de juros de R$ 100 mi entre um banco e uma contraparte sem garantias. A exposição esperada nasce em zero, cresce com a incerteza das taxas e cai à medida que os pagamentos remanescentes diminuem. A intensidade de default vem do spread: λ = s/(1 − R).',
 controls:[
  {k:'T',label:'Prazo do swap',min:2,max:10,step:1,value:5,fmt:v=>f(v,0)+' anos'},
  {k:'sr',label:'Volatilidade normal dos juros',min:50,max:150,step:5,value:100,fmt:v=>f(v,0)+' bp/ano'},
  {k:'s',label:'Spread de crédito da contraparte',min:50,max:800,step:10,value:200,fmt:v=>f(v,0)+' bp'},
  {k:'R',label:'Taxa de recuperação R',min:.2,max:.6,step:.05,value:.4,fmt:v=>pct(v,0)},
  {k:'w',label:'Fator wrong-way',min:1,max:2,step:.05,value:1,fmt:v=>f(v,2)+'×',tip:'Multiplicador estilizado da exposição nos estados de default da contraparte (1 = independência).'}],
 kpis:[
  {k:'lam',label:'<span class="nt">λ</span> · intensidade de default',color:'bad'},
  {k:'pd',label:'PD acumulada até o vencimento',color:'c3'},
  {k:'pfe',label:'Pico de PFE 97,5%',color:'c2'},
  {k:'cva',label:'CVA',color:'gold'},
  {k:'bpv',label:'CVA em bp do nocional',color:'c1'}],
 charts:[{k:'e',title:'Exposição esperada (EE) e PFE 97,5% (R$ mi)',h:270},{k:'c',title:'Contribuição de cada trimestre ao CVA (R$ mil)',h:270}],
 cols:2,
 model(p){
  const N=100,r=.03,sr=p.sr/1e4,lam=p.s/1e4/(1-p.R),m=Math.round(p.T*4),dt=.25;
  const ann=t=>(1-Math.exp(-r*(p.T-t)))/r,sd=t=>N*sr*Math.sqrt(t)*ann(t);
  const ts=Array.from({length:m+1},(_,i)=>i*dt),EE=ts.map(t=>[t,.39894*sd(t)]),PFE=ts.map(t=>[t,1.96*sd(t)]);
  let cva=0;const contrib=[];for(let i=1;i<=m;i++){const tm=(i-.5)*dt,q=Math.exp(-lam*(i-1)*dt)-Math.exp(-lam*i*dt),v=Math.exp(-r*tm)*.39894*sd(tm)*p.w,c=(1-p.R)*q*v;cva+=c;contrib.push([tm,c*1000])}
  const pk=PFE.reduce((a,b)=>b[1]>a[1]?b:a);
  return{kpi:{lam:pct(lam,2)+' a.a.',pd:pct(1-Math.exp(-lam*p.T),1),pfe:{v:mi(pk[1],2),s:`em t = ${f(pk[0],2)} ano`},cva:{v:'R$ '+f(cva*1000,0)+' mil',s:p.w>1?`inclui fator wrong-way ${f(p.w,2)}×`:'independência'},bpv:f(cva/N*1e4,1)+' bp'},
   charts:{e:{x:{min:0,max:p.T,label:'tempo (anos)',fmt:v=>f(v,1),name:'t'},y:{min:0,fmt:v=>f(v,1)},series:[{name:'EE',data:EE,color:'c1',type:'area',fill:.3,w:2.2},{name:'PFE 97,5%',data:PFE,color:'c2',w:1.8,dash:[6,4]},...(p.w>1?[{name:'EE em default (wrong-way)',data:EE.map(q=>[q[0],q[1]*p.w]),color:'bad',w:1.4,dash:[3,3]}]:[])]},
    c:{x:{min:0,max:p.T,label:'tempo (anos)',fmt:v=>f(v,1),name:'t'},y:{min:0,fmt:v=>f(v,0)},series:[{name:'(1−R)·qᵢ·vᵢ',type:'bars',color:'gold',data:contrib,bw:.2}]}},
   eq:`λ = s/(1−R) = ${n(p.s/1e4*100,2)}%/${n(1-p.R,2)} = ${n(lam*100,2)}% · CVA = (1−R)Σq<sub>i</sub>v<sub>i</sub> = ${n(1-p.R,2)} × Σ(…) = R$ ${n(cva*1000,0)} mil ≈ ${n(cva/N*1e4,1)} bp`,
   take:`O CVA cresce quase linearmente com o spread (porque (1−R)·λ ≈ s) e com a área sob a EE. ${p.w>1?`O wrong-way de ${f(p.w,2)}× eleva o CVA na mesma proporção: a exposição é maior justamente quando a contraparte quebra.`:'Compensação (netting) e garantias reduzem a EE e, com ela, o CVA.'}`};
 },
 note:'Perfil de exposição estilizado: valor do swap ~ normal com desvio N·σ<sub>r</sub>·√t·anuidade remanescente (EE = 0,399·desvio; PFE = 1,96·desvio). O livro calcula a EE por Monte Carlo; o fator wrong-way é uma simplificação didática.'
});

/* =====================================================================
   H13 · Vasicek, WCDR e capital IRB (cap. 9.6, 19.2 e 25.8)
   ===================================================================== */
P.sim('sim-h-vasicek',{
 tag:'Simulador 11 · Credit VaR de carteira',
 title:'Vasicek: a taxa de default de pior caso e o capital IRB',
 lede:'Carteira granular de empréstimos com a mesma PD e correlação de ativos ρ. A densidade mostra como a taxa de default anual se distribui quando um fator sistêmico move todos os devedores juntos. A fórmula IRB de Basileia II é esse quantil a 99,9%.',
 controls:[
  {k:'pd',label:'PD anual',min:.1,max:10,step:.1,value:1.5,fmt:v=>f(v,1)+'%'},
  {k:'mode',type:'seg',label:'Correlação ρ',options:['Manual','Fórmula de Basileia (empresas)'],value:0,tip:'Basileia: ρ cai de 24% para 12% à medida que a PD aumenta.'},
  {k:'rho',label:'ρ manual',min:.01,max:.4,step:.01,value:.15,fmt:v=>pct(v,0)},
  {k:'X',label:'Confiança X',min:.99,max:.9995,step:.0005,value:.999,fmt:v=>pct(v,2)},
  {k:'lgd',label:'LGD',min:.1,max:.9,step:.05,value:.45,fmt:v=>pct(v,0)},
  {k:'M',label:'Prazo efetivo M',min:1,max:5,step:.5,value:2.5,fmt:v=>f(v,1)+' anos'}],
 kpis:[
  {k:'rho',label:'<span class="nt">ρ</span> utilizado',color:'c3'},
  {k:'w',label:'WCDR',color:'bad',tip:'Taxa de default não excedida com confiança X.'},
  {k:'el',label:'Perda esperada',color:'c2',tip:'PD × LGD (por R$ de EAD)'},
  {k:'k',label:'Capital K',color:'gold',tip:'LGD·(WCDR − PD)·ajuste de prazo'},
  {k:'rwa',label:'RWA por R$ 100 de EAD',color:'c1',tip:'12,5 × K × EAD'}],
 charts:[{k:'d',title:'Densidade da taxa de default anual da carteira'}],
 model(p){
  const PD=p.pd/100,e50=(1-Math.exp(-50*PD))/(1-Math.exp(-50)),rho=p.mode===1?.12*e50+.24*(1-e50):p.rho;
  const a=P.Ninv(PD),w=P.N((a+Math.sqrt(rho)*P.Ninv(p.X))/Math.sqrt(1-rho));
  const b=(.11852-.05478*Math.log(PD))**2,MA=(1+(p.M-2.5)*b)/(1-1.5*b),K=p.lgd*(w-PD)*MA;
  const xmax=Math.min(.99,Math.max(w*1.5,PD*4)),xs=P.linspace(xmax/400,xmax,160);
  const dens=xs.map(x=>{const z=P.Ninv(x);return[x*100,Math.sqrt((1-rho)/rho)*Math.exp(.5*z*z-(1/(2*rho))*(Math.sqrt(1-rho)*z-a)**2)/100]});
  return{kpi:{rho:{v:pct(rho,1),s:p.mode===1?'fórmula corporativa':'escolhido'},w:pct(w,2),el:pct(PD*p.lgd,2),k:{v:pct(K,2),s:`MA = ${f(MA,2)}`},rwa:'R$ '+f(12.5*K*100,1)},
   charts:{d:{x:{min:0,max:xmax*100,label:'taxa de default (%)',fmt:v=>f(v,v<2?1:0)+'%',name:'taxa'},y:{min:0,fmt:v=>f(v,1)},
    series:[{name:'Densidade (Vasicek)',data:dens,color:'c1',fill:.25,w:2.2}],
    shade:[{x0:w*100,x1:xmax*100,color:'bad',a:.14,label:`${pct(1-p.X,2)} de probabilidade`}],
    marks:[{x:PD*100,label:'PD média',color:'c2',ly:24},{x:w*100,label:'WCDR',color:'bad',ly:40}]}},
   eq:`WCDR = N[(N<sup>−1</sup>(PD) + √ρ·N<sup>−1</sup>(X))/√(1−ρ)] = N[(${n(a,3)} + ${n(Math.sqrt(rho),3)}·${n(P.Ninv(p.X),3)})/${n(Math.sqrt(1-rho),3)}] = ${n(w*100,2)}% · K = ${n(p.lgd,2)}·(${n(w*100,2)}% − ${n(PD*100,2)}%)·${n(MA,2)} = ${n(K*100,2)}%`,
   take:`A PD média é ${pct(PD,1)}, mas em 1 a cada ${f(1/(1-p.X),0)} anos a carteira terá ao menos ${pct(w,1)} de defaults. O capital cobre a distância entre esse pior caso e a média — e é a correlação ρ que define o tamanho dessa distância.`};
 },
 note:'Carteira infinitamente granular, um fator sistêmico e LGD determinística. Fórmula de correlação e ajuste de prazo de Basileia II para empresas, sem o ajuste de porte.'
});

/* =====================================================================
   H14 · risco de liquidez: horizonte de sobrevivência (cap. 21; LCR em 26)
   ===================================================================== */
P.sim('sim-h-liquidity',{
 tag:'Simulador 12 · liquidez de funding',
 title:'Quantos dias o banco sobrevive a uma corrida? Colchão, saídas e vendas com deságio',
 lede:'Balanço ilustrativo de R$ 100 bi: varejo estável 40, varejo menos estável 20, atacado sem garantia 25 (vencendo ao longo de 60 dias), patrimônio 10. Ative a reprodução para ver o colchão de liquidez ser consumido dia a dia.',
 controls:[
  {k:'h',label:'HQLA (R$ bi)',min:4,max:30,step:1,value:14,fmt:v=>'R$ '+f(v,0)+' bi'},
  {k:'rr',label:'Saque do varejo em 30 dias',min:.02,max:.25,step:.01,value:.1,fmt:v=>pct(v,0),tip:'Taxa aplicada ao varejo menos estável; o estável saca metade dela, o menos estável o dobro.'},
  {k:'f',label:'Atacado que não renova',min:0,max:1,step:.05,value:.7,fmt:v=>pct(v,0),tip:'Fração do funding de atacado que vence e não é rolado.'},
  {k:'hc',label:'Deságio na venda de títulos',min:0,max:.6,step:.05,value:.2,fmt:v=>pct(v,0),tip:'Desconto ao vender R$ 15 bi de títulos menos líquidos (R$ 1 bi por dia a partir do dia 3).'}],
 play:{label:'▶ Reproduzir 90 dias de estresse',dur:6000},
 kpis:[
  {k:'sv',label:'Horizonte de sobrevivência',color:'gold'},
  {k:'lcr',label:'LCR estilizado',color:'c1',tip:'HQLA / (saídas 30d − min(entradas 30d; 75% das saídas))'},
  {k:'o30',label:'Saídas líquidas em 30 dias',color:'c2'},
  {k:'b30',label:'Colchão no dia 30',color:'c3'}],
 charts:[{k:'b',title:'Colchão de liquidez acumulado (R$ bi)',h:280},{k:'f',title:'Saídas e entradas acumuladas por origem (R$ bi)',h:280}],
 cols:2,
 model(p){
  const D=90,stab=40*(p.rr/2)/30,less=20*Math.min(1,2*p.rr)/30,whol=t=>t<=60?p.f*25/60:0,loans=.08,sale=t=>t>=3&&t<18?1*(1-p.hc):0;
  let b=p.h,surv=null,cs=0,cl=0,cw=0,ci=0;const path=[[0,b]],fS=[[0,0]],fL=[[0,0]],fW=[[0,0]],fI=[[0,0]];
  for(let t=1;t<=D;t++){const out=stab+less+whol(t),inn=loans+sale(t);b+=inn-out;cs+=stab;cl+=less;cw+=whol(t);ci+=inn;path.push([t,b]);fS.push([t,cs]);fL.push([t,cl]);fW.push([t,cw]);fI.push([t,ci]);if(surv===null&&b<0)surv=t}
  const out30=40*p.rr/2+20*Math.min(1,2*p.rr)+25*p.f*30/60,in30=loans*30,lcr=p.h/Math.max(.01,out30-Math.min(in30,.75*out30));
  const shown=Math.round(p.t*D),b30=path[30][1];
  return{kpi:{sv:{v:surv===null?'> 90 dias':surv+' dias',tone:surv===null||surv>30?'good':'bad',s:surv!==null&&surv<=30?'colchão esgotado antes de 30 dias':'cobre o horizonte do LCR'},lcr:{v:pct(lcr,0),tone:lcr>=1?'good':'bad'},o30:'R$ '+f(out30-Math.min(in30,.75*out30),1)+' bi',b30:{v:(b30<0?'−':'')+'R$ '+f(Math.abs(b30),1)+' bi',tone:b30<0?'bad':null}},
   charts:{b:{x:{min:0,max:D,label:'dia do estresse',fmt:v=>f(v,0),name:'dia'},y:{min:Math.min(-10,Math.min(...path.map(q=>q[1]))*1.1),max:Math.max(32,p.h*1.15),fmt:v=>f(v,0)},
    series:[{name:'Colchão acumulado',data:path.map(q=>[q[0],q[0]<=shown?q[1]:NaN]),color:'c1',w:2.6,fill:.16,end:true}],
    shade:surv!==null&&shown>=surv?[{x0:surv,x1:D,color:'bad',a:.1,label:'sem liquidez'}]:[{x0:0,x1:0,color:'bad',a:0}],
    marks:[{x:30,label:'30 dias (LCR)',color:'gold'},{y:0,color:'bad',dash:false,w:1}]},
   f:{x:{min:0,max:D,label:'dia do estresse',fmt:v=>f(v,0),name:'dia'},y:{min:0,fmt:v=>f(v,0)},
    series:[{name:'Atacado não renovado',data:fW.map(m=>[m[0],m[0]<=shown?m[1]:NaN]),color:'c2',w:2},{name:'Varejo menos estável',data:fL.map(m=>[m[0],m[0]<=shown?m[1]:NaN]),color:'c4',w:2},{name:'Varejo estável',data:fS.map(m=>[m[0],m[0]<=shown?m[1]:NaN]),color:'c3',w:2},{name:'Entradas (empréstimos + vendas)',data:fI.map(m=>[m[0],m[0]<=shown?m[1]:NaN]),color:'good',w:2,dash:[6,4]}],
    marks:[{x:30,color:'gold'}]}},
   eq:`LCR = HQLA / [Saídas<sub>30</sub> − min(Entradas<sub>30</sub>; 0,75·Saídas<sub>30</sub>)] = ${n(p.h,0)} / [${n(out30,1)} − ${n(Math.min(in30,.75*out30),1)}] = ${n(lcr*100,0)}%`,
   take:p.t<1?'Os dias estão passando: o atacado que não renova pesa nos primeiros 60 dias; as vendas de títulos ajudam, mas com deságio.':(surv===null?`O banco atravessa os 90 dias com colchão positivo (LCR ${pct(lcr,0)}).`:`O colchão acaba no dia ${surv}. ${lcr>=1?`O LCR de ${pct(lcr,0)} cobre os 30 dias padronizados, mas não diz nada sobre o dia ${surv}: o índice é uma foto, a sobrevivência é um filme.`:'Com LCR abaixo de 100%, falta HQLA já no horizonte regulatório; a saída é mais colchão ou funding mais estável.'}`)};
 },
 note:'Fatores de saída escolhidos pelo usuário, não os fatores regulatórios do LCR. Entradas contratuais constantes; sem acesso ao banco central.'
});

/* =====================================================================
   H15 · risco operacional: LDA por Monte Carlo (cap. 20.3 e 20.7)
   ===================================================================== */
P.sim('sim-h-oprisk',{
 tag:'Simulador 13 · risco operacional',
 title:'Frequência × severidade: a distribuição de perdas operacionais agregadas',
 lede:'Em cada um de 4.000 anos simulados, o número de eventos segue uma Poisson e o tamanho de cada perda segue uma lognormal. A soma anual forma a distribuição agregada; o capital é a distância entre o quantil alto e a perda esperada.',
 controls:[
  {k:'lam',label:'Frequência média λ (eventos/ano)',min:1,max:40,step:1,value:12,fmt:v=>f(v,0)},
  {k:'med',label:'Perda mediana por evento',min:.02,max:.5,step:.01,value:.1,fmt:v=>'R$ '+f(v,2)+' mi'},
  {k:'sg',label:'Dispersão da severidade (σ do log)',min:.8,max:2.6,step:.1,value:1.8,fmt:v=>f(v,1),tip:'σ alto = cauda pesada: poucos eventos enormes dominam o capital.'},
  {k:'a',label:'Confiança',min:.99,max:.999,step:.001,value:.999,fmt:v=>pct(v,1)}],
 kpis:[
  {k:'el',label:'Perda esperada anual',color:'c2'},
  {k:'var',label:'VaR (Monte Carlo)',color:'bad'},
  {k:'ul',label:'Capital = VaR − EL',color:'gold'},
  {k:'sla',label:'Aproximação de perda única',color:'c4',tip:'F<sup>−1</sup>(1 − (1−α)/λ) + (λ−1)E[X]: para severidades subexponenciais, o quantil agregado é dominado pela maior perda.'}],
 charts:[{k:'h',title:'Distribuição das perdas anuais agregadas (% dos anos)'}],
 model(p,memo){
  const key=[p.lam,p.med,p.sg].join('|');
  if(memo.key!==key){const r=P.rng(2024),mu=Math.log(p.med),Y=4000,S=new Float64Array(Y);for(let y=0;y<Y;y++){const k=P.rpois(r,p.lam);let s=0;for(let i=0;i<k;i++)s+=Math.exp(mu+p.sg*P.randn(r));S[y]=s}memo.S=Array.from(S).sort((a,b)=>a-b);memo.key=key}
  const S=memo.S,el=P.mean(S),vr=P.quantile(S,p.a),EX=p.med*Math.exp(p.sg*p.sg/2),sla=Math.exp(Math.log(p.med)+p.sg*P.Ninv(1-(1-p.a)/p.lam))+(p.lam-1)*EX;
  const hi=Math.max(vr,sla)*1.12,h=P.hist(S.filter(x=>x<=hi),48,0,hi).map(q=>[q[0],q[1]/S.length*100]);
  return{kpi:{el:mi(el,2),var:mi(vr,2),ul:{v:mi(vr-el,2),s:`${f(vr/el,1)}× a perda esperada`},sla:{v:mi(sla,2),s:`${sla>vr?'+':''}${pct(sla/vr-1,0)} vs. Monte Carlo`}},
   charts:{h:{x:{min:0,max:hi,label:'perda anual agregada (R$ mi)',fmt:v=>f(v,v<10?1:0),name:'perda'},y:{min:0,fmt:v=>f(v,1)+'%'},
    series:[{name:'Frequência dos anos',type:'bars',data:h,color:'c1',a:.75}],
    marks:[{x:el,label:'EL',color:'c2'},{x:vr,label:`VaR ${pct(p.a,1)}`,color:'bad',ly:24},{x:sla,label:'aprox. perda única',color:'c4',ly:38}]}},
   eq:`E[S] = λ·E[X] = ${n(p.lam,0)} × ${n(EX,3)} = ${n(p.lam*EX,2)} (MC: ${n(el,2)}) · VaR<sub>${n(p.a*100,1)}%</sub> ≈ ${n(vr,2)} · capital = ${n(vr-el,2)} (R$ mi)`,
   take:p.sg>=1.8?`Com dispersão ${f(p.sg,1)}, o VaR é ${f(vr/el,1)}× a perda média: a cauda é feita de poucos eventos gigantes (lei de potência). Reduzir a frequência ajuda pouco; limitar a severidade (controles, seguro) ajuda muito.`:`Com severidade pouco dispersa, o VaR fica perto da média (${f(vr/el,1)}×): o risco é de frequência, gerido por processos.`};
 },
 note:'4.000 anos simulados: o quantil de 99,9% fica apoiado em apenas 4 anos e oscila. Por isso, na prática, combinam-se dados internos, externos e cenários. A aproximação de perda única é da literatura (Böcker e Klüppelberg, 2005, com correção pela média).'
});

/* =====================================================================
   H16 · teste de estresse com sobreposição climática (cap. 16 e 23)
   ===================================================================== */
P.sim('sim-h-stress',{
 tag:'Simulador 14 · teste de estresse de capital',
 title:'Do cenário macro ao capital: 12 trimestres de estresse com risco climático',
 lede:'Banco ilustrativo: RWA de R$ 1.000 bi, CET1 inicial de 12%, carteira de crédito de R$ 800 bi (PD base 2%, LGD 45%), títulos de R$ 150 bi (duration 4) e R$ 20 bi em ações. A severidade move desemprego, juros e bolsa; a sobreposição climática acrescenta perdas por transição ou por risco físico.',
 controls:[
  {k:'sev',label:'Severidade do cenário',min:0,max:1,step:.05,value:.6,fmt:v=>pct(v,0),tip:'0% = cenário-base; 100% ≈ desemprego +5 pp, juros +250 bp e bolsa −40% no pico.'},
  {k:'cs',label:'Carteira intensiva em carbono',min:0,max:.4,step:.01,value:.15,fmt:v=>pct(v,0)},
  {k:'cl',type:'seg',label:'Sobreposição climática',options:['Sem clima','Transição desordenada','Risco físico'],value:1}],
 play:{label:'▶ Reproduzir 12 trimestres',dur:6000},
 kpis:[
  {k:'min',label:'CET1 mínimo',color:'gold'},
  {k:'q',label:'Trimestre do mínimo',color:'c3'},
  {k:'loss',label:'Perdas acumuladas',color:'bad'},
  {k:'clim',label:'Parcela climática das perdas',color:'c5'}],
 charts:[{k:'c',title:'Índice CET1 projetado (%)',h:270},{k:'l',title:'Perdas por canal em cada trimestre (R$ bi)',h:270}],
 cols:2,
 model(p){
  const Q=12,g=q=>q<=0?0:(q/5)*Math.exp(1-q/5),g2=q=>q<=0?0:(q/2)*Math.exp(1-q/2);
  const run=(sev,cl,cs)=>{let cet=120;const out=[[0,12]],L=[];let mPrev=0;
   for(let q=1;q<=Q;q++){const dU=5*sev*g(q),dy=.025*sev*g2(q),eq=.4*sev*g2(q),pdq=.02*Math.exp(.25*dU)/4;
    const tm=cl===1?(q<=6?1.5:.5):0,lgdUp=cl===2&&q>=5?.1:0;
    const credit=800*pdq*.45,clim=800*cs*pdq*tm*.45+800*pdq*lgdUp;
    const mtm=150*4*dy+20*eq,market=mtm-mPrev;mPrev=mtm;
    const ppnr=3.5*(1-.3*sev*g(q)),rwa=1000*(1+.1*sev*g(q));
    cet+=ppnr-credit-market-clim;out.push([q,cet/rwa*100]);L.push([q,credit,market,clim])}
   return{out,L}};
  const R=run(p.sev,p.cl,p.cs),B=run(0,0,0),shown=Math.round(p.t*Q);
  const mn=R.out.reduce((a,b)=>b[1]<a[1]?b:a),tot=R.L.reduce((s,x)=>s+x[1]+Math.max(0,x[2])+x[3],0),cl=R.L.reduce((s,x)=>s+x[3],0);
  const mask=(a,i)=>a.map(q=>[q[0],q[0]<=shown?q[i]:NaN]);
  return{kpi:{min:{v:pct(mn[1]/100,2),tone:mn[1]<7?'bad':'good',s:mn[1]<7?'abaixo de 7% (4,5% + colchão de 2,5%)':'acima de 7%'},q:mn[0]===0?'—':`T${mn[0]}`,loss:'R$ '+f(tot,1)+' bi',clim:{v:pct(cl/Math.max(tot,1e-9),1),s:'R$ '+f(cl,1)+' bi'}},
   charts:{c:{x:{min:0,max:Q,label:'trimestre',fmt:v=>'T'+f(v,0),name:'trimestre'},y:{min:Math.min(4,mn[1]-1),max:15.5,fmt:v=>f(v,0)+'%'},
     series:[{name:'Cenário-base',data:B.out,color:'c3',dash:[5,4],w:1.4},{name:'Cenário estressado',data:mask(R.out,1),color:'c1',w:2.6,fill:.14,end:true}],
     marks:[{y:7,label:'7% · mínimo + colchão',color:'bad',align:'left'},{y:4.5,label:'4,5% · mínimo',color:'bad',align:'left',dash:[2,3]}]},
    l:{x:{min:.4,max:Q+.6,label:'trimestre',fmt:v=>'T'+f(v,0),name:'trimestre'},y:{zero:true,fmt:v=>f(v,1)},
     series:[{name:'Crédito',type:'bars',bw:.26,off:-.28,color:'c1',data:mask(R.L,1)},{name:'Mercado (marcação)',type:'bars',bw:.26,off:0,color:'c2',data:mask(R.L,2)},{name:'Clima',type:'bars',bw:.26,off:.28,color:'c5',data:mask(R.L,3)}]}},
   eq:`CET1<sub>t</sub> = CET1<sub>t−1</sub> + PPNR<sub>t</sub> − perdas de crédito<sub>t</sub> − Δmarcação<sub>t</sub> − perdas climáticas<sub>t</sub> · mínimo: ${n(mn[1],2)}% em T${mn[0]}`,
   take:p.t<1?'Os trimestres estão passando: o mercado bate primeiro (juros e bolsa); o crédito vem depois, com o desemprego.':`Na severidade ${pct(p.sev,0)}, o CET1 cai a ${pct(mn[1]/100,1)}${mn[1]<7?' e rompe o colchão: ações de gestão (dividendos, RWA, capital) entram antes do mínimo':''}. ${p.cl>0?`O clima responde por ${pct(cl/Math.max(tot,1e-9),0)} das perdas — risco que não aparece em séries históricas.`:'Sem sobreposição climática, todas as perdas vêm dos canais macro tradicionais.'}`};
 },
 note:'Modelos satélite estilizados e calibração arbitrária, apenas para mostrar a propagação de um cenário até o capital. Não reproduz exercícios regulatórios (CCAR/DFAST, EBA) nem cenários do NGFS.'
});

/* =====================================================================
   H17 · capital econômico, Euler e RAROC (cap. 28)
   ===================================================================== */
P.sim('sim-h-raroc',{
 tag:'Simulador 15 · capital econômico e RAROC',
 title:'Agregar, alocar e cobrar: capital econômico por Euler e RAROC por unidade',
 lede:'Três unidades com capital econômico isolado de R$ 60, 90 e 50 mi e resultado ajustado ao risco (receita − custos − perda esperada) de R$ 14, 10 e 9 mi. A correlação entre perdas define o benefício de diversificação; a alocação de Euler distribui o capital total pela contribuição marginal.',
 controls:[
  {k:'rho',label:'Correlação entre unidades',min:0,max:1,step:.05,value:.4,fmt:v=>f(v,2)},
  {k:'h',label:'Taxa mínima de retorno (hurdle)',min:.08,max:.2,step:.005,value:.14,fmt:v=>pct(v,1)},
  {k:'g',label:'Escala do Corporate',min:.5,max:2,step:.1,value:1,fmt:v=>f(v,1)+'×',tip:'Crescer o Corporate aumenta seu capital proporcionalmente e o resultado menos que proporcionalmente (spreads menores).'}],
 kpis:[
  {k:'tot',label:'Capital econômico total',color:'c1'},
  {k:'div',label:'Benefício de diversificação',color:'c2'},
  {k:'bank',label:'RAROC do banco',color:'gold'},
  {k:'bad',label:'Unidades abaixo do hurdle',color:'c3'}],
 charts:[{k:'ec',title:'Capital isolado × alocado por Euler (R$ mi)',h:260},{k:'rr',title:'RAROC sobre capital alocado',h:260}],
 cols:2,
 model(p){
  const U=['Varejo','Corporate','Tesouraria'],EC=[60,90*p.g,50],INC=[14,10*Math.pow(p.g,.85),9];
  const C=(i,j)=>i===j?1:p.rho,tot=Math.sqrt(EC.reduce((s,a,i)=>s+EC.reduce((t,b,j)=>t+C(i,j)*a*b,0),0));
  const al=EC.map((a,i)=>a*EC.reduce((t,b,j)=>t+C(i,j)*b,0)/tot),rr=INC.map((x,i)=>x/al[i]),sum=EC.reduce((a,b)=>a+b,0),bank=INC.reduce((a,b)=>a+b,0)/tot;
  const below=rr.filter(r=>r<p.h).length;
  return{kpi:{tot:mi(tot,1),div:{v:pct(1-tot/sum,1),s:`soma isolada ${mi(sum,0)}`},bank:{v:pct(bank,1),tone:bank>=p.h?'good':'bad'},bad:{v:`${below} de 3`,tone:below?'bad':'good'}},
   charts:{ec:{x:{cats:U,name:'unidade'},y:{min:0,fmt:v=>f(v,0)},series:[{name:'Isolado',type:'bars',bw:.34,off:-.18,color:'c3',data:EC.map((v,i)=>[i,v])},{name:'Alocado (Euler)',type:'bars',bw:.34,off:.18,color:'c1',data:al.map((v,i)=>[i,v])}]},
    rr:{x:{cats:U,name:'unidade'},y:{min:0,max:Math.max(.4,...rr)*100*1.1,fmt:v=>f(v,0)+'%'},series:[{name:'RAROC',type:'bars',bw:.5,data:rr.map((v,i)=>[i,v*100,v>=p.h?'good':'bad'])}],marks:[{y:p.h*100,label:'hurdle',color:'gold',name:'taxa mínima'}]}},
   eq:`CE<sub>i</sub><sup>Euler</sup> = CE<sub>i</sub>·Σ<sub>j</sub>ρ<sub>ij</sub>CE<sub>j</sub>/CE<sub>total</sub> → ${U.map((u,i)=>`${u}: ${n(al[i],1)}`).join(' · ')} · soma = ${n(al.reduce((a,b)=>a+b,0),1)} = CE<sub>total</sub>`,
   take:`Com correlação ${f(p.rho,2)}, o banco precisa de ${pct(tot/sum,0)} do capital somado. ${below?`Pelo capital alocado, ${U.filter((u,i)=>rr[i]<p.h).join(' e ')} não paga${below>1?'m':''} o hurdle de ${pct(p.h,1)}: crescer ali destrói valor, mesmo com lucro contábil positivo.`:'Todas as unidades superam o hurdle no capital alocado.'}`};
 },
 note:'Agregação por variância-covariância (perdas proporcionais aos capitais isolados). As alocações de Euler somam exatamente o capital total.'
});
})();
