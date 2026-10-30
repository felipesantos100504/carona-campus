# PROTÓTIPO DE NAVEGAÇÃO & FLUXOS DE INTERAÇÃO — CARONA CAMPUS (NOME PROVISÓRIO)

> **Documento de Arquitetura de Navegação, Mapeamento de Rotas e Estados do Sistema**  
> **Dispositivo:** Mobile (Viewport 390 × 844)  
> **Design System Vinculado:** `Predictive Intercity Mobility`  
> **Versão:** 2.0 (Caronas entre cidades: publicação com IA, viagens recorrentes e paradas intermediárias)

---

## 1. Visão Geral da Arquitetura de Telas

O aplicativo organiza-se sob dois paradigmas estruturais de navegação:
1. **Fluxo Principal Tabular (Bottom Tab Navigation):** Permite troca instantânea entre os 4 pilares do app (*Buscar*, *Publicar*, *Viagens* e *Perfil*).
2. **Fluxo Hierárquico Modal / Stack (Top App Bar com Voltar):** Resultados da busca, detalhes da viagem e avaliação.

### Inventário de Telas

| Nome da Tela | Padrão Estrutural | Rota no app | Descrição Funcional |
|---|---|---|---|
| **1. Login e Cadastro** | *Mobile Blank* (Full-screen) | `(auth)/login`, `(auth)/cadastro` | Login e cadastro com e-mail verificado (RF-01, RF-02) e foto de perfil (RF-03). |
| **2. Início e Busca** | *Mobile Tab* (Aba `Buscar`) | `(tabs)/index` | Campos "Saindo de" e "Indo para" e escolha da data (RF-06). |
| **3. Resultados da Busca** | *Mobile Stack* (com botão Voltar) | `resultados` | Viagens compatíveis, incluindo as que passam pelo trajeto como paradas intermediárias (RF-06, RNF-01). |
| **4. Detalhes da Viagem** | *Mobile Stack* (com botão Voltar) | `carona/[id]` | Trajeto com paradas, recorrência, valor por vaga informativo, motorista e avaliações; solicitação de vaga (RF-07, RF-11, RF-13). |
| **5. Publicar Carona** | *Mobile Tab* (Aba `Publicar`) | `(tabs)/publicar` | Texto livre interpretado pela IA, confirmação dos dados e preenchimento manual (RF-04, RF-05, RF-16). |
| **6. Minhas Viagens e Reservas** | *Mobile Tab* (Aba `Viagens`) | `(tabs)/viagens` | Viagens como motorista (com solicitações a confirmar) e reservas como passageiro (RF-08, RF-09, RF-12). |
| **7. Perfil e Avaliações** | *Mobile Tab* (Aba `Perfil`) + modal | `(tabs)/perfil`, `avaliar/[reservaId]` | Foto, cidade, média e avaliações recebidas; avaliação mútua após a viagem (RF-10). |
| **Estado: Vazio** | *Mobile Stack* | `resultados` | Busca sem viagens compatíveis. |
| **Estado: Carregando** | *Mobile Stack* / *Mobile Tab* | listas | Esqueletos com efeito shimmer enquanto a busca ou a IA processam. |
| **Estado: Erro sem Conexão** | *Mobile Stack* / *Mobile Tab* | listas | Aviso de falta de conexão com opção de tentar novamente (RF-14). |
| **Estado: IA falhou** | *Mobile Tab* (Aba `Publicar`) | `(tabs)/publicar` | Mensagem de erro e campos liberados para preenchimento manual (RF-16). |

---

## 2. Mapa Conceitual de Navegação e Transições

```
                                [ ABERTURA DO APP ]
                                         │
                                         ▼
                            ┌────────────────────────┐
                            │  1. Login e Cadastro   │
                            └───────────┬────────────┘
                                        │ Toque em "Entrar"
                                        ▼
       ┌───────────────────────────────────────────────────────────────────────┐
       │                    CONTAINER GLOBAL (BOTTOM TAB BAR)                  │
       └──────┬─────────────────────┬─────────────────────┬──────────────┬─────┘
              │                     │                     │              │
  [ Aba: Buscar ]       [ Aba: Publicar ]       [ Aba: Viagens ]  [ Aba: Perfil ]
              ▼                     ▼                     ▼              ▼
  ┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐
  │2. Início e Busca     │ │5. Publicar Carona│ │6. Minhas Viagens │ │7. Perfil e   │
  │                      │ │                  │ │   e Reservas     │ │   Avaliações │
  └──────────┬───────────┘ └────────┬─────────┘ └────────┬─────────┘ └──────────────┘
             │ "Buscar caronas"     │ IA falhou          │ Viagem concluída
             ▼                      ▼                    ▼
  ┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────┐
  │3. Resultados da Busca│ │Estado: IA falhou │ │Avaliar viagem    │
  │   (ou Estado: Vazio) │ │(campos manuais)  │ │(modal)           │
  └──────────┬───────────┘ └──────────────────┘ └──────────────────┘
             │ Toque em card
             ▼
  ┌──────────────────────┐
  │4. Detalhes da Viagem │
  └──────────┬───────────┘
             │ Toque em "Solicitar vaga"
             │ (se a rede cair no momento do envio - RF-14)
             ▼
  ┌──────────────────────┐
  │Estado: Erro sem      │
  │Conexão               │
  └──────────────────────┘
```

---

## 3. Especificação Detalhada das Telas e Ações do Usuário

### Fluxo 1: Onboarding e Autenticação
#### **Tela: 1. Login e Cadastro**
* **Objetivo:** Garantir que todo usuário tenha e-mail verificado e foto de perfil.
* **Elementos Interativos:**
  * **Campos E-mail e Senha.**
  * **CTA Primário (Bottom Half):** `Entrar`.
    * *Ação:* Valida credenciais e navega para **`2. Início e Busca`**.
  * **CTA Secundário:** `Criar conta` → cadastro com nome, cidade, e-mail e foto de perfil.
  * **Aviso pós-cadastro:** `Enviamos um link para o seu e-mail. Confirme para continuar.`

---

### Fluxo 2: Busca e Reserva de Caronas
#### **Tela: 2. Início e Busca**
* **Objetivo:** Encontrar uma carona entre duas cidades em poucos toques.
* **Elementos Interativos:**
  * **Campos com sugestão de cidades:** `Saindo de` e `Indo para`, com botão `Inverter`.
  * **Chips de data:** `Qualquer dia`, `Hoje`, `Amanhã`.
  * **CTA Primário:** `Buscar caronas` → navega para **`3. Resultados da Busca`**.

#### **Tela: 3. Resultados da Busca**
* **Objetivo:** Exibir as viagens compatíveis em menos de 3 segundos (RNF-01).
* **Elementos Interativos:**
  * **Resumo da busca:** `Pato Branco → Curitiba · sex., 7 de nov.` e contagem de caronas.
  * **Cards de viagem:** data e horário, valor por vaga, `Origem → Destino`, linha `Passa por Guarapuava, Ponta Grossa`, motorista com nota, selo de recorrência (`sex.`) e vagas livres.
    * *Ação:* Tocar no card navega para **`4. Detalhes da Viagem`**.
  * *Se não houver viagens compatíveis:* **`Estado: Vazio`**.

#### **Tela: 4. Detalhes da Viagem**
* **Objetivo:** Transparência sobre a viagem e o motorista antes de solicitar a vaga (RF-11).
* **Elementos Interativos:**
  * **Botão Voltar (`<` Top Bar):** Retorna para **`3. Resultados da Busca`**.
  * **Trajeto em linha do tempo:** origem, paradas intermediárias e destino.
  * **Recorrência:** `Toda semana: sex.`.
  * **Valor por vaga e vagas livres**, com o aviso `O pagamento é combinado diretamente com o motorista.` (RF-13).
  * **Card do Motorista:** foto, nota média, número de avaliações e viagens, bio.
  * **Observações do motorista.**
  * **CTA Primário (Área de Polegar):** `Solicitar vaga` (RF-07).
    * *Cenário Normal:* Envia a solicitação e mostra `Aguardando confirmação do motorista`.
    * *Cenário Sem Conexão (RF-14):* Desvia para **`Estado: Erro sem Conexão`**.
  * **Com vaga confirmada:** CTA muda para `Cancelar minha vaga` (RF-12).

---

### Fluxo 3: Publicação com IA
#### **Tela: 5. Publicar Carona**
* **Objetivo:** Publicar uma viagem em no máximo 3 toques a partir do texto livre (RF-04, RNF-03).
* **Elementos Interativos:**
  * **Caixa de Entrada em Texto Livre:** exemplo `"saio de Pato Branco toda sexta às 18h pra Curitiba, passo por Guarapuava e Ponta Grossa, 3 vagas, R$ 90"`.
  * **CTA:** `Interpretar com IA` (estado de carregando enquanto a IA interpreta).
  * **Card de confirmação com campos editáveis:** origem, destino, paradas, data, horário, vagas, valor por vaga.
  * **Recorrência (RF-05):** switch `Repetir toda semana` + chips dos dias (`dom` a `sáb`).
  * **Ação Corretiva:** todos os campos podem ser editados; se a IA falhar, **`Estado: IA falhou`** libera os campos vazios para preenchimento manual (RF-16).
  * **CTA Primário:** `Publicar carona`.
    * *Ação:* Salva a viagem e abre os detalhes da carona publicada (`carona/[id]`).

---

### Fluxo 4: Minhas Viagens, Perfil e Avaliações
#### **Tela: 6. Minhas Viagens e Reservas**
* **Objetivo:** Acompanhar as viagens como motorista e as reservas como passageiro (RF-09).
* **Elementos Interativos:**
  * **Abas internas:** `Como passageiro` e `Como motorista`.
  * **Como passageiro:** reservas com status (`Aguardando motorista`, `Vaga confirmada`, `Viagem realizada`, `Cancelada`) e botão `Avaliar motorista` após a viagem.
  * **Como motorista:** viagens publicadas (com selo de recorrência), solicitações pendentes com `Confirmar` (RF-08) e botão `Avaliar passageiros` após a viagem.

#### **Tela: 7. Perfil e Avaliações**
* **Objetivo:** Construir confiança entre os usuários (RF-03, RF-10).
* **Elementos Interativos:**
  * **Cabeçalho:** foto, nome, cidade, selo `E-mail verificado`, nota média e total de viagens.
  * **Lista de avaliações recebidas** (nota e data).
  * **CTA:** `Editar perfil` (nome, cidade, bio e foto) e `Sair`.
  * **Modal `Avaliar viagem`:** resumo do trajeto, pessoa avaliada, 5 estrelas e `Enviar avaliação`.

---

## 4. Matriz de Estados de Resiliência e Casos de Borda

| Estado | Tela Representativa | O que o Usuário Vê | Ação Permitida / Próximo Passo |
|---|---|---|---|
| **Vazio (*Empty*)** | Resultados da Busca | Ícone de busca vazia; aviso de que nenhuma viagem passa pelas cidades na data escolhida. | • `Alterar busca` (volta para a busca para trocar a data ou as cidades). |
| **Carregando (*Skeleton*)** | Resultados / Viagens / Publicar | Esqueletos com efeito shimmer nas áreas de card; na publicação, `Interpretando sua viagem…`. | • Aguardar ou voltar. |
| **Erro Sem Conexão** | Detalhes / listas | Alerta de falha de conexão (RF-14); a solicitação de vaga não é enviada. | • `Tentar novamente`. |
| **Cache Local (*Offline*)** | Minhas Viagens e Reservas | Viagens e reservas já carregadas continuam visíveis em modo avião (RNF-04). | • `Tentar novamente` para atualizar. |
| **IA falhou** | Publicar Carona | Mensagem `Não conseguimos entender a viagem. Preencha os campos manualmente.` (RF-16). | • Preencher os campos e `Publicar carona`. |
| **Conteúdo Extremo (*Stress*)** | Detalhes da Viagem | Nome longo, viagem com 3 ou mais paradas e observações extensas. | • Layout quebra linhas sem cortar informações essenciais. |

---

## 5. Diretrizes Ergonômicas e Regras de Usabilidade

1. **Altura Mínima de Toque (*Touch Target*):**
   * Todo componente interativo (botões primários, chips de data e de dias da semana, abas da barra inferior e estrelas de avaliação) possui altura mínima de **44 pt a 56 px**.
2. **Tipografia Acessível:**
   * Nenhum texto funcional de leitura possui tamanho inferior a **16 px**, e legendas nunca ficam abaixo de **13 px**.
3. **Ergonomia da Metade Inferior (*Thumb Zone*):**
   * Todas as ações principais de busca, publicação, solicitação e confirmação estão no rodapé fixo da tela, otimizadas para uso com uma mão.
4. **Proteção Contra Erros (Anti-Concorrência):**
   * Em conformidade com RF-15 e RNF-05, os botões de solicitação e confirmação ficam travados enquanto a requisição está em andamento, evitando múltiplos toques.
