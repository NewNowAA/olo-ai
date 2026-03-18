-- =============================================
-- Olo.AI — Seed Data: Clínica Omar (Demo)
-- =============================================
-- Targets the organization with sector = 'clinica'.
-- Safe to re-run: deletes catalog data for this org first.
-- =============================================

DO $$
DECLARE
  v_org_id uuid;
  v_cat_consultas uuid;
  v_cat_exames uuid;
  v_cat_tratamentos uuid;
  v_cat_medicamentos uuid;
BEGIN

  -- 1. Find the clinic organization
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE sector = 'clinica'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma organização com sector=clinica encontrada.';
  END IF;

  RAISE NOTICE 'Targeting org: %', v_org_id;

  -- 2. Update org settings
  UPDATE public.organizations SET
    business_name           = 'Clínica Omar',
    agent_name              = 'Sofia',
    agent_tone              = 'profissional',
    agent_greeting          = 'Olá! 👋 Sou a Sofia da Clínica Omar. Posso ajudar com marcações, informações sobre consultas ou os nossos serviços. Como posso ajudar?',
    agent_system_prompt     = 'Tu és a Sofia, assistente da Clínica Omar em Luanda. Especialidades: clínica geral, pediatria, ginecologia, cardiologia, exames laboratoriais e de imagem. Tom profissional e empático. Ajuda com marcações, informações sobre serviços e preços. IMPORTANTE: Para qualquer emergência médica diz sempre para ligar 112 ou ir ao serviço de urgência mais próximo.',
    first_contact_message   = 'Olá! 👋 Bem-vindo à Clínica Omar. Sou a Sofia, a sua assistente virtual. Posso ajudá-lo(a) a marcar consultas, informar sobre os nossos serviços e exames, ou esclarecer qualquer dúvida. Como posso ajudar hoje?',
    absence_message         = 'Obrigada pela sua mensagem. A Clínica Omar encontra-se de momento fora do horário de atendimento. Deixe a sua mensagem e entraremos em contacto assim que possível. Para urgências, dirija-se ao serviço de urgência mais próximo.',
    address                 = 'Av. 4 de Fevereiro, 120 — Luanda, Angola',
    phone                   = '+244 912 345 678',
    setup_progress          = 85
  WHERE id = v_org_id;

  -- 3. Catalog Categories
  DELETE FROM public.catalog_categories WHERE org_id = v_org_id;

  INSERT INTO public.catalog_categories (org_id, name, description, sort_order)
  VALUES (v_org_id, 'Consultas 🩺', 'Consultas médicas de diversas especialidades', 1)
  RETURNING id INTO v_cat_consultas;

  INSERT INTO public.catalog_categories (org_id, name, description, sort_order)
  VALUES (v_org_id, 'Exames 🔬', 'Exames laboratoriais e de diagnóstico por imagem', 2)
  RETURNING id INTO v_cat_exames;

  INSERT INTO public.catalog_categories (org_id, name, description, sort_order)
  VALUES (v_org_id, 'Tratamentos 💉', 'Tratamentos e procedimentos clínicos', 3)
  RETURNING id INTO v_cat_tratamentos;

  INSERT INTO public.catalog_categories (org_id, name, description, sort_order)
  VALUES (v_org_id, 'Medicamentos 💊', 'Medicamentos disponíveis na clínica', 4)
  RETURNING id INTO v_cat_medicamentos;

  -- 4. Catalog Items
  DELETE FROM public.catalog_items WHERE org_id = v_org_id;

  -- Consultas (services — booked via appointments)
  INSERT INTO public.catalog_items (org_id, category_id, name, description, price, currency, stock_quantity, stock_min_alert, tags, is_available) VALUES
    (v_org_id, v_cat_consultas, 'Consulta de Clínica Geral',   'Consulta médica geral para avaliação do estado de saúde, diagnóstico e prescrição. Inclui anamnese e exame físico.',              5000, 'AOA', 999, 0, ARRAY['geral','consulta'], true),
    (v_org_id, v_cat_consultas, 'Consulta de Pediatria',       'Consulta pediátrica para crianças até aos 15 anos. Avaliação do desenvolvimento e tratamento de doenças infantis.',              6000, 'AOA', 999, 0, ARRAY['pediatria','consulta'], true),
    (v_org_id, v_cat_consultas, 'Consulta de Ginecologia',     'Consulta de ginecologia e obstetrícia. Acompanhamento de gravidez e saúde da mulher.',                                          7500, 'AOA', 999, 0, ARRAY['ginecologia','consulta'], true),
    (v_org_id, v_cat_consultas, 'Consulta de Cardiologia',     'Consulta cardiológica com avaliação cardiovascular. Inclui electrocardiograma (ECG) básico.',                                   9000, 'AOA', 999, 0, ARRAY['cardiologia','consulta'], true),
    (v_org_id, v_cat_consultas, 'Consulta de Nutrição',        'Consulta nutricional com elaboração de plano alimentar personalizado.',                                                         5500, 'AOA', 999, 0, ARRAY['nutrição','consulta'], true),
    (v_org_id, v_cat_consultas, 'Consulta de Dermatologia',    'Consulta dermatológica para diagnóstico e tratamento de doenças da pele, cabelo e unhas.',                                     8000, 'AOA', 999, 0, ARRAY['dermatologia','consulta'], true);

  -- Exames
  INSERT INTO public.catalog_items (org_id, category_id, name, description, price, currency, stock_quantity, stock_min_alert, tags, is_available) VALUES
    (v_org_id, v_cat_exames, 'Hemograma Completo',             'Análise completa do sangue: eritrócitos, leucócitos, plaquetas e hemoglobina. Resultado em 24h.',                              2500, 'AOA', 999, 0, ARRAY['sangue','laboratorial'], true),
    (v_org_id, v_cat_exames, 'Bioquímica Geral',              'Painel de bioquímica: glicemia, ureia, creatinina, colesterol e triglicerídeos. Resultado em 24h.',                            4000, 'AOA', 999, 0, ARRAY['sangue','laboratorial'], true),
    (v_org_id, v_cat_exames, 'Teste COVID-19 (Antígeno)',     'Teste rápido de antígeno para SARS-CoV-2. Resultado em 20 minutos.',                                                          3000, 'AOA', 999, 0, ARRAY['covid','rápido'], true),
    (v_org_id, v_cat_exames, 'Ecografia Abdominal',           'Ecografia abdominal para avaliação dos órgãos abdominais (fígado, vesícula, rim, baço, pâncreas).',                           8000, 'AOA', 999, 0, ARRAY['imagem','ecografia'], true),
    (v_org_id, v_cat_exames, 'Electrocardiograma (ECG)',       'Registo da actividade eléctrica do coração. Útil para detecção de arritmias.',                                               3500, 'AOA', 999, 0, ARRAY['coração','exame'], true),
    (v_org_id, v_cat_exames, 'Teste de Malária (RDT)',         'Teste rápido de diagnóstico da malária. Resultado em 15 minutos.',                                                           2000, 'AOA', 999, 0, ARRAY['malária','rápido'], true);

  -- Tratamentos
  INSERT INTO public.catalog_items (org_id, category_id, name, description, price, currency, stock_quantity, stock_min_alert, tags, is_available) VALUES
    (v_org_id, v_cat_tratamentos, 'Fisioterapia (Sessão)',     'Sessão de fisioterapia para reabilitação motora e tratamento de dores musculares e articulares.',                            4500, 'AOA', 999, 0, ARRAY['fisioterapia','tratamento'], true),
    (v_org_id, v_cat_tratamentos, 'Penso / Curativo',          'Realização de penso ou curativo de ferida. Inclui material de penso básico.',                                               1500, 'AOA', 999, 0, ARRAY['ferida','enfermagem'], true),
    (v_org_id, v_cat_tratamentos, 'Injecção Intramuscular',    'Administração de injecção intramuscular prescrita. Não inclui o medicamento.',                                              1000, 'AOA', 999, 0, ARRAY['injecção','enfermagem'], true),
    (v_org_id, v_cat_tratamentos, 'Nebulização',               'Sessão de nebulização para tratamento de problemas respiratórios. Inclui soro fisiológico.',                                2000, 'AOA', 999, 0, ARRAY['respiratório','tratamento'], true);

  -- Medicamentos (products — ordered via orders, not appointments)
  INSERT INTO public.catalog_items (org_id, category_id, name, description, price, currency, stock_quantity, stock_min_alert, tags, is_available) VALUES
    (v_org_id, v_cat_medicamentos, 'Paracetamol 500mg (20 comp)', 'Analgésico e antipirético para alívio de dores e febre.',                                     800,  'AOA', 50, 10, ARRAY['analgésico','febre'], true),
    (v_org_id, v_cat_medicamentos, 'Ibuprofeno 400mg (20 comp)',  'Anti-inflamatório para dores e inflamações.',                                                 1200, 'AOA', 40, 10, ARRAY['anti-inflamatório'], true),
    (v_org_id, v_cat_medicamentos, 'Bissolvon Xarope 100ml',      'Mucolítico para tosse produtiva. Adultos e crianças acima de 5 anos.',                        2500, 'AOA', 30,  5, ARRAY['tosse','respiratório'], true),
    (v_org_id, v_cat_medicamentos, 'Vitamina C 1000mg (30 comp)', 'Suplemento de vitamina C para reforço imunitário.',                                          1500, 'AOA', 60, 10, ARRAY['vitaminas','imunidade'], true),
    (v_org_id, v_cat_medicamentos, 'Soro Fisiológico 500ml',      'Solução salina isotónica para hidratação e lavagens.',                                        1800, 'AOA', 25,  5, ARRAY['soro'], true);

  RAISE NOTICE 'Seed complete for Clínica Omar (org: %)', v_org_id;

END $$;
