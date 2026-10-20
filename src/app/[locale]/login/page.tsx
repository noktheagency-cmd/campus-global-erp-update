import { ErpLoginPage } from "@/features/auth/components/erp-login-page";

type LocaleLoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function LocaleLoginPage({
  params,
  searchParams,
}: LocaleLoginPageProps) {
  const { locale } = await params;
  const query = await searchParams;

  return <ErpLoginPage locale={locale} nextPath={getFirst(query.next)} />;
}

function getFirst(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}
