create table public."commission_package_mixed_scholarships" (
  "id" text not null,
  "package_id" text not null,
  "first_threshold" integer not null,
  "additional_interval" integer not null,
  "description" text,
  "created_at" timestamp(3) not null default current_timestamp,
  "updated_at" timestamp(3) not null,
  constraint "commission_package_mixed_scholarships_pkey" primary key ("id"),
  constraint "commission_package_mixed_scholarships_package_id_key" unique ("package_id"),
  constraint "commission_package_mixed_scholarships_values_check" check (
    "first_threshold" between 1 and 100000
    and "additional_interval" between 1 and 100000
  )
);

alter table public."commission_package_mixed_scholarships"
  add constraint "commission_package_mixed_scholarships_package_id_fkey"
  foreign key ("package_id") references public."commission_packages"("id")
  on delete cascade on update cascade;

alter table public."commission_package_mixed_scholarships"
  enable row level security;

revoke all on table public."commission_package_mixed_scholarships"
  from anon, authenticated;

grant all on table public."commission_package_mixed_scholarships"
  to service_role;

create policy "campus_erp_deny_all"
  on public."commission_package_mixed_scholarships"
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'prisma') then
    grant select, insert, update, delete
      on table public."commission_package_mixed_scholarships" to prisma;
  end if;
end $$;
