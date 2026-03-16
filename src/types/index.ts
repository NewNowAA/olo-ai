// =============================================
// Olo.AI — Frontend Type Definitions
// =============================================

export type Role = 'dev' | 'owner' | 'client';
export type Sector = 'restaurante' | 'clinica' | 'salao' | 'farmacia' | 'hotel' | 'academia' | 'advogado' | 'oficina' | 'loja' | 'generico';
export type Channel = 'telegram' | 'whatsapp';
export type ConversationStatus = 'active' | 'closed' | 'handoff';
export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

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
  absence_message?: string;
  first_contact_message?: string;
  setup_progress: number;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  currency_default: string;
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
  catalog_categories?: { name: string };
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
  created_at: string;
  updated_at: string;
  customers?: { name?: string; telegram_id?: string };
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
  customers?: { name?: string; phone?: string };
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
  delivery_type: 'takeaway' | 'delivery' | 'dine_in';
  created_at: string;
}

export interface BusinessHour {
  id: string;
  org_id: string;
  day_of_week: number; // 0=Sunday
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface DashboardStats {
  conversations_today: number;
  active_conversations: number;
  pending_appointments: number;
  stock_alerts: number;
  messages_by_day: { date: string; count: number }[];
}

export type AuthView = 'landing' | 'login' | 'register';
export type PageId = string;
