import type {
  FinanceAccountType,
  FinanceCounterpartyType,
  FinanceTransactionStatus,
  FinanceTransactionType,
} from "@/features/finance/types";

export const FINANCE_BASE_CURRENCY = "AZN";
export const FINANCE_CURRENCIES = ["AZN", "USD", "EUR", "TRY", "GBP"] as const;

export const FINANCE_ACCOUNT_TYPE_LABELS: Record<FinanceAccountType, string> = {
  BANK: "Bank hesabı",
  CASH: "Nağd kassa",
  DIGITAL_WALLET: "Rəqəmsal hesab",
};

export const FINANCE_TRANSACTION_TYPE_LABELS: Record<
  FinanceTransactionType,
  string
> = {
  EXPENSE: "Xərc ödənişi",
  INCOME: "Gəlir qəbulu",
  TRANSFER: "Hesablararası transfer",
};

export const FINANCE_TRANSACTION_STATUS_LABELS: Record<
  FinanceTransactionStatus,
  string
> = {
  DRAFT: "Qaralama",
  POSTED: "Tamamlandı",
  VOID: "Ləğv edildi",
};

export const FINANCE_COUNTERPARTY_LABELS: Record<
  FinanceCounterpartyType,
  string
> = {
  AGENT: "Agent",
  OTHER: "Digər",
  PARTNER: "Tərəfdaş",
  STUDENT: "Tələbə",
  UNIVERSITY: "Universitet",
  VENDOR: "Təchizatçı",
};

export const FINANCE_TABS = [
  { id: "overview", label: "İcmal" },
  { id: "transactions", label: "Əməliyyatlar" },
  { id: "receivables", label: "Debitorlar" },
  { id: "payables", label: "Kreditorlar" },
  { id: "budget", label: "Büdcə" },
  { id: "accounts", label: "Hesablar" },
] as const;

export type FinanceTab = (typeof FINANCE_TABS)[number]["id"];
