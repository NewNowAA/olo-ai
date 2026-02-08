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
export type InvoiceStatus = 'Pago' | 'Pendente' | 'Atrasado';

export interface Invoice {
    id: string;
    client: string;
    type: InvoiceType;
    amount: number;
    status: InvoiceStatus;
    date: string;
    category: string;
    subcategory?: string;
    items?: InvoiceItem[];
    thumbnail?: string;
}
