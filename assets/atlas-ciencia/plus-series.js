/* Atlas Plus · Huang & Petukhina, Applied Time Series Analysis and Forecasting with Python (Springer, 2022)
   Conceitos (tooltip) e simuladores deste livro. Requer plus.js carregado antes.
   Todos os dados são sintéticos, com sementes fixas: mover um controle muda o processo, não o ruído. */
(()=>{'use strict';
const P=window.PLUS,{f,pct,n}=P;

/* ---------- conceitos: t = termo PT, en = termo original, d = definição, f = fórmula, c = categoria ---------- */
P.cx=Object.assign(P.cx||{},{
 serie:{t:'Série temporal',en:'time series',m:['série temporal','séries temporais'],d:'Realização observada de um processo estocástico indexado no tempo. A ordem das observações carrega informação: embaralhar destrói a dependência serial.',f:'{y<sub>t</sub> : t = 1, …, T}'},
 processo:{t:'Processo estocástico',en:'stochastic process',m:['processo estocástico','processos estocásticos'],d:'Família de variáveis aleatórias {Y<sub>t</sub>}. A série observada é uma única trajetória (realização) desse processo.'},
 estac:{t:'Estacionariedade fraca',en:'weak (covariance) stationarity',m:['estacionariedade fraca','estacionariedade','estacionária','estacionário','estacionárias','estacionários'],d:'Média constante, variância finita e constante e autocovariância que depende apenas da defasagem k, não do instante t.',f:'E[Y<sub>t</sub>] = μ · Cov(Y<sub>t</sub>, Y<sub>t−k</sub>) = γ(k)'},
 estrita:{t:'Estacionariedade estrita',en:'strict stationarity',m:['estacionariedade estrita'],d:'A distribuição conjunta de (Y<sub>t1</sub>,…,Y<sub>tk</sub>) é invariante a deslocamentos no tempo. Com segundo momento finito, implica a fraca.'},
 ergod:{t:'Ergodicidade',en:'ergodicity',m:['ergodicidade','ergódico','ergódica'],d:'Propriedade que permite estimar momentos do processo por médias ao longo de uma única trajetória longa: média temporal converge para a média do ensemble.'},
 rb:{t:'Ruído branco',en:'white noise',c:'mod',m:['ruído branco','white noise'],d:'Sequência de variáveis não correlacionadas, com média zero e variância constante. É o “resíduo ideal”: nada mais a prever linearmente.',f:'ε<sub>t</sub> ~ WN(0, σ²) · γ(k) = 0, k ≠ 0'},
 rw:{t:'Passeio aleatório',en:'random walk',c:'mod',m:['passeio aleatório','passeios aleatórios','random walk'],d:'Soma acumulada de choques: cada valor é o anterior mais um ruído. Tem raiz unitária, variância que cresce com t e memória infinita dos choques.',f:'y<sub>t</sub> = y<sub>t−1</sub> + μ + ε<sub>t</sub> · Var(y<sub>t</sub>) = tσ²'},
 lag:{t:'Operador de defasagem',en:'backshift (lag) operator',c:'mod',m:['operador de defasagem','backshift','operador B'],d:'Operador que desloca a série um período para trás. Permite escrever modelos como polinômios em B.',f:'B y<sub>t</sub> = y<sub>t−1</sub> · B<sup>k</sup> y<sub>t</sub> = y<sub>t−k</sub>'},
 dif:{t:'Diferenciação',en:'differencing',c:'mod',m:['diferenciação','diferenciar','primeira diferença'],d:'Transformação Δy<sub>t</sub> = y<sub>t</sub> − y<sub>t−1</sub> que remove uma raiz unitária. A diferença sazonal Δ<sub>s</sub> remove raiz unitária sazonal.',f:'Δ = 1 − B · Δ<sub>s</sub> = 1 − B<sup>s</sup>'},
 sazon:{t:'Sazonalidade',en:'seasonality',m:['sazonalidade','sazonal','sazonais'],d:'Padrão que se repete com período fixo e conhecido (24 horas, 7 dias, 12 meses). Pode ser determinística (índices fixos) ou estocástica (raiz unitária sazonal).'},
 tendest:{t:'Tendência estocástica',en:'stochastic trend',c:'mod',m:['tendência estocástica','tendências estocásticas'],d:'Componente de nível acumulado por choques permanentes (raiz unitária). Diferente da tendência determinística, não é removida subtraindo uma reta.',f:'y<sub>t</sub> = y<sub>0</sub> + Σ<sub>s≤t</sub> ε<sub>s</sub> + …'},
 tenddet:{t:'Tendência determinística',en:'deterministic trend',m:['tendência determinística'],d:'Função conhecida do tempo (reta, polinômio). Choques são transitórios em torno dela: a série é estacionária em torno da tendência (trend-stationary).'},
 decomp:{t:'Decomposição',en:'time series decomposition',c:'mod',m:['decomposição clássica','decomposição','STL'],d:'Separação da série em tendência-ciclo T, sazonalidade S e resíduo R, de forma aditiva (y = T + S + R) ou multiplicativa (y = T·S·R). STL usa regressão local robusta (Loess).'},
 mm:{t:'Média móvel centrada',en:'centered moving average',c:'mod',m:['média móvel centrada','médias móveis centradas','2×12'],d:'Filtro que estima a tendência com janela simétrica. Para período par m usa-se a média 2×m, que dá peso 1/(2m) às pontas e elimina exatamente a sazonalidade de período m.'},
 acf:{t:'Função de autocorrelação',en:'autocorrelation function (ACF)',c:'m',m:['ACF','autocorrelação','autocorrelações','correlograma'],d:'Correlação entre y<sub>t</sub> e y<sub>t−k</sub> para cada defasagem k. Sob ruído branco, r<sub>k</sub> ≈ N(0, 1/n).',f:'ρ(k) = γ(k)/γ(0) · banda ±1,96/√n'},
 pacf:{t:'Autocorrelação parcial',en:'partial autocorrelation function (PACF)',c:'m',m:['PACF','autocorrelação parcial'],d:'Correlação entre y<sub>t</sub> e y<sub>t−k</sub> depois de remover o efeito linear dos lags intermediários. Num AR(p) “corta” após o lag p.',f:'φ<sub>kk</sub> = último coeficiente do AR(k) ajustado'},
 lb:{t:'Teste de Ljung-Box',en:'Ljung–Box portmanteau test',c:'mod',m:['Ljung-Box','Ljung–Box','portmanteau'],d:'Testa conjuntamente se as h primeiras autocorrelações são nulas (ruído branco). Nos resíduos de um ARMA(p,q), usa h − p − q graus de liberdade.',f:'Q = n(n+2) Σ<sub>k=1</sub><sup>h</sup> r<sub>k</sub>²/(n−k) ~ χ²<sub>h−p−q</sub>'},
 ar:{t:'Modelo autorregressivo',en:'autoregressive model AR(p)',c:'mod',m:['AR','autorregressivo','autorregressiva','autorregressivos'],d:'O valor atual é combinação linear de p valores passados mais um choque. Estacionário se as raízes de φ(z) estão fora do círculo unitário.',f:'φ(B) y<sub>t</sub> = c + ε<sub>t</sub>'},
 ma:{t:'Modelo de médias móveis',en:'moving average model MA(q)',c:'mod',m:['MA'],d:'O valor atual é combinação de choques correntes e q choques passados. Sempre estacionário; a ACF corta após o lag q.',f:'y<sub>t</sub> = μ + θ(B) ε<sub>t</sub>'},
 arma:{t:'Modelo ARMA',en:'ARMA(p,q)',c:'mod',m:['ARMA'],d:'Combina partes AR e MA. Representação parcimoniosa de processos estacionários; ACF e PACF decaem gradualmente.',f:'φ(B) y<sub>t</sub> = θ(B) ε<sub>t</sub>'},
 arima:{t:'Modelo ARIMA',en:'ARIMA(p,d,q)',c:'mod',m:['ARIMA'],d:'ARMA aplicado à série diferenciada d vezes. Captura tendência estocástica sem sazonalidade.',f:'φ(B)(1−B)<sup>d</sup> y<sub>t</sub> = θ(B) ε<sub>t</sub>'},
 sarima:{t:'Modelo SARIMA',en:'seasonal ARIMA',c:'mod',m:['SARIMA','SARIMAX'],d:'ARIMA multiplicativo com polinômios sazonais em B<sup>s</sup> e diferença sazonal D. SARIMAX acrescenta regressoras exógenas.',f:'Φ(B<sup>s</sup>)φ(B)(1−B)<sup>d</sup>(1−B<sup>s</sup>)<sup>D</sup>y<sub>t</sub> = Θ(B<sup>s</sup>)θ(B)ε<sub>t</sub>'},
 regarma:{t:'Regressão com erros ARMA',en:'REGARMA / regression with ARMA errors',c:'mod',m:['REGARMA','ARIMAX'],d:'Regressão linear em que o termo de erro segue um ARMA. Corrige a inferência quando os resíduos da regressão são autocorrelacionados.',f:'y<sub>t</sub> = x<sub>t</sub>′β + u<sub>t</sub>, φ(B)u<sub>t</sub> = θ(B)ε<sub>t</sub>'},
 causal:{t:'Causalidade (de um ARMA)',en:'causality of an ARMA process',c:'mod',m:['causal','causalidade do ARMA'],d:'O processo pode ser escrito como soma convergente de choques presentes e passados (MA(∞)). Equivale a raízes de φ(z) fora do círculo unitário.',f:'y<sub>t</sub> = Σ<sub>j≥0</sub> ψ<sub>j</sub> ε<sub>t−j</sub>, Σ|ψ<sub>j</sub>| &lt; ∞'},
 inv:{t:'Invertibilidade',en:'invertibility',c:'mod',m:['invertibilidade','invertível','invertíveis'],d:'O choque pode ser recuperado dos valores passados (AR(∞)). Exige raízes de θ(z) fora do círculo unitário e torna a representação MA única.',f:'ε<sub>t</sub> = Σ<sub>j≥0</sub> π<sub>j</sub> y<sub>t−j</sub>'},
 raiz:{t:'Raiz unitária',en:'unit root',c:'mod',m:['raiz unitária','raízes unitárias'],d:'O polinômio AR tem raiz em z = 1: choques têm efeito permanente e a variância cresce sem limite. Remove-se por diferenciação.'},
 adf:{t:'Teste de Dickey-Fuller aumentado',en:'augmented Dickey–Fuller test (ADF)',c:'mod',m:['ADF','Dickey-Fuller','Dickey–Fuller'],d:'H<sub>0</sub>: raiz unitária. Regride Δy<sub>t</sub> em y<sub>t−1</sub> e lags de Δy; a estatística t não segue a normal, mas a distribuição de Dickey-Fuller (crítico 5% ≈ −2,86 com constante).',f:'Δy<sub>t</sub> = a + γ y<sub>t−1</sub> + Σ δ<sub>j</sub> Δy<sub>t−j</sub> + e<sub>t</sub>'},
 kpss:{t:'Teste KPSS',en:'KPSS stationarity test',c:'mod',m:['KPSS'],d:'Inverte as hipóteses do ADF: H<sub>0</sub> é estacionariedade (em nível ou em torno de tendência). Usado em conjunto com testes de raiz unitária.'},
 bj:{t:'Método de Box-Jenkins',en:'Box–Jenkins methodology',c:'mod',m:['Box-Jenkins','Box–Jenkins'],d:'Ciclo iterativo: transformar e identificar (ACF/PACF), estimar, diagnosticar resíduos e só então prever; volta ao início se o diagnóstico falhar.'},
 aic:{t:'Critério de informação de Akaike',en:'Akaike information criterion (AIC)',c:'m',m:['AIC'],d:'Penaliza o número de parâmetros com 2k. Estima perda preditiva (Kullback-Leibler); tende a escolher modelos maiores que o BIC.',f:'AIC = n ln s² + 2k'},
 bic:{t:'Critério de informação bayesiano',en:'Bayesian information criterion (BIC/SBC)',c:'m',m:['BIC'],d:'Penalidade k ln n, mais severa que a do AIC para n ≥ 8. É consistente: escolhe a ordem verdadeira com probabilidade → 1 se ela estiver entre as candidatas.',f:'BIC = n ln s² + k ln n'},
 mv:{t:'Máxima verossimilhança',en:'maximum likelihood estimation (MLE)',c:'mod',m:['máxima verossimilhança'],d:'Escolhe os parâmetros que maximizam a densidade conjunta dos dados. Para ARMA gaussiano, coincide assintoticamente com mínimos quadrados condicionais.'},
 mqc:{t:'Mínimos quadrados condicionais',en:'conditional least squares',c:'mod',m:['mínimos quadrados condicionais'],d:'Minimiza a soma dos quadrados dos choques condicionando nos primeiros valores. Em um AR(p) é simplesmente OLS de y<sub>t</sub> nos seus lags.'},
 ses:{t:'Suavização exponencial',en:'exponential smoothing',c:'mod',m:['suavização exponencial','suavização exponencial simples'],d:'Previsão como média ponderada com pesos que decaem geometricamente: α(1−α)<sup>j</sup>. Equivale à previsão ótima de um ARIMA(0,1,1).',f:'ℓ<sub>t</sub> = αy<sub>t</sub> + (1−α)ℓ<sub>t−1</sub>'},
 hw:{t:'Holt-Winters',en:'Holt–Winters seasonal method',c:'mod',m:['Holt-Winters','Holt–Winters','método de Holt','Holt'],d:'Suavização com três equações: nível (α), tendência (β) e sazonalidade (γ). Versão aditiva ou multiplicativa.',f:'ŷ<sub>t+h|t</sub> = ℓ<sub>t</sub> + h b<sub>t</sub> + s<sub>t+h−m</sub>'},
 horiz:{t:'Horizonte de previsão',en:'forecast horizon',m:['horizonte de previsão','horizonte h','horizontes'],d:'Número de passos à frente da origem. O erro de previsão e sua variância dependem de h; avaliar só h = 1 esconde a deterioração.'},
 ip:{t:'Intervalo de previsão',en:'prediction interval',c:'m',m:['intervalo de previsão','intervalos de previsão','leque de previsão'],d:'Faixa que contém o valor futuro com probabilidade nominal. Em séries estacionárias converge; com raiz unitária cresce sem limite com h.',f:'ŷ<sub>T+h</sub> ± z<sub>α/2</sub> σ √(Σ<sub>j&lt;h</sub> ψ<sub>j</sub>²)'},
 psi:{t:'Pesos ψ',en:'psi weights (MA(∞) representation)',c:'mod',m:['pesos ψ','representação MA(∞)'],d:'Coeficientes da representação y<sub>t</sub> = Σψ<sub>j</sub>ε<sub>t−j</sub>. Determinam a resposta a choques e a variância do erro de previsão.'},
 fatos:{t:'Fatos estilizados',en:'stylized facts of returns',m:['fatos estilizados'],d:'Regularidades empíricas de retornos: média próxima de zero, caudas pesadas, autocorrelação fraca nos retornos e forte nos quadrados, agrupamento de volatilidade e efeito alavancagem.'},
 cluster:{t:'Agrupamento de volatilidade',en:'volatility clustering',m:['agrupamento de volatilidade','clusters de volatilidade'],d:'Grandes variações tendem a ser seguidas de grandes variações, de qualquer sinal. Visível na ACF de r<sub>t</sub>² ou |r<sub>t</sub>|.'},
 arch:{t:'Modelo ARCH',en:'autoregressive conditional heteroskedasticity',c:'mod',m:['ARCH'],d:'Proposto por Engle (1982): a variância condicional depende dos quadrados dos choques passados.',f:'σ<sub>t</sub>² = ω + Σ α<sub>i</sub> ε<sub>t−i</sub>²'},
 garch:{t:'Modelo GARCH',en:'generalized ARCH (Bollerslev, 1986)',c:'mod',m:['GARCH'],d:'Acrescenta a própria variância passada: σ<sub>t</sub>² = ω + αε<sub>t−1</sub>² + βσ<sub>t−1</sub>². α + β mede a persistência; variância de longo prazo ω/(1−α−β).',f:'σ<sub>T+h</sub>² = σ<sub>L</sub>² + (α+β)<sup>h−1</sup>(σ<sub>T+1</sub>² − σ<sub>L</sub>²)'},
 gjr:{t:'GJR-GARCH',en:'Glosten–Jagannathan–Runkle GARCH',c:'mod',m:['GJR'],d:'Extensão assimétrica: choques negativos recebem peso adicional γ. Capta o efeito alavancagem.',f:'σ<sub>t</sub>² = ω + (α + γ·1[ε<sub>t−1</sub>&lt;0]) ε<sub>t−1</sub>² + βσ<sub>t−1</sub>²'},
 alav:{t:'Efeito alavancagem',en:'leverage effect',m:['efeito alavancagem','alavancagem'],d:'Quedas de preço elevam a volatilidade futura mais do que altas de mesmo tamanho.'},
 nic:{t:'Curva de impacto de notícias',en:'news impact curve',c:'m',m:['curva de impacto de notícias','impacto de notícias'],d:'Variância condicional do próximo período como função do choque de hoje, com o resto fixo na média (Engle e Ng, 1993).'},
 persist:{t:'Persistência e meia-vida',en:'persistence / half-life',c:'m',m:['persistência','meia-vida'],d:'Velocidade com que um desvio se dissipa. Para um coeficiente de decaimento ρ, a meia-vida é ln(0,5)/ln(ρ) períodos.',f:'h<sub>½</sub> = ln 0,5 / ln ρ'},
 var:{t:'Vetor autorregressivo',en:'vector autoregression (VAR)',c:'mod',m:['VAR','VARMA','vetor autorregressivo'],d:'Cada variável depende de lags de todas as variáveis do sistema. Estável se todos os autovalores da matriz companheira têm módulo &lt; 1.',f:'Y<sub>t</sub> = c + A<sub>1</sub>Y<sub>t−1</sub> + … + A<sub>p</sub>Y<sub>t−p</sub> + u<sub>t</sub>'},
 irf:{t:'Função de resposta a impulso',en:'impulse response function (IRF)',c:'m',m:['IRF','resposta a impulso','respostas a impulso'],d:'Trajetória de cada variável após um choque unitário em uma inovação. Com choques correlacionados, a ortogonalização (Cholesky) depende da ordem das variáveis.',f:'Θ<sub>h</sub> = A<sup>h</sup> P, Σ<sub>u</sub> = PP′'},
 granger:{t:'Causalidade de Granger',en:'Granger causality',c:'mod',m:['causalidade de Granger','Granger-causa','Granger-causalidade'],d:'X Granger-causa Y se os lags de X melhoram a previsão de Y dado o passado de Y. É precedência preditiva, não causalidade estrutural.'},
 coint:{t:'Cointegração',en:'cointegration',c:'mod',m:['cointegração','cointegradas','cointegrados','cointegrações'],d:'Séries I(1) cuja combinação linear é I(0): compartilham a mesma tendência estocástica e mantêm equilíbrio de longo prazo.',f:'y<sub>t</sub> − βx<sub>t</sub> ~ I(0)'},
 vecm:{t:'Modelo vetorial de correção de erros',en:'vector error correction model (VECM)',c:'mod',m:['VECM','correção de erros','correção de erro'],d:'VAR em diferenças com termo de desequilíbrio defasado. Pelo teorema de representação de Granger, sistema cointegrado ⇔ representação de correção de erros.',f:'ΔY<sub>t</sub> = αβ′Y<sub>t−1</sub> + Σ Γ<sub>i</sub> ΔY<sub>t−i</sub> + u<sub>t</sub>'},
 eg:{t:'Teste de Engle-Granger',en:'Engle–Granger two-step test',c:'mod',m:['Engle-Granger','Engle–Granger'],d:'Estima a relação de longo prazo por OLS e testa raiz unitária no resíduo com valores críticos próprios (≈ −3,34 a 5% para duas variáveis com constante).'},
 johansen:{t:'Teste de Johansen',en:'Johansen trace / max-eigenvalue test',c:'mod',m:['Johansen'],d:'Testa o posto de cointegração r de um sistema por máxima verossimilhança no VECM, permitindo mais de um vetor cointegrante.'},
 espurio:{t:'Regressão espúria',en:'spurious regression',m:['regressão espúria','regressões espúrias','espúria'],d:'Regressão entre séries I(1) independentes que produz R² alto e t significativos por acaso (Granger e Newbold, 1974). Sinal clássico: R² &gt; Durbin-Watson.'},
 dw:{t:'Estatística de Durbin-Watson',en:'Durbin–Watson statistic',c:'m',m:['Durbin-Watson','Durbin–Watson'],d:'Mede autocorrelação de primeira ordem nos resíduos: ≈ 2 sem autocorrelação, perto de 0 com resíduos muito persistentes.',f:'DW = Σ(e<sub>t</sub>−e<sub>t−1</sub>)² / Σe<sub>t</sub>² ≈ 2(1 − r<sub>1</sub>)'},
 browniano:{t:'Movimento browniano',en:'standard Brownian motion',c:'mod',m:['movimento browniano','browniano'],d:'Limite contínuo do passeio aleatório reescalado (teorema de Donsker). Base das distribuições assintóticas dos testes de raiz unitária.'},
 ee:{t:'Modelo de espaço de estados',en:'state space model',c:'mod',m:['espaço de estados','espaço-estado'],d:'Separa uma equação de estado latente (como o sistema evolui) de uma equação de observação (o que se mede). ARIMA, SARIMAX e modelos estruturais cabem nessa forma.',f:'x<sub>t</sub> = Fx<sub>t−1</sub> + w<sub>t</sub> · y<sub>t</sub> = Hx<sub>t</sub> + v<sub>t</sub>'},
 kalman:{t:'Filtro de Kalman',en:'Kalman filter',c:'mod',m:['filtro de Kalman','Kalman'],d:'Algoritmo recursivo que atualiza a estimativa do estado com cada nova observação, ponderando previsão e dado pelo ganho K = P/(P + R).',f:'a<sub>t</sub> = a<sub>t|t−1</sub> + K<sub>t</sub>(y<sub>t</sub> − a<sub>t|t−1</sub>)'},
 suav:{t:'Suavizador de estados',en:'state smoother (RTS)',c:'mod',m:['suavizador','suavizado','suavização de estados'],d:'Revisa estimativas passadas usando todo o sample (Rauch-Tung-Striebel). Mais preciso, mas usa informação futura: não está disponível em tempo real.'},
 nivel:{t:'Modelo de nível local',en:'local level model',c:'mod',m:['nível local'],d:'Passeio aleatório observado com ruído. Sua previsão ótima é a suavização exponencial simples com α igual ao ganho de Kalman estacionário; equivale a um ARIMA(0,1,1).',f:'μ<sub>t</sub> = μ<sub>t−1</sub> + η<sub>t</sub> · y<sub>t</sub> = μ<sub>t</sub> + ε<sub>t</sub>'},
 ms:{t:'Mudança de regime markoviana',en:'Markov switching model (Hamilton, 1989)',c:'mod',m:['Markov switching','mudança de regime','mudanças de regime','regimes de Markov'],d:'Os parâmetros dependem de um estado discreto não observado que segue uma cadeia de Markov. Duração esperada do regime i: 1/(1 − p<sub>ii</sub>).',f:'P(s<sub>t</sub> = j | s<sub>t−1</sub> = i) = p<sub>ij</sub>'},
 quebra:{t:'Quebra estrutural',en:'structural break',m:['quebra estrutural','quebras estruturais','quebra de nível','mudança de nível'],d:'Mudança permanente em parâmetros (nível, tendência, variância) a partir de uma data. Pode fazer uma série estacionária parecer ter raiz unitária (Perron, 1989).'},
 rede:{t:'Rede neural artificial',en:'artificial neural network (ANN)',c:'mod',m:['rede neural','redes neurais','perceptron multicamadas','MLP'],d:'Composição de transformações afins com ativações não lineares. Uma camada oculta suficientemente larga aproxima funções contínuas (aproximação universal).',f:'ŷ = b<sub>2</sub> + W<sub>2</sub> tanh(W<sub>1</sub>x + b<sub>1</sub>)'},
 lstm:{t:'LSTM',en:'long short-term memory network',c:'mod',m:['LSTM','RNN','rede recorrente','redes recorrentes'],d:'Rede recorrente com portas (esquecimento, entrada, saída) que controlam uma memória interna, mitigando o desaparecimento do gradiente em sequências longas.'},
 janela:{t:'Janela deslizante de lags',en:'sliding window / lag features',c:'mod',m:['janela deslizante','janelas deslizantes','lags como features'],d:'Reformula a série como problema supervisionado: entradas (y<sub>t−L</sub>,…,y<sub>t−1</sub>) e alvo y<sub>t</sub>. É assim que redes e árvores “veem” o tempo.'},
 parada:{t:'Parada antecipada',en:'early stopping',c:'mod',m:['parada antecipada','early stopping'],d:'Interrompe o treino quando o erro de validação para de cair, antes que a rede memorize o ruído do treino.'},
 sobreaj:{t:'Sobreajuste',en:'overfitting',m:['sobreajuste','overfitting'],d:'Erro de treino baixo com erro fora da amostra alto: o modelo aprendeu particularidades do ruído em vez da estrutura.'},
 vaz:{t:'Vazamento de dados',en:'data leakage',m:['vazamento de dados','vazamento','vazamentos'],d:'Uso, no treino ou nas features, de informação que não existiria no instante da previsão (dados futuros, estatísticas do teste, revisões posteriores).'},
 rolling:{t:'Origem móvel',en:'rolling-origin evaluation (time series cross-validation)',c:'mod',m:['rolling-origin','origem móvel','origens móveis','validação cruzada temporal'],d:'Repete estimação e previsão em várias origens cronológicas; o treino sempre termina antes do bloco avaliado. Janela expansiva ou deslizante.'},
 backtest:{t:'Backtesting temporal',en:'time series backtesting',c:'mod',m:['backtesting','backtest'],d:'Simulação histórica do processo real de previsão: mesma disponibilidade de dados, mesmos horizontes e reestimação que ocorreriam em produção.'},
 mae:{t:'Erro absoluto médio',en:'mean absolute error (MAE)',c:'m',m:['MAE'],d:'Média de |y − ŷ|. Mesma unidade da série; ótimo da previsão mediana.',f:'MAE = (1/n)Σ|e<sub>t</sub>|'},
 rmse:{t:'Raiz do erro quadrático médio',en:'root mean squared error (RMSE)',c:'m',m:['RMSE'],d:'Penaliza mais os erros grandes; ótimo da previsão média.',f:'RMSE = √[(1/n)Σe<sub>t</sub>²]'},
 mape:{t:'Erro percentual absoluto médio',en:'MAPE / sMAPE',c:'m',m:['MAPE','sMAPE'],d:'Erro relativo em %. O MAPE explode com valores próximos de zero e é assimétrico; o sMAPE divide pela média de |y| e |ŷ|, mas também tem problemas perto de zero.',f:'sMAPE = (1/n)Σ 200|e<sub>t</sub>|/(|y<sub>t</sub>|+|ŷ<sub>t</sub>|)'},
 mase:{t:'Erro absoluto médio escalonado',en:'mean absolute scaled error (MASE)',c:'m',m:['MASE'],d:'MAE dividido pelo MAE dentro da amostra do método ingênuo sazonal. MASE &lt; 1: melhor que o benchmark ingênuo (Hyndman e Koehler, 2006).',f:'MASE = MAE / [(1/(n−m))Σ|y<sub>t</sub> − y<sub>t−m</sub>|]'},
 naive:{t:'Previsão ingênua',en:'naïve / seasonal naïve forecast',c:'mod',m:['ingênuo sazonal','ingênua sazonal','previsão ingênua','naïve'],d:'Benchmark mínimo: repetir o último valor (ou o valor de um período sazonal atrás). Qualquer modelo deve vencê-lo fora da amostra.'},
 ic:{t:'Banda de significância da ACF',en:'approximate 95% white-noise bounds',c:'m',m:['±1,96/√n'],d:'Sob ruído branco, cada r<sub>k</sub> é aproximadamente N(0, 1/n). A banda é pontual: com 20 lags, espera-se ~1 fora dela por acaso.'}
});

/* ---------- utilidades ---------- */
const ZC={};
const Z=(seed,len)=>{const k=seed+':'+len;if(!ZC[k]){const r=P.rng(seed),a=new Float64Array(len);for(let i=0;i<len;i++)a[i]=P.randn(r);ZC[k]=a}return ZC[k]};
const UC={};
const U=(seed,len)=>{const k=seed+':'+len;if(!UC[k]){const r=P.rng(seed),a=new Float64Array(len);for(let i=0;i<len;i++)a[i]=r();UC[k]=a}return UC[k]};
const variance=a=>{const m=P.mean(a);return a.reduce((s,x)=>s+(x-m)**2,0)/Math.max(1,a.length-1)};
const rmse=e=>Math.sqrt(P.mean(e.map(v=>v*v)));
const mae=e=>P.mean(e.map(Math.abs));
// Durbin–Levinson: autocorrelações ρ(1..K) → autocorrelações parciais φ_kk
function pacf(r){const out=[];let prev=[];for(let k=1;k<=r.length;k++){let num=r[k-1],den=1;for(let j=1;j<k;j++){num-=prev[j-1]*r[k-j-1];den-=prev[j-1]*r[j-1]}const pk=num/den,cur=[];for(let j=1;j<k;j++)cur.push(prev[j-1]-pk*prev[k-j-1]);cur.push(pk);prev=cur;out.push(pk)}return out}
const chi2inv=(p,k)=>{let lo=0,hi=Math.max(50,k*6);for(let i=0;i<60;i++){const m=(lo+hi)/2;P.chi2cdf(m,k)<p?lo=m:hi=m}return(lo+hi)/2};
const half=r=>r>0&&r<1?Math.log(.5)/Math.log(r):Infinity;
const fh=v=>Number.isFinite(v)?f(v,1):'∞';
const lagBars=(vals,color)=>vals.map((v,i)=>[i+1,v,color]);

/* ================= S01 · cap. 1 — ruído branco × passeio aleatório ================= */
P.sim('sim-ts-rw',{
 tag:'Simulador S01 · ruído branco e passeio aleatório',
 title:'A variância que cresce com o tempo: ruído branco × passeio aleatório',
 lede:'Duzentas trajetórias usam exatamente os mesmos choques. No ruído branco cada valor esquece o anterior; no passeio aleatório os choques se acumulam e a dispersão entre trajetórias cresce como σ√t. Aperte “Deixar o tempo correr” para ver o cone se abrir.',
 controls:[
  {k:'proc',type:'seg',label:'Processo',options:['Ruído branco','Passeio aleatório'],value:1},
  {k:'s',label:'σ · desvio-padrão do choque',min:.5,max:3,step:.1,value:1,fmt:v=>f(v,1),tip:'Escala de cada inovação ε<sub>t</sub>.'},
  {k:'mu',label:'μ · deriva por período',min:-.3,max:.3,step:.01,value:0,fmt:v=>P.sgn(v,2),tip:'No passeio, a deriva vira tendência linear μt; no ruído branco, apenas desloca a média.'}],
 play:{label:'▶ Deixar o tempo correr',dur:6000},
 kpis:[{k:'v',label:'Variância teórica em T',color:'c1',tip:'tσ² no passeio aleatório; σ² no ruído branco (T = 200).'},{k:'vs',label:'Variância entre trajetórias',color:'c2',tip:'Variância amostral das 200 trajetórias no último período exibido.'},{k:'r1',label:'Autocorrelação lag 1',color:'c4',tip:'Autocorrelação amostral de lag 1 da trajetória nº 1. Perto de 1 sinaliza raiz unitária.'},{k:'bw',label:'Semiamplitude 95% em T',color:'gold'}],
 charts:[{k:'paths',title:'24 de 200 trajetórias e cone teórico de 95%'},{k:'var',title:'Variância entre trajetórias × teoria'}],
 model(p,memo){
  const T=200,M=200,rw=p.proc===1,key=p.proc+'|'+p.s+'|'+p.mu;
  if(memo.key!==key){const z=Z(101,T*M),cur=new Float64Array(M),paths=Array.from({length:24},()=>[]),vs=[],p1=[];
   for(let t=1;t<=T;t++){let s1=0,s2=0;for(let i=0;i<M;i++){const e=p.s*z[i*T+t-1];cur[i]=rw?cur[i]+p.mu+e:p.mu+e;s1+=cur[i];s2+=cur[i]*cur[i];if(i<24)paths[i].push(cur[i])}const m=s1/M;vs.push((s2/M-m*m)*M/(M-1))}
   memo.key=key;memo.paths=paths;memo.vs=vs;memo.r1=P.acf(paths[0],1)[0][1]}
  const show=Math.max(2,Math.round(p.t*T)),vt=t=>rw?p.s*p.s*t:p.s*p.s,mean=t=>rw?p.mu*t:p.mu;
  const band=[],vth=[],vsm=[];for(let t=1;t<=T;t++){const sd=Math.sqrt(vt(t));band.push([t,mean(t)-1.96*sd,mean(t)+1.96*sd]);vth.push([t,vt(t)]);vsm.push([t,t<=show?memo.vs[t-1]:NaN])}
  const series=[{type:'band',name:'cone teórico 95%',data:band,color:'c1',a:.14},...memo.paths.map((pa,i)=>({data:pa.map((v,j)=>[j+1,j<show?v:NaN]),color:P.alpha('c2',i?.32:.95),w:i?1:2,hover:i===0,name:i?undefined:'trajetória 1'})),{name:'média teórica',data:band.map(b=>[b[0],(b[1]+b[2])/2]),color:'gold',dash:[5,4],w:1.4}];
  const T0=show,bw=1.96*Math.sqrt(vt(T));
  return{kpi:{v:f(vt(T),1),vs:{v:f(memo.vs[T0-1],1),s:`em t = ${T0}; teoria ${f(vt(T0),1)}`},r1:{v:f(memo.r1,3),s:rw?'memória longa: raiz unitária':'sem memória'},bw:'± '+f(bw,1)},
   charts:{paths:{x:{min:1,max:T,label:'t',name:'t',fmt:v=>f(v,0)},y:{fmt:v=>f(v,0)},series},
    var:{x:{min:1,max:T,label:'t',name:'t',fmt:v=>f(v,0)},y:{min:0,fmt:v=>f(v,0)},series:[{name:'teórica',data:vth,color:'c4',dash:[5,4],w:1.6},{name:'amostral (200 trajetórias)',data:vsm,color:'c1',w:2.4,end:p.t<1}]}},
   eq:rw?`y<sub>t</sub> = y<sub>t−1</sub> + μ + ε<sub>t</sub> ⇒ Var(y<sub>T</sub>) = Tσ² = 200 × ${n(p.s,1)}² = ${n(vt(T),1)} · banda ±1,96σ√T = ±${n(bw,1)}`:`y<sub>t</sub> = μ + ε<sub>t</sub> ⇒ Var(y<sub>t</sub>) = σ² = ${n(p.s*p.s,2)} para todo t · banda ±1,96σ = ±${n(bw,2)}`,
   take:rw?`Após ${T} períodos, a incerteza do passeio é √${T} ≈ ${f(Math.sqrt(T),1)} vezes a de um único choque. Nenhuma média amostral de uma trajetória estima “a média” do processo: ele não é estacionário.`:'O ruído branco tem a mesma dispersão em qualquer t e r<sub>1</sub> ≈ 0: não há nada a prever linearmente além da média. É o padrão que os resíduos de um bom modelo devem imitar.'};
 }
});

/* ================= S02 · cap. 2 — decomposição clássica ================= */
P.sim('sim-ts-decomp',{
 tag:'Simulador S02 · decomposição e suavização',
 title:'Decomposição clássica: tendência por média móvel, índices sazonais e resíduo',
 lede:'Série mensal sintética de 10 anos (tendência + duas harmônicas de período 12 + ruído). A tendência é estimada por média móvel centrada; os índices sazonais são médias dos desvios por mês. Troque a janela para ver a sazonalidade “vazar” para a tendência quando o filtro não cobre um ciclo completo.',
 controls:[
  {k:'win',type:'seg',label:'Janela da média móvel',options:['2×12 (um ciclo)','9 meses','25 meses'],value:0,tip:'Só a média 2×12 anula exatamente uma sazonalidade de período 12.'},
  {k:'b',label:'Inclinação da tendência',min:-.5,max:1,step:.05,value:.3,fmt:v=>P.sgn(v,2)+'/mês'},
  {k:'A',label:'Amplitude sazonal',min:0,max:20,step:1,value:10,fmt:v=>f(v,0)},
  {k:'s',label:'σ · ruído',min:0,max:10,step:.5,value:3,fmt:v=>f(v,1)}],
 kpis:[{k:'fs',label:'Força sazonal',color:'c1',tip:'1 − Var(R)/Var(S+R): perto de 1 indica sazonalidade dominante (Wang, Smith e Hyndman, 2006).'},{k:'ft',label:'Força da tendência',color:'c2',tip:'1 − Var(R)/Var(T+R).'},{k:'es',label:'Erro do sazonal estimado',color:'gold',tip:'RMSE entre o índice sazonal estimado e o componente sazonal verdadeiro.'},{k:'sr',label:'DP do resíduo',color:'c4',tip:'Compare com o σ verdadeiro do ruído.'}],
 charts:[{k:'obs',title:'Série observada, tendência estimada e verdadeira'},{k:'comp',title:'Sazonal estimado × verdadeiro e resíduo'}],
 model(p){
  const N=120,m=12,z=Z(202,N),win=[12,9,25][p.win],tr=[],se=[],y=[];
  for(let t=0;t<N;t++){const T0=40+p.b*t,S0=p.A*Math.sin(2*Math.PI*t/m)+p.A/3*Math.sin(4*Math.PI*t/m+1);tr.push(T0);se.push(S0);y.push(T0+S0+p.s*z[t])}
  const ma=new Array(N).fill(NaN);
  if(win===12){for(let t=6;t<N-6;t++){let s=.5*y[t-6]+.5*y[t+6];for(let j=-5;j<=5;j++)s+=y[t+j];ma[t]=s/12}}
  else{const h=(win-1)/2;for(let t=h;t<N-h;t++){let s=0;for(let j=-h;j<=h;j++)s+=y[t+j];ma[t]=s/win}}
  const sum=new Array(m).fill(0),cnt=new Array(m).fill(0);for(let t=0;t<N;t++)if(Number.isFinite(ma[t])){sum[t%m]+=y[t]-ma[t];cnt[t%m]++}
  let idx=sum.map((s,j)=>s/cnt[j]);const mi=P.mean(idx);idx=idx.map(v=>v-mi);
  const S=y.map((_,t)=>idx[t%m]),R=y.map((v,t)=>Number.isFinite(ma[t])?v-ma[t]-S[t]:NaN);
  const ok=R.map(Number.isFinite),Rv=R.filter((_,t)=>ok[t]),SR=R.map((r,t)=>r+S[t]).filter((_,t)=>ok[t]),TR=R.map((r,t)=>r+ma[t]).filter((_,t)=>ok[t]);
  const FS=Math.max(0,1-variance(Rv)/variance(SR)),FT=Math.max(0,1-variance(Rv)/variance(TR)),es=Math.sqrt(P.mean(S.map((v,t)=>(v-se[t])**2))),sr=Math.sqrt(variance(Rv));
  const X=t=>t+1;
  return{kpi:{fs:f(FS,2),ft:f(FT,2),es:{v:f(es,2),tone:es>1.5?'bad':null},sr:{v:f(sr,2),s:`σ verdadeiro = ${f(p.s,1)}`}},
   charts:{obs:{x:{min:1,max:N,label:'mês',name:'mês',fmt:v=>f(v,0)},series:[{name:'observado',data:y.map((v,t)=>[X(t),v]),color:'c4',w:1.2},{name:'tendência verdadeira',data:tr.map((v,t)=>[X(t),v]),color:'c2',dash:[5,4],w:1.5},{name:`MM ${['2×12','9','25'][p.win]}`,data:ma.map((v,t)=>[X(t),v]),color:'c1',w:2.6}]},
    comp:{x:{min:1,max:N,label:'mês',name:'mês',fmt:v=>f(v,0)},series:[{name:'resíduo R',type:'bars',data:R.map((v,t)=>[X(t),v]),color:'c4',a:.35,bw:.8},{name:'sazonal verdadeiro',data:se.map((v,t)=>[X(t),v]),color:'c2',dash:[5,4],w:1.4},{name:'sazonal estimado',data:S.map((v,t)=>[X(t),v]),color:'c1',w:2.2}]}},
   eq:`F<sub>S</sub> = 1 − Var(R)/Var(S+R) = 1 − ${n(variance(Rv),2)}/${n(variance(SR),2)} = ${n(FS,3)} · T<sub>t</sub> estimada = ${p.win===0?'(½y<sub>t−6</sub> + y<sub>t−5</sub> + … + y<sub>t+5</sub> + ½y<sub>t+6</sub>)/12':`(1/${win})Σ<sub>|j|≤${(win-1)/2}</sub> y<sub>t+j</sub>`}`,
   take:p.win===0?`Com a média 2×12 a tendência fica limpa e o índice sazonal erra só ${f(es,2)} em RMSE: o filtro cobre exatamente um ciclo.`:`A janela de ${win} meses não cobre um número inteiro de ciclos: parte da sazonalidade vaza para a “tendência” (ondulações na linha amarela) e o índice sazonal fica atenuado (erro ${f(es,2)}).`};
 }
});

/* ================= S03 · cap. 2 — suavização exponencial ================= */
P.sim('sim-ts-hw',{
 tag:'Simulador S03 · suavização exponencial',
 title:'Simples, Holt e Holt-Winters: o que cada equação acrescenta',
 lede:'Série mensal com tendência e sazonalidade; os 72 primeiros meses estimam, os 24 seguintes avaliam. A suavização simples ignora tendência e sazonalidade, Holt acrescenta a inclinação e Holt-Winters o padrão sazonal. Compare com o benchmark ingênuo sazonal na mesma janela.',
 controls:[
  {k:'meth',type:'seg',label:'Método',options:['Simples (α)','Holt (α, β)','Holt-Winters (α, β, γ)'],value:2},
  {k:'a',label:'α · nível',min:.02,max:1,step:.02,value:.3,fmt:v=>f(v,2),tip:'Peso da observação mais recente na atualização do nível.'},
  {k:'b',label:'β · tendência',min:0,max:.5,step:.01,value:.05,fmt:v=>f(v,2),tip:'Suavização da inclinação (Holt, 1957).'},
  {k:'g',label:'γ · sazonalidade',min:0,max:.8,step:.02,value:.2,fmt:v=>f(v,2),tip:'Suavização dos índices sazonais (Winters, 1960).'}],
 kpis:[{k:'r',label:'RMSE teste (24 meses)',color:'c1'},{k:'sn',label:'RMSE ingênuo sazonal',color:'c4'},{k:'mase',label:'MASE',color:'gold',tip:'MAE do teste ÷ MAE do ingênuo sazonal no treino. &lt; 1 vence o benchmark.'},{k:'sg',label:'Erro-padrão um passo (treino)',color:'c2',tip:'s: raiz do erro quadrático médio das previsões um passo à frente no treino.'}],
 charts:[{k:'main',title:'Treino, ajuste um passo à frente, previsão e intervalo de 95%'}],
 model(p){
  const N=96,ntr=72,m=12,z=Z(303,N),y=Array.from({length:N},(_,t)=>50+.4*t+8*Math.sin(2*Math.PI*t/m)+2.5*z[t]);
  const M=p.meth,a=p.a,b=M>=1?p.b:0,g=M===2?p.g:0,y1=y.slice(0,m),m1=P.mean(y1);
  let tr=M>=1?(P.mean(y.slice(m,2*m))-m1)/m:0,l=m1+tr*(m-1)/2;
  const s=M===2?y1.map((v,j)=>v-(m1+tr*(j-(m-1)/2))):new Array(m).fill(0);
  const fit=new Array(N).fill(NaN),e=[];
  for(let t=m;t<ntr;t++){const j=t%m,yh=l+tr+s[j];fit[t]=yh;e.push(y[t]-yh);const ln=a*(y[t]-s[j])+(1-a)*(l+tr);if(M>=1)tr=b*(ln-l)+(1-b)*tr;if(M===2)s[j]=g*(y[t]-ln)+(1-g)*s[j];l=ln}
  const sg=rmse(e),fc=[],band=[],et=[],esn=[],snv=[];
  for(let h=1;h<=N-ntr;h++){const t=ntr-1+h,yh=l+h*tr+s[t%m];let v=1;for(let j=1;j<h;j++){const c=a+a*b*j+(M===2&&j%m===0?g*(1-a):0);v+=c*c}const hw=1.96*sg*Math.sqrt(v);fc.push([t+1,yh]);band.push([t+1,yh-hw,yh+hw]);et.push(y[t]-yh);const sn=y[ntr-1+h-m*Math.ceil(h/m)];snv.push([t+1,sn]);esn.push(y[t]-sn)}
  let sc=0;for(let t=m;t<ntr;t++)sc+=Math.abs(y[t]-y[t-m]);sc/=ntr-m;
  const R=rmse(et),RS=rmse(esn),MS=mae(et)/sc,names=['simples','Holt','Holt-Winters'];
  return{kpi:{r:{v:f(R,2),tone:R<RS?'good':'bad'},sn:f(RS,2),mase:{v:f(MS,2),tone:MS<1?'good':'bad'},sg:f(sg,2)},
   charts:{main:{x:{min:1,max:N,label:'mês',name:'mês',fmt:v=>f(v,0)},shade:[{x0:ntr+.5,x1:N+.5,color:'c2',a:.08,label:'teste'}],
    series:[{type:'band',name:'IP 95%',data:band,color:'c1',a:.2},{name:'observado',data:y.map((v,t)=>[t+1,v]),color:'c4',w:1.3},{name:'ajuste um passo',data:fit.map((v,t)=>[t+1,v]),color:'c2',w:1.5},{name:'ingênuo sazonal',data:snv,color:'c4',dash:[3,4],w:1.2},{name:`previsão ${names[M]}`,data:fc,color:'c1',w:2.6}]}},
   eq:`ℓ<sub>T</sub> = ${n(l,2)} · b<sub>T</sub> = ${n(tr,3)} · ŷ<sub>T+h</sub> = ℓ<sub>T</sub> + h·b<sub>T</sub>${M===2?' + s<sub>T+h−m</sub>':''} ⇒ ŷ<sub>T+1</sub> = ${n(fc[0][1],2)} · Var(e<sub>h</sub>) = s²[1 + Σ<sub>j&lt;h</sub>(α + αβj${M===2?' + γ(1−α)·1[j=m]':''})²]`,
   take:M===0?`A suavização simples projeta uma linha plana em ${f(l,1)}: ignora a tendência e a sazonalidade, e perde para o ingênuo sazonal (RMSE ${f(R,1)} × ${f(RS,1)}).`:M===1?`Holt acompanha a inclinação, mas a sazonalidade fica no erro: o RMSE (${f(R,1)}) ainda reflete as oscilações de período 12.`:(R<RS?`Holt-Winters vence o ingênuo sazonal (MASE ${f(MS,2)}): nível, inclinação e padrão sazonal são atualizados juntos.`:`Com esses parâmetros, Holt-Winters não supera o benchmark ingênuo sazonal (MASE ${f(MS,2)}). Suavizar demais ou de menos custa caro — escolha α, β e γ por validação, não no teste.`)};
 }
});

/* ================= S04 · cap. 9 — Dickey-Fuller por Monte Carlo ================= */
P.sim('sim-ts-df',{
 tag:'Simulador S04 · raiz unitária',
 title:'Dickey-Fuller por Monte Carlo: por que o t da raiz unitária não é normal',
 lede:'400 séries AR(1) com o mesmo ρ. Em cada uma, regredimos Δy<sub>t</sub> em constante e y<sub>t−1</sub> e guardamos a estatística t de γ. Com ρ = 1 a distribuição se desloca para a esquerda: usar o valor crítico da normal (−1,645) rejeita a raiz unitária com frequência muito maior que 5%.',
 controls:[
  {k:'rho',label:'ρ · coeficiente AR(1)',min:.8,max:1,step:.01,value:1,fmt:v=>f(v,2),tip:'ρ = 1: raiz unitária (H<sub>0</sub> verdadeira). ρ &lt; 1: estacionário — a rejeição mede o poder do teste.'},
  {k:'T',label:'T · tamanho de cada série',min:50,max:500,step:50,value:100,fmt:v=>f(v,0)}],
 kpis:[{k:'rd',label:'Rejeição com crítico DF (−2,86)',color:'c1',tip:'Proporção de séries com τ &lt; −2,86. É o tamanho do teste se ρ = 1 e o poder se ρ &lt; 1.'},{k:'rn',label:'Rejeição com crítico normal (−1,645)',color:'c3',tip:'Usar a tabela errada.'},{k:'q5',label:'Quantil 5% simulado',color:'gold',sub:'da estatística τ'},{k:'mt',label:'Média simulada',color:'c2',sub:'da estatística τ'}],
 charts:[{k:'h',title:'Distribuição simulada da estatística de Dickey-Fuller × normal padrão'}],
 note:'Valores críticos assintóticos de MacKinnon para o modelo com constante: −3,43 (1%), −2,86 (5%), −2,57 (10%). Sem lags de Δy (Dickey-Fuller simples); com erros autocorrelacionados, use o ADF aumentado.',
 model(p,memo){
  const key=p.rho+'|'+p.T;
  if(memo.key!==key){const R=400,Tm=500,z=Z(404,R*Tm),T=p.T,rho=p.rho,ts=[];
   for(let r=0;r<R;r++){const o=r*Tm;let y=rho<1?z[o]/Math.sqrt(1-rho*rho):0,Sx=0,Sy=0,Sxx=0,Sxy=0,Syy=0;
    for(let t=1;t<T;t++){const yn=rho*y+z[o+t],dy=yn-y;Sx+=y;Sy+=dy;Sxx+=y*y;Sxy+=y*dy;Syy+=dy*dy;y=yn}
    const N=T-1,mx=Sx/N,my=Sy/N,sxx=Sxx-N*mx*mx,sxy=Sxy-N*mx*my,g=sxy/sxx,sse=Syy-N*my*my-g*sxy;ts.push(g/Math.sqrt(sse/(N-2)/sxx))}
   memo.key=key;memo.ts=ts;memo.sorted=[...ts].sort((a,b)=>a-b)}
  const ts=memo.ts,R=ts.length,rd=ts.filter(v=>v<-2.86).length/R,rn=ts.filter(v=>v<-1.645).length/R,q5=P.quantile(memo.sorted,.05),bins=46,lo=-7,hi=3.35,w=(hi-lo)/bins;
  const hs=P.hist(ts.map(v=>P.clamp(v,lo,hi-1e-9)),bins,lo,hi).map(([x,c])=>[x,c/(R*w)]),nd=P.linspace(lo,hi,120).map(x=>[x,P.npdf(x)]),H0=p.rho===1;
  return{kpi:{rd:{v:pct(rd,1),s:H0?'tamanho (nominal 5%)':'poder do teste',tone:H0?(Math.abs(rd-.05)<.03?'good':'bad'):(rd>.5?'good':null)},rn:{v:pct(rn,1),s:H0?'tabela errada: distorção':'rejeições',tone:H0&&rn>.1?'bad':null},q5:f(q5,2),mt:f(P.mean(ts),2)},
   charts:{h:{x:{min:lo,max:hi,label:'τ',name:'τ',fmt:v=>f(v,1)},y:{min:0,fmt:v=>f(v,2)},series:[{name:`τ simulado (ρ = ${f(p.rho,2)}, T = ${p.T})`,type:'bars',data:hs,color:'c1',a:.7,bw:w*.92},{name:'N(0,1)',data:nd,color:'c4',dash:[5,4],w:1.6}],
    marks:[{x:-2.86,label:'DF 5%: −2,86',color:'gold',name:'crítico Dickey-Fuller'},{x:-1.645,label:'N 5%: −1,645',color:'c3',ly:24,name:'crítico normal'}]}},
   eq:`Δy<sub>t</sub> = a + γy<sub>t−1</sub> + e<sub>t</sub>, γ = ρ − 1 = ${n(p.rho-1,2)} · τ = estatística t de γ · P(τ &lt; −2,86) = ${n(rd*100,1,'%')} · P(τ &lt; −1,645) = ${n(rn*100,1,'%')}`,
   take:H0?`Sob raiz unitária, a tabela normal rejeitaria H<sub>0</sub> em ${pct(rn,0)} das séries — ${f(rn/.05,1)}× o nível nominal. O valor crítico de Dickey-Fuller devolve o tamanho para ≈ ${pct(rd,0)}.`:`Com ρ = ${f(p.rho,2)} e T = ${p.T}, o teste detecta a estacionariedade em ${pct(rd,0)} das séries. Perto de 1 o poder é baixo: “não rejeitar” não prova raiz unitária.`};
 }
});

/* ================= S05 · cap. 9 — regressão espúria ================= */
P.sim('sim-ts-spurious',{
 tag:'Simulador S05 · regressão espúria',
 title:'Dois passeios aleatórios independentes e um R² enganoso',
 lede:'Cada réplica gera dois passeios aleatórios independentes e regride y em x. Em níveis, o teste t rejeita “β = 0” na maioria das vezes, embora não exista relação alguma (Granger e Newbold, 1974). Em diferenças, o teste volta a ter tamanho correto. Aperte o botão para ver as réplicas se acumularem.',
 controls:[
  {k:'mode',type:'seg',label:'Regressão em',options:['Níveis (I(1))','Primeiras diferenças'],value:0},
  {k:'T',label:'T · observações por réplica',min:50,max:400,step:25,value:200,fmt:v=>f(v,0),tip:'Em níveis, aumentar T piora: a estatística t cresce como √T.'}],
 play:{label:'▶ Acumular 300 réplicas',dur:7000},
 kpis:[{k:'rej',label:'% com |t| &gt; 1,96',color:'c3',tip:'Deveria ser 5% se o teste fosse válido.'},{k:'r2',label:'R² mediano',color:'c1'},{k:'dw',label:'Durbin-Watson mediano',color:'c2',tip:'Regra prática de Granger-Newbold: R² &gt; DW indica regressão espúria.'},{k:'cur',label:'Réplica exibida',color:'c4'}],
 charts:[{k:'pair',title:'Par exibido: y e x independentes'},{k:'h',title:'Distribuição da estatística t da inclinação nas réplicas'}],
 model(p,memo){
  const key=p.mode+'|'+p.T;
  if(memo.key!==key){const R=300,Tm=400,T=p.T,zx=Z(505,R*Tm),zy=Z(506,R*Tm),lev=p.mode===0,res=[];
   for(let r=0;r<R;r++){const o=r*Tm,x=new Float64Array(T),y=new Float64Array(T);let ax=0,ay=0;for(let t=0;t<T;t++){ax+=zx[o+t];ay+=zy[o+t];x[t]=lev?ax:zx[o+t];y[t]=lev?ay:zy[o+t]}
    let mx=0,my=0;for(let t=0;t<T;t++){mx+=x[t];my+=y[t]}mx/=T;my/=T;let sxx=0,sxy=0,syy=0;for(let t=0;t<T;t++){const a=x[t]-mx,b=y[t]-my;sxx+=a*a;sxy+=a*b;syy+=b*b}
    const b=sxy/sxx,sse=syy-b*sxy,se=Math.sqrt(sse/(T-2)/sxx);let num=0,ep=0;for(let t=0;t<T;t++){const e=y[t]-my-b*(x[t]-mx);if(t)num+=(e-ep)**2;ep=e}
    res.push({t:b/se,r2:1-sse/syy,dw:num/sse,x:r<12||r%25===0?Array.from(x):null,y:r<12||r%25===0?Array.from(y):null})}
   memo.key=key;memo.res=res}
  const R=memo.res.length,show=Math.max(1,Math.round(p.t*R)),sub=memo.res.slice(0,show),lev=p.mode===0;
  let k=show-1;while(!memo.res[k].x)k--;const cur=memo.res[k];
  const rej=sub.filter(r=>Math.abs(r.t)>1.96).length/show,med=a=>P.quantile([...a].sort((x,y)=>x-y),.5),r2=med(sub.map(r=>r.r2)),dw=med(sub.map(r=>r.dw));
  const lim=lev?Math.max(10,Math.ceil(Math.sqrt(p.T)*2.2)):5,bins=40,w=2*lim/bins,hs=P.hist(sub.map(r=>P.clamp(r.t,-lim,lim-1e-9)),bins,-lim,lim).map(([x,c])=>[x,c]);
  return{kpi:{rej:{v:pct(rej,1),tone:rej>.1?'bad':'good',s:`de ${show} réplicas`},r2:f(r2,3),dw:{v:f(dw,2),tone:r2>dw?'bad':'good',s:r2>dw?'R² &gt; DW: alerta':'resíduo sem persistência'},cur:{v:`nº ${k+1}`,s:`t = ${f(cur.t,2)} · R² = ${f(cur.r2,2)}`}},
   charts:{pair:{x:{min:1,max:p.T,label:'t',name:'t',fmt:v=>f(v,0)},series:[{name:'y',data:cur.y.map((v,i)=>[i+1,v]),color:'c1',w:1.8},{name:'x',data:cur.x.map((v,i)=>[i+1,v]),color:'c2',w:1.8}]},
    h:{x:{min:-lim,max:lim,label:'estatística t da inclinação',name:'t',fmt:v=>f(v,0)},y:{min:0,fmt:v=>f(v,0)},series:[{name:'réplicas',type:'bars',data:hs,color:lev?'c3':'c2',a:.7,bw:w*.9}],marks:[{x:-1.96,label:'−1,96',color:'gold'},{x:1.96,label:'+1,96',color:'gold',ly:24,name:'região de não rejeição'}]}},
   eq:`y<sub>t</sub> = a + βx<sub>t</sub> + u<sub>t</sub>, β verdadeiro = 0 · réplica nº ${k+1}: t da inclinação = ${n(cur.t,2)} · R² = ${n(cur.r2,3)} · DW = ${n(cur.dw,3)} · P(|t| &gt; 1,96) = ${n(rej*100,1,'%')}`,
   take:lev?`Em níveis, ${pct(rej,0)} das regressões “acham” uma relação inexistente. O resíduo herda a raiz unitária (DW ≈ ${f(dw,2)}), então os erros-padrão de OLS são inválidos. Antes de regredir níveis, teste raiz unitária e cointegração.`:`Em diferenças as variáveis são estacionárias e a rejeição volta para ≈ ${pct(rej,0)}, próxima do nível nominal de 5%.`};
 }
});

/* ================= S06 · cap. 3–4 — ARMA(1,1): ACF e PACF ================= */
P.sim('sim-ts-arma',{
 tag:'Simulador S06 · identificação ARMA',
 title:'ARMA(1,1): ACF e PACF teóricas × amostrais',
 lede:'Barras: correlações amostrais de uma realização com n observações. Pontos: valores teóricos. Com θ = 0 temos um AR(1) (PACF corta no lag 1); com φ = 0, um MA(1) (ACF corta no lag 1); com ambos, as duas funções decaem. Teste φ = −θ: os fatores se cancelam e o processo vira ruído branco.',
 controls:[
  {k:'phi',label:'φ · parte AR',min:-.95,max:.95,step:.05,value:.7,fmt:v=>f(v,2),tip:'Causal (estacionário) se |φ| &lt; 1.'},
  {k:'th',label:'θ · parte MA',min:-.95,max:.95,step:.05,value:0,fmt:v=>f(v,2),tip:'Invertível se |θ| &lt; 1.'},
  {k:'n',label:'n · observações',min:60,max:600,step:20,value:200,fmt:v=>f(v,0),tip:'A banda ±1,96/√n estreita com n.'}],
 kpis:[{k:'sig',label:'Assinatura teórica',color:'c1'},{k:'r1',label:'Autocorrelação lag 1 · teórica e amostral',color:'c2'},{k:'out',label:'Lags fora da banda (ACF)',color:'gold',tip:'Com 20 lags e ruído branco, espera-se ~1 por acaso.'},{k:'vr',label:'Variância de y ÷ variância do choque',color:'c4',tip:'(1 + 2φθ + θ²)/(1 − φ²).'}],
 charts:[{k:'acf',title:'ACF · barras amostrais, pontos teóricos'},{k:'pacf',title:'PACF · barras amostrais, pontos teóricos'}],
 model(p){
  const N=p.n,z=Z(606,800),burn=150,y=[];let yp=0,ep=0;
  for(let t=0;t<burn+N;t++){const e=z[t],v=p.phi*yp+e+p.th*ep;if(t>=burn)y.push(v);yp=v;ep=e}
  const L=20,sa=P.acf(y,L).map(d=>d[1]),den=1+2*p.phi*p.th+p.th*p.th,r1=Math.abs(den)<1e-9?0:(1+p.phi*p.th)*(p.phi+p.th)/den,ta=[r1];for(let k=2;k<=L;k++)ta.push(p.phi*ta[k-2]);
  const tp=pacf(ta),sp=pacf(sa),bd=1.96/Math.sqrt(N),out=sa.filter(v=>Math.abs(v)>bd).length;
  const canc=Math.abs(p.phi+p.th)<1e-9,sig=canc?'ruído branco (cancelamento)':Math.abs(p.th)<1e-9?(Math.abs(p.phi)<1e-9?'ruído branco':'AR(1): PACF corta em 1'):Math.abs(p.phi)<1e-9?'MA(1): ACF corta em 1':'ARMA: ambas decaem';
  const mk=(s,t)=>({x:{min:.3,max:L+.7,label:'lag k',name:'lag',fmt:v=>f(v,0)},y:{min:-1,max:1,fmt:v=>f(v,1)},series:[{name:'amostral',type:'bars',data:s.map((v,i)=>[i+1,v,Math.abs(v)>bd?'c1':P.alpha('c1',.45)]),bw:.6},{name:'teórica',type:'dots',data:t.map((v,i)=>[i+1,v]),color:'c4',r:3.5}],marks:[{y:bd,color:'c2',label:'+1,96/√n',name:'banda ±1,96/√n'},{y:-bd,color:'c2'}]});
  return{kpi:{sig,r1:`${f(r1,2)} · ${f(sa[0],2)}`,out:{v:`${out} de ${L}`,tone:canc&&out>3?'bad':null},vr:f((1+2*p.phi*p.th+p.th*p.th)/(1-p.phi*p.phi),2)},
   charts:{acf:mk(sa,ta),pacf:mk(sp,tp)},
   eq:`ρ(1) = (1+φθ)(φ+θ)/(1+2φθ+θ²) = (1 ${p.phi*p.th<0?'−':'+'} ${f(Math.abs(p.phi*p.th),2)})(${n(p.phi+p.th,2)})/${n(den,3)} = ${n(r1,3)} · ρ(k) = φ·ρ(k−1) ⇒ ρ(2) = ${n(ta[1],3)}`,
   take:canc?'Com φ = −θ o polinômio AR e o MA têm a mesma raiz e se cancelam: o “ARMA(1,1)” é ruído branco. Por isso parcimônia e verificação de raízes comuns fazem parte da identificação.':Math.abs(p.th)<1e-9?`AR(1): a ACF decai como ${f(p.phi,2)}ᵏ, mas a PACF só tem o lag 1 relevante — o efeito no lag 2 é indireto, transmitido pelo lag 1.`:Math.abs(p.phi)<1e-9?'MA(1): memória de um único período na ACF; a PACF decai porque inverter o MA gera um AR(∞).':`Com φ e θ não nulos nenhuma das funções corta: os desenhos de ACF/PACF sugerem ordens candidatas, que depois precisam ser comparadas por AIC/BIC e diagnóstico de resíduos.`};
 }
});

/* ================= S07 · cap. 2 e 4 — Ljung-Box nos resíduos ================= */
P.sim('sim-ts-lb',{
 tag:'Simulador S07 · diagnóstico de resíduos',
 title:'Ljung-Box: os resíduos já são ruído branco?',
 lede:'O processo verdadeiro é AR(1). Se o “modelo” for apenas a média, a dependência fica nos resíduos e o teste de Ljung-Box rejeita. Ajuste um AR(1) por mínimos quadrados e veja Q cair abaixo do valor crítico — descontando um grau de liberdade pelo parâmetro estimado.',
 controls:[
  {k:'fit',type:'seg',label:'Modelo ajustado',options:['Só a média','AR(1) por MQ'],value:0},
  {k:'phi',label:'φ verdadeiro',min:0,max:.85,step:.05,value:.4,fmt:v=>f(v,2)},
  {k:'n',label:'n · observações',min:50,max:500,step:25,value:150,fmt:v=>f(v,0)},
  {k:'h',label:'h · lags no teste',min:5,max:30,step:1,value:10,fmt:v=>f(v,0),tip:'Muitos lags diluem o poder; poucos podem perder dependência sazonal.'}],
 kpis:[{k:'q',label:'Q(h) de Ljung-Box',color:'c1'},{k:'df',label:'Graus de liberdade',color:'c4'},{k:'pv',label:'p-valor',color:'c2',tip:'p &lt; 5%: rejeita ruído branco nos resíduos.'},{k:'mx',label:'Maior |r<sub>k</sub>|',color:'gold'}],
 charts:[{k:'acf',title:'ACF dos resíduos'},{k:'q',title:'Q(h) acumulado × valor crítico χ² 95%'}],
 model(p){
  const N=p.n,z=Z(707,700),y=[];let v=0;for(let t=0;t<N+80;t++){v=p.phi*v+z[t];if(t>=80)y.push(v)}
  let res,k;if(p.fit===0){const m=P.mean(y);res=y.map(x=>x-m);k=0}else{const o=P.ols(y.slice(1).map((_,i)=>[1,y[i]]),y.slice(1));res=o.resid;k=1}
  const M=res.length,r=P.acf(res,30).map(d=>d[1]),Q=[];let s=0;for(let j=1;j<=30;j++){s+=r[j-1]*r[j-1]/(M-j);Q.push(M*(M+2)*s)}
  const H=p.h,df=H-k,q=Q[H-1],pv=1-P.chi2cdf(q,df),bd=1.96/Math.sqrt(M),mx=Math.max(...r.slice(0,H).map(Math.abs));
  const crit=Q.map((_,i)=>[i+1,i+1-k>=1?chi2inv(.95,i+1-k):NaN]);
  return{kpi:{q:f(q,2),df:String(df),pv:{v:pv<.001?'<0,1%':pct(pv,1),tone:pv<.05?'bad':'good',s:pv<.05?'rejeita ruído branco':'não rejeita'},mx:f(mx,3)},
   charts:{acf:{x:{min:.3,max:30.7,label:'lag k',name:'lag',fmt:v=>f(v,0)},y:{min:-.6,max:.8,fmt:v=>f(v,1)},series:[{name:'autocorrelação dos resíduos',type:'bars',data:r.map((v,i)=>[i+1,v,i<H?(Math.abs(v)>bd?'c1':P.alpha('c1',.5)):P.alpha('c4',.25)]),bw:.6}],marks:[{y:bd,color:'c2',label:'±1,96/√n',name:'banda'},{y:-bd,color:'c2'},{x:H+.5,color:'gold',label:`h = ${H}`}]},
    q:{x:{min:1,max:30,label:'h',name:'h',fmt:v=>f(v,0)},y:{min:0,fmt:v=>f(v,0)},series:[{name:'Q(h)',data:Q.map((v,i)=>[i+1,v]),color:'c1',w:2.4},{name:'crítico χ²(h−k) 95%',data:crit,color:'c4',dash:[5,4],w:1.6},{name:'h escolhido',type:'dots',data:[[H,q]],color:pv<.05?'bad':'good',r:6}]}},
   eq:`Q(${H}) = n(n+2)Σ<sub>k=1</sub><sup>${H}</sup> r<sub>k</sub>²/(n−k) = ${n(M,0)}·${n(M+2,0)}·${n(Q[H-1]/(M*(M+2)),5)} = ${n(q,2)} · χ²<sub>${df}</sub>(95%) = ${n(chi2inv(.95,df),2)} → p = ${pv<.001?n('<0,1%'):n(pv*100,1,'%')}`,
   take:p.fit===0?(pv<.05?`A média não captura a memória do AR(${f(p.phi,2)}): r<sub>1</sub> = ${f(r[0],2)} e o teste rejeita. Os resíduos ainda têm algo a prever.`:'Com φ pequeno e poucos dados, o teste não detecta a dependência — falta poder, não prova de ruído branco.'):(pv<.05?'Mesmo com o AR(1), o teste rejeita nesta amostra: verifique ordem, sazonalidade ou quebras.':`Com o AR(1) ajustado os resíduos passam no teste (p = ${pct(pv,0)}). Note os ${df} graus de liberdade: um a menos pelo parâmetro estimado.`)};
 }
});

/* ================= S08 · cap. 4 — seleção de ordem por AIC/BIC ================= */
P.sim('sim-ts-aic',{
 tag:'Simulador S08 · determinação de ordem',
 title:'AIC × BIC: escolhendo p em um AR(p) estimado por mínimos quadrados',
 lede:'Os dados vêm de um AR(2). Estimamos AR(0) a AR(10) na mesma amostra efetiva e comparamos os critérios. O AIC penaliza 2 por parâmetro; o BIC penaliza ln n, mais severo. Mude a semente: com n pequeno, o AIC às vezes escolhe ordens maiores que a verdadeira.',
 controls:[
  {k:'f1',label:'φ<sub>1</sub> verdadeiro',min:-.9,max:1.5,step:.05,value:.5,fmt:v=>f(v,2)},
  {k:'f2',label:'φ<sub>2</sub> verdadeiro',min:-.9,max:.6,step:.05,value:.3,fmt:v=>f(v,2),tip:'Estacionário se φ<sub>1</sub>+φ<sub>2</sub> &lt; 1, φ<sub>2</sub>−φ<sub>1</sub> &lt; 1 e |φ<sub>2</sub>| &lt; 1.'},
  {k:'n',label:'n · observações',min:60,max:600,step:20,value:120,fmt:v=>f(v,0)},
  {k:'seed',label:'Amostra (semente)',min:1,max:30,step:1,value:3,fmt:v=>'#'+f(v,0)}],
 kpis:[{k:'pa',label:'Ordem escolhida · AIC',color:'c1'},{k:'pb',label:'Ordem escolhida · BIC',color:'c2'},{k:'est',label:'Coeficientes estimados do AR(2)',color:'c4',sub:'φ<sub>1</sub> · φ<sub>2</sub> por MQ'},{k:'st',label:'Estacionariedade',color:'gold'}],
 charts:[{k:'ic',title:'ΔAIC e ΔBIC por ordem p (0 = mínimo)'},{k:'tri',title:'Triângulo de estacionariedade do AR(2)'}],
 model(p){
  let f1=p.f1,f2=p.f2;const ok=f1+f2<1&&f2-f1<1&&Math.abs(f2)<1;if(!ok){f2=Math.min(f2,1-f1-.02,1+f1-.02);f2=Math.max(f2,-.98)}
  const N=p.n,z=Z(800+p.seed*7,700),y=[];let a=0,b=0;for(let t=0;t<N+100;t++){const v=f1*a+f2*b+z[t];b=a;a=v;if(t>=100)y.push(v)}
  const K=10,Ne=N-K,yy=y.slice(K),aic=[],bic=[];let est=null;
  for(let q=0;q<=K;q++){const X=yy.map((_,i)=>{const t=i+K,r=[1];for(let j=1;j<=q;j++)r.push(y[t-j]);return r});const o=P.ols(X,yy),s2=o.resid.reduce((s,e)=>s+e*e,0)/Ne;aic.push(Ne*Math.log(s2)+2*(q+1));bic.push(Ne*Math.log(s2)+Math.log(Ne)*(q+1));if(q===2)est=o}
  const am=Math.min(...aic),bm=Math.min(...bic),pa=aic.indexOf(am),pb=bic.indexOf(bm),tp=Math.abs(f2)>1e-9?2:Math.abs(f1)>1e-9?1:0;
  const par=P.linspace(-2,2,81).map(x=>[x,-x*x/4]);
  return{kpi:{pa:{v:`p = ${pa}`,tone:pa===tp?'good':'bad',s:`verdadeira: ${tp}`},pb:{v:`p = ${pb}`,tone:pb===tp?'good':'bad',s:`verdadeira: ${tp}`},est:`${f(est.b[1],2)} · ${f(est.b[2],2)}`,st:{v:ok?'dentro do triângulo':'fora: ajustado',tone:ok?null:'bad',s:ok?(f1*f1+4*f2<0?'raízes complexas: ciclo':'raízes reais'):`simulado com φ<sub>2</sub> = ${f(f2,2)}`}},
   charts:{ic:{x:{min:-.3,max:K+.3,label:'ordem p',name:'p',fmt:v=>f(v,0)},y:{min:0,fmt:v=>f(v,0)},series:[{name:'ΔAIC',data:aic.map((v,i)=>[i,v-am]),color:'c1',w:2.2},{type:'dots',data:aic.map((v,i)=>[i,v-am]),color:'c1',r:3.5,hover:false},{name:'ΔBIC',data:bic.map((v,i)=>[i,v-bm]),color:'c2',w:2.2},{type:'dots',data:bic.map((v,i)=>[i,v-bm]),color:'c2',r:3.5,hover:false}],marks:[{x:pa,label:'AIC',color:'c1'},{x:pb,label:'BIC',color:'c2',ly:24},{x:tp,label:'verdadeira',color:'gold',ly:38}]},
    tri:{x:{min:-2.1,max:2.1,label:'φ₁',name:'φ₁',fmt:v=>f(v,1)},y:{min:-1.1,max:1.1,fmt:v=>f(v,1)},series:[{type:'seg',data:[[-2,-1,2,-1],[2,-1,0,1],[0,1,-2,-1]],color:'c4',w:1.6},{name:'φ₁² + 4φ₂ = 0 (fronteira real/complexa)',data:par,color:'c4',dash:[4,4],w:1.1,hover:false},{name:'verdadeiro',type:'dots',data:[[f1,f2]],color:'gold',r:6},{name:'estimado (AR(2))',type:'dots',data:[[est.b[1],est.b[2]]],color:'c1',r:5}]}},
   eq:`AIC(p) = n ln s²<sub>p</sub> + 2(p+1) · BIC(p) = n ln s²<sub>p</sub> + (p+1) ln n, n = ${Ne}, ln n = ${n(Math.log(Ne),2)} · AIC(${pa}) = ${n(am,1)} · BIC(${pb}) = ${n(bm,1)}`,
   take:pa===pb?`Os dois critérios concordam em p = ${pa}${pa===tp?', a ordem verdadeira':` (verdadeira: ${tp})`}. A penalidade do BIC (${f(Math.log(Ne),1)} por parâmetro) só passa a importar quando o ganho de ajuste é marginal.`:`AIC escolhe p = ${pa}, BIC escolhe p = ${pb}. O AIC mira desempenho preditivo e aceita parâmetros extras; o BIC é consistente para a ordem verdadeira. Valide fora da amostra antes de decidir.`};
 }
});

/* ================= S09 · cap. 4–5 — leque de previsão ARIMA ================= */
P.sim('sim-ts-fan',{
 tag:'Simulador S09 · previsão ARIMA',
 title:'O leque de previsão: ARIMA(1,0,0) × ARIMA(1,1,0)',
 lede:'A mesma estrutura AR(1) aplicada ao nível (d = 0) ou à primeira diferença (d = 1). No caso estacionário o intervalo converge para a variância incondicional; com raiz unitária ele cresce sem limite, porque cada choque futuro é permanente.',
 controls:[
  {k:'d',type:'seg',label:'Ordem de integração',options:['d = 0 · estacionário','d = 1 · integrado'],value:0},
  {k:'phi',label:'φ · AR(1)',min:-.8,max:.95,step:.05,value:.6,fmt:v=>f(v,2)},
  {k:'s',label:'σ · choque',min:.5,max:3,step:.1,value:1,fmt:v=>f(v,1)},
  {k:'H',label:'H · horizonte',min:6,max:48,step:2,value:24,fmt:v=>f(v,0)+' passos'}],
 play:{label:'▶ Abrir o leque',dur:4500},
 kpis:[{k:'h1',label:'±IP 95% em h = 1',color:'c2'},{k:'hH',label:'±IP 95% em h = H',color:'c1'},{k:'lim',label:'Limite quando h → ∞',color:'gold'},{k:'ps',label:'Peso do choque mais antigo',color:'c4',tip:'ψ<sub>H−1</sub>: peso do primeiro choque futuro no erro do último passo.'}],
 charts:[{k:'f',title:'Últimas 60 observações, previsão pontual e intervalos de 80% e 95%'}],
 model(p){
  const n0=120,z=Z(909,400),mu=10,d=p.d,phi=p.phi,s=p.s,y=[];let a=mu,w=0;
  for(let t=0;t<n0+60;t++){const e=s*z[t];if(d===0){a=mu+phi*(a-mu)+e}else{w=phi*w+e;a+=w}if(t>=60)y.push(a)}
  const T=y.length,yT=y[T-1],wT=y[T-1]-y[T-2],H=p.H,hs=Math.max(1,Math.round(p.t*H)),psi=[];
  for(let j=0;j<H;j++)psi.push(d===0?phi**j:(Math.abs(1-phi)<1e-9?j+1:(1-phi**(j+1))/(1-phi)));
  const fc=[],b80=[],b95=[];let v=0;
  for(let h=1;h<=H;h++){v+=psi[h-1]**2;const m=d===0?mu+phi**h*(yT-mu):yT+wT*(Math.abs(1-phi)<1e-9?h:phi*(1-phi**h)/(1-phi)),sd=s*Math.sqrt(v),x=T+h,on=h<=hs;
   fc.push([x,on?m:NaN]);b80.push([x,on?m-1.2816*sd:NaN,on?m+1.2816*sd:NaN]);b95.push([x,on?m-1.96*sd:NaN,on?m+1.96*sd:NaN])}
  const hw1=1.96*s,hwH=1.96*s*Math.sqrt(v),lim=d===0?1.96*s/Math.sqrt(1-phi*phi):Infinity,hist=y.slice(T-60).map((u,i)=>[T-59+i,u]);
  return{kpi:{h1:'± '+f(hw1,2),hH:{v:'± '+f(hwH,2),s:`${f(hwH/hw1,1)}× o de h = 1`},lim:{v:d===0?'± '+f(lim,2):'∞ (cresce ≈ √h)',tone:d===1?'bad':null},ps:f(psi[H-1],3)},
   charts:{f:{x:{min:T-59,max:T+H+1,label:'t',name:'t',fmt:v=>f(v,0)},series:[{type:'band',name:'IP 95%',data:b95,color:'c1',a:.16},{type:'band',name:'IP 80%',data:b80,color:'c1',a:.28},{name:'histórico',data:hist,color:'c4',w:1.5},{name:'previsão',data:fc,color:'c1',w:2.6}],marks:[{x:T+.5,color:'c2',label:'origem T'}]}},
   eq:`Var(e<sub>T+h</sub>) = σ²Σ<sub>j=0</sub><sup>h−1</sup>ψ<sub>j</sub>², ψ<sub>j</sub> = ${d===0?'φ<sup>j</sup>':'(1−φ<sup>j+1</sup>)/(1−φ)'} ⇒ Var(e<sub>T+${H}</sub>) = ${n(s,1)}² × ${n(v,2)} = ${n(s*s*v,2)}`,
   take:d===0?`Estacionário: depois de ~${Math.abs(phi)<.05?1:f(Math.max(1,half(Math.abs(phi))*3),0)} passos a previsão volta à média ${mu} e o intervalo se estabiliza em ±${f(lim,2)}. Prever longe equivale a prever a média.`:`Integrado: o intervalo em h = ${H} é ${f(hwH/hw1,1)}× o de um passo e continua crescendo. A tendência estocástica torna a incerteza de longo prazo ilimitada.`};
 }
});

/* ================= S10 · cap. 6 — GARCH(1,1) ================= */
P.sim('sim-ts-garch',{
 tag:'Simulador S10 · volatilidade condicional',
 title:'GARCH(1,1): agrupamento de volatilidade e estrutura a termo da previsão',
 lede:'Retornos diários r<sub>t</sub> = σ<sub>t</sub>z<sub>t</sub> com choques normais fixos. α controla a reação a notícias, β a memória. A previsão de volatilidade converge geometricamente, à taxa α + β, para o nível de longo prazo — o mesmo ponto para onde ela volta depois de um choque de 3σ.',
 controls:[
  {k:'a',label:'α · reação ao choque',min:.01,max:.3,step:.01,value:.08,fmt:v=>f(v,2)},
  {k:'b',label:'β · persistência da variância',min:.5,max:.98,step:.01,value:.9,fmt:v=>f(v,2)},
  {k:'vol',label:'Volatilidade de longo prazo (a.a.)',min:10,max:60,step:1,value:20,fmt:v=>f(v,0)+'%'}],
 play:{label:'▶ Simular 500 pregões',dur:6500},
 kpis:[{k:'pe',label:'Persistência',color:'c1',tip:'α + β. Se ≥ 1, variância incondicional infinita (IGARCH).'},{k:'hl',label:'Meia-vida do choque',color:'c2',tip:'ln 0,5 / ln(α+β) dias.'},{k:'ku',label:'Curtose dos retornos',color:'gold',tip:'Amostral; a normal tem 3. GARCH gera caudas pesadas mesmo com choques normais.'},{k:'vh',label:'Vol. prevista amanhã (a.a.)',color:'c4'}],
 charts:[{k:'r',title:'Retornos diários (%) e banda de ±2 desvios condicionais'},{k:'ts',title:'Estrutura a termo da volatilidade prevista (% a.a.)'}],
 model(p){
  const N=500,z=Z(1010,N),sL2=(p.vol/100)**2/252,pe=p.a+p.b,om=pe<1?sL2*(1-pe):sL2*.002;
  let s2=sL2;const r=[],sg=[];for(let t=0;t<N;t++){const s=Math.sqrt(s2),rt=s*z[t];r.push(rt);sg.push(s);s2=om+p.a*rt*rt+p.b*s2}
  const show=Math.max(2,Math.round(p.t*N)),m=P.mean(r),v=variance(r),ku=P.mean(r.map(x=>(x-m)**4))/(v*v),kt=1-pe*pe-2*p.a*p.a>0?3*(1-pe*pe)/(1-pe*pe-2*p.a*p.a):Infinity;
  const sh=om+p.a*(3*sg[N-1])**2+p.b*sg[N-1]**2,fc=(x,h)=>pe<1?sL2+pe**(h-1)*(x-sL2):x+(h-1)*om,an=x=>Math.sqrt(252*x)*100;
  const H=80,ts1=[],ts2=[];for(let h=1;h<=H;h++){ts1.push([h,an(fc(s2,h))]);ts2.push([h,an(fc(sh,h))])}
  const hl=half(pe);
  return{kpi:{pe:{v:f(pe,3),tone:pe>=.99?'bad':null,s:pe>=1?'α + β ≥ 1: sem reversão':'α + β · reverte à média'},hl:{v:Number.isFinite(hl)?f(hl,1)+' dias':'∞',s:pe<1?`choque cai à metade`:''},ku:{v:f(ku,2),s:`teórica ${Number.isFinite(kt)?f(kt,2):'∞'} · normal = 3`},vh:f(an(s2),1)+'%'},
   charts:{r:{x:{min:1,max:N,label:'pregão',name:'pregão',fmt:v=>f(v,0)},y:{fmt:v=>f(v,1)},series:[{type:'band',name:'±2 desvios condicionais',data:sg.map((s,t)=>[t+1,t<show?-2*s*100:NaN,t<show?2*s*100:NaN]),color:'c1',a:.16},{name:'retorno',type:'bars',data:r.map((x,t)=>[t+1,t<show?x*100:NaN,Math.abs(x)>2*sg[t]?'c3':P.alpha('c2',.75)]),bw:.8},{data:sg.map((s,t)=>[t+1,t<show?2*s*100:NaN]),color:'c1',w:1.3,hover:false,name:'2σ condicional'}]},
    ts:{x:{min:1,max:H,label:'horizonte h (dias)',name:'h',fmt:v=>f(v,0)},y:{fmt:v=>f(v,0)+'%'},series:[{name:'a partir de hoje',data:ts1,color:'c1',w:2.4},{name:'após choque de 3σ',data:ts2,color:'c2',w:2,dash:[6,4]}],marks:[{y:p.vol,label:`longo prazo ${f(p.vol,0)}%`,color:'gold',name:'volatilidade de longo prazo'}]}},
   eq:`σ<sub>L</sub>² = ω/(1−α−β) · σ<sub>T+h</sub>² = σ<sub>L</sub>² + (α+β)<sup>h−1</sup>(σ<sub>T+1</sub>² − σ<sub>L</sub>²) = ${n(sL2*1e4,3)} + ${n(pe,3)}<sup>h−1</sup>(${n(s2*1e4,3)} − ${n(sL2*1e4,3)}) [×10<sup>−4</sup>] · ω = ${n(om*1e6,3)}×10<sup>−6</sup>`,
   take:pe>=.995?'Com α + β ≈ 1 a volatilidade quase não reverte: um choque de hoje contamina o risco de meses à frente. É o regime em que a regra da raiz do tempo mais erra.':`Um choque se dissipa à metade em ${f(hl,0)} dias. Mesmo com inovações normais, a curtose amostral de ${f(ku,1)} mostra caudas pesadas geradas pela própria dinâmica da variância.`};
 }
});

/* ================= S11 · cap. 6 — curva de impacto de notícias (GJR) ================= */
P.sim('sim-ts-nic',{
 tag:'Simulador S11 · assimetria',
 title:'Curva de impacto de notícias: GARCH simétrico × GJR',
 lede:'Variância do próximo dia em função do choque de hoje (em desvios-padrão), com a variância corrente na média de longo prazo. O termo γ do GJR dá peso extra a choques negativos: o efeito alavancagem. A curva simétrica usa α + γ/2 para manter a mesma persistência.',
 controls:[
  {k:'a',label:'α · choques positivos',min:0,max:.2,step:.01,value:.03,fmt:v=>f(v,2)},
  {k:'g',label:'γ · peso extra de choques negativos',min:0,max:.25,step:.01,value:.12,fmt:v=>f(v,2)},
  {k:'b',label:'β',min:.5,max:.95,step:.01,value:.88,fmt:v=>f(v,2)}],
 kpis:[{k:'ra',label:'Impacto de queda ÷ alta de 2 desvios',color:'c1',tip:'Quanto uma queda de 2σ eleva a variância de amanhã a mais que uma alta de 2σ.'},{k:'pe',label:'Persistência',color:'c2'},{k:'om',label:'Intercepto da variância',color:'c4',sub:'ω, com variância de longo prazo = 1'},{k:'hl',label:'Meia-vida',color:'gold'}],
 charts:[{k:'nic',title:'Variância de amanhã como função do choque de hoje (longo prazo = 1)'}],
 model(p){
  const pe=p.a+p.g/2+p.b,om=1-pe,okp=om>0,xs=P.linspace(-4,4,81),gj=x=>om+(p.a+(x<0?p.g:0))*x*x+p.b,sy=x=>om+(p.a+p.g/2)*x*x+p.b;
  return{kpi:{ra:{v:f(gj(-2)/gj(2),2)+'×',tone:p.g>0?'bad':null},pe:{v:f(pe,3),tone:okp?null:'bad',s:okp?'α + γ/2 + β · estacionário':'ω ≤ 0: inválido'},om:f(om,3),hl:Number.isFinite(half(pe))?f(half(pe),1)+' dias':'∞'},
   charts:{nic:{x:{min:-4,max:4,label:'choque ε_t (em σ)',name:'ε',fmt:v=>f(v,1)},y:{min:0,fmt:v=>f(v,1)},series:[{name:'GJR-GARCH',data:xs.map(x=>[x,gj(x)]),color:'c1',w:2.6},{name:'GARCH simétrico (α + γ/2)',data:xs.map(x=>[x,sy(x)]),color:'c2',w:1.8,dash:[6,4]}],marks:[{x:0,color:'c4',label:'sem notícia'}]}},
   eq:`σ<sub>t+1</sub>² = ω + (α + γ·1[ε&lt;0])ε<sub>t</sub>² + β·1 ⇒ NIC(−2) = ${n(om,3)} + ${n(p.a+p.g,2)}·4 + ${n(p.b,2)} = ${n(gj(-2),3)} · NIC(+2) = ${n(gj(2),3)}`,
   take:p.g>0?`Uma queda de 2σ eleva a variância de amanhã ${f(gj(-2)/gj(2),2)}× mais que uma alta do mesmo tamanho. Um GARCH simétrico erraria a volatilidade justamente depois das quedas.`:'Com γ = 0 as duas curvas coincidem: a resposta da volatilidade não depende do sinal da notícia.'};
 }
});

/* ================= S12 · cap. 7 — VAR(1) e respostas a impulso ================= */
P.sim('sim-ts-var',{
 tag:'Simulador S12 · sistemas multivariados',
 title:'VAR(1) bivariado: estabilidade, Granger e respostas a impulso',
 lede:'Y<sub>t</sub> = AY<sub>t−1</sub> + u<sub>t</sub>, com choques de correlação ρ. As respostas são ortogonalizadas por Cholesky com a ordem (y<sub>1</sub>, y<sub>2</sub>): um choque em y<sub>1</sub> afeta y<sub>2</sub> já no impacto quando ρ ≠ 0, mas não o contrário. a<sub>1</sub><sub>2</sub> ≠ 0 significa que y<sub>2</sub> Granger-causa y<sub>1</sub>.',
 controls:[
  {k:'a11',label:'a<sub>1</sub><sub>1</sub>',min:-.9,max:.95,step:.05,value:.5,fmt:v=>f(v,2)},{k:'a12',label:'a<sub>1</sub><sub>2</sub> · efeito de y<sub>2</sub> sobre y<sub>1</sub>',min:-.9,max:.9,step:.05,value:.3,fmt:v=>f(v,2)},
  {k:'a21',label:'a<sub>2</sub><sub>1</sub> · efeito de y<sub>1</sub> sobre y<sub>2</sub>',min:-.9,max:.9,step:.05,value:0,fmt:v=>f(v,2)},{k:'a22',label:'a<sub>2</sub><sub>2</sub>',min:-.9,max:.95,step:.05,value:.4,fmt:v=>f(v,2)},
  {k:'rho',label:'ρ · correlação dos choques',min:-.8,max:.8,step:.05,value:.3,fmt:v=>f(v,2)},
  {k:'sh',type:'seg',label:'Choque ortogonal em',options:['y<sub>1</sub>','y<sub>2</sub>'],value:0}],
 kpis:[{k:'lm',label:'Maior |autovalor| de A',color:'c1',tip:'&lt; 1: VAR estável (respostas morrem).'},{k:'hl',label:'Meia-vida dominante',color:'c2'},{k:'g21',label:'<span>Granger: y<sub>2</sub> → y<sub>1</sub></span>',color:'c4'},{k:'g12',label:'<span>Granger: y<sub>1</sub> → y<sub>2</sub></span>',color:'gold'}],
 charts:[{k:'irf',title:'Respostas a um choque de 1 desvio-padrão'},{k:'sim',title:'Uma realização do sistema (150 períodos)'}],
 model(p){
  const A=[[p.a11,p.a12],[p.a21,p.a22]],r=p.rho,Pc=[[1,0],[r,Math.sqrt(1-r*r)]],j=p.sh,H=24,tr=p.a11+p.a22,det=p.a11*p.a22-p.a12*p.a21,disc=tr*tr/4-det;
  const lm=disc>=0?Math.max(Math.abs(tr/2+Math.sqrt(disc)),Math.abs(tr/2-Math.sqrt(disc))):Math.sqrt(det),stable=lm<1;
  let v=[Pc[0][j],Pc[1][j]];const i1=[],i2=[];for(let h=0;h<=H;h++){i1.push([h,v[0]]);i2.push([h,v[1]]);v=[A[0][0]*v[0]+A[0][1]*v[1],A[1][0]*v[0]+A[1][1]*v[1]];if(!stable)v=v.map(x=>P.clamp(x,-50,50))}
  const z1=Z(1201,200),z2=Z(1202,200),s1=[],s2=[];let y=[0,0];for(let t=0;t<180;t++){const u1=z1[t],u2=r*z1[t]+Math.sqrt(1-r*r)*z2[t];y=[A[0][0]*y[0]+A[0][1]*y[1]+u1,A[1][0]*y[0]+A[1][1]*y[1]+u2];if(!stable)y=y.map(x=>P.clamp(x,-40,40));if(t>=30){s1.push([t-29,y[0]]);s2.push([t-29,y[1]])}}
  const nz=x=>Math.abs(x)>1e-9;
  return{kpi:{lm:{v:f(lm,3)+(disc<0?' (complexo)':''),tone:stable?'good':'bad',s:stable?'estável':'instável: respostas explodem'},hl:stable?f(half(lm),1)+' períodos':'∞',g21:{v:nz(p.a12)?'sim':'não',s:`a<sub>1</sub><sub>2</sub> = ${f(p.a12,2)}`},g12:{v:nz(p.a21)?'sim':'não',s:`a<sub>2</sub><sub>1</sub> = ${f(p.a21,2)}`}},
   charts:{irf:{x:{min:0,max:H,label:'h',name:'h',fmt:v=>f(v,0)},y:{fmt:v=>f(v,2)},series:[{name:'resposta de y₁',data:i1,color:'c1',w:2.4},{name:'resposta de y₂',data:i2,color:'c2',w:2.4}]},
    sim:{x:{min:1,max:150,label:'t',name:'t',fmt:v=>f(v,0)},series:[{name:'y₁',data:s1,color:'c1',w:1.5},{name:'y₂',data:s2,color:'c2',w:1.5}]}},
   eq:`Θ<sub>h</sub> = A<sup>h</sup>P, P = chol(Σ<sub>u</sub>) · choque em y${j+1}: Θ<sub>0</sub> = (${n(i1[0][1],2)}, ${n(i2[0][1],2)}) → Θ<sub>1</sub> = (${n(i1[1][1],3)}, ${n(i2[1][1],3)}) · λ = ${n(tr/2,3)} ± ${disc>=0?n(Math.sqrt(disc),3):n(Math.sqrt(-disc),3)+'i'}`,
   take:!stable?'Algum autovalor tem módulo ≥ 1: o VAR em níveis não é estável e as respostas não morrem. Para séries integradas, estude cointegração e o VECM.':j===1&&nz(r)?`Choque em y<sub>2</sub> não move y<sub>1</sub> no impacto: é a ordem de Cholesky, não uma propriedade dos dados. Inverta a ordem e a história muda — identificação é uma escolha.`:`O choque se dissipa à metade em ${f(half(lm),1)} períodos. ${nz(p.a12)?'Como a<sub>1</sub><sub>2</sub> ≠ 0, y<sub>2</sub> ajuda a prever y<sub>1</sub> (Granger), o que não identifica efeito causal estrutural.':'Com a<sub>1</sub><sub>2</sub> = 0, o passado de y<sub>2</sub> não ajuda a prever y<sub>1</sub>.'}`};
 }
});

/* ================= S13 · cap. 9 — cointegração e correção de erros ================= */
P.sim('sim-ts-coint',{
 tag:'Simulador S13 · cointegração',
 title:'Cointegração e correção de erros: o spread que volta',
 lede:'x é um passeio aleatório; y acompanha os choques de x e corrige o desvio do equilíbrio βx com velocidade α: Δy<sub>t</sub> = βΔx<sub>t</sub> + α(y<sub>t−1</sub> − βx<sub>t−1</sub>) + e<sub>t</sub>. Com α &lt; 0 as duas séries compartilham a mesma tendência estocástica e o spread é estacionário; com α = 0 não há âncora e o spread vira passeio aleatório.',
 controls:[
  {k:'al',label:'α · velocidade de ajuste',min:-1,max:0,step:.02,value:-.2,fmt:v=>f(v,2),tip:'Fração do desequilíbrio corrigida a cada período.'},
  {k:'be',label:'β · vetor cointegrante',min:.5,max:2,step:.05,value:1,fmt:v=>f(v,2)},
  {k:'se',label:'σ<sub>e</sub> · choque de y',min:.2,max:2,step:.1,value:.8,fmt:v=>f(v,1)}],
 kpis:[{k:'bh',label:'Vetor cointegrante estimado',color:'c1',tip:'β por OLS de y em x: superconsistente sob cointegração.'},{k:'hl',label:'Meia-vida do desequilíbrio',color:'c2',tip:'ln 0,5 / ln(1+α).'},{k:'eg',label:'Estatística de Engle-Granger',color:'gold',tip:'DF no resíduo; crítico 5% ≈ −3,34 (duas variáveis, com constante).'},{k:'sd',label:'DP do spread',color:'c4'}],
 charts:[{k:'lv',title:'y e βx: a mesma tendência estocástica?'},{k:'sp',title:'Spread: y menos beta vezes x'}],
 model(p){
  const N=250,ux=Z(1301,N),ue=Z(1302,N),x=[],y=[];let xa=0,ya=0;
  for(let t=0;t<N;t++){const zp=ya-p.be*xa;xa+=ux[t];ya+=p.be*ux[t]+p.al*zp+p.se*ue[t];x.push(xa);y.push(ya)}
  const o=P.ols(x.map(v=>[1,v]),y),bh=o.b[1],res=o.resid,d=res.slice(1).map((v,i)=>v-res[i]),lagr=res.slice(0,-1),g=d.reduce((s,v,i)=>s+v*lagr[i],0)/lagr.reduce((s,v)=>s+v*v,0),ee=d.map((v,i)=>v-g*lagr[i]),se=Math.sqrt(ee.reduce((s,v)=>s+v*v,0)/(ee.length-1)/lagr.reduce((s,v)=>s+v*v,0)),tau=g/se;
  const sp=y.map((v,t)=>v-p.be*x[t]),sd=Math.sqrt(variance(sp)),hl=half(1+p.al),ms=P.mean(sp);
  return{kpi:{bh:{v:f(bh,3),s:`verdadeiro ${f(p.be,2)}`},hl:{v:Number.isFinite(hl)?f(hl,1)+' períodos':'∞',tone:Number.isFinite(hl)?null:'bad'},eg:{v:f(tau,2),tone:tau<-3.34?'good':'bad',s:tau<-3.34?'rejeita “não cointegração”':'não rejeita'},sd:f(sd,2)},
   charts:{lv:{x:{min:1,max:N,label:'t',name:'t',fmt:v=>f(v,0)},series:[{name:'y',data:y.map((v,t)=>[t+1,v]),color:'c1',w:1.8},{name:`βx (β = ${f(p.be,2)})`,data:x.map((v,t)=>[t+1,p.be*v]),color:'c2',w:1.8}]},
    sp:{x:{min:1,max:N,label:'t',name:'t',fmt:v=>f(v,0)},series:[{type:'band',name:'±2 DP',data:sp.map((_,t)=>[t+1,ms-2*sd,ms+2*sd]),color:'c1',a:.12},{name:'spread',data:sp.map((v,t)=>[t+1,v]),color:'c1',w:1.6}],marks:[{y:0,color:'c4',label:'equilíbrio'}]}},
   eq:`Δy<sub>t</sub> = βΔx<sub>t</sub> + α(y<sub>t−1</sub> − βx<sub>t−1</sub>) + e<sub>t</sub> ⇒ z<sub>t</sub> = (1+α)z<sub>t−1</sub> + e<sub>t</sub>, 1+α = ${n(1+p.al,2)} · Engle-Granger: Δẑ<sub>t</sub> = γẑ<sub>t−1</sub> + v<sub>t</sub>, τ = ${n(tau,2)}`,
   take:p.al===0?'Sem correção de erros o spread é um passeio aleatório: y e x divergem para sempre e a regressão em níveis seria espúria.':(tau<-3.34?`O desequilíbrio cai à metade em ${f(hl,1)} períodos e o teste de Engle-Granger detecta a cointegração. Diferenciar as duas séries descartaria essa informação de longo prazo — é o argumento do VECM.`:`Com ajuste tão lento (meia-vida ${f(hl,1)}), o teste nesta amostra não distingue o spread de um passeio aleatório: baixa potência, não ausência de equilíbrio.`)};
 }
});

/* ================= S14 · cap. 8 — Kalman no nível local ================= */
P.sim('sim-ts-kalman',{
 tag:'Simulador S14 · espaço de estados',
 title:'Filtro de Kalman no modelo de nível local',
 lede:'Um nível latente μ<sub>t</sub> passeia ao acaso (variância q) e é observado com ruído (variância r = 1). O filtro pondera a previsão do estado e cada nova observação pelo ganho K. No estado estacionário, K é exatamente o α da suavização exponencial simples. O suavizador revisa o passado com dados futuros.',
 controls:[
  {k:'lq',label:'log<sub>1</sub><sub>0</sub>(q/r) · sinal/ruído',min:-3,max:1,step:.1,value:-1,fmt:v=>'q/r = '+f(10**v,v<-1.5?3:2)},
  {k:'mode',type:'seg',label:'Estimativa exibida',options:['Filtrada (tempo real)','Suavizada (usa o futuro)'],value:0}],
 play:{label:'▶ Filtrar em tempo real',dur:6000},
 kpis:[{k:'k',label:'Ganho estacionário do filtro',color:'c1',sub:'K∞ = α da suavização exponencial'},{k:'th',label:'Coeficiente MA do ARIMA(0,1,1)',color:'c2',tip:'θ = K − 1.',sub:'θ do modelo equivalente'},{k:'re',label:'RMSE da estimativa vs μ',color:'gold'},{k:'ry',label:'RMSE de y vs μ',color:'c4',tip:'Usar a observação crua como estimativa do nível.'}],
 charts:[{k:'k',title:'Observações, nível verdadeiro e estimativa ± 2√P'}],
 model(p){
  const N=150,q=10**p.lq,r=1,zh=Z(1401,N),ze=Z(1402,N),mu=[],y=[];let m=0;for(let t=0;t<N;t++){m+=Math.sqrt(q)*zh[t];mu.push(m);y.push(m+ze[t])}
  const a=[],Pf=[],ap=[],Pp=[];let at=y[0],Pt=r;for(let t=0;t<N;t++){const apt=t?at:y[0],Ppt=t?Pt+q:r*10;ap.push(apt);Pp.push(Ppt);const K=Ppt/(Ppt+r);at=apt+K*(y[t]-apt);Pt=(1-K)*Ppt;a.push(at);Pf.push(Pt)}
  const as=a.slice(),Ps=Pf.slice();for(let t=N-2;t>=0;t--){const J=Pf[t]/Pp[t+1];as[t]=a[t]+J*(as[t+1]-ap[t+1]);Ps[t]=Pf[t]+J*J*(Ps[t+1]-Pp[t+1])}
  const Pb=(q+Math.sqrt(q*q+4*q*r))/2,K=Pb/(Pb+r),sm=p.mode===1,est=sm?as:a,PV=sm?Ps:Pf,show=Math.max(2,Math.round(p.t*N));
  const re=Math.sqrt(P.mean(est.map((v,t)=>(v-mu[t])**2))),ry=Math.sqrt(P.mean(y.map((v,t)=>(v-mu[t])**2)));
  return{kpi:{k:f(K,3),th:f(K-1,3),re:{v:f(re,3),tone:re<ry?'good':null},ry:f(ry,3)},
   charts:{k:{x:{min:1,max:N,label:'t',name:'t',fmt:v=>f(v,0)},series:[{type:'band',name:'±2√P',data:est.map((v,t)=>[t+1,t<show?v-2*Math.sqrt(PV[t]):NaN,t<show?v+2*Math.sqrt(PV[t]):NaN]),color:'c1',a:.18},{name:'observação y',type:'dots',data:y.map((v,t)=>[t+1,t<show?v:NaN]),color:P.alpha('c4',.55),r:2.2},{name:'nível verdadeiro μ',data:mu.map((v,t)=>[t+1,t<show?v:NaN]),color:'c2',w:1.6,dash:[5,4]},{name:sm?'suavizado':'filtrado',data:est.map((v,t)=>[t+1,t<show?v:NaN]),color:'c1',w:2.4,end:p.t<1}]}},
   eq:`P<sub>∞</sub> = (q + √(q² + 4qr))/2 = ${n(Pb,4)} · K<sub>∞</sub> = P<sub>∞</sub>/(P<sub>∞</sub> + r) = ${n(K,3)} ⇒ â<sub>t</sub> = â<sub>t−1</sub> + ${n(K,3)}(y<sub>t</sub> − â<sub>t−1</sub>) ≡ SES com α = ${n(K,3)}`,
   take:sm?'O suavizado é mais preciso porque usa observações posteriores. Em um backtest, isso é vazamento: em tempo real só a estimativa filtrada existia.':`Com q/r = ${f(q,3)}, o filtro confia ${pct(K,0)} na nova observação. Mais ruído relativo (q/r menor) ⇒ K menor ⇒ nível mais suave: o mesmo dilema do α da suavização exponencial, agora derivado do modelo.`};
 }
});

/* ================= S15 · cap. 8 — Markov switching ================= */
P.sim('sim-ts-ms',{
 tag:'Simulador S15 · mudança de regime',
 title:'Markov switching: dois regimes, durações e probabilidade filtrada',
 lede:'y<sub>t</sub> = μ<sub>s<sub>t</sub></sub> + σε<sub>t</sub>, com o regime s<sub>t</sub> seguindo uma cadeia de Markov. O filtro de Hamilton calcula, a cada t, a probabilidade de estar no regime 2 usando só o passado e o presente (aqui com os parâmetros verdadeiros, para isolar o mecanismo da estimação).',
 controls:[
  {k:'p11',label:'p<sub>1</sub><sub>1</sub> · permanecer no regime 1',min:.5,max:.99,step:.01,value:.95,fmt:v=>f(v,2)},
  {k:'p22',label:'p<sub>2</sub><sub>2</sub> · permanecer no regime 2',min:.5,max:.99,step:.01,value:.85,fmt:v=>f(v,2)},
  {k:'mu2',label:'μ<sub>2</sub> · média do regime 2 (μ<sub>1</sub> = 1)',min:-3,max:.8,step:.1,value:-1.2,fmt:v=>f(v,1)},
  {k:'s',label:'σ · ruído',min:.4,max:2,step:.1,value:1,fmt:v=>f(v,1),tip:'Quanto maior σ em relação a μ<sub>1</sub> − μ<sub>2</sub>, mais difícil classificar.'}],
 kpis:[{k:'d1',label:'Duração esperada · regime 1',color:'c2',tip:'1/(1 − p<sub>1</sub><sub>1</sub>).'},{k:'d2',label:'Duração esperada · regime 2',color:'c4',tip:'1/(1 − p<sub>2</sub><sub>2</sub>).'},{k:'pi',label:'Probabilidade ergódica do regime 2',color:'gold',tip:'(1−p<sub>1</sub><sub>1</sub>)/(2−p<sub>1</sub><sub>1</sub>−p<sub>2</sub><sub>2</sub>).'},{k:'ac',label:'Acerto da classificação filtrada',color:'c1'}],
 charts:[{k:'y',title:'Série simulada · faixas = regime 2 verdadeiro'},{k:'pr',title:'Probabilidade filtrada do regime 2 × regime verdadeiro'}],
 model(p){
  const N=200,u=U(1501,N),z=Z(1502,N),mu=[1,p.mu2],s=[],y=[];let st=0;
  for(let t=0;t<N;t++){if(t){const stay=st===0?p.p11:p.p22;if(u[t]>stay)st=1-st}s.push(st);y.push(mu[st]+p.s*z[t])}
  const pi2=(1-p.p11)/(2-p.p11-p.p22);let xi=[1-pi2,pi2];const pr=[];
  for(let t=0;t<N;t++){const pr1=t?xi[0]*p.p11+xi[1]*(1-p.p22):xi[0],pr2=t?xi[0]*(1-p.p11)+xi[1]*p.p22:xi[1],l1=P.npdf((y[t]-mu[0])/p.s),l2=P.npdf((y[t]-mu[1])/p.s),den=pr1*l1+pr2*l2||1e-300;xi=[pr1*l1/den,pr2*l2/den];pr.push(xi[1])}
  const acc=pr.filter((v,t)=>(v>.5)===(s[t]===1)).length/N,sh=[];let a=-1;for(let t=0;t<=N;t++){if(t<N&&s[t]===1&&a<0)a=t;if((t===N||s[t]===0)&&a>=0){sh.push({x0:a+.5,x1:t+.5,color:'c4',a:.1});a=-1}}
  return{kpi:{d1:f(1/(1-p.p11),1)+' períodos',d2:f(1/(1-p.p22),1)+' períodos',pi:{v:pct(pi2,1),s:`observado ${pct(s.filter(v=>v).length/N,1)}`},ac:{v:pct(acc,1),tone:acc>.85?'good':acc<.7?'bad':null}},
   charts:{y:{x:{min:1,max:N,label:'t',name:'t',fmt:v=>f(v,0)},shade:sh,series:[{name:'y',data:y.map((v,t)=>[t+1,v]),color:'c4',w:1.2}],marks:[{y:1,color:'c2',label:'μ₁',name:'μ₁'},{y:p.mu2,color:'gold',label:'μ₂',name:'μ₂'}]},
    pr:{x:{min:1,max:N,label:'t',name:'t',fmt:v=>f(v,0)},y:{min:0,max:1,fmt:v=>f(v,1)},series:[{name:'regime 2 verdadeiro',type:'step',data:s.map((v,t)=>[t+1,v]),color:'c4',w:1.2,dash:[4,3]},{name:'P filtrada',data:pr.map((v,t)=>[t+1,v]),color:'c1',w:2.2,fill:.2}],marks:[{y:.5,color:'c4',label:'0,5'}]}},
   eq:`E[D<sub>2</sub>] = 1/(1−p<sub>22</sub>) = 1/${n(1-p.p22,2)} = ${n(1/(1-p.p22),1)} · π<sub>2</sub> = (1−p<sub>11</sub>)/(2−p<sub>11</sub>−p<sub>22</sub>) = ${n(1-p.p11,2)}/${n(2-p.p11-p.p22,2)} = ${n(pi2,3)}`,
   take:`O regime 2 dura em média ${f(1/(1-p.p22),1)} períodos e ocupa ${pct(pi2,0)} do tempo no longo prazo. ${acc>.85?'Com regimes bem separados o filtro classifica quase todos os períodos certo.':'Com médias próximas ou muito ruído, a probabilidade filtrada fica hesitante: o regime é uma inferência, não uma observação.'}`};
 }
});

/* ================= S16 · cap. 10 — rede neural em janelas deslizantes ================= */
function trainMLP(Xt,yt,Xv,yv,H,E,seed){
 const L=Xt[0].length,r=P.rng(seed),np=H*L+H+H+1,th=new Float64Array(np);for(let i=0;i<H*L;i++)th[i]=P.randn(r)*Math.sqrt(1/L);for(let h=0;h<H;h++)th[H*L+H+h]=P.randn(r)*Math.sqrt(1/H);
 const m1=new Float64Array(np),m2=new Float64Array(np),g=new Float64Array(np),a=new Float64Array(H),lr=.02,B1=.9,B2=.999;
 const pred=(x,w)=>{let o=w[np-1];for(let h=0;h<H;h++){let s=w[H*L+h];for(let l=0;l<L;l++)s+=w[h*L+l]*x[l];o+=w[H*L+H+h]*Math.tanh(s)}return o};
 const loss=(X,Y,w)=>Math.sqrt(X.reduce((s,x,i)=>s+(pred(x,w)-Y[i])**2,0)/X.length);
 const tr=[loss(Xt,yt,th)],va=[loss(Xv,yv,th)],snaps=[Float64Array.from(th)];
 for(let e=1;e<=E;e++){g.fill(0);
  for(let i=0;i<Xt.length;i++){const x=Xt[i];let o=th[np-1];for(let h=0;h<H;h++){let s=th[H*L+h];for(let l=0;l<L;l++)s+=th[h*L+l]*x[l];a[h]=Math.tanh(s);o+=th[H*L+H+h]*a[h]}
   const d=o-yt[i];g[np-1]+=d;for(let h=0;h<H;h++){g[H*L+H+h]+=d*a[h];const da=d*th[H*L+H+h]*(1-a[h]*a[h]);g[H*L+h]+=da;for(let l=0;l<L;l++)g[h*L+l]+=da*x[l]}}
  const nb=Xt.length;for(let k=0;k<np;k++){const gk=g[k]/nb;m1[k]=B1*m1[k]+(1-B1)*gk;m2[k]=B2*m2[k]+(1-B2)*gk*gk;th[k]-=lr*(m1[k]/(1-B1**e))/(Math.sqrt(m2[k]/(1-B2**e))+1e-8)}
  tr.push(loss(Xt,yt,th));va.push(loss(Xv,yv,th));if(e%10===0)snaps.push(Float64Array.from(th))}
 return{tr,va,snaps,pred}}
P.sim('sim-ts-mlp',{
 tag:'Simulador S16 · rede neural',
 title:'Rede neural em janelas deslizantes: treino, validação e parada antecipada',
 lede:'Série não linear (mapa logístico com ruído) transformada em problema supervisionado: os L últimos valores preveem o próximo. Uma rede com uma camada oculta tanh é treinada por Adam nas 200 primeiras janelas e avaliada nas seguintes, sempre em ordem cronológica. O AR(L) linear estimado por MQ é o benchmark.',
 controls:[
  {k:'L',label:'L · lags na janela',min:1,max:6,step:1,value:2,fmt:v=>f(v,0)},
  {k:'H',label:'Neurônios ocultos',min:2,max:16,step:1,value:8,fmt:v=>f(v,0)},
  {k:'nz',label:'Ruído da série',min:.01,max:.1,step:.01,value:.04,fmt:v=>f(v,2),tip:'Mais ruído ⇒ mais espaço para sobreajuste.'}],
 play:{label:'▶ Treinar 300 épocas',dur:6000},
 kpis:[{k:'va',label:'RMSE validação · rede',color:'c1'},{k:'ar',label:'RMSE validação · AR(L) linear',color:'c2'},{k:'be',label:'Melhor época (validação)',color:'gold',tip:'Ponto de parada antecipada.'},{k:'np',label:'Parâmetros da rede',color:'c4'}],
 charts:[{k:'loss',title:'Curvas de aprendizado (RMSE)'},{k:'fit',title:'Validação: observado × rede × AR(L)'}],
 model(p,memo){
  const key=p.L+'|'+p.H+'|'+p.nz,E=300;
  if(memo.key!==key){const N=330,z=Z(1601,N),s=[.3];for(let t=1;t<N;t++)s.push(P.clamp(3.7*s[t-1]*(1-s[t-1])+p.nz*z[t],.01,.99));const y=s.map(v=>(v-.5)*2),L=p.L,X=[],Y=[];
   for(let t=L;t<N;t++){X.push(y.slice(t-L,t).reverse());Y.push(y[t])}
   const nt=200,Xt=X.slice(0,nt),Yt=Y.slice(0,nt),Xv=X.slice(nt),Yv=Y.slice(nt),res=trainMLP(Xt,Yt,Xv,Yv,p.H,E,1603);
   const o=P.ols(Xt.map(x=>[1,...x]),Yt),arp=Xv.map(x=>o.b[0]+x.reduce((s,v,i)=>s+v*o.b[i+1],0)),arr=rmse(arp.map((v,i)=>v-Yv[i]));
   memo.key=key;Object.assign(memo,{res,Xv,Yv,arp,arr,nt,L})}
  const {res,Xv,Yv,arp,arr}=memo,e=Math.max(0,Math.round(p.t*E)),si=Math.floor(e/10),w=res.snaps[si],ee=si*10,pr=Xv.map(x=>res.pred(x,w)),vr=rmse(pr.map((v,i)=>v-Yv[i]));
  const best=res.va.indexOf(Math.min(...res.va)),np=p.H*p.L+2*p.H+1,K=60;
  return{kpi:{va:{v:f(vr,3),tone:vr<arr?'good':'bad',s:`época ${ee}`},ar:f(arr,3),be:{v:String(best),s:`RMSE ${f(res.va[best],3)}`},np:String(np)},
   charts:{loss:{x:{min:0,max:E,label:'época',name:'época',fmt:v=>f(v,0)},y:{min:0,fmt:v=>f(v,2)},series:[{name:'treino',data:res.tr.map((v,i)=>[i,i<=e?v:NaN]),color:'c2',w:2},{name:'validação',data:res.va.map((v,i)=>[i,i<=e?v:NaN]),color:'c1',w:2.4}],marks:[{x:best,label:'parada antecipada',color:'gold',name:'melhor época'},{y:arr,label:'AR(L) linear',color:'c4',align:'left'}]},
    fit:{x:{min:1,max:K,label:'janela de validação',name:'t',fmt:v=>f(v,0)},series:[{name:'observado',data:Yv.slice(0,K).map((v,i)=>[i+1,v]),color:'c4',w:1.4},{name:'AR(L) linear',data:arp.slice(0,K).map((v,i)=>[i+1,v]),color:'c2',w:1.4,dash:[5,4]},{name:`rede (época ${ee})`,data:pr.slice(0,K).map((v,i)=>[i+1,v]),color:'c1',w:2.2}]}},
   eq:`ŷ<sub>t</sub> = b<sub>2</sub> + Σ<sub>h=1</sub><sup>${p.H}</sup> w<sub>2,h</sub> tanh(b<sub>1,h</sub> + Σ<sub>l=1</sub><sup>${p.L}</sup> w<sub>1,hl</sub> y<sub>t−l</sub>) · ${np} parâmetros para ${memo.nt} janelas · RMSE<sub>val</sub> = ${n(vr,3)} vs AR(${p.L}) = ${n(arr,3)}`,
   take:p.t<1&&e<E?`Época ${ee}: observe a validação acompanhar o treino no início e depois se descolar quando a rede começa a memorizar ruído.`:(vr<arr?`A rede captura a curvatura que o AR(${p.L}) linear não vê: RMSE ${f(vr,3)} contra ${f(arr,3)}. A melhor época de validação (${best}) seria o ponto de parada antecipada.`:`Aqui a rede não supera o AR linear (${f(vr,3)} × ${f(arr,3)}): capacidade extra sem sinal não linear suficiente, ou treino além do ponto de parada (época ${best}).`)};
 }
});

/* ================= S17 · origem móvel ================= */
P.sim('sim-ts-roll',{
 tag:'Simulador S17 · avaliação por origem móvel',
 title:'Rolling-origin: janela expansiva × deslizante e erro por horizonte',
 lede:'Série mensal com tendência, sazonalidade de período 12, erro AR(1) e uma quebra de nível opcional no mês 120. A cada 6 meses uma nova origem reestima quatro métodos só com dados disponíveis até ali e prevê h meses. Aperte o botão para ver as origens avançarem.',
 controls:[
  {k:'h',label:'h · horizonte avaliado',min:1,max:24,step:1,value:12,fmt:v=>f(v,0)+' meses'},
  {k:'win',type:'seg',label:'Janela de estimação',options:['Expansiva','Deslizante (60 meses)'],value:0},
  {k:'br',label:'Quebra de nível no mês 120',min:-20,max:20,step:1,value:0,fmt:v=>P.sgn(v,0)}],
 play:{label:'▶ Avançar as origens',dur:7000},
 kpis:[{k:'ch',label:'Vencedor por MASE',color:'c1'},{k:'ms',label:'MASE do vencedor',color:'gold',tip:'Escala: MAE do ingênuo sazonal nos 72 primeiros meses.'},{k:'sm',label:'sMAPE do vencedor',color:'c2'},{k:'no',label:'Origens avaliadas',color:'c4'}],
 charts:[{k:'s',title:'Origem corrente: janela de treino, bloco futuro e previsões'},{k:'e',title:'MAE por horizonte (origens acumuladas)'}],
 model(p,memo){
  const N=180,m=12,key=p.h+'|'+p.win+'|'+p.br,names=['ingênuo','ingênuo sazonal','SES α=0,3','regressão tend.+sazonal'],cols=['c4','c2','gold','c1'];
  if(memo.key!==key){const z=Z(1701,N),y=[];let u=0;for(let t=0;t<N;t++){u=.5*u+3*z[t];y.push(100+.3*t+10*Math.sin(2*Math.PI*t/m)+u+(t>=120?p.br:0))}
   const H=p.h,orig=[];for(let o=71;o+H<N;o+=6)orig.push(o);
   const runs=orig.map(o=>{const s0=p.win===1?Math.max(0,o-59):0,fc=[[],[],[],[]];let l=y[s0];for(let t=s0+1;t<=o;t++)l=.3*y[t]+.7*l;
    const X=[],Y=[];for(let t=s0;t<=o;t++){const r=[1,t];for(let j=1;j<m;j++)r.push(t%m===j?1:0);X.push(r);Y.push(y[t])}const b=P.ols(X,Y).b;
    for(let h=1;h<=H;h++){const t=o+h;fc[0].push(y[o]);fc[1].push(y[o+h-m*Math.ceil(h/m)]);fc[2].push(l);let v=b[0]+b[1]*t;if(t%m)v+=b[t%m+1];fc[3].push(v)}
    return{o,s0,fc,err:fc.map(F=>F.map((v,i)=>y[o+i+1]-v))}});
   let sc=0;for(let t=m;t<72;t++)sc+=Math.abs(y[t]-y[t-m]);sc/=72-m;memo.key=key;Object.assign(memo,{y,runs,sc})}
  const {y,runs,sc}=memo,K=runs.length,k=p.t<1?Math.max(0,Math.min(K-1,Math.floor(p.t*K))):K-1,cur=runs[k],H=p.h,done=runs.slice(0,k+1);
  const maeH=[0,1,2,3].map(j=>Array.from({length:H},(_,i)=>P.mean(done.map(r=>Math.abs(r.err[j][i]))))),tot=[0,1,2,3].map(j=>P.mean(done.flatMap(r=>r.err[j].map(Math.abs))));
  const smape=[0,1,2,3].map(j=>P.mean(done.flatMap(r=>r.err[j].map((e,i)=>{const a=y[r.o+i+1],fv=a-e;return 200*Math.abs(e)/(Math.abs(a)+Math.abs(fv))})))),mase=tot.map(v=>v/sc),best=mase.indexOf(Math.min(...mase));
  return{kpi:{ch:names[best],ms:{v:f(mase[best],2),tone:mase[best]<1?'good':'bad'},sm:f(smape[best],2)+'%',no:`${k+1} de ${K}`},
   charts:{s:{x:{min:1,max:N,label:'mês',name:'mês',fmt:v=>f(v,0)},shade:[{x0:cur.s0+.5,x1:cur.o+1.5,color:'c2',a:.08,label:'treino'},{x0:cur.o+1.5,x1:cur.o+H+1.5,color:'c1',a:.14,label:'futuro'}],
    series:[{name:'série',data:y.map((v,t)=>[t+1,v]),color:'c4',w:1.2},...cur.fc.map((F,j)=>({name:names[j],data:F.map((v,i)=>[cur.o+i+2,v]),color:cols[j],w:j===3?2.4:1.8,dash:j===0?[4,3]:undefined}))],marks:p.br?[{x:120.5,color:'c3',label:'quebra de nível'}]:[]},
    e:{x:{min:1,max:Math.max(2,H),label:'horizonte h',name:'h',fmt:v=>f(v,0)},y:{min:0,fmt:v=>f(v,1)},series:maeH.map((a,j)=>({name:names[j],data:a.map((v,i)=>[i+1,v]),color:cols[j],w:j===best?2.8:1.6}))}},
   eq:`MASE = MAE/escala, escala = (1/60)Σ|y<sub>t</sub> − y<sub>t−12</sub>| = ${n(sc,2)} · MAE: ${names.map((s,j)=>`${s} ${n(tot[j],2)}`).join(' · ')}`,
   take:`${names[best]} vence com MASE ${f(mase[best],2)} em ${k+1} origens. ${p.br&&p.win===1?'A janela deslizante esquece o regime antigo e se adapta mais rápido à quebra; a expansiva carrega o nível antigo por mais tempo.':p.br?'Com a quebra, compare a janela deslizante: ela descarta o regime anterior.':'O erro cresce com h para todos os métodos — reporte o desempenho por horizonte, não uma média única.'}`};
 }
});
})();
