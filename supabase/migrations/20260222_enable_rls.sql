-- Ativar RLS nas tabelas principais
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- INVOICES POLICIES
-- ----------------------------------------------------
-- Policy: Users só podem ver as suas próprias faturas
CREATE POLICY "Users can view own invoices" ON public.invoices
    FOR SELECT USING (user_id = auth.uid());

-- Policy: Users podem inserir faturas
CREATE POLICY "Users can insert own invoices" ON public.invoices
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users podem atualizar as suas faturas
CREATE POLICY "Users can update own invoices" ON public.invoices
    FOR UPDATE USING (user_id = auth.uid());

-- Policy: Users podem apagar as suas faturas
CREATE POLICY "Users can delete own invoices" ON public.invoices
    FOR DELETE USING (user_id = auth.uid());


-- ----------------------------------------------------
-- INVOICE PRODUCTS POLICIES
-- ----------------------------------------------------
-- Policy: para invoice_products (baseada na fatura pai)
CREATE POLICY "Users can manage own invoice products" ON public.invoice_products
    FOR ALL USING (
        invoice_id IN (SELECT id FROM public.invoices WHERE user_id = auth.uid())
    );


-- ----------------------------------------------------
-- USERS POLICIES
-- ----------------------------------------------------
-- Policy: Users podem ver e editar o próprio perfil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (id = auth.uid());

-- Policy: Permitir registo (insert) anónimo na tabela users
CREATE POLICY "Allow anonymous user creation" ON public.users
    FOR INSERT WITH CHECK (true);
