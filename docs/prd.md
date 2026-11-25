# PRD — Carona Campus

## 1. Problema

Quem viaja com frequência entre cidades — para estudar, trabalhar ou visitar a família — costuma combinar caronas em grupos de mensagens. O fluxo intenso de conversas faz com que ofertas e pedidos se percam em poucos minutos, impede a busca por um trajeto específico e não deixa nenhum registro de quem viajou com quem. Apps de carona existentes resolvem parte disso, mas exigem formulários longos para publicar, obrigam o motorista a republicar a mesma viagem toda semana e só mostram viagens com exatamente a origem e o destino buscados, ignorando quem passa pela cidade do passageiro no meio do caminho.

## 2. Público

Pessoas que fazem viagens intermunicipais com regularidade — estudantes, trabalhadores e quem visita a família nos fins de semana — e motoristas que já fazem esses trajetos e querem dividir o custo com passageiros. O app não é limitado a uma instituição de ensino.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
|---|---|---|
| RF-01 | Usuário se cadastra com e-mail verificado. | Sistema envia um link de confirmação e só libera o uso do app depois que o e-mail é verificado. Na versão web, o usuário também pode entrar com a conta Google. |
| RF-02 | Usuário faz login. | Sistema mantém a sessão ativa entre aberturas do app, sem exigir novo login. |
| RF-03 | Usuário cadastra foto de perfil. | Sistema salva a foto e a exibe no perfil do usuário. |
| RF-04 | Motorista descreve a viagem em texto livre, como numa mensagem de WhatsApp. | Sistema extrai origem, destino, paradas, data, horário, vagas, valor por vaga e observações do texto e exibe para confirmação antes de salvar. |
| RF-05 | Motorista cadastra uma viagem recorrente (ex.: toda sexta às 18h). | Sistema salva os dias da semana da viagem e a exibe nas buscas de todas as semanas, sem o motorista precisar publicá-la de novo. |
| RF-06 | Passageiro busca carona informando origem, destino e data. | Sistema exibe as viagens compatíveis, incluindo as que passam pela origem e pelo destino buscados como paradas intermediárias, na ordem do trajeto. |
| RF-07 | Passageiro solicita uma vaga em uma viagem. | Sistema registra a solicitação e avisa o motorista dentro do app (contador de pedidos pendentes na aba Viagens). |
| RF-08 | Motorista confirma ou recusa uma solicitação de vaga. | Sistema reserva a vaga, atualiza a disponibilidade e mostra ao passageiro a situação do pedido na reserva. |
| RF-09 | Usuário consulta suas viagens como motorista e suas reservas como passageiro. | Sistema exibe a lista de viagens e reservas ordenada por data. |
| RF-10 | Motorista e passageiro se avaliam após a viagem. | Sistema registra a nota de cada um e atualiza a média de avaliações do avaliado. |
| RF-11 | Usuário visualiza foto de perfil e avaliações do motorista antes de solicitar uma vaga. | Sistema exibe essas informações na tela de detalhes da viagem. |
| RF-12 | Usuário cancela uma vaga já confirmada. | Sistema libera a vaga para outros interessados, e o cancelamento aparece para o motorista nos pedidos da carona. |
| RF-13 | Usuário consulta o valor por vaga de uma viagem. | Sistema exibe o valor apenas como informação e avisa que o pagamento é combinado diretamente com o motorista, sem transação dentro do app. |
| RF-14 | Usuário tenta realizar uma ação sem conexão de rede. | Sistema exibe aviso de falta de conexão e impede o envio até a conexão ser restabelecida. |
| RF-15 | Dois usuários solicitam a mesma vaga ao mesmo tempo. | Sistema confirma apenas a primeira solicitação aceita pelo motorista e informa às demais que a vaga não está mais disponível. |
| RF-16 | A extração de dados pela IA falha ou responde fora do formato esperado. | Sistema mantém todos os campos da viagem disponíveis para preenchimento manual pelo motorista. |
| RF-17 | Passageiro descreve em texto livre a carona de que precisa (ex.: "preciso ir pra Cascavel sexta à noite, saindo do Posto Fênix em Quedas do Iguaçu"). | Sistema extrai origem, destino, data, horário aproximado e ponto de embarque, preenche a busca e mostra as caronas que saem até 1h30 antes ou depois do horário pedido, com as que saem do ponto de embarque pedido em primeiro lugar. Se o pedido não citar cidades, o sistema avisa e pede as cidades nos campos. |
| RF-18 | Motorista informa o ponto de embarque dentro da cidade de origem (ex.: "Posto Fênix", "rodoviária"). | Sistema salva o ponto (opcional, digitado ou extraído pela IA) e o exibe na lista de caronas e nos detalhes da viagem. |
| RF-19 | Usuário escreve um texto que ficará visível para todos (observações da carona ou "Sobre você" no perfil). | Antes de gravar, o sistema confere o texto com a IA e avisa se ele tem dados de contato (telefone, e-mail, rede social, link), documentos ou chave Pix, ou linguagem ofensiva ou discriminatória. A pessoa pode corrigir ou seguir mesmo assim. Se a IA falhar, a conferência é feita por regras (contatos, documentos e links). |

## 4. Requisitos não funcionais

| RNF | Requisito | Como verificar |
|---|---|---|
| RNF-01 | O app deve exibir os resultados de uma busca de carona em até 3 segundos após o envio da consulta, em conexão 4G. | Colega cronometra pelo celular o tempo entre tocar em "buscar" e a lista de resultados aparecer, em rede 4G. |
| RNF-02 | O servidor deve rejeitar qualquer leitura ou escrita de usuários com e-mail não verificado, mesmo que a validação do app seja contornada. | Colega tenta acessar os dados via requisição direta ao backend (fora do app) com uma conta de e-mail não verificado e confirma que o servidor recusa a solicitação. |
| RNF-03 | Um usuário sem instrução prévia deve conseguir publicar uma viagem em no máximo 3 toques a partir da tela inicial. | Colega, sem explicação prévia, tenta publicar uma viagem no celular enquanto outra pessoa conta os toques até a publicação. |
| RNF-04 | O app deve permitir consultar as viagens e reservas já carregadas mesmo sem conexão à internet. | Colega ativa o modo avião no celular e confere se as viagens e reservas continuam acessíveis. |
| RNF-05 | Quando duas solicitações concorrentes disputarem a mesma vaga, o sistema deve confirmar apenas uma e informar às demais que a vaga não está mais disponível. | Colega usa dois celulares para solicitar a mesma vaga ao mesmo tempo e confirma que só um recebe a confirmação. |
| RNF-06 | A busca e a compatibilidade entre viagens devem funcionar mesmo com a API da IA fora do ar. | Colega desativa a chave da API da IA e confere que a busca continua retornando os mesmos resultados. |

## 5. Onde a IA entra no produto

A Inteligência Artificial (LLM via Gemini) **interpreta texto livre** nos dois lados da carona:

- **Motorista (publicação):** organiza a mensagem do motorista nos campos da viagem (origem, destino, paradas, ponto de embarque, data, horário, vagas, valor por vaga e dias de recorrência). O motorista escreve como se estivesse mandando uma mensagem no WhatsApp — por exemplo, "saio do Posto Fênix em Pato Branco toda sexta às 18h pra Curitiba, passo por Guarapuava e Ponta Grossa, 3 vagas, R$ 90" — e confirma os dados antes de publicar.
- **Revisão de textos públicos:** antes de publicar as observações da carona ou de salvar o "Sobre você" do perfil, confere se o texto expõe contatos ou documentos ou tem linguagem ofensiva, e avisa a pessoa (RF-19).
- **Passageiro (busca):** transforma o pedido do passageiro ("preciso ir pra Cascavel sexta à noite, saindo do Posto Fênix em Quedas do Iguaçu") em origem, destino, data, horário aproximado e ponto de embarque, e já abre os resultados.

A **compatibilidade** entre viagens continua **sem** IA: depois que a IA preenche os campos, a busca aplica regras programadas (a viagem serve se passa pela cidade de origem e depois pela de destino, na data escolhida e perto do horário pedido). Isso deixa o resultado rápido, previsível e independente da disponibilidade da API (RNF-06).

### Impacto de remoção: o que o produto perde sem a IA

Sem a IA, a publicação volta a ser um formulário com vários campos (origem, destino, cada parada, data, horário, vagas, valor e dias da semana), que é justamente o atrito que faz os motoristas preferirem jogar a viagem num grupo de mensagens. Do lado do passageiro, a busca volta a exigir que ele traduza o que precisa ("sexta à noite, saindo do posto") em campos e chips de data. O app continua funcionando — o preenchimento manual existe como alternativa (RF-16) —, mas perde o principal diferencial de publicação: transformar a mensagem que o motorista já escreveria no WhatsApp em uma viagem pesquisável.

## 6. Funcionalidade de IA

**O que faz:** interpreta texto livre e organiza as informações nos campos da publicação (motorista) ou da busca (passageiro), e revisa os textos que ficarão públicos (RF-19).

**Entrada:** o texto digitado pelo motorista ao publicar (ex.: "saio do Posto Fênix em Pato Branco sexta 18h pra Curitiba, passo por Guarapuava, 3 vagas, R$ 90") ou pelo passageiro ao buscar (ex.: "preciso ir pra Cascavel sexta à noite, saindo do Posto Fênix em Quedas do Iguaçu").

**Saída:**
- **Publicação:** origem, destino, paradas intermediárias, ponto de embarque, data, horário, quantidade de vagas, valor por vaga, dias da semana (quando a viagem é recorrente) e observações para o passageiro. O motorista confirma os dados (ou corrige) antes de a viagem ser salva no banco.
- **Busca:** origem, destino, data, horário aproximado e ponto de embarque, que preenchem a busca e abrem os resultados. O passageiro pode ajustar tudo pelos campos.
- **Revisão:** uma lista de avisos curtos (vazia quando o texto está adequado). O app só avisa: a pessoa decide se corrige o texto ou segue mesmo assim.

Lugares dentro de uma cidade (universidade, posto, rodoviária) nunca são tratados como cidade: viram ponto de embarque ou são ignorados.

**Como é implementada:** Gemini (`gemini-3.5-flash-lite`) chamado pelo Firebase AI Logic, que guarda a chave da API no Firebase. A resposta é pedida em JSON com formato fixo (saída estruturada) e cada campo é validado pelo app antes de preencher o formulário (ADR-0007).

**Quando a API falha:** se o Gemini estiver fora do ar, demorar mais de 15 segundos ou responder fora do formato esperado, o app avisa o motorista e usa uma extração por regras (reconhece as cidades do catálogo e padrões como "pra Curitiba", "passo por Guarapuava", "18h", "3 vagas", "R$ 90"). Se nem ela reconhecer nada, libera todos os campos para preenchimento manual. A publicação nunca é bloqueada. Na revisão de textos, a IA espera até 8 segundos; se falhar, padrões programados apontam telefone, e-mail, CPF, chave Pix e links (a linguagem ofensiva só é detectada pela IA).

**Dados enviados à LLM:** apenas o texto livre digitado pelo motorista ou pelo passageiro (ou o texto a ser revisado) (sem e-mail, foto, localização ou qualquer outro dado de identificação do usuário).

## 7. Escopo da v1

- Cadastro e login com e-mail verificado (Firebase Auth), login com Google na versão web e foto de perfil.
- Publicação de viagem via texto livre, com a IA organizando os dados e opção de preenchimento manual.
- Viagens recorrentes (dias da semana), sem republicar a cada semana.
- Busca por origem, destino e data, incluindo viagens que passam pelo trajeto do passageiro (paradas intermediárias), também em texto livre com a IA (RF-17).
- Ponto de embarque dentro da cidade de origem, informado pelo motorista (RF-18).
- Revisão com IA dos textos que ficam públicos (observações da carona e "Sobre você"), com aviso antes de gravar (RF-19).
- Solicitação de vaga pelo passageiro e confirmação ou recusa pelo motorista, com aviso de pedidos pendentes dentro do app.
- Valor por vaga exibido apenas como informação; pagamento combinado diretamente entre motorista e passageiro.
- Minhas viagens (como motorista) e minhas reservas (como passageiro).
- Avaliação mútua pós-viagem (nota simples) e perfil com avaliações.

Telas previstas: login e cadastro; início e busca de caronas; resultados da busca; detalhes da viagem; publicação de caronas; minhas viagens e reservas; perfil e avaliações.

## 8. Não-escopo

| Não faremos | Por quê |
|---|---|
| Pagamento pelo app | O valor por vaga é só informativo; intermediar pagamentos exige integração financeira e responsabilidade legal fora do alcance do projeto. |
| Chat interno entre motorista e passageiro | Duplica o WhatsApp, que as pessoas já usam para combinar os detalhes da viagem. |
| Caronas dentro da mesma cidade (ex.: "do Posto Fênix até a UTFPR") | Comparar lugares dentro da cidade exige mapa com coordenadas e busca por proximidade (Google Maps/Places, que exige plano pago, ou OpenStreetMap), além de mudar o banco e as regras. Fica como trabalho futuro; na v1 o motorista informa o ponto de embarque (RF-18) e a busca prioriza esse ponto. |
| Rastreamento da viagem em tempo real | Exige localização contínua em segundo plano e infraestrutura extra, sem relação com o problema de encontrar e publicar caronas. |
| Cálculo de rota otimizada/rateio automático de combustível | O motorista define o valor por vaga; calcular rotas e custos consome tempo desproporcional ao prazo. |
| Comentários/reviews em texto além da nota | Uma nota rápida é suficiente para construir confiança nesta fase. |
| Notificações push (ex.: novo pedido, alertas de proximidade) | Exige um build nativo do app e um servidor para o envio; na v1 os avisos aparecem dentro do app (contador de pedidos pendentes e situação da reserva). |
| Outros usos da IA (sugestão de valor por vaga, alternativas quando a busca não encontra caronas, texto do perfil gerado pela IA) | Ficam como trabalho futuro. A sugestão de valor depende de distâncias que o modelo pode errar, e as alternativas de busca exigiriam enviar as caronas cadastradas ao modelo; nenhuma das duas ficaria estável até a entrega. |
| Verificação de identidade além de e-mail e foto (ex: CNH, selfie com documento) | E-mail verificado, foto de perfil e avaliações bastam nesta fase; a verificação por telefone poderá ser considerada depois. |

## 9. Decisões tomadas

| Decisão | Resultado |
|---|---|
| Nome do app | Decidido: o grupo manteve "Carona Campus". |
| Valor por vaga | Decidido: o valor é apenas informativo, sem pagamento pelo app (RF-13), como nos apps de transporte da região. |
| Login com Google | Decidido: disponível na versão web; no celular (Expo Go) o login é por e-mail e senha (ADR-0006). |
| Foto de perfil | Decidido: foto reduzida gravada no próprio perfil, sem o Firebase Storage, que exige plano pago (ADR-0008). |
