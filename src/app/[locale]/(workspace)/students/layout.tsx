import { requirePermission } from "@/lib/auth/session";

export default async function StudentsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  await requirePermission("students:read", { locale });

  return children;
}
