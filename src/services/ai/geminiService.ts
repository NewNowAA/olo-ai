import { GoogleGenAI } from "@google/genai";

// ===========================================
// Gemini AI Service
// ===========================================

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

/**
 * Service for interacting with Google Gemini AI
 */
export const geminiService = {
    /**
     * Generate content using Gemini AI
     */
    async generateContent(
        prompt: string,
        systemInstruction?: string
    ): Promise<string> {
        if (!API_KEY) {
            throw new Error('Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.');
        }

        try {
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: prompt,
                config: systemInstruction ? { systemInstruction } : undefined,
            });

            return response.text || 'Não foi possível gerar uma resposta.';
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    },

    /**
     * Generate financial assistant response
     */
    async askFinancialAssistant(question: string): Promise<string> {
        const systemInstruction = `
      Você é Lumea, uma assistente financeira corporativa inteligente, útil e concisa.
      Você ajuda com análise de dados, previsões de fluxo de caixa e gestão de faturas.
      Responda sempre em português de forma profissional e objetiva.
    `.trim();

        return this.generateContent(question, systemInstruction);
    },

    /**
     * Generate goal analysis
     */
    async analyzeGoals(goalsData: string): Promise<string> {
        const systemInstruction = `
      Você é um analista financeiro especializado em metas empresariais.
      Analise os dados fornecidos e forneça insights acionáveis.
      Seja conciso e objetivo. Responda em português.
    `.trim();

        return this.generateContent(goalsData, systemInstruction);
    },
};

export default geminiService;
