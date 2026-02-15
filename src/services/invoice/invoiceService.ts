import { supabase } from '../supabase';
import { Invoice, InvoiceItem, InvoiceType, InvoiceStatus } from '../../types/invoice.types';

// Map DB Invoice to Frontend Invoice
const mapInvoice = (dbInvoice: any): Invoice => ({
    id: dbInvoice.id,
    displayId: dbInvoice.invoice_number || dbInvoice.id.slice(0, 8).toUpperCase(),
    client: dbInvoice.vendor_name || 'Desconhecido',
    type: (dbInvoice.expense_or_income === 'Receita' ? 'Receita' : 'Despesa') as InvoiceType,
    amount: parseFloat(dbInvoice.total_amount) || 0,
    status: (dbInvoice.status || 'Pendente') as InvoiceStatus,
    date: dbInvoice.issue_date || dbInvoice.created_at?.split('T')[0],
    category: dbInvoice.category || 'Geral',
    subcategory: dbInvoice.subcategory,
    expense_type: dbInvoice.expense_type,
    review_status: dbInvoice.review_status,
    invoiceNumber: dbInvoice.invoice_number,
    created_at: dbInvoice.created_at,
    // Add fileUrl if present in DB
    fileUrl: dbInvoice.file_url,
    processing_status: dbInvoice.processing_status, // CRITICAL FIX: Map this field!
    items: dbInvoice.invoice_products?.map((p: any) => ({
        name: p.description,
        description: p.description,
        quantity: parseFloat(p.quantity) || 0,
        price: parseFloat(p.unit_price) || 0,
        vat: parseFloat(p.tax_amount) || 0
    })) || []
});

export const invoiceService = {
    async getInvoices() {
        const { data, error } = await supabase
            .from('invoices')
            .select(`
                *,
                invoice_products (*)
            `)
            .order('issue_date', { ascending: false });

        if (error) throw error;
        return data.map(mapInvoice);
    },

    async getInvoiceById(id: string): Promise<Invoice | null> {
        const { data, error } = await supabase
            .from('invoices')
            .select(`
                *,
                invoice_products (*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching invoice:', error);
            return null;
        }
        return data ? mapInvoice(data) : null;
    },

    async createInvoice(invoice: Partial<Invoice>, file?: File) {
        let fileUrl = null;

        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('faturas')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('faturas')
                .getPublicUrl(fileName);

            fileUrl = publicUrl;
        }

        const user = (await supabase.auth.getUser()).data.user;

        const invoiceData = {
            vendor_name: invoice.client,
            total_amount: invoice.amount,
            status: invoice.status,
            issue_date: invoice.date,
            category: invoice.category,
            subcategory: invoice.subcategory,
            expense_or_income: invoice.type,
            expense_type: invoice.expense_type,
            review_status: invoice.review_status,
            file_url: fileUrl,
            invoice_number: invoice.id?.startsWith('INV') ? invoice.id : `INV-${Date.now()}`,
            currency: 'AOA',
            user_id: user?.id
        };

        const { data: newInvoice, error: invError } = await supabase
            .from('invoices')
            .insert(invoiceData)
            .select()
            .single();

        if (invError) throw invError;

        if (invoice.items && invoice.items.length > 0) {
            const itemsData = invoice.items.map(item => ({
                invoice_id: newInvoice.id,
                description: item.name,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.quantity * item.price,
                tax_amount: item.vat
            }));

            const { error: itemsError } = await supabase
                .from('invoice_products')
                .insert(itemsData);

            if (itemsError) throw itemsError;
        }

        return newInvoice;
    },

    async updateInvoice(id: string, updates: Partial<Invoice>) {
        // Map updates to DB columns
        const dbUpdates: any = {};
        if (updates.client) dbUpdates.vendor_name = updates.client;
        if (updates.amount) dbUpdates.total_amount = updates.amount;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.date) dbUpdates.issue_date = updates.date;
        if (updates.category) dbUpdates.category = updates.category;
        if (updates.subcategory) dbUpdates.subcategory = updates.subcategory;
        if (updates.expense_type) dbUpdates.expense_type = updates.expense_type;
        if (updates.review_status) dbUpdates.review_status = updates.review_status;
        if (updates.type) dbUpdates.expense_or_income = updates.type;
        if (updates.fileUrl) dbUpdates.file_url = updates.fileUrl; // Allow updating file URL

        const { error } = await supabase
            .from('invoices')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;

        // Handle items update: Delete existing and re-insert
        if (updates.items) {
            const { error: deleteError } = await supabase
                .from('invoice_products')
                .delete()
                .eq('invoice_id', id);

            if (deleteError) throw deleteError;

            if (updates.items.length > 0) {
                const itemsData = updates.items.map(item => ({
                    invoice_id: id,
                    description: item.name,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.quantity * item.price,
                    tax_amount: item.vat
                }));

                const { error: insertError } = await supabase
                    .from('invoice_products')
                    .insert(itemsData);

                if (insertError) throw insertError;
            }
        }
    },

    async deleteInvoice(id: string) {
        // Delete items first (cascade usually handles this, but to be safe)
        const { error: itemsError } = await supabase
            .from('invoice_products')
            .delete()
            .eq('invoice_id', id);

        if (itemsError) console.warn('Error deleting items:', itemsError);

        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
