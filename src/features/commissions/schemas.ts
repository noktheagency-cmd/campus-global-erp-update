import { z } from "zod";

import { FINANCE_CURRENCIES } from "@/features/finance/constants";

const optionalText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() ? value.trim() : undefined,
    z.string().max(max).optional(),
  );

const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine(
    (value) =>
      FINANCE_CURRENCIES.includes(value as (typeof FINANCE_CURRENCIES)[number]),
    "Dəstəklənməyən valyutadır.",
  );

const shareSchema = z.coerce.number().finite().positive().max(999_999_999.9999);

export const commissionAgreementSchema = z
  .object({
    agentId: z.string().trim().min(1),
    agentMethod: z.enum(["PERCENTAGE", "FIXED"]),
    agentValue: shareSchema,
    calculationBasis: z.literal("PAYMENT_AMOUNT"),
    campusMethod: z.enum(["PERCENTAGE", "FIXED"]),
    campusValue: shareSchema,
    code: z.string().trim().min(5).max(60),
    currency: currencySchema,
    installmentPolicy: z.enum(["EVERY_PAYMENT", "FIRST_PAYMENT_ONLY"]),
    notes: optionalText(1_000),
    paymentTermDays: z.coerce.number().int().min(0).max(365),
    programId: optionalText(100),
    status: z.enum(["DRAFT", "ACTIVE"]),
    universityId: z.string().trim().min(1),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
  })
  .superRefine((value, context) => {
    if (value.validUntil < value.validFrom) {
      context.addIssue({
        code: "custom",
        message: "Bitmə tarixi başlanğıc tarixindən əvvəl ola bilməz.",
        path: ["validUntil"],
      });
    }
    if (value.campusMethod === "PERCENTAGE" && value.campusValue > 100) {
      context.addIssue({
        code: "custom",
        message: "Faiz 100-dən böyük ola bilməz.",
        path: ["campusValue"],
      });
    }
    if (value.agentMethod === "PERCENTAGE" && value.agentValue > 100) {
      context.addIssue({
        code: "custom",
        message: "Faiz 100-dən böyük ola bilməz.",
        path: ["agentValue"],
      });
    }
    if (
      value.campusMethod === "PERCENTAGE" &&
      value.agentMethod === "PERCENTAGE" &&
      value.campusValue + value.agentValue > 100
    ) {
      context.addIssue({
        code: "custom",
        message: "Ümumi komissiya 100%-i keçə bilməz.",
        path: ["agentValue"],
      });
    }
  });

export const commissionPaymentSchema = z.object({
  amount: z.coerce.number().finite().positive().max(999_999_999_999.99),
  applicationChoiceId: z.string().trim().min(1),
  currency: currencySchema,
  exchangeRate: z.coerce.number().finite().positive().max(1_000_000),
  notes: optionalText(500),
  paidAt: z.coerce.date(),
  reference: optionalText(100),
});

export const universityCommissionAgreementSchema = z
  .object({
    universityId: z.string().trim().min(1),
    programId: optionalText(100),
    currency: currencySchema,
    grossMethod: z.enum(["FIXED", "PERCENTAGE"]),
    grossValue: shareSchema,
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
    notes: optionalText(1_000),
  })
  .superRefine((value, context) => {
    if (value.validUntil < value.validFrom) {
      context.addIssue({
        code: "custom",
        path: ["validUntil"],
        message: "Bitmə tarixi başlanğıcdan əvvəl ola bilməz.",
      });
    }
    if (value.grossMethod === "PERCENTAGE" && value.grossValue > 100) {
      context.addIssue({
        code: "custom",
        path: ["grossValue"],
        message: "Faiz 100-dən böyük ola bilməz.",
      });
    }
  });

export const commissionApprovalSchema = z.object({
  calculationId: z.string().trim().min(1),
});

export const commissionAgreementStatusSchema = z.object({
  agreementId: z.string().trim().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]),
});
