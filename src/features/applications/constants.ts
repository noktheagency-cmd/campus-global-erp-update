export const APPLICATION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "INVALID_DOCUMENTS",
  "ACCEPTED",
  "REJECTED",
  "UNDER_REVIEW",
  "OFFER",
  "ENROLLED",
  "ARCHIVED",
] as const;

export const APPLICATION_DECISION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "INVALID_DOCUMENTS",
  "ACCEPTED",
  "REJECTED",
] as const;

export const APPLICATION_REASON_REQUIRED_STATUSES = [
  "INVALID_DOCUMENTS",
  "REJECTED",
] as const;

export const APPLICATION_LEGACY_STATUSES = [
  "UNDER_REVIEW",
  "OFFER",
  "ENROLLED",
  "ARCHIVED",
] as const;

export const APPLICATION_DOCUMENT_STATUSES = [
  "MISSING",
  "UPLOADED",
  "INVALID",
  "WAIVED",
  "ARCHIVED",
] as const;

export const APPLICATION_REQUIRED_DOCUMENT_READY_STATUSES = [
  "UPLOADED",
  "WAIVED",
] as const;

export const APPLICATION_DOCUMENT_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

export const APPLICATION_DOCUMENT_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
] as const;

export const APPLICATION_DOCUMENT_UPLOAD_BLOCKED_STATUSES = [
  "ACCEPTED",
  "ARCHIVED",
  "ENROLLED",
  "REJECTED",
] as const;

export const APPLICATION_DOCUMENT_REQUEST_TYPES = [
  { label: "Offer / ödəniş sənədi", value: "PAYMENT_OFFER" },
  { label: "Offer Letter", value: "OFFER_LETTER" },
  { label: "Qəbul sənədi", value: "ACCEPTANCE_LETTER" },
  { label: "Şərti qəbul sənədi", value: "CONDITIONAL_ACCEPTANCE" },
  { label: "Qeydiyyat sənədi", value: "ENROLLMENT_DOCUMENT" },
  { label: "Viza sənədi", value: "VISA_DOCUMENT" },
  { label: "Digər", value: "OTHER" },
] as const;

export const APPLICATION_DOCUMENT_RESPONSE_TYPES = [
  {
    description: "Tələbə sənədi oxuduğunu təsdiqləyir.",
    label: "Yalnız təsdiq",
    value: "ACKNOWLEDGEMENT",
  },
  {
    description: "Təsdiqdən sonra cavab sənədi və tarix yüklənir.",
    label: "Sənəd yükləmə",
    value: "FILE_UPLOAD",
  },
  {
    description: "Təsdiqdən sonra ödəniş qəbzi və ödəniş tarixi yüklənir.",
    label: "Ödəniş qəbzi",
    value: "PAYMENT_RECEIPT",
  },
] as const;

export const APPLICATION_DOCUMENT_RESPONSE_TYPE_VALUES = [
  "ACKNOWLEDGEMENT",
  "FILE_UPLOAD",
  "PAYMENT_RECEIPT",
] as const;

export const APPLICATION_DOCUMENT_REQUEST_STATUS_LABELS = {
  ACKNOWLEDGED: "Təsdiqlənib",
  CANCELLED: "Ləğv edilib",
  COMPLETED: "Tamamlanıb",
  PENDING: "Gözləyir",
} as const;

export const APPLICATION_ADDITIONAL_DOCUMENT_CATEGORIES = [
  { key: "offer-letter", label: "Offer Letter" },
  { key: "acceptance-letter", label: "Acceptance Letter" },
  { key: "conditional-acceptance", label: "Conditional Acceptance" },
  { key: "student-certificate", label: "Student Certificate" },
  { key: "other", label: "Other" },
] as const;

export const APPLICATION_STATUS_TRANSITIONS: Record<
  (typeof APPLICATION_STATUSES)[number],
  readonly (typeof APPLICATION_STATUSES)[number][]
> = {
  ARCHIVED: [],
  ACCEPTED: ["DRAFT", "SUBMITTED", "INVALID_DOCUMENTS", "ACCEPTED", "REJECTED"],
  DRAFT: ["DRAFT", "SUBMITTED", "INVALID_DOCUMENTS", "ACCEPTED", "REJECTED"],
  ENROLLED: ["DRAFT", "SUBMITTED", "INVALID_DOCUMENTS", "ACCEPTED", "REJECTED"],
  INVALID_DOCUMENTS: [
    "DRAFT",
    "SUBMITTED",
    "INVALID_DOCUMENTS",
    "ACCEPTED",
    "REJECTED",
  ],
  OFFER: ["DRAFT", "SUBMITTED", "INVALID_DOCUMENTS", "ACCEPTED", "REJECTED"],
  REJECTED: ["DRAFT", "SUBMITTED", "INVALID_DOCUMENTS", "ACCEPTED", "REJECTED"],
  SUBMITTED: [
    "DRAFT",
    "SUBMITTED",
    "INVALID_DOCUMENTS",
    "ACCEPTED",
    "REJECTED",
  ],
  UNDER_REVIEW: [
    "DRAFT",
    "SUBMITTED",
    "INVALID_DOCUMENTS",
    "ACCEPTED",
    "REJECTED",
  ],
};

export const APPLICATION_LEVEL_CARDS = [
  {
    aliases: ["ön lisans", "on lisans", "associate", "sub-bachelor"],
    icon: "graduation",
    key: "associate",
    label: "Ön Lisans",
  },
  {
    aliases: ["lisans", "bakalavr", "bachelor"],
    icon: "university",
    key: "bachelor",
    label: "Lisans",
  },
  {
    aliases: ["yüksək lisans", "yuksek lisans", "magistr", "master"],
    icon: "book",
    key: "master",
    label: "Yüksək Lisans",
  },
  {
    aliases: ["doktor", "doktorantura", "phd"],
    icon: "flask",
    key: "phd",
    label: "Doktora",
  },
  {
    aliases: ["bütünləşik doktora", "butunlesik doktora", "integrated phd"],
    icon: "atom",
    key: "integrated-phd",
    label: "Bütünləşik Doktora",
  },
] as const;

export const APPLICATION_LIST_SORTS = [
  "updated-desc",
  "created-desc",
  "student-asc",
] as const;

export const APPLICATION_DOCUMENT_GROUPS = {
  additional: "Əlavə Sənədlər",
  essential: "Əsas Sənədlər",
  optional: "Digər Sənədlər",
} as const;

export const APPLICATION_STATUS_LABELS: Record<
  (typeof APPLICATION_STATUSES)[number],
  string
> = {
  ACCEPTED: "Qəbul olundu",
  ARCHIVED: "Arxiv",
  DRAFT: "Qaralama",
  ENROLLED: "Qəbul olundu",
  INVALID_DOCUMENTS: "Düzgün olmayan sənədlər",
  OFFER: "Qəbul olundu",
  REJECTED: "Qəbul uğursuz oldu",
  SUBMITTED: "Göndərildi",
  UNDER_REVIEW: "Yoxlanılır",
};

export const APPLICATION_STATUS_DESCRIPTIONS: Record<
  (typeof APPLICATION_DECISION_STATUSES)[number],
  string
> = {
  ACCEPTED: "Namizəd qəbul olundu. Tələbə və agent bunu görə biləcək.",
  DRAFT: "Müraciət tamamlanmayıb və göndərilməyib.",
  INVALID_DOCUMENTS:
    "Sənədlərdə problem var. Səbəb tələbə və agent bildirişlərinə düşəcək.",
  REJECTED: "Qəbul uğursuz oldu. Səbəb tələbə və agent bildirişlərinə düşəcək.",
  SUBMITTED: "Müraciət baxışa göndərilib.",
};
