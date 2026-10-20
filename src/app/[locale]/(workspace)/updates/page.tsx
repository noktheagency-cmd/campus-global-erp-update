import { StudentUpdatesWorkspace } from "@/features/students/components/student-portal-workspace";
import { NotificationsPanel } from "@/features/agents/components/agent-dashboard-workspace";
import { getAgentPortalData } from "@/features/agents/data/detail-data";
import {
  getSessionAgentId,
  requireSession,
} from "@/lib/auth/session";

import {
  getStudentPortalRouteState,
  StudentPortalUnavailable,
} from "../_student-portal-route";

export default async function UpdatesPage({
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
      return (
        <StudentPortalUnavailable error="Agent bildirişləri əlçatan deyil." />
      );
    }

    return (
      <div className="min-h-full bg-[#f6f9ff] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <header className="mb-4">
            <h1 className="text-2xl font-black tracking-tight text-[#102442]">
              Bildirişlər
            </h1>
            <p className="mt-1 text-sm text-[#71809a]">
              Müraciət, sənəd və tələbə hadisələri
            </p>
          </header>
          <NotificationsPanel
            fullPage
            notifications={agentData.notifications}
            unreadCount={agentData.unreadNotifications}
          />
        </div>
      </div>
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

  return <StudentUpdatesWorkspace data={data} error={error} success={success} />;
}
