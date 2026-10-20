import { cache } from "react";

import type {
  AgentRecord,
  AgentsDashboardData,
  AgentsListFilters,
  AgentsListSort,
  AgentsSearchParams,
} from "@/features/agents/types";
import type { Prisma } from "@/generated/prisma/client";
import { createDocumentAccessUrls } from "@/lib/supabase/storage";

const DEFAULT_PAGE_SIZE = 8;
type AgentListRecord = Prisma.AgentGetPayload<{
  select: {
    _count: {
      select: {
        applications: true;
        students: true;
      };
    };
    address: true;
    commissionBalance: true;
    companyName: true;
    conversionRate: true;
    country: true;
    createdAt: true;
    email: true;
    firstName: true;
    id: true;
    instagramUrl: true;
    lastName: true;
    phone: true;
    logoUrl: true;
    portalStatus: true;
    tier: true;
    updatedAt: true;
  };
}>;

const fallbackAgents: AgentRecord[] = [
  {
    id: "agt-1006",
    firstName: "Elnur",
    lastName: "Camalov",
    companyName: "Baku Study Partners",
    email: "elnur.camalov@agents.campus.global",
    phone: "+994 50 214 77 20",
    country: "Azerbaijan",
    address: "Baku, Nizami 42",
    instagramUrl: "https://instagram.com/bakustudypartners",
    profilePhotoUrl: "",
    portalStatus: "Ready",
    tier: "Premier",
    studentsCount: 42,
    activeApplications: 18,
    conversionRate: 68,
    commissionBalance: 12400,
    lastActivity: "Jun 12, 2026",
    joinedAt: "Feb 6, 2025",
  },
  {
    id: "agt-1005",
    firstName: "Leyla",
    lastName: "Karimova",
    companyName: "Caspian Education Hub",
    email: "leyla.karimova@agents.campus.global",
    phone: "+994 55 810 12 44",
    country: "Azerbaijan",
    address: "Baku, Khatai",
    instagramUrl: "https://instagram.com/caspianedu",
    profilePhotoUrl: "",
    portalStatus: "Ready",
    tier: "Growth",
    studentsCount: 31,
    activeApplications: 13,
    conversionRate: 61,
    commissionBalance: 8350,
    lastActivity: "Jun 11, 2026",
    joinedAt: "Apr 19, 2025",
  },
  {
    id: "agt-1004",
    firstName: "Mina",
    lastName: "Abbasova",
    companyName: "Global Bridge Admissions",
    email: "mina.abbasova@agents.campus.global",
    phone: "+994 70 310 90 01",
    country: "Azerbaijan",
    address: "Sumgait, 9th district",
    instagramUrl: "https://instagram.com/globalbridgeadmissions",
    profilePhotoUrl: "",
    portalStatus: "Pending",
    tier: "Growth",
    studentsCount: 24,
    activeApplications: 9,
    conversionRate: 54,
    commissionBalance: 5900,
    lastActivity: "Jun 10, 2026",
    joinedAt: "Jul 22, 2025",
  },
  {
    id: "agt-1003",
    firstName: "Orhan",
    lastName: "Yilmaz",
    companyName: "Istanbul Route Education",
    email: "orhan.yilmaz@agents.campus.global",
    phone: "+90 532 600 41 18",
    country: "Turkey",
    address: "Istanbul, Kadikoy",
    instagramUrl: "https://instagram.com/istanbulrouteedu",
    profilePhotoUrl: "",
    portalStatus: "Ready",
    tier: "Premier",
    studentsCount: 39,
    activeApplications: 15,
    conversionRate: 64,
    commissionBalance: 11250,
    lastActivity: "Jun 9, 2026",
    joinedAt: "Oct 3, 2024",
  },
  {
    id: "agt-1002",
    firstName: "Sofia",
    lastName: "Ivanova",
    companyName: "North Path Consulting",
    email: "sofia.ivanova@agents.campus.global",
    phone: "+7 916 204 44 32",
    country: "Russia",
    address: "Moscow, Presnensky",
    instagramUrl: "https://instagram.com/northpathedu",
    profilePhotoUrl: "",
    portalStatus: "Suspended",
    tier: "Starter",
    studentsCount: 12,
    activeApplications: 3,
    conversionRate: 38,
    commissionBalance: 2100,
    lastActivity: "Jun 4, 2026",
    joinedAt: "Jan 14, 2026",
  },
  {
    id: "agt-1001",
    firstName: "Luka",
    lastName: "Kapanadze",
    companyName: "Tbilisi Study Desk",
    email: "luka.kapanadze@agents.campus.global",
    phone: "+995 555 49 18 21",
    country: "Georgia",
    address: "Tbilisi, Vake",
    instagramUrl: "https://instagram.com/tbilisistudydesk",
    profilePhotoUrl: "",
    portalStatus: "Pending",
    tier: "Starter",
    studentsCount: 8,
    activeApplications: 2,
    conversionRate: 42,
    commissionBalance: 1450,
    lastActivity: "Jun 2, 2026",
    joinedAt: "Mar 27, 2026",
  },
];

export const getAgentsDashboardData = cache(
  async (
    searchParams: AgentsSearchParams = {},
  ): Promise<AgentsDashboardData> => {
    const filters = parseListFilters(searchParams);
    if (!hasUsableDatabaseUrl()) {
      return buildFallbackDashboardData(filters);
    }

    try {
      const { prisma } = await import("@/lib/db");
      const where = buildAgentWhere(filters);
      const orderBy = getAgentOrder(filters.sort);
      const skip = (filters.page - 1) * filters.pageSize;
      const [
        agents,
        totalFilteredAgents,
        totalAgents,
        activeAgents,
        portalReady,
        registeredStudents,
        commissionTotals,
        countryOptions,
      ] = await Promise.all([
        prisma.agent.findMany({
          select: {
            _count: {
              select: {
                applications: {
                  where: { status: { not: "ARCHIVED" } },
                },
                students: true,
              },
            },
            address: true,
            commissionBalance: true,
            companyName: true,
            conversionRate: true,
            country: true,
            createdAt: true,
            email: true,
            firstName: true,
            id: true,
            instagramUrl: true,
            lastName: true,
            phone: true,
            logoUrl: true,
            portalStatus: true,
            tier: true,
            updatedAt: true,
          },
          where,
          orderBy,
          skip,
          take: filters.pageSize,
        }),
        prisma.agent.count({ where }),
        prisma.agent.count(),
        prisma.agent.count({
          where: { portalStatus: { not: "SUSPENDED" } },
        }),
        prisma.agent.count({
          where: { portalStatus: "READY" },
        }),
        prisma.student.count({
          where: { agentId: { not: null } },
        }),
        prisma.agent.aggregate({
          _sum: {
            commissionBalance: true,
          },
        }),
        prisma.agent.findMany({
          distinct: ["country"],
          orderBy: { country: "asc" },
          select: { country: true },
          where: { country: { not: null } },
        }),
      ]);
      const totalPages = Math.max(
        1,
        Math.ceil(totalFilteredAgents / filters.pageSize),
      );
      const safePage = Math.min(filters.page, totalPages);
      const resultStart =
        totalFilteredAgents > 0
          ? (safePage - 1) * filters.pageSize + 1
          : 0;
      const resultEnd =
        totalFilteredAgents > 0
          ? Math.min(safePage * filters.pageSize, totalFilteredAgents)
          : 0;
      const profilePhotoUrls = await createDocumentAccessUrls(
        agents
          .map((agent) => agent.logoUrl)
          .filter((value): value is string => Boolean(value)),
      );

      return {
        metrics: {
          totalAgents,
          activeAgents,
          registeredStudents,
          portalReady,
          commissionBalance: Number(commissionTotals._sum.commissionBalance ?? 0),
        },
        rows: agents.map((agent) =>
          mapAgentRecord(
            agent,
            agent.logoUrl
              ? (profilePhotoUrls.get(agent.logoUrl) ?? "")
              : "",
          ),
        ),
        filters: { ...filters, page: safePage },
        pagination: {
          totalItems: totalFilteredAgents,
          totalPages,
          resultStart,
          resultEnd,
        },
        filterOptions: {
          countries: countryOptions
            .map((option) => option.country)
            .filter((country): country is string => Boolean(country)),
          portalStatuses: ["Ready", "Pending", "Suspended"],
          tiers: ["Starter", "Growth", "Premier"],
        },
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `Falling back to local agent data: ${getErrorMessage(error)}`,
        );
      }

      if (process.env.NODE_ENV === "production") {
        throw error;
      }

      return buildFallbackDashboardData(filters);
    }
  },
);

function buildFallbackDashboardData(
  filters: AgentsListFilters,
): AgentsDashboardData {
  const filteredRows = filterRows(fallbackAgents, filters);
  const sortedRows = sortRows(filteredRows, filters.sort);
  const totalItems = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const safePage = Math.min(filters.page, totalPages);
  const startIndex = (safePage - 1) * filters.pageSize;
  const rows = sortedRows.slice(startIndex, startIndex + filters.pageSize);

  return {
    metrics: {
      totalAgents: fallbackAgents.length,
      activeAgents: fallbackAgents.filter(
        (agent) => agent.portalStatus !== "Suspended",
      ).length,
      registeredStudents: fallbackAgents.reduce(
        (total, agent) => total + agent.studentsCount,
        0,
      ),
      portalReady: fallbackAgents.filter(
        (agent) => agent.portalStatus === "Ready",
      ).length,
      commissionBalance: fallbackAgents.reduce(
        (total, agent) => total + agent.commissionBalance,
        0,
      ),
    },
    rows,
    filters: { ...filters, page: safePage },
    pagination: {
      totalItems,
      totalPages,
      resultStart: totalItems > 0 ? startIndex + 1 : 0,
      resultEnd:
        totalItems > 0
          ? Math.min(startIndex + filters.pageSize, totalItems)
          : 0,
    },
    filterOptions: {
      countries: unique(fallbackAgents.map((agent) => agent.country)),
      portalStatuses: ["Ready", "Pending", "Suspended"],
      tiers: ["Starter", "Growth", "Premier"],
    },
  };
}

function buildAgentWhere(
  filters: AgentsListFilters,
): Prisma.AgentWhereInput {
  const and: Prisma.AgentWhereInput[] = [];

  if (filters.country !== "all") {
    and.push({ country: filters.country });
  }

  if (filters.portalStatus !== "all") {
    and.push({ portalStatus: toDbPortalStatus(filters.portalStatus) });
  }

  if (filters.tier !== "all") {
    and.push({ tier: toDbTier(filters.tier) });
  }

  if (filters.query) {
    and.push({
      OR: [
        { id: { contains: filters.query, mode: "insensitive" } },
        { firstName: { contains: filters.query, mode: "insensitive" } },
        { lastName: { contains: filters.query, mode: "insensitive" } },
        { companyName: { contains: filters.query, mode: "insensitive" } },
        { email: { contains: filters.query, mode: "insensitive" } },
        { phone: { contains: filters.query, mode: "insensitive" } },
        { country: { contains: filters.query, mode: "insensitive" } },
        { address: { contains: filters.query, mode: "insensitive" } },
        { instagramUrl: { contains: filters.query, mode: "insensitive" } },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

function getAgentOrder(
  sort: AgentsListSort,
): Prisma.AgentOrderByWithRelationInput[] {
  if (sort === "name-asc") {
    return [{ firstName: "asc" }, { lastName: "asc" }];
  }

  if (sort === "students-desc") {
    return [{ registeredStudentsCount: "desc" }, { firstName: "asc" }];
  }

  return [{ updatedAt: "desc" }, { firstName: "asc" }];
}

function mapAgentRecord(
  agent: AgentListRecord,
  profilePhotoUrl = "",
): AgentRecord {
  return {
    id: agent.id,
    firstName: agent.firstName,
    lastName: agent.lastName,
    companyName: agent.companyName ?? "Independent Agent",
    email: agent.email,
    phone: agent.phone ?? "Təyin edilməyib",
    country: agent.country ?? "Təyin edilməyib",
    address: agent.address ?? "Təyin edilməyib",
    instagramUrl: agent.instagramUrl ?? "",
    profilePhotoUrl,
    portalStatus: fromDbPortalStatus(agent.portalStatus),
    tier: fromDbTier(agent.tier),
    studentsCount: agent._count.students,
    activeApplications: agent._count.applications,
    conversionRate: agent.conversionRate,
    commissionBalance: Number(agent.commissionBalance),
    lastActivity: formatDate(agent.updatedAt),
    joinedAt: formatDate(agent.createdAt),
  };
}

function parseListFilters(
  searchParams: AgentsSearchParams,
): AgentsListFilters {
  const page = clampNumber(readParam(searchParams, "page"), 1, 999, 1);
  const pageSize = clampNumber(
    readParam(searchParams, "pageSize"),
    5,
    50,
    DEFAULT_PAGE_SIZE,
  );

  return {
    query: readParam(searchParams, "q").trim(),
    country: readParam(searchParams, "country") || "all",
    portalStatus: readParam(searchParams, "portal") || "all",
    tier: readParam(searchParams, "tier") || "all",
    sort: parseSortParam(searchParams),
    page,
    pageSize,
  };
}

function filterRows(rows: AgentRecord[], filters: AgentsListFilters) {
  return rows.filter((agent) => {
    const normalizedQuery = filters.query.toLowerCase();
    const fullName = `${agent.firstName} ${agent.lastName}`;
    const searchable = [
      agent.id,
      agent.firstName,
      agent.lastName,
      fullName,
      agent.companyName,
      agent.email,
      agent.phone,
      agent.country,
      agent.address,
      agent.instagramUrl,
      agent.portalStatus,
      agent.tier,
    ];

    if (
      normalizedQuery &&
      !searchable.some((value) => value.toLowerCase().includes(normalizedQuery))
    ) {
      return false;
    }

    if (filters.country !== "all" && agent.country !== filters.country) {
      return false;
    }

    if (
      filters.portalStatus !== "all" &&
      agent.portalStatus !== filters.portalStatus
    ) {
      return false;
    }

    return filters.tier === "all" || agent.tier === filters.tier;
  });
}

function sortRows(rows: AgentRecord[], sort: AgentsListSort) {
  return [...rows].sort((a, b) => {
    if (sort === "name-asc") {
      return `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
      );
    }

    if (sort === "students-desc") {
      return b.studentsCount - a.studentsCount;
    }

    return Date.parse(b.lastActivity) - Date.parse(a.lastActivity);
  });
}

function toDbPortalStatus(value: string) {
  if (value === "Ready") {
    return "READY" as const;
  }

  if (value === "Suspended") {
    return "SUSPENDED" as const;
  }

  return "PENDING" as const;
}

function toDbTier(value: string) {
  if (value === "Growth") {
    return "GROWTH" as const;
  }

  if (value === "Premier") {
    return "PREMIER" as const;
  }

  return "STARTER" as const;
}

function fromDbPortalStatus(value: string): AgentRecord["portalStatus"] {
  if (value === "READY") {
    return "Ready";
  }

  if (value === "SUSPENDED") {
    return "Suspended";
  }

  return "Pending";
}

function fromDbTier(value: string): AgentRecord["tier"] {
  if (value === "GROWTH") {
    return "Growth";
  }

  if (value === "PREMIER") {
    return "Premier";
  }

  return "Starter";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function hasUsableDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  return Boolean(databaseUrl && !databaseUrl.includes("CHANGE_ME_DB_PASSWORD"));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function parseSortParam(searchParams: AgentsSearchParams): AgentsListSort {
  const value = readParam(searchParams, "sort");

  if (value === "name-asc" || value === "students-desc") {
    return value;
  }

  return "updated-desc";
}

function readParam(searchParams: AgentsSearchParams, key: string) {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function clampNumber(
  value: string,
  min: number,
  max: number,
  fallback: number,
) {
  if (!value.trim()) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
