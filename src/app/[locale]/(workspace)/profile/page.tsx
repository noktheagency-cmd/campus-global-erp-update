import { StudentProfilWorkspace } from "@/features/students/components/student-portal-workspace";
import { AgentPortalWorkspace } from "@/features/agents/components/agent-portal-workspace";
import { getAgentPortalData } from "@/features/agents/data/detail-data";
import { getSessionAgentId, requireSession } from "@/lib/auth/session";

import {
  getStudentPortalRouteState,
  StudentPortalUnavailable,
} from "../_student-portal-route";

export default async function ProfilPage({
  searchParams,
  params,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  params: Promise<{ locale: string }>;
}) {
  const [resolvedSearchParams, { locale }] = await Promise.all([
    searchParams,
    params,
  ]);
  const session = await requireSession({ locale });
  const agentId = getSessionAgentId(session);

  if (agentId) {
    const agentData = await getAgentPortalData(agentId);

    if (!agentData) {
      return <StudentPortalUnavailable error="Agent profili əlçatan deyil." />;
    }

    return (
      <AgentPortalWorkspace
        data={agentData}
        error={readParam(resolvedSearchParams, "error")}
        selfService
        servicesOpen={readParam(resolvedSearchParams, "services") === "open"}
        success={readParam(resolvedSearchParams, "success")}
      />
    );
  }

  const { data, error, success } = await getStudentPortalRouteState({
    locale,
    searchParams: resolvedSearchParams,
  });

  if (!data) {
    return (
      <StudentPortalUnavailable
        error={error || "Tələbə portalı məlumatı əlçatan deyil."}
      />
    );
  }

  return <StudentProfilWorkspace data={data} error={error} success={success} />;
}

function readParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
