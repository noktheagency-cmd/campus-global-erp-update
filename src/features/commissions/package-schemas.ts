import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() ? value.trim() : undefined,
    z.string().max(max).optional(),
  );

const positiveOptionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().finite().positive().optional(),
);

const optionalAcademicYear = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
  z
    .string()
    .regex(/^\d{4}-\d{4}$/)
    .nullable(),
);

const packageEducationLevelSchema = z.enum([
  "ASSOCIATE",
  "BACHELOR",
  "MASTER",
  "PHD",
  "FOUNDATION",
  "LANGUAGE",
]);

const scholarshipAwardSchema = z
  .object({
    allPrograms: z.boolean(),
    educationLevel: packageEducationLevelSchema,
    programIds: z.array(z.string().trim().min(1)).max(2_000),
    quantity: z.coerce.number().int().min(1).max(100),
  })
  .superRefine((value, context) => {
    if (!value.allPrograms && value.programIds.length === 0) {
      context.addIssue({
        code: "custom",
        message: "Ən azı bir ixtisas seçilməlidir.",
        path: ["programIds"],
      });
    }
  });

export const commissionPackageRuleSchema = z
  .object({
    commissionType: z.enum(["FIXED", "PERCENTAGE_CASH", "PERCENTAGE_DELAYED"]),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/),
    educationLevel: packageEducationLevelSchema,
    fixedAmount: positiveOptionalNumber,
    rateTier1: positiveOptionalNumber,
    rateTier2: positiveOptionalNumber,
    tierThreshold: z.coerce.number().int().min(1).max(100_000),
  })
  .superRefine((value, context) => {
    if (value.commissionType === "FIXED" && !value.fixedAmount) {
      context.addIssue({
        code: "custom",
        message: "Sabit məbləğ daxil edilməlidir.",
        path: ["fixedAmount"],
      });
    }
    if (value.commissionType !== "FIXED") {
      if (!value.rateTier1 || value.rateTier1 > 100) {
        context.addIssue({
          code: "custom",
          message: "Birinci faiz 0–100 aralığında olmalıdır.",
          path: ["rateTier1"],
        });
      }
      if (!value.rateTier2 || value.rateTier2 > 100) {
        context.addIssue({
          code: "custom",
          message: "İkinci faiz 0–100 aralığında olmalıdır.",
          path: ["rateTier2"],
        });
      }
    }
  });

export const commissionPackageSchema = z
  .object({
    academicYear: optionalAcademicYear,
    description: optionalText(1_000),
    mixedScholarship: z
      .object({
        additionalInterval: z.coerce.number().int().min(1).max(100_000),
        description: optionalText(300),
        firstThreshold: z.coerce.number().int().min(1).max(100_000),
      })
      .nullable(),
    name: z.string().trim().min(3).max(120),
    packageId: optionalText(100),
    rules: z
      .array(commissionPackageRuleSchema)
      .length(6)
      .refine(
        (rules) => new Set(rules.map((rule) => rule.educationLevel)).size === 6,
        "Hər təhsil səviyyəsi üçün bir qayda olmalıdır.",
      ),
    scholarships: z
      .array(
        z.object({
          awards: z.array(scholarshipAwardSchema).min(1).max(6),
          additionalInterval: z.preprocess(
            (value) => (value === "" || value === null ? null : value),
            z.coerce.number().int().min(1).max(100_000).nullable(),
          ),
          description: optionalText(300),
          educationLevel: packageEducationLevelSchema,
          scholarshipCount: z.coerce.number().int().min(1).max(100_000),
          studentThreshold: z.coerce.number().int().min(1).max(100_000),
          triggerType: z.enum(["FIXED_INTERVAL", "FIRST_THEN_EVERY"]),
        }),
      )
      .max(6),
    status: z.enum(["DRAFT", "ACTIVE"]),
    universityIds: z.array(z.string().trim().min(1)).min(1).max(500),
  })
  .superRefine((value, context) => {
    if (
      new Set(value.scholarships.map((item) => item.educationLevel)).size !==
      value.scholarships.length
    ) {
      context.addIssue({
        code: "custom",
        message: "Hər təhsil səviyyəsi üçün yalnız bir burs qaydası ola bilər.",
        path: ["scholarships"],
      });
    }
    value.scholarships.forEach((item, index) => {
      if (
        item.triggerType === "FIRST_THEN_EVERY" &&
        item.additionalInterval === null
      ) {
        context.addIssue({
          code: "custom",
          message: "Sonrakı tələbə intervalı daxil edilməlidir.",
          path: ["scholarships", index, "additionalInterval"],
        });
      }
      if (item.scholarshipCount > item.studentThreshold) {
        context.addIssue({
          code: "custom",
          message: "Burs alanların sayı ümumi tələbə sayından çox ola bilməz.",
          path: ["scholarships", index, "scholarshipCount"],
        });
      }
      if (
        new Set(item.awards.map((award) => award.educationLevel)).size !==
        item.awards.length
      ) {
        context.addIssue({
          code: "custom",
          message: "Burs tərkibində hər pillə yalnız bir dəfə seçilə bilər.",
          path: ["scholarships", index, "awards"],
        });
      }
    });
  });

export const commissionPackageStatusSchema = z.object({
  packageId: z.string().trim().min(1),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const commissionPackageAgreementSchema = z.object({
  acceptedTerms: z.literal(true),
  academicYear: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/),
  notes: optionalText(1_000),
  packageId: z.string().trim().min(1),
  universityIds: z.array(z.string().trim().min(1)).min(1).max(500),
});

export const commissionPackageAgreementReviewSchema = z
  .object({
    agreementId: z.string().trim().min(1),
    rejectionReason: optionalText(500),
    status: z.enum(["APPROVED", "REJECTED"]),
  })
  .superRefine((value, context) => {
    if (
      value.status === "REJECTED" &&
      (!value.rejectionReason || value.rejectionReason.length < 3)
    ) {
      context.addIssue({
        code: "custom",
        message: "İmtina səbəbi ən azı 3 simvol olmalıdır.",
        path: ["rejectionReason"],
      });
    }
  });

export const commissionTermVersionSchema = z.object({
  content: z.string().trim().min(20).max(50_000),
  isActive: z.boolean(),
  title: z.string().trim().min(3).max(160),
  version: z
    .string()
    .trim()
    .regex(/^\d+\.\d+$/),
});
