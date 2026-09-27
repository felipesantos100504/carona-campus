# PRD — Carona Campus

## 1. Problema

Membros da comunidade acadêmica (estudantes, professores e servidores) dependem de grupos informais de mensagens para organizar caronas entre o campus, a cidade e municípios vizinhos. O fluxo intenso de conversas faz com que ofertas e pedidos se percam em poucos minutos, impedindo a busca por rotas específicas e deixando o processo sem nenhum registro de quem viajou com quem.

Validação com pessoas da comunidade indicou que o maior gargalo é a poluição visual dos chats, não a falta de pessoas dispostas a compartilhar viagens.

## 2. Público

Comunidade acadêmica do campus — estudantes, professores e servidores — que se deslocam regularmente entre a cidade e o campus, ou em viagens de fim de semana para municípios vizinhos, e hoje coordenam essas viagens por grupos de mensagens informais.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
|---|---|---|
| RF-01 | Usuário se cadastra com e-mail institucional. | Sistema valida o domínio do e-mail e só cria a conta se ele for institucional. |
| RF-02 | Usuário faz login. | Sistema mantém a sessão ativa entre aberturas do app, sem exigir novo login. |
| RF-03 | Usuário cadastra foto de perfil. | Sistema salva a foto e a exibe no perfil do usuário. |
| RF-04 | Usuário descreve uma oferta de carona em texto livre. | Sistema extrai origem, destino e horário do texto e exibe para confirmação antes de salvar. |
| RF-05 | Usuário descreve um pedido de carona em texto livre. | Sistema extrai origem, destino e horário do texto e exibe para confirmação antes de salvar. |
| RF-06 | Usuário busca carona por rota e horário. | Sistema exibe as ofertas ou pedidos compatíveis encontrados. |
| RF-07 | Usuário solicita uma vaga em uma carona ofertada. | Sistema registra a solicitação e notifica o motorista. |
| RF-08 | Motorista confirma uma solicitação de vaga. | Sistema reserva a vaga, atualiza a disponibilidade e notifica o passageiro. |
| RF-09 | Usuário consulta seu histórico de caronas dadas e recebidas. | Sistema exibe a lista de caronas ordenada por data. |
| RF-10 | Usuário avalia motorista ou passageiro após o trajeto. | Sistema registra a nota e atualiza o histórico de avaliações do avaliado. |
| RF-11 | Usuário visualiza foto de perfil e histórico de avaliações de outro usuário antes de confirmar uma carona. | Sistema exibe essas informações na tela de detalhes da carona. |
| RF-12 | Usuário cancela uma vaga já confirmada. | Sistema libera a vaga para outros interessados e notifica a outra parte do cancelamento. |
| RF-13 | Usuário nega a permissão de geolocalização. | Sistema permite continuar usando o app, exigindo a digitação manual do local em vez de sugestão automática. |
| RF-14 | Usuário tenta realizar uma ação sem conexão de rede. | Sistema exibe aviso de falta de conexão e impede o envio até a conexão ser restabelecida. |
| RF-15 | Dois usuários solicitam a mesma vaga ao mesmo tempo. | Sistema confirma apenas a primeira solicitação aceita pelo motorista e informa às demais que a vaga não está mais disponível. |
| RF-16 | A extração de dados pela IA falha ou responde fora do formato esperado. | Sistema mantém os campos de origem, destino e horário disponíveis para preenchimento manual pelo usuário. |

## 4. Requisitos não funcionais

| RNF | Requisito | Como verificar |
|---|---|---|
| RNF-01 | O app deve exibir os resultados de uma busca de carona em até 3 segundos após o envio da consulta, em conexão 4G. | Colega cronometra pelo celular o tempo entre tocar em "buscar" e a lista de resultados aparecer, em rede 4G. |
| RNF-02 | O servidor deve rejeitar qualquer tentativa de cadastro ou login com e-mail fora do domínio institucional, mesmo que a validação do app seja contornada. | Colega tenta autenticar via requisição direta ao backend (fora do app) com um e-mail não institucional e confirma que o servidor recusa a solicitação. |
| RNF-03 | Um usuário sem instrução prévia deve conseguir publicar uma oferta de carona em no máximo 3 toques a partir da tela inicial. | Colega, sem explicação prévia, tenta publicar uma oferta no celular enquanto outra pessoa conta os toques até a publicação. |
| RNF-04 | O app deve permitir consultar o histórico de caronas já carregado mesmo sem conexão à internet. | Colega ativa o modo avião no celular e confere se o histórico de caronas continua acessível. |
| RNF-05 | Quando duas solicitações concorrentes disputarem a mesma vaga, o sistema deve confirmar apenas uma e informar às demais que a vaga não está mais disponível. | Colega usa dois celulares para solicitar a mesma vaga ao mesmo tempo e confirma que só um recebe a confirmação. |

## 5. Onde a IA entra no produto

A Inteligência Artificial (LLM via Gemini) atua como a engrenagem central do Carona Campus, sendo responsável pelo processamento e cruzamento (matching) proativo de ofertas e solicitações de carona descritas em linguagem natural. Em vez de obrigar o usuário a preencher cadastros burocráticos, a LLM interpreta o texto livre e traduz a intenção do usuário a partir de dois pilares técnicos fundamentais:

- **Normalização de locais ambíguos:** os usuários costumam descrever trajetos usando pontos de referência informais (ex: "saio do centro perto do supermercado X", "passo em frente ao bloco de Engenharia"). A LLM interpreta essas ambiguidades contextuais e mapeia rotas e proximidades geográficas equivalentes, algo inviável via comparação rígida de banco de dados ou coordenadas exatas.
- **Interpretação de horários flexíveis:** expressões subjetivas do cotidiano acadêmico (ex: "por volta das sete", "na saída da aula das 18h", "de manhã cedo") são convertidas automaticamente pela LLM em janelas temporais de tolerância realistas (ex: 6h50 às 7h10). Isso expande a margem de compatibilidade sem exigir a precisão ao minuto que inviabilizaria o pareamento.

### Impacto de remoção: por que o produto falha sem a IA

Se a camada de IA for removida, o Carona Campus perde seu principal pilar de proposta de valor e sua inviabilidade operacional se manifesta imediatamente em duas frentes:

1. **Adesão e usabilidade:** a remoção da LLM exigiria a implementação de formulários estruturados com múltiplos campos engessados (origem exata, destino exato, horário fixo, tolerância). A pesquisa de validação com a comunidade acadêmica demonstrou que formulários tradicionais são amplamente rejeitados pelos usuários, que preferem a fluidez da digitação livre.
2. **Efetividade do pareamento:** sem a interpretação contextual, buscas convencionais por SQL/Firestore exigirão correspondências exatas. Um motorista que escreve "saio do centro às 7h" não seria pareado com um passageiro que pede "carona perto da praça central por volta das sete", resultando em falsos negativos contínuos, queda drástica na taxa de matches e o inevitável abandono da plataforma em retorno aos grupos informais de mensagens.

## 6. Funcionalidade de IA

**O que faz:** interpreta a descrição em texto livre de uma oferta ou pedido de carona, normalizando local e horário, e sugere pares compatíveis entre motoristas e passageiros.

**Entrada:** o texto livre digitado pelo usuário ao oferecer ou buscar uma carona (ex: "saio do centro perto do supermercado X por volta das sete").

**Saída:** origem, destino e janela de horário estruturados a partir do texto, mais a lista de caronas/pedidos compatíveis encontrados; o usuário confirma os dados extraídos (ou corrige manualmente) antes de a oferta/pedido ser salvo no banco.

**Quando a API falha:** o app exibe uma mensagem de erro e mantém o formulário com os campos extraíveis manualmente (origem, destino, horário) em branco para preenchimento direto pelo usuário, sem bloquear a publicação da oferta ou pedido.

**Dados enviados à LLM:** apenas o texto livre digitado pelo usuário na oferta/busca (sem e-mail, foto, localização em tempo real ou qualquer outro dado de identificação do usuário).

## 7. Escopo da v1

- Login com e-mail institucional (Firebase Auth) + cadastro com foto de perfil.
- Oferta de carona via texto livre, com a LLM extraindo origem, destino e horário.
- Busca de carona por rota/horário, com pares compatíveis sugeridos pela LLM.
- Solicitação e confirmação de vaga (fluxo básico motorista/passageiro).
- Histórico de caronas dadas e recebidas.
- Avaliação rápida pós-trajeto (nota simples, sem comentário extenso).

## 8. Não-escopo

| Não faremos | Por quê |
|---|---|
| Chat interno entre motorista e passageiro | Duplica o WhatsApp que já será usado em paralelo durante a migração gradual. |
| Cálculo de rota otimizada/rateio automático de combustível | Não é o gargalo relatado (poluição visual dos chats) e consome tempo desproporcional em nove semanas. |
| Comentários/reviews em texto além da nota | A pesquisa indicou preferência por pontuação rápida, não comentários extensos. |
| Notificações push sofisticadas (ex: alertas de proximidade) | Exige infraestrutura extra não essencial para validar a oferta/busca de carona. |
| Painel de estatísticas pessoais (ex: CO2 economizado, gráficos de uso) | Não resolve a dor central e disputa tempo com o CRUD essencial. |
| Verificação de identidade além do e-mail institucional (ex: CNH, selfie com documento) | Os entrevistados indicaram que foto de perfil + histórico de avaliação bastam nesta fase. |
