# Decisões de arquitetura — Carona Campus

## Análise comparativa de modelagem de dados no Firestore

Entidade central: **caronas** e a gestão de suas **vagas/solicitações**, considerando ~400 usuários, ~40 caronas/dia, ~1.200 registros no histórico, as 3 consultas principais do app (busca por compatibilidade, histórico por usuário, verificação de status) e a regra de segurança de e-mail institucional (aplicada no nível do Firebase Authentication, igual nas três alternativas — a diferença entre elas está em quão simples fica escrever as *regras de leitura/escrita* sobre os dados).

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
- **Situação:** Aceita
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
- **Situação:** Aceita
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
