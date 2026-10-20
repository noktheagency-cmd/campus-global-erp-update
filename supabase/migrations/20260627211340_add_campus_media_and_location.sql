alter table public.campuses
  add column if not exists image_url text,
  add column if not exists latitude numeric(10, 7),
  add column if not exists longitude numeric(10, 7);

create index if not exists campuses_location_idx
  on public.campuses(latitude, longitude);
