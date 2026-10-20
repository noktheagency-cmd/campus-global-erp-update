"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  Building2Icon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleCheckBigIcon,
  CircleAlertIcon,
  Clock3Icon,
  FileWarningIcon,
  FileTextIcon,
  Globe2Icon,
  LayoutListIcon,
  MapPinIcon,
  PlusIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getApplicationStatusSurface } from "@/features/applications/application-status-tone";
import {
  ApplicationsDataList,
  ApplicationStatusBadge,
} from "@/features/applications/components/applications-data-list";
import { APPLICATION_STATUS_LABELS } from "@/features/applications/constants";
import { ApplicationsFilterToolbar } from "@/features/applications/components/applications-filter-toolbar";
import type {
  ApplicationRow,
  ApplicationStatus,
  ApplicationsDashboardData,
} from "@/features/applications/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function ApplicationsWorkspace({
  data,
  success,
  viewer = "workspace",
}: {
  data: ApplicationsDashboardData;
  success?: string;
  viewer?: "workspace" | "student";
}) {
  const isStudentView = viewer === "student";
  const hasActiveFilters =
    data.filters.query.length > 0 ||
    data.filters.completion !== "all" ||
    data.filters.studentName.length > 0 ||
    data.filters.passportNo.length > 0 ||
    data.filters.portalNo.length > 0 ||
    data.filters.applicationNo.length > 0 ||
    data.filters.status !== "all" ||
    data.filters.country !== "all" ||
    data.filters.periodId !== "all" ||
    data.filters.levelId !== "all" ||
    data.filters.agentId !== "all" ||
    data.filters.universityId !== "all" ||
    data.filters.programId !== "all" ||
    data.filters.managerId !== "all" ||
    data.filters.dateFrom.length > 0 ||
    data.filters.dateTo.length > 0;
  const resultLabel =
    data.pagination.totalItems > 0
      ? `${data.pagination.resultStart}-${data.pagination.resultEnd} / ${data.pagination.totalItems}`
      : "0 nəticə";
  const isTodayFilter =
    data.filters.dateFrom === data.metrics.todayDate &&
    data.filters.dateTo === data.metrics.todayDate;

  return (
    <div className="min-h-full bg-[#f6f9ff] px-3 py-3 sm:px-4 lg:px-6 lg:py-5">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black tracking-tight text-[#07183a]">
            {isStudentView ? "Mənim müraciətlərim" : "Müraciətlər"}
          </h1>
          <p className="mt-0.5 text-xs font-medium text-[#71809a]">
            {data.metrics.totalApplications} ümumi müraciət
          </p>
        </div>
        <Button
          asChild
          className="group h-11 shrink-0 rounded-[0.9rem] border border-[#3985ff] bg-gradient-to-br from-[#1671ff] to-[#0759e8] px-3 pr-4 text-xs font-extrabold shadow-[0_12px_26px_rgba(11,102,255,0.24)] transition hover:-translate-y-0.5 hover:from-[#0b66ff] hover:to-[#064fd0] hover:shadow-[0_16px_32px_rgba(11,102,255,0.3)]"
        >
          <Link href="/applications/new">
            <span className="flex size-7 items-center justify-center rounded-lg bg-white/16 ring-1 ring-white/20 transition group-hover:rotate-90">
              <PlusIcon className="size-4" />
            </span>
            {isStudentView ? "İndi müraciət et" : "Yeni müraciət"}
          </Link>
        </Button>
      </header>

      {success ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2Icon className="size-5 shrink-0" />
          {success === "application-submitted"
            ? "Müraciət təsdiqləndi."
            : "Müraciət draft olaraq saxlanıldı."}
        </div>
      ) : null}

      {data.dataSource === "unavailable" ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          <CircleAlertIcon className="mt-0.5 size-5 shrink-0" />
          Database bağlantısı aktiv deyil. Bu modul fake data göstərmir.
        </div>
      ) : null}

      <section className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <ApplicationKpiCard
          active={!hasActiveFilters}
          caption="Sistemdəki bütün müraciətlər"
          href="/applications"
          icon={LayoutListIcon}
          label="Bütün müraciətlər"
          tone="indigo"
          value={data.metrics.totalApplications}
        />
        <ApplicationKpiCard
          active={isTodayFilter}
          caption="Bu gün yaradılan müraciətlər"
          href={
            isTodayFilter
              ? "/applications"
              : `/applications?from=${data.metrics.todayDate}&to=${data.metrics.todayDate}`
          }
          icon={CalendarDaysIcon}
          label="Yeni müraciətlər"
          tone="blue"
          value={data.metrics.todayApplications}
        />
        <ApplicationKpiCard
          active={data.filters.completion === "completed"}
          caption="Qərarı yekunlaşan müraciətlər"
          href={
            data.filters.completion === "completed"
              ? "/applications"
              : "/applications?completion=completed"
          }
          icon={CircleCheckBigIcon}
          label="Tamamlanmış müraciətlər"
          tone="green"
          value={data.metrics.completedApplications}
        />
        <ApplicationKpiCard
          active={data.filters.completion === "incomplete"}
          caption="Hələ prosesdə olan müraciətlər"
          href={
            data.filters.completion === "incomplete"
              ? "/applications"
              : "/applications?completion=incomplete"
          }
          icon={Clock3Icon}
          label="Tamamlanmamış müraciətlər"
          tone="amber"
          value={data.metrics.incompleteApplications}
        />
        <ApplicationKpiCard
          active={data.filters.status === "INVALID_DOCUMENTS"}
          caption="Sənədlərində çatışmazlıq olanlar"
          href={
            data.filters.status === "INVALID_DOCUMENTS"
              ? "/applications"
              : "/applications?status=INVALID_DOCUMENTS"
          }
          icon={FileWarningIcon}
          label="Çatışmayan müraciətlər"
          tone="rose"
          value={data.metrics.missingApplications}
        />
      </section>

      <section className="mt-3 overflow-hidden rounded-[1.15rem] border border-[#dce6f4] bg-white shadow-[0_14px_36px_rgba(29,78,216,0.045)]">
        <ApplicationsFilterToolbar
          data={data}
          isStudentView={isStudentView}
          resultLabel={resultLabel}
        />

        {isStudentView ? (
          <StudentApplicationsTree
            hasActiveFilters={hasActiveFilters}
            rows={data.rows}
          />
        ) : data.rows.length > 0 ? (
          <ApplicationsDataList
            rows={data.rows}
            startIndex={data.pagination.resultStart}
          />
        ) : (
          <div className="p-4 sm:p-6">
            <EmptyApplicationsState hasActiveFilters={hasActiveFilters} />
          </div>
        )}
      </section>
    </div>
  );
}

type StudentApplicationCountryGroup = {
  key: string;
  country: string;
  flagCode: string;
  applicationCount: number;
  programCount: number;
  universities: StudentApplicationUniversityGroup[];
};

type StudentApplicationUniversityGroup = {
  key: string;
  name: string;
  city: string;
  country: string;
  applicationCount: number;
  programs: StudentApplicationProgramItem[];
};

type StudentApplicationProgramItem = {
  key: string;
  applicationId: string;
  applicationCode: string;
  educationLanguage: string;
  educationLevel: string;
  period: string;
  priority: number;
  programName: string;
  statusCode: ApplicationStatus;
  statusLabel: string;
  updatedAt: string;
};

type StudentApplicationCountryDraft = {
  key: string;
  country: string;
  flagCode: string;
  applicationIds: Set<string>;
  programCount: number;
  universities: Map<string, StudentApplicationUniversityDraft>;
};

type StudentApplicationUniversityDraft = {
  key: string;
  name: string;
  city: string;
  country: string;
  applicationIds: Set<string>;
  programs: StudentApplicationProgramItem[];
};

function StudentApplicationsTree({
  hasActiveFilters,
  rows,
}: {
  hasActiveFilters: boolean;
  rows: ApplicationRow[];
}) {
  const countryGroups = useMemo(
    () => buildStudentApplicationTree(rows),
    [rows],
  );
  const [openCountries, setOpenCountries] = useState<string[]>(() =>
    countryGroups[0] ? [countryGroups[0].key] : [],
  );
  const [openUniversities, setOpenUniversities] = useState<string[]>([]);

  if (countryGroups.length === 0) {
    return (
      <div className="mt-5 rounded-[1.2rem] border border-dashed border-[#dce6f4] bg-[#fbfdff] px-4 py-10">
        <EmptyApplicationsState
          hasActiveFilters={hasActiveFilters}
          viewer="student"
        />
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-3">
      {countryGroups.map((country) => {
        const isCountryOpen = openCountries.includes(country.key);

        return (
          <div
            className="overflow-hidden rounded-[1.15rem] border border-[#dce6f4] bg-white shadow-[0_10px_28px_rgba(29,78,216,0.04)]"
            key={country.key}
          >
            <button
              aria-expanded={isCountryOpen}
              className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-[#f8fbff] sm:px-4"
              onClick={() =>
                setOpenCountries((current) => toggleKey(current, country.key))
              }
              type="button"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#dce6f4] bg-[#f6f9ff] p-1.5">
                {country.flagCode ? (
                  <Image
                    alt={`${country.country} bayrağı`}
                    className="h-6 w-8 rounded-md object-cover shadow-sm"
                    height={24}
                    src={`https://flagcdn.com/w40/${country.flagCode}.png`}
                    unoptimized
                    width={40}
                  />
                ) : (
                  <Globe2Icon className="size-4 text-[#0b66ff]" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-black text-[#07183a] sm:text-base">
                    {country.country}
                  </span>
                  <Badge className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-black text-[#0b66ff]">
                    {country.applicationCount} müraciət
                  </Badge>
                </span>
                <span className="mt-1 block truncate text-xs font-bold text-[#71809f]">
                  {country.universities.length} universitet ·{" "}
                  {country.programCount} proqram
                </span>
              </span>
              <ChevronDownIcon
                className={cn(
                  "size-4 shrink-0 text-[#637392] transition-transform",
                  isCountryOpen && "rotate-180 text-[#0b66ff]",
                )}
              />
            </button>

            {isCountryOpen ? (
              <div className="border-t border-[#edf2f8] bg-[#fbfdff] px-2 py-2 sm:px-3">
                {country.universities.map((university) => {
                  const isUniversityOpen = openUniversities.includes(
                    university.key,
                  );

                  return (
                    <div
                      className="rounded-[1rem] border border-transparent"
                      key={university.key}
                    >
                      <button
                        aria-expanded={isUniversityOpen}
                        className="flex w-full items-center gap-3 rounded-[1rem] px-2.5 py-2.5 text-left transition hover:border-[#dce6f4] hover:bg-white sm:px-3"
                        onClick={() =>
                          setOpenUniversities((current) =>
                            toggleKey(current, university.key),
                          )
                        }
                        type="button"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#0b66ff] shadow-[0_6px_16px_rgba(29,78,216,0.08)]">
                          <Building2Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black text-[#07183a]">
                            {university.name}
                          </span>
                          <span className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs font-bold text-[#71809f]">
                            {university.city ? (
                              <span className="inline-flex min-w-0 items-center gap-1">
                                <MapPinIcon className="size-3 shrink-0" />
                                <span className="truncate">
                                  {university.city}
                                </span>
                              </span>
                            ) : null}
                            <span>{university.programs.length} proqram</span>
                            <span>{university.applicationCount} müraciət</span>
                          </span>
                        </span>
                        <ChevronDownIcon
                          className={cn(
                            "size-4 shrink-0 text-[#637392] transition-transform",
                            isUniversityOpen && "rotate-180 text-[#0b66ff]",
                          )}
                        />
                      </button>

                      {isUniversityOpen ? (
                        <div className="grid gap-2 px-2 pb-2 sm:px-3">
                          {university.programs.map((program) => (
                            <Link
                              className={cn(
                                "group grid gap-2 rounded-xl border border-l-4 px-3 py-2.5 transition hover:shadow-[0_10px_24px_rgba(29,78,216,0.08)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center",
                                getApplicationStatusSurface(program.statusCode),
                              )}
                              href={`/applications/${program.applicationId}`}
                              key={program.key}
                            >
                              <span className="min-w-0">
                                <span className="flex min-w-0 items-center gap-2">
                                  <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg bg-[#eef5ff] px-1.5 text-[11px] font-black text-[#0b66ff]">
                                    #{program.priority}
                                  </span>
                                  <span className="truncate text-sm font-black text-[#07183a] group-hover:text-[#0b66ff]">
                                    {program.programName}
                                  </span>
                                </span>
                                <span className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-bold text-[#71809f]">
                                  <span>{program.applicationCode}</span>
                                  {program.educationLevel ? (
                                    <span>{program.educationLevel}</span>
                                  ) : null}
                                  {program.educationLanguage ? (
                                    <span>{program.educationLanguage}</span>
                                  ) : null}
                                  {program.period ? (
                                    <span>{program.period}</span>
                                  ) : null}
                                </span>
                              </span>
                              <span className="flex items-center justify-between gap-2 sm:justify-end">
                                <ApplicationStatusBadge
                                  label={program.statusLabel}
                                  status={program.statusCode}
                                />
                                <span className="hidden text-[11px] font-bold text-[#8a97b4] sm:inline">
                                  {program.updatedAt}
                                </span>
                                <ArrowRightIcon className="size-4 text-[#8a97b4] transition group-hover:translate-x-0.5 group-hover:text-[#0b66ff]" />
                              </span>
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function buildStudentApplicationTree(
  rows: ApplicationRow[],
): StudentApplicationCountryGroup[] {
  const countries = new Map<string, StudentApplicationCountryDraft>();

  for (const row of rows) {
    for (const application of row.applications) {
      const choices =
        application.choices.length > 0 ? application.choices : [null];

      for (const choice of choices) {
        const countryName = normalizeCountryName(
          application.country || choice?.universityCountry,
        );
        const countryKey = normalizeCountryKey(countryName);
        const universityId = choice?.universityId ?? `empty-${application.id}`;
        const universityKey = `${countryKey}:${universityId}`;
        const universityName =
          choice?.universityName || "Universitet seçilməyib";
        const universityCity = choice?.universityCity ?? "";
        const effectiveStatus = choice?.statusCode ?? application.statusCode;
        const countryGroup =
          countries.get(countryKey) ??
          createCountryDraft(countryKey, countryName);

        countryGroup.applicationIds.add(application.id);
        countryGroup.programCount += 1;
        countries.set(countryKey, countryGroup);

        const universityGroup =
          countryGroup.universities.get(universityKey) ??
          createUniversityDraft({
            city: universityCity,
            country: countryName,
            key: universityKey,
            name: universityName,
          });

        universityGroup.applicationIds.add(application.id);
        universityGroup.programs.push({
          applicationCode: application.code,
          applicationId: application.id,
          educationLanguage: choice?.educationLanguage ?? "",
          educationLevel: choice?.educationLevel || application.level,
          key: `${application.id}:${choice?.id ?? "no-choice"}`,
          period: application.period,
          priority: choice?.priority ?? 1,
          programName: choice?.programName || "Proqram seçilməyib",
          statusCode: effectiveStatus,
          statusLabel: APPLICATION_STATUS_LABELS[effectiveStatus],
          updatedAt: application.updatedAt,
        });
        countryGroup.universities.set(universityKey, universityGroup);
      }
    }
  }

  return Array.from(countries.values()).map((country) => ({
    applicationCount: country.applicationIds.size,
    country: country.country,
    flagCode: country.flagCode,
    key: country.key,
    programCount: country.programCount,
    universities: Array.from(country.universities.values()).map(
      (university) => ({
        applicationCount: university.applicationIds.size,
        city: university.city,
        country: university.country,
        key: university.key,
        name: university.name,
        programs: [...university.programs].sort(
          (left, right) =>
            left.priority - right.priority ||
            left.programName.localeCompare(right.programName),
        ),
      }),
    ),
  }));
}

function createCountryDraft(
  key: string,
  country: string,
): StudentApplicationCountryDraft {
  return {
    applicationIds: new Set<string>(),
    country,
    flagCode: getCountryFlagCode(country),
    key,
    programCount: 0,
    universities: new Map<string, StudentApplicationUniversityDraft>(),
  };
}

function createUniversityDraft({
  city,
  country,
  key,
  name,
}: {
  city: string;
  country: string;
  key: string;
  name: string;
}): StudentApplicationUniversityDraft {
  return {
    applicationIds: new Set<string>(),
    city,
    country,
    key,
    name,
    programs: [],
  };
}

function toggleKey(keys: string[], key: string) {
  return keys.includes(key)
    ? keys.filter((currentKey) => currentKey !== key)
    : [...keys, key];
}

function normalizeCountryName(value?: string) {
  const trimmed = value?.trim();

  return trimmed || "Ölkə qeyd olunmayıb";
}

function normalizeCountryKey(value: string) {
  return value.trim().toLocaleLowerCase("az");
}

function normalizeCountryAsciiKey(value: string) {
  return normalizeCountryKey(value)
    .replaceAll("ə", "e")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ç", "c")
    .replaceAll("ğ", "g")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

const COUNTRY_FLAG_CODES: Record<string, string> = {
  almaniya: "de",
  amerika: "us",
  andorra: "ad",
  avstraliya: "au",
  australiya: "au",
  australia: "au",
  austria: "at",
  avstriya: "at",
  azerbaijan: "az",
  azərbaycan: "az",
  belçika: "be",
  belgium: "be",
  bolqarıstan: "bg",
  brazil: "br",
  braziliya: "br",
  bulgaria: "bg",
  canada: "ca",
  "cənubi koreya": "kr",
  çexiya: "cz",
  çin: "cn",
  danimarka: "dk",
  denmark: "dk",
  estonia: "ee",
  estoniya: "ee",
  finlandiya: "fi",
  finland: "fi",
  france: "fr",
  fransa: "fr",
  georgia: "ge",
  germany: "de",
  grecia: "gr",
  greece: "gr",
  "güney koreya": "kr",
  gürcüstan: "ge",
  hungary: "hu",
  hindistan: "in",
  hollandiya: "nl",
  irlandiya: "ie",
  ireland: "ie",
  ispaniya: "es",
  israil: "il",
  israel: "il",
  isveç: "se",
  isveçrə: "ch",
  macaristan: "hu",
  italy: "it",
  italiya: "it",
  kanada: "ca",
  latvia: "lv",
  latviya: "lv",
  litva: "lt",
  lithuania: "lt",
  niderland: "nl",
  norway: "no",
  norveç: "no",
  poland: "pl",
  polşa: "pl",
  portugal: "pt",
  portuqaliya: "pt",
  russia: "ru",
  rusiya: "ru",
  spain: "es",
  sweden: "se",
  switzerland: "ch",
  yunanıstan: "gr",
  turkey: "tr",
  türkiye: "tr",
  türkiyə: "tr",
  uk: "gb",
  ukrain: "ua",
  ukraine: "ua",
  ukrayna: "ua",
  usa: "us",
  yaponiya: "jp",
  japan: "jp",
  "amerika birləşmiş ştatları": "us",
  "birləşmiş krallıq": "gb",
  "birləşmiş ərəb əmirlikləri": "ae",
  "böyük britaniya": "gb",
  "czech republic": "cz",
  "great britain": "gb",
  "new zealand": "nz",
  "south korea": "kr",
  "united arab emirates": "ae",
  "united kingdom": "gb",
  "united states": "us",
  "united states of america": "us",
  "yeni zelandiya": "nz",
};

const NORMALIZED_COUNTRY_FLAG_CODES = Object.fromEntries(
  Object.entries(COUNTRY_FLAG_CODES).map(([country, code]) => [
    normalizeCountryAsciiKey(country),
    code,
  ]),
);

function getCountryFlagCode(country: string) {
  const key = normalizeCountryKey(country);
  const asciiKey = normalizeCountryAsciiKey(country);

  if (/^[a-z]{2}$/.test(asciiKey)) {
    return asciiKey;
  }

  return (
    COUNTRY_FLAG_CODES[key] ??
    COUNTRY_FLAG_CODES[asciiKey] ??
    NORMALIZED_COUNTRY_FLAG_CODES[asciiKey] ??
    ""
  );
}

function ApplicationKpiCard({
  active,
  caption,
  href,
  icon: Icon,
  label,
  tone,
  value,
}: {
  active: boolean;
  caption: string;
  href: string;
  icon: LucideIcon;
  label: string;
  tone: "amber" | "blue" | "green" | "indigo" | "rose";
  value: number;
}) {
  const toneClasses = {
    amber: {
      icon: "border-amber-200 bg-amber-50 text-amber-700",
    },
    blue: {
      icon: "border-blue-200 bg-blue-50 text-blue-700",
    },
    green: {
      icon: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    indigo: {
      icon: "border-indigo-200 bg-indigo-50 text-indigo-700",
    },
    rose: {
      icon: "border-rose-200 bg-rose-50 text-rose-700",
    },
  }[tone];

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative min-h-[72px] min-w-0 overflow-hidden rounded-[0.9rem] border border-[#dce5f1] bg-white px-3 py-2.5 transition-colors duration-150 hover:border-[#c4d1e2] hover:bg-[#fbfcfe] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b66ff]",
        active &&
          "border-[#8fb2e4] bg-[#f8fbff] shadow-[0_0_0_1px_rgba(11,102,255,0.08)]",
      )}
      href={href}
    >
      {active ? (
        <span className="absolute bottom-3 left-0 top-3 w-0.5 rounded-r bg-[#0b66ff]" />
      ) : null}
      <span className="flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
            toneClasses.icon,
          )}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold leading-[1.25] text-[#40516f]">
            {label}
          </span>
          <span className="mt-1 block truncate text-[9.5px] font-medium leading-none text-[#8a97af]">
            {caption}
          </span>
        </span>
        <span className="pt-0.5 text-[22px] font-extrabold leading-none tabular-nums tracking-tight text-[#13233f]">
          {value}
        </span>
      </span>
      <span className="sr-only">Filtrləmək üçün seç</span>
    </Link>
  );
}

function EmptyApplicationsState({
  hasActiveFilters,
  viewer = "workspace",
}: {
  hasActiveFilters: boolean;
  viewer?: "workspace" | "student";
}) {
  const isStudentView = viewer === "student";
  const title = hasActiveFilters
    ? "Filterə uyğun müraciət yoxdur"
    : isStudentView
      ? "Hələ müraciətiniz yoxdur"
      : "Müraciəti olan tələbə yoxdur";
  const description = hasActiveFilters
    ? "Filterləri təmizləyin və ya axtarış şərtlərini dəyişin."
    : isStudentView
      ? "İlk müraciətinizi yaradın və universitet seçimlərinizi buradan izləyin."
      : "İlk müraciəti yaradın və tələbənin bütün müraciət axınını ERP-də izləyin.";

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#0b66ff]">
        <FileTextIcon />
      </div>
      <div>
        <div className="font-black text-[#07183a]">{title}</div>
        <p className="mt-1 text-sm text-[#637392]">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {hasActiveFilters ? (
          <Button
            asChild
            className="h-9 rounded-xl border-[#dce6f4] bg-white px-3 text-xs font-black text-[#34456c] hover:bg-[#f6f9ff] hover:text-[#0b66ff]"
            size="sm"
            variant="outline"
          >
            <Link href="/applications">Filterləri təmizlə</Link>
          </Button>
        ) : null}
        <Button
          asChild
          className="h-9 rounded-xl bg-[#0b66ff] px-3 text-xs font-black hover:bg-[#075be8]"
          size="sm"
        >
          <Link href="/applications/new">
            <PlusIcon data-icon="inline-start" />
            {isStudentView ? "Müraciət et" : "Yeni müraciət"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
