import { FinanceWorkspace } from "@/features/finance/components/finance-workspace";
import { getFinanceWorkspaceData } from "@/features/finance/data";
import { requirePermission } from "@/lib/auth/session";

type FinanceSearchParams = Record<string, string | string[] | undefined>;

export default async function FinancePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<FinanceSearchParams>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const session = await requirePermission("finance:read", { locale });
  const preview =
    process.env.NODE_ENV !== "production" &&
    readParam(resolvedSearchParams, "preview") === "1";
  const data = await getFinanceWorkspaceData(session, { preview });

  return (
    <FinanceWorkspace
      data={data}
      error={readParam(resolvedSearchParams, "error")}
      success={readParam(resolvedSearchParams, "success")}
    />
  );
}

function readParam(searchParams: FinanceSearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

