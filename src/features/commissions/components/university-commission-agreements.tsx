"use client";

import { useMemo, useState } from "react";

import {
  createUniversityCommissionAgreementAction,
  suspendUniversityCommissionAgreementAction,
} from "@/features/commissions/actions";
import type { CommissionWorkspaceData } from "@/features/commissions/types";
import { FINANCE_CURRENCIES } from "@/features/finance/constants";

const fieldClass =
  "mt-1.5 h-10 w-full rounded-lg border border-[#dbe4ef] bg-white px-3 text-sm text-[#0b1f44]";

export function UniversityCommissionAgreements({
  data,
  defaultDate,
  locale,
}: {
  data: CommissionWorkspaceData;
  defaultDate: string;
  locale: string;
}) {
  const [universityId, setUniversityId] = useState(
    data.options.universities[0]?.id ?? "",
  );
  const programs = useMemo(
    () =>
      data.options.programs.filter(
        (program) => program.universityId === universityId,
      ),
    [data.options.programs, universityId],
  );
  const endDate = `${Number(defaultDate.slice(0, 4)) + 1}-12-31`;

  return (
    <section className="space-y-4 rounded-2xl border border-[#dbe4ef] bg-white p-4 shadow-[0_8px_28px_rgba(35,58,95,0.05)] sm:p-5">
      <div>
        <h2 className="text-lg font-bold text-[#0b1f44]">
          Universitetin ümumi komissiya müqavilələri
        </h2>
        <p className="mt-1 text-xs leading-5 text-[#52678d]">
          Hər tələbə ödənişi üzrə universitetin ödəyəcəyi ümumi payı qeyd edin.
          Paket üzrə agent payı bu məbləğdən çıxılır, fərq Campus Global
          gəliridir.
        </p>
      </div>

      <form
        action={createUniversityCommissionAgreementAction}
        className="grid gap-3 rounded-xl bg-[#f7faff] p-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <input name="locale" type="hidden" value={locale} />
        <label className="text-xs font-semibold text-[#52678d]">
          Universitet
          <select
            className={fieldClass}
            name="universityId"
            onChange={(event) => setUniversityId(event.target.value)}
            required
            value={universityId}
          >
            {data.options.universities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#52678d]">
          Proqram əhatəsi
          <select className={fieldClass} key={universityId} name="programId">
            <option value="">Bütün proqramlar</option>
            {programs.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#52678d]">
          Valyuta
          <select className={fieldClass} defaultValue="USD" name="currency">
            {FINANCE_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#52678d]">
          Hesab üsulu
          <select
            className={fieldClass}
            defaultValue="FIXED"
            name="grossMethod"
          >
            <option value="FIXED">Sabit məbləğ</option>
            <option value="PERCENTAGE">Ödənişin faizi</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-[#52678d]">
          Ümumi komissiya məbləği / faizi
          <input
            className={fieldClass}
            min="0.0001"
            name="grossValue"
            required
            step="0.0001"
            type="number"
          />
        </label>
        <label className="text-xs font-semibold text-[#52678d]">
          Başlanğıc tarixi
          <input
            className={fieldClass}
            defaultValue={defaultDate}
            name="validFrom"
            required
            type="date"
          />
        </label>
        <label className="text-xs font-semibold text-[#52678d]">
          Bitmə tarixi
          <input
            className={fieldClass}
            defaultValue={endDate}
            name="validUntil"
            required
            type="date"
          />
        </label>
        <label className="text-xs font-semibold text-[#52678d]">
          Qeyd
          <input
            className={fieldClass}
            name="notes"
            placeholder="Müqavilə qeydi"
          />
        </label>
        <button
          className="h-10 rounded-lg bg-[#0b66ff] px-4 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2 xl:col-span-4"
          disabled={data.availability !== "READY" || !universityId}
          type="submit"
        >
          Universitet müqaviləsini aktivləşdir
        </button>
      </form>

      <div className="grid gap-2">
        {data.universityAgreements.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#dbe4ef] p-4 text-sm text-[#63749a]">
            Hələ universitet komissiya müqaviləsi yoxdur.
          </p>
        ) : (
          data.universityAgreements.map((agreement) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dbe4ef] p-3 text-sm"
              key={agreement.id}
            >
              <div>
                <div className="font-bold text-[#0b1f44]">
                  {agreement.universityName} · {agreement.code}
                </div>
                <div className="mt-1 text-xs text-[#63749a]">
                  {agreement.scopeLabel} ·{" "}
                  {agreement.grossMethod === "FIXED"
                    ? `${agreement.currency} ${agreement.grossValue}`
                    : `${agreement.grossValue}%`}{" "}
                  · {agreement.validFrom}–{agreement.validUntil} ·{" "}
                  {agreement.status}
                </div>
              </div>
              {agreement.status === "ACTIVE" ? (
                <form action={suspendUniversityCommissionAgreementAction}>
                  <input name="locale" type="hidden" value={locale} />
                  <input
                    name="agreementId"
                    type="hidden"
                    value={agreement.id}
                  />
                  <button
                    className="rounded-lg border border-[#dbe4ef] px-3 py-2 text-xs font-bold text-[#52678d]"
                    type="submit"
                  >
                    Dayandır
                  </button>
                </form>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
