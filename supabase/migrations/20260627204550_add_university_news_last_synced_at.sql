alter table public.universities
  add column if not exists news_last_synced_at timestamp(3);
