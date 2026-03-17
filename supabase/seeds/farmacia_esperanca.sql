-- ============================================================
-- Olo.AI — Seed: Farmácia Esperança (Luanda)
-- ============================================================
-- Run this in Supabase SQL Editor after migrations
-- Replace BOT_TOKEN_HERE with the actual bot token
-- ============================================================

DO $$
DECLARE
  org_id UUID;
  cat_medicamentos UUID;
  cat_higiene UUID;
  cat_vitaminas UUID;
  cat_bebe UUID;
  owner_profile_id UUID;
BEGIN

-- Create organization
INSERT INTO organizations (
  name, sector, business_name, agent_name, agent_tone,
  address, phone, currency_default, setup_progress,
  first_contact_message, absence_message
) VALUES (
  'farmacia-esperanca',
  'farmacia',
  'Farmácia Esperança',
  'Clara',
  'profissional',
  'Rua do Comércio, 78 — Luanda, Angola',
  '+244 923 111 222',
  'AOA',
  60,
  'Olá! Sou a Clara da Farmácia Esperança 👋

Posso ajudar com:
💊 Disponibilidade de medicamentos
💰 Preços de produtos
📍 Localização e horário
📋 Informações gerais

Como posso ajudar?',
  'A Farmácia Esperança está encerrada de momento. Horário: Seg-Sex 08:00-20:00 | Sáb 08:00-14:00. Em caso de urgência médica ligue 112.'
) RETURNING id INTO org_id;

RAISE NOTICE 'Org ID: %', org_id;

-- Business hours (Monday=0 to Sunday=6)
INSERT INTO business_hours (org_id, day_of_week, open_time, close_time, is_closed) VALUES
  (org_id, 0, '08:00', '20:00', false), -- Segunda
  (org_id, 1, '08:00', '20:00', false), -- Terça
  (org_id, 2, '08:00', '20:00', false), -- Quarta
  (org_id, 3, '08:00', '20:00', false), -- Quinta
  (org_id, 4, '08:00', '20:00', false), -- Sexta
  (org_id, 5, '08:00', '14:00', false), -- Sábado
  (org_id, 6, '00:00', '00:00', true);  -- Domingo (fechado)

-- Categories
INSERT INTO catalog_categories (org_id, name, sort_order) VALUES
  (org_id, 'Medicamentos', 1) RETURNING id INTO cat_medicamentos;
INSERT INTO catalog_categories (org_id, name, sort_order) VALUES
  (org_id, 'Higiene Pessoal', 2) RETURNING id INTO cat_higiene;
INSERT INTO catalog_categories (org_id, name, sort_order) VALUES
  (org_id, 'Vitaminas e Suplementos', 3) RETURNING id INTO cat_vitaminas;
INSERT INTO catalog_categories (org_id, name, sort_order) VALUES
  (org_id, 'Bebé e Criança', 4) RETURNING id INTO cat_bebe;

-- Products: Medicamentos
INSERT INTO catalog_items (org_id, category_id, name, description, price, currency, unit, stock_quantity, stock_min, active) VALUES
  (org_id, cat_medicamentos, 'Paracetamol 500mg (20 comp.)', 'Analgésico e antipirético. Venda livre.', 850, 'AOA', 'caixa', 45, 5, true),
  (org_id, cat_medicamentos, 'Ibuprofeno 400mg (20 comp.)', 'Anti-inflamatório. Venda livre.', 1200, 'AOA', 'caixa', 32, 5, true),
  (org_id, cat_medicamentos, 'Amoxicilina 500mg (21 comp.)', 'Antibiótico. Requer receita médica.', 2500, 'AOA', 'caixa', 18, 3, true),
  (org_id, cat_medicamentos, 'Omeprazol 20mg (28 comp.)', 'Protetor gástrico. Venda livre.', 1800, 'AOA', 'caixa', 25, 3, true),
  (org_id, cat_medicamentos, 'Metformina 850mg (30 comp.)', 'Antidiabético. Requer receita.', 3200, 'AOA', 'caixa', 12, 2, true),
  (org_id, cat_medicamentos, 'Losartan 50mg (30 comp.)', 'Anti-hipertensivo. Requer receita.', 2800, 'AOA', 'caixa', 15, 2, true),
  (org_id, cat_medicamentos, 'Salbutamol Inalador 100mcg', 'Broncodilatador. Requer receita.', 4500, 'AOA', 'unidade', 8, 2, true),
  (org_id, cat_medicamentos, 'Diclofenac Gel 50g', 'Anti-inflamatório tópico. Venda livre.', 1500, 'AOA', 'tubo', 20, 3, true),
  (org_id, cat_medicamentos, 'Soro Fisiológico 500ml', 'Soro para limpeza de feridas.', 600, 'AOA', 'frasco', 40, 10, true),
  (org_id, cat_medicamentos, 'Buscopan (10 comp.)', 'Antiespasmódico. Venda livre.', 1100, 'AOA', 'caixa', 22, 5, true);

-- Products: Higiene
INSERT INTO catalog_items (org_id, category_id, name, description, price, currency, unit, stock_quantity, stock_min, active) VALUES
  (org_id, cat_higiene, 'Pensos Rápidos (20 un.)', 'Pensos adesivos sortidos.', 450, 'AOA', 'caixa', 35, 5, true),
  (org_id, cat_higiene, 'Álcool 70% 500ml', 'Álcool etílico para desinfeção.', 700, 'AOA', 'frasco', 28, 5, true),
  (org_id, cat_higiene, 'Máscara Cirúrgica (50 un.)', 'Máscaras descartáveis tipo IIR.', 1200, 'AOA', 'caixa', 15, 3, true),
  (org_id, cat_higiene, 'Luvas Descartáveis M (100 un.)', 'Luvas de nitrilo sem pó.', 2000, 'AOA', 'caixa', 10, 2, true);

-- Products: Vitaminas
INSERT INTO catalog_items (org_id, category_id, name, description, price, currency, unit, stock_quantity, stock_min, active) VALUES
  (org_id, cat_vitaminas, 'Vitamina C 1000mg (30 comp.)', 'Suplemento de vitamina C efervescente.', 1600, 'AOA', 'frasco', 20, 3, true),
  (org_id, cat_vitaminas, 'Vitamina D3 2000UI (60 comp.)', 'Suplemento de vitamina D.', 2200, 'AOA', 'frasco', 15, 3, true),
  (org_id, cat_vitaminas, 'Multivitamínico Adulto (30 comp.)', 'Complexo multivitamínico diário.', 2800, 'AOA', 'frasco', 12, 2, true),
  (org_id, cat_vitaminas, 'Zinco + Selénio (30 comp.)', 'Suplemento imunológico.', 1900, 'AOA', 'frasco', 10, 2, true);

-- Products: Bebé
INSERT INTO catalog_items (org_id, category_id, name, description, price, currency, unit, stock_quantity, stock_min, active) VALUES
  (org_id, cat_bebe, 'Paracetamol Pediátrico 120mg/5ml', 'Xarope para febre em crianças.', 950, 'AOA', 'frasco', 18, 3, true),
  (org_id, cat_bebe, 'Soro Oral (10 saquetas)', 'Reidratação oral para bebés.', 750, 'AOA', 'caixa', 25, 5, true),
  (org_id, cat_bebe, 'Creme Assaduras Bepanthen 30g', 'Creme protetor para bebé.', 1800, 'AOA', 'tubo', 12, 2, true);

-- Quick replies
INSERT INTO quick_replies (org_id, trigger_words, response) VALUES
  (org_id, ARRAY['horario', 'horário', 'aberto', 'fechado', 'quando'], 'A Farmácia Esperança está aberta:\n🗓️ Segunda a Sexta: 08h00 - 20h00\n🗓️ Sábado: 08h00 - 14h00\n🚫 Domingo: Fechado'),
  (org_id, ARRAY['morada', 'localização', 'onde', 'endereço'], '📍 Farmácia Esperança\nRua do Comércio, 78\nLuanda, Angola\n📞 +244 923 111 222'),
  (org_id, ARRAY['pagamento', 'pagar', 'multicaixa', 'transferência'], '💳 Aceitamos: Dinheiro, Multicaixa Express, Transferência bancária (BAI, BFA, BIC)');

RAISE NOTICE 'Farmácia Esperança criada com sucesso! Org ID: %', org_id;
END $$;
