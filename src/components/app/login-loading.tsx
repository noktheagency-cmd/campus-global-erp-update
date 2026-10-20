import { Skeleton } from "@/components/ui/skeleton";

export function LoginLoading() {
  return (
    <main className="erp-soft-enter flex min-h-svh bg-[#f7fbff] px-4 py-6 text-[#07183a] sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-[1120px] flex-col">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl bg-[#d7e7ff]" />
            <Skeleton className="h-5 w-44 rounded-full bg-[#dfeaf7]" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg bg-white" />
        </header>

        <div className="flex flex-1 items-center justify-center py-10 sm:py-14 lg:py-20">
          <div className="w-full max-w-[444px] rounded-2xl border border-white/76 bg-white/86 p-5 shadow-[0_34px_120px_rgba(15,66,130,0.16)] backdrop-blur-xl sm:p-7">
            <div className="mb-7 space-y-4 text-center">
              <Skeleton className="mx-auto size-14 rounded-2xl bg-[#d7e7ff]" />
              <Skeleton className="mx-auto h-9 w-64 rounded-xl bg-[#dfeaf7]" />
              <Skeleton className="mx-auto h-4 w-72 max-w-full rounded-full bg-[#e8f0f9]" />
            </div>
            <div className="space-y-5">
              <Skeleton className="h-16 rounded-lg bg-[#eef4fb]" />
              <Skeleton className="h-16 rounded-lg bg-[#eef4fb]" />
            </div>
            <div className="mt-5 flex justify-between gap-3">
              <Skeleton className="h-5 w-32 rounded-full bg-[#e8f0f9]" />
              <Skeleton className="h-5 w-28 rounded-full bg-[#e8f0f9]" />
            </div>
            <Skeleton className="mt-6 h-[52px] rounded-lg bg-[#cfe2ff]" />
            <Skeleton className="mt-7 h-14 rounded-lg bg-[#eef6ff]" />
          </div>
        </div>
      </section>
    </main>
  );
}
