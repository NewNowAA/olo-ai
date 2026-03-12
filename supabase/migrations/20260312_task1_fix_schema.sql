-- =============================================
-- Olo.AI — Task 1 Schema Fixes
-- Aligning DB columns with actual TypeScript types
-- =============================================

-- 1. Align catalog_items
-- TS Type uses 'is_available' instead of 'active'
ALTER TABLE public.catalog_items RENAME COLUMN active TO is_available;

-- 2. Align business_hours
-- TS Type uses 'is_closed' instead of 'closed'
ALTER TABLE public.business_hours RENAME COLUMN closed TO is_closed;

-- 3. Align organizations persona messages
-- Add missing smart placeholder fields
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS absence_message text,
  ADD COLUMN IF NOT EXISTS first_contact_message text;

-- 4. Create setup_notifications table (for Task 2)
CREATE TABLE IF NOT EXISTS public.setup_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new table
ALTER TABLE public.setup_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for setup_notifications
CREATE POLICY "View own notifications" ON public.setup_notifications
  FOR SELECT USING (org_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Update own notifications" ON public.setup_notifications
  FOR UPDATE USING (org_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Insert own notifications" ON public.setup_notifications
  FOR INSERT WITH CHECK (org_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
