// =============================================
// Olo.AI — API Routes (Dashboard REST API)
// =============================================

import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import * as store from '../services/supabaseStore.js';
import * as placeholderManager from '../services/placeholderManager.js';
import * as telegramGateway from '../services/telegramGateway.js';
import { SECTOR_TEMPLATES } from '../config/sectors.js';
import { startPolling, stopPolling } from '../services/telegramPoller.js';
import { processUpdate } from './telegramRoutes.js';

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
    
    // 1. Create auth user — email_confirm: true bypasses email confirmation for now
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
    const linkToken = randomUUID();

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
router.get('/orgs/:orgId', async (req: Request<{ orgId: string }>, res: Response) => {
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

// --- Setup Telegram Bot ---
router.post('/orgs/:orgId/setup-telegram', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { bot_token } = req.body;
    if (!bot_token) {
      res.status(400).json({ error: 'Missing bot_token' });
      return;
    }

    // 1. Always save token to organization first
    const { data, error } = await store.getSupabase()
      .from('organizations')
      .update({ telegram_bot_token: bot_token })
      .eq('id', req.params.orgId)
      .select()
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    // 2. Try to set webhook (best-effort — polling is used if this fails)
    const webhookUrl = process.env.WEBHOOK_BASE_URL;
    let webhookStatus = 'polling'; // default: polling mode

    if (webhookUrl && webhookUrl.startsWith('https://') && !webhookUrl.includes('localhost')) {
      const fullWebhookUrl = `${webhookUrl}/api/telegram/webhook`;
      const webhookOk = await telegramGateway.setWebhook(bot_token, fullWebhookUrl);
      webhookStatus = webhookOk ? 'webhook' : 'polling';
      if (webhookOk) {
        console.log(`[Setup] Telegram webhook set: ${fullWebhookUrl}`);
      } else {
        console.warn('[Setup] Webhook failed — bot will use polling mode.');
      }
    }

    // 3. (Re)start polling with the new token if not using webhook
    if (webhookStatus === 'polling') {
      stopPolling();
      startPolling(bot_token, processUpdate).catch(err => {
        console.error('[Setup] Failed to start polling with new token:', err);
      });
    }

    res.json({
      ...data,
      webhook_status: webhookStatus,
      message: webhookStatus === 'webhook'
        ? 'Bot conectado via webhook.'
        : 'Token guardado. Bot a usar modo polling.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Get setup progress ---
router.get('/orgs/:orgId/setup', async (req: Request<{ orgId: string }>, res: Response) => {
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
      .from('conversations').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).gte('created_at', today + 'T00:00:00');

    // Active conversations
    const { count: activeConv } = await store.getSupabase()
      .from('conversations').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId).in('status', ['open', 'active']);

    // Pending appointments
    const { count: pendingApp } = await store.getSupabase()
      .from('appointments').select('*', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'pending');

    // Stock alerts
    const alerts = await store.getStockAlerts(orgId);

    // Messages by day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: recentMessages } = await store.getSupabase()
      .from('messages').select('created_at')
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
router.get('/orgs/:orgId/conversations', async (req: Request<{ orgId: string }>, res: Response) => {
  const { data, error } = await store.getSupabase()
    .from('conversations')
    .select('*, customers(name, telegram_id)')
    .eq('organization_id', req.params.orgId)
    .order('created_at', { ascending: false })
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
      .from('conversations')
      .update({ status })
      .eq('id', req.params.convId)
      .eq('organization_id', req.params.orgId)
      .select('*, customers(*), organizations(telegram_bot_token)')
      .single();

    if (error) { res.status(500).json({ error: error.message }); return; }

    // Post-service feedback: if closed and on telegram, ask for rating
    if (status === 'closed' && conv.channel === 'telegram' && conv.organizations?.telegram_bot_token && conv.customers?.telegram_id) {
      telegramGateway.sendMessage(
        conv.organizations.telegram_bot_token,
        conv.customers.telegram_id,
        'Como foi o teu atendimento? 😊\n\nResponde com um número de 1 a 5 ⭐'
      ).catch(err => console.error('[Feedback] Failed to send feedback request:', err));
    }

    res.json(conv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- List catalog items ---
router.get('/orgs/:orgId/catalog', async (req: Request<{ orgId: string }>, res: Response) => {
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
    const body = { ...req.body, org_id: req.params.orgId };
    // Sanitize: empty strings are not valid UUIDs
    if (!body.category_id) body.category_id = null;
    const { data, error } = await store.getSupabase()
      .from('catalog_items')
      .insert(body)
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
    const body = { ...req.body };
    if (!body.category_id) body.category_id = null;
    const { data, error } = await store.getSupabase()
      .from('catalog_items')
      .update(body)
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
      .select('id, name, stock_quantity, stock_min, active')
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
    const { catalog_item_id, type, quantity, reason } = req.body;
    const delta = type === 'in' ? quantity : -quantity;

    // Update stock
    const { data: item } = await store.getSupabase()
      .from('catalog_items')
      .select('stock_quantity')
      .eq('id', catalog_item_id)
      .single();

    if (!item) { res.status(404).json({ error: 'Item not found' }); return; }

    const newQty = Math.max(0, (item.stock_quantity || 0) + delta);
    await store.getSupabase()
      .from('catalog_items')
      .update({ stock_quantity: newQty })
      .eq('id', catalog_item_id);

    // Log movement
    await store.getSupabase()
      .from('stock_movements')
      .insert({
        org_id: req.params.orgId,
        catalog_item_id,
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
router.get('/orgs/:orgId/stock-alerts', async (req: Request<{ orgId: string }>, res: Response) => {
  const alerts = await store.getStockAlerts(req.params.orgId);
  res.json({
    count: alerts.length,
    items: alerts,
  });
});

// --- List appointments ---
router.get('/orgs/:orgId/appointments', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { date, status } = req.query;
    const appointments = await store.getAppointments(
      req.params.orgId,
      date as string | undefined,
      status as string | undefined
    );
    res.json(appointments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Create appointment ---
router.post('/orgs/:orgId/appointments', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const data = await store.createAppointment({ ...req.body, org_id: req.params.orgId });
    if (!data) { res.status(500).json({ error: 'Falha ao criar marcação' }); return; }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Update appointment ---
router.put('/orgs/:orgId/appointments/:id', async (req: Request<{ orgId: string; id: string }>, res: Response) => {
  try {
    const ok = await store.updateAppointment(req.params.id, req.body);
    if (!ok) { res.status(500).json({ error: 'Failed to update appointment' }); return; }
    const appts = await store.getAppointments(req.params.orgId);
    const updated = appts.find((a: any) => a.id === req.params.id);
    res.json(updated || { id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Delete appointment ---
router.delete('/orgs/:orgId/appointments/:id', async (req: Request<{ orgId: string; id: string }>, res: Response) => {
  try {
    const ok = await store.deleteAppointment(req.params.id);
    if (!ok) { res.status(500).json({ error: 'Failed to delete appointment' }); return; }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- List orders ---
router.get('/orgs/:orgId/orders', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { status } = req.query;
    const orders = await store.getOrders(req.params.orgId, status as string | undefined);
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Update order ---
router.put('/orgs/:orgId/orders/:id', async (req: Request<{ orgId: string; id: string }>, res: Response) => {
  try {
    const { status, notes, delivery_type } = req.body;
    if (status) {
      const ok = await store.updateOrderStatus(req.params.id, status);
      if (!ok) { res.status(500).json({ error: 'Failed to update order' }); return; }
    }
    // Update notes/delivery_type if provided
    if (notes !== undefined || delivery_type !== undefined) {
      const updates: any = {};
      if (notes !== undefined) updates.notes = notes;
      if (delivery_type !== undefined) updates.delivery_type = delivery_type;
      updates.updated_at = new Date().toISOString();
      await store.getSupabase().from('olo_orders').update(updates).eq('id', req.params.id);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Delete order ---
router.delete('/orgs/:orgId/orders/:id', async (req: Request<{ orgId: string; id: string }>, res: Response) => {
  try {
    const ok = await store.deleteOrder(req.params.id);
    if (!ok) { res.status(500).json({ error: 'Failed to delete order' }); return; }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- List customers ---
router.get('/orgs/:orgId/customers', async (req: Request<{ orgId: string }>, res: Response) => {
  const { data, error } = await store.getSupabase()
    .from('customers')
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

// --- Create customer manually ---
router.post('/orgs/:orgId/customers', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { data, error } = await store.getSupabase()
      .from('customers')
      .insert({ ...req.body, org_id: req.params.orgId, organization_id: req.params.orgId })
      .select()
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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

// --- Feedback ---
router.post('/feedbacks', async (req: Request, res: Response) => {
  try {
    const { message, url, org_id } = req.body;
    const { error } = await store.getSupabase()
      .from('feedbacks')
      .insert({ message, url, org_id });
    
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
// --- Catalog Categories ---
router.get('/orgs/:orgId/catalog/categories', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const categories = await store.getCategories(req.params.orgId);
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orgs/:orgId/catalog/categories', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) { res.status(400).json({ error: 'Name is required' }); return; }
    const category = await store.createCategory(req.params.orgId, name);
    res.status(201).json(category);
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
      .from('conversations').select('*', { count: 'exact', head: true });

    const { count: totalMsgs } = await store.getSupabase()
      .from('messages').select('*', { count: 'exact', head: true });

    const { count: activeHandoffs } = await store.getSupabase()
      .from('conversations').select('*', { count: 'exact', head: true })
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

// --- Owner Preview Mode (test bot as client) ---
router.get('/orgs/:orgId/preview-mode', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { data, error } = await store.getSupabase()
      .from('organizations')
      .select('preview_mode')
      .eq('id', req.params.orgId)
      .single();
    if (error) { res.status(500).json({ error: error.message }); return; }
    res.json({ mode: data?.preview_mode || 'owner' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orgs/:orgId/preview-mode', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { mode } = req.body;
    if (mode !== 'owner' && mode !== 'client') {
      res.status(400).json({ error: 'mode must be "owner" or "client"' });
      return;
    }
    const { error } = await store.getSupabase()
      .from('organizations')
      .update({ preview_mode: mode })
      .eq('id', req.params.orgId);
    
    if (error) { res.status(500).json({ error: error.message }); return; }
    console.log(`[PreviewMode] Org ${req.params.orgId} → ${mode}`);

    // --- Automatically clear the owner's test conversation history so the AI doesn't get confused by past messages ---
    const ownerTgId = await store.getOwnerTelegramId(req.params.orgId);
    if (ownerTgId) {
      const customer = await store.getOrCreateCustomer(req.params.orgId, 'telegram', ownerTgId, 'Owner');
      if (customer) {
        // We get the existing conversation by searching it
        const { data: convs } = await store.getSupabase()
          .from('conversations')
          .select('id')
          .eq('organization_id', req.params.orgId)
          .eq('customer_id', customer.id);
        
        if (convs && convs.length > 0) {
          const convIds = convs.map(c => c.id);
          const { error: delError } = await store.getSupabase()
            .from('messages')
            .delete()
            .in('conversation_id', convIds);
            
          if (delError) console.error('[PreviewMode] Failed to clear history:', delError);
          else console.log('[PreviewMode] Cleared owner test conversation history for clean slate');
        }
      }
    }

    res.json({ mode });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Workers ---
router.get('/orgs/:orgId/workers', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const workers = await store.getWorkers(req.params.orgId);
    res.json(workers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orgs/:orgId/workers', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const worker = await store.createWorker({ ...req.body, org_id: req.params.orgId });
    if (!worker) { res.status(500).json({ error: 'Falha ao criar colaborador' }); return; }
    res.json(worker);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/orgs/:orgId/workers/:workerId', async (req: Request<{ orgId: string; workerId: string }>, res: Response) => {
  try {
    const ok = await store.updateWorker(req.params.workerId, req.body);
    if (!ok) { res.status(500).json({ error: 'Falha ao atualizar colaborador' }); return; }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/orgs/:orgId/workers/:workerId', async (req: Request<{ orgId: string; workerId: string }>, res: Response) => {
  try {
    const ok = await store.deleteWorker(req.params.workerId);
    if (!ok) { res.status(500).json({ error: 'Falha ao remover colaborador' }); return; }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Work Sessions ---
router.get('/orgs/:orgId/work-sessions', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { worker_id, date_from } = req.query;
    const sessions = await store.getWorkSessions(
      req.params.orgId,
      worker_id as string | undefined,
      date_from as string | undefined
    );
    res.json(sessions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orgs/:orgId/work-sessions', async (req: Request<{ orgId: string }>, res: Response) => {
  try {
    const { worker_id, check_in, check_out, notes } = req.body;
    if (!worker_id || !check_in) {
      res.status(400).json({ error: 'worker_id and check_in are required' });
      return;
    }
    const session = await store.createManualWorkSession(
      req.params.orgId, worker_id, check_in, check_out || undefined, notes || undefined
    );
    res.json({ success: true, session });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
