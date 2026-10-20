import { z } from "zod";

export const crmSubjectSchema = z.object({
  kind: z.enum(["individual", "agent"]),
  subjectId: z.string().trim().min(1).max(120),
});

export const crmTaskCreateSchema = crmSubjectSchema.extend({
  assignedToId: z.string().trim().max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  dueAt: z.coerce.date(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  title: z.string().trim().min(3).max(180),
});

export const crmInteractionCreateSchema = crmSubjectSchema.extend({
  body: z.string().trim().max(4000).optional(),
  direction: z.enum(["INBOUND", "OUTBOUND", "INTERNAL"]),
  occurredAt: z.coerce.date().optional(),
  subject: z.string().trim().min(2).max(180),
  type: z.enum([
    "CALL",
    "EMAIL",
    "WHATSAPP",
    "MEETING",
    "NOTE",
    "APPLICATION",
    "DOCUMENT",
    "SYSTEM",
  ]),
});

export const crmProfileUpdateSchema = crmSubjectSchema.extend({
  nextFollowUpAt: z.coerce.date().nullable().optional(),
  ownerId: z.string().trim().max(120).nullable().optional(),
  preferredDestination: z.string().trim().max(180).optional(),
  source: z.enum([
    "WEBSITE",
    "INSTAGRAM",
    "FACEBOOK",
    "WHATSAPP",
    "REFERRAL",
    "AGENT_REFERRAL",
    "EVENT",
    "MANUAL",
    "OTHER",
  ]).optional(),
  stage: z.enum([
    "NEW_LEAD",
    "CONTACTED",
    "CONSULTATION",
    "DOCUMENT_COLLECTION",
    "APPLICATION",
    "OFFER",
    "ENROLLED",
    "PARTNER_ONBOARDING",
    "ACTIVE_PARTNER",
    "WON",
    "LOST",
  ]).optional(),
  status: z.enum(["ACTIVE", "FOLLOW_UP", "PAUSED", "WON", "LOST"]).optional(),
});

export const crmTaskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  taskId: z.string().trim().min(1).max(120),
});
