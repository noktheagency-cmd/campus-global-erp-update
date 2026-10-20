alter table public."students"
  add column if not exists "password_hash" text;
