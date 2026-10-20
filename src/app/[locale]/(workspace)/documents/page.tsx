import { StudentDocumentsWorkspace } from "@/features/students/components/student-portal-workspace";

import {
  getStudentPortalRouteState,
  StudentPortalUnavailable,
} from "../_student-portal-route";

export default async function DocumentsPage({
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

  return (
    <StudentDocumentsWorkspace
      data={data}
      error={error}
      success={success}
    />
  );
}
