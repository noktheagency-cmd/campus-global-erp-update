do $$
begin
  if not exists (select 1 from pg_type where typname = 'CommissionPackageStatus') then
    create type "CommissionPackageStatus" as enum ('DRAFT', 'ACTIVE', 'INACTIVE');
  end if;
  if not exists (select 1 from pg_type where typname = 'CommissionPackageEducationLevel') then
    create type "CommissionPackageEducationLevel" as enum ('ASSOCIATE', 'BACHELOR', 'MASTER', 'PHD');
  end if;
  if not exists (select 1 from pg_type where typname = 'CommissionPackageRuleType') then
    create type "CommissionPackageRuleType" as enum ('FIXED', 'PERCENTAGE_CASH', 'PERCENTAGE_DELAYED');
  end if;
  if not exists (select 1 from pg_type where typname = 'CommissionPackageScholarshipKind') then
    create type "CommissionPackageScholarshipKind" as enum ('BACHELOR', 'MIXED');
  end if;
  if not exists (select 1 from pg_type where typname = 'CommissionPackageAgreementStatus') then
    create type "CommissionPackageAgreementStatus" as enum ('PENDING', 'APPROVED', 'REJECTED');
  end if;
end $$;

create table public."commission_packages" (
  "id" text not null,
  "name" text not null,
  "description" text,
  "academic_year" text,
  "status" "CommissionPackageStatus" not null default 'DRAFT',
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "commission_packages_pkey" primary key ("id"),
  constraint "commission_packages_name_academic_year_key" unique ("name", "academic_year"),
  constraint "commission_packages_name_check" check (length(btrim("name")) between 3 and 120),
  constraint "commission_packages_academic_year_check" check (
    "academic_year" is null or "academic_year" ~ '^\d{4}-\d{4}$'
  )
);

create table public."commission_package_universities" (
  "id" text not null,
  "package_id" text not null,
  "university_id" text not null,
  "created_at" timestamp(3) not null default current_timestamp,
  constraint "commission_package_universities_pkey" primary key ("id"),
  constraint "commission_package_universities_package_id_university_id_key" unique ("package_id", "university_id")
);

create table public."commission_package_rules" (
  "id" text not null,
  "package_id" text not null,
  "education_level" "CommissionPackageEducationLevel" not null,
  "commission_type" "CommissionPackageRuleType" not null,
  "currency" varchar(3) not null default 'USD',
  "fixed_amount" decimal(14, 2),
  "rate_tier_1" decimal(7, 3),
  "rate_tier_2" decimal(7, 3),
  "tier_threshold" integer not null default 20,
  "is_active" boolean not null default true,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "commission_package_rules_pkey" primary key ("id"),
  constraint "commission_package_rules_package_id_education_level_key" unique ("package_id", "education_level"),
  constraint "commission_package_rules_currency_check" check ("currency" ~ '^[A-Z]{3}$'),
  constraint "commission_package_rules_threshold_check" check ("tier_threshold" between 1 and 100000),
  constraint "commission_package_rules_value_check" check (
    (
      "commission_type" = 'FIXED'
      and "fixed_amount" is not null and "fixed_amount" > 0
      and "rate_tier_1" is null and "rate_tier_2" is null
    )
    or
    (
      "commission_type" in ('PERCENTAGE_CASH', 'PERCENTAGE_DELAYED')
      and "fixed_amount" is null
      and "rate_tier_1" is not null and "rate_tier_1" between 0 and 100
      and "rate_tier_2" is not null and "rate_tier_2" between 0 and 100
    )
  )
);

create table public."commission_package_scholarships" (
  "id" text not null,
  "package_id" text not null,
  "kind" "CommissionPackageScholarshipKind" not null,
  "first_threshold" integer not null,
  "additional_interval" integer,
  "description" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "commission_package_scholarships_pkey" primary key ("id"),
  constraint "commission_package_scholarships_package_id_kind_key" unique ("package_id", "kind"),
  constraint "commission_package_scholarships_values_check" check (
    "first_threshold" > 0
    and (
      ("kind" = 'BACHELOR' and "additional_interval" is null)
      or ("kind" = 'MIXED' and "additional_interval" is not null and "additional_interval" > 0)
    )
  )
);

create table public."commission_term_versions" (
  "id" text not null,
  "title" text not null,
  "version" text not null,
  "content" text not null,
  "is_active" boolean not null default false,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  constraint "commission_term_versions_pkey" primary key ("id"),
  constraint "commission_term_versions_version_key" unique ("version"),
  constraint "commission_term_versions_title_check" check (length(btrim("title")) between 3 and 160),
  constraint "commission_term_versions_version_check" check ("version" ~ '^\d+\.\d+$'),
  constraint "commission_term_versions_content_check" check (length(btrim("content")) >= 20)
);

create unique index "commission_term_versions_single_active_idx"
  on public."commission_term_versions" ("is_active")
  where "is_active" = true;

create table public."commission_package_agreements" (
  "id" text not null,
  "code" text not null,
  "package_id" text not null,
  "agent_id" text not null,
  "academic_year" text not null,
  "status" "CommissionPackageAgreementStatus" not null default 'PENDING',
  "term_version_id" text,
  "accepted_terms_at" timestamp(3),
  "notes" text,
  "rejection_reason" text,
  "submitted_at" timestamp(3) not null default current_timestamp,
  "reviewed_by" text,
  "reviewed_at" timestamp(3),
  "updated_at" timestamp(3) not null,
  constraint "commission_package_agreements_pkey" primary key ("id"),
  constraint "commission_package_agreements_code_key" unique ("code"),
  constraint "commission_package_agreements_package_id_agent_id_academic_year_key" unique ("package_id", "agent_id", "academic_year"),
  constraint "commission_package_agreements_year_check" check ("academic_year" ~ '^\d{4}-\d{4}$'),
  constraint "commission_package_agreements_review_check" check (
    ("status" = 'PENDING' and "reviewed_by" is null and "reviewed_at" is null and "rejection_reason" is null)
    or
    ("status" = 'APPROVED' and "reviewed_by" is not null and "reviewed_at" is not null and "rejection_reason" is null)
    or
    ("status" = 'REJECTED' and "reviewed_by" is not null and "reviewed_at" is not null and length(btrim(coalesce("rejection_reason", ''))) >= 3)
  )
);

create table public."commission_package_agreement_universities" (
  "id" text not null,
  "agreement_id" text not null,
  "university_id" text not null,
  "created_at" timestamp(3) not null default current_timestamp,
  constraint "commission_package_agreement_universities_pkey" primary key ("id"),
  constraint "commission_package_agreement_universities_agreement_id_university_id_key" unique ("agreement_id", "university_id")
);

alter table public."commission_packages"
  add constraint "commission_packages_created_by_fkey" foreign key ("created_by") references public."users"("id") on delete set null on update cascade;

alter table public."commission_package_universities"
  add constraint "commission_package_universities_package_id_fkey" foreign key ("package_id") references public."commission_packages"("id") on delete cascade on update cascade,
  add constraint "commission_package_universities_university_id_fkey" foreign key ("university_id") references public."universities"("id") on delete restrict on update cascade;

alter table public."commission_package_rules"
  add constraint "commission_package_rules_package_id_fkey" foreign key ("package_id") references public."commission_packages"("id") on delete cascade on update cascade;

alter table public."commission_package_scholarships"
  add constraint "commission_package_scholarships_package_id_fkey" foreign key ("package_id") references public."commission_packages"("id") on delete cascade on update cascade;

alter table public."commission_term_versions"
  add constraint "commission_term_versions_created_by_fkey" foreign key ("created_by") references public."users"("id") on delete set null on update cascade;

alter table public."commission_package_agreements"
  add constraint "commission_package_agreements_package_id_fkey" foreign key ("package_id") references public."commission_packages"("id") on delete restrict on update cascade,
  add constraint "commission_package_agreements_agent_id_fkey" foreign key ("agent_id") references public."agents"("id") on delete restrict on update cascade,
  add constraint "commission_package_agreements_term_version_id_fkey" foreign key ("term_version_id") references public."commission_term_versions"("id") on delete set null on update cascade,
  add constraint "commission_package_agreements_reviewed_by_fkey" foreign key ("reviewed_by") references public."users"("id") on delete set null on update cascade;

alter table public."commission_package_agreement_universities"
  add constraint "commission_package_agreement_universities_agreement_id_fkey" foreign key ("agreement_id") references public."commission_package_agreements"("id") on delete cascade on update cascade,
  add constraint "commission_package_agreement_universities_university_id_fkey" foreign key ("university_id") references public."universities"("id") on delete restrict on update cascade;

create index "commission_packages_status_academic_year_idx" on public."commission_packages"("status", "academic_year");
create unique index "commission_packages_name_all_years_key" on public."commission_packages"("name") where "academic_year" is null;
create index "commission_packages_created_by_idx" on public."commission_packages"("created_by");
create index "commission_package_universities_university_id_idx" on public."commission_package_universities"("university_id");
create index "commission_package_rules_commission_type_is_active_idx" on public."commission_package_rules"("commission_type", "is_active");
create index "commission_term_versions_is_active_created_at_idx" on public."commission_term_versions"("is_active", "created_at");
create index "commission_term_versions_created_by_idx" on public."commission_term_versions"("created_by");
create index "commission_package_agreements_status_submitted_at_idx" on public."commission_package_agreements"("status", "submitted_at");
create index "commission_package_agreements_agent_id_status_idx" on public."commission_package_agreements"("agent_id", "status");
create index "commission_package_agreements_term_version_id_idx" on public."commission_package_agreements"("term_version_id");
create index "commission_package_agreements_reviewed_by_idx" on public."commission_package_agreements"("reviewed_by");
create index "commission_package_agreement_universities_university_id_idx" on public."commission_package_agreement_universities"("university_id");

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'commission_packages',
    'commission_package_universities',
    'commission_package_rules',
    'commission_package_scholarships',
    'commission_term_versions',
    'commission_package_agreements',
    'commission_package_agreement_universities'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
    execute format(
      'create policy "campus_erp_deny_all" on public.%I as restrictive for all to anon, authenticated using (false) with check (false)',
      table_name
    );
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_roles where rolname = 'prisma') then
    grant usage on schema public to prisma;
    foreach table_name in array array[
      'commission_packages',
      'commission_package_universities',
      'commission_package_rules',
      'commission_package_scholarships',
      'commission_term_versions',
      'commission_package_agreements',
      'commission_package_agreement_universities'
    ]
    loop
      execute format('grant select, insert, update, delete on table public.%I to prisma', table_name);
    end loop;
  end if;
end $$;
