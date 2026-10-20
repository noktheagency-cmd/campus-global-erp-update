import { cache } from "react";

import { CURRENCIES } from "@/features/universities/constants";

export type UniversityCreateOptions = {
  currencies: typeof CURRENCIES;
  educationLanguages: Array<{ id: string; name: string }>;
  educationLevels: Array<{ id: string; name: string }>;
  periods: Array<{
    id: string;
    name: string;
    season: string;
    status: string;
    year: number;
  }>;
};

export const getUniversityCreateOptions = cache(async () => {
  if (!hasUsableDatabaseUrl()) {
    return fallbackCreateOptions;
  }

  try {
    const { prisma } = await import("@/lib/db");
    const [educationLevels, educationLanguages, periods] = await Promise.all([
      prisma.educationLevel.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true },
      }),
      prisma.educationLanguage.findMany({
        where: { status: "ACTIVE" },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true },
      }),
      prisma.period.findMany({
        orderBy: [{ year: "desc" }, { season: "asc" }],
        select: {
          id: true,
          name: true,
          season: true,
          status: true,
          year: true,
        },
      }),
    ]);

    return {
      currencies: CURRENCIES,
      educationLanguages:
        educationLanguages.length > 0
          ? educationLanguages
          : fallbackCreateOptions.educationLanguages,
      educationLevels:
        educationLevels.length > 0
          ? educationLevels
          : fallbackCreateOptions.educationLevels,
      periods: periods.length > 0 ? periods : fallbackCreateOptions.periods,
    } satisfies UniversityCreateOptions;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Payızing back to local create options: ${String(error)}`);
    }

    return fallbackCreateOptions;
  }
});

const fallbackCreateOptions: UniversityCreateOptions = {
  currencies: CURRENCIES,
  educationLanguages: [
    { id: "fallback_lang_en", name: "İngiliscə" },
    { id: "fallback_lang_tr", name: "Türkcə" },
    { id: "fallback_lang_de", name: "Almanca" },
  ],
  educationLevels: [
    { id: "fallback_level_bachelor", name: "Bakalavr" },
    { id: "fallback_level_master", name: "Magistr" },
    { id: "fallback_level_foundation", name: "Hazırlıq" },
  ],
  periods: [
    {
      id: "fallback_period_2026_fall",
      name: "2026 Payız",
      season: "Payız",
      status: "OPEN",
      year: 2026,
    },
    {
      id: "fallback_period_2027_spring",
      name: "2027 Yaz",
      season: "Yaz",
      status: "OPEN",
      year: 2027,
    },
  ],
};

function hasUsableDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  return Boolean(databaseUrl && !databaseUrl.includes("CHANGE_ME_DB_PASSWORD"));
}
