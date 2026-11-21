# Auditoria e plano de 48 épocas do Manezinho TA

A maior melhoria é transformar o mapa esquemático em uma cidade que o jogador reconheça pelas ruas, pelo relevo e pelo que encontra atrás das portas. O corredor de referência liga **Centro → Ponte Hercílio Luz → Estreito → Kobrasol**. Ele serve para acertar escala, circulação e desempenho antes de expandir a Ilha, o Continente e São José. O plano inclui uma primeira rua com imóveis abertos cedo e detalha as entregas de pessoas, animais, carros, estabelecimentos e armas ao longo das 48 épocas.

## Auditoria da versão atual

O arquivo local `manezinhogta.html` tem **2.737.643 bytes** (2,61 MiB). Sua única diferença em relação ao conteúdo da `origin/master` no commit `0236061` é a ausência da quebra de linha final após `</html>`. O plano, portanto, toma a atualização de 19/11/2026 como base. SHA-256 local: `5A658163724014671119BE700E014CEB8FA1AA5AEBE49CBE751B69EEB940377F`.

**Verificação prática.** Em Chrome headless com WebGL por software, o botão Jogar levou ao Centro e o mundo renderizou. **M** abriu o mapa e **Esc** abriu a pausa. A troca para Surfista pelo gancho interno de teste gravou a escolha no armazenamento local. A página reabriu em viewport móvel emulado de **390 × 844** e apresentou a opção de retomar. O jogo informou **18 de 18 modelos 3D decodificados**, **146 segmentos** no grafo de vias e **193 registros** no sistema de interiores. Os registros não equivalem a 193 visitas verificadas. A emulação não mede o desempenho do jogo em um celular físico.

**O que aparece em jogo.** A ponte funciona como referência visual do ponto inicial. No entorno, há grandes manchas de terreno abertas, volumes de prédios distantes bastante parecidos e um personagem cuja silhueta evidencia as junções dos ombros. O mapa mostra uma costa simplificada, poucas vias transversais e uma área pequena para o Estreito. Em 1262 × 704, a tela do mapa precisou de rolagem e o botão de fechar ficou parcialmente abaixo da primeira dobra. O HUD apresenta a lista inteira de armas antes de o jogador andar ou dirigir.

| Prioridade | Evidência e oportunidade |
| --- | --- |
| P0 · Inicialização | Um script de cerca de **2,70 milhões de caracteres** embute o motor, a lógica, dados e ativos. Só os GLBs em Base64 ocupam **1,51 milhão de caracteres**, cerca de 55% do HTML. Já há Meshopt, presets e resolução dinâmica. A inicialização atual monta boa parte do mundo, passa pela frota e pré-compila a cena antes de liberar o menu. Nos testes por software, o menu foi detectado em cerca de **12–19 s** e o HUD apareceu **0,7–0,8 s** após Jogar. Medir cada etapa e colocar o menu e o trecho inicial na frente da fila. Os tempos são observações do ambiente headless, sem equivaler a benchmark em hardware real. |
| P0 · Manutenção | Uma linha da distribuição concentra cerca de **1,83 milhão de caracteres**. Não apareceu uma fonte de jogo rastreada com o nome do projeto. Localizar a fonte original e os arquivos Blender antes de editar o pacote. Separar módulos, camadas de mapa e ativos. Aproveitar os ganchos existentes de teste determinístico e manter a URL pública. |
| P0 · Mapa | As vias e os polos comerciais têm pontos e perfis manuais. O mapa exibiu Centro, Lagoa, Joaquina, Jurerê, Canasvieiras, Campeche, Ribeirão, Pântano do Sul e Estreito. São José não apareceu. Adotar costa, relevo e grafo verificáveis e corrigir altimetria, conexões de pontes, sentidos, acessos e calçadas antes de expandir. |
| P1 · Imóveis | O menu anuncia **20 Unicred, 4 Havan, 7 Koerich, 8 Pratique, 11 Keko Pastel** com entrada e quatro shoppings. Parte das lojas é posicionada por perfil ou ponto de via. Criar um inventário dos imóveis, identificar cada porta e diferenciar lojas, residências, igrejas e prédios públicos. Expandir por quarteirão e validar a saída. |
| P1 · Pessoas | Manezinho e Surfista têm GLBs com esqueleto e sem clipes de animação embutidos. A Vó Rendeira é selecionável e não consta entre os 18 GLBs. Melhorar anatomia e animação em conjunto: rosto, mãos, ombros, quadril, contato dos pés e entrada em veículos. Aplicar o padrão aos três heróis e aos NPCs próximos. |
| P1 · Frota | Foram confirmados 16 GLBs de veículos. Cada um traz 19–20 malhas, sem clipes. O jogo já tem nomes e silhuetas próprios, como Berbigão e Moreia GT-R. Usar a frota atual para medir o custo de trânsito. Caprichar em proporção, materiais, reflexos e cabine nos veículos novos. Reservar a cabine completa para a proximidade e a direção. |
| P1 · Fauna | O menu cita capivaras, cães caramelo e gaivotas. O jogo expõe sistemas de animais, aves e golfinhos. Nenhum dos 18 GLBs detectados é de fauna. Priorizar silhueta, escala, marcha, nado e habitat. Variar densidade por horário e distância em vez de espalhar animais uniformemente. |
| P1 · Interface e saves | Há presets, vibração, mapa em canvas, progresso em `localStorage` e mídia em IndexedDB. O viewport bloqueia zoom e a página desativa gestos de toque globalmente. Simplificar a primeira experiência, separar gestos de menu e jogo e criar migração de saves antes de trocar as coordenadas do mundo. |
| P2 · Combate e atividades | O HUD de Manezinho mostra dez opções contando golpes, objetos e armas. Já há perseguição, surfe, pesca, corridas e colecionáveis. A pausa mostrou 27 conquistas e 33 postais. Ampliar o arsenal com opções que cumpram papéis distintos. Usar a geografia nova para criar entregas, turismo, transporte e atividades sem combate. |

## Decisões de produção

- **Geografia e escala.** Adotar referência métrica comum, com SIRGAS 2000 / UTM 22S como proposta inicial. Preservar a topologia e documentar alargamentos de calçada ou ajustes de curva feitos para jogar. Usar ônibus, barcos e viagem rápida para tornar as distâncias maiores praticáveis.
- **Fontes de mapa.** Cruzar vias e volumes do OSM com cartografia municipal, e usar o modelo digital de terreno do SIG@SC para elevação. Conferir a idade e a precisão dos dados antes de aplicar a alturas de pontes ou vias recentes. Registrar proveniência, licença, data de extração e atribuição por camada. [GeoPortal de Florianópolis](https://strapi.redeplanejamento.pmf.sc.gov.br/uploads/Formulario_dados_SMPHDU_2025_b7cbfeced4.pdf) · [Cartografia de São José](https://saojose.sc.gov.br/mapas-em-arquivo-vetorial/) · [Camadas SIG@SC](https://sigsc.sc.gov.br/wms-urls.html) · [Licença OpenStreetMap](https://www.openstreetmap.org/copyright)
- **Prédios abertos por setor.** Todo prédio em um setor liberado recebe pelo menos uma entrada funcional, espaço utilizável condizente com seu uso e saída de volta à rua. Casas reais recebem interiores e moradores fictícios. Prédios altos ganham térreo e áreas comuns visitáveis, com andares adicionais onde houver atividade. Volumes distantes são registrados como cenário até o setor ser liberado. Cada novo setor repete esse critério.
- **Unicred, Havan e veículos.** Confirmar as unidades reais nos localizadores oficiais e marcar as unidades adicionais fictícias no mundo. Depósitos e rendimento permanecem mecânicas de moeda de jogo. Registrar os direitos de distribuição dos modelos e materiais e as liberações aplicáveis para marcas e réplicas. A frota autoral existente oferece contrapartes caso um modelo identificado fique indisponível. [Localizador Unicred](https://www.unicred.com.br/centralconexao/atendimento/encontre-uma-agencia) · [Localizador Havan](https://portalcliente.havan.com.br/nossas-lojas)
- **Fidelidade por distância.** O melhor acabamento vai para rosto, mãos, animais próximos, interiores e carro dirigido. Carregar GLBs por prioridade. Medir o ganho de níveis de detalhe, instanciamento e texturas KTX2 sobre a compressão Meshopt já existente. Preservar **Leve**, **Médio** e **Lindão** com as mesmas regiões e atividades. [GLTFLoader do Three.js](https://threejs.org/docs/pages/GLTFLoader.html)

## Plano de execução

Cada época tem uma entrega demonstrável e um teste de aceite. Uma época é uma unidade de trabalho, sem assumir duração fixa. Os marcos de cada bloco servem para decidir se há base para ampliar a área ou o volume de conteúdo.

### Épocas 01 a 06 — Base e primeira experiência

| Época | Entrega | Aceite |
| --- | --- | --- |
| 01 | Recuperar a fonte do jogo e os projetos Blender. Registrar esta versão, escolher aparelhos de referência e criar o percurso de regressão. | Compilação reproduzível ou relação explícita da fonte faltante. Medir os mesmos locais e operações no desktop e no celular de referência. |
| 02 | Separar HTML, código, dados e ativos. Criar manifesto com versão, dependências, hash e origem. Preservar o endereço atual do jogo. | Abrir a mesma URL, completar o percurso da época 01 e atualizar um GLB isolado. |
| 03 | Entregar menu imediato, carregamento por prioridade do Centro e preparação dos recursos restantes após o primeiro controle. | Medir separadamente menu, primeiro controle e carregamento de fundo. Simular uma falha de arquivo e recuperar pelo jogo. |
| 04 | Dividir o mundo em células, antecipar a próxima célula conforme a velocidade e liberar recursos fora de alcance. Registrar memória e chamadas de desenho. | Cruzar três limites, voltar e repetir sem buraco de pista, perda de colisão ou crescimento contínuo de memória. |
| 05 | Simplificar HUD e tutorial. Fixar fechar no mapa, melhorar legibilidade, foco e toque. Mostrar comandos avançados sob demanda. | Jogar e fechar mapa sem rolar em 390 × 844 e 1262 × 704, tanto em toque quanto em teclado. |
| 06 | Criar primeiro quarteirão perto do ponto inicial com uma loja, uma casa e uma igreja de teste, além de uma atividade curta opcional. | Percorrer a rua a pé e de carro, visitar os três imóveis e voltar à rua em Leve e Lindão. Guardar capturas de referência. |

### Épocas 07 a 12 — Cartografia e corredor piloto

| Época | Entrega | Aceite |
| --- | --- | --- |
| 07 | Criar ingestão cartográfica com projeção, metadados, limpeza de geometria e identificadores estáveis para vias, lotes e marcos. | As mesmas fontes geram a mesma saída. A ferramenta aponta geometrias inválidas e lista dados faltantes por distrito. |
| 08 | Reconstruir litoral, Baía Norte, Baía Sul, lagoas, costões e terreno de Ilha, Continente e São José. Gerar transições de altura e cobertura. | Comparar costa e seis perfis de altitude de teste. Bordas entre células e encontros entre vias e costa permanecem contínuos. |
| 09 | Gerar grafo de vias com faixa, mãos, cruzamentos, calçadas e rotas distintas para pedestres e veículos. | Validador acusa trecho isolado, sentido inválido ou cruzamento de níveis indevido. Rotas esperadas fecham. |
| 10 | Refazer ponte Hercílio Luz, seus acessos e ligações a Colombo Salles e Pedro Ivo Campos. Tratar cabeceiras, rampas e vias elevadas. | Percorrer as travessias e acessos representados nos modos e sentidos previstos, sem quebra de altitude ou colisão fantasma. |
| 11 | Refinar Centro, Praça XV, Mercado Público, Alfândega, Rita Maria e Beira-Mar Norte. Criar fachadas e escala urbana reconhecíveis. | Meta de quatro entre cinco marcos reconhecidos sem legenda por jogadores familiarizados com Floripa. |
| 12 | Fechar Centro–Estreito–Kobrasol e alimentar mapa, GPS e ônibus com o mesmo grafo da rua. | Completar a rota nos modos que cada trecho admite. Validar destino, elevação, orientação, save e orçamento de quadro. |

### Épocas 13 a 18 — Expansão da Grande Florianópolis

| Época | Entrega | Aceite |
| --- | --- | --- |
| 13 | Expandir Continente de Floripa por Estreito, Balneário, Coqueiros, Itaguaçu, Abraão e Capoeiras. Construir Beira-Mar Continental e entorno do Scarpelli. | Percurso contínuo da cabeceira ao Abraão e a Capoeiras, com orla e três ruas de controle alinhadas à base. |
| 14 | Expandir por Campinas, Kobrasol e Barreiros, em São José. Produzir vias comerciais e integração com BR-101 e Via Expressa. | Uma entrega sai de Floripa e chega a São José. Mapa, placas e travessias acompanham a troca de município. |
| 15 | Acrescentar Praia Comprida, Beira-Mar de São José e Centro Histórico. Planejar cobertura residencial em Forquilhinha e Forquilhas por setor. | Percorrer os bairros liberados em rotas conectadas. Distinguir no mapa o perímetro pronto e o que ainda está em produção. |
| 16 | Refazer Norte da Ilha com SC-401, Santo Antônio de Lisboa, Sambaqui, Jurerê, Canasvieiras e Ingleses. Criar acessos de praia e comércio. | Chegar a quatro destinos a partir da SC-401, com transição de costa e urbanização e sem atalhos por água ou morro. |
| 17 | Refazer Trindade, Itacorubi, Santa Mônica, Lagoa da Conceição, Barra da Lagoa, Joaquina e Moçambique. Incluir dunas, canais e subidas. | Percorrer Centro–campus–Lagoa–leste com declividade revisada e caminhos públicos representados nas áreas naturais. |
| 18 | Refazer Rio Tavares, Campeche, Aeroporto, Morro das Pedras, Armação, Ribeirão e Pântano do Sul. Integrar estradas, trilhas e transporte. | Navegar entre Norte, Leste e Sul num mapa único. Publicar o quadro de cobertura de vias, setores e marcos. |

### Épocas 19 a 24 — Prédios por dentro e comércio

| Época | Entrega | Aceite |
| --- | --- | --- |
| 19 | Tornar reutilizável o sistema de portas, saídas, escadas, elevadores e acústica. Catalogar imóveis por setor, tipo, ID e endereço do mundo. | O validador identifica porta órfã ou interior sem saída. Entrar e sair preserva orientação e posição coerentes. |
| 20 | Produzir casas térreas, geminadas, apartamentos e áreas comuns com plantas compostas, mobília e materiais variados. | Um quarteirão residencial inteiro abre. Há pelo menos três famílias de planta e a porta coincide com a fachada. |
| 21 | Construir interiores de igrejas, Mercado Público, rodoviária, museus e outros marcos, com navegação, luz e pontos de interesse. | Os marcos escolhidos têm espaços reconhecíveis e circulação funcional diurna e noturna. |
| 22 | Produzir lojas de bairro, padaria, mercado, farmácia, oficina, restaurante e cafezinho. Ligar vitrine, atendente, horários e atividade. | Uma rua comercial tem todos os imóveis abertos e pelo menos quatro tipos de espaço utilizável. |
| 23 | Ampliar as agências Unicred para além da cobertura atual na Ilha, no Continente e em São José, com portes e fachadas variados. | Inventariar unidades existentes e entregar pelo menos três adicionais. Depositar em uma e sacar em outra na mesma sessão. |
| 24 | Adicionar ao menos duas Havan às quatro anunciadas, com uma megaloja de referência, variação menor, estacionamento e percursos internos. Completar imóveis pendentes nos primeiros setores. | Abrir, percorrer e sair das novas lojas. Demonstrar 100% das entradas validadas no inventário dos setores liberados. |

### Épocas 25 a 30 — Pessoas e animais

| Época | Entrega | Aceite |
| --- | --- | --- |
| 25 | Remodelar Manezinho com anatomia, rosto expressivo, pele, olhos, cabelo e mãos. Fazer a roupa acompanhar as articulações. | Conferir close diurno e noturno, dobra de ombro, cotovelo, cintura e joelho, sem junções abertas ou roupa atravessando o corpo. |
| 26 | Aplicar o padrão ao Surfista e à Vó Rendeira, com idades, proporções, postura, roupas e passos distintos. | Comparar os três sentados, em movimento e entrando em carro. Pés e mãos fazem contato com os pontos esperados. |
| 27 | Refazer caminhada, corrida, virada, escadas, rampa, sentar, abrir porta e dirigir. Ajustar transições e contato com o chão. | Percorrer ladeira e escadaria, entrar num carro e dirigir sem deslizamento persistente dos pés, salto na câmera ou mão atravessando a porta. |
| 28 | Criar elenco civil com variação de idade, porte, roupa e função. Dar rotinas de comércio, praça, praia e ônibus. | A mesma rua tem atividades diferentes em dois horários. NPCs usam faixa, calçada e porta sem bloqueios recorrentes. |
| 29 | Refazer capivaras, bucicas caramelo e gaivotas, com nado, trote, voo e reação à aproximação compatíveis com cada espécie. | Observar escala, pose, sombra e locomoção em três habitats, com comparação a referências visuais. |
| 30 | Adicionar fauna costeira e de mata confirmada para os ambientes escolhidos, incluindo aves e comparação com o boto local. Variar por habitat e período do dia. | Verificar coerência em rota de costa, área úmida e mata. A fauna distante libera recursos e evita estouro de orçamento. |

### Épocas 31 a 36 — Frota hiper-realista

| Época | Entrega | Aceite |
| --- | --- | --- |
| 31 | Produzir as referências Chevrolet Cruze, Chevrolet Equinox e Jeep Compass. Definir calibração, materiais PBR, reflexo, luz, cabine e níveis de detalhe. | Inspeção externa e interna dos três. Rodas, portas, faróis e suspensão funcionam em escala consistente. |
| 32 | Produzir Ferrari, Porsche e Nissan Skyline GT-R com modelo e geração definidos. Trabalhar pintura, vidro, instrumentos e resposta de direção distintos. | Reconhecer os carros por silhueta e faróis e distinguir seus perfis de condução em circuito de jogo. |
| 33 | Produzir Audi, BMW e Mercedes-Benz, com variantes, acabamento interno, bancos, painel e assinatura de luz diferenciados. | Os três entram no catálogo com variante, licença e orçamento calculado. A cabine funciona de dia e à noite. |
| 34 | Melhorar frenagem, suspensão, volante, câmera interna, retrovisor, ré e colisão. Ligar a animação das mãos ao volante. | Passar por garagem, lombada, curva, rampa e ré em teclado e toque, com câmera estável. |
| 35 | Adaptar frota existente à nova arquitetura. Variar trânsito por distrito e horário. Agrupar peças, compartilhar materiais e carregar cabine quando necessário. | Trânsito denso passa no perfil Leve. A versão distante do carro preserva identidade e escala quando se aproxima. |
| 36 | Integrar garagem, tintas, favoritos, carros raros, entregas, corridas e patrulha ao catálogo. | Sair da garagem, completar atividade, trocar de bairro e recuperar a configuração após recarregar. |

### Épocas 37 a 42 — Atividades e sistemas de jogo

| Época | Entrega | Aceite |
| --- | --- | --- |
| 37 | Criar roda de seleção de armas e objetos com atalhos e toque. Padronizar inventário, animação e feedback. | Trocar equipamento em movimento nos três personagens e navegar a roda por teclado, mouse e toque. |
| 38 | Ampliar armas e itens ficcionais com funções distintas, como uma carabina estilizada, escudo, lançador de tinta, taser fictício e dispositivo de distração. | Cada opção altera a jogabilidade de forma perceptível. Área de treino demonstra animação, áudio, efeito e seleção. |
| 39 | Reequilibrar os estados de perseguição e de recuperação no jogo. Tratar entrada em edifício, troca de município e retorno à exploração. | Cenários com alerta zero, alerta alto e retorno ao normal completam. O primeiro minuto de exploração funciona sem alerta indevido. |
| 40 | Criar entregas do Mercado Público, bicos em lojas, circuitos turísticos e corridas que usem o mapa maior. | Uma cadeia cruza Ilha, Continente e São José e pode ser retomada em outro setor. |
| 41 | Integrar ônibus, catamarã, trilhas e aviação. Ajustar estações, atracadouros, pouso e navegação nas bordas dos setores. | Completar trajeto multimodal até a porta de um destino. Voo e navegação cruzam setores sem lacunas. |
| 42 | Unificar progresso, economia, bancos e colecionáveis. Versionar o save e migrar posições antigas para âncoras navegáveis. | Abrir save antigo com saldo, personagem e colecionáveis preservados. Simular um erro de gravação e recuperar pelo backup. |

### Épocas 43 a 48 — Qualidade e lançamento

| Época | Entrega | Aceite |
| --- | --- | --- |
| 43 | Revisar território por bairro e rota. Conferir marcos, faixas, elevação, pontes e travessias com jogadores locais. | Resolver desvios graves de rota. Documentar ajustes deliberados de escala e áreas em produção. |
| 44 | Auditar portas, interiores, escadas, saídas e colisões. Conferir bancos, Havan, lojas, casas e igrejas em dois presets. | Todo prédio de setor liberado passa no validador. Todos os marcos e uma amostra por tipo passam por visita manual. |
| 45 | Otimizar cenas de chuva à noite, tráfego intenso, voo e visitas repetidas. Rever custos de sombra, textura, geometria e carregamento. | Três sessões de 15 minutos batem a meta de quadros do perfil correspondente, sem crescimento contínuo de memória. |
| 46 | Testar navegadores desktop, Chrome Android e Safari iOS nos aparelhos-alvo. Revisar toque, orientação, teclado, movimento reduzido e perda de WebGL. | Completar o roteiro em cada perfil e recuperar controles após interrupção, rotação e recarga. |
| 47 | Fazer teste com jogadores novos e moradores. Medir primeira atividade, reconhecimento de ruas, uso de portas, travas e abandonos. | Corrigir as fricções de maior impacto observadas em mais de uma sessão e retestar a primeira experiência. |
| 48 | Preparar lançamento na URL atual, com créditos, mapa de cobertura, notas da versão e cópia anterior pronta para retorno. | Conferir publicação em desktop e celular. Ensaiar migração e retorno usando saves de teste e ativos com versão. |

## Metas que controlam a expansão

| Indicador | Aceite proposto |
| --- | --- |
| Inicialização | Menu pronto em até **2 s**, primeiro controle em até **6 s** e download inicial de até **4 MiB** na mediana de cinco aberturas a frio. Usar conexão de 20 Mb/s com latência e dispositivo registrados. |
| Fluidez | Meta de **60 FPS** no desktop e **30 FPS** no celular de referência. Medir mediana e p95 de tempo de quadro. Como ponto de partida, p95 de até **25 ms** no desktop e **45 ms** no celular nas rotas de teste. |
| Geografia | Conferir ao menos **30 pontos de controle** nos três territórios. Buscar erro horizontal p90 de até **5 m** em vias e marcos cuja fonte sustente essa precisão. Conferir todas as conexões críticas de ponte, viaduto e travessia. |
| Prédios | **100%** dos prédios inventariados nos setores liberados têm trajeto validado porta → interior → rua. Cada imóvel tem tipo, porta, interior e setor identificáveis pelo jogo. |
| Aparência | Comparar capturas no mesmo horário por distrito. Revisar silhueta, rosto e mãos, contato dos pés, postura de animais, cabine, fachadas, luz e contraste. |
| Regressão | Conferir abertura, deslocamento, direção, mapa, pausa, personagens, imóveis e retomada a cada bloco. Após a época 42, incluir saves antigos no teste de lançamento. |
