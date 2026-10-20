import { ErpLoginPage } from "@/features/auth/components/erp-login-page";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return <ErpLoginPage locale="az" nextPath={getFirst(params.next)} />;
}

function getFirst(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}
