// =============================================
// Olo.AI — API Routes (Dashboard REST API)
// =============================================

import { Router, Request, Response } from 'express';
import * as store from '../services/supabaseStore.js';
import * as placeholderManager from '../services/placeholderManager.js';
import { SECTOR_TEMPLATES } from '../config/sectors.js';

const router = Router();

// --- Health check ---
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'olo-ai-server',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// --- Get sector templates ---
router.get('/public/sectors/templates', (_req: Request, res: Response) => {
  res.json(SECTOR_TEMPLATES);
});

// --- Register user (bypasses RLS) ---
router.post('/public/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, businessName, sector } = req.body;
    
    // 1. Create auth user in Supabase using Admin API (bypasses rate limits and email confirmation)
    const { data: authData, error: authError } = await store.getSupabase().auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            name,
            role
        }
    });

    if (authError) {
        console.error('Auth signup error:', authError);
        res.status(400).json({ error: authError.message });
        return;
    }

    if (!authData.user) {
        res.status(500).json({ error: 'Falha ao criar utilizador' });
        return;
    }

    const authUserId = authData.user.id;

    // 2. Create organization (if owner)
    let orgId = '';
    if (role === 'owner' && businessName) {
        // Generate a random code for the organization (e.g., ORG-12345)
        const orgCode = `ORG-${Math.floor(10000 + Math.random() * 90000)}`;
        
        const { data: orgData, error: orgError } = await store.getSupabase()
            .from('organizations')
            .insert({
                name: businessName,
                code: orgCode,
                sector: sector || 'generico',
                agent_name: 'Atendente',
                agent_tone: 'profissional',
                setup_progress: 0,
            })
            .select('id')
            .single();

        if (orgError) {
            console.error('Organization creation error:', orgError);
            console.warn(`ORPHANED USER: Auth User ${authUserId} created but Organization failed.`);
            res.status(500).json({ error: 'Falha ao criar organização: ' + orgError.message });
            return;
        }
        orgId = orgData.id;
    }

    // Generate link token for Telegram deep link
    const linkToken = crypto.randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    // 3. Create user profile in public.profiles table (Use upsert to handle potential triggers)
    const { error: userError } = await store.getSupabase()
        .from('profiles')
        .upsert({
            id: authUserId, // Use same ID as auth user
            organization_id: orgId || null,
            full_name: name,
            role: role === 'owner' ? 'admin' : 'client',
        });

    if (userError) {
        console.error('User profile creation error:', userError);
        res.status(500).json({ error: 'Falha ao criar perfil: ' + userError.message });
        return;
    }

    res.json({
        success: true,
        userId: authUserId,
        orgId: orgId,
        linkToken: linkToken,
    });
  } catch (err: any) {
    console.error('Registration API error:', err);
    res.status(500).json({ error: err.message || 'Erro interno no registo' });
  }
});

// --- Check if email exists ---
router.post('/public/check-email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const { data, error } = await store.getSupabase()
        .from('users')
        .select('id')
        .eq('email', email)
        .limit(1);

    if (error) {
      console.error('Check email error:', error);
      res.status(500).json({ error: 'Database check failed' });
      return;
    }

    res.json({ exists: data && data.length > 0 });
  } catch (err: any) {
    console.error('Check email API error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// --- Check if phone exists ---
router.post('/public/check-phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ error: 'Phone is required' });
      return;
    }

    const { data, error } = await store.getSupabase()
        .from('users')
        .select('id')
        .eq('mobile_number', phone)
        .limit(1);

    if (error) {
       console.error('Check phone error:', error);
       res.status(500).json({ error: 'Database check failed' });
       return;
    }

    res.json({ exists: data && data.length > 0 });
  } catch (err: any) {
     console.error('Check phone API error:', err);
     res.status(500).json({ error: 'Internal error' });
  }
});

// --- Get organization info ---
router.get('/org/:orgId', async (req: Request<{ orgId: string }>, res: Response) => {
  const org = await store.getOrganization(req.params.orgId);
  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }
  res.json(org);
});

// --- Update organization ---
router.put('/orgs/:orgId', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { data, error } = await store.getSupabase()
      .from('organizations')
      .update(req.body)
      .eq('id', req.params.orgId)
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Get setup progress ---
router.get('/org/:orgId/setup', async (req: Request<{ orgId: string }>, res: Response) => {
  const org = await store.getOrganization(req.params.orgId);
  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }

  const progress = await placeholderManager.calculateSetupProgress(org);
  const missing = await placeholderManager.getMissingPlaceholders(org);

  res.json({
    progress,
    total_fields: 7,
    completed: 7 - missing.length,
    missing,
  });
});

// --- Dashboard Stats ---
router.get('/orgs/:orgId/stats', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const orgId = req.params.orgId;
    const today = new Date().toISOString().split('T')[0];

    // Conversations today
    const { count: convToday } = await store.getSupabase()
      .from('olo_conversations').select('*', { count: 'exact', head: true })
      .eq('org_id', orgId).gte('created_at', today + 'T00:00:00');

    // Active conversations
    const { count: activeConv } = await store.getSupabase()
      .from('olo_conversations').select('*', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'active');

    // Pending appointments
    const { count: pendingApp } = await store.getSupabase()
      .from('olo_appointments').select('*', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'pending');

    // Stock alerts
    const alerts = await store.getStockAlerts(orgId);

    // Messages by day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: recentMessages } = await store.getSupabase()
      .from('olo_messages').select('created_at')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: true });

    // Group by date
    const byDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      byDay[d] = 0;
    }
    (recentMessages || []).forEach((m: any) => {
      const d = m.created_at.split('T')[0];
      if (byDay[d] !== undefined) byDay[d]++;
    });

    res.json({
      conversations_today: convToday || 0,
      active_conversations: activeConv || 0,
      pending_appointments: pendingApp || 0,
      stock_alerts: alerts.length,
      messages_by_day: Object.entries(byDay).map(([date, count]) => ({ date, count })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- List conversations ---
router.get('/org/:orgId/conversations', async (req: Request<{ orgId: string }>, res: Response) => {
  const { data, error } = await store.getSupabase()
    .from('olo_conversations')
    .select('*, olo_customers(name, telegram_id)')
    .eq('org_id', req.params.orgId)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// --- Get conversation messages ---
router.get('/conversations/:convId/messages', async (req: Request<{ convId: string }>, res: Response) => {
  const messages = await store.getConversationMessages(req.params.convId, 100);
  res.json(messages);
});

// --- Owner sends manual message in conversation ---
router.post('/orgs/:orgId/conversations/:convId/messages', async (req: Request<{ orgId: string; convId: string }>, res: Response) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) { res.status(400).json({ error: 'Content required' }); return; }
    await store.saveMessage(req.params.convId, 'assistant', content);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Update conversation status (with post-service feedback) ---
router.put('/orgs/:orgId/conversations/:convId/status', async (req: Request<{ orgId: string; convId: string }>, res: Response) => {
  try {
    const { status } = req.body;
    const { data: conv, error } = await store.getSupabase()
      .from('olo_conversations')
      .update({ status })
      .eq('id', req.params.convId)
      .eq('org_id', req.params.orgId)
      .select('*, olo_customers(*), organizations(telegram_bot_token)')
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    // Logic for post-service feedback: if closed and on telegram, ask for rating
    if (status === 'closed' && conv.channel === 'telegram' && conv.organizations?.telegram_bot_token && conv.olo_customers?.telegram_id) {
       import('../services/telegramGateway.js').then(tg => {
         tg.sendMessage(conv.organizations.telegram_bot_token, conv.olo_customers.telegram_id, 'Como foi o teu atendimento? Responde com 1 a 5 ⭐');
       });
    }

    res.json(conv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- List catalog items ---
router.get('/org/:orgId/catalog', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { data, error } = await store.getSupabase()
      .from('catalog_items')
      .select('*, catalog_categories(name)')
      .eq('org_id', req.params.orgId)
      .order('name');
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Create catalog item ---
router.post('/orgs/:orgId/catalog', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { data, error } = await store.getSupabase()
      .from('catalog_items')
      .insert({ ...req.body, org_id: req.params.orgId })
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Update catalog item ---
router.put('/orgs/:orgId/catalog/:id', async (req: Request<{ orgId: string; id: string }>, res: Response) => {
  try {
    const { data, error } = await store.getSupabase()
      .from('catalog_items')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('org_id', req.params.orgId)
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Delete catalog item ---
router.delete('/orgs/:orgId/catalog/:id', async (req: Request<{ orgId: string; id: string }>, res: Response) => {
  try {
    const { error } = await store.getSupabase()
      .from('catalog_items')
      .delete()
      .eq('id', req.params.id)
      .eq('org_id', req.params.orgId);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- List stock (catalog items with stock) ---
router.get('/orgs/:orgId/stock', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { data, error } = await store.getSupabase()
      .from('catalog_items')
      .select('id, name, stock_quantity, stock_min_alert, is_available')
      .eq('org_id', req.params.orgId)
      .not('stock_quantity', 'is', null)
      .order('name');
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Register stock movement ---
router.post('/orgs/:orgId/stock/movement', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { item_id, type, quantity, reason } = req.body;
    const delta = type === 'in' ? quantity : -quantity;

    // Update stock
    const { data: item } = await store.getSupabase()
      .from('catalog_items')
      .select('stock_quantity')
      .eq('id', item_id)
      .single();

    if (!item) { res.status(404).json({ error: 'Item not found' }); return; }

    const newQty = Math.max(0, (item.stock_quantity || 0) + delta);
    await store.getSupabase()
      .from('catalog_items')
      .update({ stock_quantity: newQty })
      .eq('id', item_id);

    // Log movement
    await store.getSupabase()
      .from('stock_movements')
      .insert({
        org_id: req.params.orgId,
        item_id,
        movement_type: type === 'in' ? 'restock' : 'sale',
        quantity_change: delta,
        quantity_after: newQty,
        reason: reason || null,
      });

    res.json({ success: true, new_quantity: newQty });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Stock alerts ---
router.get('/org/:orgId/stock-alerts', async (req: Request<{ orgId: string }>, res: Response) => {
  const alerts = await store.getStockAlerts(req.params.orgId);
  res.json({
    count: alerts.length,
    items: alerts,
  });
});

// --- List appointments ---
router.get('/org/:orgId/appointments', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    let query = store.getSupabase()
      .from('olo_appointments')
      .select('*, olo_customers(name, phone)')
      .eq('org_id', req.params.orgId)
      .order('date', { ascending: false })
      .limit(100);

    const { date, status } = req.query;
    if (date) query = query.eq('date', date as string);
    if (status) query = query.eq('status', status as string);

    const { data, error } = await query;
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Update appointment status ---
router.put('/orgs/:orgId/appointments/:id', async (req: Request<{ orgId: string; id: string }>, res: Response) => {
  try {
    const { data, error } = await store.getSupabase()
      .from('olo_appointments')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('org_id', req.params.orgId)
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- List customers ---
router.get('/org/:orgId/customers', async (req: Request<{ orgId: string }>, res: Response) => {
  const { data, error } = await store.getSupabase()
    .from('olo_customers')
    .select('*')
    .eq('org_id', req.params.orgId)
    .order('last_contact_at', { ascending: false })
    .limit(100);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// --- Get business hours ---
router.get('/orgs/:orgId/hours', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { data, error } = await store.getSupabase()
      .from('business_hours')
      .select('*')
      .eq('org_id', req.params.orgId)
      .order('day_of_week');
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Update business hours ---
router.put('/orgs/:orgId/hours', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { hours } = req.body;
    const orgId = req.params.orgId;

    // Delete existing and reinsert
    await store.getSupabase().from('business_hours').delete().eq('org_id', orgId);

    const rows = hours.map((h: any) => ({
      org_id: orgId,
      day_of_week: h.day_of_week,
      open_time: h.open_time,
      close_time: h.close_time,
      is_closed: h.is_closed,
    }));

    const { error } = await store.getSupabase().from('business_hours').insert(rows);
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// Admin Endpoints (Dev only)
// =============================================

// --- Global stats ---
router.get('/admin/stats', async (_req: Request, res: Response) => {
  try {
    const { count: totalOrgs } = await store.getSupabase()
      .from('organizations').select('*', { count: 'exact', head: true });

    const { count: totalConv } = await store.getSupabase()
      .from('olo_conversations').select('*', { count: 'exact', head: true });

    const { count: totalMsgs } = await store.getSupabase()
      .from('olo_messages').select('*', { count: 'exact', head: true });

    const { count: activeHandoffs } = await store.getSupabase()
      .from('olo_conversations').select('*', { count: 'exact', head: true })
      .eq('status', 'handoff');

    res.json({
      total_orgs: totalOrgs || 0,
      total_conversations: totalConv || 0,
      total_messages: totalMsgs || 0,
      active_handoffs: activeHandoffs || 0,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- List all organizations ---
router.get('/admin/organizations', async (_req: Request, res: Response) => {
  try {
    const { data, error } = await store.getSupabase()
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Quick Replies ---
router.get('/orgs/:orgId/quick-replies', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { data, error } = await store.getSupabase()
      .from('quick_replies')
      .select('*')
      .eq('org_id', req.params.orgId)
      .order('created_at', { ascending: false });
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orgs/:orgId/quick-replies', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { data, error } = await store.getSupabase()
      .from('quick_replies')
      .insert({ ...req.body, org_id: req.params.orgId })
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
