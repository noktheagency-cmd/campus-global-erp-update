alter type "CommissionPackageEducationLevel" add value if not exists 'FOUNDATION';
alter type "CommissionPackageEducationLevel" add value if not exists 'LANGUAGE';

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'CommissionCalculationSource'
  ) then
    create type "CommissionCalculationSource" as enum (
      'LEGACY_AGREEMENT',
      'PACKAGE_AGREEMENT'
    );
  end if;
end
$$;

alter table public."commission_calculations"
  alter column "agreement_id" drop not null,
  add column if not exists "package_agreement_id" text,
  add column if not exists "source" "CommissionCalculationSource" not null default 'LEGACY_AGREEMENT',
  add column if not exists "education_level" "CommissionPackageEducationLevel",
  add column if not exists "package_rule_type" "CommissionPackageRuleType",
  add column if not exists "student_ordinal" integer,
  add column if not exists "scholarship_credits_earned" integer not null default 0;

alter table public."commission_calculations"
  add constraint "commission_calculations_package_agreement_id_fkey"
  foreign key ("package_agreement_id")
  references public."commission_package_agreements"("id")
  on delete restrict
  on update cascade;

alter table public."commission_calculations"
  add constraint "commission_calculations_source_link_check"
  check (
    (
      "source" = 'LEGACY_AGREEMENT'
      and "agreement_id" is not null
      and "package_agreement_id" is null
    )
    or
    (
      "source" = 'PACKAGE_AGREEMENT'
      and "agreement_id" is null
      and "package_agreement_id" is not null
      and "education_level" is not null
      and "package_rule_type" is not null
      and "student_ordinal" is not null
    )
  ),
  add constraint "commission_calculations_student_ordinal_check"
  check ("student_ordinal" is null or "student_ordinal" > 0),
  add constraint "commission_calculations_scholarship_credits_check"
  check ("scholarship_credits_earned" >= 0);

create index if not exists "commission_calculations_package_agreement_id_created_at_idx"
  on public."commission_calculations"("package_agreement_id", "created_at");

create index if not exists "applications_agent_id_education_level_id_created_at_idx"
  on public."applications"("agent_id", "education_level_id", "created_at");

create index if not exists "application_choices_university_id_application_id_status_idx"
  on public."application_choices"("university_id", "application_id", "status");

create index if not exists "commission_package_agreements_agent_id_status_academic_year_idx"
  on public."commission_package_agreements"("agent_id", "status", "academic_year");
