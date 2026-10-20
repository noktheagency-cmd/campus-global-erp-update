"use server";

import { randomBytes } from "node:crypto";

import { eachDayOfInterval, isWeekend } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  hrAttendanceSchema,
  hrCandidateSchema,
  hrEmployeeSchema,
  hrLeaveRequestSchema,
  hrPayrollItemSchema,
  hrPayrollRunSchema,
  hrPerformanceReviewSchema,
  hrVacancySchema,
} from "@/features/hr/schemas";
import { defaultLocale, locales } from "@/i18n/routing";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function createHrEmployeeAction(formData: FormData) {
  const session = await requirePermission("hr:manage");
  const parsed = hrEmployeeSchema.safeParse(readEmployeeForm(formData));

  if (!parsed.success) {
    redirectHr(formData, "employees", { error: "employee-validation" });
  }

  try {
    if (parsed.data.managerId) {
      await requireEmployee(parsed.data.managerId);
    }

    await prisma.hrEmployee.create({
      data: {
        ...parsed.data,
        contractEndDate: parsed.data.contractEndDate ?? null,
        createdById: session.userId,
        employeeCode: createHrCode("EMP"),
        managerId: parsed.data.managerId ?? null,
        terminatedAt:
          parsed.data.employmentStatus === "TERMINATED" ? new Date() : null,
      },
    });
  } catch (error) {
    logActionError("create employee", error);
    redirectHr(formData, "employees", { error: "employee-create-failed" });
  }

  revalidateHr(formData);
  redirectHr(formData, "employees", { success: "employee-created" });
}

export async function updateHrEmployeeAction(formData: FormData) {
  const session = await requirePermission("hr:manage");
  const employeeId = getString(formData, "employeeId");
  const parsed = hrEmployeeSchema.safeParse(readEmployeeForm(formData));

  if (!employeeId || isDemoId(employeeId) || !parsed.success) {
    redirectHr(formData, "employees", {
      error: isDemoId(employeeId) ? "preview-readonly" : "employee-validation",
    });
  }

  try {
    const current = await requireEmployee(employeeId);
    if (parsed.data.managerId) {
      if (parsed.data.managerId === employeeId) {
        throw new HrActionError("employee-manager-self");
      }
      await requireEmployee(parsed.data.managerId);
    }

    await prisma.hrEmployee.update({
      data: {
        ...parsed.data,
        contractEndDate: parsed.data.contractEndDate ?? null,
        createdById: current.createdById ?? session.userId,
        managerId: parsed.data.managerId ?? null,
        terminatedAt:
          parsed.data.employmentStatus === "TERMINATED"
            ? (current.terminatedAt ?? new Date())
            : null,
      },
      where: { id: employeeId },
    });
  } catch (error) {
    logActionError("update employee", error);
    redirectHr(formData, "employees", { error: "employee-update-failed" });
  }

  revalidateHr(formData);
  redirectHr(formData, "employees", { success: "employee-updated" });
}

export async function upsertHrAttendanceAction(formData: FormData) {
  const session = await requirePermission("hr:attendance");
  const parsed = hrAttendanceSchema.safeParse({
    checkIn: getString(formData, "checkIn"),
    checkOut: getString(formData, "checkOut"),
    employeeId: getString(formData, "employeeId"),
    note: getString(formData, "note"),
    status: getString(formData, "status"),
    workDate: getString(formData, "workDate"),
  });

  if (
    !parsed.success ||
    isDemoId(parsed.success ? parsed.data.employeeId : "")
  ) {
    redirectHr(formData, "attendance", {
      error:
        parsed.success && isDemoId(parsed.data.employeeId)
          ? "preview-readonly"
          : "attendance-validation",
    });
  }

  try {
    await requireEmployee(parsed.data.employeeId);
    await prisma.hrAttendance.upsert({
      create: {
        checkIn: parsed.data.checkIn || null,
        checkOut: parsed.data.checkOut || null,
        createdById: session.userId,
        employeeId: parsed.data.employeeId,
        note: parsed.data.note ?? null,
        status: parsed.data.status,
        workDate: parsed.data.workDate,
      },
      update: {
        checkIn: parsed.data.checkIn || null,
        checkOut: parsed.data.checkOut || null,
        createdById: session.userId,
        note: parsed.data.note ?? null,
        status: parsed.data.status,
      },
      where: {
        employeeId_workDate: {
          employeeId: parsed.data.employeeId,
          workDate: parsed.data.workDate,
        },
      },
    });
  } catch (error) {
    logActionError("upsert attendance", error);
    redirectHr(formData, "attendance", { error: "attendance-save-failed" });
  }

  revalidateHr(formData);
  redirectHr(formData, "attendance", { success: "attendance-saved" });
}

export async function createHrLeaveRequestAction(formData: FormData) {
  await requirePermission("hr:manage");
  const parsed = hrLeaveRequestSchema.safeParse({
    employeeId: getString(formData, "employeeId"),
    endDate: getString(formData, "endDate"),
    reason: getString(formData, "reason"),
    startDate: getString(formData, "startDate"),
    type: getString(formData, "type"),
  });

  if (
    !parsed.success ||
    isDemoId(parsed.success ? parsed.data.employeeId : "")
  ) {
    redirectHr(formData, "leave", {
      error:
        parsed.success && isDemoId(parsed.data.employeeId)
          ? "preview-readonly"
          : "leave-validation",
    });
  }

  try {
    await requireEmployee(parsed.data.employeeId);
    const overlap = await prisma.hrLeaveRequest.findFirst({
      select: { id: true },
      where: {
        employeeId: parsed.data.employeeId,
        endDate: { gte: parsed.data.startDate },
        startDate: { lte: parsed.data.endDate },
        status: { in: ["PENDING", "APPROVED"] },
      },
    });
    if (overlap) {
      throw new HrActionError("leave-overlap");
    }

    await prisma.hrLeaveRequest.create({
      data: {
        code: createHrCode("LEV"),
        days: countWorkingDays(parsed.data.startDate, parsed.data.endDate),
        employeeId: parsed.data.employeeId,
        endDate: parsed.data.endDate,
        reason: parsed.data.reason ?? null,
        startDate: parsed.data.startDate,
        type: parsed.data.type,
      },
    });
  } catch (error) {
    logActionError("create leave request", error);
    redirectHr(formData, "leave", {
      error:
        error instanceof HrActionError ? error.code : "leave-create-failed",
    });
  }

  revalidateHr(formData);
  redirectHr(formData, "leave", { success: "leave-created" });
}

export async function reviewHrLeaveRequestAction(formData: FormData) {
  const session = await requirePermission("hr:leave:approve");
  const requestId = getString(formData, "requestId");
  const decision = getString(formData, "decision");
  const reviewNote = getString(formData, "reviewNote");

  if (
    !requestId ||
    isDemoId(requestId) ||
    (decision !== "APPROVED" && decision !== "REJECTED")
  ) {
    redirectHr(formData, "leave", {
      error: isDemoId(requestId) ? "preview-readonly" : "leave-review-invalid",
    });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const request = await tx.hrLeaveRequest.findFirst({
        select: {
          employeeId: true,
          endDate: true,
          id: true,
          startDate: true,
        },
        where: { id: requestId, status: "PENDING" },
      });
      if (!request) {
        throw new HrActionError("leave-not-pending");
      }

      const updated = await tx.hrLeaveRequest.updateMany({
        data: {
          reviewNote: reviewNote || null,
          reviewedAt: new Date(),
          reviewedById: session.userId,
          status: decision,
        },
        where: { id: request.id, status: "PENDING" },
      });
      if (updated.count !== 1) {
        throw new HrActionError("leave-not-pending");
      }

      const today = new Date();
      if (
        decision === "APPROVED" &&
        request.startDate <= today &&
        request.endDate >= today
      ) {
        await tx.hrEmployee.update({
          data: { employmentStatus: "ON_LEAVE" },
          where: { id: request.employeeId },
        });
      }
    });
  } catch (error) {
    logActionError("review leave request", error);
    redirectHr(formData, "leave", {
      error:
        error instanceof HrActionError ? error.code : "leave-review-failed",
    });
  }

  revalidateHr(formData);
  redirectHr(formData, "leave", {
    success: decision === "APPROVED" ? "leave-approved" : "leave-rejected",
  });
}

export async function createHrVacancyAction(formData: FormData) {
  const session = await requirePermission("hr:manage");
  const parsed = hrVacancySchema.safeParse({
    closingDate: getString(formData, "closingDate"),
    department: getString(formData, "department"),
    description: getString(formData, "description"),
    employmentType: getString(formData, "employmentType"),
    headcount: getString(formData, "headcount"),
    hiringManagerId: getString(formData, "hiringManagerId"),
    location: getString(formData, "location"),
    status: getString(formData, "status"),
    title: getString(formData, "title"),
    workMode: getString(formData, "workMode"),
  });

  if (
    !parsed.success ||
    isDemoId(parsed.success ? (parsed.data.hiringManagerId ?? "") : "")
  ) {
    redirectHr(formData, "recruitment", {
      error:
        parsed.success && isDemoId(parsed.data.hiringManagerId ?? "")
          ? "preview-readonly"
          : "vacancy-validation",
    });
  }

  try {
    if (parsed.data.hiringManagerId) {
      await requireEmployee(parsed.data.hiringManagerId);
    }
    await prisma.hrVacancy.create({
      data: {
        ...parsed.data,
        closingDate: parsed.data.closingDate ?? null,
        createdById: session.userId,
        code: createHrCode("VAC"),
        hiringManagerId: parsed.data.hiringManagerId ?? null,
      },
    });
  } catch (error) {
    logActionError("create vacancy", error);
    redirectHr(formData, "recruitment", { error: "vacancy-create-failed" });
  }

  revalidateHr(formData);
  redirectHr(formData, "recruitment", { success: "vacancy-created" });
}

export async function createHrCandidateAction(formData: FormData) {
  const session = await requirePermission("hr:manage");
  const parsed = hrCandidateSchema.safeParse({
    appliedAt: getString(formData, "appliedAt"),
    currency: getString(formData, "currency") || "AZN",
    email: getString(formData, "email"),
    expectedSalary: getString(formData, "expectedSalary"),
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    nextInterviewAt: getString(formData, "nextInterviewAt"),
    notes: getString(formData, "notes"),
    phone: getString(formData, "phone"),
    rating: getString(formData, "rating") || "0",
    source: getString(formData, "source"),
    stage: getString(formData, "stage") || "APPLIED",
    vacancyId: getString(formData, "vacancyId"),
  });

  if (
    !parsed.success ||
    isDemoId(parsed.success ? parsed.data.vacancyId : "")
  ) {
    redirectHr(formData, "recruitment", {
      error:
        parsed.success && isDemoId(parsed.data.vacancyId)
          ? "preview-readonly"
          : "candidate-validation",
    });
  }

  try {
    const vacancy = await prisma.hrVacancy.findFirst({
      select: { id: true },
      where: { id: parsed.data.vacancyId, status: { in: ["DRAFT", "OPEN"] } },
    });
    if (!vacancy) {
      throw new HrActionError("vacancy-not-open");
    }
    await prisma.hrCandidate.create({
      data: {
        ...parsed.data,
        createdById: session.userId,
        expectedSalary: parsed.data.expectedSalary ?? null,
        nextInterviewAt: parsed.data.nextInterviewAt ?? null,
      },
    });
  } catch (error) {
    logActionError("create candidate", error);
    redirectHr(formData, "recruitment", {
      error:
        error instanceof HrActionError ? error.code : "candidate-create-failed",
    });
  }

  revalidateHr(formData);
  redirectHr(formData, "recruitment", { success: "candidate-created" });
}

export async function moveHrCandidateAction(formData: FormData) {
  await requirePermission("hr:manage");
  const candidateId = getString(formData, "candidateId");
  const stage = getString(formData, "stage");
  const stages = [
    "APPLIED",
    "SCREENING",
    "INTERVIEW",
    "OFFER",
    "HIRED",
    "REJECTED",
  ];

  if (!candidateId || isDemoId(candidateId) || !stages.includes(stage)) {
    redirectHr(formData, "recruitment", {
      error: isDemoId(candidateId)
        ? "preview-readonly"
        : "candidate-stage-invalid",
    });
  }

  try {
    await prisma.hrCandidate.update({
      data: { stage: stage as never },
      where: { id: candidateId },
    });
  } catch (error) {
    logActionError("move candidate", error);
    redirectHr(formData, "recruitment", { error: "candidate-update-failed" });
  }

  revalidateHr(formData);
  redirectHr(formData, "recruitment", { success: "candidate-updated" });
}

export async function createHrPerformanceReviewAction(formData: FormData) {
  const session = await requirePermission("hr:manage");
  const parsed = hrPerformanceReviewSchema.safeParse({
    employeeId: getString(formData, "employeeId"),
    goals: getString(formData, "goals"),
    improvements: getString(formData, "improvements"),
    periodEnd: getString(formData, "periodEnd"),
    periodStart: getString(formData, "periodStart"),
    reviewerId: getString(formData, "reviewerId"),
    score: getString(formData, "score"),
    status: getString(formData, "status"),
    strengths: getString(formData, "strengths"),
  });

  if (
    !parsed.success ||
    isDemoId(parsed.success ? parsed.data.employeeId : "") ||
    isDemoId(parsed.success ? (parsed.data.reviewerId ?? "") : "")
  ) {
    redirectHr(formData, "performance", {
      error:
        parsed.success &&
        (isDemoId(parsed.data.employeeId) ||
          isDemoId(parsed.data.reviewerId ?? ""))
          ? "preview-readonly"
          : "review-validation",
    });
  }

  try {
    await requireEmployee(parsed.data.employeeId);
    if (parsed.data.reviewerId) {
      await requireEmployee(parsed.data.reviewerId);
    }
    await prisma.hrPerformanceReview.create({
      data: {
        ...parsed.data,
        completedAt: parsed.data.status === "COMPLETED" ? new Date() : null,
        createdById: session.userId,
        reviewerId: parsed.data.reviewerId ?? null,
        score: parsed.data.score ?? null,
      },
    });
  } catch (error) {
    logActionError("create performance review", error);
    redirectHr(formData, "performance", { error: "review-create-failed" });
  }

  revalidateHr(formData);
  redirectHr(formData, "performance", { success: "review-created" });
}

export async function createHrPayrollRunAction(formData: FormData) {
  const session = await requirePermission("hr:payroll");
  const parsed = hrPayrollRunSchema.safeParse({
    currency: getString(formData, "currency") || "AZN",
    periodEnd: getString(formData, "periodEnd"),
    periodStart: getString(formData, "periodStart"),
  });

  if (!parsed.success) {
    redirectHr(formData, "payroll", { error: "payroll-validation" });
  }

  try {
    const employees = await prisma.hrEmployee.findMany({
      select: { currency: true, id: true, salary: true },
      where: {
        currency: parsed.data.currency,
        employmentStatus: { in: ["ACTIVE", "PROBATION", "ON_LEAVE"] },
        salary: { gt: 0 },
      },
    });
    if (!employees.length) {
      throw new HrActionError("payroll-no-employees");
    }
    const totalGross = employees.reduce(
      (total, employee) => total + Number(employee.salary),
      0,
    );
    await prisma.hrPayrollRun.create({
      data: {
        code: `PAY-${parsed.data.periodStart.getFullYear()}-${String(parsed.data.periodStart.getMonth() + 1).padStart(2, "0")}`,
        createdById: session.userId,
        currency: parsed.data.currency,
        items: {
          create: employees.map((employee) => ({
            baseSalary: employee.salary,
            bonus: 0,
            currency: employee.currency,
            deductions: 0,
            employeeId: employee.id,
            netSalary: employee.salary,
          })),
        },
        periodEnd: parsed.data.periodEnd,
        periodStart: parsed.data.periodStart,
        totalGross,
        totalNet: totalGross,
      },
    });
  } catch (error) {
    logActionError("create payroll run", error);
    redirectHr(formData, "payroll", {
      error:
        error instanceof HrActionError ? error.code : "payroll-create-failed",
    });
  }

  revalidateHr(formData);
  redirectHr(formData, "payroll", { success: "payroll-created" });
}

export async function updateHrPayrollItemAction(formData: FormData) {
  await requirePermission("hr:payroll");
  const parsed = hrPayrollItemSchema.safeParse({
    bonus: getString(formData, "bonus") || "0",
    deductions: getString(formData, "deductions") || "0",
    itemId: getString(formData, "itemId"),
    note: getString(formData, "note"),
  });

  if (!parsed.success || isDemoId(parsed.success ? parsed.data.itemId : "")) {
    redirectHr(formData, "payroll", {
      error:
        parsed.success && isDemoId(parsed.data.itemId)
          ? "preview-readonly"
          : "payroll-item-validation",
    });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.hrPayrollItem.findFirst({
        select: {
          baseSalary: true,
          id: true,
          payrollRun: { select: { id: true, status: true } },
        },
        where: { id: parsed.data.itemId },
      });
      if (!item || item.payrollRun.status !== "DRAFT") {
        throw new HrActionError("payroll-not-editable");
      }
      const netSalary =
        Number(item.baseSalary) + parsed.data.bonus - parsed.data.deductions;
      if (netSalary < 0) {
        throw new HrActionError("payroll-negative-net");
      }
      await tx.hrPayrollItem.update({
        data: {
          bonus: parsed.data.bonus,
          deductions: parsed.data.deductions,
          netSalary,
          note: parsed.data.note ?? null,
        },
        where: { id: item.id },
      });
      const totals = await tx.hrPayrollItem.aggregate({
        _sum: {
          baseSalary: true,
          bonus: true,
          deductions: true,
          netSalary: true,
        },
        where: { payrollRunId: item.payrollRun.id },
      });
      await tx.hrPayrollRun.update({
        data: {
          totalBonus: totals._sum.bonus ?? 0,
          totalDeductions: totals._sum.deductions ?? 0,
          totalGross: totals._sum.baseSalary ?? 0,
          totalNet: totals._sum.netSalary ?? 0,
        },
        where: { id: item.payrollRun.id },
      });
    });
  } catch (error) {
    logActionError("update payroll item", error);
    redirectHr(formData, "payroll", {
      error:
        error instanceof HrActionError
          ? error.code
          : "payroll-item-update-failed",
    });
  }

  revalidateHr(formData);
  redirectHr(formData, "payroll", { success: "payroll-item-updated" });
}

export async function updateHrPayrollStatusAction(formData: FormData) {
  const session = await requirePermission("hr:payroll");
  const payrollRunId = getString(formData, "payrollRunId");
  const status = getString(formData, "status");

  if (
    !payrollRunId ||
    isDemoId(payrollRunId) ||
    !["APPROVED", "PAID", "CANCELLED"].includes(status)
  ) {
    redirectHr(formData, "payroll", {
      error: isDemoId(payrollRunId)
        ? "preview-readonly"
        : "payroll-status-invalid",
    });
  }

  try {
    const now = new Date();
    const allowedFrom =
      status === "APPROVED"
        ? ["DRAFT"]
        : status === "PAID"
          ? ["APPROVED"]
          : ["DRAFT", "APPROVED"];
    const updated = await prisma.hrPayrollRun.updateMany({
      data: {
        ...(status === "APPROVED"
          ? { approvedAt: now, approvedById: session.userId }
          : {}),
        ...(status === "PAID" ? { paidAt: now } : {}),
        status: status as never,
      },
      where: { id: payrollRunId, status: { in: allowedFrom as never } },
    });
    if (updated.count !== 1) {
      throw new HrActionError("payroll-status-transition");
    }
  } catch (error) {
    logActionError("update payroll status", error);
    redirectHr(formData, "payroll", {
      error:
        error instanceof HrActionError ? error.code : "payroll-status-failed",
    });
  }

  revalidateHr(formData);
  redirectHr(formData, "payroll", { success: "payroll-status-updated" });
}

function readEmployeeForm(formData: FormData) {
  return {
    address: getString(formData, "address"),
    annualLeaveAllowance: getString(formData, "annualLeaveAllowance") || "21",
    birthDate: getString(formData, "birthDate"),
    contractEndDate: getString(formData, "contractEndDate"),
    currency: getString(formData, "currency") || "AZN",
    department: getString(formData, "department"),
    email: getString(formData, "email"),
    emergencyContactName: getString(formData, "emergencyContactName"),
    emergencyContactPhone: getString(formData, "emergencyContactPhone"),
    emergencyContactRelation: getString(formData, "emergencyContactRelation"),
    employmentStatus: getString(formData, "employmentStatus") || "ACTIVE",
    employmentType: getString(formData, "employmentType") || "FULL_TIME",
    firstName: getString(formData, "firstName"),
    hiredAt: getString(formData, "hiredAt"),
    lastName: getString(formData, "lastName"),
    managerId: getString(formData, "managerId"),
    notes: getString(formData, "notes"),
    office: getString(formData, "office"),
    phone: getString(formData, "phone"),
    position: getString(formData, "position"),
    salary: getString(formData, "salary") || "0",
    workMode: getString(formData, "workMode") || "ONSITE",
  };
}

async function requireEmployee(id: string) {
  const employee = await prisma.hrEmployee.findUnique({
    select: { createdById: true, id: true, terminatedAt: true },
    where: { id },
  });
  if (!employee) {
    throw new HrActionError("employee-not-found");
  }
  return employee;
}

function countWorkingDays(startDate: Date, endDate: Date) {
  return Math.max(
    1,
    eachDayOfInterval({ end: endDate, start: startDate }).filter(
      (day) => !isWeekend(day),
    ).length,
  );
}

function createHrCode(prefix: string) {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `${prefix}-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isDemoId(value: string) {
  return value.startsWith("hr_demo_");
}

function revalidateHr(formData: FormData) {
  revalidatePath("/hr");
  const locale = getLocale(formData);
  if (locale !== defaultLocale) {
    revalidatePath(`/${locale}/hr`);
  }
}

function redirectHr(
  formData: FormData,
  tab: string,
  outcome: { error?: string; success?: string },
): never {
  const locale = getLocale(formData);
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  const search = new URLSearchParams({ tab });
  if (outcome.error) search.set("error", outcome.error);
  if (outcome.success) search.set("success", outcome.success);
  redirect(`${prefix}/hr?${search.toString()}`);
}

function getLocale(formData: FormData) {
  const locale = getString(formData, "locale");
  return locales.includes(locale as (typeof locales)[number])
    ? locale
    : defaultLocale;
}

function logActionError(scope: string, error: unknown) {
  const databaseCode =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "unknown";
  console.error("HR action failed", {
    code: databaseCode,
    name: error instanceof Error ? error.name : "UnknownError",
    scope,
  });
  if (process.env.NODE_ENV !== "production" && error instanceof Error) {
    console.error(error.message);
  }
}

class HrActionError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}
