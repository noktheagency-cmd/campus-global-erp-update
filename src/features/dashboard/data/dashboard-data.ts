import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/db";
import type {
  AdminDashboardData,
  DashboardApplication,
  DashboardDestination,
  DashboardRange,
  DashboardTask,
  DashboardTrendPoint,
} from "@/features/dashboard/types";

const DESTINATION_COLORS = [
  "#2f7df6",
  "#4ed08a",
  "#8b5cf6",
  "#fb7185",
  "#fbbf24",
  "#d7dee8",
];

const OFFER_STATUSES = ["OFFER", "ACCEPTED", "ENROLLED"] as const;
const ACTIVE_APPLICATION_STATUSES = [
  "SUBMITTED",
  "INVALID_DOCUMENTS",
  "UNDER_REVIEW",
  "OFFER",
] as const;

export const getAdminDashboardData = cache(
  async (requestedRange: string | undefined): Promise<AdminDashboardData> => {
    const range = parseRange(requestedRange);

    if (!hasUsableDatabaseUrl()) {
      return buildFallbackDashboardData(range);
    }

    try {
      const now = new Date();
      const start = startOfDay(addDays(now, -(getRangeDays(range) - 1)));
      const [
        totalStudents,
        applicationStatusRows,
        totalOffers,
        studentEvents,
        applicationEvents,
        offerEvents,
        revenueTotals,
        revenueEvents,
        destinationRows,
        recentRows,
        taskRows,
      ] = await Promise.all([
        prisma.student.count({ where: { status: "ACTIVE" } }),
        prisma.application.groupBy({
          _count: { _all: true },
          by: ["status"],
          where: { status: { not: "ARCHIVED" } },
        }),
        prisma.applicationChoice.count({
          where: { status: { in: [...OFFER_STATUSES] } },
        }),
        prisma.student.findMany({
          select: { createdAt: true },
          where: { createdAt: { gte: start }, status: "ACTIVE" },
        }),
        prisma.application.findMany({
          select: { createdAt: true, status: true },
          where: {
            createdAt: { gte: start },
            status: { not: "ARCHIVED" },
          },
        }),
        prisma.applicationChoice.findMany({
          select: { updatedAt: true },
          where: {
            status: { in: [...OFFER_STATUSES] },
            updatedAt: { gte: start },
          },
        }),
        prisma.serviceOrder.groupBy({
          _sum: { totalAmount: true },
          by: ["currency"],
          where: { status: "COMPLETED" },
        }),
        prisma.serviceOrder.findMany({
          select: { createdAt: true, currency: true, totalAmount: true },
          where: { createdAt: { gte: start }, status: "COMPLETED" },
        }),
        prisma.application.groupBy({
          _count: { country: true },
          by: ["country"],
          where: { status: { not: "ARCHIVED" } },
        }),
        prisma.application.findMany({
          orderBy: { updatedAt: "desc" },
          select: {
            choices: {
              orderBy: { priority: "asc" },
              select: {
                program: { select: { name: true } },
                university: { select: { name: true } },
              },
              take: 1,
            },
            code: true,
            id: true,
            status: true,
            student: { select: { firstName: true, lastName: true } },
            updatedAt: true,
          },
          take: 4,
          where: { status: { not: "ARCHIVED" } },
        }),
        prisma.application.findMany({
          orderBy: { updatedAt: "desc" },
          select: {
            _count: {
              select: {
                documents: {
                  where: { status: { in: ["MISSING", "INVALID"] } },
                },
              },
            },
            code: true,
            id: true,
            status: true,
            student: { select: { firstName: true, lastName: true } },
            updatedAt: true,
          },
          take: 4,
          where: { status: { in: [...ACTIVE_APPLICATION_STATUSES] } },
        }),
      ]);

      const totalApplications = sumStatusCounts(applicationStatusRows);
      const enrolledApplications = getStatusCount(
        applicationStatusRows,
        "ENROLLED",
      );
      const rejectedApplications = getStatusCount(
        applicationStatusRows,
        "REJECTED",
      );
      const revenueCurrency = getPrimaryCurrency(revenueTotals);
      const revenueOrders = revenueEvents.filter(
        (order) => order.currency === revenueCurrency,
      );
      const totalRevenue = getRevenueTotal(revenueTotals, revenueCurrency);
      const visaBase = enrolledApplications + rejectedApplications;
      const visaSuccess = visaBase
        ? Number(((enrolledApplications / visaBase) * 100).toFixed(1))
        : 0;
      const trend = buildTrend({
        applicationEvents,
        now,
        offerEvents,
        range,
        revenueOrders,
        studentEvents,
        totalApplications,
        totalOffers,
        totalStudents,
      });

      return {
        dataSource: "database",
        dateRangeLabel: formatDashboardRangeLabel(range, now),
        destinations: buildDestinations(destinationRows),
        metrics: {
          applications: buildMetric(
            totalApplications,
            trend.map((point) => point.applications),
          ),
          offers: buildMetric(
            totalOffers,
            trend.map((point) => point.offers),
          ),
          revenue: {
            ...buildMetric(
              totalRevenue,
              trend.map((point) => point.revenue),
            ),
            currency: revenueCurrency,
          },
          students: buildMetric(
            totalStudents,
            trend.map((point) => point.students),
          ),
          visaSuccess: buildMetric(
            visaSuccess,
            trend.map((point) => point.visas),
          ),
        },
        range,
        recentApplications: recentRows.map((application) => {
          const choice = application.choices[0];

          return {
            code: application.code,
            id: application.id,
            programName: choice?.program.name ?? "Proqram seçilməyib",
            status: formatApplicationStatus(application.status),
            statusCode: application.status,
            studentName: getFullName(application.student),
            universityName: choice?.university.name ?? application.code,
            updatedAt: formatShortDate(application.updatedAt),
          } satisfies DashboardApplication;
        }),
        tasks: taskRows.map((application, index) =>
          mapTask(application, index),
        ),
        trend,
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `Dashboard üçün lokal məlumatlara keçid edildi: ${getErrorMessage(error)}`,
        );
      }

      return buildFallbackDashboardData(range);
    }
  },
);

function buildTrend({
  applicationEvents,
  now,
  offerEvents,
  range,
  revenueOrders,
  studentEvents,
  totalApplications,
  totalOffers,
  totalStudents,
}: {
  applicationEvents: Array<{ createdAt: Date; status: string }>;
  now: Date;
  offerEvents: Array<{ updatedAt: Date }>;
  range: DashboardRange;
  revenueOrders: Array<{ createdAt: Date; totalAmount: unknown }>;
  studentEvents: Array<{ createdAt: Date }>;
  totalApplications: number;
  totalOffers: number;
  totalStudents: number;
}) {
  const days = getRangeDays(range);
  const visiblePoints = range === "90d" ? 15 : range === "30d" ? 15 : 7;
  const bucketSize = Math.ceil(days / visiblePoints);
  const rangeStart = startOfDay(addDays(now, -(days - 1)));
  const firstDayNumber = getCalendarDayNumber(rangeStart);
  const buckets = Array.from(
    { length: Math.ceil(days / bucketSize) },
    (_, index) => ({
      applications: 0,
      enrolled: 0,
      offers: 0,
      rejected: 0,
      revenue: 0,
      students: 0,
      end: endOfDay(
        addDays(
          rangeStart,
          Math.min(days - 1, index * bucketSize + bucketSize - 1),
        ),
      ),
    }),
  );
  const points: DashboardTrendPoint[] = [];
  const totalNewStudents = studentEvents.length;
  const totalNewApplications = applicationEvents.length;
  const totalNewOffers = offerEvents.length;
  let students = Math.max(0, totalStudents - totalNewStudents);
  let applications = Math.max(0, totalApplications - totalNewApplications);
  let offers = Math.max(0, totalOffers - totalNewOffers);

  for (const item of studentEvents) {
    const bucket = getTrendBucket(
      buckets,
      item.createdAt,
      firstDayNumber,
      bucketSize,
    );
    if (bucket) bucket.students += 1;
  }

  for (const item of applicationEvents) {
    const bucket = getTrendBucket(
      buckets,
      item.createdAt,
      firstDayNumber,
      bucketSize,
    );
    if (!bucket) continue;
    bucket.applications += 1;
    if (item.status === "ENROLLED") bucket.enrolled += 1;
    if (item.status === "REJECTED") bucket.rejected += 1;
  }

  for (const item of offerEvents) {
    const bucket = getTrendBucket(
      buckets,
      item.updatedAt,
      firstDayNumber,
      bucketSize,
    );
    if (bucket) bucket.offers += 1;
  }

  for (const item of revenueOrders) {
    const bucket = getTrendBucket(
      buckets,
      item.createdAt,
      firstDayNumber,
      bucketSize,
    );
    if (bucket) bucket.revenue += Number(item.totalAmount);
  }

  for (const bucket of buckets) {
    students += bucket.students;
    applications += bucket.applications;
    offers += bucket.offers;
    const decided = bucket.enrolled + bucket.rejected;
    const visaRatio = decided
      ? bucket.enrolled / decided
      : 0.8;
    const visas = Math.round(applications * (0.14 + visaRatio * 0.06));

    points.push({
      applications,
      label: formatTrendDate(bucket.end),
      offers,
      revenue: bucket.revenue,
      students,
      visas,
    });
  }

  return points;
}

function getTrendBucket<T>(
  buckets: T[],
  date: Date,
  firstDayNumber: number,
  bucketSize: number,
) {
  const dayIndex = getCalendarDayNumber(date) - firstDayNumber;
  const bucketIndex = Math.floor(dayIndex / bucketSize);

  return bucketIndex >= 0 && bucketIndex < buckets.length
    ? buckets[bucketIndex]
    : undefined;
}

function getCalendarDayNumber(value: Date) {
  return Math.floor(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86_400_000,
  );
}

function buildFallbackDashboardData(range: DashboardRange): AdminDashboardData {
  const days = getRangeDays(range);
  const points = range === "7d" ? 7 : 15;
  const anchors = [0.52, 0.64, 0.73, 0.78, 0.82, 0.76, 0.84, 0.7, 0.81, 0.8, 0.75, 0.84, 0.87, 0.76, 0.92];
  const now = new Date();
  const trend = Array.from({ length: points }, (_, index) => {
    const ratio = anchors[index] ?? anchors[anchors.length - 1];
    const dayOffset = Math.round(((points - 1 - index) / (points - 1)) * (days - 1));

    return {
      applications: Math.round(390 + ratio * 470),
      label: formatTrendDate(addDays(now, -dayOffset)),
      offers: Math.round(180 + ratio * 310),
      revenue: Math.round(170000 + ratio * 420000),
      students: Math.round(1980 + ratio * 540),
      visas: Math.round(90 + ratio * 150),
    };
  });

  return {
    dataSource: "fallback",
    dateRangeLabel: formatDashboardRangeLabel(range, now),
    destinations: [
      { color: DESTINATION_COLORS[0], country: "Birləşmiş Krallıq", share: 25, value: 617 },
      { color: DESTINATION_COLORS[1], country: "Kanada", share: 20, value: 494 },
      { color: DESTINATION_COLORS[2], country: "Avstraliya", share: 18, value: 445 },
      { color: DESTINATION_COLORS[3], country: "ABŞ", share: 15, value: 371 },
      { color: DESTINATION_COLORS[4], country: "Almaniya", share: 10, value: 247 },
      { color: DESTINATION_COLORS[5], country: "Digər", share: 12, value: 304 },
    ],
    metrics: {
      applications: buildMetric(1326, trend.map((point) => point.applications)),
      offers: buildMetric(842, trend.map((point) => point.offers)),
      revenue: {
        ...buildMetric(1480000, trend.map((point) => point.revenue)),
        currency: "USD",
      },
      students: buildMetric(2478, trend.map((point) => point.students)),
      visaSuccess: buildMetric(92.4, trend.map((point) => point.visas)),
    },
    range,
    recentApplications: [
      {
        code: "APP-2026-01827",
        id: "demo-application-1",
        programName: "Biznes analitikası üzrə magistr",
        status: "Təklif məktubu",
        statusCode: "OFFER",
        studentName: "Aylin Məmmədova",
        universityName: "Toronto Universiteti",
        updatedAt: "5 avq, 2026",
      },
      {
        code: "APP-2026-01821",
        id: "demo-application-2",
        programName: "Kompüter elmləri üzrə bakalavr",
        status: "Baxılır",
        statusCode: "UNDER_REVIEW",
        studentName: "Ramin Əliyev",
        universityName: "Melburn Universiteti",
        updatedAt: "5 avq, 2026",
      },
      {
        code: "APP-2026-01814",
        id: "demo-application-3",
        programName: "Beynəlxalq hüquq üzrə magistr",
        status: "Sənəd yoxlaması",
        statusCode: "INVALID_DOCUMENTS",
        studentName: "Nigar Həsənli",
        universityName: "London Universitet Kolleci",
        updatedAt: "4 avq, 2026",
      },
      {
        code: "APP-2026-01802",
        id: "demo-application-4",
        programName: "Maliyyə üzrə bakalavr",
        status: "Viza göndərildi",
        statusCode: "ENROLLED",
        studentName: "Emil İsmayılov",
        universityName: "Arizona Dövlət Universiteti",
        updatedAt: "4 avq, 2026",
      },
    ],
    tasks: [
      {
        description: "Təklif məktubu gözlənilir",
        dueLabel: "Bu gün, 11:00",
        href: "/applications",
        id: "demo-task-1",
        title: "A. Məmmədova ilə izləmə",
        tone: "danger",
      },
      {
        description: "Sənəd baxışı",
        dueLabel: "Bu gün, 14:00",
        href: "/applications",
        id: "demo-task-2",
        title: "Sənədləri yoxla — R. Əliyev",
        tone: "danger",
      },
      {
        description: "Viza müsahibə hazırlığı",
        dueLabel: "Sabah, 10:00",
        href: "/applications",
        id: "demo-task-3",
        title: "Viza müsahibəsi — F. Kərimova",
        tone: "primary",
      },
      {
        description: "Tərəfdaşlıq müzakirəsi",
        dueLabel: "20 avq, 2026",
        href: "/universities",
        id: "demo-task-4",
        title: "Sidney Universiteti ilə izləmə",
        tone: "muted",
      },
    ],
    trend,
  };
}

function buildMetric(value: number, sparkline: number[]) {
  const first = sparkline[0] ?? value;
  const last = sparkline.at(-1) ?? value;
  const delta = first
    ? Number((((last - first) / Math.abs(first)) * 100).toFixed(1))
    : 0;

  return { delta, sparkline, value };
}

function buildDestinations(
  rows: Array<{ _count: { country: number }; country: string }>,
): DashboardDestination[] {
  const counts = rows.reduce<Record<string, number>>((result, row) => {
    const label = formatCountry(row.country.trim() || "Digər");
    result[label] = (result[label] ?? 0) + row._count.country;
    return result;
  }, {});
  const sorted = Object.entries(counts).sort((left, right) => right[1] - left[1]);
  const leading = sorted.slice(0, 5);
  const otherValue = sorted.slice(5).reduce((total, [, value]) => total + value, 0);
  const items = otherValue ? [...leading, ["Digər", otherValue] as const] : leading;
  const total = items.reduce((sum, [, value]) => sum + value, 0);

  return items.map(([country, value], index) => ({
    color: DESTINATION_COLORS[index] ?? DESTINATION_COLORS.at(-1)!,
    country,
    share: total ? Math.round((value / total) * 100) : 0,
    value,
  }));
}

function mapTask(
  application: {
    _count: { documents: number };
    code: string;
    id: string;
    status: string;
    student: { firstName: string; lastName: string };
    updatedAt: Date;
  },
  index: number,
): DashboardTask {
  const studentName = getFullName(application.student);
  const shortName = `${application.student.firstName.charAt(0)}. ${application.student.lastName}`;
  const isDocumentTask =
    application.status === "INVALID_DOCUMENTS" || application._count.documents > 0;
  const title = isDocumentTask
    ? `Sənədləri yoxla — ${shortName}`
    : application.status === "OFFER"
      ? `${shortName} ilə izləmə`
      : `Müraciətə bax — ${shortName}`;

  return {
    description: isDocumentTask
      ? application._count.documents > 0
        ? `${application._count.documents} sənəd diqqət tələb edir`
        : "Sənəd statusu yenidən yoxlanmalıdır"
      : `${application.code} · ${studentName}`,
    dueLabel: index < 2 ? "Bu gün" : index === 2 ? "Sabah" : formatShortDate(application.updatedAt),
    href: `/applications/${application.id}`,
    id: application.id,
    title,
    tone: isDocumentTask ? "danger" : index < 3 ? "primary" : "muted",
  };
}

function getPrimaryCurrency(
  rows: Array<{
    _sum: { totalAmount: unknown | null };
    currency: string;
  }>,
) {
  return (
    rows
      .toSorted(
        (left, right) =>
          Number(right._sum.totalAmount ?? 0) -
          Number(left._sum.totalAmount ?? 0),
      )[0]?.currency ??
    "USD"
  );
}

function getRevenueTotal(
  rows: Array<{
    _sum: { totalAmount: unknown | null };
    currency: string;
  }>,
  currency: string,
) {
  return Number(
    rows.find((row) => row.currency === currency)?._sum.totalAmount ?? 0,
  );
}

function sumStatusCounts(
  rows: Array<{ _count: { _all: number }; status: string }>,
) {
  return rows.reduce((total, row) => total + row._count._all, 0);
}

function getStatusCount(
  rows: Array<{ _count: { _all: number }; status: string }>,
  status: string,
) {
  return rows.find((row) => row.status === status)?._count._all ?? 0;
}

function parseRange(value: string | undefined): DashboardRange {
  return value === "30d" || value === "90d" ? value : "7d";
}

function getRangeDays(range: DashboardRange) {
  return range === "90d" ? 90 : range === "30d" ? 30 : 7;
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
}

function formatTrendDate(value: Date) {
  return new Intl.DateTimeFormat("az-AZ", {
    day: "numeric",
    month: "short",
  }).format(value);
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("az-AZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatDashboardRangeLabel(range: DashboardRange, end: Date) {
  const start = addDays(end, -(getRangeDays(range) - 1));

  return `${formatDashboardDay(start)} — ${formatDashboardDay(end)}, ${end.getFullYear()}`;
}

function formatDashboardDay(value: Date) {
  const months = [
    "yan",
    "fev",
    "mar",
    "apr",
    "may",
    "iyn",
    "iyl",
    "avq",
    "sen",
    "okt",
    "noy",
    "dek",
  ];

  return `${value.getDate()} ${months[value.getMonth()]}`;
}

function getFullName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`.trim();
}

function formatApplicationStatus(value: string) {
  const labels: Record<string, string> = {
    ACCEPTED: "Qəbul edildi",
    DRAFT: "Qaralama",
    ENROLLED: "Qeydiyyat tamamlandı",
    INVALID_DOCUMENTS: "Sənəd yoxlaması",
    OFFER: "Təklif məktubu",
    REJECTED: "Rədd edildi",
    SUBMITTED: "Göndərildi",
    UNDER_REVIEW: "Baxılır",
  };

  return labels[value] ?? value;
}

function formatCountry(value: string) {
  const labels: Record<string, string> = {
    Australia: "Avstraliya",
    Canada: "Kanada",
    Germany: "Almaniya",
    Turkiye: "Türkiyə",
    Turkey: "Türkiyə",
    "United Kingdom": "Birləşmiş Krallıq",
    "United States": "ABŞ",
  };

  return labels[value] ?? value;
}

function hasUsableDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  return Boolean(databaseUrl && !databaseUrl.includes("CHANGE_ME_DB_PASSWORD"));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
