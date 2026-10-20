import { requirePermission } from "@/lib/auth/session";

export default async function AgentsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  await requirePermission("agents:read", { locale });

  return children;
}
