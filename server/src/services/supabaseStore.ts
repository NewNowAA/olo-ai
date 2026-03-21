// =============================================
// Olo.AI — Supabase Store (Persistence Layer)
// =============================================
// Schema-aligned with actual DB (2026-03-14)
// =============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Organization, Customer, Conversation, Message, CatalogItem, Appointment } from '../types/index.js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let _supabase: SupabaseClient;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

// --- Organization ---
export async function getOrganization(orgId: string): Promise<Organization | null> {
  const { data, error } = await getSupabase()
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();
  if (error) { console.error('getOrganization error:', error); return null; }
  return data;
}

export async function getOrgByTelegramToken(botToken: string): Promise<Organization | null> {
  const { data } = await getSupabase()
    .from('organizations')
    .select('*')
    .eq('telegram_bot_token', botToken)
    .single();
  return data || null;
}

export async function updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
  const { error } = await getSupabase()
    .from('organizations')
    .update(updates)
    .eq('id', orgId);
  if (error) console.error('updateOrganization error:', error);
}

// --- Customers ---
// DB: customers has organization_id (NOT NULL) and org_id (nullable duplicate)
export async function getOrCreateCustomer(
  orgId: string,
  channel: 'telegram' | 'whatsapp',
  channelId: string,
  name?: string
): Promise<Customer | null> {
  const field = channel === 'telegram' ? 'telegram_id' : 'whatsapp_id';

  // Try to find existing by org_id (used as primary lookup key)
  const { data: existing } = await getSupabase()
    .from('customers')
    .select('*')
    .eq('org_id', orgId)
    .eq(field, channelId)
    .maybeSingle();

  if (existing) {
    await getSupabase()
      .from('customers')
      .update({ last_contact_at: new Date().toISOString(), name: name || existing.name })
      .eq('id', existing.id);
    return existing;
  }

  // Create with BOTH organization_id (NOT NULL) and org_id
  const { data: newCustomer, error } = await getSupabase()
    .from('customers')
    .insert({
      organization_id: orgId,
      org_id: orgId,
      [field]: channelId,
      name: name || undefined,
    })
    .select()
    .single();

  if (error) { console.error('getOrCreateCustomer insert error:', error); return null; }
  return newCustomer;
}

export async function updateCustomer(customerId: string, updates: Partial<Customer>): Promise<void> {
  const { error } = await getSupabase()
    .from('customers')
    .update(updates)
    .eq('id', customerId);
  if (error) console.error('updateCustomer error:', error);
}

// --- Conversations ---
// DB: organization_id (NOT NULL), external_chat_id (NOT NULL), status default 'open'
export async function getOrCreateConversation(
  orgId: string,
  customerId: string,
  channel: 'telegram' | 'whatsapp',
  externalChatId: string = 'unknown'
): Promise<Conversation | null> {
  // Find active/open conversation
  const { data: existing } = await getSupabase()
    .from('conversations')
    .select('*')
    .eq('organization_id', orgId)
    .eq('customer_id', customerId)
    .eq('channel', channel)
    .in('status', ['open', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  const { data: newConv, error } = await getSupabase()
    .from('conversations')
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      channel,
      external_chat_id: externalChatId,
      status: 'open',
    })
    .select()
    .single();

  if (error) { console.error('getOrCreateConversation error:', error); return null; }

  // Increment customer conversation count (best-effort)
  await getSupabase()
    .from('customers')
    .update({ total_conversations: (await getSupabase().from('customers').select('total_conversations').eq('id', customerId).single()).data?.total_conversations + 1 || 1 })
    .eq('id', customerId);

  return newConv;
}

// --- Messages ---
// DB: organization_id (NOT NULL), sender_role, direction, message_type (all NOT NULL)
export async function getConversationMessages(
  conversationId: string,
  limit: number = 20
): Promise<Message[]> {
  // Fetch the most recent N messages (DESC) and then reverse to chronological order.
  // This ensures we always have the latest context, not the oldest messages.
  const { data, error } = await getSupabase()
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) { console.error('getConversationMessages error:', error); return []; }

  // Reverse to chronological order (oldest first) for conversation flow
  const chronological = (data || []).reverse();

  // Map DB schema → internal Message type (sender_role → role)
  return chronological.map((m: any) => ({
    ...m,
    role: m.sender_role === 'client' ? 'user'
        : m.sender_role === 'assistant' ? 'assistant'
        : m.sender_role === 'owner' ? 'user'
        : 'user',
    content: m.content,
  }));
}

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system' | 'tool',
  content: string,
  extra?: { tool_calls?: any; tool_results?: any; tokens_used?: number; org_id?: string }
): Promise<Message | null> {
  // Map internal role → DB sender_role
  const senderRole = role === 'user' ? 'client' : 'assistant';
  const direction = role === 'user' ? 'inbound' : 'outbound';

  // Get org_id from conversation if not provided
  let orgId = extra?.org_id;
  if (!orgId) {
    const { data: conv } = await getSupabase()
      .from('conversations')
      .select('organization_id')
      .eq('id', conversationId)
      .single();
    orgId = conv?.organization_id;
  }

  const { data, error } = await getSupabase()
    .from('messages')
    .insert({
      conversation_id: conversationId,
      organization_id: orgId,
      sender_role: senderRole,
      direction,
      message_type: 'text',
      content,
      metadata: extra?.tool_calls ? { tool_calls: extra.tool_calls, tokens_used: extra.tokens_used } : undefined,
    })
    .select()
    .single();

  if (error) { console.error('saveMessage error:', error); return null; }
  // Map back to internal type
  return data ? { ...data, role } : null;
}

// --- Catalog ---
export async function searchCatalog(
  orgId: string,
  query?: string,
  categoryId?: string,
  limit: number = 10
): Promise<CatalogItem[]> {
  let q = getSupabase()
    .from('catalog_items')
    .select('*, catalog_categories(name)')
    .eq('org_id', orgId)
    .eq('active', true);

  if (categoryId) q = q.eq('category_id', categoryId);
  if (query) q = q.ilike('name', `%${query}%`);

  const { data, error } = await q.limit(limit);
  if (error) { console.error('searchCatalog error:', error); return []; }
  return data || [];
}

export async function getCatalogItem(itemId: string): Promise<CatalogItem | null> {
  const { data, error } = await getSupabase()
    .from('catalog_items')
    .select('*, catalog_categories(name)')
    .eq('id', itemId)
    .single();
  if (error) return null;
  return data;
}

export async function getCategories(orgId: string): Promise<any[]> {
  const { data, error } = await getSupabase()
    .from('catalog_categories')
    .select('*')
    .eq('org_id', orgId);
  if (error) return [];
  return data || [];
}

export async function createCategory(orgId: string, name: string): Promise<any> {
  const { data, error } = await getSupabase()
    .from('catalog_categories')
    .insert({ org_id: orgId, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- Appointments ---
// DB: datetime (timestamptz), end_time (timestamptz), service_name (text NOT NULL)
export async function getAppointments(
  orgId: string,
  date?: string,
  status?: string
): Promise<any[]> {
  let q = getSupabase()
    .from('appointments')
    .select('*, customers(name, phone)')
    .eq('org_id', orgId);

  // Filter by date using datetime range
  if (date) {
    q = q.gte('datetime', `${date}T00:00:00+00:00`).lt('datetime', `${date}T23:59:59+00:00`);
  }
  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('datetime', { ascending: true });
  if (error) { console.error('getAppointments error:', error); return []; }

  // Map DB fields → code fields for backwards compatibility
  return (data || []).map((a: any) => {
    const dt = a.datetime ? new Date(a.datetime) : null;
    return {
      ...a,
      date: dt ? dt.toISOString().split('T')[0] : null,
      time_start: dt ? dt.toTimeString().substring(0, 5) : null,
      time_end: a.end_time ? new Date(a.end_time).toTimeString().substring(0, 5) : null,
    };
  });
}

export async function createAppointment(appt: {
  org_id: string;
  customer_id?: string;
  service_id?: string;
  service_name?: string;
  date?: string;
  time_start?: string;
  datetime?: string;
  end_time?: string;
  status?: string;
  notes?: string;
  source?: string;
}): Promise<any | null> {
  // Build datetime from date + time_start if not provided directly
  let datetime = appt.datetime;
  let end_time = appt.end_time;

  if (!datetime && appt.date && appt.time_start) {
    datetime = `${appt.date}T${appt.time_start}:00`;
  }
  if (!end_time && datetime) {
    // Default 60 min duration
    end_time = new Date(new Date(datetime).getTime() + 60 * 60 * 1000).toISOString();
  }

  // service_name is NOT NULL in DB — use provided or look up
  const serviceName = appt.service_name || 'Geral';

  const { data, error } = await getSupabase()
    .from('appointments')
    .insert({
      org_id: appt.org_id,
      customer_id: appt.customer_id || null,
      datetime,
      end_time,
      service_name: serviceName,
      service_duration: 60,
      status: appt.status || 'pending',
      notes: appt.notes || null,
    })
    .select()
    .single();

  if (error) { console.error('createAppointment error:', error); return null; }
  return data;
}

export async function cancelAppointment(appointmentId: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId);
  return !error;
}

// --- Business Hours ---
export async function getBusinessHours(orgId: string): Promise<any[]> {
  const { data, error } = await getSupabase()
    .from('business_hours')
    .select('*')
    .eq('org_id', orgId)
    .order('day_of_week', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getQuickReplies(orgId: string): Promise<any[]> {
  const { data, error } = await getSupabase()
    .from('quick_replies')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) return [];
  // Normalize: keyword → trigger_words array for backwards compat
  return (data || []).map((qr: any) => ({
    ...qr,
    trigger_words: qr.trigger_words || (qr.keyword ? [qr.keyword] : []),
  }));
}

// --- Orders ---
export async function createOrder(orderData: any, items: any[]): Promise<any> {
  const { data: order, error: orderError } = await getSupabase()
    .from('olo_orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError) { console.error('createOrder error:', orderError); return null; }

  if (items.length > 0) {
    const orderItems = items.map(item => ({ ...item, order_id: order.id }));
    await getSupabase().from('olo_order_items').insert(orderItems);
  }

  return order;
}

// --- Stock ---
export async function updateStock(itemId: string, quantity: number): Promise<boolean> {
  const { error } = await getSupabase()
    .from('catalog_items')
    .update({ stock_quantity: quantity })
    .eq('id', itemId);
  return !error;
}

export async function getStockAlerts(orgId: string): Promise<CatalogItem[]> {
  const { data, error } = await getSupabase()
    .from('catalog_items')
    .select('*')
    .eq('org_id', orgId)
    .not('stock_quantity', 'is', null);

  if (error || !data) return [];
  // stock_min is the actual column (not stock_min_alert)
  return data.filter((item: any) =>
    item.stock_quantity !== null &&
    item.stock_min !== null &&
    item.stock_quantity <= item.stock_min
  );
}

// --- Handoff ---
export async function createHandoffRequest(
  orgId: string,
  conversationId: string,
  customerId?: string,
  reason?: string
): Promise<any> {
  const { data, error } = await getSupabase()
    .from('handoff_requests')
    .insert({ org_id: orgId, conversation_id: conversationId, reason })
    .select()
    .single();

  if (error) { console.error('createHandoffRequest error:', error); return null; }

  await getSupabase()
    .from('conversations')
    .update({ status: 'handoff' })
    .eq('id', conversationId);

  return data;
}

// --- User Role Resolution ---
export async function getDevTelegramIds(): Promise<string[]> {
  const devId = process.env.DEV_TELEGRAM_ID;
  return devId ? [devId] : [];
}

export async function getOwnerTelegramId(orgId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from('organizations')
    .select('telegram_chat_id')
    .eq('id', orgId)
    .single();
  return data?.telegram_chat_id || null;
}

// --- Setup Notifications ---
export async function logSetupNotification(orgId: string, message: string): Promise<void> {
  try {
    const { data: existing } = await getSupabase()
      .from('setup_notifications')
      .select('id')
      .eq('org_id', orgId)
      .eq('message', message)
      .maybeSingle();

    if (!existing) {
      await getSupabase()
        .from('setup_notifications')
        .insert({ org_id: orgId, message });
    }
  } catch (err) {
    console.error('Failed to log setup notification:', err);
  }
}

// --- Workers ---
export async function getWorkerByTelegramId(orgId: string, telegramId: string): Promise<any | null> {
  const { data } = await getSupabase()
    .from('workers')
    .select('*')
    .eq('org_id', orgId)
    .eq('telegram_id', telegramId)
    .eq('is_active', true)
    .single();
  return data || null;
}

export async function getWorkers(orgId: string): Promise<any[]> {
  const { data } = await getSupabase()
    .from('workers')
    .select('*')
    .eq('org_id', orgId)
    .order('name');
  return data || [];
}

export async function createWorker(data: { org_id: string; name: string; telegram_id?: string; permissions?: any }): Promise<any | null> {
  const { data: row, error } = await getSupabase()
    .from('workers')
    .insert(data)
    .select()
    .single();
  if (error) { console.error('createWorker error:', error); return null; }
  return row;
}

export async function updateWorker(workerId: string, updates: any): Promise<boolean> {
  const { error } = await getSupabase()
    .from('workers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', workerId);
  return !error;
}

export async function deleteWorker(workerId: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('workers')
    .update({ is_active: false })
    .eq('id', workerId);
  return !error;
}

// --- Work Sessions ---
export async function getOpenWorkSession(workerId: string): Promise<any | null> {
  const { data } = await getSupabase()
    .from('work_sessions')
    .select('*')
    .eq('worker_id', workerId)
    .is('check_out', null)
    .order('check_in', { ascending: false })
    .limit(1)
    .single();
  return data || null;
}

export async function createWorkSession(orgId: string, workerId: string): Promise<any | null> {
  const { data, error } = await getSupabase()
    .from('work_sessions')
    .insert({ org_id: orgId, worker_id: workerId, check_in: new Date().toISOString() })
    .select()
    .single();
  if (error) { console.error('createWorkSession error:', error); return null; }
  return data;
}

export async function createManualWorkSession(
  orgId: string, workerId: string, checkIn: string, checkOut?: string, notes?: string
): Promise<any> {
  const { data, error } = await getSupabase()
    .from('work_sessions')
    .insert({ org_id: orgId, worker_id: workerId, check_in: checkIn, check_out: checkOut || null, notes: notes || null })
    .select()
    .single();
  if (error) { console.error('createManualWorkSession error:', error); throw error; }
  return data;
}

export async function closeWorkSession(sessionId: string, notes?: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('work_sessions')
    .update({ check_out: new Date().toISOString(), notes: notes || null })
    .eq('id', sessionId);
  return !error;
}

export async function getWorkSessions(orgId: string, workerId?: string, dateFrom?: string): Promise<any[]> {
  let query = getSupabase()
    .from('work_sessions')
    .select('*, workers(name)')
    .eq('org_id', orgId)
    .order('check_in', { ascending: false })
    .limit(100);
  if (workerId) query = query.eq('worker_id', workerId);
  if (dateFrom) query = query.gte('check_in', dateFrom);
  const { data } = await query;
  return data || [];
}

// --- Stock Reservations ---
export async function createStockReservation(data: {
  org_id: string;
  catalog_item_id: string;
  order_id?: string;
  quantity: number;
  expires_at: string;
}): Promise<any | null> {
  const { data: row, error } = await getSupabase()
    .from('stock_reservations')
    .insert(data)
    .select()
    .single();
  if (error) { console.error('createStockReservation error:', error); return null; }
  // Increment reserved_quantity (fallback: manual increment if RPC not available)
  const { error: rpcError } = await getSupabase().rpc('increment_reserved', { item_id: data.catalog_item_id, qty: data.quantity });
  if (rpcError) {
    const { data: catalogItem } = await getSupabase()
      .from('catalog_items')
      .select('reserved_quantity')
      .eq('id', data.catalog_item_id)
      .single();
    const current = catalogItem?.reserved_quantity || 0;
    await getSupabase().from('catalog_items').update({ reserved_quantity: current + data.quantity }).eq('id', data.catalog_item_id);
  }
  return row;
}

export async function releaseStockReservation(reservationId: string): Promise<void> {
  const { data: res } = await getSupabase()
    .from('stock_reservations')
    .select('catalog_item_id, quantity')
    .eq('id', reservationId)
    .single();
  if (!res) return;
  await getSupabase().from('stock_reservations').update({ released: true }).eq('id', reservationId);
  // Decrement reserved_quantity
  const { data: item } = await getSupabase().from('catalog_items').select('reserved_quantity').eq('id', res.catalog_item_id).single();
  const current = item?.reserved_quantity || 0;
  const newQty = Math.max(0, current - res.quantity);
  await getSupabase().from('catalog_items').update({ reserved_quantity: newQty }).eq('id', res.catalog_item_id);
}

export async function releaseExpiredReservations(): Promise<void> {
  const { data: expired } = await getSupabase()
    .from('stock_reservations')
    .select('id, catalog_item_id, quantity')
    .eq('released', false)
    .lt('expires_at', new Date().toISOString());
  if (!expired || expired.length === 0) return;
  for (const res of expired) {
    await releaseStockReservation(res.id);
  }
}
