"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  commissionPackageAgreementReviewSchema,
  commissionPackageAgreementSchema,
  commissionPackageSchema,
  commissionPackageStatusSchema,
  commissionTermVersionSchema,
} from "@/features/commissions/package-schemas";
import { resolvePackageEducationLevel } from "@/features/commissions/package-engine";
import { defaultLocale, locales, type AppLocale } from "@/i18n/routing";
import { getSessionAgentId, requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function saveCommissionPackageAction(formData: FormData) {
  const locale = getActionLocale(formData);
  const session = await requirePermission("commissions:manage", { locale });
  const parsed = commissionPackageSchema.safeParse({
    academicYear: getString(formData, "academicYear"),
    description: getString(formData, "description"),
    mixedScholarship: parseJson(formData, "mixedScholarshipJson"),
    name: getString(formData, "name"),
    packageId: getString(formData, "packageId"),
    rules: parseJson(formData, "rulesJson"),
    scholarships: parseJson(formData, "scholarshipsJson"),
    status: getString(formData, "status"),
    universityIds: uniqueStrings(formData.getAll("universityIds")),
  });

  if (!parsed.success) redirectWithError("package-validation", locale);

  try {
    await prisma.$transaction(async (tx) => {
      const universities = await tx.university.count({
        where: {
          id: { in: parsed.data.universityIds },
          status: "ACTIVE",
        },
      });
      if (universities !== parsed.data.universityIds.length) {
        throw new PackageActionError("package-university-invalid");
      }

      const selectedProgramIds = Array.from(
        new Set(
          parsed.data.scholarships.flatMap((scholarship) =>
            scholarship.awards.flatMap((award) =>
              award.allPrograms ? [] : award.programIds,
            ),
          ),
        ),
      );
      const selectedPrograms = selectedProgramIds.length
        ? await tx.program.findMany({
            select: {
              educationLevel: { select: { name: true } },
              id: true,
            },
            where: {
              id: { in: selectedProgramIds },
              status: "ACTIVE",
              universityId: { in: parsed.data.universityIds },
            },
          })
        : [];
      if (selectedPrograms.length !== selectedProgramIds.length) {
        throw new PackageActionError("package-scholarship-program-invalid");
      }
      const programLevels = new Map(
        selectedPrograms.map((program) => [
          program.id,
          resolvePackageEducationLevel(program.educationLevel.name),
        ]),
      );
      if (
        parsed.data.scholarships.some((scholarship) =>
          scholarship.awards.some(
            (award) =>
              !award.allPrograms &&
              award.programIds.some(
                (programId) =>
                  programLevels.get(programId) !== award.educationLevel,
              ),
          ),
        )
      ) {
        throw new PackageActionError("package-scholarship-program-level");
      }

      const rules = parsed.data.rules.map((rule) => ({
        commissionType: rule.commissionType,
        currency: rule.currency,
        educationLevel: rule.educationLevel,
        fixedAmount: rule.commissionType === "FIXED" ? rule.fixedAmount : null,
        rateTier1: rule.commissionType === "FIXED" ? null : rule.rateTier1,
        rateTier2: rule.commissionType === "FIXED" ? null : rule.rateTier2,
        tierThreshold: rule.tierThreshold,
      }));
      const scholarships = parsed.data.scholarships.map((item) => ({
        additionalInterval:
          item.triggerType === "FIRST_THEN_EVERY"
            ? item.additionalInterval
            : null,
        awards: {
          create: item.awards.map((award) => ({
            allPrograms: award.allPrograms,
            educationLevel: award.educationLevel,
            programs: award.allPrograms
              ? undefined
              : {
                  create: award.programIds.map((programId) => ({ programId })),
                },
            quantity: award.quantity,
          })),
        },
        description: item.description,
        educationLevel: item.educationLevel,
        scholarshipCount: item.scholarshipCount,
        studentThreshold: item.studentThreshold,
        triggerType: item.triggerType,
      }));

      if (parsed.data.packageId) {
        const existing = await tx.commissionPackage.findUnique({
          select: { id: true },
          where: { id: parsed.data.packageId },
        });
        if (!existing) throw new PackageActionError("package-not-found");

        await Promise.all([
          tx.commissionPackageUniversity.deleteMany({
            where: { packageId: parsed.data.packageId },
          }),
          tx.commissionPackageRule.deleteMany({
            where: { packageId: parsed.data.packageId },
          }),
          tx.commissionPackageScholarship.deleteMany({
            where: { packageId: parsed.data.packageId },
          }),
          tx.commissionPackageMixedScholarship.deleteMany({
            where: { packageId: parsed.data.packageId },
          }),
        ]);

        await tx.commissionPackage.update({
          data: {
            academicYear: parsed.data.academicYear,
            description: parsed.data.description,
            mixedScholarship: parsed.data.mixedScholarship
              ? { create: parsed.data.mixedScholarship }
              : undefined,
            name: parsed.data.name,
            rules: { create: rules },
            scholarships: { create: scholarships },
            status: parsed.data.status,
            universities: {
              create: parsed.data.universityIds.map((universityId) => ({
                universityId,
              })),
            },
          },
          where: { id: parsed.data.packageId },
        });
      } else {
        await tx.commissionPackage.create({
          data: {
            academicYear: parsed.data.academicYear,
            createdById: session.userId,
            description: parsed.data.description,
            mixedScholarship: parsed.data.mixedScholarship
              ? { create: parsed.data.mixedScholarship }
              : undefined,
            name: parsed.data.name,
            rules: { create: rules },
            scholarships: { create: scholarships },
            status: parsed.data.status,
            universities: {
              create: parsed.data.universityIds.map((universityId) => ({
                universityId,
              })),
            },
          },
        });
      }
    });
  } catch (error) {
    if (error instanceof PackageActionError) {
      redirectWithError(error.code, locale);
    }
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("commission_packages_name_")) {
      redirectWithError("package-duplicate", locale);
    }
    console.error("Commission package save failed", error);
    redirectWithError("package-save-failed", locale);
  }

  revalidateCommissionPaths(locale);
  redirectWithSuccess(
    parsed.data.packageId ? "package-updated" : "package-created",
    locale,
  );
}

export async function updateCommissionPackageStatusAction(formData: FormData) {
  const locale = getActionLocale(formData);
  await requirePermission("commissions:manage", { locale });
  const parsed = commissionPackageStatusSchema.safeParse({
    packageId: getString(formData, "packageId"),
    status: getString(formData, "status"),
  });
  if (!parsed.success) redirectWithError("package-status-validation", locale);

  try {
    await prisma.commissionPackage.update({
      data: { status: parsed.data.status },
      where: { id: parsed.data.packageId },
    });
  } catch (error) {
    console.error("Commission package status update failed", error);
    redirectWithError("package-status-failed", locale);
  }

  revalidateCommissionPaths(locale);
  redirectWithSuccess(
    parsed.data.status === "ACTIVE" ? "package-activated" : "package-paused",
    locale,
  );
}

export async function submitCommissionPackageAgreementAction(
  formData: FormData,
) {
  const locale = getActionLocale(formData);
  const session = await requirePermission("commissions:read", { locale });
  const agentId = getSessionAgentId(session);
  if (!agentId) redirectWithError("agreement-agent-only", locale);

  const parsed = commissionPackageAgreementSchema.safeParse({
    acceptedTerms: getString(formData, "acceptedTerms") === "on",
    academicYear: getString(formData, "academicYear"),
    notes: getString(formData, "notes"),
    packageId: getString(formData, "packageId"),
    universityIds: uniqueStrings(formData.getAll("universityIds")),
  });
  if (!parsed.success)
    redirectWithError("package-agreement-validation", locale);

  try {
    await prisma.$transaction(async (tx) => {
      const [pkg, activeTerm, existing] = await Promise.all([
        tx.commissionPackage.findFirst({
          include: { universities: { select: { universityId: true } } },
          where: { id: parsed.data.packageId, status: "ACTIVE" },
        }),
        tx.commissionTermVersion.findFirst({
          orderBy: { createdAt: "desc" },
          where: { isActive: true },
        }),
        tx.commissionPackageAgreement.findUnique({
          where: {
            packageId_agentId_academicYear: {
              academicYear: parsed.data.academicYear,
              agentId,
              packageId: parsed.data.packageId,
            },
          },
        }),
      ]);
      if (!pkg) throw new PackageActionError("package-not-found");
      if (!activeTerm)
        throw new PackageActionError("package-terms-unavailable");
      if (existing?.status === "APPROVED" || existing?.status === "PENDING") {
        throw new PackageActionError("package-agreement-duplicate");
      }

      const allowedIds = new Set(
        pkg.universities.map((item) => item.universityId),
      );
      if (
        parsed.data.universityIds.some(
          (universityId) => !allowedIds.has(universityId),
        )
      ) {
        throw new PackageActionError("package-agreement-university-invalid");
      }

      if (existing) {
        await tx.commissionPackageAgreementUniversity.deleteMany({
          where: { agreementId: existing.id },
        });
        await tx.commissionPackageAgreement.update({
          data: {
            acceptedTermsAt: new Date(),
            notes: parsed.data.notes,
            rejectionReason: null,
            reviewedAt: null,
            reviewedById: null,
            status: "PENDING",
            submittedAt: new Date(),
            termVersionId: activeTerm.id,
            universities: {
              create: parsed.data.universityIds.map((universityId) => ({
                universityId,
              })),
            },
          },
          where: { id: existing.id },
        });
      } else {
        await tx.commissionPackageAgreement.create({
          data: {
            acceptedTermsAt: new Date(),
            academicYear: parsed.data.academicYear,
            agentId,
            code: createAgreementCode(),
            notes: parsed.data.notes,
            packageId: parsed.data.packageId,
            status: "PENDING",
            termVersionId: activeTerm.id,
            universities: {
              create: parsed.data.universityIds.map((universityId) => ({
                universityId,
              })),
            },
          },
        });
      }
    });
  } catch (error) {
    if (error instanceof PackageActionError) {
      redirectWithError(error.code, locale);
    }
    console.error("Commission package agreement submit failed", error);
    redirectWithError("package-agreement-submit-failed", locale);
  }

  revalidateCommissionPaths(locale);
  redirectWithSuccess("package-agreement-submitted", locale);
}

export async function reviewCommissionPackageAgreementAction(
  formData: FormData,
) {
  const locale = getActionLocale(formData);
  const session = await requirePermission("commissions:manage", { locale });
  const parsed = commissionPackageAgreementReviewSchema.safeParse({
    agreementId: getString(formData, "agreementId"),
    rejectionReason: getString(formData, "rejectionReason"),
    status: getString(formData, "status"),
  });
  if (!parsed.success) redirectWithError("agreement-review-validation", locale);

  try {
    await prisma.$transaction(async (tx) => {
      const agreement = await tx.commissionPackageAgreement.findFirst({
        include: {
          package: { select: { status: true } },
          universities: { select: { universityId: true } },
        },
        where: { id: parsed.data.agreementId, status: "PENDING" },
      });
      if (!agreement) throw new PackageActionError("agreement-review-stale");

      await tx.$queryRaw<Array<{ locked: number }>>`
        select 1 as locked
        from pg_advisory_xact_lock(
          hashtextextended(${`${agreement.agentId}:${agreement.academicYear}`}, 0)
        )
      `;

      if (parsed.data.status === "APPROVED") {
        if (agreement.package.status !== "ACTIVE") {
          throw new PackageActionError("package-not-active");
        }
        const universityIds = agreement.universities.map(
          (item) => item.universityId,
        );
        const conflict = await tx.commissionPackageAgreement.findFirst({
          select: { id: true },
          where: {
            academicYear: agreement.academicYear,
            agentId: agreement.agentId,
            id: { not: agreement.id },
            status: "APPROVED",
            universities: { some: { universityId: { in: universityIds } } },
          },
        });
        if (conflict) {
          throw new PackageActionError("package-agreement-coverage-conflict");
        }
      }

      const result = await tx.commissionPackageAgreement.updateMany({
        data: {
          rejectionReason:
            parsed.data.status === "REJECTED"
              ? parsed.data.rejectionReason
              : null,
          reviewedAt: new Date(),
          reviewedById: session.userId,
          status: parsed.data.status,
        },
        where: { id: agreement.id, status: "PENDING" },
      });
      if (result.count !== 1) {
        throw new PackageActionError("agreement-review-stale");
      }
    });
  } catch (error) {
    if (error instanceof PackageActionError) {
      redirectWithError(error.code, locale);
    }
    console.error("Commission package agreement review failed", error);
    redirectWithError("agreement-review-failed", locale);
  }

  revalidateCommissionPaths(locale);
  redirectWithSuccess(
    parsed.data.status === "APPROVED"
      ? "package-agreement-approved"
      : "package-agreement-rejected",
    locale,
  );
}

export async function createCommissionTermVersionAction(formData: FormData) {
  const locale = getActionLocale(formData);
  const session = await requirePermission("commissions:manage", { locale });
  const parsed = commissionTermVersionSchema.safeParse({
    content: getString(formData, "content"),
    isActive: getString(formData, "isActive") === "on",
    title: getString(formData, "title"),
    version: getString(formData, "version"),
  });
  if (!parsed.success) redirectWithError("term-validation", locale);

  try {
    await prisma.$transaction(async (tx) => {
      if (parsed.data.isActive) {
        await tx.commissionTermVersion.updateMany({
          data: { isActive: false },
          where: { isActive: true },
        });
      }
      await tx.commissionTermVersion.create({
        data: {
          content: parsed.data.content,
          createdById: session.userId,
          isActive: parsed.data.isActive,
          title: parsed.data.title,
          version: parsed.data.version,
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("commission_term_versions_version_key")) {
      redirectWithError("term-version-duplicate", locale);
    }
    console.error("Commission term version create failed", error);
    redirectWithError("term-save-failed", locale);
  }

  revalidateCommissionPaths(locale);
  redirectWithSuccess("term-created", locale);
}

class PackageActionError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

function getActionLocale(formData: FormData): AppLocale {
  const value = getString(formData, "locale");
  return locales.includes(value as AppLocale)
    ? (value as AppLocale)
    : defaultLocale;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function uniqueStrings(values: FormDataEntryValue[]) {
  return Array.from(
    new Set(
      values.flatMap((value) =>
        typeof value === "string" && value.trim() ? [value.trim()] : [],
      ),
    ),
  );
}

function parseJson(formData: FormData, key: string) {
  try {
    return JSON.parse(getString(formData, key));
  } catch {
    return null;
  }
}

function createAgreementCode() {
  const dateParts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Baku",
    year: "2-digit",
  }).formatToParts(new Date());
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((part) => part.type === type)?.value ?? "00";
  const day = `${getPart("year")}${getPart("month")}${getPart("day")}`;
  return `CG-PKG-${day}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

function revalidateCommissionPaths(locale: AppLocale) {
  revalidatePath("/commissions");
  revalidatePath(`/${locale}/commissions`);
}

function redirectWithError(code: string, locale: AppLocale): never {
  redirect(commissionUrl(locale, `error=${encodeURIComponent(code)}`));
}

function redirectWithSuccess(code: string, locale: AppLocale): never {
  redirect(commissionUrl(locale, `success=${encodeURIComponent(code)}`));
}

function commissionUrl(locale: AppLocale, query: string) {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${prefix}/commissions?${query}`;
}
