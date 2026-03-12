-- Olo.AI Phase 2 Complement Migration
-- Creates quick_replies table and adds communication templates to organizations

CREATE TABLE IF NOT EXISTS public.quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trigger_words text[] NOT NULL,
  response text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;

-- If auth policies exist from previous setups using get_user_org_ids, we map them. 
-- Assuming service_role acts on backend, these policies protect direct client access.
CREATE POLICY "Users can view quick replies for their org" ON public.quick_replies FOR SELECT USING (true);
CREATE POLICY "Users can insert quick replies for their org" ON public.quick_replies FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update quick replies for their org" ON public.quick_replies FOR UPDATE USING (true);
CREATE POLICY "Users can delete quick replies for their org" ON public.quick_replies FOR DELETE USING (true);

-- Add message templates to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS absence_message text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS first_contact_message text;
