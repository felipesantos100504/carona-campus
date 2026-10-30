# Carona Campus

> **Nome provisório:** como o app passou a ser de caronas entre cidades, o grupo ainda vai escolher um novo nome.

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

React Native + Expo SDK 54, Firebase Auth + Firestore, LLM: Gemini via Google AI Studio.

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org/) 20 ou superior e, para testar no celular, o app **Expo Go** (compatível com o SDK 54) instalado no Android ou iOS.

```bash
git clone https://github.com/felipesantos100504/carona-campus.git
cd carona-campus
npm install
npx expo start
```

Com o servidor rodando:

- **Celular:** abra o Expo Go e leia o QR code que aparece no terminal (o celular precisa estar na mesma rede Wi-Fi do computador).
- **Navegador:** pressione `w` no terminal ou rode `npm run web`.
- **Emulador Android:** pressione `a` (requer Android Studio com um emulador configurado).

Na primeira abertura o app grava dados de exemplo no aparelho. Para a demonstração, a aba **Perfil** tem um "Modo demonstração" com a opção de simular falta de conexão (mostra o estado de erro das listas) e de restaurar os dados de exemplo.

Antes de subir alterações, rode `npm run lint` e `npm run typecheck`.

## Estado atual (etapa 2: codificação das telas)

- Telas com navegação (Expo Router) e passagem de parâmetros: `resultados?origem=&destino=&data=`, `carona/[id]`, `avaliar/[reservaId]`.
- Persistência **local** com AsyncStorage. Ainda não há Firebase nem autenticação real: o login só grava uma sessão no aparelho.
- A extração da IA é **simulada** (`src/data/ia.ts`). Ela tem a mesma assinatura que a integração com o Gemini terá na próxima etapa.
- As listas tratam os estados de carregando, vazio e erro.

## Estrutura do código

```
src/
  app/            telas (cada arquivo é uma rota do Expo Router)
    (auth)/       login e cadastro
    (tabs)/       abas: Buscar, Publicar, Viagens, Perfil
    resultados.tsx, carona/[id].tsx, avaliar/[reservaId].tsx
  components/     componentes reutilizáveis (Botao, Campo, CardCarona, estados...)
  data/           tipos, dados de exemplo, repositório (AsyncStorage) e IA simulada
  hooks/          useCarregamento: carregando / erro / pronto para as listas
  theme/          cores, fontes e espaçamentos do design system (docs/DESIGN.md)
  utils/          formatação de datas e valores
```

As telas acessam dados só por `src/data/repositorio.ts`. Na próxima etapa, trocar AsyncStorage por Firestore não deve exigir mudanças nas telas.

## Protótipo

🔗 [Protótipo navegável no Google Stitch](https://stitch.withgoogle.com/projects/16668250046840718500)

As telas e fluxos da proposta atual estão descritos em [docs/prototipo.md](docs/prototipo.md).

## Documentos

- [PRD](docs/prd.md)
- [Design system](docs/DESIGN.md)
- [Protótipo](docs/prototipo.md)
- [Decisões de arquitetura](docs/adr/)
- [Diário de bordo de IA](docs/diario-ia.md)
