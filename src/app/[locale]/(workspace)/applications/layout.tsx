import { requirePermission } from "@/lib/auth/session";

export default async function ApplicationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  await requirePermission("applications:read", { locale });

  return children;
}
