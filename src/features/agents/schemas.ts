import { z } from "zod";

import {
  AGENT_PORTAL_STATUSES,
  AGENT_SOCIAL_PLATFORMS,
  AGENT_TIERS,
} from "@/features/agents/constants";

const optionalUrl = z.union([z.string().url(), z.literal("")]).optional();
const optionalStorageUrl = z
  .union([z.string().url(), z.string().startsWith("storage://"), z.literal("")])
  .optional();
const optionalEmail = z
  .union([z.string().trim().email("Düzgün e-poçt daxil edin."), z.literal("")])
  .optional();

export const agentSocialLinkSchema = z.object({
  platform: z.enum(AGENT_SOCIAL_PLATFORMS),
  url: z.string().trim().url("Düzgün keçid daxil edin."),
});

export const agentContactSchema = z
  .object({
    email: optionalEmail,
    fullName: z.string().trim().min(2, "Əlaqəli şəxsin adını daxil edin."),
    isPrimary: z.boolean().default(false),
    phone: z.string().trim().optional(),
    position: z.string().trim().optional(),
    whatsapp: z.string().trim().optional(),
  })
  .refine(
    (contact) => Boolean(contact.email || contact.phone || contact.whatsapp),
    "Ən azı bir əlaqə vasitəsi daxil edin.",
  );

export const agentCreateSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required."),
  lastName: z.string().trim().min(2, "Last name is required."),
  companyName: z.string().trim().optional(),
  logoUrl: optionalStorageUrl,
  profilePhotoUrl: optionalStorageUrl,
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Parol ən azı 8 simvol olmalıdır."),
  phone: z.string().trim().optional(),
  country: z.string().trim().optional(),
  address: z.string().trim().optional(),
  instagramUrl: optionalUrl,
  socialLinks: z.array(agentSocialLinkSchema).max(8).default([]),
  contacts: z
    .array(agentContactSchema)
    .max(10)
    .refine(
      (contacts) => contacts.filter((contact) => contact.isPrimary).length <= 1,
      "Yalnız bir əsas əlaqəli şəxs seçilə bilər.",
    )
    .default([]),
  internalNotes: z.string().trim().optional(),
  portalStatus: z.enum(AGENT_PORTAL_STATUSES).default("READY"),
  tier: z.enum(AGENT_TIERS).default("STARTER"),
  canRegisterStudents: z.boolean().default(true),
  ownStudentsOnly: z.boolean().default(true),
  portalReporting: z.boolean().default(true),
});

export const agentPayoutSettingsSchema = z.object({
  agentId: z.string().trim().min(1),
  cashPayoutActive: z.boolean(),
  accountPayoutActive: z.boolean(),
  holdInAccount: z.boolean(),
  manualPayoutManagement: z.boolean(),
  payoutPercentage: z.coerce.number().finite().min(0).max(100),
});

export const agentPasswordChangeSchema = z
  .object({
    agentId: z.string().trim().min(1),
    password: z.string().min(8, "Parol ən azı 8 simvol olmalıdır."),
    confirmPassword: z.string().min(8, "Parol təsdiqi tələb olunur."),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        message: "Parollar eyni deyil.",
        path: ["confirmPassword"],
      });
    }
  });

export type AgentCreateInput = z.infer<typeof agentCreateSchema>;
export type AgentPayoutSettingsInput = z.infer<typeof agentPayoutSettingsSchema>;
export type AgentPasswordChangeInput = z.infer<typeof agentPasswordChangeSchema>;
