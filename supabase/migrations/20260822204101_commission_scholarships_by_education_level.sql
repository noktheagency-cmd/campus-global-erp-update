alter table public."commission_package_scholarships"
  drop constraint "commission_package_scholarships_package_id_kind_key",
  drop constraint "commission_package_scholarships_values_check";

alter table public."commission_package_scholarships"
  add column "education_level" "CommissionPackageEducationLevel",
  add column "scholarship_count" integer not null default 1;

-- Preserve legacy scholarship rows. The former MIXED rule had no explicit
-- education level, so it becomes a MASTER rule and remains editable in ERP.
update public."commission_package_scholarships"
set "education_level" = case
  when "kind" = 'BACHELOR' then 'BACHELOR'::"CommissionPackageEducationLevel"
  else 'MASTER'::"CommissionPackageEducationLevel"
end;

alter table public."commission_package_scholarships"
  alter column "education_level" set not null,
  alter column "scholarship_count" drop default;

alter table public."commission_package_scholarships"
  rename column "first_threshold" to "student_threshold";

alter table public."commission_package_scholarships"
  drop column "additional_interval",
  drop column "kind";

drop type "CommissionPackageScholarshipKind";

alter table public."commission_package_scholarships"
  add constraint "commission_package_scholarships_package_id_education_level_key"
    unique ("package_id", "education_level"),
  add constraint "commission_package_scholarships_values_check"
    check (
      "student_threshold" between 1 and 100000
      and "scholarship_count" between 1 and "student_threshold"
    );
