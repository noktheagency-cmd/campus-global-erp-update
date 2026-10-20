"use client";

import { RefreshCcwIcon, ServerCrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HrError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f6f9ff] px-5 py-12">
      <section className="w-full max-w-xl rounded-[24px] border border-[#dce5f0] bg-white p-8 text-center shadow-[0_18px_50px_rgba(29,53,87,0.08)]">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#fff1f2] text-[#d92d20]">
          <ServerCrashIcon className="size-6" />
        </span>
        <h1 className="mt-5 text-xl font-bold tracking-[-0.02em] text-[#10234a]">
          HR məlumatları hazırda əlçatan deyil
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6d7d99]">
          Sistem real məlumatı qoruya bilmədiyi üçün demo məlumat göstərmir. Bir
          neçə saniyə sonra yenidən yoxlayın; problem davam edərsə sistem
          inzibatçısına müraciət edin.
        </p>
        <Button
          className="mt-6 h-10 rounded-xl bg-[#0b66ff] px-4 font-bold text-white hover:bg-[#0758dc]"
          onClick={reset}
        >
          <RefreshCcwIcon className="size-4" />
          Yenidən yoxla
        </Button>
      </section>
    </main>
  );
}
