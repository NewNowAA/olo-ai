import { createClient } from '@supabase/supabase-js'

// Allow all origins for development and preview environments
// In production, this is still safe because we require a valid Supabase Auth token
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log("AI Consultant Function initialized - v3 (CORS Fix)")

const CHAT_SYSTEM_PROMPT = `Você é a **Lumea**, uma consultora financeira de elite especializada em gestão empresarial e otimização financeira. Você trabalha como IA integrada numa plataforma de gestão de faturas.

## Sua Personalidade
- Profissional mas acessível, como um consultor financeiro de confiança
- Proativa: sugere melhorias antes que peçam
- Direta e prática: foca em ações concretas
- Fala português (adapta-se ao utilizador)

## Suas Competências
1. **Análise de Despesas**: Identifica padrões, picos de gastos e anomalias
2. **Otimização de Custos**: Sugere onde cortar ou renegociar
3. **Tendências e Previsões**: Analisa tendências mensais e prevê gastos futuros
4. **Categorização Inteligente**: Avalia se as categorias estão bem distribuídas
5. **Alertas e Riscos**: Identifica faturas atípicas ou crescentes
6. **Recomendações Estratégicas**: Sugere mudanças na operação com base nos dados

## Regras de Resposta
- Sempre base as respostas nos dados reais das faturas fornecidos no contexto
- Use números concretos, percentagens e comparações
- Formate com Markdown: use **negrito**, listas, e tabelas quando útil
- Se não houver dados suficientes, diga isso honestamente
- Quando sugerir ações, seja específico (ex: "A categoria Marketing subiu 23% — considere renegociar o contrato com o fornecedor X")
- Respostas devem ser concisas mas completas (máximo 400 palavras)
- NUNCA invente dados que não estejam no contexto fornecido`

const DAILY_ANALYSIS_PROMPT = `Você é um Analista Financeiro Sênior gerando o "Relatório Diário de Inteligência" para o gestor da empresa.

## Objetivo
Analisar TODAS as faturas disponíveis do utilizador e fornecer um resumo executivo de alto impacto.

## Estrutura da Resposta
Gere um texto curto e direto (máximo 3 parágrafos) usando Markdown, focado em insights acionáveis.

1. **Resumo Geral**: Total de faturas, receita total, despesa total, saldo líquido.
2. **Destaque Principal**: O maior gasto, o melhor cliente, ou uma anomalia detectada.
3. **Sugestão do Dia**: Uma recomendação prática baseada nos dados (ex: "Atenção ao aumento de 15% em Fornecedores").

Se houver poucas faturas, analise as que existem em detalhe. NUNCA diga que não há dados se foram fornecidas faturas no contexto.
Use emojis com moderação para tornar a leitura agradável. Seja motivador mas realista.
`

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const rawBody = await req.text()
        let body;
        try {
            body = JSON.parse(rawBody)
        } catch (e: any) {
            throw new Error(`Invalid JSON: ${e.message}`)
        }

        const { action = 'chat', message, history } = body

        // Initialize Supabase
        const authHeader = req.headers.get('Authorization')
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Extract user from JWT
        const token = authHeader?.replace('Bearer ', '') ?? ''
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)

        if (!user) {
            return new Response(
                JSON.stringify({ success: false, error: 'Unauthorized' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        // --- FETCH DATA CONTEXT (Common for both actions) ---
        
        // 1. Invoices
        const { data: invoices, error: err } = await supabase
            .from('invoices')
            .select('vendor_name, total_amount, issue_date, category, status, expense_or_income, invoice_products(description, quantity, unit_price, total_price)')
            .eq('user_id', user.id)
            .order('issue_date', { ascending: false })
            .limit(action === 'daily_analysis' ? 50 : 40)

        if (err) console.error("Error fetching invoices:", err);
        console.log('User ID:', user.id);
        console.log('Invoices found:', invoices?.length || 0);
        if (invoices && invoices.length > 0) {
            console.log('First invoice sample:', JSON.stringify(invoices[0]));
        }

        let invoiceContext = 'Sem dados de faturas disponíveis.'
        
        if (invoices && invoices.length > 0) {
            const totalRevenue = invoices.filter((i: any) => i.expense_or_income === 'Receita').reduce((sum, i) => sum + (i.total_amount || 0), 0);
            const totalExpenses = invoices.filter((i: any) => i.expense_or_income === 'Despesa').reduce((sum, i) => sum + (i.total_amount || 0), 0);
            
            // Calculate Top Items
            const itemStats: Record<string, {count: number, total: number}> = {};
            invoices.forEach((inv: any) => {
                if (inv.invoice_products) {
                    inv.invoice_products.forEach((p: any) => {
                        const name = p.description || 'Item Desconhecido';
                        if (!itemStats[name]) itemStats[name] = { count: 0, total: 0 };
                        itemStats[name].count += (p.quantity || 1);
                        itemStats[name].total += (p.total_price || 0);
                    });
                }
            });

            const topItems = Object.entries(itemStats)
                .sort(([, a], [, b]) => b.total - a.total)
                .slice(0, 5)
                .map(([name, stats]) => `- ${name}: ${stats.count} un. (Total: Kz ${stats.total.toLocaleString()})`)
                .join('\n');

            invoiceContext = `## Dados Financeiros Recentes
- **Total Receita (Amostra)**: Kz ${totalRevenue.toLocaleString()}
- **Total Despesa (Amostra)**: Kz ${totalExpenses.toLocaleString()}
- **Net**: Kz ${(totalRevenue - totalExpenses).toLocaleString()}

### Top Itens Vendidos/Comprados (Por Valor):
${topItems || 'Sem dados de itens.'}

### Lista de Transações (Recentes):
${invoices.map((inv: any) => {
    const items = inv.invoice_products && inv.invoice_products.length > 0 
        ? `\n   > Itens: ${inv.invoice_products.map((p:any) => `${p.quantity}x ${p.description}`).join(', ')}`
        : '';
    return `- ${inv.issue_date}: ${inv.expense_or_income === 'Receita' ? 'Recebeu de' : 'Pagou a'} ${inv.vendor_name || 'Desconhecido'} (Kz ${inv.total_amount}, ${inv.category})${items}`
}).join('\n')}
`
        }

        // 2. Organization & Goals (Simplified for daily analysis, full for chat)
        let orgContext = ''
        if (action === 'chat') {
             const { data: userProfile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
             if (userProfile?.org_id) {
                 const { data: org } = await supabase.from('organizations').select('name, sector, objective_description').eq('id', userProfile.org_id).single()
                 if (org) orgContext = `Empresa: ${org.name} (${org.sector}). Obj: ${org.objective_description}`
             }
        }

        console.log('Invoice context length:', invoiceContext.length);
        console.log('Invoice context preview:', invoiceContext.substring(0, 200));

        // --- PREPARE GEMINI REQUEST USING SDK ---
        const apiKey = Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY') ?? Deno.env.get('GEMINI_API_KEY') ?? ''
        if (!apiKey) throw new Error('Gemini API key not configured')

        // Dynamically import the SDK (Deno reads this from deno.json imports)
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);

        let systemInstruction = '';
        if (action === 'daily_analysis') {
            systemInstruction = DAILY_ANALYSIS_PROMPT;
        } else {
            systemInstruction = CHAT_SYSTEM_PROMPT;
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: systemInstruction,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        });

        let aiText = '';

        if (action === 'daily_analysis') {
            const userPrompt = `Aqui estão os dados recentes das faturas para análise:\n\n${invoiceContext}\n\n${orgContext}\n\nPor favor, gere a análise diária.`;
            const result = await model.generateContent(userPrompt);
            aiText = result.response.text();
        } else {
            // Chat Action
            // Build the conversational history format required by the SDK
            const formattedHistory = [];
            if (history && Array.isArray(history)) {
                for (const msg of history) {
                    formattedHistory.push({
                        role: msg.sender === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.text }]
                    });
                }
            }

            // Start chat with history
            const chatSession = model.startChat({
                history: formattedHistory
            });

            // The user's new message should send the context along with their question
            // Only embed context in the first prompt of the session or the current prompt dynamically
            const messageWithContext = `${message}\n\n---\n[CONTEXTO ATUALIZADO]\n${orgContext}\n${invoiceContext}`;
            
            const result = await chatSession.sendMessage(messageWithContext);
            aiText = result.response.text();
        }

        if (!aiText) {
            aiText = 'Não consegui gerar uma resposta. Tente novamente.';
        }

        // --- LOG USAGE TO api_usage ---
        // Estimate token count: 1 token ≈ 4 characters of generated text
        const tokensUsed = Math.ceil(aiText.length / 4);

        await supabase.from('api_usage').insert({
            user_id: user.id,
            action: action,
            tokens_used: tokensUsed,
        }).then(({ error: usageErr }) => {
            if (usageErr) console.error('api_usage insert error:', usageErr);
        });

        return new Response(
            JSON.stringify({ success: true, response: aiText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('AI Function Error:', error)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
