import { HrWorkspace } from "@/features/hr/components/hr-workspace";
import { HR_TABS, type HrTab } from "@/features/hr/constants";
import { getHrWorkspaceData } from "@/features/hr/data";
import type { AppLocale } from "@/i18n/routing";
import { requirePermission } from "@/lib/auth/session";

type HrSearchParams = Record<string, string | string[] | undefined>;

export default async function HrPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<HrSearchParams>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const session = await requirePermission("hr:read", { locale });
  const preview =
    process.env.NODE_ENV !== "production" &&
    readParam(resolvedSearchParams, "preview") === "1";
  const activeTab = resolveTab(readParam(resolvedSearchParams, "tab"));
  const data = await getHrWorkspaceData(session, {
    employeeDepartment: readParam(resolvedSearchParams, "department"),
    employeeId: readParam(resolvedSearchParams, "employee"),
    employeePage: readPositiveInteger(resolvedSearchParams, "page"),
    employeeQuery: readParam(resolvedSearchParams, "q"),
    employeeStatus: readParam(resolvedSearchParams, "status"),
    employeeWorkMode: readParam(resolvedSearchParams, "mode"),
    payrollRunId: readParam(resolvedSearchParams, "run"),
    preview,
    tab: activeTab,
  });

  return (
    <HrWorkspace
      data={data}
      error={readParam(resolvedSearchParams, "error")}
      initialEmployeeId={readParam(resolvedSearchParams, "employee")}
      initialTab={activeTab}
      locale={locale as AppLocale}
      success={readParam(resolvedSearchParams, "success")}
    />
  );
}

function resolveTab(value: string): HrTab {
  return HR_TABS.some((item) => item.id === value)
    ? (value as HrTab)
    : "overview";
}

function readPositiveInteger(searchParams: HrSearchParams, key: string) {
  const value = Number(readParam(searchParams, key));
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}

function readParam(searchParams: HrSearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
