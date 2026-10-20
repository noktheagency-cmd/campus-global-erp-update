import type {
  CrmInteractionTypeCode,
  CrmSourceCode,
  CrmStageCode,
  CrmStatusCode,
  CrmTaskPriorityCode,
  CrmTaskStatusCode,
} from "@/features/crm/types";

export const CRM_STAGE_LABELS: Record<CrmStageCode, string> = {
  NEW_LEAD: "Yeni lead",
  CONTACTED: "Əlaqə qurulub",
  CONSULTATION: "Konsultasiya",
  DOCUMENT_COLLECTION: "Sənəd toplama",
  APPLICATION: "Müraciət",
  OFFER: "Təklif",
  ENROLLED: "Qeydiyyat",
  PARTNER_ONBOARDING: "Tərəfdaşlıq hazırlığı",
  ACTIVE_PARTNER: "Aktiv tərəfdaş",
  WON: "Qazanılıb",
  LOST: "İtirilib",
};

export const CRM_STATUS_LABELS: Record<CrmStatusCode, string> = {
  ACTIVE: "Aktiv imkan",
  FOLLOW_UP: "İzlənməlidir",
  PAUSED: "Dayandırılıb",
  WON: "Qazanılıb",
  LOST: "İtirilib",
};

export const CRM_SOURCE_LABELS: Record<CrmSourceCode, string> = {
  WEBSITE: "Veb sayt",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  WHATSAPP: "WhatsApp",
  REFERRAL: "Tövsiyə",
  AGENT_REFERRAL: "Agent yönləndirməsi",
  EVENT: "Tədbir",
  MANUAL: "Əl ilə",
  OTHER: "Digər",
};

export const CRM_TASK_STATUS_LABELS: Record<CrmTaskStatusCode, string> = {
  TODO: "Gözləyir",
  IN_PROGRESS: "İcradadır",
  COMPLETED: "Tamamlanıb",
  CANCELLED: "Ləğv edilib",
};

export const CRM_TASK_PRIORITY_LABELS: Record<CrmTaskPriorityCode, string> = {
  LOW: "Aşağı",
  MEDIUM: "Orta",
  HIGH: "Yüksək",
  URGENT: "Təcili",
};

export const CRM_INTERACTION_LABELS: Record<CrmInteractionTypeCode, string> = {
  CALL: "Zəng",
  EMAIL: "E-poçt",
  WHATSAPP: "WhatsApp",
  MEETING: "Görüş",
  NOTE: "Qeyd",
  APPLICATION: "Müraciət",
  DOCUMENT: "Sənəd",
  SYSTEM: "Sistem",
};

export const INDIVIDUAL_STAGES: CrmStageCode[] = [
  "NEW_LEAD",
  "CONTACTED",
  "CONSULTATION",
  "DOCUMENT_COLLECTION",
  "APPLICATION",
  "OFFER",
  "ENROLLED",
  "WON",
  "LOST",
];

export const AGENT_STAGES: CrmStageCode[] = [
  "NEW_LEAD",
  "CONTACTED",
  "PARTNER_ONBOARDING",
  "ACTIVE_PARTNER",
  "WON",
  "LOST",
];
