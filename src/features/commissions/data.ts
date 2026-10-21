import "server-only";

import { format } from "date-fns";

import type { CommissionWorkspaceData } from "@/features/commissions/types";
import { can } from "@/lib/auth/permissions";
import { getSessionAgentId, type AuthSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createDocumentAccessUrls } from "@/lib/supabase/storage";

const APPROVED_STATUSES = ["PAYABLE", "PARTIALLY_PAID", "PAID"] as const;
const ACCEPTED_APPLICATION_STATUSES = ["ACCEPTED", "ENROLLED"] as const;

export async function getCommissionWorkspaceData(
  session: AuthSession,
  options: { preview?: boolean } = {},
): Promise<CommissionWorkspaceData> {
  const activeAgentId = getSessionAgentId(session);
  const portalType = activeAgentId ? "agent" : "staff";
  const permissions = {
    activeAgentId,
    canApprove: can(session.role, "commissions:approve"),
    canManage: can(session.role, "commissions:manage"),
    portalType,
  } as const;

  if (options.preview && process.env.NODE_ENV !== "production") {
    return createDemoCommissionData(permissions);
  }

  try {
    const agentFilter = activeAgentId ? { agentId: activeAgentId } : {};
    const [
      agreements,
      calculations,
      payments,
      audit,
      agents,
      universities,
      programs,
      applications,
      activePackageAgreements,
      universityAgreements,
    ] = await Promise.all([
      prisma.commissionAgreement.findMany({
        include: {
          agent: {
            select: {
              companyName: true,
              firstName: true,
              lastName: true,
            },
          },
          program: { select: { name: true } },
          university: { select: { name: true } },
        },
        orderBy: [{ status: "asc" }, { validUntil: "desc" }],
        take: 100,
        where: agentFilter,
      }),
      prisma.commissionCalculation.findMany({
        include: {
          agent: {
            select: {
              companyName: true,
              firstName: true,
              lastName: true,
            },
          },
          agentPayable: {
            select: {
              settlements: {
                select: {
                  amount: true,
                  transaction: { select: { status: true } },
                },
              },
            },
          },
          application: { select: { code: true } },
          packageAgreement: { select: { code: true } },
          student: { select: { firstName: true, lastName: true } },
          university: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
        where: agentFilter,
      }),
      prisma.commissionPayment.findMany({
        include: {
          applicationChoice: {
            select: {
              application: {
                select: {
                  agentId: true,
                  code: true,
                  student: {
                    select: { agentId: true, firstName: true, lastName: true },
                  },
                },
              },
              university: { select: { name: true } },
            },
          },
        },
        orderBy: { paidAt: "desc" },
        take: 100,
        where: activeAgentId
          ? {
              applicationChoice: {
                application: {
                  OR: [
                    { agentId: activeAgentId },
                    { student: { agentId: activeAgentId } },
                  ],
                },
              },
            }
          : undefined,
      }),
      activeAgentId
        ? Promise.resolve([])
        : prisma.commissionAuditLog.findMany({
            include: { user: { select: { email: true, name: true } } },
            orderBy: { createdAt: "desc" },
            take: 100,
          }),
      activeAgentId
        ? Promise.resolve([])
        : prisma.agent.findMany({
            orderBy: [{ companyName: "asc" }, { firstName: "asc" }],
            select: {
              companyName: true,
              firstName: true,
              id: true,
              lastName: true,
            },
            take: 500,
            where: { portalStatus: { not: "SUSPENDED" } },
          }),
      activeAgentId
        ? Promise.resolve([])
        : prisma.university.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true },
            take: 500,
            where: { status: "ACTIVE" },
          }),
      activeAgentId
        ? Promise.resolve([])
        : prisma.program.findMany({
            orderBy: { name: "asc" },
            select: { id: true, name: true, universityId: true },
            take: 1_000,
            where: { status: "ACTIVE" },
          }),
      activeAgentId
        ? Promise.resolve([])
        : prisma.applicationChoice.findMany({
            orderBy: { updatedAt: "desc" },
            select: {
              application: {
                select: {
                  agentId: true,
                  code: true,
                  student: {
                    select: { agentId: true, firstName: true, lastName: true },
                  },
                },
              },
              id: true,
              program: { select: { name: true } },
              tuition: { select: { currency: true } },
              university: { select: { id: true, name: true } },
            },
            take: 150,
            where: {
              AND: [
                {
                  application: {
                    OR: [
                      { agentId: { not: null } },
                      { student: { agentId: { not: null } } },
                    ],
                  },
                },
                {
                  OR: [
                    { status: { in: [...ACCEPTED_APPLICATION_STATUSES] } },
                    {
                      application: {
                        status: { in: [...ACCEPTED_APPLICATION_STATUSES] },
                      },
                    },
                  ],
                },
              ],
            },
          }),
      prisma.commissionPackageAgreement.count({
        where: {
          ...agentFilter,
          status: "APPROVED",
          package: { status: "ACTIVE" },
        },
      }),
      activeAgentId
        ? Promise.resolve([])
        : prisma.universityCommissionAgreement.findMany({
            include: {
              university: { select: { name: true } },
              program: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
          }),
    ]);

    const agreementDocumentUrls = await createDocumentAccessUrls(
      agreements.flatMap((agreement) =>
        agreement.documentUrl ? [agreement.documentUrl] : [],
      ),
    );

    const mappedCalculations = calculations.map((calculation) => {
      const paidAgentAmount =
        calculation.agentPayable?.settlements.reduce(
          (total, settlement) =>
            total +
            (settlement.transaction.status === "POSTED"
              ? Number(settlement.amount)
              : 0),
          0,
        ) ?? 0;

      return {
        agentAmount: Number(calculation.agentAmount),
        agentName: getAgentName(calculation.agent),
        applicationCode: calculation.application.code,
        basisAmount: Number(calculation.basisAmount),
        campusAmount: activeAgentId ? 0 : Number(calculation.campusAmount),
        code: calculation.code,
        createdAt: calculation.createdAt.toISOString(),
        currency: calculation.currency,
        educationLevel: calculation.educationLevel,
        grossCommissionAmount: activeAgentId
          ? 0
          : Number(calculation.grossCommissionAmount),
        id: calculation.id,
        packageAgreementCode: calculation.packageAgreement?.code ?? null,
        paidAgentAmount,
        payableDueDate: toDateString(calculation.payableDueDate),
        scholarshipCreditsEarned: calculation.scholarshipCreditsEarned,
        scholarshipAwardSummary: mapScholarshipAwardSummary(
          calculation.scholarshipAwardSnapshot,
        ),
        source: calculation.source,
        status: calculation.status,
        studentOrdinal: calculation.studentOrdinal,
        studentName: `${calculation.student.firstName} ${calculation.student.lastName}`,
        universityName: calculation.university.name,
        cashPayoutAmount: calculation.cashPayoutAmount
          ? Number(calculation.cashPayoutAmount)
          : null,
        accountPayoutAmount: calculation.accountPayoutAmount
          ? Number(calculation.accountPayoutAmount)
          : null,
        educationTaxAmount: Number(calculation.educationTaxAmount ?? 0),
        vatAmount: Number(calculation.vatAmount ?? 0),
        azvAmount: Number(calculation.azvAmount ?? 0),
      };
    });

    const companyEarnedBase = calculations.reduce(
      (total, item) =>
        total +
        (APPROVED_STATUSES.includes(
          item.status as (typeof APPROVED_STATUSES)[number],
        )
          ? Number(item.campusAmount) * Number(item.exchangeRate)
          : 0),
      0,
    );
    const paidToAgentsBase = calculations.reduce((total, item) => {
      const paid =
        item.agentPayable?.settlements.reduce(
          (sum, settlement) =>
            sum +
            (settlement.transaction.status === "POSTED"
              ? Number(settlement.amount)
              : 0),
          0,
        ) ?? 0;
      return total + paid * Number(item.exchangeRate);
    }, 0);
    const approvedAgentBase = calculations.reduce(
      (total, item) =>
        total +
        (APPROVED_STATUSES.includes(
          item.status as (typeof APPROVED_STATUSES)[number],
        )
          ? Number(item.agentAmount) * Number(item.exchangeRate)
          : 0),
      0,
    );

    return {
      ...permissions,
      availability: "READY",
      agreements: agreements.map((agreement) => ({
        agentId: agreement.agentId,
        agentName: getAgentName(agreement.agent),
        agentValue: Number(agreement.agentValue),
        campusValue: Number(agreement.campusValue),
        code: agreement.code,
        createdAt: agreement.createdAt.toISOString(),
        currency: agreement.currency,
        documentAccessUrl: agreement.documentUrl
          ? (agreementDocumentUrls.get(agreement.documentUrl) ?? null)
          : null,
        documentName: agreement.documentName,
        id: agreement.id,
        installmentPolicy: agreement.installmentPolicy,
        method: {
          agent: agreement.agentMethod,
          campus: agreement.campusMethod,
        },
        notes: agreement.notes,
        paymentTermDays: agreement.paymentTermDays,
        programId: agreement.programId,
        scopeLabel: agreement.program?.name ?? "Bütün proqramlar",
        status: agreement.status,
        universityId: agreement.universityId,
        universityName: agreement.university.name,
        validFrom: toDateString(agreement.validFrom),
        validUntil: toDateString(agreement.validUntil),
      })),
      universityAgreements: universityAgreements.map((agreement) => ({
        id: agreement.id,
        code: agreement.code,
        universityName: agreement.university.name,
        scopeLabel: agreement.program?.name ?? "Bütün proqramlar",
        currency: agreement.currency,
        grossMethod: agreement.grossMethod,
        grossValue: Number(agreement.grossValue),
        validFrom: toDateString(agreement.validFrom),
        validUntil: toDateString(agreement.validUntil),
        status: agreement.status,
      })),
      applications: applications.map((choice) => ({
        agentId:
          choice.application.agentId ??
          choice.application.student.agentId ??
          "",
        currency: choice.tuition?.currency ?? "AZN",
        id: choice.id,
        label: `${choice.application.student.firstName} ${choice.application.student.lastName} · ${choice.application.code} · ${choice.university.name} · ${choice.program.name}`,
        universityId: choice.university.id,
      })),
      audit: audit.map((entry) => ({
        action: entry.action,
        actor: entry.user?.name ?? entry.user?.email ?? "Sistem",
        createdAt: entry.createdAt.toISOString(),
        entityCode: readAuditCode(entry.newValue) ?? entry.entityId,
        entityType: entry.entityType,
        id: entry.id,
        summary: getAuditSummary(entry.action, entry.entityType),
      })),
      calculations: mappedCalculations,
      isPreview: false,
      metrics: {
        activeAgreements:
          agreements.filter((item) => item.status === "ACTIVE").length +
          activePackageAgreements,
        activePackageAgreements,
        agentEarnedBase: approvedAgentBase,
        agentLiabilityBase: Math.max(0, approvedAgentBase - paidToAgentsBase),
        companyEarnedBase,
        paidToAgentsBase,
        pendingApproval: calculations.filter((item) =>
          ["CALCULATED", "UNDER_REVIEW"].includes(item.status),
        ).length,
      },
      options: {
        agents: agents.map((agent) => ({
          id: agent.id,
          label: getAgentName(agent),
        })),
        programs: programs.map((program) => ({
          id: program.id,
          label: program.name,
          universityId: program.universityId,
        })),
        universities: universities.map((university) => ({
          id: university.id,
          label: university.name,
        })),
      },
      payments: payments.map((payment) => ({
        amount: Number(payment.amount),
        applicationCode: payment.applicationChoice.application.code,
        code: payment.code,
        currency: payment.currency,
        id: payment.id,
        paidAt: toDateString(payment.paidAt),
        reference: payment.reference ?? "—",
        status: payment.status,
        studentName: `${payment.applicationChoice.application.student.firstName} ${payment.applicationChoice.application.student.lastName}`,
        universityName: payment.applicationChoice.university.name,
      })),
    };
  } catch (error) {
    const message = `Commission data unavailable: ${error instanceof Error ? error.message : String(error)}`;
    if (process.env.NODE_ENV === "production") console.error(message);
    else console.warn(message);
    return process.env.NODE_ENV === "production"
      ? createEmptyCommissionData(permissions)
      : createDemoCommissionData(permissions);
  }
}

function createEmptyCommissionData(
  permissions: Pick<
    CommissionWorkspaceData,
    "activeAgentId" | "canApprove" | "canManage" | "portalType"
  >,
): CommissionWorkspaceData {
  return {
    ...permissions,
    agreements: [],
    universityAgreements: [],
    applications: [],
    audit: [],
    availability: "UNAVAILABLE",
    calculations: [],
    isPreview: false,
    metrics: {
      activeAgreements: 0,
      activePackageAgreements: 0,
      agentEarnedBase: 0,
      agentLiabilityBase: 0,
      companyEarnedBase: 0,
      paidToAgentsBase: 0,
      pendingApproval: 0,
    },
    options: {
      agents: [],
      programs: [],
      universities: [],
    },
    payments: [],
  };
}

function createDemoCommissionData(
  permissions: Pick<
    CommissionWorkspaceData,
    "activeAgentId" | "canApprove" | "canManage" | "portalType"
  >,
): CommissionWorkspaceData {
  const allAgreements: CommissionWorkspaceData["agreements"] = [
    {
      agentId: "agent-baku-study",
      agentName: "Baku Study Partners",
      agentValue: 5,
      campusValue: 12,
      code: "CG-COM-2026-014",
      createdAt: "2026-08-10T08:00:00.000Z",
      currency: "AZN",
      documentAccessUrl: null,
      documentName: null,
      id: "agreement-1",
      installmentPolicy: "EVERY_PAYMENT",
      method: { agent: "PERCENTAGE", campus: "PERCENTAGE" },
      notes: null,
      paymentTermDays: 15,
      programId: null,
      scopeLabel: "Bütün proqramlar",
      status: "ACTIVE",
      universityId: "university-medipol",
      universityName: "İstanbul Medipol Universiteti",
      validFrom: "2026-09-01",
      validUntil: "2027-08-31",
    },
    {
      agentId: "agent-global-bridge",
      agentName: "Global Bridge",
      agentValue: 4,
      campusValue: 10,
      code: "CG-COM-2026-015",
      createdAt: "2026-08-09T08:00:00.000Z",
      currency: "USD",
      documentAccessUrl: null,
      documentName: null,
      id: "agreement-2",
      installmentPolicy: "EVERY_PAYMENT",
      method: { agent: "PERCENTAGE", campus: "PERCENTAGE" },
      notes: null,
      paymentTermDays: 20,
      programId: "program-masters",
      scopeLabel: "Magistratura",
      status: "ACTIVE",
      universityId: "university-bahcesehir",
      universityName: "Bahçeşehir Universiteti",
      validFrom: "2026-08-15",
      validUntil: "2027-08-14",
    },
    {
      agentId: "agent-caspian",
      agentName: "Caspian Education",
      agentValue: 300,
      campusValue: 750,
      code: "CG-COM-2026-016",
      createdAt: "2026-08-08T08:00:00.000Z",
      currency: "USD",
      documentAccessUrl: null,
      documentName: null,
      id: "agreement-3",
      installmentPolicy: "FIRST_PAYMENT_ONLY",
      method: { agent: "FIXED", campus: "FIXED" },
      notes: null,
      paymentTermDays: 15,
      programId: "program-business",
      scopeLabel: "Biznes proqramları",
      status: "ACTIVE",
      universityId: "university-uskudar",
      universityName: "Üsküdar Universiteti",
      validFrom: "2026-07-01",
      validUntil: "2027-06-30",
    },
  ];
  const allCalculations: CommissionWorkspaceData["calculations"] = [
    {
      accountPayoutAmount: 225,
      agentAmount: 450,
      agentName: "Baku Study Partners",
      applicationCode: "APP-2026-3456",
      azvAmount: 0,
      basisAmount: 9_000,
      campusAmount: 1_080,
      cashPayoutAmount: 225,
      code: "COM-260810-A12F",
      createdAt: "2026-08-10T09:20:00.000Z",
      currency: "AZN",
      educationLevel: null,
      educationTaxAmount: 0,
      grossCommissionAmount: 1_530,
      id: "calculation-1",
      packageAgreementCode: null,
      paidAgentAmount: 0,
      payableDueDate: "2026-08-31",
      scholarshipCreditsEarned: 0,
      scholarshipAwardSummary: [],
      source: "LEGACY_AGREEMENT",
      status: "PAYABLE",
      studentOrdinal: null,
      studentName: "Rəşad Əliyev",
      universityName: "İstanbul Medipol Universiteti",
      vatAmount: 0,
    },
    {
      accountPayoutAmount: 400,
      agentAmount: 480,
      agentName: "Global Bridge",
      applicationCode: "APP-2026-3345",
      azvAmount: 10,
      basisAmount: 12_000,
      campusAmount: 1_200,
      cashPayoutAmount: 0,
      code: "COM-260809-9B44",
      createdAt: "2026-08-09T14:05:00.000Z",
      currency: "USD",
      educationLevel: "MASTER",
      educationTaxAmount: 40,
      grossCommissionAmount: 1_680,
      id: "calculation-2",
      packageAgreementCode: "CG-PKG-260820-C82D",
      paidAgentAmount: 0,
      payableDueDate: "2026-09-04",
      scholarshipCreditsEarned: 1,
      scholarshipAwardSummary: [
        "1 bakalavr bursu · bütün ixtisaslar",
        "2 magistr bursu · Data analitikası və Maliyyə",
      ],
      source: "PACKAGE_AGREEMENT",
      status: "UNDER_REVIEW",
      studentOrdinal: 8,
      studentName: "Leyla Məmmədova",
      universityName: "Bahçeşehir Universiteti",
      vatAmount: 30,
    },
    {
      accountPayoutAmount: 150,
      agentAmount: 300,
      agentName: "Caspian Education",
      applicationCode: "APP-2026-3211",
      azvAmount: 0,
      basisAmount: 8_000,
      campusAmount: 750,
      cashPayoutAmount: 150,
      code: "COM-260808-C872",
      createdAt: "2026-08-08T11:40:00.000Z",
      currency: "USD",
      educationLevel: null,
      educationTaxAmount: 0,
      grossCommissionAmount: 1_050,
      id: "calculation-3",
      packageAgreementCode: null,
      paidAgentAmount: 300,
      payableDueDate: "2026-08-28",
      scholarshipCreditsEarned: 0,
      scholarshipAwardSummary: [],
      source: "LEGACY_AGREEMENT",
      status: "PAID",
      studentOrdinal: null,
      studentName: "Tural Hüseynov",
      universityName: "Üsküdar Universiteti",
      vatAmount: 0,
    },
  ];
  const isAgent = permissions.portalType === "agent";
  const visibleAgent = "Baku Study Partners";
  const agreements = isAgent
    ? allAgreements.filter((item) => item.agentName === visibleAgent)
    : allAgreements;
  const calculations = isAgent
    ? allCalculations.filter((item) => item.agentName === visibleAgent)
    : allCalculations;

  return {
    ...permissions,
    agreements,
    universityAgreements: [],
    applications: [
      {
        agentId: "agent-baku-study",
        currency: "AZN",
        id: "choice-accepted-1",
        label:
          "Rəşad Əliyev · APP-2026-3456 · İstanbul Medipol Universiteti · Tibb",
        universityId: "university-medipol",
      },
      {
        agentId: "agent-global-bridge",
        currency: "USD",
        id: "choice-accepted-2",
        label:
          "Leyla Məmmədova · APP-2026-3345 · Bahçeşehir Universiteti · MBA",
        universityId: "university-bahcesehir",
      },
    ],
    audit: isAgent
      ? []
      : [
          {
            action: "APPROVED",
            actor: "Qalib Məmmədov",
            createdAt: "2026-08-10T09:28:00.000Z",
            entityCode: "COM-260810-A12F",
            entityType: "CALCULATION",
            id: "audit-1",
            summary: "Hesablama təsdiqləndi və maliyyə öhdəlikləri yaradıldı.",
          },
          {
            action: "ACTIVATED",
            actor: "Qalib Məmmədov",
            createdAt: "2026-08-09T16:10:00.000Z",
            entityCode: "CG-COM-2026-016",
            entityType: "AGREEMENT",
            id: "audit-2",
            summary: "Komissiya müqaviləsi aktivləşdirildi.",
          },
        ],
    availability: "PREVIEW",
    calculations,
    isPreview: true,
    metrics: {
      activeAgreements: agreements.filter((item) => item.status === "ACTIVE")
        .length,
      activePackageAgreements: 0,
      agentEarnedBase: isAgent ? 450 : 1_230,
      agentLiabilityBase: isAgent ? 450 : 1_230,
      companyEarnedBase: isAgent ? 0 : 6_840,
      paidToAgentsBase: isAgent ? 2_400 : 8_950,
      pendingApproval: isAgent ? 0 : 1,
    },
    options: {
      agents: [
        { id: "agent-baku-study", label: "Baku Study Partners" },
        { id: "agent-global-bridge", label: "Global Bridge" },
        { id: "agent-caspian", label: "Caspian Education" },
      ],
      programs: [
        {
          id: "program-masters",
          label: "Magistratura",
          universityId: "university-bahcesehir",
        },
        {
          id: "program-business",
          label: "Biznes proqramları",
          universityId: "university-uskudar",
        },
      ],
      universities: [
        {
          id: "university-medipol",
          label: "İstanbul Medipol Universiteti",
        },
        {
          id: "university-bahcesehir",
          label: "Bahçeşehir Universiteti",
        },
        { id: "university-uskudar", label: "Üsküdar Universiteti" },
      ],
    },
    payments: calculations.map((item, index) => ({
      amount: item.basisAmount,
      applicationCode: item.applicationCode,
      code: `PAY-26080${8 + index}-C${index + 1}A2`,
      currency: item.currency,
      id: `payment-${index + 1}`,
      paidAt: `2026-08-0${8 + index}`,
      reference: `TRX-${84721 + index}`,
      status: "POSTED",
      studentName: item.studentName,
      universityName: item.universityName,
    })),
  };
}

function getAgentName(agent: {
  companyName: string | null;
  firstName: string;
  lastName: string;
}) {
  return agent.companyName?.trim() || `${agent.firstName} ${agent.lastName}`;
}

function toDateString(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function mapScholarshipAwardSummary(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const award = item as Record<string, unknown>;
    const quantity =
      typeof award.quantity === "number" && award.quantity > 0
        ? award.quantity
        : null;
    if (!quantity) return [];
    if (award.kind === "GLOBAL_MIXED") {
      return [`${quantity} ümumi qarışıq burs`];
    }
    if (typeof award.targetEducationLevel !== "string") return [];
    const programs = Array.isArray(award.programs)
      ? award.programs.flatMap((program) => {
          if (!program || typeof program !== "object" || Array.isArray(program))
            return [];
          const row = program as Record<string, unknown>;
          const name = row.name;
          if (typeof name !== "string") return [];
          const programQuantity =
            typeof row.quantity === "number" && row.quantity > 0
              ? row.quantity
              : null;
          return [
            programQuantity ? `${name}×${programQuantity}` : name,
          ];
        })
      : [];
    const scope =
      award.allPrograms === true || programs.length === 0
        ? "bütün ixtisaslar"
        : programs.join(", ");
    return [
      `${quantity} ${scholarshipLevelLabel(award.targetEducationLevel)} bursu · ${scope}`,
    ];
  });
}

function scholarshipLevelLabel(value: string) {
  const labels: Record<string, string> = {
    ASSOCIATE: "önlisans",
    BACHELOR: "bakalavr",
    FOUNDATION: "hazırlıq",
    LANGUAGE: "dil kursu",
    MASTER: "magistr",
    PHD: "doktorantura",
  };
  return labels[value] ?? value.toLocaleLowerCase("az-AZ");
}

function readAuditCode(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const code = (value as Record<string, unknown>).code;
  return typeof code === "string" ? code : null;
}

function getAuditSummary(action: string, entityType: string) {
  const labels: Record<string, string> = {
    ACTIVATED: "Komissiya müqaviləsi aktivləşdirildi.",
    APPROVED: "Hesablama təsdiqləndi və maliyyə öhdəlikləri yaradıldı.",
    CALCULATED: "Ödəniş üzrə komissiya payları hesablandı.",
    CREATED: `${entityType === "PAYMENT" ? "Ödəniş" : "Müqavilə"} yaradıldı.`,
    PAID: "Agent komissiyası tam ödənildi.",
    UPDATED: "Məlumat yeniləndi.",
    VOIDED: "Qeyd ləğv edildi.",
  };
  return labels[action] ?? "Komissiya qeydində dəyişiklik edildi.";
}
