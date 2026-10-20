import { cache } from "react";

import { APPLICATION_STATUS_LABELS } from "@/features/applications/constants";
import { AGENT_SOCIAL_PLATFORM_LABELS } from "@/features/agents/constants";
import { getAgentsDashboardData } from "@/features/agents/data/dashboard-data";
import type {
  AgentApplicationSummary,
  AgentNotification,
  AgentPortalData,
  AgentPortalProfil,
  AgentProfileServiceRecord,
  AgentStudentSummary,
} from "@/features/agents/types";
import type { ServiceQuoteRequestRecord } from "@/features/services/types";
import type {
  Application,
  Prisma,
  PrismaClient,
  Student,
} from "@/generated/prisma/client";
import { createDocumentAccessUrl } from "@/lib/supabase/storage";

const agentProfileSelect = {
  address: true,
  canRegisterStudents: true,
  commissionBalance: true,
  companyName: true,
  contacts: {
    orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }],
    select: {
      email: true,
      fullName: true,
      id: true,
      isPrimary: true,
      phone: true,
      position: true,
      whatsapp: true,
    },
  },
  conversionRate: true,
  country: true,
  createdAt: true,
  email: true,
  firstName: true,
  id: true,
  instagramUrl: true,
  internalNotes: true,
  lastName: true,
  logoUrl: true,
  ownStudentsOnly: true,
  phone: true,
  portalReporting: true,
  portalStatus: true,
  socialLinks: {
    orderBy: { platform: "asc" },
    select: {
      id: true,
      platform: true,
      url: true,
    },
  },
  tier: true,
  updatedAt: true,
} satisfies Prisma.AgentSelect;

type AgentProfileRecord = Prisma.AgentGetPayload<{
  select: typeof agentProfileSelect;
}>;

const agentPriceProposalSelect = {
  agent: {
    select: {
      companyName: true,
      firstName: true,
      lastName: true,
    },
  },
  agentRespondedAt: true,
  agentResponseNote: true,
  code: true,
  createdAt: true,
  id: true,
  offerValidUntil: true,
  offeredCurrency: true,
  offeredUnitPrice: true,
  order: { select: { code: true } },
  purpose: true,
  quantity: true,
  requestNote: true,
  reviewedAt: true,
  reviewedBy: { select: { email: true, name: true } },
  serviceId: true,
  serviceNameSnapshot: true,
  staffResponseNote: true,
  standardCurrency: true,
  standardUnitPrice: true,
  status: true,
} as const;

export const getAgentPortalData = cache(
  async (agentId: string): Promise<AgentPortalData | null> => {
    if (!agentId.trim()) {
      return null;
    }

    if (!hasUsableDatabaseUrl()) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Agent database configuration is missing.");
      }

      return getFallbackAgentPortalData(agentId);
    }

    try {
      const { prisma } = await import("@/lib/db");
      const [
        agent,
        totalStudents,
        activeApplications,
        submittedApplications,
        missingDocuments,
        students,
        applications,
        notifications,
        unreadNotifications,
        services,
      ] = await Promise.all([
        prisma.agent.findUnique({
          select: agentProfileSelect,
          where: { id: agentId },
        }),
        prisma.student.count({ where: { agentId } }),
        prisma.application.count({
          where: { agentId, status: { not: "ARCHIVED" } },
        }),
        prisma.application.count({ where: { agentId, status: "SUBMITTED" } }),
        prisma.applicationDocument.count({
          where: {
            application: { agentId },
            isRequired: true,
            status: "MISSING",
          },
        }),
        prisma.student.findMany({
          orderBy: [{ updatedAt: "desc" }],
          select: {
            citizenship: true,
            contactEmail: true,
            firstName: true,
            id: true,
            lastName: true,
            loginEmail: true,
            phone: true,
            portalStatus: true,
            stage: true,
            updatedAt: true,
          },
          take: 6,
          where: { agentId },
        }),
        prisma.application.findMany({
          include: {
            documents: {
              select: { id: true },
              where: { isRequired: true, status: "MISSING" },
            },
            period: { select: { name: true } },
            student: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: [{ updatedAt: "desc" }],
          take: 6,
          where: { agentId },
        }),
        prisma.agentNotification.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            actionHref: true,
            createdAt: true,
            id: true,
            message: true,
            readAt: true,
            title: true,
            type: true,
          },
          take: 20,
          where: { agentId },
        }),
        prisma.agentNotification.count({
          where: { agentId, readAt: null },
        }),
        prisma.service.findMany({
          include: {
            prices: {
              orderBy: { validFrom: "desc" },
              where: {
                audience: "AGENT",
                isActive: true,
                validFrom: { lte: new Date() },
                OR: [{ agentId: null }, { agentId }],
                AND: [
                  {
                    OR: [
                      { validUntil: null },
                      { validUntil: { gt: new Date() } },
                    ],
                  },
                ],
              },
            },
            quoteRequests: {
              orderBy: { createdAt: "desc" },
              select: agentPriceProposalSelect,
              take: 50,
              where: { agentId },
            },
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          where: { availableToAgents: true, status: "ACTIVE" },
        }),
      ]);

      if (!agent) {
        return null;
      }

      const latestStatusReasons = await getLatestStatusReasons(
        prisma,
        applications.map((application) => application.id),
      );
      const conversionRate =
        totalStudents > 0
          ? Math.round((submittedApplications / totalStudents) * 100)
          : agent.conversionRate;
      const profilePhotoUrl = agent.logoUrl
        ? ((await createDocumentAccessUrl(agent.logoUrl)) ?? "")
        : "";

      return {
        agent: mapAgentProfil(agent, {
          activeApplications,
          conversionRate,
          profilePhotoUrl,
          studentsCount: totalStudents,
        }),
        applications: applications.map((application) =>
          mapApplicationSummary(
            application,
            latestStatusReasons.get(application.id) ?? "",
          ),
        ),
        dataSource: "database",
        metrics: {
          activeApplications,
          commissionBalance: Number(agent.commissionBalance),
          conversionRate,
          missingDocuments,
          submittedApplications,
          totalStudents,
        },
        notifications: notifications.map(mapNotification),
        services: services.map(mapAgentService),
        students: students.map(mapStudentSummary),
        unreadNotifications,
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Agent portalı məlumatı əlçatan deyil: ${String(error)}`);
      }

      if (process.env.NODE_ENV === "production") {
        throw error;
      }

      return getFallbackAgentPortalData(agentId);
    }
  },
);

async function getFallbackAgentPortalData(
  agentId: string,
): Promise<AgentPortalData | null> {
  const dashboard = await getAgentsDashboardData({});
  const agent = dashboard.rows.find((row) => row.id === agentId);

  if (!agent) {
    return null;
  }

  const profile: AgentPortalProfil = {
    ...agent,
    canRegisterStudents: true,
    contacts: [
      {
        email: agent.email,
        fullName: `${agent.firstName} ${agent.lastName}`,
        id: `${agent.id}-contact`,
        isPrimary: true,
        phone: agent.phone,
        position: "Əsas əlaqə",
        whatsapp: agent.phone,
      },
    ],
    internalNotes: "",
    logoUrl: "",
    ownStudentsOnly: true,
    portalReporting: true,
    socialLinks: agent.instagramUrl
      ? [
          {
            id: `${agent.id}-instagram`,
            platform: "INSTAGRAM",
            platformLabel: "Instagram",
            url: agent.instagramUrl,
          },
        ]
      : [],
  };
  const notifications: AgentNotification[] = [
    {
      actionHref: "/applications",
      createdAt: "10 dəqiqə əvvəl",
      id: `${agent.id}-notification-1`,
      message: "Demo müraciətin statusu yeniləndi.",
      read: false,
      title: "Status yeniləndi",
      type: "APPLICATION_STATUS",
    },
    {
      actionHref: "/students",
      createdAt: "1 saat əvvəl",
      id: `${agent.id}-notification-2`,
      message: "Yeni tələbə profili agent hesabına əlavə edildi.",
      read: false,
      title: "Yeni tələbə yaradıldı",
      type: "STUDENT_CREATED",
    },
  ];

  return {
    agent: profile,
    applications: [
      {
        code: "APP-DEMO-01",
        country: agent.country,
        id: `${agent.id}-app-demo-1`,
        missingRequiredDocuments: 1,
        period: "Fall 2026",
        status: "Göndərildi",
        statusCode: "SUBMITTED",
        statusReason: "",
        studentName: "Demo Student",
        updatedAt: agent.lastActivity,
      },
    ],
    dataSource: "fallback",
    metrics: {
      activeApplications: agent.activeApplications,
      commissionBalance: agent.commissionBalance,
      conversionRate: agent.conversionRate,
      missingDocuments: 1,
      submittedApplications: Math.max(
        0,
        Math.round(agent.activeApplications / 2),
      ),
      totalStudents: agent.studentsCount,
    },
    notifications,
    services: [],
    students: [
      {
        citizenship: agent.country,
        email: "demo.student@example.com",
        fullName: "Demo Student",
        id: `${agent.id}-student-demo-1`,
        phone: agent.phone,
        portalStatus: "Ready",
        stage: "Müraciət",
        updatedAt: agent.lastActivity,
      },
    ],
    unreadNotifications: notifications.filter((item) => !item.read).length,
  };
}

function mapAgentService(service: {
  description: string | null;
  id: string;
  name: string;
  prices: Array<{
    agentId: string | null;
    amount: { toString(): string };
    currency: string;
  }>;
  quoteRequests: Array<Parameters<typeof mapAgentPriceProposal>[0]>;
}): AgentProfileServiceRecord {
  const standardPrice = service.prices.find((price) => !price.agentId);
  const customPrice = service.prices.find((price) => Boolean(price.agentId));
  const currentPrice = customPrice ?? standardPrice;

  return {
    currentPrice: currentPrice
      ? { amount: Number(currentPrice.amount), currency: currentPrice.currency }
      : null,
    description: service.description ?? "",
    id: service.id,
    isCustomPrice: Boolean(customPrice),
    name: service.name,
    proposals: service.quoteRequests.map(mapAgentPriceProposal),
    standardPrice: standardPrice
      ? {
          amount: Number(standardPrice.amount),
          currency: standardPrice.currency,
        }
      : null,
  };
}

function mapAgentPriceProposal(quoteRequest: {
  agent: { companyName: string | null; firstName: string; lastName: string };
  agentRespondedAt: Date | null;
  agentResponseNote: string | null;
  code: string;
  createdAt: Date;
  id: string;
  offerValidUntil: Date | null;
  offeredCurrency: string | null;
  offeredUnitPrice: { toString(): string } | null;
  order: { code: string } | null;
  purpose: "ORDER" | "PRICE_OVERRIDE";
  quantity: number;
  requestNote: string | null;
  reviewedAt: Date | null;
  reviewedBy: { email: string; name: string | null } | null;
  serviceId: string;
  serviceNameSnapshot: string;
  staffResponseNote: string | null;
  standardCurrency: string | null;
  standardUnitPrice: { toString(): string } | null;
  status:
    | "PENDING"
    | "OFFERED"
    | "REJECTED"
    | "ACCEPTED"
    | "DECLINED"
    | "EXPIRED";
}): ServiceQuoteRequestRecord {
  const offeredUnitPrice = quoteRequest.offeredUnitPrice
    ? Number(quoteRequest.offeredUnitPrice)
    : null;
  const isExpired =
    quoteRequest.status === "EXPIRED" ||
    (quoteRequest.status === "OFFERED" &&
      Boolean(
        quoteRequest.offerValidUntil &&
        quoteRequest.offerValidUntil.getTime() <= Date.now(),
      ));

  return {
    agentName: getAgentDisplayName(quoteRequest.agent),
    agentRespondedAt: quoteRequest.agentRespondedAt?.toISOString() ?? null,
    agentResponseNote: quoteRequest.agentResponseNote ?? "",
    code: quoteRequest.code,
    createdAt: quoteRequest.createdAt.toISOString(),
    currency: quoteRequest.offeredCurrency,
    id: quoteRequest.id,
    isExpired,
    offerValidUntil: quoteRequest.offerValidUntil?.toISOString() ?? null,
    offeredUnitPrice,
    orderCode: quoteRequest.order?.code ?? null,
    purpose: quoteRequest.purpose,
    quantity: quoteRequest.quantity,
    requestNote: quoteRequest.requestNote ?? "",
    reviewedAt: quoteRequest.reviewedAt?.toISOString() ?? null,
    reviewerName:
      quoteRequest.reviewedBy?.name?.trim() ||
      quoteRequest.reviewedBy?.email ||
      "",
    serviceId: quoteRequest.serviceId,
    serviceName: quoteRequest.serviceNameSnapshot,
    staffResponseNote: quoteRequest.staffResponseNote ?? "",
    standardCurrency: quoteRequest.standardCurrency,
    standardUnitPrice: quoteRequest.standardUnitPrice
      ? Number(quoteRequest.standardUnitPrice)
      : null,
    status: quoteRequest.status,
    totalAmount:
      offeredUnitPrice === null
        ? null
        : offeredUnitPrice * quoteRequest.quantity,
  };
}

function getAgentDisplayName(agent: {
  companyName: string | null;
  firstName: string;
  lastName: string;
}) {
  return (
    agent.companyName?.trim() || `${agent.firstName} ${agent.lastName}`.trim()
  );
}

function mapAgentProfil(
  agent: AgentProfileRecord,
  counts: {
    activeApplications: number;
    conversionRate: number;
    profilePhotoUrl: string;
    studentsCount: number;
  },
): AgentPortalProfil {
  return {
    activeApplications: counts.activeApplications,
    address: agent.address ?? "Təyin edilməyib",
    canRegisterStudents: agent.canRegisterStudents,
    commissionBalance: Number(agent.commissionBalance),
    companyName: agent.companyName ?? "Müstəqil agent",
    contacts: agent.contacts.map((contact) => ({
      email: contact.email ?? "",
      fullName: contact.fullName,
      id: contact.id,
      isPrimary: contact.isPrimary,
      phone: contact.phone ?? "",
      position: contact.position ?? "",
      whatsapp: contact.whatsapp ?? "",
    })),
    conversionRate: counts.conversionRate,
    country: agent.country ?? "Təyin edilməyib",
    email: agent.email,
    firstName: agent.firstName,
    id: agent.id,
    instagramUrl: agent.instagramUrl ?? "",
    internalNotes: agent.internalNotes ?? "",
    joinedAt: formatDate(agent.createdAt),
    lastActivity: formatDate(agent.updatedAt),
    lastName: agent.lastName,
    logoUrl: counts.profilePhotoUrl,
    ownStudentsOnly: agent.ownStudentsOnly,
    phone: agent.phone ?? "Təyin edilməyib",
    portalReporting: agent.portalReporting,
    portalStatus: formatPortalStatus(agent.portalStatus),
    profilePhotoUrl: counts.profilePhotoUrl,
    socialLinks: agent.socialLinks.map((socialLink) => ({
      id: socialLink.id,
      platform: socialLink.platform,
      platformLabel:
        AGENT_SOCIAL_PLATFORM_LABELS[socialLink.platform] ??
        socialLink.platform,
      url: socialLink.url,
    })),
    studentsCount: counts.studentsCount,
    tier: formatTier(agent.tier),
  };
}

function mapStudentSummary(
  student: Pick<
    Student,
    | "citizenship"
    | "contactEmail"
    | "firstName"
    | "id"
    | "lastName"
    | "loginEmail"
    | "phone"
    | "portalStatus"
    | "stage"
    | "updatedAt"
  >,
): AgentStudentSummary {
  return {
    citizenship: student.citizenship ?? "Təyin edilməyib",
    email: student.contactEmail ?? student.loginEmail ?? "Təyin edilməyib",
    fullName: `${student.firstName} ${student.lastName}`.trim(),
    id: student.id,
    phone: student.phone ?? "Təyin edilməyib",
    portalStatus: student.loginEmail
      ? student.portalStatus === "READY"
        ? "Ready"
        : "Pending"
      : "Needs email",
    stage: student.stage,
    updatedAt: formatDate(student.updatedAt),
  };
}

function mapApplicationSummary(
  application: Application & {
    documents: Array<{ id: string }>;
    period: { name: string };
    student: { firstName: string; lastName: string };
  },
  statusReason: string,
): AgentApplicationSummary {
  return {
    code: application.code,
    country: application.country,
    id: application.id,
    missingRequiredDocuments: application.documents.length,
    period: application.period.name,
    status:
      APPLICATION_STATUS_LABELS[
        application.status as keyof typeof APPLICATION_STATUS_LABELS
      ] ?? formatEnumLabel(application.status),
    statusCode: application.status,
    statusReason,
    studentName:
      `${application.student.firstName} ${application.student.lastName}`.trim(),
    updatedAt: formatDate(application.updatedAt),
  };
}

function mapNotification(notification: {
  actionHref: string | null;
  createdAt: Date;
  id: string;
  message: string;
  readAt: Date | null;
  title: string;
  type: AgentNotification["type"];
}): AgentNotification {
  return {
    actionHref: notification.actionHref ?? "/dashboard",
    createdAt: formatRelativeDate(notification.createdAt),
    id: notification.id,
    message: notification.message,
    read: Boolean(notification.readAt),
    title: notification.title,
    type: notification.type,
  };
}

async function getLatestStatusReasons(
  prisma: PrismaClient,
  applicationIds: string[],
) {
  const reasons = new Map<string, string>();
  const seenApplications = new Set<string>();

  if (applicationIds.length === 0) {
    return reasons;
  }

  const activities = await prisma.activityLog.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      entityId: true,
      newValue: true,
    },
    take: 30,
    where: {
      action: "STATUS_CHANGED",
      entityId: { in: applicationIds },
      entityType: "APPLICATION",
    },
  });

  for (const activity of activities) {
    if (seenApplications.has(activity.entityId)) {
      continue;
    }

    seenApplications.add(activity.entityId);
    const reason = readJsonString(activity.newValue, "reason");

    if (reason) {
      reasons.set(activity.entityId, reason);
    }
  }

  return reasons;
}

function readJsonString(value: Prisma.JsonValue | null, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "";
  }

  const field = (value as Record<string, unknown>)[key];
  return typeof field === "string" ? field : "";
}

function formatPortalStatus(value: string): AgentPortalProfil["portalStatus"] {
  if (value === "READY") return "Ready";
  if (value === "SUSPENDED") return "Suspended";
  return "Pending";
}

function formatTier(value: string): AgentPortalProfil["tier"] {
  if (value === "GROWTH") return "Growth";
  if (value === "PREMIER") return "Premier";
  return "Starter";
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("az", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatRelativeDate(value: Date) {
  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - value.getTime()) / 60_000),
  );

  if (diffMinutes < 1) return "İndi";
  if (diffMinutes < 60) return `${diffMinutes} dəqiqə əvvəl`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} saat əvvəl`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} gün əvvəl`;

  return formatDate(value);
}

function hasUsableDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  return Boolean(databaseUrl && !databaseUrl.includes("CHANGE_ME_DB_PASSWORD"));
}
