import { ApplicationWizard } from "@/features/applications/components/application-wizard";
import { getApplicationCreateOptions } from "@/features/applications/data/create-options";
import { requirePermission } from "@/lib/auth/session";

type NewApplicationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewApplicationPage({
  searchParams,
}: NewApplicationPageProps) {
  await requirePermission("applications:create");

  const params = await searchParams;
  const options = await getApplicationCreateOptions();

  return (
    <ApplicationWizard
      options={options}
      prefill={{
        programId: readParam(params, "programId"),
        tuitionId: readParam(params, "tuitionId"),
        universityId: readParam(params, "universityId"),
      }}
    />
  );
}

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}
