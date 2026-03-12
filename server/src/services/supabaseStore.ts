// =============================================
// Olo.AI — Supabase Store (Persistence Layer)
// =============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Organization, Customer, Conversation, Message, CatalogItem, Appointment } from '../types/index.js';

// Server uses service_role key — bypasses RLS
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
  const { data, error } = await getSupabase()
    .from('organizations')
    .select('*')
    .eq('telegram_bot_token', botToken)
    .single();
  if (error) return null;
  return data;
}

export async function updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
  const { error } = await getSupabase()
    .from('organizations')
    .update(updates)
    .eq('id', orgId);
  if (error) console.error('updateOrganization error:', error);
}

// --- Customers ---
export async function getOrCreateCustomer(
  orgId: string,
  channel: 'telegram' | 'whatsapp',
  channelId: string,
  name?: string
): Promise<Customer | null> {
  const field = channel === 'telegram' ? 'telegram_id' : 'whatsapp_id';

  // Try to find existing
  const { data: existing } = await getSupabase()
    .from('olo_customers')
    .select('*')
    .eq('org_id', orgId)
    .eq(field, channelId)
    .single();

  if (existing) {
    // Update last contact
    await getSupabase()
      .from('olo_customers')
      .update({ last_contact_at: new Date().toISOString(), name: name || existing.name })
      .eq('id', existing.id);
    return existing;
  }

  // Create new customer
  const { data: newCustomer, error } = await getSupabase()
    .from('olo_customers')
    .insert({
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
    .from('olo_customers')
    .update(updates)
    .eq('id', customerId);
  if (error) console.error('updateCustomer error:', error);
}

// --- Conversations ---
export async function getOrCreateConversation(
  orgId: string,
  customerId: string,
  channel: 'telegram' | 'whatsapp'
): Promise<Conversation | null> {
  // Find active conversation
  const { data: existing } = await getSupabase()
    .from('olo_conversations')
    .select('*')
    .eq('org_id', orgId)
    .eq('customer_id', customerId)
    .eq('channel', channel)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing;

  // Create new conversation
  const { data: newConv, error } = await getSupabase()
    .from('olo_conversations')
    .insert({
      org_id: orgId,
      customer_id: customerId,
      channel,
      status: 'active',
    })
    .select()
    .single();

  if (error) { console.error('getOrCreateConversation error:', error); return null; }

  // Increment customer conversation count
  try {
    await getSupabase()
      .from('olo_customers')
      .update({ total_conversations: 1 })
      .eq('id', customerId);
  } catch {
    // Silent fallback
  }

  return newConv;
}

// --- Messages ---
export async function getConversationMessages(
  conversationId: string,
  limit: number = 20
): Promise<Message[]> {
  const { data, error } = await getSupabase()
    .from('olo_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) { console.error('getConversationMessages error:', error); return []; }
  return data || [];
}

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system' | 'tool',
  content: string,
  extra?: { tool_calls?: any; tool_results?: any; tokens_used?: number }
): Promise<Message | null> {
  const { data, error } = await getSupabase()
    .from('olo_messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      ...extra,
    })
    .select()
    .single();

  if (error) { console.error('saveMessage error:', error); return null; }
  return data;
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
    .eq('is_available', true);

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
    .eq('org_id', orgId)
    .order('sort_order', { ascending: true });
  if (error) return [];
  return data || [];
}

// --- Appointments ---
export async function getAppointments(
  orgId: string,
  date?: string,
  status?: string
): Promise<Appointment[]> {
  let q = getSupabase()
    .from('appointments')
    .select('*, olo_customers(name, phone)')
    .eq('org_id', orgId);

  if (date) q = q.eq('date', date);
  if (status) q = q.eq('status', status);

  const { data, error } = await q.order('date', { ascending: true }).order('time_start', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function createAppointment(appt: Partial<Appointment>): Promise<Appointment | null> {
  const { data, error } = await getSupabase()
    .from('appointments')
    .insert(appt)
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
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
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
    const orderItems = items.map(item => ({
      ...item,
      order_id: order.id,
    }));
    await getSupabase().from('olo_order_items').insert(orderItems);
  }

  return order;
}

// --- Stock ---
export async function updateStock(itemId: string, quantity: number): Promise<boolean> {
  const { error } = await getSupabase()
    .from('catalog_items')
    .update({ stock_quantity: quantity, updated_at: new Date().toISOString() })
    .eq('id', itemId);
  return !error;
}

export async function getStockAlerts(orgId: string): Promise<CatalogItem[]> {
  const { data, error } = await getSupabase()
    .from('catalog_items')
    .select('*')
    .eq('org_id', orgId)
    .not('stock_quantity', 'is', null)
    .filter('stock_quantity', 'lte', 'stock_min_alert');

  // Fallback: manually filter since Supabase column-to-column comparison via .filter is limited
  if (error || !data) return [];
  return data.filter(item => item.stock_quantity !== null && item.stock_quantity <= item.stock_min_alert);
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
    .insert({
      org_id: orgId,
      conversation_id: conversationId,
      customer_id: customerId,
      reason,
    })
    .select()
    .single();

  if (error) { console.error('createHandoffRequest error:', error); return null; }

  // Update conversation status
  await getSupabase()
    .from('olo_conversations')
    .update({ status: 'handoff' })
    .eq('id', conversationId);

  return data;
}

// --- User Role Resolution ---
export async function getUserRole(supabaseUserId: string): Promise<{ role: string; orgId: string } | null> {
  const { data, error } = await getSupabase()
    .from('users')
    .select('role, org_id')
    .eq('id', supabaseUserId)
    .single();
  if (error || !data) return null;
  return { role: data.role, orgId: data.org_id };
}

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
