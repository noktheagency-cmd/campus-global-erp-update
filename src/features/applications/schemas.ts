import { z } from "zod";

import {
  APPLICATION_DOCUMENT_RESPONSE_TYPE_VALUES,
  APPLICATION_STATUSES,
} from "@/features/applications/constants";

const optionalEmail = z.union([z.string().email(), z.literal("")]).optional();

export const studentApplicationSchema = z.object({
  firstName: z.string().trim().min(2, "Ad daxil edilməlidir."),
  lastName: z.string().trim().min(2, "Soyad daxil edilməlidir."),
  fatherName: z.string().trim().optional(),
  motherName: z.string().trim().optional(),
  birthDate: z.coerce.date().optional(),
  contactEmail: optionalEmail,
  loginEmail: optionalEmail,
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  passportNo: z.string().trim().optional(),
  identityNo: z.string().trim().optional(),
  citizenship: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  maritalStatus: z.string().trim().optional(),
});

export const applicationChoiceSchema = z.object({
  programId: z.string().trim().min(1),
  tuitionId: z.string().trim().nullable().optional(),
  universityId: z.string().trim().min(1),
});

export const applicationEducationRecordSchema = z.object({
  averageScore: z.string().trim().optional(),
  city: z.string().trim().optional(),
  country: z.string().trim().optional(),
  endYear: z.coerce.number().int().min(1900).max(2200).optional(),
  gradingSystem: z.string().trim().optional(),
  institutionName: z.string().trim().min(2, "Müəssisə adı daxil edilməlidir."),
  startYear: z.coerce.number().int().min(1900).max(2200).optional(),
});

export const applicationExamRecordSchema = z.object({
  examDate: z.preprocess(
    (value) => value === "" || value === null ? undefined : value,
    z.coerce.date().optional(),
  ),
  examName: z.string().trim().optional(),
  maxScore: z.string().trim().optional(),
  score: z.string().trim().optional(),
});

export const applicationCreateSchema = z.object({
  agentId: z.string().trim().optional(),
  choices: z.array(applicationChoiceSchema).min(1, "Ən azı bir ixtisas seçin."),
  country: z.string().trim().min(1, "Ölkə seçilməlidir."),
  education: applicationEducationRecordSchema,
  educationLevelId: z.string().trim().min(1, "Təhsil pilləsi seçilməlidir."),
  educationLevelKey: z.string().trim().min(1),
  exams: z.array(applicationExamRecordSchema).default([]),
  intent: z.enum(["draft", "submit"]).default("draft"),
  internalNotes: z.string().trim().optional(),
  periodId: z.string().trim().min(1, "Dönəm seçilməlidir."),
  selectedStudentId: z.string().trim().optional(),
  student: studentApplicationSchema,
});

export const applicationDocumentRequestCreateSchema = z.object({
  amount: z.number().nonnegative().optional(),
  applicationChoiceId: z.string().trim().min(1),
  applicationId: z.string().trim().min(1),
  currency: z.string().trim().length(3).optional(),
  deadline: z.coerce
    .date()
    .refine((value) => value.getTime() > Date.now(), "Deadline gələcək tarix olmalıdır."),
  documentType: z.string().trim().min(2).max(80),
  instructions: z.string().trim().max(2000).optional(),
  responseType: z.enum(APPLICATION_DOCUMENT_RESPONSE_TYPE_VALUES),
  title: z.string().trim().min(2).max(160),
});

export const applicationDocumentRequestResponseSchema = z.object({
  applicationId: z.string().trim().min(1),
  requestId: z.string().trim().min(1),
  responseDate: z.coerce.date(),
  responseNote: z.string().trim().max(1000).optional(),
});

export const applicationListFilterSchema = z.object({
  agentId: z.string().default("all"),
  applicationNo: z.string().default(""),
  completion: z.enum(["all", "completed", "incomplete"]).default("all"),
  country: z.string().default("all"),
  dateFrom: z.string().default(""),
  dateTo: z.string().default(""),
  levelId: z.string().default("all"),
  managerId: z.string().default("all"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(5).max(50).default(8),
  passportNo: z.string().default(""),
  periodId: z.string().default("all"),
  portalNo: z.string().default(""),
  programId: z.string().default("all"),
  query: z.string().default(""),
  sort: z.enum(["updated-desc", "created-desc", "student-asc"]).default(
    "updated-desc",
  ),
  status: z
    .union([z.enum(APPLICATION_STATUSES), z.literal("all")])
    .default("all"),
  studentName: z.string().default(""),
  universityId: z.string().default("all"),
});

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
