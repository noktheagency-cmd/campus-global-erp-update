import { CrmWorkspace } from "@/features/crm/components/crm-workspace";
import { getCrmDashboardData } from "@/features/crm/data/dashboard-data";
import { requirePermission } from "@/lib/auth/session";

export default async function CrmPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requirePermission("crm:read", { locale });
  const data = await getCrmDashboardData();

  return <CrmWorkspace data={data} />;
}
