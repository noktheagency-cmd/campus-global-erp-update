ALTER TYPE "ApplicationDocumentStatus" ADD VALUE IF NOT EXISTS 'INVALID';

ALTER TABLE "application_documents"
  ADD COLUMN IF NOT EXISTS "reviewed_by" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "application_documents_reviewed_by_idx"
  ON "application_documents"("reviewed_by");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'application_documents_reviewed_by_fkey'
  ) THEN
    ALTER TABLE "application_documents"
      ADD CONSTRAINT "application_documents_reviewed_by_fkey"
      FOREIGN KEY ("reviewed_by")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
