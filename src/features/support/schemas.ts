import { z } from "zod";

import { SUPPORT_RELATED_MODULES } from "@/features/support/constants";

const relatedModules = SUPPORT_RELATED_MODULES.map(([value]) => value) as [
  string,
  ...string[],
];

export const createSupportTicketSchema = z.object({
  category: z.enum([
    "TECHNICAL",
    "PAYMENTS",
    "DOCUMENTS",
    "APPLICATIONS",
    "ACCOUNT_ACCESS",
    "SERVICE",
    "OTHER",
  ]),
  description: z
    .string()
    .trim()
    .min(20, "Problemi ən azı 20 simvolla ətraflı təsvir edin.")
    .max(5000, "Təsvir 5000 simvoldan uzun ola bilməz."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  relatedModule: z.enum(relatedModules).optional(),
  subject: z
    .string()
    .trim()
    .min(5, "Mövzu ən azı 5 simvol olmalıdır.")
    .max(160, "Mövzu 160 simvoldan uzun ola bilməz."),
});

export const supportReplySchema = z
  .object({
    body: z.string().trim().max(5000, "Cavab 5000 simvoldan uzun ola bilməz."),
    internal: z.boolean(),
    ticketId: z.string().trim().min(1),
  })
  .superRefine((value, context) => {
    if (!value.body) {
      context.addIssue({
        code: "custom",
        message: "Cavab yazın və ya fayl əlavə edin.",
        path: ["body"],
      });
    }
  });

export const supportTicketStatusSchema = z.enum([
  "NEW",
  "IN_PROGRESS",
  "WAITING_FOR_REQUESTER",
  "RESOLVED",
  "CLOSED",
]);

export const supportTicketPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);
