create type "UniversityNewsStatus" as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');

alter table public.universities
  add column if not exists news_source_url text;

create table if not exists public.university_news (
  id text not null,
  university_id text not null,
  title text not null,
  summary text,
  image_url text,
  source_url text not null,
  source_name text,
  published_at timestamp(3),
  fetched_at timestamp(3) not null default current_timestamp,
  status "UniversityNewsStatus" not null default 'PUBLISHED',
  created_at timestamp(3) not null default current_timestamp,
  updated_at timestamp(3) not null,

  constraint university_news_pkey primary key (id)
);

create unique index if not exists university_news_university_id_source_url_key
  on public.university_news(university_id, source_url);
create index if not exists university_news_university_id_idx
  on public.university_news(university_id);
create index if not exists university_news_university_id_published_at_idx
  on public.university_news(university_id, published_at);
create index if not exists university_news_status_idx
  on public.university_news(status);

alter table public.university_news
  add constraint university_news_university_id_fkey
    foreign key (university_id)
    references public.universities(id)
    on update cascade
    on delete cascade;

alter table public.university_news enable row level security;
revoke all on table public.university_news from anon, authenticated;
grant all on table public.university_news to service_role;

drop policy if exists "campus_erp_deny_all" on public.university_news;
create policy "campus_erp_deny_all"
on public.university_news
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
