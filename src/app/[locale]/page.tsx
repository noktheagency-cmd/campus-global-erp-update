import { redirect } from "next/navigation";

export default async function LocaleHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    next?: string | string[];
  }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const nextPath = getFirst(query.next);
  const loginPath = locale === "az" ? "/login" : `/${locale}/login`;
  const target = nextPath
    ? `${loginPath}?next=${encodeURIComponent(nextPath)}`
    : loginPath;

  redirect(target);
}

function getFirst(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}
