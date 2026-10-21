alter table public."commission_package_rules"
  add column "education_tax_rate" numeric(5,2) not null default 0,
  add column "vat_rate" numeric(5,2) not null default 0,
  add column "azv_rate" numeric(5,2) not null default 0;

alter table public."commission_package_rules"
  add constraint "commission_package_rules_education_tax_rate_check"
    check ("education_tax_rate" between 0 and 100),
  add constraint "commission_package_rules_vat_rate_check"
    check ("vat_rate" between 0 and 100),
  add constraint "commission_package_rules_azv_rate_check"
    check ("azv_rate" between 0 and 100);