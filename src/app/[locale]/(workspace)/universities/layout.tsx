import { requirePermission } from "@/lib/auth/session";

export default async function UniversitiesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  await requirePermission("universities:read", { locale });

  return children;
}
