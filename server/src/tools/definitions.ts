// =============================================
// Olo.AI — Tool Definitions (Gemini Function Declarations)
// =============================================

import { SchemaType } from '@google/generative-ai';

// Helper for type references
const S = SchemaType;

export const TOOL_DECLARATIONS = [
  {
    name: 'search_catalog',
    description: 'Pesquisar produtos ou serviços no catálogo do negócio. Usa isto quando o cliente pergunta "que têm?", "ementa", "serviços", ou pesquisa por um item específico.',
    parameters: {
      type: S.OBJECT,
      properties: {
        query: { type: S.STRING, description: 'Termo de pesquisa (ex: "pizza", "corte de cabelo")' },
        category: { type: S.STRING, description: 'Nome da categoria para filtrar (opcional)' },
      },
    },
  },
  {
    name: 'get_product_details',
    description: 'Obter detalhes de um produto ou serviço específico, incluindo preço, descrição, e disponibilidade. Usa quando o cliente pergunta "quanto custa?", ou quer saber mais sobre um item.',
    parameters: {
      type: S.OBJECT,
      properties: {
        product_name: { type: S.STRING, description: 'Nome do produto/serviço' },
      },
      required: ['product_name'],
    },
  },
  {
    name: 'list_categories',
    description: 'Listar todas as categorias de produtos/serviços disponíveis. Usa quando perguntam "que tipos de serviço fazem?" ou "que categorias têm?".',
    parameters: {
      type: S.OBJECT,
      properties: {},
    },
  },
  {
    name: 'check_stock',
    description: 'Verificar se um produto está em stock e a quantidade disponível.',
    parameters: {
      type: S.OBJECT,
      properties: {
        product_name: { type: S.STRING, description: 'Nome do produto a verificar' },
      },
      required: ['product_name'],
    },
  },
  {
    name: 'update_stock',
    description: 'Atualizar a quantidade em stock de um produto. Apenas disponível para o dono do negócio.',
    parameters: {
      type: S.OBJECT,
      properties: {
        product_name: { type: S.STRING, description: 'Nome do produto' },
        new_quantity: { type: S.NUMBER, description: 'Nova quantidade em stock' },
      },
      required: ['product_name', 'new_quantity'],
    },
  },
  {
    name: 'stock_alerts',
    description: 'Listar produtos com stock baixo (abaixo do alerta mínimo). Apenas para o dono do negócio.',
    parameters: {
      type: S.OBJECT,
      properties: {},
    },
  },
  {
    name: 'check_availability',
    description: 'Verificar disponibilidade de horários para marcação/reserva numa data específica.',
    parameters: {
      type: S.OBJECT,
      properties: {
        date: { type: S.STRING, description: 'Data no formato YYYY-MM-DD' },
        service: { type: S.STRING, description: 'Nome do serviço (opcional)' },
      },
      required: ['date'],
    },
  },
  {
    name: 'create_appointment',
    description: 'Criar uma nova marcação/reserva. Confirma com o cliente antes de criar.',
    parameters: {
      type: S.OBJECT,
      properties: {
        date: { type: S.STRING, description: 'Data no formato YYYY-MM-DD' },
        time: { type: S.STRING, description: 'Hora no formato HH:MM' },
        service: { type: S.STRING, description: 'Nome do serviço/tipo de marcação' },
        customer_name: { type: S.STRING, description: 'Nome do cliente' },
        notes: { type: S.STRING, description: 'Observações adicionais' },
      },
      required: ['date', 'time'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancelar uma marcação existente do cliente.',
    parameters: {
      type: S.OBJECT,
      properties: {
        appointment_date: { type: S.STRING, description: 'Data da marcação (YYYY-MM-DD)' },
        appointment_time: { type: S.STRING, description: 'Hora da marcação (HH:MM)' },
      },
      required: ['appointment_date'],
    },
  },
  {
    name: 'list_appointments',
    description: 'Listar marcações/reservas. O dono vê todas, o cliente vê só as suas.',
    parameters: {
      type: S.OBJECT,
      properties: {
        date: { type: S.STRING, description: 'Filtrar por data (YYYY-MM-DD)' },
        status: { type: S.STRING, description: 'Filtrar por status: pending, confirmed, cancelled' },
      },
    },
  },
  {
    name: 'get_business_info',
    description: 'Obter informações sobre o negócio: horário, morada, contacto, métodos de pagamento. Usa quando perguntam "onde ficam?", "a que horas abrem?", "qual o telefone?".',
    parameters: {
      type: S.OBJECT,
      properties: {
        field: { type: S.STRING, description: 'Campo específico: hours, address, phone, payment_methods, all' },
      },
    },
  },
  {
    name: 'transfer_to_human',
    description: 'Transferir a conversa para um humano. Usa quando o cliente pede explicitamente ou quando não consegues resolver o problema.',
    parameters: {
      type: S.OBJECT,
      properties: {
        reason: { type: S.STRING, description: 'Motivo da transferência' },
      },
    },
  },
  {
    name: 'create_order',
    description: 'Criar um pedido/encomenda com itens do catálogo. Confirma os itens e o total com o cliente antes de criar.',
    parameters: {
      type: S.OBJECT,
      properties: {
        items: {
          type: S.ARRAY,
          items: {
            type: S.OBJECT,
            properties: {
              name: { type: S.STRING, description: 'Nome do item' },
              quantity: { type: S.NUMBER, description: 'Quantidade' },
            },
          },
          description: 'Lista de itens do pedido',
        },
        delivery_type: { type: S.STRING, description: 'Tipo: takeaway, delivery, dine_in' },
        notes: { type: S.STRING, description: 'Observações do cliente' },
      },
      required: ['items'],
    },
  },
  {
    name: 'save_customer_info',
    description: 'Guardar informações sobre o cliente (nome, telefone, notas, preferências). Isto acontece automaticamente quando o cliente fornece dados.',
    parameters: {
      type: S.OBJECT,
      properties: {
        name: { type: S.STRING, description: 'Nome do cliente' },
        phone: { type: S.STRING, description: 'Telefone do cliente' },
        email: { type: S.STRING, description: 'Email do cliente' },
        notes: { type: S.STRING, description: 'Notas/preferências sobre o cliente' },
      },
    },
  },
];

// Get tool declarations filtered by allowed tool names
export function getToolDeclarations(allowedTools: string[]) {
  return TOOL_DECLARATIONS.filter(t => allowedTools.includes(t.name));
}
