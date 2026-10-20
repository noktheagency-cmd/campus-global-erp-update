import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRightIcon,
  BellIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleDollarSignIcon,
  FileCheck2Icon,
  FilePlus2Icon,
  FilesIcon,
  GraduationCapIcon,
  SchoolIcon,
  UserPlus2Icon,
  UsersRoundIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ApplicationsOverviewChart,
  DestinationChart,
  RevenueChart,
  SparklineChart,
} from "@/features/dashboard/components/dashboard-charts";
import type {
  AdminDashboardData,
  DashboardApplication,
  DashboardMetric,
  DashboardRange,
  DashboardTask,
} from "@/features/dashboard/types";
import type { AppLocale } from "@/i18n/routing";
import { defaultLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const rangeLabels: Record<DashboardRange, string> = {
  "7d": "Son 7 gün",
  "30d": "Son 30 gün",
  "90d": "Son 90 gün",
};

const metricStyles = {
  blue: {
    color: "#0b66ff",
    icon: "from-[#65a7ff] to-[#0b66ff] shadow-[0_11px_24px_rgba(11,102,255,0.24)]",
  },
  cyan: {
    color: "#05a9c8",
    icon: "from-[#4bd4de] to-[#05a9c8] shadow-[0_11px_24px_rgba(5,169,200,0.22)]",
  },
  green: {
    color: "#18b957",
    icon: "from-[#49db69] to-[#14ad4a] shadow-[0_11px_24px_rgba(20,173,74,0.22)]",
  },
  orange: {
    color: "#ff7a0a",
    icon: "from-[#ffa333] to-[#ff7208] shadow-[0_11px_24px_rgba(255,114,8,0.23)]",
  },
  purple: {
    color: "#7c3aed",
    icon: "from-[#a65bff] to-[#7135e8] shadow-[0_11px_24px_rgba(124,58,237,0.23)]",
  },
} as const;

export function AdminDashboardWorkspace({
  data,
  locale,
  userName,
}: {
  data: AdminDashboardData;
  locale: AppLocale;
  userName: string;
}) {
  const notificationCount = Math.min(9, data.tasks.length);

  return (
    <div className="min-h-full bg-[#f8fbff] px-4 py-5 sm:px-5 lg:px-6 lg:py-6 xl:px-7 xl:py-7">
      <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[1.65rem] font-extrabold tracking-[-0.045em] text-[#061631] sm:text-[1.85rem]">
            Sabahınız xeyir, {userName}! <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-[#71809f]">
            Campus Global-da bu gün baş verənlər.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <RangeSelect
            icon
            label={data.dateRangeLabel}
            locale={locale}
            value={data.range}
            wide
          />

          <Button
            asChild
            className="relative size-11 rounded-2xl border border-[#dce6f2] bg-white text-[#24375d] shadow-[0_8px_24px_rgba(28,52,84,0.045)] hover:bg-[#f3f7fd] hover:text-[#0b66ff]"
            size="icon"
            variant="ghost"
          >
            <Link
              aria-label={`${notificationCount} prioritet bildiriş`}
              href="#dashboard-tasks"
            >
              <BellIcon className="size-[18px]" />
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-[#ef334f] text-[10px] font-extrabold text-white">
                  {notificationCount}
                </span>
              ) : null}
            </Link>
          </Button>

          <QuickAddMenu locale={locale} />
        </div>
      </header>

      <section
        aria-label="Əsas göstəricilər"
        className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        <MetricCard
          format="number"
          gradientId="dashboard-students"
          icon={UsersRoundIcon}
          label="Ümumi tələbə"
          metric={data.metrics.students}
          tone="blue"
        />
        <MetricCard
          format="number"
          gradientId="dashboard-applications"
          icon={FilesIcon}
          label="Müraciətlər"
          metric={data.metrics.applications}
          tone="green"
        />
        <MetricCard
          format="number"
          gradientId="dashboard-offers"
          icon={GraduationCapIcon}
          label="Təklif məktubları"
          metric={data.metrics.offers}
          tone="purple"
        />
        <MetricCard
          format="percent"
          gradientId="dashboard-visas"
          icon={FileCheck2Icon}
          label="Viza uğuru"
          metric={data.metrics.visaSuccess}
          tone="orange"
        />
        <MetricCard
          currency={data.metrics.revenue.currency}
          format="money"
          gradientId="dashboard-revenue"
          icon={CircleDollarSignIcon}
          label="Ümumi dövriyyə"
          metric={data.metrics.revenue}
          tone="cyan"
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.62fr_1fr]">
        <DashboardPanel className="min-h-[300px]" title="Müraciətlərə ümumi baxış">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <ChartLegend />
            <RangeSelect locale={locale} value={data.range} />
          </div>
          <div className="h-[222px] sm:h-[235px]">
            <ApplicationsOverviewChart data={data.trend} />
          </div>
        </DashboardPanel>

        <DashboardPanel className="min-h-[300px]" title="Ən çox seçilən ölkələr">
          <div className="mb-2 flex justify-end">
            <RangeSelect locale={locale} value={data.range} />
          </div>
          <div className="grid min-h-[226px] items-center gap-1 sm:grid-cols-[0.92fr_1.08fr]">
            <DestinationChart data={data.destinations} />
            <div className="space-y-2.5">
              {data.destinations.map((item) => (
                <div
                  className="grid grid-cols-[minmax(0,1fr)_44px_54px] items-center gap-2 text-[11px]"
                  key={item.country}
                >
                  <span className="flex min-w-0 items-center gap-2 font-semibold text-[#24375d]">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">{item.country}</span>
                  </span>
                  <span className="text-right font-semibold text-[#526582]">
                    {item.share}%
                  </span>
                  <span className="text-right font-bold text-[#13284e]">
                    {formatInteger(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DashboardPanel>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.08fr_1fr_1.15fr]">
        <DashboardPanel
          action={
            <PanelLink href={localizedHref("/applications", locale)}>
              Hamısına bax
            </PanelLink>
          }
          className="min-h-[282px]"
          title="Son müraciətlər"
        >
          <div className="mt-1 space-y-1">
            {data.recentApplications.map((application) => (
              <ApplicationRow
                application={application}
                href={localizedHref(`/applications/${application.id}`, locale)}
                key={application.id}
              />
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          action={
            <PanelLink href={localizedHref("/applications", locale)}>
              Hamısına bax
            </PanelLink>
          }
          className="min-h-[282px]"
          id="dashboard-tasks"
          title="Tapşırıqlar və izləmələr"
        >
          <div className="mt-1 space-y-1.5">
            {data.tasks.map((task) => (
              <TaskRow
                href={localizedHref(task.href, locale)}
                key={task.id}
                task={task}
              />
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          action={<RangeSelect locale={locale} value={data.range} />}
          className="min-h-[282px]"
          title="Dövriyyə dinamikası"
        >
          <div className="mt-1 flex items-end justify-between gap-3">
            <div>
              <div className="text-[1.55rem] font-extrabold tracking-[-0.04em] text-[#081a3a]">
                {formatMoney(
                  data.metrics.revenue.value,
                  data.metrics.revenue.currency,
                )}
              </div>
              <div className="text-[11px] font-medium text-[#71809f]">
                Ümumi dövriyyə
              </div>
            </div>
            <DeltaLabel delta={data.metrics.revenue.delta} />
          </div>
          <div className="mt-2 h-[175px]">
            <RevenueChart
              currency={data.metrics.revenue.currency}
              data={data.trend}
            />
          </div>
        </DashboardPanel>
      </section>
    </div>
  );
}

function MetricCard({
  currency,
  format,
  gradientId,
  icon: Icon,
  label,
  metric,
  tone,
}: {
  currency?: string;
  format: "money" | "number" | "percent";
  gradientId: string;
  icon: LucideIcon;
  label: string;
  metric: DashboardMetric;
  tone: keyof typeof metricStyles;
}) {
  const style = metricStyles[tone];

  return (
    <article className="group flex h-[178px] min-w-0 flex-col rounded-[1.45rem] border border-[#e0e8f3] bg-white p-4 shadow-[0_13px_32px_rgba(34,59,94,0.055)] transition duration-300 hover:-translate-y-0.5 hover:border-[#cddbeb] hover:shadow-[0_18px_38px_rgba(34,59,94,0.09)]">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white",
            style.icon,
          )}
        >
          <Icon className="size-5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0 pt-0.5">
          <div className="truncate text-[11px] font-semibold text-[#617195]">
            {label}
          </div>
          <div className="mt-0.5 truncate text-[1.42rem] font-extrabold tracking-[-0.035em] text-[#07162f]">
            {formatMetric(metric.value, format, currency)}
          </div>
          <DeltaLabel delta={metric.delta} compact />
        </div>
      </div>
      <div className="mt-auto h-[43px] w-full">
        <SparklineChart
          color={style.color}
          gradientId={gradientId}
          values={metric.sparkline}
        />
      </div>
    </article>
  );
}

function DashboardPanel({
  action,
  children,
  className,
  id,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
  title: string;
}) {
  return (
    <article
      className={cn(
        "rounded-[1.55rem] border border-[#e0e8f3] bg-white p-4 shadow-[0_13px_32px_rgba(34,59,94,0.05)] sm:p-5",
        className,
      )}
      id={id}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-extrabold tracking-[-0.015em] text-[#07162f]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </article>
  );
}

function ChartLegend() {
  const items = [
    ["#0b66ff", "Müraciətlər"],
    ["#23bf62", "Təklif məktubları"],
    ["#7c3aed", "Viza müraciətləri"],
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map(([color, label]) => (
        <span
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5b6d8b]"
          key={label}
        >
          <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}

function RangeSelect({
  icon = false,
  label,
  locale,
  value,
  wide = false,
}: {
  icon?: boolean;
  label?: string;
  locale: AppLocale;
  value: DashboardRange;
  wide?: boolean;
}) {
  return (
    <details className="group relative z-20">
      <summary
        aria-label="Dashboard tarix aralığı"
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl border border-[#dce6f2] bg-white px-3 text-[11px] font-bold text-[#324766] shadow-[0_6px_16px_rgba(34,59,94,0.04)] outline-none transition hover:bg-[#f7faff] focus-visible:ring-2 focus-visible:ring-[#0b66ff]/30 [&::-webkit-details-marker]:hidden",
          wide ? "h-11 min-w-[210px] rounded-2xl text-sm" : "h-8 min-w-[96px]",
        )}
      >
        {icon ? <CalendarDaysIcon className="size-4 text-[#2a4778]" /> : null}
        <span className="min-w-0 flex-1 truncate">{label ?? rangeLabels[value]}</span>
        <ChevronDownIcon className="size-3.5 transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-[calc(100%+0.4rem)] z-50 w-40 rounded-2xl border border-[#dce6f2] bg-white p-1.5 shadow-[0_18px_50px_rgba(23,43,77,0.16)]">
        {Object.entries(rangeLabels).map(([range, rangeLabel]) => (
          <Link
            aria-current={range === value ? "page" : undefined}
            className={cn(
              "block rounded-xl px-3 py-2 text-xs font-semibold text-[#324766] transition hover:bg-[#edf4ff] hover:text-[#0b66ff]",
              range === value && "bg-[#edf4ff] text-[#0b66ff]",
            )}
            href={localizedHref(`/dashboard?range=${range}`, locale)}
            key={range}
            scroll={false}
          >
            {rangeLabel}
          </Link>
        ))}
      </div>
    </details>
  );
}

function ApplicationRow({
  application,
  href,
}: {
  application: DashboardApplication;
  href: string;
}) {
  const initials = application.studentName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <Link
      className="group grid min-h-[48px] grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-2 rounded-xl px-1.5 py-1.5 transition hover:bg-[#f4f8fe]"
      href={href}
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[#c7dbff] to-[#edf4ff] text-[11px] font-extrabold text-[#1755b6] ring-2 ring-white">
        {initials}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-extrabold text-[#13284e]">
          {application.studentName}
        </span>
        <span className="mt-0.5 block truncate text-[10px] font-medium text-[#71809f]">
          {application.universityName}
        </span>
      </span>
      <span className="flex min-w-[88px] flex-col items-end gap-1">
        <StatusLabel status={application.statusCode}>
          {application.status}
        </StatusLabel>
        <span className="text-[9px] font-medium text-[#71809f]">
          {application.updatedAt}
        </span>
      </span>
    </Link>
  );
}

function TaskRow({ href, task }: { href: string; task: DashboardTask }) {
  return (
    <Link
      className="group grid min-h-[50px] grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-2 rounded-xl px-1 py-1.5 transition hover:bg-[#f4f8fe]"
      href={href}
    >
      <span className="mt-0.5 flex size-6 items-center justify-center rounded-full border-2 border-[#0b66ff] text-[#0b66ff] transition group-hover:bg-[#0b66ff] group-hover:text-white">
        <CheckCircle2Icon className="size-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-bold text-[#13284e]">
          {task.title}
        </span>
        <span className="mt-1 block truncate text-[10px] font-medium text-[#71809f]">
          {task.description}
        </span>
      </span>
      <span
        className={cn(
          "pt-0.5 text-right text-[9px] font-bold",
          task.tone === "danger"
            ? "text-[#ef334f]"
            : task.tone === "primary"
              ? "text-[#0b66ff]"
              : "text-[#71809f]",
        )}
      >
        {task.dueLabel}
      </span>
    </Link>
  );
}

function StatusLabel({
  children,
  status,
}: {
  children: React.ReactNode;
  status: string;
}) {
  const className =
    status === "OFFER" || status === "ACCEPTED" || status === "ENROLLED"
      ? "bg-[#e9f9ef] text-[#169447]"
      : status === "INVALID_DOCUMENTS" || status === "REJECTED"
        ? "bg-[#fff0e5] text-[#df6412]"
        : status === "UNDER_REVIEW" || status === "SUBMITTED"
          ? "bg-[#e9f1ff] text-[#0b61e8]"
          : "bg-[#f0eaff] text-[#7135e8]";

  return (
    <span
      className={cn(
        "max-w-[104px] truncate rounded-md px-2 py-1 text-[9px] font-bold",
        className,
      )}
    >
      {children}
    </span>
  );
}

function DeltaLabel({
  compact = false,
  delta,
}: {
  compact?: boolean;
  delta: number;
}) {
  const positive = delta >= 0;

  return (
    <div
      className={cn(
        "flex items-center gap-1 font-bold",
        compact ? "mt-0.5 text-[10px]" : "text-[11px]",
        positive ? "text-[#11a84f]" : "text-[#ef334f]",
      )}
    >
      <ArrowUpRightIcon className={cn("size-3", !positive && "rotate-90")} />
      <span>{formatDecimal(Math.abs(delta))}%</span>
      {compact ? (
        <span className="ml-0.5 font-medium text-[#7b89a6]">əvvəlki dövrə görə</span>
      ) : null}
    </div>
  );
}

function PanelLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Button
      asChild
      className="h-8 rounded-xl border-[#dce6f2] bg-white px-3 text-[10px] font-bold text-[#324766] shadow-none hover:bg-[#f3f7fd] hover:text-[#0b66ff]"
      size="sm"
      variant="outline"
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}

function QuickAddMenu({ locale }: { locale: AppLocale }) {
  const items = [
    { href: "/students/new", icon: UserPlus2Icon, label: "Yeni tələbə" },
    { href: "/applications/new", icon: FilePlus2Icon, label: "Yeni müraciət" },
    { href: "/universities/new", icon: SchoolIcon, label: "Yeni universitet" },
  ];

  return (
    <details className="group relative z-30">
      <summary className="flex h-11 cursor-pointer list-none items-center rounded-2xl bg-[#0b66ff] px-4 text-sm font-bold text-white shadow-[0_13px_28px_rgba(11,102,255,0.25)] outline-none transition hover:bg-[#0759df] focus-visible:ring-2 focus-visible:ring-[#0b66ff]/35 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
        Sürətli əlavə
        <ChevronDownIcon className="ml-1 size-4 transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-2xl border border-[#dce6f2] bg-white p-2 shadow-[0_18px_50px_rgba(23,43,77,0.16)]">
        <div className="px-2.5 py-2 text-xs font-bold text-[#71809f]">
          Yeni qeyd yaradın
        </div>
        <div className="my-1 h-px bg-[#e6edf6]" />
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              className="flex items-center gap-2 rounded-xl px-2.5 py-2.5 transition hover:bg-[#edf4ff]"
              href={localizedHref(item.href, locale)}
              key={item.href}
            >
              <Icon className="size-4 text-[#0b66ff]" />
              <span className="font-semibold text-[#24375d]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </details>
  );
}

function localizedHref(href: string, locale: AppLocale) {
  return locale === defaultLocale ? href : `/${locale}${href}`;
}

function formatMetric(
  value: number,
  format: "money" | "number" | "percent",
  currency?: string,
) {
  if (format === "money") {
    return formatMoney(value, currency ?? "USD");
  }

  if (format === "percent") {
    return `${formatDecimal(value)}%`;
  }

  return formatInteger(value);
}

function formatMoney(value: number, currency: string) {
  const symbols: Record<string, string> = {
    AUD: "A$",
    AZN: "₼",
    CAD: "C$",
    EUR: "€",
    GBP: "£",
    USD: "$",
  };
  const symbol = symbols[currency] ?? `${currency} `;

  if (Math.abs(value) >= 1_000_000) {
    return `${symbol}${formatDecimal(value / 1_000_000, 2)}M`;
  }

  if (Math.abs(value) >= 10_000) {
    return `${symbol}${formatDecimal(value / 1_000, 1)}K`;
  }

  return `${symbol}${formatInteger(value)}`;
}

function formatInteger(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatDecimal(value: number, maximumFractionDigits = 1) {
  const factor = 10 ** maximumFractionDigits;
  const rounded = Math.round(value * factor) / factor;

  return rounded.toString().replace(".", ",");
}
