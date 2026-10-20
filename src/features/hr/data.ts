import "server-only";

import {
  addDays,
  differenceInCalendarYears,
  format,
  isAfter,
  isBefore,
  startOfDay,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";
import { az } from "date-fns/locale";

import { HR_DEPARTMENT_COLORS, type HrTab } from "@/features/hr/constants";
import { createHrDemoData } from "@/features/hr/data/demo-data";
import type {
  HrEmploymentStatus,
  HrAttendanceRecord,
  HrCandidateRecord,
  HrDepartmentPoint,
  HrEmployeeRecord,
  HrLeaveRequestRecord,
  HrPayrollRunRecord,
  HrPerformanceReviewRecord,
  HrTrendPoint,
  HrUpcomingEvent,
  HrVacancyRecord,
  HrWorkspaceData,
  HrWorkMode,
} from "@/features/hr/types";
import type { Prisma } from "@/generated/prisma/client";
import { can } from "@/lib/auth/permissions";
import type { AuthSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const EMPLOYEE_PAGE_SIZE = 50;
const EMPLOYEE_OPTION_LIMIT = 500;
const REGISTER_LIMIT = 200;

type HrDataOptions = {
  employeeDepartment?: string;
  employeeId?: string;
  employeePage?: number;
  employeeQuery?: string;
  employeeStatus?: string;
  employeeWorkMode?: string;
  payrollRunId?: string;
  preview?: boolean;
  tab?: HrTab;
};

type HrPermissions = Pick<
  HrWorkspaceData,
  "canApproveLeave" | "canManage" | "canManageAttendance" | "canViewPayroll"
>;

type HrMetrics = HrWorkspaceData["metrics"];

type HrSectionData = Partial<
  Pick<
    HrWorkspaceData,
    | "attendance"
    | "departments"
    | "employees"
    | "employeeDepartments"
    | "employeeFilters"
    | "employeePage"
    | "leaveRequests"
    | "payrollRuns"
    | "performanceReviews"
    | "selectedPayrollRunId"
    | "trend"
    | "upcomingEvents"
    | "vacancies"
  >
>;

export async function getHrWorkspaceData(
  session: AuthSession,
  options: HrDataOptions = {},
): Promise<HrWorkspaceData> {
  const permissions: HrPermissions = {
    canApproveLeave: can(session.role, "hr:leave:approve"),
    canManage: can(session.role, "hr:manage"),
    canManageAttendance: can(session.role, "hr:attendance"),
    canViewPayroll: can(session.role, "hr:payroll"),
  };

  if (options.preview) {
    return createPreviewWorkspaceData(permissions, options);
  }

  const today = startOfDay(new Date());
  const tab = options.tab ?? "overview";

  try {
    const [metrics, section] = await Promise.all([
      loadMetrics(today),
      loadSection(tab, today, permissions, options),
    ]);

    return {
      ...createEmptyWorkspaceData(permissions),
      ...section,
      isPreview: false,
      metrics,
    };
  } catch (error) {
    reportHrDataError(error, tab);
    throw new Error("HR_DATA_UNAVAILABLE", { cause: error });
  }
}

function createPreviewWorkspaceData(
  permissions: HrPermissions,
  options: HrDataOptions,
): HrWorkspaceData {
  const preview = createHrDemoData(permissions);
  const requestedStatus = options.employeeStatus as
    | HrEmploymentStatus
    | undefined;
  const requestedWorkMode = options.employeeWorkMode as HrWorkMode | undefined;
  const department = preview.employeeDepartments.includes(
    options.employeeDepartment ?? "",
  )
    ? options.employeeDepartment!
    : "ALL";
  const status = preview.employees.some(
    (employee) => employee.employmentStatus === requestedStatus,
  )
    ? requestedStatus!
    : "ALL";
  const workMode = preview.employees.some(
    (employee) => employee.workMode === requestedWorkMode,
  )
    ? requestedWorkMode!
    : "ALL";
  const search = options.employeeQuery?.trim().slice(0, 120) ?? "";
  const normalizedSearch = search.toLocaleLowerCase("az-AZ");
  const filteredEmployees = preview.employees.filter((employee) => {
    if (department !== "ALL" && employee.department !== department) {
      return false;
    }
    if (status !== "ALL" && employee.employmentStatus !== status) {
      return false;
    }
    if (workMode !== "ALL" && employee.workMode !== workMode) {
      return false;
    }
    if (!normalizedSearch) {
      return true;
    }

    return [
      employee.employeeCode,
      employee.department,
      employee.email,
      employee.fullName,
      employee.phone,
      employee.position,
    ].some((value) =>
      value.toLocaleLowerCase("az-AZ").includes(normalizedSearch),
    );
  });
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / EMPLOYEE_PAGE_SIZE),
  );
  const page = Math.min(Math.max(1, options.employeePage ?? 1), totalPages);
  const offset = (page - 1) * EMPLOYEE_PAGE_SIZE;

  return {
    ...preview,
    employees: filteredEmployees.slice(offset, offset + EMPLOYEE_PAGE_SIZE),
    employeeFilters: {
      department,
      search,
      status,
      workMode,
    },
    employeePage: {
      page,
      pageSize: EMPLOYEE_PAGE_SIZE,
      total: filteredEmployees.length,
      totalPages,
    },
  };
}

function createEmptyWorkspaceData(permissions: HrPermissions): HrWorkspaceData {
  return {
    ...permissions,
    attendance: [],
    departments: [],
    employees: [],
    employeeDepartments: [],
    employeeFilters: {
      department: "ALL",
      search: "",
      status: "ALL",
      workMode: "ALL",
    },
    employeePage: {
      page: 1,
      pageSize: EMPLOYEE_PAGE_SIZE,
      total: 0,
      totalPages: 1,
    },
    isPreview: false,
    leaveRequests: [],
    metrics: {
      activeEmployees: 0,
      attendanceRate: 0,
      employeesAtWorkToday: 0,
      employeesOnLeave: 0,
      openVacancies: 0,
      pendingLeaveRequests: 0,
      totalEmployees: 0,
    },
    payrollRuns: [],
    performanceReviews: [],
    selectedPayrollRunId: "",
    trend: [],
    upcomingEvents: [],
    vacancies: [],
  };
}

async function loadSection(
  tab: HrTab,
  today: Date,
  permissions: HrPermissions,
  options: HrDataOptions,
): Promise<HrSectionData> {
  switch (tab) {
    case "employees":
      return loadEmployeePage(today, permissions.canViewPayroll, options);
    case "attendance":
      return loadAttendanceRegister(today);
    case "leave":
      return loadLeaveRegister();
    case "recruitment":
      return loadRecruitmentRegister();
    case "performance":
      return loadPerformanceRegister();
    case "payroll":
      return permissions.canViewPayroll
        ? loadPayrollRegister(options.payrollRunId)
        : {};
    case "overview":
    default:
      return loadOverview(today);
  }
}

async function loadMetrics(today: Date): Promise<HrMetrics> {
  type MetricsRow = {
    activeEmployees: bigint | number;
    employeesAtWorkToday: bigint | number;
    employeesOnLeave: bigint | number;
    openVacancies: bigint | number;
    pendingLeaveRequests: bigint | number;
    totalEmployees: bigint | number;
  };

  const rows = await prisma.$queryRaw<MetricsRow[]>`
    select
      count(*) filter (where "employment_status" <> 'TERMINATED')::int as "totalEmployees",
      count(*) filter (where "employment_status" in ('ACTIVE', 'PROBATION'))::int as "activeEmployees",
      count(*) filter (where "employment_status" = 'ON_LEAVE')::int as "employeesOnLeave",
      (
        select count(*)::int
        from public."hr_attendance"
        where "work_date" = ${today}
          and "status" in ('PRESENT', 'LATE', 'REMOTE')
      ) as "employeesAtWorkToday",
      (
        select count(*)::int
        from public."hr_vacancies"
        where "status" = 'OPEN'
      ) as "openVacancies",
      (
        select count(*)::int
        from public."hr_leave_requests"
        where "status" = 'PENDING'
      ) as "pendingLeaveRequests"
    from public."hr_employees"
  `;
  const row = rows[0];
  const activeEmployees = toNumber(row?.activeEmployees);
  const employeesAtWorkToday = toNumber(row?.employeesAtWorkToday);

  return {
    activeEmployees,
    attendanceRate: Math.round(
      (employeesAtWorkToday / Math.max(1, activeEmployees)) * 100,
    ),
    employeesAtWorkToday,
    employeesOnLeave: toNumber(row?.employeesOnLeave),
    openVacancies: toNumber(row?.openVacancies),
    pendingLeaveRequests: toNumber(row?.pendingLeaveRequests),
    totalEmployees: toNumber(row?.totalEmployees),
  };
}

async function loadOverview(today: Date): Promise<HrSectionData> {
  const [trend, departmentRows, eventRows, attendanceRows, leaveRows] =
    await Promise.all([
      loadTrend(today),
      prisma.$queryRaw<Array<{ count: bigint | number; name: string }>>`
        select "department" as "name", count(*)::int as "count"
        from public."hr_employees"
        where "employment_status" <> 'TERMINATED'
        group by "department"
        order by count(*) desc, "department" asc
        limit ${HR_DEPARTMENT_COLORS.length}
      `,
      prisma.hrEmployee.findMany({
        orderBy: { id: "asc" },
        select: {
          birthDate: true,
          contractEndDate: true,
          employmentStatus: true,
          firstName: true,
          hiredAt: true,
          id: true,
          lastName: true,
        },
        take: 2_000,
        where: { employmentStatus: { not: "TERMINATED" } },
      }),
      prisma.hrAttendance.findMany({
        orderBy: { checkIn: "asc" },
        select: attendanceSelect,
        take: 20,
        where: { workDate: today },
      }),
      prisma.hrLeaveRequest.findMany({
        orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
        select: leaveRequestSelect,
        take: 10,
        where: { status: "PENDING" },
      }),
    ]);

  const departmentTotal = departmentRows.reduce(
    (total, row) => total + toNumber(row.count),
    0,
  );
  const departments: HrDepartmentPoint[] = departmentRows.map((row, index) => ({
    color: HR_DEPARTMENT_COLORS[index],
    count: toNumber(row.count),
    name: row.name,
    percentage: departmentTotal
      ? Math.round((toNumber(row.count) / departmentTotal) * 100)
      : 0,
  }));

  return {
    attendance: attendanceRows.map(mapAttendance),
    departments,
    leaveRequests: leaveRows.map(mapLeaveRequest),
    trend,
    upcomingEvents: createUpcomingEvents(eventRows, today),
  };
}

async function loadTrend(today: Date): Promise<HrTrendPoint[]> {
  type TrendRow = {
    headcount: bigint | number;
    joined: bigint | number;
    left: bigint | number;
    month: string;
  };

  const rows = await prisma.$queryRaw<TrendRow[]>`
    with months as (
      select generate_series(
        date_trunc('month', ${today}::date) - interval '11 months',
        date_trunc('month', ${today}::date),
        interval '1 month'
      )::date as month_start
    )
    select
      to_char(months.month_start, 'YYYY-MM') as "month",
      count(employee."id") filter (
        where employee."hired_at" < months.month_start + interval '1 month'
          and (
            employee."terminated_at" is null
            or employee."terminated_at" >= months.month_start + interval '1 month'
          )
      )::int as "headcount",
      count(employee."id") filter (
        where employee."hired_at" >= months.month_start
          and employee."hired_at" < months.month_start + interval '1 month'
      )::int as "joined",
      count(employee."id") filter (
        where employee."terminated_at" >= months.month_start
          and employee."terminated_at" < months.month_start + interval '1 month'
      )::int as "left"
    from months
    left join public."hr_employees" employee
      on employee."hired_at" < months.month_start + interval '1 month'
    group by months.month_start
    order by months.month_start asc
  `;

  return rows.map((row) => ({
    headcount: toNumber(row.headcount),
    joined: toNumber(row.joined),
    label: format(new Date(`${row.month}-01T00:00:00`), "MMM yy", {
      locale: az,
    }),
    left: toNumber(row.left),
    month: row.month,
  }));
}

async function loadEmployeePage(
  today: Date,
  canViewPayroll: boolean,
  options: HrDataOptions,
): Promise<HrSectionData> {
  const page = Math.min(Math.max(1, options.employeePage ?? 1), 1_000);
  const filters = normalizeEmployeeFilters(options);
  const where = createEmployeeWhere(filters);
  const [total, rows, departmentRows] = await Promise.all([
    prisma.hrEmployee.count({ where }),
    findEmployeeRows({
      canViewPayroll,
      monthStart: startOfMonth(today),
      page,
      where,
      yearStart: startOfYear(today),
    }),
    prisma.hrEmployee.groupBy({
      by: ["department"],
      orderBy: { department: "asc" },
    }),
  ]);
  const employees = rows.map((row) => mapEmployee(row, canViewPayroll));

  if (
    options.employeeId &&
    !employees.some((employee) => employee.id === options.employeeId)
  ) {
    const focusedRows = await findEmployeeRows({
      canViewPayroll,
      employeeId: options.employeeId,
      monthStart: startOfMonth(today),
      page: 1,
      yearStart: startOfYear(today),
    });
    if (focusedRows[0]) {
      employees.unshift(mapEmployee(focusedRows[0], canViewPayroll));
    }
  }

  return {
    employeeDepartments: departmentRows.map((row) => row.department),
    employeeFilters: filters,
    employees,
    employeePage: {
      page,
      pageSize: EMPLOYEE_PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / EMPLOYEE_PAGE_SIZE)),
    },
  };
}

async function findEmployeeRows({
  canViewPayroll,
  employeeId,
  monthStart,
  page,
  where,
  yearStart,
}: {
  canViewPayroll: boolean;
  employeeId?: string;
  monthStart: Date;
  page: number;
  where?: Prisma.HrEmployeeWhereInput;
  yearStart: Date;
}) {
  return prisma.hrEmployee.findMany({
    orderBy: [
      { employmentStatus: "asc" },
      { firstName: "asc" },
      { lastName: "asc" },
      { id: "asc" },
    ],
    select: {
      address: true,
      annualLeaveAllowance: true,
      attendance: {
        select: { status: true },
        where: { workDate: { gte: monthStart } },
      },
      birthDate: true,
      contractEndDate: true,
      currency: true,
      department: true,
      email: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      emergencyContactRelation: true,
      employeeCode: true,
      employmentStatus: true,
      employmentType: true,
      firstName: true,
      hiredAt: true,
      id: true,
      lastName: true,
      leaveRequests: {
        select: { days: true },
        where: {
          endDate: { gte: yearStart },
          status: "APPROVED",
          type: "ANNUAL",
        },
      },
      manager: { select: { firstName: true, id: true, lastName: true } },
      notes: true,
      office: true,
      phone: true,
      position: true,
      salary: canViewPayroll,
      terminatedAt: true,
      workMode: true,
    },
    skip: employeeId ? 0 : (page - 1) * EMPLOYEE_PAGE_SIZE,
    take: employeeId ? 1 : EMPLOYEE_PAGE_SIZE,
    where: employeeId ? { id: employeeId } : where,
  });
}

function normalizeEmployeeFilters(options: HrDataOptions) {
  const statuses: HrEmploymentStatus[] = [
    "ACTIVE",
    "PROBATION",
    "ON_LEAVE",
    "INACTIVE",
    "TERMINATED",
  ];
  const workModes: HrWorkMode[] = ["ONSITE", "HYBRID", "REMOTE"];
  const status = statuses.includes(options.employeeStatus as HrEmploymentStatus)
    ? (options.employeeStatus as HrEmploymentStatus)
    : "ALL";
  const workMode = workModes.includes(options.employeeWorkMode as HrWorkMode)
    ? (options.employeeWorkMode as HrWorkMode)
    : "ALL";

  return {
    department: options.employeeDepartment?.slice(0, 100) || "ALL",
    search: options.employeeQuery?.trim().slice(0, 120) ?? "",
    status,
    workMode,
  };
}

function createEmployeeWhere(
  filters: HrWorkspaceData["employeeFilters"],
): Prisma.HrEmployeeWhereInput {
  const terms = filters.search.split(/\s+/).filter(Boolean).slice(0, 5);

  return {
    AND: terms.map((term) => ({
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { employeeCode: { contains: term, mode: "insensitive" } },
        { position: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
      ],
    })),
    department: filters.department === "ALL" ? undefined : filters.department,
    employmentStatus:
      filters.status === "ALL"
        ? undefined
        : (filters.status as HrEmploymentStatus),
    workMode:
      filters.workMode === "ALL" ? undefined : (filters.workMode as HrWorkMode),
  };
}

type EmployeeRow = Awaited<ReturnType<typeof findEmployeeRows>>[number];

function mapEmployee(
  employee: EmployeeRow,
  canViewPayroll: boolean,
): HrEmployeeRecord {
  const usedLeaveDays = employee.leaveRequests.reduce(
    (total, request) => total + Number(request.days),
    0,
  );
  const attendance = employee.attendance;

  return {
    address: employee.address ?? "",
    annualLeaveAllowance: employee.annualLeaveAllowance,
    attendanceSummary: {
      absent: attendance.filter((row) => row.status === "ABSENT").length,
      late: attendance.filter((row) => row.status === "LATE").length,
      present: attendance.filter(
        (row) => row.status === "PRESENT" || row.status === "LATE",
      ).length,
      remote: attendance.filter((row) => row.status === "REMOTE").length,
      workDays: attendance.length,
    },
    birthDate: toDateOnly(employee.birthDate),
    contractEndDate: toDateOnly(employee.contractEndDate),
    currency: employee.currency,
    department: employee.department,
    email: employee.email,
    emergencyContactName: employee.emergencyContactName ?? "",
    emergencyContactPhone: employee.emergencyContactPhone ?? "",
    emergencyContactRelation: employee.emergencyContactRelation ?? "",
    employeeCode: employee.employeeCode,
    employmentStatus: employee.employmentStatus,
    employmentType: employee.employmentType,
    firstName: employee.firstName,
    fullName: getFullName(employee),
    hiredAt: toDateOnly(employee.hiredAt),
    id: employee.id,
    lastName: employee.lastName,
    managerId: employee.manager?.id ?? "",
    managerName: employee.manager ? getFullName(employee.manager) : "",
    notes: employee.notes ?? "",
    office: employee.office ?? "",
    phone: employee.phone ?? "",
    position: employee.position,
    remainingLeaveDays: Math.max(
      0,
      employee.annualLeaveAllowance - usedLeaveDays,
    ),
    salary: canViewPayroll
      ? Number((employee as EmployeeRow & { salary?: unknown }).salary ?? 0)
      : null,
    terminatedAt: toDateOnly(employee.terminatedAt),
    usedLeaveDays,
    workMode: employee.workMode,
  };
}

async function loadEmployeeOptions() {
  const rows = await prisma.hrEmployee.findMany({
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { id: "asc" }],
    select: {
      department: true,
      email: true,
      employeeCode: true,
      employmentStatus: true,
      employmentType: true,
      firstName: true,
      hiredAt: true,
      id: true,
      lastName: true,
      phone: true,
      position: true,
      workMode: true,
    },
    take: EMPLOYEE_OPTION_LIMIT,
    where: { employmentStatus: { not: "TERMINATED" } },
  });

  return rows.map(
    (row): HrEmployeeRecord => ({
      address: "",
      annualLeaveAllowance: 0,
      attendanceSummary: {
        absent: 0,
        late: 0,
        present: 0,
        remote: 0,
        workDays: 0,
      },
      birthDate: "",
      contractEndDate: "",
      currency: "AZN",
      department: row.department,
      email: row.email,
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      employeeCode: row.employeeCode,
      employmentStatus: row.employmentStatus,
      employmentType: row.employmentType,
      firstName: row.firstName,
      fullName: getFullName(row),
      hiredAt: toDateOnly(row.hiredAt),
      id: row.id,
      lastName: row.lastName,
      managerId: "",
      managerName: "",
      notes: "",
      office: "",
      phone: row.phone ?? "",
      position: row.position,
      remainingLeaveDays: 0,
      salary: null,
      terminatedAt: "",
      usedLeaveDays: 0,
      workMode: row.workMode,
    }),
  );
}

const attendanceSelect = {
  checkIn: true,
  checkOut: true,
  employee: {
    select: {
      department: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      position: true,
    },
  },
  employeeId: true,
  id: true,
  note: true,
  status: true,
  workDate: true,
} as const;

async function loadAttendanceRegister(today: Date): Promise<HrSectionData> {
  const [employees, rows] = await Promise.all([
    loadEmployeeOptions(),
    prisma.hrAttendance.findMany({
      orderBy: [{ workDate: "desc" }, { checkIn: "asc" }],
      select: attendanceSelect,
      take: REGISTER_LIMIT,
      where: { workDate: { gte: subMonths(startOfMonth(today), 1) } },
    }),
  ]);

  return { attendance: rows.map(mapAttendance), employees };
}

function mapAttendance(row: {
  checkIn: string | null;
  checkOut: string | null;
  employee: {
    department: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    position: string;
  };
  employeeId: string;
  id: string;
  note: string | null;
  status: HrAttendanceRecord["status"];
  workDate: Date;
}): HrAttendanceRecord {
  return {
    checkIn: row.checkIn ?? "",
    checkOut: row.checkOut ?? "",
    department: row.employee.department,
    employeeCode: row.employee.employeeCode,
    employeeId: row.employeeId,
    employeeName: getFullName(row.employee),
    id: row.id,
    note: row.note ?? "",
    position: row.employee.position,
    status: row.status,
    workDate: toDateOnly(row.workDate),
  };
}

const leaveRequestSelect = {
  code: true,
  createdAt: true,
  days: true,
  employee: {
    select: {
      employeeCode: true,
      firstName: true,
      lastName: true,
    },
  },
  employeeId: true,
  endDate: true,
  id: true,
  reason: true,
  reviewNote: true,
  reviewedAt: true,
  reviewedBy: { select: { email: true, name: true } },
  startDate: true,
  status: true,
  type: true,
} as const;

async function loadLeaveRegister(): Promise<HrSectionData> {
  const [employees, rows] = await Promise.all([
    loadEmployeeOptions(),
    prisma.hrLeaveRequest.findMany({
      orderBy: [
        { status: "asc" },
        { startDate: "desc" },
        { createdAt: "desc" },
      ],
      select: leaveRequestSelect,
      take: REGISTER_LIMIT,
    }),
  ]);

  return { employees, leaveRequests: rows.map(mapLeaveRequest) };
}

function mapLeaveRequest(row: {
  code: string;
  createdAt: Date;
  days: unknown;
  employee: { employeeCode: string; firstName: string; lastName: string };
  employeeId: string;
  endDate: Date;
  id: string;
  reason: string | null;
  reviewNote: string | null;
  reviewedAt: Date | null;
  reviewedBy: { email: string; name: string | null } | null;
  startDate: Date;
  status: HrLeaveRequestRecord["status"];
  type: HrLeaveRequestRecord["type"];
}): HrLeaveRequestRecord {
  return {
    code: row.code,
    createdAt: row.createdAt.toISOString(),
    days: Number(row.days),
    employeeCode: row.employee.employeeCode,
    employeeId: row.employeeId,
    employeeName: getFullName(row.employee),
    endDate: toDateOnly(row.endDate),
    id: row.id,
    reason: row.reason ?? "",
    reviewNote: row.reviewNote ?? "",
    reviewedAt: toIso(row.reviewedAt),
    reviewedBy: row.reviewedBy?.name ?? row.reviewedBy?.email ?? "",
    startDate: toDateOnly(row.startDate),
    status: row.status,
    type: row.type,
  };
}

async function loadRecruitmentRegister(): Promise<HrSectionData> {
  const [employees, rows] = await Promise.all([
    loadEmployeeOptions(),
    prisma.hrVacancy.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        candidates: {
          orderBy: [{ stage: "asc" }, { appliedAt: "desc" }],
          select: {
            appliedAt: true,
            currency: true,
            email: true,
            expectedSalary: true,
            firstName: true,
            id: true,
            lastName: true,
            nextInterviewAt: true,
            notes: true,
            phone: true,
            rating: true,
            source: true,
            stage: true,
            vacancyId: true,
          },
          take: 100,
        },
        closingDate: true,
        code: true,
        department: true,
        description: true,
        employmentType: true,
        headcount: true,
        hiringManager: {
          select: { firstName: true, id: true, lastName: true },
        },
        id: true,
        location: true,
        status: true,
        title: true,
        workMode: true,
      },
      take: 50,
    }),
  ]);

  const vacancies: HrVacancyRecord[] = rows.map((row) => {
    const candidates: HrCandidateRecord[] = row.candidates.map((candidate) => ({
      appliedAt: toDateOnly(candidate.appliedAt),
      currency: candidate.currency,
      email: candidate.email,
      expectedSalary:
        candidate.expectedSalary === null
          ? null
          : Number(candidate.expectedSalary),
      firstName: candidate.firstName,
      fullName: getFullName(candidate),
      id: candidate.id,
      lastName: candidate.lastName,
      nextInterviewAt: toIso(candidate.nextInterviewAt),
      notes: candidate.notes ?? "",
      phone: candidate.phone ?? "",
      rating: candidate.rating,
      source: candidate.source ?? "",
      stage: candidate.stage,
      vacancyId: candidate.vacancyId,
    }));

    return {
      candidateCount: candidates.length,
      candidates,
      closingDate: toDateOnly(row.closingDate),
      code: row.code,
      department: row.department,
      description: row.description ?? "",
      employmentType: row.employmentType,
      headcount: row.headcount,
      hiredCount: candidates.filter((candidate) => candidate.stage === "HIRED")
        .length,
      hiringManagerId: row.hiringManager?.id ?? "",
      hiringManagerName: row.hiringManager
        ? getFullName(row.hiringManager)
        : "",
      id: row.id,
      location: row.location ?? "",
      status: row.status,
      title: row.title,
      workMode: row.workMode,
    };
  });

  return { employees, vacancies };
}

async function loadPerformanceRegister(): Promise<HrSectionData> {
  const [employees, rows] = await Promise.all([
    loadEmployeeOptions(),
    prisma.hrPerformanceReview.findMany({
      orderBy: [{ periodEnd: "desc" }, { createdAt: "desc" }],
      select: {
        completedAt: true,
        employee: { select: { firstName: true, lastName: true } },
        employeeId: true,
        goals: true,
        id: true,
        improvements: true,
        periodEnd: true,
        periodStart: true,
        reviewer: { select: { firstName: true, id: true, lastName: true } },
        score: true,
        status: true,
        strengths: true,
      },
      take: REGISTER_LIMIT,
    }),
  ]);

  const performanceReviews: HrPerformanceReviewRecord[] = rows.map((row) => ({
    completedAt: toIso(row.completedAt),
    employeeId: row.employeeId,
    employeeName: getFullName(row.employee),
    goals: row.goals ?? "",
    id: row.id,
    improvements: row.improvements ?? "",
    periodEnd: toDateOnly(row.periodEnd),
    periodStart: toDateOnly(row.periodStart),
    reviewerId: row.reviewer?.id ?? "",
    reviewerName: row.reviewer ? getFullName(row.reviewer) : "",
    score: row.score === null ? null : Number(row.score),
    status: row.status,
    strengths: row.strengths ?? "",
  }));

  return { employees, performanceReviews };
}

async function loadPayrollRegister(
  requestedRunId?: string,
): Promise<HrSectionData> {
  const runRows = await prisma.hrPayrollRun.findMany({
    orderBy: { periodEnd: "desc" },
    select: {
      approvedAt: true,
      approvedBy: { select: { email: true, name: true } },
      code: true,
      currency: true,
      id: true,
      paidAt: true,
      periodEnd: true,
      periodStart: true,
      status: true,
      totalBonus: true,
      totalDeductions: true,
      totalGross: true,
      totalNet: true,
    },
    take: 24,
  });
  const selectedPayrollRunId = runRows.some((run) => run.id === requestedRunId)
    ? (requestedRunId ?? "")
    : (runRows[0]?.id ?? "");
  const itemRows = selectedPayrollRunId
    ? await prisma.hrPayrollItem.findMany({
        orderBy: { employee: { firstName: "asc" } },
        select: {
          baseSalary: true,
          bonus: true,
          currency: true,
          deductions: true,
          employee: {
            select: {
              employeeCode: true,
              firstName: true,
              id: true,
              lastName: true,
            },
          },
          id: true,
          netSalary: true,
          note: true,
          payrollRunId: true,
        },
        take: 1_000,
        where: { payrollRunId: selectedPayrollRunId },
      })
    : [];

  const payrollRuns: HrPayrollRunRecord[] = runRows.map((row) => ({
    approvedAt: toIso(row.approvedAt),
    approvedBy: row.approvedBy?.name ?? row.approvedBy?.email ?? "",
    code: row.code,
    currency: row.currency,
    id: row.id,
    items:
      row.id === selectedPayrollRunId
        ? itemRows.map((item) => ({
            baseSalary: Number(item.baseSalary),
            bonus: Number(item.bonus),
            currency: item.currency,
            deductions: Number(item.deductions),
            employeeCode: item.employee.employeeCode,
            employeeId: item.employee.id,
            employeeName: getFullName(item.employee),
            id: item.id,
            netSalary: Number(item.netSalary),
            note: item.note ?? "",
          }))
        : [],
    paidAt: toIso(row.paidAt),
    periodEnd: toDateOnly(row.periodEnd),
    periodStart: toDateOnly(row.periodStart),
    status: row.status,
    totalBonus: Number(row.totalBonus),
    totalDeductions: Number(row.totalDeductions),
    totalGross: Number(row.totalGross),
    totalNet: Number(row.totalNet),
  }));

  return { payrollRuns, selectedPayrollRunId };
}

function createUpcomingEvents(
  employees: Array<{
    birthDate: Date | null;
    contractEndDate: Date | null;
    employmentStatus: string;
    firstName: string;
    hiredAt: Date;
    id: string;
    lastName: string;
  }>,
  today: Date,
): HrUpcomingEvent[] {
  const horizon = addDays(today, 90);
  const events: HrUpcomingEvent[] = [];

  for (const employee of employees) {
    const employeeName = getFullName(employee);

    if (employee.birthDate) {
      const nextBirthday = getNextOccurrence(employee.birthDate, today);
      if (!isAfter(nextBirthday, horizon)) {
        events.push({
          date: toDateOnly(nextBirthday),
          detail: "Doğum günü",
          employeeId: employee.id,
          employeeName,
          id: `birthday-${employee.id}-${format(nextBirthday, "yyyy")}`,
          type: "BIRTHDAY",
        });
      }
    }

    const anniversary = getNextOccurrence(employee.hiredAt, today);
    const years = differenceInCalendarYears(anniversary, employee.hiredAt);
    if (years > 0 && !isAfter(anniversary, horizon)) {
      events.push({
        date: toDateOnly(anniversary),
        detail: `${years} il tamam olur`,
        employeeId: employee.id,
        employeeName,
        id: `anniversary-${employee.id}-${format(anniversary, "yyyy")}`,
        type: "ANNIVERSARY",
      });
    }

    if (
      employee.contractEndDate &&
      !isBefore(employee.contractEndDate, today) &&
      !isAfter(employee.contractEndDate, horizon)
    ) {
      events.push({
        date: toDateOnly(employee.contractEndDate),
        detail: "Müqavilə bitir",
        employeeId: employee.id,
        employeeName,
        id: `contract-${employee.id}-${toDateOnly(employee.contractEndDate)}`,
        type: "CONTRACT_END",
      });
    }
  }

  return events
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, 12);
}

function getNextOccurrence(source: Date, today: Date) {
  const occurrence = new Date(
    today.getFullYear(),
    source.getMonth(),
    source.getDate(),
  );
  return isBefore(occurrence, today)
    ? new Date(today.getFullYear() + 1, source.getMonth(), source.getDate())
    : occurrence;
}

function getFullName(value: { firstName: string; lastName: string }) {
  return `${value.firstName} ${value.lastName}`.trim();
}

function toDateOnly(value: Date | null | undefined) {
  return value ? format(value, "yyyy-MM-dd") : "";
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

function toNumber(value: bigint | number | null | undefined) {
  return Number(value ?? 0);
}

function reportHrDataError(error: unknown, tab: HrTab) {
  const databaseCode =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "unknown";

  console.error("HR workspace data unavailable", {
    code: databaseCode,
    name: error instanceof Error ? error.name : "UnknownError",
    tab,
  });

  if (process.env.NODE_ENV !== "production" && error instanceof Error) {
    console.error(error.message);
  }
}
