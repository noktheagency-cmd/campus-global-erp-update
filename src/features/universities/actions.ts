"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import {
  campusCreateSchema,
  campusUpdateSchema,
  contactCreateSchema,
  contactUpdateSchema,
  documentCreateSchema,
  documentUpdateSchema,
  noteCreateSchema,
  noteUpdateSchema,
  periodCreateSchema,
  programCreateSchema,
  programUpdateSchema,
  tuitionCreateSchema,
  tuitionUpdateSchema,
  universityCreateSchema,
  universityUpdateSchema,
} from "@/features/universities/schemas";
import type { Prisma, RelatedEntityType } from "@/generated/prisma/client";
import { requireSession } from "@/lib/auth/session";
import { uploadUniversityDocumentFile } from "@/lib/supabase/storage";

export type ActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

type ExtractedUniversityNews = {
  imageUrl: string | null;
  publishedAt: Date | null;
  sourceName: string;
  sourceUrl: string;
  summary: string | null;
  title: string;
};

const NEWS_KEYWORDS = [
  "news",
  "haber",
  "haberler",
  "duyuru",
  "duyurular",
  "announcement",
  "announcements",
  "press",
  "media",
  "event",
  "events",
  "xeber",
  "xeberler",
  "xəbər",
  "xəbərlər",
];

const GENERIC_LINK_TITLES = new Set([
  "all news",
  "back",
  "contact",
  "contacts",
  "details",
  "devami",
  "devamı",
  "daha etrafli",
  "daha ətraflı",
  "home",
  "learn more",
  "more",
  "news",
  "read more",
  "see more",
  "tüm haberler",
  "view details",
  "ətraflı",
]);

export async function createUniversityAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = universityCreateSchema.safeParse({
    name: getString(formData, "name"),
    logoUrl: getString(formData, "logoUrl"),
    country: getString(formData, "country"),
    city: getString(formData, "city"),
    website: getString(formData, "website"),
    newsSourceUrl: getString(formData, "newsSourceUrl"),
    schoolType: getString(formData, "schoolType"),
    partnershipStatus: getString(formData, "partnershipStatus"),
    agreementStatus: getString(formData, "agreementStatus"),
    mainEmail: getString(formData, "mainEmail"),
    mainPhone: getString(formData, "mainPhone"),
    internalNotes: getString(formData, "internalNotes"),
    status: getString(formData, "status"),
    defaultPeriodId: getString(formData, "defaultPeriodId"),
    defaultEducationLevelId: getString(formData, "defaultEducationLevelId"),
    defaultEducationLanguageId: getString(
      formData,
      "defaultEducationLanguageId",
    ),
    defaultCurrency: getString(formData, "defaultCurrency"),
    periodIds: getStringArray(formData, "periodIds"),
    educationLevelIds: getStringArray(formData, "educationLevelIds"),
    educationLanguageIds: getStringArray(formData, "educationLanguageIds"),
    currencies: getStringArray(formData, "currencies"),
    manualPeriodName: getString(formData, "manualPeriodName"),
    manualPeriodYear: getString(formData, "manualPeriodYear") || undefined,
    manualPeriodSeason: getString(formData, "manualPeriodSeason"),
    manualPeriodStartDate: getOptionalDate(formData, "manualPeriodStartDate"),
    manualPeriodDeadline: getOptionalDate(formData, "manualPeriodDeadline"),
    manualEducationLevelName: getString(formData, "manualEducationLevelName"),
    manualEducationLanguageName: getString(
      formData,
      "manualEducationLanguageName",
    ),
  });

  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  const {
    defaultPeriodId,
    defaultEducationLevelId,
    defaultEducationLanguageId,
    manualEducationLanguageName,
    manualEducationLevelName,
    manualPeriodDeadline,
    manualPeriodName,
    manualPeriodSeason,
    manualPeriodStartDate,
    manualPeriodYear,
    periodIds,
    educationLevelIds,
    educationLanguageIds,
    currencies,
    ...universityInput
  } = parsed.data;
  let universityId = "";

  try {
    const userId = await getCurrentUserId();
    const universityDefaults = await resolveUniversityDefaults({
      defaultEducationLanguageId,
      defaultEducationLevelId,
      defaultPeriodId,
      educationLanguageIds,
      educationLevelIds,
      manualEducationLanguageName,
      manualEducationLevelName,
      manualPeriodDeadline,
      manualPeriodName,
      manualPeriodSeason,
      manualPeriodStartDate,
      manualPeriodYear,
      periodIds,
    });
    const defaultCurrency = resolveDefaultCurrency(
      universityInput.defaultCurrency,
      currencies,
    );
    const currencyCodes = resolveUniversityCurrencies(
      universityInput.defaultCurrency,
      currencies,
    );
    const university = await prisma.$transaction(async (tx) => {
      const createdUniversity = await tx.university.create({
        data: {
          ...normalizeUniversityData(universityInput),
          defaultEducationLanguageId:
            universityDefaults.defaultEducationLanguageId,
          defaultEducationLevelId: universityDefaults.defaultEducationLevelId,
          defaultPeriodId: universityDefaults.defaultPeriodId,
          defaultCurrency,
          createdById: userId,
        },
        select: { id: true },
      });

      await createUniversityAcademicLinks(tx, {
        currencyCodes,
        defaultCurrency,
        defaultEducationLanguageId:
          universityDefaults.defaultEducationLanguageId,
        defaultEducationLevelId: universityDefaults.defaultEducationLevelId,
        defaultPeriodId: universityDefaults.defaultPeriodId,
        educationLanguageIds: universityDefaults.educationLanguageIds,
        educationLevelIds: universityDefaults.educationLevelIds,
        periodIds: universityDefaults.periodIds,
        universityId: createdUniversity.id,
      });

      return createdUniversity;
    });

    universityId = university.id;

    await writeActivityLog({
      entityType: "UNIVERSITY",
      entityId: university.id,
      action: "CREATED",
      newValue: {
        ...universityInput,
        ...universityDefaults,
        currencies,
      },
      userId,
    });
  } catch (error) {
    return databaseError(error, "University could not be created.");
  }

  revalidateUniversities(universityId);
  redirect(`/universities/${universityId}`);
}

export async function updateUniversityAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = universityUpdateSchema.safeParse({
    id: getString(formData, "id"),
    name: getString(formData, "name"),
    logoUrl: getString(formData, "logoUrl"),
    country: getString(formData, "country"),
    city: getString(formData, "city"),
    website: getString(formData, "website"),
    newsSourceUrl: getString(formData, "newsSourceUrl"),
    schoolType: getString(formData, "schoolType"),
    partnershipStatus: getString(formData, "partnershipStatus"),
    agreementStatus: getString(formData, "agreementStatus"),
    mainEmail: getString(formData, "mainEmail"),
    mainPhone: getString(formData, "mainPhone"),
    internalNotes: getString(formData, "internalNotes"),
    status: getString(formData, "status"),
  });

  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  const { id, ...input } = parsed.data;

  try {
    const userId = await getCurrentUserId();
    const current = await prisma.university.findUnique({
      where: { id },
    });

    await prisma.university.update({
      where: { id },
      data: normalizeUniversityData(input),
    });

    await writeActivityLog({
      entityType: "UNIVERSITY",
      entityId: id,
      action: "UPDATED",
      oldValue: current,
      newValue: input,
      userId,
    });
  } catch (error) {
    return databaseError(error, "University could not be updated.");
  }

  revalidateUniversities(id);
  redirect(`/universities/${id}?tab=profile&success=university-updated`);
}

export async function archiveUniversityAction(formData: FormData) {
  const universityId = getString(formData, "universityId");
  if (!universityId) {
    return;
  }

  const userId = await getCurrentUserId();
  const current = await prisma.university.findUnique({
    where: { id: universityId },
  });

  await prisma.university.update({
    where: { id: universityId },
    data: {
      status: "ARCHIVED",
      partnershipStatus: "ARCHIVED",
    },
  });

  await writeActivityLog({
    entityType: "UNIVERSITY",
    entityId: universityId,
    action: "ARCHIVED",
    oldValue: current,
    newValue: { status: "ARCHIVED", partnershipStatus: "ARCHIVED" },
    userId,
  });

  revalidateUniversities(universityId);
  redirect("/universities");
}

export async function syncUniversityNewsAction(formData: FormData) {
  const universityId = getString(formData, "universityId");

  if (!universityId) {
    redirect("/universities?error=news-sync");
  }

  const userId = await getCurrentUserId();
  const university = await prisma.university.findUnique({
    where: { id: universityId },
    select: {
      id: true,
      name: true,
      newsSourceUrl: true,
    },
  });

  if (!university) {
    redirect("/universities?error=news-sync");
  }

  if (!university.newsSourceUrl) {
    redirect(`/universities/${universityId}?tab=overview&error=news-source`);
  }

  try {
    const response = await fetch(university.newsSourceUrl, {
      cache: "no-store",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent":
          "CampusGlobalNewsSync/1.0 (+https://campus.global; university news page only)",
      },
    });

    if (!response.ok) {
      throw new Error(`News source responded with ${response.status}.`);
    }

    const html = await response.text();
    const newsItems = extractUniversityNewsFromHtml(
      html,
      university.newsSourceUrl,
      university.name,
    );
    const fetchedAt = new Date();

    for (const item of newsItems) {
      await prisma.universityNews.upsert({
        where: {
          universityId_sourceUrl: {
            sourceUrl: item.sourceUrl,
            universityId,
          },
        },
        create: {
          fetchedAt,
          imageUrl: item.imageUrl,
          publishedAt: item.publishedAt,
          sourceName: item.sourceName,
          sourceUrl: item.sourceUrl,
          summary: item.summary,
          title: item.title,
          universityId,
        },
        update: {
          fetchedAt,
          imageUrl: item.imageUrl,
          publishedAt: item.publishedAt,
          sourceName: item.sourceName,
          status: "PUBLISHED",
          summary: item.summary,
          title: item.title,
        },
      });
    }

    await prisma.university.update({
      where: { id: universityId },
      data: { newsLastSyncedAt: fetchedAt },
    });

    await writeActivityLog({
      entityType: "UNIVERSITY",
      entityId: universityId,
      action: "UPDATED",
      newValue: {
        newsItemsSynced: newsItems.length,
        newsSourceUrl: university.newsSourceUrl,
      },
      userId,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`University news sync failed: ${String(error)}`);
    }

    redirect(`/universities/${universityId}?tab=overview&error=news-sync`);
  }

  revalidateUniversities(universityId);
  redirect(`/universities/${universityId}?tab=overview&success=news-synced`);
}

export async function createCampusAction(formData: FormData) {
  const parsed = campusCreateSchema.safeParse({
    universityId: getString(formData, "universityId"),
    name: getString(formData, "name"),
    country: getString(formData, "country"),
    city: getString(formData, "city"),
    address: getString(formData, "address"),
    imageUrl: getString(formData, "imageUrl"),
    latitude: getString(formData, "latitude") || undefined,
    longitude: getString(formData, "longitude") || undefined,
    isMainCampus: formData.get("isMainCampus") === "on",
    status: getString(formData, "status") || "ACTIVE",
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    redirect(
      `/universities/${getString(formData, "universityId")}?error=campus`,
    );
  }

  const userId = await getCurrentUserId();
  const campus = await prisma.campus.create({
    data: normalizeNullable(parsed.data),
    select: { id: true, universityId: true },
  });

  await writeActivityLog({
    entityType: "CAMPUS",
    entityId: campus.id,
    action: "CREATED",
    newValue: parsed.data,
    userId,
  });

  revalidateUniversities(campus.universityId);
  redirect(
    `/universities/${campus.universityId}?tab=campuses&success=campus-created`,
  );
}

export async function archiveCampusAction(formData: FormData) {
  const campusId = getString(formData, "campusId");
  const universityId = getString(formData, "universityId");
  const userId = await getCurrentUserId();

  const current = await prisma.campus.findUnique({ where: { id: campusId } });
  await prisma.campus.update({
    where: { id: campusId },
    data: { status: "ARCHIVED" },
  });

  await writeActivityLog({
    entityType: "CAMPUS",
    entityId: campusId,
    action: "ARCHIVED",
    oldValue: current,
    newValue: { status: "ARCHIVED" },
    userId,
  });

  revalidateUniversities(universityId);
  redirect(
    `/universities/${universityId}?tab=campuses&success=campus-archived`,
  );
}

export async function updateCampusAction(formData: FormData) {
  const universityId = getString(formData, "universityId");
  const parsed = campusUpdateSchema.safeParse({
    campusId: getString(formData, "campusId"),
    universityId,
    name: getString(formData, "name"),
    country: getString(formData, "country"),
    city: getString(formData, "city"),
    address: getString(formData, "address"),
    imageUrl: getString(formData, "imageUrl"),
    latitude: getString(formData, "latitude") || undefined,
    longitude: getString(formData, "longitude") || undefined,
    isMainCampus: formData.get("isMainCampus") === "on",
    status: getString(formData, "status") || "ACTIVE",
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    redirect(`/universities/${universityId}?tab=campuses&error=campus`);
  }

  const { campusId, ...input } = parsed.data;
  const userId = await getCurrentUserId();

  const { campus, current } = await prisma.$transaction(async (tx) => {
    if (input.isMainCampus) {
      await tx.campus.updateMany({
        where: {
          id: { not: campusId },
          universityId: input.universityId,
        },
        data: { isMainCampus: false },
      });
    }

    const current = await tx.campus.findUnique({ where: { id: campusId } });
    const campus = await tx.campus.update({
      where: { id: campusId },
      data: normalizeNullable(input),
      select: { id: true, universityId: true },
    });

    return { campus, current };
  });

  await writeActivityLog({
    entityType: "CAMPUS",
    entityId: campusId,
    action: "UPDATED",
    oldValue: current,
    newValue: input,
    userId,
  });

  revalidateUniversities(campus.universityId);
  redirect(
    `/universities/${campus.universityId}?tab=campuses&success=campus-updated`,
  );
}

export async function createProgramAction(formData: FormData) {
  const universityId = getString(formData, "universityId");
  const parsed = programCreateSchema.safeParse({
    universityId,
    campusId: getString(formData, "campusId") || undefined,
    educationLevelId: getString(formData, "educationLevelId"),
    educationLanguageId: getString(formData, "educationLanguageId"),
    name: getString(formData, "name"),
    duration: getString(formData, "duration"),
    studyMode: getString(formData, "studyMode"),
    requirementsSummary: getString(formData, "requirementsSummary"),
    status: getString(formData, "status") || "DRAFT",
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    redirect(`/universities/${universityId}?error=program`);
  }

  const shouldCreateTuition =
    getString(formData, "createTuitionWithProgram") === "on";
  const tuitionParsed = shouldCreateTuition
    ? tuitionCreateSchema.safeParse({
        programId: "__pending_program__",
        periodId: getString(formData, "periodId"),
        currency: getString(formData, "currency"),
        tuitionFee: getString(formData, "tuitionFee"),
        discountedTuitionFee:
          getString(formData, "discountedTuitionFee") || undefined,
        scholarshipType: getString(formData, "scholarshipType") || undefined,
        scholarshipValue: getString(formData, "scholarshipValue") || undefined,
        paymentNote: getString(formData, "paymentNote"),
        priceStatus: getString(formData, "priceStatus") || "ACTIVE",
      })
    : null;

  if (tuitionParsed && !tuitionParsed.success) {
    redirect(`/universities/${universityId}?error=tuition`);
  }

  const userId = await getCurrentUserId();
  const result = await prisma.$transaction(async (tx) => {
    const program = await tx.program.create({
      data: normalizeNullable(parsed.data),
      select: { id: true, universityId: true },
    });
    const tuitionData = tuitionParsed?.success ? tuitionParsed.data : null;
    const tuition = tuitionData
      ? await tx.programTuition.create({
          data: {
            ...normalizeNullable({
              currency: tuitionData.currency,
              discountedTuitionFee: tuitionData.discountedTuitionFee ?? null,
              paymentNote: tuitionData.paymentNote,
              periodId: tuitionData.periodId,
              priceStatus: tuitionData.priceStatus,
              programId: program.id,
              scholarshipType: tuitionData.scholarshipType,
              scholarshipValue: tuitionData.scholarshipValue ?? null,
              tuitionFee: tuitionData.tuitionFee,
            }),
          },
          select: { id: true },
        })
      : null;

    return { program, tuition, tuitionData };
  });

  await writeActivityLog({
    entityType: "PROGRAM",
    entityId: result.program.id,
    action: "CREATED",
    newValue: parsed.data,
    userId,
  });

  if (result.tuition && result.tuitionData) {
    await writeActivityLog({
      entityType: "TUITION",
      entityId: result.tuition.id,
      action: "PRICE_UPDATED",
      newValue: {
        ...result.tuitionData,
        programId: result.program.id,
      },
      userId,
    });
  }

  revalidateUniversities(result.program.universityId);
  redirect(
    `/universities/${result.program.universityId}?tab=programs&success=program-created`,
  );
}

export async function archiveProgramAction(formData: FormData) {
  const programId = getString(formData, "programId");
  const universityId = getString(formData, "universityId");
  const userId = await getCurrentUserId();

  const current = await prisma.program.findUnique({ where: { id: programId } });
  await prisma.program.update({
    where: { id: programId },
    data: { status: "ARCHIVED" },
  });

  await writeActivityLog({
    entityType: "PROGRAM",
    entityId: programId,
    action: "ARCHIVED",
    oldValue: current,
    newValue: { status: "ARCHIVED" },
    userId,
  });

  revalidateUniversities(universityId);
  redirect(
    `/universities/${universityId}?tab=programs&success=program-archived`,
  );
}

export async function updateProgramAction(formData: FormData) {
  const universityId = getString(formData, "universityId");
  const parsed = programUpdateSchema.safeParse({
    programId: getString(formData, "programId"),
    universityId,
    campusId: getString(formData, "campusId") || undefined,
    educationLevelId: getString(formData, "educationLevelId"),
    educationLanguageId: getString(formData, "educationLanguageId"),
    name: getString(formData, "name"),
    duration: getString(formData, "duration"),
    studyMode: getString(formData, "studyMode"),
    requirementsSummary: getString(formData, "requirementsSummary"),
    status: getString(formData, "status") || "DRAFT",
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    redirect(`/universities/${universityId}?tab=programs&error=program`);
  }

  const { programId, ...input } = parsed.data;
  const userId = await getCurrentUserId();
  const current = await prisma.program.findUnique({ where: { id: programId } });
  const program = await prisma.program.update({
    where: { id: programId },
    data: normalizeNullable(input),
    select: { id: true, universityId: true },
  });

  await writeActivityLog({
    entityType: "PROGRAM",
    entityId: program.id,
    action: "UPDATED",
    oldValue: current,
    newValue: input,
    userId,
  });

  revalidateUniversities(program.universityId);
  redirect(
    `/universities/${program.universityId}?tab=programs&success=program-updated`,
  );
}

export async function createPeriodAction(formData: FormData) {
  const universityId = getString(formData, "universityId");
  const parsed = periodCreateSchema.safeParse({
    name: getString(formData, "name"),
    year: getString(formData, "year"),
    season: getString(formData, "season"),
    applicationStartDate: getOptionalDate(formData, "applicationStartDate"),
    applicationDeadline: getOptionalDate(formData, "applicationDeadline"),
    status: getString(formData, "status") || "OPEN",
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    redirect(`/universities/${universityId}?tab=periods&error=period`);
  }

  const userId = await getCurrentUserId();
  const current = await prisma.period.findUnique({
    where: {
      year_season: {
        year: parsed.data.year,
        season: parsed.data.season,
      },
    },
  });
  const period = await prisma.period.upsert({
    where: {
      year_season: {
        year: parsed.data.year,
        season: parsed.data.season,
      },
    },
    create: normalizeNullable(parsed.data),
    update: normalizeNullable(parsed.data),
    select: { id: true },
  });

  await writeActivityLog({
    entityType: "PERIOD",
    entityId: period.id,
    action: current ? "UPDATED" : "CREATED",
    oldValue: current,
    newValue: parsed.data,
    userId,
  });

  revalidateUniversities(universityId);
  redirect(`/universities/${universityId}?tab=periods&success=period-saved`);
}

export async function createTuitionAction(formData: FormData) {
  const universityId = getString(formData, "universityId");
  const parsed = tuitionCreateSchema.safeParse({
    programId: getString(formData, "programId"),
    periodId: getString(formData, "periodId"),
    currency: getString(formData, "currency"),
    tuitionFee: getString(formData, "tuitionFee"),
    discountedTuitionFee:
      getString(formData, "discountedTuitionFee") || undefined,
    scholarshipType: getString(formData, "scholarshipType") || undefined,
    scholarshipValue: getString(formData, "scholarshipValue") || undefined,
    paymentNote: getString(formData, "paymentNote"),
    priceStatus: getString(formData, "priceStatus") || "DRAFT",
  });

  if (!parsed.success) {
    redirect(`/universities/${universityId}?error=tuition`);
  }

  const userId = await getCurrentUserId();
  const tuition = await prisma.programTuition.create({
    data: {
      ...normalizeNullable(parsed.data),
      tuitionFee: parsed.data.tuitionFee,
      discountedTuitionFee: parsed.data.discountedTuitionFee ?? null,
      scholarshipValue: parsed.data.scholarshipValue ?? null,
    },
    select: { id: true },
  });

  await writeActivityLog({
    entityType: "TUITION",
    entityId: tuition.id,
    action: "PRICE_UPDATED",
    newValue: parsed.data,
    userId,
  });

  revalidateUniversities(universityId);
  redirect(`/universities/${universityId}?tab=tuition&success=tuition-created`);
}

export async function expireTuitionAction(formData: FormData) {
  const tuitionId = getString(formData, "tuitionId");
  const universityId = getString(formData, "universityId");
  const userId = await getCurrentUserId();

  const current = await prisma.programTuition.findUnique({
    where: { id: tuitionId },
  });

  await prisma.programTuition.update({
    where: { id: tuitionId },
    data: {
      priceStatus: "EXPIRED",
      lastUpdatedAt: new Date(),
    },
  });

  await writeActivityLog({
    entityType: "TUITION",
    entityId: tuitionId,
    action: "STATUS_CHANGED",
    oldValue: current,
    newValue: { priceStatus: "EXPIRED" },
    userId,
  });

  revalidateUniversities(universityId);
  redirect(`/universities/${universityId}?tab=tuition&success=tuition-expired`);
}

export async function updateTuitionAction(formData: FormData) {
  const universityId = getString(formData, "universityId");
  const parsed = tuitionUpdateSchema.safeParse({
    tuitionId: getString(formData, "tuitionId"),
    programId: getString(formData, "programId"),
    periodId: getString(formData, "periodId"),
    currency: getString(formData, "currency"),
    tuitionFee: getString(formData, "tuitionFee"),
    discountedTuitionFee:
      getString(formData, "discountedTuitionFee") || undefined,
    scholarshipType: getString(formData, "scholarshipType") || undefined,
    scholarshipValue: getString(formData, "scholarshipValue") || undefined,
    paymentNote: getString(formData, "paymentNote"),
    priceStatus: getString(formData, "priceStatus") || "DRAFT",
  });

  if (!parsed.success) {
    redirect(`/universities/${universityId}?tab=tuition&error=tuition`);
  }

  const { tuitionId, ...input } = parsed.data;
  const userId = await getCurrentUserId();
  const current = await prisma.programTuition.findUnique({
    where: { id: tuitionId },
  });

  await prisma.programTuition.update({
    where: { id: tuitionId },
    data: {
      ...normalizeNullable(input),
      discountedTuitionFee: input.discountedTuitionFee ?? null,
      lastUpdatedAt: new Date(),
      scholarshipValue: input.scholarshipValue ?? null,
      tuitionFee: input.tuitionFee,
    },
  });

  await writeActivityLog({
    entityType: "TUITION",
    entityId: tuitionId,
    action: "PRICE_UPDATED",
    oldValue: current,
    newValue: input,
    userId,
  });

  revalidateUniversities(universityId);
  redirect(`/universities/${universityId}?tab=tuition&success=tuition-updated`);
}

export async function createDocumentAction(formData: FormData) {
  const universityId = getString(formData, "universityId");
  const parsed = documentCreateSchema.safeParse({
    universityId,
    relatedEntityType: getString(formData, "relatedEntityType"),
    relatedEntityId: getString(formData, "relatedEntityId"),
    title: getString(formData, "title"),
    documentType: getString(formData, "documentType"),
    fileUrl: getString(formData, "fileUrl"),
    validFrom: getOptionalDate(formData, "validFrom"),
    expiryDate: getOptionalDate(formData, "expiryDate"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    redirect(`/universities/${universityId}?tab=documents&error=document`);
  }

  const userId = await getCurrentUserId();
  const file = getFile(formData, "file");
  let uploadedFile:
    | Awaited<ReturnType<typeof uploadUniversityDocumentFile>>
    | undefined;

  if (file) {
    try {
      uploadedFile = await uploadUniversityDocumentFile({
        file,
        universityId: parsed.data.universityId,
      });
    } catch {
      redirect(`/universities/${universityId}?tab=documents&error=upload`);
    }
  }

  const fileUrl = uploadedFile?.fileUrl ?? parsed.data.fileUrl;

  if (!fileUrl) {
    redirect(`/universities/${universityId}?tab=documents&error=file-required`);
  }

  const document = await prisma.universityDocument.create({
    data: {
      ...normalizeNullable(parsed.data),
      fileName: uploadedFile?.fileName ?? null,
      fileSize: uploadedFile?.fileSize ?? null,
      fileUrl,
      mimeType: uploadedFile?.mimeType ?? null,
      uploadedById: userId,
    },
    select: { id: true, universityId: true },
  });

  await writeActivityLog({
    entityType: "UNIVERSITY",
    entityId: document.universityId,
    action: "DOCUMENT_UPLOADED",
    newValue: parsed.data,
    userId,
  });

  revalidateUniversities(document.universityId);
  redirect(
    `/universities/${document.universityId}?tab=documents&success=document-created`,
  );
}

export async function archiveDocumentAction(formData: FormData) {
  const documentId = getString(formData, "documentId");
  const universityId = getString(formData, "universityId");
  const userId = await getCurrentUserId();

  const current = await prisma.universityDocument.findUnique({
    where: { id: documentId },
  });

  await prisma.universityDocument.update({
    where: { id: documentId },
    data: { status: "ARCHIVED" },
  });

  await writeActivityLog({
    entityType: "UNIVERSITY",
    entityId: universityId,
    action: "ARCHIVED",
    oldValue: current,
    newValue: { documentId, status: "ARCHIVED" },
    userId,
  });

  revalidateUniversities(universityId);
  redirect(
    `/universities/${universityId}?tab=documents&success=document-archived`,
  );
}

export async function updateDocumentAction(formData: FormData) {
  const universityId = getString(formData, "universityId");
  const parsed = documentUpdateSchema.safeParse({
    currentFileUrl: getString(formData, "currentFileUrl"),
    documentId: getString(formData, "documentId"),
    universityId,
    relatedEntityType: getString(formData, "relatedEntityType"),
    relatedEntityId: getString(formData, "relatedEntityId"),
    title: getString(formData, "title"),
    documentType: getString(formData, "documentType"),
    fileUrl: getString(formData, "fileUrl"),
    validFrom: getOptionalDate(formData, "validFrom"),
    expiryDate: getOptionalDate(formData, "expiryDate"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    redirect(`/universities/${universityId}?tab=documents&error=document`);
  }

  const userId = await getCurrentUserId();
  const file = getFile(formData, "file");
  let uploadedFile:
    | Awaited<ReturnType<typeof uploadUniversityDocumentFile>>
    | undefined;

  if (file) {
    try {
      uploadedFile = await uploadUniversityDocumentFile({
        file,
        universityId: parsed.data.universityId,
      });
    } catch {
      redirect(`/universities/${universityId}?tab=documents&error=upload`);
    }
  }

  const nextFileUrl =
    uploadedFile?.fileUrl || parsed.data.fileUrl || parsed.data.currentFileUrl;

  if (!nextFileUrl) {
    redirect(`/universities/${universityId}?tab=documents&error=file-required`);
  }

  const { documentId } = parsed.data;
  const input = {
    documentType: parsed.data.documentType,
    validFrom: parsed.data.validFrom,
    expiryDate: parsed.data.expiryDate,
    fileUrl: parsed.data.fileUrl,
    notes: parsed.data.notes,
    relatedEntityId: parsed.data.relatedEntityId,
    relatedEntityType: parsed.data.relatedEntityType,
    title: parsed.data.title,
    universityId: parsed.data.universityId,
  };
  const current = await prisma.universityDocument.findUnique({
    where: { id: documentId },
  });
  const externalFileChanged = !uploadedFile && Boolean(input.fileUrl);

  const document = await prisma.universityDocument.update({
    where: { id: documentId },
    data: {
      ...normalizeNullable(input),
      fileName: uploadedFile
        ? uploadedFile.fileName
        : externalFileChanged
          ? null
          : undefined,
      fileSize: uploadedFile
        ? uploadedFile.fileSize
        : externalFileChanged
          ? null
          : undefined,
      fileUrl: nextFileUrl,
      mimeType: uploadedFile
        ? uploadedFile.mimeType
        : externalFileChanged
          ? null
          : undefined,
    },
    select: { id: true, universityId: true },
  });

  await writeActivityLog({
    entityType: "UNIVERSITY",
    entityId: document.universityId,
    action: "UPDATED",
    oldValue: current,
    newValue: input,
    userId,
  });

  revalidateUniversities(document.universityId);
  redirect(
    `/universities/${document.universityId}?tab=documents&success=document-updated`,
  );
}

export async function createContactAction(formData: FormData) {
  const parsed = contactCreateSchema.safeParse({
    universityId: getString(formData, "universityId"),
    fullName: getString(formData, "fullName"),
    position: getString(formData, "position"),
    department: getString(formData, "department"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    whatsapp: getString(formData, "whatsapp"),
    isPrimary: formData.get("isPrimary") === "on",
    notes: getString(formData, "notes"),
    status: getString(formData, "status") || "ACTIVE",
  });

  if (!parsed.success) {
    redirect(
      `/universities/${getString(formData, "universityId")}?error=contact`,
    );
  }

  const userId = await getCurrentUserId();

  const contact = await prisma.$transaction(async (tx) => {
    if (parsed.data.isPrimary) {
      await tx.universityContact.updateMany({
        where: { universityId: parsed.data.universityId },
        data: { isPrimary: false },
      });
    }

    return tx.universityContact.create({
      data: normalizeNullable(parsed.data),
      select: { id: true, universityId: true },
    });
  });

  await writeActivityLog({
    entityType: "CONTACT",
    entityId: contact.id,
    action: "CREATED",
    newValue: parsed.data,
    userId,
  });

  revalidateUniversities(contact.universityId);
  redirect(
    `/universities/${contact.universityId}?tab=contacts&success=contact-created`,
  );
}

export async function archiveContactAction(formData: FormData) {
  const contactId = getString(formData, "contactId");
  const universityId = getString(formData, "universityId");
  const userId = await getCurrentUserId();

  const current = await prisma.universityContact.findUnique({
    where: { id: contactId },
  });

  await prisma.universityContact.update({
    where: { id: contactId },
    data: {
      isPrimary: false,
      status: "ARCHIVED",
    },
  });

  await writeActivityLog({
    entityType: "CONTACT",
    entityId: contactId,
    action: "ARCHIVED",
    oldValue: current,
    newValue: { status: "ARCHIVED" },
    userId,
  });

  revalidateUniversities(universityId);
  redirect(
    `/universities/${universityId}?tab=contacts&success=contact-archived`,
  );
}

export async function updateContactAction(formData: FormData) {
  const universityId = getString(formData, "universityId");
  const parsed = contactUpdateSchema.safeParse({
    contactId: getString(formData, "contactId"),
    universityId,
    fullName: getString(formData, "fullName"),
    position: getString(formData, "position"),
    department: getString(formData, "department"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    whatsapp: getString(formData, "whatsapp"),
    isPrimary: formData.get("isPrimary") === "on",
    notes: getString(formData, "notes"),
    status: getString(formData, "status") || "ACTIVE",
  });

  if (!parsed.success) {
    redirect(`/universities/${universityId}?tab=contacts&error=contact`);
  }

  const { contactId, ...input } = parsed.data;
  const userId = await getCurrentUserId();
  const { contact, current } = await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.universityContact.updateMany({
        where: {
          id: { not: contactId },
          universityId: input.universityId,
        },
        data: { isPrimary: false },
      });
    }

    const current = await tx.universityContact.findUnique({
      where: { id: contactId },
    });
    const contact = await tx.universityContact.update({
      where: { id: contactId },
      data: normalizeNullable(input),
      select: { id: true, universityId: true },
    });

    return { contact, current };
  });

  await writeActivityLog({
    entityType: "CONTACT",
    entityId: contactId,
    action: "UPDATED",
    oldValue: current,
    newValue: input,
    userId,
  });

  revalidateUniversities(contact.universityId);
  redirect(
    `/universities/${contact.universityId}?tab=contacts&success=contact-updated`,
  );
}

export async function createNoteAction(formData: FormData) {
  const parsed = noteCreateSchema.safeParse({
    universityId: getString(formData, "universityId"),
    relatedEntityType: getString(formData, "relatedEntityType") || undefined,
    relatedEntityId: getString(formData, "relatedEntityId") || undefined,
    body: getString(formData, "body"),
  });

  if (!parsed.success) {
    redirect(`/universities/${getString(formData, "universityId")}?error=note`);
  }

  const userId = await getCurrentUserId();
  const note = await prisma.universityNote.create({
    data: {
      ...normalizeNullable(parsed.data),
      authorId: userId,
    },
    select: { id: true, universityId: true },
  });

  await writeActivityLog({
    entityType: "NOTE",
    entityId: note.id,
    action: "CREATED",
    newValue: parsed.data,
    userId,
  });

  revalidateUniversities(note.universityId);
  redirect(`/universities/${note.universityId}?tab=notes&success=note-created`);
}

export async function updateNoteAction(formData: FormData) {
  const universityId = getString(formData, "universityId");
  const parsed = noteUpdateSchema.safeParse({
    noteId: getString(formData, "noteId"),
    universityId,
    relatedEntityType: getString(formData, "relatedEntityType") || undefined,
    relatedEntityId: getString(formData, "relatedEntityId") || undefined,
    body: getString(formData, "body"),
  });

  if (!parsed.success) {
    redirect(`/universities/${universityId}?tab=notes&error=note`);
  }

  const { noteId, ...input } = parsed.data;
  const userId = await getCurrentUserId();
  const current = await prisma.universityNote.findUnique({
    where: { id: noteId },
  });
  const note = await prisma.universityNote.update({
    where: { id: noteId },
    data: normalizeNullable(input),
    select: { id: true, universityId: true },
  });

  await writeActivityLog({
    entityType: "NOTE",
    entityId: note.id,
    action: "UPDATED",
    oldValue: current,
    newValue: input,
    userId,
  });

  revalidateUniversities(note.universityId);
  redirect(`/universities/${note.universityId}?tab=notes&success=note-updated`);
}

function extractUniversityNewsFromHtml(
  html: string,
  sourceUrl: string,
  universityName: string,
): ExtractedUniversityNews[] {
  const baseUrl = new URL(sourceUrl);
  const sourceName = baseUrl.hostname.replace(/^www\./i, "");
  const sourcePathLooksLikeNews = NEWS_KEYWORDS.some((keyword) =>
    baseUrl.pathname.toLowerCase().includes(keyword),
  );
  const pageImage = absolutizeUrl(
    extractMetaContent(html, "og:image") ??
      extractMetaContent(html, "twitter:image"),
    baseUrl,
  );
  const candidates: ExtractedUniversityNews[] = [];
  const seen = new Map<string, number>();

  for (const match of html.matchAll(
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    const href = match[1];
    const absoluteUrl = absolutizeUrl(href, baseUrl);

    if (!absoluteUrl) {
      continue;
    }

    const normalizedUrl = normalizeSourceUrl(absoluteUrl);
    const itemUrl = new URL(normalizedUrl);
    const index = match.index ?? 0;
    const context = html.slice(
      Math.max(0, index - 1100),
      Math.min(html.length, index + 2200),
    );
    const anchorText = cleanHtmlText(match[2]);
    const headingText =
      extractHeadingText(match[2]) ?? extractHeadingText(context);
    const attributeText =
      extractAttribute(match[0], "title") ??
      extractAttribute(match[0], "aria-label");
    const title = chooseNewsTitle(
      anchorText,
      headingText,
      cleanHtmlText(attributeText ?? ""),
    );

    if (
      !title ||
      !isLikelyNewsLink(title, itemUrl, baseUrl, sourcePathLooksLikeNews)
    ) {
      continue;
    }

    const summary = normalizeNewsSummary(extractParagraphText(context), title);
    const imageUrl =
      absolutizeUrl(extractImageSource(context), baseUrl) ?? pageImage;
    const publishedAt = extractPublishedDate(context);

    const candidate = {
      imageUrl,
      publishedAt,
      sourceName,
      sourceUrl: normalizedUrl,
      summary:
        summary ??
        `${universityName} üçün son mənbə səhifəsi yeniləməsi. Tam məqalə üçün mənbəni açın.`,
      title,
    };
    const existingIndex = seen.get(normalizedUrl);

    if (existingIndex === undefined) {
      seen.set(normalizedUrl, candidates.length);
      candidates.push(candidate);
    } else if (!candidates[existingIndex].imageUrl && candidate.imageUrl) {
      candidates[existingIndex] = {
        ...candidates[existingIndex],
        imageUrl: candidate.imageUrl,
        sourceName: candidate.sourceName,
      };
    }
  }

  return candidates
    .sort((a, b) => {
      const dateA = a.publishedAt?.getTime() ?? 0;
      const dateB = b.publishedAt?.getTime() ?? 0;

      return dateB - dateA;
    })
    .slice(0, 12);
}

function chooseNewsTitle(...values: Array<string | null | undefined>) {
  const usefulTitle = values.find((value) => {
    if (!value) {
      return false;
    }

    return !isGenericLinkTitle(value) && value.length >= 10;
  });

  return usefulTitle ?? null;
}

function isLikelyNewsLink(
  title: string,
  itemUrl: URL,
  baseUrl: URL,
  sourcePathLooksLikeNews: boolean,
) {
  const baseHost = baseUrl.hostname.replace(/^www\./i, "");
  const itemHost = itemUrl.hostname.replace(/^www\./i, "");
  const sameUniversityHost =
    itemHost === baseHost ||
    itemHost.endsWith(`.${baseHost}`) ||
    baseHost.endsWith(`.${itemHost}`);

  if (!sameUniversityHost || isGenericLinkTitle(title)) {
    return false;
  }

  const path = itemUrl.pathname.toLowerCase();

  if (
    /\.(avif|css|doc|docx|gif|jpeg|jpg|pdf|png|svg|webp|xls|xlsx|zip)$/i.test(
      path,
    )
  ) {
    return false;
  }

  const combined = `${path} ${itemUrl.search} ${title}`.toLowerCase();
  const hasNewsKeyword = NEWS_KEYWORDS.some((keyword) =>
    combined.includes(keyword),
  );

  return (
    hasNewsKeyword ||
    (sourcePathLooksLikeNews &&
      title.length >= 18 &&
      title.split(/\s+/).length >= 3)
  );
}

function isGenericLinkTitle(value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, " ").trim();

  return (
    normalized.length < 4 ||
    GENERIC_LINK_TITLES.has(normalized) ||
    /^read\s+more$/i.test(normalized) ||
    /^more\s*$/i.test(normalized)
  );
}

function extractHeadingText(html: string) {
  const match = html.match(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/i);

  return match ? cleanHtmlText(match[1]) : null;
}

function extractParagraphText(html: string) {
  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => cleanHtmlText(match[1]))
    .filter((value) => value.length >= 30);

  return paragraphs[0] ?? null;
}

function extractImageSource(html: string) {
  const matches = html.matchAll(
    /<img\b[^>]*(?:src|data-src)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^"'\s>]+))[^>]*>/gi,
  );

  for (const match of matches) {
    const source = match[1] ?? match[2] ?? match[3] ?? null;

    if (source && !isDecorativeNewsImage(source)) {
      return source;
    }
  }

  return null;
}

function isDecorativeNewsImage(source: string) {
  const normalized = source.toLowerCase();

  return (
    normalized.includes("itu-logo") ||
    normalized.includes("/default-album/") ||
    normalized.includes("/lib/img/itu.")
  );
}

function extractPublishedDate(html: string) {
  const timeMatch =
    html.match(/<time\b[^>]*datetime\s*=\s*["']([^"']+)["'][^>]*>/i) ??
    html.match(/<time\b[^>]*>([\s\S]*?)<\/time>/i);
  const timeValue = timeMatch ? cleanHtmlText(timeMatch[1]) : "";
  const parsedTime = parseNewsDate(timeValue);

  if (parsedTime) {
    return parsedTime;
  }

  const isoMatch = html.match(/\b\d{4}-\d{2}-\d{2}\b/);
  const dottedMatch = html.match(/\b\d{1,2}[./-]\d{1,2}[./-]\d{4}\b/);

  return parseNewsDate(isoMatch?.[0] ?? dottedMatch?.[0] ?? "");
}

function parseNewsDate(value: string) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  const dayFirst = normalized.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);

  if (dayFirst) {
    return new Date(
      Date.UTC(
        Number(dayFirst[3]),
        Number(dayFirst[2]) - 1,
        Number(dayFirst[1]),
      ),
    );
  }

  const direct = Date.parse(normalized);

  if (!Number.isNaN(direct)) {
    return new Date(direct);
  }

  return null;
}

function normalizeNewsSummary(value: string | null, title: string) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.toLowerCase() === title.toLowerCase()) {
    return null;
  }

  return normalized.length > 240
    ? `${normalized.slice(0, 237)}...`
    : normalized;
}

function extractMetaContent(html: string, name: string) {
  const escapedName = escapeRegex(name);
  const direct = html.match(
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escapedName}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
  );
  const reversed = html.match(
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapedName}["'][^>]*>`,
      "i",
    ),
  );

  return direct?.[1] ?? reversed?.[1] ?? null;
}

function extractAttribute(html: string, attribute: string) {
  const match = html.match(
    new RegExp(`${escapeRegex(attribute)}\\s*=\\s*["']([^"']+)["']`, "i"),
  );

  return match?.[1] ?? null;
}

function absolutizeUrl(value: string | null | undefined, baseUrl: URL) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value, baseUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function normalizeSourceUrl(value: string) {
  const url = new URL(value);
  url.hash = "";

  for (const key of Array.from(url.searchParams.keys())) {
    if (key.toLowerCase().startsWith("utm_")) {
      url.searchParams.delete(key);
    }
  }

  return url.toString().replace(/\/$/, "");
}

function cleanHtmlText(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    ccedil: "ç",
    Ccedil: "Ç",
    eacute: "é",
    Eacute: "É",
    gbreve: "ğ",
    Gbreve: "Ğ",
    gt: ">",
    idot: "ı",
    Idot: "İ",
    lt: "<",
    nbsp: " ",
    ograve: "ò",
    ouml: "ö",
    Ouml: "Ö",
    quot: '"',
    scedil: "ş",
    Scedil: "Ş",
    uuml: "ü",
    Uuml: "Ü",
  };

  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(
      /&([a-z]+);/gi,
      (entity, name: string) => namedEntities[name.toLowerCase()] ?? entity,
    );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeUniversityData<T extends Record<string, unknown>>(data: T) {
  return normalizeNullable(data);
}

async function resolveUniversityDefaults({
  defaultEducationLanguageId,
  defaultEducationLevelId,
  defaultPeriodId,
  educationLanguageIds,
  educationLevelIds,
  manualEducationLanguageName,
  manualEducationLevelName,
  manualPeriodDeadline,
  manualPeriodName,
  manualPeriodSeason,
  manualPeriodStartDate,
  manualPeriodYear,
  periodIds,
}: {
  defaultEducationLanguageId?: string;
  defaultEducationLevelId?: string;
  defaultPeriodId?: string;
  educationLanguageIds: string[];
  educationLevelIds: string[];
  manualEducationLanguageName?: string;
  manualEducationLevelName?: string;
  manualPeriodDeadline?: Date;
  manualPeriodName?: string;
  manualPeriodSeason?: string;
  manualPeriodStartDate?: Date;
  manualPeriodYear?: number;
  periodIds: string[];
}) {
  const selectedPeriodIds = mergeSelectedIds(periodIds, defaultPeriodId);
  const selectedEducationLevelIds = mergeSelectedIds(
    educationLevelIds,
    defaultEducationLevelId,
  );
  const selectedEducationLanguageIds = mergeSelectedIds(
    educationLanguageIds,
    defaultEducationLanguageId,
  );
  const [manualPeriodId, manualEducationLevelId, manualEducationLanguageId] =
    await Promise.all([
      selectedPeriodIds.includes("__manual__")
        ? resolveDefaultPeriod({
            defaultPeriodId: "__manual__",
            manualPeriodDeadline,
            manualPeriodName,
            manualPeriodSeason,
            manualPeriodStartDate,
            manualPeriodYear,
          })
        : null,
      selectedEducationLevelIds.includes("__manual__")
        ? resolveDefaultEducationLevel({
            defaultEducationLevelId: "__manual__",
            manualEducationLevelName,
          })
        : null,
      selectedEducationLanguageIds.includes("__manual__")
        ? resolveDefaultEducationLanguage({
            defaultEducationLanguageId: "__manual__",
            manualEducationLanguageName,
          })
        : null,
    ]);
  const resolvedPeriodIds = uniqueStrings([
    ...selectedPeriodIds.filter((id) => id !== "__manual__"),
    manualPeriodId,
  ]);
  const resolvedEducationLevelIds = uniqueStrings([
    ...selectedEducationLevelIds.filter((id) => id !== "__manual__"),
    manualEducationLevelId,
  ]);
  const resolvedEducationLanguageIds = uniqueStrings([
    ...selectedEducationLanguageIds.filter((id) => id !== "__manual__"),
    manualEducationLanguageId,
  ]);

  return {
    defaultEducationLanguageId: firstOrNull(resolvedEducationLanguageIds),
    defaultEducationLevelId: firstOrNull(resolvedEducationLevelIds),
    defaultPeriodId: firstOrNull(resolvedPeriodIds),
    educationLanguageIds: resolvedEducationLanguageIds,
    educationLevelIds: resolvedEducationLevelIds,
    periodIds: resolvedPeriodIds,
  };
}

type UniversityWriteClient = Prisma.TransactionClient | typeof prisma;

async function createUniversityAcademicLinks(
  client: UniversityWriteClient,
  {
    currencyCodes,
    defaultCurrency,
    defaultEducationLanguageId,
    defaultEducationLevelId,
    defaultPeriodId,
    educationLanguageIds,
    educationLevelIds,
    periodIds,
    universityId,
  }: {
    currencyCodes: string[];
    defaultCurrency: string | null;
    defaultEducationLanguageId: string | null;
    defaultEducationLevelId: string | null;
    defaultPeriodId: string | null;
    educationLanguageIds: string[];
    educationLevelIds: string[];
    periodIds: string[];
    universityId: string;
  },
) {
  await Promise.all([
    periodIds.length > 0
      ? client.universityPeriod.createMany({
          data: periodIds.map((periodId) => ({
            isDefault: periodId === defaultPeriodId,
            periodId,
            universityId,
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    educationLevelIds.length > 0
      ? client.universityEducationLevel.createMany({
          data: educationLevelIds.map((educationLevelId) => ({
            educationLevelId,
            isDefault: educationLevelId === defaultEducationLevelId,
            universityId,
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    educationLanguageIds.length > 0
      ? client.universityEducationLanguage.createMany({
          data: educationLanguageIds.map((educationLanguageId) => ({
            educationLanguageId,
            isDefault: educationLanguageId === defaultEducationLanguageId,
            universityId,
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
    currencyCodes.length > 0
      ? client.universityCurrency.createMany({
          data: currencyCodes.map((currency) => ({
            currency,
            isDefault: currency === defaultCurrency,
            universityId,
          })),
          skipDuplicates: true,
        })
      : Promise.resolve(),
  ]);
}

function mergeSelectedIds(values: string[], defaultValue?: string) {
  return uniqueStrings([defaultValue, ...values]);
}

function resolveUniversityCurrencies(
  defaultCurrency: string | undefined,
  currencies: string[],
) {
  return uniqueStrings([defaultCurrency, ...currencies]);
}

function resolveDefaultCurrency(
  defaultCurrency: string | undefined,
  currencies: string[],
) {
  return firstOrNull(resolveUniversityCurrencies(defaultCurrency, currencies));
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]),
  );
}

function firstOrNull(values: string[]) {
  return values[0] ?? null;
}

async function resolveDefaultPeriod({
  defaultPeriodId,
  manualPeriodDeadline,
  manualPeriodName,
  manualPeriodSeason,
  manualPeriodStartDate,
  manualPeriodYear,
}: {
  defaultPeriodId?: string;
  manualPeriodDeadline?: Date;
  manualPeriodName?: string;
  manualPeriodSeason?: string;
  manualPeriodStartDate?: Date;
  manualPeriodYear?: number;
}) {
  if (defaultPeriodId && defaultPeriodId !== "__manual__") {
    return defaultPeriodId;
  }

  if (!manualPeriodName || !manualPeriodSeason || !manualPeriodYear) {
    return null;
  }

  const period = await prisma.period.upsert({
    where: {
      year_season: {
        season: manualPeriodSeason,
        year: manualPeriodYear,
      },
    },
    create: normalizeNullable({
      applicationDeadline: manualPeriodDeadline,
      applicationStartDate: manualPeriodStartDate,
      name: manualPeriodName,
      season: manualPeriodSeason,
      status: "OPEN",
      year: manualPeriodYear,
    }),
    update: normalizeNullable({
      applicationDeadline: manualPeriodDeadline,
      applicationStartDate: manualPeriodStartDate,
      name: manualPeriodName,
      status: "OPEN",
    }),
    select: { id: true },
  });

  return period.id;
}

async function resolveDefaultEducationLevel({
  defaultEducationLevelId,
  manualEducationLevelName,
}: {
  defaultEducationLevelId?: string;
  manualEducationLevelName?: string;
}) {
  if (defaultEducationLevelId && defaultEducationLevelId !== "__manual__") {
    return defaultEducationLevelId;
  }

  if (!manualEducationLevelName) {
    return null;
  }

  const level = await prisma.educationLevel.upsert({
    where: { name: manualEducationLevelName },
    create: {
      name: manualEducationLevelName,
      status: "ACTIVE",
    },
    update: {
      status: "ACTIVE",
    },
    select: { id: true },
  });

  return level.id;
}

async function resolveDefaultEducationLanguage({
  defaultEducationLanguageId,
  manualEducationLanguageName,
}: {
  defaultEducationLanguageId?: string;
  manualEducationLanguageName?: string;
}) {
  if (
    defaultEducationLanguageId &&
    defaultEducationLanguageId !== "__manual__"
  ) {
    return defaultEducationLanguageId;
  }

  if (!manualEducationLanguageName) {
    return null;
  }

  const language = await prisma.educationLanguage.upsert({
    where: { name: manualEducationLanguageName },
    create: {
      name: manualEducationLanguageName,
      status: "ACTIVE",
    },
    update: {
      status: "ACTIVE",
    },
    select: { id: true },
  });

  return language.id;
}

function normalizeNullable<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value === "" || value === undefined ? null : value,
    ]),
  ) as T;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return trimmed === "__empty" ? "" : trimmed;
}

function getStringArray(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value && value !== "__empty");
}

function getFile(formData: FormData, key: string) {
  const value = formData.get(key);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function getOptionalDate(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value ? value : undefined;
}

function validationError(fieldErrors: Record<string, string[] | undefined>) {
  return {
    status: "error" as const,
    message: "Zəhmət olmasa işarələnmiş sahələri yoxlayın.",
    fieldErrors: Object.fromEntries(
      Object.entries(fieldErrors).filter(
        ([, value]) => value && value.length > 0,
      ),
    ) as Record<string, string[]>,
  };
}

function databaseError(error: unknown, fallbackMessage: string): ActionState {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  if (code === "P2002") {
    return {
      status: "error",
      message: "Bu ad və ölkə ilə universitet artıq mövcuddur.",
    };
  }

  return {
    status: "error",
    message: fallbackMessage,
  };
}

async function getCurrentUserId() {
  const session = await requireSession();

  return session.userId;
}

async function writeActivityLog({
  entityType,
  entityId,
  action,
  oldValue,
  newValue,
  userId,
}: {
  entityType: RelatedEntityType;
  entityId: string;
  action:
    | "CREATED"
    | "UPDATED"
    | "ARCHIVED"
    | "STATUS_CHANGED"
    | "DOCUMENT_UPLOADED"
    | "PRICE_UPDATED";
  oldValue?: unknown;
  newValue?: unknown;
  userId: string | null;
}) {
  await prisma.activityLog.create({
    data: {
      entityType,
      entityId,
      action,
      oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
      newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
      userId,
    },
  });
}

function revalidateUniversities(universityId?: string) {
  revalidateTag("applications:reference", "max");
  revalidateTag("universities:metrics", "max");
  revalidateTag("universities:reference", "max");

  revalidatePath("/universities");
  revalidatePath("/az/universities");

  if (universityId) {
    revalidatePath(`/universities/${universityId}`);
    revalidatePath(`/az/universities/${universityId}`);
  }
}
