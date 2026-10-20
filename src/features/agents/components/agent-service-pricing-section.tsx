"use client";

import { useFormStatus } from "react-dom";
import {
  BadgeDollarSignIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  Clock3Icon,
  HistoryIcon,
  MessageSquareTextIcon,
  SendIcon,
  ShoppingBagIcon,
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
import type { AgentProfileServiceRecord } from "@/features/agents/types";
import {
  createAgentServicePriceProposalAction,
  createServiceQuoteRequestAction,
  respondToServiceQuoteAction,
} from "@/features/services/actions";
import type {
  ServiceQuoteRequestRecord,
  ServiceQuoteStatus,
} from "@/features/services/types";
import { cn } from "@/lib/utils";

type AgentPricingProps = {
  agentId: string;
  selfService: boolean;
  services: AgentProfileServiceRecord[];
};

export function AgentServicesDialog({
  agentId,
  defaultOpen = false,
  selfService,
  services,
}: AgentPricingProps & { defaultOpen?: boolean }) {
  const returnTo = selfService
    ? "/profile?services=open"
    : `/agents/${agentId}?services=open`;

  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger asChild>
        <Button
          className="h-10 w-full rounded-xl border-[#cfe0f5] bg-white px-4 font-black text-[#1559b7] shadow-xs hover:border-[#0b66ff]/40 hover:bg-[#f5f9ff] lg:w-auto"
          variant="outline"
        >
          <ShoppingBagIcon data-icon="inline-start" />
          Xidmətlər
          <span className="ml-1 rounded-full bg-[#eaf2ff] px-2 py-0.5 text-[10px] tabular-nums text-[#0b66ff]">
            {services.length}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="grid max-h-[min(86vh,760px)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-[#e7eef8] px-5 py-4 pr-14 text-left sm:px-6 sm:py-5">
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-[#07183a]">
            <ShoppingBagIcon className="size-4.5 text-[#0b66ff]" />
            Xidmətlər və qiymətlər
          </DialogTitle>
          <DialogDescription className="text-xs font-medium leading-5 text-[#71809a]">
            {selfService
              ? "Cari qiymətlərinizi görün, qiymət sorğusu göndərin və fərdi təklifləri cavablandırın."
              : "Cari qiymətlərə baxın və hər xidmət üçün ayrıca fərdi qiymət təklifi göndərin."}
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-[#edf2f7] overflow-y-auto overscroll-contain">
          {services.length > 0 ? (
            services.map((service) => (
              <CompactServiceRow
                agentId={agentId}
                key={service.id}
                returnTo={returnTo}
                selfService={selfService}
                service={service}
              />
            ))
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
              <ShoppingBagIcon className="size-6 text-[#a4b1c5]" />
              <p className="mt-2 text-sm font-bold text-[#526482]">
                Agentlər üçün aktiv xidmət yoxdur.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AgentPriceProposalAudit({
  error,
  services,
  success,
}: {
  error?: string;
  services: AgentProfileServiceRecord[];
  success?: string;
}) {
  const proposals = services
    .flatMap((service) =>
      service.proposals
        .filter((proposal) => proposal.purpose === "PRICE_OVERRIDE")
        .map((proposal) => ({ proposal, serviceName: service.name })),
    )
    .sort(
      (left, right) =>
        Date.parse(right.proposal.createdAt) -
        Date.parse(left.proposal.createdAt),
    );
  const acceptedCount = proposals.filter(
    ({ proposal }) => proposal.status === "ACCEPTED",
  ).length;
  const declinedCount = proposals.filter(
    ({ proposal }) => proposal.status === "DECLINED",
  ).length;
  const waitingCount = proposals.filter(
    ({ proposal }) => proposal.status === "OFFERED" && !proposal.isExpired,
  ).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#e8eef5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black text-[#102442]">
            <HistoryIcon className="size-4 text-[#0b66ff]" />
            Qiymət təklifləri auditi
          </h2>
          <p className="mt-1 text-xs leading-5 text-[#71809a]">
            Göndərilən, qəbul olunan və imtina edilən fərdi qiymət təklifləri.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <AuditCount label="Gözləyir" tone="blue" value={waitingCount} />
          <AuditCount label="Qəbul" tone="green" value={acceptedCount} />
          <AuditCount label="İmtina" tone="red" value={declinedCount} />
        </div>
      </div>

      <ProfilePricingFeedback error={error} success={success} />

      {proposals.length > 0 ? (
        <div className="divide-y divide-[#edf2f7]">
          {proposals.map(({ proposal, serviceName }) => (
            <AuditRow
              key={proposal.id}
              proposal={proposal}
              serviceName={serviceName}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-28 items-center justify-center px-5 text-center text-xs font-semibold text-[#8190a8]">
          Hələ fərdi qiymət təklifi göndərilməyib.
        </div>
      )}
    </section>
  );
}

function CompactServiceRow({
  agentId,
  returnTo,
  selfService,
  service,
}: {
  agentId: string;
  returnTo: string;
  selfService: boolean;
  service: AgentProfileServiceRecord;
}) {
  const priceProposals = service.proposals.filter(
    (proposal) => proposal.purpose === "PRICE_OVERRIDE",
  );
  const openProposal = priceProposals.find(
    (proposal) => proposal.status === "OFFERED" && !proposal.isExpired,
  );
  const openQuote = service.proposals.find(
    (proposal) =>
      proposal.purpose === "ORDER" &&
      (proposal.status === "PENDING" ||
        (proposal.status === "OFFERED" && !proposal.isExpired)),
  );

  return (
    <article className="px-5 py-4 sm:px-6">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-black text-[#102442]">
              {service.name}
            </h3>
            <PriceKindBadge custom={service.isCustomPrice} />
            {openQuote ? <QuoteStateBadge quote={openQuote} /> : null}
          </div>
          {service.description ? (
            <p className="mt-1 line-clamp-1 text-xs font-medium text-[#71809a]">
              {service.description}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <PriceInline label="Standart" price={service.standardPrice} />
            <PriceInline
              accent={service.isCustomPrice}
              label="Cari qiymət"
              price={service.currentPrice}
            />
          </div>
        </div>

        <div className="sm:min-w-48">
          {openProposal ? (
            <OpenProposalCompact
              proposal={openProposal}
              returnTo={returnTo}
              selfService={selfService}
            />
          ) : selfService ? (
            openQuote ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-center text-xs font-black text-[#1559b7]">
                {openQuote.status === "PENDING"
                  ? "Sorğuya cavab gözlənilir"
                  : "Qiymət cavabı göndərilib"}
              </div>
            ) : (
              <AgentQuoteRequestDialog returnTo={returnTo} service={service} />
            )
          ) : service.standardPrice && service.standardPrice.amount > 0 ? (
            <StaffProposalDialog
              agentId={agentId}
              returnTo={returnTo}
              service={service}
            />
          ) : (
            <p className="max-w-52 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-4 text-amber-800">
              Əvvəlcə standart agent qiyməti təyin edin.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function OpenProposalCompact({
  proposal,
  returnTo,
  selfService,
}: {
  proposal: ServiceQuoteRequestRecord;
  returnTo: string;
  selfService: boolean;
}) {
  const discount = getDiscountPercent(proposal);

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-wide text-[#71809a]">
            Təklif olunan
          </p>
          <p className="truncate text-sm font-black text-[#1559b7]">
            {proposal.offeredUnitPrice !== null && proposal.currency
              ? formatMoney(proposal.offeredUnitPrice, proposal.currency)
              : "—"}
          </p>
        </div>
        {discount !== null ? (
          <Badge className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white">
            {discount}%
          </Badge>
        ) : null}
      </div>
      {selfService ? (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <AcceptProposalDialog proposal={proposal} returnTo={returnTo} />
          <DeclineProposalDialog proposal={proposal} returnTo={returnTo} />
        </div>
      ) : (
        <p className="mt-2 flex items-center justify-center gap-1 text-[10px] font-black text-[#1559b7]">
          <Clock3Icon className="size-3" /> Agentin qərarı gözlənilir
        </p>
      )}
    </div>
  );
}

function AgentQuoteRequestDialog({
  returnTo,
  service,
}: {
  returnTo: string;
  service: AgentProfileServiceRecord;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="h-9 w-full rounded-xl border-[#cfe0f5] bg-white px-3 text-xs font-black text-[#1559b7] hover:bg-[#f5f9ff]"
          variant="outline"
        >
          <MessageSquareTextIcon data-icon="inline-start" />
          Qiymət sorğusu göndər
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-md">
        <DialogHeader className="border-b border-[#e7eef8] px-6 py-5 text-left">
          <DialogTitle className="text-xl font-black text-[#07183a]">
            {service.name} · qiymət sorğusu
          </DialogTitle>
          <DialogDescription className="font-medium leading-6 text-[#637392]">
            Komandaya qiymət sorğusu göndərin. Cavab gəldikdə xidmətlər
            siyahısında görünəcək.
          </DialogDescription>
        </DialogHeader>
        <form
          action={createServiceQuoteRequestAction}
          className="grid gap-5 p-6"
        >
          <input name="serviceId" type="hidden" value={service.id} />
          <input name="quantity" type="hidden" value="1" />
          <input name="returnTo" type="hidden" value={returnTo} />
          <Field label="Qeyd (istəyə bağlı)">
            <Textarea
              className={textareaClassName}
              maxLength={1000}
              name="requestNote"
              placeholder="Xüsusi şərt və ya gözləntinizi yazın"
            />
          </Field>
          <ProposalSubmitButton
            icon={SendIcon}
            label="Qiymət sorğusunu göndər"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StaffProposalDialog({
  agentId,
  returnTo,
  service,
}: {
  agentId: string;
  returnTo: string;
  service: AgentProfileServiceRecord;
}) {
  const standardPrice = service.standardPrice!;
  const suggestedAmount = Math.max(
    0,
    Math.round(standardPrice.amount * 0.9 * 100) / 100,
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-9 w-full rounded-xl bg-[#0b66ff] px-3 text-xs font-black text-white hover:bg-[#075be8]">
          <BadgeDollarSignIcon data-icon="inline-start" />
          Təklif göndər
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#e7eef8] px-6 py-5 text-left">
          <DialogTitle className="text-xl font-black text-[#07183a]">
            {service.name} · fərdi qiymət
          </DialogTitle>
          <DialogDescription className="font-medium leading-6 text-[#637392]">
            Standart qiymət{" "}
            {formatMoney(standardPrice.amount, standardPrice.currency)}. Yeni
            qiymət yalnız agent təsdiqlədikdən sonra aktivləşəcək.
          </DialogDescription>
        </DialogHeader>
        <form
          action={createAgentServicePriceProposalAction}
          className="grid gap-5 p-6"
        >
          <input name="agentId" type="hidden" value={agentId} />
          <input name="serviceId" type="hidden" value={service.id} />
          <input name="returnTo" type="hidden" value={returnTo} />
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <Field label="Endirimli qiymət">
              <Input
                className={inputClassName}
                defaultValue={suggestedAmount}
                max={Math.max(0, standardPrice.amount - 0.01)}
                min="0"
                name="amount"
                required
                step="0.01"
                type="number"
              />
            </Field>
            <Field label="Valyuta">
              <Input
                className={inputClassName}
                defaultValue={standardPrice.currency}
                name="currency"
                readOnly
              />
            </Field>
          </div>
          <Field label="Təklifin son tarixi · Bakı vaxtı (istəyə bağlı)">
            <Input
              className={inputClassName}
              name="offerValidUntil"
              type="datetime-local"
            />
          </Field>
          <Field label="Agentə qeyd (istəyə bağlı)">
            <Textarea
              className={textareaClassName}
              maxLength={1000}
              name="staffResponseNote"
              placeholder="Endirimin şərtləri və ya qısa izah"
            />
          </Field>
          <ProposalSubmitButton icon={SendIcon} label="Təsdiqə göndər" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AcceptProposalDialog({
  proposal,
  returnTo,
}: {
  proposal: ServiceQuoteRequestRecord;
  returnTo: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-8 rounded-lg bg-emerald-600 px-2 text-[10px] font-black text-white hover:bg-emerald-700">
          <CheckCircle2Icon data-icon="inline-start" /> Təsdiqlə
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-md">
        <DialogHeader className="border-b border-[#e7eef8] px-6 py-5 text-left">
          <DialogTitle className="text-xl font-black text-[#07183a]">
            Fərdi qiyməti təsdiqlə
          </DialogTitle>
          <DialogDescription className="font-medium leading-6 text-[#637392]">
            Bu qərardan sonra təklif olunan qiymət dərhal aktiv agent qiymətiniz
            olacaq.
          </DialogDescription>
        </DialogHeader>
        <form action={respondToServiceQuoteAction} className="grid gap-4 p-6">
          <input name="decision" type="hidden" value="ACCEPTED" />
          <input name="quoteRequestId" type="hidden" value={proposal.id} />
          <input name="returnTo" type="hidden" value={returnTo} />
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center text-xl font-black text-emerald-800">
            {proposal.offeredUnitPrice !== null && proposal.currency
              ? formatMoney(proposal.offeredUnitPrice, proposal.currency)
              : "—"}
          </div>
          <ProposalSubmitButton
            icon={CheckCircle2Icon}
            label="Qiyməti təsdiqlə"
            success
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeclineProposalDialog({
  proposal,
  returnTo,
}: {
  proposal: ServiceQuoteRequestRecord;
  returnTo: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="h-8 rounded-lg border-red-100 bg-white px-2 text-[10px] font-black text-red-600 hover:bg-red-50"
          variant="outline"
        >
          <XCircleIcon data-icon="inline-start" /> İmtina
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-md">
        <DialogHeader className="border-b border-[#e7eef8] px-6 py-5 text-left">
          <DialogTitle className="text-xl font-black text-[#07183a]">
            Təklifdən imtina et
          </DialogTitle>
          <DialogDescription className="font-medium leading-6 text-[#637392]">
            Səbəbi yazın. Komanda qeydinizi görüb yeni qiymət təklifi göndərə
            bilər; bu arada cari qiymət dəyişməyəcək.
          </DialogDescription>
        </DialogHeader>
        <form action={respondToServiceQuoteAction} className="grid gap-5 p-6">
          <input name="decision" type="hidden" value="DECLINED" />
          <input name="quoteRequestId" type="hidden" value={proposal.id} />
          <input name="returnTo" type="hidden" value={returnTo} />
          <Field label="İmtina səbəbi">
            <Textarea
              className={textareaClassName}
              maxLength={1000}
              minLength={3}
              name="reason"
              placeholder="Qiymət və ya şərtlərlə bağlı səbəbi yazın"
              required
            />
          </Field>
          <ProposalSubmitButton danger icon={XCircleIcon} label="İmtina et" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AuditRow({
  proposal,
  serviceName,
}: {
  proposal: ServiceQuoteRequestRecord;
  serviceName: string;
}) {
  const status = proposal.isExpired ? "EXPIRED" : proposal.status;
  return (
    <article className="px-5 py-3.5 sm:px-6">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.8fr)_auto] sm:items-center sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-black text-[#102442]">
              {serviceName}
            </p>
            <span className="font-mono text-[9px] font-black text-[#8b98b1]">
              {proposal.code}
            </span>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-[#8190a8]">
            Göndərilib: {formatDateTime(proposal.createdAt)}
            {proposal.agentRespondedAt
              ? ` · Cavab: ${formatDateTime(proposal.agentRespondedAt)}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-[#8190a8] line-through">
            {proposal.standardUnitPrice !== null && proposal.standardCurrency
              ? formatMoney(
                  proposal.standardUnitPrice,
                  proposal.standardCurrency,
                )
              : "—"}
          </span>
          <span className="text-[#102442]">→</span>
          <span className="text-[#1559b7]">
            {proposal.offeredUnitPrice !== null && proposal.currency
              ? formatMoney(proposal.offeredUnitPrice, proposal.currency)
              : "—"}
          </span>
        </div>
        <div className="sm:justify-self-end">
          <ProposalStatusBadge status={status} />
        </div>
      </div>
      {proposal.agentResponseNote || proposal.staffResponseNote ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold leading-5">
          {proposal.staffResponseNote ? (
            <p className="text-[#637392]">Qeyd: {proposal.staffResponseNote}</p>
          ) : null}
          {proposal.agentResponseNote ? (
            <p className="text-amber-800">
              {proposal.status === "DECLINED" ? "İmtina səbəbi" : "Agent qeydi"}
              : {proposal.agentResponseNote}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function PriceKindBadge({ custom }: { custom: boolean }) {
  return (
    <Badge
      className={cn(
        "rounded-full border px-2 py-0.5 text-[9px] font-black",
        custom
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-[#dbe5f1] bg-[#f8fbff] text-[#637392]",
      )}
      variant="outline"
    >
      {custom ? "Özəl qiymət" : "Standart qiymət"}
    </Badge>
  );
}

function QuoteStateBadge({ quote }: { quote: ServiceQuoteRequestRecord }) {
  return (
    <Badge
      className="rounded-full border-blue-100 bg-blue-50 px-2 py-0.5 text-[9px] font-black text-[#1559b7]"
      variant="outline"
    >
      {quote.status === "PENDING" ? "Sorğu göndərilib" : "Cavab gəlib"}
    </Badge>
  );
}

function PriceInline({
  accent = false,
  label,
  price,
}: {
  accent?: boolean;
  label: string;
  price: AgentProfileServiceRecord["currentPrice"];
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="font-semibold text-[#8a97ad]">{label}:</span>
      <span
        className={cn(
          "font-black",
          accent ? "text-emerald-700" : "text-[#31486b]",
        )}
      >
        {price ? formatMoney(price.amount, price.currency) : "Təyin edilməyib"}
      </span>
    </span>
  );
}

function AuditCount({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "blue" | "green" | "red";
  value: number;
}) {
  return (
    <span
      className={cn(
        "rounded-lg border px-2.5 py-1 text-[10px] font-black tabular-nums",
        tone === "blue" && "border-blue-100 bg-blue-50 text-[#1559b7]",
        tone === "green" && "border-emerald-100 bg-emerald-50 text-emerald-700",
        tone === "red" && "border-red-100 bg-red-50 text-red-600",
      )}
    >
      {label} · {value}
    </span>
  );
}

function ProposalStatusBadge({ status }: { status: ServiceQuoteStatus }) {
  const labels = {
    ACCEPTED: "Qəbul edilib",
    DECLINED: "İmtina edilib",
    EXPIRED: "Müddəti bitib",
    OFFERED: "Təsdiq gözləyir",
    PENDING: "Hazırlanır",
    REJECTED: "Rədd edilib",
  } as const;
  return (
    <Badge
      className={cn(
        "rounded-full border px-2.5 py-1 text-[9px] font-black",
        status === "ACCEPTED" &&
          "border-emerald-100 bg-emerald-50 text-emerald-700",
        status === "OFFERED" && "border-blue-100 bg-blue-50 text-[#1559b7]",
        status === "DECLINED" && "border-red-100 bg-red-50 text-red-600",
        status === "PENDING" && "border-amber-100 bg-amber-50 text-amber-700",
        (status === "EXPIRED" || status === "REJECTED") &&
          "border-slate-200 bg-slate-50 text-slate-600",
      )}
      variant="outline"
    >
      {labels[status]}
    </Badge>
  );
}

function ProfilePricingFeedback({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) return null;
  const isError = Boolean(error);
  const Icon = isError ? CircleAlertIcon : CheckCircle2Icon;
  const messages: Record<string, string> = {
    "price-proposal-accepted": "Fərdi qiymət təsdiqləndi və aktivləşdirildi.",
    "price-proposal-already-open":
      "Bu xidmət üçün artıq agentin qərarını gözləyən təklif var.",
    "price-proposal-declined":
      "Təklifdən imtina edildi; cari qiymət dəyişməz qaldı.",
    "price-proposal-failed": "Qiymət təklifi göndərilə bilmədi.",
    "price-proposal-not-discount":
      "Təklif standart qiymətdən aşağı və eyni valyutada olmalıdır.",
    "price-proposal-sent": "Fərdi qiymət agentə təsdiq üçün göndərildi.",
    "price-proposal-unavailable":
      "Aktiv agent və ya standart xidmət qiyməti tapılmadı.",
    "price-proposal-validation":
      "Agent, qiymət və tarix məlumatlarını yoxlayın.",
    "quote-already-open": "Bu xidmət üçün artıq açıq qiymət sorğusu var.",
    "quote-agent-only": "Qiymət sorğusunu yalnız agent göndərə bilər.",
    "quote-decision-failed": "Qərar saxlanıla bilmədi.",
    "quote-decision-validation": "Qərarı və imtina səbəbini yoxlayın.",
    "quote-expired": "Bu təklifin müddəti bitib.",
    "quote-failed": "Qiymət sorğusu göndərilə bilmədi.",
    "quote-not-offered": "Bu təklif artıq qərar üçün açıq deyil.",
    "quote-request-created": "Qiymət sorğusu komandaya göndərildi.",
    "quote-unavailable": "Bu xidmət hazırda agentlər üçün əlçatan deyil.",
    "quote-validation": "Qiymət sorğusundakı məlumatları yoxlayın.",
  };
  const code = isError ? error : success;
  return (
    <div
      className={cn(
        "m-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold",
        isError
          ? "border-red-100 bg-red-50 text-red-700"
          : "border-emerald-100 bg-emerald-50 text-emerald-700",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      {messages[code ?? ""] ??
        (isError
          ? "Əməliyyat tamamlana bilmədi."
          : "Əməliyyat uğurla tamamlandı.")}
    </div>
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
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-[#637392]">
        {label}
      </span>
      {children}
    </label>
  );
}

function ProposalSubmitButton({
  danger = false,
  icon: Icon,
  label,
  success = false,
}: {
  danger?: boolean;
  icon: typeof SendIcon;
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
      <Icon data-icon="inline-start" />
      {pending ? "Göndərilir..." : label}
    </Button>
  );
}

function getDiscountPercent(proposal: ServiceQuoteRequestRecord) {
  if (
    proposal.standardUnitPrice === null ||
    proposal.offeredUnitPrice === null ||
    proposal.standardUnitPrice <= 0
  )
    return null;
  return Math.round(
    (1 - proposal.offeredUnitPrice / proposal.standardUnitPrice) * 100,
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
  const time = `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${time}`;
}

const inputClassName =
  "h-11 rounded-2xl border-[#dce6f4] bg-[#fbfdff] px-4 text-sm font-semibold text-[#07183a] placeholder:text-[#9aa7bd] focus-visible:border-[#1559b7] focus-visible:ring-[#1559b7]/10";
const textareaClassName =
  "min-h-24 rounded-2xl border-[#dce6f4] bg-[#fbfdff] text-sm font-semibold";
