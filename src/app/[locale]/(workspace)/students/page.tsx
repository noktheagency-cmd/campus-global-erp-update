import { StudentsWorkspace } from "@/features/students/components/students-workspace";
import { getStudentsDashboardData } from "@/features/students/data/dashboard-data";
import type { StudentsSearchParams } from "@/features/students/types";
import {
  getCurrentSession,
  getSessionAgentId,
} from "@/lib/auth/session";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<StudentsSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const [dashboardData, session] = await Promise.all([
    getStudentsDashboardData(resolvedSearchParams),
    getCurrentSession(),
  ]);
  const scopedAgentId = session ? getSessionAgentId(session) : null;

  return (
    <StudentsWorkspace
      data={dashboardData}
      isAgentPortal={Boolean(scopedAgentId)}
    />
  );
}
