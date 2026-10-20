import { ApplicationsWorkspace } from "@/features/applications/components/applications-workspace";
import {
  getApplicationsDashboardData,
} from "@/features/applications/data/dashboard-data";
import type { ApplicationsSearchParams } from "@/features/applications/types";
import { requireSession } from "@/lib/auth/session";

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<ApplicationsSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const success = readParam(resolvedSearchParams, "success");
  const [session, dashboardData] = await Promise.all([
    requireSession(),
    getApplicationsDashboardData(resolvedSearchParams),
  ]);

  return (
    <ApplicationsWorkspace
      data={dashboardData}
      success={success}
      viewer={session.portalType === "student" ? "student" : "workspace"}
    />
  );
}

function readParam(searchParams: ApplicationsSearchParams, key: string) {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}
