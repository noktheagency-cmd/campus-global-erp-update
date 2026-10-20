import type {
  SupportTicketCategoryCode,
  SupportTicketPriorityCode,
  SupportTicketStatusCode,
} from "@/features/support/types";

export const SUPPORT_CATEGORY_LABELS: Record<
  SupportTicketCategoryCode,
  string
> = {
  TECHNICAL: "Texniki problem",
  PAYMENTS: "Ödəniş və maliyyə",
  DOCUMENTS: "Sənədlər",
  APPLICATIONS: "Müraciətlər",
  ACCOUNT_ACCESS: "Hesab və giriş",
  SERVICE: "Xidmətlər",
  OTHER: "Digər",
};

export const SUPPORT_PRIORITY_LABELS: Record<
  SupportTicketPriorityCode,
  string
> = {
  LOW: "Aşağı",
  MEDIUM: "Orta",
  HIGH: "Yüksək",
  URGENT: "Təcili",
};

export const SUPPORT_STATUS_LABELS: Record<SupportTicketStatusCode, string> = {
  NEW: "Yeni",
  IN_PROGRESS: "Araşdırılır",
  WAITING_FOR_REQUESTER: "Cavab gözlənilir",
  RESOLVED: "Həll edildi",
  CLOSED: "Bağlandı",
};

export const SUPPORT_RELATED_MODULES = [
  ["dashboard", "İdarə paneli"],
  ["applications", "Müraciətlər"],
  ["students", "Tələbələr"],
  ["universities", "Universitetlər"],
  ["services", "Xidmətlər"],
  ["finance", "Maliyyə"],
  ["crm", "CRM"],
  ["profile", "Profil və hesab"],
  ["other", "Digər"],
] as const;

export const SUPPORT_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const SUPPORT_FILE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;
