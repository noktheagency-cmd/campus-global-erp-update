"use client";

import { useFormStatus } from "react-dom";
import {
  ArrowRightIcon,
  BadgeDollarSignIcon,
  BanIcon,
  CheckCircle2Icon,
  Clock3Icon,
  FileQuestionIcon,
  MessageSquareTextIcon,
  XCircleIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createServiceQuoteRequestAction,
  offerServiceQuoteAction,
  rejectServiceQuoteAction,
  respondToServiceQuoteAction,
} from "@/features/services/actions";
import type {
  ServiceQuoteRequestRecord,
  ServiceQuoteStatus,
} from "@/features/services/types";
import { cn } from "@/lib/utils";

export function CreateServiceQuoteDialog({
  activeQuote,
  serviceId,
  serviceName,
}: {
  activeQuote: ServiceQuoteRequestRecord | null;
  serviceId: string;
  serviceName: string;
}) {
  if (activeQuote) {
    return (
      <Button
        className="h-11 w-full rounded-2xl border-blue-100 bg-blue-50 font-black text-[#1559b7]"
        disabled
        variant="outline"
      >
        {activeQuote.status === "PENDING"
          ? "Sorğu cavab gözləyir"
          : "Qiymət təklifi hazırdır"}
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-11 w-full rounded-2xl bg-[#0b66ff] font-black text-white hover:bg-[#075be8]">
          Qiymət sorğusu göndər
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#e7eef8] px-6 py-5 text-left">
          <DialogTitle className="text-xl font-black text-[#07183a]">
            Qiymət sorğusu
          </DialogTitle>
          <DialogDescription className="font-medium leading-6 text-[#637392]">
            {serviceName} üçün ehtiyacınızı göndərin. Komanda ayrıca qiymət
            təklifi hazırlayacaq.
          </DialogDescription>
        </DialogHeader>
        <form
          action={createServiceQuoteRequestAction}
          className="grid gap-5 p-6"
        >
          <input name="serviceId" type="hidden" value={serviceId} />
          <QuoteField label="Say">
            <Input
              className={inputClassName}
              defaultValue={1}
              max={100}
              min={1}
              name="quantity"
              required
              type="number"
            />
          </QuoteField>
          <QuoteField label="Sorğu qeydi (istəyə bağlı)">
            <Textarea
              className={textareaClassName}
              maxLength={1000}
              name="requestNote"
              placeholder="Həcmi, tələb olunan tarix və ya xüsusi şərtləri yazın"
            />
          </QuoteField>
          <QuoteSubmitButton label="Sorğunu göndər" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function StaffQuoteRequestsPanel({
  canReview,
  requests,
}: {
  canReview: boolean;
  requests: ServiceQuoteRequestRecord[];
}) {
  if (requests.length === 0) {
    return <QuoteEmptyState staff />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {requests.map((request) => (
        <QuoteRequestCard key={request.id} request={request}>
          {canReview && request.status === "PENDING" ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <OfferQuoteDialog request={request} />
              <RejectQuoteDialog request={request} />
            </div>
          ) : null}
        </QuoteRequestCard>
      ))}
    </div>
  );
}

export function AgentQuoteRequestsPanel({
  requests,
}: {
  requests: ServiceQuoteRequestRecord[];
}) {
  if (requests.length === 0) {
    return <QuoteEmptyState />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {requests.map((request) => (
        <QuoteRequestCard key={request.id} request={request}>
          {request.status === "OFFERED" && !request.isExpired ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <AcceptQuoteDialog request={request} />
              <DeclineQuoteDialog request={request} />
            </div>
          ) : null}
        </QuoteRequestCard>
      ))}
    </div>
  );
}

function QuoteRequestCard({
  children,
  request,
}: {
  children?: React.ReactNode;
  request: ServiceQuoteRequestRecord;
}) {
  const effectiveStatus = request.isExpired ? "EXPIRED" : request.status;

  return (
    <article className="rounded-[1.65rem] border border-[#dce6f4] bg-white p-5 shadow-[0_18px_50px_rgba(29,78,216,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#1559b7]">
            <FileQuestionIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="font-mono text-xs font-black text-[#1559b7]">
              {request.code}
            </div>
            <h3 className="mt-1 truncate text-lg font-black text-[#07183a]">
              {request.serviceName}
            </h3>
            <p className="mt-1 text-xs font-bold text-[#71809f]">
              {request.agentName} · {request.quantity} ədəd ·{" "}
              {formatDateTime(request.createdAt)}
            </p>
          </div>
        </div>
        <QuoteStatusBadge status={effectiveStatus} />
      </div>

      {request.requestNote ? (
        <InfoBox
          label={
            request.purpose === "PRICE_OVERRIDE"
              ? "Təklif qeydi"
              : "Agentin sorğusu"
          }
          value={request.requestNote}
        />
      ) : null}

      {request.offeredUnitPrice !== null && request.currency ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="text-[11px] font-black uppercase tracking-wide text-[#1559b7]">
              {request.purpose === "PRICE_OVERRIDE"
                ? "Fərdi agent qiyməti"
                : "Təklif olunan qiymət"}
            </div>
            <div className="mt-1 text-xl font-black text-[#07183a]">
              {formatMoney(request.offeredUnitPrice, request.currency)} / ədəd
            </div>
            <div className="mt-1 text-xs font-bold text-[#637392]">
              {request.purpose === "PRICE_OVERRIDE" &&
              request.standardUnitPrice !== null &&
              request.standardCurrency
                ? `Standart: ${formatMoney(request.standardUnitPrice, request.standardCurrency)}`
                : `Cəmi: ${formatMoney(request.totalAmount ?? 0, request.currency)}`}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e5edf7] bg-[#fbfdff] p-4">
            <div className="text-[11px] font-black uppercase tracking-wide text-[#71809f]">
              Təklifin son tarixi
            </div>
            <div className="mt-1 text-sm font-black text-[#07183a]">
              {request.offerValidUntil
                ? formatDateTime(request.offerValidUntil)
                : "Müddətsiz"}
            </div>
            {request.reviewerName ? (
              <div className="mt-1 text-xs font-bold text-[#8b98b1]">
                {request.reviewerName}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {request.staffResponseNote ? (
        <InfoBox
          label={
            request.status === "REJECTED" ? "Rədd səbəbi" : "Komandanın qeydi"
          }
          tone={request.status === "REJECTED" ? "red" : "blue"}
          value={request.staffResponseNote}
        />
      ) : null}

      {request.agentResponseNote ? (
        <InfoBox
          label="Agentin qərar səbəbi"
          tone="amber"
          value={request.agentResponseNote}
        />
      ) : null}

      {request.orderCode ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          <CheckCircle2Icon className="size-4" />
          Sifariş yaradıldı: {request.orderCode}
        </div>
      ) : null}

      {children ? (
        <div className="mt-4 border-t border-[#edf2f8] pt-4">{children}</div>
      ) : null}
    </article>
  );
}

function OfferQuoteDialog({ request }: { request: ServiceQuoteRequestRecord }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-10 flex-1 rounded-xl bg-[#0b66ff] font-black text-white hover:bg-[#075be8]">
          <BadgeDollarSignIcon data-icon="inline-start" />
          Qiymət yaz və təsdiqlə
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#e7eef8] px-6 py-5 text-left">
          <DialogTitle className="text-xl font-black text-[#07183a]">
            Qiymət təklifi hazırla
          </DialogTitle>
          <DialogDescription className="font-medium text-[#637392]">
            {request.agentName} · {request.serviceName} · {request.quantity}{" "}
            ədəd
          </DialogDescription>
        </DialogHeader>
        <form action={offerServiceQuoteAction} className="grid gap-5 p-6">
          <input name="quoteRequestId" type="hidden" value={request.id} />
          <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
            <QuoteField label="Vahid qiymət">
              <Input
                className={inputClassName}
                min="0"
                name="amount"
                placeholder="0.00"
                required
                step="0.01"
                type="number"
              />
            </QuoteField>
            <QuoteField label="Valyuta">
              <Input
                className={inputClassName}
                defaultValue="AZN"
                maxLength={3}
                name="currency"
                required
              />
            </QuoteField>
          </div>
          <QuoteField label="Təklifin son tarixi · Bakı vaxtı (istəyə bağlı)">
            <Input
              className={inputClassName}
              name="offerValidUntil"
              type="datetime-local"
            />
          </QuoteField>
          <QuoteField label="Agentə qeyd (istəyə bağlı)">
            <Textarea
              className={textareaClassName}
              maxLength={1000}
              name="staffResponseNote"
              placeholder="Qiymətə daxil olan xidmətlər və şərtlər"
            />
          </QuoteField>
          <QuoteSubmitButton label="Təklifi göndər" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RejectQuoteDialog({
  request,
}: {
  request: ServiceQuoteRequestRecord;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="h-10 flex-1 rounded-xl border-red-100 bg-white font-black text-red-600 hover:bg-red-50"
          variant="outline"
        >
          <BanIcon data-icon="inline-start" />
          Rədd et
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#e7eef8] px-6 py-5 text-left">
          <DialogTitle className="text-xl font-black text-[#07183a]">
            Sorğunu rədd et
          </DialogTitle>
          <DialogDescription className="font-medium text-[#637392]">
            Səbəb agentin xidmətlər səhifəsində və bildirişində görünəcək.
          </DialogDescription>
        </DialogHeader>
        <form action={rejectServiceQuoteAction} className="grid gap-5 p-6">
          <input name="quoteRequestId" type="hidden" value={request.id} />
          <QuoteField label="Rədd səbəbi">
            <Textarea
              className={textareaClassName}
              maxLength={1000}
              minLength={3}
              name="reason"
              placeholder="Sorğunun niyə qiymətləndirilə bilmədiyini yazın"
              required
            />
          </QuoteField>
          <QuoteSubmitButton danger label="Sorğunu rədd et" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AcceptQuoteDialog({
  request,
}: {
  request: ServiceQuoteRequestRecord;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-10 flex-1 rounded-xl bg-emerald-600 font-black text-white hover:bg-emerald-700">
          <CheckCircle2Icon data-icon="inline-start" />
          Qəbul et
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#e7eef8] px-6 py-5 text-left">
          <DialogTitle className="text-xl font-black text-[#07183a]">
            Təklifi qəbul et
          </DialogTitle>
          <DialogDescription className="font-medium leading-6 text-[#637392]">
            {request.purpose === "PRICE_OVERRIDE"
              ? "Qəbul etdikdən sonra bu qiymət xidmət üçün sizə özəl aktiv qiymət olacaq. O vaxta qədər standart qiymət qüvvədədir."
              : `Qəbul etdikdən sonra ${request.code} sorğusu əsasında təsdiqlənmiş xidmət sifarişi yaradılacaq.`}
          </DialogDescription>
        </DialogHeader>
        <form action={respondToServiceQuoteAction} className="grid gap-5 p-6">
          <input name="decision" type="hidden" value="ACCEPTED" />
          <input name="quoteRequestId" type="hidden" value={request.id} />
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            {request.purpose === "PRICE_OVERRIDE"
              ? "Təsdiqlənəcək fərdi qiymət: "
              : "Yekun məbləğ: "}
            {request.currency && request.totalAmount !== null
              ? formatMoney(
                  request.purpose === "PRICE_OVERRIDE"
                    ? (request.offeredUnitPrice ?? request.totalAmount)
                    : request.totalAmount,
                  request.currency,
                )
              : "—"}
          </div>
          <QuoteSubmitButton success label="Təklifi qəbul et" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeclineQuoteDialog({
  request,
}: {
  request: ServiceQuoteRequestRecord;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="h-10 flex-1 rounded-xl border-[#dce6f4] bg-white font-black text-[#637392] hover:bg-slate-50"
          variant="outline"
        >
          <XCircleIcon data-icon="inline-start" />
          İmtina et
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#e7eef8] px-6 py-5 text-left">
          <DialogTitle className="text-xl font-black text-[#07183a]">
            Təklifdən imtina et
          </DialogTitle>
          <DialogDescription className="font-medium text-[#637392]">
            Səbəbi yazın ki, komanda növbəti təklifi daha düzgün hazırlaya
            bilsin.
          </DialogDescription>
        </DialogHeader>
        <form action={respondToServiceQuoteAction} className="grid gap-5 p-6">
          <input name="decision" type="hidden" value="DECLINED" />
          <input name="quoteRequestId" type="hidden" value={request.id} />
          <QuoteField label="İmtina səbəbi">
            <Textarea
              className={textareaClassName}
              maxLength={1000}
              name="reason"
              placeholder="Qiymət, müddət və ya başqa səbəbi yazın"
              required
            />
          </QuoteField>
          <QuoteSubmitButton danger label="İmtina et" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function QuoteStatusBadge({ status }: { status: ServiceQuoteStatus }) {
  const config = {
    ACCEPTED: {
      icon: CheckCircle2Icon,
      label: "Qəbul edilib",
      style: "border-emerald-100 bg-emerald-50 text-emerald-700",
    },
    DECLINED: {
      icon: XCircleIcon,
      label: "Agent imtina edib",
      style: "border-slate-200 bg-slate-50 text-slate-600",
    },
    EXPIRED: {
      icon: Clock3Icon,
      label: "Müddəti bitib",
      style: "border-orange-100 bg-orange-50 text-orange-700",
    },
    OFFERED: {
      icon: BadgeDollarSignIcon,
      label: "Təklif hazırdır",
      style: "border-blue-100 bg-blue-50 text-[#1559b7]",
    },
    PENDING: {
      icon: Clock3Icon,
      label: "Cavab gözləyir",
      style: "border-amber-100 bg-amber-50 text-amber-700",
    },
    REJECTED: {
      icon: BanIcon,
      label: "Rədd edilib",
      style: "border-red-100 bg-red-50 text-red-600",
    },
  } as const;
  const item = config[status];
  const Icon = item.icon;

  return (
    <Badge
      className={cn(
        "inline-flex shrink-0 gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black",
        item.style,
      )}
    >
      <Icon className="size-3" />
      {item.label}
    </Badge>
  );
}

function InfoBox({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "amber" | "blue" | "default" | "red";
  value: string;
}) {
  const tones = {
    amber: "border-amber-100 bg-amber-50/70",
    blue: "border-blue-100 bg-blue-50/70",
    default: "border-[#e5edf7] bg-[#fbfdff]",
    red: "border-red-100 bg-red-50/70",
  };

  return (
    <div className={cn("mt-4 rounded-2xl border p-4", tones[tone])}>
      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-[#71809f]">
        <MessageSquareTextIcon className="size-3.5" />
        {label}
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-[#34456c]">
        {value}
      </p>
    </div>
  );
}

function QuoteEmptyState({ staff = false }: { staff?: boolean }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-[1.65rem] border border-dashed border-[#cfd9e8] bg-white px-5 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#1559b7]">
        <FileQuestionIcon className="size-5" />
      </span>
      <div className="mt-4 font-black text-[#07183a]">
        Qiymət sorğusu yoxdur
      </div>
      <p className="mt-1 max-w-md text-sm font-semibold leading-6 text-[#637392]">
        {staff
          ? "Agentlərdən daxil olan yeni qiymət sorğuları burada görünəcək."
          : "Xidmət kataloqundan göndərdiyiniz qiymət sorğuları burada görünəcək."}
      </p>
    </div>
  );
}

function QuoteField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-[#637392]">
        {label}
      </span>
      {children}
    </label>
  );
}

function QuoteSubmitButton({
  danger = false,
  label,
  success = false,
}: {
  danger?: boolean;
  label: string;
  success?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={cn(
        "h-11 rounded-2xl font-black text-white",
        danger
          ? "bg-red-600 hover:bg-red-700"
          : success
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-[#0b66ff] hover:bg-[#075be8]",
      )}
      disabled={pending}
      type="submit"
    >
      {pending ? "Göndərilir..." : label}
    </Button>
  );
}

function formatMoney(amount: number, currency: string) {
  const [whole = "0", fraction = "00"] = amount.toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const decimals = fraction === "00" ? "" : `.${fraction.replace(/0$/, "")}`;
  return `${currency} ${grouped}${decimals}`;
}

function formatDateTime(value: string) {
  const date = new Date(new Date(value).getTime() + 4 * 60 * 60 * 1000);
  const months = [
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
  const time = `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes(),
  ).padStart(2, "0")}`;
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${time}`;
}

const inputClassName =
  "h-11 rounded-2xl border-[#dce6f4] bg-[#fbfdff] px-4 text-sm font-semibold text-[#07183a] placeholder:text-[#9aa7bd] focus-visible:border-[#1559b7] focus-visible:ring-[#1559b7]/10";

const textareaClassName =
  "min-h-24 rounded-2xl border-[#dce6f4] bg-[#fbfdff] text-sm font-semibold";
