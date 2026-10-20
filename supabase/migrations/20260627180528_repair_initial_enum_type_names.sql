do $$
begin
  if exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'user_role')
     and not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'UserRole') then
    alter type public.user_role rename to "UserRole";
  end if;

  if exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'entity_status')
     and not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'EntityStatus') then
    alter type public.entity_status rename to "EntityStatus";
  end if;

  if exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'partnership_status')
     and not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'PartnershipStatus') then
    alter type public.partnership_status rename to "PartnershipStatus";
  end if;

  if exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'agreement_status')
     and not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'AgreementStatus') then
    alter type public.agreement_status rename to "AgreementStatus";
  end if;

  if exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'school_type')
     and not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'SchoolType') then
    alter type public.school_type rename to "SchoolType";
  end if;

  if exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'program_status')
     and not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'ProgramStatus') then
    alter type public.program_status rename to "ProgramStatus";
  end if;

  if exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'period_status')
     and not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'PeriodStatus') then
    alter type public.period_status rename to "PeriodStatus";
  end if;

  if exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'price_status')
     and not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'PriceStatus') then
    alter type public.price_status rename to "PriceStatus";
  end if;

  if exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'related_entity_type')
     and not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'RelatedEntityType') then
    alter type public.related_entity_type rename to "RelatedEntityType";
  end if;

  if exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'scholarship_type')
     and not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'ScholarshipType') then
    alter type public.scholarship_type rename to "ScholarshipType";
  end if;
end $$;

create type public."DocumentStatus" as enum ('ACTIVE', 'EXPIRED', 'ARCHIVED');
create type public."ActivityAction" as enum ('CREATED', 'UPDATED', 'ARCHIVED', 'STATUS_CHANGED', 'DOCUMENT_UPLOADED', 'PRICE_UPDATED');

alter table public."university_documents"
  alter column "status" drop default,
  alter column "status" type public."DocumentStatus" using "status"::text::public."DocumentStatus",
  alter column "status" set default 'ACTIVE';

alter table public."activity_logs"
  alter column "action" type public."ActivityAction" using "action"::public."ActivityAction";
