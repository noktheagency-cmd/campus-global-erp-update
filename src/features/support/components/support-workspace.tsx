"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock3Icon,
  HeadphonesIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  UserRoundCheckIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewSupportTicketDialog } from "@/features/support/components/new-support-ticket-dialog";
import { SupportTicketDetail } from "@/features/support/components/support-ticket-detail";
import { SupportTicketList } from "@/features/support/components/support-ticket-list";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_STATUS_LABELS,
} from "@/features/support/constants";
import type { SupportWorkspaceData } from "@/features/support/types";
import { cn } from "@/lib/utils";

export function SupportWorkspace({
  data,
  error,
  success,
}: {
  data: SupportWorkspaceData;
  error: string;
  success: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(data.filters.query);
  const [lastServerQuery, setLastServerQuery] = useState(data.filters.query);
  const [isPending, startTransition] = useTransition();

  if (lastServerQuery !== data.filters.query) {
    setLastServerQuery(data.filters.query);
    setQuery(data.filters.query);
  }

  const feedback = getFeedback(success, error);
  const hasFilters = Boolean(
    query ||
    data.filters.category !== "all" ||
    data.filters.priority !== "all" ||
    data.filters.status !== "all",
  );

  const navigate = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      next.delete("success");
      next.delete("error");

      const search = next.toString();
      startTransition(() => {
        router.replace(search ? `${pathname}?${search}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  const updateFilter = useCallback(
    (key: "category" | "priority" | "q" | "status", value: string) => {
      navigate({
        [key]: value === "all" || !value.trim() ? null : value.trim(),
        cursor: null,
        direction: null,
        ticket: null,
      });
    },
    [navigate],
  );

  useEffect(() => {
    if (query.trim() === data.filters.query) return;

    const timeout = window.setTimeout(() => {
      updateFilter("q", query);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [data.filters.query, query, updateFilter]);

  const returnTo = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;

  function clearFilters() {
    setQuery("");
    navigate({
      category: null,
      cursor: null,
      direction: null,
      priority: null,
      q: null,
      status: null,
      ticket: null,
    });
  }

  return (
    <div className="min-h-full bg-[#f6f9ff] text-[#07183a]">
      <div className="px-4 py-5 sm:px-5 lg:px-7 lg:py-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Dəstək mərkəzi
            </h1>
            <p className="mt-1 text-sm font-medium text-[#637392]">
              Sorğuları izləyin, cavablandırın və həll edin.
            </p>
          </div>
          {data.canCreate ? (
            <NewSupportTicketDialog returnTo={returnTo} />
          ) : null}
        </header>

        {feedback ? (
          <div
            className={cn(
              "mt-4 flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold",
              feedback.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            {feedback.tone === "success" ? (
              <CheckCircle2Icon className="size-4" />
            ) : (
              <HeadphonesIcon className="size-4" />
            )}
            {feedback.message}
          </div>
        ) : null}

        <section className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <SupportMetric
            icon={HeadphonesIcon}
            label="Açıq"
            tone="blue"
            value={data.metrics.open}
          />
          <SupportMetric
            icon={UserRoundCheckIcon}
            label={data.canManage ? "Mənə təyin edilən" : "Mənim ticket-lərim"}
            tone="green"
            value={
              data.canManage ? data.metrics.assignedToMe : data.metrics.mine
            }
          />
          <SupportMetric
            icon={Clock3Icon}
            label="Gözləyən"
            tone="amber"
            value={data.metrics.waiting}
          />
          <SupportMetric
            icon={CheckCircle2Icon}
            label="Bu gün həll edilən"
            tone="violet"
            value={data.metrics.resolvedToday}
          />
        </section>

        <div className="mt-4 grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_390px]">
          <section
            aria-busy={isPending}
            className="min-w-0 overflow-hidden rounded-[1.25rem] border border-[#dce6f4] bg-white shadow-[0_12px_36px_rgba(29,78,216,0.045)]"
          >
            <div className="border-b border-[#e5edf8] p-3">
              <div className="grid gap-2.5 md:grid-cols-2 2xl:grid-cols-[minmax(260px,1.35fr)_minmax(150px,.7fr)_minmax(150px,.7fr)_minmax(170px,.8fr)]">
                <label className="relative block">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b9ab5]" />
                  <Input
                    aria-label="Ticket axtarışı"
                    className="h-10 rounded-xl border-[#dce6f4] bg-[#fbfdff] pl-9 text-xs font-semibold placeholder:text-[#8b9ab5]"
                    maxLength={100}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Kod, mövzu və ya müraciətçi axtar"
                    value={query}
                  />
                </label>
                <SupportFilterSelect
                  label="Bütün statuslar"
                  onValueChange={(value) => updateFilter("status", value)}
                  options={Object.entries(SUPPORT_STATUS_LABELS)}
                  value={data.filters.status}
                />
                <SupportFilterSelect
                  label="Bütün prioritetlər"
                  onValueChange={(value) => updateFilter("priority", value)}
                  options={Object.entries(SUPPORT_PRIORITY_LABELS)}
                  value={data.filters.priority}
                />
                <SupportFilterSelect
                  label="Bütün kateqoriyalar"
                  onValueChange={(value) => updateFilter("category", value)}
                  options={Object.entries(SUPPORT_CATEGORY_LABELS)}
                  value={data.filters.category}
                />
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <Button
                  className="h-9 rounded-xl border-[#dce6f4] bg-white px-3 text-[11px] font-black text-[#34456c] hover:bg-[#f6f9ff]"
                  disabled={!hasFilters}
                  onClick={clearFilters}
                  type="button"
                  variant="outline"
                >
                  <SlidersHorizontalIcon data-icon="inline-start" />
                  Filtrləri sıfırla
                </Button>
                <span className="ml-auto text-[11px] font-bold text-[#71809f]">
                  {data.pagination.resultCount} nəticə
                </span>
              </div>
            </div>

            <div
              className={cn("transition-opacity", isPending && "opacity-55")}
            >
              <SupportTicketList
                onSelect={(id) => navigate({ ticket: id })}
                selectedId={data.selectedTicket?.id ?? null}
                tickets={data.tickets}
              />
            </div>

            {data.pagination.previousCursor || data.pagination.nextCursor ? (
              <div className="flex items-center justify-between border-t border-[#e5edf8] px-3 py-2.5">
                <span className="text-[10px] font-bold text-[#8290a9]">
                  Səhifədə maksimum 30 ticket
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    className="h-8 rounded-lg px-2.5 text-[10px] font-black"
                    disabled={!data.pagination.previousCursor || isPending}
                    onClick={() =>
                      navigate({
                        cursor: data.pagination.previousCursor,
                        direction: "previous",
                        ticket: null,
                      })
                    }
                    type="button"
                    variant="outline"
                  >
                    <ChevronLeftIcon data-icon="inline-start" />
                    Əvvəlki
                  </Button>
                  <Button
                    className="h-8 rounded-lg px-2.5 text-[10px] font-black"
                    disabled={!data.pagination.nextCursor || isPending}
                    onClick={() =>
                      navigate({
                        cursor: data.pagination.nextCursor,
                        direction: "next",
                        ticket: null,
                      })
                    }
                    type="button"
                    variant="outline"
                  >
                    Növbəti
                    <ChevronRightIcon data-icon="inline-end" />
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          <SupportTicketDetail
            canManage={data.canManage}
            currentUserId={data.currentUserId}
            key={data.selectedTicket?.id ?? "empty-ticket"}
            returnTo={returnTo}
            teamMembers={data.teamMembers}
            ticket={data.selectedTicket}
          />
        </div>
      </div>
    </div>
  );
}

function SupportFilterSelect({
  label,
  onValueChange,
  options,
  value,
}: {
  label: string;
  onValueChange: (value: string) => void;
  options: Array<[string, string]>;
  value: string;
}) {
  return (
    <Select onValueChange={onValueChange} value={value}>
      <SelectTrigger
        aria-label={label}
        className="h-10 w-full rounded-xl border-[#dce6f4] bg-[#fbfdff] px-3 text-xs font-bold text-[#34456c]"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}</SelectItem>
        {options.map(([optionValue, optionLabel]) => (
          <SelectItem key={optionValue} value={optionValue}>
            {optionLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SupportMetric({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: "amber" | "blue" | "green" | "violet";
  value: number;
}) {
  const toneClasses = {
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    blue: "border-blue-100 bg-blue-50 text-[#0b66ff]",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
  }[tone];

  return (
    <div className="flex min-h-[72px] items-center gap-3 rounded-[1rem] border border-[#dce6f4] bg-white px-3.5 py-3">
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-full border",
          toneClasses,
        )}
      >
        <Icon className="size-4.5" />
      </span>
      <div>
        <p className="text-[11px] font-semibold text-[#71809d]">{label}</p>
        <p className="mt-0.5 text-xl font-black text-[#0a1d42]">{value}</p>
      </div>
    </div>
  );
}

function getFeedback(success: string, error: string) {
  const successMessages: Record<string, string> = {
    "assignment-updated": "Ticket təyinatı yeniləndi.",
    "priority-updated": "Ticket prioriteti yeniləndi.",
    "reply-sent": "Cavab uğurla göndərildi.",
    "status-updated": "Ticket statusu yeniləndi.",
    "ticket-created": "Yeni ticket uğurla yaradıldı.",
  };
  const errorMessages: Record<string, string> = {
    "invalid-assignee": "Seçilən məsul şəxs etibarlı deyil.",
    "invalid-priority": "Prioritet dəyəri etibarlı deyil.",
    "invalid-status": "Status dəyəri etibarlı deyil.",
    "ticket-not-found": "Ticket tapılmadı.",
  };

  if (success && successMessages[success]) {
    return { message: successMessages[success], tone: "success" as const };
  }
  if (error) {
    return {
      message: errorMessages[error] ?? "Əməliyyat tamamlanmadı.",
      tone: "error" as const,
    };
  }
  return null;
}
