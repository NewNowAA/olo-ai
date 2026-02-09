// ===========================================
// Invoice Types
// ===========================================

export interface InvoiceItem {
    name: string;
    description: string;
    quantity: number;
    price: number;
    vat: number;
}

export type InvoiceType = 'Receita' | 'Despesa';
export type InvoiceStatus = 'Pendente' | 'Pago' | 'Atrasado';
export type ExpenseType = 'Fixo' | 'Flexivel';
export type ReviewStatus = 'Revisado' | 'Não Revisado';

export interface Invoice {
    id: string;
    displayId?: string;
    invoiceNumber?: string;
    client: string;
    type: InvoiceType;
    amount: number;
    status: InvoiceStatus;
    date: string;
    category: string;
    subcategory?: string;
    expense_type?: ExpenseType;
    review_status?: ReviewStatus;
    items?: InvoiceItem[];
    thumbnail?: string;
    fileUrl?: string;
    created_at?: string;
}
