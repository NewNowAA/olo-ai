-- Function to get current user's org_id safely (Security Definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid();
$$;

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR USERS (Profiles)
-- Users can read their own profile
CREATE POLICY "Read own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Users can read profiles of teammates
CREATE POLICY "Read teammates" ON public.users
FOR SELECT USING (org_id = get_my_org_id());

-- Users can update only their own profile
CREATE POLICY "Update own profile" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- POLICIES FOR ORGANIZATIONS
-- Users can read their own organization
CREATE POLICY "Read own organization" ON public.organizations
FOR SELECT USING (id = get_my_org_id());

-- Users can update their own organization (Implementation detail: UI should restrict to admin)
CREATE POLICY "Update own organization" ON public.organizations
FOR UPDATE USING (id = get_my_org_id());

-- POLICIES FOR INVOICES (Linked via user_id -> org_id)
-- Access: If invoice creator belongs to same org as current user
CREATE POLICY "Org Access Invoices" ON public.invoices
FOR ALL
USING (
  user_id IN (
    SELECT id FROM public.users WHERE org_id = get_my_org_id()
  )
);

-- POLICIES FOR INVOICE PRODUCTS
CREATE POLICY "Org Access Invoice Items" ON public.invoice_products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i
    WHERE i.id = invoice_products.invoice_id
    AND i.user_id IN (
        SELECT id FROM public.users WHERE org_id = get_my_org_id()
    )
  )
);

-- POLICIES FOR GOALS
CREATE POLICY "Org Access Goals" ON public.goals
FOR ALL
USING (
  user_id IN (
    SELECT id FROM public.users WHERE org_id = get_my_org_id()
  )
);
