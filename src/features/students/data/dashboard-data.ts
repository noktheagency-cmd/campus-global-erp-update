import { cache } from "react";

import type {
  StudentRecord,
  StudentsDashboardData,
  StudentsListFilters,
  StudentsListSort,
  StudentsSearchParams,
} from "@/features/students/types";
import type { Prisma } from "@/generated/prisma/client";
import {
  getCurrentSession,
  getSessionAgentId,
} from "@/lib/auth/session";

const DEFAULT_PAGE_SIZE = 8;
type StudentListRecord = Prisma.StudentGetPayload<{
  include: {
    agent: {
      select: {
        companyName: true;
        firstName: true;
        lastName: true;
      };
    };
    applications: {
      select: {
        documents: {
          select: {
            id: true;
          };
        };
      };
    };
    documents: {
      select: {
        id: true;
      };
    };
  };
}>;

const sampleStudents: StudentRecord[] = [
  {
    id: "stu-1007",
    firstName: "Aylin",
    lastName: "Mammadova",
    fatherName: "Rashad",
    motherName: "Nigar",
    birthDate: "2004-03-18",
    email: "aylin.mammadova@student.campus.global",
    contactEmail: "aylin.mammadova@example.com",
    phone: "+994 50 214 77 20",
    address: "Baku, Nasimi",
    passportNo: "C03911842",
    identityNo: "AZE18274631",
    citizenship: "Azerbaijan",
    agent: "Elnur Camalov",
    gender: "Female",
    maritalStatus: "Single",
    stage: "Application",
    portalStatus: "Ready",
    documentCount: 3,
    missingItems: 0,
    updatedAt: "Jun 11, 2026",
  },
  {
    id: "stu-1006",
    firstName: "Murad",
    lastName: "Aliyev",
    fatherName: "Kamran",
    motherName: "Sevda",
    birthDate: "2003-09-02",
    email: "murad.aliyev@student.campus.global",
    contactEmail: "murad.aliyev@example.com",
    phone: "+994 55 810 12 44",
    address: "Ganja, Nizami",
    passportNo: "C04190018",
    identityNo: "AZE29015377",
    citizenship: "Azerbaijan",
    agent: "Leyla Karimova",
    gender: "Male",
    maritalStatus: "Single",
    stage: "Offer",
    portalStatus: "Pending",
    documentCount: 2,
    missingItems: 1,
    updatedAt: "Jun 10, 2026",
  },
  {
    id: "stu-1005",
    firstName: "Zehra",
    lastName: "Demir",
    fatherName: "Mehmet",
    motherName: "Elif",
    birthDate: "2005-01-27",
    email: "zehra.demir@student.campus.global",
    contactEmail: "zehra.demir@example.com",
    phone: "+90 532 600 41 18",
    address: "Istanbul, Kadikoy",
    passportNo: "U26810428",
    identityNo: "TR104827551",
    citizenship: "Turkey",
    agent: "Orhan Yilmaz",
    gender: "Female",
    maritalStatus: "Single",
    stage: "Enrollment",
    portalStatus: "Ready",
    documentCount: 4,
    missingItems: 0,
    updatedAt: "Jun 9, 2026",
  },
  {
    id: "stu-1004",
    firstName: "Nihad",
    lastName: "Huseynli",
    fatherName: "Samir",
    motherName: "Gunay",
    birthDate: "2002-11-13",
    email: "",
    contactEmail: "nihad.huseynli@example.com",
    phone: "+994 70 310 90 01",
    address: "Sumgait, 9th district",
    passportNo: "C03599024",
    identityNo: "AZE55210934",
    citizenship: "Azerbaijan",
    agent: "Elnur Camalov",
    gender: "Male",
    maritalStatus: "Single",
    stage: "Profil",
    portalStatus: "Needs email",
    documentCount: 1,
    missingItems: 2,
    updatedAt: "Jun 8, 2026",
  },
  {
    id: "stu-1003",
    firstName: "Sofia",
    lastName: "Ivanova",
    fatherName: "Anton",
    motherName: "Irina",
    birthDate: "2004-06-09",
    email: "sofia.ivanova@student.campus.global",
    contactEmail: "sofia.ivanova@example.com",
    phone: "+7 916 204 44 32",
    address: "Moscow, Presnensky",
    passportNo: "P9014821",
    identityNo: "RU77192044",
    citizenship: "Russia",
    agent: "Leyla Karimova",
    gender: "Female",
    maritalStatus: "Single",
    stage: "Visa",
    portalStatus: "Pending",
    documentCount: 2,
    missingItems: 1,
    updatedAt: "Jun 6, 2026",
  },
  {
    id: "stu-1002",
    firstName: "Tural",
    lastName: "Qasimov",
    fatherName: "Vugar",
    motherName: "Aysel",
    birthDate: "2001-08-22",
    email: "tural.qasimov@student.campus.global",
    contactEmail: "tural.qasimov@example.com",
    phone: "+994 51 447 80 12",
    address: "Baku, Khatai",
    passportNo: "C03248819",
    identityNo: "AZE49103722",
    citizenship: "Azerbaijan",
    agent: "Mina Abbasova",
    gender: "Male",
    maritalStatus: "Married",
    stage: "Application",
    portalStatus: "Ready",
    documentCount: 3,
    missingItems: 0,
    updatedAt: "Jun 5, 2026",
  },
  {
    id: "stu-1001",
    firstName: "Luka",
    lastName: "Kapanadze",
    fatherName: "Giorgi",
    motherName: "Mariam",
    birthDate: "2003-12-01",
    email: "",
    contactEmail: "luka.kapanadze@example.com",
    phone: "+995 555 49 18 21",
    address: "Tbilisi, Vake",
    passportNo: "G70144192",
    identityNo: "GE03019821",
    citizenship: "Georgia",
    agent: "Mina Abbasova",
    gender: "Male",
    maritalStatus: "Single",
    stage: "Profil",
    portalStatus: "Needs email",
    documentCount: 0,
    missingItems: 3,
    updatedAt: "Jun 2, 2026",
  },
];

export const getStudentsDashboardData = cache(
  async (
    searchParams: StudentsSearchParams = {},
  ): Promise<StudentsDashboardData> => {
    const filters = parseListFilters(searchParams);
    const session = await getCurrentSession();
    const scopedAgentId = session ? getSessionAgentId(session) : null;

    if (!hasUsableDatabaseUrl()) {
      if (scopedAgentId) {
        return buildEmptyDashboardData(filters);
      }

      return buildFallbackDashboardData(filters);
    }

    try {
      const { prisma } = await import("@/lib/db");
      const where = buildStudentWhere(filters, scopedAgentId);
      const scopeWhere = buildStudentScopeWhere(scopedAgentId);
      const orderBy = getStudentOrder(filters.sort);
      const requestedStartIndex = (filters.page - 1) * filters.pageSize;
      const requestedStudentsPromise = prisma.student.findMany({
        include: {
          agent: {
            select: {
              companyName: true,
              firstName: true,
              lastName: true,
            },
          },
          applications: {
            select: {
              documents: {
                select: { id: true },
                where: { isRequired: true, status: "MISSING" },
              },
            },
          },
          documents: {
            select: { id: true },
          },
        },
        orderBy,
        skip: requestedStartIndex,
        take: filters.pageSize,
        where,
      });
      const [
        totalFilteredStudents,
        totalStudents,
        activeApplications,
        portalQueue,
        missingDocuments,
        agents,
        citizenships,
        requestedStudents,
      ] = await Promise.all([
        prisma.student.count({ where }),
        prisma.student.count({ where: scopeWhere }),
        prisma.application.count({
          where: {
            agentId: scopedAgentId ?? undefined,
            status: { not: "ARCHIVED" },
          },
        }),
        prisma.student.count({
          where: {
            AND: [
              scopeWhere,
              {
                OR: [{ portalStatus: { not: "READY" } }, { loginEmail: null }],
              },
            ],
          },
        }),
        prisma.applicationDocument.count({
          where: {
            application: scopedAgentId ? { agentId: scopedAgentId } : undefined,
            isRequired: true,
            status: "MISSING",
          },
        }),
        prisma.agent.findMany({
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          select: {
            companyName: true,
            firstName: true,
            id: true,
            lastName: true,
          },
          where: scopedAgentId
            ? { id: scopedAgentId }
            : { portalStatus: { not: "SUSPENDED" } },
        }),
        prisma.student.findMany({
          distinct: ["citizenship"],
          orderBy: { citizenship: "asc" },
          select: { citizenship: true },
          where: {
            ...scopeWhere,
            citizenship: { not: null },
          },
        }),
        requestedStudentsPromise,
      ]);
      const totalPages = Math.max(
        1,
        Math.ceil(totalFilteredStudents / filters.pageSize),
      );
      const safePage = Math.min(filters.page, totalPages);
      const startIndex = (safePage - 1) * filters.pageSize;
      const students =
        safePage === filters.page
          ? requestedStudents
          : await prisma.student.findMany({
              include: {
                agent: {
                  select: {
                    companyName: true,
                    firstName: true,
                    lastName: true,
                  },
                },
                applications: {
                  select: {
                    documents: {
                      select: { id: true },
                      where: { isRequired: true, status: "MISSING" },
                    },
                  },
                },
                documents: {
                  select: { id: true },
                },
              },
              orderBy,
              skip: startIndex,
              take: filters.pageSize,
              where,
            });

      return {
        filterOptions: {
          agents: agents.map((agent) => ({
            label:
              agent.companyName ||
              `${agent.firstName} ${agent.lastName}`.trim(),
            value: agent.id,
          })),
          citizenships: citizenships
            .map((option) => option.citizenship)
            .filter((citizenship): citizenship is string =>
              Boolean(citizenship),
            ),
          portalStatuses: ["Ready", "Pending", "Needs email"],
        },
        filters: { ...filters, page: safePage },
        metrics: {
          activeApplications,
          missingDocuments,
          portalQueue,
          totalStudents,
        },
        pagination: {
          resultEnd:
            totalFilteredStudents > 0
              ? Math.min(startIndex + filters.pageSize, totalFilteredStudents)
              : 0,
          resultStart: totalFilteredStudents > 0 ? startIndex + 1 : 0,
          totalItems: totalFilteredStudents,
          totalPages,
        },
        rows: students.map(mapStudentRecord),
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `Falling back to local student data: ${getErrorMessage(error)}`,
        );
      }

      return scopedAgentId
        ? buildEmptyDashboardData(filters)
        : buildFallbackDashboardData(filters);
    }
  },
);

function buildEmptyDashboardData(
  filters: StudentsListFilters,
): StudentsDashboardData {
  return {
    filterOptions: {
      agents: [],
      citizenships: [],
      portalStatuses: ["Ready", "Pending", "Needs email"],
    },
    filters,
    metrics: {
      activeApplications: 0,
      missingDocuments: 0,
      portalQueue: 0,
      totalStudents: 0,
    },
    pagination: {
      resultEnd: 0,
      resultStart: 0,
      totalItems: 0,
      totalPages: 1,
    },
    rows: [],
  };
}

function buildFallbackDashboardData(
  filters: StudentsListFilters,
): StudentsDashboardData {
  const filteredRows = filterRows(sampleStudents, filters);
  const sortedRows = sortRows(filteredRows, filters.sort);
  const totalItems = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const safePage = Math.min(filters.page, totalPages);
  const startIndex = (safePage - 1) * filters.pageSize;
  const rows = sortedRows.slice(startIndex, startIndex + filters.pageSize);

  return {
    metrics: {
      totalStudents: sampleStudents.length,
      activeApplications: sampleStudents.filter(
        (student) => student.stage !== "Profil",
      ).length,
      portalQueue: sampleStudents.filter(
        (student) => student.portalStatus !== "Ready",
      ).length,
      missingDocuments: sampleStudents.reduce(
        (total, student) => total + student.missingItems,
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
      agents: unique(sampleStudents.map((student) => student.agent)).map(
        (agent) => ({
          label: agent,
          value: agent,
        }),
      ),
      citizenships: unique(
        sampleStudents.map((student) => student.citizenship),
      ),
      portalStatuses: ["Ready", "Pending", "Needs email"],
    },
  };
}

function buildStudentWhere(
  filters: StudentsListFilters,
  scopedAgentId: string | null,
): Prisma.StudentWhereInput {
  const and: Prisma.StudentWhereInput[] = [];

  if (scopedAgentId) {
    and.push({ agentId: scopedAgentId });
  }

  if (filters.citizenship !== "all") {
    and.push({ citizenship: filters.citizenship });
  }

  if (!scopedAgentId && filters.agent !== "all") {
    and.push({ agentId: filters.agent });
  }

  if (filters.portalStatus === "Ready") {
    and.push({
      NOT: [{ loginEmail: null }, { loginEmail: "" }],
      portalStatus: "READY",
    });
  } else if (filters.portalStatus === "Pending") {
    and.push({
      NOT: [{ loginEmail: null }, { loginEmail: "" }],
      portalStatus: { not: "READY" },
    });
  } else if (filters.portalStatus === "Needs email") {
    and.push({ OR: [{ loginEmail: null }, { loginEmail: "" }] });
  }

  if (filters.query) {
    and.push({
      OR: [
        { id: { contains: filters.query, mode: "insensitive" } },
        { firstName: { contains: filters.query, mode: "insensitive" } },
        { lastName: { contains: filters.query, mode: "insensitive" } },
        { contactEmail: { contains: filters.query, mode: "insensitive" } },
        { loginEmail: { contains: filters.query, mode: "insensitive" } },
        { phone: { contains: filters.query, mode: "insensitive" } },
        { passportNo: { contains: filters.query, mode: "insensitive" } },
        { identityNo: { contains: filters.query, mode: "insensitive" } },
        {
          agent: {
            is: {
              OR: [
                {
                  companyName: {
                    contains: filters.query,
                    mode: "insensitive",
                  },
                },
                {
                  firstName: {
                    contains: filters.query,
                    mode: "insensitive",
                  },
                },
                {
                  lastName: {
                    contains: filters.query,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

function buildStudentScopeWhere(
  scopedAgentId: string | null,
): Prisma.StudentWhereInput {
  return scopedAgentId ? { agentId: scopedAgentId } : {};
}

function getStudentOrder(
  sort: StudentsListSort,
): Prisma.StudentOrderByWithRelationInput[] {
  if (sort === "name-asc") {
    return [{ firstName: "asc" }, { lastName: "asc" }];
  }

  if (sort === "stage-asc") {
    return [{ stage: "asc" }, { updatedAt: "desc" }];
  }

  return [{ updatedAt: "desc" }, { firstName: "asc" }];
}

function mapStudentRecord(student: StudentListRecord): StudentRecord {
  return {
    address: student.address ?? "Təyin edilməyib",
    agent: formatAgentName(student.agent),
    birthDate: student.birthDate ? student.birthDate.toISOString().slice(0, 10) : "",
    citizenship: student.citizenship ?? "Təyin edilməyib",
    contactEmail: student.contactEmail ?? student.loginEmail ?? "Təyin edilməyib",
    documentCount: student.documents.length,
    email: student.loginEmail ?? "",
    fatherName: student.fatherName ?? "",
    firstName: student.firstName,
    gender: student.gender === "Female" ? "Female" : "Male",
    id: student.id,
    identityNo: student.identityNo ?? "",
    lastName: student.lastName,
    maritalStatus: student.maritalStatus === "Married" ? "Married" : "Single",
    missingItems: student.applications.reduce(
      (total, application) => total + application.documents.length,
      0,
    ),
    motherName: student.motherName ?? "",
    passportNo: student.passportNo ?? "",
    phone: student.phone ?? "Təyin edilməyib",
    portalStatus: fromDbPortalStatus(student.loginEmail, student.portalStatus),
    stage: normalizeStage(student.stage),
    updatedAt: formatDate(student.updatedAt),
  };
}

function formatAgentName(student: StudentListRecord["agent"]) {
  if (!student) {
    return "Fərdi qeydiyyat";
  }

  return (
    student.companyName ||
    `${student.firstName} ${student.lastName}`.trim() ||
    "Fərdi qeydiyyat"
  );
}

function fromDbPortalStatus(
  loginEmail: string | null,
  portalStatus: string,
): StudentRecord["portalStatus"] {
  if (!loginEmail) {
    return "Needs email";
  }

  return portalStatus === "READY" ? "Ready" : "Pending";
}

function normalizeStage(stage: string): StudentRecord["stage"] {
  if (
    stage === "Application" ||
    stage === "Offer" ||
    stage === "Enrollment" ||
    stage === "Visa"
  ) {
    return stage;
  }

  return "Profil";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
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

function parseListFilters(
  searchParams: StudentsSearchParams,
): StudentsListFilters {
  const page = clampNumber(readParam(searchParams, "page"), 1, 999, 1);
  const pageSize = clampNumber(
    readParam(searchParams, "pageSize"),
    5,
    50,
    DEFAULT_PAGE_SIZE,
  );

  return {
    query: readParam(searchParams, "q").trim(),
    citizenship: readParam(searchParams, "citizenship") || "all",
    agent: readParam(searchParams, "agent") || "all",
    portalStatus: readParam(searchParams, "portal") || "all",
    sort: parseSortParam(searchParams),
    page,
    pageSize,
  };
}

function filterRows(rows: StudentRecord[], filters: StudentsListFilters) {
  return rows.filter((student) => {
    const normalizedQuery = filters.query.toLowerCase();
    const searchable = [
      student.id,
      student.firstName,
      student.lastName,
      `${student.firstName} ${student.lastName}`,
      student.email,
      student.contactEmail,
      student.phone,
      student.passportNo,
      student.identityNo,
      student.agent,
      student.stage,
    ];

    if (
      normalizedQuery &&
      !searchable.some((value) => value.toLowerCase().includes(normalizedQuery))
    ) {
      return false;
    }

    if (
      filters.citizenship !== "all" &&
      student.citizenship !== filters.citizenship
    ) {
      return false;
    }

    if (filters.agent !== "all" && student.agent !== filters.agent) {
      return false;
    }

    return (
      filters.portalStatus === "all" ||
      student.portalStatus === filters.portalStatus
    );
  });
}

function sortRows(rows: StudentRecord[], sort: StudentsListSort) {
  return [...rows].sort((a, b) => {
    if (sort === "name-asc") {
      return `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
      );
    }

    if (sort === "stage-asc") {
      return a.stage.localeCompare(b.stage);
    }

    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

function parseSortParam(searchParams: StudentsSearchParams): StudentsListSort {
  const value = readParam(searchParams, "sort");

  if (value === "name-asc" || value === "stage-asc") {
    return value;
  }

  return "updated-desc";
}

function readParam(searchParams: StudentsSearchParams, key: string) {
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
