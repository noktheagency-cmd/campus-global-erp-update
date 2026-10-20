"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowUpRightIcon,
  LoaderCircleIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AutoFilterTextField,
  DateRangeFilter,
  FilterDropdown,
} from "@/features/applications/components/applications-filter-controls";
import { APPLICATION_STATUS_LABELS } from "@/features/applications/constants";
import type {
  ApplicationRow,
  ApplicationStatus,
  ApplicationsDashboardData,
} from "@/features/applications/types";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type FilterToolbarProps = {
  data: ApplicationsDashboardData;
  isStudentView: boolean;
  resultLabel: string;
};

export function ApplicationsFilterToolbar({
  data,
  isStudentView,
  resultLabel,
}: FilterToolbarProps) {
  const filters = data.filters;
  const activeFilterCount = getActiveFilterCount(filters);
  const statusOptions = [
    { label: "Bütün statuslar", value: "all" },
    ...data.filterOptions.statuses.map((status) => ({
      label: APPLICATION_STATUS_LABELS[status as ApplicationStatus] ?? status,
      value: status,
    })),
  ];

  return (
    <div className="border-b border-[#e3ebf6] bg-white px-3 py-3 sm:px-4">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-start">
        <SmartStudentSearch data={data} />
        <div className="flex shrink-0 items-center gap-2">
          <AdvancedFiltersDialog
            activeFilterCount={activeFilterCount}
            data={data}
            statusOptions={statusOptions}
          />
          {activeFilterCount > 0 || filters.query ? (
            <Button
              asChild
              className="h-10 rounded-xl border-[#dce6f4] bg-white px-3 text-xs font-bold text-[#5e6d88] shadow-none hover:bg-[#f6f9ff] hover:text-[#0b66ff]"
              variant="outline"
            >
              <Link href="/applications">
                <XIcon className="size-3.5" />
                Təmizlə
              </Link>
            </Button>
          ) : null}
          <span className="ml-auto whitespace-nowrap px-1 text-[11px] font-bold tabular-nums text-[#7a89a5] xl:hidden">
            {resultLabel}
          </span>
        </div>
      </div>

      {!isStudentView ? (
        <div className="mt-2.5 flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterDropdown
            label="Status"
            name="status"
            options={statusOptions}
            value={filters.status}
          />
          <FilterDropdown
            label="Ölkə"
            name="country"
            options={withAll("Bütün ölkələr", data.filterOptions.countries)}
            value={filters.country}
          />
          <FilterDropdown
            label="Agent"
            name="agent"
            options={withAllOptions("Bütün agentlər", data.filterOptions.agents)}
            value={filters.agentId}
          />
          <FilterDropdown
            label="Universitet"
            name="university"
            options={withAllOptions(
              "Bütün universitetlər",
              data.filterOptions.universities,
            )}
            value={filters.universityId}
          />
          <FilterDropdown
            label="Dönəm"
            name="period"
            options={withAllOptions("Bütün dönəmlər", data.filterOptions.periods)}
            value={filters.periodId}
          />
          <FilterDropdown
            label="Təhsil pilləsi"
            name="level"
            options={withAllOptions("Bütün pillələr", data.filterOptions.levels)}
            value={filters.levelId}
          />
          <FilterDropdown
            label="İxtisas"
            name="program"
            options={withAllOptions("Bütün ixtisaslar", data.filterOptions.programs)}
            value={filters.programId}
          />
          <span className="ml-auto hidden shrink-0 whitespace-nowrap pl-2 text-[11px] font-bold tabular-nums text-[#7a89a5] xl:block">
            {resultLabel}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function SmartStudentSearch({ data }: { data: ApplicationsDashboardData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const inputRef = useRef<HTMLInputElement>(null);
  const lastServerQueryRef = useRef(data.filters.query);
  const [value, setValue] = useState(data.filters.query);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const trimmedValue = value.trim();

  useEffect(() => {
    if (lastServerQueryRef.current === data.filters.query) return;
    lastServerQueryRef.current = data.filters.query;
    if (document.activeElement !== inputRef.current) {
      setValue(data.filters.query);
    }
  }, [data.filters.query]);

  useEffect(() => {
    if (trimmedValue === data.filters.query) return;

    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(currentSearch);
      if (trimmedValue) params.set("q", trimmedValue);
      else params.delete("q");
      params.delete("page");

      startTransition(() => {
        router.replace(
          { pathname, query: Object.fromEntries(params.entries()) },
          { scroll: false },
        );
      });
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [currentSearch, data.filters.query, pathname, router, trimmedValue]);

  const suggestions = data.rows.slice(0, 6);

  return (
    <div
      className="relative z-30 min-w-0 flex-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
    >
      <div
        className={cn(
          "flex h-11 items-center rounded-[0.9rem] border bg-[#f8fbff] px-3 transition",
          isOpen
            ? "border-[#0b66ff] bg-white shadow-[0_0_0_4px_rgba(11,102,255,0.09)]"
            : "border-[#dce6f4] hover:border-[#c6d6eb]",
        )}
      >
        {isPending ? (
          <LoaderCircleIcon className="size-4 shrink-0 animate-spin text-[#0b66ff]" />
        ) : (
          <SearchIcon className="size-4 shrink-0 text-[#70809e]" />
        )}
        <input
          ref={inputRef}
          aria-autocomplete="list"
          aria-controls="application-search-results"
          aria-expanded={isOpen && Boolean(trimmedValue)}
          aria-label="Tələbə axtarışı"
          className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm font-semibold text-[#07183a] outline-none placeholder:font-medium placeholder:text-[#8a97af]"
          onChange={(event) => {
            setValue(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsOpen(false);
          }}
          placeholder="Ad, pasport, şəxsiyyət vəsiqəsi, portal və ya app №"
          role="combobox"
          value={value}
        />
        {value ? (
          <button
            aria-label="Axtarışı təmizlə"
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[#8996ad] transition hover:bg-[#e9f1fc] hover:text-[#0b66ff]"
            onClick={() => {
              setValue("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            type="button"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </div>

      {isOpen && trimmedValue ? (
        <div
          className="absolute inset-x-0 top-[calc(100%+8px)] overflow-hidden rounded-2xl border border-[#dce6f4] bg-white shadow-[0_22px_55px_rgba(15,36,74,0.18)]"
          id="application-search-results"
          role="listbox"
        >
          <div className="flex items-center justify-between border-b border-[#edf2f8] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a97af]">
            <span>Uyğun nəticələr</span>
            <span className="normal-case tracking-normal">
              {data.pagination.totalItems} tapıldı
            </span>
          </div>
          {isPending ? (
            <div className="flex items-center gap-2 px-4 py-5 text-xs font-semibold text-[#6f7d97]">
              <LoaderCircleIcon className="size-4 animate-spin text-[#0b66ff]" />
              Axtarılır...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="p-1.5">
              {suggestions.map((row) => (
                <SearchSuggestion key={row.id} row={row} />
              ))}
            </div>
          ) : (
            <div className="px-4 py-5 text-center text-xs font-semibold text-[#6f7d97]">
              Uyğun tələbə tapılmadı
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SearchSuggestion({ row }: { row: ApplicationRow }) {
  const initials = row.studentName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <Link
      className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 outline-none transition hover:bg-[#f3f7fd] focus:bg-[#f3f7fd]"
      href={`/applications/students/${row.studentId}`}
      role="option"
    >
      {row.studentPhotoUrl ? (
        <Image
          alt=""
          className="size-9 shrink-0 rounded-xl border border-[#dce6f4] object-cover"
          height={36}
          src={row.studentPhotoUrl}
          unoptimized
          width={36}
        />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[11px] font-black text-[#0b66ff]">
          {initials}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-extrabold text-[#07183a]">
          {row.studentName}
        </span>
        <span className="block truncate text-[11px] font-medium text-[#75839d]">
          {row.passportNo || row.identityNo || row.studentEmail || row.studentId}
        </span>
      </span>
      <span className="hidden min-w-0 text-right sm:block">
        <span className="block truncate text-[11px] font-bold text-[#3f506f]">
          {row.latestApplicationCode}
        </span>
        <span className="block truncate text-[10px] text-[#8b98af]">
          {row.latestCountry} · {row.status}
        </span>
      </span>
      <ArrowUpRightIcon className="size-4 shrink-0 text-[#a1adc0] transition group-hover:text-[#0b66ff]" />
    </Link>
  );
}

function AdvancedFiltersDialog({
  activeFilterCount,
  data,
  statusOptions,
}: {
  activeFilterCount: number;
  data: ApplicationsDashboardData;
  statusOptions: Array<{ label: string; value: string }>;
}) {
  const filters = data.filters;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="relative h-10 rounded-xl border-[#dce6f4] bg-white px-3 text-xs font-bold text-[#34456c] shadow-none hover:-translate-y-0.5 hover:border-[#bcd1ee] hover:bg-[#f6f9ff] hover:text-[#0b66ff] hover:shadow-[0_8px_20px_rgba(31,70,130,0.1)]"
          variant="outline"
        >
          <SlidersHorizontalIcon className="size-4" />
          Detallı filtr
          {activeFilterCount > 0 ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-[#0b66ff] text-[10px] font-black text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[min(760px,calc(100%-24px))] max-w-[760px] gap-0 overflow-hidden rounded-[1.35rem] border border-[#dce6f4] bg-white p-0 shadow-[0_32px_90px_rgba(15,36,74,0.24)] ring-0 sm:max-w-[760px]">
        <DialogHeader className="border-b border-[#e5edf7] px-5 py-4 pr-14">
          <div className="flex items-start justify-between gap-4 pr-2">
            <div>
              <DialogTitle className="text-lg font-black text-[#07183a]">
                Detallı filtr
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-[#71809a]">
                Seçimlər avtomatik tətbiq olunur.
              </DialogDescription>
            </div>
            {activeFilterCount > 0 ? (
              <Link
                className="mt-0.5 shrink-0 rounded-lg px-2 py-1 text-[11px] font-extrabold text-[#0b66ff] transition hover:bg-[#edf5ff]"
                href="/applications"
              >
                Hamısını təmizlə
              </Link>
            ) : null}
          </div>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto">
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <AutoFilterTextField
              initialValue={filters.studentName}
              label="Ad Soyad"
              name="name"
              placeholder="Məs: Elon Musk"
            />
            <AutoFilterTextField
              initialValue={filters.passportNo}
              label="Pasport / Ş/V №"
              name="passport"
              placeholder="Sənəd nömrəsi"
            />
            <AutoFilterTextField
              initialValue={filters.portalNo}
              label="Portal №"
              name="portalNo"
              placeholder="Portal nömrəsi"
            />
            <AutoFilterTextField
              initialValue={filters.applicationNo}
              label="App №"
              name="appNo"
              placeholder="Müraciət nömrəsi"
            />
            <FilterDropdown
              label="Ölkə"
              name="country"
              options={withAll("Bütün ölkələr", data.filterOptions.countries)}
              value={filters.country}
              variant="field"
            />
            <FilterDropdown
              label="Agent"
              name="agent"
              options={withAllOptions("Bütün agentlər", data.filterOptions.agents)}
              value={filters.agentId}
              variant="field"
            />
            <FilterDropdown
              label="Universitet"
              name="university"
              options={withAllOptions(
                "Bütün universitetlər",
                data.filterOptions.universities,
              )}
              value={filters.universityId}
              variant="field"
            />
            <FilterDropdown
              label="Dönəm"
              name="period"
              options={withAllOptions("Bütün dönəmlər", data.filterOptions.periods)}
              value={filters.periodId}
              variant="field"
            />
            <FilterDropdown
              label="Təhsil pilləsi"
              name="level"
              options={withAllOptions("Bütün pillələr", data.filterOptions.levels)}
              value={filters.levelId}
              variant="field"
            />
            <FilterDropdown
              label="İxtisas"
              name="program"
              options={withAllOptions("Bütün ixtisaslar", data.filterOptions.programs)}
              value={filters.programId}
              variant="field"
            />
            <FilterDropdown
              label="Status"
              name="status"
              options={statusOptions}
              value={filters.status}
              variant="field"
            />
            <FilterDropdown
              label="Menecer"
              name="manager"
              options={withAllOptions("Bütün menecerlər", data.filterOptions.managers)}
              value={filters.managerId}
              variant="field"
            />
            <DateRangeFilter
              fromValue={filters.dateFrom}
              todayValue={data.metrics.todayDate}
              toValue={filters.dateTo}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function withAll(label: string, values: string[]) {
  return [
    { label, value: "all" },
    ...values.map((value) => ({ label: value, value })),
  ];
}

function withAllOptions(
  label: string,
  values: Array<{ label: string; value: string }>,
) {
  return [{ label, value: "all" }, ...values];
}

function getActiveFilterCount(filters: ApplicationsDashboardData["filters"]) {
  return [
    filters.studentName,
    filters.passportNo,
    filters.portalNo,
    filters.applicationNo,
    filters.completion !== "all",
    filters.status !== "all",
    filters.country !== "all",
    filters.agentId !== "all",
    filters.universityId !== "all",
    filters.periodId !== "all",
    filters.levelId !== "all",
    filters.programId !== "all",
    filters.managerId !== "all",
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;
}
