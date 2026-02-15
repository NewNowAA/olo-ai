import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("AI Consultant Function initialized - v1")

const SYSTEM_PROMPT = `Você é a **Lumea**, uma consultora financeira de elite especializada em gestão empresarial e otimização financeira. Você trabalha como IA integrada numa plataforma de gestão de faturas.

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

        const { message, history } = body

        if (!message) {
            throw new Error('Message is required')
        }

        // --- 1. Get user's invoices for context ---
        const authHeader = req.headers.get('Authorization')
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Extract user from JWT
        const token = authHeader?.replace('Bearer ', '') ?? ''
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)

        let invoiceContext = 'Sem dados de faturas disponíveis.'

        if (user) {
            const { data: invoices } = await supabase
                .from('invoices')
                .select('supplier, total_amount, issue_date, category, status, invoice_products(name, quantity, unit_price)')
                .eq('user_id', user.id)
                .order('issue_date', { ascending: false })
                .limit(40)

            if (invoices && invoices.length > 0) {
                // Build financial summary
                const totalGasto = invoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0)
                const categorias: Record<string, number> = {}
                const fornecedores: Record<string, number> = {}
                const porMes: Record<string, number> = {}

                invoices.forEach((inv: any) => {
                    const cat = inv.category || 'Sem Categoria'
                    categorias[cat] = (categorias[cat] || 0) + (inv.total_amount || 0)

                    const forn = inv.supplier || 'Desconhecido'
                    fornecedores[forn] = (fornecedores[forn] || 0) + (inv.total_amount || 0)

                    if (inv.issue_date) {
                        const mes = inv.issue_date.substring(0, 7) // YYYY-MM
                        porMes[mes] = (porMes[mes] || 0) + (inv.total_amount || 0)
                    }
                })

                const topCategorias = Object.entries(categorias)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([cat, val]) => `  - ${cat}: €${val.toFixed(2)} (${((val / totalGasto) * 100).toFixed(1)}%)`)
                    .join('\n')

                const topFornecedores = Object.entries(fornecedores)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([f, val]) => `  - ${f}: €${val.toFixed(2)}`)
                    .join('\n')

                const tendenciaMensal = Object.entries(porMes)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([mes, val]) => `  - ${mes}: €${val.toFixed(2)}`)
                    .join('\n')

                invoiceContext = `## Dados Financeiros do Utilizador (${invoices.length} faturas recentes)

**Total Gasto**: €${totalGasto.toFixed(2)}
**Número de Faturas**: ${invoices.length}

### Gastos por Categoria:
${topCategorias}

### Top Fornecedores:
${topFornecedores}

### Tendência Mensal:
${tendenciaMensal}

### Últimas 10 Faturas:
${invoices.slice(0, 10).map((inv: any) =>
    `  - ${inv.issue_date || 'S/D'} | ${inv.supplier || 'N/A'} | €${(inv.total_amount || 0).toFixed(2)} | ${inv.category || 'S/C'} | ${inv.status || 'N/A'}`
).join('\n')}`

            }
        }

        // --- 2. Build Gemini request ---
        const apiKey = Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY') ?? Deno.env.get('GEMINI_API_KEY') ?? ''

        if (!apiKey) {
            throw new Error('Gemini API key not configured')
        }

        // Build conversation contents
        const contents: any[] = []

        // Add history if provided
        if (history && Array.isArray(history)) {
            for (const msg of history) {
                contents.push({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                })
            }
        }

        // Add the current message with context
        const userMessageWithContext = `${message}

---
[CONTEXTO FINANCEIRO DO UTILIZADOR - Use estes dados para fundamentar sua resposta]
${invoiceContext}`

        contents.push({
            role: 'user',
            parts: [{ text: userMessageWithContext }]
        })

        // Call Gemini API directly
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: SYSTEM_PROMPT }]
                    },
                    contents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                        topP: 0.9,
                    }
                })
            }
        )

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text()
            console.error('Gemini API error:', errText)
            throw new Error(`Gemini API error: ${geminiResponse.status}`)
        }

        const geminiData = await geminiResponse.json()
        const aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
            ?? 'Não consegui gerar uma resposta. Tente novamente.'

        return new Response(
            JSON.stringify({ success: true, response: aiText }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('AI Consultant Error:', error)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
