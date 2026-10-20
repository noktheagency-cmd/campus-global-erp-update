"use client";

import { useMemo, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import type {
  CommissionPackageEducationLevel,
  CommissionPackageProgramOption,
  CommissionPackageScholarshipTriggerType,
} from "@/features/commissions/package-types";
import { cn } from "@/lib/utils";

export type ScholarshipAwardDraft = {
  allPrograms: boolean;
  educationLevel: CommissionPackageEducationLevel;
  programIds: string[];
  quantity: string;
};

export type ScholarshipDraft = {
  additionalInterval: string;
  awards: ScholarshipAwardDraft[];
  educationLevel: CommissionPackageEducationLevel;
  enabled: boolean;
  mixedEnabled: boolean;
  scholarshipCount: string;
  studentThreshold: string;
  triggerType: CommissionPackageScholarshipTriggerType;
};

const educationLevels: Array<{
  id: CommissionPackageEducationLevel;
  label: string;
  summaryLabel: string;
}> = [
  { id: "ASSOCIATE", label: "Önlisans", summaryLabel: "önlisans" },
  { id: "BACHELOR", label: "Bakalavr", summaryLabel: "bakalavr" },
  { id: "MASTER", label: "Magistr", summaryLabel: "magistr" },
  { id: "PHD", label: "Doktorantura", summaryLabel: "doktorantura" },
  { id: "FOUNDATION", label: "Hazırlıq", summaryLabel: "hazırlıq" },
  { id: "LANGUAGE", label: "Dil kursu", summaryLabel: "dil kursu" },
];

export function CommissionScholarshipEditor({
  onChange,
  programs,
  scholarships,
  selectedUniversityIds,
}: {
  onChange: (scholarships: ScholarshipDraft[]) => void;
  programs: CommissionPackageProgramOption[];
  scholarships: ScholarshipDraft[];
  selectedUniversityIds: string[];
}) {
  const [expandedLevel, setExpandedLevel] =
    useState<CommissionPackageEducationLevel | null>("BACHELOR");
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [queries, setQueries] = useState<Record<string, string>>({});
  const selectedUniversities = useMemo(
    () => new Set(selectedUniversityIds),
    [selectedUniversityIds],
  );
  const availablePrograms = useMemo(
    () =>
      programs.filter((program) =>
        selectedUniversities.has(program.universityId),
      ),
    [programs, selectedUniversities],
  );

  function updateScholarship(
    educationLevel: CommissionPackageEducationLevel,
    patch: Partial<Omit<ScholarshipDraft, "educationLevel">>,
  ) {
    onChange(
      scholarships.map((scholarship) =>
        scholarship.educationLevel === educationLevel
          ? { ...scholarship, ...patch }
          : scholarship,
      ),
    );
  }

  function updateAward(
    scholarship: ScholarshipDraft,
    awardIndex: number,
    patch: Partial<ScholarshipAwardDraft>,
  ) {
    updateScholarship(scholarship.educationLevel, {
      awards: scholarship.awards.map((award, index) =>
        index === awardIndex ? { ...award, ...patch } : award,
      ),
    });
  }

  function toggleEnabled(scholarship: ScholarshipDraft) {
    const enabled = !scholarship.enabled;
    updateScholarship(scholarship.educationLevel, { enabled });
    if (enabled) setExpandedLevel(scholarship.educationLevel);
  }

  function toggleMixed(scholarship: ScholarshipDraft) {
    const mixedEnabled = !scholarship.mixedEnabled;
    updateScholarship(scholarship.educationLevel, {
      awards: mixedEnabled
        ? scholarship.awards
        : [
            scholarship.awards.find(
              (award) => award.educationLevel === scholarship.educationLevel,
            ) ?? createAward(scholarship.educationLevel),
          ],
      mixedEnabled,
    });
  }

  function addAward(scholarship: ScholarshipDraft) {
    const usedLevels = new Set(
      scholarship.awards.map((award) => award.educationLevel),
    );
    const nextLevel = educationLevels.find(
      (level) => !usedLevels.has(level.id),
    );
    if (!nextLevel) return;
    updateScholarship(scholarship.educationLevel, {
      awards: [...scholarship.awards, createAward(nextLevel.id)],
    });
  }

  function removeAward(scholarship: ScholarshipDraft, awardIndex: number) {
    if (scholarship.awards.length === 1) return;
    updateScholarship(scholarship.educationLevel, {
      awards: scholarship.awards.filter((_, index) => index !== awardIndex),
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white">
      <p className="border-b border-[#e4ebf3] bg-[#f8fbff] px-4 py-3 text-[11px] leading-5 text-[#687b9c]">
        Tələbə sayına görə qazanılan burs paketini, paketdəki pillələri və uyğun
        ixtisasları müəyyənləşdirin.
      </p>
      <div className="divide-y divide-[#e4ebf3]">
        {scholarships.map((scholarship) => {
          const expanded = expandedLevel === scholarship.educationLevel;
          const label = getLevelLabel(scholarship.educationLevel);
          return (
            <section
              className={cn(
                "transition-colors",
                scholarship.enabled && expanded ? "bg-white" : "bg-[#fbfcfe]",
              )}
              key={scholarship.educationLevel}
            >
              <div className="flex min-h-14 items-center gap-3 px-3 sm:px-4">
                <button
                  aria-label={`${label} burs qaydasını ${scholarship.enabled ? "söndür" : "aktivləşdir"}`}
                  aria-pressed={scholarship.enabled}
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0b66ff]/15",
                    scholarship.enabled
                      ? "border-[#0b66ff] bg-[#0b66ff] text-white"
                      : "border-[#b9c6d8] bg-white",
                  )}
                  onClick={() => toggleEnabled(scholarship)}
                  type="button"
                >
                  {scholarship.enabled ? (
                    <CheckIcon className="size-3.5" strokeWidth={2.4} />
                  ) : null}
                </button>
                <button
                  aria-expanded={expanded}
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 py-3 text-left focus-visible:outline-none"
                  onClick={() =>
                    setExpandedLevel(
                      expanded ? null : scholarship.educationLevel,
                    )
                  }
                  type="button"
                >
                  <span className="text-xs font-bold text-[#17345f]">
                    {label}
                  </span>
                  <span className="ml-auto hidden truncate text-[10px] text-[#7183a0] sm:block">
                    {scholarship.enabled
                      ? createTriggerSummary(scholarship)
                      : "Burs qaydası aktiv deyil"}
                  </span>
                  <ChevronDownIcon
                    className={cn(
                      "size-4 shrink-0 text-[#51698e] transition-transform",
                      expanded ? "rotate-180" : "rotate-0",
                    )}
                  />
                </button>
              </div>

              {expanded ? (
                <div className="border-t border-[#edf1f6] px-3 pb-4 pt-3 sm:px-4">
                  {!scholarship.enabled ? (
                    <button
                      className="w-full rounded-xl border border-dashed border-[#bcd1ed] bg-[#f7fbff] px-4 py-3 text-xs font-semibold text-[#0b61e8] transition-colors hover:bg-[#edf6ff]"
                      onClick={() => toggleEnabled(scholarship)}
                      type="button"
                    >
                      {label} üçün burs qaydası yarat
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-3 rounded-xl border border-[#e0e8f2] bg-[#f8fafc] p-3">
                        <div className="grid grid-cols-2 rounded-xl border border-[#d7e1ee] bg-white p-1">
                          <TriggerModeButton
                            active={
                              scholarship.triggerType === "FIXED_INTERVAL"
                            }
                            label="Sabit interval"
                            onClick={() =>
                              updateScholarship(scholarship.educationLevel, {
                                triggerType: "FIXED_INTERVAL",
                              })
                            }
                          />
                          <TriggerModeButton
                            active={
                              scholarship.triggerType === "FIRST_THEN_EVERY"
                            }
                            label="İlk hədd + davamı"
                            onClick={() =>
                              updateScholarship(scholarship.educationLevel, {
                                triggerType: "FIRST_THEN_EVERY",
                              })
                            }
                          />
                        </div>

                        <div className="grid gap-2 text-xs text-[#425a80] sm:flex sm:flex-wrap sm:items-center">
                          <span className="inline-flex items-center gap-2">
                            <span className="font-semibold">
                              {scholarship.triggerType === "FIRST_THEN_EVERY"
                                ? "İlk"
                                : "Hər"}
                            </span>
                            <CompactNumberInput
                              ariaLabel={`${label} tələbə həddi`}
                              onChange={(studentThreshold) =>
                                updateScholarship(scholarship.educationLevel, {
                                  studentThreshold,
                                })
                              }
                              value={scholarship.studentThreshold}
                            />
                            <span>
                              {scholarship.triggerType === "FIRST_THEN_EVERY"
                                ? "tələbədə"
                                : "tələbədən"}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <CompactNumberInput
                              ariaLabel={`${label} burs paketi sayı`}
                              onChange={(scholarshipCount) =>
                                updateScholarship(scholarship.educationLevel, {
                                  scholarshipCount,
                                })
                              }
                              value={scholarship.scholarshipCount}
                            />
                            <span>burs paketi</span>
                          </span>
                        </div>

                        {scholarship.triggerType === "FIRST_THEN_EVERY" ? (
                          <div className="grid gap-2 border-t border-[#e1e9f2] pt-3 text-xs text-[#425a80] sm:flex sm:flex-wrap sm:items-center">
                            <span className="inline-flex items-center gap-2">
                              <span className="font-semibold">Sonra hər</span>
                              <CompactNumberInput
                                ariaLabel={`${label} sonrakı tələbə intervalı`}
                                onChange={(additionalInterval) =>
                                  updateScholarship(
                                    scholarship.educationLevel,
                                    { additionalInterval },
                                  )
                                }
                                value={scholarship.additionalInterval}
                              />
                            </span>
                            <span>əlavə tələbəyə eyni paket</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between gap-4 border-y border-[#e7edf5] py-3">
                        <span>
                          <strong className="block text-xs text-[#17345f]">
                            Qarışıq pillə tərkibi
                          </strong>
                          <span className="mt-0.5 block text-[10px] leading-4 text-[#7183a0]">
                            Bir paketdə bir neçə pillə üzrə burs verin
                          </span>
                        </span>
                        <button
                          aria-label="Qarışıq pillə tərkibini dəyiş"
                          aria-pressed={scholarship.mixedEnabled}
                          className={cn(
                            "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0b66ff]/15",
                            scholarship.mixedEnabled
                              ? "bg-[#0b66ff]"
                              : "bg-[#c7d2e0]",
                          )}
                          onClick={() => toggleMixed(scholarship)}
                          type="button"
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
                              scholarship.mixedEnabled
                                ? "translate-x-5"
                                : "translate-x-0.5",
                            )}
                          />
                        </button>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <h4 className="text-[11px] font-bold text-[#29466f]">
                            1 burs paketinin tərkibi
                          </h4>
                          <span className="text-[10px] text-[#7183a0]">
                            {scholarship.awards.length} pillə
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {scholarship.awards.map((award, awardIndex) => {
                            const pickerKey = `${scholarship.educationLevel}:${awardIndex}`;
                            const eligiblePrograms = availablePrograms.filter(
                              (program) =>
                                program.educationLevel === award.educationLevel,
                            );
                            return (
                              <AwardEditor
                                award={award}
                                awardIndex={awardIndex}
                                eligiblePrograms={eligiblePrograms}
                                key={pickerKey}
                                mixedEnabled={scholarship.mixedEnabled}
                                onChange={(patch) =>
                                  updateAward(scholarship, awardIndex, patch)
                                }
                                onPickerChange={(open) =>
                                  setOpenPicker(open ? pickerKey : null)
                                }
                                onQueryChange={(query) =>
                                  setQueries((current) => ({
                                    ...current,
                                    [pickerKey]: query,
                                  }))
                                }
                                onRemove={() =>
                                  removeAward(scholarship, awardIndex)
                                }
                                open={openPicker === pickerKey}
                                query={queries[pickerKey] ?? ""}
                                removable={scholarship.awards.length > 1}
                                usedLevels={
                                  new Set(
                                    scholarship.awards.map(
                                      (item) => item.educationLevel,
                                    ),
                                  )
                                }
                              />
                            );
                          })}
                        </div>
                        {scholarship.mixedEnabled &&
                        scholarship.awards.length < educationLevels.length ? (
                          <button
                            className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#b9d2f2] text-[11px] font-bold text-[#0b61e8] transition-colors hover:bg-[#f2f8ff]"
                            onClick={() => addAward(scholarship)}
                            type="button"
                          >
                            <PlusIcon className="size-4" />
                            Pillə əlavə et
                          </button>
                        ) : null}
                      </div>

                      <div className="rounded-xl border border-[#c7dcf8] bg-[#f3f8ff] px-3 py-2.5 text-[11px] font-semibold leading-5 text-[#0b61e8]">
                        {createCompositionSummary(scholarship)}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function AwardEditor({
  award,
  awardIndex,
  eligiblePrograms,
  mixedEnabled,
  onChange,
  onPickerChange,
  onQueryChange,
  onRemove,
  open,
  query,
  removable,
  usedLevels,
}: {
  award: ScholarshipAwardDraft;
  awardIndex: number;
  eligiblePrograms: CommissionPackageProgramOption[];
  mixedEnabled: boolean;
  onChange: (patch: Partial<ScholarshipAwardDraft>) => void;
  onPickerChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onRemove: () => void;
  open: boolean;
  query: string;
  removable: boolean;
  usedLevels: Set<CommissionPackageEducationLevel>;
}) {
  const normalizedQuery = normalize(query);
  const visiblePrograms = normalizedQuery
    ? eligiblePrograms.filter((program) =>
        normalize(`${program.label} ${program.universityLabel}`).includes(
          normalizedQuery,
        ),
      )
    : eligiblePrograms;
  const selectedPrograms = new Set(award.programIds);

  function toggleProgram(programId: string) {
    onChange({
      programIds: selectedPrograms.has(programId)
        ? award.programIds.filter((id) => id !== programId)
        : [...award.programIds, programId],
    });
  }

  return (
    <div className="rounded-xl border border-[#e0e7f0] bg-[#fcfdff] p-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(130px,.75fr)_82px_minmax(210px,1.4fr)_32px] sm:items-start">
        <label className="space-y-1.5">
          <span className="block text-[10px] font-semibold text-[#607598]">
            Pillə
          </span>
          <select
            aria-label={`${awardIndex + 1}. burs pilləsi`}
            className={selectClass}
            disabled={!mixedEnabled}
            onChange={(event) =>
              onChange({
                allPrograms: true,
                educationLevel: event.target
                  .value as CommissionPackageEducationLevel,
                programIds: [],
              })
            }
            value={award.educationLevel}
          >
            {educationLevels.map((level) => (
              <option
                disabled={
                  level.id !== award.educationLevel && usedLevels.has(level.id)
                }
                key={level.id}
                value={level.id}
              >
                {level.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="block text-[10px] font-semibold text-[#607598]">
            Miqdar
          </span>
          <Input
            aria-label={`${getLevelLabel(award.educationLevel)} burs miqdarı`}
            className={inputClass}
            max="100"
            min="1"
            onChange={(event) => onChange({ quantity: event.target.value })}
            required
            type="number"
            value={award.quantity}
          />
        </label>
        <div className="space-y-1.5">
          <span className="block text-[10px] font-semibold text-[#607598]">
            İxtisas əhatəsi
          </span>
          <div className="grid h-10 grid-cols-2 overflow-hidden rounded-xl border border-[#d7e1ee] bg-white p-0.5">
            <button
              aria-pressed={award.allPrograms}
              className={cn(
                "rounded-[9px] text-[11px] font-semibold transition-colors",
                award.allPrograms
                  ? "bg-[#edf5ff] text-[#0b61e8]"
                  : "text-[#617594] hover:bg-[#f5f8fc]",
              )}
              onClick={() => {
                onChange({ allPrograms: true, programIds: [] });
                onPickerChange(false);
              }}
              type="button"
            >
              Hamısı
            </button>
            <button
              aria-pressed={!award.allPrograms}
              className={cn(
                "rounded-[9px] text-[11px] font-semibold transition-colors",
                !award.allPrograms
                  ? "bg-[#edf5ff] text-[#0b61e8]"
                  : "text-[#617594] hover:bg-[#f5f8fc]",
              )}
              onClick={() => {
                onChange({ allPrograms: false });
                onPickerChange(true);
              }}
              type="button"
            >
              Seçim et
            </button>
          </div>
          {award.allPrograms ? (
            <p className="px-1 text-[10px] text-[#7183a0]">
              {eligiblePrograms.length
                ? `${eligiblePrograms.length} aktiv ixtisasın hamısı`
                : "Bu pillədə yaradılacaq bütün ixtisaslar"}
            </p>
          ) : (
            <>
              <button
                className={cn(
                  "w-full px-1 text-left text-[10px] font-semibold",
                  award.programIds.length ? "text-[#0b61e8]" : "text-[#c23b3b]",
                )}
                onClick={() => onPickerChange(!open)}
                type="button"
              >
                {award.programIds.length
                  ? `${award.programIds.length} ixtisas seçilib`
                  : "Ən azı bir ixtisas seçin"}
              </button>
            </>
          )}
        </div>
        <button
          aria-label="Burs tərkibindən pilləni sil"
          className="mt-5 flex size-8 items-center justify-center rounded-lg text-[#9badc4] transition-colors hover:bg-[#fff0f0] hover:text-[#dc3d4b] disabled:pointer-events-none disabled:opacity-20"
          disabled={!removable}
          onClick={onRemove}
          type="button"
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>

      {!award.allPrograms && open ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-[#d9e3ef] bg-white">
          <div className="flex items-center gap-2 border-b border-[#e5ebf3] px-3">
            <SearchIcon className="size-4 shrink-0 text-[#8ca0ba]" />
            <input
              aria-label="İxtisas axtar"
              className="h-10 min-w-0 flex-1 bg-transparent text-[11px] text-[#29466f] outline-none placeholder:text-[#9aabc0]"
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="İxtisas və ya universitet axtar"
              value={query}
            />
            <button
              className="shrink-0 text-[10px] font-bold text-[#0b61e8]"
              onClick={() =>
                onChange({
                  programIds: eligiblePrograms.map((program) => program.id),
                })
              }
              type="button"
            >
              Hamısını seç
            </button>
          </div>
          <div className="max-h-44 overflow-y-auto p-1.5">
            {visiblePrograms.length ? (
              visiblePrograms.map((program) => {
                const checked = selectedPrograms.has(program.id);
                return (
                  <button
                    className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[#f5f8fc]"
                    key={program.id}
                    onClick={() => toggleProgram(program.id)}
                    type="button"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border",
                        checked
                          ? "border-[#0b66ff] bg-[#0b66ff] text-white"
                          : "border-[#bdcadb] bg-white",
                      )}
                    >
                      {checked ? <CheckIcon className="size-3" /> : null}
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-[11px] font-semibold text-[#29466f]">
                        {program.label}
                      </strong>
                      <span className="mt-0.5 block truncate text-[9px] text-[#8191aa]">
                        {program.universityLabel}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-5 text-center text-[10px] leading-5 text-[#8191aa]">
                Seçilmiş universitetlərdə bu pillə üzrə aktiv ixtisas tapılmadı.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-[#e5ebf3] bg-[#fbfcfe] px-3 py-2 text-[10px] text-[#7183a0]">
            <strong className="text-[#29466f]">
              {award.programIds.length} ixtisas seçilib
            </strong>
            <span>{eligiblePrograms.length} mövcuddur</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CompactNumberInput({
  ariaLabel,
  onChange,
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <Input
      aria-label={ariaLabel}
      className="h-9 w-20 rounded-xl border-[#d7e1ee] bg-white text-center text-xs font-bold tabular-nums text-[#253d67]"
      max="100000"
      min="1"
      onChange={(event) => onChange(event.target.value)}
      required
      type="number"
      value={value}
    />
  );
}

function TriggerModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "h-9 rounded-lg px-3 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0b66ff]/15",
        active
          ? "bg-[#eaf3ff] text-[#0b61e8] shadow-[inset_0_0_0_1px_rgba(11,102,255,0.12)]"
          : "text-[#667a99] hover:bg-[#f6f9fc]",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function createTriggerSummary(scholarship: ScholarshipDraft) {
  if (scholarship.triggerType === "FIRST_THEN_EVERY") {
    return `İlk ${scholarship.studentThreshold || "—"}, sonra hər ${scholarship.additionalInterval || "—"} tələbəyə ${scholarship.scholarshipCount || "—"} paket`;
  }
  return `Hər ${scholarship.studentThreshold || "—"} tələbədən ${scholarship.scholarshipCount || "—"} burs paketi`;
}

function createCompositionSummary(scholarship: ScholarshipDraft) {
  const source = getLevelSummaryLabel(scholarship.educationLevel);
  const composition = scholarship.awards
    .map(
      (award) =>
        `${Number(award.quantity) || "—"} ${getLevelSummaryLabel(award.educationLevel)}`,
    )
    .join(" + ");
  const packageComposition = `${Number(scholarship.scholarshipCount) || "—"} × (${composition}) bursu`;
  return scholarship.triggerType === "FIRST_THEN_EVERY"
    ? `İlk ${Number(scholarship.studentThreshold) || "—"} ${source} tələbəsində, sonra hər ${Number(scholarship.additionalInterval) || "—"} əlavə tələbəyə: ${packageComposition}`
    : `Hər ${Number(scholarship.studentThreshold) || "—"} ${source} tələbəsinə: ${packageComposition}`;
}

function createAward(
  educationLevel: CommissionPackageEducationLevel,
): ScholarshipAwardDraft {
  return {
    allPrograms: true,
    educationLevel,
    programIds: [],
    quantity: "1",
  };
}

function getLevelLabel(educationLevel: CommissionPackageEducationLevel) {
  return (
    educationLevels.find((level) => level.id === educationLevel)?.label ??
    educationLevel
  );
}

function getLevelSummaryLabel(educationLevel: CommissionPackageEducationLevel) {
  return (
    educationLevels.find((level) => level.id === educationLevel)
      ?.summaryLabel ?? educationLevel
  );
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("az-AZ");
}

const inputClass =
  "h-10 rounded-xl border-[#d7e1ee] bg-white text-xs focus-visible:border-[#0b66ff] focus-visible:ring-[#0b66ff]/10";
const selectClass =
  "h-10 w-full rounded-xl border border-[#d7e1ee] bg-white px-3 text-[11px] font-semibold text-[#253d67] outline-none focus:border-[#0b66ff] focus:ring-3 focus:ring-[#0b66ff]/10 disabled:bg-[#f2f5f9] disabled:text-[#627491]";
