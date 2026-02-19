
import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

// Helper for large file Base64 encoding (avoids stack overflow)
function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://faturissimo.netlify.app";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log("Function initialized - v5 (n8n Logic Match)")

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const rawBody = await req.text()

        let body;
        try {
            body = JSON.parse(rawBody)
        } catch (e: any) {
            console.error("JSON Parse Error:", e)
            throw new Error(`Invalid JSON body: ${e.message}`)
        }

        const { file_path } = body

        if (!file_path) {
            throw new Error('File path is required in body')
        }

        // 1. Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Verify User
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) {
            console.error("Auth Error:", userError)
            return new Response(JSON.stringify({ error: 'Unauthorized', details: userError }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // REMOVED SENSITIVE LOGS

        // 2. Download File from Storage
        // Use Admin Client to bypass RLS policies for reliability
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: fileData, error: downloadError } = await supabaseAdmin
            .storage
            .from('faturas')
            .download(file_path)

        if (downloadError) {
            console.error("Storage Download Error:", downloadError)
            throw new Error(`Failed to download file: ${downloadError.message}`)
        }

        console.log("File downloaded successfully, size:", fileData.size)

        // Detect MimeType
        const fileExtension = file_path.split(".").pop()?.toLowerCase();
        const mimeTypeMap: Record<string, string> = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            webp: "image/webp",
            pdf: "application/pdf",
        };
        const detectedMimeType = mimeTypeMap[fileExtension || ""] || "image/jpeg";

        // 3. Prepare for Gemini (Native Base64 implementation)
        const arrayBuffer = await fileData.arrayBuffer()
        const base64Data = arrayBufferToBase64(arrayBuffer)

        // Initialize Gemini
        const apiKey = Deno.env.get('GOOGLE_GENERATIVE_AI_API_KEY')
        if (!apiKey) {
            throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set")
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' })

        // Prompt from n8n Workflow
        const prompt = `
    ### ROLE: Auditor Financeiro Sénior e Especialista em OCR (Angola)

    ### OBJETIVO:
    Extrair dados de documentos fiscais com precisão absoluta. Se não houver 100% de certeza visual de um dado, não tente adivinhar.

    ### REGRAS DE VERIFICAÇÃO (ANTI-ALUCINAÇÃO):
    1. INTEGRIDADE VISUAL: Antes de extrair, verifique se a imagem está focada e se os bordos do documento são visíveis. Se estiver ilegível, defina "needs_new_image": true.
    2. VALOR TOTAL: O "total_amount" deve ser o valor final. Se houver discrepância entre subtotal + impostos e o total visível, use null e avise no "ai_advice".
    3. NIF: O NIF deve ter exatamente 9 dígitos (ou formato angolano válido). Se houver ruído visual que impeça a leitura clara de um dos dígitos, use null.
    4. DATA: Use apenas datas explicitamente escritas. Não use a data de "hoje" como fallback para a data da fatura.
    "CONFIDENCE_LEVEL": Valor de 0 a 100 baseado na clareza da imagem.

    ### ESTRUTURA DE UMA FATURA:
    - Na parte superior da fatura geralmente vem o vendor_name, invoice_number, issue_date e currency.
    - HEADER: Codigo, Nome, quantidade, preço, IVA, Total.
    - Após produtos: total da fatura.
    - Apos o total vem outros dados de compliance com AGT (AT-CUD).

    ### MAPEAMENTO DE CAMPOS (JSON):
    - "vendor_name": OBRIGATÓRIO. O nome da empresa/entidade no topo. Tente encontrar LOGOTIPO ou cabeçalho. Se não encontrar, tente inferir pelo rodapé. Retorne "Desconhecido" APENAS se impossível.
    - "invoice_number": Número da fatura.
    - "vendor_nif": NIF. Importante para validação.
    - "total_amount": Valor final a pagar.
    - "currency": [AKZ, EUR, USD].
    - "issue_date": YYYY-MM-DD.
    - "items": Lista detalhada.
    - "missing_fields": Liste quais campos não encontrou.

    **IMPORTANTE SOBRE VENDOR_NAME:**
    Procure por texto em negrito ou com fonte maior na parte superior esquerda ou central. Geralmente é a primeira linha.
    `

        console.log("Sending to Gemini...")
        let result;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                result = await model.generateContent([
                    prompt,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: detectedMimeType,
                        },
                    },
                ])
                break; // Success
            } catch (geminiError: any) {
                console.error(`Gemini attempt ${attempt}/3 failed:`, geminiError.message);
                if (attempt === 3) throw geminiError;
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Backoff
            }
        }

        const responseText = result.response.text()
        console.log("Gemini Response:", responseText)

        // 4. Parse JSON
        const cleanJson = responseText.replace(/```json|```/g, '').trim()
        let data;
        try {
            data = JSON.parse(cleanJson)
        } catch (e: any) {
            console.error("JSON Parse Error:", e)
            throw new Error("Failed to parse AI response")
        }

        // 5. Calculate Status (n8n Logic)
        const keyFields = ['vendor_name', 'total_amount', 'invoice_number', 'issue_date']
        let detectedMissing = data.missing_fields || []

        // Convert string list to array if Gemini returned a string
        if (typeof detectedMissing === 'string') {
            detectedMissing = [detectedMissing]
        }

        keyFields.forEach(field => {
            if (!data[field] || data[field] === "N/A" || data[field] === "Desconhecido") {
                if (!detectedMissing.includes(field)) detectedMissing.push(field)
            }
        })

        const confidence = Number(data.confidence_level || 0)
        // Logic: Confidence > 80 AND No missing key fields = Completed
        const status = (confidence > 80 && detectedMissing.length === 0) ? 'completed' : 'needs_review'

        const aiAdvice = status === 'needs_review'
            ? `Revisão necessária: ${detectedMissing.join(", ")} (Confiança: ${confidence}%)`
            : "Aprovação automática"

        // Helper to clean currency strings (e.g., "1.200,50" -> 1200.5)
        function cleanCurrency(value: string | number | null | undefined): number {
            if (!value) return 0;
            if (typeof value === 'number') return value;

            // Remove currency symbols and whitespace
            let clean = value.replace(/[^\d.,-]/g, '').trim();

            // Check if comma is used as decimal separator (e.g., "123,45" or "1.234,56")
            if (clean.includes(',') && !clean.includes('.')) {
                clean = clean.replace(',', '.');
            } else if (clean.includes(',') && clean.includes('.')) {
                // Mixed format (e.g. 1.234,56 -> 1234.56)
                // Assuming the last separator is the decimal one
                const lastComma = clean.lastIndexOf(',');
                const lastDot = clean.lastIndexOf('.');

                if (lastComma > lastDot) {
                    clean = clean.replace(/\./g, '').replace(',', '.');
                } else {
                    clean = clean.replace(/,/g, '');
                }
            }

            const num = parseFloat(clean);
            return isNaN(num) ? 0 : num;
        }

        // 6. Update Database
        const { data: { publicUrl } } = supabaseAdmin.storage.from('faturas').getPublicUrl(file_path);

        // Sanitize total_amount
        const finalTotal = cleanCurrency(data.total_amount);

        const invoiceData = {
            user_id: user.id,
            file_url: publicUrl,
            vendor_name: data.vendor_name || 'Desconhecido',
            vendor_nif: data.vendor_nif,
            total_amount: finalTotal,
            issue_date: data.issue_date,
            invoice_number: data.invoice_number,
            currency: data.currency || 'AOA',
            category: data.category || 'Outros',
            atcud: data.atcud,
            is_agt_valid: !!data.is_agt_valid,
            status: status === 'completed' ? 'Aprovado' : 'Pendente',
            processing_status: status,
            ai_metadata: {
                confidence: confidence,
                provider: 'gemini-2.0-flash-001',
                flagged_fields: detectedMissing,
                error_message: null,
                ai_advice: aiAdvice,
                ocr_raw: data // Optional: save raw data for debug
            }
        }

        // REMOVED SENSITIVE LOG: Inserting Invoice Data

        const { data: invoice, error: insertError } = await supabaseAdmin
            .from('invoices')
            .insert(invoiceData)
            .select()
            .single()

        if (insertError) {
            console.error("Insert Error:", insertError)
            throw insertError
        }

        // Insert Items
        if (data.items && data.items.length > 0) {
            const itemsToInsert = data.items.map((item: any) => {
                const quantity = cleanCurrency(item.quantity) || 1;
                const totalItemPrice = cleanCurrency(item.total_price);
                const unitPrice = cleanCurrency(item.unit_price) || (totalItemPrice / quantity) || 0;

                return {
                    invoice_id: invoice.id,
                    description: item.description,
                    quantity: quantity,
                    unit_price: unitPrice,
                    total_price: totalItemPrice,
                    tax_amount: cleanCurrency(item.tax_amount)
                }
            })

            const { error: itemsError } = await supabaseAdmin.from('invoice_products').insert(itemsToInsert)
            if (itemsError) console.error("Items Insert Error:", itemsError)
        }

        return new Response(JSON.stringify({ success: true, invoice }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        console.error("Function Error Details:", error)

        // Manual serialization of Error properties
        const errorDetails = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            cause: error.cause,
            ...error
        };

        // Return 200 OK even for errors, so the client can read the JSON body
        // This avoids "FunctionsHttpError" swallowing the details on the client side
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Unknown Error',
            details: errorDetails
        }), {
            status: 200, // INTENTIONAL: Soft Error pattern
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
