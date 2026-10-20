"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckIcon, LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { submitCommissionPackageAgreementAction } from "@/features/commissions/package-actions";
import type { CommissionPackageWorkspaceData } from "@/features/commissions/package-types";
import { cn } from "@/lib/utils";

export function CommissionPackageAgreementDrawer({
  data,
  locale,
  onOpenChange,
  open,
}: {
  data: CommissionPackageWorkspaceData;
  locale: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const activePackages = useMemo(
    () => data.packages.filter((item) => item.status === "ACTIVE"),
    [data.packages],
  );
  const [packageId, setPackageId] = useState(
    () => activePackages[0]?.id ?? "",
  );
  const selectedPackage =
    activePackages.find((item) => item.id === packageId) ?? activePackages[0];
  const [academicYear, setAcademicYear] = useState(
    () =>
      selectedPackage?.academicYear ?? data.options.academicYears[1] ?? "",
  );
  const [selectedUniversityIds, setSelectedUniversityIds] = useState<string[]>(
    () => selectedPackage?.universities.map((item) => item.id) ?? [],
  );
  const activeTerm = data.terms.find((term) => term.isActive);

  function selectPackage(nextPackageId: string) {
    const nextPackage = activePackages.find(
      (item) => item.id === nextPackageId,
    );
    setPackageId(nextPackageId);
    setAcademicYear(
      nextPackage?.academicYear ?? data.options.academicYears[1] ?? "",
    );
    setSelectedUniversityIds(
      nextPackage?.universities.map((item) => item.id) ?? [],
    );
  }

  function toggleUniversity(universityId: string) {
    setSelectedUniversityIds((current) =>
      current.includes(universityId)
        ? current.filter((item) => item !== universityId)
        : [...current, universityId],
    );
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="gap-0 overflow-hidden border-[#d4dfed] bg-white p-0 text-[#0b1f44] data-[side=right]:w-full data-[side=right]:sm:max-w-[580px]"
        side="right"
      >
        <SheetHeader className="border-b border-[#e0e7f1] px-5 py-5 pr-14 sm:px-6">
          <SheetTitle className="text-xl font-bold text-[#0b1f44]">
            Paket müqaviləsi göndər
          </SheetTitle>
          <SheetDescription className="mt-1 text-xs leading-5 text-[#68799b]">
            Komissiya paketini, akademik ili və müqaviləyə daxil ediləcək
            universitetləri seçin.
          </SheetDescription>
        </SheetHeader>
        <form
          action={submitCommissionPackageAgreementAction}
          className="flex min-h-0 flex-1 flex-col"
        >
          <input name="locale" type="hidden" value={locale} />
          {selectedUniversityIds.map((universityId) => (
            <input
              key={universityId}
              name="universityIds"
              type="hidden"
              value={universityId}
            />
          ))}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            <section>
              <h3 className="mb-4 text-sm font-bold text-[#122b55]">
                1. Paket və akademik il
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="block text-[11px] font-semibold text-[#52698e]">
                    Komissiya paketi
                  </span>
                  <select
                    className={selectClass}
                    name="packageId"
                    onChange={(event) => selectPackage(event.target.value)}
                    required
                    value={packageId}
                  >
                    {activePackages.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="block text-[11px] font-semibold text-[#52698e]">
                    Akademik il
                  </span>
                  <select
                    className={selectClass}
                    name="academicYear"
                    onChange={(event) => setAcademicYear(event.target.value)}
                    required
                    value={academicYear}
                  >
                    {data.options.academicYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="border-t border-[#e1e8f1] pt-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-[#122b55]">
                  2. Universitetlər
                </h3>
                <span className="text-xs font-semibold text-[#65789a]">
                  {selectedUniversityIds.length} seçilib
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-[#dbe4ef] bg-[#fbfdff] p-2">
                {selectedPackage?.universities.map((university) => {
                  const selected = selectedUniversityIds.includes(university.id);
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
                      {university.name}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="border-t border-[#e1e8f1] pt-5">
              <h3 className="mb-4 text-sm font-bold text-[#122b55]">
                3. Ümumi şərtlər
              </h3>
              {activeTerm ? (
                <div className="rounded-xl border border-[#dbe4ef] bg-[#f8fbff] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-xs text-[#19345e]">
                      {activeTerm.title}
                    </strong>
                    <span className="text-[10px] font-bold text-[#0b66ff]">
                      v{activeTerm.version}
                    </span>
                  </div>
                  <p className="mt-3 max-h-36 overflow-y-auto whitespace-pre-line text-[11px] leading-5 text-[#637597]">
                    {activeTerm.content}
                  </p>
                </div>
              ) : (
                <p className="rounded-xl border border-[#ffd3d6] bg-[#fff4f5] p-4 text-xs text-[#a53b43]">
                  Aktiv ümumi şərt versiyası yoxdur.
                </p>
              )}
              <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-[#40577d]">
                <input
                  className="mt-0.5 size-4 rounded border-[#b8c7da] accent-[#0b66ff]"
                  name="acceptedTerms"
                  required
                  type="checkbox"
                />
                Paket qaydaları və v{activeTerm?.version ?? "—"} ümumi şərtləri
                ilə razıyam.
              </label>
            </section>

            <section className="border-t border-[#e1e8f1] pt-5">
              <label className="space-y-1.5">
                <span className="block text-[11px] font-semibold text-[#52698e]">
                  Qeyd (istəyə bağlı)
                </span>
                <Textarea
                  className="min-h-24 rounded-xl border-[#d7e1ee] text-xs"
                  maxLength={1_000}
                  name="notes"
                  placeholder="Müqavilə ilə bağlı əlavə qeyd"
                />
              </label>
            </section>
          </div>
          <SheetFooter className="flex-row items-center justify-end border-t border-[#dfe7f1] px-5 py-4 sm:px-6">
            <SheetClose asChild>
              <Button
                className="h-10 rounded-xl px-4 text-xs font-semibold"
                type="button"
                variant="ghost"
              >
                Ləğv et
              </Button>
            </SheetClose>
            <AgreementSubmitButton
              disabled={
                !activeTerm ||
                !selectedPackage ||
                selectedUniversityIds.length === 0 ||
                data.availability === "UNAVAILABLE"
              }
            />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function AgreementSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      className="h-10 rounded-xl bg-[#0b66ff] px-5 text-xs font-bold text-white shadow-[0_9px_22px_rgba(11,102,255,0.22)] hover:bg-[#0758dc]"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
      Təsdiqə göndər
    </Button>
  );
}

const selectClass =
  "h-10 w-full rounded-xl border border-[#d7e1ee] bg-white px-3 text-xs text-[#253d67] outline-none focus:border-[#0b66ff] focus:ring-3 focus:ring-[#0b66ff]/10";
