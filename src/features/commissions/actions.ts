"use server";

import { randomBytes } from "node:crypto";

import { addBusinessDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  commissionAgreementSchema,
  commissionAgreementStatusSchema,
  commissionApprovalSchema,
  commissionPaymentSchema,
  universityCommissionAgreementSchema,
} from "@/features/commissions/schemas";
import {
  academicYearFromPeriodYear,
  calculateLevelScholarshipPackageCount,
  calculateMixedScholarshipCredits,
  calculatePackageCommission,
  packagePaymentTermDays,
  resolvePackageEducationLevel,
  selectTierRate,
} from "@/features/commissions/package-engine";
import type {
  CommissionPackageEducationLevel,
  CommissionPackageRuleType,
} from "@/features/commissions/package-types";
import { FINANCE_BASE_CURRENCY } from "@/features/finance/constants";
import type { Prisma } from "@/generated/prisma/client";
import { defaultLocale, locales, type AppLocale } from "@/i18n/routing";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  deleteStorageFile,
  uploadCommissionAgreementFile,
  uploadCommissionPaymentEvidenceFile,
  type UploadedStorageFile,
} from "@/lib/supabase/storage";

const ACCEPTED_APPLICATION_STATUSES = ["ACCEPTED", "ENROLLED"] as const;

type ResolvedCommissionTerms = {
  agentMethod: "FIXED" | "PERCENTAGE";
  agentValue: number;
  agentAlreadyEarned: boolean;
  agreementId: string | null;
  universityAgreementId: string | null;
  universityGrossMethod: "FIXED" | "PERCENTAGE" | null;
  universityGrossValue: number | null;
  campusMethod: "FIXED" | "PERCENTAGE";
  campusValue: number;
  educationLevel: CommissionPackageEducationLevel | null;
  packageAgreementId: string | null;
  packageRuleType: CommissionPackageRuleType | null;
  paymentTermDays: number;
  scholarshipCreditsEarned: number;
  scholarshipAwardSnapshot: Prisma.InputJsonValue | undefined;
  source: "LEGACY_AGREEMENT" | "PACKAGE_AGREEMENT";
  studentOrdinal: number | null;
};

export async function createUniversityCommissionAgreementAction(
  formData: FormData,
) {
  const locale = getActionLocale(formData);
  const session = await requirePermission("commissions:manage", { locale });
  const parsed = universityCommissionAgreementSchema.safeParse({
    universityId: getString(formData, "universityId"),
    programId: getString(formData, "programId"),
    currency: getString(formData, "currency"),
    grossMethod: getString(formData, "grossMethod"),
    grossValue: getString(formData, "grossValue"),
    validFrom: getString(formData, "validFrom"),
    validUntil: getString(formData, "validUntil"),
    notes: getString(formData, "notes"),
  });
  if (!parsed.success)
    redirectWithError("university-agreement-validation", locale);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw<Array<{ locked: number }>>`
        select 1 as locked from pg_advisory_xact_lock(
          hashtextextended(
            ${`university-commission:${parsed.data.universityId}:${parsed.data.programId ?? "all"}:${parsed.data.currency}`},
            0
          )
        )
      `;
      const university = await tx.university.findFirst({
        select: { id: true },
        where: { id: parsed.data.universityId, status: "ACTIVE" },
      });
      if (!university) throw new CommissionActionError("university-not-found");
      if (parsed.data.programId) {
        const program = await tx.program.findFirst({
          select: { id: true },
          where: {
            id: parsed.data.programId,
            universityId: university.id,
            status: "ACTIVE",
          },
        });
        if (!program) throw new CommissionActionError("program-not-found");
      }
      const overlap = await tx.universityCommissionAgreement.findFirst({
        select: { id: true },
        where: {
          universityId: university.id,
          programId: parsed.data.programId ?? null,
          currency: parsed.data.currency,
          status: "ACTIVE",
          validFrom: { lte: parsed.data.validUntil },
          validUntil: { gte: parsed.data.validFrom },
        },
      });
      if (overlap)
        throw new CommissionActionError("university-agreement-overlap");
      await tx.universityCommissionAgreement.create({
        data: {
          code: createCode("UNI"),
          universityId: university.id,
          programId: parsed.data.programId ?? null,
          currency: parsed.data.currency,
          grossMethod: parsed.data.grossMethod,
          grossValue: parsed.data.grossValue,
          validFrom: parsed.data.validFrom,
          validUntil: parsed.data.validUntil,
          notes: parsed.data.notes,
          createdById: session.userId,
        },
      });
    });
  } catch (error) {
    redirectWithError(
      error instanceof CommissionActionError
        ? error.message
        : "university-agreement-create-failed",
      locale,
    );
  }
  revalidateCommissions();
  redirect(commissionUrl(locale, "success=university-agreement-created"));
}

export async function suspendUniversityCommissionAgreementAction(
  formData: FormData,
) {
  const locale = getActionLocale(formData);
  await requirePermission("commissions:manage", { locale });
  const agreementId = getString(formData, "agreementId");
  if (!agreementId)
    redirectWithError("university-agreement-validation", locale);
  const result = await prisma.universityCommissionAgreement.updateMany({
    data: { status: "SUSPENDED" },
    where: { id: agreementId, status: "ACTIVE" },
  });
  if (result.count !== 1)
    redirectWithError("university-agreement-not-found", locale);
  revalidateCommissions();
  redirect(commissionUrl(locale, "success=university-agreement-suspended"));
}

export async function createCommissionAgreementAction(formData: FormData) {
  const locale = getActionLocale(formData);
  const session = await requirePermission("commissions:manage", { locale });
  const parsed = commissionAgreementSchema.safeParse({
    agentId: getString(formData, "agentId"),
    agentMethod: getString(formData, "agentMethod"),
    agentValue: getString(formData, "agentValue"),
    calculationBasis: getString(formData, "calculationBasis"),
    campusMethod: getString(formData, "campusMethod"),
    campusValue: getString(formData, "campusValue"),
    code: getString(formData, "code"),
    currency: getString(formData, "currency"),
    installmentPolicy: getString(formData, "installmentPolicy"),
    notes: getString(formData, "notes"),
    paymentTermDays: getString(formData, "paymentTermDays"),
    programId: getString(formData, "programId"),
    status: getString(formData, "status"),
    universityId: getString(formData, "universityId"),
    validFrom: getString(formData, "validFrom"),
    validUntil: getString(formData, "validUntil"),
  });

  if (!parsed.success) {
    redirectWithError("agreement-validation", locale);
  }

  const agreementFile = getOptionalFile(formData, "agreementFile");
  if (agreementFile && !(await isValidCommissionDocument(agreementFile))) {
    redirectWithError("agreement-file-invalid", locale);
  }

  let uploadedFile: UploadedStorageFile | null = null;

  try {
    if (agreementFile) {
      uploadedFile = await uploadCommissionAgreementFile({
        agreementCode: parsed.data.code,
        file: agreementFile,
      });
    }

    await prisma.$transaction(async (tx) => {
      const [agent, university, program, overlap] = await Promise.all([
        tx.agent.findFirst({
          select: { id: true },
          where: {
            id: parsed.data.agentId,
            portalStatus: { not: "SUSPENDED" },
          },
        }),
        tx.university.findFirst({
          select: { id: true },
          where: { id: parsed.data.universityId, status: "ACTIVE" },
        }),
        parsed.data.programId
          ? tx.program.findFirst({
              select: { id: true },
              where: {
                id: parsed.data.programId,
                status: "ACTIVE",
                universityId: parsed.data.universityId,
              },
            })
          : Promise.resolve(null),
        parsed.data.status === "ACTIVE"
          ? tx.commissionAgreement.findFirst({
              select: { id: true },
              where: {
                agentId: parsed.data.agentId,
                programId: parsed.data.programId ?? null,
                status: "ACTIVE",
                universityId: parsed.data.universityId,
                validFrom: { lte: parsed.data.validUntil },
                validUntil: { gte: parsed.data.validFrom },
              },
            })
          : Promise.resolve(null),
      ]);

      if (!agent) throw new CommissionActionError("agent-not-found");
      if (!university) throw new CommissionActionError("university-not-found");
      if (parsed.data.programId && !program)
        throw new CommissionActionError("program-not-found");
      if (overlap) throw new CommissionActionError("agreement-overlap");

      const isActive = parsed.data.status === "ACTIVE";
      const agreement = await tx.commissionAgreement.create({
        data: {
          activatedAt: isActive ? new Date() : null,
          activatedById: isActive ? session.userId : null,
          agentId: parsed.data.agentId,
          agentMethod: parsed.data.agentMethod,
          agentValue: parsed.data.agentValue,
          calculationBasis: parsed.data.calculationBasis,
          campusMethod: parsed.data.campusMethod,
          campusValue: parsed.data.campusValue,
          code: parsed.data.code,
          createdById: session.userId,
          currency: parsed.data.currency,
          documentName: uploadedFile?.fileName,
          documentUrl: uploadedFile?.fileUrl,
          installmentPolicy: parsed.data.installmentPolicy,
          notes: parsed.data.notes,
          paymentTermDays: parsed.data.paymentTermDays,
          programId: parsed.data.programId,
          status: parsed.data.status,
          universityId: parsed.data.universityId,
          validFrom: parsed.data.validFrom,
          validUntil: parsed.data.validUntil,
        },
      });

      await createCommissionAudit(tx, {
        action: isActive ? "ACTIVATED" : "CREATED",
        entityId: agreement.id,
        entityType: "AGREEMENT",
        newValue: {
          agentId: agreement.agentId,
          agentValue: agreement.agentValue.toString(),
          campusValue: agreement.campusValue.toString(),
          code: agreement.code,
          status: agreement.status,
          universityId: agreement.universityId,
        },
        userId: session.userId,
      });
    });
  } catch (error) {
    if (uploadedFile) {
      await deleteStorageFile(uploadedFile.fileUrl).catch(() => undefined);
    }
    redirectWithError(
      isAgreementOverlapError(error)
        ? "agreement-overlap"
        : error instanceof CommissionActionError
          ? error.message
          : "agreement-create-failed",
      locale,
    );
  }

  revalidateCommissions();
  redirect(
    commissionUrl(
      locale,
      `success=${
        parsed.data.status === "ACTIVE"
          ? "agreement-activated"
          : "agreement-drafted"
      }`,
    ),
  );
}

export async function createCommissionPaymentAction(formData: FormData) {
  const locale = getActionLocale(formData);
  const session = await requirePermission("commissions:manage", { locale });
  const parsed = commissionPaymentSchema.safeParse({
    amount: getString(formData, "amount"),
    applicationChoiceId: getString(formData, "applicationChoiceId"),
    currency: getString(formData, "currency"),
    exchangeRate: getString(formData, "exchangeRate") || "1",
    notes: getString(formData, "notes"),
    paidAt: getString(formData, "paidAt"),
    reference: getString(formData, "reference"),
  });

  if (!parsed.success) {
    redirectWithError("payment-validation", locale);
  }

  const evidenceFile = getOptionalFile(formData, "evidenceFile");
  if (evidenceFile && !(await isValidCommissionEvidence(evidenceFile))) {
    redirectWithError("payment-file-invalid", locale);
  }

  let uploadedFile: UploadedStorageFile | null = null;

  try {
    const initialChoice = await prisma.applicationChoice.findFirst({
      select: { applicationId: true, id: true },
      where: {
        id: parsed.data.applicationChoiceId,
        OR: [
          { status: { in: [...ACCEPTED_APPLICATION_STATUSES] } },
          {
            application: {
              status: { in: [...ACCEPTED_APPLICATION_STATUSES] },
            },
          },
        ],
      },
    });

    if (!initialChoice)
      throw new CommissionActionError("application-not-eligible");

    if (evidenceFile) {
      uploadedFile = await uploadCommissionPaymentEvidenceFile({
        applicationChoiceId: initialChoice.id,
        file: evidenceFile,
      });
    }
    const exchangeRate =
      parsed.data.currency === FINANCE_BASE_CURRENCY
        ? 1
        : parsed.data.exchangeRate;
    const paymentCode = createCode("PAY");
    const calculationCode = createCode("COM");

    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw<Array<{ id: string }>>`
        select "id"
        from public."applications"
        where "id" = ${initialChoice.applicationId}
        for update
      `;

        const choice = await tx.applicationChoice.findFirst({
          include: {
            application: {
              include: {
                educationLevel: { select: { name: true } },
                period: { select: { year: true } },
                student: { select: { agentId: true, id: true } },
              },
            },
            university: { select: { id: true, name: true } },
          },
          where: {
            id: initialChoice.id,
            OR: [
              { status: { in: [...ACCEPTED_APPLICATION_STATUSES] } },
              {
                application: {
                  status: { in: [...ACCEPTED_APPLICATION_STATUSES] },
                },
              },
            ],
          },
        });
        if (!choice)
          throw new CommissionActionError("application-not-eligible");

        if (parsed.data.reference) {
          const duplicatePayment = await tx.commissionPayment.findFirst({
            select: { id: true },
            where: {
              applicationChoiceId: choice.id,
              reference: parsed.data.reference,
              status: "POSTED",
            },
          });
          if (duplicatePayment) {
            throw new CommissionActionError("payment-reference-duplicate");
          }
        }

        const agentId =
          choice.application.agentId ?? choice.application.student.agentId;
        if (!agentId)
          throw new CommissionActionError("application-agent-missing");

        const educationLevel = resolvePackageEducationLevel(
          choice.application.educationLevel.name,
        );
        const academicYear = academicYearFromPeriodYear(
          choice.application.period.year,
        );
        const packageAgreements = educationLevel
          ? await tx.commissionPackageAgreement.findMany({
              include: {
                package: {
                  include: {
                    mixedScholarship: true,
                    rules: {
                      where: { educationLevel, isActive: true },
                    },
                    scholarships: {
                      include: {
                        awards: {
                          include: {
                            programs: {
                              include: {
                                program: {
                                  select: {
                                    id: true,
                                    name: true,
                                    universityId: true,
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                      where: { educationLevel },
                    },
                  },
                },
                universities: { select: { universityId: true } },
              },
              orderBy: { reviewedAt: "desc" },
              take: 2,
              where: {
                academicYear,
                agentId,
                package: {
                  is: {
                    OR: [{ academicYear }, { academicYear: null }],
                    status: "ACTIVE",
                  },
                },
                status: "APPROVED",
                universities: { some: { universityId: choice.universityId } },
              },
            })
          : [];
        if (packageAgreements.length > 1) {
          throw new CommissionActionError("package-agreement-conflict");
        }

        let terms: ResolvedCommissionTerms;
        const packageAgreement = packageAgreements[0];
        if (packageAgreement && educationLevel) {
          const rule = packageAgreement.package.rules[0];
          if (!rule) throw new CommissionActionError("package-rule-not-found");
          if (rule.currency !== parsed.data.currency) {
            throw new CommissionActionError("package-currency-mismatch");
          }

          const universityAgreements =
            await tx.universityCommissionAgreement.findMany({
              where: {
                universityId: choice.universityId,
                currency: parsed.data.currency,
                status: "ACTIVE",
                validFrom: { lte: parsed.data.paidAt },
                validUntil: { gte: parsed.data.paidAt },
                OR: [{ programId: choice.programId }, { programId: null }],
              },
            });
          const exactAgreements = universityAgreements.filter(
            (item) => item.programId === choice.programId,
          );
          const generalAgreements = universityAgreements.filter(
            (item) => item.programId === null,
          );
          if (exactAgreements.length > 1 || generalAgreements.length > 1) {
            throw new CommissionActionError("university-agreement-conflict");
          }
          const universityAgreement =
            exactAgreements[0] ?? generalAgreements[0];
          if (!universityAgreement) {
            throw new CommissionActionError("university-agreement-not-found");
          }
          const lockedUniversityAgreement = await tx.$queryRaw<
            Array<{ id: string }>
          >`
          select "id" from public."university_commission_agreements"
          where "id" = ${universityAgreement.id}
            and "status" = 'ACTIVE'
            and "valid_from" <= ${parsed.data.paidAt}
            and "valid_until" >= ${parsed.data.paidAt}
          for share
        `;
          if (lockedUniversityAgreement.length !== 1) {
            throw new CommissionActionError("university-agreement-not-found");
          }

          await tx.$queryRaw<Array<{ id: string }>>`
          select "id"
          from public."commission_package_agreements"
          where "id" = ${packageAgreement.id}
          for share
        `;
          await tx.$queryRaw<Array<{ locked: number }>>`
          select 1 as locked from pg_advisory_xact_lock(
            hashtextextended(
              ${`${packageAgreement.id}:${educationLevel}`},
              0
            )
          )
        `;

          const coveredUniversityIds = packageAgreement.universities.map(
            (item) => item.universityId,
          );
          const ordinalWhere = {
            AND: [
              {
                OR: [{ agentId }, { agentId: null, student: { agentId } }],
              },
              {
                OR: [
                  {
                    choices: {
                      some: { universityId: { in: coveredUniversityIds } },
                    },
                    status: { in: [...ACCEPTED_APPLICATION_STATUSES] },
                  },
                  {
                    choices: {
                      some: {
                        status: { in: [...ACCEPTED_APPLICATION_STATUSES] },
                        universityId: { in: coveredUniversityIds },
                      },
                    },
                  },
                ],
              },
              {
                OR: [
                  { createdAt: { lt: choice.application.createdAt } },
                  {
                    createdAt: choice.application.createdAt,
                    id: { lte: choice.application.id },
                  },
                ],
              },
            ],
            period: { year: choice.application.period.year },
          } satisfies Prisma.ApplicationWhereInput;
          const studentOrdinal = await tx.application.count({
            where: {
              ...ordinalWhere,
              educationLevelId: choice.application.educationLevelId,
            },
          });
          if (studentOrdinal < 1) {
            throw new CommissionActionError("package-student-order-invalid");
          }
          const mixedStudentOrdinal = packageAgreement.package.mixedScholarship
            ? await tx.application.count({ where: ordinalWhere })
            : studentOrdinal;

          const tierRate =
            rule.commissionType === "FIXED"
              ? null
              : selectTierRate({
                  rateTier1: Number(rule.rateTier1),
                  rateTier2: Number(rule.rateTier2),
                  studentOrdinal,
                  tierThreshold: rule.tierThreshold,
                });
          const agentValue =
            rule.commissionType === "FIXED"
              ? Number(rule.fixedAmount)
              : (tierRate ?? 0);
          const scholarship = packageAgreement.package.scholarships[0] ?? null;
          const existingCalculation = await tx.commissionCalculation.findFirst({
            select: { id: true },
            where: {
              applicationId: choice.applicationId,
              packageAgreementId: packageAgreement.id,
              payment: { status: "POSTED" },
            },
          });
          const earnedPackageCount = existingCalculation
            ? 0
            : calculateLevelScholarshipPackageCount(
                studentOrdinal,
                scholarship
                  ? {
                      additionalInterval: scholarship.additionalInterval,
                      scholarshipCount: scholarship.scholarshipCount,
                      studentThreshold: scholarship.studentThreshold,
                      triggerType: scholarship.triggerType,
                    }
                  : null,
              );
          const levelAwards = earnedPackageCount
            ? (scholarship?.awards.length
                ? scholarship.awards
                : [
                    {
                      allPrograms: true,
                      educationLevel,
                      programs: [],
                      quantity: 1,
                    },
                  ]
              ).map((award) => ({
                allPrograms: award.allPrograms,
                kind: "LEVEL_COMPOSITION" as const,
                programs: award.programs.map(({ program, quantity }) => ({
                  id: program.id,
                  name: program.name,
                  quantity: quantity * earnedPackageCount,
                  universityId: program.universityId,
                })),
                quantity: award.allPrograms
                  ? award.quantity * earnedPackageCount
                  : award.programs.reduce(
                      (total, item) => total + item.quantity,
                      0,
                    ) * earnedPackageCount,
                sourceEducationLevel: educationLevel,
                targetEducationLevel: award.educationLevel,
              }))
            : [];
          const mixedCredits = existingCalculation
            ? 0
            : calculateMixedScholarshipCredits(
                mixedStudentOrdinal,
                packageAgreement.package.mixedScholarship,
              );
          const scholarshipAwards = [
            ...levelAwards,
            ...(mixedCredits
              ? [
                  {
                    allPrograms: true,
                    kind: "GLOBAL_MIXED" as const,
                    programs: [],
                    quantity: mixedCredits,
                    sourceEducationLevel: null,
                    targetEducationLevel: null,
                  },
                ]
              : []),
          ];
          const scholarshipCreditsEarned = scholarshipAwards.reduce(
            (total, award) => total + award.quantity,
            0,
          );

          terms = {
            agentMethod:
              rule.commissionType === "FIXED" ? "FIXED" : "PERCENTAGE",
            agentValue,
            agentAlreadyEarned:
              rule.commissionType === "FIXED" && Boolean(existingCalculation),
            agreementId: null,
            universityAgreementId: universityAgreement.id,
            universityGrossMethod: universityAgreement.grossMethod,
            universityGrossValue: Number(universityAgreement.grossValue),
            campusMethod: "FIXED",
            campusValue: 0,
            educationLevel,
            packageAgreementId: packageAgreement.id,
            packageRuleType: rule.commissionType,
            paymentTermDays: packagePaymentTermDays(rule.commissionType),
            scholarshipCreditsEarned,
            scholarshipAwardSnapshot: scholarshipAwards.length
              ? scholarshipAwards
              : undefined,
            source: "PACKAGE_AGREEMENT",
            studentOrdinal,
          };
        } else {
          if (!educationLevel) {
            throw new CommissionActionError("education-level-unsupported");
          }
          const candidates = await tx.commissionAgreement.findMany({
            orderBy: { createdAt: "desc" },
            where: {
              agentId,
              currency: parsed.data.currency,
              status: "ACTIVE",
              universityId: choice.universityId,
              validFrom: { lte: parsed.data.paidAt },
              validUntil: { gte: parsed.data.paidAt },
              OR: [{ programId: choice.programId }, { programId: null }],
            },
          });
          const candidateAgreement =
            candidates.find((item) => item.programId === choice.programId) ??
            candidates.find((item) => item.programId === null);
          if (!candidateAgreement) {
            throw new CommissionActionError("agreement-not-found");
          }

          await tx.$queryRaw<Array<{ id: string }>>`
          select "id"
          from public."commission_agreements"
          where "id" = ${candidateAgreement.id}
          for share
        `;
          const agreement = await tx.commissionAgreement.findFirst({
            where: {
              id: candidateAgreement.id,
              agentId,
              currency: parsed.data.currency,
              status: "ACTIVE",
              universityId: choice.universityId,
              validFrom: { lte: parsed.data.paidAt },
              validUntil: { gte: parsed.data.paidAt },
            },
          });
          if (!agreement) {
            throw new CommissionActionError("agreement-not-found");
          }

          if (agreement.installmentPolicy === "FIRST_PAYMENT_ONLY") {
            const existingCalculation =
              await tx.commissionCalculation.findFirst({
                select: { id: true },
                where: {
                  agreementId: agreement.id,
                  applicationId: choice.applicationId,
                  payment: { status: "POSTED" },
                },
              });
            if (existingCalculation) {
              throw new CommissionActionError(
                "first-payment-already-calculated",
              );
            }
          }

          terms = {
            agentMethod: agreement.agentMethod,
            agentValue: Number(agreement.agentValue),
            agentAlreadyEarned: false,
            agreementId: agreement.id,
            universityAgreementId: null,
            universityGrossMethod: null,
            universityGrossValue: null,
            campusMethod: agreement.campusMethod,
            campusValue: Number(agreement.campusValue),
            educationLevel: null,
            packageAgreementId: null,
            packageRuleType: null,
            paymentTermDays: agreement.paymentTermDays,
            scholarshipCreditsEarned: 0,
            scholarshipAwardSnapshot: undefined,
            source: "LEGACY_AGREEMENT",
            studentOrdinal: null,
          };
        }

        const agentAmount = terms.agentAlreadyEarned
          ? 0
          : terms.source === "PACKAGE_AGREEMENT"
            ? calculatePackageCommission({
                amount: parsed.data.amount,
                fixedAmount:
                  terms.agentMethod === "FIXED" ? terms.agentValue : null,
                rate:
                  terms.agentMethod === "PERCENTAGE" ? terms.agentValue : null,
                type: terms.packageRuleType!,
              })
            : calculateShare(
                parsed.data.amount,
                terms.agentMethod,
                terms.agentValue,
              );

        // Get agent payout settings and tax rates
        const agent = await tx.agent.findUnique({
          select: {
            cashPayoutActive: true,
            accountPayoutActive: true,
            holdInAccount: true,
            manualPayoutManagement: true,
            payoutPercentage: true,
          },
          where: { id: agentId },
        });

        // Get tax rates from package rule (if package agreement)
        let educationTaxRate = 0;
        let vatRate = 0;
        let azvRate = 0;

        if (terms.source === "PACKAGE_AGREEMENT" && terms.packageAgreementId) {
          const packageWithRule = await tx.commissionPackage.findFirst({
            select: {
              rules: {
                select: {
                  educationTaxRate: true,
                  vatRate: true,
                  azvRate: true,
                },
                where: {
                  educationLevel: terms.educationLevel || undefined,
                  isActive: true,
                },
              },
            },
            where: { id: packageAgreement.packageId },
          });
          const applicableRule = packageWithRule?.rules[0];
          if (applicableRule) {
            educationTaxRate = Number(applicableRule.educationTaxRate);
            vatRate = Number(applicableRule.vatRate);
            azvRate = Number(applicableRule.azvRate);
          }
        }

        // Calculate tax amounts
        const educationTaxAmount = roundMoney((agentAmount * educationTaxRate) / 100);
        const vatAmount = roundMoney((agentAmount * vatRate) / 100);
        const azvAmount = roundMoney((agentAmount * azvRate) / 100);
        const totalTaxAmount = educationTaxAmount + vatAmount + azvAmount;
        const netAgentAmount = roundMoney(agentAmount - totalTaxAmount);

        // Calculate cash vs account payout based on agent settings
        let cashPayoutAmount: number | null = null;
        let accountPayoutAmount: number | null = null;

        if (agent?.manualPayoutManagement) {
          // Manual management - set both to null for manual entry
          cashPayoutAmount = null;
          accountPayoutAmount = null;
        } else if (agent?.holdInAccount) {
          // Hold all in account
          cashPayoutAmount = 0;
          accountPayoutAmount = netAgentAmount;
        } else {
          // Apply payout percentage
          const payoutPercentage = Number(agent?.payoutPercentage ?? 100);
          const payoutAmount = roundMoney((netAgentAmount * payoutPercentage) / 100);
          const holdAmount = roundMoney(netAgentAmount - payoutAmount);

          if (agent?.cashPayoutActive && agent?.accountPayoutActive) {
            // Both active - split based on percentage (default 50/50 if not specified)
            cashPayoutAmount = roundMoney(payoutAmount / 2);
            accountPayoutAmount = roundMoney(payoutAmount / 2);
          } else if (agent?.cashPayoutActive) {
            // Only cash
            cashPayoutAmount = payoutAmount;
            accountPayoutAmount = holdAmount;
          } else if (agent?.accountPayoutActive) {
            // Only account
            cashPayoutAmount = 0;
            accountPayoutAmount = payoutAmount + holdAmount;
          } else {
            // Neither active - hold all
            cashPayoutAmount = 0;
            accountPayoutAmount = netAgentAmount;
          }
        }
        const grossCommissionAmount =
          terms.source === "PACKAGE_AGREEMENT"
            ? calculateShare(
                parsed.data.amount,
                terms.universityGrossMethod!,
                terms.universityGrossValue!,
              )
            : roundMoney(
                calculateShare(
                  parsed.data.amount,
                  terms.campusMethod,
                  terms.campusValue,
                ) + agentAmount,
              );
        if (grossCommissionAmount <= 0) {
          throw new CommissionActionError("commission-rounds-to-zero");
        }
        if (grossCommissionAmount + 0.005 < agentAmount) {
          throw new CommissionActionError("university-commission-below-agent");
        }
        const campusAmount = roundMoney(grossCommissionAmount - agentAmount);
        if (grossCommissionAmount > parsed.data.amount + 0.005) {
          throw new CommissionActionError("commission-exceeds-payment");
        }

        const payment = await tx.commissionPayment.create({
          data: {
            amount: parsed.data.amount,
            applicationChoiceId: choice.id,
            baseAmount: roundMoney(parsed.data.amount * exchangeRate),
            baseCurrency: FINANCE_BASE_CURRENCY,
            code: paymentCode,
            createdById: session.userId,
            currency: parsed.data.currency,
            evidenceName: uploadedFile?.fileName,
            evidenceUrl: uploadedFile?.fileUrl,
            exchangeRate,
            notes: parsed.data.notes,
            paidAt: parsed.data.paidAt,
            postedById: session.userId,
            reference: parsed.data.reference,
          },
        });
        const calculation = await tx.commissionCalculation.create({
          data: {
            agentAmount,
            agentId,
            agentMethod: terms.agentMethod,
            agentValue: terms.agentValue,
            agreementId: terms.agreementId,
            universityAgreementId: terms.universityAgreementId,
            applicationId: choice.applicationId,
            baseCurrency: FINANCE_BASE_CURRENCY,
            basisAmount: parsed.data.amount,
            campusAmount,
            campusMethod: terms.campusMethod,
            campusValue:
              terms.source === "PACKAGE_AGREEMENT"
                ? campusAmount
                : terms.campusValue,
            code: calculationCode,
            currency: parsed.data.currency,
            exchangeRate,
            grossCommissionAmount,
            educationLevel: terms.educationLevel,
            netTuitionAmount: roundMoney(
              parsed.data.amount - grossCommissionAmount,
            ),
            packageAgreementId: terms.packageAgreementId,
            packageRuleType: terms.packageRuleType,
            payableDueDate: addBusinessDays(
              parsed.data.paidAt,
              terms.paymentTermDays,
            ),
            paymentId: payment.id,
            scholarshipCreditsEarned: terms.scholarshipCreditsEarned,
            scholarshipAwardSnapshot: terms.scholarshipAwardSnapshot,
            source: terms.source,
            studentOrdinal: terms.studentOrdinal,
            studentId: choice.application.student.id,
            universityId: choice.universityId,
            cashPayoutAmount,
            accountPayoutAmount,
            educationTaxAmount,
            vatAmount,
            azvAmount,
          },
        });

        await createCommissionAudit(tx, {
          action: "CREATED",
          entityId: payment.id,
          entityType: "PAYMENT",
          newValue: {
            amount: payment.amount.toString(),
            code: payment.code,
            currency: payment.currency,
            status: payment.status,
          },
          userId: session.userId,
        });
        await createCommissionAudit(tx, {
          action: "CALCULATED",
          entityId: calculation.id,
          entityType: "CALCULATION",
          newValue: {
            agentAmount: calculation.agentAmount.toString(),
            campusAmount: calculation.campusAmount.toString(),
            code: calculation.code,
            grossCommissionAmount: calculation.grossCommissionAmount.toString(),
            packageAgreementId: calculation.packageAgreementId,
            scholarshipCreditsEarned: calculation.scholarshipCreditsEarned,
            source: calculation.source,
            status: calculation.status,
          },
          userId: session.userId,
        });
        await tx.agentNotification.create({
          data: {
            actionHref: "/commissions?mode=operations",
            agentId,
            entityId: calculation.id,
            entityType: "COMMISSION_CALCULATION",
            message: `${choice.university.name} üzrə ${calculationCode} komissiyası hesablandı.${terms.scholarshipCreditsEarned ? ` ${terms.scholarshipCreditsEarned} yeni burs haqqı qazanıldı.` : ""}`,
            title: "Yeni komissiya hesablaması",
            type: "COMMISSION_UPDATED",
          },
        });
      },
      { timeout: 30000 },
    );
  } catch (error) {
    if (uploadedFile) {
      await deleteStorageFile(uploadedFile.fileUrl).catch(() => undefined);
    }
    if (!(error instanceof CommissionActionError)) {
      console.error("Commission payment calculation failed", error);
    }
    redirectWithError(
      error instanceof CommissionActionError
        ? error.message
        : "payment-create-failed",
      locale,
    );
  }

  revalidateCommissions();
  redirect(commissionUrl(locale, "success=payment-calculated"));
}

export async function updateCommissionAgreementStatusAction(
  formData: FormData,
) {
  const locale = getActionLocale(formData);
  const session = await requirePermission("commissions:manage", { locale });
  const parsed = commissionAgreementStatusSchema.safeParse({
    agreementId: getString(formData, "agreementId"),
    status: getString(formData, "status"),
  });
  if (!parsed.success) {
    redirectWithError("agreement-status-validation", locale);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw<Array<{ id: string }>>`
        select "id"
        from public."commission_agreements"
        where "id" = ${parsed.data.agreementId}
        for update
      `;
      const agreement = await tx.commissionAgreement.findUnique({
        where: { id: parsed.data.agreementId },
      });
      if (!agreement) throw new CommissionActionError("agreement-not-found");

      const targetStatus = parsed.data.status;
      const allowed =
        (targetStatus === "ACTIVE" &&
          ["DRAFT", "SUSPENDED"].includes(agreement.status)) ||
        (targetStatus === "SUSPENDED" && agreement.status === "ACTIVE") ||
        (targetStatus === "ARCHIVED" && agreement.status !== "ARCHIVED");
      if (!allowed)
        throw new CommissionActionError("agreement-status-transition");
      if (targetStatus === "ACTIVE" && agreement.validUntil < startOfToday()) {
        throw new CommissionActionError("agreement-expired");
      }

      const updated = await tx.commissionAgreement.update({
        data: {
          activatedAt: targetStatus === "ACTIVE" ? new Date() : undefined,
          activatedById: targetStatus === "ACTIVE" ? session.userId : undefined,
          status: targetStatus,
        },
        where: { id: agreement.id },
      });
      await createCommissionAudit(tx, {
        action: targetStatus === "ACTIVE" ? "ACTIVATED" : "UPDATED",
        entityId: agreement.id,
        entityType: "AGREEMENT",
        newValue: { code: updated.code, status: updated.status },
        oldValue: { status: agreement.status },
        userId: session.userId,
      });
    });
  } catch (error) {
    redirectWithError(
      isAgreementOverlapError(error)
        ? "agreement-overlap"
        : error instanceof CommissionActionError
          ? error.message
          : "agreement-status-failed",
      locale,
    );
  }

  revalidateCommissions();
  const successCode =
    parsed.data.status === "ACTIVE"
      ? "agreement-activated"
      : parsed.data.status === "SUSPENDED"
        ? "agreement-suspended"
        : "agreement-archived";
  redirect(commissionUrl(locale, `success=${successCode}`));
}

export async function approveCommissionCalculationAction(formData: FormData) {
  const locale = getActionLocale(formData);
  const session = await requirePermission("commissions:approve", { locale });
  const parsed = commissionApprovalSchema.safeParse({
    calculationId: getString(formData, "calculationId"),
  });
  if (!parsed.success) redirectWithError("approval-validation", locale);

  try {
    await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw<Array<{ id: string }>>`
        select "id"
        from public."commission_calculations"
        where "id" = ${parsed.data.calculationId}
        for update
      `;
        const calculation = await tx.commissionCalculation.findFirst({
          include: {
            agent: {
              select: {
                companyName: true,
                firstName: true,
                id: true,
                lastName: true,
              },
            },
            university: { select: { name: true } },
          },
          where: {
            id: parsed.data.calculationId,
            status: { in: ["CALCULATED", "UNDER_REVIEW"] },
          },
        });
        if (!calculation)
          throw new CommissionActionError("calculation-not-approvable");

        const incomeCategory = await ensureFinanceCategory(tx, {
          createdById: session.userId,
          name: "Universitet komissiyası",
          sortOrder: 15,
          type: "INCOME",
        });
        const agentName = getAgentName(calculation.agent);
        const grossAmount = Number(calculation.grossCommissionAmount);
        const agentAmount = Number(calculation.agentAmount);
        const exchangeRate = Number(calculation.exchangeRate);
        const now = new Date();
        const receivable = await tx.financeObligation.create({
          data: {
            amount: grossAmount,
            baseAmount: roundMoney(grossAmount * exchangeRate),
            baseCurrency: calculation.baseCurrency,
            categoryId: incomeCategory.id,
            code: createCode("RCV"),
            counterpartyName: calculation.university.name,
            counterpartyType: "UNIVERSITY",
            createdById: session.userId,
            currency: calculation.currency,
            description: `${calculation.code} üzrə universitetdən alınacaq ümumi komissiya`,
            dueDate: calculation.payableDueDate,
            exchangeRate,
            issueDate: now,
            reference: calculation.code,
            relatedEntityId: calculation.id,
            relatedEntityType: "COMMISSION_CALCULATION",
            type: "RECEIVABLE",
          },
        });
        const payable =
          agentAmount > 0
            ? await tx.financeObligation.create({
                data: {
                  categoryId: (
                    await ensureFinanceCategory(tx, {
                      createdById: session.userId,
                      name: "Agent komissiyası",
                      sortOrder: 10,
                      type: "EXPENSE",
                    })
                  ).id,
                  amount: agentAmount,
                  baseAmount: roundMoney(agentAmount * exchangeRate),
                  baseCurrency: calculation.baseCurrency,
                  code: createCode("PAY"),
                  counterpartyName: agentName,
                  counterpartyType: "AGENT",
                  createdById: session.userId,
                  currency: calculation.currency,
                  description: `${calculation.code} üzrə agent komissiyası`,
                  dueDate: calculation.payableDueDate,
                  exchangeRate,
                  issueDate: now,
                  reference: calculation.code,
                  relatedEntityId: calculation.id,
                  relatedEntityType: "COMMISSION_CALCULATION",
                  type: "PAYABLE",
                },
              })
            : null;

        await tx.commissionCalculation.update({
          data: {
            agentPayableId: payable?.id ?? null,
            approvedAt: now,
            approvedById: session.userId,
            status: payable ? "PAYABLE" : "PAID",
            universityReceivableId: receivable.id,
          },
          where: { id: calculation.id },
        });
        if (payable)
          await tx.agent.update({
            data: {
              commissionBalance: {
                increment: roundMoney(agentAmount * exchangeRate),
              },
            },
            where: { id: calculation.agentId },
          });
        if (payable)
          await tx.agentNotification.create({
            data: {
              actionHref: "/commissions?mode=operations",
              agentId: calculation.agentId,
              entityId: calculation.id,
              entityType: "COMMISSION_CALCULATION",
              message: `${calculation.code} təsdiqləndi və ${formatMoney(agentAmount, calculation.currency)} ödənişə hazırdır.`,
              title: "Komissiya təsdiqləndi",
              type: "COMMISSION_UPDATED",
            },
          });
        await createCommissionAudit(tx, {
          action: "APPROVED",
          entityId: calculation.id,
          entityType: "CALCULATION",
          newValue: {
            agentPayableId: payable?.id ?? null,
            code: calculation.code,
            status: payable ? "PAYABLE" : "PAID",
            universityReceivableId: receivable.id,
          },
          oldValue: { status: calculation.status },
          userId: session.userId,
        });
      },
      { timeout: 30000 },
    );
  } catch (error) {
    if (!(error instanceof CommissionActionError)) {
      console.error("Commission calculation approval failed", error);
    }
    redirectWithError(
      error instanceof CommissionActionError
        ? error.message
        : "approval-failed",
      locale,
    );
  }

  revalidateCommissions();
  redirect(commissionUrl(locale, "success=calculation-approved"));
}

async function ensureFinanceCategory(
  tx: Prisma.TransactionClient,
  input: {
    createdById: string;
    name: string;
    sortOrder: number;
    type: "INCOME" | "EXPENSE";
  },
) {
  return tx.financeCategory.upsert({
    create: {
      createdById: input.createdById,
      isSystem: true,
      name: input.name,
      sortOrder: input.sortOrder,
      type: input.type,
    },
    update: { isSystem: true, status: "ACTIVE" },
    where: { type_name: { name: input.name, type: input.type } },
  });
}

async function createCommissionAudit(
  tx: Prisma.TransactionClient,
  input: {
    action:
      | "CREATED"
      | "ACTIVATED"
      | "CALCULATED"
      | "APPROVED"
      | "UPDATED"
      | "PAID"
      | "VOIDED";
    entityId: string;
    entityType: "AGREEMENT" | "PAYMENT" | "CALCULATION";
    newValue?: Prisma.InputJsonValue;
    oldValue?: Prisma.InputJsonValue;
    userId: string;
  },
) {
  await tx.commissionAuditLog.create({ data: input });
}

function calculateShare(
  basisAmount: number,
  method: "PERCENTAGE" | "FIXED",
  value: number,
) {
  return roundMoney(
    method === "PERCENTAGE" ? (basisAmount * value) / 100 : value,
  );
}

function createCode(prefix: "COM" | "PAY" | "RCV" | "UNI") {
  const now = new Date();
  const date = [
    String(now.getUTCFullYear()).slice(-2),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");
  return `${prefix}-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("az-AZ", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function getAgentName(agent: {
  companyName: string | null;
  firstName: string;
  lastName: string;
}) {
  return agent.companyName?.trim() || `${agent.firstName} ${agent.lastName}`;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getOptionalFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

async function isValidCommissionDocument(file: File) {
  if (file.size > 10 * 1024 * 1024) return false;
  const bytes = await readFileHeader(file);
  const extension = getFileExtension(file.name);

  if (extension === "pdf") {
    return hasMime(file, ["application/pdf"]) && isPdf(bytes);
  }
  if (extension === "doc") {
    return hasMime(file, ["application/msword"]) && isOleDocument(bytes);
  }
  if (extension === "docx") {
    return (
      hasMime(file, [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]) && isZip(bytes)
    );
  }
  return false;
}

async function isValidCommissionEvidence(file: File) {
  if (file.size > 10 * 1024 * 1024) return false;
  const bytes = await readFileHeader(file);
  const extension = getFileExtension(file.name);

  if (extension === "pdf") {
    return hasMime(file, ["application/pdf"]) && isPdf(bytes);
  }
  if (["jpg", "jpeg"].includes(extension)) {
    return (
      hasMime(file, ["image/jpeg"]) && matchesBytes(bytes, [255, 216, 255])
    );
  }
  if (extension === "png") {
    return (
      hasMime(file, ["image/png"]) &&
      matchesBytes(bytes, [137, 80, 78, 71, 13, 10, 26, 10])
    );
  }
  if (extension === "webp") {
    return (
      hasMime(file, ["image/webp"]) &&
      readAscii(bytes, 0, 4) === "RIFF" &&
      readAscii(bytes, 8, 4) === "WEBP"
    );
  }
  return false;
}

async function readFileHeader(file: File) {
  return new Uint8Array(await file.slice(0, 16).arrayBuffer());
}

function getFileExtension(fileName: string) {
  return fileName.toLowerCase().split(".").pop() ?? "";
}

function hasMime(file: File, allowed: string[]) {
  return file.type === "" || allowed.includes(file.type.toLowerCase());
}

function matchesBytes(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function isPdf(bytes: Uint8Array) {
  return readAscii(bytes, 0, 5) === "%PDF-";
}

function isOleDocument(bytes: Uint8Array) {
  return matchesBytes(bytes, [208, 207, 17, 224, 161, 177, 26, 225]);
}

function isZip(bytes: Uint8Array) {
  return matchesBytes(bytes, [80, 75, 3, 4]);
}

function readAscii(bytes: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function revalidateCommissions() {
  for (const locale of locales) {
    const prefix = locale === defaultLocale ? "" : `/${locale}`;
    for (const segment of ["commissions", "finance", "agents"]) {
      revalidatePath(`${prefix}/${segment}`);
    }
  }
}

function getActionLocale(formData: FormData): AppLocale {
  const locale = getString(formData, "locale");
  return locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;
}

function commissionUrl(locale: AppLocale, query?: string) {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${prefix}/commissions?mode=operations${query ? `&${query}` : ""}`;
}

function redirectWithError(code: string, locale: AppLocale): never {
  redirect(commissionUrl(locale, `error=${encodeURIComponent(code)}`));
}

function isAgreementOverlapError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("commission_agreement_date_overlap")
  );
}

function startOfToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Baku",
    year: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return new Date(
    Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)),
  );
}

class CommissionActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommissionActionError";
  }
}
