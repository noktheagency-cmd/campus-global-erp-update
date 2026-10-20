import "server-only";

import type {
  CommissionPackageRecord,
  CommissionPackageWorkspaceData,
} from "@/features/commissions/package-types";
import { resolvePackageEducationLevel } from "@/features/commissions/package-engine";
import { can } from "@/lib/auth/permissions";
import { getSessionAgentId, type AuthSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function getCommissionPackageWorkspaceData(
  session: AuthSession,
  options: { preview?: boolean } = {},
): Promise<CommissionPackageWorkspaceData> {
  const activeAgentId = getSessionAgentId(session);
  const permissions = {
    activeAgentId,
    canManage: can(session.role, "commissions:manage"),
    portalType: activeAgentId ? ("agent" as const) : ("staff" as const),
  };

  if (options.preview && process.env.NODE_ENV !== "production") {
    return createDemoPackageData(permissions);
  }

  try {
    const [
      packages,
      agreements,
      terms,
      universities,
      programs,
      scholarshipTotals,
    ] = await Promise.all([
      prisma.commissionPackage.findMany({
        include: {
          _count: { select: { agreements: true } },
          mixedScholarship: true,
          rules: { orderBy: { educationLevel: "asc" } },
          scholarships: {
            include: {
              awards: {
                include: {
                  programs: {
                    include: {
                      program: {
                        select: {
                          educationLevel: { select: { name: true } },
                          id: true,
                          name: true,
                          university: { select: { id: true, name: true } },
                        },
                      },
                    },
                    orderBy: { program: { name: "asc" } },
                  },
                },
                orderBy: { educationLevel: "asc" },
              },
            },
            orderBy: { educationLevel: "asc" },
          },
          universities: {
            include: { university: { select: { id: true, name: true } } },
            orderBy: { university: { name: "asc" } },
          },
        },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: 100,
        where: activeAgentId ? { status: "ACTIVE" } : undefined,
      }),
      prisma.commissionPackageAgreement.findMany({
        include: {
          agent: {
            select: { companyName: true, firstName: true, lastName: true },
          },
          package: { select: { name: true } },
          termVersion: { select: { version: true } },
          universities: {
            include: { university: { select: { id: true, name: true } } },
            orderBy: { university: { name: "asc" } },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 200,
        where: activeAgentId ? { agentId: activeAgentId } : undefined,
      }),
      prisma.commissionTermVersion.findMany({
        orderBy: { createdAt: "desc" },
        take: activeAgentId ? 1 : 50,
        where: activeAgentId ? { isActive: true } : undefined,
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
            orderBy: [
              { educationLevel: { sortOrder: "asc" } },
              { name: "asc" },
            ],
            select: {
              educationLevel: { select: { name: true } },
              id: true,
              name: true,
              university: { select: { id: true, name: true } },
            },
            take: 2_000,
            where: { status: "ACTIVE", university: { status: "ACTIVE" } },
          }),
      prisma.commissionCalculation.groupBy({
        _sum: { scholarshipCreditsEarned: true },
        by: ["packageAgreementId"],
        where: {
          packageAgreementId: { not: null },
          ...(activeAgentId ? { agentId: activeAgentId } : {}),
        },
      }),
    ]);

    const scholarshipsByAgreement = new Map(
      scholarshipTotals.flatMap((item) =>
        item.packageAgreementId
          ? [
              [
                item.packageAgreementId,
                item._sum.scholarshipCreditsEarned ?? 0,
              ] as const,
            ]
          : [],
      ),
    );

    const mappedPackages: CommissionPackageRecord[] = packages.map((item) => ({
      academicYear: item.academicYear,
      agreementCount: item._count.agreements,
      createdAt: item.createdAt.toISOString(),
      description: item.description,
      id: item.id,
      mixedScholarship: item.mixedScholarship
        ? {
            additionalInterval: item.mixedScholarship.additionalInterval,
            description: item.mixedScholarship.description,
            firstThreshold: item.mixedScholarship.firstThreshold,
            id: item.mixedScholarship.id,
          }
        : null,
      name: item.name,
      rules: item.rules.map((rule) => ({
        commissionType: rule.commissionType,
        currency: rule.currency,
        educationLevel: rule.educationLevel,
        fixedAmount:
          rule.fixedAmount === null ? null : Number(rule.fixedAmount),
        id: rule.id,
        isActive: rule.isActive,
        rateTier1: rule.rateTier1 === null ? null : Number(rule.rateTier1),
        rateTier2: rule.rateTier2 === null ? null : Number(rule.rateTier2),
        tierThreshold: rule.tierThreshold,
      })),
      scholarships: item.scholarships.map((scholarship) => ({
        additionalInterval: scholarship.additionalInterval,
        awards: scholarship.awards.map((award) => ({
          allPrograms: award.allPrograms,
          educationLevel: award.educationLevel,
          id: award.id,
          programs: award.programs.flatMap(({ program }) => {
            const educationLevel = resolvePackageEducationLevel(
              program.educationLevel.name,
            );
            return educationLevel
              ? [
                  {
                    educationLevel,
                    id: program.id,
                    label: program.name,
                    universityId: program.university.id,
                    universityLabel: program.university.name,
                  },
                ]
              : [];
          }),
          quantity: award.quantity,
        })),
        description: scholarship.description,
        educationLevel: scholarship.educationLevel,
        id: scholarship.id,
        scholarshipCount: scholarship.scholarshipCount,
        studentThreshold: scholarship.studentThreshold,
        triggerType: scholarship.triggerType,
      })),
      status: item.status,
      universities: item.universities.map((link) => link.university),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return {
      ...permissions,
      agreements: agreements.map((agreement) => ({
        academicYear: agreement.academicYear,
        agentId: agreement.agentId,
        agentName: getAgentName(agreement.agent),
        code: agreement.code,
        id: agreement.id,
        packageId: agreement.packageId,
        packageName: agreement.package.name,
        rejectionReason: agreement.rejectionReason,
        earnedScholarships: scholarshipsByAgreement.get(agreement.id) ?? 0,
        status: agreement.status,
        submittedAt: agreement.submittedAt.toISOString(),
        termVersion: agreement.termVersion?.version ?? null,
        universities: agreement.universities.map((link) => link.university),
      })),
      availability: "READY",
      isPreview: false,
      metrics: {
        activePackages: mappedPackages.filter(
          (item) => item.status === "ACTIVE",
        ).length,
        agreements: agreements.length,
        packages: mappedPackages.length,
        pendingAgreements: agreements.filter(
          (item) => item.status === "PENDING",
        ).length,
      },
      options: {
        academicYears: buildAcademicYears(mappedPackages),
        programs: programs.flatMap((program) => {
          const educationLevel = resolvePackageEducationLevel(
            program.educationLevel.name,
          );
          return educationLevel
            ? [
                {
                  educationLevel,
                  id: program.id,
                  label: program.name,
                  universityId: program.university.id,
                  universityLabel: program.university.name,
                },
              ]
            : [];
        }),
        universities: universities.map((university) => ({
          id: university.id,
          label: university.name,
        })),
      },
      packages: mappedPackages,
      terms: terms.map((term) => ({
        content: term.content,
        createdAt: term.createdAt.toISOString(),
        id: term.id,
        isActive: term.isActive,
        title: term.title,
        version: term.version,
      })),
    };
  } catch (error) {
    const message = `Commission package data unavailable: ${error instanceof Error ? error.message : String(error)}`;
    if (process.env.NODE_ENV === "production") console.error(message);
    else console.warn(message);
    return process.env.NODE_ENV === "production"
      ? createUnavailablePackageData(permissions)
      : createDemoPackageData(permissions);
  }
}

function createUnavailablePackageData(
  permissions: Pick<
    CommissionPackageWorkspaceData,
    "activeAgentId" | "canManage" | "portalType"
  >,
): CommissionPackageWorkspaceData {
  return {
    ...permissions,
    agreements: [],
    availability: "UNAVAILABLE",
    isPreview: false,
    metrics: {
      activePackages: 0,
      agreements: 0,
      packages: 0,
      pendingAgreements: 0,
    },
    options: {
      academicYears: buildAcademicYears([]),
      programs: [],
      universities: [],
    },
    packages: [],
    terms: [],
  };
}

function createDemoPackageData(
  permissions: Pick<
    CommissionPackageWorkspaceData,
    "activeAgentId" | "canManage" | "portalType"
  >,
): CommissionPackageWorkspaceData {
  const packages: CommissionPackageRecord[] = [
    {
      academicYear: "2026-2027",
      agreementCount: 8,
      createdAt: "2026-08-10T08:00:00.000Z",
      description: "Ümumi qəbul şərtləri üçün standart komissiya paketi.",
      id: "package-turkey-standard",
      mixedScholarship: null,
      name: "Türkiyə 2026 — Standart",
      rules: [
        demoRule("rule-associate", "ASSOCIATE", "FIXED", 300),
        demoRule(
          "rule-bachelor",
          "BACHELOR",
          "PERCENTAGE_CASH",
          null,
          20,
          25,
          20,
        ),
        demoRule("rule-master", "MASTER", "FIXED", 400),
        demoRule("rule-phd", "PHD", "PERCENTAGE_DELAYED", null, 15, 20, 10),
      ],
      scholarships: [
        {
          awards: [
            {
              allPrograms: true,
              educationLevel: "BACHELOR",
              id: "award-bachelor",
              programs: [],
              quantity: 1,
            },
            {
              allPrograms: false,
              educationLevel: "MASTER",
              id: "award-master-mixed",
              programs: [
                {
                  educationLevel: "MASTER",
                  id: "program-data-analytics",
                  label: "Data analitikası",
                  universityId: "university-beykent",
                  universityLabel: "İstanbul Beykent",
                },
              ],
              quantity: 2,
            },
          ],
          description: null,
          educationLevel: "BACHELOR",
          id: "scholarship-bachelor",
          additionalInterval: 15,
          scholarshipCount: 1,
          studentThreshold: 20,
          triggerType: "FIRST_THEN_EVERY",
        },
        {
          awards: [
            {
              allPrograms: true,
              educationLevel: "MASTER",
              id: "award-master",
              programs: [],
              quantity: 1,
            },
          ],
          description: null,
          educationLevel: "MASTER",
          id: "scholarship-master",
          additionalInterval: null,
          scholarshipCount: 2,
          studentThreshold: 8,
          triggerType: "FIXED_INTERVAL",
        },
        {
          awards: [
            {
              allPrograms: true,
              educationLevel: "PHD",
              id: "award-phd",
              programs: [],
              quantity: 1,
            },
          ],
          description: null,
          educationLevel: "PHD",
          id: "scholarship-phd",
          additionalInterval: null,
          scholarshipCount: 1,
          studentThreshold: 5,
          triggerType: "FIXED_INTERVAL",
        },
      ],
      status: "ACTIVE",
      universities: [
        { id: "university-beykent", name: "İstanbul Beykent" },
        { id: "university-medipol", name: "İstanbul Medipol" },
        { id: "university-bahcesehir", name: "Bahçeşehir" },
        { id: "university-uskudar", name: "Üsküdar" },
        { id: "university-aydin", name: "İstanbul Aydın" },
        { id: "university-gelisim", name: "İstanbul Gelişim" },
        { id: "university-altinbas", name: "Altınbaş" },
        { id: "university-okan", name: "İstanbul Okan" },
        { id: "university-istinye", name: "İstinye" },
        { id: "university-bilgi", name: "İstanbul Bilgi" },
        { id: "university-topkapi", name: "İstanbul Topkapı" },
        { id: "university-ticaret", name: "İstanbul Ticaret" },
      ],
      updatedAt: "2026-08-21T10:00:00.000Z",
    },
    {
      academicYear: null,
      agreementCount: 3,
      createdAt: "2026-08-11T08:00:00.000Z",
      description:
        "İstanbul Beykent Universiteti üçün köçürmə zamanı şərtləri.",
      id: "package-beykent-transfer",
      mixedScholarship: null,
      name: "Beykent — Köçürmə zamanı",
      rules: [
        demoRule("rule-beykent-associate", "ASSOCIATE", "FIXED", 250),
        demoRule(
          "rule-beykent-bachelor",
          "BACHELOR",
          "PERCENTAGE_CASH",
          null,
          20,
          25,
          20,
        ),
        demoRule("rule-beykent-master", "MASTER", "FIXED", 350),
        demoRule("rule-beykent-phd", "PHD", "FIXED", 400),
      ],
      scholarships: [],
      status: "ACTIVE",
      universities: [{ id: "university-beykent", name: "İstanbul Beykent" }],
      updatedAt: "2026-08-20T10:00:00.000Z",
    },
  ];

  const agreements: CommissionPackageWorkspaceData["agreements"] = [
    {
      academicYear: "2026-2027",
      agentId: "agent-rasad",
      agentName: "Rəşad Əliyev",
      code: "CG-PKG-260821-A14F",
      id: "package-agreement-1",
      packageId: packages[0].id,
      packageName: packages[0].name,
      rejectionReason: null,
      earnedScholarships: 0,
      status: "PENDING",
      submittedAt: "2026-08-21T09:30:00.000Z",
      termVersion: "1.0",
      universities: packages[0].universities.slice(0, 6),
    },
    {
      academicYear: "2026-2027",
      agentId: "agent-leyla",
      agentName: "Leyla Məmmədova",
      code: "CG-PKG-260820-C82D",
      id: "package-agreement-2",
      packageId: packages[1].id,
      packageName: packages[1].name,
      rejectionReason: null,
      earnedScholarships: 2,
      status: "PENDING",
      submittedAt: "2026-08-20T14:10:00.000Z",
      termVersion: "1.0",
      universities: packages[1].universities,
    },
  ];

  const visibleAgreements = permissions.activeAgentId
    ? agreements.filter((item) => item.agentId === permissions.activeAgentId)
    : agreements;

  return {
    ...permissions,
    agreements: visibleAgreements,
    availability: "PREVIEW",
    isPreview: true,
    metrics: {
      activePackages: 4,
      agreements: 18,
      packages: 6,
      pendingAgreements: 2,
    },
    options: {
      academicYears: ["2025-2026", "2026-2027", "2027-2028"],
      programs: [
        {
          educationLevel: "BACHELOR",
          id: "program-computer-science",
          label: "Kompüter elmləri",
          universityId: "university-beykent",
          universityLabel: "İstanbul Beykent",
        },
        {
          educationLevel: "BACHELOR",
          id: "program-business",
          label: "Biznesin idarə edilməsi",
          universityId: "university-medipol",
          universityLabel: "İstanbul Medipol",
        },
        {
          educationLevel: "MASTER",
          id: "program-data-analytics",
          label: "Data analitikası",
          universityId: "university-beykent",
          universityLabel: "İstanbul Beykent",
        },
        {
          educationLevel: "MASTER",
          id: "program-finance",
          label: "Maliyyə",
          universityId: "university-medipol",
          universityLabel: "İstanbul Medipol",
        },
      ],
      universities: packages[0].universities.map((university) => ({
        id: university.id,
        label: university.name,
      })),
    },
    packages,
    terms: [
      {
        content:
          "1. TƏRƏFLƏR\nBu müqavilə Campus Global və Agent arasında bağlanır.\n\n2. MÜQAVİLƏNİN PREDMETİ\nAgent, paketə bağlı universitetlərə tələbə cəlb etmə xidmətləri göstərir.\n\n3. KOMİSSİYA ÖDƏNİŞLƏRİ\nKomissiya paketdə göstərilən təhsil səviyyəsi və tələbə sayına uyğun hesablanır.\n\n4. TƏQAÜD ŞƏRTLƏRİ\nTəqaüd sayı paketdə göstərilən nisbətə uyğun hesablanır.\n\n5. MÜDDƏT\nMüqavilə seçilmiş akademik il üçün etibarlıdır.",
        createdAt: "2026-08-18T08:00:00.000Z",
        id: "term-version-1",
        isActive: true,
        title: "Agent müqaviləsinin ümumi şərtləri",
        version: "1.0",
      },
    ],
  };
}

function demoRule(
  id: string,
  educationLevel: CommissionPackageRecord["rules"][number]["educationLevel"],
  commissionType: CommissionPackageRecord["rules"][number]["commissionType"],
  fixedAmount: number | null,
  rateTier1: number | null = null,
  rateTier2: number | null = null,
  tierThreshold = 20,
): CommissionPackageRecord["rules"][number] {
  return {
    commissionType,
    currency: "USD",
    educationLevel,
    fixedAmount,
    id,
    isActive: true,
    rateTier1,
    rateTier2,
    tierThreshold,
  };
}

function buildAcademicYears(packages: CommissionPackageRecord[]) {
  const today = new Date();
  const startYear =
    today.getUTCMonth() >= 5
      ? today.getUTCFullYear()
      : today.getUTCFullYear() - 1;
  return Array.from(
    new Set([
      `${startYear - 1}-${startYear}`,
      `${startYear}-${startYear + 1}`,
      `${startYear + 1}-${startYear + 2}`,
      ...packages.flatMap((item) =>
        item.academicYear ? [item.academicYear] : [],
      ),
    ]),
  ).sort();
}

function getAgentName(agent: {
  companyName: string | null;
  firstName: string;
  lastName: string;
}) {
  return agent.companyName?.trim() || `${agent.firstName} ${agent.lastName}`;
}
