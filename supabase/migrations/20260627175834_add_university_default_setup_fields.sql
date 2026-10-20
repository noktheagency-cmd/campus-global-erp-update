alter table public.universities
  add column if not exists default_period_id text,
  add column if not exists default_education_level_id text,
  add column if not exists default_education_language_id text,
  add column if not exists default_currency varchar(3);

alter table public.universities
  add constraint universities_default_period_id_fkey
    foreign key (default_period_id)
    references public.periods(id)
    on update cascade
    on delete set null,
  add constraint universities_default_education_level_id_fkey
    foreign key (default_education_level_id)
    references public.education_levels(id)
    on update cascade
    on delete set null,
  add constraint universities_default_education_language_id_fkey
    foreign key (default_education_language_id)
    references public.education_languages(id)
    on update cascade
    on delete set null;

create index if not exists universities_default_period_id_idx
  on public.universities(default_period_id);
create index if not exists universities_default_education_level_id_idx
  on public.universities(default_education_level_id);
create index if not exists universities_default_education_language_id_idx
  on public.universities(default_education_language_id);
create index if not exists universities_default_currency_idx
  on public.universities(default_currency);
