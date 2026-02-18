-- Phase 2 Schema Updates
-- Tasks 2.1, 2.2, 2.3, 2.4, 2.5

-- Tarefa 2.1: Unificar moeda para AOA
ALTER TABLE invoices ALTER COLUMN currency SET DEFAULT 'AOA';
ALTER TABLE organizations ALTER COLUMN currency_default SET DEFAULT 'AOA';

-- Atualizar dados existentes (sanitize)
UPDATE invoices SET currency = 'AOA' WHERE currency IN ('EUR', 'AKZ', 'Kz');
UPDATE organizations SET currency_default = 'AOA' WHERE currency_default = 'EUR';

-- Tarefa 2.2: Constraint para Receita/Despesa
ALTER TABLE invoices ADD CONSTRAINT invoices_expense_or_income_check
CHECK (expense_or_income IS NULL OR expense_or_income IN ('Receita', 'Despesa'));

-- Tarefa 2.3: Trigger para popular org_id
CREATE OR REPLACE FUNCTION set_invoice_org_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.org_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT org_id INTO NEW.org_id FROM public.users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_org_id
BEFORE INSERT ON invoices
FOR EACH ROW EXECUTE FUNCTION set_invoice_org_id();

-- Retroactive fix for org_id
UPDATE invoices i SET org_id = u.org_id
FROM users u WHERE i.user_id = u.id AND i.org_id IS NULL;

-- Tarefa 2.4: Tabelas Chat Lumea (Persistência)
CREATE TABLE public.lumea_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT 'Nova conversa',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT lumea_conversations_pkey PRIMARY KEY (id)
);

CREATE TABLE public.lumea_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.lumea_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT lumea_messages_pkey PRIMARY KEY (id)
);

-- RLS para Chat
ALTER TABLE lumea_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lumea_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conversations" ON lumea_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage messages in own conversations" ON lumea_messages
  FOR ALL USING (
    conversation_id IN (SELECT id FROM lumea_conversations WHERE user_id = auth.uid())
  );

CREATE INDEX idx_lumea_messages_conversation ON lumea_messages(conversation_id);
CREATE INDEX idx_lumea_conversations_user ON lumea_conversations(user_id);

-- Tarefa 2.5: Invoice Permalink (URL único) & Unicidade
CREATE UNIQUE INDEX idx_unique_invoice_per_org
ON invoices(org_id, invoice_number) WHERE invoice_number IS NOT NULL;
