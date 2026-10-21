import {
    academicYearFromPeriodYear,
    calculateAgentPayoutBreakdown,
    calculatePackageCommission,
    packagePaymentTermDays,
    resolvePackageEducationLevel,
    selectTierRate,
    type PayoutColumn,
  } from "@/features/commissions/package-engine";
  import type { CommissionPackageRuleType } from "@/features/commissions/package-types";
  
  const ACCEPTED = ["ACCEPTED", "ENROLLED"] as const;
  
  export type AgentPayoutPreview = {
    account: PayoutColumn;
    accountPayoutActive: boolean;
    basisAmount: number | null;
    cash: PayoutColumn;
    cashPayoutActive: boolean;
    commissionType: CommissionPackageRuleType;
    currency: string;
    holdInAccount: boolean;
    isEstimate: boolean;
    paymentTermDays: number;
    programName: string;
    rates: { azvRate: number; educationTaxRate: number; vatRate: number };
    universityName: string;
  };
  
  export async function getAgentPayoutPreview(
    applicationId: string,
    agentId: string,
  ): Promise<AgentPayoutPreview | null> {
    if (!process.env.DATABASE_URL) return null;
    const { prisma } = await import("@/lib/db");
  
    const application = await prisma.application.findFirst({
      include: {
        choices: {
          include: { program: true, tuition: true, university: true },
          orderBy: { priority: "asc" },
        },
        educationLevel: true,
        period: true,
        student: { select: { agentId: true } },
      },
      where: {
        id: applicationId,
        OR: [{ agentId }, { agentId: null, student: { agentId } }],
      },
    });
    if (!application) return null;
  
    const applicationAccepted = (ACCEPTED as readonly string[]).includes(
      application.status,
    );
    const choice = application.choices.find(
      (item) =>
        (item.status && (ACCEPTED as readonly string[]).includes(item.status)) ||
        applicationAccepted,
    );
    if (!choice) return null;
  
    const educationLevel = resolvePackageEducationLevel(
      application.educationLevel.name,
    );
    if (!educationLevel) return null;
    const academicYear = academicYearFromPeriodYear(application.period.year);
  
    const agreement = await prisma.commissionPackageAgreement.findFirst({
      include: {
        package: {
          include: { rules: { where: { educationLevel, isActive: true } } },
        },
        universities: { select: { universityId: true } },
      },
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
    });
    const rule = agreement?.package.rules[0];
    if (!agreement || !rule) return null;
  
    const basisAmount = choice.tuition
      ? Number(choice.tuition.discountedTuitionFee ?? choice.tuition.tuitionFee)
      : null;
  
    let gross = 0;
    if (rule.commissionType === "FIXED") {
      gross = Number(rule.fixedAmount ?? 0);
    } else if (basisAmount !== null) {
      const ordinal = await prisma.application.count({
        where: {
          AND: [
            { OR: [{ agentId }, { agentId: null, student: { agentId } }] },
            {
              OR: [
                { createdAt: { lt: application.createdAt } },
                { createdAt: application.createdAt, id: { lte: application.id } },
              ],
            },
          ],
          choices: {
            some: {
              universityId: {
                in: agreement.universities.map((item) => item.universityId),
              },
            },
          },
          educationLevelId: application.educationLevelId,
          period: { year: application.period.year },
          status: { in: [...ACCEPTED] },
        },
      });
      const rate = selectTierRate({
        rateTier1: Number(rule.rateTier1),
        rateTier2: Number(rule.rateTier2),
        studentOrdinal: Math.max(ordinal, 1),
        tierThreshold: rule.tierThreshold,
      });
      gross = calculatePackageCommission({
        amount: basisAmount,
        fixedAmount: null,
        rate,
        type: rule.commissionType,
      });
    }
  
    const rates = {
      azvRate: Number(rule.azvRate),
      educationTaxRate: Number(rule.educationTaxRate),
      vatRate: Number(rule.vatRate),
    };
    const agent = await prisma.agent.findUnique({
      select: {
        accountPayoutActive: true,
        cashPayoutActive: true,
        holdInAccount: true,
      },
      where: { id: agentId },
    });
    const { account, cash } = calculateAgentPayoutBreakdown({ gross, rates });
  
    return {
      account,
      accountPayoutActive: agent?.accountPayoutActive ?? true,
      basisAmount,
      cash,
      cashPayoutActive: agent?.cashPayoutActive ?? true,
      commissionType: rule.commissionType,
      currency: rule.currency,
      holdInAccount: agent?.holdInAccount ?? false,
      isEstimate: rule.commissionType !== "FIXED",
      paymentTermDays: packagePaymentTermDays(rule.commissionType),
      programName: choice.program.name,
      rates,
      universityName: choice.university.name,
    };
  }