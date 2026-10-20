alter table public.university_documents
  add column if not exists valid_from timestamptz;

