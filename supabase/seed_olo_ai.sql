-- =============================================
-- Olo.AI — Seed Data: Restaurante Kizomba (Demo)
-- =============================================
-- Run this after the schema migration (20260310_olo_ai_schema.sql).
-- Uses a single DO block so all IDs are available via variables.
-- =============================================

DO $$
DECLARE
  v_org_id uuid;
  v_cat_pratos uuid;
  v_cat_entradas uuid;
  v_cat_bebidas uuid;
  v_cat_sobremesas uuid;
BEGIN

  -- =========================================
  -- 1. Get or update the first organization
  -- =========================================
  SELECT id INTO v_org_id FROM public.organizations LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma organização encontrada. Cria uma organização primeiro.';
  END IF;

  UPDATE public.organizations SET
    sector            = 'restaurante',
    business_name     = 'Restaurante Kizomba',
    agent_name        = 'Ana',
    agent_tone        = 'calorosa, informal, conhecedora de comida angolana',
    agent_greeting    = 'Olá! 👋 Sou a Ana do Restaurante Kizomba. Posso ajudar com reservas, ementa ou encomendas!',
    agent_system_prompt = 'Tu és a Ana, assistente do Restaurante Kizomba em Luanda. Especialidades: muamba de galinha, calulu, peixe grelhado, funge. Ajudas com reservas, ementa, preços e encomendas para levar. Tom caloroso e informal.',
    address           = 'Rua da Missão, 45 — Luanda, Angola',
    phone             = '+244 923 456 789',
    setup_progress    = 80
  WHERE id = v_org_id;

  RAISE NOTICE 'Organization updated: %', v_org_id;

  -- =========================================
  -- 2. Catalog Categories (4)
  -- =========================================
  -- Remove old categories for this org to avoid duplicates on re-run
  DELETE FROM public.catalog_categories WHERE org_id = v_org_id;

  INSERT INTO public.catalog_categories (org_id, name, description, sort_order)
  VALUES (v_org_id, 'Pratos Principais 🍽️', 'Os melhores pratos da cozinha angolana', 1)
  RETURNING id INTO v_cat_pratos;

  INSERT INTO public.catalog_categories (org_id, name, description, sort_order)
  VALUES (v_org_id, 'Entradas 🥗', 'Petiscos e entradas para abrir o apetite', 2)
  RETURNING id INTO v_cat_entradas;

  INSERT INTO public.catalog_categories (org_id, name, description, sort_order)
  VALUES (v_org_id, 'Bebidas 🍹', 'Bebidas frescas e tradicionais', 3)
  RETURNING id INTO v_cat_bebidas;

  INSERT INTO public.catalog_categories (org_id, name, description, sort_order)
  VALUES (v_org_id, 'Sobremesas 🍰', 'Doces angolanos irresistíveis', 4)
  RETURNING id INTO v_cat_sobremesas;

  RAISE NOTICE 'Categories created: pratos=%, entradas=%, bebidas=%, sobremesas=%',
    v_cat_pratos, v_cat_entradas, v_cat_bebidas, v_cat_sobremesas;

  -- =========================================
  -- 3. Catalog Items / Products (12)
  -- =========================================
  -- Remove old items for this org to avoid duplicates on re-run
  DELETE FROM public.catalog_items WHERE org_id = v_org_id;

  -- Pratos Principais
  INSERT INTO public.catalog_items (org_id, category_id, name, description, price, currency, stock_quantity, stock_min_alert, tags) VALUES
    (v_org_id, v_cat_pratos, 'Muamba de Galinha', 'O prato nacional de Angola. Galinha cozida em molho de palma com quiabos e feijão de óleo de palma. Servida com funge.', 3500, 'AOA', 20, 3, ARRAY['especialidade','popular']),
    (v_org_id, v_cat_pratos, 'Calulu de Peixe', 'Peixe seco e fresco cozinhado com quiabos, tomate, cebola e folhas de gimboa. Acompanhado de funge.', 4000, 'AOA', 15, 3, ARRAY['peixe','tradicional']),
    (v_org_id, v_cat_pratos, 'Funge com Carne Seca', 'Funge de mandioca acompanhado de carne seca guisada com molho de tomate e especiarias.', 2800, 'AOA', 25, 5, ARRAY['carne','tradicional']),
    (v_org_id, v_cat_pratos, 'Peixe Grelhado', 'Peixe fresco do dia grelhado na brasa com limão, alho e azeite. Acompanhado de arroz e salada.', 4500, 'AOA', 10, 2, ARRAY['peixe','grelhados']);

  -- Entradas
  INSERT INTO public.catalog_items (org_id, category_id, name, description, price, currency, stock_quantity, stock_min_alert, tags) VALUES
    (v_org_id, v_cat_entradas, 'Kizaka (Folhas de Mandioca)', 'Folhas de mandioca cozidas e temperadas, um clássico angolano.', 1500, 'AOA', 30, 5, ARRAY['vegetariano','tradicional']),
    (v_org_id, v_cat_entradas, 'Ginguba Torrada', 'Amendoins torrados e temperados com sal. Perfeito como aperitivo.', 800, 'AOA', 50, 10, ARRAY['snack','vegetariano']);

  -- Bebidas
  INSERT INTO public.catalog_items (org_id, category_id, name, description, price, currency, stock_quantity, stock_min_alert, tags) VALUES
    (v_org_id, v_cat_bebidas, 'Sumo de Múcua', 'Sumo natural feito do fruto do embondeiro (baobá). Refrescante e nutritivo.', 500, 'AOA', 40, 5, ARRAY['natural','tradicional']),
    (v_org_id, v_cat_bebidas, 'Cerveja Cuca', 'A cerveja angolana mais popular. Bem gelada.', 400, 'AOA', 100, 15, ARRAY['alcoólica','popular']),
    (v_org_id, v_cat_bebidas, 'Coca-Cola', 'Refrigerante Coca-Cola gelada 330ml.', 350, 'AOA', 80, 10, ARRAY['refrigerante']);

  -- Sobremesas
  INSERT INTO public.catalog_items (org_id, category_id, name, description, price, currency, stock_quantity, stock_min_alert, tags) VALUES
    (v_org_id, v_cat_sobremesas, 'Cocada Amarela', 'Doce tradicional angolano feito com gemas de ovo, açúcar e coco. Uma delícia!', 1200, 'AOA', 15, 3, ARRAY['doce','tradicional']),
    (v_org_id, v_cat_sobremesas, 'Bolo de Mandioca', 'Bolo húmido feito com mandioca ralada, coco e leite condensado.', 1000, 'AOA', 20, 5, ARRAY['bolo','tradicional']),
    (v_org_id, v_cat_sobremesas, 'Doce de Ginguba', 'Pasta doce de amendoim torrado com açúcar. Típico angolano.', 900, 'AOA', 25, 5, ARRAY['doce','amendoim']);

  RAISE NOTICE '12 catalog items created.';

  -- =========================================
  -- 4. Business Hours (7 days)
  -- =========================================
  -- Remove old hours for this org to avoid duplicates on re-run
  DELETE FROM public.business_hours WHERE org_id = v_org_id;

  INSERT INTO public.business_hours (org_id, day_of_week, open_time, close_time, is_closed) VALUES
    (v_org_id, 0, '00:00', '00:00', true),   -- Domingo: Fechado
    (v_org_id, 1, '11:30', '22:00', false),   -- Segunda
    (v_org_id, 2, '11:30', '22:00', false),   -- Terça
    (v_org_id, 3, '11:30', '22:00', false),   -- Quarta
    (v_org_id, 4, '11:30', '22:00', false),   -- Quinta
    (v_org_id, 5, '11:30', '22:00', false),   -- Sexta
    (v_org_id, 6, '12:00', '23:00', false);   -- Sábado

  RAISE NOTICE 'Business hours created for 7 days.';

  -- =========================================
  -- 5. Services / Appointment Types (3)
  -- =========================================
  -- These go in catalog_items with a special tag
  INSERT INTO public.catalog_items (org_id, category_id, name, description, price, currency, unit, is_available, tags, metadata) VALUES
    (v_org_id, NULL, 'Reserva de Mesa', 'Reserva de mesa no restaurante. Sem custo adicional.', 0, 'AOA', 'reserva', true, ARRAY['serviço','reserva'],
     '{"type": "appointment", "duration_minutes": 120}'::jsonb),
    (v_org_id, NULL, 'Encomenda Take-Away', 'Faça a sua encomenda para levar.', 0, 'AOA', 'encomenda', true, ARRAY['serviço','takeaway'],
     '{"type": "appointment", "duration_minutes": 30}'::jsonb),
    (v_org_id, NULL, 'Evento Privado', 'Reserve o restaurante para eventos privados (mínimo 50.000 AOA).', 50000, 'AOA', 'evento', true, ARRAY['serviço','evento'],
     '{"type": "appointment", "duration_minutes": 240, "min_spend": 50000}'::jsonb);

  RAISE NOTICE '3 services/appointment types created.';
  RAISE NOTICE '✅ Seed data complete for Restaurante Kizomba!';

END $$;
