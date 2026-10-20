import { APPLICATION_DOCUMENT_GROUPS } from "@/features/applications/constants";

export type ApplicationDocumentRequirement = {
  key: string;
  title: string;
  group: keyof typeof APPLICATION_DOCUMENT_GROUPS;
  required: boolean;
  recommended: boolean;
  note?: string;
};

export const undergradDocumentRequirements: ApplicationDocumentRequirement[] = [
  {
    group: "essential",
    key: "passport",
    recommended: true,
    required: true,
    title: "Pasport",
  },
  {
    group: "essential",
    key: "attestat-diplom-mezun-arayisi",
    recommended: true,
    required: false,
    title: "Attestat / Diplom / Məzun Arayışı",
  },
  {
    group: "essential",
    key: "oxuduguna-dair-arayis",
    note: "Əgər tələbə məzun deyilsə",
    recommended: true,
    required: false,
    title: "Oxuduğuna dair Arayış",
  },
  {
    group: "essential",
    key: "transkript",
    recommended: true,
    required: true,
    title: "Transkript (Qiymət Cədvəli)",
  },
  {
    group: "essential",
    key: "foto",
    recommended: true,
    required: true,
    title: "Foto (5x6 / 3x4)",
  },
  {
    group: "essential",
    key: "denklik-belgesi",
    recommended: true,
    required: false,
    title: "Denklik sənədi",
  },
  {
    group: "essential",
    key: "dil-sertifikati",
    recommended: true,
    required: false,
    title: "Dil Sertifikatı",
  },
  {
    group: "essential",
    key: "ielts-result",
    recommended: true,
    required: true,
    title: "İmtahan Nəticəsi — IELTS",
  },
  {
    group: "optional",
    key: "optional-denklik-belgesi",
    recommended: false,
    required: false,
    title: "Denklik sənədi",
  },
  {
    group: "optional",
    key: "optional-language-certificate",
    recommended: false,
    required: false,
    title: "Dil Sertifikatı (IELTS / TOEFL / YDS)",
  },
  {
    group: "optional",
    key: "reference-letter",
    recommended: false,
    required: false,
    title: "Referans / Tövsiyə Məktubu",
  },
  {
    group: "optional",
    key: "motivation-letter",
    recommended: false,
    required: false,
    title: "Motivasiya Məktubu (SOP)",
  },
  {
    group: "optional",
    key: "certificates",
    recommended: false,
    required: false,
    title: "Sertifikatlar",
  },
  {
    group: "optional",
    key: "other",
    recommended: false,
    required: false,
    title: "Digər",
  },
];

export const genericDocumentRequirements: ApplicationDocumentRequirement[] = [
  {
    group: "essential",
    key: "passport",
    recommended: true,
    required: true,
    title: "Pasport",
  },
  {
    group: "essential",
    key: "diploma",
    recommended: true,
    required: true,
    title: "Diplom",
  },
  {
    group: "essential",
    key: "transcript",
    recommended: true,
    required: true,
    title: "Transkript (Qiymət Cədvəli)",
  },
  {
    group: "essential",
    key: "photo",
    recommended: true,
    required: true,
    title: "Foto (5x6 / 3x4)",
  },
  {
    group: "optional",
    key: "language-certificate",
    recommended: false,
    required: false,
    title: "Dil Sertifikatı",
  },
  {
    group: "optional",
    key: "other",
    recommended: false,
    required: false,
    title: "Digər",
  },
];

export function getDocumentRequirements(levelKey?: string) {
  if (levelKey === "associate" || levelKey === "bachelor") {
    return undergradDocumentRequirements;
  }

  return genericDocumentRequirements;
}
