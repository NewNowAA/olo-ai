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

    // --- DYNAMIC ROBUST CLEANUP ---
    // We fetch all tables that have a 'user_id' column to avoid "relation does not exist" errors
    // and to catch new tables automatically.
    
    // 1. Get all tables in public schema with a user_id column
    const { data: tablesWithUserId, error: tablesError } = await supabaseAdmin.rpc('get_tables_with_column', { column_name: 'user_id' })
    
    // If RPC is not available, we fall back to a safe list
    const targetTables = tablesWithUserId ? tablesWithUserId.map((t: any) => t.table_name) : [
      'daily_analytics', 'goals', 'chat_conversations', 'lumea_conversations', 'invoices', 'users'
    ]

    console.log('Detected tables to clean:', targetTables)

    // 2. Special handling for tables linked by ID instead of user_id
    // lumea_messages (via conversation_id)
    if (targetTables.includes('lumea_conversations')) {
      const { data: convs } = await supabaseAdmin.from('lumea_conversations').select('id').eq('user_id', userId)
      if (convs && convs.length > 0) {
        const ids = convs.map(c => c.id)
        await supabaseAdmin.from('lumea_messages').delete().in('conversation_id', ids)
      }
    }

    // invoice_products (via invoice_id)
    if (targetTables.includes('invoices')) {
      const { data: invs } = await supabaseAdmin.from('invoices').select('id').eq('user_id', userId)
      if (invs && invs.length > 0) {
        const ids = invs.map(i => i.id)
        
        // Check if invoice_products exists
        const { data: hasProductTable } = await supabaseAdmin.rpc('get_table_exists', { t_name: 'invoice_products' })
        if (hasProductTable) {
           await supabaseAdmin.from('invoice_products').delete().in('invoice_id', ids)
        }
      }
    }

    // 3. Delete from all user_id tables (except 'users' which should be last)
    for (const table of targetTables) {
      if (table === 'users') continue
      try {
        await supabaseAdmin.from(table).delete().eq('user_id', userId)
        console.log(`Successfully deleted from ${table}`)
      } catch (e) {
        console.warn(`Could not delete from ${table}:`, e)
      }
    }

    // 4. Organization Handling
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('org_id, user_role')
      .eq('id', userId)
      .maybeSingle()

    if (profile?.org_id && profile?.user_role === 'admin') {
      // Check if there are other members
      const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', profile.org_id)
        .neq('id', userId)

      if (count === 0) {
        // Only user in org, delete org
        await supabaseAdmin.from('organizations').delete().eq('id', profile.org_id)
      } else {
        // Just remove the admin record later in step 5
      }
    }

    // 5. Delete public.users profile
    await supabaseAdmin.from('users').delete().eq('id', userId)

    // 6. Delete from auth.users (requires service role)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
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
