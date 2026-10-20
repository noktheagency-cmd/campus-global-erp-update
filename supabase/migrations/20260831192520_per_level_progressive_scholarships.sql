create type public."CommissionPackageScholarshipTriggerType" as enum (
  'FIXED_INTERVAL',
  'FIRST_THEN_EVERY'
);

alter table public."commission_package_scholarships"
  add column "trigger_type" public."CommissionPackageScholarshipTriggerType"
    not null default 'FIXED_INTERVAL',
  add column "additional_interval" integer;

alter table public."commission_package_scholarships"
  add constraint "commission_package_scholarships_trigger_check"
    check (
      (
        "trigger_type" = 'FIXED_INTERVAL'
        and "additional_interval" is null
      )
      or
      (
        "trigger_type" = 'FIRST_THEN_EVERY'
        and "additional_interval" between 1 and 100000
      )
    );
