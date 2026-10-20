import type {
  CommissionAgreementStatus,
  CommissionCalculationStatus,
  CommissionMethod,
} from "@/features/commissions/types";

export const COMMISSION_TABS = [
  { id: "overview", label: "İcmal" },
  { id: "agreements", label: "Müqavilələr" },
  { id: "calculations", label: "Hesablamalar" },
  { id: "payments", label: "Ödənişlər" },
  { id: "audit", label: "Audit" },
] as const;

export type CommissionTab = (typeof COMMISSION_TABS)[number]["id"];

export const COMMISSION_AGREEMENT_STATUS_LABELS: Record<
  CommissionAgreementStatus,
  string
> = {
  ACTIVE: "Aktiv",
  ARCHIVED: "Arxivləndi",
  DRAFT: "Qaralama",
  EXPIRED: "Müddəti bitib",
  SUSPENDED: "Dayandırılıb",
};

export const COMMISSION_CALCULATION_STATUS_LABELS: Record<
  CommissionCalculationStatus,
  string
> = {
  CALCULATED: "Hesablanıb",
  CANCELLED: "Ləğv edilib",
  PAID: "Ödənilib",
  PARTIALLY_PAID: "Qismən ödənilib",
  PAYABLE: "Ödənişə hazır",
  UNDER_REVIEW: "Yoxlanılır",
};

export const COMMISSION_METHOD_LABELS: Record<CommissionMethod, string> = {
  FIXED: "Sabit məbləğ",
  PERCENTAGE: "Faiz",
};
