"use client";

import { useMemo, useState } from "react";

import {
  BookOpenIcon,
  CalendarDaysIcon,
  CheckIcon,
  GraduationCapIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createProgramAction,
  updateProgramAction,
} from "@/features/universities/actions";
import {
  CURRENCIES,
  PRICE_STATUSES,
  PROGRAM_STATUSES,
  SCHOLARSHIP_TYPES,
} from "@/features/universities/constants";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const EMPTY_SELECT_VALUE = "__empty";

const POPULAR_PROGRAM_NAMES = [
  "Kompüter elmləri",
  "Proqram mühəndisliyi",
  "Biznesin idarə edilməsi",
  "Beynəlxalq münasibətlər",
  "Məlumat elmi",
  "Süni intellekt",
  "Kibertəhlükəsizlik",
  "İqtisadiyyat",
  "Maliyyə",
  "Marketinq",
  "Memarlıq",
  "İnşaat mühəndisliyi",
  "Mexanika mühəndisliyi",
  "Elektrik və elektronika mühəndisliyi",
  "Tibb",
  "Stomatologiya",
  "Əczaçılıq",
  "Psixologiya",
  "Hüquq",
  "Beynəlxalq ticarət",
] as const;

const DURATION_OPTIONS = [
  "1 il",
  "2 il",
  "3 il",
  "4 il",
  "5 il",
  "6 il",
  "Hazırlıq ili",
  "Dil kursu",
] as const;

const STUDY_MODE_OPTIONS = [
  "Əyani",
  "Qiyabi",
  "Onlayn",
  "Hibrid",
  "Axşam",
] as const;

type Option = {
  label: string;
  value: string;
};

export function ProgramForm({
  campuses,
  defaultCurrency,
  defaultEducationLanguageId,
  defaultEducationLevelId,
  defaultPeriodId,
  educationLanguages,
  educationLevels,
  existingProgramNames = [],
  periods = [],
  universityId,
  values,
}: {
  campuses: Array<{ id: string; name: string }>;
  defaultCurrency?: string;
  defaultEducationLanguageId?: string;
  defaultEducationLevelId?: string;
  defaultPeriodId?: string;
  educationLanguages: Array<{ id: string; name: string }>;
  educationLevels: Array<{ id: string; name: string }>;
  existingProgramNames?: string[];
  periods?: Array<{ id: string; name: string }>;
  universityId: string;
  values?: {
    campusId: string | null;
    duration: string | null;
    educationLanguageId: string;
    educationLevelId: string;
    id: string;
    name: string;
    notes: string | null;
    requirementsSummary: string | null;
    status: string;
    studyMode: string | null;
  };
}) {
  const isEditing = Boolean(values);
  const programNameOptions = useMemo(
    () =>
      Array.from(
        new Set(
          [...existingProgramNames, ...POPULAR_PROGRAM_NAMES]
            .map((name) => name.trim())
            .filter(Boolean),
        ),
      ),
    [existingProgramNames],
  );
  const durationOptions = useMemo(
    () => mergeOptions(DURATION_OPTIONS, values?.duration),
    [values?.duration],
  );
  const studyModeOptions = useMemo(
    () => mergeOptions(STUDY_MODE_OPTIONS, values?.studyMode),
    [values?.studyMode],
  );

  return (
    <form
      action={isEditing ? updateProgramAction : createProgramAction}
      className="space-y-4"
    >
      <input name="universityId" type="hidden" value={universityId} />
      {!isEditing ? (
        <input name="createTuitionWithProgram" type="hidden" value="on" />
      ) : null}
      {values ? (
        <input name="programId" type="hidden" value={values.id} />
      ) : null}
      {values ? (
        <EditModeBar href={`/universities/${universityId}?tab=programs`} />
      ) : null}

      <div className="rounded-2xl border border-[#dce6f4] bg-[#fbfdff] p-3">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#07183a]">
          <GraduationCapIcon className="size-4 text-[#0b66ff]" />
          Proqram detallar?
        </div>
        <div className="space-y-3">
          <ProgramNameCombobox
            defaultValue={values?.name ?? ""}
            options={programNameOptions}
          />
          <FormSelect
            defaultValue={values?.campusId ?? undefined}
            name="campusId"
            options={campuses.map((campus) => ({
              label: campus.name,
              value: campus.id,
            }))}
            placeholder="Kampus yoxdur"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <FormSelect
              defaultValue={values?.educationLevelId ?? defaultEducationLevelId}
              name="educationLevelId"
              options={educationLevels.map((level) => ({
                label: level.name,
                value: level.id,
              }))}
              required
            />
            <FormSelect
              defaultValue={
                values?.educationLanguageId ?? defaultEducationLanguageId
              }
              name="educationLanguageId"
              options={educationLanguages.map((language) => ({
                label: language.name,
                value: language.id,
              }))}
              required
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <FormSelect
              defaultValue={values?.duration ?? "4 il"}
              name="duration"
              options={durationOptions}
            />
            <FormSelect
              defaultValue={values?.studyMode ?? "Əyani"}
              name="studyMode"
              options={studyModeOptions}
            />
          </div>
          <FormSelect
            defaultValue={values?.status ?? "ACTIVE"}
            name="status"
            options={PROGRAM_STATUSES}
          />
          <FormTextarea
            defaultValue={values?.requirementsSummary ?? undefined}
            name="requirementsSummary"
            placeholder="Tələblərin xülasəsi"
          />
          <FormTextarea
            defaultValue={values?.notes ?? undefined}
            name="notes"
            placeholder="Proqram qeydləri"
          />
        </div>
      </div>

      {!isEditing ? (
        <div className="rounded-2xl border border-[#dce6f4] bg-white p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#07183a]">
            <CalendarDaysIcon className="size-4 text-[#129344]" />
            Təhsil haqqı
          </div>
          <div className="space-y-3">
            <FormSelect
              defaultValue={defaultPeriodId}
              name="periodId"
              options={periods.map((period) => ({
                label: period.name,
                value: period.id,
              }))}
              required
            />
            <div className="grid gap-3 md:grid-cols-3">
              <FormSelect
                defaultValue={defaultCurrency ?? "USD"}
                name="currency"
                options={CURRENCIES}
              />
              <FormInput
                name="tuitionFee"
                placeholder="Rəsmi qiymət (məs: 12000)"
                required
                type="number"
              />
              <FormInput
                name="discountedTuitionFee"
                placeholder="Endirimli yekun qiymet (məs: 9500)"
                type="number"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <FormSelect
                name="scholarshipType"
                options={SCHOLARSHIP_TYPES}
                placeholder="Teqaud yoxdur"
              />
              <FormInput
                name="scholarshipValue"
                placeholder="Teqaud meblegi/faizi (məs: 2500 ve ya 25)"
                type="number"
              />
            </div>
            <FormSelect
              defaultValue="ACTIVE"
              name="priceStatus"
              options={PRICE_STATUSES}
            />
            <FormTextarea name="paymentNote" placeholder="Odenis qeydi" />
          </div>
        </div>
      ) : null}

      <SubmitButton>
        {isEditing ? "Proqrami yenile" : "Proqram ve tehsil haqqini elave et"}
      </SubmitButton>
    </form>
  );
}

function ProgramNameCombobox({
  defaultValue,
  options,
}: {
  defaultValue: string;
  options: string[];
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const matches = options
    .filter((option) => option.toLowerCase().includes(query))
    .slice(0, 10);
  const hasExactMatch = options.some(
    (option) => option.toLowerCase() === query,
  );

  return (
    <div className="relative">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#0b66ff]" />
        <Input
          className="h-11 rounded-2xl border-[#dce6f4] bg-white pl-9 pr-3 text-sm font-semibold text-[#07183a]"
          name="name"
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Kompüter elmləri"
          required
          value={value}
        />
      </div>
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-30 max-h-72 overflow-y-auto rounded-[1.2rem] border border-[#c9daf5] bg-white p-1.5 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          {matches.length > 0 ? (
            matches.map((option) => (
              <button
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#24365f] transition hover:bg-[#eef5ff] hover:text-[#0b66ff]"
                key={option}
                onMouseDown={(event) => {
                  event.preventDefault();
                  setValue(option);
                  setOpen(false);
                }}
                type="button"
              >
                <BookOpenIcon className="size-4 shrink-0 text-[#0b66ff]" />
                <span className="truncate">{option}</span>
                {option === value ? (
                  <CheckIcon className="ml-auto size-4 shrink-0" />
                ) : null}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm font-semibold text-[#71809f]">
              Netice tapilmadi.
            </div>
          )}
          {value.trim() && !hasExactMatch ? (
            <button
              className="mt-1 flex w-full items-center gap-2 rounded-xl border border-dashed border-[#b8cced] bg-[#f7fbff] px-3 py-2.5 text-left text-sm font-bold text-[#0b66ff] transition hover:border-[#0b66ff]/40 hover:bg-[#eef5ff]"
              onMouseDown={(event) => {
                event.preventDefault();
                setValue(value.trim());
                setOpen(false);
              }}
              type="button"
            >
              <PlusIcon className="size-4 shrink-0" />
              <span className="min-w-0 truncate">
                Yeni proqram kimi elave et: {value.trim()}
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function EditModeBar({ href }: { href: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dce6f4] bg-[#f6f9ff] px-3 py-2">
      <span className="text-sm font-semibold text-[#334568]">
        Redakte rejimi
      </span>
      <Button
        asChild
        className="h-8 rounded-xl border-[#dce6f4] bg-white px-3 text-[#334568]"
        size="sm"
        variant="outline"
      >
        <Link href={href}>
          <XIcon data-icon="inline-start" />
          Cancel
        </Link>
      </Button>
    </div>
  );
}

function FormInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      className={cn("h-11 rounded-2xl border-[#dce6f4]", props.className)}
    />
  );
}

function FormTextarea(props: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      {...props}
      className={cn("min-h-24 rounded-2xl border-[#dce6f4]", props.className)}
    />
  );
}

function FormSelect({
  defaultValue,
  name,
  options,
  placeholder,
  required,
}: {
  defaultValue?: string;
  name: string;
  options: readonly string[] | Option[];
  placeholder?: string;
  required?: boolean;
}) {
  const normalizedDefaultValue =
    defaultValue ?? (placeholder ? EMPTY_SELECT_VALUE : undefined);

  return (
    <Select
      defaultValue={normalizedDefaultValue}
      name={name}
      required={required}
    >
      <SelectTrigger className="h-11 w-full rounded-2xl border-[#dce6f4] bg-white px-3 text-sm font-semibold text-[#07183a] shadow-[0_8px_18px_rgba(15,23,42,0.03)] focus:border-[#0b66ff] focus:ring-[#0b66ff]/15">
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        align="start"
        className="max-h-72 rounded-[1.2rem] border-[#dce6f4] bg-white p-1 shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
        position="popper"
      >
        <SelectGroup>
          {placeholder ? (
            <SelectItem
              value={EMPTY_SELECT_VALUE}
              className="rounded-xl py-2 font-semibold text-[#71809f] focus:bg-[#eef5ff] focus:text-[#0b66ff]"
            >
              {placeholder}
            </SelectItem>
          ) : null}
          {options.map((option) => {
            const value = typeof option === "string" ? option : option.value;
            const label =
              typeof option === "string"
                ? formatEnumLabel(option)
                : option.label;

            return (
              <SelectItem
                key={value}
                value={value}
                className="rounded-xl py-2 font-semibold text-[#24365f] focus:bg-[#eef5ff] focus:text-[#0b66ff]"
              >
                {label}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <Button
      className="h-11 w-full rounded-2xl bg-[#0b66ff] shadow-[0_12px_28px_rgba(37,99,235,0.18)] hover:bg-[#075be8]"
      type="submit"
    >
      {children}
    </Button>
  );
}

function mergeOptions(
  defaults: readonly string[],
  currentValue?: string | null,
): string[] {
  return Array.from(
    new Set([currentValue, ...defaults].filter(Boolean) as string[]),
  );
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
