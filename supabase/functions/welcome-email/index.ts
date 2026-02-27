import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, full_name } = await req.json()

    if (!email) {
      throw new Error('Email is required')
    }

    console.log(`Sending welcome email to: ${email}`)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'GEFACT.AI <onboarding@resend.dev>', // Change to your verified domain later
        to: [email],
        subject: 'Bem-vindo ao GEFACT.AI! 🚀',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 16px;">
            <h1 style="color: #1042FF; margin-bottom: 24px;">Olá, ${full_name || 'utilizador'}!</h1>
            <p style="font-size: 16px; color: #475569; line-height: 1.6;">
              Obrigado por te juntares ao <strong>GEFACT.AI</strong>. Estamos entusiasmados por ajudar-te a gerir as tuas faturas de forma inteligente com IA.
            </p>
            <p style="font-size: 16px; color: #475569; line-height: 1.6;">
              Agora já podes:
            </p>
            <ul style="color: #475569; line-height: 1.6;">
              <li>Faturar com IA via WhatsApp ou Telegram.</li>
              <li>Analisar despesas e receitas em tempo real.</li>
              <li>Definir metas financeiras inteligentes.</li>
            </ul>
            <div style="margin-top: 32px; padding: 20px; background-color: #f8fafc; border-radius: 12px; text-align: center;">
              <a href="https://invoicealphabet.netlify.app" style="background-color: #1042FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Ir para o Dashboard
              </a>
            </div>
            <p style="margin-top: 32px; font-size: 14px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;">
              Se tiveres alguma dúvida, responde a este email. Estamos aqui para ajudar.<br>
              <strong>Equipa GEFACT.AI</strong>
            </p>
          </div>
        `,
      }),
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
