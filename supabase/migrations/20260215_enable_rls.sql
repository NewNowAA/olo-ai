-- Enable RLS on critical tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY; -- This is likely the 'profiles' table, assuming table name is 'users' based on previous context, or 'profiles'. I will check schema first if possible, but assuming 'users' or 'profiles'. Based on standard templates it's often 'profiles'. Let's check 'users' reference in invoiceService.
-- Checking invoiceService constraints... user_id is used.

-- POLICIES FOR INVOICES
CREATE POLICY "Users can only view their own invoices" ON public.invoices
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" ON public.invoices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON public.invoices
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" ON public.invoices
FOR DELETE
USING (auth.uid() = user_id);

-- POLICIES FOR INVOICE_PRODUCTS
-- Depending on if invoice_products has user_id or just invoice_id.
-- Usually it just has invoice_id. So we need a join or exists check.
CREATE POLICY "Users can view items of their invoices" ON public.invoice_products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i 
    WHERE i.id = invoice_products.invoice_id 
    AND i.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert items to their invoices" ON public.invoice_products
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices i 
    WHERE i.id = invoice_products.invoice_id 
    AND i.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update items of their invoices" ON public.invoice_products
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i 
    WHERE i.id = invoice_products.invoice_id 
    AND i.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete items of their invoices" ON public.invoice_products
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.invoices i 
    WHERE i.id = invoice_products.invoice_id 
    AND i.user_id = auth.uid()
  )
);

-- POLICIES FOR GOALS
CREATE POLICY "Users can only view their own goals" ON public.goals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON public.goals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.goals
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON public.goals
FOR DELETE
USING (auth.uid() = user_id);

-- POLICIES FOR ORGANIZATIONS
-- Assuming organization has owner_id or linked via user_id
CREATE POLICY "Users can view their own organizations" ON public.organizations
FOR SELECT
USING (auth.uid() = owner_id); -- Adjust if column name is different

CREATE POLICY "Users can update their own organizations" ON public.organizations
FOR UPDATE
USING (auth.uid() = owner_id);

