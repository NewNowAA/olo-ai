import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

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
    // 1. Initialize Supabase Client (Service Role required for Admin actions)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseServiceKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Authenticate the Requester (Must be logged in)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        throw new Error('Missing Authorization header')
    }
    
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !requester) {
       return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // 3. Parse Request Body
    const { email, role, fullName, phone, org_id } = await req.json()

    // 4. Verify Requester Permissions (Simulated: Check if requester belongs to same org)
    // In a real app, you'd check if requester.role === 'admin' in your profiles table
    // For now, we trust the client-side org_id check but verify DB consistency
    const { data: requesterProfile } = await supabaseAdmin
        .from('users')
        .select('org_id, role')
        .eq('id', requester.id)
        .single()
    
    if (!requesterProfile || requesterProfile.org_id !== org_id) {
         return new Response(JSON.stringify({ error: 'Unauthorized: Organization mismatch' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          })
    }

    // 5. Check if user already exists
    // (Optional: handle re-invites nicely)

    // 6. Invite User via Email
    const { data: invitation, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
            org_id: org_id,
            role: role || 'viewer',
            full_name: fullName,
            mobile_number: phone
        },
        redirectTo: 'http://localhost:3000/set-password' // Adjust for production URL!
    })

    if (inviteError) throw inviteError

    // 7. Update Public Profile (Sync metadata to public table)
    // The trigger might handle this, but explicit update ensures immediate availability
    const { error: profileError } = await supabaseAdmin
        .from('users')
        .upsert({
            id: invitation.user.id,
            org_id: org_id,
            email: email,
            full_name: fullName,
            role: role || 'viewer',
            mobile_number: phone,
            status: 'invited',
            created_at: new Date().toISOString()
        })
    
    if (profileError) console.error("Error creating public profile:", profileError)

    return new Response(
      JSON.stringify({ message: 'User invited successfully', user: invitation.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
