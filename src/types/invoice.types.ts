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
    processing_status?: ProcessingStatus;
    ai_metadata?: AiMetadata;
    nif?: string;
    hash?: string;
}

export type ProcessingStatus = 'idle' | 'processing' | 'needs_review' | 'completed' | 'failed';

export interface AiMetadata {
    confidence: number;
    provider: string; // e.g. 'gemini-1.5-flash'
    flagged_fields: string[];
    error_message?: string;
    ocr_raw_text?: string;
}
