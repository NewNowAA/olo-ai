import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the user's JWT from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // User client (to verify identity using the user's JWT)
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Admin client (bypasses RLS for all deletions)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verify user identity
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id
    console.log('Deleting account for user:', userId)

    // --- EXHAUSTIVE CLEANUP (Order matters for Foreign Keys) ---

    // 1. Delete Analytics (references public.users)
    await supabaseAdmin.from('daily_analytics').delete().eq('user_id', userId)

    // 2. Delete Goals
    await supabaseAdmin.from('goals').delete().eq('user_id', userId)

    // 3. Delete AI & Chat History
    await supabaseAdmin.from('chat_conversations').delete().eq('user_id', userId)
    await supabaseAdmin.from('lumea_conversations').delete().eq('user_id', userId)
    // messages usually cascade, but we can be explicit if needed

    // 4. Delete Invoices & Products
    // We should delete products first if they don't cascade
    const { data: invs } = await supabaseAdmin.from('invoices').select('id').eq('user_id', userId)
    if (invs && invs.length > 0) {
      const invIds = invs.map(i => i.id)
      await supabaseAdmin.from('invoice_products').delete().in('invoice_id', invIds)
    }
    await supabaseAdmin.from('invoices').delete().eq('user_id', userId)
    await supabaseAdmin.from('faturas').delete().eq('user_id', userId)

    // 5. Get user profile to check org role
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('org_id, user_role')
      .eq('id', userId)
      .maybeSingle()

    // 6. If org admin, delete org members and org
    if (profile?.org_id && profile?.user_role === 'admin') {
      await supabaseAdmin.from('users').delete().eq('org_id', profile.org_id).neq('id', userId)
      await supabaseAdmin.from('organizations').delete().eq('id', profile.org_id)
    }

    // 7. Delete user profile row
    await supabaseAdmin.from('users').delete().eq('id', userId)

    // 8. Delete from auth.users (requires service role)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      // Profile data already deleted — this is non-fatal if they are orphaned in auth
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Delete account error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
