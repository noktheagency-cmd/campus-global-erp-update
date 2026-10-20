create table if not exists public.university_periods (
  id text not null,
  university_id text not null references public.universities(id) on update cascade on delete cascade,
  period_id text not null references public.periods(id) on update cascade on delete restrict,
  is_default boolean not null default false,
  created_at timestamp(3) not null default current_timestamp,
  updated_at timestamp(3) not null,

  constraint university_periods_pkey primary key (id),
  constraint university_periods_university_id_period_id_key unique (university_id, period_id)
);

create index if not exists university_periods_period_id_idx
  on public.university_periods(period_id);

create table if not exists public.university_education_levels (
  id text not null,
  university_id text not null references public.universities(id) on update cascade on delete cascade,
  education_level_id text not null references public.education_levels(id) on update cascade on delete restrict,
  is_default boolean not null default false,
  created_at timestamp(3) not null default current_timestamp,
  updated_at timestamp(3) not null,

  constraint university_education_levels_pkey primary key (id),
  constraint university_education_levels_university_id_education_level_id_key unique (university_id, education_level_id)
);

create index if not exists university_education_levels_education_level_id_idx
  on public.university_education_levels(education_level_id);

create table if not exists public.university_education_languages (
  id text not null,
  university_id text not null references public.universities(id) on update cascade on delete cascade,
  education_language_id text not null references public.education_languages(id) on update cascade on delete restrict,
  is_default boolean not null default false,
  created_at timestamp(3) not null default current_timestamp,
  updated_at timestamp(3) not null,

  constraint university_education_languages_pkey primary key (id),
  constraint university_education_languages_university_id_education_language_id_key unique (university_id, education_language_id)
);

create index if not exists university_education_languages_education_language_id_idx
  on public.university_education_languages(education_language_id);

create table if not exists public.university_currencies (
  id text not null,
  university_id text not null references public.universities(id) on update cascade on delete cascade,
  currency varchar(3) not null,
  is_default boolean not null default false,
  created_at timestamp(3) not null default current_timestamp,
  updated_at timestamp(3) not null,

  constraint university_currencies_pkey primary key (id),
  constraint university_currencies_university_id_currency_key unique (university_id, currency)
);

create index if not exists university_currencies_currency_idx
  on public.university_currencies(currency);

alter table public.university_periods enable row level security;
alter table public.university_education_levels enable row level security;
alter table public.university_education_languages enable row level security;
alter table public.university_currencies enable row level security;

revoke all on table public.university_periods from anon, authenticated;
revoke all on table public.university_education_levels from anon, authenticated;
revoke all on table public.university_education_languages from anon, authenticated;
revoke all on table public.university_currencies from anon, authenticated;

grant all on table public.university_periods to service_role;
grant all on table public.university_education_levels to service_role;
grant all on table public.university_education_languages to service_role;
grant all on table public.university_currencies to service_role;

drop policy if exists "campus_erp_deny_all" on public.university_periods;
create policy "campus_erp_deny_all"
on public.university_periods
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "campus_erp_deny_all" on public.university_education_levels;
create policy "campus_erp_deny_all"
on public.university_education_levels
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "campus_erp_deny_all" on public.university_education_languages;
create policy "campus_erp_deny_all"
on public.university_education_languages
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "campus_erp_deny_all" on public.university_currencies;
create policy "campus_erp_deny_all"
on public.university_currencies
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
