import { notFound } from "next/navigation";
import { getAgentPayoutPreview } from "@/features/commissions/agent-payout-preview";
import { getSessionAgentId } from "@/lib/auth/session";
import { ApplicationDetail } from "@/features/applications/components/application-detail";
import { getApplicationDetailData } from "@/features/applications/data/detail-data";
import { can } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ applicationId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ applicationId }, query, session] = await Promise.all([
    params,
    searchParams,
    requireSession(),
  ]);
  const isStaff = session.portalType === "staff";
  const isStudent = session.portalType === "student";
  const data = await getApplicationDetailData(applicationId, {
    includeInternal: isStaff,
    studentId: isStudent ? session.subjectId : undefined,
  });

  if (!data) {
    notFound();
  }

  const agentId = getSessionAgentId(session);
  const payoutPreview = agentId
    ? await getAgentPayoutPreview(applicationId, agentId)
    : null;

  return (
    <ApplicationDetail
      payoutPreview={payoutPreview}
      canManageDocuments={isStaff}
      canManageDocumentRequests={
        !isStudent && can(session.role, "applications:update")
      }
      canManageStatus={session.role === "SUPER_ADMIN"}
      canRespondDocumentRequests={can(
        session.role,
        "application-documents:upload",
      )}
      canUploadDocuments={can(session.role, "application-documents:upload")}
      canSubmitDraft={isStudent || session.portalType === "agent"}
      data={data}
      error={query.error}
      isStudentPortal={isStudent}
      success={query.success}
    />
  );
}
