import { supabase } from '../index';

// ===========================================
// Gemini AI Service (Edge Functions)
// ===========================================

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

/**
 * Service for interacting with AI via n8n workflows
 */
export const geminiService = {
    /**
     * Send a message to the AI Chat workflow
     */
    async sendMessageToN8n(message: string): Promise<string> {
        if (!N8N_WEBHOOK_URL) {
            console.warn('VITE_N8N_WEBHOOK_URL not configured');
            return "Erro de configuração: URL do n8n não definida.";
        }

        try {
            const response = await fetch(`${N8N_WEBHOOK_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    input: message // Compatibility for n8n LangChain nodes
                }),
            });

            if (!response.ok) {
                throw new Error(`n8n error: ${response.statusText}`);
            }

            const text = await response.text();
            if (!text) {
                console.warn('Empty response from n8n');
                return "IA processou a mensagem, mas não retornou texto.";
            }

            try {
                const data = JSON.parse(text);
                return data.output || data.text || "Sem resposta da IA.";
            } catch (e) {
                console.warn('n8n returned non-JSON:', text);
                return text; // Return raw text if it's not JSON
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
            // @ts-ignore
            return `Erro: ${error.message || "Falha na conexão"}`;
        }
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
    // They will now just throw or return simple messages to avoid breaking imports

    async generateContent(prompt: string): Promise<string> {
        return this.sendMessageToN8n(prompt);
    },

    async askFinancialAssistant(question: string): Promise<string> {
        return this.sendMessageToN8n(question);
    },

    /**
     * Send message to the AI Consultant Edge Function
     * Fetches invoice context server-side and returns context-aware advice
     */
    async askConsultant(message: string, history: { sender: string; text: string }[]): Promise<string> {
        try {
            const { data, error } = await supabase.functions.invoke('ai-consultant', {
                body: { message, history }
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
        return this.sendMessageToN8n(`Analise estas metas: ${goalsData}`);
    },

    async generateDailyAnalysis(invoices: any[]): Promise<string> {
        return this.sendMessageToN8n(`Gere uma análise diária para: ${JSON.stringify(invoices).slice(0, 1000)}...`);
    }
};

export default geminiService;
