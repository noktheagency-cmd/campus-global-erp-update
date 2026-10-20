"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArchiveIcon,
  CheckIcon,
  EyeIcon,
  FileTextIcon,
  LoaderCircleIcon,
  MoreVerticalIcon,
  PauseCircleIcon,
  PlayCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  approveCommissionCalculationAction,
  updateCommissionAgreementStatusAction,
} from "@/features/commissions/actions";
import {
  COMMISSION_AGREEMENT_STATUS_LABELS,
  COMMISSION_CALCULATION_STATUS_LABELS,
} from "@/features/commissions/constants";
import type {
  CommissionAgreementRecord,
  CommissionAuditRecord,
  CommissionCalculationRecord,
  CommissionPaymentRecord,
} from "@/features/commissions/types";
import { cn } from "@/lib/utils";

export function AgreementsRegister({
  agreements,
  canManage,
  compact = false,
  locale,
  mutationsEnabled,
  showCampusShare = true,
}: {
  agreements: CommissionAgreementRecord[];
  canManage: boolean;
  compact?: boolean;
  locale: string;
  mutationsEnabled: boolean;
  showCampusShare?: boolean;
}) {
  const [selectedAgreement, setSelectedAgreement] =
    useState<CommissionAgreementRecord | null>(null);

  if (agreements.length === 0) {
    return <EmptyRegister text="Uyğun komissiya müqaviləsi tapılmadı." />;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#e1e8f1] bg-[#fbfcfe] text-[11px] font-semibold text-[#617497]">
              <TableHead>Agent</TableHead>
              <TableHead>Universitet</TableHead>
              <TableHead>Əhatə</TableHead>
              {showCampusShare ? (
                <TableHead>Campus Global payı</TableHead>
              ) : null}
              <TableHead>Agent payı</TableHead>
              <TableHead>Etibarlılıq</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </tr>
          </thead>
          <tbody>
            {agreements.map((agreement) => (
              <tr
                className="border-b border-[#e6ebf2] text-xs text-[#1b315a] transition last:border-b-0 hover:bg-[#f8fbff]"
                key={agreement.id}
              >
                <TableCell className="font-semibold">
                  {agreement.agentName}
                </TableCell>
                <TableCell>{agreement.universityName}</TableCell>
                <TableCell>{agreement.scopeLabel}</TableCell>
                {showCampusShare ? (
                  <TableCell className="font-semibold tabular-nums">
                    {formatShare(
                      agreement.campusValue,
                      agreement.method.campus,
                      agreement.currency,
                    )}
                  </TableCell>
                ) : null}
                <TableCell className="font-semibold tabular-nums text-[#0b61e8]">
                  {formatShare(
                    agreement.agentValue,
                    agreement.method.agent,
                    agreement.currency,
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-[#506489]">
                  {formatDate(agreement.validFrom)}–
                  {formatDate(agreement.validUntil)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={agreement.status} />
                </TableCell>
                <TableCell>
                  <Button
                    aria-label={`${agreement.code} əməliyyatları`}
                    className="size-8 rounded-lg text-[#577093] hover:bg-[#edf4ff] hover:text-[#0b66ff]"
                    onClick={() => setSelectedAgreement(agreement)}
                    size="icon"
                    title="Müqavilə detallarını aç"
                    type="button"
                    variant="ghost"
                  >
                    <MoreVerticalIcon className="size-4" />
                  </Button>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={cn("grid gap-3 p-3 md:hidden", compact && "p-0")}>
        {agreements.map((agreement) => (
          <article
            className="rounded-2xl border border-[#dfe7f1] bg-white p-4 shadow-[0_8px_24px_rgba(37,59,96,0.05)]"
            key={agreement.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-[#142a51]">
                  {agreement.universityName}
                </div>
                <div className="mt-1 text-xs text-[#68799b]">
                  {agreement.agentName} · {agreement.scopeLabel}
                </div>
              </div>
              <StatusBadge status={agreement.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#e5ebf3] pt-3">
              {showCampusShare ? (
                <MobileValue
                  label="Campus Global"
                  value={formatShare(
                    agreement.campusValue,
                    agreement.method.campus,
                    agreement.currency,
                  )}
                />
              ) : null}
              <MobileValue
                label="Agent payı"
                value={formatShare(
                  agreement.agentValue,
                  agreement.method.agent,
                  agreement.currency,
                )}
              />
              <MobileValue
                className="col-span-2"
                label="Etibarlılıq"
                value={`${formatDate(agreement.validFrom)}–${formatDate(
                  agreement.validUntil,
                )}`}
              />
            </div>
            <Button
              className="mt-4 h-9 w-full rounded-xl border-[#cfdaea] text-xs font-semibold text-[#31517f]"
              onClick={() => setSelectedAgreement(agreement)}
              type="button"
              variant="outline"
            >
              <EyeIcon className="size-4" />
              Ətraflı bax
            </Button>
          </article>
        ))}
      </div>

      <AgreementDetailsDialog
        agreement={selectedAgreement}
        canManage={canManage}
        locale={locale}
        mutationsEnabled={mutationsEnabled}
        onOpenChange={(open) => {
          if (!open) setSelectedAgreement(null);
        }}
      />
    </>
  );
}

export function CalculationsRegister({
  calculations,
  canApprove,
  compact = false,
  locale,
  mutationsEnabled,
  showAgent = true,
  showCampusShare = true,
}: {
  calculations: CommissionCalculationRecord[];
  canApprove: boolean;
  compact?: boolean;
  locale: string;
  mutationsEnabled: boolean;
  showAgent?: boolean;
  showCampusShare?: boolean;
}) {
  const [selectedCalculation, setSelectedCalculation] =
    useState<CommissionCalculationRecord | null>(null);

  if (calculations.length === 0) {
    return <EmptyRegister text="Uyğun komissiya hesablaması tapılmadı." />;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table
          className={cn(
            "w-full border-collapse text-left",
            compact ? "min-w-[620px]" : "min-w-[900px]",
          )}
        >
          <thead>
            <tr className="border-b border-[#e1e8f1] bg-[#fbfcfe] text-[11px] font-semibold text-[#617497]">
              <TableHead>Tələbə / müraciət</TableHead>
              <TableHead>Universitet</TableHead>
              {showAgent ? <TableHead>Agent</TableHead> : null}
              <TableHead>Ödənilən məbləğ</TableHead>
              {showCampusShare ? <TableHead>Şirkət payı</TableHead> : null}
              <TableHead>Agent payı</TableHead>
              <TableHead>Vəziyyət</TableHead>
              <TableHead className="w-16" />
            </tr>
          </thead>
          <tbody>
            {calculations.map((calculation) => (
              <tr
                className="border-b border-[#e6ebf2] text-xs text-[#1b315a] transition last:border-b-0 hover:bg-[#f8fbff]"
                key={calculation.id}
              >
                <TableCell>
                  <div className="font-semibold">{calculation.studentName}</div>
                  <div className="mt-0.5 text-[10px] text-[#71819f]">
                    {calculation.applicationCode}
                  </div>
                </TableCell>
                <TableCell>{calculation.universityName}</TableCell>
                {showAgent ? (
                  <TableCell>{calculation.agentName}</TableCell>
                ) : null}
                <TableCell className="font-semibold tabular-nums">
                  {formatMoney(calculation.basisAmount, calculation.currency)}
                </TableCell>
                {showCampusShare ? (
                  <TableCell className="font-semibold tabular-nums text-[#087d52]">
                    {formatMoney(
                      calculation.campusAmount,
                      calculation.currency,
                    )}
                  </TableCell>
                ) : null}
                <TableCell className="font-semibold tabular-nums text-[#0b61e8]">
                  {formatMoney(calculation.agentAmount, calculation.currency)}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    label={
                      calculation.agentAmount === 0 &&
                      calculation.status === "PAID"
                        ? "Agent payı yoxdur"
                        : undefined
                    }
                    status={calculation.status}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    aria-label={`${calculation.code} detallarını aç`}
                    className={cn(
                      "size-8 rounded-lg",
                      canApprove &&
                        mutationsEnabled &&
                        ["CALCULATED", "UNDER_REVIEW"].includes(
                          calculation.status,
                        )
                        ? "border-[#b9d9c9] bg-[#edf9f3] text-[#087d52] hover:bg-[#dff5e9]"
                        : "text-[#577093] hover:bg-[#edf4ff] hover:text-[#0b66ff]",
                    )}
                    onClick={() => setSelectedCalculation(calculation)}
                    size="icon"
                    title="Hesablama detallarını aç"
                    type="button"
                    variant={
                      canApprove &&
                      mutationsEnabled &&
                      ["CALCULATED", "UNDER_REVIEW"].includes(
                        calculation.status,
                      )
                        ? "outline"
                        : "ghost"
                    }
                  >
                    {canApprove &&
                    mutationsEnabled &&
                    ["CALCULATED", "UNDER_REVIEW"].includes(
                      calculation.status,
                    ) ? (
                      <CheckIcon className="size-4" />
                    ) : (
                      <MoreVerticalIcon className="size-4" />
                    )}
                  </Button>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={cn("grid gap-3 p-3 md:hidden", compact && "p-0")}>
        {calculations.map((calculation) => (
          <article
            className="rounded-2xl border border-[#dfe7f1] bg-white p-4"
            key={calculation.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-[#142a51]">
                  {calculation.studentName}
                </div>
                <div className="mt-1 text-xs text-[#68799b]">
                  {calculation.applicationCode} · {calculation.universityName}
                </div>
              </div>
              <StatusBadge
                label={
                  calculation.agentAmount === 0 && calculation.status === "PAID"
                    ? "Agent payı yoxdur"
                    : undefined
                }
                status={calculation.status}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#e5ebf3] pt-3">
              <MobileValue
                label="Ödəniş"
                value={formatMoney(
                  calculation.basisAmount,
                  calculation.currency,
                )}
              />
              <MobileValue
                label="Agent payı"
                value={formatMoney(
                  calculation.agentAmount,
                  calculation.currency,
                )}
              />
              {showCampusShare ? (
                <MobileValue
                  label="Şirkət payı"
                  value={formatMoney(
                    calculation.campusAmount,
                    calculation.currency,
                  )}
                />
              ) : null}
              {showAgent ? (
                <MobileValue label="Agent" value={calculation.agentName} />
              ) : null}
            </div>
            <Button
              className="mt-4 h-9 w-full rounded-xl border-[#cfdaea] text-xs font-semibold text-[#31517f]"
              onClick={() => setSelectedCalculation(calculation)}
              type="button"
              variant="outline"
            >
              <EyeIcon className="size-4" />
              {canApprove &&
              mutationsEnabled &&
              ["CALCULATED", "UNDER_REVIEW"].includes(calculation.status)
                ? "Yoxla və təsdiqlə"
                : "Ətraflı bax"}
            </Button>
          </article>
        ))}
      </div>

      <CalculationDetailsDialog
        calculation={selectedCalculation}
        canApprove={canApprove}
        locale={locale}
        mutationsEnabled={mutationsEnabled}
        showCampusShare={showCampusShare}
        onOpenChange={(open) => {
          if (!open) setSelectedCalculation(null);
        }}
      />
    </>
  );
}

function AgreementDetailsDialog({
  agreement,
  canManage,
  locale,
  mutationsEnabled,
  onOpenChange,
}: {
  agreement: CommissionAgreementRecord | null;
  canManage: boolean;
  locale: string;
  mutationsEnabled: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!agreement) return null;

  return (
    <Dialog onOpenChange={onOpenChange} open>
      <DialogContent className="max-h-[92svh] overflow-y-auto rounded-[1.4rem] border-[#d8e2ee] bg-white p-5 sm:max-w-2xl">
        <DialogHeader className="pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg font-bold text-[#10264f]">
              {agreement.code}
            </DialogTitle>
            <StatusBadge status={agreement.status} />
          </div>
          <DialogDescription className="leading-5 text-[#647697]">
            {agreement.agentName} · {agreement.universityName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem label="Əhatə" value={agreement.scopeLabel} />
          <DetailItem label="Valyuta" value={agreement.currency} />
          <DetailItem
            label="Campus Global payı"
            value={formatShare(
              agreement.campusValue,
              agreement.method.campus,
              agreement.currency,
            )}
          />
          <DetailItem
            label="Agent payı"
            value={formatShare(
              agreement.agentValue,
              agreement.method.agent,
              agreement.currency,
            )}
          />
          <DetailItem
            label="Etibarlılıq"
            value={`${formatDate(agreement.validFrom)}–${formatDate(
              agreement.validUntil,
            )}`}
          />
          <DetailItem
            label="Ödəniş qaydası"
            value={
              agreement.installmentPolicy === "FIRST_PAYMENT_ONLY"
                ? "Yalnız ilk ödəniş"
                : "Hər ödəniş"
            }
          />
          <DetailItem
            label="Agent ödəniş müddəti"
            value={`${agreement.paymentTermDays} iş günü`}
          />
          <DetailItem
            label="Yaradılma tarixi"
            value={formatDateTime(agreement.createdAt)}
          />
        </div>

        {agreement.documentName ? (
          <div className="rounded-xl border border-[#dce5f0] bg-[#f8fbff] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#29456f]">
              <FileTextIcon className="size-4 text-[#0b66ff]" />
              {agreement.documentAccessUrl ? (
                <a
                  className="break-all hover:text-[#0b66ff] hover:underline"
                  href={agreement.documentAccessUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {agreement.documentName}
                </a>
              ) : (
                agreement.documentName
              )}
            </div>
            {!agreement.documentAccessUrl ? (
              <p className="mt-1 text-[11px] text-[#7383a0]">
                Sənəd saxlanılıb, lakin təhlükəsiz baxış linki hazırda yaradıla
                bilmədi.
              </p>
            ) : null}
          </div>
        ) : null}

        {agreement.notes ? (
          <div className="rounded-xl bg-[#f6f8fc] p-3 text-xs leading-5 text-[#52678d]">
            <div className="mb-1 font-bold text-[#29456f]">Daxili qeyd</div>
            {agreement.notes}
          </div>
        ) : null}

        {canManage && mutationsEnabled && agreement.status !== "ARCHIVED" ? (
          <DialogFooter className="-mx-5 -mb-5 mt-1 flex-row flex-wrap justify-end rounded-b-[1.4rem] border-[#dfe7f1] bg-[#f8faff] px-5 py-4">
            {agreement.status === "ACTIVE" ? (
              <AgreementStatusForm
                agreementId={agreement.id}
                label="Dayandır"
                locale={locale}
                status="SUSPENDED"
                tone="outline"
              />
            ) : null}
            {["DRAFT", "SUSPENDED"].includes(agreement.status) ? (
              <AgreementStatusForm
                agreementId={agreement.id}
                label="Aktivləşdir"
                locale={locale}
                status="ACTIVE"
                tone="primary"
              />
            ) : null}
            <AgreementStatusForm
              agreementId={agreement.id}
              label="Arxivlə"
              locale={locale}
              status="ARCHIVED"
              tone="danger"
            />
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AgreementStatusForm({
  agreementId,
  label,
  locale,
  status,
  tone,
}: {
  agreementId: string;
  label: string;
  locale: string;
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  tone: "danger" | "outline" | "primary";
}) {
  return (
    <form action={updateCommissionAgreementStatusAction}>
      <input name="agreementId" type="hidden" value={agreementId} />
      <input name="locale" type="hidden" value={locale} />
      <input name="status" type="hidden" value={status} />
      <ActionSubmitButton label={label} tone={tone} />
    </form>
  );
}

function CalculationDetailsDialog({
  calculation,
  canApprove,
  locale,
  mutationsEnabled,
  showCampusShare,
  onOpenChange,
}: {
  calculation: CommissionCalculationRecord | null;
  canApprove: boolean;
  locale: string;
  mutationsEnabled: boolean;
  showCampusShare: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!calculation) return null;
  const approvable =
    canApprove &&
    mutationsEnabled &&
    ["CALCULATED", "UNDER_REVIEW"].includes(calculation.status);

  return (
    <Dialog onOpenChange={onOpenChange} open>
      <DialogContent className="max-h-[92svh] overflow-y-auto rounded-[1.4rem] border-[#d8e2ee] bg-white p-5 sm:max-w-xl">
        <DialogHeader className="pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg font-bold text-[#10264f]">
              {calculation.code}
            </DialogTitle>
            <StatusBadge
              label={
                calculation.agentAmount === 0 && calculation.status === "PAID"
                  ? "Agent payı yoxdur"
                  : undefined
              }
              status={calculation.status}
            />
          </div>
          <DialogDescription className="leading-5 text-[#647697]">
            {calculation.studentName} · {calculation.applicationCode}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem label="Universitet" value={calculation.universityName} />
          <DetailItem label="Agent" value={calculation.agentName} />
          <DetailItem
            label="Hesablama mənbəyi"
            value={
              calculation.source === "PACKAGE_AGREEMENT"
                ? `Paket · ${calculation.packageAgreementCode ?? "—"}`
                : "Köhnə müqavilə"
            }
          />
          <DetailItem
            label="Səviyyə / tələbə sırası"
            value={
              calculation.educationLevel
                ? `${calculation.educationLevel} · #${calculation.studentOrdinal ?? "—"}`
                : "—"
            }
          />
          <DetailItem
            label="Ödənilən məbləğ"
            value={formatMoney(calculation.basisAmount, calculation.currency)}
          />
          {showCampusShare ? (
            <>
              <DetailItem
                label="Ümumi komissiya"
                value={formatMoney(
                  calculation.grossCommissionAmount,
                  calculation.currency,
                )}
              />
              <DetailItem
                label="Campus Global payı"
                value={formatMoney(
                  calculation.campusAmount,
                  calculation.currency,
                )}
              />
            </>
          ) : null}
          <DetailItem
            label="Agent payı"
            value={formatMoney(calculation.agentAmount, calculation.currency)}
          />
          <DetailItem
            label="Agentə ödənilib"
            value={formatMoney(
              calculation.paidAgentAmount,
              calculation.currency,
            )}
          />
          <DetailItem
            label="Ödəniş son tarixi"
            value={formatDate(calculation.payableDueDate)}
          />
          <DetailItem
            label="Bu hesablamada qazanılan burs"
            value={String(calculation.scholarshipCreditsEarned)}
          />
        </div>

        {calculation.scholarshipAwardSummary.length ? (
          <div className="rounded-xl border border-[#c7dcf8] bg-[#f3f8ff] p-3">
            <strong className="text-[11px] font-bold text-[#17345f]">
              Qazanılan burs paketinin tərkibi
            </strong>
            <ul className="mt-2 space-y-1 text-[11px] leading-5 text-[#526789]">
              {calculation.scholarshipAwardSummary.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {approvable ? (
          <>
            <div className="rounded-xl border border-[#f1d499] bg-[#fff9ec] p-3 text-xs leading-5 text-[#855a0b]">
              Təsdiqdən sonra universitet debitoru
              {calculation.agentAmount > 0 ? " və agent kreditoru" : ""} Maliyyə
              modulunda yaradılacaq. Bu addımı yalnız məbləğləri yoxladıqdan
              sonra tamamlayın.
            </div>
            <DialogFooter className="-mx-5 -mb-5 mt-1 flex-row justify-end rounded-b-[1.4rem] border-[#dfe7f1] bg-[#f8faff] px-5 py-4">
              <form action={approveCommissionCalculationAction}>
                <input
                  name="calculationId"
                  type="hidden"
                  value={calculation.id}
                />
                <input name="locale" type="hidden" value={locale} />
                <ActionSubmitButton
                  label="Təsdiqlə və maliyyəyə ötür"
                  tone="primary"
                />
              </form>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e0e7f0] bg-[#fbfcfe] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#7888a4]">
        {label}
      </div>
      <div className="mt-1 text-xs font-bold leading-5 text-[#19325c]">
        {value}
      </div>
    </div>
  );
}

function ActionSubmitButton({
  label,
  tone,
}: {
  label: string;
  tone: "danger" | "outline" | "primary";
}) {
  const { pending } = useFormStatus();
  const Icon =
    tone === "danger"
      ? ArchiveIcon
      : tone === "outline"
        ? PauseCircleIcon
        : PlayCircleIcon;

  return (
    <Button
      className={cn(
        "h-9 rounded-xl px-3 text-xs font-bold",
        tone === "danger" &&
          "border-[#f0c2c7] text-[#b52d38] hover:bg-[#fff0f1]",
        tone === "outline" && "border-[#d4deeb] text-[#496184] hover:bg-white",
        tone === "primary" && "bg-[#0b66ff] text-white hover:bg-[#0758dc]",
      )}
      disabled={pending}
      type="submit"
      variant={tone === "primary" ? "default" : "outline"}
    >
      {pending ? (
        <LoaderCircleIcon className="size-4 animate-spin" />
      ) : (
        <Icon className="size-4" />
      )}
      {pending ? "İcra olunur..." : label}
    </Button>
  );
}

export function PaymentsRegister({
  payments,
}: {
  payments: CommissionPaymentRecord[];
}) {
  if (payments.length === 0) {
    return <EmptyRegister text="Qeydiyyata alınmış ödəniş tapılmadı." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#e1e8f1] bg-[#fbfcfe] text-[11px] font-semibold text-[#617497]">
            <TableHead>Ödəniş</TableHead>
            <TableHead>Tələbə / müraciət</TableHead>
            <TableHead>Universitet</TableHead>
            <TableHead>Tarix</TableHead>
            <TableHead>Məbləğ</TableHead>
            <TableHead>Referans</TableHead>
            <TableHead>Status</TableHead>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr
              className="border-b border-[#e6ebf2] text-xs text-[#1b315a] last:border-b-0"
              key={payment.id}
            >
              <TableCell className="font-semibold">{payment.code}</TableCell>
              <TableCell>
                <div className="font-semibold">{payment.studentName}</div>
                <div className="mt-0.5 text-[10px] text-[#71819f]">
                  {payment.applicationCode}
                </div>
              </TableCell>
              <TableCell>{payment.universityName}</TableCell>
              <TableCell>{formatDate(payment.paidAt)}</TableCell>
              <TableCell className="font-bold tabular-nums">
                {formatMoney(payment.amount, payment.currency)}
              </TableCell>
              <TableCell>{payment.reference}</TableCell>
              <TableCell>
                <StatusBadge status={payment.status} />
              </TableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AuditRegister({ audit }: { audit: CommissionAuditRecord[] }) {
  if (audit.length === 0) {
    return <EmptyRegister text="Audit hadisəsi tapılmadı." />;
  }
  return (
    <div className="divide-y divide-[#e3e9f1]">
      {audit.map((entry) => (
        <div className="flex gap-4 px-4 py-4 sm:px-5" key={entry.id}>
          <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eaf3ff] text-[#0b66ff]">
            <CheckIcon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
              <div className="text-sm font-bold text-[#17305a]">
                {entry.summary}
              </div>
              <div className="text-[11px] tabular-nums text-[#7a89a5]">
                {formatDateTime(entry.createdAt)}
              </div>
            </div>
            <div className="mt-1 text-xs text-[#667796]">
              {entry.entityType} · {entry.entityCode} · {entry.actor}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CoverageRegister({
  agreements,
}: {
  agreements: CommissionAgreementRecord[];
}) {
  const rows = [...agreements]
    .filter((agreement) => agreement.status === "ACTIVE")
    .sort((left, right) =>
      left.universityName.localeCompare(right.universityName),
    )
    .slice(0, 6);
  return (
    <div className="divide-y divide-[#e3e9f1]">
      {rows.map((agreement) => (
        <div
          className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 text-xs sm:grid-cols-[1.3fr_.8fr_.7fr] sm:px-5"
          key={agreement.id}
        >
          <div>
            <div className="font-semibold text-[#19325c]">
              {agreement.universityName}
            </div>
            <div className="mt-0.5 text-[10px] text-[#72819f] sm:hidden">
              {agreement.agentName}
            </div>
          </div>
          <div className="hidden text-[#5d7094] sm:block">
            {agreement.agentName}
          </div>
          <div className="text-right font-bold tabular-nums text-[#0b61e8]">
            {formatShare(
              agreement.agentValue,
              agreement.method.agent,
              agreement.currency,
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({
  status,
  label: labelOverride,
}: {
  status: string;
  label?: string;
}) {
  const label =
    labelOverride ??
    COMMISSION_AGREEMENT_STATUS_LABELS[
      status as keyof typeof COMMISSION_AGREEMENT_STATUS_LABELS
    ] ??
    COMMISSION_CALCULATION_STATUS_LABELS[
      status as keyof typeof COMMISSION_CALCULATION_STATUS_LABELS
    ] ??
    ({ POSTED: "POSTED", VOID: "Ləğv edilib" } as Record<string, string>)[
      status
    ] ??
    status;
  const tone = ["ACTIVE", "PAID", "POSTED"].includes(status)
    ? "border-[#bce6d0] bg-[#eaf9f1] text-[#087d52]"
    : ["CALCULATED", "UNDER_REVIEW", "DRAFT"].includes(status)
      ? "border-[#f2d7a7] bg-[#fff8e9] text-[#a56500]"
      : ["PAYABLE", "PARTIALLY_PAID"].includes(status)
        ? "border-[#bdd7ff] bg-[#edf5ff] text-[#0b61e8]"
        : "border-[#f2c4c8] bg-[#fff0f1] text-[#b72b36]";
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center whitespace-nowrap rounded-full border px-2.5 text-[10px] font-semibold",
        tone,
      )}
    >
      {label}
    </span>
  );
}

function TableHead({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("px-4 py-3 font-semibold", className)}>{children}</th>
  );
}

function TableCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>;
}

function MobileValue({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={className}>
      <div className="text-[10px] font-medium text-[#71819f]">{label}</div>
      <div className="mt-1 text-xs font-bold tabular-nums text-[#19325c]">
        {value}
      </div>
    </div>
  );
}

function EmptyRegister({ text }: { text: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center px-5 text-center text-sm text-[#71819f]">
      {text}
    </div>
  );
}

function formatShare(
  value: number,
  method: "PERCENTAGE" | "FIXED",
  currency: string,
) {
  return method === "PERCENTAGE"
    ? `${new Intl.NumberFormat("az-AZ", { maximumFractionDigits: 2 }).format(
        value,
      )}%`
    : formatMoney(value, currency);
}

export function formatMoney(value: number, currency = "AZN") {
  const amount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
  return `${currency} ${amount}`;
}

function formatDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}.${month}.${year}` : value;
}

function formatDateTime(value: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Baku",
    year: "numeric",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.day}.${values.month}.${values.year} ${values.hour}:${values.minute}`;
}
