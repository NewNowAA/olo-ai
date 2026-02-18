import { z } from 'zod';

// --- Invoice Schemas ---

export const invoiceItemSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().min(0, 'Quantidade deve ser positiva'),
  price: z.number().min(0, 'Preço unitário deve ser positivo'),
  vat: z.number().optional(),
});

export const invoiceSchema = z.object({
  client: z.string().min(1, 'Nome do cliente/fornecedor é obrigatório'),
  amount: z.number().min(0, 'Valor total deve ser positivo'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data inválida',
  }),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  type: z.enum(['Receita', 'Despesa']).optional(),
  status: z.enum(['Pendente', 'Pago', 'Atrasado']).optional(),
  expense_type: z.enum(['Fixo', 'Flexivel']).optional(),
  review_status: z.enum(['Revisado', 'Não Revisado']).optional(),
  items: z.array(invoiceItemSchema).optional(),
  fileUrl: z.string().optional(),
  nif: z.string().optional(),
  hash: z.string().optional(),
});

// --- Goal Schemas ---

export const goalSchema = z.object({
  title: z.string().min(1, 'Título da meta é obrigatório'),
  target_value: z.number().min(0.01, 'Valor alvo deve ser maior que zero'),
  current_value: z.number().optional().default(0),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Data limite inválida',
  }),
  start_date: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Data de início inválida',
  }),
  category: z.string().optional(),
  type: z.enum(['Individual', 'Conjunta']).optional(),
  kpi: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

export type InvoiceSchemaType = z.infer<typeof invoiceSchema>;
export type GoalSchemaType = z.infer<typeof goalSchema>;
