import { z } from "zod";

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().max(500).optional(),
);

const optionalDate = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce.date().optional(),
);

const optionalMoney = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().min(0).max(999_999_999_999.99).optional(),
);

export const hrEmployeeSchema = z
  .object({
    address: optionalText,
    annualLeaveAllowance: z.coerce.number().int().min(0).max(365).default(21),
    birthDate: optionalDate,
    contractEndDate: optionalDate,
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/)
      .default("AZN"),
    department: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email().max(180),
    emergencyContactName: optionalText,
    emergencyContactPhone: optionalText,
    emergencyContactRelation: optionalText,
    employmentStatus: z.enum([
      "ACTIVE",
      "PROBATION",
      "ON_LEAVE",
      "INACTIVE",
      "TERMINATED",
    ]),
    employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
    firstName: z.string().trim().min(2).max(80),
    hiredAt: z.coerce.date(),
    lastName: z.string().trim().min(2).max(80),
    managerId: optionalText,
    notes: optionalText,
    office: optionalText,
    phone: optionalText,
    position: z.string().trim().min(2).max(120),
    salary: z.coerce.number().min(0).max(999_999_999_999.99),
    workMode: z.enum(["ONSITE", "HYBRID", "REMOTE"]),
  })
  .refine(
    (value) => !value.contractEndDate || value.contractEndDate >= value.hiredAt,
    { message: "Müqavilə tarixi işə başlama tarixindən əvvəl ola bilməz." },
  );

export const hrAttendanceSchema = z.object({
  checkIn: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional()
    .or(z.literal("")),
  checkOut: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional()
    .or(z.literal("")),
  employeeId: z.string().trim().min(1),
  note: optionalText,
  status: z.enum([
    "PRESENT",
    "LATE",
    "REMOTE",
    "ABSENT",
    "SICK_LEAVE",
    "VACATION",
  ]),
  workDate: z.coerce.date(),
});

export const hrLeaveRequestSchema = z
  .object({
    employeeId: z.string().trim().min(1),
    endDate: z.coerce.date(),
    reason: optionalText,
    startDate: z.coerce.date(),
    type: z.enum([
      "ANNUAL",
      "SICK",
      "UNPAID",
      "MATERNITY",
      "PATERNITY",
      "STUDY",
      "OTHER",
    ]),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "Bitmə tarixi başlanğıc tarixindən əvvəl ola bilməz.",
  })
  .refine(
    (value) =>
      value.endDate.getTime() - value.startDate.getTime() <=
      366 * 24 * 60 * 60 * 1_000,
    {
      message: "Məzuniyyət intervalı 366 gündən çox ola bilməz.",
    },
  );

export const hrVacancySchema = z.object({
  closingDate: optionalDate,
  department: z.string().trim().min(2).max(100),
  description: optionalText,
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
  headcount: z.coerce.number().int().min(1).max(100),
  hiringManagerId: optionalText,
  location: optionalText,
  status: z.enum(["DRAFT", "OPEN", "PAUSED", "CLOSED"]),
  title: z.string().trim().min(2).max(140),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE"]),
});

export const hrCandidateSchema = z.object({
  appliedAt: z.coerce.date(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .default("AZN"),
  email: z.string().trim().toLowerCase().email().max(180),
  expectedSalary: optionalMoney,
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  nextInterviewAt: optionalDate,
  notes: optionalText,
  phone: optionalText,
  rating: z.coerce.number().int().min(0).max(5),
  source: optionalText,
  stage: z.enum([
    "APPLIED",
    "SCREENING",
    "INTERVIEW",
    "OFFER",
    "HIRED",
    "REJECTED",
  ]),
  vacancyId: z.string().trim().min(1),
});

export const hrPerformanceReviewSchema = z
  .object({
    employeeId: z.string().trim().min(1),
    goals: optionalText,
    improvements: optionalText,
    periodEnd: z.coerce.date(),
    periodStart: z.coerce.date(),
    reviewerId: optionalText,
    score: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce.number().min(0).max(5).optional(),
    ),
    status: z.enum(["DRAFT", "IN_PROGRESS", "COMPLETED"]),
    strengths: optionalText,
  })
  .refine((value) => value.periodEnd >= value.periodStart, {
    message: "Dövrün bitmə tarixi başlanğıc tarixindən əvvəl ola bilməz.",
  });

export const hrPayrollRunSchema = z
  .object({
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/)
      .default("AZN"),
    periodEnd: z.coerce.date(),
    periodStart: z.coerce.date(),
  })
  .refine((value) => value.periodEnd >= value.periodStart, {
    message: "Payroll dövrü düzgün deyil.",
  });

export const hrPayrollItemSchema = z.object({
  bonus: z.coerce.number().min(0).max(999_999_999_999.99),
  deductions: z.coerce.number().min(0).max(999_999_999_999.99),
  itemId: z.string().trim().min(1),
  note: optionalText,
});
