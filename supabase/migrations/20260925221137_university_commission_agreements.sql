create table public."university_commission_agreements" (
  "id" text not null,
  "code" text not null,
  "university_id" text not null,
  "program_id" text,
  "status" "CommissionAgreementStatus" not null default 'ACTIVE',
  "currency" varchar(3) not null,
  "gross_method" "CommissionCalculationMethod" not null,
  "gross_value" decimal(14, 4) not null,
  "valid_from" date not null,
  "valid_until" date not null,
  "notes" text,
  "created_by" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "university_commission_agreements_pkey" primary key ("id"),
  constraint "university_commission_agreements_code_key" unique ("code"),
  constraint "university_commission_agreements_university_id_fkey" foreign key ("university_id") references public."universities"("id") on delete restrict on update cascade,
  constraint "university_commission_agreements_program_id_fkey" foreign key ("program_id") references public."programs"("id") on delete restrict on update cascade,
  constraint "university_commission_agreements_created_by_fkey" foreign key ("created_by") references public."users"("id") on delete set null on update cascade,
  constraint "university_commission_agreements_dates_check" check ("valid_until" >= "valid_from"),
  constraint "university_commission_agreements_value_check" check ("gross_value" > 0 and ("gross_method" = 'FIXED' or "gross_value" <= 100)),
  constraint "university_commission_agreements_currency_check" check ("currency" ~ '^[A-Z]{3}$')
);

create index "university_commission_agreements_match_idx"
  on public."university_commission_agreements" ("university_id", "currency", "status", "valid_from", "valid_until");
create index "university_commission_agreements_program_id_idx"
  on public."university_commission_agreements" ("program_id");
create index "university_commission_agreements_created_by_idx"
  on public."university_commission_agreements" ("created_by");

alter table public."commission_calculations"
  add column "university_agreement_id" text;
alter table public."commission_calculations"
  add constraint "commission_calculations_university_agreement_id_fkey"
  foreign key ("university_agreement_id") references public."university_commission_agreements"("id")
  on delete restrict on update cascade;
create index "commission_calculations_university_agreement_id_created_at_idx"
  on public."commission_calculations" ("university_agreement_id", "created_at");

alter table public."university_commission_agreements" enable row level security;
revoke all on table public."university_commission_agreements" from anon, authenticated;
grant all on table public."university_commission_agreements" to service_role;
create policy "campus_erp_deny_all"
  on public."university_commission_agreements" as restrictive for all
  to anon, authenticated using (false) with check (false);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'prisma') then
    grant select, insert, update, delete on table public."university_commission_agreements" to prisma;
  end if;
end $$;
