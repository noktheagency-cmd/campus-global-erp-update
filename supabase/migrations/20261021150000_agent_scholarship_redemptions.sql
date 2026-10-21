-- Agent scholarship point redemptions (spend earned burs packages on students)

DO $$ BEGIN
  CREATE TYPE "AgentScholarshipRedemptionStatus" AS ENUM ('CONFIRMED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public."agent_scholarship_redemptions" (
  "id" text PRIMARY KEY,
  "agent_id" text NOT NULL,
  "package_agreement_id" text NOT NULL,
  "student_id" text NOT NULL,
  "education_level" "CommissionPackageEducationLevel" NOT NULL,
  "program_id" text,
  "points_cost" numeric(8, 2) NOT NULL,
  "status" "AgentScholarshipRedemptionStatus" NOT NULL DEFAULT 'CONFIRMED',
  "notes" text,
  "created_by" text,
  "created_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamptz(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_scholarship_redemptions_points_cost_check"
    CHECK ("points_cost" > 0),
  CONSTRAINT "agent_scholarship_redemptions_agent_fkey"
    FOREIGN KEY ("agent_id") REFERENCES public."agents"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "agent_scholarship_redemptions_agreement_fkey"
    FOREIGN KEY ("package_agreement_id") REFERENCES public."commission_package_agreements"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "agent_scholarship_redemptions_student_fkey"
    FOREIGN KEY ("student_id") REFERENCES public."students"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "agent_scholarship_redemptions_program_fkey"
    FOREIGN KEY ("program_id") REFERENCES public."programs"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "agent_scholarship_redemptions_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES public."users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "agent_scholarship_redemptions_agent_created_idx"
  ON public."agent_scholarship_redemptions"("agent_id", "created_at");
CREATE INDEX IF NOT EXISTS "agent_scholarship_redemptions_agreement_created_idx"
  ON public."agent_scholarship_redemptions"("package_agreement_id", "created_at");
CREATE INDEX IF NOT EXISTS "agent_scholarship_redemptions_student_idx"
  ON public."agent_scholarship_redemptions"("student_id");
CREATE INDEX IF NOT EXISTS "agent_scholarship_redemptions_program_idx"
  ON public."agent_scholarship_redemptions"("program_id");
CREATE INDEX IF NOT EXISTS "agent_scholarship_redemptions_status_created_idx"
  ON public."agent_scholarship_redemptions"("status", "created_at");
CREATE INDEX IF NOT EXISTS "agent_scholarship_redemptions_created_by_idx"
  ON public."agent_scholarship_redemptions"("created_by");

ALTER TABLE public."agent_scholarship_redemptions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_scholarship_redemptions_deny_all" ON public."agent_scholarship_redemptions";
CREATE POLICY "agent_scholarship_redemptions_deny_all"
  ON public."agent_scholarship_redemptions"
  FOR ALL
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public."agent_scholarship_redemptions" IS
  'Agent spends earned burs package points on a student/program per package composition cost';
