"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  Building2Icon,
  ChevronDownIcon,
  GraduationCapIcon,
  UserRoundIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getApplicationStatusSurface,
  getApplicationStatusTone,
} from "@/features/applications/application-status-tone";
import { APPLICATION_STATUS_LABELS } from "@/features/applications/constants";
import type {
  ApplicationRow,
  ApplicationStatus,
} from "@/features/applications/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const desktopColumns =
  "grid-cols-[42px_minmax(190px,1.65fr)_minmax(120px,1.1fr)_minmax(120px,1.1fr)_minmax(86px,.7fr)_minmax(88px,.7fr)_minmax(112px,.85fr)_minmax(98px,.8fr)_minmax(105px,.85fr)_minmax(105px,.85fr)_minmax(92px,.7fr)_42px]";

type ApplicationSummary = ApplicationRow["applications"][number];
type ApplicationChoice = ApplicationSummary["choices"][number];

type UniversityProgramItem = {
  agent: string;
  applicationCode: string;
  applicationId: string;
  campusName: string;
  createdAt: string;
  key: string;
  language: string;
  manager: string;
  period: string;
  priority: number;
  program: string;
  specialty: string;
  statusCode: ApplicationStatus;
  statusLabel: string;
  updatedAt: string;
};

type UniversityGroup = {
  city: string;
  key: string;
  name: string;
  programs: UniversityProgramItem[];
};

export function ApplicationsDataList({
  rows,
  startIndex,
}: {
  rows: ApplicationRow[];
  startIndex: number;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto xl:block">
        <div className="min-w-[1240px]">
          <div
            className={cn(
              "grid items-center border-b border-[#e5edf8] bg-[#f6f9ff] px-2",
              desktopColumns,
            )}
          >
            {[
              "No",
              "Tələbə",
              "Universitet",
              "İxtisas",
              "Proqram",
              "Dönəm",
              "Son status",
              "Başvuru tarixi",
              "Agent",
              "Menecer",
              "Tarix",
              "",
            ].map((label, index) => (
              <div
                className={cn(
                  "px-2 py-3 text-[10px] font-black uppercase tracking-[0.04em] text-[#637392]",
                  index === 0 && "text-center",
                  index === 11 && "sr-only",
                )}
                key={`${label}-${index}`}
              >
                {label || "Detallar"}
              </div>
            ))}
          </div>

          {rows.map((row, index) => (
            <ApplicationDesktopRow
              index={(startIndex || 1) + index}
              key={row.id}
              row={row}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3 p-3 xl:hidden">
        {rows.map((row, index) => (
          <ApplicationMobileCard
            index={(startIndex || 1) + index}
            key={row.id}
            row={row}
          />
        ))}
      </div>
    </>
  );
}

function ApplicationDesktopRow({
  index,
  row,
}: {
  index: number;
  row: ApplicationRow;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const summaries = useMemo(() => getRowSummaries(row), [row]);
  const studentName = row.studentName || "Adsız tələbə";

  return (
    <div className="border-b border-[#edf2f8] last:border-b-0">
      <div
        className={cn(
          "grid items-center border-l-[3px] px-2 transition-colors",
          getApplicationStatusSurface(row.statusCode),
          isOpen && "shadow-[inset_0_-1px_0_rgba(148,163,184,0.12)]",
          desktopColumns,
        )}
      >
        <div className="px-2 py-3 text-center text-xs font-black tabular-nums text-[#8a97b4]">
          {index}
        </div>
        <div className="min-w-0 px-2 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <StudentAvatar name={studentName} src={row.studentPhotoUrl} />
            <div className="min-w-0">
              <Link
                className="block truncate text-sm font-black text-[#07183a] transition hover:text-[#0b66ff]"
                href={`/applications/students/${row.studentId}`}
              >
                {studentName}
              </Link>
              <span className="mt-0.5 block truncate text-[10px] font-bold text-[#8a97b4]">
                {row.latestApplicationCode}
              </span>
            </div>
          </div>
        </div>
        <SummaryCell values={summaries.universities} />
        <SummaryCell values={summaries.specialties} />
        <SummaryCell values={summaries.programs} />
        <TextCell value={row.latestPeriod} />
        <div className="min-w-0 px-2 py-3">
          <ApplicationStatusBadge label={row.status} status={row.statusCode} />
        </div>
        <TextCell value={row.createdAt} />
        <TextCell value={row.agent} />
        <TextCell value={row.manager} />
        <TextCell value={row.updatedAt} />
        <div className="flex items-center justify-center px-1 py-3">
          <button
            aria-expanded={isOpen}
            aria-label={`${studentName} üçün müraciət detallarını ${isOpen ? "bağla" : "aç"}`}
            className={cn(
              "flex size-8 items-center justify-center rounded-xl border border-[#dce6f4] bg-white text-[#637392] transition hover:border-[#b9d1f5] hover:bg-[#eef5ff] hover:text-[#0b66ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b66ff]",
              isOpen && "border-[#b9d1f5] bg-[#eef5ff] text-[#0b66ff]",
            )}
            onClick={() => setIsOpen((current) => !current)}
            type="button"
          >
            <ChevronDownIcon
              className={cn(
                "size-4 transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      {isOpen ? <ApplicationDetailsTree row={row} /> : null}
    </div>
  );
}

function ApplicationMobileCard({
  index,
  row,
}: {
  index: number;
  row: ApplicationRow;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const summaries = useMemo(() => getRowSummaries(row), [row]);
  const studentName = row.studentName || "Adsız tələbə";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[1.15rem] border border-l-4 shadow-[0_10px_26px_rgba(29,78,216,0.045)]",
        getApplicationStatusSurface(row.statusCode),
      )}
    >
      <div className="p-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#eef5ff] text-[11px] font-black tabular-nums text-[#0b66ff]">
            {index}
          </span>
          <StudentAvatar name={studentName} src={row.studentPhotoUrl} />
          <div className="min-w-0 flex-1">
            <Link
              className="block truncate text-sm font-black text-[#07183a]"
              href={`/applications/students/${row.studentId}`}
            >
              {studentName}
            </Link>
            <span className="mt-1 block truncate text-[11px] font-bold text-[#8a97b4]">
              {row.latestApplicationCode} · {row.latestPeriod}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/70 bg-white/65 px-3 py-2">
          <span className="text-[9px] font-black uppercase tracking-[0.04em] text-[#8a97b4]">
            Son status
          </span>
          <ApplicationStatusBadge label={row.status} status={row.statusCode} />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#edf2f8] pt-3 text-xs">
          <MobileFact
            label="Universitet"
            value={formatSummary(summaries.universities)}
          />
          <MobileFact
            label="İxtisas"
            value={formatSummary(summaries.specialties)}
          />
          <MobileFact
            label="Proqram"
            value={formatSummary(summaries.programs)}
          />
          <MobileFact label="Başvuru tarixi" value={row.createdAt} />
          <MobileFact label="Agent" value={row.agent} />
          <MobileFact label="Menecer" value={row.manager} />
        </dl>
      </div>

      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between border-t border-[#edf2f8] bg-[#fbfdff] px-3.5 py-2.5 text-left text-xs font-black text-[#24365f] transition hover:bg-[#f3f7fd]"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{row.applicationCount} müraciətin detalları</span>
        <span className="flex items-center gap-2 text-[11px] text-[#71809f]">
          {row.updatedAt}
          <ChevronDownIcon
            className={cn(
              "size-4 transition-transform",
              isOpen && "rotate-180 text-[#0b66ff]",
            )}
          />
        </span>
      </button>

      {isOpen ? <ApplicationDetailsTree row={row} /> : null}
    </article>
  );
}

function ApplicationDetailsTree({ row }: { row: ApplicationRow }) {
  const universityGroups = useMemo(() => buildUniversityGroups(row), [row]);
  const [selectedUniversityKey, setSelectedUniversityKey] = useState(
    () => universityGroups[0]?.key ?? "",
  );
  const selectedUniversity =
    universityGroups.find(
      (university) => university.key === selectedUniversityKey,
    ) ?? universityGroups[0];

  if (!selectedUniversity) return null;

  const showCampus = selectedUniversity.programs.some(
    (program) => program.campusName,
  );
  const detailColumns = showCampus
    ? "grid-cols-[minmax(150px,1.25fr)_minmax(110px,.9fr)_minmax(82px,.65fr)_minmax(82px,.65fr)_minmax(108px,.85fr)_minmax(92px,.72fr)_minmax(98px,.78fr)_minmax(98px,.78fr)_minmax(86px,.68fr)_34px]"
    : "grid-cols-[minmax(160px,1.4fr)_minmax(90px,.75fr)_minmax(90px,.75fr)_minmax(112px,.9fr)_minmax(98px,.8fr)_minmax(105px,.85fr)_minmax(105px,.85fr)_minmax(92px,.7fr)_34px]";

  return (
    <div className="border-t border-[#dce6f4] bg-[#f6f9ff] p-2.5 sm:p-3">
      <div className="overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          aria-label="Universitet seçimi"
          className="inline-flex min-w-full w-max gap-1 rounded-xl border border-[#dce6f4] bg-white p-1 shadow-[0_6px_18px_rgba(29,78,216,0.05)]"
          role="group"
        >
          {universityGroups.map((university) => {
            const isSelected = university.key === selectedUniversity.key;

            return (
              <button
                aria-pressed={isSelected}
                className={cn(
                  "flex min-w-[150px] max-w-[240px] flex-1 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-black transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b66ff] sm:text-xs",
                  isSelected
                    ? "bg-[#0b66ff] text-white shadow-[0_7px_18px_rgba(11,102,255,0.22)]"
                    : "text-[#4f5f7c] hover:bg-[#f3f7fd] hover:text-[#0b66ff]",
                )}
                key={university.key}
                onClick={() => setSelectedUniversityKey(university.key)}
                type="button"
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md",
                    isSelected
                      ? "bg-white/15 text-white"
                      : "bg-[#eef5ff] text-[#0b66ff]",
                  )}
                >
                  <Building2Icon className="size-3" strokeWidth={1.8} />
                </span>
                <span className="truncate">{university.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#dce6f4] bg-white shadow-[0_10px_26px_rgba(29,78,216,0.045)]">
        <div className={cn("hidden bg-[#fbfdff] px-2 lg:grid", detailColumns)}>
          {[
            "İxtisas",
            ...(showCampus ? ["Kampus"] : []),
            "Proqram",
            "Dönəm",
            "Son status",
            "Başvuru tarixi",
            "Agent",
            "Menecer",
            "Tarix",
            "",
          ].map((label, index) => (
            <span
              className={cn(
                "px-2 py-2 text-[9px] font-black uppercase tracking-[0.04em] text-[#8a97b4]",
                index === (showCampus ? 9 : 8) && "sr-only",
              )}
              key={`${label}-${index}`}
            >
              {label || "Aç"}
            </span>
          ))}
        </div>

        {selectedUniversity.programs.map((program) => (
          <ProgramDetailRow
            columns={detailColumns}
            key={program.key}
            program={program}
            showCampus={showCampus}
          />
        ))}
      </section>
    </div>
  );
}

function ProgramDetailRow({
  columns,
  program,
  showCampus,
}: {
  columns: string;
  program: UniversityProgramItem;
  showCampus: boolean;
}) {
  return (
    <>
      <div
        className={cn(
          "hidden items-center border-l-[3px] border-t px-2 first:border-t-0 lg:grid",
          getApplicationStatusSurface(program.statusCode),
          columns,
        )}
      >
        <div className="min-w-0 px-2 py-2.5">
          <p className="truncate text-xs font-black text-[#07183a]">
            {program.specialty}
          </p>
          <p className="mt-0.5 truncate text-[9px] font-bold text-[#8a97b4]">
            #{program.priority} · {program.applicationCode}
            {program.language ? ` · ${program.language}` : ""}
          </p>
        </div>
        {showCampus ? <DetailText value={program.campusName} /> : null}
        <DetailText value={program.program} />
        <DetailText value={program.period} />
        <div className="min-w-0 px-2 py-2.5">
          <ApplicationStatusBadge
            label={program.statusLabel}
            status={program.statusCode}
          />
        </div>
        <DetailText value={program.createdAt} />
        <DetailText value={program.agent} />
        <DetailText value={program.manager} />
        <DetailText value={program.updatedAt} />
        <Link
          aria-label={`${program.applicationCode} müraciətini aç`}
          className="flex size-7 items-center justify-center rounded-lg text-[#8a97b4] transition hover:bg-[#eef5ff] hover:text-[#0b66ff]"
          href={`/applications/${program.applicationId}`}
        >
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>

      <Link
        className={cn(
          "group block border-l-4 border-t p-3 first:border-t-0 lg:hidden",
          getApplicationStatusSurface(program.statusCode),
        )}
        href={`/applications/${program.applicationId}`}
      >
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eef5ff] text-[#0b66ff]">
            <GraduationCapIcon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-black text-[#07183a] group-hover:text-[#0b66ff]">
              {program.specialty}
            </span>
            <span className="mt-0.5 block text-[10px] font-bold text-[#8a97b4]">
              {program.program} · {program.period} · {program.applicationCode}
            </span>
            {program.campusName ? (
              <span className="mt-1 block truncate text-[10px] font-black text-[#0b66ff]">
                Kampus: {program.campusName}
              </span>
            ) : null}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 pl-10">
          <span className="text-[9px] font-black uppercase tracking-[0.04em] text-[#8a97b4]">
            Son status
          </span>
          <ApplicationStatusBadge
            label={program.statusLabel}
            status={program.statusCode}
          />
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 pl-10 text-[10px]">
          <MobileFact label="Başvuru tarixi" value={program.createdAt} />
          <MobileFact label="Tarix" value={program.updatedAt} />
          <MobileFact label="Agent" value={program.agent} />
          <MobileFact label="Menecer" value={program.manager} />
        </dl>
      </Link>
    </>
  );
}

function SummaryCell({ values }: { values: string[] }) {
  const visible = values.slice(0, 2);
  const remaining = Math.max(0, values.length - visible.length);

  return (
    <div className="min-w-0 px-2 py-3 text-[11px] font-bold leading-4 text-[#24365f]">
      {visible.length > 0 ? (
        <div className="grid min-w-0 gap-0.5" title={values.join(", ")}>
          {visible.map((value, index) => (
            <div className="flex min-w-0 items-center gap-1" key={value}>
              <span className="truncate">{value}</span>
              {index === visible.length - 1 && remaining > 0 ? (
                <span className="shrink-0 rounded-md bg-[#eef5ff] px-1.5 py-0.5 text-[10px] font-black text-[#0b66ff]">
                  +{remaining}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <span className="text-[#8a97b4]">—</span>
      )}
    </div>
  );
}

function TextCell({ value }: { value: string }) {
  return (
    <div className="min-w-0 px-2 py-3 text-[11px] font-bold leading-4 text-[#4f5f7c]">
      <span className="block truncate" title={value}>
        {value || "—"}
      </span>
    </div>
  );
}

function DetailText({ value }: { value: string }) {
  return (
    <div className="min-w-0 px-2 py-2.5 text-[10px] font-bold text-[#637392]">
      <span className="block truncate" title={value}>
        {value || "—"}
      </span>
    </div>
  );
}

function MobileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-black uppercase tracking-[0.04em] text-[#8a97b4]">
        {label}
      </dt>
      <dd className="mt-0.5 truncate font-bold text-[#24365f]" title={value}>
        {value || "—"}
      </dd>
    </div>
  );
}

function StudentAvatar({ name, src }: { name: string; src: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  if (src) {
    return (
      <Image
        alt={name}
        className="size-10 shrink-0 rounded-xl border border-[#dce6f4] object-cover"
        height={40}
        src={src}
        unoptimized
        width={40}
      />
    );
  }

  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#dce6f4] bg-[#e8f1ff] text-xs font-black text-[#1559b7]">
      {initials || <UserRoundIcon className="size-4" />}
    </span>
  );
}

export function ApplicationStatusBadge({
  label,
  status,
}: {
  label: string;
  status: ApplicationStatus;
}) {
  const tone = getApplicationStatusTone(status);

  return (
    <Badge
      className={cn(
        "h-auto min-h-5 max-w-full whitespace-normal rounded-full border px-2 py-1 text-center text-[10px] font-black leading-3",
        tone === "green" && "border-emerald-100 bg-emerald-50 text-emerald-600",
        tone === "amber" && "border-amber-100 bg-amber-50 text-amber-700",
        tone === "red" && "border-red-100 bg-red-50 text-red-600",
        tone === "slate" && "border-slate-200 bg-slate-50 text-slate-600",
      )}
      title={label}
    >
      <span>{label}</span>
    </Badge>
  );
}

function getRowSummaries(row: ApplicationRow) {
  const choices = row.applications.flatMap(
    (application) => application.choices,
  );

  return {
    programs: uniqueValues(
      choices.map((choice) => choice.educationLevel).concat(row.levels),
    ),
    specialties: uniqueValues(choices.map((choice) => choice.programName)),
    universities: uniqueValues(
      choices.map((choice) =>
        choice.campusName
          ? `${choice.universityName} · ${choice.campusName}`
          : choice.universityName,
      ),
    ),
  };
}

function buildUniversityGroups(row: ApplicationRow): UniversityGroup[] {
  const groups = new Map<string, UniversityGroup>();

  for (const application of row.applications) {
    const choices: Array<ApplicationChoice | null> =
      application.choices.length > 0 ? application.choices : [null];

    for (const choice of choices) {
      const universityKey = choice?.universityId ?? `empty-${application.id}`;
      const group = groups.get(universityKey) ?? {
        city: choice?.universityCity ?? "",
        key: universityKey,
        name: choice?.universityName || "Universitet seçilməyib",
        programs: [],
      };
      const statusCode = choice?.statusCode ?? application.statusCode;

      group.programs.push({
        agent: application.agent,
        applicationCode: application.code,
        applicationId: application.id,
        campusName: choice?.campusName ?? "",
        createdAt: application.createdAt,
        key: `${application.id}:${choice?.id ?? "no-choice"}`,
        language: choice?.educationLanguage ?? "",
        manager: application.manager,
        period: application.period,
        priority: choice?.priority ?? 1,
        program: choice?.educationLevel || application.level,
        specialty: choice?.programName || "İxtisas seçilməyib",
        statusCode,
        statusLabel: choice?.statusCode
          ? APPLICATION_STATUS_LABELS[choice.statusCode]
          : application.status,
        updatedAt: application.updatedAt,
      });
      groups.set(universityKey, group);
    }
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    programs: group.programs.sort(
      (left, right) =>
        left.priority - right.priority ||
        left.specialty.localeCompare(right.specialty, "az"),
    ),
  }));
}

function formatSummary(values: string[]) {
  const visible = values.slice(0, 2);
  const remaining = Math.max(0, values.length - visible.length);

  if (visible.length === 0) return "—";

  return `${visible.join(", ")}${remaining > 0 ? `, +${remaining}` : ""}`;
}

function uniqueValues(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}
