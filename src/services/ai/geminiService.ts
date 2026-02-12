// ===========================================
// Gemini AI Service (via n8n Webhooks)
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
        if (!N8N_WEBHOOK_URL) {
            throw new Error('VITE_N8N_WEBHOOK_URL not configured');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);

        try {
            const response = await fetch(`${N8N_WEBHOOK_URL}/process-invoice`, {
                method: 'POST',
                body: formData, // Content-Type is set automatically for FormData
            });

            if (!response.ok) {
                throw new Error(`n8n error: ${response.statusText}`);
            }

            const data = await response.json();
            return {
                success: true,
                invoiceId: data.invoiceId,
                message: data.message
            };
        } catch (error) {
            console.error('Invoice Processing Error:', error);
            return {
                success: false,
                message: "Falha ao iniciar processamento."
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

    async analyzeGoals(goalsData: string): Promise<string> {
        return this.sendMessageToN8n(`Analise estas metas: ${goalsData}`);
    },

    async generateDailyAnalysis(invoices: any[]): Promise<string> {
        return this.sendMessageToN8n(`Gere uma análise diária para: ${JSON.stringify(invoices).slice(0, 1000)}...`);
    }
};

export default geminiService;
