import { defineRouting } from "next-intl/routing";

export const locales = ["az", "en", "ru", "tr"] as const;
export const defaultLocale = "az";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeDetection: false,
});

export type AppLocale = (typeof locales)[number];
