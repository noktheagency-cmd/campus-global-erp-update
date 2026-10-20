import { unstable_cache } from "next/cache";
import { cache } from "react";

import {
  APPLICATION_DECISION_STATUSES,
  APPLICATION_REQUIRED_DOCUMENT_READY_STATUSES,
  APPLICATION_STATUS_LABELS,
} from "@/features/applications/constants";
import type {
  ApplicationStatus,
  ApplicationRow,
  ApplicationsDashboardData,
  ApplicationsListFilters,
  ApplicationsListSort,
  ApplicationsSearchParams,
} from "@/features/applications/types";
import type { Prisma } from "@/generated/prisma/client";
import {
  getCurrentSession,
  getSessionAgentId,
  getSessionStudentId,
} from "@/lib/auth/session";
import { createDocumentAccessUrl } from "@/lib/supabase/storage";

const DEFAULT_PAGE_SIZE = 8;
const COMPLETED_APPLICATION_STATUSES = [
  "ACCEPTED",
  "REJECTED",
  "ENROLLED",
  "ARCHIVED",
] as const;
type ApplicationListRecord = Prisma.ApplicationGetPayload<{
  select: {
    agent: {
      select: {
        companyName: true;
        firstName: true;
        lastName: true;
      };
    };
    choices: {
      select: {
        id: true;
        priority: true;
        program: {
          select: {
            campus: { select: { name: true } };
            educationLanguage: { select: { name: true } };
            educationLevel: { select: { name: true } };
            id: true;
            name: true;
          };
        };
        status: true;
        university: {
          select: {
            city: true;
            country: true;
            id: true;
            name: true;
          };
        };
      };
    };
    code: true;
    country: true;
    createdBy: {
      select: {
        email: true;
        name: true;
      };
    };
    createdAt: true;
    documents: {
      select: {
        isRequired: true;
        status: true;
      };
    };
    educationLevel: { select: { name: true } };
    id: true;
    period: { select: { name: true } };
    status: true;
    student: {
      select: {
        citizenship: true;
        contactEmail: true;
        firstName: true;
        id: true;
        identityNo: true;
        lastName: true;
        passportNo: true;
        phone: true;
        photoUrl: true;
      };
    };
    updatedAt: true;
  };
}>;

type ApplicationReferenceOptions = {
  managers: Array<{ label: string; value: string }>;
  levels: Array<{ label: string; value: string }>;
  periods: Array<{ label: string; value: string }>;
  programs: Array<{ label: string; value: string }>;
  universities: Array<{ label: string; value: string }>;
};

export const getApplicationsDashboardData = cache(
  async (
    searchParams: ApplicationsSearchParams = {},
  ): Promise<ApplicationsDashboardData> => {
    const filters = parseListFilters(searchParams);
    const session = await getCurrentSession();
    const scopedAgentId = session ? getSessionAgentId(session) : null;
    const scopedStudentId = session ? getSessionStudentId(session) : null;

    if (!hasUsableDatabaseUrl()) {
      return buildEmptyDashboardData(filters, "unavailable");
    }

    try {
      const { prisma } = await import("@/lib/db");
      const fuzzyStudentIds = await findFuzzyStudentIds(
        filters.query,
        scopedAgentId,
        scopedStudentId,
      );
      const where = buildApplicationWhere(
        filters,
        scopedAgentId,
        scopedStudentId,
        fuzzyStudentIds,
      );
      const scopeWhere = buildApplicationScopeWhere(
        scopedAgentId,
        scopedStudentId,
      );
      const orderBy = getApplicationOrder(filters.sort);
      const referenceOptionsPromise = getApplicationReferenceOptions();
      const todayDate = getTodayDateInputValue();

      const [
        applications,
        totalApplications,
        todayApplications,
        completedApplications,
        incompleteApplications,
        missingApplications,
        countries,
        agents,
        referenceOptions,
      ] = await Promise.all([
        prisma.application.findMany({
          select: {
            agent: {
              select: {
                companyName: true,
                firstName: true,
                lastName: true,
              },
            },
            choices: {
              orderBy: [{ priority: "asc" }],
              select: {
                id: true,
                priority: true,
                program: {
                  select: {
                    campus: { select: { name: true } },
                    educationLanguage: { select: { name: true } },
                    educationLevel: { select: { name: true } },
                    id: true,
                    name: true,
                  },
                },
                status: true,
                university: {
                  select: {
                    city: true,
                    country: true,
                    id: true,
                    name: true,
                  },
                },
              },
            },
            code: true,
            country: true,
            createdBy: {
              select: {
                email: true,
                name: true,
              },
            },
            createdAt: true,
            documents: {
              select: {
                isRequired: true,
                status: true,
              },
            },
            educationLevel: { select: { name: true } },
            id: true,
            period: { select: { name: true } },
            status: true,
            student: {
              select: {
                citizenship: true,
                contactEmail: true,
                firstName: true,
                id: true,
                identityNo: true,
                lastName: true,
                passportNo: true,
                phone: true,
                photoUrl: true,
              },
            },
            updatedAt: true,
          },
          orderBy,
          where,
        }),
        prisma.application.count({ where: scopeWhere }),
        prisma.application.count({
          where: {
            ...scopeWhere,
            createdAt: {
              gte: startOfDate(todayDate),
              lte: endOfDate(todayDate),
            },
          },
        }),
        prisma.application.count({
          where: {
            ...scopeWhere,
            status: { in: [...COMPLETED_APPLICATION_STATUSES] },
          },
        }),
        prisma.application.count({
          where: {
            ...scopeWhere,
            status: { notIn: [...COMPLETED_APPLICATION_STATUSES] },
          },
        }),
        prisma.application.count({
          where: {
            ...scopeWhere,
            status: "INVALID_DOCUMENTS",
          },
        }),
        prisma.application.groupBy({
          by: ["country"],
          orderBy: { country: "asc" },
          where: scopeWhere,
          _count: { _all: true },
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
            : scopedStudentId
              ? { id: "__student-no-agent-filter__" }
              : undefined,
        }),
        referenceOptionsPromise,
      ]);
      const studentRows = await resolveApplicationStudentPhotoUrls(
        buildApplicationStudentRows(applications, filters.sort),
      );
      const totalFilteredStudents = studentRows.length;
      const totalPages = Math.max(
        1,
        Math.ceil(totalFilteredStudents / filters.pageSize),
      );
      const safePage = Math.min(filters.page, totalPages);
      const pageStart = (safePage - 1) * filters.pageSize;
      const pageRows = studentRows.slice(
        pageStart,
        pageStart + filters.pageSize,
      );
      const resultStart =
        totalFilteredStudents > 0 ? (safePage - 1) * filters.pageSize + 1 : 0;
      const resultEnd =
        totalFilteredStudents > 0
          ? Math.min(safePage * filters.pageSize, totalFilteredStudents)
          : 0;

      return {
        dataSource: "database",
        filterOptions: {
          agents: agents.map((agent) => ({
            label:
              agent.companyName ||
              `${agent.firstName} ${agent.lastName}`.trim(),
            value: agent.id,
          })),
          countries: countries.map((country) => country.country),
          levels: referenceOptions.levels,
          managers: referenceOptions.managers,
          periods: referenceOptions.periods,
          programs: referenceOptions.programs,
          statuses: [...APPLICATION_DECISION_STATUSES],
          universities: referenceOptions.universities,
        },
        filters: { ...filters, page: safePage },
        metrics: {
          completedApplications,
          incompleteApplications,
          missingApplications,
          todayApplications,
          todayDate,
          totalApplications,
        },
        pagination: {
          resultEnd,
          resultStart,
          totalItems: totalFilteredStudents,
          totalPages,
        },
        rows: pageRows,
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Applications data unavailable: ${String(error)}`);
      }

      return buildEmptyDashboardData(filters, "unavailable");
    }
  },
);

function buildApplicationStudentRows(
  applications: ApplicationListRecord[],
  sort: ApplicationsListSort,
): ApplicationRow[] {
  const grouped = new Map<string, ApplicationListRecord[]>();

  for (const application of applications) {
    const current = grouped.get(application.student.id) ?? [];
    current.push(application);
    grouped.set(application.student.id, current);
  }

  const rows = Array.from(grouped.values()).map(mapApplicationStudentRow);

  if (sort === "student-asc") {
    return rows.sort((left, right) =>
      left.studentName.localeCompare(right.studentName),
    );
  }

  return rows;
}

async function resolveApplicationStudentPhotoUrls(rows: ApplicationRow[]) {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      studentPhotoUrl: row.studentPhotoUrl
        ? ((await createDocumentAccessUrl(row.studentPhotoUrl)) ?? "")
        : "",
    })),
  );
}

function mapApplicationStudentRow(
  applications: ApplicationListRecord[],
): ApplicationRow {
  const latestApplication = applications[0];
  const student = latestApplication.student;
  const applicationSummaries = applications.map(mapStudentApplicationSummary);
  const missingRequiredDocuments = applicationSummaries.reduce(
    (total, application) => total + application.missingRequiredDocuments,
    0,
  );
  const countries = uniqueValues(
    applications.map((application) => application.country),
  );
  const levels = uniqueValues(
    applications.map((application) => application.educationLevel.name),
  );

  return {
    agent: latestApplication.agent
      ? latestApplication.agent.companyName ||
        `${latestApplication.agent.firstName} ${latestApplication.agent.lastName}`.trim()
      : "Fərdi qeydiyyat",
    applicationCount: applications.length,
    applications: applicationSummaries,
    citizenship: student.citizenship ?? "",
    createdAt: formatDate(latestApplication.createdAt),
    countries,
    draftApplications: applications.filter(
      (application) => application.status === "DRAFT",
    ).length,
    id: student.id,
    identityNo: student.identityNo ?? "",
    latestApplicationCode: latestApplication.code,
    latestApplicationId: latestApplication.id,
    latestCountry: latestApplication.country,
    latestLevel: latestApplication.educationLevel.name,
    latestPeriod: latestApplication.period.name,
    levels,
    manager:
      latestApplication.createdBy?.name ||
      latestApplication.createdBy?.email ||
      "Təyin edilməyib",
    missingRequiredDocuments,
    passportNo: student.passportNo ?? "",
    status:
      APPLICATION_STATUS_LABELS[
        latestApplication.status as keyof typeof APPLICATION_STATUS_LABELS
      ] ?? formatEnumLabel(latestApplication.status),
    statusCode: latestApplication.status as ApplicationStatus,
    studentEmail: student.contactEmail ?? "",
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    studentPhone: student.phone ?? "",
    studentPhotoUrl: student.photoUrl ?? "",
    submittedApplications: applications.filter(
      (application) => application.status === "SUBMITTED",
    ).length,
    updatedAt: formatDate(latestApplication.updatedAt),
  };
}

function mapStudentApplicationSummary(application: ApplicationListRecord) {
  return {
    agent: application.agent
      ? application.agent.companyName ||
        `${application.agent.firstName} ${application.agent.lastName}`.trim()
      : "Fərdi qeydiyyat",
    choices: application.choices.map((choice) => ({
      campusName: choice.program.campus?.name ?? "",
      educationLanguage: choice.program.educationLanguage?.name ?? "",
      educationLevel: choice.program.educationLevel?.name ?? "",
      id: choice.id,
      priority: choice.priority,
      programId: choice.program.id,
      programName: choice.program.name,
      statusCode: choice.status as ApplicationStatus | null,
      universityCity: choice.university.city ?? "",
      universityCountry: choice.university.country ?? "",
      universityId: choice.university.id,
      universityName: choice.university.name,
    })),
    choicesCount: application.choices.length,
    code: application.code,
    country: application.country,
    createdAt: formatDate(application.createdAt),
    id: application.id,
    level: application.educationLevel.name,
    missingRequiredDocuments: countMissingRequiredDocuments(application),
    manager:
      application.createdBy?.name ||
      application.createdBy?.email ||
      "Təyin edilməyib",
    period: application.period.name,
    status:
      APPLICATION_STATUS_LABELS[
        application.status as keyof typeof APPLICATION_STATUS_LABELS
      ] ?? formatEnumLabel(application.status),
    statusCode: application.status as ApplicationStatus,
    updatedAt: formatDate(application.updatedAt),
  };
}

function countMissingRequiredDocuments(application: ApplicationListRecord) {
  return application.documents.filter(
    (document) =>
      document.isRequired &&
      !APPLICATION_REQUIRED_DOCUMENT_READY_STATUSES.includes(
        document.status as (typeof APPLICATION_REQUIRED_DOCUMENT_READY_STATUSES)[number],
      ),
  ).length;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

const getApplicationReferenceOptions = unstable_cache(
  async (): Promise<ApplicationReferenceOptions> => {
    const { prisma } = await import("@/lib/db");
    const [periods, levels, universities, programs, managers] =
      await Promise.all([
        prisma.period.findMany({
          orderBy: [{ year: "desc" }, { season: "asc" }],
          select: { id: true, name: true },
        }),
        prisma.educationLevel.findMany({
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: { id: true, name: true },
          where: { status: "ACTIVE" },
        }),
        prisma.university.findMany({
          orderBy: [{ name: "asc" }],
          select: { id: true, name: true },
          where: { status: "ACTIVE" },
        }),
        prisma.program.findMany({
          orderBy: [{ name: "asc" }],
          select: {
            id: true,
            name: true,
            university: { select: { name: true } },
          },
          where: { status: { not: "ARCHIVED" } },
        }),
        prisma.user.findMany({
          orderBy: [{ name: "asc" }, { email: "asc" }],
          select: { email: true, id: true, name: true },
          where: { status: "ACTIVE" },
        }),
      ]);

    return {
      managers: managers.map((manager) => ({
        label: manager.name || manager.email,
        value: manager.id,
      })),
      levels: levels.map((level) => ({
        label: level.name,
        value: level.id,
      })),
      periods: periods.map((period) => ({
        label: period.name,
        value: period.id,
      })),
      programs: programs.map((program) => ({
        label: `${program.name} · ${program.university.name}`,
        value: program.id,
      })),
      universities: universities.map((university) => ({
        label: university.name,
        value: university.id,
      })),
    };
  },
  ["applications-reference-options"],
  {
    revalidate: 300,
    tags: ["applications:reference"],
  },
);

async function findFuzzyStudentIds(
  query: string,
  scopedAgentId: string | null,
  scopedStudentId: string | null,
) {
  const normalizedQuery = normalizeSearchValue(query);

  if (normalizedQuery.length < 3) {
    return [];
  }

  const { prisma } = await import("@/lib/db");
  const candidates = await prisma.student.findMany({
    select: {
      contactEmail: true,
      firstName: true,
      id: true,
      identityNo: true,
      lastName: true,
      passportNo: true,
      phone: true,
    },
    take: 500,
    where: scopedStudentId
      ? { id: scopedStudentId }
      : {
          applications: {
            some: scopedAgentId ? { agentId: scopedAgentId } : {},
          },
        },
  });

  return candidates
    .map((student) => ({
      id: student.id,
      score: getFuzzyMatchScore(normalizedQuery, [
        student.firstName,
        student.lastName,
        `${student.firstName} ${student.lastName}`,
        student.id,
        student.contactEmail,
        student.phone,
        student.passportNo,
        student.identityNo,
      ]),
    }))
    .filter((student) => student.score !== null)
    .sort((left, right) => (left.score ?? 0) - (right.score ?? 0))
    .slice(0, 30)
    .map((student) => student.id);
}

function getFuzzyMatchScore(query: string, values: Array<string | null>) {
  const queryTokens = getSearchTokens(query);
  const candidateTokens = values.flatMap((value) => {
    const normalized = normalizeSearchValue(value ?? "");
    return [...getSearchTokens(normalized), normalized.replaceAll(" ", "")];
  });
  let score = 0;

  for (const queryToken of queryTokens) {
    let closest = Number.POSITIVE_INFINITY;

    for (const candidateToken of candidateTokens) {
      if (!candidateToken) continue;
      if (candidateToken.includes(queryToken)) {
        closest = 0;
        break;
      }

      closest = Math.min(closest, getEditDistance(queryToken, candidateToken));
    }

    const allowedDistance = queryToken.length >= 4 ? 2 : 1;
    if (closest > allowedDistance) {
      return null;
    }
    score += closest;
  }

  return score;
}

function getEditDistance(left: string, right: string) {
  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  );

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

function getSearchTokens(value: string) {
  return normalizeSearchValue(value).split(" ").filter(Boolean).slice(0, 8);
}

function normalizeSearchValue(value: string) {
  return value
    .toLocaleLowerCase("az")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ə", "e")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ş", "s")
    .replaceAll("ç", "c")
    .replaceAll("ö", "o")
    .replaceAll("ü", "u")
    .replace(/[^a-z0-9@.+-]+/g, " ")
    .trim();
}

function buildApplicationWhere(
  filters: ApplicationsListFilters,
  scopedAgentId: string | null,
  scopedStudentId: string | null,
  fuzzyStudentIds: string[] = [],
): Prisma.ApplicationWhereInput {
  const and: Prisma.ApplicationWhereInput[] = [];

  if (scopedAgentId) {
    and.push({ agentId: scopedAgentId });
  }

  if (scopedStudentId) {
    and.push({ studentId: scopedStudentId });
  }

  if (filters.status !== "all") {
    and.push({ status: filters.status as Prisma.EnumApplicationStatusFilter });
  }

  if (filters.completion === "completed") {
    and.push({ status: { in: [...COMPLETED_APPLICATION_STATUSES] } });
  }

  if (filters.completion === "incomplete") {
    and.push({ status: { notIn: [...COMPLETED_APPLICATION_STATUSES] } });
  }

  if (filters.country !== "all") {
    and.push({ country: filters.country });
  }

  if (filters.periodId !== "all") {
    and.push({ periodId: filters.periodId });
  }

  if (filters.levelId !== "all") {
    and.push({ educationLevelId: filters.levelId });
  }

  if (filters.universityId !== "all") {
    and.push({ choices: { some: { universityId: filters.universityId } } });
  }

  if (filters.programId !== "all") {
    and.push({ choices: { some: { programId: filters.programId } } });
  }

  if (filters.managerId !== "all") {
    and.push({ createdById: filters.managerId });
  }

  if (filters.studentName) {
    const nameTokens = getSearchTokens(filters.studentName);
    and.push({
      student: {
        AND: nameTokens.map((token) => ({
          OR: [
            { firstName: { contains: token, mode: "insensitive" } },
            { lastName: { contains: token, mode: "insensitive" } },
            { fatherName: { contains: token, mode: "insensitive" } },
          ],
        })),
      },
    });
  }

  if (filters.passportNo) {
    and.push({
      student: {
        OR: [
          { passportNo: { contains: filters.passportNo, mode: "insensitive" } },
          { identityNo: { contains: filters.passportNo, mode: "insensitive" } },
        ],
      },
    });
  }

  if (filters.portalNo) {
    and.push({
      student: { id: { contains: filters.portalNo, mode: "insensitive" } },
    });
  }

  if (filters.applicationNo) {
    and.push({
      code: { contains: filters.applicationNo, mode: "insensitive" },
    });
  }

  if (filters.dateFrom || filters.dateTo) {
    and.push({
      createdAt: {
        ...(filters.dateFrom ? { gte: startOfDate(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: endOfDate(filters.dateTo) } : {}),
      },
    });
  }

  if (!scopedAgentId && !scopedStudentId && filters.agentId !== "all") {
    and.push({ agentId: filters.agentId });
  }

  if (filters.query) {
    const queryTokens = getSearchTokens(filters.query);
    const exactTokenMatch: Prisma.ApplicationWhereInput = {
      AND: queryTokens.map((token) => ({
        OR: [
          { code: { contains: token, mode: "insensitive" } },
          { country: { contains: token, mode: "insensitive" } },
          { studentId: { contains: token, mode: "insensitive" } },
          {
            student: {
              OR: [
                { firstName: { contains: token, mode: "insensitive" } },
                { lastName: { contains: token, mode: "insensitive" } },
                { contactEmail: { contains: token, mode: "insensitive" } },
                { phone: { contains: token, mode: "insensitive" } },
                { passportNo: { contains: token, mode: "insensitive" } },
                { identityNo: { contains: token, mode: "insensitive" } },
              ],
            },
          },
          {
            choices: {
              some: {
                OR: [
                  {
                    university: {
                      name: { contains: token, mode: "insensitive" },
                    },
                  },
                  {
                    program: { name: { contains: token, mode: "insensitive" } },
                  },
                ],
              },
            },
          },
        ],
      })),
    };
    and.push({
      OR: [
        exactTokenMatch,
        ...(fuzzyStudentIds.length > 0
          ? [{ studentId: { in: fuzzyStudentIds } }]
          : []),
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

function buildApplicationScopeWhere(
  scopedAgentId: string | null,
  scopedStudentId: string | null,
): Prisma.ApplicationWhereInput {
  if (scopedAgentId) {
    return { agentId: scopedAgentId };
  }

  if (scopedStudentId) {
    return { studentId: scopedStudentId };
  }

  return {};
}

function getApplicationOrder(
  sort: ApplicationsListSort,
): Prisma.ApplicationOrderByWithRelationInput[] {
  if (sort === "created-desc") {
    return [{ createdAt: "desc" as const }];
  }

  if (sort === "student-asc") {
    return [
      { student: { firstName: "asc" as const } },
      { updatedAt: "desc" as const },
    ];
  }

  return [{ updatedAt: "desc" as const }];
}

function parseListFilters(
  searchParams: ApplicationsSearchParams,
): ApplicationsListFilters {
  const page = clampNumber(readParam(searchParams, "page"), 1, 999, 1);
  const pageSize = clampNumber(
    readParam(searchParams, "pageSize"),
    5,
    50,
    DEFAULT_PAGE_SIZE,
  );
  const sortParam = readParam(searchParams, "sort");
  const sort: ApplicationsListSort =
    sortParam === "created-desc" || sortParam === "student-asc"
      ? sortParam
      : "updated-desc";

  return {
    agentId: readParam(searchParams, "agent") || "all",
    applicationNo: readParam(searchParams, "appNo").trim(),
    completion: parseCompletion(readParam(searchParams, "completion")),
    country: readParam(searchParams, "country") || "all",
    dateFrom: parseDateParam(readParam(searchParams, "from")),
    dateTo: parseDateParam(readParam(searchParams, "to")),
    levelId: readParam(searchParams, "level") || "all",
    managerId: readParam(searchParams, "manager") || "all",
    page,
    pageSize,
    periodId: readParam(searchParams, "period") || "all",
    portalNo: readParam(searchParams, "portalNo").trim(),
    passportNo: readParam(searchParams, "passport").trim(),
    programId: readParam(searchParams, "program") || "all",
    query: readParam(searchParams, "q").trim(),
    sort,
    status: readParam(searchParams, "status") || "all",
    studentName: readParam(searchParams, "name").trim(),
    universityId: readParam(searchParams, "university") || "all",
  };
}

function buildEmptyDashboardData(
  filters: ApplicationsListFilters,
  dataSource: ApplicationsDashboardData["dataSource"],
): ApplicationsDashboardData {
  return {
    dataSource,
    filterOptions: {
      agents: [],
      countries: [],
      levels: [],
      managers: [],
      periods: [],
      programs: [],
      statuses: [...APPLICATION_DECISION_STATUSES],
      universities: [],
    },
    filters,
    metrics: {
      completedApplications: 0,
      incompleteApplications: 0,
      missingApplications: 0,
      todayApplications: 0,
      todayDate: getTodayDateInputValue(),
      totalApplications: 0,
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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readParam(searchParams: ApplicationsSearchParams, key: string) {
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

function parseDateParam(value: string) {
  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "";
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);

  return Number.isNaN(parsed.getTime()) ? "" : trimmed;
}

function parseCompletion(value: string): ApplicationsListFilters["completion"] {
  return value === "completed" || value === "incomplete" ? value : "all";
}

function getTodayDateInputValue() {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Baku",
    year: "numeric",
  }).format(new Date());
}

function startOfDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfDate(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}

function hasUsableDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}
