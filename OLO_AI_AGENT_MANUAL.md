# Olo.AI — Manual do Agente Inteligente

> Documentação técnica e funcional completa do comportamento da IA, ferramentas, fluxos e regras.

---

## 1. Arquitetura Geral

```
CLIENTE (Telegram)
      │
      ▼
telegramRoutes.ts  ──►  processUpdate()
      │
      ▼
assistantEngine.ts  ──►  handleMessage()
      │
      ├─► personaEngine.ts    (construção do system prompt — 3 camadas)
      ├─► supabaseStore.ts    (histórico da conversa, perfil do cliente)
      ├─► policyGuard.ts      (input/output policy, limites)
      │
      ▼
  Gemini 2.0 Flash   ◄──── system prompt + histórico + mensagem atual
      │
      │  (Gemini decide se responde texto ou chama uma tool)
      ▼
 toolExecutor.ts  ──►  executa a tool pedida (Supabase, DB)
      │
      ▼
 Gemini (resultado da tool)  ──►  texto final
      │
      ▼
telegramGateway.ts  ──►  sendMessage() / sendMessageWithButtons()
      │
      ▼
CLIENTE (resposta no Telegram)
```

---

## 2. O Sistema NÃO usa Intents

A IA **NÃO** usa um sistema de intents (como Dialogflow ou RASA).

Usa **Function Calling** (Tool Calling) do Gemini 2.0 Flash:
- O Gemini recebe o system prompt + histórico da conversa + lista de ferramentas disponíveis
- Analisa a mensagem do utilizador em linguagem natural
- Decide **autonomamente** se deve responder com texto ou chamar uma ferramenta
- Se chamar uma ferramenta, o resultado volta para o Gemini, que gera a resposta final

**Vantagem**: não é preciso definir "frases de ativação" para cada ação. O modelo entende contexto natural.

---

## 3. Pipeline Completo de uma Mensagem

Cada mensagem do cliente passa por estas etapas, **por esta ordem**:

```
[1] Chegada da mensagem (Telegram polling ou webhook)
      │
[2] Resolução de Org + Bot Token
      │ (procura org pelo token do bot ativo)
      │
[3] Rate Limiting
      │ (máx. mensagens por minuto por utilizador)
      │
[4] Processamento de Media (se existir)
      │ ├─ Voz → transcrito com Gemini
      │ ├─ Foto → descrita com Gemini Vision
      │ └─ Documento PDF → extraído com Gemini
      │
[5] Deteção de Rating (se mensagem = número 1-5 após serviço)
      │ (guarda satisfação na conversa fechada mais recente)
      │
[6] Resolução de Papel (Role)
      │ ├─ DEV: IDs na tabela dev_telegram_ids
      │ ├─ OWNER: telegram_chat_id da organização
      │ ├─ WORKER: tabela workers (mapeado por telegram_user_id)
      │ └─ CLIENT: todos os outros
      │
[7] Get/Create Customer
      │ (cria ou atualiza registo do cliente na tabela customers)
      │
[8] Typing Indicator
      │ (mostra "a escrever..." no Telegram)
      │
[9] Comando /start
      │ (fecha conversa ativa, retorna saudação — SALTA etapas seguintes)
      │
[10] ═══ assistantEngine.handleMessage() ════
      │
      │ [10a] Input Policy Check
      │       (bloqueia mensagens ofensivas, muito longas, etc.)
      │
      │ [10b] Get or Create Conversation
      │       (identificada por org_id + customer_id + channel + chat_id)
      │
      │ [10c] Guarda mensagem do utilizador no histórico
      │
      │ [10d] Constrói Persona (buildPersona)
      │       └─► 3 camadas de system prompt (ver secção 5)
      │
      │ ┌─── FAST PATHS (respondem sem chamar o Gemini) ───────────────────
      │ │
      │ │ [10e] PRIMEIRO CONTACTO
      │ │       Se histórico tem ≤ 1 mensagem → retorna first_contact_message
      │ │       ⚠️ NÃO verifica horário — cliente recebe sempre resposta
      │ │
      │ │ [10f] HORÁRIO DE FUNCIONAMENTO + INJEÇÃO DE CONTEXTO
      │ │       Verifica se o negócio está aberto agora (Africa/Luanda)
      │ │       Injeta nota no system prompt:
      │ │         - Aberto: "[ESTADO: ABERTO agora (HH:MM). Ignora menções de fechado.]"
      │ │         - Fechado: "[ESTADO: FECHADO agora (HH:MM). Horário: XX–XX.]"
      │ │       Se fechado E role=client → retorna absence_message (SEM chamar Gemini)
      │ │       ⚠️ Mensagem de ausência NÃO é guardada no histórico
      │ │
      │ │ [10g] QUICK REPLIES
      │ │       Verifica trigger words configuradas pelo dono
      │ │       Se match → retorna resposta imediata (SEM chamar Gemini)
      │ │
      │ └──────────────────────────────────────────────────────────────────
      │
      │ [10h] Carrega histórico da conversa (sliding window: 20 msgs)
      │       Formata em alternância user/model para o Gemini
      │
      │ [10i] Configura modelo Gemini com:
      │       ├─ system_instruction = system prompt completo
      │       ├─ tools = tool declarations filtradas por role
      │       ├─ temperature = 0.7
      │       └─ maxOutputTokens = 2048
      │
      │ [10j] LOOP DE TOOL CALLS (máx. 5 por mensagem)
      │       ├─ Gemini responde com texto → FIM DO LOOP
      │       └─ Gemini chama tool → executeTool() → resultado → volta ao Gemini
      │
      │ [10k] Output Policy Check
      │       (filtra conteúdo inadequado na resposta final)
      │
      │ [10l] Guarda resposta do assistente no histórico
      │
[11] Envia resposta ao cliente
      ├─ Com botões inline → sendMessageWithButtons()
      │   ⚠️ Sem parse_mode por padrão (evita erros de Markdown)
      └─ Texto simples → sendMessage() (suporta Markdown v1)
```

---

## 4. Sistema de Ferramentas (Tools)

### 4.1 Como o Gemini decide chamar uma tool

O Gemini recebe as tool declarations com `name`, `description`, e `parameters`. A `description` é **crítica** — é ela que explica ao Gemini quando deve usar cada ferramenta. O modelo analisa a mensagem e o contexto, e chama a ferramenta mais adequada.

**Limites:**
- Máximo **5 tool calls** por mensagem de utilizador
- Se o limite for atingido, o Gemini para e responde com o que tem

### 4.2 Todas as Ferramentas (18 total)

#### 🛍️ CATÁLOGO

| Tool | Quando usar | Parâmetros |
|------|-------------|------------|
| `search_catalog` | Quando o cliente pergunta "que têm?", "ementa", "serviços", procura um item específico. **Usar SEMPRE antes de dizer que não tem um produto.** | `query`, `category` (opcional) |
| `get_product_details` | Quando o cliente pergunta "quanto custa?", quer detalhes de um item específico | `product_name` (obrigatório) |
| `list_categories` | Quando perguntam "que tipos de serviço fazem?" ou "que categorias têm?" | — |

#### 📦 STOCK

| Tool | Quando usar | Quem pode usar | Parâmetros |
|------|-------------|----------------|------------|
| `check_stock` | Verificar se um produto está disponível e em que quantidade | Todos (clientes veem disponível/indisponível; owner vê quantidade exata) | `product_name` |
| `update_stock` | Atualizar quantidade de stock | Owner, Dev | `product_name`, `new_quantity` |
| `stock_alerts` | Listar produtos com stock abaixo do mínimo | Owner, Dev | — |

#### 📅 MARCAÇÕES

| Tool | Quando usar | Parâmetros |
|------|-------------|------------|
| `check_availability` | Antes de criar marcação; quando cliente pergunta "têm disponibilidade para...?" | `date` (YYYY-MM-DD), `service` (opcional) |
| `create_appointment` | Criar marcação de serviço com hora marcada (consulta, corte de cabelo, etc.). **Confirmar com cliente antes.** | `date`, `time`, `service`, `customer_name`, `notes` |
| `cancel_appointment` | Cancelar marcação existente | `appointment_date`, `appointment_time` (opcional) |
| `list_appointments` | Ver lista de marcações | Owner vê todas; cliente vê só as suas | `date`, `status` (opcional) |

> ⚠️ **IMPORTANTE — `create_appointment` vs `create_order`:**
> - `create_appointment` = serviço com hora marcada (consulta, corte de cabelo, reserva de mesa com hora)
> - `create_order` = produto/medicamento para levantar/entregar (sem hora específica de serviço)
> - Numa farmácia, "reservar Bissolvon" → `create_order`
> - Numa clínica, "marcar consulta para sexta" → `create_appointment`

#### 🛒 PEDIDOS / ENCOMENDAS

| Tool | Quando usar | Parâmetros |
|------|-------------|------------|
| `create_order` | Quando cliente quer reservar/encomendar/comprar um produto do catálogo. **Confirmar com cliente antes.** Retorna botões ✅ Confirmar / ❌ Cancelar | `items[]` (name + quantity), `delivery_type` (takeaway/delivery/dine_in), `notes` |

**Fluxo de `create_order`:**
1. Gemini chama a tool com os items
2. Tool pesquisa cada item no catálogo (`search_catalog` interno)
3. Calcula total (preço × quantidade)
4. Insere na tabela `olo_orders` + `olo_order_items`
5. Notifica o dono (fire-and-forget via Telegram)
6. Retorna botões inline: `confirm_order|{id}` e `cancel_order|{id}`
7. Quando cliente carrega no botão → `processCallbackQuery` → Gemini processa `[O utilizador clicou no botão: confirm_order|{id}]`

#### ℹ️ INFORMAÇÕES DO NEGÓCIO

| Tool | Quando usar | Parâmetros |
|------|-------------|------------|
| `get_business_info` | Quando perguntam horário, morada, telefone, métodos de pagamento. **NUNCA responder de memória — usar sempre esta tool.** | `field`: hours / address / phone / payment_methods / all |

#### 👥 HANDOFF E RECLAMAÇÕES

| Tool | Quando usar | Parâmetros |
|------|-------------|------------|
| `transfer_to_human` | Quando cliente pede explicitamente falar com humano, ou quando a IA não consegue resolver | `reason` |
| `save_customer_info` | Quando cliente fornece o seu nome, telefone, email, ou preferências. Acontece automaticamente. | `name`, `phone`, `email`, `notes` |
| `file_complaint` | Quando cliente expressa insatisfação, reporta problema, ou quer fazer reclamação formal | `subject` (obrigatório), `details` |

#### 👷 PONTO ELETRÓNICO (Colaboradores)

| Tool | Quando usar | Parâmetros |
|------|-------------|------------|
| `worker_checkin` | Quando colaborador diz "cheguei", "entrada", "iniciar turno", "bom dia a trabalhar" | — |
| `worker_checkout` | Quando colaborador diz "saí", "saída", "fim de turno", "vou embora" | `notes` (opcional) |
| `get_my_schedule` | Quando colaborador pergunta "quantas horas trabalhei?", "ver meu ponto" | `days` (padrão 7, máx 30) |

---

## 5. Sistema de Persona (3 Camadas)

O system prompt final é construído por `personaEngine.ts` em 3 camadas:

```
CAMADA 1 — BASE (sempre igual para todos)
  ├─ Regras fundamentais: português, não inventar dados
  ├─ Quando usar create_order vs create_appointment
  ├─ Usar sempre get_business_info para horários/morada
  └─ Limites: 5 tools, 20 msgs, sem código, sem dados sensíveis

  +

CAMADA 2 — PAPEL (role do utilizador)
  ├─ CLIENT: atendente amigável, sem IDs, sem configurações
  ├─ OWNER: assistente de gestão, pode ver KPIs e configurar
  ├─ WORKER: ponto eletrónico + permissões definidas pelo dono
  └─ DEV: acesso técnico completo, dados raw, UUIDs visíveis

  +

CAMADA 3 — SETOR (tipo de negócio)
  ├─ farmacia: profissional, create_order para produtos
  ├─ restaurante: caloroso, ementa, reservas e take-away
  ├─ clinica: empático, NUNCA diagnósticos
  ├─ salao: entusiasta, marcações de beleza
  ├─ hotel: elegante, reservas e concierge
  ├─ academia: motivador, planos e inscrições
  ├─ advogado: formal, NUNCA aconselhamento jurídico
  ├─ oficina: prático, diagnósticos e marcações
  ├─ loja: orientado para vendas, pedidos
  └─ generico: adapta-se, todas as tools disponíveis

  +

CAMADA DINÂMICA (adicionada em runtime por assistantEngine)
  ├─ [ESTADO DO NEGÓCIO: ABERTO/FECHADO agora (HH:MM)]
  ├─ Contexto do cliente (nome, notas, total de conversas)
  ├─ Contexto do colaborador (permissões)
  ├─ Data/hora atual (Africa/Luanda)
  ├─ Info do negócio (nome, setor, morada, telefone)
  └─ Custom prompt do dono (se configurado)
```

---

## 6. Controlo de Acesso por Papel

### Quais tools cada papel pode usar:

| Tool | CLIENT | OWNER | WORKER | DEV |
|------|:------:|:-----:|:------:|:---:|
| search_catalog | ✅ | ✅ | 🔒 (se perm.) | ✅ |
| get_product_details | ✅ | ✅ | 🔒 (se perm.) | ✅ |
| list_categories | ✅ | ✅ | 🔒 (se perm.) | ✅ |
| check_stock | ✅* | ✅ | 🔒 (se perm.) | ✅ |
| update_stock | ❌ | ✅ | ❌ | ✅ |
| stock_alerts | ❌ | ✅ | ❌ | ✅ |
| check_availability | ✅ | ✅ | 🔒 (se perm.) | ✅ |
| create_appointment | ✅ | ✅ | ❌ | ✅ |
| cancel_appointment | ✅ | ✅ | ❌ | ✅ |
| list_appointments | ❌ | ✅ | 🔒 (se perm.) | ✅ |
| get_business_info | ✅ | ✅ | ✅ | ✅ |
| create_order | ✅ | ✅ | ❌ | ✅ |
| transfer_to_human | ✅ | ✅ | ❌ | ✅ |
| save_customer_info | ✅ | ✅ | 🔒 (se perm.) | ✅ |
| file_complaint | ✅ | ✅ | ❌ | ✅ |
| worker_checkin | ❌ | ❌ | ✅ | ✅ |
| worker_checkout | ❌ | ❌ | ✅ | ✅ |
| get_my_schedule | ❌ | ❌ | ✅ | ✅ |

> *`check_stock` para clientes: mostra "disponível / esgotado", nunca a quantidade exata.

> 🔒 = depende das permissões configuradas pelo dono para esse colaborador específico.

---

## 7. Gestão do Histórico de Conversas

- **Máximo de contexto**: 20 mensagens (sliding window — descarta as mais antigas)
- **Formato para Gemini**: alternância estrita `user → model → user → model`
  - Mensagens consecutivas do mesmo papel são **fundidas** numa só
- **O que é guardado**: mensagens `user` e `assistant` com `content`, `role`, `tool_calls`, `tokens_used`
- **O que NÃO é guardado**: mensagens de ausência ("Estamos fechados") — evita poluição do contexto quando o negócio reabre

### Convenção `day_of_week` na DB:
- **business_hours**: `0=Sunday, 1=Monday, ..., 6=Saturday` (igual ao JS `Date.getDay()`)
- `assistantEngine.ts` usa `getDay()` diretamente ✅
- `appointments.ts` converte incorretamente (bug conhecido — veja secção 8)

---

## 8. Bugs Conhecidos e Fixes Aplicados

### ✅ Corrigidos

| Bug | Causa | Fix |
|-----|-------|-----|
| Bot silent depois de criar pedido | `sendMessageWithButtons` com `**texto**` (Markdown v2) → Telegram rejeita → retry chama a si mesmo com `undefined\|\|'Markdown'` = infinito | Só inclui `parse_mode` quando explicitamente fornecido; retry passa `{}` |
| Bot a responder com token errado | `processCallbackQuery` usava `process.env.TELEGRAM_BOT_TOKEN` em vez de `org.telegram_bot_token` | Depois de resolver org, sobrepõe sempre com `org.telegram_bot_token` |
| "Estamos fechados" wrong day | `assistantEngine` convertia `getDay()===0 ? 6 : getDay()-1` (0=Monday), mas DB usa 0=Sunday | Usa `getDay()` diretamente |
| Stale "Estamos fechados" no histórico | Mensagem de ausência era guardada → IA continuava a dizer "fechado" no dia seguinte | Ausência não é guardada; estado real injetado no system prompt |
| Crash no registo (`crypto is not defined`) | Node.js 18 não expõe `crypto` como global | `import { randomUUID } from 'crypto'` |
| Railway 502 | Domínio Railway apontava para porta 3001, servidor escutava 8080 | Configurado porto 8080 nas settings do Railway |
| Deploys falhavam (npm erro) | Railway não instalava devDependencies (`@types/express`) → `tsc` falhava | `railway.json` com `npm install --include=dev` |

### ⚠️ Bug Conhecido (não corrigido)

| Bug | Localização | Descrição |
|-----|-------------|-----------|
| `day_of_week` incorreto em `check_availability` | `server/src/tools/appointments.ts:35` | Converte `jsDay===0 ? 6 : jsDay-1` assumindo DB 0=Monday, mas DB usa 0=Sunday. Em resultado, `check_availability` retorna disponibilidade errada ao Domingo. |

**Fix a aplicar em `appointments.ts`:**
```typescript
// ANTES (errado):
const dbDay = jsDay === 0 ? 6 : jsDay - 1;
// DEPOIS (correto — DB usa 0=Sunday igual ao JS):
const dbDay = jsDay;
```

---

## 9. Por que a IA Às Vezes Não Executa a Ação?

### Razão 1: Produto não existe no catálogo
`create_order` e `create_appointment` pesquisam o catálogo internamente. Se o produto/serviço não existir, retornam `success: false`. O Gemini recebe o erro e responde ao cliente — mas se a resposta de erro também falhar (ex: Markdown inválido), o cliente não vê nada.

**Solução**: Manter o catálogo atualizado. Após criar uma nova organização, adicionar produtos/serviços antes de testar o bot.

### Razão 2: Negócio marcado como fechado
Se o negócio está fechado no horário da mensagem, clientes recebem a mensagem de ausência e o Gemini nunca é chamado. Nenhuma ação é executada.

**Solução**: Configurar os horários de funcionamento corretamente no dashboard.

### Razão 3: Limite de tool calls atingido (5/mensagem)
Se o Gemini precisar de muitas chamadas (ex: pesquisar catálogo + verificar stock + criar pedido + salvar cliente = 4 calls), a 5ª chamada é bloqueada. Raro, mas possível em pedidos complexos.

### Razão 4: Timeout da API Gemini
O Gemini pode demorar mais tempo em respostas complexas. Não existe timeout configurado atualmente — se o Gemini não responder, o bot fica em espera.

**Fix sugerido** (ainda não aplicado):
```typescript
const response = await Promise.race([
  chat.sendMessage(actualMessage),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Gemini timeout')), 30000)
  )
]);
```

### Razão 5: Bot token não encontrado
Em modo polling, se o `process.env.TELEGRAM_BOT_TOKEN` está vazio e a query de fallback falha, o `botToken` fica undefined. O `sendMessage` falha silenciosamente (o erro é apanhado mas o catch não consegue enviar resposta).

---

## 10. Configuração Necessária por Setor

### Mínimo necessário para o bot funcionar:

| Campo | Onde configurar | Porquê |
|-------|-----------------|--------|
| `business_name` | Agente → Info | Aparece em todas as respostas |
| `sector` | Registo | Define as tools disponíveis e o tom |
| Horários de funcionamento | Dashboard → Horários | Sem isto, o bot diz SEMPRE "estamos fechados" |
| ≥ 1 produto/serviço no catálogo | Dashboard → Catálogo | `create_order` e `search_catalog` precisam de catálogo |
| `telegram_bot_token` | Dashboard → Configurações | Para o bot funcionar |

### Opcional mas recomendado:

| Campo | Impacto |
|-------|---------|
| `agent_name` | Nome do atendente virtual |
| `agent_tone` | amigavel / intermedio / profissional |
| `agent_system_prompt` | Instruções específicas do dono (camada 3) |
| `absence_message` | Mensagem personalizada fora de horas |
| `first_contact_message` | Primeira mensagem enviada a novos clientes |
| `address`, `phone` | Necessários para `get_business_info` retornar dados corretos |
| Quick Replies | Atalhos para perguntas frequentes (sem chamar o Gemini) |

---

## 11. Fluxo Completo de uma Reserva de Produto (Farmácia)

```
Cliente: "Quero reservar 1 Bissolvon para levantar hoje"
      │
[Fast Path: primeiro contacto?] → NÃO (já há histórico)
[Fast Path: negócio fechado?]   → NÃO (está aberto)
[Fast Path: quick reply?]       → NÃO
      │
Gemini recebe: mensagem + system prompt (farmácia) + histórico
      │
Gemini chama: search_catalog({ query: "bissolvon" })
      │
Tool retorna: { items: [{ name: "Bissolvon 500mg", price: 1500, stock: 10 }] }
      │
Gemini chama: create_order({ items: [{ name: "Bissolvon", quantity: 1 }], delivery_type: "takeaway" })
      │
Tool: pesquisa catálogo internamente → encontra Bissolvon 500mg
Tool: calcula total = 1 × 1500 = 1500 AOA
Tool: insere em olo_orders + olo_order_items
Tool: notifica dono (fire-and-forget)
Tool retorna: { success: true, order_id: "xxx", total: 1500, inline_buttons: [...] }
      │
Gemini gera texto: "✅ Reservei 1x Bissolvon 500mg para levantar na loja. Total: 1.500 AOA"
      │
sendMessageWithButtons() → cliente recebe mensagem + botões [✅ Confirmar | ❌ Cancelar]
      │
Cliente carrega ✅ Confirmar
      │
processCallbackQuery() → resolve org + token
Gemini recebe: "[O utilizador clicou no botão: confirm_order|{id}]"
Gemini responde: "Perfeito! O teu pedido foi confirmado. Podes levantar quando quiseres no nosso horário."
```

---

## 12. Fluxo Completo de uma Marcação de Serviço (Clínica/Salão)

```
Cliente: "Quero marcar consulta para amanhã de manhã"
      │
Gemini chama: check_availability({ date: "2026-03-26", service: "consulta" })
      │
Tool retorna: { available_slots: ["09:00", "10:00", "11:00"] }
      │
Gemini: "Amanhã temos disponibilidade às 09:00, 10:00 e 11:00. Que hora preferes?"
      │
Cliente: "às 10"
      │
Gemini chama: create_appointment({ date: "2026-03-26", time: "10:00", service: "consulta" })
      │
Tool: verifica sobreposição de horários
Tool: insere em appointments com status "pending"
Tool: notifica dono
Tool retorna: { success: true, inline_buttons: [{ text: "❌ Cancelar pedido", callback_data: "cancel_appointment|{id}" }] }
      │
Gemini: "✅ Pedido de marcação enviado para 26/03 às 10:00. Aguarda confirmação do negócio."
```

---

## 13. Convenções Técnicas Importantes

| Aspeto | Valor |
|--------|-------|
| Modelo AI | `gemini-2.0-flash` |
| Temperatura | `0.7` |
| Max tokens output | `2048` |
| Max tool calls / mensagem | `5` |
| Max mensagens de contexto | `20` (sliding window) |
| Timezone do bot | `Africa/Luanda` (UTC+1) |
| `day_of_week` na DB | `0=Sunday, 1=Monday, ..., 6=Saturday` |
| Formato data nos tools | `YYYY-MM-DD` |
| Formato hora nos tools | `HH:MM` |
| Moeda | `AOA` (Kwanza Angolano) |
| Idioma | Português (com expressões angolanas) |
| Telegram Markdown | v1 (sem `**bold**`, usar `*bold*` ou sem formatação) |

---

## 14. Estrutura da Base de Dados (Tabelas Relevantes)

| Tabela | Uso |
|--------|-----|
| `organizations` | Org + config do bot (token, nome, setor, prompts) |
| `profiles` | Utilizadores do dashboard (owner/dev/client) |
| `customers` | Clientes atendidos pelo bot (por telegram_user_id) |
| `conversations` | Sessões de conversa (por customer + channel) |
| `messages` | Histórico de mensagens de cada conversa |
| `catalog_items` | Produtos e serviços da org |
| `appointments` | Marcações de serviço (com data/hora) |
| `olo_orders` | Pedidos de produtos |
| `olo_order_items` | Itens de cada pedido |
| `business_hours` | Horários por dia da semana |
| `quick_replies` | Respostas rápidas configuradas |
| `workers` | Colaboradores e suas permissões |
| `worker_time_logs` | Registos de entrada/saída |
| `complaints` | Reclamações registadas |
| `stock_reservations` | Reservas de stock associadas a pedidos |
