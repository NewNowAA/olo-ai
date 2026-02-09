import { supabase } from '../supabase';
import { geminiService } from './geminiService';
import { invoiceService } from '../invoice/invoiceService';

export const analyticsService = {
    async getDailyAnalysis(): Promise<string> {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) return '';

            const today = new Date().toISOString().split('T')[0];

            // 1. Check if analysis already exists for today
            const { data: existing } = await supabase
                .from('daily_analytics')
                .select('analysis_text')
                .eq('user_id', user.id)
                .eq('date', today)
                .maybeSingle();

            if (existing) {
                return existing.analysis_text;
            }

            // 2. If not, fetch data and generate
            const invoices = await invoiceService.getInvoices();
            // Get last 30 items for context
            const recentInvoices = invoices.slice(0, 30);

            if (recentInvoices.length === 0) {
                return "Ainda não há dados suficientes para uma análise diária. Adicione faturas para começar.";
            }

            const analysis = await geminiService.generateDailyAnalysis(recentInvoices);

            // 3. Save to DB
            const { error } = await supabase.from('daily_analytics').insert({
                user_id: user.id,
                date: today,
                analysis_text: analysis
            });

            if (error) {
                console.error("Error saving analytics:", error);
                // Return generated even if save fails
            }

            return analysis;
        } catch (error) {
            console.error('Analytics Service Error:', error);
            return "Não foi possível gerar a análise diária no momento.";
        }
    }
};
