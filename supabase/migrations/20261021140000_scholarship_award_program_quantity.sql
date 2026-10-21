-- Per-program scholarship slot quantities within mixed award composition
ALTER TABLE public."commission_package_scholarship_award_programs"
ADD COLUMN IF NOT EXISTS "quantity" integer NOT NULL DEFAULT 1;

ALTER TABLE public."commission_package_scholarship_award_programs"
DROP CONSTRAINT IF EXISTS "scholarship_award_program_quantity_check";

ALTER TABLE public."commission_package_scholarship_award_programs"
ADD CONSTRAINT "scholarship_award_program_quantity_check"
CHECK ("quantity" > 0);

COMMENT ON COLUMN public."commission_package_scholarship_award_programs"."quantity" IS
  'Burs slot count for this program within the award composition (e.g. CS=3, Accounting=2)';
