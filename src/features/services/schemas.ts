import { z } from "zod";

const moneySchema = z.coerce
  .number()
  .finite()
  .min(0, "Qiymət mənfi ola bilməz.")
  .max(99_999_999.99, "Qiymət icazə verilən həddi keçir.");

const optionalMoneySchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  moneySchema.optional(),
);

const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Valyuta 3 hərfli ISO kodu olmalıdır.");

export const serviceMutationSchema = z
  .object({
    availableToAgents: z.boolean(),
    availableToStudents: z.boolean(),
    agentBasePrice: optionalMoneySchema,
    currency: currencySchema,
    description: z.string().trim().max(1000).optional(),
    name: z.string().trim().min(2, "Xidmət adı tələb olunur.").max(120),
    sortOrder: z.coerce.number().int().min(0).max(9999),
    status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
    studentPrice: optionalMoneySchema,
  })
  .superRefine((value, context) => {
    if (value.availableToStudents && value.studentPrice === undefined) {
      context.addIssue({
        code: "custom",
        message: "Tələbələr üçün qiymət daxil edin.",
        path: ["studentPrice"],
      });
    }

    if (!value.availableToAgents && !value.availableToStudents) {
      context.addIssue({
        code: "custom",
        message: "Ən azı bir alıcı tipi seçilməlidir.",
        path: ["availableToAgents"],
      });
    }
  });

export const agentPriceSchema = z.object({
  agentId: z.string().trim().min(1),
  amount: moneySchema,
  currency: currencySchema,
  serviceId: z.string().trim().min(1),
});

export const agentPriceProposalSchema = agentPriceSchema.extend({
  offerValidUntil: z
    .date()
    .optional()
    .refine((value) => !value || value.getTime() > Date.now(), {
      message: "Təklifin son tarixi gələcəkdə olmalıdır.",
    }),
  staffResponseNote: z.string().trim().max(1000).optional(),
});

export const serviceOrderSchema = z.object({
  customerNote: z.string().trim().max(1000).optional(),
  quantity: z.coerce.number().int().min(1).max(100),
  serviceId: z.string().trim().min(1),
});

export const serviceOrderUpdateSchema = z.object({
  internalNote: z.string().trim().max(1000).optional(),
  orderId: z.string().trim().min(1),
  status: z.enum([
    "PENDING",
    "APPROVED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export const serviceQuoteCreateSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(100),
  requestNote: z.string().trim().max(1000).optional(),
  serviceId: z.string().trim().min(1),
});

export const serviceQuoteOfferSchema = z.object({
  amount: moneySchema,
  currency: currencySchema,
  offerValidUntil: z
    .date()
    .optional()
    .refine((value) => !value || value.getTime() > Date.now(), {
      message: "Təklifin son tarixi gələcəkdə olmalıdır.",
    }),
  quoteRequestId: z.string().trim().min(1),
  staffResponseNote: z.string().trim().max(1000).optional(),
});

export const serviceQuoteRejectSchema = z.object({
  quoteRequestId: z.string().trim().min(1),
  reason: z.string().trim().min(3).max(1000),
});

export const serviceQuoteDecisionSchema = z
  .object({
    decision: z.enum(["ACCEPTED", "DECLINED"]),
    quoteRequestId: z.string().trim().min(1),
    reason: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, context) => {
    if (value.decision === "DECLINED" && !value.reason) {
      context.addIssue({
        code: "custom",
        message: "İmtina səbəbini yazın.",
        path: ["reason"],
      });
    }
  });

const optionalIdSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);

const optionalTextSchema = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(max).optional(),
  );

export const documentOrderCreateSchema = z
  .object({
    agentId: optionalIdSchema,
    beneficiaryFin: optionalTextSchema(20),
    beneficiaryName: optionalTextSchema(80),
    beneficiaryPassport: optionalTextSchema(40),
    beneficiarySurname: optionalTextSchema(80),
    currency: currencySchema,
    deliveryDate: z.date().optional(),
    externalStudentName: optionalTextSchema(80),
    externalStudentPassport: optionalTextSchema(40),
    externalStudentSurname: optionalTextSchema(80),
    managerId: optionalIdSchema,
    manualServiceName: optionalTextSchema(160),
    note: optionalTextSchema(1500),
    price: optionalMoneySchema,
    serviceId: optionalIdSchema,
    source: z.enum(["SYSTEM", "WHATSAPP", "PHONE"]),
    studentId: optionalIdSchema,
  })
  .superRefine((value, context) => {
    if (!value.serviceId && !value.manualServiceName) {
      context.addIssue({
        code: "custom",
        message: "Xidmət və ya sənəd növünü seçin.",
        path: ["serviceId"],
      });
    }

    if (
      !value.studentId &&
      (!value.externalStudentName || !value.externalStudentSurname)
    ) {
      context.addIssue({
        code: "custom",
        message: "Tələbəni seçin və ya bazadan kənar tələbənin adını yazın.",
        path: ["studentId"],
      });
    }
  });

export const documentOrderStatusSchema = z
  .object({
    note: optionalTextSchema(1000),
    orderId: z.string().trim().min(1),
    recipientFin: optionalTextSchema(20),
    recipientName: optionalTextSchema(80),
    recipientSurname: optionalTextSchema(80),
    recipientType: z.enum(["STUDENT", "AGENT", "OTHER"]).optional(),
    status: z.enum([
      "ORDERED",
      "IN_PROGRESS",
      "PREPARING",
      "AT_OFFICE",
      "DELIVERED",
      "RETURNED",
    ]),
  })
  .superRefine((value, context) => {
    if (
      value.status === "DELIVERED" &&
      (!value.recipientType || !value.recipientName || !value.recipientSurname)
    ) {
      context.addIssue({
        code: "custom",
        message: "Təhvil alan şəxsin tipi, adı və soyadı tələb olunur.",
        path: ["recipientName"],
      });
    }
  });

export const documentOrderPaymentSchema = z.object({
  amount: moneySchema,
  orderId: z.string().trim().min(1),
});

export const documentOrderManagerSchema = z.object({
  managerId: optionalIdSchema,
  orderId: z.string().trim().min(1),
});
