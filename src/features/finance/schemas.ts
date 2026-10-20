import { z } from "zod";

import { FINANCE_CURRENCIES } from "@/features/finance/constants";

const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .refine(
    (value) =>
      FINANCE_CURRENCIES.includes(value as (typeof FINANCE_CURRENCIES)[number]),
    "Dəstəklənməyən valyutadır.",
  );

const positiveMoneySchema = z.coerce
  .number()
  .finite()
  .positive()
  .max(999_999_999_999.99);

const optionalPositiveMoneySchema = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : value,
  positiveMoneySchema.optional(),
);

const optionalText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() ? value.trim() : undefined,
    z.string().max(max).optional(),
  );

export const financeAccountSchema = z.object({
  accountNumber: optionalText(80),
  bankName: optionalText(100),
  currency: currencySchema,
  exchangeRate: positiveMoneySchema.max(1_000_000),
  name: z.string().trim().min(2).max(100),
  openingBalance: z.coerce
    .number()
    .finite()
    .min(-999_999_999_999.99)
    .max(999_999_999_999.99),
  openingBalanceDate: z.coerce.date(),
  type: z.enum(["BANK", "CASH", "DIGITAL_WALLET"]),
});

export const financeCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export const financeTransactionSchema = z
  .object({
    accountId: z.string().trim().min(1),
    amount: positiveMoneySchema,
    categoryId: optionalText(100),
    counterpartyName: optionalText(160),
    counterpartyType: z
      .enum(["STUDENT", "AGENT", "UNIVERSITY", "VENDOR", "PARTNER", "OTHER"])
      .optional(),
    description: optionalText(300),
    destinationAccountId: optionalText(100),
    destinationAmount: optionalPositiveMoneySchema,
    effectiveAt: z.coerce.date(),
    exchangeRate: positiveMoneySchema.max(1_000_000),
    obligationId: optionalText(100),
    reference: optionalText(100),
    status: z.enum(["DRAFT", "POSTED"]),
    type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  })
  .superRefine((value, context) => {
    if (value.type === "TRANSFER") {
      if (!value.destinationAccountId) {
        context.addIssue({
          code: "custom",
          message: "Təyinat hesabı seçilməlidir.",
          path: ["destinationAccountId"],
        });
      }
      if (value.destinationAccountId === value.accountId) {
        context.addIssue({
          code: "custom",
          message: "Transfer hesabları fərqli olmalıdır.",
          path: ["destinationAccountId"],
        });
      }
      if (value.categoryId) {
        context.addIssue({
          code: "custom",
          message: "Transfer üçün kateqoriya seçilmir.",
          path: ["categoryId"],
        });
      }
    } else if (!value.categoryId) {
      context.addIssue({
        code: "custom",
        message: "Kateqoriya seçilməlidir.",
        path: ["categoryId"],
      });
    }

    if (Boolean(value.counterpartyType) !== Boolean(value.counterpartyName)) {
      context.addIssue({
        code: "custom",
        message: "Tərəf növü və adı birlikdə daxil edilməlidir.",
        path: ["counterpartyName"],
      });
    }

    if (value.status === "DRAFT" && value.obligationId) {
      context.addIssue({
        code: "custom",
        message: "Qaralama öhdəliyə bağlana bilməz.",
        path: ["obligationId"],
      });
    }
  });

export const financeObligationSchema = z
  .object({
    amount: positiveMoneySchema,
    categoryId: optionalText(100),
    counterpartyName: z.string().trim().min(2).max(160),
    counterpartyType: z.enum([
      "STUDENT",
      "AGENT",
      "UNIVERSITY",
      "VENDOR",
      "PARTNER",
      "OTHER",
    ]),
    currency: currencySchema,
    description: optionalText(300),
    dueDate: z.coerce.date(),
    exchangeRate: positiveMoneySchema.max(1_000_000),
    issueDate: z.coerce.date(),
    reference: optionalText(100),
    type: z.enum(["RECEIVABLE", "PAYABLE"]),
  })
  .refine((value) => value.dueDate >= value.issueDate, {
    message: "Son tarix sənəd tarixindən əvvəl ola bilməz.",
    path: ["dueDate"],
  });

export const financeBudgetSchema = z
  .object({
    categoryId: z.string().trim().min(1),
    currency: currencySchema,
    endDate: z.coerce.date(),
    name: z.string().trim().min(2).max(100),
    plannedAmount: positiveMoneySchema,
    startDate: z.coerce.date(),
    status: z.enum(["DRAFT", "ACTIVE"]),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "Büdcə bitmə tarixi başlanğıc tarixindən əvvəl ola bilməz.",
    path: ["endDate"],
  });

export const financeVoidSchema = z.object({
  reason: z.string().trim().min(3).max(240),
  transactionId: z.string().trim().min(1),
});

export const financePostSchema = z.object({
  transactionId: z.string().trim().min(1),
});

export const financeExchangeRateSchema = z.object({
  accountId: z.string().trim().min(1),
  exchangeRate: positiveMoneySchema.max(1_000_000),
});
