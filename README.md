# Carona Campus

Aplicativo de mobilidade que conecta motoristas e passageiros da comunidade acadêmica, permitindo oferecer e buscar caronas descrevendo a viagem em linguagem natural.

## Problema

Estudantes que se deslocam entre a cidade e o campus, ou para cidades vizinhas em finais de semana, organizam caronas por grupos de mensagens. As ofertas e pedidos se perdem em poucos minutos no fluxo de mensagens, não há como buscar uma carona específica depois, e não existe registro de quem viajou com quem.

## Público

Comunidade acadêmica do campus (estudantes, e potencialmente professores e servidores) que precisam se deslocar regularmente entre a cidade e o campus ou em viagens de fim de semana, e hoje dependem de grupos de mensagens informais para combinar caronas.

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

## Documentos

- [PRD](docs/prd.md)
- [Design system](docs/DESIGN.md)
- [Protótipo](docs/prototipo.md)
- [Decisões de arquitetura](docs/adr/)
- [Diário de bordo de IA](docs/diario-ia.md)
