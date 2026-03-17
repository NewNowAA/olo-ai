-- ============================================================
-- Olo.AI — Workers, Work Sessions, Complaints, Reservations
-- ============================================================

-- Workers (colaboradores do negócio)
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  telegram_id TEXT,
  permissions JSONB DEFAULT '{"see_catalog": true, "see_stock": false, "see_appointments": false, "see_customers": false}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workers_org_id ON workers(org_id);
CREATE INDEX IF NOT EXISTS idx_workers_telegram_id ON workers(telegram_id);

-- Work sessions (ponto eletrónico)
CREATE TABLE IF NOT EXISTS work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  check_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_sessions_org_id ON work_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_worker_id ON work_sessions(worker_id);

-- Complaints
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  conversation_id UUID REFERENCES conversations(id),
  subject TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_complaints_org_id ON complaints(org_id);

-- Temporary reservations (quarentena de stock)
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER DEFAULT 0;

-- Reservations table (tracks which orders have stock reserved)
CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  catalog_item_id UUID NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  order_id UUID REFERENCES olo_orders(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  released BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_org ON stock_reservations(org_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_item ON stock_reservations(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_order ON stock_reservations(order_id);

-- Enable RLS on new tables
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS
CREATE POLICY "service_role_workers" ON workers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_work_sessions" ON work_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_complaints" ON complaints FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_reservations" ON stock_reservations FOR ALL TO service_role USING (true) WITH CHECK (true);
