import { SupportWorkspace } from "@/features/support/components/support-workspace";
import { getSupportWorkspaceData } from "@/features/support/data";
import type {
  SupportTicketCategoryCode,
  SupportTicketPriorityCode,
  SupportTicketStatusCode,
  SupportWorkspaceQuery,
} from "@/features/support/types";
import { requirePermission } from "@/lib/auth/session";

type SupportSearchParams = Record<string, string | string[] | undefined>;

export default async function SupportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SupportSearchParams>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const session = await requirePermission("tickets:read", { locale });
  const data = await getSupportWorkspaceData(
    session,
    parseSupportQuery(resolvedSearchParams),
  );

  return (
    <SupportWorkspace
      data={data}
      error={readParam(resolvedSearchParams, "error")}
      success={readParam(resolvedSearchParams, "success")}
    />
  );
}

function parseSupportQuery(
  searchParams: SupportSearchParams,
): SupportWorkspaceQuery {
  const category = readEnumParam(searchParams, "category", SUPPORT_CATEGORIES);
  const priority = readEnumParam(searchParams, "priority", SUPPORT_PRIORITIES);
  const status = readEnumParam(searchParams, "status", SUPPORT_STATUSES);
  const direction = readParam(searchParams, "direction");
  const query = readParam(searchParams, "q").trim().slice(0, 100);

  return {
    ...(category ? { category } : {}),
    ...(priority ? { priority } : {}),
    ...(status ? { status } : {}),
    ...(query ? { query } : {}),
    cursor: readParam(searchParams, "cursor") || undefined,
    direction:
      direction === "previous" || direction === "next" ? direction : undefined,
    selectedTicketId: readParam(searchParams, "ticket") || undefined,
  };
}

function readEnumParam<T extends string>(
  searchParams: SupportSearchParams,
  key: string,
  values: readonly T[],
) {
  const value = readParam(searchParams, key);
  return values.includes(value as T) ? (value as T) : undefined;
}

function readParam(searchParams: SupportSearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

const SUPPORT_CATEGORIES = [
  "TECHNICAL",
  "PAYMENTS",
  "DOCUMENTS",
  "APPLICATIONS",
  "ACCOUNT_ACCESS",
  "SERVICE",
  "OTHER",
] as const satisfies readonly SupportTicketCategoryCode[];
const SUPPORT_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const satisfies readonly SupportTicketPriorityCode[];
const SUPPORT_STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "WAITING_FOR_REQUESTER",
  "RESOLVED",
  "CLOSED",
] as const satisfies readonly SupportTicketStatusCode[];
