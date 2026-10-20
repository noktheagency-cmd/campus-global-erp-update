import { Skeleton } from "@/components/ui/skeleton";

export default function SupportLoading() {
  return (
    <div className="min-h-full bg-[#f6f9ff] px-4 py-5 sm:px-5 lg:px-7 lg:py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-80 max-w-full rounded-lg" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-[72px] rounded-2xl" key={index} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <Skeleton className="h-[620px] rounded-[1.25rem]" />
        <Skeleton className="h-[620px] rounded-[1.25rem]" />
      </div>
    </div>
  );
}

