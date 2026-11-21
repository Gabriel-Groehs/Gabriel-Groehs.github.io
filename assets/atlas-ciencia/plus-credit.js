/* Atlas Plus · Rösch & Scheule, Deep Credit Risk — Machine Learning with Python (2020)
   Conceitos (tooltip) e simuladores deste livro. Requer plus.js carregado antes.
   Todos os dados são sintéticos, gerados com sementes fixas; nenhum número reproduz o livro. */
(()=>{'use strict';
const P=window.PLUS,{f,pct,n}=P;
const Phi=P.N,Phinv=P.Ninv,sig=P.sigmoid;
const toM=a=>1-Math.pow(1-Math.min(a,.999999),1/12);           // PD anual → hazard mensal constante
const pp=(v,d=1)=>f(v*100,d)+'%';

/* ---------- conceitos: t = termo PT, en = termo original, d = definição, f = fórmula, c = categoria ---------- */
P.cx=Object.assign(P.cx||{},{
 default:{t:'Default (inadimplência)',en:'default event',m:['default','inadimplência'],d:'Evento que encerra a observação “boa” de um contrato: atraso relevante (por exemplo, mais de 90 dias) ou improbabilidade de pagamento, conforme política e regulação. A definição operacional fixa o rótulo y do modelo.',f:'y<sub>i,t</sub> = 𝟙{default de i em (t, t+h]}'},
 outcome:{t:'Engenharia do desfecho',en:'outcome engineering',c:'mod',m:['outcome engineering','engenharia do desfecho'],d:'Construção do rótulo: evento, horizonte, unidade de análise (cliente ou contrato), exclusões e tratamento de cura, renegociação, payoff e censura. Erros aqui contaminam todo o restante.'},
 perfwin:{t:'Janela de performance',en:'performance window',m:['janela de performance','performance window','janela de desempenho'],d:'Período após a data de observação em que se verifica se o evento ocorreu. Janelas curtas subestimam a taxa de default de horizontes longos; janelas longas envelhecem a amostra.'},
 snapshot:{t:'Data de observação',en:'observation point / snapshot',m:['data de observação','snapshot'],d:'Data em que as características são congeladas e a partir da qual a janela de performance é contada. Toda variável precisa estar disponível nessa data.'},
 panel:{t:'Dados em painel',en:'panel data (loan × period)',m:['dados em painel','panel data','contrato-período','contrato-mês','contrato × período'],d:'Base com uma linha por contrato e período de observação. Permite modelar hazards, variáveis que mudam no tempo e fatores macroeconômicos comuns.'},
 censura:{t:'Censura',en:'censoring',m:['censura','censurados','censuradas','censurado','censurada'],d:'Observação interrompida antes do fim do horizonte sem que o evento tenha ocorrido (fim da amostra, venda, payoff). Censura não é ausência de evento: tratá-la como “bom” subestima a PD.'},
 safra:{t:'Safra (coorte)',en:'vintage / cohort',m:['safra','safras','coorte','coortes','vintage'],d:'Conjunto de contratos originados no mesmo período. Curvas por safra separam efeito de maturação (idade) de efeito de calendário (ciclo).'},
 featureeng:{t:'Engenharia de atributos',en:'feature engineering',c:'mod',m:['engenharia de atributos','feature engineering'],d:'Transformação de dados brutos em atributos com escala, sinal e estabilidade adequados: razões (DTI, LTV), defasagens, tendências, bins, WOE, interações.'},
 woe:{t:'Peso da evidência',en:'Weight of Evidence (WOE)',c:'m',m:['WOE','WoE','weight of evidence','peso da evidência'],d:'Log da razão entre a participação de bons e de maus em uma faixa do atributo. Positivo = faixa mais segura que a média; negativo = mais arriscada.',f:'WOE<sub>j</sub> = ln[(g<sub>j</sub>/G)/(b<sub>j</sub>/B)]'},
 iv:{t:'Valor de informação',en:'Information Value (IV)',c:'m',m:['Information Value','IV','valor de informação'],d:'Soma, sobre as faixas, da diferença de participações ponderada pelo WOE. Convenção de mercado: <0,02 inútil; 0,02–0,1 fraco; 0,1–0,3 médio; >0,3 forte; >0,5 merece suspeita de vazamento.',f:'IV = Σ<sub>j</sub>(g<sub>j</sub>/G − b<sub>j</sub>/B)·WOE<sub>j</sub>'},
 leakage:{t:'Vazamento de dados',en:'data leakage',m:['vazamento','data leakage','leakage'],d:'Uso, no treino, de informação que não existiria no momento da decisão (por exemplo, dias em cobrança após o default). Gera desempenho artificial que desaparece em produção.'},
 featsel:{t:'Seleção de atributos',en:'feature selection',c:'mod',m:['seleção de atributos','feature selection','seleção de variáveis'],d:'Escolha do subconjunto de atributos por poder preditivo, estabilidade, redundância, sentido econômico e custo. Feita só com dados de treino/validação, nunca com o teste.'},
 logit:{t:'Regressão logística',en:'logistic regression (logit)',c:'mod',m:['regressão logística','logit'],d:'Modelo em que o log-odds do default é linear nos atributos. Coeficientes se leem como variação do log-odds por unidade do atributo.',f:'PD(x) = 1 / (1 + e<sup>−(β<sub>0</sub>+βᵀx)</sup>)'},
 probit:{t:'Probit',en:'probit model',c:'mod',m:['probit'],d:'Modelo binário com ligação normal: PD = Φ(βᵀx). Equivale a um modelo de variável latente com erro normal; coeficientes ≈ coeficientes logit ÷ 1,6.',f:'PD(x) = Φ(β<sub>0</sub> + βᵀx)'},
 odds:{t:'Chance (odds) e razão de chances',en:'odds / odds ratio',c:'m',m:['odds','razão de chances','odds ratio','log-odds'],d:'Odds = PD/(1−PD). No logit, um aumento Δx multiplica as odds por e<sup>βΔx</sup> — o que não equivale a multiplicar a PD pelo mesmo fator.',f:'OR = e<sup>β·Δx</sup> · ln[PD/(1−PD)] = β<sub>0</sub> + βᵀx'},
 score:{t:'Escore de crédito',en:'credit score / scorecard',c:'m',m:['score','escore','scorecard'],d:'Transformação monótona da PD (ou do log-odds) em pontos. Ordena o risco; o nível da PD vem da calibração.'},
 pd:{t:'Probabilidade de default',en:'Probability of Default (PD)',c:'m',m:['PD','probabilidade de default'],d:'Probabilidade de o devedor entrar em default em um horizonte (12 meses ou vida inteira), condicional à informação disponível na data de observação.',f:'PD<sub>i</sub> = P(T<sub>i</sub> ≤ t+h | T<sub>i</sub> > t, x<sub>i,t</sub>)'},
 lgd:{t:'Perda dado o default',en:'Loss Given Default (LGD)',c:'m',m:['LGD'],d:'Fração da exposição perdida após o default, já descontadas as recuperações líquidas de custos e trazidas a valor presente.',f:'LGD = 1 − PV(recuperações − custos) / EAD'},
 ead:{t:'Exposição no default',en:'Exposure at Default (EAD)',c:'m',m:['EAD'],d:'Saldo devedor no momento do default. Em linhas rotativas inclui o saque adicional do limite livre entre a data de referência e o default.',f:'EAD = B<sub>r</sub> + CCF·(L<sub>r</sub> − B<sub>r</sub>)'},
 ccf:{t:'Fator de conversão de crédito',en:'Credit Conversion Factor (CCF)',c:'m',m:['CCF','fator de conversão'],d:'Fração do limite não utilizado na data de referência que estará sacada no default. Instável quando o limite livre é pequeno (denominador perto de zero).',f:'CCF = (EAD − B<sub>r</sub>) / (L<sub>r</sub> − B<sub>r</sub>)'},
 el:{t:'Perda esperada',en:'Expected Loss (EL)',c:'m',m:['perda esperada','perdas esperadas','EL','expected loss'],d:'Média da distribuição de perdas: custo “normal” do crédito, que deve estar no preço e nas provisões.',f:'EL = PD × LGD × EAD'},
 payoff:{t:'Liquidação antecipada',en:'payoff / prepayment',m:['payoff','pré-pagamento','pré-pagamentos','liquidação antecipada','prepayment'],d:'Quitação do contrato antes do vencimento. Encerra a exposição e compete com o default: quem quita não pode mais inadimplir.'},
 competing:{t:'Riscos concorrentes',en:'competing risks',c:'mod',m:['riscos concorrentes','eventos concorrentes','competing risks'],d:'Situação em que mais de um evento terminal pode ocorrer (default, payoff) e a ocorrência de um impede o outro. Exige incidência acumulada, não 1 − sobrevivência de um só evento.',f:'CIF<sub>D</sub>(t) = Σ<sub>k≤t</sub> S(k−1)·h<sub>D,k</sub>'},
 hazard:{t:'Hazard (taxa de risco)',en:'hazard rate',c:'m',m:['hazard','hazards','taxa de risco'],d:'Probabilidade de o evento ocorrer no período t dado que o contrato sobreviveu até o início de t. É a peça básica dos modelos multiperíodo.',f:'h<sub>t</sub> = P(T = t | T ≥ t)'},
 survival:{t:'Função de sobrevivência',en:'survival function',c:'m',m:['sobrevivência','survival'],d:'Probabilidade de o contrato continuar ativo (sem evento) além de t. Em tempo discreto, produto dos complementares dos hazards.',f:'S(t) = ∏<sub>k=1</sub><sup>t</sup>(1 − h<sub>k</sub>)'},
 dthazard:{t:'Modelo de hazard em tempo discreto',en:'discrete-time hazard model',c:'mod',m:['tempo discreto','discrete-time hazard','hazard discreto'],d:'Regressão binária (logit/probit) estimada no painel contrato-período: cada linha pergunta “houve default neste período, dado que estava ativo?”. Acomoda covariáveis que mudam no tempo e fatores macro.',f:'logit(h<sub>i,t</sub>) = α<sub>t</sub> + βᵀx<sub>i,t</sub> + γᵀz<sub>t</sub>'},
 ttc:{t:'PD ao longo do ciclo',en:'through-the-cycle (TTC)',m:['TTC','through-the-cycle','ao longo do ciclo'],d:'PD média de longo prazo, estável ao ciclo econômico; usada em capital regulatório para evitar pró-ciclicidade.'},
 pit:{t:'PD pontual',en:'point-in-time (PIT)',m:['PIT','point-in-time'],d:'PD condicional à situação econômica corrente; sobe na recessão e cai na expansão. Exigida em provisões IFRS 9/CECL.'},
 sysfactor:{t:'Fator sistemático',en:'systematic factor',m:['fator sistemático','fatores sistemáticos','fator comum'],d:'Variável latente comum a todos os devedores (o “estado da economia”). Condicional a ele, os defaults são independentes; sua variação gera a correlação entre defaults.',f:'A<sub>i</sub> = √ρ·Z + √(1−ρ)·ε<sub>i</sub>'},
 assetcorr:{t:'Correlação de ativos',en:'asset correlation',c:'m',m:['correlação de ativos','asset correlation','correlação de default','correlação de defaults'],d:'Parâmetro ρ do modelo de um fator: fração da variância do retorno latente explicada pelo fator comum. Controla a espessura da cauda das perdas da carteira.'},
 vasicek:{t:'Modelo de Vasicek',en:'Vasicek one-factor model',c:'mod',m:['Vasicek'],d:'Modelo de um fator gaussiano para carteiras grandes e homogêneas; dá a distribuição fechada da taxa de default e é a base da fórmula IRB de Basileia.',f:'PD(z) = Φ[(Φ<sup>−1</sup>(PD) − √ρ·z)/√(1−ρ)]'},
 condpd:{t:'PD condicional',en:'conditional PD',c:'m',m:['PD condicional','PDs condicionais'],d:'PD dado um valor do fator sistemático. Em cenário adverso (z baixo) ela supera muito a PD média.'},
 irb:{t:'Abordagem IRB',en:'Internal Ratings-Based approach (IRB)',c:'reg',m:['IRB'],d:'Abordagem de Basileia em que o banco estima PD (e, no avançado, LGD e EAD) e o capital vem da fórmula de Vasicek ao quantil de 99,9%.',f:'K = LGD·[Φ((Φ<sup>−1</sup>(PD)+√R·Φ<sup>−1</sup>(0,999))/√(1−R)) − PD]·MA'},
 ul:{t:'Perda inesperada',en:'Unexpected Loss (UL)',c:'m',m:['perda inesperada','perdas inesperadas','unexpected loss','UL'],d:'Diferença entre um quantil alto da distribuição de perdas e a perda esperada. É o que o capital precisa absorver.',f:'UL = VaR<sub>q</sub>(L) − EL'},
 ecocap:{t:'Capital econômico',en:'economic capital',c:'m',m:['capital econômico'],d:'Capital interno necessário para cobrir perdas inesperadas a um nível de confiança coerente com o rating-alvo da instituição.'},
 cvar:{t:'VaR de crédito',en:'credit Value at Risk',c:'m',m:['VaR de crédito','credit VaR','VaR'],d:'Quantil da distribuição de perdas de crédito da carteira em um horizonte (geralmente 1 ano).',f:'VaR<sub>q</sub> = inf{ℓ : P(L ≤ ℓ) ≥ q}'},
 ecl:{t:'Perda de crédito esperada',en:'Expected Credit Loss (ECL)',c:'reg',m:['ECL','perda de crédito esperada'],d:'Provisão contábil prospectiva: média ponderada por cenários das perdas descontadas, em 12 meses (estágio 1) ou na vida (estágios 2 e 3).',f:'ECL = Σ<sub>s</sub> w<sub>s</sub> Σ<sub>t</sub> mPD<sub>s,t</sub>·LGD<sub>s,t</sub>·EAD<sub>s,t</sub>·DF<sub>t</sub>'},
 ifrs9:{t:'IFRS 9',en:'IFRS 9 Financial Instruments',c:'reg',m:['IFRS 9'],d:'Norma contábil internacional (em vigor desde 2018) com modelo de perdas esperadas em três estágios; substituiu o modelo de perda incorrida do IAS 39.'},
 stages:{t:'Estágios do IFRS 9',en:'staging (Stage 1, 2, 3)',c:'reg',m:['estágio 1','estágio 2','estágio 3','Estágio 1','Estágio 2','Estágio 3','staging'],d:'Estágio 1: sem aumento significativo de risco (ECL de 12 meses). Estágio 2: aumento significativo (ECL lifetime). Estágio 3: ativo com problema de recuperação (lifetime, juros sobre o valor líquido).'},
 sicr:{t:'Aumento significativo do risco de crédito',en:'significant increase in credit risk (SICR)',c:'reg',m:['SICR','aumento significativo'],d:'Critério de transferência para o estágio 2, tipicamente relativo (PD lifetime atual vs. na originação) com backstops como 30 dias de atraso.'},
 cecl:{t:'CECL',en:'Current Expected Credit Loss (ASC 326)',c:'reg',m:['CECL'],d:'Padrão norte-americano (FASB) em que toda a carteira provisiona a perda esperada de vida inteira desde o reconhecimento, sem estágios.'},
 lifetime:{t:'PD de vida inteira',en:'lifetime PD',c:'m',m:['PD lifetime','lifetime PD','PD de vida inteira','lifetime'],d:'Probabilidade de default até o vencimento, acumulando hazards sobre os sobreviventes — não é a PD anual multiplicada pelo prazo.',f:'PD<sub>life</sub> = 1 − ∏<sub>t</sub>(1 − h<sub>t</sub>)'},
 mpd:{t:'PD marginal',en:'marginal PD',c:'m',m:['PD marginal','PDs marginais','mPD'],d:'Massa incondicional de default no período t: sobreviver até t−1 e falhar em t. É o que entra período a período na ECL.',f:'mPD<sub>t</sub> = S(t−1)·h<sub>t</sub>'},
 forward:{t:'Cenários prospectivos',en:'forward-looking scenarios',m:['forward-looking','cenários prospectivos'],d:'Cenários macroeconômicos ponderados por probabilidade que condicionam PD, LGD e EAD na ECL. A perda é não linear: ECL do cenário médio ≠ média das ECL.'},
 pricing:{t:'Precificação ajustada ao risco',en:'risk-based loan pricing',c:'mod',m:['precificação','loan pricing','taxa ajustada ao risco','precificação ajustada ao risco'],d:'Taxa mínima que cobre funding, perda esperada, custos e remuneração do capital alocado à taxa de retorno exigida.',f:'r* = r<sub>f</sub> + EL + c + K·(h − r<sub>f</sub>)'},
 raroc:{t:'Retorno ajustado ao risco sobre capital',en:'RAROC',c:'m',m:['RAROC'],d:'Resultado líquido de funding, perda esperada e custos dividido pelo capital econômico alocado. Comparado com a taxa de retorno exigida (hurdle rate).'},
 cure:{t:'Cura',en:'cure / cure rate',c:'m',m:['taxa de cura','cure rate','cura','curados','curadas'],d:'Retorno do contrato inadimplente à adimplência sem perda relevante. Cria a massa de LGD perto de zero na distribuição bimodal.'},
 workout:{t:'LGD de workout',en:'workout LGD',c:'mod',m:['workout'],d:'LGD medida pelos fluxos efetivos de recuperação após o default, líquidos de custos e descontados à data do default.',f:'LGD<sub>w</sub> = 1 − Σ<sub>k</sub>(R<sub>k</sub> − C<sub>k</sub>)(1+r)<sup>−t<sub>k</sub></sup> / EAD'},
 downturn:{t:'LGD de downturn',en:'downturn LGD',c:'reg',m:['downturn','downturn LGD'],d:'LGD condizente com períodos de recessão, exigida no IRB avançado: recuperações caem e curas rareiam justamente quando os defaults aumentam.'},
 fracresp:{t:'Resposta fracionária',en:'fractional response / beta regression',c:'mod',m:['resposta fracionária','regressão beta','fractional response','beta regression'],d:'Modelos para variáveis em [0,1] como a LGD: a regressão beta ou a quase-verossimilhança fracionária (Papke–Wooldridge) evitam previsões fora do intervalo.'},
 auc:{t:'Área sob a curva ROC',en:'AUC (area under the ROC curve)',c:'m',m:['AUC','curva ROC','ROC'],d:'Probabilidade de um mau sorteado receber escore pior que um bom sorteado. Mede só ordenação; é invariante a transformações monótonas da PD.',f:'AUC = P(s<sub>mau</sub> > s<sub>bom</sub>) + ½·P(empate)'},
 gini:{t:'Coeficiente de Gini',en:'Gini / accuracy ratio',c:'m',m:['Gini','accuracy ratio'],d:'Reescala da AUC para [−1, 1]: 0 = aleatório, 1 = ordenação perfeita.',f:'Gini = 2·AUC − 1'},
 ks:{t:'Estatística KS',en:'Kolmogorov–Smirnov statistic',c:'m',m:['KS','Kolmogorov-Smirnov','Kolmogorov–Smirnov'],d:'Maior distância vertical entre as distribuições acumuladas dos escores de bons e de maus.',f:'KS = max<sub>s</sub> |F<sub>mau</sub>(s) − F<sub>bom</sub>(s)|'},
 brier:{t:'Escore de Brier',en:'Brier score',c:'m',m:['Brier'],d:'Erro quadrático médio das probabilidades. Decompõe-se em confiabilidade (calibração), resolução (separação) e incerteza (prevalência).',f:'BS = (1/n)Σ(p̂<sub>i</sub> − y<sub>i</sub>)² = REL − RES + UNC'},
 calib:{t:'Calibração',en:'calibration',c:'m',m:['calibração','calibration','calibrado','calibrada','calibradas'],d:'Concordância entre PD prevista e taxa observada de default por faixa. Determina o nível de provisões e capital; independe da ordenação.'},
 hl:{t:'Teste de Hosmer–Lemeshow',en:'Hosmer–Lemeshow test',c:'mod',m:['Hosmer–Lemeshow','Hosmer-Lemeshow'],d:'Compara defaults observados e esperados em g grupos de PD; sob calibração correta, a estatística segue aproximadamente χ² com g−2 graus de liberdade.',f:'HL = Σ<sub>k</sub>(O<sub>k</sub> − E<sub>k</sub>)² / [E<sub>k</sub>(1 − E<sub>k</sub>/n<sub>k</sub>)]'},
 confusion:{t:'Matriz de confusão',en:'confusion matrix',c:'m',m:['matriz de confusão','confusion matrix'],d:'Tabela 2×2 de acertos e erros a um ponto de corte: maus recusados (TP), maus aprovados (FN), bons recusados (FP) e bons aprovados (TN).'},
 cutoff:{t:'Ponto de corte',en:'cutoff / threshold',m:['ponto de corte','cutoff'],d:'PD (ou escore) a partir da qual o pedido é recusado. Escolhido por custo econômico de cada erro, não por maximizar a acurácia.'},
 psi:{t:'Índice de estabilidade populacional',en:'Population Stability Index (PSI)',c:'m',m:['PSI'],d:'Divergência simétrica entre a distribuição atual e a de desenvolvimento em faixas fixas. Regras práticas: <0,1 estável; 0,1–0,25 monitorar; >0,25 investigar.',f:'PSI = Σ<sub>j</sub>(a<sub>j</sub> − e<sub>j</sub>)·ln(a<sub>j</sub>/e<sub>j</sub>)'},
 drift:{t:'Deriva',en:'drift (data / concept drift)',m:['drift','deriva'],d:'Mudança, ao longo do tempo, da distribuição dos atributos (data drift) ou da relação atributo–default (concept drift).'},
 overfit:{t:'Sobreajuste',en:'overfitting',m:['sobreajuste','overfitting'],d:'Modelo que aprende ruído da amostra de treino: desempenho alto no treino e menor fora da amostra. Cresce com complexidade e cai com tamanho de amostra e regularização.'},
 regul:{t:'Regularização',en:'regularization (L1 lasso / L2 ridge)',c:'mod',m:['regularização','lasso','ridge'],d:'Penalização do tamanho dos coeficientes na estimação. L1 zera coeficientes (seleção); L2 os encolhe. Troca um pouco de viés por menos variância.',f:'min<sub>β</sub> −ℓ(β) + λ<sub>1</sub>‖β‖<sub>1</sub> + λ<sub>2</sub>‖β‖<sub>2</sub><sup>2</sup>'},
 cv:{t:'Validação cruzada',en:'cross-validation',c:'mod',m:['validação cruzada','cross-validation'],d:'Reamostragem em k partições para escolher hiperparâmetros. Em crédito, prefira partições por tempo/safra para não vazar o futuro.'},
 oot:{t:'Amostra fora do tempo',en:'out-of-time sample (OOT)',m:['out-of-time','OOT','fora do tempo'],d:'Amostra de período posterior ao do desenvolvimento. Testa a estabilidade temporal — o teste mais próximo do uso real.'},
 tree:{t:'Árvore de decisão',en:'decision tree (CART)',c:'mod',m:['árvore de decisão','árvores de decisão','árvore','árvores'],d:'Particiona o espaço de atributos em retângulos por divisões binárias que reduzem a impureza; cada folha prevê a taxa de default dos casos que contém.',f:'G = 1 − Σ<sub>c</sub> p<sub>c</sub>²'},
 giniimp:{t:'Impureza de Gini',en:'Gini impurity',c:'m',m:['impureza de Gini','impureza'],d:'Medida de mistura de classes em um nó: 2p(1−p) para duas classes. A divisão escolhida é a que mais reduz a impureza ponderada.',f:'ΔG = G<sub>pai</sub> − (n<sub>E</sub>/n)G<sub>E</sub> − (n<sub>D</sub>/n)G<sub>D</sub>'},
 rf:{t:'Floresta aleatória',en:'random forest',c:'mod',m:['random forest','random forests','floresta aleatória','florestas aleatórias'],d:'Média de muitas árvores treinadas em amostras bootstrap, sorteando atributos a cada divisão para descorrelacioná-las (Breiman, 2001).'},
 gbm:{t:'Gradient boosting',en:'gradient boosting',c:'mod',m:['gradient boosting','boosting','GBM','XGBoost'],d:'Soma sequencial de árvores rasas, cada uma ajustada ao gradiente (resíduo) do erro das anteriores, com taxa de aprendizado ν. Reduz viés; exige parada antecipada.'},
 bagging:{t:'Bagging',en:'bootstrap aggregating',c:'mod',m:['bagging'],d:'Média de modelos treinados em amostras bootstrap. Reduz variância; o ganho é limitado pela correlação entre os modelos.',f:'Var(f̄<sub>M</sub>) = ρσ² + (1−ρ)σ²/M'},
 ensemble:{t:'Ensemble',en:'ensemble methods',c:'mod',m:['ensemble','ensembles'],d:'Combinação de vários modelos (média, votação ou soma sequencial) para reduzir variância (bagging) ou viés (boosting).'},
 nn:{t:'Rede neural',en:'neural network',c:'mod',m:['rede neural','redes neurais','neural network','neural networks'],d:'Composição de camadas de transformações lineares seguidas de funções de ativação não lineares (sigmoide, tanh, ReLU); aprende representações dos atributos.',f:'ŷ = σ(W<sub>2</sub>·g(W<sub>1</sub>x + b<sub>1</sub>) + b<sub>2</sub>)'},
 backprop:{t:'Retropropagação',en:'backpropagation',c:'mod',m:['retropropagação','backpropagation','gradiente descendente'],d:'Cálculo eficiente do gradiente da perda em relação a todos os pesos pela regra da cadeia, usado no gradiente descendente estocástico.'},
 deeplearning:{t:'Aprendizado profundo',en:'deep learning',c:'mod',m:['deep learning','aprendizado profundo'],d:'Redes neurais com muitas camadas. Em dados tabulares de crédito, o ganho sobre ensembles de árvores costuma ser pequeno e precisa ser demonstrado fora do tempo.'},
 shap:{t:'Valores SHAP',en:'SHAP (Shapley additive explanations)',c:'mod',m:['SHAP','Shapley'],d:'Atribuição aditiva da previsão às variáveis baseada em valores de Shapley (Lundberg e Lee, 2017). Explica o modelo, não a causalidade.',f:'f(x) = φ<sub>0</sub> + Σ<sub>j</sub> φ<sub>j</sub>(x)'},
 fairness:{t:'Equidade algorítmica',en:'fairness',m:['fairness','equidade algorítmica','viés algorítmico'],d:'Avaliação de diferenças de decisão e de erro entre grupos protegidos; proxies de atributos sensíveis podem reintroduzir discriminação.'},
 reject:{t:'Inferência de rejeitados',en:'reject inference',c:'mod',m:['inferência de rejeitados','reject inference','rejeitados'],d:'Correção do viés de seleção: só se observa o default de quem foi aprovado. Modelos treinados só nos aprovados podem subestimar o risco da população de entrada.'},
 champion:{t:'Campeão e desafiante',en:'champion–challenger',c:'mod',m:['champion','challenger','challengers','desafiante','desafiantes'],d:'Prática de manter o modelo vigente (campeão) e comparar alternativas (desafiantes) na mesma amostra fora do tempo antes de qualquer troca.'},
 abt:{t:'Tabela analítica de modelagem',en:'analytical base table (ABT)',m:['ABT'],d:'Base final de modelagem com rótulo, data de observação e atributos versionados, reproduzível e auditável.'}
});

/* ---------- utilidades locais ---------- */
const qEdges=(sorted,k)=>{const e=[];for(let j=1;j<k;j++)e.push(P.quantile(sorted,j/k));return e};
const binOf=(x,e)=>{let lo=0,hi=e.length;while(lo<hi){const m=(lo+hi)>>1;if(x>e[m])lo=m+1;else hi=m}return lo};
const R_corp=pd=>{const w=(1-Math.exp(-50*pd))/(1-Math.exp(-50));return .12*w+.24*(1-w)};

/* =====================================================================
   1 · Janela de performance e censura (Outcome Engineering)
   ===================================================================== */
P.sim('sim-c-window',{
 tag:'Simulador C04 · janela de performance e censura',
 title:'Quanto default você deixa de ver quando a safra ainda é jovem',
 lede:'Trinta e seis safras mensais são observadas hoje. O rótulo é “default em até W meses após a originação”. Safras com menos de W meses ainda não completaram a janela: tratá-las como boas mistura censura com ausência de evento.',
 controls:[
  {k:'pd',label:'PD verdadeira em 12 meses',min:.01,max:.1,step:.005,value:.04,fmt:v=>pct(v,1)},
  {k:'w',label:'Janela de performance W',min:3,max:24,step:1,value:12,fmt:v=>f(v,0)+' meses'},
  {k:'g',label:'Crescimento mensal da originação',min:0,max:.08,step:.005,value:.03,fmt:v=>pct(v,1),tip:'Carteiras em expansão têm mais contratos jovens e, portanto, mais censura.'},
  {k:'mode',type:'seg',label:'Safras com idade < W',options:['contar como não default','excluir (censura)'],value:0,tip:'Excluir é a correção mais simples; modelos de sobrevivência usam a informação parcial em vez de descartá-la.'}],
 kpis:[{k:'tr',label:'Taxa verdadeira em W',color:'c3',tip:'F(W) = 1 − ∏(1 − h<sub>k</sub>), k = 1…W'},{k:'ob',label:'Taxa no rótulo construído',color:'c1'},{k:'bi',label:'Viés relativo',color:'c5'},{k:'ce',label:'Volume censurado',color:'c2',tip:'Participação, em volume, das safras com idade menor que W.'}],
 charts:[{k:'curve',title:'Default acumulado pela idade do contrato · F(m)'},{k:'vint',title:'Taxa rotulada por safra (idade na data-base, meses)'}],
 model(p){
  const g=a=>.5+(a/15)*Math.exp(1-a/15);                                    // maturação: pico perto de 15 meses
  const F=(h0,m)=>{let s=1;for(let a=1;a<=m;a++)s*=1-h0*g(a);return 1-s};
  let lo=0,hi=.5;for(let i=0;i<50;i++){const mid=(lo+hi)/2;F(mid,12)<p.pd?lo=mid:hi=mid}const h0=(lo+hi)/2;
  const Fm=Array.from({length:37},(_,m)=>F(h0,m)),FW=Fm[p.w];
  let sw=0,so=0,sc=0,swc=0;const bars=[];
  for(let a=1;a<=36;a++){const w=Math.pow(1+p.g,-a),o=Fm[Math.min(a,p.w)],young=a<p.w;sw+=w;if(young)sc+=w;
   if(p.mode===0){so+=w*o;swc+=w}else if(!young){so+=w*o;swc+=w}
   bars.push([a,o*100,young?(p.mode===0?'c2':'c4'):'c1'])}
  const ob=so/swc,ce=sc/sw,bias=ob/FW-1;
  return{kpi:{tr:pp(FW,2),ob:pp(ob,2),bi:{v:(bias<0?'−':'+')+f(Math.abs(bias)*100,1)+'%',tone:Math.abs(bias)>.05?'bad':'good'},ce:{v:pp(ce,1),s:p.mode?'descartado da amostra':'rotulado sem janela completa'}},
   charts:{curve:{x:{min:0,max:36,label:'idade (meses)',fmt:v=>f(v,0),name:'idade'},y:{min:0,fmt:v=>f(v,1)+'%'},
     series:[{name:'F(m) · default acumulado',data:Fm.map((v,m)=>[m,v*100]),color:'c1',fill:.25}],
     marks:[{x:p.w,label:'W = '+p.w+'m',color:'gold'},{y:ob*100,label:'rótulo: '+pp(ob,2),color:'c2',align:'left'}]},
    vint:{x:{min:0,max:37,label:'idade da safra (meses)',fmt:v=>f(v,0),name:'idade'},y:{min:0,fmt:v=>f(v,1)+'%'},
     series:[{name:'janela completa',type:'bars',bw:.8,data:bars}],
     marks:[{y:FW*100,label:'F(W) verdadeira',color:'c3'},{x:p.w-.5,label:'janela completa →',color:'gold'}],
     legend:[{name:p.mode?'excluída (censura)':'incompleta, rotulada como boa',color:p.mode?'c4':'c2',k:'box'}]}},
   eq:`DR̂ = Σ<sub>a</sub> w<sub>a</sub>·F(min(a, W)) / Σ<sub>a</sub> w<sub>a</sub> = ${n(ob*100,2)}% · F(W) = 1 − ∏<sub>k=1</sub><sup>${p.w}</sup>(1 − h<sub>k</sub>) = ${n(FW*100,2)}%`,
   take:p.mode===0?`Com ${pp(ce,0)} do volume ainda dentro da janela, o rótulo mostra ${pp(ob,2)} contra ${pp(FW,2)} verdadeiros: o modelo aprenderia uma PD ${f(Math.abs(bias)*100,0)}% menor — e o viés cresce com a expansão da carteira.`:`Excluir as safras incompletas remove o viés (taxa = F(W)), mas descarta ${pp(ce,0)} do volume e deixa a amostra mais velha que a população em que o modelo será aplicado.`};
 }
});

/* =====================================================================
   2 · WOE / IV e vazamento (Feature Engineering)
   ===================================================================== */
P.sim('sim-c-woe',{
 tag:'Simulador C05 · WOE, IV e vazamento',
 title:'Binning de um atributo: peso da evidência, Information Value e o alerta de vazamento',
 lede:'Três mil contratos sintéticos. Escolha o atributo, a forma da relação com o default e o número de faixas por quantis. Compare uma variável legítima (utilização do limite na concessão) com uma que só existe depois do default.',
 controls:[
  {k:'bins',label:'Número de faixas (quantis)',min:3,max:12,step:1,value:6,fmt:v=>f(v,0)},
  {k:'s',label:'Força da relação com o default',min:0,max:2,step:.05,value:1,fmt:v=>f(v,2)+'×'},
  {k:'shape',type:'seg',label:'Forma do risco',options:['monotônica','em U'],value:0,tip:'Em U: risco alto em utilização muito baixa e muito alta. O WOE captura; um coeficiente linear não.'},
  {k:'var',type:'seg',label:'Atributo',options:['utilização (ex ante)','dias em cobrança (pós-default)'],value:0,tip:'A segunda opção é um exemplo de vazamento: a informação só existe depois do evento.'}],
 kpis:[{k:'iv',label:'Information Value',color:'c1',tip:'IV = Σ(g<sub>j</sub>/G − b<sub>j</sub>/B)·WOE<sub>j</sub>'},{k:'auc',label:'AUC do escore WOE',color:'c4'},{k:'mono',label:'WOE monotônico?',color:'c3'},{k:'minb',label:'Menor nº de maus por faixa',color:'c2',tip:'Faixas com poucos maus geram WOE instável; agregue faixas ou suavize.'}],
 charts:[{k:'woe',title:'WOE por faixa (positivo = mais seguro que a média)'},{k:'br',title:'Taxa de default por faixa'}],
 model(p,memo){
  const key=p.s+'|'+p.shape;
  if(memo.key!==key){const r=P.rng(4249),N=3000,u=new Float64Array(N),d=new Float64Array(N),y=new Uint8Array(N);
   for(let i=0;i<N;i++){const x=r()*1.1;const z=p.shape===0?-2.4+p.s*2.2*(x-.45):-2.4+p.s*6.5*((x-.55)**2-.09);u[i]=x;y[i]=r()<sig(z)?1:0;
    d[i]=y[i]?(25+75*r()+8*P.randn(r)):(r()<.04?40*r():Math.abs(4*P.randn(r)))}
   memo.key=key;memo.u=u;memo.d=d;memo.y=y}
  const x=p.var?memo.d:memo.u,y=memo.y,N=y.length,k=p.bins,srt=Float64Array.from(x).sort(),e=qEdges(srt,k);
  const g=new Array(k).fill(0),b=new Array(k).fill(0);for(let i=0;i<N;i++){const j=binOf(x[i],e);y[i]?b[j]++:g[j]++}
  const G=g.reduce((s,v)=>s+v,0),B=b.reduce((s,v)=>s+v,0);
  const woe=g.map((gj,j)=>Math.log(((gj+.5)/(G+.5*k))/((b[j]+.5)/(B+.5*k)))),iv=woe.reduce((s,w,j)=>s+(((g[j]+.5)/(G+.5*k))-((b[j]+.5)/(B+.5*k)))*w,0);
  const sc=Array.from(x,v=>-woe[binOf(v,e)]),auc=P.auc(sc,Array.from(y));
  const dif=woe.slice(1).map((w,j)=>w-woe[j]),mono=dif.every(v=>v>=-1e-9)||dif.every(v=>v<=1e-9);
  const lab=iv<.02?'inútil':iv<.1?'fraco':iv<.3?'médio':iv<.5?'forte':'suspeito';
  const cats=Array.from({length:k},(_,j)=>'F'+(j+1)),dr=B/N;
  return{kpi:{iv:{v:f(iv,3),s:'poder '+lab,tone:iv>.5?'bad':null},auc:{v:f(auc,3),s:'Gini '+f(2*auc-1,3),tone:auc>.95?'bad':null},mono:{v:mono?'sim':'não',s:mono?'ordem preservada':'ordem quebrada: revise faixas'},minb:{v:f(Math.min(...b),0),tone:Math.min(...b)<10?'bad':null}},
   charts:{woe:{x:{cats,label:p.var?'faixas de dias em cobrança':'faixas de utilização',name:'faixa'},y:{zero:true,fmt:v=>f(v,1)},
     series:[{name:'WOE',type:'bars',data:woe.map((w,j)=>[j,w,w>=0?'c1':'c5'])}]},
    br:{x:{cats,name:'faixa'},y:{min:0,fmt:v=>f(v,0)+'%'},
     series:[{name:'taxa de default na faixa',data:b.map((bj,j)=>[j,bj/(bj+g[j])*100]),color:'c2',w:2.4,end:true},{name:'',type:'dots',r:4,color:'c2',data:b.map((bj,j)=>[j,bj/(bj+g[j])*100]),hover:false}],
     marks:[{y:dr*100,label:'média '+pp(dr,1),color:'c3'}]}},
   eq:`IV = Σ<sub>j=1</sub><sup>${k}</sup>(g<sub>j</sub>/G − b<sub>j</sub>/B)·ln[(g<sub>j</sub>/G)/(b<sub>j</sub>/B)] = ${n(iv,3)} · G = ${n(G,0)} bons, B = ${n(B,0)} maus`,
   take:p.var?`IV de ${f(iv,2)} e AUC de ${f(auc,3)} são bons demais: dias em cobrança só existem depois do default. No desenvolvimento a variável “prevê”; na concessão ela simplesmente não existe.`:(p.shape===1&&!mono?`O risco em U aparece no WOE (IV ${f(iv,3)}) mesmo sem monotonicidade. Um coeficiente linear na utilização bruta perderia essa estrutura; o binning a preserva.`:`IV ${f(iv,3)} (${lab}). Mais faixas aumentam o IV mecanicamente, mas reduzem maus por faixa (mínimo ${Math.min(...b)}) e a estabilidade fora da amostra.`)};
 }
});

/* =====================================================================
   3 · Sobreajuste e seleção de atributos (Feature Selection)
   ===================================================================== */
const OV_K=[1,2,3,4,5,6,8,10,12,15,20,25,30,35,40];
P.sim('sim-c-overfit',{
 tag:'Simulador C06 · seleção de atributos e sobreajuste',
 title:'Mais atributos, mais ajuste no treino — e menos generalização',
 lede:'Quarenta atributos candidatos, dos quais só quatro carregam sinal; os demais são ruído correlacionado com eles. O modelo (probabilidade linear com penalização ridge) inclui os k primeiros. A curva de teste usa 2.000 contratos novos.',
 controls:[
  {k:'ntr',label:'Contratos no treino',min:100,max:1500,step:50,value:300,fmt:v=>f(v,0)},
  {k:'lam',label:'Penalização ridge λ',min:0,max:.5,step:.01,value:0,fmt:v=>f(v,2),tip:'Encolhe os coeficientes; troca um pouco de viés por menos variância.'},
  {k:'seed',label:'Amostra (semente)',min:1,max:20,step:1,value:3,fmt:v=>'#'+f(v,0)}],
 kpis:[{k:'kb',label:'k ótimo no teste',color:'gold'},{k:'tb',label:'AUC teste no ótimo',color:'c1'},{k:'tr40',label:'AUC treino com 40',color:'c2'},{k:'gap',label:'Gap treino − teste (k=40)',color:'c5',tip:'Distância entre o desempenho aparente e o real com todos os atributos.'}],
 charts:[{k:'auc',title:'AUC por número de atributos incluídos'}],
 model(p,memo){
  const key=p.ntr+'|'+p.seed,K=40,beta=[.9,-.7,.55,.4];
  if(memo.key!==key){const r=P.rng(900+p.seed*31);const gen=nn=>{const X=[],Y=[];for(let i=0;i<nn;i++){const x=new Float64Array(K);for(let j=0;j<K;j++)x[j]=j<4?P.randn(r):.35*x[j%4]+Math.sqrt(1-.1225)*P.randn(r);
     const z=-1.9+beta[0]*x[0]+beta[1]*x[1]+beta[2]*x[2]+beta[3]*x[3];X.push(x);Y.push(r()<sig(z)?1:0)}return{X,Y}};
   const tr=gen(p.ntr),te=gen(2000),nt=p.ntr,mu=new Float64Array(K);tr.X.forEach(x=>{for(let j=0;j<K;j++)mu[j]+=x[j]/nt});const ym=tr.Y.reduce((s,v)=>s+v,0)/nt;
   const XtX=Array.from({length:K},()=>new Float64Array(K)),Xty=new Float64Array(K);
   tr.X.forEach((x,i)=>{for(let a=0;a<K;a++){const xa=x[a]-mu[a];Xty[a]+=xa*(tr.Y[i]-ym)/nt;for(let b=a;b<K;b++)XtX[a][b]+=xa*(x[b]-mu[b])/nt}});
   for(let a=0;a<K;a++)for(let b=0;b<a;b++)XtX[a][b]=XtX[b][a];
   memo.key=key;Object.assign(memo,{tr,te,mu,ym,XtX,Xty});memo.cache={}}
  const ck=String(p.lam);if(!memo.cache[ck]){const res=OV_K.map(k=>{const A=Array.from({length:k},(_,a)=>Array.from({length:k},(_,b)=>memo.XtX[a][b]+(a===b?p.lam:0))),b=P.solve(A,Array.from(memo.Xty.slice(0,k)));
    const pr=X=>X.map(x=>{let s=memo.ym;for(let j=0;j<k;j++)s+=b[j]*(x[j]-memo.mu[j]);return s});
    return[k,P.auc(pr(memo.tr.X),memo.tr.Y),P.auc(pr(memo.te.X),memo.te.Y)]});memo.cache[ck]=res}
  const res=memo.cache[ck];let best=res[0];res.forEach(r=>{if(r[2]>best[2])best=r});const last=res[res.length-1],gap=last[1]-last[2];
  return{kpi:{kb:{v:f(best[0],0)+' atributos',s:'sinal verdadeiro: 4'},tb:f(best[2],3),tr40:f(last[1],3),gap:{v:f(gap,3),tone:gap>.04?'bad':'good'}},
   charts:{auc:{x:{min:0,max:41,label:'k = atributos incluídos (4 informativos + ruído)',fmt:v=>f(v,0),name:'k'},y:{fmt:v=>f(v,2)},
    series:[{name:'AUC treino',data:res.map(r=>[r[0],r[1]]),color:'c2',w:2.2,dash:[6,4]},{name:'AUC teste (2.000 novos)',data:res.map(r=>[r[0],r[2]]),color:'c1',w:2.6,fill:.12}],
    marks:[{x:4,label:'4 = sinal',color:'c3'},{x:best[0],label:'k* = '+best[0],color:'gold',ly:24}]}},
   eq:`β̂(λ) = (XᵀX/n + ${n(p.lam,2)}·I)<sup>−1</sup>Xᵀy/n · AUC<sub>treino</sub>(40) − AUC<sub>teste</sub>(40) = ${n(last[1],3)} − ${n(last[2],3)} = ${n(gap,3)}`,
   take:gap>.04?`Com ${p.ntr} contratos, incluir os 40 atributos infla a AUC de treino para ${f(last[1],3)} enquanto o teste cai para ${f(last[2],3)}. Mais dados ou λ maior fecham o gap.`:`O gap é pequeno (${f(gap,3)}): amostra e penalização seguram a variância. A seleção ainda importa por custo, estabilidade e interpretação.`};
 }
});

/* =====================================================================
   4 · Logit × probit e efeito de um coeficiente (Default Modeling)
   ===================================================================== */
P.sim('sim-c-link',{
 tag:'Simulador C07 · funções de ligação',
 title:'Logit × probit: o mesmo coeficiente, odds multiplicadas e PDs que não se multiplicam',
 lede:'Escolha a PD de referência (x = 0), o coeficiente logit e um deslocamento Δx do atributo. O probit usa o coeficiente equivalente β/1,6. Compare odds ratio, razão de PDs e efeito marginal.',
 controls:[
  {k:'p0',label:'PD no ponto de referência',min:.005,max:.3,step:.005,value:.04,fmt:v=>pct(v,1)},
  {k:'b',label:'β logit por unidade de x',min:.05,max:1.5,step:.05,value:.6,fmt:v=>f(v,2)},
  {k:'dx',label:'Deslocamento Δx',min:0,max:5,step:.1,value:2,fmt:v=>f(v,1)+' un.'}],
 kpis:[{k:'pl',label:'PD logit em Δx',color:'c1'},{k:'pr',label:'PD probit em Δx',color:'c2'},{k:'or',label:'Odds ratio e^(βΔx)',color:'gold',tip:'Fator que multiplica as odds, não a PD.'},{k:'rr',label:'Razão de PDs',color:'c4',tip:'PD(Δx)/PD(0). Só se aproxima do odds ratio quando a PD é pequena.'},{k:'me',label:'Efeito marginal ∂PD/∂x',color:'c3',tip:'β·PD·(1−PD): o mesmo β pesa mais perto de PD = 50%.'}],
 charts:[{k:'pd',title:'PD em função do atributo'},{k:'lo',title:'Log-odds: linear no logit, curvo no probit'}],
 model(p){
  const z0=Math.log(p.p0/(1-p.p0)),c0=Phinv(p.p0),bp=p.b/1.6,xs=P.linspace(-6,6,61);
  const L=x=>sig(z0+p.b*x),Pr=x=>Phi(c0+bp*x),lo=q=>Math.log(q/(1-q));
  const pl=L(p.dx),pr=Pr(p.dx),or=Math.exp(p.b*p.dx),rr=pl/p.p0,me=p.b*pl*(1-pl);
  return{kpi:{pl:pp(pl,2),pr:pp(pr,2),or:f(or,2)+'×',rr:f(rr,2)+'×',me:{v:f(me*100,2)+' pp',s:'por unidade de x'}},
   charts:{pd:{x:{label:'x (unidades do atributo)',fmt:v=>f(v,0),name:'x'},y:{min:0,max:100,fmt:v=>f(v,0)+'%'},
     series:[{name:'logit',data:xs.map(x=>[x,L(x)*100]),color:'c1',w:2.6},{name:'probit (β/1,6)',data:xs.map(x=>[x,Pr(x)*100]),color:'c2',dash:[6,4]},{name:'',type:'dots',r:5,color:'gold',data:[[0,p.p0*100],[p.dx,pl*100]],hover:false}],
     marks:[{x:0,label:'referência',color:'c3'},{x:p.dx,label:'Δx',color:'gold',ly:24}]},
    lo:{x:{label:'x',fmt:v=>f(v,0),name:'x'},y:{min:-10,max:8,fmt:v=>f(v,0)},
     series:[{name:'log-odds logit',data:xs.map(x=>[x,z0+p.b*x]),color:'c1',w:2.4},{name:'log-odds implícito no probit',data:xs.map(x=>[x,Math.max(-10,Math.min(8,lo(Math.min(1-1e-12,Math.max(1e-12,Pr(x))))))]),color:'c2',dash:[6,4]}]}},
   eq:`PD(Δx) = 1/(1 + e<sup>−(${n(z0,3)} + ${n(p.b,2)}×${n(p.dx,1)})</sup>) = ${n(pl*100,2)}% · OR = e<sup>${n(p.b*p.dx,2)}</sup> = ${n(or,2)} · ∂PD/∂x = β·PD(1−PD) = ${n(me*100,2)} pp`,
   take:`As odds multiplicam por ${f(or,2)}, mas a PD cresce ${f(rr,2)}×: a sigmoide comprime perto de 0 e de 1. ${Math.abs(pr-pl)*1e4>25?`Neste ponto, logit e probit já divergem ${f(Math.abs(pr-pl)*1e4,0)} bp: partindo de PD baixa, a inclinação equivalente β/1,6 não iguala as duas curvas — a escolha da ligação muda o nível da PD.`:'Nesta região, logit e probit praticamente coincidem: a ligação importa longe do centro da distribuição.'}`};
 }
});

/* =====================================================================
   5 · Árvore de decisão por impureza de Gini (Standalone / Ensemble Techniques)
   ===================================================================== */
function cart(X,Y,idx,depth,maxD,minLeaf,box,out){
 const nn=idx.length;let bad=0;for(const i of idx)bad+=Y[i];const p=bad/nn,G=2*p*(1-p);
 const node={box,n:nn,p:(bad+.5)/(nn+1)};
 if(depth>=maxD||nn<2*minLeaf||bad===0||bad===nn){out.leaves.push(node);return node}
 let best=null;
 for(let fx=0;fx<2;fx++){const vals=idx.map(i=>X[i][fx]).sort((a,b)=>a-b),cands=new Set();for(let q=1;q<24;q++)cands.add(vals[Math.floor(q*nn/24)]);
  for(const c of cands){let nl=0,bl=0;for(const i of idx)if(X[i][fx]<=c){nl++;bl+=Y[i]}const nr=nn-nl,br=bad-bl;if(nl<minLeaf||nr<minLeaf)continue;
   const pl=bl/nl,pr=br/nr,gain=G-(nl/nn)*2*pl*(1-pl)-(nr/nn)*2*pr*(1-pr);if(!best||gain>best.gain)best={fx,c,gain}}}
 if(!best||best.gain<1e-5){out.leaves.push(node);return node}
 if(depth===0)out.root=best;
 const L=idx.filter(i=>X[i][best.fx]<=best.c),Rr=idx.filter(i=>X[i][best.fx]>best.c);
 const bl=best.fx===0?{...box,x1:best.c}:{...box,y1:best.c},br=best.fx===0?{...box,x0:best.c}:{...box,y0:best.c};
 out.splits.push(best.fx===0?[best.c,box.y0,best.c,box.y1]:[box.x0,best.c,box.x1,best.c]);
 node.s=best;node.l=cart(X,Y,L,depth+1,maxD,minLeaf,bl,out);node.r=cart(X,Y,Rr,depth+1,maxD,minLeaf,br,out);return node}
const cartPred=(nd,x)=>{while(nd.s)nd=x[nd.s.fx]<=nd.s.c?nd.l:nd.r;return nd.p};
P.sim('sim-c-tree',{
 tag:'Simulador C08 · árvore de decisão (CART)',
 title:'Partições por impureza de Gini: a árvore descobre a interação sozinha — e decora o ruído',
 lede:'Quinhentos contratos de treino em duas dimensões. O risco verdadeiro depende do produto DTI × utilização (uma interação). Aumente a profundidade e veja as folhas se multiplicarem; a AUC de teste, em 500 contratos novos, diz quando a árvore passou a decorar.',
 controls:[
  {k:'d',label:'Profundidade máxima',min:1,max:6,step:1,value:3,fmt:v=>f(v,0)},
  {k:'ml',label:'Mínimo de contratos por folha',min:5,max:60,step:5,value:15,fmt:v=>f(v,0)},
  {k:'s',label:'Força do sinal',min:.4,max:2,step:.1,value:1,fmt:v=>f(v,1)+'×'}],
 kpis:[{k:'lv',label:'Folhas',color:'c2'},{k:'atr',label:'AUC treino',color:'c4'},{k:'ate',label:'AUC teste',color:'c1'},{k:'rg',label:'Ganho de Gini na raiz',color:'gold',tip:'ΔG = G<sub>pai</sub> − Σ(n<sub>filho</sub>/n)·G<sub>filho</sub>, com G = 2p(1−p).'}],
 charts:[{k:'map',title:'Espaço de atributos · retângulos = folhas (cor = PD da folha)'},{k:'dep',title:'AUC por profundidade'}],
 model(p,memo){
  const key=String(p.s);
  if(memo.key!==key){const r=P.rng(777),mk=nn=>{const X=[],Y=[];for(let i=0;i<nn;i++){const a=r(),b=r();X.push([a,b]);Y.push(r()<sig(p.s*(-3.6+6.2*a*b+1.1*a))?1:0)}return{X,Y}};memo.key=key;memo.tr=mk(500);memo.te=mk(500);memo.cache={}}
  const fit=d=>{const ck=d+'|'+p.ml;if(memo.cache[ck])return memo.cache[ck];const out={leaves:[],splits:[],root:null},idx=memo.tr.X.map((_,i)=>i);
   const t=cart(memo.tr.X,memo.tr.Y,idx,0,d,p.ml,{x0:0,x1:1,y0:0,y1:1},out);
   out.atr=P.auc(memo.tr.X.map(x=>cartPred(t,x)),memo.tr.Y);out.ate=P.auc(memo.te.X.map(x=>cartPred(t,x)),memo.te.Y);return memo.cache[ck]=out};
  const cur=fit(p.d),curve=[1,2,3,4,5,6].map(d=>{const o=fit(d);return[d,o.atr,o.ate]});
  const tr=memo.tr,gd=[],bd=[];tr.X.forEach((x,i)=>(tr.Y[i]?bd:gd).push([x[0],x[1]]));
  const gap=cur.atr-cur.ate;
  return{kpi:{lv:f(cur.leaves.length,0),atr:f(cur.atr,3),ate:{v:f(cur.ate,3),tone:gap>.06?'bad':null},rg:cur.root?{v:f(cur.root.gain,4),s:'1ª divisão em '+(cur.root.fx?'utilização':'DTI')+' ≤ '+f(cur.root.c,2)}:{v:'—'}},
   charts:{map:{h:300,x:{min:0,max:1,label:'DTI (normalizado)',fmt:v=>f(v,1),name:'DTI'},y:{min:0,max:1,label:'utilização',fmt:v=>f(v,1)},
     shade:cur.leaves.map(l=>({x0:l.box.x0,x1:l.box.x1,y0:l.box.y0,y1:l.box.y1,color:'c2',a:.03+.7*Math.min(1,l.p*1.6)})),
     series:[{name:'bons',type:'dots',r:2.4,color:'c1',a:.5,data:gd},{name:'maus (default)',type:'dots',r:3.4,color:'c5',a:.95,data:bd},{name:'divisões',type:'seg',w:1.4,color:'c3',data:cur.splits,hover:false}]},
    dep:{x:{min:.5,max:6.5,label:'profundidade',fmt:v=>f(v,0),name:'profundidade'},y:{fmt:v=>f(v,2)},
     series:[{name:'AUC treino',data:curve.map(c=>[c[0],c[1]]),color:'c4',dash:[6,4]},{name:'AUC teste',data:curve.map(c=>[c[0],c[2]]),color:'c1',w:2.6,end:true}],
     marks:[{x:p.d,label:'atual',color:'gold'}]}},
   eq:`G<sub>raiz</sub> = 2p(1−p) com p = ${n(tr.Y.reduce((s,v)=>s+v,0)/tr.Y.length*100,1)}% · ${cur.leaves.length} folhas · AUC<sub>treino</sub> − AUC<sub>teste</sub> = ${n(cur.atr,3)} − ${n(cur.ate,3)} = ${n(gap,3)}`,
   take:gap>.06?`Profundidade ${p.d} com folhas de ${p.ml} contratos já decora o treino: o gap de ${f(gap,3)} é variância pura. Ensembles (bagging, random forest) atacam exatamente esse problema.`:`A árvore aproxima a interação DTI × utilização com degraus, sem termo explícito. ${p.d<3?'Rasa demais, ela ainda tem viés: aumente a profundidade.':'O gap ainda é controlado pelo mínimo de contratos por folha.'}`};
 }
});

/* =====================================================================
   6 · Bagging, random forest e boosting (Ensemble Techniques)
   ===================================================================== */
const EN_M=[1,2,3,4,5,6,8,10,12,15,20,25,30,40,50,60,80,100,120,150,180,210,240,270,300];
P.sim('sim-c-ensemble',{
 tag:'Simulador C09 · ensembles e viés–variância',
 title:'Quanto o erro cai com mais árvores — e onde está o piso',
 lede:'Curvas teóricas da decomposição viés–variância. Uma árvore profunda tem pouco viés e muita variância σ². A média de M árvores com correlação ρ tem variância ρσ² + (1−ρ)σ²/M: o piso ρσ² não some com mais árvores. O random forest sorteia atributos para baixar ρ; o boosting soma árvores rasas para reduzir viés e precisa parar a tempo.',
 controls:[
  {k:'rho',label:'Correlação entre árvores (bagging)',min:0,max:.9,step:.05,value:.5,fmt:v=>f(v,2)},
  {k:'mt',label:'Fração de atributos por divisão (RF)',min:.1,max:1,step:.05,value:.33,fmt:v=>pct(v,0),tip:'mtry/p. Menos atributos por divisão = árvores menos correlacionadas, cada uma um pouco pior.'},
  {k:'nu',label:'Taxa de aprendizado ν (boosting)',min:.01,max:.3,step:.01,value:.1,fmt:v=>f(v,2)}],
 play:{label:'▶ Crescer o ensemble',dur:6500},
 kpis:[{k:'one',label:'Erro de 1 árvore profunda',color:'c3'},{k:'bag',label:'Bagging com M árvores',color:'c4'},{k:'rf',label:'Random forest',color:'c1'},{k:'bo',label:'Boosting',color:'c2'},{k:'bm',label:'M ótimo do boosting',color:'gold',tip:'Parada antecipada: depois dele, o boosting começa a ajustar ruído.'}],
 charts:[{k:'err',title:'Erro esperado de teste (unidades de Brier ×100) por número de árvores M'}],
 model(p){
  const noise=.08,b2=.01,s2=.06,rf_rho=p.rho*(.25+.75*p.mt),rf_b2=b2*(1+.8*(1-p.mt));
  const bag=M=>noise+b2+p.rho*s2+(1-p.rho)*s2/M,rf=M=>noise+rf_b2+rf_rho*s2+(1-rf_rho)*s2/M;
  const bo=M=>noise+.06*Math.exp(-p.nu*M/6)+.004+.012*(1-Math.exp(-p.nu*M/25))+.00045*p.nu*M;
  const Mt=Math.max(1,Math.round(1+p.t*299)),cut=M=>M<=Mt;
  let bm=1;for(let M=1;M<=300;M++)if(bo(M)<bo(bm))bm=M;
  const S=fn=>EN_M.map(M=>[M,cut(M)?fn(M)*100:NaN]);
  return{kpi:{one:f(bag(1)*100,2),bag:{v:f(bag(Mt)*100,2),s:'M = '+Mt},rf:{v:f(rf(Mt)*100,2),s:'piso ρσ² = '+f((noise+rf_b2+rf_rho*s2)*100,2)},bo:f(bo(Mt)*100,2),bm:{v:f(bm,0)+' árvores',s:'erro mínimo '+f(bo(bm)*100,2)}},
   charts:{err:{x:{min:0,max:305,label:'M (árvores)',fmt:v=>f(v,0),name:'M'},y:{min:7.5,max:16,fmt:v=>f(v,1)},
    series:[{name:'bagging',data:S(bag),color:'c4',w:2.2},{name:'random forest',data:S(rf),color:'c1',w:2.6},{name:'boosting',data:S(bo),color:'c2',w:2.4,dash:[7,4]}],
    marks:[{y:(noise+p.rho*s2+b2)*100,label:'piso do bagging: ruído + viés + ρσ²',color:'c4'},{x:bm,label:'M* boosting',color:'gold',ly:24},...(p.t<1?[{x:Mt,label:'M = '+Mt,color:'c3',ly:40}]:[])]}},
   eq:`Var(f̄<sub>M</sub>) = ρσ² + (1−ρ)σ²/M = ${n(p.rho,2)}×${n(s2,3)} + ${n(1-p.rho,2)}×${n(s2,3)}/${Mt} = ${n((p.rho*s2+(1-p.rho)*s2/Mt)*100,3)}×10<sup>−2</sup> · RF: ρ = ${n(rf_rho,3)}`,
   take:`Com ρ = ${f(p.rho,2)}, nem infinitas árvores descem abaixo de ${f((noise+b2+p.rho*s2)*100,2)}: o bagging esbarra na correlação. O random forest, sorteando ${pct(p.mt,0)} dos atributos, baixa ρ para ${f(rf_rho,2)}; o boosting com ν = ${f(p.nu,2)} atinge o mínimo em ~${bm} árvores e depois piora.`};
 },
 note:'Curvas teóricas com parâmetros ilustrativos (ruído 0,08; viés² 0,01; σ² 0,06), baseadas em Breiman (1996, 2001) e Hastie, Tibshirani e Friedman (2009). Não é um treino real.'
});

/* =====================================================================
   7 · Validação: discriminação × calibração (Validation)
   ===================================================================== */
P.sim('sim-c-valid',{
 tag:'Simulador C10 · ROC, KS, confusão e confiabilidade',
 title:'Discriminação não é calibração: mexa na inclinação e no intercepto sem mudar a AUC',
 lede:'Dois mil contratos com escores binormais. A PD reportada é uma distorção monótona da PD verdadeira: logit(p̂) = a + b·logit(p). A ordenação (ROC, AUC, KS) não muda; o nível das PDs, o Brier e o teste de Hosmer–Lemeshow mudam. O ponto de corte define a matriz de confusão.',
 cols:3,
 controls:[
  {k:'sep',label:'Separação entre bons e maus (μ)',min:.3,max:3,step:.1,value:1.4,fmt:v=>f(v,1)+' dp'},
  {k:'pi',label:'Prevalência de default',min:.02,max:.3,step:.01,value:.1,fmt:v=>pct(v,0)},
  {k:'b',label:'Inclinação de calibração b',min:.4,max:1.8,step:.05,value:1,fmt:v=>f(v,2),tip:'b &lt; 1: PDs comprimidas para o meio; b &gt; 1: PDs extremas demais.'},
  {k:'a',label:'Intercepto de calibração a',min:-1.5,max:1.5,step:.05,value:0,fmt:v=>(v>0?'+':'')+f(v,2),tip:'a &gt; 0 superestima todas as PDs; a &lt; 0 subestima.'},
  {k:'c',label:'Ponto de corte (PD reportada)',min:.02,max:.6,step:.01,value:.15,fmt:v=>pct(v,0)}],
 kpis:[{k:'auc',label:'AUC · Gini',color:'c1'},{k:'ks',label:'KS',color:'c4'},{k:'bs',label:'Brier (modelo)',color:'c2',tip:'Compare com o Brier das PDs verdadeiras no subtítulo.'},{k:'hl',label:'Hosmer–Lemeshow · p',color:'c5',tip:'10 grupos, χ² com 8 graus de liberdade.'},{k:'cm',label:'No corte: TPR · FPR',color:'gold',tip:'TPR = maus recusados / maus; FPR = bons recusados / bons.'}],
 charts:[{k:'roc',title:'Curva ROC e KS',h:270},{k:'rel',title:'Confiabilidade por decil',h:270},{k:'cm',title:'Matriz de confusão no corte',h:270}],
 model(p,memo){
  const key=p.sep+'|'+p.pi;
  if(memo.key!==key){const r=P.rng(2028),N=2000,s=new Float64Array(N),y=new Uint8Array(N),pt=new Float64Array(N);
   for(let i=0;i<N;i++){y[i]=r()<p.pi?1:0;s[i]=(y[i]?p.sep:0)+P.randn(r);const a=p.pi*P.npdf(s[i]-p.sep),b=(1-p.pi)*P.npdf(s[i]);pt[i]=a/(a+b)}
   const sb=[],sg=[];for(let i=0;i<N;i++)(y[i]?sb:sg).push(s[i]);sb.sort((a,b)=>a-b);sg.sort((a,b)=>a-b);
   const all=Array.from(s).sort((a,b)=>a-b),roc=[];for(let k=0;k<=40;k++){const thr=k===0?-Infinity:k===40?Infinity:all[Math.floor(k/40*N)];const cnt=a=>{let lo=0,hi=a.length;while(lo<hi){const m=(lo+hi)>>1;a[m]<thr?lo=m+1:hi=m}return a.length-lo};roc.push([cnt(sg)/sg.length,cnt(sb)/sb.length])}
   roc.sort((u,v)=>u[0]-v[0]||u[1]-v[1]);
   let ks=0,ksx=0,i=0,j=0;while(i<sb.length||j<sg.length){const v=Math.min(i<sb.length?sb[i]:Infinity,j<sg.length?sg[j]:Infinity);while(i<sb.length&&sb[i]<=v)i++;while(j<sg.length&&sg[j]<=v)j++;const d=j/sg.length-i/sb.length;if(d>ks){ks=d;ksx=1-j/sg.length}}
   const auc=P.auc(Array.from(s),Array.from(y)),bs0=pt.reduce((S,v,k)=>S+(v-y[k])**2,0)/N;
   memo.key=key;Object.assign(memo,{s,y,pt,roc,ks,ksx,auc,bs0,N})}
  const {y,pt,N}=memo,ph=Array.from(pt,v=>{const q=Math.min(1-1e-9,Math.max(1e-9,v));return sig(p.a+p.b*Math.log(q/(1-q)))});
  let bs=0,TP=0,FN=0,FP=0,TN=0;for(let i=0;i<N;i++){bs+=(ph[i]-y[i])**2;const rej=ph[i]>=p.c;if(y[i])rej?TP++:FN++;else rej?FP++:TN++}bs/=N;
  const ord=ph.map((v,i)=>i).sort((u,v)=>ph[u]-ph[v]),rel=[];let HL=0,REL=0,RES=0;const ob=y.reduce((S,v)=>S+v,0)/N;
  for(let k=0;k<10;k++){const sl=ord.slice(Math.floor(k*N/10),Math.floor((k+1)*N/10)),nk=sl.length;let E=0,O=0;sl.forEach(i=>{E+=ph[i];O+=y[i]});rel.push([E/nk*100,O/nk*100]);
   HL+=(O-E)**2/Math.max(1e-9,E*(1-E/nk));REL+=nk*(E/nk-O/nk)**2/N;RES+=nk*(O/nk-ob)**2/N}
  const hp=1-P.chi2cdf(HL,8),tpr=TP/(TP+FN),fpr=FP/(FP+TN),mx=Math.max(...rel.map(r=>Math.max(r[0],r[1])))*1.08;
  return{kpi:{auc:{v:f(memo.auc,3)+' · '+f(2*memo.auc-1,3),s:'não depende de a e b'},ks:f(memo.ks,3),bs:{v:f(bs,4),s:'PDs verdadeiras: '+f(memo.bs0,4),tone:bs>memo.bs0*1.05?'bad':'good'},hl:{v:f(HL,1)+' · '+(hp<.001?'<0,1%':pct(hp,1)),tone:hp<.05?'bad':'good'},cm:pct(tpr,0)+' · '+pct(fpr,0)},
   charts:{roc:{h:270,x:{min:0,max:1,label:'FPR',fmt:v=>f(v,1),name:'FPR'},y:{min:0,max:1,fmt:v=>f(v,1)},
     series:[{name:'aleatório',data:[[0,0],[1,1]],color:'c3',w:1,dash:[4,4],hover:false},{name:'ROC',data:memo.roc,color:'c1',w:2.6,fill:.14},{name:'KS',type:'seg',color:'c4',w:2,data:[[memo.ksx,memo.ksx,memo.ksx,memo.ksx+memo.ks]],hover:false},{name:'corte',type:'dots',r:5.5,color:'gold',data:[[fpr,tpr]]}]},
    rel:{h:270,x:{min:0,max:mx,label:'PD média prevista (%)',fmt:v=>f(v,0),name:'PD prevista'},y:{min:0,max:mx,fmt:v=>f(v,0)+'%'},
     series:[{name:'calibração perfeita',data:[[0,0],[mx,mx]],color:'c3',w:1,dash:[4,4],hover:false},{name:'observado por decil',data:rel,color:'c2',w:2.2},{name:'',type:'dots',r:4,color:'c2',data:rel,hover:false}]},
    cm:{h:270,heat:{z:[[TP,FN],[FP,TN]],xl:['recusado','aprovado'],yl:['mau','bom'],fmt:v=>f(v,0),color:'c1'},ml:48,x:{label:'decisão no corte'}}},
   eq:`BS = REL − RES + UNC ≈ ${n(REL,4)} − ${n(RES,4)} + ${n(ob*(1-ob),4)} = ${n(REL-RES+ob*(1-ob),4)} (direto: ${n(bs,4)}) · HL = ${n(HL,1)} ~ χ²<sub>8</sub>`,
   take:Math.abs(p.b-1)<.06&&Math.abs(p.a)<.06?`PDs calibradas: o Brier (${f(bs,4)}) é o mínimo possível para esta separação. Agora mude a ou b — a AUC ${f(memo.auc,3)} não se move, mas provisão e capital mudariam.`:`A AUC continua ${f(memo.auc,3)}, mas a calibração quebrou: REL = ${f(REL,4)} e o HL ${hp<.05?'rejeita':'ainda não rejeita'} o modelo. Ranking bom com nível errado erra ECL e capital.`};
 }
});

/* =====================================================================
   8 · Hazard discreto, TTC × PIT (Multi-period Modeling)
   ===================================================================== */
P.sim('sim-c-hazard',{
 tag:'Simulador C11 · hazard multiperíodo e ciclo',
 title:'PD point-in-time ao longo de 60 meses: o ciclo entra pelo hazard',
 lede:'Um fator macro z<sub>t</sub> oscila em ciclo e sofre um choque recessivo perto do mês 18. O hazard anual de cada mês vem da fórmula de um fator (h = Φ[(Φ⁻¹(PD) − √ρ·z)/√(1−ρ)]); a sobrevivência acumula os hazards mensais. Compare com a PD through-the-cycle constante.',
 controls:[
  {k:'pd',label:'PD anual TTC',min:.005,max:.1,step:.005,value:.03,fmt:v=>pct(v,1)},
  {k:'rho',label:'Sensibilidade ao ciclo ρ',min:.02,max:.3,step:.01,value:.12,fmt:v=>f(v,2)},
  {k:'amp',label:'Amplitude do ciclo',min:0,max:2.5,step:.1,value:1,fmt:v=>f(v,1)+' dp'},
  {k:'sh',label:'Choque recessivo (mês 18)',min:0,max:3,step:.1,value:1.5,fmt:v=>f(v,1)+' dp'}],
 play:{label:'▶ Percorrer 60 meses',dur:7000},
 kpis:[{k:'p12',label:'PD 12m PIT',color:'c1'},{k:'t12',label:'PD 12m TTC',color:'c3'},{k:'l5',label:'PD lifetime 5 anos · PIT',color:'c2'},{k:'pk',label:'Pico do hazard anual',color:'c5'},{k:'now',label:'Hazard anual no mês',color:'gold'}],
 charts:[{k:'hz',title:'Hazard anualizado por mês · PIT × TTC'},{k:'cum',title:'PD acumulada (1 − S(t))'}],
 model(p){
  const T=60,z=t=>p.amp*Math.sin(2*Math.PI*t/48+.6)-p.sh*Math.exp(-(((t-18)/5)**2)),sr=Math.sqrt(p.rho),c=Phinv(p.pd);
  const ha=t=>Phi((c-sr*z(t))/Math.sqrt(1-p.rho)),ht=toM(p.pd);
  const H=[],C=[],CT=[];let S=1,ST=1;for(let t=0;t<=T;t++){if(t>0){S*=1-toM(ha(t));ST*=1-ht}H.push(ha(t));C.push(1-S);CT.push(1-ST)}
  const tp=Math.round(p.t*T),cut=(t,v)=>t<=tp?v:NaN;let pk=0,pkt=0;for(let t=1;t<=T;t++)if(H[t]>pk){pk=H[t];pkt=t}
  const sh=[];let st=null;for(let t=0;t<=T;t++){const rec=z(t)<-1;if(rec&&st===null)st=t;if((!rec||t===T)&&st!==null){sh.push({x0:st,x1:t,color:'c5',a:.1,label:sh.length?'':'recessão'});st=null}}
  return{kpi:{p12:pp(C[12],2),t12:pp(CT[12],2),l5:{v:pp(C[60],1),s:'TTC: '+pp(CT[60],1),tone:C[60]>CT[60]*1.1?'bad':null},pk:{v:pp(pk,2),s:'no mês '+pkt},now:{v:pp(H[Math.max(1,tp)],2),s:'mês '+Math.max(1,tp)+' · z = '+f(z(Math.max(1,tp)),2)}},
   charts:{hz:{x:{min:0,max:60,label:'mês',fmt:v=>f(v,0),name:'mês'},y:{min:0,fmt:v=>f(v,1)+'%'},shade:sh,
     series:[{name:'hazard PIT (anualizado)',data:H.map((v,t)=>[t,cut(t,v*100)]),color:'c1',w:2.6,end:true},{name:'TTC constante',data:H.map((v,t)=>[t,p.pd*100]),color:'c3',dash:[6,4]}]},
    cum:{x:{min:0,max:60,label:'mês',fmt:v=>f(v,0),name:'mês'},y:{min:0,fmt:v=>f(v,1)+'%'},
     series:[{name:'PIT',data:C.map((v,t)=>[t,cut(t,v*100)]),color:'c1',fill:.22,end:true},{name:'TTC',data:CT.map((v,t)=>[t,v*100]),color:'c3',dash:[6,4]}]}},
   eq:`h<sub>${pkt}</sub> = Φ[(Φ<sup>−1</sup>(${n(p.pd*100,1)}%) − √${n(p.rho,2)}·(${n(z(pkt),2)}))/√(1−${n(p.rho,2)})] = ${n(pk*100,2)}% a.a. · S(60) = ∏(1 − h<sub>t</sub><sup>mensal</sup>) = ${n((1-C[60])*100,2)}%`,
   take:p.sh>0||p.amp>0?`O choque leva o hazard a ${pp(pk,1)} ao ano no mês ${pkt}, ${f(pk/p.pd,1)}× a PD TTC. Provisões (IFRS 9) usam a curva PIT; capital IRB usa a TTC para não amplificar o ciclo.`:'Sem ciclo nem choque, PIT e TTC coincidem: a diferença entre elas é exatamente o fator macro.'};
 }
});

/* =====================================================================
   9 · LGD bimodal: cura, workout, desconto (LGD Modeling)
   ===================================================================== */
P.sim('sim-c-lgd',{
 tag:'Simulador C12 · distribuição de LGD',
 title:'Por que a LGD é bimodal: curas perto de zero, workouts longos perto de um',
 lede:'Dois mil defaults sintéticos. Uma fração se cura (LGD ≈ 0); o restante entra em workout, com recuperação nominal ~ Beta, prazo aleatório em torno de T anos, custos e desconto. O choque de downturn reduz curas e recuperações ao mesmo tempo.',
 controls:[
  {k:'cu',label:'Taxa de cura',min:0,max:.6,step:.05,value:.3,fmt:v=>pct(v,0)},
  {k:'m',label:'Recuperação nominal média (workout)',min:.2,max:.9,step:.05,value:.55,fmt:v=>pct(v,0)},
  {k:'T',label:'Prazo médio de recuperação',min:.5,max:5,step:.25,value:2,fmt:v=>f(v,2)+' anos'},
  {k:'r',label:'Taxa de desconto',min:.04,max:.2,step:.01,value:.1,fmt:v=>pct(v,0)},
  {k:'c',label:'Custos de cobrança (% EAD)',min:0,max:.15,step:.01,value:.05,fmt:v=>pct(v,0)},
  {k:'dt',label:'Choque de downturn',min:0,max:.4,step:.05,value:.2,fmt:v=>pct(v,0),tip:'Reduz a recuperação média nesse percentual e as curas em 1,2× esse percentual.'}],
 kpis:[{k:'mu',label:'LGD média',color:'c1'},{k:'md',label:'LGD mediana',color:'c3',tip:'Em distribuições bimodais, média e mediana contam histórias diferentes.'},{k:'lo',label:'Defaults com LGD < 10%',color:'c4'},{k:'hi',label:'Defaults com LGD > 90%',color:'c5'},{k:'dw',label:'LGD de downturn',color:'c2'}],
 charts:[{k:'h',title:'Distribuição das LGDs realizadas (% dos defaults)'},{k:'pv',title:'Valor presente da recuperação × prazo'}],
 model(p){
  const kap=2.2,draw=(cu,m,seed)=>{const r=P.rng(seed),a=m*kap,b=(1-m)*kap,out=new Float64Array(2000);
    for(let i=0;i<2000;i++){if(r()<cu){out[i]=.005+.03*r();continue}const R=P.rbeta(r,a,b),Ti=p.T*(.5+r());out[i]=Math.min(1.1,Math.max(0,1-R/Math.pow(1+p.r,Ti)+p.c*(.6+.8*r())))}return out};
  const L=draw(p.cu,p.m,515),D=draw(Math.max(0,p.cu*(1-1.2*p.dt)),p.m*(1-p.dt),516),srt=Float64Array.from(L).sort();
  const mu=P.mean(Array.from(L)),md=P.quantile(srt,.5),lo=L.filter(v=>v<.1).length/2000,hi=L.filter(v=>v>.9).length/2000,dw=P.mean(Array.from(D));
  const hs=P.hist(Array.from(L),22,0,1.1).map(([x,c])=>[x*100,c/20]),hd=P.hist(Array.from(D),22,0,1.1).map(([x,c])=>[x*100,c/20]);
  const yrs=P.linspace(0,6,25);
  return{kpi:{mu:pp(mu,1),md:pp(md,1),lo:pp(lo,0),hi:pp(hi,0),dw:{v:pp(dw,1),s:'+'+f((dw-mu)*100,1)+' pp sobre a média',tone:'bad'}},
   charts:{h:{x:{min:0,max:110,label:'LGD (%)',fmt:v=>f(v,0)+'%',name:'LGD'},y:{min:0,fmt:v=>f(v,0)+'%'},
     series:[{name:'base',type:'bars',bw:4.6,off:-1.2,data:hs,color:'c1',a:.85},{name:'downturn',type:'bars',bw:4.6,off:1.2,data:hd,color:'c2',a:.55}],
     marks:[{x:mu*100,label:'média '+pp(mu,0),color:'c3'},{x:dw*100,label:'downturn '+pp(dw,0),color:'c2',ly:24}]},
    pv:{x:{min:0,max:6,label:'anos até a recuperação',fmt:v=>f(v,0),name:'anos'},y:{min:0,max:100,fmt:v=>f(v,0)+'%'},
     series:[{name:'recuperação nominal',data:yrs.map(t=>[t,p.m*100]),color:'c3',dash:[6,4]},{name:'valor presente',data:yrs.map(t=>[t,p.m/Math.pow(1+p.r,t)*100]),color:'c1',fill:.2}],
     marks:[{x:p.T,label:'T = '+f(p.T,1)+' anos',color:'gold'}]}},
   eq:`E[LGD] = π<sub>cura</sub>·LGD<sub>cura</sub> + (1−π<sub>cura</sub>)·E[1 − R/(1+r)<sup>τ</sup> + c] ≈ ${n(p.cu,2)}×0,02 + ${n(1-p.cu,2)}×(1 − ${n(p.m,2)}/${n(1+p.r,2)}<sup>${n(p.T,2)}</sup> + ${n(p.c,2)}) = ${n(mu*100,1)}%`,
   take:`Média de ${pp(mu,0)}, mas ${pp(lo,0)} dos defaults perdem menos de 10% e ${pp(hi,0)} perdem mais de 90%: quase ninguém está “na média”. Por isso modelos de LGD separam probabilidade de cura e severidade do workout. No downturn a média sobe ${f((dw-mu)*100,1)} pp.`};
 }
});

/* =====================================================================
   10 · EAD e CCF: saques antes do default (Exposure Modeling)
   ===================================================================== */
P.sim('sim-c-ccf',{
 tag:'Simulador C13 · EAD de linhas rotativas',
 title:'Saques na reta final: saldo, limite e o CCF realizado',
 lede:'Uma linha de R$ 100 mil é acompanhada nos 24 meses antes do default. O devedor saca de forma acelerada à medida que a dificuldade aumenta; o banco pode cortar o limite seis meses antes. O CCF é medido entre a data de referência e o default. À direita, 300 contas mostram por que o CCF é instável quando sobra pouco limite.',
 controls:[
  {k:'u0',label:'Utilização inicial',min:.05,max:.95,step:.05,value:.45,fmt:v=>pct(v,0)},
  {k:'k',label:'Intensidade do saque',min:0,max:1,step:.05,value:.6,fmt:v=>pct(v,0),tip:'Fração do limite livre inicial sacada até o default (curva convexa: acelera perto do evento).'},
  {k:'cut',label:'Corte de limite no mês −6',min:0,max:.5,step:.05,value:0,fmt:v=>pct(v,0)},
  {k:'ref',label:'Data de referência',min:3,max:12,step:1,value:12,fmt:v=>f(v,0)+' meses antes'}],
 play:{label:'▶ Caminhar até o default',dur:6000},
 kpis:[{k:'ead',label:'EAD no default',color:'c1'},{k:'ccf',label:'CCF realizado',color:'gold',tip:'(EAD − B<sub>r</sub>)/(L<sub>r</sub> − B<sub>r</sub>)'},{k:'hr',label:'Limite livre na referência',color:'c3'},{k:'ut',label:'Utilização no default',color:'c2'},{k:'sd',label:'Dispersão do CCF (contas com pouco limite livre)',color:'c5',tip:'Desvio-padrão do CCF entre contas com limite livre &lt; 10% na referência.'}],
 charts:[{k:'path',title:'Saldo e limite (R$ mil) nos meses antes do default'},{k:'sc',title:'CCF × utilização na referência · 300 contas'}],
 model(p,memo){
  const L0=100,d=(t,k)=>k*Math.pow((t+24)/24,3);
  const path=(u0,k,cut)=>{const B=[],Lm=[];const Bc=L0*u0+L0*(1-u0)*d(-6,k),Lc=Math.max(L0*(1-cut),Bc);for(let t=-24;t<=0;t++){const lim=t>=-6?Lc:L0;Lm.push(lim);B.push(Math.min(lim,L0*u0+L0*(1-u0)*d(t,k)))}return{B,Lm}};
  const {B,Lm}=path(p.u0,p.k,p.cut),ir=24-p.ref,Br=B[ir],Lr=Lm[ir],ead=B[24],hr=Lr-Br,ccf=hr>.5?(ead-Br)/hr:NaN;
  if(!memo.acc){const r=P.rng(1313);memo.acc=Array.from({length:300},()=>({u:.05+.94*r(),k:.6+.8*r(),e:P.randn(r)*4}))}
  const pts=[],small=[];memo.acc.forEach(a=>{const q=path(a.u,Math.min(1,p.k*a.k),p.cut),b=q.B[ir],l=q.Lm[ir],e=Math.max(0,Math.min(q.Lm[24],q.B[24]+a.e)),h=l-b;if(h<=.2)return;const c=(e-b)/h;pts.push([b/l*100,Math.max(-1.5,Math.min(3,c))]);if(h/l<.1)small.push(c)});
  const sd=small.length>3?P.sd(small):NaN,tp=Math.round(p.t*24),cut=(i,v)=>i<=tp?v:NaN,xs=B.map((_,i)=>i-24);
  return{kpi:{ead:{v:'R$ '+f(ead,1)+' mil',s:'saldo na referência: R$ '+f(Br,1)+' mil'},ccf:Number.isFinite(ccf)?{v:pct(ccf,0)}:{v:'indefinido',s:'sem limite livre na referência'},hr:'R$ '+f(hr,1)+' mil',ut:pct(ead/L0,0),sd:{v:Number.isFinite(sd)?f(sd,2):'—',s:small.length+' contas',tone:sd>.5?'bad':null}},
   charts:{path:{x:{min:-24,max:0,label:'meses até o default',fmt:v=>f(v,0),name:'mês'},y:{min:0,max:120,fmt:v=>f(v,0)},
     series:[{name:'limite',type:'step',data:Lm.map((v,i)=>[xs[i],cut(i,v)]),color:'c3',w:2},{name:'saldo',data:B.map((v,i)=>[xs[i],cut(i,v)]),color:'c1',fill:.28,end:true}],
     marks:[{x:-p.ref,label:'referência',color:'gold'},...(p.cut>0?[{x:-6,label:'corte',color:'c5',ly:24}]:[])]},
    sc:{x:{min:0,max:100,label:'utilização na referência (%)',fmt:v=>f(v,0),name:'utilização'},y:{min:-1.5,max:3,fmt:v=>f(v,1)},
     series:[{name:'CCF por conta',type:'dots',r:2.6,color:'c4',a:.7,data:pts},{name:'esta conta',type:'dots',r:6,color:'gold',data:Number.isFinite(ccf)?[[Br/Lr*100,Math.max(-1.5,Math.min(3,ccf))]]:[]}],
     marks:[{y:0,label:'CCF = 0',color:'c3',align:'left'},{y:1,label:'CCF = 1 (limite todo sacado)',color:'c3',align:'left'}]}},
   eq:`CCF = (EAD − B<sub>r</sub>)/(L<sub>r</sub> − B<sub>r</sub>) = (${n(ead,1)} − ${n(Br,1)})/(${n(Lr,1)} − ${n(Br,1)}) = ${Number.isFinite(ccf)?n(ccf*100,0)+'%':'indefinido'} · EAD = B<sub>r</sub> + CCF·(L<sub>r</sub> − B<sub>r</sub>)`,
   take:p.cut>0?`O corte de ${pct(p.cut,0)} do limite no mês −6 contém o saque defensivo: EAD de R$ ${f(ead,1)} mil. Gestão de limites é uma alavanca de EAD tão importante quanto o modelo.`:`Com ${pct(hr/L0,0)} de limite livre na referência, o devedor chega ao default com ${pct(ead/L0,0)} de utilização. Quando o limite livre é pequeno, o denominador explode o CCF (dispersão ${Number.isFinite(sd)?f(sd,2):'—'}): por isso se modela EAD por fatores alternativos ou por segmentos.`};
 }
});

/* =====================================================================
   11 · IFRS 9: estágio 1 × 2 e o efeito penhasco (Expected Credit Losses)
   ===================================================================== */
P.sim('sim-c-stage',{
 tag:'Simulador C14 · staging IFRS 9',
 title:'Do estágio 1 ao 2: o salto da ECL de 12 meses para a vida inteira',
 lede:'Empréstimo de R$ 100 mil, amortização linear, LGD constante e desconto à taxa efetiva de 8%. A PD atual é um múltiplo da PD na originação; ao cruzar o limiar relativo de aumento significativo (SICR), a provisão passa de 12 meses para lifetime. O estágio 3 (ativo com problema de recuperação) não é modelado.',
 controls:[
  {k:'pd0',label:'PD anual na originação',min:.005,max:.05,step:.0025,value:.01,fmt:v=>pct(v,2)},
  {k:'m',label:'PD atual ÷ PD da originação',min:.5,max:6,step:.1,value:1.5,fmt:v=>f(v,1)+'×'},
  {k:'tau',label:'Limiar SICR (relativo)',min:1.5,max:4,step:.1,value:2,fmt:v=>f(v,1)+'×'},
  {k:'M',label:'Prazo remanescente',min:1,max:10,step:1,value:5,fmt:v=>f(v,0)+' anos'},
  {k:'lgd',label:'LGD',min:.1,max:.8,step:.05,value:.4,fmt:v=>pct(v,0)}],
 kpis:[{k:'st',label:'Estágio',color:'gold'},{k:'e12',label:'ECL 12 meses',color:'c1'},{k:'el',label:'ECL lifetime',color:'c2'},{k:'bk',label:'Provisão contabilizada',color:'c4'},{k:'cl',label:'Efeito penhasco',color:'c5',tip:'ECL lifetime ÷ ECL 12m: o salto ao migrar de estágio.'}],
 charts:[{k:'cliff',title:'Provisão em função da deterioração da PD'},{k:'yr',title:'ECL marginal por ano (R$ mil)'}],
 model(p){
  const ecl=(h,full)=>{let S=1,e=0,yrs=[];for(let y=1;y<=10;y++){const v=y<=p.M?S*h*p.lgd*100*(1-(y-1)/p.M)/Math.pow(1.08,y-.5):0;yrs.push(v);if(y<=(full?p.M:1))e+=v;S*=1-h}return{e,yrs}};
  const h=Math.min(.99,p.pd0*p.m),st=p.m>=p.tau?2:1,a=ecl(h,false),b=ecl(h,true),bk=st===2?b.e:a.e;
  const grid=P.linspace(.5,6,56).map(m=>{const hh=Math.min(.99,p.pd0*m);return[m,ecl(hh,false).e,ecl(hh,true).e,m>=p.tau?ecl(hh,true).e:ecl(hh,false).e]});
  return{kpi:{st:{v:'Estágio '+st,s:st===2?'SICR: lifetime':'sem SICR: 12 meses',tone:st===2?'bad':'good'},e12:'R$ '+f(a.e,2)+' mil',el:'R$ '+f(b.e,2)+' mil',bk:'R$ '+f(bk,2)+' mil',cl:{v:f(b.e/a.e,2)+'×',s:'prazo de '+p.M+' anos'}},
   charts:{cliff:{x:{min:.5,max:6,label:'PD atual ÷ PD da originação',fmt:v=>f(v,1)+'×',name:'múltiplo'},y:{min:0,fmt:v=>f(v,1)},
     series:[{name:'ECL 12m',data:grid.map(g=>[g[0],g[1]]),color:'c3',dash:[5,4],w:1.6},{name:'ECL lifetime',data:grid.map(g=>[g[0],g[2]]),color:'c2',dash:[5,4],w:1.6},{name:'provisão (com staging)',type:'step',data:grid.map(g=>[g[0],g[3]]),color:'c1',w:2.8},{name:'',type:'dots',r:6,color:'gold',data:[[p.m,bk]],hover:false}],
     marks:[{x:p.tau,label:'limiar SICR',color:'c5'}]},
    yr:{x:{cats:['1','2','3','4','5','6','7','8','9','10'],label:'ano',name:'ano'},y:{min:0,fmt:v=>f(v,2)},
     series:[{name:'ECL marginal',type:'bars',data:b.yrs.map((v,i)=>[i,v,i===0?'c1':(st===2?'c2':'c4')])}]}},
   eq:`ECL<sub>life</sub> = Σ<sub>t=1</sub><sup>${p.M}</sup> S(t−1)·h·LGD·EAD<sub>t</sub>·(1,08)<sup>−(t−½)</sup> = ${n(b.e,2)} · ECL<sub>12m</sub> = ${n(a.e,2)} · h = ${n(h*100,2)}%`,
   take:st===2?`A PD subiu ${f(p.m,1)}× e cruzou o limiar de ${f(p.tau,1)}×: a provisão salta ${f(b.e/a.e,1)}× de uma vez. Esse penhasco torna o staging uma das decisões de maior impacto em resultado.`:`Abaixo do limiar, a provisão cresce suavemente com a PD (12 meses). Um passo além de ${f(p.tau,1)}× multiplicaria a provisão por ${f(b.e/a.e,1)}.`};
 }
});

/* =====================================================================
   12 · Vasicek e capital IRB (Unexpected Credit Losses)
   ===================================================================== */
P.sim('sim-c-vasicek',{
 tag:'Simulador C15 · carteira de um fator',
 title:'Fator sistemático, distribuição de perdas e capital: EL, VaR e UL',
 lede:'Carteira grande e homogênea no modelo de Vasicek. A correlação de ativos ρ define quanto os defaults andam juntos. O capital cobre a perda inesperada: o quantil q da distribuição de perdas menos a perda esperada. Aperte “Atravessar o ciclo” para ver a PD condicional seguir o fator z.',
 controls:[
  {k:'pd',label:'PD média',min:.002,max:.1,step:.002,value:.02,fmt:v=>pct(v,1)},
  {k:'rho',label:'Correlação de ativos ρ',min:.01,max:.3,step:.01,value:.12,fmt:v=>f(v,2)},
  {k:'lgd',label:'LGD',min:.1,max:.8,step:.05,value:.45,fmt:v=>pct(v,0)},
  {k:'q',label:'Nível de confiança q',min:.99,max:.999,step:.0005,value:.999,fmt:v=>pct(v,2)}],
 play:{label:'▶ Atravessar o ciclo',dur:6000},
 kpis:[{k:'el',label:'Perda esperada',color:'c3'},{k:'var',label:'VaR de crédito (q)',color:'c5'},{k:'ul',label:'Perda inesperada = capital',color:'gold',tip:'K = LGD·[Φ((Φ⁻¹(PD)+√ρ·Φ⁻¹(q))/√(1−ρ)) − PD], sem ajuste de prazo.'},{k:'es',label:'ES da carteira (q)',color:'c2'},{k:'cp',label:'PD condicional em z',color:'c1'}],
 charts:[{k:'dens',title:'Densidade da perda da carteira (% da exposição)'},{k:'cond',title:'PD condicional ao fator z'}],
 model(p){
  const c=Phinv(p.pd),sr=Math.sqrt(p.rho),s1=Math.sqrt(1-p.rho),DR=u=>Phi((c+sr*Phinv(u))/s1);
  const vq=DR(p.q);let es=0;for(let j=0;j<200;j++)es+=DR(p.q+(1-p.q)*(j+.5)/200);es/=200;
  const xmax=Math.min(.999,DR(.9995)*1.15),xs=P.linspace(xmax/300,xmax,90),dens=xs.map(x=>{const a=Phinv(x),v=Math.sqrt((1-p.rho)/p.rho)*Math.exp(.5*a*a-(s1*a-c)**2/(2*p.rho));return[x*p.lgd*100,v/(p.lgd*100)]});
  const ymax=Math.max(...dens.slice(3).map(d=>d[1]))*1.1;
  const z=3-6*p.t,cpd=Phi((c-sr*z)/s1),zs=P.linspace(-4,4,61),Rb=R_corp(p.pd);
  return{kpi:{el:pp(p.pd*p.lgd,2),var:pp(vq*p.lgd,2),ul:{v:pp((vq-p.pd)*p.lgd,2),s:'ρ de Basileia p/ corporativo: '+f(Rb,3)},es:pp(es*p.lgd,2),cp:{v:pp(cpd,2),s:'z = '+f(z,2)+(z<-1?' · recessão':z>1?' · expansão':''),tone:cpd>p.pd*2?'bad':null}},
   charts:{dens:{x:{min:0,max:xmax*p.lgd*100,label:'perda da carteira (% da exposição)',fmt:v=>f(v,1)+'%',name:'perda'},y:{min:0,max:ymax,fmt:v=>f(v,2)},
     series:[{name:'densidade da perda',data:dens.map(d=>[d[0],Math.min(d[1],ymax)]),color:'c1',fill:.3}],
     shade:[{x0:p.pd*p.lgd*100,x1:vq*p.lgd*100,color:'gold',a:.08}],legend:[{name:'UL = VaR − EL (capital)',color:'gold',k:'box'}],
     marks:[{x:p.pd*p.lgd*100,label:'EL',color:'c3'},{x:vq*p.lgd*100,label:'VaR '+pct(p.q,1),color:'c5',ly:24},{x:es*p.lgd*100,label:'ES',color:'c2',ly:38}]},
    cond:{x:{min:-4,max:4,label:'fator sistemático z (negativo = recessão)',fmt:v=>f(v,0),name:'z'},y:{min:0,fmt:v=>f(v,0)+'%'},
     series:[{name:'PD(z)',data:zs.map(v=>[v,Phi((c-sr*v)/s1)*100]),color:'c1',w:2.6},{name:'PD média',data:zs.map(v=>[v,p.pd*100]),color:'c3',dash:[5,4],w:1.4},{name:'economia agora',type:'dots',r:6.5,color:'gold',data:[[z,cpd*100]]}],
     marks:[{x:Phinv(1-p.q),label:'cenário do quantil q',color:'c5'}]}},
   eq:`K = LGD·[Φ((Φ<sup>−1</sup>(${n(p.pd*100,1)}%) + √${n(p.rho,2)}·Φ<sup>−1</sup>(${n(p.q*100,2)}%))/√(1−${n(p.rho,2)})) − PD] = ${n(p.lgd,2)}×(${n(vq*100,2)}% − ${n(p.pd*100,2)}%) = ${n((vq-p.pd)*p.lgd*100,2)}%`,
   take:`A perda média é ${pp(p.pd*p.lgd,2)}, mas no cenário de ${pct(p.q,1)} a taxa de default chega a ${pp(vq,1)} (${f(vq/p.pd,1)}× a PD): o capital de ${pp((vq-p.pd)*p.lgd,2)} da exposição existe por causa da correlação ρ = ${f(p.rho,2)}, não da PD individual.`};
 }
});

/* =====================================================================
   13 · Precificação ajustada ao risco (Loan Pricing)
   ===================================================================== */
P.sim('sim-c-pricing',{
 tag:'Simulador C16 · precificação e RAROC',
 title:'A taxa mínima de um empréstimo: funding + perda esperada + custo do capital + custos',
 lede:'O capital por unidade de exposição vem da fórmula IRB (correlação corporativa de Basileia, 99,9%, sem ajuste de prazo). A taxa mínima remunera o capital à taxa exigida pelos acionistas. Compare com a taxa de mercado para ver o RAROC.',
 controls:[
  {k:'pd',label:'PD anual',min:.002,max:.1,step:.002,value:.02,fmt:v=>pct(v,1)},
  {k:'lgd',label:'LGD',min:.1,max:.8,step:.05,value:.45,fmt:v=>pct(v,0)},
  {k:'rf',label:'Custo de funding',min:.05,max:.15,step:.0025,value:.1,fmt:v=>pct(v,2)},
  {k:'h',label:'Retorno exigido sobre capital',min:.1,max:.3,step:.01,value:.18,fmt:v=>pct(v,0)},
  {k:'c',label:'Custos operacionais',min:.005,max:.04,step:.0025,value:.015,fmt:v=>pct(v,2)},
  {k:'mk',label:'Taxa praticada no mercado',min:.08,max:.35,step:.0025,value:.16,fmt:v=>pct(v,2)}],
 kpis:[{k:'rs',label:'Taxa mínima r*',color:'c1'},{k:'pr',label:'Prêmio sobre funding',color:'c2'},{k:'k',label:'Capital K (IRB)',color:'c4'},{k:'ra',label:'RAROC na taxa de mercado',color:'gold',tip:'(r<sub>m</sub> − r<sub>f</sub>(1−K) − EL − c)/K'},{k:'sp',label:'Folga da taxa de mercado',color:'c3'}],
 charts:[{k:'bar',title:'Composição da taxa mínima (% a.a.)'},{k:'cur',title:'Taxa mínima por PD × taxa de mercado'}],
 model(p){
  const K=pd=>{const R=R_corp(pd);return p.lgd*(Phi((Phinv(pd)+Math.sqrt(R)*Phinv(.999))/Math.sqrt(1-R))-pd)};
  const rs=pd=>p.rf+pd*p.lgd+p.c+K(pd)*(p.h-p.rf),k=K(p.pd),el=p.pd*p.lgd,r=rs(p.pd),ra=(p.mk-p.rf*(1-k)-el-p.c)/k;
  const grid=P.linspace(.002,.1,50);let be=null;for(const g of grid)if(rs(g)<=p.mk)be=g;
  return{kpi:{rs:pp(r,2),pr:{v:'+'+f((r-p.rf)*1e4,0)+' bp'},k:pp(k,2),ra:{v:pp(ra,1),s:'exigido: '+pp(p.h,0),tone:ra>=p.h?'good':'bad'},sp:{v:(p.mk>=r?'+':'−')+f(Math.abs(p.mk-r)*1e4,0)+' bp',tone:p.mk>=r?'good':'bad',s:be?'PD máxima rentável ≈ '+pp(be,1):'nenhuma PD da grade é rentável'}},
   charts:{bar:{x:{cats:['funding','EL','capital','custos','r*'],name:'componente'},y:{min:0,fmt:v=>f(v,1)+'%'},
     series:[{name:'% a.a.',type:'bars',data:[[0,p.rf*100,'c3'],[1,el*100,'c5'],[2,k*(p.h-p.rf)*100,'c4'],[3,p.c*100,'c2'],[4,r*100,'c1']]}]},
    cur:{x:{min:0,max:10,label:'PD anual (%)',fmt:v=>f(v,0)+'%',name:'PD'},y:{min:0,fmt:v=>f(v,0)+'%'},
     series:[{name:'taxa mínima r*(PD)',data:grid.map(g=>[g*100,rs(g)*100]),color:'c1',w:2.6},{name:'só funding + EL + custos',data:grid.map(g=>[g*100,(p.rf+g*p.lgd+p.c)*100]),color:'c3',dash:[5,4]},{name:'este empréstimo',type:'dots',r:6,color:'gold',data:[[p.pd*100,r*100]]}],
     marks:[{y:p.mk*100,label:'taxa de mercado',color:'c2',align:'left'},{x:p.pd*100,color:'gold'}]}},
   eq:`r* = r<sub>f</sub> + PD·LGD + c + K·(h − r<sub>f</sub>) = ${n(p.rf*100,2)}% + ${n(el*100,2)}% + ${n(p.c*100,2)}% + ${n(k*100,2)}%×(${n(p.h*100,0)}% − ${n(p.rf*100,2)}%) = ${n(r*100,2)}%`,
   take:p.mk>=r?`A taxa de mercado (${pp(p.mk,2)}) cobre o custo total de ${pp(r,2)}: RAROC de ${pp(ra,1)} acima dos ${pp(p.h,0)} exigidos. ${k*(p.h-p.rf)>el?`O custo do capital (${f(k*(p.h-p.rf)*1e4,0)} bp) já supera a perda esperada (${f(el*1e4,0)} bp): em PDs baixas, o capital domina o preço.`:`A perda esperada (${f(el*1e4,0)} bp) ainda supera o custo do capital (${f(k*(p.h-p.rf)*1e4,0)} bp); em PDs baixas a ordem se inverte.`}`:`Ao preço de mercado o empréstimo destrói valor: RAROC de ${pp(ra,1)} contra ${pp(p.h,0)} exigidos. Faltam ${f((r-p.mk)*1e4,0)} bp; ${be?`só PDs até ~${pp(be,1)} seriam rentáveis.`:'nenhuma PD da grade fecha a conta.'}`};
 }
});

/* =====================================================================
   14 · PSI e deriva ao longo de 24 meses (Validation / Outlook)
   ===================================================================== */
P.sim('sim-c-psi',{
 tag:'Simulador C17 · monitoramento de estabilidade',
 title:'PSI mês a mês: deriva de população, ruído amostral e gatilhos',
 lede:'O escore de desenvolvimento é dividido em decis (10% cada). Mês a mês, a população atual desloca a média e muda a dispersão. Com amostras mensais pequenas, o PSI oscila mesmo sem mudança real — por isso limiares fixos exigem contexto.',
 controls:[
  {k:'dm',label:'Deslocamento da média em 24 meses',min:0,max:1.5,step:.05,value:.6,fmt:v=>f(v,2)+' dp'},
  {k:'dv',label:'Mudança da dispersão em 24 meses',min:-.4,max:.8,step:.05,value:.2,fmt:v=>(v>=0?'+':'')+pct(v,0)},
  {k:'nm',label:'Contratos por mês',min:300,max:20000,step:100,value:2000,fmt:v=>f(v,0)}],
 play:{label:'▶ Monitorar 24 meses',dur:6500},
 kpis:[{k:'psi',label:'PSI no mês',color:'c1'},{k:'st',label:'Situação',color:'gold'},{k:'top',label:'Maior contribuição',color:'c5',tip:'Decil com maior parcela (a<sub>j</sub> − e<sub>j</sub>)·ln(a<sub>j</sub>/e<sub>j</sub>).'},{k:'mu',label:'Média do escore atual',color:'c3'}],
 charts:[{k:'bins',title:'Distribuição por decil de desenvolvimento (% da população)'},{k:'ts',title:'PSI ao longo do tempo'}],
 model(p,memo){
  if(!memo.eps){const r=P.rng(8080);memo.eps=Array.from({length:25},()=>Array.from({length:10},()=>P.randn(r)))}
  const ed=[-Infinity,...Array.from({length:9},(_,j)=>Phinv((j+1)/10)),Infinity];
  const at=t=>{const mu=p.dm*t/24,sd=1+p.dv*t/24;let q=ed.slice(1).map((b,j)=>Phi((b-mu)/sd)-Phi((ed[j]-mu)/sd));q=q.map((v,j)=>Math.max(1e-4,v+memo.eps[t][j]*Math.sqrt(v*(1-v)/p.nm)));const s=q.reduce((a,b)=>a+b,0);q=q.map(v=>v/s);
   const c=q.map(v=>(v-.1)*Math.log(v/.1));return{q,c,psi:c.reduce((a,b)=>a+b,0),mu}};
  const tp=Math.round(p.t*24),cur=at(tp),ts=Array.from({length:25},(_,t)=>[t,t<=tp?at(t).psi:NaN]);
  let tj=0;cur.c.forEach((v,j)=>{if(v>cur.c[tj])tj=j});
  const st=cur.psi<.1?'estável':cur.psi<.25?'monitorar':'investigar',cats=Array.from({length:10},(_,j)=>'D'+(j+1));
  return{kpi:{psi:{v:f(cur.psi,3),s:'mês '+tp,tone:cur.psi>=.25?'bad':cur.psi<.1?'good':null},st:{v:st,tone:st==='investigar'?'bad':st==='estável'?'good':null},top:{v:'D'+(tj+1),s:f(cur.c[tj],3)+' do PSI'},mu:f(cur.mu,2)+' dp'},
   charts:{bins:{x:{cats,label:'decis do escore no desenvolvimento',name:'decil'},y:{min:0,fmt:v=>f(v,0)+'%'},
     series:[{name:'desenvolvimento (10% cada)',type:'bars',bw:.38,off:-.2,data:cats.map((_,j)=>[j,10]),color:'c3',a:.6},{name:'população atual',type:'bars',bw:.38,off:.2,data:cur.q.map((v,j)=>[j,v*100]),color:'c1'}]},
    ts:{x:{min:0,max:24,label:'mês',fmt:v=>f(v,0),name:'mês'},y:{min:0,max:Math.max(.3,...ts.filter(v=>Number.isFinite(v[1])).map(v=>v[1]))*1.1,fmt:v=>f(v,2)},
     series:[{name:'PSI',data:ts,color:'c1',w:2.6,end:true}],
     marks:[{y:.1,label:'0,10 · monitorar',color:'gold'},{y:.25,label:'0,25 · investigar',color:'c5'}]}},
   eq:`PSI = Σ<sub>j=1</sub><sup>10</sup>(a<sub>j</sub> − 0,10)·ln(a<sub>j</sub>/0,10) = ${n(cur.psi,3)} · maior parcela: D${tj+1} com a = ${n(cur.q[tj]*100,1)}%`,
   take:cur.psi>=.25?`PSI ${f(cur.psi,3)}: a população mudou o suficiente para investigar. O PSI não diz se a AUC ou a calibração caíram — próximo passo é medir desempenho e calibração por safra.`:(p.nm<1000&&p.dm<.15?`Mesmo sem deriva relevante, ${f(p.nm,0)} contratos por mês produzem PSI de ${f(cur.psi,3)} só por ruído amostral.`:`PSI ${f(cur.psi,3)} (${st}). Acompanhe a trajetória, não um mês isolado: tendência persistente vale mais que um pico.`)};
 }
});

/* =====================================================================
   15 · Riscos concorrentes: default × payoff (Payoff Modeling)
   ===================================================================== */
P.sim('sim-c-compete',{
 tag:'Simulador C18 · riscos concorrentes',
 title:'Default e liquidação antecipada disputam o mesmo contrato',
 lede:'Coorte acompanhada por 60 meses com hazards mensais de default e de payoff. A queda dos juros de mercado acelera o payoff (incentivo de refinanciamento). Compare a incidência acumulada correta com o cálculo ingênuo que trata payoff como censura independente.',
 controls:[
  {k:'pd',label:'PD anual (hazard de default)',min:.005,max:.1,step:.005,value:.03,fmt:v=>pct(v,1)},
  {k:'cpr',label:'Taxa anual de payoff (CPR)',min:.02,max:.4,step:.01,value:.12,fmt:v=>pct(v,0)},
  {k:'inc',label:'Queda dos juros de mercado',min:0,max:4,step:.25,value:1,fmt:v=>f(v,2)+' pp',tip:'Cada ponto percentual de queda aumenta o hazard de payoff em 30% (ilustrativo).'}],
 play:{label:'▶ Acompanhar a coorte',dur:6000},
 kpis:[{k:'cd',label:'Incidência de default (60m)',color:'c5'},{k:'nv',label:'Cálculo ingênuo (payoff como censura)',color:'c3',tip:'1 − (1 − h<sub>D</sub>)<sup>t</sup>: risco de default num mundo sem payoff.'},{k:'bi',label:'Superestimação ingênua',color:'c2'},{k:'cp',label:'Incidência de payoff',color:'c1'},{k:'lf',label:'Vida média em 60m',color:'gold',tip:'Σ S(t−1): meses esperados de exposição ativa.'}],
 charts:[{k:'st',title:'Destino da coorte: ativos, default e payoff'},{k:'mp',title:'PD marginal mensal (mPD) com e sem payoff'}],
 model(p){
  const hD=toM(p.pd),hP=Math.min(.6,toM(Math.min(.95,p.cpr*(1+.3*p.inc)))),T=60;
  const D=[0],Pp=[0],S=[1],m1=[],m0=[];let life=0;
  for(let t=1;t<=T;t++){life+=S[t-1];D.push(D[t-1]+S[t-1]*hD);Pp.push(Pp[t-1]+S[t-1]*hP);S.push(S[t-1]*(1-hD-hP));m1.push([t,S[t-1]*hD*100]);m0.push([t,Math.pow(1-hD,t-1)*hD*100])}
  const nv=1-Math.pow(1-hD,T),tp=Math.round(p.t*T),cut=(t,v)=>t<=tp?v:NaN;
  return{kpi:{cd:pp(D[T],2),nv:pp(nv,2),bi:{v:'+'+f((nv-D[T])*100,2)+' pp',s:f((nv/D[T]-1)*100,0)+'% acima',tone:'bad'},cp:pp(Pp[T],1),lf:f(life,1)+' meses'},
   charts:{st:{x:{min:0,max:60,label:'mês',fmt:v=>f(v,0),name:'mês'},y:{min:0,max:100,fmt:v=>f(v,0)+'%'},
     series:[{name:'default (CIF)',type:'band',data:D.map((v,t)=>[t,0,cut(t,v*100)]),color:'c5',a:.6},{name:'payoff (CIF)',type:'band',data:D.map((v,t)=>[t,cut(t,v*100),cut(t,(v+Pp[t])*100)]),color:'c1',a:.45},{name:'ativos S(t)',type:'band',data:D.map((v,t)=>[t,cut(t,(v+Pp[t])*100),cut(t,100)]),color:'c3',a:.12},{name:'default ingênuo',data:D.map((_,t)=>[t,cut(t,(1-Math.pow(1-hD,t))*100)]),color:'c2',dash:[6,4],w:2}]},
    mp:{x:{min:0,max:61,label:'mês',fmt:v=>f(v,0),name:'mês'},y:{min:0,fmt:v=>f(v,2)+'%'},
     series:[{name:'sem payoff',type:'bars',bw:.45,off:-.25,data:m0.map(([t,v])=>[t,cut(t,v)]),color:'c3',a:.5},{name:'com payoff',type:'bars',bw:.45,off:.25,data:m1.map(([t,v])=>[t,cut(t,v)]),color:'c5'}]}},
   eq:`S(t) = S(t−1)(1 − h<sub>D</sub> − h<sub>P</sub>) com h<sub>D</sub> = ${n(hD*100,3)}%, h<sub>P</sub> = ${n(hP*100,2)}% ao mês · CIF<sub>D</sub>(60) = Σ S(k−1)·h<sub>D</sub> = ${n(D[T]*100,2)}% vs ${n(nv*100,2)}% ingênuo`,
   take:`O payoff retira ${pp(Pp[T],0)} da coorte antes que esses contratos possam inadimplir: a incidência real de default é ${pp(D[T],2)}, não ${pp(nv,2)}. Tratar payoff como censura independente superestima a PD lifetime e encurta errado a vida da exposição (${f(life,1)} meses esperados).`};
 }
});
})();
