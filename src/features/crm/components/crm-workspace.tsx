"use client";

import { useDeferredValue, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  CalendarClockIcon,
  ChevronDownIcon,
  CircleCheckBigIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  TrendingUpIcon,
  UserRoundPlusIcon,
  UsersRoundIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CRM_SOURCE_LABELS,
  CRM_STAGE_LABELS,
  CRM_STATUS_LABELS,
} from "@/features/crm/constants";
import { CrmDetailPanel } from "@/features/crm/components/crm-detail-panel";
import { CrmRecordsList } from "@/features/crm/components/crm-records-list";
import type {
  CrmDashboardData,
  CrmRecord,
  CrmSourceCode,
  CrmStageCode,
  CrmStatusCode,
  CrmView,
} from "@/features/crm/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const views: Array<{ label: string; value: CrmView }> = [
  { label: "İcmal", value: "overview" },
  { label: "Fərdi müştərilər", value: "individuals" },
  { label: "Agentlər", value: "agents" },
  { label: "Tapşırıqlar", value: "tasks" },
];

const CrmTasksView = dynamic(
  () =>
    import("@/features/crm/components/crm-tasks-view").then(
      (module) => module.CrmTasksView,
    ),
  {
    loading: () => (
      <div className="mt-4 min-h-72 animate-pulse rounded-[1.25rem] border border-[#dce6f4] bg-white" />
    ),
  },
);

export function CrmWorkspace({ data }: { data: CrmDashboardData }) {
  const [view, setView] = useState<CrmView>("overview");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [source, setSource] = useState<CrmSourceCode | "all">("all");
  const [stage, setStage] = useState<CrmStageCode | "all">("all");
  const [status, setStatus] = useState<CrmStatusCode | "all">("all");
  const [ownerId, setOwnerId] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    data.records[0]?.id ?? null,
  );

  const scopedRecords = useMemo(
    () =>
      data.records.filter((record) => {
        if (view === "individuals" && record.kind !== "individual") return false;
        if (view === "agents" && record.kind !== "agent") return false;
        return true;
      }),
    [data.records, view],
  );

  const filteredRecords = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("az");

    return scopedRecords.filter((record) => {
      const searchable = [
        record.name,
        record.companyName,
        record.email,
        record.phone,
        record.country,
        record.agentName,
      ]
        .join(" ")
        .toLocaleLowerCase("az");

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (source === "all" || record.source === source) &&
        (stage === "all" || record.stage === stage) &&
        (status === "all" || record.status === status) &&
        (ownerId === "all" || record.owner?.id === ownerId)
      );
    });
  }, [deferredQuery, ownerId, scopedRecords, source, stage, status]);

  const selectedRecord =
    selectedId === null
      ? null
      : filteredRecords.find((record) => record.id === selectedId) ??
        filteredRecords[0] ??
        null;
  const metrics = getMetrics(scopedRecords, view);

  function changeView(nextView: CrmView) {
    setView(nextView);
    setQuery("");
    setSource("all");
    setStage("all");
    setStatus("all");
    setOwnerId("all");
    const firstRecord = data.records.find((record) => {
      if (nextView === "individuals") return record.kind === "individual";
      if (nextView === "agents") return record.kind === "agent";
      return true;
    });
    setSelectedId(firstRecord?.id ?? null);
  }

  function clearFilters() {
    setQuery("");
    setSource("all");
    setStage("all");
    setStatus("all");
    setOwnerId("all");
  }

  const hasFilters = Boolean(
    query ||
      source !== "all" ||
      stage !== "all" ||
      status !== "all" ||
      ownerId !== "all",
  );

  return (
    <div className="min-h-full bg-[#f6f9ff] text-[#07183a]">
      <div className="px-4 py-5 sm:px-5 lg:px-7 lg:py-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">CRM</h1>
            <p className="mt-1 text-sm font-medium text-[#637392]">
              Müştəri münasibətlərini bir yerdən idarə edin.
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-10 rounded-xl bg-[#0b66ff] px-4 text-xs font-black shadow-[0_10px_24px_rgba(11,102,255,0.2)] hover:bg-[#075be8]">
                <PlusIcon data-icon="inline-start" />
                Yeni qeyd
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border-[#dce6f4] p-1.5"
            >
              <DropdownMenuItem asChild className="rounded-lg text-xs font-bold">
                <Link href="/students/new">
                  <UserRoundPlusIcon className="size-4" />
                  Fərdi müştəri əlavə et
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg text-xs font-bold">
                <Link href="/agents/new">
                  <UsersRoundIcon className="size-4" />
                  Agent əlavə et
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <nav
          aria-label="CRM bölmələri"
          className="mt-4 flex gap-1 overflow-x-auto border-b border-[#dce6f4]"
        >
          {views.map((item) => (
            <button
              className={cn(
                "relative h-11 shrink-0 px-4 text-xs font-bold text-[#637392] transition hover:text-[#0b66ff]",
                view === item.value && "text-[#0b66ff]",
              )}
              key={item.value}
              onClick={() => changeView(item.value)}
              type="button"
            >
              {item.label}
              {view === item.value ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#0b66ff]" />
              ) : null}
            </button>
          ))}
        </nav>

        <section className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Metric
              icon={metric.icon}
              key={metric.label}
              label={metric.label}
              tone={metric.tone}
              value={metric.value}
            />
          ))}
        </section>

        {view === "tasks" ? (
          <CrmTasksView
            canManage={data.canManage}
            records={scopedRecords}
            teamMembers={data.teamMembers}
          />
        ) : (
          <div className="mt-4 grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_390px]">
            <section className="min-w-0 overflow-hidden rounded-[1.25rem] border border-[#dce6f4] bg-white shadow-[0_12px_36px_rgba(29,78,216,0.045)]">
              <div className="border-b border-[#e5edf8] p-3">
                <div className="grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-[minmax(220px,1.1fr)_minmax(150px,.7fr)_minmax(160px,.75fr)_minmax(150px,.7fr)]">
                  <label className="relative block">
                    <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b9ab5]" />
                    <Input
                      aria-label="CRM-də axtarış"
                      className="h-10 rounded-xl border-[#dce6f4] bg-[#fbfdff] pl-9 text-xs font-semibold placeholder:text-[#8b9ab5]"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={
                        view === "agents"
                          ? "Agent, şirkət, e-poçt axtar"
                          : "Ad, telefon, e-poçt axtar"
                      }
                      value={query}
                    />
                  </label>
                  <CrmFilterSelect
                    label="Bütün mənbələr"
                    onValueChange={(value) => setSource(value as CrmSourceCode | "all")}
                    options={Object.entries(CRM_SOURCE_LABELS)}
                    value={source}
                  />
                  <CrmFilterSelect
                    label="Bütün mərhələlər"
                    onValueChange={(value) => setStage(value as CrmStageCode | "all")}
                    options={Object.entries(CRM_STAGE_LABELS)}
                    value={stage}
                  />
                  <CrmFilterSelect
                    label="Bütün statuslar"
                    onValueChange={(value) => setStatus(value as CrmStatusCode | "all")}
                    options={Object.entries(CRM_STATUS_LABELS)}
                    value={status}
                  />
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <Select onValueChange={setOwnerId} value={ownerId}>
                    <SelectTrigger aria-label="Məsul şəxs" className="h-9 w-full rounded-xl border-[#dce6f4] bg-[#fbfdff] px-3 text-[11px] font-bold text-[#34456c] sm:w-56">
                      <SelectValue placeholder="Məsul şəxs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Bütün məsul şəxslər</SelectItem>
                      {data.teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    className="h-9 rounded-xl border-[#dce6f4] bg-white px-3 text-[11px] font-black text-[#34456c] hover:bg-[#f6f9ff]"
                    disabled={!hasFilters}
                    onClick={clearFilters}
                    type="button"
                    variant="outline"
                  >
                    <SlidersHorizontalIcon data-icon="inline-start" />
                    Filterləri sıfırla
                  </Button>
                  <span className="ml-auto text-[11px] font-bold text-[#71809f]">
                    {filteredRecords.length} nəticə
                  </span>
                </div>
              </div>

              <CrmRecordsList
                onSelect={setSelectedId}
                records={filteredRecords}
                selectedId={selectedRecord?.id ?? null}
                view={view}
              />
            </section>

            <CrmDetailPanel
              canManage={data.canManage}
              key={selectedRecord?.id ?? "empty-crm-selection"}
              onClose={() => setSelectedId(null)}
              record={selectedRecord}
              teamMembers={data.teamMembers}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CrmFilterSelect({
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
      <SelectTrigger aria-label={label} className="h-10 rounded-xl border-[#dce6f4] bg-[#fbfdff] px-3 text-xs font-bold text-[#34456c]">
        <SelectValue placeholder={label} />
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

function Metric({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: LucideIcon;
  label: string;
  tone: "amber" | "blue" | "green" | "violet";
  value: string;
}) {
  const toneClasses = {
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    blue: "border-blue-100 bg-blue-50 text-[#0b66ff]",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
  }[tone];

  return (
    <div className="flex min-h-[68px] items-center gap-3 rounded-[1rem] border border-[#dce6f4] bg-white px-3.5 py-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl border",
          toneClasses,
        )}
      >
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-bold text-[#637392]">{label}</div>
        <div className="mt-0.5 text-xl font-black tabular-nums text-[#07183a]">
          {value}
        </div>
      </div>
    </div>
  );
}

function getMetrics(records: CrmRecord[], view: CrmView) {
  const activeRecords = records.filter((record) => record.status === "ACTIVE");
  const openTasks = records.flatMap((record) => record.tasks).filter(
    (task) => task.status === "TODO" || task.status === "IN_PROGRESS",
  );
  const today = new Date().toISOString().slice(0, 10);
  const dueToday = openTasks.filter((task) => task.dueAt.slice(0, 10) === today).length;
  const averageConversion = records.length
    ? Math.round(
        records.reduce((total, record) => total + record.conversionRate, 0) /
          records.length,
      )
    : 0;

  if (view === "agents") {
    return [
      { icon: UsersRoundIcon, label: "Bütün agentlər", tone: "blue" as const, value: String(records.length) },
      { icon: CircleCheckBigIcon, label: "Aktiv agentlər", tone: "green" as const, value: String(activeRecords.length) },
      { icon: UserRoundPlusIcon, label: "Aktiv tələbələr", tone: "amber" as const, value: String(records.reduce((total, record) => total + record.studentsCount, 0)) },
      { icon: TrendingUpIcon, label: "Konversiya", tone: "violet" as const, value: `${averageConversion}%` },
    ];
  }

  if (view === "individuals") {
    return [
      { icon: UsersRoundIcon, label: "Fərdi müştərilər", tone: "blue" as const, value: String(records.length) },
      { icon: CircleCheckBigIcon, label: "Aktiv imkanlar", tone: "green" as const, value: String(activeRecords.length) },
      { icon: CalendarClockIcon, label: "Bu gün izlənəcək", tone: "amber" as const, value: String(dueToday) },
      { icon: TrendingUpIcon, label: "Konversiya", tone: "violet" as const, value: `${averageConversion}%` },
    ];
  }

  return [
    { icon: UsersRoundIcon, label: "Bütün kontaktlar", tone: "blue" as const, value: String(records.length) },
    { icon: CircleCheckBigIcon, label: "Aktiv imkanlar", tone: "green" as const, value: String(activeRecords.length) },
    { icon: CalendarClockIcon, label: "Bu gün izlənəcək", tone: "amber" as const, value: String(dueToday) },
    { icon: TrendingUpIcon, label: "Konversiya", tone: "violet" as const, value: `${averageConversion}%` },
  ];
}
