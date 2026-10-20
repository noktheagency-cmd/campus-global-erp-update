"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckIcon, LoaderCircleIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { saveCommissionPackageAction } from "@/features/commissions/package-actions";
import {
  CommissionScholarshipEditor,
  type ScholarshipDraft,
} from "@/features/commissions/components/commission-scholarship-editor";
import type {
  CommissionPackageEducationLevel,
  CommissionPackageRecord,
  CommissionPackageRuleType,
  CommissionPackageWorkspaceData,
} from "@/features/commissions/package-types";
import { cn } from "@/lib/utils";

type RuleDraft = {
  commissionType: CommissionPackageRuleType;
  currency: string;
  educationLevel: CommissionPackageEducationLevel;
  fixedAmount: string;
  rateTier1: string;
  rateTier2: string;
  tierThreshold: string;
};

const educationLevels: Array<{
  id: CommissionPackageEducationLevel;
  label: string;
}> = [
  { id: "ASSOCIATE", label: "Önlisans" },
  { id: "BACHELOR", label: "Bakalavr" },
  { id: "MASTER", label: "Magistr" },
  { id: "PHD", label: "Doktorantura" },
  { id: "FOUNDATION", label: "Hazırlıq" },
  { id: "LANGUAGE", label: "Dil kursu" },
];

export function CommissionPackageDrawer({
  data,
  editingPackage,
  locale,
  onOpenChange,
  open,
}: {
  data: CommissionPackageWorkspaceData;
  editingPackage: CommissionPackageRecord | null;
  locale: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [name, setName] = useState(() => editingPackage?.name ?? "");
  const [academicYear, setAcademicYear] = useState(() =>
    editingPackage
      ? (editingPackage.academicYear ?? "")
      : (data.options.academicYears[1] ?? data.options.academicYears[0] ?? ""),
  );
  const [description, setDescription] = useState(
    () => editingPackage?.description ?? "",
  );
  const [universityQuery, setUniversityQuery] = useState("");
  const [selectedUniversityIds, setSelectedUniversityIds] = useState<string[]>(
    () => editingPackage?.universities.map((university) => university.id) ?? [],
  );
  const [rules, setRules] = useState<RuleDraft[]>(() =>
    createRuleDrafts(editingPackage),
  );
  const [scholarshipDrafts, setScholarshipDrafts] = useState<
    ScholarshipDraft[]
  >(() => createScholarshipDrafts(editingPackage));
  const universities = useMemo(() => {
    const normalized = normalize(universityQuery);
    return data.options.universities.filter((university) =>
      normalize(university.label).includes(normalized),
    );
  }, [data.options.universities, universityQuery]);

  const scholarships = scholarshipDrafts
    .filter((item) => item.enabled)
    .map(
      ({
        additionalInterval,
        awards,
        educationLevel,
        scholarshipCount,
        studentThreshold,
        triggerType,
      }) => ({
        additionalInterval:
          triggerType === "FIRST_THEN_EVERY" ? additionalInterval : null,
        awards: awards.map((award) => ({
          allPrograms: award.allPrograms,
          educationLevel: award.educationLevel,
          programIds: award.allPrograms ? [] : award.programIds,
          quantity: award.quantity,
        })),
        educationLevel,
        scholarshipCount,
        studentThreshold,
        triggerType,
      }),
    );

  function toggleUniversity(universityId: string) {
    setSelectedUniversityIds((current) => {
      const next = current.includes(universityId)
        ? current.filter((item) => item !== universityId)
        : [...current, universityId];
      const allowedUniversities = new Set(next);
      const allowedPrograms = new Set(
        data.options.programs
          .filter((program) => allowedUniversities.has(program.universityId))
          .map((program) => program.id),
      );
      setScholarshipDrafts((scholarships) =>
        scholarships.map((scholarship) => ({
          ...scholarship,
          awards: scholarship.awards.map((award) => ({
            ...award,
            programIds: award.programIds.filter((programId) =>
              allowedPrograms.has(programId),
            ),
          })),
        })),
      );
      return next;
    });
  }

  function updateRule(
    educationLevel: CommissionPackageEducationLevel,
    field: keyof RuleDraft,
    value: string,
  ) {
    setRules((current) =>
      current.map((rule) =>
        rule.educationLevel === educationLevel
          ? { ...rule, [field]: value }
          : rule,
      ),
    );
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="gap-0 overflow-hidden border-[#d4dfed] bg-white p-0 text-[#0b1f44] shadow-[-24px_0_70px_rgba(15,31,65,0.18)] data-[side=right]:w-full data-[side=right]:sm:max-w-[780px]"
        side="right"
      >
        <SheetHeader className="border-b border-[#e0e7f1] px-5 py-5 pr-14 sm:px-6">
          <SheetTitle className="text-xl font-bold tracking-[-0.02em] text-[#0b1f44]">
            {editingPackage
              ? "Komissiya paketini redaktə et"
              : "Yeni komissiya paketi"}
          </SheetTitle>
          <SheetDescription className="mt-1 text-xs leading-5 text-[#68799b]">
            Universitetlər, təhsil səviyyələri və təqaüd qaydalarını bir paketdə
            birləşdirin.
          </SheetDescription>
        </SheetHeader>

        <form
          action={saveCommissionPackageAction}
          className="flex min-h-0 flex-1 flex-col"
        >
          <input name="locale" type="hidden" value={locale} />
          <input
            name="packageId"
            type="hidden"
            value={editingPackage?.id ?? ""}
          />
          <input name="rulesJson" type="hidden" value={JSON.stringify(rules)} />
          <input name="mixedScholarshipJson" type="hidden" value="null" />
          <input
            name="scholarshipsJson"
            type="hidden"
            value={JSON.stringify(scholarships)}
          />
          {selectedUniversityIds.map((universityId) => (
            <input
              key={universityId}
              name="universityIds"
              type="hidden"
              value={universityId}
            />
          ))}

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <DrawerSection number="1" title="Paket məlumatları">
              <div className="grid gap-4 sm:grid-cols-[1.35fr_.65fr]">
                <Field label="Paket adı">
                  <Input
                    className={inputClass}
                    maxLength={120}
                    name="name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Məsələn, Türkiyə 2026 — Standart"
                    required
                    value={name}
                  />
                </Field>
                <Field label="Akademik il">
                  <select
                    className={selectClass}
                    name="academicYear"
                    onChange={(event) => setAcademicYear(event.target.value)}
                    value={academicYear}
                  >
                    <option value="">Bütün illər</option>
                    {data.options.academicYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Təsvir">
                <Textarea
                  className="min-h-20 rounded-xl border-[#d7e1ee] bg-white text-xs leading-5 focus-visible:border-[#0b66ff] focus-visible:ring-[#0b66ff]/10"
                  maxLength={1_000}
                  name="description"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Paketin tətbiq sahəsini qısa izah edin"
                  value={description}
                />
              </Field>
            </DrawerSection>

            <DrawerSection number="2" title="Universitetlər">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative min-w-0 flex-1">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7890b1]" />
                  <input
                    className="h-10 w-full rounded-xl border border-[#d7e1ee] pl-9 pr-3 text-xs outline-none placeholder:text-[#8b9bb7] focus:border-[#0b66ff] focus:ring-3 focus:ring-[#0b66ff]/10"
                    onChange={(event) => setUniversityQuery(event.target.value)}
                    placeholder="Universitet axtar"
                    type="search"
                    value={universityQuery}
                  />
                </label>
                <span className="text-xs font-semibold text-[#62779b]">
                  {selectedUniversityIds.length} universitet seçilib
                </span>
                <button
                  className="text-xs font-bold text-[#0b66ff] hover:underline"
                  onClick={() =>
                    setSelectedUniversityIds(
                      data.options.universities.map((item) => item.id),
                    )
                  }
                  type="button"
                >
                  Hamısını seç
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[#dbe4ef] bg-[#fbfdff] p-2">
                {universities.length ? (
                  universities.map((university) => {
                    const selected = selectedUniversityIds.includes(
                      university.id,
                    );
                    return (
                      <button
                        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs text-[#253e69] hover:bg-[#f0f6ff]"
                        key={university.id}
                        onClick={() => toggleUniversity(university.id)}
                        type="button"
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded border",
                            selected
                              ? "border-[#0b66ff] bg-[#0b66ff] text-white"
                              : "border-[#b9c6d8] bg-white",
                          )}
                        >
                          {selected ? <CheckIcon className="size-3" /> : null}
                        </span>
                        {university.label}
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-6 text-center text-xs text-[#7081a0]">
                    Universitet tapılmadı
                  </p>
                )}
              </div>
            </DrawerSection>

            <DrawerSection number="3" title="Komissiya qaydaları">
              <div className="overflow-x-auto rounded-xl border border-[#dbe4ef]">
                <div className="min-w-[590px]">
                  <div className="grid grid-cols-[.9fr_1.25fr_.82fr_.92fr_.82fr] gap-2 border-b border-[#e3eaf3] bg-[#f9fbfe] px-3 py-2 text-[10px] font-bold text-[#6a7d9c]">
                    <span>Səviyyə</span>
                    <span>Komissiya növü</span>
                    <span>Dəyər 1</span>
                    <span>Şərt</span>
                    <span>Dəyər 2</span>
                  </div>
                  {rules.map((rule) => (
                    <RuleRow
                      key={rule.educationLevel}
                      onChange={(field, value) =>
                        updateRule(rule.educationLevel, field, value)
                      }
                      rule={rule}
                    />
                  ))}
                </div>
              </div>
            </DrawerSection>

            <DrawerSection number="4" title="Burs (təqaüd) şərtləri">
              <CommissionScholarshipEditor
                onChange={setScholarshipDrafts}
                programs={data.options.programs}
                scholarships={scholarshipDrafts}
                selectedUniversityIds={selectedUniversityIds}
              />
            </DrawerSection>
          </div>

          <SheetFooter className="grid grid-cols-2 gap-2 border-t border-[#dfe7f1] bg-white px-5 py-4 sm:flex sm:flex-row sm:items-center sm:justify-end sm:px-6">
            <SheetClose asChild>
              <Button
                className="h-10 w-full rounded-xl px-4 text-xs font-semibold text-[#3d5276] sm:w-auto"
                type="button"
                variant="ghost"
              >
                Ləğv et
              </Button>
            </SheetClose>
            <SubmitButton
              disabled={data.availability === "UNAVAILABLE"}
              label="Qaralama saxla"
              status="DRAFT"
              variant="outline"
            />
            <SubmitButton
              className="col-span-2 sm:col-span-1"
              disabled={data.availability === "UNAVAILABLE"}
              label="Aktivləşdir və saxla"
              status="ACTIVE"
              variant="default"
            />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function RuleRow({
  onChange,
  rule,
}: {
  onChange: (field: keyof RuleDraft, value: string) => void;
  rule: RuleDraft;
}) {
  const label = educationLevels.find(
    (item) => item.id === rule.educationLevel,
  )?.label;
  const fixed = rule.commissionType === "FIXED";
  return (
    <div className="grid grid-cols-[.9fr_1.25fr_.82fr_.92fr_.82fr] gap-2 border-b border-[#e8eef5] px-3 py-2.5 text-xs last:border-b-0">
      <span className="self-center font-bold text-[#1c365f]">{label}</span>
      <select
        aria-label={`${label} komissiya növü`}
        className={compactSelectClass}
        onChange={(event) => onChange("commissionType", event.target.value)}
        value={rule.commissionType}
      >
        <option value="FIXED">Sabit məbləğ</option>
        <option value="PERCENTAGE_CASH">Nağd faiz</option>
        <option value="PERCENTAGE_DELAYED">Gecikmiş faiz</option>
      </select>
      <div className="relative">
        <input
          aria-label={`${label} birinci dəyər`}
          className={compactInputClass}
          min="0"
          onChange={(event) =>
            onChange(fixed ? "fixedAmount" : "rateTier1", event.target.value)
          }
          step={fixed ? "1" : "0.1"}
          type="number"
          value={fixed ? rule.fixedAmount : rule.rateTier1}
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#7688a6]">
          {fixed ? rule.currency : "%"}
        </span>
      </div>
      {fixed ? (
        <span className="self-center text-center text-[#9aabc0]">—</span>
      ) : (
        <div className="relative">
          <input
            aria-label={`${label} tələbə həddi`}
            className={compactInputClass}
            min="1"
            onChange={(event) => onChange("tierThreshold", event.target.value)}
            type="number"
            value={rule.tierThreshold}
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#7688a6]">
            tələbə
          </span>
        </div>
      )}
      {fixed ? (
        <span className="self-center text-center text-[#9aabc0]">—</span>
      ) : (
        <div className="relative">
          <input
            aria-label={`${label} ikinci faiz`}
            className={compactInputClass}
            max="100"
            min="0"
            onChange={(event) => onChange("rateTier2", event.target.value)}
            step="0.1"
            type="number"
            value={rule.rateTier2}
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#7688a6]">
            %
          </span>
        </div>
      )}
    </div>
  );
}

function DrawerSection({
  children,
  number,
  title,
}: {
  children: React.ReactNode;
  number: string;
  title: string;
}) {
  return (
    <section className="border-b border-[#e1e8f1] py-5 first:pt-0 last:border-b-0 last:pb-2">
      <h3 className="mb-4 text-sm font-bold text-[#122b55]">
        {number}. {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[11px] font-semibold text-[#52698e]">
        {label}
      </span>
      {children}
    </label>
  );
}

function SubmitButton({
  className,
  disabled,
  label,
  status,
  variant,
}: {
  className?: string;
  disabled: boolean;
  label: string;
  status: "ACTIVE" | "DRAFT";
  variant: "default" | "outline";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      className={cn(
        "h-10 rounded-xl px-4 text-xs font-bold",
        variant === "outline"
          ? "border-[#b9d2f8] bg-white text-[#0b61e8] hover:bg-[#f4f8ff]"
          : "bg-[#0b66ff] text-white shadow-[0_9px_22px_rgba(11,102,255,0.22)] hover:bg-[#0758dc]",
        className,
      )}
      disabled={disabled || pending}
      name="status"
      type="submit"
      value={status}
      variant={variant}
    >
      {pending ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}

function createDefaultRules(): RuleDraft[] {
  return educationLevels.map(({ id }) => createDefaultRule(id));
}

function createRuleDrafts(
  editingPackage: CommissionPackageRecord | null,
): RuleDraft[] {
  if (!editingPackage) return createDefaultRules();
  return educationLevels.map(({ id }) => {
    const rule = editingPackage.rules.find(
      (item) => item.educationLevel === id,
    );
    return rule
      ? {
          commissionType: rule.commissionType,
          currency: rule.currency,
          educationLevel: id,
          fixedAmount: String(rule.fixedAmount ?? ""),
          rateTier1: String(rule.rateTier1 ?? ""),
          rateTier2: String(rule.rateTier2 ?? ""),
          tierThreshold: String(rule.tierThreshold),
        }
      : createDefaultRule(id);
  });
}

function createScholarshipDrafts(
  editingPackage: CommissionPackageRecord | null,
): ScholarshipDraft[] {
  return educationLevels.map(({ id }) => {
    const scholarship = editingPackage?.scholarships.find(
      (item) => item.educationLevel === id,
    );
    const defaults = scholarshipDefaults[id];
    const awards = scholarship?.awards.length
      ? scholarship.awards.map((award) => ({
          allPrograms: award.allPrograms,
          educationLevel: award.educationLevel,
          programIds: award.programs.map((program) => program.id),
          quantity: String(award.quantity),
        }))
      : [
          {
            allPrograms: true,
            educationLevel: id,
            programIds: [],
            quantity: "1",
          },
        ];
    return {
      additionalInterval: String(scholarship?.additionalInterval ?? 15),
      awards,
      educationLevel: id,
      enabled: scholarship ? true : !editingPackage && id === "BACHELOR",
      mixedEnabled: awards.length > 1 || awards[0]?.educationLevel !== id,
      scholarshipCount: String(
        scholarship?.scholarshipCount ?? defaults.scholarshipCount,
      ),
      studentThreshold: String(
        scholarship?.studentThreshold ?? defaults.studentThreshold,
      ),
      triggerType: scholarship?.triggerType ?? "FIXED_INTERVAL",
    };
  });
}

function createDefaultRule(
  educationLevel: CommissionPackageEducationLevel,
): RuleDraft {
  const percentage = ["BACHELOR", "PHD"].includes(educationLevel);
  return {
    commissionType:
      educationLevel === "PHD"
        ? "PERCENTAGE_DELAYED"
        : percentage
          ? "PERCENTAGE_CASH"
          : "FIXED",
    currency: "USD",
    educationLevel,
    fixedAmount: educationLevel === "MASTER" ? "400" : "300",
    rateTier1: educationLevel === "PHD" ? "15" : "20",
    rateTier2: educationLevel === "PHD" ? "20" : "25",
    tierThreshold: educationLevel === "PHD" ? "10" : "20",
  };
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("az-AZ");
}

const inputClass =
  "h-10 rounded-xl border-[#d7e1ee] bg-white text-xs focus-visible:border-[#0b66ff] focus-visible:ring-[#0b66ff]/10";
const selectClass =
  "h-10 w-full rounded-xl border border-[#d7e1ee] bg-white px-3 text-xs text-[#253d67] outline-none focus:border-[#0b66ff] focus:ring-3 focus:ring-[#0b66ff]/10";
const compactSelectClass =
  "h-8 w-full rounded-lg border border-[#d8e2ee] bg-white px-2 text-[11px] text-[#253d67] outline-none focus:border-[#0b66ff]";
const compactInputClass =
  "h-8 w-full rounded-lg border border-[#d8e2ee] bg-white pl-2 pr-9 text-[11px] tabular-nums text-[#253d67] outline-none focus:border-[#0b66ff]";
const scholarshipDefaults: Record<
  CommissionPackageEducationLevel,
  { scholarshipCount: number; studentThreshold: number }
> = {
  ASSOCIATE: { scholarshipCount: 1, studentThreshold: 10 },
  BACHELOR: { scholarshipCount: 1, studentThreshold: 10 },
  MASTER: { scholarshipCount: 2, studentThreshold: 8 },
  PHD: { scholarshipCount: 1, studentThreshold: 5 },
  FOUNDATION: { scholarshipCount: 1, studentThreshold: 10 },
  LANGUAGE: { scholarshipCount: 1, studentThreshold: 10 },
};
