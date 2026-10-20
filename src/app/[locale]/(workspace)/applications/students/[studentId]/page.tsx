import { notFound } from "next/navigation";

import { ApplicationStudentDetail } from "@/features/applications/components/application-student-detail";
import { getApplicationStudentDetailData } from "@/features/applications/data/student-detail-data";
import { requireSession } from "@/lib/auth/session";

export default async function ApplicationStudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ studentId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  await requireSession();

  const data = await getApplicationStudentDetailData(studentId);

  if (!data) {
    notFound();
  }

  return (
    <ApplicationStudentDetail
      data={data}
      error={readParam(resolvedSearchParams, "error")}
      success={readParam(resolvedSearchParams, "success")}
    />
  );
}

function readParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}
