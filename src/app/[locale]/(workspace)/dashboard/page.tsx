import { AgentDashboardWorkspace } from "@/features/agents/components/agent-dashboard-workspace";
import { getAgentPortalData } from "@/features/agents/data/detail-data";
import { AdminDashboardWorkspace } from "@/features/dashboard/components/admin-dashboard-workspace";
import { getAdminDashboardData } from "@/features/dashboard/data/dashboard-data";
import { StudentPortalWorkspace } from "@/features/students/components/student-portal-workspace";
import { getStudentPortalData } from "@/features/students/data/portal-data";
import type { AppLocale } from "@/i18n/routing";
import {
  getSessionAgentId,
  requireSession,
} from "@/lib/auth/session";

type PortalSearchParams = Record<string, string | string[] | undefined>;

export default async function DashboardPage({
  searchParams,
  params,
}: {
  searchParams: Promise<PortalSearchParams>;
  params: Promise<{ locale: string }>;
}) {
  const [resolvedSearchParams, { locale }] = await Promise.all([
    searchParams,
    params,
  ]);
  const session = await requireSession({ locale });
  const success = readParam(resolvedSearchParams, "success");
  const error = readParam(resolvedSearchParams, "error");

  if (session.portalType === "agent") {
    const agentId = getSessionAgentId(session);
    const data = await getAgentPortalData(agentId ?? "");

    if (!data) {
      return (
        <PortalUnavailable error={error || "Agent portalı məlumatı əlçatan deyil."} />
      );
    }

    return <AgentDashboardWorkspace data={data} />;
  }

  if (session.portalType === "student") {
    const data = await getStudentPortalData(session.subjectId);

    if (!data) {
      return (
        <PortalUnavailable
          error={error || "Tələbə portalı məlumatı əlçatan deyil."}
        />
      );
    }

    return (
      <StudentPortalWorkspace data={data} error={error} success={success} />
    );
  }

  const data = await getAdminDashboardData(
    readParam(resolvedSearchParams, "range"),
  );

  return (
    <AdminDashboardWorkspace
      data={data}
      locale={locale as AppLocale}
      userName={getUserName(session.email)}
    />
  );
}

function readParam(searchParams: PortalSearchParams, key: string) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function PortalUnavailable({ error }: { error: string }) {
  return (
    <div className="min-h-full bg-[#f6f9ff] px-5 py-6 lg:px-8 lg:py-8">
      <div className="rounded-[1.65rem] border border-red-100 bg-white p-6 text-sm font-semibold text-red-700 shadow-[0_18px_50px_rgba(29,78,216,0.05)]">
        {error}
      </div>
    </div>
  );
}

function getUserName(email: string) {
  const firstPart = email.split("@")[0]?.split(/[._-]/)[0] || "Tural";

  return firstPart.charAt(0).toLocaleUpperCase("az-AZ") + firstPart.slice(1);
}
