import { UniversitiesWorkspace } from "@/features/universities/components/universities-workspace";
import {
  getUniversitiesDashboardData,
  type UniversitiesSearchParams,
} from "@/features/universities/data/dashboard-data";
import { requireSession } from "@/lib/auth/session";

export default async function UniversitiesPage({
  searchParams,
}: {
  searchParams: Promise<UniversitiesSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const [dashboardData, session] = await Promise.all([
    getUniversitiesDashboardData(resolvedSearchParams),
    requireSession(),
  ]);

  return (
    <UniversitiesWorkspace
      data={dashboardData}
      readOnly={
        session.portalType === "student" || session.portalType === "agent"
      }
      readOnlyPortalType={
        session.portalType === "agent" ? "agent" : "student"
      }
    />
  );
}
