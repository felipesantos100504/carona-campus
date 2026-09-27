# PROTÓTIPO DE NAVEGAÇÃO & FLUXOS DE INTERAÇÃO — CARONA CAMPUS

> **Documento de Arquitetura de Navegação, Mapeamento de Rotas e Estados do Sistema**  
> **Dispositivo:** Mobile (Viewport 390 × 844)  
> **Design System Vinculado:** `Predictive Campus Mobility`  
> **Versão:** 1.0 (MVP com Suporte a IA Gemini, Resiliência Offline e Edge Cases)

---

## 1. Visão Geral da Arquitetura de Telas

O aplicativo **Carona Campus** organiza-se sob dois paradigmas estruturais de navegação:
1. **Fluxo Principal Tabular (Bottom Tab Navigation):** Permite troca instantânea entre os 4 pilares de serviço da plataforma (*Início*, *Publicar*, *Viagens* e *Perfil*).
2. **Fluxo Hierárquico Modal / Stack (Top App Bar com Voltar):** Telas de detalhe, leitura contextual aprofundada ou resolução de exceções pontuais.

### Inventário de Telas e Artefatos do Canvas

| ID do Sistema | Nome da Tela | Padrão Estrutural | Descrição Funcional |
|---|---|---|---|
| `{{DATA:SCREEN:SCREEN_18}}` | **1. Login Institucional** | *Mobile Blank* (Full-screen) | Autenticação por e-mail institucional `@universidade.edu.br` (RF-01, RF-02) e foto de perfil obrigatória (RF-03). |
| `{{DATA:SCREEN:SCREEN_22}}` | **2. Publicar Oferta IA** | *Mobile Tab* (Aba `Publicar`) | Entrada em texto livre interpretada pela IA Gemini (RF-04, RF-05, RF-16). |
| `{{DATA:SCREEN:SCREEN_20}}` | **3. Lista de Caronas (40 itens)** | *Mobile Tab* (Aba `Início`) | Listagem com 40 resultados, destaque do melhor match (98%) e filtros rápidos (RF-06, RNF-01). |
| `{{DATA:SCREEN:SCREEN_16}}` | **4. Detalhes da Carona** | *Mobile Stack* (com botão Voltar) | Informações completas do motorista, avaliações, rota e confirmação de reserva (RF-07, RF-11). |
| `{{DATA:SCREEN:SCREEN_14}}` | **5. Histórico e Avaliação** | *Mobile Tab* (Aba `Viagens`) | Histórico de viagens realizadas e avaliação rápida por estrelas/tags (RF-09, RF-10, RNF-04). |
| `{{DATA:SCREEN:SCREEN_12}}` | **Estado 1: Vazio (Empty State)** | *Mobile Tab* (Aba `Início`) | Cenário de busca sem resultados com CTAs de solicitação e expansão de raio. |
| `{{DATA:SCREEN:SCREEN_10}}` | **Estado 2: Carregando (Skeleton IA)** | *Mobile Tab* (Aba `Início`) | Shimmer adaptativo com feedback de processamento pela IA Gemini (RNF-01). |
| `{{DATA:SCREEN:SCREEN_4}}` | **Estado 3: Erro sem Conexão (RF-14)** | *Mobile Stack* | Bloqueio resiliente ao tentar confirmar vaga sem internet, evitando duplicidade (RNF-05). |
| `{{DATA:SCREEN:SCREEN_2}}` | **Estado 4: Erro com Cache (RNF-04)** | *Mobile Tab* (Aba `Viagens`) | Exibição em modo offline de dados salvos localmente com exportação de comprovante. |
| `{{DATA:SCREEN:SCREEN_8}}` | **Estado 5: Conteúdo Extremo (Stress)** | *Mobile Stack* | Teste de carga de layout com nomes longos, rotas com 3 paradas e descrições complexas. |
| `{{DATA:SCREEN:SCREEN_6}}` | **Estado 6: Permissão Negada (RF-13)** | *Mobile Tab* (Aba `Publicar`) | Fluxo contínuo sem GPS, usando entrada de texto e pontos de interesse acadêmicos. |

---

## 2. Mapa Conceitual de Navegação e Transições

```
                                [ ABERTURA DO APP ]
                                         │
                                         ▼
                            ┌────────────────────────┐
                            │  1. Login Institucional │
                            │     (SCREEN_18)        │
                            └───────────┬────────────┘
                                        │ Toque em "Entrar com E-mail Acadêmico"
                                        ▼
             ┌────────────────────────────────────────────────────────┐
             │            CONTAINER GLOBAL (BOTTOM TAB BAR)            │
             └──────┬────────────────────┬────────────────────┬───────┘
                    │                    │                    │
     [ Aba: Início ]│     [ Aba: Publicar ]│      [ Aba: Viagens ]│
                    ▼                    ▼                    ▼
        ┌──────────────────────┐ ┌───────────────┐ ┌──────────────────────┐
        │3. Lista de Caronas   │ │ 2. Publicar   │ │ 5. Histórico e       │
        │   (40 itens)         │ │    Oferta IA  │ │    Avaliação         │
        │   (SCREEN_20)        │ │   (SCREEN_22) │ │   (SCREEN_14)        │
        └──────────┬───────────┘ └───────┬───────┘ └──────────┬───────────┘
                   │                     │                    │
                   │ Toque em card       │ Sem GPS (RF-13)    │ Sem sinal (Modo Avião)
                   ▼                     ▼                    ▼
        ┌──────────────────────┐ ┌───────────────┐ ┌──────────────────────┐
        │4. Detalhes da Carona │ │Estado 6: Sem  │ │Estado 4: Modo        │
        │  (SCREEN_16 /        │ │Localização    │ │Offline com Cache     │
        │   SCREEN_8 Stress)   │ │  (SCREEN_6)   │ │  (SCREEN_2)          │
        └──────────┬───────────┘ └───────────────┘ └──────────────────────┘
                   │
                   │ Toque em "Confirmar Solicitação de Vaga"
                   │ (se rede cair no momento do envio - RF-14)
                   ▼
        ┌──────────────────────┐
        │Estado 3: Erro sem    │
        │Conexão (SCREEN_4)    │
        └──────────────────────┘
```

---

## 3. Especificação Detalhada das Telas e Ações do Usuário

### Fluxo 1: Onboarding e Autenticação
#### **Tela: 1. Login Institucional (`SCREEN_18`)**
* **Objetivo:** Garantir acesso exclusivo a usuários validados da instituição.
* **Elementos Interativos:**
  * **Campo E-mail:** Pré-preenchido com `estudante@universidade.edu.br`.
  * **Indicador de Status:** Badge verde confirmando `Domínio @universidade.edu.br reconhecido ✓`.
  * **Foto de Perfil:** Avatar real da estudante com botão de troca rápida (`Trocar foto`).
  * **Campo Senha / OTP:** Opção rápida para `Usar Magic Link (OTP)`.
  * **CTA Primário (Bottom Half):** `Entrar com E-mail Acadêmico →`
    * *Ação:* Valida credenciais e navega para **`3. Lista de Caronas (SCREEN_20)`**.
  * **CTA Secundário:** `Primeiro acesso? Cadastre-se`.

---

### Fluxo 2: Exploração e Reserva de Caronas
#### **Tela: 3. Lista de Caronas — 40 Itens (`SCREEN_20`)**
* **Objetivo:** Exibir opções de transporte coordenadas para o campus em menos de 3 segundos (RNF-01).
* **Elementos Interativos:**
  * **Card Destaque IA (Match 98%):** Carona da motorista Camila Silveira (`4.9★`).
    * *Ação:* Tocar no botão `Ver Detalhes e Reservar →` navega para **`4. Detalhes da Carona (SCREEN_16)`**.
  * **Filtros em Pílula:** `Todas (40)`, `Saindo do Centro (18)`, etc.
    * *Ação:* Filtra dinamicamente os cards da lista.
  * **Cards Secundários (#1 Lucas, #2 Mariana, #3 Gabriel, #4 Beatriz, #5 Thiago):**
    * *Ação:* Tocar em `Ver rota` abre modal com resumo rápido da viagem.
  * **CTA de Busca IA no Rodapé:** `Nova Busca por IA`.
    * *Ação ao disparar nova busca:* Transiciona temporariamente para **`Estado 2: Carregando (SCREEN_10)`**.
    * *Se a busca não retornar compatibilidade:* Transiciona para **`Estado 1: Vazio (SCREEN_12)`**.

#### **Tela: 4. Detalhes da Carona (`SCREEN_16`)**
* **Objetivo:** Transparência de dados de segurança do motorista antes do aceite mútuo (RF-11).
* **Elementos Interativos:**
  * **Botão Voltar (`<` Top Bar):** Retorna para a **`3. Lista de Caronas (SCREEN_20)`**.
  * **Card do Motorista:** Foto, avaliação `4.9★ (12 caronas)`, curso de Engenharia Ambiental e e-mail validado.
  * **Trajeto Estruturado:** Origem no Centro (Supermercado X) e Destino no Bloco de Engenharia.
  * **Depoimentos da Comunidade:** Avaliações de Pedro L. e Beatriz M.
  * **CTA Primário (Área de Polegar):** `Confirmar Solicitação de Vaga` (RF-07).
    * *Cenário Normal:* Emite requisição para o motorista e exibe confirmação com feedback háptico.
    * *Cenário Sem Conexão (RF-14):* Desvia para **`Estado 3: Erro sem Conexão (SCREEN_4)`**.
  * **CTA Secundário:** `Perguntas ao Motorista` (abre canal de contato predeterminado).

---

### Fluxo 3: Publicação Inteligente via Linguagem Natural
#### **Tela: 2. Publicar Oferta IA (`SCREEN_22`)**
* **Objetivo:** Publicar rotas em no máximo 3 toques a partir do texto livre (RF-04, RNF-03).
* **Elementos Interativos:**
  * **Segmented Control:** Alternância rápida entre `Oferecer Carona` e `Pedir Carona`.
  * **Caixa de Entrada em Texto Livre:** Conteúdo de teste real `"saio do centro perto do supermercado X por volta das sete"`.
  * **Card de Extração da IA Gemini:** Mostra em tempo real a rota normalizada `"Centro → Bloco de Engenharia (06h50 - 07h10)"` com 99.4% de precisão.
  * **Ação Corretiva Rápida:** Botão `Editar` para ajuste manual caso a IA falhe (RF-16).
  * **Seletor Numérico de Assentos:** Chips táteis `1`, `2`, `[ 3 ]`, `4`.
  * **CTA Primário:** `Confirmar e Publicar Carona`.
    * *Ação:* Salva no banco e redireciona para a aba `Início` com a listagem atualizada.

---

### Fluxo 4: Pós-Viagem, Avaliação e Histórico
#### **Tela: 5. Histórico e Avaliação (`SCREEN_14`)**
* **Objetivo:** Histórico auditável e avaliação sem atrito para manter a reputação da rede (RF-09, RF-10).
* **Elementos Interativos:**
  * **Tabs Internas:** Alternância entre `Minhas Viagens` e `Caronas Oferecidas`.
  * **Módulo de Avaliação Pendente:**
    * Mostra a carona recente com Camila Silveira (`Centro → Eng. Campus`).
    * Classificação rápida por 5 estrelas (`★ ★ ★ ★ ★`).
    * Tags de toque único (*Pontualidade*, *Direção Segura*, *Boa Conversa*, *Carro Limpo*).
    * Botão `Enviar Avaliação`: Registra a nota instantaneamente e remove o card da fila.
  * **Lista Histórica Cronológica:** Viagens de 12 de Out, 10 de Out e 08 de Out.
  * **CTA de Emissão:** `Exportar Comprovante / Horas` (gera documento para horas complementares).
  * **CTA Primário Inferior:** `Buscar Nova Carona` (atalho para a aba `Início`).

---

## 4. Matriz de Estados de Resiliência e Casos de Borda

| Estado | Tela Representativa | O que o Usuário Vê | Ação Permitida / Próximo Passo |
|---|---|---|---|
| **Vazio (*Empty*)** | `SCREEN_12` | Ilustração com pin de trajeto vazio; aviso de que nenhuma carona coincide no horário; monitoramento ativo da IA. | • `Pedir Carona com Texto Livre` (cria solicitação reversa)<br>• `Expandir Raio de Busca (+5 km)`<br>• Switch para `Notificar se surgir vaga` via push. |
| **Carregando (*Skeleton*)** | `SCREEN_10` | Banner informando IA Gemini calculando rotas (4.0s decorridos); esqueletos com efeito shimmer nas áreas de card. | • `Cancelar Busca` (aborta e volta para o estado anterior)<br>• `Refinar rota ou horário` (permite ajuste dos parâmetros). |
| **Erro Sem Conexão (*Offline Hard*)** | `SCREEN_4` | Alerta de falha de conexão (RF-14); trajeto pausado em status *"Aguardando Conexão"*; aviso de prevenção de vaga duplicada. | • `Tentar Novamente Agora` (retesta handshake)<br>• `Salvar Rascunho para Envio Automático` (armazena na fila do aparelho). |
| **Cache Local (*Stale / Offline*)** | `SCREEN_2` | Banner azul informando dados salvos ontem às 18h42 (RNF-04); histórico navegável em modo avião; avaliação na fila local. | • `Atualizar Dados (Reconectar)`<br>• `Exportar Comprovante / Declaração em PDF Local` (funciona 100% offline). |
| **Conteúdo Extremo (*Stress*)** | `SCREEN_8` | Nome acadêmico ultra longo com títulos honoríficos; itinerário com 3 paradas rastreadas; 4 linhas de instruções e regras. | • `Confirmar Vaga com Parada Especial`<br>• `Copiar Endereço Completo` (para Google Maps / Waze). |
| **Permissão Negada (*GPS Off*)** | `SCREEN_6` | Banner informando GPS desativado (RF-13); IA interpreta rota sem exigir geolocalização; tags rápidas de locais conhecidos do campus. | • Toque em pontos rápidos (*Biblioteca*, *Bloco de Engenharia*, *RU*)<br>• `Confirmar Oferta com Local Manual`<br>• `Ativar localização nas configurações`. |

---

## 5. Diretrizes Ergonômicas e Regras de Usabilidade

1. **Altura Mínima de Toque (*Touch Target*):**
   * Todo componente interativo (botões primários, seletores de vagas, abas da barra inferior, pílulas de filtro e estrelas de avaliação) possui altura mínima de **44 pt a 56 px**, assegurando facilidade de uso em deslocamento.
2. **Tipografia Acessível:**
   * Nenhum texto funcional de leitura possui tamanho inferior a **16 px**, eliminando a necessidade de zoom e reduzindo a carga cognitiva de estudantes e professores em trânsito.
3. **Ergonomia da Metade Inferior (*Thumb Zone*):**
   * Todas as ações principais de confirmação, envio de texto, publicação e reserva estão localizadas na metade inferior do viewport (entre 420 px e 800 px na coordenada Y vertical), otimizadas para manuseio confortável com apenas uma mão.
4. **Proteção Contra Erros (Anti-Concorrência):**
   * Em conformidade com RF-15 e RNF-05, requisições de confirmação congelam o botão para evitar múltiplos toques e garantem que apenas a primeira reserva aceita seja confirmada.
