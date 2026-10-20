"use client";

import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleDashedIcon,
  GraduationCapIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type {
  AgentPortalStatus,
  AgentRecord,
  AgentTier,
  AgentsDashboardData,
} from "@/features/agents/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const summaryItems = [
  {
    icon: UsersRoundIcon,
    key: "totalAgents",
    label: "Bütün agentlər",
    tone: "blue",
  },
  {
    icon: CheckCircle2Icon,
    key: "activeAgents",
    label: "Aktiv agentlər",
    tone: "green",
  },
  {
    icon: GraduationCapIcon,
    key: "registeredStudents",
    label: "Qeydiyyatlı tələbələr",
    tone: "amber",
  },
  {
    icon: ShieldCheckIcon,
    key: "portalReady",
    label: "Portal aktivdir",
    tone: "rose",
  },
] as const;

export function AgentsWorkspace({ data }: { data: AgentsDashboardData }) {
  return (
    <div className="min-h-full bg-[#f6f9ff] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1580px]">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#102442]">
              Agentlər
            </h1>
            <p className="mt-0.5 text-sm text-[#71809a]">
              {data.metrics.totalAgents} agent
            </p>
          </div>
          <Button
            asChild
            className="h-10 rounded-xl bg-[#0b66ff] px-4 font-bold shadow-[0_10px_24px_rgba(11,102,255,0.22)] hover:bg-[#075be8]"
          >
            <Link href="/agents/new">
              <PlusIcon data-icon="inline-start" />
              Yeni agent
            </Link>
          </Button>
        </header>

        <section className="mt-5 grid overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5",
                  index > 0 && "border-t border-[#e8eef5] sm:border-l",
                  index === 2 && "sm:border-l-0 xl:border-l",
                  index > 1 && "xl:border-t-0",
                )}
                key={item.key}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl",
                    item.tone === "blue" && "bg-blue-50 text-[#0b66ff]",
                    item.tone === "green" && "bg-emerald-50 text-emerald-600",
                    item.tone === "amber" && "bg-amber-50 text-amber-600",
                    item.tone === "rose" && "bg-rose-50 text-rose-500",
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-xs font-medium text-[#71809a]">{item.label}</p>
                  <p className="mt-0.5 text-xl font-black tabular-nums text-[#102442]">
                    {data.metrics[item.key]}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mt-4 overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white">
          <form
            action="/agents"
            className="grid gap-2 border-b border-[#e8eef5] p-3 md:grid-cols-2 2xl:grid-cols-[minmax(280px,1fr)_200px_200px_180px_auto]"
          >
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7b8ca7]" />
              <Input
                className="h-10 rounded-xl border-[#d7e2ef] bg-[#fbfdff] pl-9 text-sm focus-visible:border-[#0b66ff] focus-visible:ring-2 focus-visible:ring-[#0b66ff]/10"
                defaultValue={data.filters.query}
                name="q"
                placeholder="Agent axtar"
              />
            </div>
            <FilterSelect
              defaultValue={data.filters.country}
              name="country"
              options={[
                ["all", "Bütün ölkələr"],
                ...data.filterOptions.countries.map(
                  (country) => [country, country] as const,
                ),
              ]}
            />
            <FilterSelect
              defaultValue={data.filters.portalStatus}
              name="portalStatus"
              options={[
                ["all", "Portal statusu"],
                ["Ready", "Aktiv"],
                ["Pending", "Gözləmədə"],
                ["Suspended", "Dayandırılıb"],
              ]}
            />
            <FilterSelect
              defaultValue={data.filters.tier}
              name="tier"
              options={[
                ["all", "Səviyyə"],
                ["Starter", "Starter"],
                ["Growth", "Growth"],
                ["Premier", "Premier"],
              ]}
            />
            <Button className="h-10 rounded-xl px-4 font-bold" type="submit">
              Tətbiq et
            </Button>
          </form>

          {data.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] table-fixed border-collapse text-left 2xl:table-auto">
                <thead>
                  <tr className="border-b border-[#dfe8f2] bg-[#f8fbff]">
                    {[
                      { className: "w-[27%] 2xl:w-auto", label: "Agent" },
                      { className: "w-[27%] 2xl:w-auto", label: "Əlaqə" },
                      { className: "hidden 2xl:table-cell", label: "Ölkə" },
                      { className: "w-[12%] 2xl:w-auto", label: "Tələbələr" },
                      {
                        className: "w-[14%] 2xl:w-auto",
                        label: "Aktiv müraciətlər",
                      },
                      {
                        className: "w-[15%] 2xl:w-auto",
                        label: "Portal statusu",
                      },
                      { className: "hidden 2xl:table-cell", label: "Səviyyə" },
                      { className: "hidden 2xl:table-cell", label: "Son aktivlik" },
                      { className: "w-[5%] 2xl:w-auto", label: "" },
                    ].map((header) => (
                      <th
                        className={cn(
                          "px-4 py-3 text-[10px] font-black uppercase tracking-wide text-[#71809a]",
                          header.className,
                        )}
                        key={header.label || "actions"}
                      >
                        {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2f7]">
                  {data.rows.map((agent) => (
                    <AgentRow agent={agent} key={agent.id} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <CircleDashedIcon className="size-8 text-[#9babc0]" />
              <h2 className="mt-3 text-sm font-bold text-[#102442]">
                Agent tapılmadı
              </h2>
              <p className="mt-1 text-xs text-[#71809a]">
                Axtarış və filtr seçimlərini dəyişin.
              </p>
            </div>
          )}

          <footer className="flex flex-col gap-3 border-t border-[#e8eef5] px-4 py-3 text-xs text-[#637392] sm:flex-row sm:items-center sm:justify-between">
            <span>
              {data.pagination.resultStart}-{data.pagination.resultEnd} /{" "}
              {data.pagination.totalItems} nəticə
            </span>
            <div className="flex items-center gap-2">
              <Button
                asChild={data.filters.page > 1}
                className="size-8 rounded-lg"
                disabled={data.filters.page <= 1}
                size="icon"
                variant="outline"
              >
                {data.filters.page > 1 ? (
                  <Link
                    aria-label="Əvvəlki səhifə"
                    href={buildPageHref(data, data.filters.page - 1)}
                  >
                    <ChevronLeftIcon className="size-4" />
                  </Link>
                ) : (
                  <ChevronLeftIcon className="size-4" />
                )}
              </Button>
              <span className="min-w-20 text-center font-bold text-[#31486b]">
                {data.filters.page} / {data.pagination.totalPages}
              </span>
              <Button
                asChild={data.filters.page < data.pagination.totalPages}
                className="size-8 rounded-lg"
                disabled={data.filters.page >= data.pagination.totalPages}
                size="icon"
                variant="outline"
              >
                {data.filters.page < data.pagination.totalPages ? (
                  <Link
                    aria-label="Növbəti səhifə"
                    href={buildPageHref(data, data.filters.page + 1)}
                  >
                    <ChevronRightIcon className="size-4" />
                  </Link>
                ) : (
                  <ChevronRightIcon className="size-4" />
                )}
              </Button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}

function AgentRow({ agent }: { agent: AgentRecord }) {
  const initials = `${agent.firstName.charAt(0)}${agent.lastName.charAt(0)}`;

  return (
    <tr className="group transition hover:bg-[#f8fbff]">
      <td className="px-4 py-3">
        <Link
          className="flex min-w-0 items-center gap-3"
          href={`/agents/${agent.id}`}
        >
          <Avatar className="size-10 border border-[#dbe5f1]">
            {agent.profilePhotoUrl ? (
              <AvatarImage
                alt={`${agent.firstName} ${agent.lastName}`}
                src={agent.profilePhotoUrl}
              />
            ) : null}
            <AvatarFallback className="bg-[#eaf2ff] text-xs font-black text-[#0b66ff]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-[#102442] group-hover:text-[#0b66ff]">
              {agent.firstName} {agent.lastName}
            </span>
            <span className="mt-0.5 block max-w-48 truncate text-xs text-[#71809a]">
              {agent.companyName}
            </span>
          </span>
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className="block max-w-52 truncate text-xs font-semibold text-[#31486b]">
          {agent.email}
        </span>
        <span className="mt-0.5 block text-xs text-[#8190a8]">{agent.phone}</span>
      </td>
      <td className="hidden px-4 py-3 text-xs font-semibold text-[#435675] 2xl:table-cell">
        {agent.country}
      </td>
      <td className="px-4 py-3 text-sm font-black tabular-nums text-[#102442]">
        {agent.studentsCount}
      </td>
      <td className="px-4 py-3 text-sm font-black tabular-nums text-[#102442]">
        {agent.activeApplications}
      </td>
      <td className="px-4 py-3">
        <PortalBadge status={agent.portalStatus} />
      </td>
      <td className="hidden px-4 py-3 2xl:table-cell">
        <TierBadge tier={agent.tier} />
      </td>
      <td className="hidden px-4 py-3 text-xs font-semibold text-[#637392] 2xl:table-cell">
        {agent.lastActivity}
      </td>
      <td className="px-3 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Agent əməliyyatları"
              className="size-8 rounded-lg text-[#71809a]"
              size="icon"
              variant="ghost"
            >
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl">
            <DropdownMenuItem asChild className="rounded-lg font-semibold">
              <Link href={`/agents/${agent.id}`}>
                <UserRoundIcon data-icon="inline-start" />
                Profili aç
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function FilterSelect({
  defaultValue,
  name,
  options,
}: {
  defaultValue: string;
  name: string;
  options: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <select
      className="h-10 rounded-xl border border-[#d7e2ef] bg-white px-3 text-sm font-semibold text-[#31486b] outline-none transition hover:border-[#b9cbe1] focus:border-[#0b66ff] focus:ring-2 focus:ring-[#0b66ff]/10"
      defaultValue={defaultValue}
      name={name}
    >
      {options.map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

function PortalBadge({ status }: { status: AgentPortalStatus }) {
  const labels = {
    Pending: "Gözləmədə",
    Ready: "Aktiv",
    Suspended: "Dayandırılıb",
  };

  return (
    <Badge
      className={cn(
        "rounded-lg border px-2 py-0.5 text-[11px] font-bold",
        status === "Ready" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "Pending" && "border-amber-200 bg-amber-50 text-amber-700",
        status === "Suspended" && "border-red-200 bg-red-50 text-red-600",
      )}
      variant="outline"
    >
      {labels[status]}
    </Badge>
  );
}

function TierBadge({ tier }: { tier: AgentTier }) {
  return (
    <span className="text-xs font-bold text-[#435675]">
      {tier}
    </span>
  );
}

function buildPageHref(data: AgentsDashboardData, page: number) {
  const params = new URLSearchParams();

  if (data.filters.query) params.set("q", data.filters.query);
  if (data.filters.country !== "all") params.set("country", data.filters.country);
  if (data.filters.portalStatus !== "all") {
    params.set("portalStatus", data.filters.portalStatus);
  }
  if (data.filters.tier !== "all") params.set("tier", data.filters.tier);
  if (data.filters.sort !== "updated-desc") params.set("sort", data.filters.sort);
  params.set("page", String(page));
  params.set("pageSize", String(data.filters.pageSize));

  return `/agents?${params.toString()}`;
}
