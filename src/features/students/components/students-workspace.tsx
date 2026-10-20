"use client";

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  FileWarningIcon,
  GraduationCapIcon,
  KeyRoundIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  UserCheckIcon,
  XIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  StudentPortalStatus,
  StudentRecord,
  StudentsDashboardData,
} from "@/features/students/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const metricCards: Array<{
  icon: LucideIcon;
  key: keyof StudentsDashboardData["metrics"];
  label: string;
  tone: "amber" | "blue" | "green" | "red";
}> = [
  {
    icon: GraduationCapIcon,
    key: "totalStudents",
    label: "Cəmi tələbə",
    tone: "blue",
  },
  {
    icon: UserCheckIcon,
    key: "activeApplications",
    label: "Aktiv müraciət",
    tone: "green",
  },
  {
    icon: KeyRoundIcon,
    key: "portalQueue",
    label: "Portal növbəsi",
    tone: "amber",
  },
  {
    icon: FileWarningIcon,
    key: "missingDocuments",
    label: "Çatışmayan sənəd",
    tone: "red",
  },
];

const desktopColumns =
  "grid-cols-[44px_minmax(180px,1.4fr)_minmax(160px,1.1fr)_minmax(120px,.82fr)_minmax(94px,.68fr)_minmax(116px,.8fr)_minmax(100px,.72fr)_40px]";

export function StudentsWorkspace({
  data,
  isAgentPortal = false,
}: {
  data: StudentsDashboardData;
  isAgentPortal?: boolean;
}) {
  function exportRows(format: "csv" | "json") {
    const filePrefix = "campus-global-students";

    if (format === "json") {
      downloadFile(
        `${filePrefix}.json`,
        JSON.stringify(data.rows, null, 2),
        "application/json",
      );
      return;
    }

    downloadFile(
      `${filePrefix}.csv`,
      studentsToCsv(data.rows),
      "text/csv;charset=utf-8",
    );
  }

  return (
    <div className="min-h-full bg-[#f6f9ff] px-4 py-5 sm:px-5 lg:px-8 lg:py-7">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#07183a] sm:text-3xl">
            Tələbələr
          </h1>
          <p className="mt-1 text-sm font-medium text-[#637392]">
            Profil, portal və sənəd vəziyyətini yığcam reyestrdən idarə edin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-10 rounded-xl border-[#dce6f4] bg-white px-3 text-xs font-black text-[#34456c] hover:bg-[#f6f9ff]"
                variant="outline"
              >
                <DownloadIcon data-icon="inline-start" />
                İxrac
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 rounded-xl border-[#dce6f4] p-1.5"
            >
              <DropdownMenuItem
                className="rounded-lg text-xs font-bold"
                onSelect={() => exportRows("csv")}
              >
                CSV ixrac et
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg text-xs font-bold"
                onSelect={() => exportRows("json")}
              >
                JSON ixrac et
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            asChild
            className="h-10 rounded-xl bg-[#0b66ff] px-4 text-xs font-black shadow-[0_10px_24px_rgba(11,102,255,0.2)] hover:bg-[#075be8]"
          >
            <Link href="/students/new">
              <PlusIcon data-icon="inline-start" />
              Tələbə əlavə et
            </Link>
          </Button>
        </div>
      </header>

      <section className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <CompactMetric
            icon={metric.icon}
            key={metric.key}
            label={metric.label}
            tone={metric.tone}
            value={data.metrics[metric.key]}
          />
        ))}
      </section>

      <section className="mt-5 overflow-hidden rounded-[1.25rem] border border-[#dce6f4] bg-white shadow-[0_12px_36px_rgba(29,78,216,0.045)]">
        <form action="/students" className="border-b border-[#e5edf8] p-3">
          <div className="grid gap-2.5 xl:grid-cols-[minmax(260px,1.25fr)_minmax(150px,.65fr)_minmax(170px,.72fr)_minmax(155px,.68fr)_minmax(165px,.72fr)_auto]">
            <StudentSearchInput value={data.filters.query} />
            <FilterSelect
              label="Vətəndaşlıq"
              name="citizenship"
              options={[
                { label: "Hamısı", value: "all" },
                ...data.filterOptions.citizenships.map((citizenship) => ({
                  label: citizenship,
                  value: citizenship,
                })),
              ]}
              value={data.filters.citizenship}
            />
            {isAgentPortal ? (
              <input name="agent" type="hidden" value="all" />
            ) : (
              <FilterSelect
                label="Agent"
                name="agent"
                options={[
                  { label: "Bütün agentlər", value: "all" },
                  ...data.filterOptions.agents,
                ]}
                value={data.filters.agent}
              />
            )}
            <FilterSelect
              label="Portal"
              name="portal"
              options={[
                { label: "Bütün statuslar", value: "all" },
                ...data.filterOptions.portalStatuses.map((status) => ({
                  label: formatPortalStatus(status),
                  value: status,
                })),
              ]}
              value={data.filters.portalStatus}
            />
            <FilterSelect
              label="Sıralama"
              name="sort"
              options={[
                { label: "Son yenilənən", value: "updated-desc" },
                { label: "Ad A–Z", value: "name-asc" },
                { label: "Mərhələ A–Z", value: "stage-asc" },
              ]}
              value={data.filters.sort}
            />
            <FilterActions />
          </div>
        </form>

        <div className="flex items-center justify-between gap-3 border-b border-[#e5edf8] bg-[#fbfdff] px-4 py-2.5">
          <div className="text-xs font-black text-[#24365f]">
            Tələbə reyestri
          </div>
          <div className="text-[11px] font-bold text-[#71809f]">
            {data.pagination.totalItems} nəticə · {data.pagination.resultStart}–
            {data.pagination.resultEnd}
          </div>
        </div>

        {data.rows.length > 0 ? (
          <StudentsDataList
            rows={data.rows}
            startIndex={data.pagination.resultStart}
          />
        ) : (
          <EmptyStudentsState />
        )}

        <Pagination data={data} />
      </section>
    </div>
  );
}

function CompactMetric({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: LucideIcon;
  label: string;
  tone: "amber" | "blue" | "green" | "red";
  value: number;
}) {
  const toneClasses = {
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    blue: "border-blue-100 bg-blue-50 text-[#0b66ff]",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    red: "border-red-100 bg-red-50 text-red-600",
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
        <div className="truncate text-[11px] font-bold text-[#637392]">
          {label}
        </div>
        <div className="mt-0.5 text-xl font-black tabular-nums text-[#07183a]">
          {value}
        </div>
      </div>
    </div>
  );
}

function StudentsDataList({
  rows,
  startIndex,
}: {
  rows: StudentRecord[];
  startIndex: number;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto xl:block">
        <div className="min-w-[1000px]">
          <div
            className={cn(
              "grid items-center border-b border-[#e5edf8] bg-[#f6f9ff] px-2",
              desktopColumns,
            )}
          >
            {[
              "No",
              "Tələbə",
              "Əlaqə",
              "Agent",
              "Mərhələ",
              "Portal / sənəd",
              "Yenilənib",
              "",
            ].map((label, index) => (
              <div
                className={cn(
                  "px-2 py-2.5 text-[10px] font-black uppercase tracking-[0.04em] text-[#637392]",
                  index === 0 && "text-center",
                  index === 7 && "sr-only",
                )}
                key={`${label}-${index}`}
              >
                {label || "Detal"}
              </div>
            ))}
          </div>
          {rows.map((student, index) => (
            <StudentDesktopRow
              index={startIndex + index}
              key={student.id}
              student={student}
            />
          ))}
        </div>
      </div>
      <div className="grid gap-2.5 p-3 xl:hidden">
        {rows.map((student, index) => (
          <StudentMobileCard
            index={startIndex + index}
            key={student.id}
            student={student}
          />
        ))}
      </div>
    </>
  );
}

function StudentDesktopRow({
  index,
  student,
}: {
  index: number;
  student: StudentRecord;
}) {
  const fullName = `${student.firstName} ${student.lastName}`.trim();

  return (
    <div
      className={cn(
        "grid items-center border-b border-[#edf2f8] px-2 transition-colors last:border-b-0 hover:bg-[#f8fbff]",
        desktopColumns,
      )}
    >
      <div className="px-2 py-3 text-center text-xs font-black tabular-nums text-[#8a97b4]">
        {index}
      </div>
      <div className="min-w-0 px-2 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <StudentAvatar student={student} />
          <div className="min-w-0">
            <Link
              className="block truncate text-sm font-black text-[#07183a] transition hover:text-[#0b66ff]"
              href={`/applications/students/${student.id}`}
            >
              {fullName}
            </Link>
            <span className="mt-0.5 block truncate text-[10px] font-bold text-[#8a97b4]">
              {student.citizenship} · {student.id}
            </span>
          </div>
        </div>
      </div>
      <div className="min-w-0 px-2 py-3">
        <p className="flex items-center gap-1.5 truncate text-xs font-bold text-[#34456c]">
          <MailIcon className="size-3.5 shrink-0 text-[#0b66ff]" />
          <span className="truncate">{student.contactEmail}</span>
        </p>
        <p className="mt-1 flex items-center gap-1.5 truncate text-[10px] font-semibold text-[#8a97b4]">
          <PhoneIcon className="size-3 shrink-0" />
          <span className="truncate">{student.phone}</span>
        </p>
      </div>
      <TextCell value={student.agent} />
      <div className="min-w-0 px-2 py-3">
        <StageBadge stage={student.stage} />
      </div>
      <div className="min-w-0 px-2 py-3">
        <div className="flex items-center gap-1.5">
          <PortalBadge status={student.portalStatus} />
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#637392]">
            <FileTextIcon className="size-3.5 text-[#0b66ff]" />
            {student.documentCount}
          </span>
          {student.missingItems > 0 ? (
            <span className="text-[10px] font-black text-red-600">
              −{student.missingItems}
            </span>
          ) : null}
        </div>
      </div>
      <TextCell value={student.updatedAt} />
      <div className="flex items-center justify-center px-1 py-3">
        <Link
          aria-label={`${fullName} tələbə detalını aç`}
          className="flex size-8 items-center justify-center rounded-xl border border-[#dce6f4] bg-white text-[#637392] transition hover:border-[#b9d1f5] hover:bg-[#eef5ff] hover:text-[#0b66ff]"
          href={`/applications/students/${student.id}`}
        >
          <EyeIcon className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function StudentMobileCard({
  index,
  student,
}: {
  index: number;
  student: StudentRecord;
}) {
  const fullName = `${student.firstName} ${student.lastName}`.trim();

  return (
    <article className="rounded-[1rem] border border-[#dce6f4] bg-white p-3.5 shadow-[0_8px_24px_rgba(29,78,216,0.04)]">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#eef5ff] text-[11px] font-black tabular-nums text-[#0b66ff]">
          {index}
        </span>
        <StudentAvatar student={student} />
        <div className="min-w-0 flex-1">
          <Link
            className="block truncate text-sm font-black text-[#07183a]"
            href={`/applications/students/${student.id}`}
          >
            {fullName}
          </Link>
          <p className="mt-0.5 truncate text-[10px] font-bold text-[#8a97b4]">
            {student.citizenship} · {student.agent}
          </p>
        </div>
        <Link
          aria-label={`${fullName} tələbə detalını aç`}
          className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-[#dce6f4] text-[#637392]"
          href={`/applications/students/${student.id}`}
        >
          <ChevronRightIcon className="size-4" />
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#edf2f8] pt-3">
        <StageBadge stage={student.stage} />
        <PortalBadge status={student.portalStatus} />
        <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#637392]">
          <FileTextIcon className="size-3.5 text-[#0b66ff]" />
          {student.documentCount} ümumi sənəd
        </span>
        {student.missingItems > 0 ? (
          <span className="text-[11px] font-black text-red-600">
            {student.missingItems} çatışmır
          </span>
        ) : null}
      </div>
      <div className="mt-2 grid gap-1 text-[11px] font-semibold text-[#71809f]">
        <span className="truncate">{student.contactEmail}</span>
        <span className="truncate">{student.phone}</span>
      </div>
    </article>
  );
}

function StudentAvatar({ student }: { student: StudentRecord }) {
  const initials =
    `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();

  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#d7e6fb] bg-[#e8f1ff] text-xs font-black text-[#0b66ff]">
      {initials || "T"}
    </span>
  );
}

function TextCell({ value }: { value: string }) {
  return (
    <div className="min-w-0 px-2 py-3">
      <p className="truncate text-xs font-bold text-[#4f5f7c]">{value}</p>
    </div>
  );
}

function StudentSearchInput({ value }: { value: string }) {
  return (
    <label className="relative block w-full">
      <span className="sr-only">Tələbə axtarışı</span>
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8a97b4]" />
      <Input
        autoComplete="off"
        className="h-11 rounded-xl border-[#dce6f4] bg-white pl-10 text-xs font-bold text-[#07183a] shadow-none focus:border-[#0b66ff] focus:ring-3 focus:ring-[#0b66ff]/10"
        defaultValue={value}
        name="q"
        placeholder="Ad, ID, e-poçt, pasport..."
      />
    </label>
  );
}

function FilterSelect({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <Select defaultValue={value} name={name}>
      <SelectTrigger
        aria-label={label}
        className="!h-11 w-full rounded-xl border-[#dce6f4] bg-white px-3 text-xs font-bold text-[#34456c] shadow-none focus:border-[#0b66ff] focus:ring-3 focus:ring-[#0b66ff]/10"
      >
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent
        align="start"
        className="max-h-72 rounded-xl border-[#dce6f4] p-1"
        position="popper"
      >
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              className="rounded-lg py-2 text-xs font-semibold"
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function FilterActions() {
  return (
    <div className="flex gap-2">
      <Button
        className="h-11 flex-1 rounded-xl bg-[#0b66ff] px-3 text-xs font-black hover:bg-[#075be8] xl:flex-none"
        type="submit"
      >
        <SlidersHorizontalIcon data-icon="inline-start" />
        Tətbiq et
      </Button>
      <Button
        asChild
        className="size-11 rounded-xl border-[#dce6f4] bg-white text-[#637392] hover:bg-[#f6f9ff] hover:text-[#0b66ff]"
        size="icon"
        variant="outline"
      >
        <Link aria-label="Filtrləri təmizlə" href="/students">
          <XIcon className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

function StageBadge({ stage }: { stage: StudentRecord["stage"] }) {
  const labels: Record<StudentRecord["stage"], string> = {
    Application: "Müraciət",
    Enrollment: "Qeydiyyat",
    Offer: "Təklif",
    Profil: "Profil",
    Visa: "Viza",
  };

  return (
    <Badge className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-black text-[#0b66ff]">
      {labels[stage]}
    </Badge>
  );
}

function PortalBadge({ status }: { status: StudentPortalStatus }) {
  return (
    <Badge
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-black",
        status === "Ready" && "border-emerald-100 bg-emerald-50 text-emerald-700",
        status === "Pending" && "border-amber-100 bg-amber-50 text-amber-700",
        status === "Needs email" && "border-red-100 bg-red-50 text-red-600",
      )}
    >
      {formatPortalStatus(status)}
    </Badge>
  );
}

function formatPortalStatus(status: StudentPortalStatus) {
  const labels: Record<StudentPortalStatus, string> = {
    "Needs email": "E-poçt lazımdır",
    Pending: "Gözləyir",
    Ready: "Aktiv",
  };

  return labels[status];
}

function EmptyStudentsState() {
  return (
    <div className="flex flex-col items-center px-5 py-14 text-center">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#0b66ff]">
        <SearchIcon className="size-5" />
      </span>
      <h2 className="mt-3 text-sm font-black text-[#07183a]">
        Tələbə tapılmadı
      </h2>
      <p className="mt-1 max-w-sm text-xs font-medium leading-5 text-[#637392]">
        Filtrləri dəyişin və ya yeni tələbə profili əlavə edin.
      </p>
    </div>
  );
}

function Pagination({ data }: { data: StudentsDashboardData }) {
  const { page } = data.filters;
  const { totalPages } = data.pagination;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#e5edf8] bg-[#fbfdff] px-3 py-2.5">
      <span className="text-[11px] font-bold text-[#71809f]">
        Səhifə {page} / {totalPages}
      </span>
      <div className="flex gap-1.5">
        <Button
          asChild={page > 1}
          className="h-8 rounded-lg border-[#dce6f4] bg-white px-2.5 text-[11px] font-black text-[#34456c]"
          disabled={page <= 1}
          size="sm"
          variant="outline"
        >
          {page > 1 ? (
            <Link href={buildPageHref(data, page - 1)}>
              <ChevronLeftIcon data-icon="inline-start" />
              Əvvəlki
            </Link>
          ) : (
            <span>Əvvəlki</span>
          )}
        </Button>
        <Button
          asChild={page < totalPages}
          className="h-8 rounded-lg border-[#dce6f4] bg-white px-2.5 text-[11px] font-black text-[#34456c]"
          disabled={page >= totalPages}
          size="sm"
          variant="outline"
        >
          {page < totalPages ? (
            <Link href={buildPageHref(data, page + 1)}>
              Növbəti
              <ChevronRightIcon data-icon="inline-end" />
            </Link>
          ) : (
            <span>Növbəti</span>
          )}
        </Button>
      </div>
    </div>
  );
}

function buildPageHref(data: StudentsDashboardData, page: number) {
  const params = new URLSearchParams();
  const filters = data.filters;

  if (filters.query) params.set("q", filters.query);
  if (filters.citizenship !== "all") {
    params.set("citizenship", filters.citizenship);
  }
  if (filters.agent !== "all") params.set("agent", filters.agent);
  if (filters.portalStatus !== "all") {
    params.set("portal", filters.portalStatus);
  }
  if (filters.sort !== "updated-desc") params.set("sort", filters.sort);
  params.set("page", String(page));
  params.set("pageSize", String(filters.pageSize));

  return `/students?${params.toString()}`;
}

function downloadFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function studentsToCsv(rows: StudentRecord[]) {
  const headers = [
    "id",
    "firstName",
    "lastName",
    "email",
    "contactEmail",
    "phone",
    "citizenship",
    "agent",
    "stage",
    "portalStatus",
    "documentCount",
  ];
  const values = rows.map((row) =>
    headers
      .map((header) => {
        const value = row[header as keyof StudentRecord];
        return `"${String(value ?? "").replaceAll('"', '""')}"`;
      })
      .join(","),
  );

  return [headers.join(","), ...values].join("\n");
}
