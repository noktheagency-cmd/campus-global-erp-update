import { cache } from "react";

import {
  formatAgreementStatus,
  formatDate,
  formatEnumLabel,
  formatPartnershipStatus,
} from "@/features/universities/data/dashboard-data";
import { syncUniversityNewsIfStale } from "@/features/universities/news-sync";
import { createDocumentAccessUrl } from "@/lib/supabase/storage";

export type UniversityNewsItem = {
  id: string;
  universityId: string;
  title: string;
  summary: string;
  imageUrl: string;
  date: Date;
  detail: string;
  sourceName: string | null;
  sourceUrl: string | null;
};

export type UniversityStudentActivity = {
  id: string;
  studentName: string;
  universityName: string;
  programName: string;
  status: string;
  date: Date;
  activity: string;
};

export const getUniversityDetailData = cache(async (universityId: string) => {
  if (!hasUsableDatabaseUrl()) {
    return buildPayızbackUniversityDetailData(universityId);
  }

  try {
    const { prisma } = await import("@/lib/db");

    const [university, educationLevels, educationLanguages, periods] =
      await Promise.all([
        prisma.university.findUnique({
          where: { id: universityId },
          include: {
            campuses: {
              orderBy: [{ isMainCampus: "desc" }, { name: "asc" }],
            },
            contacts: {
              orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }],
            },
            programs: {
              orderBy: [{ status: "asc" }, { name: "asc" }],
              include: {
                campus: true,
                educationLanguage: true,
                educationLevel: true,
                tuitions: {
                  orderBy: [{ lastUpdatedAt: "desc" }],
                  include: {
                    period: true,
                    sourceDocument: true,
                  },
                },
              },
            },
            documents: {
              orderBy: [{ uploadedAt: "desc" }],
              include: {
                uploadedBy: true,
              },
            },
            notes: {
              orderBy: [{ createdAt: "desc" }],
              include: {
                author: true,
              },
            },
            news: {
              where: { status: "PUBLISHED" },
              orderBy: [
                { publishedAt: "desc" },
                { fetchedAt: "desc" },
                { createdAt: "desc" },
              ],
              take: 50,
            },
          },
        }),
        prisma.educationLevel.findMany({
          where: { status: "ACTIVE" },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        }),
        prisma.educationLanguage.findMany({
          where: { status: "ACTIVE" },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        }),
        prisma.period.findMany({
          orderBy: [{ year: "desc" }, { season: "asc" }],
        }),
      ]);

    if (!university) {
      return buildPayızbackUniversityDetailData(universityId);
    }

    let news = university.news;
    if (university.newsSourceUrl) {
      const wasSynced = await syncUniversityNewsIfStale({
        lastSyncedAt: university.newsLastSyncedAt,
        sourceUrl: university.newsSourceUrl,
        universityId: university.id,
        universityName: university.name,
      });

      if (wasSynced) {
        news = await prisma.universityNews.findMany({
          where: {
            status: "PUBLISHED",
            universityId: university.id,
          },
          orderBy: [
            { publishedAt: "desc" },
            { fetchedAt: "desc" },
            { createdAt: "desc" },
          ],
          take: 50,
        });
      }
    }

    const documents = await Promise.all(
      university.documents.map(async (document) => ({
        ...document,
        accessUrl: await createDocumentAccessUrl(document.fileUrl),
      })),
    );
    const campuses = await Promise.all(
      university.campuses.map(async (campus) => ({
        ...campus,
        imageAccessUrl: campus.imageUrl
          ? await createDocumentAccessUrl(campus.imageUrl)
          : null,
        latitude: toPlainNumber(campus.latitude),
        longitude: toPlainNumber(campus.longitude),
      })),
    );
    const logoAccessUrl = university.logoUrl
      ? await createDocumentAccessUrl(university.logoUrl)
      : null;

    const relatedIds = new Set<string>([university.id]);

    for (const campus of university.campuses) {
      relatedIds.add(campus.id);
    }

    for (const program of university.programs) {
      relatedIds.add(program.id);
      for (const tuition of program.tuitions) {
        relatedIds.add(tuition.id);
        relatedIds.add(tuition.periodId);
      }
    }

    for (const contact of university.contacts) {
      relatedIds.add(contact.id);
    }

    for (const note of university.notes) {
      relatedIds.add(note.id);
    }

    const activities = await prisma.activityLog.findMany({
      where: {
        entityId: {
          in: Array.from(relatedIds),
        },
      },
      include: {
        user: true,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 50,
    });
    const studentActivityChoices = await prisma.applicationChoice.findMany({
      where: {
        universityId: university.id,
      },
      include: {
        application: {
          include: {
            student: true,
          },
        },
        program: true,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    const activePrograms = university.programs.filter(
      (program) => program.status === "ACTIVE",
    );
    const discountedPrograms = new Set(
      university.programs
        .filter((program) =>
          program.tuitions.some((tuition) => tuition.discountedTuitionFee),
        )
        .map((program) => program.id),
    );
    const activePeriods = new Set(
      university.programs.flatMap((program) =>
        program.tuitions
          .filter((tuition) => tuition.period.status === "OPEN")
          .map((tuition) => tuition.periodId),
      ),
    );
    const primaryContact =
      university.contacts.find((contact) => contact.isPrimary) ??
      university.contacts[0] ??
      null;

    return {
      university: {
        ...university,
        campuses,
        documents,
        logoAccessUrl,
      },
      educationLevels,
      educationLanguages,
      periods,
      activities,
      news: buildUniversityNewsItems({
        ...university,
        logoAccessUrl,
        news,
      }),
      studentActivities: studentActivityChoices.map((choice) => ({
        activity: `Müraciət ${formatEnumLabel(choice.application.status)}`,
        date: choice.application.updatedAt,
        id: choice.id,
        programName: choice.program.name,
        status: formatEnumLabel(choice.application.status),
        studentName:
          `${choice.application.student.firstName} ${choice.application.student.lastName}`.trim(),
        universityName: university.name,
      })),
      summary: {
        statusLabel: formatEnumLabel(university.status),
        schoolTypeLabel: formatEnumLabel(university.schoolType),
        partnershipLabel: formatPartnershipStatus(university.partnershipStatus),
        agreementLabel: formatAgreementStatus(university.agreementStatus),
        activePrograms: activePrograms.length,
        activePeriods: activePeriods.size,
        discountedPrograms: discountedPrograms.size,
        updatedAt: formatDate(university.updatedAt),
        primaryContact,
      },
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `Lokal universitet detal məlumatına keçilir: ${String(error)}`,
      );
    }

    return buildPayızbackUniversityDetailData(universityId);
  }
});

export const getUniversityNewsDetailData = cache(
  async (universityId: string, newsId: string) => {
    const data = await getUniversityDetailData(universityId);

    if (!data) {
      return null;
    }

    const news = data.news.find((item) => item.id === newsId);

    if (!news) {
      return null;
    }

    return {
      news,
      university: data.university,
    };
  },
);

const fallbackDate = new Date("2026-06-03T10:30:00Z");

const fallbackEducationLevels = [
  {
    id: "level_bachelor",
    name: "Bakalavr",
    status: "ACTIVE",
    sortOrder: 1,
    createdAt: fallbackDate,
    updatedAt: fallbackDate,
  },
  {
    id: "level_master",
    name: "Magistr",
    status: "ACTIVE",
    sortOrder: 2,
    createdAt: fallbackDate,
    updatedAt: fallbackDate,
  },
  {
    id: "level_foundation",
    name: "Hazırlıq",
    status: "ACTIVE",
    sortOrder: 3,
    createdAt: fallbackDate,
    updatedAt: fallbackDate,
  },
];

const fallbackEducationLanguages = [
  {
    id: "lang_english",
    name: "İngiliscə",
    status: "ACTIVE",
    sortOrder: 1,
    createdAt: fallbackDate,
    updatedAt: fallbackDate,
  },
  {
    id: "lang_turkish",
    name: "Türkcə",
    status: "ACTIVE",
    sortOrder: 2,
    createdAt: fallbackDate,
    updatedAt: fallbackDate,
  },
];

const fallbackPeriods = [
  {
    id: "period_2026_fall",
    name: "2026 Payız",
    year: 2026,
    season: "Payız",
    applicationStartDate: new Date("2026-02-01T00:00:00Z"),
    applicationDeadline: new Date("2026-08-15T00:00:00Z"),
    status: "OPEN",
    notes: "Aktiv təhsil haqqı qeydləri üçün əsas qəbul dönəmi.",
    createdAt: fallbackDate,
    updatedAt: fallbackDate,
  },
  {
    id: "period_2026_spring",
    name: "2026 Yaz",
    year: 2026,
    season: "Yaz",
    applicationStartDate: new Date("2025-09-01T00:00:00Z"),
    applicationDeadline: new Date("2026-01-20T00:00:00Z"),
    status: "OPEN",
    notes: "Seçilmiş proqramlar üçün ikinci qəbul dönəmi.",
    createdAt: fallbackDate,
    updatedAt: fallbackDate,
  },
  {
    id: "period_2025_fall",
    name: "2025 Payız",
    year: 2025,
    season: "Payız",
    applicationStartDate: new Date("2025-02-01T00:00:00Z"),
    applicationDeadline: new Date("2025-08-15T00:00:00Z"),
    status: "CLOSED",
    notes: "Qiymət tarixçəsi üçün saxlanılan keçmiş qəbul dönəmi.",
    createdAt: fallbackDate,
    updatedAt: fallbackDate,
  },
];

const fallbackUniversitySeeds = [
  {
    id: "univ_bahcesehir",
    name: "Bahçeşehir University",
    country: "Türkiyə",
    city: "Istanbul",
    schoolType: "FOUNDATION",
    partnershipStatus: "ACTIVE_PARTNER",
    agreementStatus: "ACTIVE",
    programNames: ["Proqram mühəndisliyi", "Biznesin idarə edilməsi"],
    contact: "Qəbul Team",
  },
  {
    id: "univ_istanbul_aydin",
    name: "Istanbul Aydin University",
    country: "Türkiyə",
    city: "Istanbul",
    schoolType: "FOUNDATION",
    partnershipStatus: "ACTIVE_PARTNER",
    agreementStatus: "ACTIVE",
    programNames: ["Stomatologiya", "Beynəlxalq ticarət"],
    contact: "Beynİlxalq ofis",
  },
  {
    id: "univ_europe_applied_sciences",
    name: "University of Europe for Applied Sciences",
    country: "Almaniya",
    city: "Berlin",
    schoolType: "PRIVATE",
    partnershipStatus: "PROSPECT",
    agreementStatus: "PENDING",
    programNames: ["İnnovasiya və dizayn idarəçiliyi", "Rəqəmsal biznes"],
    contact: "Regional qəbul",
  },
  {
    id: "univ_toronto",
    name: "University of Toronto",
    country: "Kanada",
    city: "Toronto",
    schoolType: "PUBLIC",
    partnershipStatus: "ACTIVE_PARTNER",
    agreementStatus: "ACTIVE",
    programNames: ["Kompüter elmləri", "İctimai siyasət"],
    contact: "Michael Chen",
  },
  {
    id: "univ_ucl",
    name: "University College London",
    country: "Birləşmiş Krallıq",
    city: "London",
    schoolType: "PUBLIC",
    partnershipStatus: "ACTIVE_PARTNER",
    agreementStatus: "EXPIRED",
    programNames: ["Memarlıq", "Məlumat elmi"],
    contact: "Emma Johnson",
  },
  {
    id: "univ_monash",
    name: "Monash University",
    country: "Avstraliya",
    city: "Melbourne",
    schoolType: "PUBLIC",
    partnershipStatus: "ACTIVE_PARTNER",
    agreementStatus: "ACTIVE",
    programNames: ["Biotibbi elm", "Mühasibat uçotu"],
    contact: "David Williams",
  },
] as const;

function buildPayızbackUniversityDetailData(universityId: string) {
  const seed = fallbackUniversitySeeds.find((item) => item.id === universityId);

  if (!seed) {
    return null;
  }

  const mainCampus = {
    id: `${seed.id}_campus_main`,
    universityId: seed.id,
    name: "Əsas kampus",
    country: seed.country,
    city: seed.city,
    address: `${seed.city} mərkəzi kampus`,
    imageAccessUrl: null,
    imageUrl: null,
    latitude: null,
    longitude: null,
    isMainCampus: true,
    status: "ACTIVE",
    notes: "Beynəlxalq qəbul üçün əsas kampus.",
    createdAt: fallbackDate,
    updatedAt: fallbackDate,
  };
  const contact = {
    id: `${seed.id}_contact_primary`,
    universityId: seed.id,
    fullName: seed.contact,
    position: "Beynəlxalq qəbul",
    department: "Beynİlxalq ofis",
    email: `international@${seed.id.replace("univ_", "")}.edu`,
    phone: "+994 12 000 00 00",
    whatsapp: "+994 50 000 00 00",
    isPrimary: true,
    notes: "Campus Global komandası üçün əsas əlaqə şəxsi.",
    status: "ACTIVE",
    createdAt: fallbackDate,
    updatedAt: fallbackDate,
  };
  const programs = seed.programNames.map((programName, index) => {
    const period = fallbackPeriods[index % 2];
    const tuitionFee = index === 0 ? 8500 : 6200;

    return {
      id: `${seed.id}_program_${index + 1}`,
      universityId: seed.id,
      campusId: mainCampus.id,
      educationLevelId:
        index === 0
          ? fallbackEducationLevels[0].id
          : fallbackEducationLevels[1].id,
      educationLanguageId: fallbackEducationLanguages[0].id,
      name: programName,
      duration: index === 0 ? "4 il" : "2 il",
      studyMode: "Əyani",
      requirementsSummary: "Diplom, transkript və dil sübutu tələb olunur.",
      status: index === 0 ? "ACTIVE" : "DRAFT",
      notes: "Lokal baxış üçün nümunə proqram qeydi.",
      createdAt: fallbackDate,
      updatedAt: fallbackDate,
      campus: mainCampus,
      educationLevel:
        index === 0 ? fallbackEducationLevels[0] : fallbackEducationLevels[1],
      educationLanguage: fallbackEducationLanguages[0],
      tuitions: [
        {
          id: `${seed.id}_tuition_${index + 1}`,
          programId: `${seed.id}_program_${index + 1}`,
          periodId: period.id,
          currency: seed.country === "Almaniya" ? "EUR" : "USD",
          tuitionFee,
          discountedTuitionFee: index === 0 ? tuitionFee - 2200 : null,
          scholarshipType: index === 0 ? "AMOUNT" : null,
          scholarshipValue: index === 0 ? 2200 : null,
          paymentNote: "İllik təhsil haqqı, təqaüd müqaviləyə bağlıdır.",
          sourceDocumentId: null,
          priceStatus: index === 0 ? "ACTIVE" : "DRAFT",
          lastUpdatedAt: fallbackDate,
          createdAt: fallbackDate,
          updatedAt: fallbackDate,
          period,
          sourceDocument: null,
        },
      ],
    };
  });
  const documents = [
    {
      id: `${seed.id}_doc_agreement`,
      universityId: seed.id,
      relatedEntityType: "UNIVERSITY",
      relatedEntityId: seed.id,
      title: "Tərəfdaşlıq müqaviləsi 2026",
      documentType: "Universitet razılaşması",
      fileUrl: "https://example.com/partnership-agreement.pdf",
      fileName: "partnership-agreement.pdf",
      fileSize: 182400,
      mimeType: "application/pdf",
      uploadedById: null,
      uploadedAt: fallbackDate,
      validFrom: new Date("2026-01-01T00:00:00Z"),
      expiryDate: new Date("2026-12-31T00:00:00Z"),
      status: "ACTIVE",
      notes: "Nümunə razılaşma sənədi.",
      createdAt: fallbackDate,
      updatedAt: fallbackDate,
      uploadedBy: {
        id: "fallback_admin",
        email: "admin@campus.global",
        name: "Admin istifadəçisi",
        role: "ADMIN",
        status: "ACTIVE",
        createdAt: fallbackDate,
        updatedAt: fallbackDate,
      },
      accessUrl: null,
    },
  ];
  const notes = [
    {
      id: `${seed.id}_note_1`,
      universityId: seed.id,
      relatedEntityType: "UNIVERSITY",
      relatedEntityId: seed.id,
      body: "Növbəti payız qəbulundan əvvəl endirimli təhsil haqqını yoxlayın.",
      authorId: "fallback_admin",
      createdAt: fallbackDate,
      updatedAt: fallbackDate,
      author: {
        id: "fallback_admin",
        email: "admin@campus.global",
        name: "Admin istifadəçisi",
        role: "ADMIN",
        status: "ACTIVE",
        createdAt: fallbackDate,
        updatedAt: fallbackDate,
      },
    },
  ];
  const activities: Array<{
    action: string;
    createdAt: Date;
    entityId: string;
    entityType: string;
    id: string;
    newValue: unknown;
    oldValue: unknown;
    user: null;
    userId: null;
  }> = [];
  const university = {
    id: seed.id,
    name: seed.name,
    logoAccessUrl: null,
    logoUrl: null,
    country: seed.country,
    city: seed.city,
    website: `https://${seed.id.replace("univ_", "")}.edu`,
    newsSourceUrl: null,
    newsLastSyncedAt: null,
    schoolType: seed.schoolType,
    partnershipStatus: seed.partnershipStatus,
    agreementStatus: seed.agreementStatus,
    mainEmail: contact.email,
    mainPhone: contact.phone,
    internalNotes:
      "Bu lokal sessiyada verilənlər bazası əlçatan olmadığı üçün nümunə profil məlumatı göstərilir.",
    defaultCurrency: seed.country === "Almaniya" ? "EUR" : "USD",
    defaultEducationLanguageId: fallbackEducationLanguages[0].id,
    defaultEducationLevelId: fallbackEducationLevels[0].id,
    defaultPeriodId: fallbackPeriods[0].id,
    status: "ACTIVE",
    createdById: "fallback_admin",
    createdAt: fallbackDate,
    updatedAt: fallbackDate,
    campuses: [mainCampus],
    contacts: [contact],
    programs,
    documents,
    news: [],
    notes,
  };
  const discountedPrograms = new Set(
    university.programs
      .filter((program) =>
        program.tuitions.some((tuition) => tuition.discountedTuitionFee),
      )
      .map((program) => program.id),
  );
  const activePeriods = new Set(
    university.programs.flatMap((program) =>
      program.tuitions
        .filter((tuition) => tuition.period.status === "OPEN")
        .map((tuition) => tuition.periodId),
    ),
  );

  return {
    university,
    educationLevels: fallbackEducationLevels,
    educationLanguages: fallbackEducationLanguages,
    periods: fallbackPeriods,
    activities,
    news: buildUniversityNewsItems(university),
    studentActivities: [],
    summary: {
      statusLabel: formatEnumLabel(university.status),
      schoolTypeLabel: formatEnumLabel(university.schoolType),
      partnershipLabel: formatPartnershipStatus(university.partnershipStatus),
      agreementLabel: formatAgreementStatus(university.agreementStatus),
      activePrograms: university.programs.filter(
        (program) => program.status === "ACTIVE",
      ).length,
      activePeriods: activePeriods.size,
      discountedPrograms: discountedPrograms.size,
      updatedAt: formatDate(university.updatedAt),
      primaryContact: contact,
    },
  };
}

type NewsUniversityData = {
  country: string;
  id: string;
  logoAccessUrl?: string | null;
  logoUrl?: string | null;
  name: string;
  news: Array<{
    createdAt: Date;
    fetchedAt: Date;
    id: string;
    imageUrl?: string | null;
    publishedAt?: Date | null;
    sourceName?: string | null;
    sourceUrl: string;
    summary?: string | null;
    title: string;
    universityId: string;
  }>;
};

function buildUniversityNewsItems(
  university: NewsUniversityData,
): UniversityNewsItem[] {
  const imageUrl =
    university.logoAccessUrl ??
    university.logoUrl ??
    buildNewsPlaceholderImage(university.name, university.country);

  return university.news.map((item) => {
    const summary =
      normalizeNewsCardSummary(item.summary) ??
      "Məqaləni oxumaq üçün detallara baxın.";

    return {
      date: item.publishedAt ?? item.fetchedAt ?? item.createdAt,
      detail: summary,
      id: item.id,
      imageUrl: item.imageUrl ?? imageUrl,
      sourceName: item.sourceName ?? null,
      sourceUrl: item.sourceUrl,
      summary,
      title: item.title,
      universityId: item.universityId,
    };
  });
}

function normalizeNewsCardSummary(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  if (
    !normalized ||
    normalized.includes("???") ||
    normalized.includes("m?nb") ||
    normalized.includes("s?hif") ||
    normalized.includes("m?qal") ||
    normalized.includes("a??")
  ) {
    return null;
  }

  return normalized;
}

function toPlainNumber(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof value.toNumber === "function"
  ) {
    const numberValue = value.toNumber();

    return Number.isFinite(numberValue) ? numberValue : null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function buildNewsPlaceholderImage(universityName: string, country: string) {
  const initials = universityName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#0b66ff"/><stop offset="0.58" stop-color="#7c3aed"/><stop offset="1" stop-color="#16a34a"/></linearGradient></defs><rect width="960" height="540" fill="url(#g)"/><circle cx="760" cy="110" r="150" fill="#ffffff" opacity="0.14"/><circle cx="160" cy="430" r="190" fill="#ffffff" opacity="0.10"/><text x="72" y="112" fill="#ffffff" font-family="Arial, sans-serif" font-size="28" font-weight="700">${escapeSvgText(country)}</text><text x="72" y="292" fill="#ffffff" font-family="Arial, sans-serif" font-size="120" font-weight="800">${escapeSvgText(initials || "CG")}</text><text x="72" y="360" fill="#eaf2ff" font-family="Arial, sans-serif" font-size="34" font-weight="700">${escapeSvgText(universityName)}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function formatMoney(value: unknown, currency: string) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

function hasUsableDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  return Boolean(databaseUrl && !databaseUrl.includes("CHANGE_ME_DB_PASSWORD"));
}
