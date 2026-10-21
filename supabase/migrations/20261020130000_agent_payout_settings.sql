-- Add agent payout settings
ALTER TABLE public."agents"
ADD COLUMN IF NOT EXISTS "cash_payout_active" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "account_payout_active" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "hold_in_account" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "manual_payout_management" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "payout_percentage" DECIMAL(5, 2) DEFAULT 100;

-- Add commission calculation payout breakdown fields
ALTER TABLE public."commission_calculations"
ADD COLUMN IF NOT EXISTS "cash_payout_amount" DECIMAL(14, 2),
ADD COLUMN IF NOT EXISTS "account_payout_amount" DECIMAL(14, 2),
ADD COLUMN IF NOT EXISTS "education_tax_amount" DECIMAL(14, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "vat_amount" DECIMAL(14, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "azv_amount" DECIMAL(14, 2) DEFAULT 0;

-- Add mixed scholarship tier composition fields
ALTER TABLE public."commission_package_mixed_scholarships"
ADD COLUMN IF NOT EXISTS "tier_composition" VARCHAR(20) DEFAULT 'BOTH',
ADD COLUMN IF NOT EXISTS "accounting_value_override" DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS "allow_multiple_selections" BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN public."agents"."cash_payout_active" IS 'Whether cash payouts are enabled for this agent';
COMMENT ON COLUMN public."agents"."account_payout_active" IS 'Whether account transfer payouts are enabled for this agent';
COMMENT ON COLUMN public."agents"."hold_in_account" IS 'Whether commissions are held in account balance instead of paid out';
COMMENT ON COLUMN public."agents"."manual_payout_management" IS 'Whether payout amounts are manually managed';
COMMENT ON COLUMN public."agents"."payout_percentage" IS 'Percentage of commission to payout (remaining is held in account)';

COMMENT ON COLUMN public."commission_calculations"."cash_payout_amount" IS 'Amount paid out in cash';
COMMENT ON COLUMN public."commission_calculations"."account_payout_amount" IS 'Amount paid out to agent account';
COMMENT ON COLUMN public."commission_calculations"."education_tax_amount" IS 'Education tax amount deducted';
COMMENT ON COLUMN public."commission_calculations"."vat_amount" IS 'KDV (VAT) amount deducted';
COMMENT ON COLUMN public."commission_calculations"."azv_amount" IS 'AZV amount deducted';

COMMENT ON COLUMN public."commission_package_mixed_scholarships"."tier_composition" IS 'Tier composition: FIRST, SUBSEQUENT, or BOTH';
COMMENT ON COLUMN public."commission_package_mixed_scholarships"."accounting_value_override" IS 'Override value for accounting purposes';
COMMENT ON COLUMN public."commission_package_mixed_scholarships"."allow_multiple_selections" IS 'Allow selecting multiple program options for scholarship composition';
