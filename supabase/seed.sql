begin;

insert into public.users (id, email, name, role, status, created_at, updated_at)
values
  ('usr_super_admin', 'admin@campusglobal.az', 'Tural Huseynov', 'ADMIN', 'ACTIVE', now(), now())
on conflict (email) do update set
  name = excluded.name,
  role = excluded.role,
  status = excluded.status,
  updated_at = now();

insert into public.users (
  id, email, name, password_hash, role, status, created_at, updated_at
)
values (
  'usr_elnur_camalov',
  'elnur.jamalov@campusglobal.az',
  'Elnur Camalov',
  'scrypt:07111bc6ffc73ede9fa07d3e868fb573:6b8b389a91175db87fcb51dee8c757278fb5e93dd1eb0cc095f1306c8e248cc88ae85083081acfd934ce22780fcdfa3420809f7de35c97b8c885bbd3e72bfbcc',
  'SUPER_ADMIN',
  'ACTIVE',
  now(),
  now()
)
on conflict (email) do update set
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  status = excluded.status,
  updated_at = now();

insert into public.education_levels (id, name, status, sort_order, created_at, updated_at)
values
  ('edu_bachelor', 'Bachelor', 'ACTIVE', 10, now(), now()),
  ('edu_master', 'Master', 'ACTIVE', 20, now(), now()),
  ('edu_phd', 'PhD', 'ACTIVE', 30, now(), now()),
  ('edu_foundation', 'Foundation', 'ACTIVE', 40, now(), now()),
  ('edu_language', 'Language Course', 'ACTIVE', 50, now(), now())
on conflict (id) do nothing;

insert into public.education_languages (id, name, status, sort_order, created_at, updated_at)
values
  ('lang_turkish', 'Turkish', 'ACTIVE', 10, now(), now()),
  ('lang_english', 'English', 'ACTIVE', 20, now(), now()),
  ('lang_german', 'German', 'ACTIVE', 30, now(), now()),
  ('lang_french', 'French', 'ACTIVE', 40, now(), now())
on conflict (id) do nothing;

insert into public.periods (
  id, name, year, season, application_start_date, application_deadline,
  status, notes, created_at, updated_at
)
values
  ('period_2026_fall', '2026 Fall', 2026, 'Fall', '2026-04-01', '2026-08-15', 'OPEN', 'Primary intake for 2026.', now(), now()),
  ('period_2027_spring', '2027 Spring', 2027, 'Spring', '2026-09-01', '2026-12-20', 'OPEN', 'Spring intake for 2027.', now(), now()),
  ('period_2027_fall', '2027 Fall', 2027, 'Fall', '2027-04-01', '2027-08-15', 'OPEN', 'Planning period.', now(), now())
on conflict (id) do nothing;

insert into public.universities (
  id, name, logo_url, country, city, website, school_type,
  partnership_status, agreement_status, main_email, main_phone,
  internal_notes, status, created_by, created_at, updated_at
)
values
  ('univ_istanbul_aydin', 'Istanbul Aydin University', null, 'Turkiye', 'Istanbul', 'https://www.aydin.edu.tr', 'FOUNDATION', 'ACTIVE_PARTNER', 'ACTIVE', 'international@aydin.edu.tr', '+90 212 444 1 428', 'High demand for health and business programs.', 'ACTIVE', 'usr_super_admin', now(), now()),
  ('univ_bahcesehir', 'Bahcesehir University', null, 'Turkiye', 'Istanbul', 'https://bau.edu.tr', 'FOUNDATION', 'ACTIVE_PARTNER', 'ACTIVE', 'international@bau.edu.tr', '+90 212 381 0000', 'Strategic partner for Istanbul programs.', 'ACTIVE', 'usr_super_admin', now(), now()),
  ('univ_europe_applied_sciences', 'University of Europe for Applied Sciences', null, 'Germany', 'Berlin', 'https://www.ue-germany.com', 'PRIVATE', 'PROSPECT', 'PENDING', 'admissions@ue-germany.com', '+49 30 338 539 710', 'Prospect partner for Germany pathway.', 'ACTIVE', 'usr_super_admin', now(), now()),
  ('univ_toronto', 'University of Toronto', null, 'Canada', 'Toronto', 'https://www.utoronto.ca', 'PUBLIC', 'ACTIVE_PARTNER', 'ACTIVE', 'international@utoronto.ca', '+1 416 978 2011', 'Strong brand signal for Canada pipeline.', 'ACTIVE', 'usr_super_admin', now(), now()),
  ('univ_ucl', 'University College London', null, 'United Kingdom', 'London', 'https://www.ucl.ac.uk', 'PUBLIC', 'ACTIVE_PARTNER', 'EXPIRED', 'international@ucl.ac.uk', '+44 20 7679 2000', 'Agreement renewal should be tracked.', 'ACTIVE', 'usr_super_admin', now(), now()),
  ('univ_monash', 'Monash University', null, 'Australia', 'Melbourne', 'https://www.monash.edu', 'PUBLIC', 'ACTIVE_PARTNER', 'ACTIVE', 'international@monash.edu', '+61 3 9905 4000', 'Priority partner for STEM programs.', 'ACTIVE', 'usr_super_admin', now(), now())
on conflict (id) do nothing;

insert into public.campuses (
  id, university_id, name, country, city, address,
  is_main_campus, status, notes, created_at, updated_at
)
values
  ('campus_iau_main', 'univ_istanbul_aydin', 'Florya Campus', 'Turkiye', 'Istanbul', 'Besyol Mah. Inonu Cad. No:38', true, 'ACTIVE', null, now(), now()),
  ('campus_bau_main', 'univ_bahcesehir', 'Besiktas Campus', 'Turkiye', 'Istanbul', 'Ciragan Cad. Osmanpasa Mektebi Sok.', true, 'ACTIVE', null, now(), now()),
  ('campus_ue_berlin', 'univ_europe_applied_sciences', 'Berlin Campus', 'Germany', 'Berlin', 'Dessauer Str. 3-5', true, 'ACTIVE', null, now(), now()),
  ('campus_toronto_st_george', 'univ_toronto', 'St. George Campus', 'Canada', 'Toronto', '27 Kings College Cir', true, 'ACTIVE', null, now(), now()),
  ('campus_ucl_bloomsbury', 'univ_ucl', 'Bloomsbury Campus', 'United Kingdom', 'London', 'Gower Street', true, 'ACTIVE', null, now(), now()),
  ('campus_monash_clayton', 'univ_monash', 'Clayton Campus', 'Australia', 'Melbourne', 'Wellington Road', true, 'ACTIVE', null, now(), now())
on conflict (id) do nothing;

insert into public.university_contacts (
  id, university_id, full_name, position, department, email, phone,
  whatsapp, is_primary, notes, status, created_at, updated_at
)
values
  ('contact_iau_international', 'univ_istanbul_aydin', 'International Office', 'Admissions Team', 'International Relations', 'international@aydin.edu.tr', '+90 212 444 1 428', null, true, null, 'ACTIVE', now(), now()),
  ('contact_bau_admissions', 'univ_bahcesehir', 'Admissions Team', 'International Admissions', 'International Office', 'international@bau.edu.tr', '+90 212 381 0000', null, true, null, 'ACTIVE', now(), now()),
  ('contact_ue_regional', 'univ_europe_applied_sciences', 'Regional Recruitment', 'Recruitment Manager', 'Admissions', 'admissions@ue-germany.com', '+49 30 338 539 710', null, true, null, 'ACTIVE', now(), now()),
  ('contact_toronto_michael', 'univ_toronto', 'Michael Chen', 'Regional Manager', 'International Recruitment', 'international@utoronto.ca', '+1 416 978 2011', null, true, null, 'ACTIVE', now(), now()),
  ('contact_ucl_emma', 'univ_ucl', 'Emma Johnson', 'Partner Relations', 'International Office', 'international@ucl.ac.uk', '+44 20 7679 2000', null, true, null, 'ACTIVE', now(), now()),
  ('contact_monash_david', 'univ_monash', 'David Williams', 'Partnership Manager', 'International Recruitment', 'international@monash.edu', '+61 3 9905 4000', null, true, null, 'ACTIVE', now(), now())
on conflict (id) do nothing;

insert into public.programs (
  id, university_id, campus_id, education_level_id, education_language_id,
  name, duration, study_mode, requirements_summary, status, notes,
  created_at, updated_at
)
values
  ('program_iau_business_bachelor', 'univ_istanbul_aydin', 'campus_iau_main', 'edu_bachelor', 'lang_english', 'Business Administration', '4 years', 'Full-time', 'High school diploma and English proficiency.', 'ACTIVE', null, now(), now()),
  ('program_iau_medicine', 'univ_istanbul_aydin', 'campus_iau_main', 'edu_bachelor', 'lang_turkish', 'Medicine', '6 years', 'Full-time', 'High school diploma and science background.', 'ACTIVE', null, now(), now()),
  ('program_bau_computer_science', 'univ_bahcesehir', 'campus_bau_main', 'edu_bachelor', 'lang_english', 'Computer Engineering', '4 years', 'Full-time', 'High school diploma and English proficiency.', 'ACTIVE', null, now(), now()),
  ('program_ue_design_master', 'univ_europe_applied_sciences', 'campus_ue_berlin', 'edu_master', 'lang_english', 'Innovation Design Management', '2 years', 'Full-time', 'Bachelor degree and portfolio.', 'DRAFT', null, now(), now()),
  ('program_toronto_cs_master', 'univ_toronto', 'campus_toronto_st_george', 'edu_master', 'lang_english', 'Computer Science', '2 years', 'Full-time', 'Bachelor degree, references and English proficiency.', 'ACTIVE', null, now(), now()),
  ('program_ucl_management', 'univ_ucl', 'campus_ucl_bloomsbury', 'edu_master', 'lang_english', 'Management', '1 year', 'Full-time', 'Bachelor degree and English proficiency.', 'ACTIVE', null, now(), now()),
  ('program_monash_data_science', 'univ_monash', 'campus_monash_clayton', 'edu_master', 'lang_english', 'Data Science', '2 years', 'Full-time', 'Bachelor degree in related field.', 'ACTIVE', null, now(), now())
on conflict (id) do nothing;

insert into public.program_tuitions (
  id, program_id, period_id, currency, tuition_fee, discounted_tuition_fee,
  scholarship_type, scholarship_value, payment_note, source_document_id,
  price_status, last_updated_at, created_at, updated_at
)
values
  ('tuition_iau_business_2026_fall', 'program_iau_business_bachelor', 'period_2026_fall', 'USD', 5500.00, 4500.00, 'AMOUNT', 1000.00, 'Partner scholarship applied.', null, 'ACTIVE', now(), now(), now()),
  ('tuition_iau_medicine_2026_fall', 'program_iau_medicine', 'period_2026_fall', 'USD', 18000.00, null, null, null, 'Annual tuition.', null, 'ACTIVE', now(), now(), now()),
  ('tuition_bau_cs_2026_fall', 'program_bau_computer_science', 'period_2026_fall', 'USD', 8200.00, 6200.00, 'AMOUNT', 2000.00, 'Merit scholarship may apply.', null, 'ACTIVE', now(), now(), now()),
  ('tuition_ue_design_2027_spring', 'program_ue_design_master', 'period_2027_spring', 'EUR', 11988.00, null, null, null, 'Pending agreement confirmation.', null, 'DRAFT', now(), now(), now()),
  ('tuition_toronto_cs_2026_fall', 'program_toronto_cs_master', 'period_2026_fall', 'CAD', 30000.00, null, null, null, 'Estimate, verify before quoting.', null, 'ACTIVE', now(), now(), now()),
  ('tuition_ucl_management_2026_fall', 'program_ucl_management', 'period_2026_fall', 'GBP', 38000.00, null, null, null, 'Agreement renewal pending.', null, 'ACTIVE', now(), now(), now()),
  ('tuition_monash_ds_2026_fall', 'program_monash_data_science', 'period_2026_fall', 'AUD', 42000.00, null, null, null, 'Annual tuition.', null, 'ACTIVE', now(), now(), now())
on conflict (id) do nothing;

insert into public.university_documents (
  id, university_id, related_entity_type, related_entity_id, title,
  document_type, file_url, file_name, file_size, mime_type,
  uploaded_by, uploaded_at, expiry_date, status, notes, created_at, updated_at
)
values
  ('doc_iau_agreement_2026', 'univ_istanbul_aydin', 'UNIVERSITY', 'univ_istanbul_aydin', 'Partner Agreement 2026', 'Agreement', '/documents/iau-partner-agreement-2026.pdf', 'iau-partner-agreement-2026.pdf', 245000, 'application/pdf', 'usr_super_admin', now(), '2027-05-31', 'ACTIVE', null, now(), now()),
  ('doc_bau_price_list_2026', 'univ_bahcesehir', 'UNIVERSITY', 'univ_bahcesehir', 'Price List 2026', 'Price List', '/documents/bau-price-list-2026.xlsx', 'bau-price-list-2026.xlsx', 168000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'usr_super_admin', now(), '2026-12-31', 'ACTIVE', null, now(), now()),
  ('doc_ucl_authorization', 'univ_ucl', 'UNIVERSITY', 'univ_ucl', 'Agent Authorization Letter', 'Authorization', '/documents/ucl-agent-authorization.docx', 'ucl-agent-authorization.docx', 98000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'usr_super_admin', now(), '2026-09-30', 'ACTIVE', 'Renewal required before next cycle.', now(), now())
on conflict (id) do nothing;

insert into public.university_notes (
  id, university_id, related_entity_type, related_entity_id, body,
  author_id, created_at, updated_at
)
values
  ('note_iau_health_focus', 'univ_istanbul_aydin', 'UNIVERSITY', 'univ_istanbul_aydin', 'Strong demand for medicine and dentistry programs.', 'usr_super_admin', now(), now()),
  ('note_ue_prospect', 'univ_europe_applied_sciences', 'UNIVERSITY', 'univ_europe_applied_sciences', 'Follow up for agreement terms and scholarship table.', 'usr_super_admin', now(), now()),
  ('note_ucl_renewal', 'univ_ucl', 'UNIVERSITY', 'univ_ucl', 'Agreement renewal should be prioritized before Fall intake.', 'usr_super_admin', now(), now())
on conflict (id) do nothing;

insert into public.activity_logs (
  id, entity_type, entity_id, action, old_value, new_value, user_id, created_at
)
values
  ('activity_seed_universities', 'UNIVERSITY', 'univ_istanbul_aydin', 'CREATED', null, '{\"source\":\"seed\"}'::jsonb, 'usr_super_admin', now()),
  ('activity_seed_programs', 'PROGRAM', 'program_iau_business_bachelor', 'CREATED', null, '{\"source\":\"seed\"}'::jsonb, 'usr_super_admin', now()),
  ('activity_seed_prices', 'TUITION', 'tuition_iau_business_2026_fall', 'PRICE_UPDATED', null, '{\"source\":\"seed\"}'::jsonb, 'usr_super_admin', now())
on conflict (id) do nothing;

commit;
