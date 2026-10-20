import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UniversityForm } from "@/features/universities/components/university-form";
import { getUniversityCreateOptions } from "@/features/universities/data/create-options";
import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/lib/auth/session";

export default async function AddUniversityPage() {
  await requirePermission("universities:create");

  const createOptions = await getUniversityCreateOptions();

  return (
    <main className="min-h-full bg-[#f6f9ff] px-5 py-4 lg:px-8 lg:py-5">
      <div className="mx-auto flex max-w-[1620px] flex-col gap-4">
        <Button
          asChild
          className="w-fit rounded-xl border-[#dce6f4] bg-white text-[#24365f] hover:bg-[#f6f9ff] hover:text-[#0b66ff]"
          size="sm"
          variant="outline"
        >
          <Link href="/universities">
            <ArrowLeftIcon data-icon="inline-start" />
            Universitetlərə qayıt
          </Link>
        </Button>

        <UniversityForm
          setupOptions={createOptions}
          submitLabel="Universitet əlavə et"
          variant="page"
        />
      </div>
    </main>
  );
}
