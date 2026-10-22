ALTER TABLE public."commission_package_mixed_scholarships"
ADD COLUMN IF NOT EXISTS "tier_composition" VARCHAR(20) DEFAULT 'BOTH',
ADD COLUMN IF NOT EXISTS "accounting_value_override" DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS "allow_multiple_selections" BOOLEAN DEFAULT false;

COMMENT ON COLUMN public."commission_package_mixed_scholarships"."tier_composition" IS 'Tier composition: FIRST, SUBSEQUENT, or BOTH';
COMMENT ON COLUMN public."commission_package_mixed_scholarships"."accounting_value_override" IS 'Override value for accounting purposes';
COMMENT ON COLUMN public."commission_package_mixed_scholarships"."allow_multiple_selections" IS 'Allow selecting multiple program options for scholarship composition';
