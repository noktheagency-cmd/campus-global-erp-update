"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertTriangleIcon,
  CalculatorIcon,
  FileUpIcon,
  InfoIcon,
  LoaderCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  createCommissionAgreementAction,
  createCommissionPaymentAction,
} from "@/features/commissions/actions";
import type { CommissionWorkspaceData } from "@/features/commissions/types";
import { FINANCE_CURRENCIES } from "@/features/finance/constants";
import { cn } from "@/lib/utils";

export function CommissionAgreementDrawer({
  data,
  defaultDate,
  locale,
  onOpenChange,
  open,
}: {
  data: CommissionWorkspaceData;
  defaultDate: string;
  locale: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [universityId, setUniversityId] = useState(
    () => data.options.universities[0]?.id ?? "",
  );
  const [campusMethod, setCampusMethod] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE",
  );
  const [agentMethod, setAgentMethod] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE",
  );
  const [campusValue, setCampusValue] = useState("12");
  const [agentValue, setAgentValue] = useState("5");
  const programs = useMemo(
    () =>
      data.options.programs.filter(
        (program) => program.universityId === universityId,
      ),
    [data.options.programs, universityId],
  );
  const exampleBasis = 10_000;
  const campusAmount = calculatePreview(
    exampleBasis,
    campusMethod,
    campusValue,
  );
  const agentAmount = calculatePreview(exampleBasis, agentMethod, agentValue);
  const nextNumber = String(data.agreements.length + 14).padStart(3, "0");
  const currentYear = Number(defaultDate.slice(0, 4));

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="gap-0 overflow-hidden border-[#d4dfed] bg-white p-0 text-[#0b1f44] shadow-[-24px_0_70px_rgba(15,31,65,0.18)] data-[side=right]:w-full data-[side=right]:sm:max-w-[620px]"
        side="right"
      >
        <SheetHeader className="border-b border-[#e0e7f1] px-5 py-5 pr-14 sm:px-6">
          <SheetTitle className="text-xl font-bold tracking-[-0.02em] text-[#0b1f44]">
            Yeni komissiya müqaviləsi
          </SheetTitle>
          <SheetDescription className="mt-1 text-xs leading-5 text-[#68799b]">
            Universitet, agent və ödəniş qaydasına uyğun qazanc paylarını
            müəyyən edin.
          </SheetDescription>
        </SheetHeader>

        <form
          action={createCommissionAgreementAction}
          className="flex min-h-0 flex-1 flex-col"
        >
          <input name="locale" type="hidden" value={locale} />
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <FormSection number="1" title="Müqavilə tərəfləri">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Müqavilə kodu">
                  <Input
                    className={inputClass}
                    defaultValue={`CG-COM-${currentYear}-${nextNumber}`}
                    name="code"
                    required
                  />
                </Field>
                <Field label="Universitet">
                  <select
                    className={selectClass}
                    name="universityId"
                    onChange={(event) => setUniversityId(event.target.value)}
                    required
                    value={universityId}
                  >
                    <option value="">Universitet seçin</option>
                    {data.options.universities.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Agent">
                  <select className={selectClass} name="agentId" required>
                    <option value="">Agent seçin</option>
                    {data.options.agents.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Əhatə">
                  <select className={selectClass} name="programId">
                    <option value="">Bütün proqramlar</option>
                    {programs.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </FormSection>

            <FormSection number="2" title="Hesablama qaydası">
              <input
                name="calculationBasis"
                type="hidden"
                value="PAYMENT_AMOUNT"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Hesablama bazası">
                  <ReadOnlyValue value="Ödənilən məbləğ" />
                </Field>
                <Field label="Trigger">
                  <ReadOnlyValue value="Ödəniş POSTED olduqda" />
                </Field>
                <ShareField
                  label="Campus Global payı"
                  method={campusMethod}
                  methodName="campusMethod"
                  onMethodChange={setCampusMethod}
                  onValueChange={setCampusValue}
                  value={campusValue}
                  valueName="campusValue"
                />
                <ShareField
                  label="Agent payı"
                  method={agentMethod}
                  methodName="agentMethod"
                  onMethodChange={setAgentMethod}
                  onValueChange={setAgentValue}
                  value={agentValue}
                  valueName="agentValue"
                />
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#eef6ff] px-3 py-2.5 text-xs leading-5 text-[#315b90]">
                <InfoIcon className="mt-0.5 size-4 shrink-0 text-[#0b66ff]" />
                Hər hissəvi ödəniş ayrıca hesablanır və müqavilə qaydası həmin
                anda snapshot kimi saxlanılır.
              </div>
              <label className="mt-3 flex items-center gap-2 text-xs font-medium text-[#30466f]">
                <input
                  className="size-4 rounded border-[#bac9dd] accent-[#0b66ff]"
                  name="installmentPolicy"
                  type="checkbox"
                  value="FIRST_PAYMENT_ONLY"
                />
                Yalnız ilk ödəniş üzrə komissiya hesabla
              </label>
              <input
                name="installmentPolicy"
                type="hidden"
                value="EVERY_PAYMENT"
              />
            </FormSection>

            <FormSection number="3" title="Müddət və hesablaşma">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Başlama tarixi">
                  <Input
                    className={inputClass}
                    defaultValue={`${currentYear}-09-01`}
                    name="validFrom"
                    required
                    type="date"
                  />
                </Field>
                <Field label="Bitmə tarixi">
                  <Input
                    className={inputClass}
                    defaultValue={`${currentYear + 1}-08-31`}
                    name="validUntil"
                    required
                    type="date"
                  />
                </Field>
                <Field label="Valyuta">
                  <select
                    className={selectClass}
                    defaultValue="AZN"
                    name="currency"
                  >
                    {FINANCE_CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field className="sm:col-span-2" label="Agent ödəniş müddəti">
                  <select
                    className={selectClass}
                    defaultValue="15"
                    name="paymentTermDays"
                  >
                    <option value="7">7 iş günü</option>
                    <option value="15">15 iş günü</option>
                    <option value="20">20 iş günü</option>
                    <option value="30">30 iş günü</option>
                  </select>
                </Field>
                <Field label="Status">
                  <ReadOnlyValue value="Saxlama düyməsi ilə seçilir" />
                </Field>
              </div>
            </FormSection>

            <FormSection number="4" title="Hesablama önizləməsi">
              <div className="overflow-hidden rounded-xl border border-[#dbe5f1] bg-[#fbfdff]">
                <div className="flex items-center gap-2 border-b border-[#e2e9f2] px-3 py-2 text-xs font-semibold text-[#40587f]">
                  <CalculatorIcon className="size-4 text-[#0b66ff]" />
                  Nümunə ödəniş: AZN 10,000
                </div>
                <div className="grid grid-cols-3 divide-x divide-[#e2e9f2]">
                  <PreviewAmount
                    label="Campus Global"
                    value={formatMoney(campusAmount, "AZN")}
                  />
                  <PreviewAmount
                    label="Agent"
                    value={formatMoney(agentAmount, "AZN")}
                  />
                  <PreviewAmount
                    label="Xalis məbləğ"
                    value={formatMoney(
                      Math.max(0, exampleBasis - campusAmount - agentAmount),
                      "AZN",
                    )}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection number="5" title="Sənəd və qeyd">
              <Field label="Müqavilə sənədini əlavə et">
                <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-[#bfd0e5] bg-[#f9fbff] px-4 py-5 text-center transition hover:border-[#0b66ff] hover:bg-[#f2f7ff]">
                  <FileUpIcon className="size-5 text-[#0b66ff]" />
                  <span>
                    <span className="block text-xs font-semibold text-[#243b65]">
                      Faylı seçin və ya bura sürükləyin
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[#7786a4]">
                      PDF, DOCX (maks. 10 MB)
                    </span>
                  </span>
                  <input
                    accept=".pdf,.doc,.docx"
                    className="sr-only"
                    name="agreementFile"
                    type="file"
                  />
                </label>
              </Field>
              <Field className="mt-4" label="Daxili qeyd">
                <Textarea
                  className="min-h-20 rounded-xl border-[#d4dfed] bg-white text-sm placeholder:text-[#9aa8bf]"
                  name="notes"
                  placeholder="Müqavilə şərtləri ilə bağlı daxili qeyd əlavə edin..."
                />
              </Field>
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#f4d59b] bg-[#fff9ec] px-3 py-2.5 text-xs leading-5 text-[#8b5d08]">
                <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
                Tarix intervalında eyni agent, universitet və əhatə üçün
                üst-üstə düşən aktiv müqavilə ola bilməz.
              </div>
            </FormSection>
          </div>

          <SheetFooter className="flex-row items-center justify-end border-t border-[#dfe7f1] bg-white px-5 py-4 sm:px-6">
            <SheetClose asChild>
              <Button
                className="h-10 rounded-xl px-4 text-xs font-semibold text-[#52678d]"
                type="button"
                variant="ghost"
              >
                Ləğv et
              </Button>
            </SheetClose>
            <SubmitButton
              className="h-10 rounded-xl border-[#a9c8ff] px-4 text-xs font-bold text-[#0b61e8]"
              label="Qaralama saxla"
              name="status"
              value="DRAFT"
              variant="outline"
            />
            <SubmitButton
              className="h-10 rounded-xl bg-[#0b66ff] px-4 text-xs font-bold text-white shadow-[0_10px_22px_rgba(11,102,255,0.22)] hover:bg-[#0758dc]"
              label="Aktivləşdir və saxla"
              name="status"
              value="ACTIVE"
            />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function CommissionPaymentDrawer({
  data,
  defaultDate,
  locale,
  onOpenChange,
  open,
}: {
  data: CommissionWorkspaceData;
  defaultDate: string;
  locale: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [applicationId, setApplicationId] = useState(
    () => data.applications[0]?.id ?? "",
  );
  const selectedApplication = data.applications.find(
    (item) => item.id === applicationId,
  );
  const currency = selectedApplication?.currency ?? "AZN";

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="gap-0 overflow-hidden border-[#d4dfed] bg-white p-0 text-[#0b1f44] shadow-[-24px_0_70px_rgba(15,31,65,0.18)] data-[side=right]:w-full data-[side=right]:sm:max-w-[540px]"
        side="right"
      >
        <SheetHeader className="border-b border-[#e0e7f1] px-5 py-5 pr-14 sm:px-6">
          <SheetTitle className="text-xl font-bold tracking-[-0.02em] text-[#0b1f44]">
            Tələbə ödənişini qeydə al
          </SheetTitle>
          <SheetDescription className="mt-1 text-xs leading-5 text-[#68799b]">
            Qəbul edilmiş müraciəti seçin. Sistem universitet müqaviləsi və
            təsdiqlənmiş agent paketi üzrə payları hesablayacaq. Sabit agent
            payı ilk tələbə ödənişində qazanılır.
          </SheetDescription>
        </SheetHeader>
        <form
          action={createCommissionPaymentAction}
          className="flex min-h-0 flex-1 flex-col"
        >
          <input name="locale" type="hidden" value={locale} />
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <Field label="Tələbə / müraciət / universitet">
              <select
                className={cn(selectClass, "h-auto min-h-11 py-2")}
                name="applicationChoiceId"
                onChange={(event) => setApplicationId(event.target.value)}
                required
                value={applicationId}
              >
                <option value="">Qəbul edilmiş müraciəti seçin</option>
                {data.applications.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ödənilən məbləğ">
                <Input
                  className={inputClass}
                  inputMode="decimal"
                  min="0.01"
                  name="amount"
                  placeholder="0.00"
                  required
                  step="0.01"
                  type="number"
                />
              </Field>
              <Field label="Valyuta">
                <ReadOnlyValue value={currency} />
                <input name="currency" type="hidden" value={currency} />
              </Field>
              <Field label="Ödəniş tarixi">
                <Input
                  className={inputClass}
                  defaultValue={defaultDate}
                  name="paidAt"
                  required
                  type="date"
                />
              </Field>
              <Field label="AZN məzənnəsi">
                <Input
                  className={inputClass}
                  defaultValue="1"
                  disabled={currency === "AZN"}
                  inputMode="decimal"
                  min="0.00000001"
                  name="exchangeRate"
                  required
                  step="0.00000001"
                  type="number"
                />
                {currency === "AZN" ? (
                  <input name="exchangeRate" type="hidden" value="1" />
                ) : null}
              </Field>
            </div>
            <Field label="Bank / qəbz referansı">
              <Input
                className={inputClass}
                name="reference"
                placeholder="Məs: TRX-84721"
              />
            </Field>
            <Field label="Ödəniş sübutu">
              <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-[#bfd0e5] bg-[#f9fbff] px-4 py-5 text-center transition hover:border-[#0b66ff] hover:bg-[#f2f7ff]">
                <FileUpIcon className="size-5 text-[#0b66ff]" />
                <span>
                  <span className="block text-xs font-semibold text-[#243b65]">
                    Qəbz və ya ödəniş sənədi
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[#7786a4]">
                    PDF, JPG, PNG, WEBP (maks. 10 MB)
                  </span>
                </span>
                <input
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="sr-only"
                  name="evidenceFile"
                  type="file"
                />
              </label>
            </Field>
            <Field label="Qeyd">
              <Textarea
                className="min-h-24 rounded-xl border-[#d4dfed] bg-white text-sm"
                name="notes"
                placeholder="Ödənişlə bağlı əlavə qeyd..."
              />
            </Field>
            <div className="flex items-start gap-2 rounded-xl bg-[#eef6ff] px-3 py-3 text-xs leading-5 text-[#315b90]">
              <InfoIcon className="mt-0.5 size-4 shrink-0 text-[#0b66ff]" />
              Yalnız qəbul edilmiş və ya qeydiyyatdan keçmiş müraciətlər
              hesablanır. Müqavilə agent, universitet, proqram, valyuta və
              akademik il, təhsil səviyyəsi, universitet və valyutaya görə
              avtomatik uyğunlaşdırılır.
            </div>
          </div>
          <SheetFooter className="flex-row items-center justify-end border-t border-[#dfe7f1] bg-white px-5 py-4 sm:px-6">
            <SheetClose asChild>
              <Button
                className="h-10 rounded-xl px-4 text-xs font-semibold text-[#52678d]"
                type="button"
                variant="ghost"
              >
                Ləğv et
              </Button>
            </SheetClose>
            <SubmitButton
              className="h-10 rounded-xl bg-[#0b66ff] px-5 text-xs font-bold text-white shadow-[0_10px_22px_rgba(11,102,255,0.22)] hover:bg-[#0758dc]"
              label="Ödənişi POST et və hesabla"
            />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function FormSection({
  children,
  number,
  title,
}: {
  children: React.ReactNode;
  number: string;
  title: string;
}) {
  return (
    <section className="border-b border-[#e4eaf2] py-5 first:pt-0 last:border-b-0 last:pb-0">
      <h3 className="mb-4 text-sm font-bold text-[#132b55]">
        {number}. {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-[11px] font-semibold text-[#506489]">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ShareField({
  label,
  method,
  methodName,
  onMethodChange,
  onValueChange,
  value,
  valueName,
}: {
  label: string;
  method: "PERCENTAGE" | "FIXED";
  methodName: string;
  onMethodChange: (method: "PERCENTAGE" | "FIXED") => void;
  onValueChange: (value: string) => void;
  value: string;
  valueName: string;
}) {
  return (
    <Field label={label}>
      <div className="grid grid-cols-[1.2fr_1fr] gap-2">
        <select
          className={selectClass}
          name={methodName}
          onChange={(event) =>
            onMethodChange(event.target.value as "PERCENTAGE" | "FIXED")
          }
          value={method}
        >
          <option value="PERCENTAGE">Faiz</option>
          <option value="FIXED">Sabit məbləğ</option>
        </select>
        <div className="relative">
          <Input
            className={cn(inputClass, method === "PERCENTAGE" && "pr-8")}
            min="0.0001"
            name={valueName}
            onChange={(event) => onValueChange(event.target.value)}
            required
            step="0.0001"
            type="number"
            value={value}
          />
          {method === "PERCENTAGE" ? (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-[#647595]">
              %
            </span>
          ) : null}
        </div>
      </div>
    </Field>
  );
}

function PreviewAmount({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-3 text-center">
      <div className="text-[10px] text-[#7383a0]">{label}</div>
      <div className="mt-1 text-sm font-bold tabular-nums text-[#10264f]">
        {value}
      </div>
    </div>
  );
}

function ReadOnlyValue({ value }: { value: string }) {
  return (
    <div className="flex h-10 w-full items-center rounded-xl border border-[#d4dfed] bg-[#f6f8fc] px-3 text-xs font-medium text-[#627493]">
      {value}
    </div>
  );
}

function SubmitButton({
  className,
  label,
  name,
  value,
  variant,
}: {
  className?: string;
  label: string;
  name?: string;
  value?: string;
  variant?: "outline";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      className={className}
      disabled={pending}
      name={name}
      type="submit"
      value={value}
      variant={variant}
    >
      {pending ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
      {pending ? "Yadda saxlanılır..." : label}
    </Button>
  );
}

function calculatePreview(
  basis: number,
  method: "PERCENTAGE" | "FIXED",
  rawValue: string,
) {
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return 0;
  return method === "PERCENTAGE" ? (basis * value) / 100 : value;
}

function formatMoney(value: number, currency: string) {
  const amount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
  return `${currency} ${amount}`;
}

const inputClass =
  "h-10 rounded-xl border-[#d4dfed] bg-white px-3 text-xs text-[#18315c] shadow-none placeholder:text-[#9aa8bf] focus-visible:border-[#0b66ff] focus-visible:ring-[#0b66ff]/15";
const selectClass =
  "h-10 w-full rounded-xl border border-[#d4dfed] bg-white px-3 text-xs font-medium text-[#18315c] outline-none transition focus:border-[#0b66ff] focus:ring-3 focus:ring-[#0b66ff]/15 disabled:bg-[#f6f8fc] disabled:text-[#72819d]";
