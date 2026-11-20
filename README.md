# Carona Campus

Aplicativo de caronas entre cidades, no estilo BlaBlaCar, em que o motorista publica a viagem descrevendo-a em texto livre e a IA organiza as informações.

## Problema

Quem viaja com frequência entre cidades combina caronas em grupos de mensagens. As ofertas se perdem em poucos minutos no fluxo de mensagens, não há como buscar uma carona específica depois, e não existe registro de quem viajou com quem. Os apps de carona existentes exigem formulários longos para publicar, obrigam a republicar a mesma viagem toda semana e só mostram viagens com exatamente a origem e o destino buscados.

## Público

Pessoas que fazem viagens intermunicipais com regularidade (estudantes, trabalhadores, quem visita a família nos fins de semana) e motoristas que já fazem esses trajetos. O app não é limitado a uma instituição de ensino.

## Diferenciais

1. **Publicação com IA:** o motorista descreve a viagem como se mandasse uma mensagem no WhatsApp e a IA organiza origem, destino, paradas, horário, vagas e valor. Se a IA falhar, os campos podem ser preenchidos manualmente.
2. **Viagens recorrentes:** o motorista cadastra uma viagem semanal uma única vez, sem republicar toda semana.
3. **Paradas intermediárias:** a busca também encontra viagens que passam pela cidade do passageiro, mesmo com outra origem ou destino.

A busca e a compatibilidade entre viagens são feitas por regras programadas, não pela IA. O valor por vaga é apenas informativo: o pagamento é combinado diretamente entre motorista e passageiro. Fora do escopo inicial: pagamentos pelo app, chat interno e rastreamento em tempo real.

## Grupo

- Felipe dos Santos — https://github.com/felipesantos100504
- Luiz Eduardo Jelonschek — https://github.com/SonyBlackk
- João Pedro Gehlen — https://github.com/joaopedrogehlen25
- Marx Mazzochin Pires de Carvalho — https://github.com/Marx-Carvalho

## Stack

- **App:** React Native + Expo SDK 58, Expo Router e TypeScript.
- **Back-end:** Firebase (plano gratuito Spark): Authentication (e-mail/senha e Google) e Cloud Firestore.
- **IA:** Gemini (`gemini-3.5-flash-lite`) pelo Firebase AI Logic.

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org/) 22.13 ou superior (ou 24.3+) e, para testar no celular, o app **Expo Go** atualizado (SDK 58) no Android ou iOS.

```bash
git clone https://github.com/felipesantos100504/carona-campus.git
cd carona-campus
npm install
cp .env.example .env
npx expo start
```

No Windows (Prompt de Comando), troque `cp .env.example .env` por `copy .env.example .env`.

Com o servidor rodando:

- **Celular:** abra o Expo Go e leia o QR code que aparece no terminal (o celular precisa estar na mesma rede Wi-Fi do computador; se não conectar, rode `npx expo start --tunnel`).
- **Navegador:** pressione `w` no terminal ou rode `npm run web`. O login com Google só aparece nesta versão.
- **Emulador Android:** pressione `a` (requer Android Studio com um emulador configurado).

Para usar o app, crie uma conta e confirme o e-mail (ou entre com Google na versão web). Depois que os dados de exemplo forem cadastrados com `npm run popular`, também dá para entrar com as **contas de demonstração** listadas em [`scripts/dados-exemplo.mjs`](scripts/dados-exemplo.mjs) (a senha está nesse arquivo). As principais são `motorista@carona-campus.test` (Rafael, com caronas saindo de Quedas do Iguaçu e um pedido de vaga esperando resposta) e `passageiro@carona-campus.test` (Júlia, com esse pedido e uma viagem já realizada para avaliar). O passo a passo de uso está no [tutorial](docs/tutorial.md).

Antes de subir alterações, rode `npm run lint` e `npm run typecheck`.

## Configuração do Firebase

O projeto do Firebase já está criado (`carona-campus-84abe`). Para recriar em outro projeto:

1. No [console do Firebase](https://console.firebase.google.com), crie um projeto (sem Google Analytics) e adicione um app **Web** (`</>`). Copie os valores do `firebaseConfig` para o `.env`.
2. **Authentication → Sign-in method:** ative **E-mail/senha** e **Google**.
3. **Firestore Database:** crie o banco em `southamerica-east1` (São Paulo), modo de produção.
4. **Firestore Database → Regras:** cole o conteúdo de [`firestore.rules`](firestore.rules) e publique (ou use `npx firebase deploy --only firestore:rules`).
5. **Gemini:** crie uma chave em [aistudio.google.com/apikey](https://aistudio.google.com/apikey), escolhendo o projeto do Firebase, e coloque em `EXPO_PUBLIC_GEMINI_API_KEY` no `.env`. (O Firebase AI Logic também foi ativado, mas neste projeto a configuração do provedor não foi concluída pelo console; ver ADR-0007.)

### Variáveis de ambiente

Ficam no arquivo `.env` (fora do Git); o modelo comentado é o [`.env.example`](.env.example).

| Variável | Para que serve |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Identifica o projeto do Firebase nas chamadas do app |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Domínio do Firebase Auth (login com Google e links de e-mail) |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Id do projeto (Firestore e AI Logic) |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket padrão do projeto (não usado pelo app; mantido como no console) |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Id numérico do projeto |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Id do app Web registrado no console |
| `EXPO_PUBLIC_GEMINI_MODEL` | Modelo do Gemini usado na publicação (padrão `gemini-3.5-flash-lite`) |
| `EXPO_PUBLIC_GEMINI_API_KEY` | **Secreta.** Chave da Gemini API criada no [Google AI Studio](https://aistudio.google.com/apikey). Fica só no `.env` de cada pessoa; o grupo compartilha por mensagem privada, nunca pelo GitHub. Sem ela, a publicação usa a extração por regras |
| `EXPO_PUBLIC_USAR_EMULADOR` | Opcional. `1` conecta o app aos emuladores locais (desenvolvimento) |

Os valores do Firebase **não são segredos**: eles identificam o projeto, e quem protege os dados são as regras do Firestore. A **chave do Gemini é secreta**: ela fica só no `.env`, que está no `.gitignore`, e é restrita à Gemini API no Google Cloud (ver ADR-0007).

### Scripts

| Comando | O que faz |
|---|---|
| `npm run test:regras` | Testa as regras do Firestore no emulador local (26 casos; precisa de Java) |
| `npm run emuladores` | Sobe os emuladores de Auth e Firestore para testar o app sem tocar no banco real |
| `npm run popular` | Cadastra as contas de demonstração e os dados de exemplo no Firebase |
| `npm run exportar` | Gera [`docs/estrutura-firestore.json`](docs/estrutura-firestore.json) a partir dos dados do Firestore |

`popular` e `exportar` usam a chave de conta de serviço em `chave-servico.json` (Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada). Essa chave dá acesso total ao projeto: está no `.gitignore` e não deve ir para o GitHub.

## Estado atual (etapa 3: aplicativo final)

- **Banco de dados:** Cloud Firestore com as coleções `usuarios`, `caronas`, `reservas` e `avaliacoes` (estrutura em [`docs/estrutura-firestore.json`](docs/estrutura-firestore.json)).
- **Autenticação:** cadastro com confirmação de e-mail, login com e-mail e senha (e com Google na web) e recuperação de senha. As telas privadas só abrem com login e e-mail verificado (`Stack.Protected`).
- **Regras de acesso:** [`firestore.rules`](firestore.rules). Ninguém lê nem grava sem e-mail verificado, cada pessoa altera só os próprios dados, e o contador de vagas só muda junto com a reserva (disputa pela última vaga, RNF-05).
- **IA:** o Gemini interpreta texto livre na **publicação** (motorista) e na **busca** (passageiro: "preciso ir pra Cascavel sexta à noite, saindo do Posto Fênix"). Se a API falhar ou responder fora do formato, o app usa uma extração por regras e libera o preenchimento manual.
- **Ponto de embarque:** o motorista informa onde os passageiros embarcam na cidade de origem; na busca, as caronas que saem do ponto pedido aparecem primeiro.
- **Fluxo de vagas:** o passageiro pede, o motorista aceita ou recusa (com aviso de pedidos pendentes na aba Viagens), e o passageiro pode cancelar. Depois da viagem, motorista e passageiro se avaliam.
- **Sem conexão:** ações mostram aviso de falta de internet, e a aba Viagens mostra os dados salvos no aparelho. A aba Perfil tem um "Modo demonstração" que simula a falta de conexão.

## Estrutura do código

```
src/
  app/            telas (cada arquivo é uma rota do Expo Router)
    (auth)/       login e cadastro
    (tabs)/       abas: Buscar, Publicar, Viagens, Perfil
    verificar-email.tsx, resultados.tsx, carona/[id].tsx, avaliar/[reservaId].tsx
  components/     componentes reutilizáveis (Botao, Campo, Cartao, CardCarona, Chip, Selo, Aviso, estados...)
  data/           firebase.ts (inicialização), auth.ts, repositorio.ts (Firestore), ia.ts (Gemini) e extracao-local.ts (plano B)
  hooks/          useSessao (login) e useCarregamento (carregando / erro / pronto)
  theme/          cores, fontes e espaçamentos do design system (docs/DESIGN.md)
  utils/          formatação de datas e valores, foto de perfil
scripts/          testes das regras, dados de exemplo e exportação da estrutura
firestore.rules   regras de acesso do Firestore
```

As telas acessam dados só por `src/data/repositorio.ts`, que concentra as consultas e transações do Firestore.

## Protótipo

🔗 [Protótipo navegável no Google Stitch](https://stitch.withgoogle.com/projects/16277366381705349719)

O visual do app segue esse protótipo: cores, fontes (Space Grotesk e Hanken Grotesk) e componentes estão em `src/theme` e `src/components`, documentados em [docs/DESIGN.md](docs/DESIGN.md).

As telas e fluxos da proposta atual estão descritos em [docs/prototipo.md](docs/prototipo.md).

## Documentos

- [Tutorial de uso](docs/tutorial.md)
- [PRD](docs/prd.md)
- [Design system](docs/DESIGN.md)
- [Protótipo](docs/prototipo.md)
- [Decisões de arquitetura](docs/adr/)
- [Estrutura do banco (JSON)](docs/estrutura-firestore.json)
- [Diário de bordo de IA](docs/diario-ia.md)
