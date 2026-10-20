import { z } from "zod";

const optionalEmail = z.union([z.string().email(), z.literal("")]).optional();
const optionalStorageUrl = z
  .union([z.string().url(), z.string().startsWith("storage://"), z.literal("")])
  .optional();

export const studentCreateSchema = z.object({
  address: z.string().trim().optional(),
  agentId: z.string().trim().optional(),
  birthDate: z.coerce.date().optional(),
  citizenship: z.string().trim().optional(),
  contactEmail: optionalEmail,
  fatherName: z.string().trim().optional(),
  firstName: z.string().trim().min(2, "First name is required."),
  gender: z.enum(["Male", "Female"]).default("Male"),
  identityNo: z.string().trim().optional(),
  intent: z.enum(["create", "draft"]).default("create"),
  lastName: z.string().trim().min(2, "Last name is required."),
  loginEmail: z.string().trim().email("Enter a valid login email."),
  maritalStatus: z.enum(["Single", "Married"]).default("Single"),
  motherName: z.string().trim().optional(),
  passportNo: z.string().trim().optional(),
  password: z.string().min(8, "Parol ən azı 8 simvol olmalıdır."),
  phone: z.string().trim().optional(),
  photoUrl: optionalStorageUrl,
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;

export const agentStudentProfileSchema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  fatherName: z.string().trim().max(100).nullable(),
  motherName: z.string().trim().max(100).nullable(),
  birthDate: z.date().nullable(),
  gender: z.string().trim().max(30).nullable(),
  maritalStatus: z.string().trim().max(30).nullable(),
  address: z.string().trim().max(500).nullable(),
  citizenship: z.string().trim().max(100).nullable(),
  contactEmail: z.email().nullable(),
  identityNo: z.string().trim().max(100).nullable(),
  passportNo: z.string().trim().max(100).nullable(),
  phone: z.string().trim().max(50).nullable(),
});
