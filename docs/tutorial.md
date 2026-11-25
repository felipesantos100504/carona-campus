# Tutorial de uso — Carona Campus

Este tutorial mostra como usar o app do primeiro acesso até a avaliação depois da viagem. Para instalar e rodar o projeto, veja o [README](../README.md#como-rodar).

## 1. Criar a conta e entrar

1. Na tela inicial, toque em **Criar conta**.
2. Toque no círculo da foto para escolher uma imagem da galeria (opcional). Se o app pedir permissão de acesso às fotos, permita.
3. Preencha nome, cidade, e-mail e senha (mínimo de 6 caracteres) e toque em **Criar conta**.
4. O app abre a tela **Confirme seu e-mail**. Abra a mensagem enviada pelo Firebase (confira também o spam), toque no link e volte ao app.
5. Toque em **Já confirmei**. O app libera as abas e cria o seu perfil público.

Nas próximas vezes, entre pela aba **Entrar** com e-mail e senha. A sessão fica salva: o app abre direto nas abas até você sair.

- **Esqueci minha senha:** digite o e-mail e toque em "Esqueci minha senha" para receber um link de nova senha.
- **Entrar com Google:** disponível na versão web (navegador).
- **Contas de demonstração:** depois que os dados de exemplo forem cadastrados (`npm run popular`), dá para testar sem criar conta usando os e-mails de [`scripts/dados-exemplo.mjs`](../scripts/dados-exemplo.mjs), com a senha indicada no mesmo arquivo.

## 2. Buscar uma carona (passageiro)

**Do jeito mais rápido, com IA:** na aba **Buscar**, escreva no quadro "Diga para onde você precisa ir" o que você precisa, por exemplo:
> preciso ir pra Cascavel sexta à noite, saindo do Posto Fênix em Quedas do Iguaçu

ou, dentro da cidade:
> preciso ir do Mercado Ítalo até a UTFPR amanhã às 18h30

Toque em **Buscar com IA**. O app entende as cidades, o dia, o horário aproximado e os lugares de saída e de chegada e já mostra as caronas que saem até 1h30 antes ou depois desse horário, com as que passam pelos seus lugares em primeiro lugar. Lugares conhecidos (UTFPR, Posto Fênix, Mercado Ítalo, Posto Stop) já indicam a cidade: "do Mercado Ítalo até a UTFPR" busca dentro de Dois Vizinhos.

**Ou pelos campos:**

1. Na aba **Buscar**, informe a cidade de saída e a de destino. As sugestões de cidades aparecem enquanto você digita. Para andar dentro da cidade, use a mesma cidade nos dois campos.
   Em **Lugares dentro da cidade**, informe onde quer embarcar e onde quer descer (ex.: "Posto Fênix" e "UTFPR"). Os lugares conhecidos da cidade aparecem como sugestão. Se o seu lugar não estiver em nenhuma carona (ex.: o endereço da sua casa), escolha o lugar conhecido mais perto.
2. Escolha a data (**Qualquer dia**, **Hoje** ou **Amanhã**) e toque em **Buscar caronas**.
3. A lista mostra também as viagens que **passam** pelas suas cidades. Exemplo: buscando "Guarapuava → Curitiba", aparece a viagem "Pato Branco → Curitiba" que passa por Guarapuava.
4. Viagens com o selo **Toda semana** se repetem nos dias indicados.

## 3. Pedir uma vaga

1. Toque em uma carona para abrir os **detalhes**: trajeto com as paradas, horário, valor por vaga, vagas livres, foto e avaliações do motorista.
2. Toque em **Solicitar vaga**. O pedido fica como **Aguardando motorista**.
3. Acompanhe na aba **Viagens → Como passageiro**:
   - **Vaga confirmada:** o motorista aceitou.
   - **Não aceita:** o motorista recusou.
   - **Vaga esgotada:** a carona lotou antes de o seu pedido ser aceito.
4. Para desistir, abra a carona e toque em **Cancelar pedido** (ou **Cancelar minha vaga**, se já estava confirmada). A vaga volta a ficar disponível.

O valor por vaga é apenas informativo: o pagamento é combinado diretamente com o motorista.

## 4. Publicar uma carona com IA (motorista)

1. Na aba **Publicar**, escreva a viagem como numa mensagem de WhatsApp. Exemplo:
   > saio de Pato Branco toda sexta às 18h pra Curitiba, passo por Guarapuava e Ponta Grossa, 3 vagas, R$ 90
2. Toque em **Interpretar com IA**. O Gemini organiza origem, destino, paradas, data, horário, vagas, valor e os dias da semana (se a viagem se repete).
3. Confira os campos e corrija o que precisar. Dá para remover ou adicionar paradas, informar o **ponto de embarque** (ex.: "Posto Fênix", "rodoviária"), adicionar **Pontos de passagem** na ordem do caminho (ex.: Mercado Ítalo → Posto Stop → UTFPR; os lugares conhecidos aparecem como sugestão), ligar **Repetir toda semana** e escrever **Observações** para o passageiro (ex.: "uma mala média por pessoa").
4. Toque em **Publicar carona**. Antes de publicar, a IA confere o ponto de embarque e as observações, que ficam visíveis para todos. Se o texto tiver telefone, e-mail, documento, chave Pix, link ou linguagem ofensiva, o app avisa: corrija o texto ou toque em **Publicar mesmo assim**. O mesmo vale para o "Sobre você" no **Perfil**.
5. O app abre os detalhes da carona publicada.

Se a IA estiver fora do ar ou responder fora do formato esperado, o app avisa e preenche o que conseguir reconhecer por regras. Se nada for reconhecido, todos os campos ficam liberados para preenchimento manual. A publicação nunca é bloqueada.

## 5. Responder aos pedidos de vaga (motorista)

1. Quando alguém pede vaga, a aba **Viagens** mostra um número vermelho com a quantidade de pedidos aguardando você.
2. Abra **Viagens → Como motorista** e toque na carona.
3. Em **Pedidos de vaga**, veja o nome e as avaliações de cada passageiro e toque em **Aceitar** ou **Recusar**.
4. Ao aceitar, a vaga é descontada. Se a carona lotar, os pedidos que ainda estavam pendentes são recusados automaticamente como "vaga esgotada".

## 6. Avaliar depois da viagem

- **Passageiro:** depois da data da viagem, a reserva mostra **Avaliar motorista** (na aba Viagens ou nos detalhes da carona).
- **Motorista:** nos detalhes da carona, cada passageiro confirmado mostra **Avaliar passageiro**.

Escolha de 1 a 5 estrelas e toque em **Enviar avaliação**. A nota entra na média exibida no perfil da pessoa e não pode ser alterada depois.

## 7. Perfil

- Toque na foto para trocá-la por uma imagem da galeria.
- Toque em **Editar perfil** para mudar nome, cidade e a descrição "Sobre mim".
- O perfil mostra sua média de avaliações e quantas caronas você já ofereceu.
- **Sair da conta** volta para a tela de login.

## 8. Sem internet

- Ao tentar uma ação sem conexão, o app mostra o aviso de falta de internet e não envia nada até a conexão voltar.
- A aba **Viagens** continua mostrando as reservas e caronas carregadas por último.
- Para demonstrar, o **Perfil** tem o "Modo demonstração" com a opção **Simular falta de conexão**.
