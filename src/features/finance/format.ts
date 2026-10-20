import { format } from "date-fns";
import { az } from "date-fns/locale";

export function formatFinanceMoney(
  amount: number,
  currency = "AZN",
  options: { compact?: boolean; maximumFractionDigits?: number } = {},
) {
  const value = new Intl.NumberFormat("en-US", {
    maximumFractionDigits:
      options.maximumFractionDigits ?? (Number.isInteger(amount) ? 0 : 2),
    notation: options.compact ? "compact" : "standard",
  }).format(amount);

  return `${currency} ${value}`;
}

export function formatFinanceDate(value: string, pattern = "dd MMM yyyy") {
  return format(new Date(`${value}T12:00:00`), pattern, { locale: az });
}

export function formatFinancePercent(value: number | null) {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function getTodayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function escapeCsv(value: string | number) {
  const normalized = String(value).replaceAll('"', '""');
  return `"${normalized}"`;
}
