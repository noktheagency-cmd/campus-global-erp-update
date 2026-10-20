import { Skeleton } from "@/components/ui/skeleton";

export default function HrLoading() {
  return (
    <div className="min-h-full bg-[#f6f9ff] px-4 py-5 sm:px-5 lg:px-8 lg:py-7">
      <div className="flex items-start justify-between border-b border-[#dce5f0] pb-5">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
        </div>
        <Skeleton className="hidden h-10 w-80 rounded-xl sm:block" />
      </div>
      <div className="mt-4 flex gap-6 border-b border-[#dfe7f1] pb-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="h-5 w-20 rounded-lg" key={index} />
        ))}
      </div>
      <Skeleton className="mt-5 h-24 w-full rounded-[20px]" />
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.85fr]">
        <Skeleton className="h-[350px] rounded-[20px]" />
        <Skeleton className="h-[350px] rounded-[20px]" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton className="h-72 rounded-[20px]" key={index} />
        ))}
      </div>
    </div>
  );
}
