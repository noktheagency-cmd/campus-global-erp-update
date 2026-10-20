import { format, parseISO } from "date-fns";
import { az } from "date-fns/locale";

export function formatHrDate(value: string, pattern = "dd MMM yyyy") {
  if (!value) {
    return "—";
  }

  try {
    return format(parseISO(value), pattern, { locale: az });
  } catch {
    return value;
  }
}

export function formatHrMoney(value: number, currency = "AZN") {
  const normalizedCurrency = currency.trim().toUpperCase() || "AZN";
  const amount = Number.isFinite(value) ? value : 0;
  const [integer, decimal = ""] = Math.abs(amount).toFixed(2).split(".");
  const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const trimmedDecimal = decimal.replace(/0+$/, "");
  const formattedAmount = `${amount < 0 ? "−" : ""}${groupedInteger}${
    trimmedDecimal ? `,${trimmedDecimal}` : ""
  }`;

  return `${formattedAmount} ${getCurrencySymbol(normalizedCurrency)}`;
}

function getCurrencySymbol(currency: string) {
  const symbols: Record<string, string> = {
    AZN: "₼",
    EUR: "€",
    GBP: "£",
    TRY: "₺",
    USD: "$",
  };

  return symbols[currency] ?? currency;
}

export function getHrInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toLocaleUpperCase("az-AZ");
}

export function getTodayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
