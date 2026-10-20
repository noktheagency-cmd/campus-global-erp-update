import { unstable_cache } from "next/cache";
import { cache } from "react";

import {
  AGREEMENT_STATUSES,
  CURRENCIES,
  ENTITY_STATUSES,
  PERIOD_STATUSES,
  PARTNERSHIP_STATUSES,
  PRICE_STATUSES,
  PROGRAM_STATUSES,
  SCHOOL_TYPES,
} from "@/features/universities/constants";
import type {
  CountryChartDatum,
  ProgramDiscountFilter,
  ProgramListFilters,
  ProgramListSort,
  ProgramTableRow,
  UniversitiesDashboardData,
  UniversitiesListFilters,
  UniversitiesListSort,
  UniversitiesListPagination,
  UniversitiesViewMode,
  UniversityTableRow,
} from "@/features/universities/types";
import type { Prisma } from "@/generated/prisma/client";
import { createDocumentAccessUrl } from "@/lib/supabase/storage";

const COUNTRY_COLORS = [
  "#0b66ff",
  "#8b5cf6",
  "#ff6b7a",
  "#fbbf24",
  "#22c55e",
  "#d7deea",
] as const;

const DEFAULT_PAGE_SIZE = 500;
const MAX_SCROLL_PAGE_SIZE = 1000;

type UniversityMetrics = {
  activePartnerships: number;
  activeApplications: number;
  activePrograms: number;
  totalUniversities: number;
};

type UniversityReferenceOptions = {
  cities: string[];
  countries: string[];
  currencies: string[];
  educationLanguages: string[];
  educationLevels: string[];
  periods: string[];
  programUniversities: Array<{ label: string; value: string }>;
  programs: string[];
};

export type UniversitiesSearchParams = Record<
  string,
  string | string[] | undefined
>;

const fallbackRows: UniversityTableRow[] = [
  {
    id: "univ_istanbul_aydin",
    name: "Istanbul Aydin University",
    country: "Türkiyə",
    city: "Istanbul",
    location: "Türkiyə, Istanbul",
    logoAccessUrl: null,
    logoUrl: null,
    type: "Hazırlıq",
    partner: "Aktiv",
    agreement: "Aktiv",
    programs: 2,
    contact: "Beynİlxalq ofis",
    status: "Aktiv",
    updated: "Jun 3, 2026",
  },
  {
    id: "univ_bahcesehir",
    name: "Bahçeşehir University",
    country: "Türkiyə",
    city: "Istanbul",
    location: "Türkiyə, Istanbul",
    logoAccessUrl: null,
    logoUrl: null,
    type: "Hazırlıq",
    partner: "Aktiv",
    agreement: "Aktiv",
    programs: 1,
    contact: "Qəbul Team",
    status: "Aktiv",
    updated: "May 29, 2026",
  },
  {
    id: "univ_europe_applied_sciences",
    name: "University of Europe for Applied Sciences",
    country: "Almaniya",
    city: "Berlin",
    location: "Almaniya, Berlin",
    logoAccessUrl: null,
    logoUrl: null,
    type: "Özəl",
    partner: "Namizəd",
    agreement: "Gözləmədə",
    programs: 1,
    contact: "Regional qəbul",
    status: "Aktiv",
    updated: "May 21, 2026",
  },
  {
    id: "univ_toronto",
    name: "University of Toronto",
    country: "Kanada",
    city: "Toronto",
    location: "Kanada, Toronto",
    logoAccessUrl: null,
    logoUrl: null,
    type: "Dövlət",
    partner: "Aktiv",
    agreement: "Aktiv",
    programs: 1,
    contact: "Michael Chen",
    status: "Aktiv",
    updated: "May 5, 2026",
  },
  {
    id: "univ_ucl",
    name: "University College London",
    country: "Birləşmiş Krallıq",
    city: "London",
    location: "Birləşmiş Krallıq, London",
    logoAccessUrl: null,
    logoUrl: null,
    type: "Dövlət",
    partner: "Aktiv",
    agreement: "Müddəti bitir",
    programs: 1,
    contact: "Emma Johnson",
    status: "Aktiv",
    updated: "May 4, 2026",
  },
  {
    id: "univ_monash",
    name: "Monash University",
    country: "Avstraliya",
    city: "Melbourne",
    location: "Avstraliya, Melbourne",
    logoAccessUrl: null,
    logoUrl: null,
    type: "Dövlət",
    partner: "Aktiv",
    agreement: "Aktiv",
    programs: 1,
    contact: "David Williams",
    status: "Aktiv",
    updated: "May 3, 2026",
  },
];

const fallbackProgramRows: ProgramTableRow[] = [
  {
    id: "univ_bahcesehir_program_1",
    universityId: "univ_bahcesehir",
    universityName: "Bahçeşehir University",
    name: "Proqram mühəndisliyi",
    country: "Türkiyə",
    city: "Istanbul",
    campus: "Əsas kampus",
    level: "Bakalavr",
    language: "İngiliscə",
    duration: "4 il",
    studyMode: "Əyani",
    status: "Aktiv",
    period: "2026 Payız",
    periodStatus: "Açıq",
    tuitionFee: 8500,
    discountedTuitionFee: 6300,
    currency: "USD",
    priceStatus: "Aktiv",
    updated: "Jun 3, 2026",
  },
  {
    id: "univ_bahcesehir_program_2",
    universityId: "univ_bahcesehir",
    universityName: "Bahçeşehir University",
    name: "Biznesin idarə edilməsi",
    country: "Türkiyə",
    city: "Istanbul",
    campus: "Əsas kampus",
    level: "Magistr",
    language: "İngiliscə",
    duration: "2 il",
    studyMode: "Əyani",
    status: "Qaralama",
    period: "2026 Yaz",
    periodStatus: "Açıq",
    tuitionFee: 6200,
    discountedTuitionFee: null,
    currency: "USD",
    priceStatus: "Qaralama",
    updated: "May 29, 2026",
  },
  {
    id: "univ_istanbul_aydin_program_1",
    universityId: "univ_istanbul_aydin",
    universityName: "Istanbul Aydin University",
    name: "Stomatologiya",
    country: "Türkiyə",
    city: "Istanbul",
    campus: "Əsas kampus",
    level: "Bakalavr",
    language: "İngiliscə",
    duration: "5 il",
    studyMode: "Əyani",
    status: "Aktiv",
    period: "2026 Payız",
    periodStatus: "Açıq",
    tuitionFee: 14500,
    discountedTuitionFee: 11900,
    currency: "USD",
    priceStatus: "Aktiv",
    updated: "Jun 3, 2026",
  },
  {
    id: "univ_istanbul_aydin_program_2",
    universityId: "univ_istanbul_aydin",
    universityName: "Istanbul Aydin University",
    name: "Beynəlxalq ticarət",
    country: "Türkiyə",
    city: "Istanbul",
    campus: "Əsas kampus",
    level: "Magistr",
    language: "İngiliscə",
    duration: "2 il",
    studyMode: "Əyani",
    status: "Qaralama",
    period: "2026 Yaz",
    periodStatus: "Açıq",
    tuitionFee: 6400,
    discountedTuitionFee: null,
    currency: "USD",
    priceStatus: "Qaralama",
    updated: "Jun 1, 2026",
  },
  {
    id: "univ_europe_applied_sciences_program_1",
    universityId: "univ_europe_applied_sciences",
    universityName: "University of Europe for Applied Sciences",
    name: "İnnovasiya və dizayn idarəçiliyi",
    country: "Almaniya",
    city: "Berlin",
    campus: "Berlin kampusu",
    level: "Magistr",
    language: "İngiliscə",
    duration: "2 il",
    studyMode: "Əyani",
    status: "Aktiv",
    period: "2026 Payız",
    periodStatus: "Açıq",
    tuitionFee: 11900,
    discountedTuitionFee: 9900,
    currency: "EUR",
    priceStatus: "Aktiv",
    updated: "May 21, 2026",
  },
  {
    id: "univ_europe_applied_sciences_program_2",
    universityId: "univ_europe_applied_sciences",
    universityName: "University of Europe for Applied Sciences",
    name: "Rəqəmsal biznes",
    country: "Almaniya",
    city: "Berlin",
    campus: "Berlin kampusu",
    level: "Bakalavr",
    language: "İngiliscə",
    duration: "3 il",
    studyMode: "Hibrid",
    status: "Qaralama",
    period: "2026 Yaz",
    periodStatus: "Açıq",
    tuitionFee: 9800,
    discountedTuitionFee: null,
    currency: "EUR",
    priceStatus: "Qaralama",
    updated: "May 18, 2026",
  },
  {
    id: "univ_toronto_program_1",
    universityId: "univ_toronto",
    universityName: "University of Toronto",
    name: "Kompüter elmləri",
    country: "Kanada",
    city: "Toronto",
    campus: "St. George kampusu",
    level: "Bakalavr",
    language: "İngiliscə",
    duration: "4 il",
    studyMode: "Əyani",
    status: "Aktiv",
    period: "2026 Payız",
    periodStatus: "Açıq",
    tuitionFee: 61000,
    discountedTuitionFee: null,
    currency: "CAD",
    priceStatus: "Aktiv",
    updated: "May 5, 2026",
  },
  {
    id: "univ_ucl_program_1",
    universityId: "univ_ucl",
    universityName: "University College London",
    name: "Memarlıq",
    country: "Birləşmiş Krallıq",
    city: "London",
    campus: "Bloomsbury kampusu",
    level: "Bakalavr",
    language: "İngiliscə",
    duration: "3 il",
    studyMode: "Əyani",
    status: "Aktiv",
    period: "2025 Payız",
    periodStatus: "Bağlı",
    tuitionFee: 32100,
    discountedTuitionFee: null,
    currency: "GBP",
    priceStatus: "Müddəti bitib",
    updated: "May 4, 2026",
  },
  {
    id: "univ_monash_program_1",
    universityId: "univ_monash",
    universityName: "Monash University",
    name: "Biotibbi elm",
    country: "Avstraliya",
    city: "Melbourne",
    campus: "Clayton kampusu",
    level: "Bakalavr",
    language: "İngiliscə",
    duration: "3 il",
    studyMode: "Əyani",
    status: "Aktiv",
    period: "2026 Payız",
    periodStatus: "Açıq",
    tuitionFee: 49500,
    discountedTuitionFee: 47000,
    currency: "USD",
    priceStatus: "Aktiv",
    updated: "May 3, 2026",
  },
];

export const getUniversitiesDashboardData = cache(
  async (
    searchParams: UniversitiesSearchParams = {},
  ): Promise<UniversitiesDashboardData> => {
    const view = parseViewParam(searchParams);
    const filters = parseListFilters(searchParams);
    const programFilters = parseProgramFilters(searchParams);

    if (!hasUsableDatabaseUrl()) {
      return buildPayızbackDashboardData(view, filters, programFilters);
    }

    try {
      const { prisma } = await import("@/lib/db");
      const where = buildUniversityWhere(filters);
      const orderBy = getUniversityOrder(filters.sort);
      const skip = (filters.page - 1) * filters.pageSize;
      const programWhere = buildProgramWhere(programFilters);
      const tuitionWhere = buildProgramTuitionWhere(programFilters);
      const loadUniversityRows = view === "universities";
      const metricsPromise = getUniversityMetrics();
      const countryDataPromise = getUniversityCountryData();
      const referenceOptionsPromise = getUniversityReferenceOptions();
      const programPagePromise =
        view === "programs"
          ? getProgramPage({
              filters: programFilters,
              prisma,
              programWhere,
              tuitionWhere,
            })
          : Promise.resolve(buildEmptyProgramPage());

      const [
        universities,
        totalFilteredUniversities,
        metrics,
        countryData,
        filterOptions,
        programPage,
      ] = await Promise.all([
        loadUniversityRows
          ? prisma.university.findMany({
              where,
              orderBy,
              skip,
              take: filters.pageSize,
              include: {
                contacts: {
                  where: { status: "ACTIVE" },
                  orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }],
                  take: 1,
                },
                _count: {
                  select: {
                    programs: true,
                  },
                },
              },
            })
          : Promise.resolve([]),
        loadUniversityRows
          ? prisma.university.count({ where })
          : Promise.resolve(0),
        metricsPromise,
        countryDataPromise,
        referenceOptionsPromise,
        programPagePromise,
      ]);

      const totalPages = Math.max(
        1,
        Math.ceil(totalFilteredUniversities / filters.pageSize),
      );
      const resultStart =
        totalFilteredUniversities > 0
          ? (filters.page - 1) * filters.pageSize + 1
          : 0;
      const resultEnd =
        totalFilteredUniversities > 0
          ? Math.min(filters.page * filters.pageSize, totalFilteredUniversities)
          : 0;
      const tableRows = await Promise.all(
        universities.map(async (university) => ({
          id: university.id,
          name: university.name,
          country: university.country,
          city: university.city,
          location: `${university.country}, ${university.city}`,
          logoAccessUrl: university.logoUrl
            ? await createDocumentAccessUrl(university.logoUrl)
            : null,
          logoUrl: university.logoUrl,
          type: formatEnumLabel(university.schoolType),
          partner: formatPartnershipStatus(university.partnershipStatus),
          agreement: formatAgreementStatus(university.agreementStatus),
          programs: university._count.programs,
          contact: university.contacts[0]?.fullName ?? "Təyin edilməyib",
          status: formatEnumLabel(university.status),
          updated: formatDate(university.updatedAt),
        })),
      );

      return {
        view,
        metrics: {
          totalUniversities: metrics.totalUniversities,
          activePartnerships: metrics.activePartnerships,
          activePrograms: metrics.activePrograms,
          activeApplications: metrics.activeApplications,
        },
        countryData,
        tableRows,
        programRows: programPage.rows,
        filters,
        programFilters: { ...programFilters, page: programPage.page },
        pagination: {
          totalItems: totalFilteredUniversities,
          totalPages,
          resultStart,
          resultEnd,
        },
        programPagination: programPage.pagination,
        filterOptions,
        totalUniversities: metrics.totalUniversities,
        dataSource: "database",
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `Lokal universitet məlumatına keçilir: ${getErrorMessage(error)}`,
        );
      }
      return buildPayızbackDashboardData(view, filters, programFilters);
    }
  },
);

async function getUniversityMetrics(): Promise<UniversityMetrics> {
  const { prisma } = await import("@/lib/db");
  const [metrics] = await prisma.$queryRaw<UniversityMetrics[]>`
    select
      (
        select count(*)::int
        from public.universities
        where status = 'ACTIVE'
      ) as "totalUniversities",
      (
        select count(*)::int
        from public.universities
        where status = 'ACTIVE'
          and partnership_status = 'ACTIVE_PARTNER'
      ) as "activePartnerships",
      (
        select count(*)::int
        from public.programs
        where status = 'ACTIVE'
      ) as "activePrograms",
      (
        select count(*)::int
        from public.applications
        where status in ('SUBMITTED', 'UNDER_REVIEW', 'OFFER')
      ) as "activeApplications"
  `;

  return (
    metrics ?? {
      activeApplications: 0,
      activePartnerships: 0,
      activePrograms: 0,
      totalUniversities: 0,
    }
  );
}

const getUniversityCountryData = unstable_cache(
  async (): Promise<CountryChartDatum[]> => {
    const { prisma } = await import("@/lib/db");
    const rows = await prisma.$queryRaw<Array<{ name: string; value: number }>>`
      select country as name, count(*)::int as value
      from public.universities
      where status = 'ACTIVE'
      group by country
      order by count(*) desc, country asc
    `;

    return buildCountryData(rows);
  },
  ["universities-country-data"],
  {
    revalidate: 120,
    tags: ["universities:metrics"],
  },
);

const getUniversityReferenceOptions = unstable_cache(
  async (): Promise<UniversityReferenceOptions> => {
    const { prisma } = await import("@/lib/db");
    const [row] = await prisma.$queryRaw<
      Array<{
        cities: unknown;
        countries: unknown;
        currencies: unknown;
        educationLanguages: unknown;
        educationLevels: unknown;
        periods: unknown;
        programUniversities: unknown;
        programs: unknown;
      }>
    >`
      select
        (
          select coalesce(jsonb_agg(country order by country), '[]'::jsonb)
          from (
            select distinct country
            from public.universities
            where country is not null
          ) countries
        ) as countries,
        (
          select coalesce(jsonb_agg(city order by city), '[]'::jsonb)
          from (
            select distinct city
            from public.universities
            where city is not null
          ) cities
        ) as cities,
        (
          select coalesce(jsonb_agg(name order by name), '[]'::jsonb)
          from (
            select distinct name
            from public.programs
            where name is not null
          ) programs
        ) as programs,
        (
          select coalesce(
            jsonb_agg(jsonb_build_object('label', name, 'value', id) order by name),
            '[]'::jsonb
          )
          from public.universities
        ) as "programUniversities",
        (
          select coalesce(jsonb_agg(name order by sort_order, name), '[]'::jsonb)
          from public.education_levels
          where status = 'ACTIVE'
        ) as "educationLevels",
        (
          select coalesce(jsonb_agg(name order by sort_order, name), '[]'::jsonb)
          from public.education_languages
          where status = 'ACTIVE'
        ) as "educationLanguages",
        (
          select coalesce(jsonb_agg(name order by year desc, season asc), '[]'::jsonb)
          from public.periods
        ) as periods,
        (
          select coalesce(jsonb_agg(currency order by currency), '[]'::jsonb)
          from (
            select distinct currency
            from public.program_tuitions
            where currency is not null
          ) currencies
        ) as currencies
    `;

    return {
      cities: readStringArray(row?.cities),
      countries: readStringArray(row?.countries),
      currencies: readStringArray(row?.currencies),
      educationLanguages: readStringArray(row?.educationLanguages),
      educationLevels: readStringArray(row?.educationLevels),
      periods: readStringArray(row?.periods),
      programUniversities: readProgramUniversityOptions(
        row?.programUniversities,
      ),
      programs: readStringArray(row?.programs),
    };
  },
  ["universities-reference-options"],
  {
    revalidate: 300,
    tags: ["universities:reference"],
  },
);

function readStringArray(value: unknown) {
  return readJsonArray<unknown>(value).filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
}

function readProgramUniversityOptions(value: unknown) {
  return readJsonArray<unknown>(value).filter(
    (item): item is { label: string; value: string } => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const option = item as { label?: unknown; value?: unknown };

      return (
        typeof option.label === "string" && typeof option.value === "string"
      );
    },
  );
}

function readJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  return [];
}

function buildPayızbackDashboardData(
  view: UniversitiesViewMode,
  filters: UniversitiesListFilters,
  programFilters: ProgramListFilters,
): UniversitiesDashboardData {
  const filteredRows = filterPayızbackRows(fallbackRows, filters);
  const sortedRows = sortPayızbackRows(filteredRows, filters.sort);
  const totalItems = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const safePage = Math.min(filters.page, totalPages);
  const startIndex = (safePage - 1) * filters.pageSize;
  const paginatedRows = sortedRows.slice(
    startIndex,
    startIndex + filters.pageSize,
  );
  const countryCounts = new Map<string, number>();
  const filteredProgramRows = filterPayızbackProgramRows(
    fallbackProgramRows,
    programFilters,
  );
  const sortedProgramRows = sortProgramRows(
    filteredProgramRows,
    programFilters.sort,
  );
  const programPage = paginateRows(
    sortedProgramRows,
    programFilters.page,
    programFilters.pageSize,
  );

  for (const row of fallbackRows) {
    countryCounts.set(row.country, (countryCounts.get(row.country) ?? 0) + 1);
  }

  return {
    view,
    metrics: {
      totalUniversities: fallbackRows.length,
      activePartnerships: fallbackRows.filter((row) => row.partner === "Aktiv")
        .length,
      activePrograms: fallbackProgramRows.filter(
        (row) => row.status === "Aktiv",
      ).length,
      activeApplications: fallbackProgramRows.filter(
        (row) => row.status === "Aktiv",
      ).length,
    },
    countryData: buildCountryData(
      Array.from(countryCounts, ([name, value]) => ({ name, value })),
    ),
    tableRows: paginatedRows,
    programRows: programPage.rows,
    filters: { ...filters, page: safePage },
    programFilters: { ...programFilters, page: programPage.page },
    pagination: {
      totalItems,
      totalPages,
      resultStart: totalItems > 0 ? startIndex + 1 : 0,
      resultEnd:
        totalItems > 0
          ? Math.min(startIndex + filters.pageSize, totalItems)
          : 0,
    },
    programPagination: programPage.pagination,
    filterOptions: {
      countries: Array.from(
        new Set(fallbackRows.map((row) => row.country)),
      ).sort(),
      cities: Array.from(new Set(fallbackRows.map((row) => row.city))).sort(),
      programs: Array.from(
        new Set(fallbackProgramRows.map((row) => row.name)),
      ).sort(),
      currencies: Array.from(
        new Set(fallbackProgramRows.map((row) => row.currency)),
      ).sort(),
      educationLanguages: Array.from(
        new Set(fallbackProgramRows.map((row) => row.language)),
      ).sort(),
      educationLevels: Array.from(
        new Set(fallbackProgramRows.map((row) => row.level)),
      ).sort(),
      periods: Array.from(
        new Set(fallbackProgramRows.map((row) => row.period)),
      ),
      programUniversities: fallbackRows
        .map((row) => ({ label: row.name, value: row.id }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    },
    totalUniversities: fallbackRows.length,
    dataSource: "fallback",
  };
}

function buildUniversityWhere(
  filters: UniversitiesListFilters,
): Prisma.UniversityWhereInput {
  const and: Prisma.UniversityWhereInput[] = [];

  if (filters.status !== "all") {
    and.push({
      status: filters.status as Prisma.EnumEntityStatusFilter["equals"],
    });
  }

  if (filters.country !== "all") {
    and.push({ country: filters.country });
  }

  if (filters.city !== "all") {
    and.push({ city: filters.city });
  }

  const programAnd: Prisma.ProgramWhereInput[] = [];

  if (filters.program !== "all") {
    programAnd.push({ name: filters.program });
  }

  if (filters.language !== "all") {
    programAnd.push({ educationLanguage: { name: filters.language } });
  }

  if (programAnd.length > 0) {
    and.push({
      programs: {
        some: programAnd.length === 1 ? programAnd[0] : { AND: programAnd },
      },
    });
  }

  if (filters.schoolType !== "all") {
    and.push({
      schoolType: filters.schoolType as Prisma.EnumSchoolTypeFilter["equals"],
    });
  }

  if (filters.partnershipStatus !== "all") {
    and.push({
      partnershipStatus:
        filters.partnershipStatus as Prisma.EnumPartnershipStatusFilter["equals"],
    });
  }

  if (filters.agreementStatus !== "all") {
    and.push({
      agreementStatus:
        filters.agreementStatus as Prisma.EnumAgreementStatusNullableFilter["equals"],
    });
  }

  if (filters.query) {
    and.push({
      OR: [
        { name: { contains: filters.query, mode: "insensitive" } },
        { country: { contains: filters.query, mode: "insensitive" } },
        { city: { contains: filters.query, mode: "insensitive" } },
        { mainEmail: { contains: filters.query, mode: "insensitive" } },
        {
          programs: {
            some: {
              OR: [
                { name: { contains: filters.query, mode: "insensitive" } },
                {
                  educationLanguage: {
                    name: { contains: filters.query, mode: "insensitive" },
                  },
                },
              ],
            },
          },
        },
        {
          contacts: {
            some: {
              OR: [
                { fullName: { contains: filters.query, mode: "insensitive" } },
                { email: { contains: filters.query, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    });
  }

  if (filters.contactQuery) {
    and.push({
      OR: [
        { mainEmail: { contains: filters.contactQuery, mode: "insensitive" } },
        { mainPhone: { contains: filters.contactQuery, mode: "insensitive" } },
        {
          contacts: {
            some: {
              OR: [
                {
                  fullName: {
                    contains: filters.contactQuery,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: filters.contactQuery,
                    mode: "insensitive",
                  },
                },
                {
                  phone: {
                    contains: filters.contactQuery,
                    mode: "insensitive",
                  },
                },
                {
                  whatsapp: {
                    contains: filters.contactQuery,
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

function buildProgramWhere(
  filters: ProgramListFilters,
): Prisma.ProgramWhereInput {
  const and: Prisma.ProgramWhereInput[] = [];

  if (filters.programStatus !== "all") {
    and.push({
      status: filters.programStatus as Prisma.EnumProgramStatusFilter["equals"],
    });
  }

  if (filters.universityId !== "all") {
    and.push({ universityId: filters.universityId });
  }

  if (filters.program !== "all") {
    and.push({ name: filters.program });
  }

  if (filters.country !== "all") {
    and.push({ university: { country: filters.country } });
  }

  if (filters.city !== "all") {
    and.push({ university: { city: filters.city } });
  }

  if (filters.level !== "all") {
    and.push({ educationLevel: { name: filters.level } });
  }

  if (filters.language !== "all") {
    and.push({ educationLanguage: { name: filters.language } });
  }

  const tuitionWhere = buildProgramTuitionWhere(filters);

  if (Object.keys(tuitionWhere).length > 0) {
    and.push({ tuitions: { some: tuitionWhere } });
  }

  if (filters.query) {
    and.push({
      OR: [
        { name: { contains: filters.query, mode: "insensitive" } },
        { duration: { contains: filters.query, mode: "insensitive" } },
        { studyMode: { contains: filters.query, mode: "insensitive" } },
        {
          university: {
            name: { contains: filters.query, mode: "insensitive" },
          },
        },
        {
          university: {
            country: { contains: filters.query, mode: "insensitive" },
          },
        },
        {
          university: {
            city: { contains: filters.query, mode: "insensitive" },
          },
        },
        { campus: { name: { contains: filters.query, mode: "insensitive" } } },
        {
          educationLevel: {
            name: { contains: filters.query, mode: "insensitive" },
          },
        },
        {
          educationLanguage: {
            name: { contains: filters.query, mode: "insensitive" },
          },
        },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

function buildProgramTuitionWhere(
  filters: ProgramListFilters,
): Prisma.ProgramTuitionWhereInput {
  const and: Prisma.ProgramTuitionWhereInput[] = [];

  if (filters.periodStatus !== "all") {
    and.push({
      period: {
        status: filters.periodStatus as Prisma.EnumPeriodStatusFilter["equals"],
      },
    });
  }

  if (filters.priceStatus !== "all") {
    and.push({
      priceStatus:
        filters.priceStatus as Prisma.EnumPriceStatusFilter["equals"],
    });
  }

  if (filters.currency !== "all") {
    and.push({ currency: filters.currency });
  }

  if (filters.discount === "discounted") {
    and.push({ discountedTuitionFee: { not: null } });
  }

  if (filters.discount === "standard") {
    and.push({ discountedTuitionFee: null });
  }

  if (filters.tuitionMin !== null || filters.tuitionMax !== null) {
    and.push({
      tuitionFee: {
        ...(filters.tuitionMin !== null ? { gte: filters.tuitionMin } : {}),
        ...(filters.tuitionMax !== null ? { lte: filters.tuitionMax } : {}),
      },
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

function getUniversityOrder(
  sort: UniversitiesListSort,
): Prisma.UniversityOrderByWithRelationInput[] {
  if (sort === "name-asc") {
    return [{ name: "asc" }];
  }

  if (sort === "programs-desc") {
    return [{ programs: { _count: "desc" } }, { name: "asc" }];
  }

  return [{ updatedAt: "desc" }, { name: "asc" }];
}

function getProgramOrder(
  sort: ProgramListSort,
): Prisma.ProgramOrderByWithRelationInput[] {
  if (sort === "name-asc") {
    return [{ name: "asc" }];
  }

  return [{ updatedAt: "desc" }, { name: "asc" }];
}

type ProgramPageResult = {
  page: number;
  pagination: UniversitiesListPagination;
  rows: ProgramTableRow[];
};

async function getProgramPage({
  filters,
  prisma,
  programWhere,
  tuitionWhere,
}: {
  filters: ProgramListFilters;
  prisma: (typeof import("@/lib/db"))["prisma"];
  programWhere: Prisma.ProgramWhereInput;
  tuitionWhere: Prisma.ProgramTuitionWhereInput;
}): Promise<ProgramPageResult> {
  const totalItems = await prisma.program.count({ where: programWhere });
  const totalPages = Math.max(1, Math.ceil(totalItems / filters.pageSize));
  const safePage = Math.min(filters.page, totalPages);

  if (totalItems === 0) {
    return buildEmptyProgramPage();
  }

  if (filters.sort === "tuition-asc" || filters.sort === "tuition-desc") {
    const programRecords = await prisma.program.findMany({
      where: programWhere,
      include: {
        campus: true,
        educationLanguage: true,
        educationLevel: true,
        tuitions: {
          where: tuitionWhere,
          orderBy: [{ lastUpdatedAt: "desc" }],
          include: {
            period: true,
          },
        },
        university: true,
      },
    });
    const sortedRows = sortProgramRows(
      programRecords.map(mapProgramRecord),
      filters.sort,
    );

    return paginateRows(sortedRows, safePage, filters.pageSize);
  }

  const startIndex = (safePage - 1) * filters.pageSize;
  const programRecords = await prisma.program.findMany({
    where: programWhere,
    orderBy: getProgramOrder(filters.sort),
    skip: startIndex,
    take: filters.pageSize,
    include: {
      campus: true,
      educationLanguage: true,
      educationLevel: true,
      tuitions: {
        where: tuitionWhere,
        orderBy: [{ lastUpdatedAt: "desc" }],
        include: {
          period: true,
        },
      },
      university: true,
    },
  });

  return {
    page: safePage,
    pagination: {
      totalItems,
      totalPages,
      resultStart: startIndex + 1,
      resultEnd: Math.min(startIndex + filters.pageSize, totalItems),
    },
    rows: programRecords.map(mapProgramRecord),
  };
}

function buildEmptyProgramPage(): ProgramPageResult {
  return {
    page: 1,
    pagination: {
      totalItems: 0,
      totalPages: 1,
      resultStart: 0,
      resultEnd: 0,
    },
    rows: [],
  };
}

function parseListFilters(
  searchParams: UniversitiesSearchParams,
): UniversitiesListFilters {
  const page = clampNumber(readParam(searchParams, "page"), 1, 999, 1);
  const pageSize = clampNumber(
    readParam(searchParams, "pageSize"),
    5,
    MAX_SCROLL_PAGE_SIZE,
    DEFAULT_PAGE_SIZE,
  );

  return {
    query: readParam(searchParams, "q").trim(),
    country: readParam(searchParams, "country") || "all",
    city: readParam(searchParams, "city") || "all",
    program: readParam(searchParams, "program") || "all",
    language: readParam(searchParams, "language") || "all",
    contactQuery: readParam(searchParams, "contact").trim(),
    schoolType: parseEnumParam(searchParams, "schoolType", SCHOOL_TYPES),
    partnershipStatus: parseEnumParam(
      searchParams,
      "partnershipStatus",
      PARTNERSHIP_STATUSES,
    ),
    agreementStatus: parseEnumParam(
      searchParams,
      "agreementStatus",
      AGREEMENT_STATUSES,
    ),
    status: parseEnumParam(searchParams, "status", ENTITY_STATUSES),
    sort: parseSortParam(searchParams),
    page,
    pageSize,
  };
}

function parseViewParam(
  searchParams: UniversitiesSearchParams,
): UniversitiesViewMode {
  return readParam(searchParams, "view") === "programs"
    ? "programs"
    : "universities";
}

function parseProgramFilters(
  searchParams: UniversitiesSearchParams,
): ProgramListFilters {
  const page = clampNumber(readParam(searchParams, "page"), 1, 999, 1);
  const pageSize = clampNumber(
    readParam(searchParams, "pageSize"),
    5,
    MAX_SCROLL_PAGE_SIZE,
    DEFAULT_PAGE_SIZE,
  );

  return {
    query: readParam(searchParams, "q").trim(),
    program: readParam(searchParams, "program") || "all",
    country: readParam(searchParams, "country") || "all",
    city: readParam(searchParams, "city") || "all",
    universityId: readParam(searchParams, "programUniversity") || "all",
    level: readParam(searchParams, "level") || "all",
    language: readParam(searchParams, "language") || "all",
    programStatus: parseEnumParam(
      searchParams,
      "programStatus",
      PROGRAM_STATUSES,
    ),
    periodStatus: parseEnumParam(searchParams, "periodStatus", PERIOD_STATUSES),
    priceStatus: parseEnumParam(searchParams, "priceStatus", PRICE_STATUSES),
    currency: parseEnumParam(searchParams, "currency", CURRENCIES),
    discount: parseDiscountParam(searchParams),
    tuitionMin: parseOptionalNumber(searchParams, "tuitionMin"),
    tuitionMax: parseOptionalNumber(searchParams, "tuitionMax"),
    sort: parseProgramSortParam(searchParams),
    page,
    pageSize,
  };
}

function parseEnumParam<T extends readonly string[]>(
  searchParams: UniversitiesSearchParams,
  key: string,
  values: T,
) {
  const value = readParam(searchParams, key);
  if (value && values.includes(value)) {
    return value;
  }

  return "all";
}

function parseSortParam(
  searchParams: UniversitiesSearchParams,
): UniversitiesListSort {
  const value = readParam(searchParams, "sort");
  if (value === "name-asc" || value === "programs-desc") {
    return value;
  }

  return "updated-desc";
}

function parseProgramSortParam(
  searchParams: UniversitiesSearchParams,
): ProgramListSort {
  const value = readParam(searchParams, "programSort");

  if (
    value === "name-asc" ||
    value === "tuition-asc" ||
    value === "tuition-desc"
  ) {
    return value;
  }

  return "updated-desc";
}

function parseDiscountParam(
  searchParams: UniversitiesSearchParams,
): ProgramDiscountFilter {
  const value = readParam(searchParams, "discount");
  if (value === "discounted" || value === "standard") {
    return value;
  }

  return "all";
}

function parseOptionalNumber(
  searchParams: UniversitiesSearchParams,
  key: string,
) {
  const value = readParam(searchParams, key).trim();

  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

function readParam(searchParams: UniversitiesSearchParams, key: string) {
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

function filterPayızbackRows(
  rows: UniversityTableRow[],
  filters: UniversitiesListFilters,
) {
  return rows.filter((row) => {
    const normalizedQuery = filters.query.toLowerCase();
    const universityPrograms = fallbackProgramRows.filter(
      (program) => program.universityId === row.id,
    );

    if (
      normalizedQuery &&
      ![
        row.name,
        row.location,
        row.type,
        row.contact,
        ...universityPrograms.flatMap((program) => [
          program.name,
          program.language,
        ]),
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    ) {
      return false;
    }

    if (filters.country !== "all" && row.country !== filters.country) {
      return false;
    }

    if (filters.city !== "all" && row.city !== filters.city) {
      return false;
    }

    if (filters.program !== "all" || filters.language !== "all") {
      const hasMatchingProgram = universityPrograms.some((program) => {
        if (filters.program !== "all" && program.name !== filters.program) {
          return false;
        }

        return (
          filters.language === "all" || program.language === filters.language
        );
      });

      if (!hasMatchingProgram) {
        return false;
      }
    }

    if (
      filters.contactQuery &&
      !row.contact.toLowerCase().includes(filters.contactQuery.toLowerCase())
    ) {
      return false;
    }

    if (
      filters.schoolType !== "all" &&
      row.type.toLowerCase() !==
        formatEnumLabel(filters.schoolType).toLowerCase()
    ) {
      return false;
    }

    if (
      filters.partnershipStatus !== "all" &&
      row.partner.toLowerCase() !==
        formatPartnershipStatus(filters.partnershipStatus).toLowerCase()
    ) {
      return false;
    }

    if (
      filters.agreementStatus !== "all" &&
      row.agreement.toLowerCase() !==
        formatAgreementStatus(filters.agreementStatus).toLowerCase()
    ) {
      return false;
    }

    return filters.status === "all" || row.status.toLowerCase() === "active";
  });
}

function sortPayızbackRows(
  rows: UniversityTableRow[],
  sort: UniversitiesListSort,
) {
  return [...rows].sort((a, b) => {
    if (sort === "name-asc") {
      return a.name.localeCompare(b.name);
    }

    if (sort === "programs-desc") {
      return b.programs - a.programs;
    }

    return b.updated.localeCompare(a.updated);
  });
}

function filterPayızbackProgramRows(
  rows: ProgramTableRow[],
  filters: ProgramListFilters,
) {
  return rows.filter((row) => {
    const normalizedQuery = filters.query.toLowerCase();

    if (
      normalizedQuery &&
      ![
        row.name,
        row.universityName,
        row.country,
        row.city,
        row.campus,
        row.level,
        row.language,
        row.status,
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    ) {
      return false;
    }

    if (filters.country !== "all" && row.country !== filters.country) {
      return false;
    }

    if (filters.city !== "all" && row.city !== filters.city) {
      return false;
    }

    if (filters.program !== "all" && row.name !== filters.program) {
      return false;
    }

    if (
      filters.universityId !== "all" &&
      row.universityId !== filters.universityId
    ) {
      return false;
    }

    if (filters.level !== "all" && row.level !== filters.level) {
      return false;
    }

    if (filters.language !== "all" && row.language !== filters.language) {
      return false;
    }

    if (
      filters.programStatus !== "all" &&
      row.status.toLowerCase() !==
        formatEnumLabel(filters.programStatus).toLowerCase()
    ) {
      return false;
    }

    if (
      filters.periodStatus !== "all" &&
      row.periodStatus.toLowerCase() !==
        formatEnumLabel(filters.periodStatus).toLowerCase()
    ) {
      return false;
    }

    if (
      filters.priceStatus !== "all" &&
      row.priceStatus.toLowerCase() !==
        formatEnumLabel(filters.priceStatus).toLowerCase()
    ) {
      return false;
    }

    if (filters.currency !== "all" && row.currency !== filters.currency) {
      return false;
    }

    if (filters.discount === "discounted" && !row.discountedTuitionFee) {
      return false;
    }

    if (filters.discount === "standard" && row.discountedTuitionFee) {
      return false;
    }

    if (
      filters.tuitionMin !== null &&
      (row.tuitionFee ?? 0) < filters.tuitionMin
    ) {
      return false;
    }

    if (
      filters.tuitionMax !== null &&
      (row.tuitionFee ?? 0) > filters.tuitionMax
    ) {
      return false;
    }

    return true;
  });
}

function mapProgramRecord(
  program: Prisma.ProgramGetPayload<{
    include: {
      campus: true;
      educationLanguage: true;
      educationLevel: true;
      tuitions: { include: { period: true } };
      university: true;
    };
  }>,
): ProgramTableRow {
  const tuition = program.tuitions[0] ?? null;

  return {
    id: program.id,
    tuitionId: tuition?.id ?? null,
    universityId: program.universityId,
    universityName: program.university.name,
    name: program.name,
    country: program.university.country,
    city: program.university.city,
    campus: program.campus?.name ?? "Təyin edilməyib",
    level: program.educationLevel.name,
    language: program.educationLanguage.name,
    duration: program.duration ?? "Təyin edilməyib",
    studyMode: program.studyMode ?? "Təyin edilməyib",
    status: formatEnumLabel(program.status),
    period: tuition?.period.name ?? "Qəbul yoxdur",
    periodStatus: tuition
      ? formatEnumLabel(tuition.period.status)
      : "Dönəm yoxdur",
    tuitionFee: tuition ? Number(tuition.tuitionFee) : null,
    discountedTuitionFee: tuition?.discountedTuitionFee
      ? Number(tuition.discountedTuitionFee)
      : null,
    currency: tuition?.currency ?? "-",
    priceStatus: tuition
      ? formatEnumLabel(tuition.priceStatus)
      : "Qiymət yoxdur",
    updated: formatDate(program.updatedAt),
  };
}

function sortProgramRows(rows: ProgramTableRow[], sort: ProgramListSort) {
  return [...rows].sort((a, b) => {
    if (sort === "name-asc") {
      return a.name.localeCompare(b.name);
    }

    if (sort === "tuition-asc") {
      return (
        (a.tuitionFee ?? Number.MAX_SAFE_INTEGER) -
        (b.tuitionFee ?? Number.MAX_SAFE_INTEGER)
      );
    }

    if (sort === "tuition-desc") {
      return (b.tuitionFee ?? 0) - (a.tuitionFee ?? 0);
    }

    return b.updated.localeCompare(a.updated);
  });
}

function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedRows = rows.slice(startIndex, startIndex + pageSize);
  const pagination: UniversitiesListPagination = {
    totalItems,
    totalPages,
    resultStart: totalItems > 0 ? startIndex + 1 : 0,
    resultEnd: totalItems > 0 ? Math.min(startIndex + pageSize, totalItems) : 0,
  };

  return { page: safePage, pagination, rows: paginatedRows };
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

function buildCountryData(
  items: Array<{ name: string; value: number }>,
): CountryChartDatum[] {
  return items.map((item, index) => ({
    ...item,
    color: COUNTRY_COLORS[index] ?? COUNTRY_COLORS[COUNTRY_COLORS.length - 1],
  }));
}

export function formatEnumLabel(value: string) {
  const labels: Record<string, string> = {
    ACCEPTED: "Qəbul edildi",
    ACTIVE: "Aktiv",
    ACTIVE_PARTNER: "Aktiv tərəfdaş",
    AMOUNT: "Məbləğ",
    APPLIED: "Müraciət edildi",
    ARCHIVED: "Arxivləndi",
    DRAFT: "Qaralama",
    DOCUMENTS_PENDING: "Sənədlər gözlənilir",
    EXPIRED: "Müddəti bitib",
    NONE: "Yoxdur",
    OPEN: "Açıq",
    PERCENTAGE: "Faiz",
    PRIVATE: "Özəl",
    PROSPECT: "Namizəd",
    PUBLIC: "Dövlət",
    SUSPENDED: "Dayandırılıb",
    UNDER_REVIEW: "Baxılır",
  };

  if (labels[value]) {
    return labels[value];
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPartnershipStatus(value: string) {
  if (value === "ACTIVE_PARTNER") {
    return "Aktiv tərəfdaş";
  }

  return formatEnumLabel(value);
}

export function formatAgreementStatus(value: string | null) {
  if (!value || value === "NONE") {
    return "Yoxdur";
  }

  if (value === "EXPIRED") {
    return "Müddəti bitir";
  }

  return formatEnumLabel(value);
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("az-AZ", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}
