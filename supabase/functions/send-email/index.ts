

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not found in environment variables')
    }

    // Send the email via Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Lumea AI <onboarding@resend.dev>', // Change this to your authenticated domain later (e.g., suporte@lumea.ai)
        to: ['marcio@newnow.ao'], // Hardcoded to your admin email or change as needed
        subject: `Novo Ticket de Suporte: ${subject}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #0f172a; border-bottom: 2px solid #73c6df; padding-bottom: 10px;">Novo Pedido de Suporte (Lumea AI)</h2>
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>Email do Utilizador:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Assunto:</strong> ${subject}</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; color: #334155; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">Enviado via Lumea AI Help & Support Form.</p>
          </div>
        `,
      }),
    })

    const resData = await res.json()

    if (!res.ok) {
      console.error('Resend error:', resData)
      throw new Error(resData.message || 'Failed to send email via Resend')
    }

    return new Response(JSON.stringify({ success: true, id: resData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in send-email function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
