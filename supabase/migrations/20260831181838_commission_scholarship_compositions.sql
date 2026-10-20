create table public."commission_package_scholarship_awards" (
  "id" text primary key,
  "scholarship_id" text not null,
  "education_level" "CommissionPackageEducationLevel" not null,
  "quantity" integer not null default 1,
  "all_programs" boolean not null default true,
  "created_at" timestamptz(3) not null default current_timestamp,
  "updated_at" timestamptz(3) not null default current_timestamp,
  constraint "scholarship_award_quantity_check" check ("quantity" > 0),
  constraint "scholarship_award_scholarship_fkey"
    foreign key ("scholarship_id")
    references public."commission_package_scholarships"("id")
    on delete cascade
    on update cascade
);

create unique index "scholarship_award_level_unique"
  on public."commission_package_scholarship_awards"(
    "scholarship_id",
    "education_level"
  );

create index "scholarship_award_level_idx"
  on public."commission_package_scholarship_awards"("education_level");

create table public."commission_package_scholarship_award_programs" (
  "id" text primary key,
  "award_id" text not null,
  "program_id" text not null,
  "created_at" timestamptz(3) not null default current_timestamp,
  constraint "scholarship_award_program_award_fkey"
    foreign key ("award_id")
    references public."commission_package_scholarship_awards"("id")
    on delete cascade
    on update cascade,
  constraint "scholarship_award_program_program_fkey"
    foreign key ("program_id")
    references public."programs"("id")
    on delete cascade
    on update cascade
);

create unique index "scholarship_award_program_unique"
  on public."commission_package_scholarship_award_programs"(
    "award_id",
    "program_id"
  );

create index "scholarship_award_program_idx"
  on public."commission_package_scholarship_award_programs"("program_id");

insert into public."commission_package_scholarship_awards" (
  "id",
  "scholarship_id",
  "education_level",
  "quantity",
  "all_programs"
)
select
  concat('sch_award_', md5("id")),
  "id",
  "education_level",
  1,
  true
from public."commission_package_scholarships"
on conflict ("scholarship_id", "education_level") do nothing;

alter table public."commission_calculations"
  add column "scholarship_award_snapshot" jsonb;
