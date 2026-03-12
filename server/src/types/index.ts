// =============================================
// Olo.AI Server — Type Definitions
// =============================================

// --- Enums ---

export type Role = 'dev' | 'owner' | 'client';
export type Sector = 'restaurante' | 'clinica' | 'salao' | 'generico';
export type Channel = 'telegram' | 'whatsapp';
export type ConversationStatus = 'active' | 'closed' | 'handoff';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type DeliveryType = 'takeaway' | 'delivery' | 'dine_in';
export type HandoffStatus = 'pending' | 'accepted' | 'resolved' | 'expired';

// --- Database Entities ---

export interface Organization {
  id: string;
  name: string;
  sector: Sector;
  business_name?: string;
  address?: string;
  phone?: string;
  agent_name: string;
  agent_tone: string;
  agent_greeting?: string;
  agent_system_prompt?: string;
  setup_progress: number;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  currency_default: string;
  absence_message?: string;
  first_contact_message?: string;
}

export interface CatalogCategory {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CatalogItem {
  id: string;
  org_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  unit: string;
  stock_quantity?: number;
  stock_min_alert: number;
  is_available: boolean;
  image_url?: string;
  tags: string[];
  metadata: Record<string, any>;
}

export interface Customer {
  id: string;
  org_id: string;
  telegram_id?: string;
  whatsapp_id?: string;
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  tags: string[];
  first_contact_at: string;
  last_contact_at: string;
  total_conversations: number;
}

export interface Conversation {
  id: string;
  org_id: string;
  customer_id?: string;
  channel: Channel;
  status: ConversationStatus;
  started_at: string;
  ended_at?: string;
  summary?: string;
  satisfaction_rating?: number;
  metadata: Record<string, any>;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: any;
  tool_results?: any;
  tokens_used?: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  org_id: string;
  customer_id?: string;
  service_id?: string;
  professional_name?: string;
  date: string;
  time_start: string;
  time_end?: string;
  status: AppointmentStatus;
  notes?: string;
  source: 'bot' | 'dashboard' | 'phone';
}

export interface Order {
  id: string;
  org_id: string;
  customer_id?: string;
  conversation_id?: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  notes?: string;
  delivery_type: DeliveryType;
}

export interface OrderItem {
  id: string;
  order_id: string;
  catalog_item_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export interface BusinessHour {
  id: string;
  org_id: string;
  day_of_week: number; // 0=Sunday
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface HandoffRequest {
  id: string;
  org_id: string;
  conversation_id: string;
  customer_id?: string;
  reason?: string;
  status: HandoffStatus;
  assigned_to?: string;
  created_at: string;
  resolved_at?: string;
}

// --- Engine Context Types ---

export interface UserContext {
  role: Role;
  orgId: string;
  userId?: string; // Supabase auth user id (for owners/devs)
  customerId?: string; // customers id (for clients)
  telegramId?: string;
  whatsappId?: string;
  channel: Channel;
}

export interface ConversationContext {
  conversationId: string;
  org: Organization;
  customer?: Customer;
  userContext: UserContext;
  messages: Message[];
}

export interface ToolCallResult {
  name: string;
  result: Record<string, any>;
}

export interface PlaceholderResult {
  missing: boolean;
  field: string;
  priority: 'P0' | 'P1' | 'P2';
  message: string;
}

// --- Telegram Types ---

export interface InlineButton {
  text: string;
  callback_data: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramCallbackQuery {
  id: string;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  date: number;
  text?: string;
  photo?: any[];
  voice?: any;
  document?: any;
}

// --- Sector Config ---

export interface SectorConfig {
  sector: Sector;
  basePersona: string;
  activeTools: string[];
  guardrailsExtra: string[];
  placeholders: { field: string; required: boolean; priority: 'P0' | 'P1' | 'P2' }[];
  samplePrompt: string;
}
