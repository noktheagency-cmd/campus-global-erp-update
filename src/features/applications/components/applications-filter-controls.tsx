"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type FilterOption = { label: string; value: string };
type FilterUpdates = Record<string, string | null>;

const fieldClassName =
  "h-10 w-full rounded-xl border border-[#dce6f4] bg-white px-3 text-[13px] font-semibold text-[#07183a] outline-none transition placeholder:text-[#98a5bd] hover:border-[#c6d6eb] focus:border-[#0b66ff] focus:ring-4 focus:ring-[#0b66ff]/10";

const AZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avqust",
  "sentyabr",
  "oktyabr",
  "noyabr",
  "dekabr",
];

const AZ_SHORT_MONTHS = [
  "yan",
  "fev",
  "mar",
  "apr",
  "may",
  "iyn",
  "iyl",
  "avq",
  "sen",
  "okt",
  "noy",
  "dek",
];

export function useApplicationFilterNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const [isPending, startTransition] = useTransition();

  const updateFilters = useCallback(
    (
      updates: FilterUpdates,
      options: { clearCompletion?: boolean } = {},
    ) => {
      const params = new URLSearchParams(currentSearch);

      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === "all") params.delete(key);
        else params.set(key, value);
      }

      if (options.clearCompletion) params.delete("completion");
      params.delete("page");

      startTransition(() => {
        router.replace(
          { pathname, query: Object.fromEntries(params.entries()) },
          { scroll: false },
        );
      });
    },
    [currentSearch, pathname, router],
  );

  return { isPending, updateFilters };
}

export function FilterDropdown({
  label,
  name,
  options,
  value,
  variant = "compact",
}: {
  label: string;
  name: string;
  options: FilterOption[];
  value: string;
  variant?: "compact" | "field";
}) {
  const { isPending, updateFilters } = useApplicationFilterNavigation();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const normalizedSearch = normalizeText(search);
  const visibleOptions = useMemo(
    () =>
      normalizedSearch
        ? options.filter((option) => normalizeText(option.label).includes(normalizedSearch))
        : options,
    [normalizedSearch, options],
  );
  const isActive = value !== "all";
  const isSearchable = options.length > 10;

  const trigger = (
    <button
      aria-label={label}
      className={cn(
        "group flex items-center justify-between gap-2 border outline-none transition",
        variant === "compact"
          ? "h-9 max-w-[200px] shrink-0 rounded-xl border-[#dce6f4] bg-[#f9fbfe] px-3 text-xs font-bold text-[#425273] hover:border-[#b9cce7] hover:bg-white focus-visible:ring-3 focus-visible:ring-[#0b66ff]/10"
          : fieldClassName,
        isActive && variant === "compact" &&
          "border-[#b9d2fb] bg-[#edf5ff] text-[#0b66ff]",
        isOpen && "border-[#0b66ff] bg-white ring-3 ring-[#0b66ff]/10",
      )}
      type="button"
    >
      <span className="min-w-0 truncate">{selectedOption?.label ?? label}</span>
      {isPending ? (
        <LoaderCircleIcon className="size-3.5 shrink-0 animate-spin text-[#0b66ff]" />
      ) : (
        <ChevronDownIcon
          className={cn(
            "size-3.5 shrink-0 text-[#8190a9] transition-transform",
            isOpen && "rotate-180 text-[#0b66ff]",
          )}
        />
      )}
    </button>
  );

  return (
    <div className={cn(variant === "field" && "grid gap-1.5")}>
      {variant === "field" ? (
        <span className="text-[11px] font-extrabold text-[#52617d]">{label}</span>
      ) : null}
      <DropdownMenu
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setSearch("");
        }}
        open={isOpen}
      >
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="z-[80] max-h-[330px] w-[min(310px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-[#d8e4f3] bg-white p-1.5 shadow-[0_22px_55px_rgba(15,36,74,0.2)] ring-0"
          sideOffset={7}
        >
          {isSearchable ? (
            <div
              className="sticky top-0 z-10 mb-1 flex h-9 items-center gap-2 rounded-xl border border-[#e0e9f5] bg-[#f8fbff] px-2.5"
              onKeyDown={(event) => event.stopPropagation()}
            >
              <SearchIcon className="size-3.5 shrink-0 text-[#8290a8]" />
              <input
                aria-label={`${label} seçimlərində axtar`}
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#24365f] outline-none placeholder:text-[#98a5b9]"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Seçimlərdə axtar..."
                value={search}
              />
              {search ? (
                <button
                  aria-label="Seçim axtarışını təmizlə"
                  className="text-[#8794aa] hover:text-[#0b66ff]"
                  onClick={() => setSearch("")}
                  type="button"
                >
                  <XIcon className="size-3.5" />
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="max-h-[278px] overflow-y-auto pr-0.5 [scrollbar-color:#c7d6e9_transparent] [scrollbar-width:thin]">
            <DropdownMenuRadioGroup value={value}>
              {visibleOptions.map((option) => (
                <DropdownMenuRadioItem
                  className="min-h-9 cursor-pointer rounded-xl py-2 pl-3 pr-9 text-xs font-semibold text-[#34456c] outline-none transition focus:bg-[#edf5ff] focus:text-[#0b66ff] data-[state=checked]:bg-[#edf5ff] data-[state=checked]:font-extrabold data-[state=checked]:text-[#0b66ff]"
                  key={option.value}
                  onSelect={() => {
                    setIsOpen(false);
                    updateFilters(
                      { [name]: option.value },
                      { clearCompletion: name === "status" },
                    );
                  }}
                  value={option.value}
                >
                  <span className="line-clamp-2 leading-4">{option.label}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            {visibleOptions.length === 0 ? (
              <div className="px-3 py-5 text-center text-xs font-semibold text-[#8794aa]">
                Uyğun seçim yoxdur
              </div>
            ) : null}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function AutoFilterTextField({
  initialValue,
  label,
  name,
  placeholder,
}: {
  initialValue: string;
  label: string;
  name: string;
  placeholder?: string;
}) {
  const { isPending, updateFilters } = useApplicationFilterNavigation();
  const [value, setValue] = useState(initialValue);
  const lastAppliedRef = useRef(initialValue);

  useEffect(() => {
    const normalizedValue = value.trim();
    if (normalizedValue === lastAppliedRef.current) return;

    const timeout = window.setTimeout(() => {
      lastAppliedRef.current = normalizedValue;
      updateFilters({ [name]: normalizedValue || null });
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [name, updateFilters, value]);

  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-extrabold text-[#52617d]">{label}</span>
      <span className="relative">
        <input
          className={`${fieldClassName} pr-9`}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
        {isPending ? (
          <LoaderCircleIcon className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-[#0b66ff]" />
        ) : value ? (
          <button
            aria-label={`${label} filtrini təmizlə`}
            className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg text-[#8794aa] hover:bg-[#edf5ff] hover:text-[#0b66ff]"
            onClick={() => setValue("")}
            type="button"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </span>
    </label>
  );
}

export function DateRangeFilter({
  fromValue,
  toValue,
  todayValue,
}: {
  fromValue: string;
  toValue: string;
  todayValue: string;
}) {
  const { isPending, updateFilters } = useApplicationFilterNavigation();
  const initialDate = parseIsoDate(fromValue) ?? parseIsoDate(toValue) ?? parseIsoDate(todayValue) ?? new Date();
  const [from, setFrom] = useState(fromValue);
  const [to, setTo] = useState(toValue);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const monthDays = getCalendarDays(visibleMonth);
  const fromDate = parseIsoDate(from);
  const toDate = parseIsoDate(to);

  function applyRange(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    updateFilters({ from: nextFrom || null, to: nextTo || null });
  }

  function selectDate(dateValue: string) {
    if (!from || to) {
      applyRange(dateValue, "");
      return;
    }

    if (dateValue < from) applyRange(dateValue, from);
    else applyRange(from, dateValue);
    setIsOpen(false);
  }

  return (
    <div className="grid gap-1.5 sm:col-span-2 lg:col-span-3">
      <span className="text-[11px] font-extrabold text-[#52617d]">Tarix aralığı</span>
      <PopoverPrimitive.Root onOpenChange={setIsOpen} open={isOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            className={cn(
              fieldClassName,
              "flex items-center justify-between gap-3 text-left",
              isOpen && "border-[#0b66ff] ring-4 ring-[#0b66ff]/10",
            )}
            type="button"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#edf5ff] text-[#0b66ff]">
                <CalendarDaysIcon className="size-3.5" />
              </span>
              <span className={cn("truncate", !from && !to && "text-[#98a5bd]")}>{formatDateRange(from, to)}</span>
            </span>
            {isPending ? (
              <LoaderCircleIcon className="size-3.5 shrink-0 animate-spin text-[#0b66ff]" />
            ) : (
              <ChevronDownIcon className={cn("size-3.5 shrink-0 text-[#8190a9] transition-transform", isOpen && "rotate-180 text-[#0b66ff]")} />
            )}
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            className="z-[90] w-[292px] rounded-[1.2rem] border border-[#d8e4f3] bg-white p-3 shadow-[0_24px_65px_rgba(15,36,74,0.22)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
            sideOffset={7}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                aria-label="Əvvəlki ay"
                className="flex size-8 items-center justify-center rounded-xl text-[#637392] transition hover:bg-[#edf5ff] hover:text-[#0b66ff]"
                onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
                type="button"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <span className="text-sm font-black capitalize text-[#07183a]">{formatMonthTitle(visibleMonth)}</span>
              <button
                aria-label="Növbəti ay"
                className="flex size-8 items-center justify-center rounded-xl text-[#637392] transition hover:bg-[#edf5ff] hover:text-[#0b66ff]"
                onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                type="button"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-[#8a97af]">
              {["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"].map((day, index) => (
                <span className="py-1" key={`${day}-${index}`}>{day}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const dateValue = toIsoDate(day.date);
                const isStart = from === dateValue;
                const isEnd = to === dateValue;
                const isBetween = fromDate && toDate && day.date > fromDate && day.date < toDate;
                const isToday = todayValue === dateValue;

                return (
                  <button
                    aria-label={formatAccessibleDate(day.date)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl text-xs font-bold transition",
                      day.isCurrentMonth ? "text-[#233456] hover:bg-[#edf5ff] hover:text-[#0b66ff]" : "text-[#b0bbcc]",
                      isToday && "bg-[#f0f6ff] text-[#0b66ff] ring-1 ring-[#cfe0fb]",
                      isBetween && "bg-[#edf5ff] text-[#0b66ff]",
                      (isStart || isEnd) && "bg-gradient-to-br from-[#1671ff] to-[#0759e8] text-white shadow-[0_7px_16px_rgba(11,102,255,0.24)] ring-0 hover:text-white",
                    )}
                    key={dateValue}
                    onClick={() => selectDate(dateValue)}
                    type="button"
                  >
                    {day.date.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#edf2f8] pt-3">
              <button
                className="rounded-xl px-3 py-2 text-xs font-bold text-[#71809a] transition hover:bg-[#f3f7fd] hover:text-[#0b66ff]"
                onClick={() => {
                  applyRange("", "");
                  setIsOpen(false);
                }}
                type="button"
              >
                Təmizlə
              </button>
              <button
                className="rounded-xl bg-[#edf5ff] px-3 py-2 text-xs font-extrabold text-[#0b66ff] transition hover:bg-[#0b66ff] hover:text-white"
                onClick={() => {
                  applyRange(todayValue, todayValue);
                  const today = parseIsoDate(todayValue);
                  if (today) setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setIsOpen(false);
                }}
                type="button"
              >
                Bu gün
              </button>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("az")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ə", "e")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ç", "c")
    .replaceAll("ö", "o")
    .replaceAll("ü", "u");
}

function getCalendarDays(visibleMonth: Date) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    date.setHours(0, 0, 0, 0);
    return { date, isCurrentMonth: date.getMonth() === month };
  });
}

function addMonths(value: Date, months: number) {
  return new Date(value.getFullYear(), value.getMonth() + months, 1);
}

function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateRange(from: string, to: string) {
  if (from && to) return `${formatShortDate(from)} — ${formatShortDate(to)}`;
  if (from) return `${formatShortDate(from)} — ...`;
  return "Tarix seçin";
}

function formatShortDate(value: string) {
  const date = parseIsoDate(value);
  if (!date) return value;
  return `${String(date.getDate()).padStart(2, "0")} ${AZ_SHORT_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatMonthTitle(value: Date) {
  return `${AZ_MONTHS[value.getMonth()]} ${value.getFullYear()}`;
}

function formatAccessibleDate(value: Date) {
  return `${value.getDate()} ${AZ_MONTHS[value.getMonth()]} ${value.getFullYear()}`;
}
