# PRD — Carona Campus

> **Nome provisório.** Como a proposta passou a ser de caronas entre cidades, aberta a qualquer pessoa, o nome "Carona Campus" será substituído (ver seção 9).

## 1. Problema

Quem viaja com frequência entre cidades — para estudar, trabalhar ou visitar a família — costuma combinar caronas em grupos de mensagens. O fluxo intenso de conversas faz com que ofertas e pedidos se percam em poucos minutos, impede a busca por um trajeto específico e não deixa nenhum registro de quem viajou com quem. Apps de carona existentes resolvem parte disso, mas exigem formulários longos para publicar, obrigam o motorista a republicar a mesma viagem toda semana e só mostram viagens com exatamente a origem e o destino buscados, ignorando quem passa pela cidade do passageiro no meio do caminho.

## 2. Público

Pessoas que fazem viagens intermunicipais com regularidade — estudantes, trabalhadores e quem visita a família nos fins de semana — e motoristas que já fazem esses trajetos e querem dividir o custo com passageiros. O app não é limitado a uma instituição de ensino.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
|---|---|---|
| RF-01 | Usuário se cadastra com e-mail verificado. | Sistema envia um link de confirmação e só libera o uso do app depois que o e-mail é verificado. |
| RF-02 | Usuário faz login. | Sistema mantém a sessão ativa entre aberturas do app, sem exigir novo login. |
| RF-03 | Usuário cadastra foto de perfil. | Sistema salva a foto e a exibe no perfil do usuário. |
| RF-04 | Motorista descreve a viagem em texto livre, como numa mensagem de WhatsApp. | Sistema extrai origem, destino, paradas, data, horário, vagas e valor por vaga do texto e exibe para confirmação antes de salvar. |
| RF-05 | Motorista cadastra uma viagem recorrente (ex.: toda sexta às 18h). | Sistema salva os dias da semana da viagem e a exibe nas buscas de todas as semanas, sem o motorista precisar publicá-la de novo. |
| RF-06 | Passageiro busca carona informando origem, destino e data. | Sistema exibe as viagens compatíveis, incluindo as que passam pela origem e pelo destino buscados como paradas intermediárias, na ordem do trajeto. |
| RF-07 | Passageiro solicita uma vaga em uma viagem. | Sistema registra a solicitação e notifica o motorista. |
| RF-08 | Motorista confirma uma solicitação de vaga. | Sistema reserva a vaga, atualiza a disponibilidade e notifica o passageiro. |
| RF-09 | Usuário consulta suas viagens como motorista e suas reservas como passageiro. | Sistema exibe a lista de viagens e reservas ordenada por data. |
| RF-10 | Motorista e passageiro se avaliam após a viagem. | Sistema registra a nota de cada um e atualiza a média de avaliações do avaliado. |
| RF-11 | Usuário visualiza foto de perfil e avaliações do motorista antes de solicitar uma vaga. | Sistema exibe essas informações na tela de detalhes da viagem. |
| RF-12 | Usuário cancela uma vaga já confirmada. | Sistema libera a vaga para outros interessados e notifica a outra parte do cancelamento. |
| RF-13 | Usuário consulta o valor por vaga de uma viagem. | Sistema exibe o valor apenas como informação e avisa que o pagamento é combinado diretamente com o motorista, sem transação dentro do app. |
| RF-14 | Usuário tenta realizar uma ação sem conexão de rede. | Sistema exibe aviso de falta de conexão e impede o envio até a conexão ser restabelecida. |
| RF-15 | Dois usuários solicitam a mesma vaga ao mesmo tempo. | Sistema confirma apenas a primeira solicitação aceita pelo motorista e informa às demais que a vaga não está mais disponível. |
| RF-16 | A extração de dados pela IA falha ou responde fora do formato esperado. | Sistema mantém todos os campos da viagem disponíveis para preenchimento manual pelo motorista. |

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

A Inteligência Artificial (LLM via Gemini) é usada em um único ponto: **interpretar o texto livre que o motorista escreve ao publicar uma viagem** e organizá-lo nos campos estruturados da viagem (origem, destino, paradas, data, horário, vagas, valor por vaga e dias de recorrência). O motorista escreve como se estivesse mandando uma mensagem no WhatsApp — por exemplo, "saio de Pato Branco toda sexta às 18h pra Curitiba, passo por Guarapuava e Ponta Grossa, 3 vagas, R$ 90" — e confirma os dados organizados pela IA antes de publicar.

A busca e a compatibilidade entre viagens **não** usam IA: são feitas por regras programadas no sistema (a viagem serve se passa pela cidade de origem e depois pela cidade de destino buscadas, na data escolhida). Isso deixa a busca mais rápida, previsível e independente da disponibilidade da API.

### Impacto de remoção: o que o produto perde sem a IA

Sem a IA, a publicação volta a ser um formulário com vários campos (origem, destino, cada parada, data, horário, vagas, valor e dias da semana), que é justamente o atrito que faz os motoristas preferirem jogar a viagem num grupo de mensagens. O app continua funcionando — o preenchimento manual existe como alternativa (RF-16) —, mas perde o principal diferencial de publicação: transformar a mensagem que o motorista já escreveria no WhatsApp em uma viagem pesquisável.

## 6. Funcionalidade de IA

**O que faz:** interpreta a descrição em texto livre de uma viagem e organiza as informações nos campos da publicação.

**Entrada:** o texto livre digitado pelo motorista ao publicar uma viagem (ex.: "saio de Pato Branco sexta 18h pra Curitiba, passo por Guarapuava, 3 vagas, R$ 90").

**Saída:** origem, destino, paradas intermediárias, data, horário, quantidade de vagas, valor por vaga e dias da semana (quando a viagem é recorrente); o motorista confirma os dados extraídos (ou corrige manualmente) antes de a viagem ser salva no banco.

**Quando a API falha:** o app exibe uma mensagem de erro e libera todos os campos da viagem para preenchimento manual, sem bloquear a publicação.

**Dados enviados à LLM:** apenas o texto livre digitado pelo motorista (sem e-mail, foto, localização ou qualquer outro dado de identificação do usuário).

## 7. Escopo da v1

- Cadastro e login com e-mail verificado (Firebase Auth) + foto de perfil.
- Publicação de viagem via texto livre, com a IA organizando os dados e opção de preenchimento manual.
- Viagens recorrentes (dias da semana), sem republicar a cada semana.
- Busca por origem, destino e data, incluindo viagens que passam pelo trajeto do passageiro (paradas intermediárias).
- Solicitação de vaga pelo passageiro e confirmação pelo motorista.
- Valor por vaga exibido apenas como informação; pagamento combinado diretamente entre motorista e passageiro.
- Minhas viagens (como motorista) e minhas reservas (como passageiro).
- Avaliação mútua pós-viagem (nota simples) e perfil com avaliações.

Telas previstas: login e cadastro; início e busca de caronas; resultados da busca; detalhes da viagem; publicação de caronas; minhas viagens e reservas; perfil e avaliações.

## 8. Não-escopo

| Não faremos | Por quê |
|---|---|
| Pagamento pelo app | O valor por vaga é só informativo; intermediar pagamentos exige integração financeira e responsabilidade legal fora do alcance do projeto. |
| Chat interno entre motorista e passageiro | Duplica o WhatsApp, que as pessoas já usam para combinar os detalhes da viagem. |
| Rastreamento da viagem em tempo real | Exige localização contínua em segundo plano e infraestrutura extra, sem relação com o problema de encontrar e publicar caronas. |
| Cálculo de rota otimizada/rateio automático de combustível | O motorista define o valor por vaga; calcular rotas e custos consome tempo desproporcional ao prazo. |
| Comentários/reviews em texto além da nota | Uma nota rápida é suficiente para construir confiança nesta fase. |
| Notificações push sofisticadas (ex: alertas de proximidade) | Exige infraestrutura extra não essencial para validar a publicação e a busca de caronas. |
| Verificação de identidade além de e-mail e foto (ex: CNH, selfie com documento) | E-mail verificado, foto de perfil e avaliações bastam nesta fase; a verificação por telefone poderá ser considerada depois. |

## 9. Decisões em aberto

| Decisão | Proposta atual |
|---|---|
| Nome do app | "Carona Campus" não representa mais a proposta de caronas entre cidades; o grupo precisa escolher um novo nome. |
| Valor por vaga | Exibir o valor apenas como informação, sem pagamento pelo app (RF-13), a confirmar com o grupo. |
