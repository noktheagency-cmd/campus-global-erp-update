import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceLoading() {
  return (
    <div className="erp-soft-enter min-h-full bg-[#f6f9ff] px-5 py-6 lg:px-8 lg:py-8">
      <header className="flex flex-col gap-4 border-b border-[#dce6f4]/40 pb-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 rounded-xl bg-[#dde9f8]" />
          <Skeleton className="h-4 w-80 max-w-full rounded-full bg-[#e5edf7]" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-11 w-36 rounded-2xl bg-[#e5edf7]" />
          <Skeleton className="h-11 w-11 rounded-2xl bg-[#e5edf7]" />
          <Skeleton className="h-11 w-40 rounded-2xl bg-[#d7e7ff]" />
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["a", "b", "c", "d"].map((item) => (
          <div
            className="rounded-[1.4rem] border border-[#dce6f4]/70 bg-white/84 p-5 shadow-[0_18px_42px_rgba(29,78,216,0.04)]"
            key={item}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <Skeleton className="h-3 w-28 rounded-full bg-[#e3edf8]" />
                <Skeleton className="h-8 w-20 rounded-lg bg-[#d9e8fb]" />
              </div>
              <Skeleton className="size-11 rounded-2xl bg-[#e0ebf8]" />
            </div>
            <Skeleton className="mt-5 h-10 w-full rounded-xl bg-[#edf3fb]" />
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-[1.6rem] border border-[#dce6f4]/70 bg-white/82 p-4 shadow-[0_18px_42px_rgba(29,78,216,0.04)] lg:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-full bg-[#dfeaf7]" />
            <Skeleton className="h-3 w-72 max-w-full rounded-full bg-[#e8f0f9]" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-32 rounded-xl bg-[#e5eef9]" />
            <Skeleton className="h-9 w-24 rounded-xl bg-[#e5eef9]" />
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {["e", "f", "g", "h"].map((item) => (
            <Skeleton className="h-12 rounded-xl bg-[#edf3fb]" key={item} />
          ))}
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-[1.6rem] border border-[#dce6f4]/70 bg-white shadow-[0_18px_42px_rgba(29,78,216,0.04)]">
        <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr] gap-4 border-b border-[#e5edf7] bg-[#f8fbff] p-4">
          {["i", "j", "k", "l"].map((item) => (
            <Skeleton className="h-4 rounded-full bg-[#dfeaf7]" key={item} />
          ))}
        </div>
        <div className="divide-y divide-[#edf3fb]">
          {["m", "n", "o", "p", "q", "r"].map((item) => (
            <div
              className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr] gap-4 p-4"
              key={item}
            >
              <Skeleton className="h-5 rounded-full bg-[#e7eff9]" />
              <Skeleton className="h-5 rounded-full bg-[#eef4fb]" />
              <Skeleton className="h-5 rounded-full bg-[#eef4fb]" />
              <Skeleton className="h-5 rounded-full bg-[#eef4fb]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
