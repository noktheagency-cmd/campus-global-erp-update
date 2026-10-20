"use client";

import {
  ChevronDownIcon,
  ClipboardCopyIcon,
  DatabaseIcon,
  DownloadIcon,
  EyeIcon,
  FileDownIcon,
  FilePlus2Icon,
  GraduationCapIcon,
  Globe2Icon,
  LandmarkIcon,
  LibraryBigIcon,
  MoreVerticalIcon,
  PlusIcon,
  PrinterIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import { useMemo, useOptimistic, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import type { UniversitiesDashboardData } from "@/features/universities/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const metricCardConfigs = [
  {
    key: "totalUniversities",
    label: "Cəmi universitet",
    detail: "Aktiv universitet profilleri",
    icon: LandmarkIcon,
    color: "#0b66ff",
  },
  {
    key: "activePartnerships",
    label: "Aktiv tərəfdaş",
    detail: "Tərəfdaşlıq statusu aktivdir",
    icon: GraduationCapIcon,
    color: "#22c55e",
  },
  {
    key: "activePrograms",
    label: "Aktiv proqram",
    detail: "Seçim üçün hazır proqramlar",
    icon: LibraryBigIcon,
    color: "#7c3aed",
  },
  {
    key: "activeApplications",
    label: "Aktiv müraciət",
    detail: "İcrada olan müraciətlər",
    icon: UserRoundIcon,
    color: "#f97316",
  },
] as const;

const legacyTableRows = [
  {
    name: "Istanbul Aydin University",
    location: "Türkiyə, Istanbul",
    logoAccessUrl: null,
    logoUrl: null,
    type: "Hazırlıq",
    partner: "Aktiv",
    agreement: "Aktiv",
    programs: 530,
    contact: "Beynəlxalq ofis",
    status: "Aktiv",
    updated: "Jun 3, 2026",
  },
  {
    name: "Bahçeşehir University",
    location: "Türkiyə, Istanbul",
    logoAccessUrl: null,
    logoUrl: null,
    type: "Hazırlıq",
    partner: "Aktiv",
    agreement: "Yenilənmə",
    programs: 420,
    contact: "Qəbul komandas?",
    status: "Aktiv",
    updated: "May 29, 2026",
  },
  {
    name: "University of Europe for Applied Sciences",
    location: "Almaniya, Berlin",
    logoAccessUrl: null,
    logoUrl: null,
    type: "Özəl",
    partner: "Namizəd",
    agreement: "Gözləmədə",
    programs: 180,
    contact: "Regional qəbul",
    status: "Aktiv",
    updated: "May 21, 2026",
  },
  {
    name: "University of Toronto",
    location: "Kanada, Toronto",
    logoAccessUrl: null,
    logoUrl: null,
    type: "Dövlət",
    partner: "Aktiv",
    agreement: "Aktiv",
    programs: 380,
    contact: "Michael Chen",
    status: "Aktiv",
    updated: "May 5, 2026",
  },
  {
    name: "University College London",
    location: "Birləşmiş Krallıq, London",
    logoAccessUrl: null,
    logoUrl: null,
    type: "Dövlət",
    partner: "Aktiv",
    agreement: "Müddəti yaxında bitir",
    programs: 310,
    contact: "Emma Johnson",
    status: "Aktiv",
    updated: "May 4, 2026",
  },
  {
    name: "Monash University",
    location: "Avstraliya, Melbourne",
    logoAccessUrl: null,
    logoUrl: null,
    type: "Dövlət",
    partner: "Aktiv",
    agreement: "Aktiv",
    programs: 290,
    contact: "David Williams",
    status: "Aktiv",
    updated: "May 3, 2026",
  },
];

function buildMetricCards(metrics: UniversitiesDashboardData["metrics"]) {
  return metricCardConfigs.map((metric) => ({
    ...metric,
    value: metrics[metric.key].toString(),
  }));
}

export function UniversitiesWorkspace({
  data,
  readOnly = false,
  readOnlyPortalType = "student",
}: {
  data: UniversitiesDashboardData;
  readOnly?: boolean;
  readOnlyPortalType?: "agent" | "student";
}) {
  const tableRows = useMemo(
    () =>
      data.tableRows.length > 0
        ? data.tableRows
        : legacyTableRows.map((row, index) => ({
            ...row,
            id: `legacy-${index}`,
            country: row.location.split(",")[0] ?? "",
            city: row.location.split(",").slice(1).join(",").trim(),
          })),
    [data.tableRows],
  );
  const universityCountryGroups = useMemo(
    () => groupUniversitiesByCountry(tableRows),
    [tableRows],
  );
  const programCountryGroups = useMemo(
    () => groupProgramsByCountry(data.programRows),
    [data.programRows],
  );
  const metricCards = buildMetricCards(data.metrics);
  const isProgramsView = data.view === "programs";
  const [optimisticView, setOptimisticView] = useOptimistic(data.view);
  const [isViewTransitionGözləmədə, startViewTransition] = useTransition();
  const [openUniversityCountryKeys, setOpenUniversityCountryKeys] = useState<
    Set<string>
  >(
    () =>
      new Set(
        universityCountryGroups[0] ? [universityCountryGroups[0].key] : [],
      ),
  );
  const [openProgramCountryKeys, setOpenProgramCountryKeys] = useState<
    Set<string>
  >(
    () => new Set(programCountryGroups[0] ? [programCountryGroups[0].key] : []),
  );
  const openUniversityCountries = useMemo(
    () =>
      reconcileOpenCountryKeys(
        openUniversityCountryKeys,
        universityCountryGroups,
      ),
    [openUniversityCountryKeys, universityCountryGroups],
  );
  const openProgramCountries = useMemo(
    () =>
      reconcileOpenCountryKeys(openProgramCountryKeys, programCountryGroups),
    [openProgramCountryKeys, programCountryGroups],
  );
  const isViewSwitching =
    isViewTransitionGözləmədə || optimisticView !== data.view;
  const activeFilters = isProgramsView
    ? getProgramAktivFilters(data)
    : getAktivFilters(data);
  const hasAdvancedFiltersApplied = isProgramsView
    ? hasProgramAdvancedFilters()
    : hasAdvancedFilters(data.filters);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(
    !isProgramsView && hasAdvancedFiltersApplied,
  );
  const totalResults = isProgramsView
    ? data.programPagination.totalItems
    : data.pagination.totalItems;
  const readOnlyLabel =
    readOnlyPortalType === "agent"
      ? "Yalnız oxunan agent görünüşü"
      : "Yalnız oxunan tələbə görünüşü";

  function handleViewIntent(view: UniversitiesDashboardData["view"]) {
    startViewTransition(() => {
      setOptimisticView(view);
    });
  }

  function toggleUniversityCountry(countryKey: string) {
    setOpenUniversityCountryKeys((current) => {
      const next = new Set(
        reconcileOpenCountryKeys(current, universityCountryGroups),
      );
      if (next.has(countryKey)) {
        next.delete(countryKey);
      } else {
        next.add(countryKey);
      }
      return next;
    });
  }

  function toggleProgramCountry(countryKey: string) {
    setOpenProgramCountryKeys((current) => {
      const next = new Set(
        reconcileOpenCountryKeys(current, programCountryGroups),
      );
      if (next.has(countryKey)) {
        next.delete(countryKey);
      } else {
        next.add(countryKey);
      }
      return next;
    });
  }

  function exportRows(format: "csv" | "json") {
    if (isProgramsView) {
      const filePrefix = "campus-global-programs";
      const jsonContent = JSON.stringify(data.programRows, null, 2);

      if (format === "json") {
        downloadFile(`${filePrefix}.json`, jsonContent, "application/json");
        return;
      }

      downloadFile(
        `${filePrefix}.csv`,
        programsToCsv(data.programRows),
        "text/csv;charset=utf-8",
      );
      return;
    }

    const filePrefix = "campus-global-universities";
    const csvContent = toCsv(tableRows);
    const jsonContent = JSON.stringify(tableRows, null, 2);

    if (format === "json") {
      downloadFile(`${filePrefix}.json`, jsonContent, "application/json");
      return;
    }

    downloadFile(`${filePrefix}.csv`, csvContent, "text/csv;charset=utf-8");
  }

  return (
    <div className="min-h-full bg-[#f4f7fb] px-5 py-4 lg:px-8 lg:py-5">
      <header className="rounded-[1.25rem] border border-[#dce6f4] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.045)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 max-w-3xl">
            <h1 className="text-[1.65rem] font-black leading-tight tracking-tight text-[#07183a] sm:text-[1.9rem]">
              Universitetlər
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap xl:justify-end">
            {readOnly ? (
              <Badge className="rounded-full border border-blue-100 bg-[#e8f1ff] px-4 py-2 text-xs font-bold text-[#0b66ff]">
                {readOnlyLabel}
              </Badge>
            ) : (
              <>
                <Button
                  asChild
                  className="h-10 rounded-[0.85rem] bg-[#0b66ff] px-4 text-[12px] font-bold shadow-[0_10px_22px_rgba(37,99,235,0.18)] transition-all duration-300 hover:bg-[#075be8]"
                >
                  <Link href="/universities/new">
                    <PlusIcon data-icon="inline-start" />
                    Universitet əlavə et
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 rounded-[0.85rem] border-[#dce6f4] bg-white px-3 text-[12px] font-bold text-[#24365f] shadow-[0_4px_12px_rgba(36,54,95,0.02)] transition-all duration-300 hover:border-[#0b66ff]/30"
                    >
                      <DownloadIcon data-icon="inline-start" />
                      İxrac
                      <ChevronDownIcon data-icon="inline-end" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-[1.25rem] border-[#dce6f4] p-2 shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
                  >
                    <DropdownMenuItem
                      className="rounded-xl font-semibold"
                      onSelect={() => exportRows("csv")}
                    >
                      <FileDownIcon data-icon="inline-start" />
                      CSV ixrac et
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="rounded-xl font-semibold"
                      onSelect={() => exportRows("json")}
                    >
                      <DatabaseIcon data-icon="inline-start" />
                      JSON ixrac et
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="rounded-xl font-semibold"
                      onSelect={() => window.print()}
                    >
                      <PrinterIcon data-icon="inline-start" />
                      Çap görünüşü
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Metrics Section */}
      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      {/* Filters Section */}
      <section className="mt-4 rounded-[1.15rem] border border-[#dce6f4] bg-white p-3 shadow-[0_12px_28px_rgba(15,23,42,0.035)] lg:p-4">
        <form action="/universities" className="flex flex-col gap-3">
          {isProgramsView ? (
            <input name="view" type="hidden" value="programs" />
          ) : null}
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-[13px] font-black uppercase tracking-[0.02em] text-[#07183a]">
                Filtr paneli
              </h2>
              <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#6b7897]">
                {isProgramsView
                  ? "Proqramlar üzrə sürətli axtarış və seçimlər."
                  : "Universitetləri ölkə, proqram və dil üzrə daraldın."}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <ViewSwitch
                view={optimisticView}
                onViewIntent={handleViewIntent}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border border-[#dce6f4] bg-[#f8fafc] px-3 py-1 text-[11px] font-bold text-[#34456c]">
                  {totalResults} nəticə
                </Badge>
                <Badge className="rounded-full border border-[#dce6f4] bg-white px-3 py-1 text-[11px] font-bold text-[#34456c]">
                  {activeFilters.length} aktiv filtr
                </Badge>
                {!isProgramsView ? (
                  <Button
                    variant="outline"
                    className="h-8 rounded-[0.75rem] border-[#dce6f4] bg-white px-3 text-[11px] font-black text-[#34456c] transition duration-300 hover:bg-[#f6f9ff] hover:text-[#0b66ff]"
                    aria-expanded={showAdvancedFilters}
                    onClick={() => setShowAdvancedFilters((value) => !value)}
                    type="button"
                  >
                    <SlidersHorizontalIcon data-icon="inline-start" />
                    {showAdvancedFilters ? "Gizlet" : "Ətraflı filtr"}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {isProgramsView ? (
            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(240px,1fr)_minmax(180px,0.8fr)_minmax(160px,0.65fr)_minmax(160px,0.65fr)_minmax(160px,0.65fr)_auto] 2xl:items-end">
              <FilterTextInput
                hideLabel
                icon={SearchIcon}
                label="Axtaris"
                name="q"
                placeholder="Universitet, şəhər, ölkə..."
                value={data.programFilters.query}
              />
              <FilterSelect
                label="Proqram"
                name="program"
                options={[
                  { label: "Bütün proqramlar", value: "all" },
                  ...data.filterOptions.programs.map((program) => ({
                    label: program,
                    value: program,
                  })),
                ]}
                value={data.programFilters.program}
              />
              <FilterSelect
                label="Ölkə"
                name="country"
                options={[
                  { label: "Bütün ölkələr", value: "all" },
                  ...data.filterOptions.countries.map((country) => ({
                    label: country,
                    value: country,
                  })),
                ]}
                value={data.programFilters.country}
              />
              <FilterSelect
                label="Təhsil dili"
                name="language"
                options={[
                  { label: "Bütün dillər", value: "all" },
                  ...data.filterOptions.educationLanguages.map((language) => ({
                    label: language,
                    value: language,
                  })),
                ]}
                value={data.programFilters.language}
              />
              <FilterSelect
                label="Təhsil pilləsi"
                name="level"
                options={[
                  { label: "Bütün pillələr", value: "all" },
                  ...data.filterOptions.educationLevels.map((level) => ({
                    label: level,
                    value: level,
                  })),
                ]}
                value={data.programFilters.level}
              />
              <FilterActions resetHref="/universities?view=programs" />
            </div>
          ) : (
            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(280px,1.15fr)_minmax(170px,0.55fr)_minmax(220px,0.8fr)_minmax(190px,0.65fr)_auto] 2xl:items-end">
              <UniversitySearchInput
                options={data.filterOptions.programUniversities}
                value={data.filters.query}
              />
              <FilterSelect
                label="Ölkə"
                name="country"
                options={[
                  { label: "Bütün ölkələr", value: "all" },
                  ...data.filterOptions.countries.map((country) => ({
                    label: country,
                    value: country,
                  })),
                ]}
                value={data.filters.country}
              />
              <FilterSelect
                label="Proqram"
                name="program"
                options={[
                  { label: "Bütün proqramlar", value: "all" },
                  ...data.filterOptions.programs.map((program) => ({
                    label: program,
                    value: program,
                  })),
                ]}
                value={data.filters.program}
              />
              <FilterSelect
                label="Təhsil dili"
                name="language"
                options={[
                  { label: "Bütün dillər", value: "all" },
                  ...data.filterOptions.educationLanguages.map((language) => ({
                    label: language,
                    value: language,
                  })),
                ]}
                value={data.filters.language}
              />
              <FilterActions resetHref="/universities" />
            </div>
          )}

          {activeFilters.length > 0 ? (
            <div className="flex flex-col gap-2 rounded-[0.95rem] border border-[#edf2f8] bg-[#fbfdff] px-3 py-2 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
                <span className="text-[10px] font-black uppercase tracking-normal text-slate-500">
                  Tetbiq edilenler
                </span>
                {activeFilters.map((filter) => (
                  <FilterPill key={filter.label} tone={filter.tone}>
                    {filter.label}
                  </FilterPill>
                ))}
              </div>
            </div>
          ) : null}

          {!showAdvancedFilters && !isProgramsView ? (
            <HiddenAdvancedFilterFields filters={data.filters} />
          ) : null}
          {showAdvancedFilters && !isProgramsView ? (
            <div className="grid gap-3 rounded-[1.35rem] border border-[#dce6f4]/70 bg-[#f7faff] p-3 md:grid-cols-2">
              <AdvancedFilterGroup label="Mekan">
                <FilterSelect
                  label="Şəhər"
                  name="city"
                  options={[
                    { label: "Bütün şəhərlər", value: "all" },
                    ...data.filterOptions.cities.map((city) => ({
                      label: city,
                      value: city,
                    })),
                  ]}
                  value={data.filters.city}
                />
                <FilterTextInput
                  icon={UserRoundIcon}
                  label="Kontakt"
                  name="contact"
                  placeholder="Ad, e-poçt, telefon..."
                  value={data.filters.contactQuery}
                />
              </AdvancedFilterGroup>
              <AdvancedFilterGroup label="Sıralama">
                <FilterSelect
                  label="Sıralama"
                  name="sort"
                  options={[
                    { label: "Son yenilənənlər", value: "updated-desc" },
                    { label: "Ad A-Z", value: "name-asc" },
                    { label: "Ən çox proqram", value: "programs-desc" },
                  ]}
                  value={data.filters.sort}
                />
              </AdvancedFilterGroup>
            </div>
          ) : null}
        </form>
      </section>

      {/* Table Card */}
      <div
        aria-busy={isViewSwitching}
        className={cn(
          "transition-opacity duration-150",
          isViewSwitching && "opacity-70",
        )}
      >
        {isProgramsView ? (
          <ProgramsRegistryCard
            groups={programCountryGroups}
            onToggleCountry={toggleProgramCountry}
            openCountries={openProgramCountries}
          />
        ) : (
          <Card className="mt-4 overflow-hidden rounded-[1.35rem] border-[#dce6f4] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
            <CardContent className="p-0">
              <div className="max-h-[min(64vh,760px)] overflow-y-auto overscroll-contain">
                <UniversitiesCountryList
                  groups={universityCountryGroups}
                  onToggleCountry={toggleUniversityCountry}
                  openCountries={openUniversityCountries}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

type UniversityRegistryRow = UniversitiesDashboardData["tableRows"][number];
type ProgramRegistryRow = UniversitiesDashboardData["programRows"][number];

type CountryPresentation = {
  accent: string;
  borderAccent: string;
  flagIsoCode: string | null;
  label: string;
  softAccent: string;
};

type UniversityCountryGroup = {
  key: string;
  presentation: CountryPresentation;
  programCount: number;
  rows: UniversityRegistryRow[];
  universityCount: number;
};

type ProgramCountryGroup = {
  key: string;
  minTuitionLabel: string;
  periodSummary: string;
  presentation: CountryPresentation;
  programCount: number;
  rows: ProgramRegistryRow[];
  universityCount: number;
};

function UniversitiesCountryList({
  groups,
  onToggleCountry,
  openCountries,
}: {
  groups: UniversityCountryGroup[];
  onToggleCountry: (countryKey: string) => void;
  openCountries: Set<string>;
}) {
  if (groups.length === 0) {
    return (
      <RegistryEmptyState
        resetHref="/universities"
        text="Filterləri dəyişin və ya siyahını sıfırlayın."
        title="Bu axtarışa uyğun universitet yoxdur"
      />
    );
  }

  return (
    <div className="divide-y divide-[#edf2f8]">
      {groups.map((group) => {
        const isOpen = openCountries.has(group.key);

        return (
          <section
            key={group.key}
            className="border-l-2 bg-white"
            style={{ borderLeftColor: group.presentation.accent }}
          >
            <CountryAccordionHeader
              isOpen={isOpen}
              onToggle={() => onToggleCountry(group.key)}
              presentation={group.presentation}
              primaryMeta={`${group.universityCount} universitet`}
              secondaryMeta={`${group.programCount} proqram`}
              tertiaryMeta="Aktiv proqramlar"
            />
            {isOpen ? (
              <div className="border-t border-[#edf2f8] bg-[#fbfdff]">
                <div className="hidden grid-cols-[minmax(280px,1.35fr)_minmax(120px,0.5fr)_minmax(110px,0.35fr)_minmax(200px,0.8fr)_minmax(112px,0.45fr)_auto] gap-4 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.02em] text-[#71809f] lg:grid">
                  <span>Universitet</span>
                  <span>Şəhər</span>
                  <span className="text-right">Proqramlar</span>
                  <span>Əsas kontakt</span>
                  <span>Yenilənmə</span>
                  <span className="text-right">Əməliyyatlar</span>
                </div>
                <div className="divide-y divide-[#edf2f8] bg-white">
                  {group.rows.map((row) => (
                    <UniversityRegistryItem key={row.id} row={row} />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function ProgramsCountryList({
  groups,
  onToggleCountry,
  openCountries,
}: {
  groups: ProgramCountryGroup[];
  onToggleCountry: (countryKey: string) => void;
  openCountries: Set<string>;
}) {
  if (groups.length === 0) {
    return (
      <RegistryEmptyState
        resetHref="/universities?view=programs"
        text="Filterləri dəyişin və ya proqram siyahısını sıfırlayın."
        title="Bu axtarışa uyğun proqram yoxdur"
      />
    );
  }

  return (
    <div className="divide-y divide-[#edf2f8]">
      {groups.map((group) => {
        const isOpen = openCountries.has(group.key);

        return (
          <section
            key={group.key}
            className="border-l-2 bg-white"
            style={{ borderLeftColor: group.presentation.accent }}
          >
            <CountryAccordionHeader
              isOpen={isOpen}
              onToggle={() => onToggleCountry(group.key)}
              presentation={group.presentation}
              primaryMeta={`${group.programCount} proqram`}
              secondaryMeta={`${group.universityCount} universitet`}
              tertiaryMeta={`${group.periodSummary} · ${group.minTuitionLabel}`}
            />
            {isOpen ? (
              <div className="border-t border-[#edf2f8] bg-[#fbfdff]">
                <div className="hidden grid-cols-[minmax(220px,1.2fr)_minmax(150px,0.75fr)_minmax(110px,0.5fr)_minmax(110px,0.5fr)_minmax(96px,0.42fr)_minmax(84px,0.35fr)_minmax(96px,0.38fr)_32px] gap-3 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.02em] text-[#71809f] xl:grid">
                  <span>Proqram</span>
                  <span>Universitet</span>
                  <span>Pillə / Dil</span>
                  <span>Kampus</span>
                  <span className="text-right">Təhsil haqqı</span>
                  <span className="text-right">Endirim</span>
                  <span>Qəbul dövrü</span>
                  <span className="text-right">Əməliyyatlar</span>
                </div>
                <div className="divide-y divide-[#edf2f8] bg-white">
                  {group.rows.map((row) => (
                    <ProgramRegistryItem key={row.id} row={row} />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function CountryAccordionHeader({
  isOpen,
  onToggle,
  presentation,
  primaryMeta,
  secondaryMeta,
  tertiaryMeta,
}: {
  isOpen: boolean;
  onToggle: () => void;
  presentation: CountryPresentation;
  primaryMeta: string;
  secondaryMeta: string;
  tertiaryMeta: string;
}) {
  return (
    <button
      aria-expanded={isOpen}
      className="group flex w-full flex-col gap-3 px-4 py-3 text-left transition duration-200 hover:bg-[#f7faff] sm:flex-row sm:items-center sm:justify-between sm:px-5"
      data-country-accordion="true"
      onClick={onToggle}
      type="button"
    >
      <div className="flex min-w-0 items-center gap-3">
        <CountryFlagMark presentation={presentation} />
        <div className="min-w-0">
          <div className="truncate text-[15px] font-black text-[#07183a]">
            {presentation.label}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-[#6b7897]">
            Ölkə üzrə qruplaşdırılmış nəticələr
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <RegistryStatPill>{primaryMeta}</RegistryStatPill>
        <RegistryStatPill>{secondaryMeta}</RegistryStatPill>
        <RegistryStatPill tone="green">{tertiaryMeta}</RegistryStatPill>
        <span className="flex size-8 items-center justify-center rounded-lg border border-[#dce6f4] bg-white text-[#34456c] transition duration-200 group-hover:border-[#0b66ff]/30 group-hover:text-[#0b66ff]">
          <ChevronDownIcon
            className={cn(
              "size-4 transition duration-200",
              isOpen && "rotate-180",
            )}
          />
        </span>
      </div>
    </button>
  );
}

function CountryFlagMark({
  presentation,
}: {
  presentation: CountryPresentation;
}) {
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full border text-lg shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
      style={{
        backgroundColor: presentation.softAccent,
        borderColor: presentation.borderAccent,
        color: presentation.accent,
      }}
    >
      {presentation.flagIsoCode ? (
        <span
          aria-label={`${presentation.label} bayragi`}
          className="block h-[18px] w-6 overflow-hidden rounded-[5px] border border-white/90 bg-cover bg-center bg-no-repeat shadow-sm ring-1 ring-black/10"
          role="img"
          style={{
            backgroundImage: `url("https://flagcdn.com/${presentation.flagIsoCode}.svg")`,
          }}
        />
      ) : (
        <Globe2Icon className="size-4" />
      )}
    </span>
  );
}

function UniversityRegistryItem({ row }: { row: UniversityRegistryRow }) {
  return (
    <div className="grid gap-3 px-4 py-3 transition duration-200 hover:bg-[#f8fbff] sm:px-5 lg:grid-cols-[minmax(280px,1.35fr)_minmax(120px,0.5fr)_minmax(110px,0.35fr)_minmax(200px,0.8fr)_minmax(112px,0.45fr)_auto] lg:items-center lg:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <UniversityLogoMark row={row} />
        <div className="min-w-0">
          <Link
            className="block truncate text-[14px] font-bold text-[#102246] transition hover:text-[#0b66ff]"
            href={`/universities/${row.id}`}
          >
            {row.name}
          </Link>
          <div className="mt-0.5 truncate text-[11px] font-semibold text-[#6b7897]">
            {row.type}
          </div>
        </div>
      </div>
      <RegistryValue label="Şəhər" value={row.city || row.location} />
      <RegistryValue
        align="right"
        label="Proqramlar"
        strong
        value={row.programs}
      />
      <RegistryValue label="Əsas kontakt" value={row.contact} />
      <RegistryValue label="Yenilənmə" value={row.updated} />
      <div className="flex justify-start lg:justify-end">
        <UniversityActions row={row} />
      </div>
    </div>
  );
}

function ProgramRegistryItem({ row }: { row: ProgramRegistryRow }) {
  return (
    <div className="grid gap-3 px-4 py-3 transition duration-200 hover:bg-[#f8fbff] sm:px-5 xl:grid-cols-[minmax(220px,1.2fr)_minmax(150px,0.75fr)_minmax(110px,0.5fr)_minmax(110px,0.5fr)_minmax(96px,0.42fr)_minmax(84px,0.35fr)_minmax(96px,0.38fr)_32px] xl:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#0b66ff]/10 bg-[#eef5ff] text-[#0b66ff]">
          <LibraryBigIcon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <Link
            className="block truncate text-[14px] font-bold text-[#102246] transition hover:text-[#0b66ff]"
            href={`/universities/${row.universityId}?tab=programs`}
          >
            {row.name}
          </Link>
          <div className="mt-0.5 truncate text-[11px] font-semibold text-[#6b7897]">
            {row.duration} / {row.studyMode}
          </div>
        </div>
      </div>
      <RegistryValue
        hideLabelAt="xl"
        label="Universitet"
        value={
          <>
            <span className="block truncate">{row.universityName}</span>
            <span className="mt-0.5 block truncate text-[11px] font-semibold text-[#6b7897]">
              {row.city}
            </span>
          </>
        }
      />
      <RegistryValue
        hideLabelAt="xl"
        label="Pillə / Dil"
        value={
          <>
            <span className="block">{row.level}</span>
            <span className="mt-0.5 block text-[11px] font-semibold text-[#6b7897]">
              {row.language}
            </span>
          </>
        }
      />
      <RegistryValue hideLabelAt="xl" label="Kampus" value={row.campus} />
      <RegistryValue
        align="right"
        hideLabelAt="xl"
        label="Təhsil haqqı"
        strong
        value={formatTableMoney(row.tuitionFee, row.currency)}
      />
      <RegistryValue
        align="right"
        hideLabelAt="xl"
        label="Endirim"
        tone="green"
        value={
          row.discountedTuitionFee
            ? formatTableMoney(row.discountedTuitionFee, row.currency)
            : "-"
        }
      />
      <RegistryValue hideLabelAt="xl" label="Qəbul dövrü" value={row.period} />
      <div className="flex justify-start xl:justify-end">
        <ProgramActions row={row} />
      </div>
    </div>
  );
}

function RegistryValue({
  align = "left",
  hideLabelAt = "lg",
  label,
  strong = false,
  tone = "default",
  value,
}: {
  align?: "left" | "right";
  hideLabelAt?: "lg" | "xl";
  label: string;
  strong?: boolean;
  tone?: "default" | "green";
  value: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-w-0",
        align === "right" && "lg:text-right xl:text-right",
      )}
    >
      <div
        className={cn(
          "mb-1 text-[10px] font-black uppercase tracking-[0.02em] text-[#8a98b4]",
          hideLabelAt === "lg" ? "lg:hidden" : "xl:hidden",
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "min-w-0 truncate text-[13px] font-semibold text-[#334568]",
          strong && "font-black text-[#07183a]",
          tone === "green" && "text-[#129344]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function UniversityActions({ row }: { row: UniversityRegistryRow }) {
  return (
    <Button
      asChild
      className="rounded-xl border-[#dce6f4] bg-white text-[#34456c] shadow-[0_6px_16px_rgba(15,23,42,0.04)] transition hover:border-[#0b66ff]/35 hover:bg-[#eef5ff] hover:text-[#0b66ff]"
      size="icon-sm"
      variant="outline"
    >
      <Link
        aria-label={`${row.name} detalına bax`}
        href={`/universities/${row.id}`}
      >
        <EyeIcon />
      </Link>
    </Button>
  );
}

function ProgramActions({ row }: { row: ProgramRegistryRow }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Əməliyyatlar">
          <MoreVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-44 rounded-2xl border-[#dce6f4]"
      >
        <DropdownMenuItem asChild>
          <Link href={`/universities/${row.universityId}?tab=programs`}>
            <EyeIcon data-icon="inline-start" />
            Proqramı aç
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={buildApplicationPrefillHref({
              programId: row.id,
              tuitionId: row.tuitionId,
              universityId: row.universityId,
            })}
          >
            <FilePlus2Icon data-icon="inline-start" />
            Müraciət et
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            navigator.clipboard?.writeText(
              `${row.name} - ${row.universityName}`,
            )
          }
        >
          <ClipboardCopyIcon data-icon="inline-start" />
          Proqramı kopyala
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RegistryStatPill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "green";
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-black",
        tone === "green"
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-[#dce6f4] bg-white text-[#34456c]",
      )}
    >
      {children}
    </span>
  );
}

function RegistryEmptyState({
  resetHref,
  text,
  title,
}: {
  resetHref: string;
  text: string;
  title: string;
}) {
  return (
    <div className="flex min-h-48 items-center justify-center px-5 py-10 text-center">
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-sm text-[#637392]">
        <div className="flex size-10 items-center justify-center rounded-full bg-[#eef5ff] text-[#0b66ff]">
          <SearchIcon />
        </div>
        <div>
          <div className="font-bold text-[#07183a]">{title}</div>
          <div className="mt-1 text-xs leading-5">{text}</div>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={resetHref}>Filterləri sıfırla</Link>
        </Button>
      </div>
    </div>
  );
}

function UniversityLogoMark({
  row,
}: {
  row: UniversitiesDashboardData["tableRows"][number];
}) {
  const logoUrl = row.logoAccessUrl ?? row.logoUrl;

  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#0b66ff]/10 bg-gradient-to-br from-[#0b66ff]/10 to-[#0b66ff]/5 text-[#0b66ff]">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="size-full object-contain p-1"
          loading="lazy"
          src={logoUrl}
        />
      ) : (
        <LandmarkIcon className="size-4.5" />
      )}
    </div>
  );
}

function ViewSwitch({
  onViewIntent,
  view,
}: {
  onViewIntent: (view: UniversitiesDashboardData["view"]) => void;
  view: UniversitiesDashboardData["view"];
}) {
  return (
    <div className="grid grid-cols-2 rounded-[1.15rem] border border-[#dce6f4] bg-[#f7faff] p-1">
      <Button
        asChild
        className={cn(
          "h-9 rounded-[0.9rem] px-4 text-[12px] font-black",
          view === "universities"
            ? "bg-[#0b66ff] text-white shadow-[0_10px_22px_rgba(37,99,235,0.20)] hover:bg-[#0b66ff]"
            : "bg-transparent text-[#506283] hover:bg-white hover:text-[#0b66ff]",
        )}
        variant="ghost"
      >
        <Link href="/universities" onClick={() => onViewIntent("universities")}>
          <LandmarkIcon data-icon="inline-start" />
          Universitetlər
        </Link>
      </Button>
      <Button
        asChild
        className={cn(
          "h-9 rounded-[0.9rem] px-4 text-[12px] font-black",
          view === "programs"
            ? "bg-[#0b66ff] text-white shadow-[0_10px_22px_rgba(37,99,235,0.20)] hover:bg-[#0b66ff]"
            : "bg-transparent text-[#506283] hover:bg-white hover:text-[#0b66ff]",
        )}
        variant="ghost"
      >
        <Link
          href="/universities?view=programs"
          onClick={() => onViewIntent("programs")}
        >
          <LibraryBigIcon data-icon="inline-start" />
          Proqramlar
        </Link>
      </Button>
    </div>
  );
}

function ProgramsRegistryCard({
  groups,
  onToggleCountry,
  openCountries,
}: {
  groups: ProgramCountryGroup[];
  onToggleCountry: (countryKey: string) => void;
  openCountries: Set<string>;
}) {
  return (
    <Card className="mt-4 overflow-hidden rounded-[1.35rem] border-[#dce6f4] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.04)]">
      <CardContent className="p-0">
        <div className="max-h-[min(64vh,760px)] overflow-y-auto overscroll-contain">
          <ProgramsCountryList
            groups={groups}
            onToggleCountry={onToggleCountry}
            openCountries={openCountries}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function getAktivFilters(data: UniversitiesDashboardData) {
  const filters = data.filters;
  const activeFilters: Array<{ label: string; tone: "green" | "blue" }> = [];

  if (filters.query) {
    activeFilters.push({ label: `Axtaris: ${filters.query}`, tone: "blue" });
  }

  if (filters.country !== "all") {
    activeFilters.push({ label: `Ölkə: ${filters.country}`, tone: "blue" });
  }

  if (filters.city !== "all") {
    activeFilters.push({ label: `Şəhər: ${filters.city}`, tone: "blue" });
  }

  if (filters.program !== "all") {
    activeFilters.push({
      label: `Proqram: ${filters.program}`,
      tone: "blue",
    });
  }

  if (filters.language !== "all") {
    activeFilters.push({
      label: `Dil: ${filters.language}`,
      tone: "blue",
    });
  }

  if (filters.contactQuery) {
    activeFilters.push({
      label: `Kontakt: ${filters.contactQuery}`,
      tone: "blue",
    });
  }

  if (filters.sort !== "updated-desc") {
    activeFilters.push({
      label: `Sıralama: ${formatSortLabel(filters.sort)}`,
      tone: "blue",
    });
  }

  return activeFilters;
}

function hasAdvancedFilters(filters: UniversitiesDashboardData["filters"]) {
  return (
    filters.city !== "all" ||
    Boolean(filters.contactQuery) ||
    filters.sort !== "updated-desc"
  );
}

type AktivFilter = { label: string; tone: "green" | "blue" };

function getProgramAktivFilters(data: UniversitiesDashboardData) {
  const filters = data.programFilters;
  const activeFilters: AktivFilter[] = [];

  if (filters.query) {
    activeFilters.push({ label: `Axtaris: ${filters.query}`, tone: "blue" });
  }

  if (filters.country !== "all") {
    activeFilters.push({ label: `Ölkə: ${filters.country}`, tone: "blue" });
  }

  if (filters.program !== "all") {
    activeFilters.push({
      label: `Proqram: ${filters.program}`,
      tone: "blue",
    });
  }

  if (filters.level !== "all") {
    activeFilters.push({ label: `Pillə: ${filters.level}`, tone: "blue" });
  }

  if (filters.language !== "all") {
    activeFilters.push({
      label: `Dil: ${filters.language}`,
      tone: "blue",
    });
  }

  return activeFilters;
}

function hasProgramAdvancedFilters() {
  return false;
}

const countryPresentations: Array<CountryPresentation & { aliases: string[] }> =
  [
    {
      accent: "#ef4444",
      aliases: ["turkiye", "turkey"],
      borderAccent: "#fecdd3",
      flagIsoCode: "tr",
      label: "Türkiyə",
      softAccent: "#fff1f2",
    },
    {
      accent: "#0ea5e9",
      aliases: ["azerbaycan", "azerbaijan"],
      borderAccent: "#bae6fd",
      flagIsoCode: "az",
      label: "Azərbaycan",
      softAccent: "#eff6ff",
    },
    {
      accent: "#111827",
      aliases: ["almaniya", "germany", "deutschland"],
      borderAccent: "#d1d5db",
      flagIsoCode: "de",
      label: "Almaniya",
      softAccent: "#f8fafc",
    },
    {
      accent: "#dc2626",
      aliases: ["kanada", "canada"],
      borderAccent: "#fecaca",
      flagIsoCode: "ca",
      label: "Kanada",
      softAccent: "#fff7ed",
    },
    {
      accent: "#1d4ed8",
      aliases: ["birlesmis kralliq", "united kingdom", "great britain", "uk"],
      borderAccent: "#bfdbfe",
      flagIsoCode: "gb",
      label: "Birləşmiş Krallıq",
      softAccent: "#eff6ff",
    },
    {
      accent: "#2563eb",
      aliases: ["avstraliya", "australia"],
      borderAccent: "#bfdbfe",
      flagIsoCode: "au",
      label: "Avstraliya",
      softAccent: "#eef2ff",
    },
    {
      accent: "#2563eb",
      aliases: [
        "abs",
        "amerika birlesmis statlari",
        "united states",
        "usa",
        "us",
      ],
      borderAccent: "#bfdbfe",
      flagIsoCode: "us",
      label: "Amerika Birləşmiş Ştatları",
      softAccent: "#eff6ff",
    },
    {
      accent: "#16a34a",
      aliases: ["italiya", "italy"],
      borderAccent: "#bbf7d0",
      flagIsoCode: "it",
      label: "İtaliya",
      softAccent: "#f0fdf4",
    },
    {
      accent: "#dc2626",
      aliases: ["polsa", "poland"],
      borderAccent: "#fecaca",
      flagIsoCode: "pl",
      label: "Polşa",
      softAccent: "#fff7ed",
    },
    {
      accent: "#f97316",
      aliases: ["niderland", "netherlands", "holland"],
      borderAccent: "#fed7aa",
      flagIsoCode: "nl",
      label: "Niderland",
      softAccent: "#fff7ed",
    },
    {
      accent: "#ef4444",
      aliases: ["ispaniya", "spain"],
      borderAccent: "#fecaca",
      flagIsoCode: "es",
      label: "İspaniya",
      softAccent: "#fffbeb",
    },
    {
      accent: "#2563eb",
      aliases: ["fransa", "france"],
      borderAccent: "#bfdbfe",
      flagIsoCode: "fr",
      label: "Fransa",
      softAccent: "#eff6ff",
    },
    {
      accent: "#ef4444",
      aliases: ["avstriya", "austria"],
      borderAccent: "#fecaca",
      flagIsoCode: "at",
      label: "Avstriya",
      softAccent: "#fff7ed",
    },
    {
      accent: "#16a34a",
      aliases: ["macaristan", "hungary"],
      borderAccent: "#bbf7d0",
      flagIsoCode: "hu",
      label: "Macarıstan",
      softAccent: "#f0fdf4",
    },
    {
      accent: "#2563eb",
      aliases: ["cexiya", "czechia", "czech republic"],
      borderAccent: "#bfdbfe",
      flagIsoCode: "cz",
      label: "Çexiya",
      softAccent: "#eff6ff",
    },
    {
      accent: "#ef4444",
      aliases: ["birlesmis ereb emirlikleri", "uae", "united arab emirates"],
      borderAccent: "#fecaca",
      flagIsoCode: "ae",
      label: "Birləşmiş Ərəb Əmirlikləri",
      softAccent: "#fff7ed",
    },
    {
      accent: "#ef4444",
      aliases: ["gurcustan", "georgia"],
      borderAccent: "#fecaca",
      flagIsoCode: "ge",
      label: "Gürcüstan",
      softAccent: "#fff7ed",
    },
    {
      accent: "#2563eb",
      aliases: ["cin", "china"],
      borderAccent: "#bfdbfe",
      flagIsoCode: "cn",
      label: "Çin",
      softAccent: "#eff6ff",
    },
    {
      accent: "#dc2626",
      aliases: ["yaponiya", "japan"],
      borderAccent: "#fecaca",
      flagIsoCode: "jp",
      label: "Yaponiya",
      softAccent: "#fff7ed",
    },
    {
      accent: "#2563eb",
      aliases: ["cenubi koreya", "south korea", "korea"],
      borderAccent: "#bfdbfe",
      flagIsoCode: "kr",
      label: "Cənubi Koreya",
      softAccent: "#eff6ff",
    },
    {
      accent: "#16a34a",
      aliases: ["malaziya", "malaysia"],
      borderAccent: "#bbf7d0",
      flagIsoCode: "my",
      label: "Malayziya",
      softAccent: "#f0fdf4",
    },
    {
      accent: "#dc2626",
      aliases: ["kipr", "cyprus"],
      borderAccent: "#fecaca",
      flagIsoCode: "cy",
      label: "Kipr",
      softAccent: "#fff7ed",
    },
    {
      accent: "#16a34a",
      aliases: ["irlandiya", "ireland"],
      borderAccent: "#bbf7d0",
      flagIsoCode: "ie",
      label: "İrlandiya",
      softAccent: "#f0fdf4",
    },
    {
      accent: "#dc2626",
      aliases: ["isvecre", "switzerland"],
      borderAccent: "#fecaca",
      flagIsoCode: "ch",
      label: "İsveçrə",
      softAccent: "#fff7ed",
    },
    {
      accent: "#2563eb",
      aliases: ["isvec", "sweden"],
      borderAccent: "#bfdbfe",
      flagIsoCode: "se",
      label: "İsveç",
      softAccent: "#eff6ff",
    },
    {
      accent: "#2563eb",
      aliases: ["norvec", "norway"],
      borderAccent: "#bfdbfe",
      flagIsoCode: "no",
      label: "Norveç",
      softAccent: "#eff6ff",
    },
    {
      accent: "#2563eb",
      aliases: ["finlandiya", "finland"],
      borderAccent: "#bfdbfe",
      flagIsoCode: "fi",
      label: "Finlandiya",
      softAccent: "#eff6ff",
    },
    {
      accent: "#dc2626",
      aliases: ["danimarka", "denmark"],
      borderAccent: "#fecaca",
      flagIsoCode: "dk",
      label: "Danimarka",
      softAccent: "#fff7ed",
    },
  ];

function groupUniversitiesByCountry(
  rows: UniversityRegistryRow[],
): UniversityCountryGroup[] {
  const groups = new Map<string, UniversityCountryGroup>();

  for (const row of rows) {
    const key = normalizeCountryKey(row.country || row.location);
    const presentation = getCountryPresentation(row.country || row.location);
    const group =
      groups.get(key) ??
      ({
        key,
        presentation,
        programCount: 0,
        rows: [],
        universityCount: 0,
      } satisfies UniversityCountryGroup);

    group.rows.push(row);
    group.programCount += row.programs;
    group.universityCount = group.rows.length;
    groups.set(key, group);
  }

  return Array.from(groups.values()).sort(compareCountryGroups);
}

function groupProgramsByCountry(
  rows: ProgramRegistryRow[],
): ProgramCountryGroup[] {
  const groups = new Map<
    string,
    ProgramCountryGroup & {
      periodCounts: Map<string, number>;
      universityIds: Set<string>;
    }
  >();

  for (const row of rows) {
    const key = normalizeCountryKey(row.country);
    const presentation = getCountryPresentation(row.country);
    const group =
      groups.get(key) ??
      ({
        key,
        minTuitionLabel: "-",
        periodCounts: new Map<string, number>(),
        periodSummary: "Qəbul dövrü yoxdur",
        presentation,
        programCount: 0,
        rows: [],
        universityCount: 0,
        universityIds: new Set<string>(),
      } satisfies ProgramCountryGroup & {
        periodCounts: Map<string, number>;
        universityIds: Set<string>;
      });

    group.rows.push(row);
    group.programCount = group.rows.length;
    group.universityIds.add(row.universityId);
    group.universityCount = group.universityIds.size;
    group.periodCounts.set(
      row.period,
      (group.periodCounts.get(row.period) ?? 0) + 1,
    );
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group) => {
      const minTuition = group.rows.reduce<{
        currency: string;
        value: number;
      } | null>((current, row) => {
        const value = row.discountedTuitionFee ?? row.tuitionFee;
        if (value === null) {
          return current;
        }
        if (!current || value < current.value) {
          return { currency: row.currency, value };
        }
        return current;
      }, null);

      return {
        key: group.key,
        minTuitionLabel: minTuition
          ? `Min. ${formatTableMoney(minTuition.value, minTuition.currency)}`
          : "-",
        periodSummary: getMostCommonLabel(group.periodCounts),
        presentation: group.presentation,
        programCount: group.programCount,
        rows: group.rows,
        universityCount: group.universityCount,
      };
    })
    .sort(compareCountryGroups);
}

function reconcileOpenCountryKeys<T extends { key: string }>(
  current: Set<string>,
  groups: T[],
) {
  const availableKeys = new Set(groups.map((group) => group.key));
  const next = new Set(
    Array.from(current).filter((countryKey) => availableKeys.has(countryKey)),
  );

  if (current.size > 0 && next.size === 0 && groups[0]) {
    next.add(groups[0].key);
  }

  return areSetsEqual(current, next) ? current : next;
}

function compareCountryGroups<
  T extends { presentation: CountryPresentation; rows: unknown[] },
>(a: T, b: T) {
  return (
    b.rows.length - a.rows.length ||
    a.presentation.label.localeCompare(b.presentation.label, "az")
  );
}

function getCountryPresentation(country: string): CountryPresentation {
  const normalized = normalizeCountryKey(country);
  const match = countryPresentations.find((presentation) =>
    presentation.aliases.some(
      (alias) => normalized === alias || normalized.startsWith(`${alias} `),
    ),
  );

  if (match) {
    return {
      accent: match.accent,
      borderAccent: match.borderAccent,
      flagIsoCode: match.flagIsoCode,
      label: match.label,
      softAccent: match.softAccent,
    };
  }

  const label = country.trim() || "Təyin edilməyib";

  return {
    accent: "#64748b",
    borderAccent: "#dbe3ef",
    flagIsoCode: null,
    label,
    softAccent: "#f8fafc",
  };
}

function normalizeCountryKey(country: string) {
  return country
    .trim()
    .toLocaleLowerCase("az")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ə", "e")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ü", "u")
    .replaceAll("ğ", "g")
    .replaceAll("ş", "s")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getMostCommonLabel(values: Map<string, number>) {
  const [label] =
    Array.from(values.entries()).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "az"),
    )[0] ?? [];

  return label || "Qəbul dövrü yoxdur";
}

function areSetsEqual(left: Set<string>, right: Set<string>) {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}

function downloadFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: UniversitiesDashboardData["tableRows"]) {
  const headers = [
    "Ad",
    "Ölkə",
    "Şəhər",
    "Mekteb tipi",
    "Proqramlar",
    "Kontakt",
    "Yeniləndi",
  ];

  const body = rows.map((row) =>
    [
      row.name,
      row.country,
      row.city,
      row.type,
      row.programs,
      row.contact,
      row.updated,
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(","),
  );

  return [headers.join(","), ...body].join("\n");
}

function programsToCsv(rows: UniversitiesDashboardData["programRows"]) {
  const headers = [
    "Proqram",
    "Universitet",
    "Ölkə",
    "Şəhər",
    "Campus",
    "Pillə",
    "Dil",
    "Muddet",
    "Təhsil forması",
    "Dönəm",
    "Təhsil haqqı",
    "Endirimli təhsil haqqı",
    "Valyuta",
  ];

  const body = rows.map((row) =>
    [
      row.name,
      row.universityName,
      row.country,
      row.city,
      row.campus,
      row.level,
      row.language,
      row.duration,
      row.studyMode,
      row.period,
      row.tuitionFee ?? "",
      row.discountedTuitionFee ?? "",
      row.currency,
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(","),
  );

  return [headers.join(","), ...body].join("\n");
}

function formatSortLabel(value: string) {
  if (value === "name-asc") {
    return "Ad A-Z";
  }

  if (value === "programs-desc") {
    return "Ən çox proqram";
  }

  return "Son yenilənənlər";
}

function formatTableMoney(value: number | null, currency: string) {
  if (value === null) {
    return "-";
  }

  const safeCurrency = currency && currency !== "-" ? currency : "USD";

  try {
    return new Intl.NumberFormat("en", {
      currency: safeCurrency,
      maximumFractionDigits: 0,
      style: "currency",
    }).format(value);
  } catch {
    return `${value.toLocaleString("en")} ${safeCurrency}`;
  }
}

function buildApplicationPrefillHref({
  programId,
  tuitionId,
  universityId,
}: {
  programId: string;
  tuitionId?: string | null;
  universityId: string;
}) {
  const params = new URLSearchParams({
    programId,
    universityId,
  });

  if (tuitionId) {
    params.set("tuitionId", tuitionId);
  }

  return `/applications/new?${params.toString()}`;
}

function HiddenAdvancedFilterFields({
  filters,
}: {
  filters: UniversitiesDashboardData["filters"];
}) {
  return (
    <>
      {filters.city !== "all" ? (
        <input name="city" type="hidden" value={filters.city} />
      ) : null}
      {filters.contactQuery ? (
        <input name="contact" type="hidden" value={filters.contactQuery} />
      ) : null}
      {filters.sort !== "updated-desc" ? (
        <input name="sort" type="hidden" value={filters.sort} />
      ) : null}
    </>
  );
}

function FilterActions({ resetHref }: { resetHref: string }) {
  return (
    <div className="flex gap-2">
      <Button
        className="h-11 min-w-24 flex-1 rounded-[0.95rem] bg-[#0b66ff] px-3 text-[11px] font-black shadow-[0_10px_20px_rgba(37,99,235,0.16)] transition-all duration-300 hover:bg-[#075be8] xl:flex-none"
        type="submit"
      >
        <SlidersHorizontalIcon data-icon="inline-start" />
        Tetbiq et
      </Button>
      <Button
        asChild
        className="h-11 min-w-24 rounded-[0.95rem] border-[#dce6f4] bg-white px-3 text-[11px] font-black text-[#34456c] transition duration-300 hover:bg-[#f6f9ff] hover:text-[#0b66ff]"
        variant="outline"
      >
        <Link href={resetHref}>
          <XIcon data-icon="inline-start" />
          Sifirla
        </Link>
      </Button>
    </div>
  );
}

function UniversitySearchInput({
  options,
  value,
}: {
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleOptions = useMemo(
    () =>
      options
        .filter((option) =>
          normalizedQuery
            ? option.label.toLowerCase().includes(normalizedQuery)
            : true,
        )
        .slice(0, 30),
    [normalizedQuery, options],
  );

  function selectUniversity(
    universityName: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    const form = event.currentTarget.form;
    setQuery(universityName);
    setIsOpen(false);
    window.setTimeout(() => form?.requestSubmit(), 0);
  }

  return (
    <label className="relative block w-full">
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 z-20 -translate-y-1/2 text-slate-400" />
      <Input
        autoComplete="off"
        className="h-11 rounded-[0.95rem] border-[#dce6f4] bg-white pl-10 pr-3 text-[12px] font-bold text-[#07183a] shadow-[0_4px_14px_rgba(15,23,42,0.02)] transition hover:border-[#0b66ff]/30 focus:border-[#0b66ff] focus:ring-4 focus:ring-[#0b66ff]/10"
        name="q"
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Universitet, şəhər, ölkə..."
        value={query}
      />
      {isOpen && visibleOptions.length > 0 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-60 overflow-y-auto rounded-[1.15rem] border border-[#dce6f4] bg-white p-1.5 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          {visibleOptions.map((option) => (
            <button
              key={option.value}
              className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-[#24365f] transition hover:bg-[#eef5ff] hover:text-[#0b66ff] focus:bg-[#eef5ff] focus:text-[#0b66ff] focus:outline-none"
              onMouseDown={(event) => selectUniversity(option.label, event)}
              type="button"
            >
              <LandmarkIcon className="mt-0.5 shrink-0 text-[#0b66ff]" />
              <span className="min-w-0">
                <span className="block truncate">{option.label}</span>
                <span className="mt-0.5 block text-[11px] font-medium text-[#71809f]">
                  Universitet secin
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
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
    <label className="relative block w-full">
      <span className="pointer-events-none absolute left-3.5 top-1.5 z-10 max-w-[calc(100%-1.75rem)] truncate text-[9px] font-black uppercase leading-none tracking-[0.02em] text-slate-500">
        {label}
      </span>
      <Select defaultValue={value} name={name}>
        <SelectTrigger
          aria-label={label}
          className="!h-11 w-full rounded-[0.95rem] border-[#dce6f4] bg-white px-3.5 pb-1.5 pt-5 text-[12px] font-bold text-[#07183a] shadow-[0_4px_14px_rgba(15,23,42,0.02)] transition-all duration-300 hover:border-[#0b66ff]/30 focus:border-[#0b66ff] focus:ring-4 focus:ring-[#0b66ff]/10"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          align="start"
          className="max-h-72 rounded-[1.2rem] border-[#dce6f4] bg-white p-1 shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
          position="popper"
        >
          <SelectGroup>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="rounded-xl py-2 text-[13px] font-semibold text-[#24365f] focus:bg-[#eef5ff] focus:text-[#0b66ff]"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </label>
  );
}

function FilterTextInput({
  hideLabel = false,
  icon: Icon,
  label,
  name,
  placeholder,
  value,
}: {
  hideLabel?: boolean;
  icon: typeof SearchIcon;
  label: string;
  name: string;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="relative block w-full">
      {hideLabel ? null : (
        <span className="pointer-events-none absolute left-3.5 top-1.5 z-10 max-w-[calc(100%-1.75rem)] truncate text-[9px] font-black uppercase leading-none tracking-[0.02em] text-slate-500">
          {label}
        </span>
      )}
      <Icon
        className={cn(
          "pointer-events-none absolute left-3.5 -translate-y-1/2 text-slate-400",
          hideLabel ? "top-1/2" : "top-[27px]",
        )}
      />
      <Input
        aria-label={label}
        className={cn(
          "h-11 rounded-[0.95rem] border-[#dce6f4] bg-white pl-10 text-[12px] font-bold text-[#07183a] shadow-[0_4px_14px_rgba(15,23,42,0.02)] transition hover:border-[#0b66ff]/30 focus:border-[#0b66ff] focus:ring-4 focus:ring-[#0b66ff]/10",
          hideLabel ? "pr-3" : "pb-1.5 pt-5",
        )}
        defaultValue={value}
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}

function AdvancedFilterGroup({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 rounded-[1.2rem] border border-[#dce6f4] bg-white/88 p-3 shadow-[0_12px_28px_rgba(15,23,42,0.02)]">
      <legend className="px-1 text-[10px] font-black uppercase tracking-normal text-[#506283]">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}

function FilterPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "green" | "blue";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-2 rounded-full px-3 py-1 text-xs font-medium leading-tight",
        tone === "green"
          ? "bg-[#e7f8ee] text-[#129344]"
          : "bg-[#e8f0ff] text-[#0b66ff]",
      )}
    >
      {children}
      <XIcon />
    </span>
  );
}

function MetricCard({
  metric,
}: {
  metric: ReturnType<typeof buildMetricCards>[number];
}) {
  const Icon = metric.icon;

  return (
    <Card className="overflow-hidden rounded-[1.05rem] border-[#dce6f4] bg-white py-0 shadow-[0_10px_24px_rgba(15,23,42,0.035)]">
      <CardContent className="flex items-center gap-3 p-3">
        <div
          className="h-10 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: metric.color }}
        />
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-[0.85rem] bg-[#f8fafc] ring-1 ring-[#edf2f8]"
          style={{ color: metric.color }}
        >
          <Icon />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-bold uppercase tracking-[0.02em] text-[#637392]">
            {metric.label}
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xl font-black tabular-nums text-[#07183a]">
              {metric.value}
            </span>
          </div>
          <div className="mt-0.5 truncate text-[11px] font-semibold text-[#6b7897]">
            {metric.detail}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
