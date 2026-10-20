import { AgentsWorkspace } from "@/features/agents/components/agents-workspace";
import { getAgentsDashboardData } from "@/features/agents/data/dashboard-data";
import type { AgentsSearchParams } from "@/features/agents/types";

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<AgentsSearchParams>;
}) {
  const dashboardData = await getAgentsDashboardData(await searchParams);

  return <AgentsWorkspace data={dashboardData} />;
}
