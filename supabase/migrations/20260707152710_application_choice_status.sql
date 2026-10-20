-- Add per-program decision tracking for multi-choice applications.

ALTER TYPE "RelatedEntityType" ADD VALUE IF NOT EXISTS 'APPLICATION_CHOICE';

ALTER TABLE "application_choices"
  ADD COLUMN "status" "ApplicationStatus",
  ADD COLUMN "status_reason" TEXT,
  ADD COLUMN "decided_by" TEXT,
  ADD COLUMN "decided_at" TIMESTAMP(3);

CREATE INDEX "application_choices_status_idx" ON "application_choices"("status");
CREATE INDEX "application_choices_decided_by_idx" ON "application_choices"("decided_by");

ALTER TABLE "application_choices"
  ADD CONSTRAINT "application_choices_decided_by_fkey"
  FOREIGN KEY ("decided_by")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
