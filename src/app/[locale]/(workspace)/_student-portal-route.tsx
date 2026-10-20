import { redirect } from "next/navigation";

import { getStudentPortalData } from "@/features/students/data/portal-data";
import {
  getDefaultWorkspacePath,
  requireSession,
} from "@/lib/auth/session";

type StudentPortalRouteSearchParams = Record<
  string,
  string | string[] | undefined
>;

export async function getStudentPortalRouteState({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams: StudentPortalRouteSearchParams;
}) {
  const session = await requireSession({ locale });

  if (session.portalType !== "student") {
    redirect(getDefaultWorkspacePath(session.role, locale));
  }

  const data = await getStudentPortalData(session.subjectId);

  return {
    data,
    error: readParam(searchParams, "error"),
    success: readParam(searchParams, "success"),
  };
}

export function StudentPortalUnavailable({ error }: { error: string }) {
  return (
    <div className="min-h-full bg-[#f6f9ff] px-5 py-6 lg:px-8 lg:py-8">
      <div className="rounded-[1.65rem] border border-red-100 bg-white p-6 text-sm font-semibold text-red-700 shadow-[0_18px_50px_rgba(29,78,216,0.05)]">
        {error}
      </div>
    </div>
  );
}

function readParam(searchParams: StudentPortalRouteSearchParams, key: string) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}
