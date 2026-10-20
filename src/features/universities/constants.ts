export const SCHOOL_TYPES = [
  "PUBLIC",
  "PRIVATE",
  "FOUNDATION",
  "PUBLIC_PRIVATE",
  "COLLEGE",
  "LANGUAGE_SCHOOL",
  "OTHER",
] as const;

export const PARTNERSHIP_STATUSES = [
  "PROSPECT",
  "ACTIVE_PARTNER",
  "AGREEMENT_PENDING",
  "SUSPENDED",
  "ARCHIVED",
] as const;

export const AGREEMENT_STATUSES = [
  "NONE",
  "PENDING",
  "ACTIVE",
  "EXPIRED",
] as const;

export const ENTITY_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const PROGRAM_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
] as const;

export const PERIOD_STATUSES = ["OPEN", "CLOSED", "ARCHIVED"] as const;

export const PRICE_STATUSES = ["DRAFT", "ACTIVE", "EXPIRED"] as const;

export const CURRENCIES = [
  "USD",
  "EUR",
  "TRY",
  "AZN",
  "GBP",
  "CAD",
  "RUB",
] as const;

export const SCHOLARSHIP_TYPES = ["AMOUNT", "PERCENTAGE", "CUSTOM"] as const;

export const DOCUMENT_TYPES = [
  "Universitet razılaşması",
  "Komissiya razılaşması",
  "Qiymət siyahısı",
  "Qəbul tələbləri",
  "Broşür",
  "Faktura",
  "E-poçt təsdiqi",
  "Digər",
] as const;

export const EDUCATION_LEVEL_SEEDS = [
  "Bakalavr",
  "Magistratura",
  "Doktorantura",
  "Magistratura - tezli",
  "Magistratura - tezsiz",
  "Hazırlıq",
  "Dil kursu",
] as const;

export const EDUCATION_LANGUAGE_SEEDS = [
  "İngiliscə",
  "Türkcə",
  "Almanca",
  "Fransızca",
  "Rusca",
  "İtalyanca",
  "İspanca",
  "Qarışıq",
  "Digər",
] as const;
