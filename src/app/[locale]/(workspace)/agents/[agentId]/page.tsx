import { notFound } from "next/navigation";

import { AgentPortalWorkspace } from "@/features/agents/components/agent-portal-workspace";
import { getAgentPortalData } from "@/features/agents/data/detail-data";

export default async function AgentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ agentId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const data = await getAgentPortalData(agentId);

  if (!data) {
    notFound();
  }

  return (
    <AgentPortalWorkspace
      data={data}
      error={readParam(resolvedSearchParams, "error")}
      servicesOpen={readParam(resolvedSearchParams, "services") === "open"}
      success={readParam(resolvedSearchParams, "success")}
    />
  );
}

function readParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
