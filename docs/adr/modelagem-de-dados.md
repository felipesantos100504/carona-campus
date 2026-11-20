# Decisões de arquitetura — Carona Campus

## Análise comparativa de modelagem de dados no Firestore

Entidade central: **caronas** e a gestão de suas **vagas/solicitações**, considerando ~400 usuários, ~40 caronas/dia, ~1.200 registros no histórico, as 3 consultas principais do app (busca por compatibilidade, histórico por usuário, verificação de status) e a regra de segurança de e-mail verificado (aplicada no nível do Firebase Authentication, igual nas três alternativas — a diferença entre elas está em quão simples fica escrever as *regras de leitura/escrita* sobre os dados).

### Alternativa A — Coleção única de caronas com array de vagas/solicitações

**O que resolve bem:** a busca de compatibilidade e o histórico podem ler o documento inteiro da carona em uma única leitura, sem consultas adicionais — simples de implementar e barato em número de leituras cobradas para o caso de poucas vagas por carona.

**O que quebra:** no pior caso do RNF-05 (dois usuários disputando a última vaga simultaneamente), atualizar um array exige reescrever o documento inteiro dentro de uma transação; sob alta contenção no mesmo documento, o Firestore degrada a taxa de escrita (o limite prático gira em torno de ~1 escrita/segundo por documento em contenção), o que gera falhas exatamente nos horários de pico (7h e 18h) que o app precisa suportar. Regras de segurança também ficam difíceis: não dá para permitir que um usuário edite só o próprio item do array sem expor os dados dos demais.

**O que fica caro de mudar depois:** documentos do Firestore têm limite de 1 MB; à medida que o histórico de solicitações por carona cresce, o array tende a inchar o documento, forçando uma migração posterior para subcoleção — o que exige reescrever toda a lógica de leitura/escrita e migrar os dados já existentes.

### Alternativa B — Coleção de caronas com subcoleção de solicitações

**O que resolve bem:** separa a escrita de uma solicitação da leitura da carona; a hierarquia natural (carona → solicitações) facilita escrever regras de segurança (cada solicitação só é editável pelo próprio usuário ou pelo motorista da carona pai); a verificação de status vira uma leitura direta no documento da solicitação.

**O que quebra:** se o contador de vagas disponíveis continuar no documento da carona (pai), a contenção de escrita do pior caso do RNF-05 permanece — duas solicitações concorrentes ainda disputam o mesmo documento pai para decrementar o contador. Além disso, a busca por compatibilidade que precisa checar solicitações abertas em várias caronas ao mesmo tempo exige uma *collection group query*, que não é gratuita: precisa de índice composto configurado previamente.

**O que fica caro de mudar depois:** se, mais adiante, for necessário listar de uma vez todas as solicitações pendentes de um motorista (por exemplo, um painel), sem o índice de collection group já configurado desde o início, essa mudança implica recriar índices em produção e reescrever as queries existentes.

### Alternativa C — Coleções desacopladas de caronas e reservas

**O que resolve bem:** reservas como coleção própria no nível raiz permitem consultas diretas por usuário (histórico, RF-09) e por carona (verificação de status), com índices simples, sem depender de collection group query; a escrita de uma reserva não compete diretamente com a leitura do documento de carona.

**O que quebra:** a garantia de "última vaga" ainda depende de uma transação que leia o contador de vagas na carona e escreva a reserva de forma atômica; sem essa transação, dois usuários podem passar pela checagem de "vaga disponível" ao mesmo tempo e ambos criarem reserva, estourando a vaga (o próprio cenário do RNF-05). Sem a hierarquia de subcoleção, cancelar uma carona não apaga automaticamente as reservas associadas — isso precisa de lógica manual.

**O que fica caro de mudar depois:** manter o contador de vagas da carona consistente com a contagem real de reservas (coleção separada) exige lógica adicional (transação no cliente ou Cloud Function); se as regras de acesso mudarem para depender da relação pai-filho (ex: "motorista só vê reservas da própria carona"), a ausência dessa hierarquia nativa força escrever regras de segurança comparando campos manualmente, mais verboso que em subcoleção.

---

## ADR-0001 — Modelagem de dados de caronas e reservas no Firestore

- **Data:** 2026-03-20
- **Situação:** Aceita; implementada na etapa 3 com os detalhes do ADR-0009
- **Quem decidiu:** Equipe de Desenvolvimento

### Contexto

O app precisa suportar a busca de compatibilidade entre ofertas e pedidos (RF-04, RF-05, RF-06), a solicitação e confirmação de vaga (RF-07, RF-08), o histórico por usuário (RF-09) e o tratamento de duas solicitações disputando a mesma vaga ao mesmo tempo (RF-15, RNF-05), com resposta em até 3 segundos (RNF-01), para uma volumetria de ~400 usuários, ~40 caronas/dia e ~1.200 registros de histórico, dentro de um prazo de 9 semanas.

### Decisão

Usamos coleções desacopladas `caronas` e `reservas` no Firestore, com o contador de vagas disponíveis atualizado dentro de uma transação, para garantir a exclusividade da vaga sob concorrência.

### Alternativas consideradas

#### Coleção única de caronas com array de vagas/solicitações

A favor: permite ler a carona e suas vagas em uma única consulta, o que é simples de implementar e barato em leituras para caronas com poucas solicitações.
Contra: sob a disputa concorrente da última vaga (RNF-05), atualizar um array inteiro dentro de uma transação gera contenção de escrita no mesmo documento, degradando a taxa de confirmação justamente nos horários de pico (7h e 18h).
Por que não: o RNF-05 exige garantir exclusividade sob concorrência de forma confiável, e um array embutido no documento da carona torna essa garantia frágil à medida que o histórico cresce.

#### Coleção de caronas com subcoleção de solicitações

A favor: a hierarquia carona → solicitações facilita escrever regras de segurança por relação pai-filho e organiza o histórico por carona de forma natural.
Contra: a busca por compatibilidade (RF-06), que precisa checar solicitações abertas em várias caronas ao mesmo tempo, exigiria uma collection group query com índice composto configurado desde o início — complexidade extra sem ganho para o nosso padrão de busca, que já parte de caronas específicas.
Por que não: a vantagem de hierarquia da subcoleção não compensa a rigidez de índice adicional necessária para a consulta principal do app.

### Consequências

Positivas: reservas isoladas em coleção própria simplificam o histórico por usuário (RF-09) e a verificação de status (RF-15) com índices diretos; o contador de vagas protegido por transação evita confirmar duas reservas para a mesma vaga nos horários de pico.

Negativas assumidas: aumenta o número de documentos e, consequentemente, de leituras/escritas cobradas pelo Firebase, já que cada reserva é um documento próprio e cada confirmação de vaga depende de uma transação (mais lenta que uma escrita simples); assumimos esse custo porque a volumetria prevista (~40 caronas/dia) mantém o uso dentro do tier gratuito.

Difícil de mudar depois: se decidirmos automatizar a consistência entre o contador de vagas da carona e a contagem real de reservas via Cloud Functions no futuro, essa lógica precisará ser adicionada sem quebrar a transação já implementada no cliente.

---

## ADR-0002 — Gerenciamento de estado e sincronização offline

- **Data:** 2026-03-20
- **Situação:** Aceita, revisada pelo ADR-0004 (a Context API não foi usada) e pelo ADR-0005 (cache offline no celular)
- **Quem decidiu:** Equipe de Desenvolvimento

### Contexto

O app precisa continuar funcionando sem conexão para consultas já carregadas (RF-14, RNF-04), dentro de um prazo de 9 semanas, e a equipe já teve contato em aula com Context API do React e com o SDK do Firestore, que já inclui cache offline nativo.

### Decisão

Usamos o cache offline nativo do Firestore combinado com Context API do React para o estado local da aplicação, em vez de adotar uma biblioteca externa de gerenciamento de estado.

### Alternativas consideradas

#### Redux com Redux Persist

A favor: controle explícito e previsível sobre o estado da aplicação, com ferramentas de debug maduras (Redux DevTools) que ajudam a rastrear mudanças de estado.
Contra: exigiria configurar uma camada de persistência offline por cima do SDK do Firestore, que já oferece cache offline, duplicando responsabilidade e aumentando o risco de os dois caches divergirem entre si.
Por que não: o RNF-04 já é atendido pelo cache nativo do Firestore; adicionar Redux Persist por cima seria esforço redundante dentro do prazo de 9 semanas, sem resolver um problema que o Firestore já resolve.

#### Zustand com sincronização manual

A favor: API mais enxuta que Redux, com menos boilerplate para configurar o estado global.
Contra: ainda exigiria escrever a lógica de reconciliação entre o cache do Firestore e o estado do Zustand ao restabelecer a conexão, com risco de estado divergente entre as duas fontes.
Por que não: o cache nativo do Firestore já resolve o RF-14 sem essa camada extra, e a equipe não tem tempo dentro do prazo para testar a fundo essa reconciliação manual.

### Consequências

Positivas: menos código de sincronização escrito à mão, aproveitando o SDK do Firestore que já resolve leitura e escrita offline exigidas pelo RF-14.

Negativas assumidas: menos controle fino sobre quando e como os dados em cache são invalidados, o que pode fazer uma tela mostrar dados levemente desatualizados em caso de falha de sincronização; assumimos esse risco porque a frequência de atualização das caronas do dia tolera um pequeno atraso.

Difícil de mudar depois: migrar futuramente para uma solução de estado mais robusta (Redux ou Zustand com sincronização própria) exigiria revisitar todos os componentes que hoje leem diretamente do listener em tempo real do Firestore.

---

## ADR-0003 — Navegação e roteamento mobile

- **Data:** 2026-03-20
- **Situação:** Aceita
- **Quem decidiu:** Equipe de Desenvolvimento

### Contexto

O trabalho exige no mínimo 5 telas além de login e cadastro, com sessão persistente e telas privadas inacessíveis a quem não está autenticado (RF-02), dentro de um prazo de 9 semanas, usando Expo — tecnologia obrigatória da disciplina, que recomenda Expo Router ou React Navigation.

### Decisão

Usamos Expo Router para a navegação do app, com grupos de rotas separados para telas autenticadas e não autenticadas.

### Alternativas consideradas

#### React Navigation configurado manualmente

A favor: biblioteca mais madura no ecossistema React Native, com mais exemplos e plugins de terceiros disponíveis para casos específicos.
Contra: exige configurar manualmente a estrutura de stacks e tabs, além da lógica de proteção das rotas autenticadas, resultando em mais código de configuração para o mesmo resultado final.
Por que não: como o Expo Router já vem integrado ao Expo (tecnologia obrigatória do trabalho) e usa a estrutura de pastas como rotas, ele reduz o tempo de configuração dentro do prazo apertado de 9 semanas.

#### Navegação customizada sem biblioteca

A favor: zero dependência externa de navegação, com controle total sobre as transições entre telas.
Contra: reimplementar histórico de navegação, deep linking e proteção de rota do zero é um esforço grande e propenso a bugs, sem ganho real de flexibilidade para as 5+ telas do escopo definido.
Por que não: nenhuma tela do escopo da v1 exige um comportamento de navegação que as bibliotecas prontas não ofereçam, então construir do zero seria desperdício de tempo de desenvolvimento.

### Consequências

Positivas: a estrutura de pastas como rotas do Expo Router acelera a criação das 5+ telas exigidas e facilita aplicar a proteção de rota por grupo (autenticado/não autenticado) exigida pelo RF-02.

Negativas assumidas: maior acoplamento às convenções específicas do Expo Router (nomeação de arquivos, layouts aninhados), o que dificultaria migrar para React Navigation puro caso o projeto cresça além do Expo Go no futuro.

Difícil de mudar depois: a organização de pastas do projeto fica atrelada à convenção de rotas do Expo Router; trocar de biblioteca de navegação mais adiante exigiria reorganizar todos os arquivos de tela do projeto.

---

## ADR-0004 — Camada de repositório com persistência local na etapa 2

- **Data:** 2026-10-30
- **Situação:** Aceita
- **Quem decidiu:** Equipe de Desenvolvimento

### Contexto

A etapa 2 exige as telas com navegação e persistência local, sem persistência remota nem autenticação. O ADR-0002 previa o cache offline do Firestore combinado com Context API, mas o Firestore só entra na etapa 3. As telas precisavam de dados que continuassem no aparelho depois de fechar o app e de estados de carregando, vazio e erro, sem ter que ser reescritas quando o Firestore entrar.

### Decisão

As telas acessam dados apenas pelas funções assíncronas de `src/data/repositorio.ts`, que nesta etapa gravam no AsyncStorage (`src/data/armazenamento.ts`), com um atraso artificial e um erro de rede que pode ser simulado. Cada tela guarda o próprio estado com o hook `useCarregamento`, que recarrega os dados quando a tela ganha foco. A Context API prevista no ADR-0002 não foi usada.

### Alternativas consideradas

#### Context API com o estado global da aplicação (como previsto no ADR-0002)

A favor: um único lugar com os dados já carregados, compartilhado entre as abas, sem recarregar a cada troca de tela.
Contra: exigiria decidir agora quando invalidar cada parte do estado global, lógica que seria refeita na etapa 3, quando os dados passarem a vir do SDK do Firestore e do seu cache.
Por que não: recarregar ao ganhar foco já mantém as abas atualizadas depois de uma reserva ou publicação, com menos código dentro do prazo da etapa.

#### Dados fixos em memória, sem persistência

A favor: nenhuma dependência e nenhum código de leitura e gravação.
Contra: tudo se perde ao fechar o app.
Por que não: a etapa 2 exige persistência local, e não seria possível mostrar uma reserva ou publicação continuando no aparelho depois de reabrir o app.

### Consequências

Positivas: trocar o AsyncStorage pelo Firestore na etapa 3 muda apenas o repositório, mantendo as assinaturas usadas pelas telas; o atraso e o erro simulados permitem demonstrar os estados de carregando e erro.

Negativas assumidas: cada tela refaz a leitura ao ganhar foco, o que no Firestore significa leituras cobradas a cada troca de aba (amenizadas pelo cache do SDK); as regras do repositório são simplificadas e ainda não usam a transação prevista no ADR-0001, já que a reserva sai confirmada e o contador de vagas é atualizado sem transação.

Difícil de mudar depois: as telas dependem do formato de retorno do repositório (`CaronaComMotorista`, `ReservaDetalhada`); se o Firestore exigir outro formato, a conversão precisa ficar dentro do repositório para não espalhar mudanças pelas telas.

---

## ADR-0005 — Firebase pelo SDK JavaScript, Expo SDK 57/58 e cache offline próprio no celular

- **Data:** 2026-11-15
- **Situação:** Aceita; revisada em 2026-11-20 (SDK 58)
- **Quem decidiu:** Equipe de Desenvolvimento

### Contexto

A etapa 3 exige conexão com o banco, autenticação e IA funcionando. O app precisa abrir no Expo Go dos celulares do grupo para a apresentação ao vivo. O Expo Go das lojas só roda o SDK mais recente (57), e o projeto estava no SDK 54. As aulas da disciplina usam o SDK 57 e o SDK JavaScript do Firebase (`firebase`). O ADR-0002 previa usar o cache offline nativo do Firestore para o RNF-04.

### Decisão

Atualizamos o projeto para o Expo SDK 57 e usamos o SDK JavaScript do Firebase (app "Web" no console), inicializado uma única vez em `src/data/firebase.ts` a partir de variáveis `EXPO_PUBLIC_*` do arquivo `.env` (modelo documentado em `.env.example`). No navegador, o Firestore usa o cache persistente (IndexedDB). No celular, o SDK JavaScript só oferece cache em memória, então o repositório guarda no AsyncStorage a última versão das listas do próprio usuário (reservas e caronas publicadas) e as devolve quando não há conexão.

### Alternativas consideradas

#### React Native Firebase (`@react-native-firebase`, SDK nativo)

A favor: cache offline persistente do Firestore no celular e login com Google nativo.
Contra: exige um build próprio do app (development build) para cada pessoa do grupo; não roda no Expo Go e exige conta paga da Apple para instalar em iPhone.
Por que não: a apresentação e os testes do grupo dependem do Expo Go, e o SDK JavaScript é o mesmo usado nas aulas.

#### Manter o SDK 54

A favor: nenhuma mudança de dependências.
Contra: o Expo Go atual recusa projetos do SDK 54 ("Project is incompatible with this version of Expo Go"), e no iPhone não dá para instalar versões antigas.
Por que não: sem o Expo Go, o app não abriria nos celulares do grupo.

### Consequências

Positivas: o mesmo código roda no Expo Go (Android e iPhone) e no navegador; a configuração do Firebase fica documentada num único arquivo de ambiente.

Negativas assumidas: no celular, o cache offline cobre só as listas do usuário (Viagens), e não a busca; sem conexão, a busca mostra o estado de erro. O SDK 57 trouxe ajustes de tipos e de lint que precisaram ser corrigidos nas telas.

Difícil de mudar depois: migrar para o SDK nativo exigiria trocar a inicialização, a persistência da sessão e a forma de gerar o app para os testes.

### Revisão (2026-11-20): Expo SDK 58

Em 15/10/2026 saiu o Expo SDK 58, e o Expo Go das lojas foi atualizado: o iPhone de um integrante passou a recusar o projeto ("The installed version of Expo Go is for SDK 58.0.0") e no iPhone não é possível instalar uma versão antiga. Atualizamos para o SDK 58 (React Native 0.88, React 19.3, Node 22.13 ou superior). Ajustes: a web passou para `output: "single"` (aplicativo de página única), porque no SDK 58 a renderização no servidor do modo `static` esgotava a memória do Metro ao renderizar o app, que depende de Firebase e sessão no navegador; o idioma `pt-BR` da página passou a ser definido em `web.lang` no `app.json` (o `+html.tsx` só vale para o modo `static`); cada grupo de rotas protegidas (`Stack.Protected`) ganhou um destino explícito em `redirectTo`, porque no SDK 58 um grupo que deixa de valer redireciona em vez de sumir e, ao sair da conta, o app entrava em laço entre a rota inicial e o grupo; e foram corrigidos tipos do React Native 0.88 (cor dos ícones das abas, componentes de lista).

---

## ADR-0006 — Autenticação com e-mail verificado e telas protegidas

- **Data:** 2026-11-15
- **Situação:** Aceita
- **Quem decidiu:** Equipe de Desenvolvimento

### Contexto

O PRD exige cadastro com e-mail verificado (RF-01), sessão persistente (RF-02) e que o servidor recuse dados de contas não verificadas (RNF-02). A entrega pede telas privadas protegidas. O grupo também queria o login com Google, que no SDK JavaScript só funciona por janela pop-up, ou seja, no navegador.

### Decisão

Usamos o Firebase Auth com e-mail e senha, com envio do link de verificação no cadastro, e o login com Google disponível na versão web. A sessão é observada por `useSessao` (`src/hooks/use-sessao.tsx`), e o layout raiz usa `Stack.Protected` do Expo Router com três grupos: telas públicas (login e cadastro) só sem login; "Confirme seu e-mail" só com login sem verificação; abas e demais telas só com login e e-mail verificado. O perfil público (`usuarios/{uid}`) só é criado na primeira entrada depois da verificação, porque as regras do Firestore recusam qualquer escrita de conta não verificada.

### Alternativas consideradas

#### Login com Google também no celular (`@react-native-google-signin`)

A favor: login com um toque e e-mail já verificado pelo Google.
Contra: exige código nativo e um development build, que não roda no Expo Go.
Por que não: pelo mesmo motivo do ADR-0005; no celular, o login por e-mail e senha atende o RF-01.

#### Liberar o app antes da verificação do e-mail

A favor: menos atrito no primeiro acesso.
Contra: contraria o RF-01 e o RNF-02, e permitiria contas falsas publicando caronas.
Por que não: a verificação do e-mail é a principal garantia de identidade da v1 (ver Não-escopo do PRD).

### Consequências

Positivas: a proteção das telas acontece no app (`Stack.Protected`) e no servidor (as regras exigem `email_verified`); depois do login ou da saída, o próprio guard leva o usuário para a tela certa.

Negativas assumidas: no celular não há login com Google; quem se cadastra precisa abrir o e-mail antes de usar o app.

Difícil de mudar depois: as regras dependem do campo `email_verified` do token; trocar o método de autenticação exige revisar as regras.

---

## ADR-0007 — IA com Firebase AI Logic, resposta estruturada e plano B por regras

- **Data:** 2026-11-15
- **Situação:** Aceita; revisada em 2026-11-19 (ver "Revisão" no fim deste ADR)
- **Quem decidiu:** Equipe de Desenvolvimento

### Contexto

A funcionalidade de IA (PRD, seção 6) transforma o texto livre do motorista nos campos da viagem. A entrega exige que ela continue utilizável quando a API falhar ou responder fora do formato esperado (RF-16). Uma chave de API dentro do app fica visível para qualquer pessoa que baixe o app.

### Decisão

Usamos o Firebase AI Logic com a Gemini Developer API e o modelo `gemini-3.5-flash-lite` (estável, sem exigir plano pago), configurável por `EXPO_PUBLIC_GEMINI_MODEL`. A chamada pede saída estruturada em JSON (`responseSchema`), e o app ainda valida cada campo (formato de data e hora, vagas de 1 a 8, dias de 0 a 6). Se o Gemini falhar, demorar mais de 15 segundos ou devolver algo fora do formato, o app usa a extração por regras (`src/data/extracao-local.ts`) e avisa o motorista; se nem ela reconhecer nada, todos os campos ficam liberados para preenchimento manual. Só o texto digitado é enviado ao modelo.

### Alternativas consideradas

#### Chave do Google AI Studio dentro do app

A favor: integração direta, sem configurar o AI Logic.
Contra: a chave fica exposta no código do app e pode ser usada por terceiros.
Por que não: o AI Logic guarda a chave no Firebase e é o caminho usado nas aulas.

#### Cloud Function intermediando a chamada ao Gemini

A favor: controle total da chave e do prompt no servidor.
Contra: Cloud Functions exigem o plano pago (Blaze) e um deploy separado.
Por que não: o AI Logic resolve a proteção da chave sem custo e sem servidor próprio.

### Consequências

Positivas: a publicação funciona mesmo com a API fora do ar; a busca não usa IA (RNF-06), então nada além da publicação depende do Gemini.

Negativas assumidas: o plano B reconhece só as cidades do catálogo e padrões simples ("pra X", "passo por Y", "18h", "R$ 90"); o plano gratuito tem limite de requisições por minuto.

Difícil de mudar depois: trocar de provedor de IA exige reescrever `src/data/ia.ts`, mas o formato `ViagemExtraida` usado pela tela de publicação continua o mesmo.

### Revisão (2026-11-20): IA também na busca do passageiro

A mesma integração passou a interpretar o pedido do passageiro (RF-17), com outro formato de resposta (origem, destino, data, horário e ponto de embarque) e o mesmo plano B por regras. A IA só preenche os campos: a compatibilidade continua sendo feita por regras programadas (RNF-06), agora com uma janela de 1h30 em volta do horário pedido. Lugares dentro da cidade nunca viram origem ou destino; viram ponto de embarque (RF-18), porque a busca compara cidades.

### Revisão (2026-11-19): chamada direta à Gemini API com chave do AI Studio

O Firebase AI Logic foi ativado no console (Firebase AI Logic API e Gemini API ativas), mas a configuração do provedor não foi criada: toda chamada respondia "Firebase AI Logic genai config not found", mesmo quatro dias depois, e o console não oferece como recriá-la. O App Check foi descartado como causa (a exigência para o AI Logic só começa em 21/01/2027).

Decisão: quando `EXPO_PUBLIC_GEMINI_API_KEY` está no `.env`, o app chama a Gemini API diretamente (`generativelanguage.googleapis.com`) com uma chave criada no Google AI Studio para o mesmo projeto, mantendo a saída estruturada, a validação e o plano B por regras. Sem a chave, o app continua tentando o AI Logic.

Risco assumido: a chave vai dentro do app compilado e pode ser extraída por quem inspecionar o app. Mitigações: a chave fica só no `.env` (fora do Git), é restrita à Gemini API no Google Cloud, o projeto está no plano gratuito (sem cobrança, apenas limite de uso) e a chave pode ser revogada e trocada a qualquer momento. Para uma versão publicada, o caminho correto é o AI Logic com App Check ou uma função no servidor.

---

## ADR-0008 — Foto de perfil guardada no próprio Firestore

- **Data:** 2026-11-15
- **Situação:** Aceita
- **Quem decidiu:** Equipe de Desenvolvimento

### Contexto

O RF-03 pede foto de perfil. Desde o fim de 2024, o Cloud Storage for Firebase exige o plano Blaze (com cartão cadastrado), e o grupo quer manter o projeto no plano gratuito (Spark).

### Decisão

A foto escolhida na galeria (`expo-image-picker`) é recortada em quadrado, reduzida para 256 × 256 px e comprimida em JPEG (`expo-image-manipulator`), e o resultado (cerca de 20 a 40 KB) é gravado em base64 no campo `fotoUri` do perfil. Quem entra com Google usa a foto da conta Google.

### Alternativas consideradas

#### Firebase Storage

A favor: é o serviço próprio para arquivos e aceita imagens grandes.
Contra: exige o plano Blaze, com cartão de crédito cadastrado.
Por que não: a foto pequena atende o RF-03 sem custo nem cartão.

### Consequências

Positivas: sem custo; a foto chega junto com o perfil, sem leitura extra.

Negativas assumidas: cada leitura de perfil traz a foto inteira; as regras limitam o campo a cerca de 300 mil caracteres para não estourar o limite de 1 MB por documento.

Difícil de mudar depois: migrar para o Storage exige mover as fotos já gravadas e trocar `fotoUri` por uma URL.

---

## ADR-0009 — Reservas, regras de acesso, busca e avisos no app

- **Data:** 2026-11-15
- **Situação:** Aceita
- **Quem decidiu:** Equipe de Desenvolvimento

### Contexto

Com o Firestore, era preciso implementar o fluxo pedido → confirmação (RF-07, RF-08), o cancelamento (RF-12), a disputa pela última vaga (RF-15, RNF-05), a avaliação mútua (RF-10) e as notificações, protegendo tudo com regras de acesso e sem depender de servidor próprio nem do plano pago.

### Decisão

- **Ids previsíveis:** a reserva usa o id `{caronaId}_{passageiroId}` e a avaliação `{reservaId}_{autorId}`. Isso impede pedidos e notas duplicados e permite que as regras encontrem a reserva de quem está pedindo.
- **Transações + regras:** o motorista confirma o pedido numa transação que desconta uma vaga; as regras (`firestore.rules`) só aceitam a confirmação se a mesma operação descontar exatamente uma vaga, e só deixam o passageiro devolver uma vaga se, na mesma operação, a reserva dele passar de confirmada para cancelada. Quando a carona lota, os pedidos pendentes são recusados com o motivo "lotada" (RF-15).
- **Busca sem índice composto:** cada carona grava `validaAte` (a data da viagem única, ou uma data distante para as recorrentes) e o `trajeto` normalizado. A busca consulta `validaAte >= agora` e aplica os filtros de trajeto, parada e data no app, por regras programadas (RNF-06).
- **Avaliações:** a média e o total de notas são calculados a partir das notas recebidas (`avaliacoes` onde `avaliadoId` é a pessoa), em vez de gravar a média no perfil de outra pessoa. A agregação `average()` no servidor foi testada, mas exige um índice composto no banco real; com poucas notas por pessoa, calcular no app evita esse índice. O total de caronas oferecidas usa `count()` no servidor.
- **Avisos no app:** em vez de notificação push, a aba Viagens mostra em tempo real (`onSnapshot`) o número de pedidos aguardando o motorista, e o passageiro vê a situação do pedido na reserva.
- **Testes:** as regras são testadas no emulador do Firestore (`npm run test:regras`, 26 casos).

### Alternativas consideradas

#### Cloud Functions para manter o contador de vagas e as médias

A favor: consistência garantida no servidor sem depender do app.
Contra: exige o plano Blaze e deploy de funções.
Por que não: transações com regras que conferem o antes e o depois (`get`/`getAfter`) garantem a mesma consistência no plano gratuito.

#### Notificações push (Expo Notifications + FCM)

A favor: o motorista é avisado mesmo com o app fechado.
Contra: o push remoto não funciona no Expo Go (exige development build), e o envio exige um servidor ou função.
Por que não: o aviso dentro do app atende o fluxo da v1, e o push está no Não-escopo do PRD.

### Consequências

Positivas: as regras de negócio críticas valem no servidor, mesmo com o app contornado; nenhum índice composto precisa ser criado no console.

Negativas assumidas: a busca lê todas as caronas válidas e filtra no app, o que é adequado ao volume previsto (~40 caronas por dia), mas precisaria de índices e filtros no servidor se o volume crescer muito; a reserva numa viagem recorrente vale para todas as semanas, sem controle de vagas por data.

Difícil de mudar depois: o formato dos ids das reservas e avaliações está nas regras e no app; mudá-lo exige migrar os documentos existentes.
