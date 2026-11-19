/* =====================================================================
   Macroeconomia · camada de aprofundamento (atlas-plus)
   Aprofundamento textual, fluxogramas animados, derivações animadas,
   laboratórios com animação, leituras por capítulo e bibliografia.
   Depende das globais definidas em macroeconomia_blanchard.html:
   CHAPTERS, LAB_META, lineChart, updateMacro, macro, MACRO_META.
   ===================================================================== */
(function(){
'use strict';
if(typeof CHAPTERS==='undefined')return;
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

/* ---------------------------------------------------------------------
   BIBLIOGRAFIA (APA 7)
   --------------------------------------------------------------------- */
const REFS={
acemoglu2001:"Acemoglu, D., Johnson, S., & Robinson, J. A. (2001). The colonial origins of comparative development: An empirical investigation. <i>American Economic Review, 91</i>(5), 1369–1401.",
acemoglu2019:"Acemoglu, D., & Restrepo, P. (2019). Automation and new tasks: How technology displaces and reinstates labor. <i>Journal of Economic Perspectives, 33</i>(2), 3–30.",
adrian2010:"Adrian, T., & Shin, H. S. (2010). Liquidity and leverage. <i>Journal of Financial Intermediation, 19</i>(3), 418–437.",
aghion1992:"Aghion, P., & Howitt, P. (1992). A model of growth through creative destruction. <i>Econometrica, 60</i>(2), 323–351.",
autor2015:"Autor, D. H. (2015). Why are there still so many jobs? The history and future of workplace automation. <i>Journal of Economic Perspectives, 29</i>(3), 3–30.",
bahmani2004:"Bahmani-Oskooee, M., & Ratha, A. (2004). The J-curve: A literature review. <i>Applied Economics, 36</i>(12), 1377–1398.",
barro1974:"Barro, R. J. (1974). Are government bonds net wealth? <i>Journal of Political Economy, 82</i>(6), 1095–1117.",
barro1983:"Barro, R. J., & Gordon, D. B. (1983). Rules, discretion and reputation in a model of monetary policy. <i>Journal of Monetary Economics, 12</i>(1), 101–121.",
barro1991:"Barro, R. J. (1991). Economic growth in a cross section of countries. <i>Quarterly Journal of Economics, 106</i>(2), 407–443.",
baumol1952:"Baumol, W. J. (1952). The transactions demand for cash: An inventory theoretic approach. <i>Quarterly Journal of Economics, 66</i>(4), 545–556.",
bernanke1983:"Bernanke, B. S. (1983). Nonmonetary effects of the financial crisis in the propagation of the Great Depression. <i>American Economic Review, 73</i>(3), 257–276.",
bernanke1997:"Bernanke, B. S., & Mishkin, F. S. (1997). Inflation targeting: A new framework for monetary policy? <i>Journal of Economic Perspectives, 11</i>(2), 97–116.",
bgg1999:"Bernanke, B. S., Gertler, M., & Gilchrist, S. (1999). The financial accelerator in a quantitative business cycle framework. In J. B. Taylor & M. Woodford (Eds.), <i>Handbook of macroeconomics</i> (Vol. 1C, pp. 1341–1393). Elsevier.",
blanchard2025:"Blanchard, O. (2025). <i>Macroeconomics</i> (9th ed.). Pearson. [Ed. brasileira: <i>Macroeconomia</i>, 9. ed., Bookman/Grupo A.]",
blanchard1986:"Blanchard, O. J., & Summers, L. H. (1986). Hysteresis and the European unemployment problem. <i>NBER Macroeconomics Annual, 1</i>, 15–78.",
blanchard2009:"Blanchard, O. (2009). The state of macro. <i>Annual Review of Economics, 1</i>, 209–228.",
blanchard2019:"Blanchard, O. (2019). Public debt and low interest rates. <i>American Economic Review, 109</i>(4), 1197–1229.",
blanchard1982:"Blanchard, O. J., & Watson, M. W. (1982). Bubbles, rational expectations and financial markets. In P. Wachtel (Ed.), <i>Crises in the economic and financial structure</i> (pp. 295–315). Lexington Books.",
brainard1967:"Brainard, W. C. (1967). Uncertainty and the effectiveness of policy. <i>American Economic Review, 57</i>(2), 411–425.",
brunnermeier2009:"Brunnermeier, M. K. (2009). Deciphering the liquidity and credit crunch 2007–2008. <i>Journal of Economic Perspectives, 23</i>(1), 77–100.",
burns1946:"Burns, A. F., & Mitchell, W. C. (1946). <i>Measuring business cycles</i>. National Bureau of Economic Research.",
calvo1983:"Calvo, G. A. (1983). Staggered prices in a utility-maximizing framework. <i>Journal of Monetary Economics, 12</i>(3), 383–398.",
calvo2002:"Calvo, G. A., & Reinhart, C. M. (2002). Fear of floating. <i>Quarterly Journal of Economics, 117</i>(2), 379–408.",
campbell1991:"Campbell, J. Y., & Shiller, R. J. (1991). Yield spreads and interest rate movements: A bird's eye view. <i>Review of Economic Studies, 58</i>(3), 495–514.",
cgg1999:"Clarida, R., Galí, J., & Gertler, M. (1999). The science of monetary policy: A New Keynesian perspective. <i>Journal of Economic Literature, 37</i>(4), 1661–1707.",
diamond1983:"Diamond, D. W., & Dybvig, P. H. (1983). Bank runs, deposit insurance, and liquidity. <i>Journal of Political Economy, 91</i>(3), 401–419.",
dornbusch1976:"Dornbusch, R. (1976). Expectations and exchange rate dynamics. <i>Journal of Political Economy, 84</i>(6), 1161–1176.",
eichengreen2019:"Eichengreen, B. (2019). <i>Globalizing capital: A history of the international monetary system</i> (3rd ed.). Princeton University Press.",
fama1970:"Fama, E. F. (1970). Efficient capital markets: A review of theory and empirical work. <i>Journal of Finance, 25</i>(2), 383–417.",
feenstra2015:"Feenstra, R. C., Inklaar, R., & Timmer, M. P. (2015). The next generation of the Penn World Table. <i>American Economic Review, 105</i>(10), 3150–3182.",
feldstein1980:"Feldstein, M., & Horioka, C. (1980). Domestic saving and international capital flows. <i>Economic Journal, 90</i>(358), 314–329.",
fisher1930:"Fisher, I. (1930). <i>The theory of interest</i>. Macmillan.",
fleming1962:"Fleming, J. M. (1962). Domestic financial policies under fixed and under floating exchange rates. <i>IMF Staff Papers, 9</i>(3), 369–380.",
friedman1957:"Friedman, M. (1957). <i>A theory of the consumption function</i>. Princeton University Press.",
friedman1963:"Friedman, M., & Schwartz, A. J. (1963). <i>A monetary history of the United States, 1867–1960</i>. Princeton University Press.",
friedman1968:"Friedman, M. (1968). The role of monetary policy. <i>American Economic Review, 58</i>(1), 1–17.",
gali2015:"Galí, J. (2015). <i>Monetary policy, inflation, and the business cycle: An introduction to the New Keynesian framework</i> (2nd ed.). Princeton University Press.",
gilchrist2012:"Gilchrist, S., & Zakrajšek, E. (2012). Credit spreads and business cycle fluctuations. <i>American Economic Review, 102</i>(4), 1692–1720.",
gordon1959:"Gordon, M. J. (1959). Dividends, earnings, and stock prices. <i>Review of Economics and Statistics, 41</i>(2), 99–105.",
gordon2016:"Gordon, R. J. (2016). <i>The rise and fall of American growth</i>. Princeton University Press.",
hall1978:"Hall, R. E. (1978). Stochastic implications of the life cycle–permanent income hypothesis: Theory and evidence. <i>Journal of Political Economy, 86</i>(6), 971–987.",
hamilton2018:"Hamilton, J. D. (2018). Why you should never use the Hodrick-Prescott filter. <i>Review of Economics and Statistics, 100</i>(5), 831–843.",
hayashi1982:"Hayashi, F. (1982). Tobin's marginal q and average q: A neoclassical interpretation. <i>Econometrica, 50</i>(1), 213–224.",
hazell2022:"Hazell, J., Herreño, J., Nakamura, E., & Steinsson, J. (2022). The slope of the Phillips curve: Evidence from U.S. states. <i>Quarterly Journal of Economics, 137</i>(3), 1299–1344.",
hicks1937:"Hicks, J. R. (1937). Mr. Keynes and the “classics”: A suggested interpretation. <i>Econometrica, 5</i>(2), 147–159.",
hodrick1997:"Hodrick, R. J., & Prescott, E. C. (1997). Postwar U.S. business cycles: An empirical investigation. <i>Journal of Money, Credit and Banking, 29</i>(1), 1–16.",
hlw2017:"Holston, K., Laubach, T., & Williams, J. C. (2017). Measuring the natural rate of interest: International trends and determinants. <i>Journal of International Economics, 108</i>(S1), S59–S75.",
jones1995:"Jones, C. I. (1995). R&D-based models of economic growth. <i>Journal of Political Economy, 103</i>(4), 759–784.",
jorgenson1963:"Jorgenson, D. W. (1963). Capital theory and investment behavior. <i>American Economic Review, 53</i>(2), 247–259.",
keynes1936:"Keynes, J. M. (1936). <i>The general theory of employment, interest and money</i>. Macmillan.",
krugman1979:"Krugman, P. (1979). A model of balance-of-payments crises. <i>Journal of Money, Credit and Banking, 11</i>(3), 311–325.",
kydland1977:"Kydland, F. E., & Prescott, E. C. (1977). Rules rather than discretion: The inconsistency of optimal plans. <i>Journal of Political Economy, 85</i>(3), 473–491.",
kydland1982:"Kydland, F. E., & Prescott, E. C. (1982). Time to build and aggregate fluctuations. <i>Econometrica, 50</i>(6), 1345–1370.",
layard1991:"Layard, R., Nickell, S., & Jackman, R. (1991). <i>Unemployment: Macroeconomic performance and the labour market</i>. Oxford University Press.",
lucas1972:"Lucas, R. E., Jr. (1972). Expectations and the neutrality of money. <i>Journal of Economic Theory, 4</i>(2), 103–124.",
lucas1976:"Lucas, R. E., Jr. (1976). Econometric policy evaluation: A critique. <i>Carnegie-Rochester Conference Series on Public Policy, 1</i>, 19–46.",
lucas1988:"Lucas, R. E., Jr. (1988). On the mechanics of economic development. <i>Journal of Monetary Economics, 22</i>(1), 3–42.",
maddison2001:"Maddison, A. (2001). <i>The world economy: A millennial perspective</i>. OECD Development Centre.",
magee1973:"Magee, S. P. (1973). Currency contracts, pass-through, and devaluation. <i>Brookings Papers on Economic Activity, 1973</i>(1), 303–325.",
mankiw1992:"Mankiw, N. G., Romer, D., & Weil, D. N. (1992). A contribution to the empirics of economic growth. <i>Quarterly Journal of Economics, 107</i>(2), 407–437.",
mankiw2006:"Mankiw, N. G. (2006). The macroeconomist as scientist and engineer. <i>Journal of Economic Perspectives, 20</i>(4), 29–46.",
mishkin2019:"Mishkin, F. S. (2019). <i>The economics of money, banking, and financial markets</i> (12th ed.). Pearson.",
modigliani1954:"Modigliani, F., & Brumberg, R. (1954). Utility analysis and the consumption function: An interpretation of cross-section data. In K. K. Kurihara (Ed.), <i>Post-Keynesian economics</i> (pp. 388–436). Rutgers University Press.",
mortensen1994:"Mortensen, D. T., & Pissarides, C. A. (1994). Job creation and job destruction in the theory of unemployment. <i>Review of Economic Studies, 61</i>(3), 397–415.",
mundell1963:"Mundell, R. A. (1963). Capital mobility and stabilization policy under fixed and flexible exchange rates. <i>Canadian Journal of Economics and Political Science, 29</i>(4), 475–485.",
muth1961:"Muth, J. F. (1961). Rational expectations and the theory of price movements. <i>Econometrica, 29</i>(3), 315–335.",
nordhaus2019:"Nordhaus, W. D. (2019). Climate change: The ultimate challenge for economics. <i>American Economic Review, 109</i>(6), 1991–2014.",
obstfeld1996:"Obstfeld, M., & Rogoff, K. (1996). <i>Foundations of international macroeconomics</i>. MIT Press.",
obstfeld2005:"Obstfeld, M., Shambaugh, J. C., & Taylor, A. M. (2005). The trilemma in history: Tradeoffs among exchange rates, monetary policies, and capital mobility. <i>Review of Economics and Statistics, 87</i>(3), 423–438.",
okun1962:"Okun, A. M. (1962). Potential GNP: Its measurement and significance. In <i>Proceedings of the Business and Economic Statistics Section</i> (pp. 98–104). American Statistical Association.",
phelps1961:"Phelps, E. S. (1961). The golden rule of accumulation: A fable for growthmen. <i>American Economic Review, 51</i>(4), 638–643.",
phelps1967:"Phelps, E. S. (1967). Phillips curves, expectations of inflation and optimal unemployment over time. <i>Economica, 34</i>(135), 254–281.",
phillips1958:"Phillips, A. W. (1958). The relation between unemployment and the rate of change of money wage rates in the United Kingdom, 1861–1957. <i>Economica, 25</i>(100), 283–299.",
piketty2014:"Piketty, T. (2014). <i>Capital in the twenty-first century</i>. Harvard University Press.",
pissarides2000:"Pissarides, C. A. (2000). <i>Equilibrium unemployment theory</i> (2nd ed.). MIT Press.",
ramey2011:"Ramey, V. A. (2011). Can government purchases stimulate the economy? <i>Journal of Economic Literature, 49</i>(3), 673–685.",
reinhart2009:"Reinhart, C. M., & Rogoff, K. S. (2009). <i>This time is different: Eight centuries of financial folly</i>. Princeton University Press.",
rey2013:"Rey, H. (2013). Dilemma not trilemma: The global financial cycle and monetary policy independence. In <i>Global dimensions of unconventional monetary policy</i> (pp. 285–333). Federal Reserve Bank of Kansas City.",
rogoff1985:"Rogoff, K. (1985). The optimal degree of commitment to an intermediate monetary target. <i>Quarterly Journal of Economics, 100</i>(4), 1169–1189.",
romer1990:"Romer, P. M. (1990). Endogenous technological change. <i>Journal of Political Economy, 98</i>(5, Part 2), S71–S102.",
romer2000:"Romer, D. (2000). Keynesian macroeconomics without the LM curve. <i>Journal of Economic Perspectives, 14</i>(2), 149–169.",
romer2019:"Romer, D. (2019). <i>Advanced macroeconomics</i> (5th ed.). McGraw-Hill Education.",
samuelson1939:"Samuelson, P. A. (1939). Interactions between the multiplier analysis and the principle of acceleration. <i>Review of Economics and Statistics, 21</i>(2), 75–78.",
samuelson1960:"Samuelson, P. A., & Solow, R. M. (1960). Analytical aspects of anti-inflation policy. <i>American Economic Review, 50</i>(2), 177–194.",
sargent1981:"Sargent, T. J., & Wallace, N. (1981). Some unpleasant monetarist arithmetic. <i>Federal Reserve Bank of Minneapolis Quarterly Review, 5</i>(3), 1–17.",
shiller1981:"Shiller, R. J. (1981). Do stock prices move too much to be justified by subsequent changes in dividends? <i>American Economic Review, 71</i>(3), 421–436.",
smets2007:"Smets, F., & Wouters, R. (2007). Shocks and frictions in US business cycles: A Bayesian DSGE approach. <i>American Economic Review, 97</i>(3), 586–606.",
solow1956:"Solow, R. M. (1956). A contribution to the theory of economic growth. <i>Quarterly Journal of Economics, 70</i>(1), 65–94.",
solow1957:"Solow, R. M. (1957). Technical change and the aggregate production function. <i>Review of Economics and Statistics, 39</i>(3), 312–320.",
stock1999:"Stock, J. H., & Watson, M. W. (1999). Business cycle fluctuations in US macroeconomic time series. In J. B. Taylor & M. Woodford (Eds.), <i>Handbook of macroeconomics</i> (Vol. 1A, pp. 3–64). Elsevier.",
summers2014:"Summers, L. H. (2014). U.S. economic prospects: Secular stagnation, hysteresis, and the zero lower bound. <i>Business Economics, 49</i>(2), 65–73.",
swan1956:"Swan, T. W. (1956). Economic growth and capital accumulation. <i>Economic Record, 32</i>(2), 334–361.",
taylor1993:"Taylor, J. B. (1993). Discretion versus policy rules in practice. <i>Carnegie-Rochester Conference Series on Public Policy, 39</i>, 195–214.",
tobin1958:"Tobin, J. (1958). Liquidity preference as behavior towards risk. <i>Review of Economic Studies, 25</i>(2), 65–86.",
tobin1969:"Tobin, J. (1969). A general equilibrium approach to monetary theory. <i>Journal of Money, Credit and Banking, 1</i>(1), 15–29.",
wicksell1898:"Wicksell, K. (1936). <i>Interest and prices</i> (R. F. Kahn, Trans.). Macmillan. (Obra original publicada em 1898)",
woodford2003:"Woodford, M. (2003). <i>Interest and prices: Foundations of a theory of monetary policy</i>. Princeton University Press."
};

/* ---------------------------------------------------------------------
   CONTEÚDO POR CAPÍTULO
   d: aprofundamento (parágrafos) · w: armadilhas · k: ideia-chave
   f: fluxograma [nós, laço, legenda] · s: derivação [expressão, nota]
   r: leituras [id, por que ler]
   --------------------------------------------------------------------- */
const X={
1:{d:["Os três indicadores do capítulo não são independentes. A lei de Okun resume a ligação entre crescimento e desemprego: quando o produto cresce acima da sua taxa normal, as empresas contratam e a taxa de desemprego cai; quando cresce abaixo, o desemprego sobe mesmo sem recessão formal. A relação é empírica, varia entre países e muda com a legislação trabalhista, mas é o primeiro elo entre o lado real e o mercado de trabalho.",
"A inflação entra por outro canal. Desemprego baixo por muito tempo pressiona salários, que pressionam custos e preços. Essa ligação, formalizada mais adiante na curva de Phillips, explica por que bancos centrais olham para o mercado de trabalho mesmo tendo como meta um índice de preços.",
"A comparação internacional serve para separar choques comuns de respostas locais. Uma alta global de energia é o mesmo evento em todos os países; a diferença no resultado vem da credibilidade da política monetária, do espaço fiscal, da indexação de contratos e da composição da cesta de consumo. Quem lê os dados de um único país tende a atribuir a ele causas que são globais."],
w:["Tratar crescimento do PIB nominal como crescimento real: em economias com inflação alta, a diferença domina.","Comparar níveis de PIB entre países pela taxa de câmbio de mercado em vez de paridade de poder de compra.","Ler uma única divulgação como definitiva: PIB e emprego são revisados por meses."],
k:"Produto, desemprego e inflação contam a mesma história com defasagens diferentes.",
f:[["Choque|na demanda","Produção|Y","Emprego|lei de Okun","Salários|mercado de trabalho","Preços|inflação π"],null,"A sequência típica de propagação: atividade reage primeiro, o mercado de trabalho depois e os preços por último."],
s:[["gₜ = (Yₜ − Yₜ₋₁) / Yₜ₋₁","Crescimento do produto real entre dois períodos."],["uₜ − uₜ₋₁ = −β (gₜ − ḡ)","Lei de Okun: o desemprego cai quando o crescimento supera a taxa normal ḡ."],["ḡ ≈ g_produtividade + g_força de trabalho","O crescimento normal é o necessário para manter o desemprego constante."],["⟦β ≈ 0,4⟧ ⇒ 1 p.p. acima de ḡ reduz u em ≈ 0,4 p.p.","Ordem de grandeza ilustrativa; o coeficiente varia entre países e épocas."]],
r:[["blanchard2025","obra-base: capítulo de abertura"],["okun1962","origem da relação entre produto e desemprego"],["burns1946","definição clássica de ciclo econômico"],["stock1999","fatos estilizados do ciclo em séries macro"],["feenstra2015","base de dados para comparação internacional"]]},
2:{d:["O livro organiza a macroeconomia por horizonte porque cada horizonte libera uma variável diferente para se ajustar. No curto prazo, preços e salários são relativamente rígidos e a demanda determina o produto. No médio prazo, salários e preços reagem ao desemprego, e o produto volta ao seu nível natural. No longo prazo, a pergunta deixa de ser o desvio em torno da tendência e passa a ser a própria tendência.",
"Essa separação é uma escolha de modelagem, não um fato da natureza. O hiato do produto não é observado: depende de uma estimativa do produto potencial, e diferentes métodos — filtros estatísticos, funções de produção, modelos estruturais — entregam números diferentes justamente nos momentos em que a política mais precisa deles.",
"As expectativas são o fio que atravessa os três blocos. Uma mudança percebida como permanente altera consumo e investimento hoje; a mesma mudança percebida como transitória quase não altera. Por isso o livro trata expectativas como parte de cada mercado, e não como um capítulo isolado."],
w:["Usar o filtro HP como se medisse o produto potencial: ele é um suavizador estatístico com problemas no fim da amostra.","Projetar um choque cíclico como se fosse permanente (ou o contrário) em cenários de longo prazo."],
k:"Curto, médio e longo prazo diferem pelo que é tratado como fixo.",
f:[["Curto prazo|demanda determina Y","Médio prazo|salários e preços ajustam","Longo prazo|capital e tecnologia"],[2,0,"expectativas sobre o futuro afetam decisões hoje"],"Cada horizonte libera um mecanismo de ajuste; as expectativas ligam o fim da cadeia ao começo."],
s:[["Yₜ = Yₜⁿ + gapₜ","Produto observado como potencial mais componente cíclico."],["min Σ(yₜ − τₜ)² + λ Σ[(τₜ₊₁ − τₜ) − (τₜ − τₜ₋₁)]²","Filtro de Hodrick–Prescott: equilibra ajuste aos dados e suavidade da tendência τ."],["⟦λ = 1600⟧ para dados trimestrais","Convenção usual; λ maior produz tendência mais suave."],["gapₜ = 100 · (yₜ − τₜ)","Hiato em pontos percentuais, com y em logaritmo."]],
r:[["blanchard2025","obra-base"],["hodrick1997","o filtro mais usado para separar ciclo e tendência"],["hamilton2018","crítica ao filtro HP e alternativa por regressão"],["blanchard2009","como a profissão organiza curto, médio e longo prazo"],["mankiw2006","modelos para entender versus modelos para decidir"]]},
3:{d:["No modelo do mercado de bens, a produção se ajusta à demanda. A demanda depende da renda, e a renda é a própria produção. Esse circuito fechado gera o multiplicador: um aumento de gasto autônomo eleva a renda, que eleva o consumo, que eleva de novo a renda, em rodadas cada vez menores. A soma das rodadas é 1/(1 − c₁).",
"O modelo também explica o paradoxo da poupança. Se todos tentam poupar mais ao mesmo tempo, a demanda cai, a renda cai e a poupança agregada pode não aumentar — em equilíbrio, poupança privada mais pública é igual ao investimento, que não mudou. O que vale para uma família não vale para a economia inteira.",
"As hipóteses são fortes: preços fixos, investimento exógeno e economia fechada. Por isso os multiplicadores empíricos são menores que o valor de manual. Importações, impostos proporcionais à renda, reação do banco central e expectativas de impostos futuros vazam parte de cada rodada."],
w:["Aplicar o multiplicador de manual (2 ou 3) a uma economia aberta com política monetária reagindo.","Confundir equilíbrio contábil (Y = Z) com causalidade: é a produção que se ajusta à demanda, não o contrário."],
k:"Gasto vira renda, que vira gasto: o multiplicador é a soma desse eco.",
f:[["Gasto autônomo|↑ G ou ↑ I","Demanda|Z","Produção|Y = Z","Renda disponível|Y − T","Consumo|c₁ · ΔY"],[4,1,"cada rodada é c₁ vezes a anterior"],"O multiplicador emerge do laço entre consumo e renda."],
s:[["Z = C + I + G","Demanda total por bens em economia fechada."],["C = c₀ + c₁ (Y − T)","Consumo depende da renda disponível; c₁ é a propensão marginal a consumir."],["Y = c₀ + c₁(Y − T) + Ī + G","Equilíbrio: produção igual à demanda."],["Y = ⟦1 / (1 − c₁)⟧ · [c₀ + Ī + G − c₁T]","Isolando Y: o primeiro termo é o multiplicador, o segundo é o gasto autônomo."],["ΔY / ΔG = 1 / (1 − c₁)  ·  ΔY / ΔT = −c₁ / (1 − c₁)","Por isso gasto e impostos de mesmo valor não têm efeitos simétricos."]],
r:[["keynes1936","a origem da demanda efetiva"],["samuelson1939","multiplicador e acelerador em dinâmica"],["ramey2011","evidência sobre multiplicadores de gasto público"],["friedman1957","por que o consumo reage pouco à renda transitória"],["modigliani1954","ciclo de vida e consumo"]]},
4:{d:["A demanda por moeda nasce de um trade-off: moeda serve para transações mas não rende juros; títulos rendem juros mas não servem para pagar. Quanto maior a renda nominal, mais moeda se deseja; quanto maior a taxa de juros, maior o custo de oportunidade de reter moeda, e menor a demanda.",
"Preço de título e taxa de juros são dois lados da mesma moeda. Um título que paga 100 daqui a um ano vale 100/(1 + i) hoje. Quando o banco central compra títulos em operações de mercado aberto, eleva seu preço e reduz a taxa; quando vende, faz o contrário. É por esse mecanismo que a política monetária fixa a taxa de juros de curto prazo.",
"Com bancos, a oferta de moeda passa a depender também das escolhas do público e das reservas bancárias. Na prática, os bancos centrais modernos anunciam uma meta para a taxa de juros e ajustam a quantidade de reservas para atingi-la; a quantidade de moeda passa a ser endógena."],
w:["Achar que o banco central controla diretamente a taxa de empréstimo ao consumidor: ele controla a taxa de curtíssimo prazo entre bancos.","Ignorar que preço de título e juros andam em sentidos opostos ao interpretar marcação a mercado."],
k:"Fixar a taxa de juros e fixar a oferta de moeda são a mesma decisão vista de lados diferentes.",
f:[["Banco central|operação de mercado aberto","Reservas|base monetária H","Títulos|preço P_B","Taxa de juros|i","Demanda por moeda|$Y · L(i)"],[4,0,"o banco central ajusta H para manter i na meta"],"A taxa de juros é o preço que equilibra oferta e demanda por moeda."],
s:[["Mᵈ = $Y · L(i)","Demanda por moeda: proporcional à renda nominal, decrescente nos juros."],["M = $Y · L(i)","Equilíbrio: a oferta do banco central iguala a demanda."],["P_B = 100 / (1 + i)","Preço de um título de um ano que paga 100."],["i = ⟦(100 − P_B) / P_B⟧","Comprar títulos eleva P_B e reduz i."],["M = H / [c + θ(1 − c)]","Com bancos: c é a fração retida em papel-moeda e θ a razão de reservas."]],
r:[["keynes1936","preferência pela liquidez"],["baumol1952","demanda de moeda como problema de estoque"],["tobin1958","demanda de moeda como escolha sob risco"],["friedman1963","história monetária e política de oferta de moeda"],["mishkin2019","manual de moeda, bancos e mercados financeiros"]]},
5:{d:["O modelo IS–LM junta o mercado de bens e o mercado financeiro. A curva IS reúne as combinações de produto e juros em que a produção iguala a demanda: juros maiores reduzem o investimento e, portanto, o produto. A curva LM — na versão moderna do livro, uma reta horizontal na taxa escolhida pelo banco central — fecha o sistema.",
"Política fiscal desloca a IS; política monetária desloca a LM. A combinação das duas, o policy mix, permite atingir objetivos que nenhuma alcança sozinha: por exemplo, uma consolidação fiscal acompanhada de corte de juros pode reduzir o déficit sem derrubar o produto.",
"A versão com o banco central fixando a taxa de juros, e não a quantidade de moeda, reflete a prática desde os anos 1990. Ela simplifica a análise, mas exige cuidado em situações-limite: no piso de juros zero, a política monetária convencional perde força e a política fiscal ganha peso."],
w:["Desenhar a LM inclinada e esquecer que, com meta de juros, o banco central decide se acomoda ou não um choque fiscal.","Tratar IS–LM como modelo de inflação: preços são fixos nesse capítulo."],
k:"Bens e finanças se determinam juntos: nenhum mercado pode ser lido isoladamente.",
f:[["Política fiscal|desloca IS","Demanda|C + I + G","Produto|Y","Política monetária|fixa i (LM)","Investimento|I(Y, i)"],[3,4,"juros mais altos reduzem investimento"],"O equilíbrio é o ponto onde a demanda gerada pelos juros fixados é igual à produção."],
s:[["IS:  Y = C(Y − T) + I(Y, i) + G","Equilíbrio no mercado de bens."],["LM:  i = ī","O banco central escolhe a taxa e ajusta a oferta de moeda."],["dY = ⟦∂Y/∂G⟧ dG + ∂Y/∂i · dī","Efeito combinado das duas políticas."],["∂Y/∂i = I_i / (1 − C_Y − I_Y) < 0","Juros maiores reduzem o produto via investimento, ampliado pelo multiplicador."]],
r:[["hicks1937","a formulação original do IS–LM"],["keynes1936","o texto que Hicks tentou resumir"],["romer2000","por que substituir a LM por uma regra de juros"],["woodford2003","fundamentos da política monetária via taxa de juros"],["romer2019","manual avançado"]]},
6:{d:["Duas distinções separam o modelo simples da economia real. A primeira é entre juros nominais e reais: o que importa para investir é a taxa real, i − πᵉ. A segunda é entre a taxa do banco central e a taxa que empresas e famílias pagam: a diferença é o prêmio de risco x, que depende da saúde dos bancos e dos tomadores.",
"Bancos se financiam com pouco capital próprio e muita dívida. Essa alavancagem multiplica perdas: um banco com alavancagem de 10 que perde 5% dos ativos perde metade do capital. Para voltar ao nível de alavancagem desejado, precisa vender ativos ou cortar crédito, o que derruba preços de ativos e gera novas perdas — o acelerador financeiro.",
"A crise de 2008 mostrou que esse canal pode dominar a política monetária: o banco central cortou a taxa básica, mas o prêmio de risco subiu mais, e o custo do crédito aumentou. A IS ampliada, com r + x, é a forma do livro de incorporar esse fato."],
w:["Avaliar o aperto ou afrouxamento monetário pela taxa nominal sem descontar a inflação esperada.","Supor que corte de juros básicos sempre barateia o crédito: spreads podem subir mais."],
k:"O custo do crédito é r + x, e x pode mudar sem que o banco central mexa em nada.",
f:[["Perdas|em ativos","Capital bancário|cai","Desalavancagem|vende ativos","Crédito ↓|spread x ↑","Investimento|e produto ↓"],[4,0,"queda do produto gera novas perdas"],"O acelerador financeiro: perdas reduzem capital, o que reduz crédito, o que gera mais perdas."],
s:[["(1 + rₜ) = (1 + iₜ) / (1 + πᵉₜ₊₁)","Equação de Fisher exata."],["rₜ ≈ iₜ − πᵉₜ₊₁","Aproximação para taxas baixas."],["Y = C(Y − T) + I(Y, ⟦r + x⟧) + G","IS com prêmio de risco: o investimento responde à taxa de captação."],["alavancagem = Ativos / Capital","Com alavancagem A, perda de ℓ% dos ativos reduz o capital em A·ℓ%."],["Δativos para restaurar A = A · perda","Desalavancar exige vender A vezes a perda: por isso o choque se amplifica."]],
r:[["fisher1930","juros nominais, reais e expectativas"],["bernanke1983","crédito na Grande Depressão"],["bgg1999","o acelerador financeiro em modelo quantitativo"],["diamond1983","corridas bancárias e seguro de depósito"],["adrian2010","alavancagem pró-cíclica dos intermediários"],["gilchrist2012","spreads de crédito como preditores do ciclo"],["brunnermeier2009","a crise de 2007–2008"]]},
7:{d:["Salários são fixados em negociação, explícita ou implícita, entre trabalhadores e empresas. O poder de barganha dos trabalhadores cresce quando o desemprego é baixo — é mais fácil achar outro emprego — e com instituições como seguro-desemprego e sindicatos, resumidas no termo z. Daí a relação de fixação de salários: W = Pᵉ F(u, z).",
"Empresas fixam preços com uma margem sobre custos: P = (1 + m) W. Isso implica um salário real compatível com a fixação de preços, 1/(1 + m), que não depende do desemprego. A taxa natural de desemprego é o nível em que o salário real reivindicado pelos trabalhadores coincide com o salário real que as empresas estão dispostas a pagar.",
"A taxa natural não é natural no sentido de imutável: depende de mark-ups, de instituições e da composição da força de trabalho. Uma economia com mais concorrência no mercado de bens tem mark-up menor, salário real maior e desemprego natural menor."],
w:["Tratar a taxa natural como constante conhecida: ela é estimada com grande incerteza.","Ignorar a histerese — desemprego longo pode elevar a própria taxa natural."],
k:"A taxa natural é o desemprego que torna compatíveis as reivindicações de trabalhadores e empresas.",
f:[["Desemprego|u","Poder de barganha|F(u, z)","Salário nominal|W","Preço|P = (1 + m)W","Salário real|W/P = 1/(1 + m)"],[4,0,"o ajuste para quando u = uₙ"],"Fixação de salários e de preços determinam juntas a taxa natural."],
s:[["W = Pᵉ · F(u, z)","Fixação de salários: barganha cai com desemprego, sobe com z."],["P = (1 + m) · W","Fixação de preços com mark-up m."],["W / P = 1 / (1 + m)","Salário real implícito na fixação de preços."],["⟦1 / (1 + m) = F(uₙ, z)⟧","Com P = Pᵉ, as duas relações se cruzam na taxa natural uₙ."],["Yₙ = L (1 − uₙ)","Produto natural associado."]],
r:[["layard1991","o modelo WS–PS de desemprego"],["pissarides2000","teoria do desemprego de equilíbrio com busca"],["mortensen1994","criação e destruição de empregos"],["blanchard1986","histerese no desemprego europeu"]]},
8:{d:["Combinando fixação de salários e de preços com expectativas, chega-se à curva de Phillips: a inflação depende da inflação esperada e do desvio do desemprego em relação à taxa natural. A formulação original de Phillips relacionava salários e desemprego; a versão moderna põe as expectativas no centro.",
"O que acontece depende de como as expectativas se formam. Se o público espera inflação igual à do ano anterior, manter o desemprego abaixo da taxa natural faz a inflação acelerar a cada ano — a curva aceleracionista que Friedman e Phelps previram antes que os anos 1970 a confirmassem. Se as expectativas estão ancoradas na meta, desvios de desemprego geram desvios temporários de inflação, que não se acumulam.",
"A evidência recente sugere que a curva ficou mais plana: a inflação reage pouco ao desemprego. Parte disso reflete a ancoragem conquistada pelos bancos centrais; parte, mudanças na formação de preços. Uma curva plana é boa notícia para o custo da desinflação e má notícia para quem tenta medir a taxa natural pelos dados de inflação."],
w:["Ler a curva de Phillips como menu permanente de inflação contra desemprego.","Concluir que a curva desapareceu porque ficou plana: com expectativas ancoradas, o sinal fica pequeno, não nulo."],
k:"A inflação acelera quando o desemprego fica abaixo da taxa natural — se as expectativas seguirem o passado.",
f:[["u < uₙ|mercado aquecido","Salários|sobem","Preços|sobem","Expectativas|πᵉ revisadas","Inflação|π acelera"],[4,1,"com θ = 1, cada ano parte de patamar maior"],"Expectativas adaptativas transformam um nível de desemprego baixo em inflação crescente."],
s:[["πₜ = πᵉₜ + (m + z) − α uₜ","Curva de Phillips com expectativas."],["πᵉₜ = (1 − θ) π̄ + θ πₜ₋₁","Expectativas: ancoradas em π̄ (θ = 0) ou adaptativas (θ = 1)."],["πₜ − πₜ₋₁ = −α (uₜ − uₙ)","Com θ = 1: a variação da inflação depende do desvio de desemprego."],["⟦uₙ = (m + z) / α⟧","Taxa natural: o desemprego que mantém a inflação constante."]],
r:[["phillips1958","a curva original"],["samuelson1960","a curva como menu de política"],["friedman1968","a crítica pela taxa natural"],["phelps1967","expectativas e desemprego ótimo"],["calvo1983","rigidez de preços em modelo com otimização"],["hazell2022","evidência recente sobre a inclinação da curva"]]},
9:{d:["O modelo IS–LM–PC junta o curto e o médio prazo. A IS determina o produto dado o juro real; a curva de Phillips, reescrita em termos de produto, diz como a inflação reage ao hiato. O banco central escolhe a taxa real e, com isso, decide quão rápido a economia volta ao produto natural.",
"Depois de um choque de demanda positivo, o produto fica acima do natural e a inflação sobe. Se o banco central mantiver o juro real, a inflação seguirá subindo; para estabilizá-la, ele precisa elevar o juro real acima da taxa natural, esfriar a demanda e só então voltar ao neutro. O caminho importa: subir pouco e tarde exige subir mais depois.",
"O conceito central é a taxa natural de juros rₙ, a taxa real que mantém o produto no nível natural. Ela não é observada, muda com demografia, produtividade e apetite por poupança, e é estimada com bandas largas. Boa parte dos debates de política monetária é, no fundo, sobre onde está rₙ."],
w:["Confundir taxa nominal neutra com taxa real neutra.","Avaliar a política monetária pelo nível dos juros em vez de pela distância em relação a rₙ."],
k:"O banco central conduz a economia ao médio prazo escolhendo o juro real em relação à taxa natural.",
f:[["Choque|de demanda","Hiato|Y − Yₙ > 0","Inflação|acelera","Banco central|r > rₙ","Demanda|recua"],[4,1,"o hiato fecha e a inflação estabiliza"],"A trajetória de convergência depende de quão cedo e quanto o juro real reage."],
s:[["IS:  Y = C(Y − T) + I(Y, r + x) + G","Mercado de bens com juro real e prêmio de risco."],["PC:  πₜ − πₜ₋₁ = (α / L)(Yₜ − Yₙ)","Phillips reescrita com u = 1 − Y/L."],["Y = Yₙ  ⟺  r = ⟦rₙ⟧","Taxa natural de juros: o juro real que fecha o hiato."],["r > rₙ ⇒ Y < Yₙ ⇒ π cai","Política contracionista reduz a inflação ao custo de produto temporário."]],
r:[["wicksell1898","a ideia original de taxa natural de juros"],["cgg1999","a ciência da política monetária novo-keynesiana"],["gali2015","o modelo novo-keynesiano canônico"],["romer2000","IS–MP–PC como alternativa ao IS–LM"],["hlw2017","estimação da taxa natural de juros"],["taylor1993","regra de juros como descrição da política"]]},
10:{d:["O crescimento de longo prazo é a força dominante sobre o padrão de vida. Uma diferença de um ponto percentual ao ano parece pequena, mas, composta por 70 anos, dobra o nível de renda relativo. Por isso o livro passa do ciclo para a tendência: o que se acumula ao longo de décadas pesa mais do que qualquer recessão.",
"Comparações de renda entre países exigem paridade de poder de compra: um corte de cabelo custa muito menos em um país pobre, e o câmbio de mercado não captura isso. Com PPC, emergem três fatos: crescimento sustentado é um fenômeno dos últimos dois séculos; países ricos convergiram entre si; e muitos países pobres não convergiram.",
"Os fatos apontam para três determinantes. Acumulação de capital explica parte do crescimento, mas com retornos decrescentes. Progresso tecnológico explica o crescimento sustentado. Instituições — direitos de propriedade, Estado funcional, estabilidade — explicam por que alguns países acumulam e inovam e outros não."],
w:["Comparar renda entre países pelo câmbio corrente.","Projetar uma taxa de crescimento observada em década excepcional como se fosse permanente."],
k:"Pequenas diferenças de crescimento, compostas, viram grandes diferenças de renda.",
f:[["Instituições|regras do jogo","Poupança|e investimento","Capital|por trabalhador","Tecnologia|A","Produto|por trabalhador"],null,"Capital explica o nível; tecnologia explica o crescimento sustentado; instituições explicam ambos."],
s:[["Yₜ = Y₀ (1 + g)ᵗ","Crescimento composto."],["ln Yₜ = ln Y₀ + t · ln(1 + g) ≈ ln Y₀ + g t","Em logaritmo, a trajetória é uma reta com inclinação g."],["t_dobro = ln 2 / ln(1 + g) ≈ ⟦70 / g(%)⟧","Regra dos 70: a 2% ao ano, a renda dobra em cerca de 35 anos."],["(Y/N)_A / (Y/N)_B = (1 + g_A)ᵗ / (1 + g_B)ᵗ","Diferenças de taxa se tornam diferenças de nível."]],
r:[["maddison2001","séries históricas de longo prazo"],["feenstra2015","Penn World Table e paridade de poder de compra"],["barro1991","regressões de crescimento entre países"],["mankiw1992","Solow aumentado com capital humano"],["solow1956","o modelo de referência"]]},
11:{d:["No modelo de Solow, a economia acumula capital enquanto o investimento supera a depreciação. Como o produto tem retornos decrescentes no capital, cada unidade adicional rende menos, e chega-se a um estado estacionário em que o investimento apenas repõe o capital desgastado. Nesse ponto, o produto por trabalhador para de crescer.",
"Uma taxa de poupança maior eleva o estado estacionário — a economia fica mais rica — mas não altera a taxa de crescimento de longo prazo. Durante a transição, o crescimento é temporariamente maior. Esse resultado separa efeito nível de efeito taxa e explica por que poupar mais não basta para crescer para sempre.",
"Poupar mais nem sempre é melhor. A regra de ouro identifica o nível de capital que maximiza o consumo de estado estacionário. Acima dele, a economia sacrifica consumo para manter um estoque de capital que rende menos do que custa repor."],
w:["Concluir que mais investimento sempre gera mais crescimento de longo prazo.","Ignorar a transição: a convergência ao novo estado estacionário leva décadas."],
k:"Poupança muda o nível de renda, não a taxa de crescimento de longo prazo.",
f:[["Poupança|s","Investimento|s · f(k)","Variação do capital|Δk = sf(k) − δk","Capital|por trabalhador k","Produto|y = f(k)"],[4,1,"retornos decrescentes reduzem cada rodada"],"O estado estacionário aparece quando investimento iguala depreciação."],
s:[["Kₜ₊₁ − Kₜ = s Yₜ − δ Kₜ","Acumulação de capital."],["Δk = s · f(k) − δ k","Por trabalhador, com população constante."],["s · f(k*) = δ k*","Estado estacionário."],["f(k) = √k  ⇒  ⟦k* = (s / δ)²⟧","Com função raiz quadrada, solução explícita."],["Regra de ouro:  f′(k_G) = δ","Capital que maximiza o consumo de estado estacionário."]],
r:[["solow1956","o modelo de crescimento neoclássico"],["swan1956","formulação paralela e independente"],["phelps1961","a regra de ouro da acumulação"],["mankiw1992","teste empírico com capital humano"],["lucas1988","capital humano e externalidades"]]},
12:{d:["Com progresso tecnológico, o estado estacionário passa a ser medido por trabalhador efetivo, AN. Nesse equilíbrio, produto e capital crescem à taxa do progresso técnico mais a da população, e o produto por trabalhador cresce à taxa do progresso técnico. A tecnologia é o único motor sustentado do padrão de vida.",
"Solow propôs medir o progresso técnico pelo resíduo: a parte do crescimento do produto que não é explicada pelo crescimento ponderado de capital e trabalho. O resíduo de Solow é uma medida de ignorância — inclui tecnologia, mas também melhoria de gestão, realocação entre setores e erros de medida.",
"A teoria do crescimento endógeno trata a tecnologia como resultado de decisões: empresas investem em pesquisa porque esperam lucros de monopólio temporário com patentes. Isso torna as políticas de proteção a ideias, concorrência e educação partes do modelo de crescimento — e explica por que o progresso técnico não cai do céu."],
w:["Tomar o resíduo de Solow como medida pura de tecnologia.","Ignorar que ideias são não rivais: o mesmo conhecimento pode ser usado por muitos ao mesmo tempo."],
k:"No longo prazo, a renda por trabalhador cresce à taxa do progresso tecnológico.",
f:[["Pesquisa|P&D","Ideias|estoque A","Produtividade|cresce gₐ","Produto|por trabalhador","Lucros|de inovação"],[4,0,"lucros financiam nova pesquisa"],"Crescimento endógeno: a tecnologia é fruto de decisões econômicas."],
s:[["Y = F(K, A N)","Produção com trabalho efetivo AN."],["g_Y = g_K = gₐ + g_N","Crescimento equilibrado no estado estacionário."],["g_(Y/N) = ⟦gₐ⟧","A renda por trabalhador cresce à taxa do progresso técnico."],["gₐ ≈ g_Y − α g_K − (1 − α) g_N","Resíduo de Solow, com α a participação do capital."]],
r:[["solow1957","a medida do resíduo"],["romer1990","mudança tecnológica endógena"],["aghion1992","crescimento por destruição criativa"],["jones1995","crítica aos efeitos de escala"],["gordon2016","desaceleração da produtividade nos EUA"]]},
13:{d:["Os desafios do crescimento vão além da taxa média. A primeira questão é institucional: países com proteção à propriedade, Judiciário funcional e restrições ao poder do Estado acumulam e inovam mais. Experimentos naturais da história, como a colonização, sugerem que instituições são causa, e não apenas consequência, da riqueza.",
"A segunda é distributiva. A tecnologia aumenta a produtividade média, mas pode deslocar tarefas e reduzir a participação do trabalho na renda. O efeito líquido depende de quanto novas tarefas são criadas para os trabalhadores e de quão rápido a força de trabalho se adapta.",
"A terceira é ambiental. O crescimento baseado em combustíveis fósseis gera um custo que não aparece nos preços. Precificar carbono, investir em tecnologia limpa e coordenar países são problemas econômicos clássicos — externalidade, bem público e ação coletiva — em escala inédita."],
w:["Medir sucesso apenas pela taxa média de crescimento, ignorando distribuição e custos ambientais.","Supor que automação sempre reduz emprego: o saldo depende das tarefas novas criadas."],
k:"Crescer é necessário, mas a forma do crescimento define quem ganha e quanto ele dura.",
f:[["Inovação|e automação","Produtividade|média ↑","Tarefas|deslocadas e criadas","Distribuição|de renda","Instituições|e política"],[4,0,"regras afetam o ritmo de adoção"],"O ganho agregado e sua distribuição são resultados separados."],
s:[["s_L = (W · N) / (P · Y)","Participação do trabalho na renda."],["s_L = (W/P) / (Y/N)","Salário real dividido pela produtividade."],["g_(s_L) = g_(W/P) − ⟦g_(Y/N)⟧","Se a produtividade cresce mais que o salário real, a participação do trabalho cai."]],
r:[["acemoglu2001","instituições como causa do desenvolvimento"],["acemoglu2019","automação, deslocamento e novas tarefas"],["autor2015","por que ainda há tantos empregos"],["piketty2014","acumulação e desigualdade"],["nordhaus2019","mudança climática como problema econômico"]]},
14:{d:["Decisões econômicas olham para frente. Comprar um imóvel, investir em uma fábrica ou comprar um título envolve fluxos futuros, que precisam ser trazidos a valor presente. A taxa de desconto relevante é a taxa real quando os fluxos são reais, e a nominal quando os fluxos são nominais — misturar as duas é um erro comum.",
"O valor presente é muito sensível à taxa de juros quando os fluxos são distantes. Um fluxo de 100 daqui a 30 anos vale 55 a 2% ao ano e 23 a 5%. Por isso ativos de longa duração — ações de crescimento, imóveis, títulos longos — reagem fortemente a mudanças nos juros esperados.",
"O livro introduz expectativas racionais como hipótese de trabalho: agentes usam toda a informação disponível e não cometem erros sistemáticos. Não significa que acertam sempre, mas que seus erros não são previsíveis. A hipótese é forte e discutível, mas disciplina a análise e evita que o modelo explique tudo por mudanças arbitrárias de humor."],
w:["Descontar fluxos nominais com taxa real (ou o inverso).","Tratar uma queda de juros de longo prazo como neutra para preços de ativos de longa duração."],
k:"O presente depende do futuro esperado, descontado pelo juro real.",
f:[["Fluxos futuros|zₜ₊₁, zₜ₊₂, …","Juros esperados|iₜ, iᵉₜ₊₁, …","Desconto|1/(1 + i)ⁿ","Valor presente|$Vₜ","Decisão|hoje"],null,"Decisões de hoje dependem de toda a trajetória esperada de juros e fluxos."],
s:[["$Vₜ = $zₜ + $zᵉₜ₊₁/(1 + iₜ) + $zᵉₜ₊₂/[(1 + iₜ)(1 + iᵉₜ₊₁)] + …","Valor presente com juros variáveis."],["$V = $z / i","Perpetuidade com juros e fluxos constantes."],["$V = $z [1 − 1/(1 + i)ⁿ] / i","Fluxo constante por n períodos (anuidade)."],["Vₜ = zₜ + zᵉₜ₊₁/(1 + ⟦rₜ⟧) + …","Em termos reais: fluxos reais descontados pela taxa real."]],
r:[["fisher1930","juros, impaciência e oportunidade de investimento"],["muth1961","a hipótese de expectativas racionais"],["lucas1976","por que expectativas mudam a avaliação de políticas"],["blanchard2025","obra-base"]]},
15:{d:["O preço de um título longo depende dos juros curtos esperados ao longo de sua vida e de um prêmio de prazo. A curva de juros, portanto, carrega as expectativas do mercado sobre a política monetária futura. Uma curva invertida — longos abaixo dos curtos — costuma sinalizar que o mercado espera cortes, frequentemente por antecipar desaceleração.",
"Ações são o valor presente de dividendos esperados, descontados pela taxa real mais um prêmio de risco. Uma notícia de política monetária pode mover ações nos dois sentidos: juros mais altos reduzem o valor presente, mas, se sinalizarem economia mais forte, elevam os dividendos esperados. O efeito depende do que já estava esperado.",
"Bolhas e modismos aparecem quando o preço se afasta dos fundamentos. Uma bolha racional existe se os investidores esperam vender a um preço ainda maior. A evidência de que preços de ações oscilam mais do que dividendos justificariam sugere que o prêmio de risco varia muito ao longo do tempo."],
w:["Interpretar a taxa longa como previsão pura de juros curtos futuros: há prêmio de prazo.","Explicar um movimento de preço de ativo sem perguntar o que já estava precificado."],
k:"Preços de ativos reagem a notícias — ao que muda nas expectativas, não ao que já era esperado.",
f:[["Política esperada|trajetória de i","Curva de juros|i₁, i₂, …, iₙ","Prêmio|de prazo e de risco","Preços de ativos|títulos e ações","Riqueza|e demanda"],[4,0,"demanda afeta a política esperada"],"A curva de juros transmite a política futura para o presente."],
s:[["$P_B2 = 100 / [(1 + i₁ₜ)(1 + iᵉ₁ₜ₊₁)]","Preço de título de dois anos."],["(1 + i₂ₜ)² = (1 + i₁ₜ)(1 + iᵉ₁ₜ₊₁)","Hipótese das expectativas."],["i₂ₜ ≈ ½ (i₁ₜ + iᵉ₁ₜ₊₁) + ⟦x⟧","Com prêmio de prazo x."],["Q = D / (r + x − g)","Modelo de Gordon: dividendo crescendo à taxa g."]],
r:[["shiller1981","volatilidade excessiva das ações"],["campbell1991","spreads e movimentos da curva de juros"],["fama1970","eficiência de mercado"],["blanchard1982","bolhas racionais"],["gordon1959","dividendos e preço de ações"]]},
16:{d:["O consumo depende da riqueza total esperada: financeira, imobiliária e humana — o valor presente da renda do trabalho futura. Por isso o consumo reage pouco a variações transitórias de renda e muito a mudanças percebidas como permanentes. A teoria da renda permanente e a do ciclo de vida formalizam essa ideia.",
"Nem todos conseguem suavizar o consumo. Famílias sem acesso a crédito consomem conforme a renda corrente, e a fração dessas famílias determina quanto uma transferência temporária afeta a demanda. Na prática, a propensão a consumir de transferências é maior do que a teoria pura sugere.",
"O investimento compara o valor presente dos lucros esperados com o custo de uma máquina. Equivalentemente, a empresa investe quando o q de Tobin — valor de mercado do capital em relação ao custo de reposição — é maior que um. Como os lucros esperados dependem do futuro, o investimento é a componente mais volátil da demanda."],
w:["Avaliar estímulo por transferência sem considerar se ele é visto como permanente ou temporário.","Explicar investimento só por juros: lucros esperados e incerteza costumam dominar."],
k:"Consumo e investimento respondem ao futuro esperado; por isso a confiança é variável macroeconômica.",
f:[["Expectativas|renda e juros futuros","Riqueza|humana e financeira","Consumo|C(riqueza, renda)","Lucro esperado|/(r + δ)","Investimento|q de Tobin"],null,"Duas decisões, a mesma lógica: valor presente do futuro esperado."],
s:[["Riqueza total = financeira + imobiliária + ⟦humana⟧","Riqueza humana é o valor presente da renda do trabalho após impostos."],["Cₜ = C(riqueza totalₜ, renda disponívelₜ)","Consumo depende da riqueza e, para quem tem restrição de crédito, da renda corrente."],["V(Πᵉₜ) = Πᵉₜ₊₁/(1 + rₜ) + (1 − δ)Πᵉₜ₊₂/[(1 + rₜ)(1 + rᵉₜ₊₁)] + …","Valor presente dos lucros de uma máquina."],["Iₜ = I[V(Πᵉₜ)] ≈ I[Π / (r + δ)]","Com valores constantes: lucro dividido pelo custo de uso do capital."]],
r:[["friedman1957","renda permanente"],["modigliani1954","ciclo de vida"],["hall1978","consumo como passeio aleatório"],["jorgenson1963","custo de uso do capital"],["tobin1969","o q de Tobin"],["hayashi1982","q marginal e q médio"]]},
17:{d:["Abrir a economia acrescenta três escolhas: entre bens domésticos e estrangeiros, entre ativos domésticos e estrangeiros, e o mercado onde se faz cada escolha. O preço relativo central é a taxa de câmbio real — quantos bens estrangeiros trocamos por um bem doméstico —, que combina câmbio nominal e preços relativos.",
"No mercado financeiro, investidores comparam o retorno em moeda doméstica com o retorno em moeda estrangeira ajustado pela variação cambial esperada. A paridade descoberta de juros resume essa arbitragem: um juro doméstico maior precisa ser compensado por uma depreciação esperada.",
"A conta corrente é a diferença entre poupança e investimento nacionais. Um déficit não é bom nem ruim em si: pode refletir investimento produtivo financiado de fora ou consumo excessivo. O que importa é a sustentabilidade da dívida externa resultante."],
w:["Confundir câmbio nominal com real: uma moeda pode desvalorizar nominalmente e apreciar em termos reais se a inflação for alta.","Ler déficit em conta corrente automaticamente como problema."],
k:"Na economia aberta, juros, câmbio e conta corrente são determinados juntos.",
f:[["Juros|domésticos vs externos","Fluxos|de capital","Câmbio nominal|E","Câmbio real|ε = EP/P*","Exportações líquidas|NX"],[4,1,"NX afeta oferta e demanda de moeda"],"A paridade de juros liga mercados financeiros ao câmbio, que liga ao comércio."],
s:[["ε = E P / P*","Câmbio real: E é o preço da moeda doméstica em moeda estrangeira."],["(1 + iₜ) = (1 + i*ₜ) · (Eₜ / Eᵉₜ₊₁)","Paridade descoberta de juros."],["iₜ ≈ i*ₜ − ⟦(Eᵉₜ₊₁ − Eₜ) / Eₜ⟧","Juro doméstico maior exige depreciação esperada."],["CA = S − I","Conta corrente é poupança nacional menos investimento."]],
r:[["obstfeld1996","fundamentos da macroeconomia internacional"],["feldstein1980","poupança doméstica e fluxos de capital"],["dornbusch1976","dinâmica de câmbio com expectativas"]]},
18:{d:["Em economia aberta, parte da demanda doméstica vaza para o exterior via importações, e parte da demanda externa entra via exportações. O multiplicador é menor, porque cada rodada de gasto perde a fração importada. E o crescimento dos parceiros comerciais passa a ser um determinante direto do produto doméstico.",
"Uma depreciação real torna bens domésticos mais baratos. Mas o efeito sobre a balança comercial tem dois lados: os volumes respondem a favor, enquanto o preço das importações sobe contra. A condição de Marshall–Lerner diz que a depreciação melhora a balança se as elasticidades forem suficientemente grandes.",
"No curto prazo, contratos já fechados e hábitos de consumo fazem as quantidades reagirem devagar, enquanto os preços mudam na hora. Por isso a balança costuma piorar antes de melhorar: a curva J. A defasagem tem implicações práticas para quem avalia política cambial em horizontes curtos."],
w:["Esperar melhora imediata da balança comercial após uma desvalorização.","Usar multiplicadores de economia fechada em economias muito abertas."],
k:"Depreciação ajuda a balança no médio prazo, mas os preços chegam antes das quantidades.",
f:[["Depreciação|real","Preço|das importações ↑","Volumes|ajustam com defasagem","Exportações líquidas|curva J","Demanda|e produto"],null,"O efeito-valor vem primeiro; o efeito-volume, depois."],
s:[["Z = C + I + G − IM/ε + X","Demanda por bens domésticos."],["NX = X(Y*, ε) − IM(Y, ε)/ε","Exportações líquidas."],["dNX/dε < 0 se ⟦η_X + η_M > 1⟧","Marshall–Lerner: depreciação (ε ↓) melhora NX se as elasticidades somam mais que 1."],["ΔY/ΔG = 1 / (1 − c₁ + m)","Multiplicador com propensão a importar m: menor que na economia fechada."]],
r:[["magee1973","contratos, repasse cambial e curva J"],["bahmani2004","revisão da evidência sobre a curva J"],["obstfeld1996","fundamentos da macroeconomia internacional"]]},
19:{d:["O modelo Mundell–Fleming é o IS–LM da economia aberta. A IS inclui exportações líquidas, que dependem do câmbio; a paridade de juros liga o câmbio aos juros domésticos e externos. Um aumento de juros domésticos atrai capital, aprecia a moeda e reduz exportações líquidas — um canal adicional de transmissão da política monetária.",
"Sob câmbio flutuante, a política monetária é forte: atua via investimento e via câmbio. A política fiscal é mais fraca: parte do estímulo vaza para importações e, se o banco central reagir subindo juros, a apreciação reduz exportações. O resultado depende da reação monetária ao estímulo.",
"Na prática, economias emergentes enfrentam prêmios de risco que variam com o apetite global por risco. Um aumento do prêmio deprecia a moeda mesmo sem mudança nos juros domésticos, e pode forçar o banco central a reagir para conter a inflação importada."],
w:["Supor que câmbio flutuante isola completamente a economia dos choques externos.","Esquecer o prêmio de risco na paridade de juros de economias emergentes."],
k:"Com câmbio flutuante, a política monetária ganha um canal: o câmbio.",
f:[["Banco central|eleva i","Fluxos de capital|entram","Câmbio|aprecia","Exportações líquidas|caem","Produto|cai"],null,"O canal cambial se soma ao canal do investimento."],
s:[["IS:  Y = C(Y − T) + I(Y, i) + G + NX(Y, Y*, Eₜ)","Mercado de bens aberto."],["Paridade:  Eₜ = [(1 + iₜ)/(1 + i*ₜ)] Ēᵉ","Câmbio de hoje depende do diferencial de juros e do câmbio esperado."],["LM:  i = ī","O banco central escolhe a taxa."],["↑ i  ⇒  ↑ E (aprecia)  ⇒  ⟦↓ NX⟧  ⇒  ↓ Y","Canal cambial da política monetária."]],
r:[["mundell1963","mobilidade de capital e política de estabilização"],["fleming1962","política doméstica sob câmbio fixo e flutuante"],["dornbusch1976","overshooting cambial"],["rey2013","ciclo financeiro global e autonomia monetária"]]},
20:{d:["Sob câmbio fixo e livre mobilidade de capital, a paridade de juros obriga o juro doméstico a igualar o externo. O banco central perde a política monetária como instrumento: se baixar os juros, o capital sai e a paridade cai. Esse é o trilema — não é possível ter, ao mesmo tempo, câmbio fixo, capital livre e política monetária autônoma.",
"Câmbio fixo pode ajudar a importar credibilidade de um banco central externo, mas tem custos quando a economia recebe choques diferentes dos do país-âncora. Se os mercados passam a esperar uma desvalorização, o juro doméstico precisa subir para compensar; se as reservas forem insuficientes, ocorre um ataque especulativo.",
"Na prática, muitos países adotam regimes intermediários e intervêm no câmbio mesmo quando declaram flutuação. E com um ciclo financeiro global, até economias com câmbio flutuante sentem a política monetária dos Estados Unidos via fluxos de capital e prêmio de risco."],
w:["Tratar o trilema como escolha binária: regimes intermediários existem e custam.","Achar que câmbio fixo elimina o risco cambial: ele o concentra em eventos de ruptura."],
k:"Câmbio fixo com capital livre transforma a política monetária em política cambial.",
f:[["Câmbio fixo|E = Ē","Paridade|i = i*","Sem política|monetária própria","Expectativa|de desvalorização","Ataque|especulativo"],[4,1,"perda de reservas reforça a expectativa"],"Quando a âncora perde credibilidade, o próprio regime gera a crise."],
s:[["Eₜ = Ēᵉₜ₊₁ = Ē","Câmbio fixo crível: câmbio esperado igual ao atual."],["iₜ = i*ₜ","Pela paridade, o juro doméstico é o externo."],["iₜ ≈ i*ₜ + ⟦(Ē − Eᵉₜ₊₁) / Ē⟧","Se o mercado espera desvalorização (Eᵉ < Ē), o juro doméstico precisa subir."],["Trilema: câmbio fixo + capital livre ⇒ i não é escolhido","Só dois dos três objetivos são compatíveis."]],
r:[["krugman1979","modelo de crise de balanço de pagamentos"],["obstfeld2005","o trilema na história"],["calvo2002","medo de flutuar"],["rey2013","dilema, não trilema"],["eichengreen2019","história do sistema monetário internacional"]]},
21:{d:["Há três razões para limitar a discricionariedade dos formuladores de política. A primeira é incerteza: os efeitos das políticas são incertos, e políticas agressivas sob incerteza podem desestabilizar. Brainard mostrou que, quando o efeito do instrumento é incerto, a resposta ótima é mais cautelosa.",
"A segunda é a inconsistência temporal. Um banco central que pudesse surpreender o público com inflação reduziria o desemprego temporariamente. O público, sabendo disso, espera inflação mais alta, e a economia termina com mais inflação sem ganho de emprego. Compromissos críveis — regras, metas, independência — eliminam esse viés.",
"A terceira é política. Governos com horizonte eleitoral podem preferir estímulos que geram benefícios imediatos e custos futuros. Regras fiscais e instituições independentes servem para alongar o horizonte das decisões, mas precisam de cláusulas de escape para choques extraordinários."],
w:["Confundir regra com rigidez: boas regras incluem respostas a choques e cláusulas de escape.","Tratar independência do banco central como ausência de prestação de contas."],
k:"Compromisso crível pode entregar resultados melhores do que liberdade total de ação.",
f:[["Incentivo|a surpreender","Público|antecipa","Expectativas|πᵉ ↑","Inflação maior|sem ganho de emprego","Solução|regra ou independência"],null,"O viés inflacionário surge da racionalidade do público, não de erro do formulador."],
s:[["uₜ = uₙ − α (πₜ − πᵉₜ)","Desemprego cai só com inflação surpresa."],["L = π² + λ u²","Perda do formulador de política."],["∂L/∂π = 0 ⇒ π = λα [uₙ − α(π − πᵉ)]","Escolha discricionária dado πᵉ."],["Com π = πᵉ:  π_disc = ⟦λ α uₙ⟧ > 0 e u = uₙ","Viés inflacionário: mais inflação, mesmo desemprego."],["Com compromisso: π = 0 e u = uₙ","A regra crível elimina o viés sem custo de desemprego."]],
r:[["kydland1977","regras em vez de discrição"],["barro1983","reputação e política monetária"],["rogoff1985","o banqueiro central conservador"],["brainard1967","incerteza e cautela"],["lucas1976","crítica de Lucas"]]},
22:{d:["A restrição orçamentária do governo liga déficits de hoje a dívida de amanhã. Medida em proporção do PIB, a dívida cresce quando o juro real supera o crescimento e quando há déficit primário. Com r maior que g, estabilizar a dívida exige superávit primário proporcional ao estoque; com r menor que g, a dívida pode cair sozinha.",
"A equivalência ricardiana propõe que, se o público entende que dívida de hoje será imposto amanhã, trocar impostos por dívida não altera o consumo. A evidência é de equivalência parcial: horizontes finitos, restrições de crédito e incerteza fazem cortes de impostos financiados por dívida afetar a demanda.",
"A dívida alta tem custos mesmo sem crise: reduz o espaço para política anticíclica e expõe o país a mudanças no prêmio de risco. Um aumento do prêmio eleva r, piora a dinâmica e pode validar o próprio medo que o causou — um equilíbrio múltiplo que torna a credibilidade fiscal valiosa."],
w:["Avaliar sustentabilidade só pelo déficit, ignorando r − g e o estoque de dívida.","Supor que r < g é permanente: o diferencial muda com o ciclo e com o prêmio de risco."],
k:"A dinâmica da dívida depende de r − g, do saldo primário e do estoque inicial.",
f:[["Déficit primário|d","Juros reais|r","Crescimento|g","Dívida/PIB|b","Prêmio de risco|x"],[4,1,"dívida maior eleva o prêmio e os juros"],"Juros e crescimento definem a direção da dívida; o prêmio de risco pode tornar a dinâmica instável."],
s:[["Bₜ = (1 + r) Bₜ₋₁ + Gₜ − Tₜ","Restrição orçamentária em termos reais."],["bₜ − bₜ₋₁ ≈ ⟦(r − g)⟧ bₜ₋₁ + (gₜ − tₜ)","Dinâmica da dívida em proporção do PIB."],["Superávit estabilizador:  s* = (r − g) · b","Saldo primário que mantém b constante."],["r < g e s = 0 ⇒ b cai","Com juro real abaixo do crescimento, a dívida diminui sem superávit."]],
r:[["barro1974","equivalência ricardiana"],["sargent1981","aritmética monetarista desagradável"],["blanchard2019","dívida pública com juros baixos"],["reinhart2009","oito séculos de crises"],["ramey2011","multiplicadores de gasto"]]},
23:{d:["A política monetária moderna é organizada em torno de metas de inflação. O banco central anuncia uma meta, comunica sua estratégia e usa a taxa de juros de curto prazo para atingi-la. A regra de Taylor descreve bem a prática: os juros sobem com a inflação acima da meta e com o produto acima do potencial.",
"O princípio central é que os juros nominais precisam reagir mais que um para um à inflação, de modo que o juro real suba quando a inflação sobe. Se a reação for menor, o juro real cai, a demanda aquece e a inflação se alimenta. Esse é o princípio de Taylor.",
"O piso de juros zero mudou o debate. Quando o juro nominal não pode cair mais, os bancos centrais passaram a usar compra de ativos e orientação futura para reduzir juros longos. A queda da taxa natural de juros nas últimas décadas torna esse limite mais frequente e reabre a discussão sobre o nível ideal da meta de inflação."],
w:["Ler a regra de Taylor como algoritmo mecânico: ela descreve, não substitui, o julgamento.","Ignorar que r* e o hiato são estimados com muita incerteza."],
k:"Para controlar a inflação, o juro nominal precisa subir mais que a inflação.",
f:[["Meta|π* e hiato","Regra|de juros","Expectativas|curva de juros","Canais|crédito, câmbio, riqueza","Demanda|e inflação"],[4,0,"o banco central reage aos resultados"],"A política monetária atua por expectativas e por vários canais ao mesmo tempo."],
s:[["iₜ = r* + πₜ + a (πₜ − π*) + b (Yₜ − Yₙ)/Yₙ","Regra de Taylor."],["iₜ = r* + π* + ⟦(1 + a)⟧ (πₜ − π*) + b · hiato","Reorganizando: a resposta à inflação é 1 + a."],["rₜ = iₜ − πₜ = r* + a (πₜ − π*) + b · hiato","Com a > 0, o juro real sobe quando a inflação supera a meta."],["Taylor (1993):  a = b = 0,5;  r* = π* = 2%","Calibração original da regra."]],
r:[["taylor1993","a regra original"],["bernanke1997","metas de inflação"],["cgg1999","a ciência da política monetária"],["woodford2003","juros e preços"],["gali2015","o modelo novo-keynesiano"],["summers2014","estagnação secular e piso de juros"]]},
24:{d:["A macroeconomia nasceu como resposta à Grande Depressão. Keynes argumentou que a economia pode ficar presa em desemprego elevado por falta de demanda. A síntese neoclássica dos anos 1950 e 1960 juntou essa visão de curto prazo, formalizada no IS–LM, com a teoria clássica de longo prazo, e acrescentou a curva de Phillips.",
"Os anos 1970 abalaram a síntese. A estagflação contrariou a curva de Phillips estável; Friedman e Phelps já haviam previsto o papel das expectativas; Lucas mostrou que modelos sem expectativas racionais erram ao avaliar mudanças de política. Os modelos de ciclos reais foram mais longe e atribuíram as flutuações a choques de produtividade.",
"A convergência dos anos 2000 combinou expectativas racionais e otimização com rigidezes nominais: o modelo novo-keynesiano. A crise de 2008 revelou o que faltava — finanças, heterogeneidade entre famílias, limites aos juros — e a pesquisa atual incorpora esses elementos. A lição do livro é que a macroeconomia avança respondendo a fatos que os modelos anteriores não explicavam."],
w:["Ler a história como sucessão de modelos certos substituindo errados: cada escola deixou instrumentos ainda usados.","Supor que o modelo canônico atual não tem lacunas: finanças e heterogeneidade continuam em aberto."],
k:"Cada crise expôs uma lacuna do modelo dominante e gerou o seguinte.",
f:[["Keynes|1936","Síntese|IS–LM e Phillips","Expectativas|1968–1976","Ciclos reais|1982","Novo-keynesiano|e DSGE","Pós-2008|finanças e heterogeneidade"],null,"A sequência de paradigmas e os fatos que motivaram cada mudança."],
s:[["xₜ = Eₜxₜ₊₁ − σ (iₜ − Eₜπₜ₊₁ − rⁿₜ)","IS dinâmica do modelo novo-keynesiano."],["πₜ = β Eₜπₜ₊₁ + ⟦κ xₜ⟧","Curva de Phillips novo-keynesiana."],["iₜ = φπ πₜ + φₓ xₜ","Regra de política monetária."],["φπ > 1 ⇒ equilíbrio determinado","Versão dinâmica do princípio de Taylor."]],
r:[["keynes1936","teoria geral"],["hicks1937","IS–LM"],["friedman1968","o papel da política monetária"],["lucas1972","expectativas e neutralidade da moeda"],["lucas1976","crítica de Lucas"],["kydland1982","ciclos reais"],["smets2007","DSGE estimado"],["blanchard2009","o estado da macro"],["mankiw2006","cientista e engenheiro"]]}
};

/* ---------------------------------------------------------------------
   1. FLUXOGRAMAS (SVG animado, horizontal ou vertical)
   --------------------------------------------------------------------- */
function flowSVG(spec,vertical){
  const nodes=spec[0],loop=spec[1],n=nodes.length;
  const BW=vertical?250:156,BH=60,GAP=vertical?34:30;
  const W=vertical?BW+120:n*BW+(n-1)*GAP+20, H=vertical?n*BH+(n-1)*GAP+20:(loop?190:BH+30);
  const pos=nodes.map((_,i)=>vertical?{x:20,y:10+i*(BH+GAP)}:{x:10+i*(BW+GAP),y:10});
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Fluxograma: ${esc(nodes.map(t=>t.replace('|',' ')).join(' → '))}"><defs><marker id="fxa" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9Z" fill="var(--blue)"/></marker><marker id="fxg" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9Z" fill="var(--gold)"/></marker></defs>`;
  for(let i=0;i<n-1;i++){const a=pos[i],b=pos[i+1];const d=vertical?`M${a.x+BW/2} ${a.y+BH} L${b.x+BW/2} ${b.y-3}`:`M${a.x+BW} ${a.y+BH/2} L${b.x-3} ${b.y+BH/2}`;s+=`<path class="ed" d="${d}"/><path class="flow" d="${d}" marker-end="url(#fxa)" style="animation-delay:${-i*.25}s"/>`;}
  if(loop){const a=pos[loop[0]],b=pos[loop[1]];let d,lx,ly;
    if(vertical){const x=a.x+BW;d=`M${x} ${a.y+BH/2} C${x+95} ${a.y+BH/2} ${x+95} ${b.y+BH/2} ${b.x+BW+4} ${b.y+BH/2}`;lx=x+12;ly=(a.y+b.y)/2+BH/2;}
    else{const y=a.y+BH;d=`M${a.x+BW/2} ${y} C${a.x+BW/2} ${y+95} ${b.x+BW/2} ${y+95} ${b.x+BW/2} ${y+5}`;lx=(a.x+b.x+BW)/2;ly=y+92;}
    s+=`<path class="ed" d="${d}"/><path class="flow loop" d="${d}" marker-end="url(#fxg)"/>`;
    s+=vertical?`<text class="loop-label" x="${lx+70}" y="${ly}" text-anchor="middle" transform="rotate(90 ${lx+70} ${ly})">${esc(loop[2])}</text>`:`<text class="loop-label" x="${lx}" y="${ly}" text-anchor="middle">${esc(loop[2])}</text>`;}
  nodes.forEach((t,i)=>{const [t1,t2]=t.split('|'),p=pos[i];s+=`<g class="nd" data-i="${i}" transform="translate(${p.x} ${p.y})"><rect width="${BW}" height="${BH}" rx="10"/><text class="ix" x="12" y="18">${String(i+1).padStart(2,'0')}</text><text class="t1" x="12" y="36">${esc(t1)}</text><text class="t2" x="12" y="52">${esc(t2||'')}</text></g>`;});
  return s+'</svg>';
}
function renderFlows(){
  qa('.fx[data-n]').forEach(box=>{const n=+box.dataset.n,vert=box.clientWidth<700;if(box._vert===vert&&box._done)return;box._vert=vert;box._done=1;q('.fx-svg',box).innerHTML=flowSVG(X[n].f,vert);});
}
function animateFlow(box){
  if(RM||box._anim)return;box._anim=1;const nds=qa('.nd',box);let i=0;
  box._timer=setInterval(()=>{nds.forEach(g=>g.classList.remove('hot'));const cur=qa('.nd',box);if(!cur.length)return;cur[i%cur.length].classList.add('hot');i++;},900);
}

/* ---------------------------------------------------------------------
   2. DERIVAÇÕES ANIMADAS
   --------------------------------------------------------------------- */
function stepsHTML(n){
  const st=X[n].s;
  return `<div class="steps-box" data-n="${n}"><div class="steps-head"><h3>Derivação passo a passo</h3><div class="steps-ctl"><button type="button" data-act="prev" aria-label="Passo anterior">‹</button><button type="button" data-act="play" aria-pressed="false">▶ Animar</button><button type="button" data-act="next" aria-label="Próximo passo">›</button><button type="button" data-act="all">Ver tudo</button><span class="steps-dots">${st.map(()=>'<i></i>').join('')}</span></div></div><ol class="steps-list">${st.map((x,i)=>`<li><span class="sn">${String(i+1).padStart(2,'0')}</span><div class="se">${esc(x[0]).replace(/⟦(.*?)⟧/g,'<span class="hl">$1</span>')}</div><div class="sx">${esc(x[1])}</div></li>`).join('')}</ol></div>`;
}
function stepsSet(box,k){
  const lis=qa('.steps-list li',box),dots=qa('.steps-dots i',box);box._k=k;
  lis.forEach((li,i)=>{li.classList.toggle('seen',i<k);li.classList.toggle('now',i===k);if(k>=lis.length)li.classList.add('seen');});
  if(k>=lis.length)lis.forEach(li=>li.classList.remove('now'));
  dots.forEach((d,i)=>d.classList.toggle('on',i<=k));
}
function stepsPlay(box,on){
  const b=q('[data-act="play"]',box);clearInterval(box._iv);b.setAttribute('aria-pressed',String(!!on));b.textContent=on?'❚❚ Pausar':'▶ Animar';
  if(!on)return;const len=qa('.steps-list li',box).length;if((box._k??-1)>=len-1)stepsSet(box,-1);
  const tick=()=>{const k=(box._k??-1)+1;stepsSet(box,k);if(k>=len-1){clearInterval(box._iv);setTimeout(()=>stepsPlay(box,false),900);}};
  tick();box._iv=setInterval(tick,2100);
}
document.addEventListener('click',e=>{
  const b=e.target.closest('.steps-ctl button');if(!b)return;const box=b.closest('.steps-box'),len=qa('.steps-list li',box).length,k=box._k??-1;
  if(b.dataset.act==='play')stepsPlay(box,b.getAttribute('aria-pressed')!=='true');
  else{stepsPlay(box,false);if(b.dataset.act==='next')stepsSet(box,Math.min(k+1,len-1));if(b.dataset.act==='prev')stepsSet(box,Math.max(k-1,0));if(b.dataset.act==='all')stepsSet(box,len);}
});

/* ---------------------------------------------------------------------
   3. LABORATÓRIOS ANIMADOS: traçado progressivo + varredura de parâmetro
   --------------------------------------------------------------------- */
const baseLine=window.lineChart;
if(typeof baseLine==='function'){
  window.lineChart=function(canvas,series,opt){
    const r=canvas.__reveal;
    if(r!==undefined&&r<1){
      opt=Object.assign({},opt||{});
      const xs=series.flatMap(s=>s.data.map(p=>p[0])),ys=series.flatMap(s=>s.data.map(p=>p[1]));
      if(opt.xmin===undefined)opt.xmin=Math.min(...xs);if(opt.xmax===undefined)opt.xmax=Math.max(...xs);
      if(opt.ymin===undefined)opt.ymin=Math.min(...ys);if(opt.ymax===undefined)opt.ymax=Math.max(...ys);
      series=series.map(s=>Object.assign({},s,{data:s.data.slice(0,Math.max(2,Math.ceil(s.data.length*r)))}));
    }
    return baseLine(canvas,series,opt);
  };
}
function reveal(canvas,redraw,ms){
  if(RM){canvas.__reveal=undefined;redraw();return;}
  const t0=performance.now();ms=ms||1300;
  (function f(now){const k=Math.min(1,(now-t0)/ms);canvas.__reveal=1-Math.pow(1-k,3);redraw();if(k<1)requestAnimationFrame(f);else{canvas.__reveal=undefined;redraw();}})(t0);
}
function sweep(c,btn){
  const host=q(`#labControls-${c.n}`),inp=host&&q('input[type=range]',host),tag=q(`#lab-${c.n} .sweep-tag`);if(!inp)return;
  if(btn._raf){cancelAnimationFrame(btn._raf);btn._raf=0;btn.setAttribute('aria-pressed','false');btn.textContent='▶ Animar parâmetro';tag&&tag.classList.remove('on');inp.value=btn._orig;inp.dispatchEvent(new Event('input',{bubbles:true}));return;}
  const min=+inp.min,max=+inp.max,step=+inp.step||1;btn._orig=inp.value;btn.setAttribute('aria-pressed','true');btn.textContent='❚❚ Parar';
  const label=(inp.closest('.control')&&inp.closest('.control').querySelector('label').firstChild.textContent)||'';const t0=performance.now(),dur=7000;
  const f=now=>{const ph=((now-t0)%dur)/dur,v=min+(max-min)*(0.5-0.5*Math.cos(2*Math.PI*ph));const vv=Math.round(v/step)*step;
    if(+inp.value!==vv){inp.value=vv;inp.dispatchEvent(new Event('input',{bubbles:true}));}
    if(tag){tag.textContent=label.trim()+' = '+Number(vv).toLocaleString('pt-BR',{maximumFractionDigits:2});tag.classList.add('on');}
    if(now-t0<dur*2)btn._raf=requestAnimationFrame(f);else sweep(c,btn);};
  btn._raf=requestAnimationFrame(f);
}

/* ---------------------------------------------------------------------
   4. INJEÇÃO NOS CAPÍTULOS
   --------------------------------------------------------------------- */
function readingsHTML(n){
  return `<div class="readings"><h3>Leituras recomendadas para este capítulo</h3><ol>${X[n].r.map(([id,why])=>REFS[id]?`<li>${REFS[id]}<span class="why">${esc(why)}</span></li>`:'').join('')}</ol></div>`;
}
function enhanceChapter(c){
  const sec=q(`#cap-${c.n}`),x=X[c.n];if(!sec||!x||sec.dataset.plus)return;sec.dataset.plus='1';
  const deep=`<div class="deep"><div class="deep-text"><h3>Aprofundamento</h3>${x.d.map(p=>`<p>${esc(p)}</p>`).join('')}</div><aside class="deep-side"><span class="tag">Armadilhas comuns</span><ul>${x.w.map(w=>`<li>${esc(w)}</li>`).join('')}</ul><div class="key"><b>Ideia-chave</b>${esc(x.k)}</div></aside></div>`;
  const fx=`<div class="fx" data-n="${c.n}"><div class="fx-head"><h3>Fluxograma do mecanismo</h3><p>setas animadas indicam a direção causal no modelo</p></div><div class="fx-svg"></div><p class="fx-caption">${esc(x.f[2])}</p></div>`;
  const cg=q('.concept-grid',sec);cg&&cg.insertAdjacentHTML('afterend',deep+fx);
  const fr=q('.formula-row',sec);fr&&fr.insertAdjacentHTML('afterend',stepsHTML(c.n));
  const cb=q('.codebox',sec);cb&&cb.insertAdjacentHTML('afterend',readingsHTML(c.n));
  const lh=q(`#lab-${c.n} .lab-head`,sec),ex=lh&&q('button[data-export]',lh);
  if(ex){const wrap=document.createElement('div');wrap.className='lab-btns';ex.replaceWith(wrap);
    wrap.innerHTML=`<button type="button" class="lab-anim" data-sweep="${c.n}" aria-pressed="false">▶ Animar parâmetro</button><button type="button" class="lab-anim" data-replay="${c.n}">↻ Redesenhar</button>`;wrap.appendChild(ex);}
  const lc=q(`#lab-${c.n} .lab-canvas`,sec);lc&&lc.insertAdjacentHTML('beforeend','<span class="sweep-tag"></span>');
}
document.addEventListener('click',e=>{
  const s=e.target.closest('[data-sweep]');if(s){const c=CHAPTERS.find(x=>x.n===+s.dataset.sweep);c&&sweep(c,s);return;}
  const r=e.target.closest('[data-replay]');if(r){const c=CHAPTERS.find(x=>x.n===+r.dataset.replay);const cv=q(`#labCanvas-${c.n}`);c&&c._labRedraw&&reveal(cv,c._labRedraw);}
});

/* ---------------------------------------------------------------------
   5. MACRO LAB: diagrama de transmissão e reprodução animada
   --------------------------------------------------------------------- */
const TR_SRC=[['fiscal','Impulso fiscal'],['monetary','Choque monetário'],['risk','Prêmio de risco'],['supply','Choque de oferta'],['productivity','Produtividade'],['external','Demanda externa'],['expectations','Desancoragem']];
const TR_DST=[['y','Hiato do produto'],['pi','Inflação'],['u','Desemprego'],['i','Taxa nominal']];
/* sinais de impacto lidos das equações do motor (macroPath) */
const TR_E={fiscal:{y:'+',u:'−',pi:'+',i:'+'},monetary:{y:'−',u:'+',pi:'−',i:'+'},risk:{y:'−',u:'+',pi:'−'},supply:{pi:'+',y:'−',i:'+'},productivity:{y:'+',u:'−',pi:'−'},external:{y:'+',u:'−',pi:'+'},expectations:{pi:'+',i:'+'}};
function transmissionHTML(){
  const W=900,H=330,sx=20,dx=700,bw=180,bh=34;
  const sy=i=>18+i*43,dy=i=>48+i*68;
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Diagrama de transmissão dos choques do laboratório macroeconômico">`;
  TR_SRC.forEach(([k],i)=>{Object.keys(TR_E[k]).forEach(d=>{const j=TR_DST.findIndex(x=>x[0]===d);s+=`<path class="e" data-s="${k}" d="M${sx+bw} ${sy(i)+bh/2} C${sx+bw+220} ${sy(i)+bh/2} ${dx-220} ${dy(j)+bh/2} ${dx} ${dy(j)+bh/2}"/>`;});});
  TR_SRC.forEach(([k,l],i)=>{s+=`<g class="src" data-s="${k}" transform="translate(${sx} ${sy(i)})"><rect width="${bw}" height="${bh}" rx="8"/><text x="12" y="22">${l}</text></g>`;});
  TR_DST.forEach(([k,l],j)=>{s+=`<g class="dst" data-d="${k}" transform="translate(${dx} ${dy(j)})"><rect width="${bw}" height="${bh}" rx="8"/><text x="12" y="22">${l}</text><text class="sign" x="${bw-14}" y="22" text-anchor="end"></text></g>`;});
  return s+'</svg>';
}
function updateTransmission(){
  if(typeof macro==='undefined')return;const active={};
  TR_SRC.forEach(([k])=>{const v=+macro[k]||0;q(`.transmission .src[data-s="${k}"]`)?.classList.toggle('on',Math.abs(v)>1e-9);qa(`.transmission .e[data-s="${k}"]`).forEach(e=>e.classList.toggle('on',Math.abs(v)>1e-9));
    if(Math.abs(v)>1e-9)Object.entries(TR_E[k]).forEach(([d,sg])=>{active[d]=(active[d]||0)+(sg==='+'?1:-1)*Math.sign(v);});});
  TR_DST.forEach(([d])=>{const g=q(`.transmission .dst[data-d="${d}"]`);if(!g)return;const a=active[d];g.classList.toggle('on',a!==undefined);const t=q('.sign',g);t.textContent=a===undefined?'':(a>0?'▲':a<0?'▼':'◆');t.style.fill=a>0?'var(--red)':a<0?'var(--blue)':'var(--gold)';});
}
function setupMacro(){
  const cockpit=q('#macro-lab .cockpit');if(!cockpit||q('.transmission'))return;
  cockpit.insertAdjacentHTML('beforebegin',`<div class="transmission"><div class="fx-head"><h3>Mapa de transmissão dos choques</h3><p>choques ativos acendem; ▲ ▼ indicam o sinal de impacto no motor didático (◆ = efeitos que se compensam)</p></div>${transmissionHTML()}</div>`);
  const viz=q('#macro-lab .cock-viz'),canvas=q('#macroCanvas');
  viz&&viz.insertAdjacentHTML('beforeend','<div class="macro-play"><button type="button" id="macroReplay">▶ Reproduzir trajetória</button><button type="button" id="macroTour">▶ Percorrer cenários</button><span id="macroTourLabel"></span></div>');
  q('#macroControls')?.addEventListener('input',updateTransmission);
  qa('.preset-row button').forEach(b=>b.addEventListener('click',()=>{updateTransmission();if(canvas&&typeof updateMacro==='function')reveal(canvas,updateMacro,1400);}));
  q('#macroReplay')?.addEventListener('click',()=>reveal(canvas,updateMacro,1800));
  q('#macroTour')?.addEventListener('click',function(){
    const btn=this,lab=q('#macroTourLabel'),order=['boom','tight','supply','crisis','productivity','base'],names={boom:'Expansão fiscal',tight:'Aperto monetário',supply:'Choque de oferta',crisis:'Crise financeira',productivity:'Produtividade',base:'Base'};
    if(btn._t){clearTimeout(btn._t);btn._t=0;btn.textContent='▶ Percorrer cenários';lab.textContent='';return;}
    btn.textContent='❚❚ Parar';let i=0;
    const go=()=>{const p=order[i];q(`.preset-row button[data-preset="${p}"]`)?.click();lab.textContent=`cenário ${i+1}/${order.length}: ${names[p]}`;i++;if(i<order.length)btn._t=setTimeout(go,3600);else{btn._t=0;setTimeout(()=>{btn.textContent='▶ Percorrer cenários';lab.textContent='';},1500);}};
    go();
  });
  updateTransmission();
}

/* ---------------------------------------------------------------------
   6. BIBLIOGRAFIA CONSOLIDADA + ABERTURA
   --------------------------------------------------------------------- */
function setupBiblio(){
  const sec=q('#referencias');if(!sec||q('.biblio'))return;
  const use={};Object.entries(X).forEach(([n,x])=>x.r.forEach(([id])=>{(use[id]=use[id]||[]).push(+n);}));
  const ids=Object.keys(REFS).sort((a,b)=>REFS[a].replace(/<[^>]+>/g,'').localeCompare(REFS[b].replace(/<[^>]+>/g,''),'pt'));
  const html=ids.map(id=>{const caps=(use[id]||[]).sort((a,b)=>a-b);return `<li data-t="${esc(REFS[id].replace(/<[^>]+>/g,'').toLowerCase())}">${REFS[id]}${caps.length?`<span class="caps">${caps.length>1?'capítulos':'capítulo'} ${caps.map(n=>`<a href="#cap-${n}">${n}</a>`).join(', ')}</span>`:''}</li>`;}).join('');
  sec.insertAdjacentHTML('beforeend',`<div class="biblio" id="bibliografia"><div class="kicker">Bibliografia consolidada</div><h3 style="font:1.6rem var(--serif);margin:.3rem 0 .2rem">${ids.length} obras para ir além do manual</h3><p class="muted" style="font-size:.8rem;margin:0">Artigos fundadores, manuais avançados e evidência empírica citados nos capítulos. Formatação APA 7. Cada item indica os capítulos em que é recomendado.</p><div class="biblio-tools"><input type="search" id="biblioSearch" placeholder="Filtrar por autor, tema ou periódico…" aria-label="Filtrar bibliografia"><span id="biblioCount">${ids.length} referências</span></div><ol id="biblioList">${html}</ol></div>`);
  q('#biblioSearch').addEventListener('input',e=>{const v=e.target.value.trim().toLowerCase();let k=0;qa('#biblioList li').forEach(li=>{const ok=!v||li.dataset.t.includes(v);li.classList.toggle('hide',!ok);if(ok)k++;});q('#biblioCount').textContent=k+' referências';});
  const rail=q('#rail');if(rail&&!q('a[href="#bibliografia"]',rail))q('a[href="#referencias"]',rail)?.insertAdjacentHTML('afterend','<a href="#bibliografia">Bibliografia consolidada</a>');
  const stats=q('.hero-stats');if(stats&&!stats.dataset.plus){stats.dataset.plus=1;stats.insertAdjacentHTML('beforeend',`<div><b>24</b><span>fluxogramas animados</span></div><div><b>${Object.values(X).reduce((a,x)=>a+x.s.length,0)}</b><span>passos de derivação</span></div><div><b>${ids.length}</b><span>referências</span></div>`);}
}

/* ---------------------------------------------------------------------
   7. ATIVAÇÃO POR VISIBILIDADE
   --------------------------------------------------------------------- */
function setupObservers(){
  if(!('IntersectionObserver' in window))return;
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target;io.unobserve(el);
    if(el.classList.contains('fx'))animateFlow(el);
    else if(el.classList.contains('steps-box')){if(RM)stepsSet(el,qa('.steps-list li',el).length);else stepsPlay(el,true);}
    else if(el.tagName==='CANVAS'){const c=CHAPTERS.find(x=>`labCanvas-${x.n}`===el.id);if(c&&c._labRedraw)reveal(el,c._labRedraw);else if(el.id==='macroCanvas'&&typeof updateMacro==='function')reveal(el,updateMacro,1800);}
  }),{threshold:.35});
  qa('.fx[data-n], .steps-box, .lab-canvas canvas, #macroCanvas').forEach(el=>io.observe(el));
}

function init(){
  CHAPTERS.forEach(enhanceChapter);renderFlows();setupMacro();setupBiblio();setupObservers();
  if(RM)qa('.steps-box').forEach(b=>stepsSet(b,qa('.steps-list li',b).length));
  let t;window.addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(renderFlows,150);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
window.MACRO_PLUS={X,REFS};
})();
