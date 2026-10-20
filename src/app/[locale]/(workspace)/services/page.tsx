import { ServicesWorkspace } from "@/features/services/components/services-workspace";
import { getServicesWorkspaceData } from "@/features/services/data";
import { requirePermission } from "@/lib/auth/session";

type ServicesSearchParams = Record<string, string | string[] | undefined>;

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<ServicesSearchParams>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const session = await requirePermission("services:read", { locale });
  const data = await getServicesWorkspaceData(session);

  return (
    <ServicesWorkspace
      data={data}
      error={readParam(resolvedSearchParams, "error")}
      success={readParam(resolvedSearchParams, "success")}
      view={readParam(resolvedSearchParams, "view")}
    />
  );
}

function readParam(searchParams: ServicesSearchParams, key: string) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}
