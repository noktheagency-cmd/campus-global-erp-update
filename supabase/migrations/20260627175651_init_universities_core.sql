-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'CONSULTANT', 'FINANCE', 'HR', 'AGENT', 'STUDENT', 'UNIVERSITY_REPRESENTATIVE', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PartnershipStatus" AS ENUM ('PROSPECT', 'ACTIVE_PARTNER', 'AGREEMENT_PENDING', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('NONE', 'PENDING', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('PUBLIC', 'PRIVATE', 'FOUNDATION', 'PUBLIC_PRIVATE', 'COLLEGE', 'LANGUAGE_SCHOOL', 'OTHER');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PeriodStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PriceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RelatedEntityType" AS ENUM ('UNIVERSITY', 'CAMPUS', 'PROGRAM', 'PERIOD', 'TUITION', 'CONTACT', 'NOTE');

-- CreateEnum
CREATE TYPE "ScholarshipType" AS ENUM ('AMOUNT', 'PERCENTAGE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATED', 'UPDATED', 'ARCHIVED', 'STATUS_CHANGED', 'DOCUMENT_UPLOADED', 'PRICE_UPDATED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "website" TEXT,
    "school_type" "SchoolType" NOT NULL,
    "partnership_status" "PartnershipStatus" NOT NULL DEFAULT 'PROSPECT',
    "agreement_status" "AgreementStatus",
    "main_email" TEXT,
    "main_phone" TEXT,
    "internal_notes" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campuses" (
    "id" TEXT NOT NULL,
    "university_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "is_main_campus" BOOLEAN NOT NULL DEFAULT false,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_languages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "university_id" TEXT NOT NULL,
    "campus_id" TEXT,
    "education_level_id" TEXT NOT NULL,
    "education_language_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" TEXT,
    "study_mode" TEXT,
    "requirements_summary" TEXT,
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "season" TEXT NOT NULL,
    "application_start_date" TIMESTAMP(3),
    "application_deadline" TIMESTAMP(3),
    "status" "PeriodStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_tuitions" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "tuition_fee" DECIMAL(12,2) NOT NULL,
    "discounted_tuition_fee" DECIMAL(12,2),
    "scholarship_type" "ScholarshipType",
    "scholarship_value" DECIMAL(12,2),
    "payment_note" TEXT,
    "source_document_id" TEXT,
    "price_status" "PriceStatus" NOT NULL DEFAULT 'DRAFT',
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_tuitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_documents" (
    "id" TEXT NOT NULL,
    "university_id" TEXT NOT NULL,
    "related_entity_type" "RelatedEntityType" NOT NULL,
    "related_entity_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "uploaded_by" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" TIMESTAMP(3),
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "university_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_contacts" (
    "id" TEXT NOT NULL,
    "university_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "position" TEXT,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "university_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_notes" (
    "id" TEXT NOT NULL,
    "university_id" TEXT NOT NULL,
    "related_entity_type" "RelatedEntityType",
    "related_entity_id" TEXT,
    "body" TEXT NOT NULL,
    "author_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "university_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "entity_type" "RelatedEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "universities_country_city_idx" ON "universities"("country", "city");

-- CreateIndex
CREATE INDEX "universities_partnership_status_idx" ON "universities"("partnership_status");

-- CreateIndex
CREATE INDEX "universities_status_idx" ON "universities"("status");

-- CreateIndex
CREATE UNIQUE INDEX "universities_name_country_key" ON "universities"("name", "country");

-- CreateIndex
CREATE INDEX "campuses_country_city_idx" ON "campuses"("country", "city");

-- CreateIndex
CREATE UNIQUE INDEX "campuses_university_id_name_key" ON "campuses"("university_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "education_levels_name_key" ON "education_levels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "education_languages_name_key" ON "education_languages"("name");

-- CreateIndex
CREATE INDEX "programs_university_id_idx" ON "programs"("university_id");

-- CreateIndex
CREATE INDEX "programs_campus_id_idx" ON "programs"("campus_id");

-- CreateIndex
CREATE INDEX "programs_status_idx" ON "programs"("status");

-- CreateIndex
CREATE INDEX "periods_status_idx" ON "periods"("status");

-- CreateIndex
CREATE UNIQUE INDEX "periods_year_season_key" ON "periods"("year", "season");

-- CreateIndex
CREATE INDEX "program_tuitions_program_id_idx" ON "program_tuitions"("program_id");

-- CreateIndex
CREATE INDEX "program_tuitions_period_id_idx" ON "program_tuitions"("period_id");

-- CreateIndex
CREATE INDEX "program_tuitions_price_status_idx" ON "program_tuitions"("price_status");

-- CreateIndex
CREATE INDEX "university_documents_university_id_idx" ON "university_documents"("university_id");

-- CreateIndex
CREATE INDEX "university_documents_related_entity_type_related_entity_id_idx" ON "university_documents"("related_entity_type", "related_entity_id");

-- CreateIndex
CREATE INDEX "university_documents_status_idx" ON "university_documents"("status");

-- CreateIndex
CREATE INDEX "university_contacts_university_id_idx" ON "university_contacts"("university_id");

-- CreateIndex
CREATE INDEX "university_notes_university_id_idx" ON "university_notes"("university_id");

-- CreateIndex
CREATE INDEX "university_notes_related_entity_type_related_entity_id_idx" ON "university_notes"("related_entity_type", "related_entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- AddForeignKey
ALTER TABLE "universities" ADD CONSTRAINT "universities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campuses" ADD CONSTRAINT "campuses_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_education_level_id_fkey" FOREIGN KEY ("education_level_id") REFERENCES "education_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_education_language_id_fkey" FOREIGN KEY ("education_language_id") REFERENCES "education_languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_tuitions" ADD CONSTRAINT "program_tuitions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_tuitions" ADD CONSTRAINT "program_tuitions_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_tuitions" ADD CONSTRAINT "program_tuitions_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "university_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_documents" ADD CONSTRAINT "university_documents_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_documents" ADD CONSTRAINT "university_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_contacts" ADD CONSTRAINT "university_contacts_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_notes" ADD CONSTRAINT "university_notes_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_notes" ADD CONSTRAINT "university_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Supabase hardening: this ERP uses server-side access first.
-- Keep public tables unavailable to anon/authenticated Data API roles until
-- explicit app auth and RLS policies are designed.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated;

DO $$
DECLARE
  relation_name text;
BEGIN
  FOREACH relation_name IN ARRAY ARRAY[
    'users',
    'universities',
    'campuses',
    'education_levels',
    'education_languages',
    'programs',
    'periods',
    'program_tuitions',
    'university_documents',
    'university_contacts',
    'university_notes',
    'activity_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', relation_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', relation_name);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', relation_name);
  END LOOP;
END $$;
