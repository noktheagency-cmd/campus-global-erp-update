INSERT INTO public.activity_logs (id, entity_type, entity_id, action, old_value, new_value, user_id, created_at)
VALUES
  ('activity_seed_universities', 'UNIVERSITY', 'univ_istanbul_aydin', 'CREATED', null, '{"source":"seed"}'::jsonb, 'usr_super_admin', now()),
  ('activity_seed_programs', 'PROGRAM', 'program_iau_business_bachelor', 'CREATED', null, '{"source":"seed"}'::jsonb, 'usr_super_admin', now()),
  ('activity_seed_prices', 'TUITION', 'tuition_iau_business_2026_fall', 'PRICE_UPDATED', null, '{"source":"seed"}'::jsonb, 'usr_super_admin', now())
ON CONFLICT (id) DO NOTHING;
