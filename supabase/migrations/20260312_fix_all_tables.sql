-- =============================================
-- Olo.AI — Fix All Missing Tables & Columns
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. quick_replies (referenced by AgentConfig, Onboarding, assistantEngine)
CREATE TABLE IF NOT EXISTS public.quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trigger_words text[] NOT NULL,
  response text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quick_replies' AND policyname = 'qr_select') THEN
    CREATE POLICY "qr_select" ON public.quick_replies FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quick_replies' AND policyname = 'qr_insert') THEN
    CREATE POLICY "qr_insert" ON public.quick_replies FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quick_replies' AND policyname = 'qr_update') THEN
    CREATE POLICY "qr_update" ON public.quick_replies FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quick_replies' AND policyname = 'qr_delete') THEN
    CREATE POLICY "qr_delete" ON public.quick_replies FOR DELETE USING (true);
  END IF;
END $$;

-- 2. stock_movements (referenced by apiRoutes stock/movement endpoint)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  catalog_item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('in','out','adjustment')),
  quantity integer NOT NULL,
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_movements' AND policyname = 'sm_all') THEN
    CREATE POLICY "sm_all" ON public.stock_movements FOR ALL USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stock_movements_org ON stock_movements(org_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(catalog_item_id);

-- 3. Ensure org columns exist
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS absence_message text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS first_contact_message text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS telegram_bot_token text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS telegram_chat_id text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS sector text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS agent_name text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS agent_tone text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS agent_greeting text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS agent_system_prompt text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS setup_progress integer DEFAULT 0;

-- 4. setup_notifications table
CREATE TABLE IF NOT EXISTS public.setup_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.setup_notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'setup_notifications' AND policyname = 'sn_all') THEN
    CREATE POLICY "sn_all" ON public.setup_notifications FOR ALL USING (true);
  END IF;
END $$;

-- Done! All tables the code references now exist.
