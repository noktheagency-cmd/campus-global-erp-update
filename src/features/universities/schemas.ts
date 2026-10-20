import { z } from "zod";

import {
  AGREEMENT_STATUSES,
  CURRENCIES,
  ENTITY_STATUSES,
  PARTNERSHIP_STATUSES,
  PERIOD_STATUSES,
  PRICE_STATUSES,
  PROGRAM_STATUSES,
  SCHOOL_TYPES,
} from "@/features/universities/constants";

const optionalUrl = z.union([z.string().url(), z.literal("")]).optional();
const optionalStorageUrl = z
  .union([z.string().url(), z.string().startsWith("storage://"), z.literal("")])
  .optional();
const optionalEmail = z.union([z.string().email(), z.literal("")]).optional();
const optionalCurrency = z
  .union([z.enum(CURRENCIES), z.literal("")])
  .optional();

const universityBaseSchema = z.object({
  name: z.string().trim().min(2),
  logoUrl: optionalStorageUrl,
  country: z.string().trim().min(1),
  city: z.string().trim().min(1),
  website: optionalUrl,
  newsSourceUrl: optionalUrl,
  schoolType: z.enum(SCHOOL_TYPES),
  partnershipStatus: z.enum(PARTNERSHIP_STATUSES).default("PROSPECT"),
  agreementStatus: z.enum(AGREEMENT_STATUSES).default("NONE"),
  mainEmail: optionalEmail,
  mainPhone: z.string().trim().optional(),
  internalNotes: z.string().trim().optional(),
  status: z.enum(ENTITY_STATUSES).default("ACTIVE"),
});

export const universityCreateSchema = universityBaseSchema.extend({
  defaultPeriodId: z.string().trim().optional(),
  defaultEducationLevelId: z.string().trim().optional(),
  defaultEducationLanguageId: z.string().trim().optional(),
  defaultCurrency: optionalCurrency,
  periodIds: z.array(z.string().trim()).default([]),
  educationLevelIds: z.array(z.string().trim()).default([]),
  educationLanguageIds: z.array(z.string().trim()).default([]),
  currencies: z.array(z.enum(CURRENCIES)).default([]),
  manualPeriodName: z.string().trim().optional(),
  manualPeriodYear: z.coerce.number().int().min(2020).optional(),
  manualPeriodSeason: z.string().trim().optional(),
  manualPeriodStartDate: z.coerce.date().optional(),
  manualPeriodDeadline: z.coerce.date().optional(),
  manualEducationLevelName: z.string().trim().optional(),
  manualEducationLanguageName: z.string().trim().optional(),
});

export const universityUpdateSchema = universityBaseSchema.extend({
  id: z.string().min(1),
});

export const campusCreateSchema = z.object({
  universityId: z.string().min(1),
  name: z.string().trim().min(2),
  country: z.string().trim().min(1),
  city: z.string().trim().min(1),
  address: z.string().trim().optional(),
  imageUrl: optionalStorageUrl,
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  isMainCampus: z.boolean().default(false),
  status: z.enum(ENTITY_STATUSES).default("ACTIVE"),
  notes: z.string().trim().optional(),
});

export const campusUpdateSchema = campusCreateSchema.extend({
  campusId: z.string().min(1),
});

export const programCreateSchema = z.object({
  universityId: z.string().min(1),
  campusId: z.string().optional(),
  educationLevelId: z.string().min(1),
  educationLanguageId: z.string().min(1),
  name: z.string().trim().min(2),
  duration: z.string().trim().optional(),
  studyMode: z.string().trim().optional(),
  requirementsSummary: z.string().trim().optional(),
  status: z.enum(PROGRAM_STATUSES).default("DRAFT"),
  notes: z.string().trim().optional(),
});

export const programUpdateSchema = programCreateSchema.extend({
  programId: z.string().min(1),
});

export const periodCreateSchema = z.object({
  name: z.string().trim().min(2),
  year: z.coerce.number().int().min(2020),
  season: z.string().trim().min(1),
  applicationStartDate: z.coerce.date().optional(),
  applicationDeadline: z.coerce.date().optional(),
  status: z.enum(PERIOD_STATUSES).default("OPEN"),
  notes: z.string().trim().optional(),
});

export const tuitionCreateSchema = z
  .object({
    programId: z.string().min(1),
    periodId: z.string().min(1),
    currency: z.enum(CURRENCIES),
    tuitionFee: z.coerce.number().positive(),
    discountedTuitionFee: z.coerce.number().positive().optional(),
    scholarshipType: z.enum(["AMOUNT", "PERCENTAGE", "CUSTOM"]).optional(),
    scholarshipValue: z.coerce.number().positive().optional(),
    paymentNote: z.string().trim().optional(),
    priceStatus: z.enum(PRICE_STATUSES).default("DRAFT"),
  })
  .refine(
    (value) =>
      !value.discountedTuitionFee ||
      value.discountedTuitionFee <= value.tuitionFee,
    {
      message: "Endirimli təhsil haqqı təhsil haqqından çox ola bilməz.",
      path: ["discountedTuitionFee"],
    },
  );

export const tuitionUpdateSchema = tuitionCreateSchema.extend({
  tuitionId: z.string().min(1),
});

export const documentCreateSchema = z
  .object({
    universityId: z.string().min(1),
    relatedEntityType: z.enum([
      "UNIVERSITY",
      "CAMPUS",
      "PROGRAM",
      "PERIOD",
      "TUITION",
    ]),
    relatedEntityId: z.string().min(1),
    title: z.string().trim().min(2),
    documentType: z.string().trim().min(2),
    fileUrl: optionalUrl,
    validFrom: z.coerce.date().optional(),
    expiryDate: z.coerce.date().optional(),
    notes: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (
      value.validFrom &&
      value.expiryDate &&
      value.validFrom > value.expiryDate
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Başlama tarixi bitmə tarixindən sonra ola bilməz.",
        path: ["validFrom"],
      });
    }
  });

export const documentUpdateSchema = documentCreateSchema.extend({
  currentFileUrl: z.string().trim().optional(),
  documentId: z.string().min(1),
});

export const contactCreateSchema = z.object({
  universityId: z.string().min(1),
  fullName: z.string().trim().min(2),
  position: z.string().trim().optional(),
  department: z.string().trim().optional(),
  email: optionalEmail,
  phone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().trim().optional(),
  status: z.enum(ENTITY_STATUSES).default("ACTIVE"),
});

export const contactUpdateSchema = contactCreateSchema.extend({
  contactId: z.string().min(1),
});

export const noteCreateSchema = z.object({
  universityId: z.string().min(1),
  relatedEntityType: z
    .enum(["UNIVERSITY", "CAMPUS", "PROGRAM", "PERIOD", "TUITION", "CONTACT"])
    .optional(),
  relatedEntityId: z.string().trim().optional(),
  body: z.string().trim().min(2),
});

export const noteUpdateSchema = noteCreateSchema.extend({
  noteId: z.string().min(1),
});

export type UniversityCreateInput = z.infer<typeof universityCreateSchema>;
export type UniversityUpdateInput = z.infer<typeof universityUpdateSchema>;
export type CampusCreateInput = z.infer<typeof campusCreateSchema>;
export type CampusUpdateInput = z.infer<typeof campusUpdateSchema>;
export type ProgramCreateInput = z.infer<typeof programCreateSchema>;
export type ProgramUpdateInput = z.infer<typeof programUpdateSchema>;
export type PeriodCreateInput = z.infer<typeof periodCreateSchema>;
export type TuitionCreateInput = z.infer<typeof tuitionCreateSchema>;
export type TuitionUpdateInput = z.infer<typeof tuitionUpdateSchema>;
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type DocumentUpdateInput = z.infer<typeof documentUpdateSchema>;
export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
export type NoteCreateInput = z.infer<typeof noteCreateSchema>;
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>;
