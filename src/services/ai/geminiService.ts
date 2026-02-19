import { supabase } from '../index';

// ===========================================
// Gemini AI Service (Edge Functions)
// ===========================================

/**
 * Service for interacting with AI via Supabase Edge Functions
 * Replaces legacy n8n workflows
 */
export const geminiService = {
    /**
     * @deprecated Use askConsultant instead
     */
    async sendMessageToN8n(message: string): Promise<string> {
        console.warn('Deprecated: sendMessageToN8n called. Redirecting to Edge Function.');
        return this.askConsultant(message, []);
    },

    /**
     * Start invoice processing workflow
     */
    async processInvoice(file: File, userId: string): Promise<{ success: boolean; invoiceId?: string; message?: string }> {
        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('faturas')
                .upload(fileName, file);

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

            // 2. Invoke Edge Function
            const { data, error: functionError } = await supabase.functions.invoke('process-invoice', {
                body: { file_path: fileName }
            });

            // Handle Network/System Errors (500s that crash before our catch block)
            if (functionError) {
                console.error('Edge Function System Error:', functionError);
                throw new Error(`System Error: ${functionError.message}`);
            }

            // Handle "Soft Errors" (Application logic errors returned as 200 OK with success: false)
            if (data && !data.success) {
                console.error('AI Processing Logic Error:', data);
                throw new Error(`AI Error: ${data.error || 'Unknown error'}`);
            }

            return {
                success: true,
                invoiceId: data.invoice.id,
                message: "Processamento iniciado com sucesso."
            };

        } catch (error: any) {
            console.error('Invoice Processing Error:', error);
            return {
                success: false,
                message: error.message || "Falha ao iniciar processamento."
            };
        }
    },

    // Legacy methods kept for backward compatibility until fully migrated
    
    async generateContent(prompt: string): Promise<string> {
        return this.askConsultant(prompt, []);
    },

    async askFinancialAssistant(question: string): Promise<string> {
        return this.askConsultant(question, []);
    },

    /**
     * Send message to the AI Consultant Edge Function
     * Fetches invoice context server-side and returns context-aware advice
     */
    async askConsultant(message: string, history: { sender: string; text: string }[]): Promise<string> {
        try {
            const { data, error } = await supabase.functions.invoke('ai-consultant', {
                body: { action: 'chat', message, history }
            });

            if (error) {
                console.error('AI Consultant Edge Function Error:', error);
                throw new Error(error.message || 'Erro na função de IA');
            }

            if (data && data.success) {
                return data.response;
            }

            throw new Error(data?.error || 'Resposta inesperada da IA');
        } catch (error: any) {
            console.error('AI Consultant Error:', error);
            return `Desculpe, não consegui processar o seu pedido. ${error.message || 'Tente novamente.'}`;
        }
    },

    async analyzeGoals(goalsData: string): Promise<string> {
        return this.askConsultant(`Analise estas metas: ${goalsData}`, []);
    },

    async generateDailyAnalysis(invoices: any[]): Promise<string> {
        // We ignore the passed 'invoices' array because the Edge Function fetches fresh data securely
        const { data, error } = await supabase.functions.invoke('ai-consultant', {
            body: { action: 'daily_analysis' }
        });

        if (error) {
            console.error('Daily Analysis Edge Function Error:', error);
            throw new Error(error.message);
        }

        if (data && data.success) {
            return data.response;
        }

        throw new Error(data?.error || 'Falha ao gerar análise');
    }
};

export default geminiService;
