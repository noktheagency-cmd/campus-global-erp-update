export default function FinanceLoading() {
  return (
    <div className="min-h-full animate-pulse bg-[#f6f9ff] px-5 py-6 lg:px-8 lg:py-8">
      <div className="h-11 w-56 rounded-2xl bg-[#e5edf8]" />
      <div className="mt-4 h-5 w-96 max-w-full rounded-xl bg-[#edf2f8]" />
      <div className="mt-8 h-16 rounded-2xl bg-white" />
      <div className="mt-4 h-28 rounded-[1.5rem] bg-white" />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_0.9fr]">
        <div className="h-80 rounded-[1.5rem] bg-white" />
        <div className="h-80 rounded-[1.5rem] bg-white" />
      </div>
    </div>
  );
}

