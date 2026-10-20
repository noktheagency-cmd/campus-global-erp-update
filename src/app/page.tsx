import { redirect } from "next/navigation";

type HomePageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const nextPath = getFirst(params.next);
  const target = nextPath
    ? `/login?next=${encodeURIComponent(nextPath)}`
    : "/login";

  redirect(target);
}

function getFirst(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}
