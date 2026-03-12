-- =============================================
-- Olo.AI Phase 1 Schema — Core IA Tables
-- =============================================

-- 1. Extend organizations table with Olo.AI fields
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS sector text DEFAULT 'generico' CHECK (sector IN ('restaurante','clinica','salao','generico')),
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS agent_name text DEFAULT 'Olo',
  ADD COLUMN IF NOT EXISTS agent_tone text DEFAULT 'profissional',
  ADD COLUMN IF NOT EXISTS agent_greeting text,
  ADD COLUMN IF NOT EXISTS agent_system_prompt text,
  ADD COLUMN IF NOT EXISTS setup_progress integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS telegram_bot_token text,
  ADD COLUMN IF NOT EXISTS telegram_chat_id text;

-- 2. Catalog Categories
CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Catalog Items (products/services)
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.catalog_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'AOA',
  unit text DEFAULT 'un',
  stock_quantity integer,
  stock_min_alert integer DEFAULT 5,
  is_available boolean DEFAULT true,
  image_url text,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Customers (people who interact with the bot)
CREATE TABLE IF NOT EXISTS public.olo_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  telegram_id text,
  whatsapp_id text,
  name text,
  phone text,
  email text,
  notes text,
  tags text[] DEFAULT '{}',
  first_contact_at timestamptz DEFAULT now(),
  last_contact_at timestamptz DEFAULT now(),
  total_conversations integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, telegram_id),
  UNIQUE(org_id, whatsapp_id)
);

-- 5. Conversations (bot conversations)
CREATE TABLE IF NOT EXISTS public.olo_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.olo_customers(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'telegram' CHECK (channel IN ('telegram','whatsapp')),
  status text DEFAULT 'active' CHECK (status IN ('active','closed','handoff')),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  summary text,
  satisfaction_rating integer CHECK (satisfaction_rating BETWEEN 1 AND 5),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Messages (individual messages in conversations)
CREATE TABLE IF NOT EXISTS public.olo_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.olo_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content text NOT NULL,
  tool_calls jsonb,
  tool_results jsonb,
  tokens_used integer,
  created_at timestamptz DEFAULT now()
);

-- 7. Appointments (bookings/reservations)
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.olo_customers(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  professional_name text,
  date date NOT NULL,
  time_start time NOT NULL,
  time_end time,
  status text DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled','completed','no_show')),
  notes text,
  source text DEFAULT 'bot' CHECK (source IN ('bot','dashboard','phone')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. Orders
CREATE TABLE IF NOT EXISTS public.olo_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.olo_customers(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.olo_conversations(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
  total_amount numeric(12,2) DEFAULT 0,
  currency text DEFAULT 'AOA',
  notes text,
  delivery_type text DEFAULT 'takeaway' CHECK (delivery_type IN ('takeaway','delivery','dine_in')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. Order Items
CREATE TABLE IF NOT EXISTS public.olo_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.olo_orders(id) ON DELETE CASCADE,
  catalog_item_id uuid REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 10. Business Hours
CREATE TABLE IF NOT EXISTS public.business_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  open_time time NOT NULL,
  close_time time NOT NULL,
  is_closed boolean DEFAULT false,
  UNIQUE(org_id, day_of_week)
);

-- 11. Handoff Requests (transfer to human)
CREATE TABLE IF NOT EXISTS public.handoff_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.olo_conversations(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.olo_customers(id) ON DELETE SET NULL,
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','accepted','resolved','expired')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- =============================================
-- Indexes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_catalog_items_org ON catalog_items(org_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_category ON catalog_items(category_id);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_org ON catalog_categories(org_id);
CREATE INDEX IF NOT EXISTS idx_olo_customers_org ON olo_customers(org_id);
CREATE INDEX IF NOT EXISTS idx_olo_customers_telegram ON olo_customers(telegram_id);
CREATE INDEX IF NOT EXISTS idx_olo_conversations_org ON olo_conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_olo_conversations_customer ON olo_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_olo_messages_conversation ON olo_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_appointments_org ON appointments(org_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(org_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_olo_orders_org ON olo_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_olo_orders_customer ON olo_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_org ON business_hours(org_id);
CREATE INDEX IF NOT EXISTS idx_handoff_requests_org ON handoff_requests(org_id);

-- =============================================
-- RLS Policies
-- =============================================

ALTER TABLE catalog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE olo_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE olo_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE olo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE olo_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE olo_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoff_requests ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's org_id
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Catalog Categories: users can manage their org's categories
CREATE POLICY "org_catalog_categories" ON catalog_categories
  FOR ALL USING (org_id = public.get_user_org_id());

-- Catalog Items: users can manage their org's items
CREATE POLICY "org_catalog_items" ON catalog_items
  FOR ALL USING (org_id = public.get_user_org_id());

-- Customers: users can view their org's customers
CREATE POLICY "org_customers" ON olo_customers
  FOR ALL USING (org_id = public.get_user_org_id());

-- Conversations: users can view their org's conversations
CREATE POLICY "org_conversations" ON olo_conversations
  FOR ALL USING (org_id = public.get_user_org_id());

-- Messages: users can view messages from their org's conversations
CREATE POLICY "org_messages" ON olo_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM olo_conversations WHERE org_id = public.get_user_org_id()
    )
  );

-- Appointments: users can manage their org's appointments
CREATE POLICY "org_appointments" ON appointments
  FOR ALL USING (org_id = public.get_user_org_id());

-- Orders: users can view their org's orders
CREATE POLICY "org_orders" ON olo_orders
  FOR ALL USING (org_id = public.get_user_org_id());

-- Order Items: via order's org
CREATE POLICY "org_order_items" ON olo_order_items
  FOR ALL USING (
    order_id IN (
      SELECT id FROM olo_orders WHERE org_id = public.get_user_org_id()
    )
  );

-- Business Hours: users can manage their org's hours
CREATE POLICY "org_business_hours" ON business_hours
  FOR ALL USING (org_id = public.get_user_org_id());

-- Handoff Requests: users can view their org's handoffs
CREATE POLICY "org_handoff_requests" ON handoff_requests
  FOR ALL USING (org_id = public.get_user_org_id());

-- =============================================
-- Service Role Policies (for the backend server)
-- The server uses the service_role key and bypasses RLS.
-- These policies are only for dashboard/frontend access.
-- =============================================
