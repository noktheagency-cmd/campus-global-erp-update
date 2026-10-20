"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import dynamic from "next/dynamic";
import {
  ArchiveIcon,
  ArrowRightIcon,
  BadgeDollarSignIcon,
  CheckCircle2Icon,
  CircleAlertIcon,
  Clock3Icon,
  FileQuestionIcon,
  FilesIcon,
  GraduationCapIcon,
  PackageCheckIcon,
  PencilIcon,
  PlusIcon,
  ReceiptTextIcon,
  Settings2Icon,
  ShoppingBagIcon,
  UsersRoundIcon,
  XCircleIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  AgentQuoteRequestsPanel,
  CreateServiceQuoteDialog,
  StaffQuoteRequestsPanel,
} from "@/features/services/components/service-quote-requests";
import {
  archiveServiceAction,
  createAgentServicePriceProposalAction,
  createServiceAction,
  createServiceOrderAction,
  removeAgentServicePriceAction,
  updateServiceAction,
  updateServiceOrderAction,
} from "@/features/services/actions";
import type {
  MoneyValue,
  PortalServicesWorkspaceData,
  ServiceAdminRecord,
  ServiceAgentOption,
  ServiceOrderRecord,
  ServicesWorkspaceData,
  StaffServicesWorkspaceData,
} from "@/features/services/types";
import { cn } from "@/lib/utils";

const DocumentOrdersWorkspace = dynamic(() =>
  import("@/features/services/components/document-orders-workspace").then(
    (module) => module.DocumentOrdersWorkspace,
  ),
);

export function ServicesWorkspace({
  data,
  error,
  view,
  success,
}: {
  data: ServicesWorkspaceData;
  error?: string;
  view?: string;
  success?: string;
}) {
  return data.mode === "staff" ? (
    <StaffServicesWorkspace
      data={data}
      error={error}
      initialView={view}
      success={success}
    />
  ) : (
    <PortalServicesWorkspace data={data} error={error} success={success} />
  );
}

function StaffServicesWorkspace({
  data,
  error,
  initialView,
  success,
}: {
  data: StaffServicesWorkspaceData;
  error?: string;
  initialView?: string;
  success?: string;
}) {
  const [activeView, setActiveView] = useState<
    "catalog" | "document-orders" | "orders" | "quotes"
  >(
    initialView === "quotes" ||
      initialView === "orders" ||
      initialView === "document-orders"
      ? initialView
      : "catalog",
  );

  return (
    <div className="min-h-full bg-[#f6f9ff] px-5 py-6 text-[#07183a] lg:px-8 lg:py-8">
      <header className="flex flex-col gap-5 border-b border-[#dce6f4]/70 pb-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Xidmətlər
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#5d6d91]">
            Xidmət kataloqunu, agent qiymət sorğularını, fərdi təklifləri və
            təsdiqlənmiş sifarişləri və sənəd təhvil axınını bir mərkəzdən idarə
            edin.
          </p>
        </div>
        {data.canManage && activeView !== "document-orders" ? (
          <ServiceFormDialog />
        ) : null}
      </header>

      <FeedbackBanner error={error} success={success} />

      {activeView !== "document-orders" ? (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail="Portallarda satışa açıq xidmətlər"
            icon={ShoppingBagIcon}
            label="Aktiv xidmət"
            tone="blue"
            value={String(data.metrics.activeServices)}
          />
          <MetricCard
            detail="Komandanın qiymət cavabını gözləyən agent sorğuları"
            icon={FileQuestionIcon}
            label="Yeni qiymət sorğusu"
            tone="violet"
            value={String(data.metrics.pendingQuoteRequests)}
          />
          <MetricCard
            detail="Təsdiq və icra gözləyən sifarişlər"
            icon={Clock3Icon}
            label="Aktiv sifariş"
            tone="amber"
            value={String(data.metrics.pendingOrders)}
          />
          <MetricCard
            detail="Komanda tərəfindən tamamlanan sifarişlər"
            icon={BadgeDollarSignIcon}
            label="Tamamlanan sifariş"
            tone="green"
            value={String(data.metrics.completedOrders)}
          />
        </section>
      ) : null}

      <div className="mt-6 flex w-full gap-1 overflow-x-auto rounded-2xl border border-[#dce6f4] bg-white p-1 sm:w-fit">
        <ViewButton
          active={activeView === "catalog"}
          icon={ShoppingBagIcon}
          label="Xidmət kataloqu"
          onClick={() => setActiveView("catalog")}
        />
        <ViewButton
          active={activeView === "quotes"}
          count={data.metrics.pendingQuoteRequests}
          icon={FileQuestionIcon}
          label="Qiymət sorğuları"
          onClick={() => setActiveView("quotes")}
        />
        <ViewButton
          active={activeView === "orders"}
          count={data.orders.length}
          icon={ReceiptTextIcon}
          label="Sifarişlər"
          onClick={() => setActiveView("orders")}
        />
        <ViewButton
          active={activeView === "document-orders"}
          count={data.documentOrderMetrics.ALL}
          icon={FilesIcon}
          label="Sənəd sifarişləri"
          onClick={() => setActiveView("document-orders")}
        />
      </div>

      {activeView === "catalog" ? (
        <section className="mt-5 grid gap-4 xl:grid-cols-2">
          {data.services.length > 0 ? (
            data.services.map((service) => (
              <AdminServiceCard
                agents={data.agents}
                canManage={data.canManage}
                key={service.id}
                service={service}
              />
            ))
          ) : (
            <EmptyState
              action={data.canManage ? <ServiceFormDialog compact /> : null}
              icon={ShoppingBagIcon}
              text="İlk xidməti yaradın, tələbə və agent qiymətlərini təyin edin."
              title="Xidmət kataloqu boşdur"
            />
          )}
        </section>
      ) : activeView === "quotes" ? (
        <section className="mt-5">
          <StaffQuoteRequestsPanel
            canReview={data.canReviewQuotes}
            requests={data.quoteRequests}
          />
        </section>
      ) : activeView === "orders" ? (
        <section className="mt-5">
          <OrdersPanel canUpdate={data.canUpdateOrders} orders={data.orders} />
        </section>
      ) : (
        <section className="mt-5">
          <DocumentOrdersWorkspace
            canCreate={data.canCreateDocumentOrders}
            canUpdate={data.canUpdateDocumentOrders}
            metrics={data.documentOrderMetrics}
            options={data.documentOrderOptions}
            orders={data.documentOrders}
          />
        </section>
      )}
    </div>
  );
}

function PortalServicesWorkspace({
  data,
  error,
  success,
}: {
  data: PortalServicesWorkspaceData;
  error?: string;
  success?: string;
}) {
  const buyerLabel =
    data.buyerType === "AGENT" ? "Agent portalı" : "Tələbə portalı";

  return (
    <div className="min-h-full bg-[#f6f9ff] px-5 py-6 text-[#07183a] lg:px-8 lg:py-8">
      <header className="flex flex-col gap-5 border-b border-[#dce6f4]/70 pb-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#1559b7]">
              <ShoppingBagIcon className="size-5" />
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Xidmətlər
              </h1>
              <p className="mt-1 text-sm font-semibold text-[#637392]">
                {buyerLabel} · xidmət və qiymət təklifləri
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm font-medium leading-6 text-[#5d6d91]">
            {data.buyerType === "AGENT"
              ? "Ehtiyacınız olan xidmət üçün qiymət sorğusu göndərin. Komanda qiymət yazdıqdan sonra təklifi qəbul və ya səbəblə rədd edə bilərsiniz."
              : "Ehtiyacınız olan xidməti seçin. Sifariş göndərildikdən sonra komandamız statusu burada yeniləyəcək."}
          </p>
        </div>
        <div className="rounded-2xl border border-[#dce6f4] bg-white px-4 py-3">
          <div className="text-[11px] font-black uppercase tracking-wide text-[#8b98b1]">
            {data.buyerType === "AGENT" ? "Qiymət sorğularım" : "Sifarişlərim"}
          </div>
          <div className="mt-1 text-2xl font-black text-[#07183a]">
            {data.buyerType === "AGENT"
              ? data.quoteRequests.length
              : data.orders.length}
          </div>
        </div>
      </header>

      <FeedbackBanner error={error} success={success} />

      <section className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {data.services.length > 0 ? (
          data.services.map((service) => (
            <article
              className="flex min-h-72 flex-col rounded-[1.65rem] border border-[#dce6f4] bg-white p-5 shadow-[0_18px_50px_rgba(29,78,216,0.05)]"
              key={service.id}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#1559b7]">
                  <PackageCheckIcon className="size-5" />
                </span>
                <PriceKindBadge kind={service.priceKind} />
              </div>
              <h2 className="mt-5 text-xl font-black text-[#07183a]">
                {service.name}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-[#637392]">
                {service.description ||
                  "Bu xidmət üçün əlavə məlumat sifarişdən sonra təqdim ediləcək."}
              </p>
              <div className="mt-auto pt-6">
                <div className="mb-4">
                  <div className="text-[11px] font-black uppercase tracking-wide text-[#8b98b1]">
                    Sizin qiymətiniz
                  </div>
                  <div className="mt-1 text-2xl font-black text-[#07183a]">
                    {service.price
                      ? formatMoney(
                          service.price.amount,
                          service.price.currency,
                        )
                      : "Sorğu ilə"}
                  </div>
                </div>
                {data.buyerType === "AGENT" ? (
                  <CreateServiceQuoteDialog
                    activeQuote={service.activeQuote}
                    serviceId={service.id}
                    serviceName={service.name}
                  />
                ) : (
                  <OrderServiceDialog
                    disabled={!service.available}
                    price={service.price}
                    serviceId={service.id}
                    serviceName={service.name}
                  />
                )}
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            icon={ShoppingBagIcon}
            text="Yeni xidmətlər satışa açıldıqda bu bölmədə görünəcək."
            title="Hazırda aktiv xidmət yoxdur"
          />
        )}
      </section>

      {data.buyerType === "AGENT" ? (
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-black text-[#07183a]">
              Qiymət sorğularım
            </h2>
            <p className="mt-1 text-sm font-medium text-[#637392]">
              Göndərdiyiniz sorğular, komandanın təklifləri və qərar tarixçəsi.
            </p>
          </div>
          <AgentQuoteRequestsPanel requests={data.quoteRequests} />
        </section>
      ) : null}

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-black text-[#07183a]">Sifarişlərim</h2>
          <p className="mt-1 text-sm font-medium text-[#637392]">
            Göndərdiyiniz xidmət sifarişlərinin cari icra statusu.
          </p>
        </div>
        <OrdersPanel canUpdate={false} orders={data.orders} />
      </section>
    </div>
  );
}

function AdminServiceCard({
  agents,
  canManage,
  service,
}: {
  agents: ServiceAgentOption[];
  canManage: boolean;
  service: ServiceAdminRecord;
}) {
  return (
    <article className="rounded-[1.65rem] border border-[#dce6f4] bg-white p-5 shadow-[0_18px_50px_rgba(29,78,216,0.05)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#1559b7]">
            <ShoppingBagIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-[#07183a]">
                {service.name}
              </h2>
              <ServiceStatusBadge status={service.status} />
            </div>
            <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-[#637392]">
              {service.description || "Açıqlama əlavə edilməyib."}
            </p>
          </div>
        </div>
        {canManage ? (
          <div className="flex shrink-0 gap-2">
            <AgentPricingDialog agents={agents} service={service} />
            <ServiceFormDialog service={service} />
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <PriceBox
          active={service.availableToAgents}
          icon={UsersRoundIcon}
          label="Agent daxili referansı"
          price={service.agentBasePrice}
        />
        <PriceBox
          active={service.availableToStudents}
          icon={GraduationCapIcon}
          label="Tələbə qiyməti"
          price={service.studentPrice}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#edf2f8] pt-4 text-xs font-bold text-[#637392]">
        <span>{service.orderCount} sifariş</span>
        <span className="text-[#c6d0df]">·</span>
        <span>{service.quoteRequestCount} qiymət sorğusu</span>
        <span className="text-[#c6d0df]">·</span>
        <span>{service.agentOverrides.length} xüsusi agent qiyməti</span>
        <span className="text-[#c6d0df]">·</span>
        <span>Sıra: {service.sortOrder}</span>
      </div>
    </article>
  );
}

function ServiceFormDialog({
  compact = false,
  service,
}: {
  compact?: boolean;
  service?: ServiceAdminRecord;
}) {
  const isEditing = Boolean(service);
  const currency =
    service?.agentBasePrice?.currency ??
    service?.studentPrice?.currency ??
    "AZN";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          aria-label={
            isEditing ? `${service?.name} xidmətini redaktə et` : undefined
          }
          className={cn(
            "rounded-2xl font-black",
            isEditing
              ? "size-10 border-[#dce6f4] bg-white text-[#34456c] hover:bg-[#eef5ff] hover:text-[#0b66ff]"
              : "h-11 bg-[#0b66ff] px-5 text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] hover:bg-[#075be8]",
          )}
          size={isEditing ? "icon" : "default"}
          variant={isEditing ? "outline" : "default"}
        >
          {isEditing ? (
            <PencilIcon className="size-4" />
          ) : (
            <>
              <PlusIcon data-icon="inline-start" />
              {compact ? "İlk xidməti yarat" : "Yeni xidmət"}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-[#e7eef8] px-6 py-5 text-left">
          <DialogTitle className="text-xl font-black text-[#07183a]">
            {isEditing ? "Xidməti redaktə et" : "Yeni xidmət yarat"}
          </DialogTitle>
          <DialogDescription className="font-medium leading-6 text-[#637392]">
            Xidmətin görünüşünü təyin edin. Agent baza qiyməti daxili istinad
            üçün istəyə bağlıdır; yekun agent qiyməti sorğu üzrə verilir.
          </DialogDescription>
        </DialogHeader>
        <form
          action={isEditing ? updateServiceAction : createServiceAction}
          className="grid gap-5 p-6"
        >
          {service ? (
            <input name="serviceId" type="hidden" value={service.id} />
          ) : null}
          <Field label="Xidmətin adı">
            <Input
              className={inputClassName}
              defaultValue={service?.name ?? ""}
              maxLength={120}
              name="name"
              placeholder="Məsələn, viza dəstəyi"
              required
            />
          </Field>
          <Field label="Açıqlama">
            <Textarea
              className="min-h-28 rounded-2xl border-[#dce6f4] bg-[#fbfdff] text-sm font-semibold"
              defaultValue={service?.description ?? ""}
              maxLength={1000}
              name="description"
              placeholder="Xidmətin nələri əhatə etdiyini qısa izah edin"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <AudiencePriceField
              checked={service?.availableToAgents ?? true}
              defaultPrice={service?.agentBasePrice?.amount}
              label="Agentlər üçün · baza qiyməti istəyə bağlı"
              name="availableToAgents"
              priceName="agentBasePrice"
            />
            <AudiencePriceField
              checked={service?.availableToStudents ?? true}
              defaultPrice={service?.studentPrice?.amount}
              label="Tələbələr üçün"
              name="availableToStudents"
              priceName="studentPrice"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Valyuta">
              <Input
                className={inputClassName}
                defaultValue={currency}
                maxLength={3}
                name="currency"
                required
              />
            </Field>
            <Field label="Sıralama">
              <Input
                className={inputClassName}
                defaultValue={service?.sortOrder ?? 0}
                min={0}
                name="sortOrder"
                type="number"
              />
            </Field>
            <Field label="Status">
              <select
                className={selectClassName}
                defaultValue={service?.status ?? "ACTIVE"}
                name="status"
              >
                <option value="ACTIVE">Aktiv</option>
                <option value="INACTIVE">Deaktiv</option>
                {service?.status === "ARCHIVED" ? (
                  <option value="ARCHIVED">Arxivdə</option>
                ) : null}
              </select>
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#e7eef8] pt-5 sm:flex-row sm:justify-between">
            {service ? (
              <Button
                className="rounded-2xl border-red-100 bg-white font-bold text-red-600 hover:bg-red-50"
                formAction={archiveServiceAction}
                name="serviceId"
                type="submit"
                value={service.id}
                variant="outline"
              >
                <ArchiveIcon data-icon="inline-start" />
                Arxivlə
              </Button>
            ) : (
              <span />
            )}
            <SubmitButton
              label={isEditing ? "Dəyişiklikləri saxla" : "Xidməti yarat"}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AgentPricingDialog({
  agents,
  service,
}: {
  agents: ServiceAgentOption[];
  service: ServiceAdminRecord;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          aria-label={`${service.name} üçün agent qiymətlərini idarə et`}
          className="size-10 rounded-2xl border-[#dce6f4] bg-white text-[#34456c] hover:bg-[#eef5ff] hover:text-[#0b66ff]"
          size="icon"
          variant="outline"
        >
          <Settings2Icon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-[#e7eef8] px-6 py-5 text-left">
          <DialogTitle className="text-xl font-black text-[#07183a]">
            Agent fərdi qiymətləri
          </DialogTitle>
          <DialogDescription className="font-medium text-[#637392]">
            Endirim təklifini agentə təsdiq üçün göndərin. Agent qəbul edənədək
            standart qiymət qüvvədə qalır.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 p-6">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="text-xs font-black uppercase text-[#1559b7]">
              Standart agent qiyməti
            </div>
            <div className="mt-1 text-xl font-black text-[#07183a]">
              {service.agentBasePrice
                ? formatMoney(
                    service.agentBasePrice.amount,
                    service.agentBasePrice.currency,
                  )
                : "Təyin edilməyib"}
            </div>
          </div>

          {service.agentBasePrice && service.agentBasePrice.amount > 0 ? (
            <form
              action={createAgentServicePriceProposalAction}
              className="grid gap-4 rounded-2xl border border-[#dce6f4] bg-[#fbfdff] p-4"
            >
              <input name="serviceId" type="hidden" value={service.id} />
              <input name="returnTo" type="hidden" value="/services" />
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_90px]">
                <Field label="Agent">
                  <select className={selectClassName} name="agentId" required>
                    <option value="">Agent seçin</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Endirimli qiymət">
                  <Input
                    className={inputClassName}
                    max={
                      service.agentBasePrice
                        ? Math.max(0, service.agentBasePrice.amount - 0.01)
                        : undefined
                    }
                    min="0"
                    name="amount"
                    placeholder="0.00"
                    required
                    step="0.01"
                    type="number"
                  />
                </Field>
                <Field label="Valyuta">
                  <Input
                    className={inputClassName}
                    defaultValue={service.agentBasePrice?.currency ?? "AZN"}
                    maxLength={3}
                    name="currency"
                    readOnly={Boolean(service.agentBasePrice)}
                    required
                  />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Agentə qeyd (istəyə bağlı)">
                  <Textarea
                    className="min-h-24 rounded-2xl border-[#dce6f4] bg-white text-sm font-semibold"
                    maxLength={1000}
                    name="staffResponseNote"
                    placeholder="Endirimin şərtlərini yazın"
                  />
                </Field>
                <Field label="Təklifin son tarixi · Bakı vaxtı">
                  <Input
                    className={inputClassName}
                    name="offerValidUntil"
                    type="datetime-local"
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <SubmitButton compact label="Təsdiqə göndər" />
              </div>
            </form>
          ) : (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
              Endirim təklifi göndərmək üçün əvvəlcə sıfırdan böyük standart
              agent qiyməti təyin edin.
            </div>
          )}

          <div>
            <h3 className="text-sm font-black text-[#07183a]">
              Təsdiqlənmiş fərdi qiymətlər
            </h3>
            <div className="mt-3 grid gap-2">
              {service.agentOverrides.length > 0 ? (
                service.agentOverrides.map((price) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#dce6f4] px-4 py-3"
                    key={price.id}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-[#07183a]">
                        {price.agentName}
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-[#8b98b1]">
                        {formatDate(price.validFrom)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="whitespace-nowrap font-black text-[#1559b7]">
                        {formatMoney(price.amount, price.currency)}
                      </span>
                      <form action={removeAgentServicePriceAction}>
                        <input name="priceId" type="hidden" value={price.id} />
                        <Button
                          aria-label={`${price.agentName} üçün xüsusi qiyməti deaktiv et`}
                          className="size-9 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
                          size="icon"
                          type="submit"
                          variant="ghost"
                        >
                          <XCircleIcon className="size-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-[#cfd9e8] px-4 py-5 text-center text-sm font-semibold text-[#637392]">
                  Agentə özəl qiymət hələ yoxdur.
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black text-[#07183a]">
              Fərdi qiymət təklifləri
            </h3>
            <div className="mt-3 grid gap-2">
              {service.priceProposals.length > 0 ? (
                service.priceProposals.slice(0, 8).map((proposal) => (
                  <div
                    className="rounded-2xl border border-[#dce6f4] px-4 py-3"
                    key={proposal.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-[#07183a]">
                          {proposal.agentName}
                        </div>
                        <div className="mt-0.5 text-xs font-semibold text-[#8b98b1]">
                          {proposal.code} · {formatDate(proposal.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {proposal.offeredUnitPrice !== null &&
                        proposal.currency ? (
                          <span className="font-black text-[#1559b7]">
                            {formatMoney(
                              proposal.offeredUnitPrice,
                              proposal.currency,
                            )}
                          </span>
                        ) : null}
                        <PriceProposalStatus status={proposal.status} />
                      </div>
                    </div>
                    {proposal.agentResponseNote ? (
                      <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
                        Agentin səbəbi: {proposal.agentResponseNote}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-[#cfd9e8] px-4 py-5 text-center text-sm font-semibold text-[#637392]">
                  Hələ fərdi qiymət təklifi göndərilməyib.
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PriceProposalStatus({
  status,
}: {
  status: ServiceAdminRecord["priceProposals"][number]["status"];
}) {
  const labels = {
    ACCEPTED: "Təsdiqlənib",
    DECLINED: "İmtina edilib",
    EXPIRED: "Müddəti bitib",
    OFFERED: "Agent gözlənilir",
    PENDING: "Gözləyir",
    REJECTED: "Rədd edilib",
  } as const;

  return (
    <Badge
      className={cn(
        "rounded-full border px-2.5 py-1 text-[10px] font-black",
        status === "ACCEPTED" &&
          "border-emerald-100 bg-emerald-50 text-emerald-700",
        status === "OFFERED" && "border-amber-100 bg-amber-50 text-amber-700",
        status === "DECLINED" && "border-red-100 bg-red-50 text-red-600",
        (status === "EXPIRED" || status === "REJECTED") &&
          "border-slate-200 bg-slate-50 text-slate-600",
      )}
      variant="outline"
    >
      {labels[status]}
    </Badge>
  );
}

function OrderServiceDialog({
  disabled,
  price,
  serviceId,
  serviceName,
}: {
  disabled: boolean;
  price: MoneyValue | null;
  serviceId: string;
  serviceName: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="h-11 w-full rounded-2xl bg-[#0b66ff] font-black text-white hover:bg-[#075be8]"
          disabled={disabled}
        >
          Sifariş et
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#e7eef8] px-6 py-5 text-left">
          <DialogTitle className="text-xl font-black text-[#07183a]">
            {serviceName}
          </DialogTitle>
          <DialogDescription className="font-medium text-[#637392]">
            Sifariş qiyməti təsdiqdən əvvəl yenidən serverdə yoxlanılacaq.
          </DialogDescription>
        </DialogHeader>
        <form action={createServiceOrderAction} className="grid gap-5 p-6">
          <input name="serviceId" type="hidden" value={serviceId} />
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="text-xs font-black uppercase text-[#1559b7]">
              Cari vahid qiymət
            </div>
            <div className="mt-1 text-2xl font-black text-[#07183a]">
              {price
                ? formatMoney(price.amount, price.currency)
                : "Mövcud deyil"}
            </div>
          </div>
          <Field label="Say">
            <Input
              className={inputClassName}
              defaultValue={1}
              max={100}
              min={1}
              name="quantity"
              required
              type="number"
            />
          </Field>
          <Field label="Qeyd (istəyə bağlı)">
            <Textarea
              className="min-h-24 rounded-2xl border-[#dce6f4] bg-[#fbfdff] text-sm font-semibold"
              maxLength={1000}
              name="customerNote"
              placeholder="Xüsusi istəyiniz və ya əlavə məlumat"
            />
          </Field>
          <SubmitButton label="Sifarişi göndər" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OrdersPanel({
  canUpdate,
  orders,
}: {
  canUpdate: boolean;
  orders: ServiceOrderRecord[];
}) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ReceiptTextIcon}
        text="Yeni sifarişlər burada görünəcək."
        title="Sifariş yoxdur"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.65rem] border border-[#dce6f4] bg-white shadow-[0_18px_50px_rgba(29,78,216,0.05)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#e7eef8] bg-[#fbfdff] text-[11px] font-black uppercase tracking-wide text-[#71809f]">
              <th className="px-5 py-4">Sifariş</th>
              <th className="px-5 py-4">Alıcı</th>
              <th className="px-5 py-4">Xidmət</th>
              <th className="px-5 py-4">Məbləğ</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Tarix</th>
              {canUpdate ? (
                <th className="px-5 py-4 text-right">Əməl</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                className="border-b border-[#edf2f8] last:border-0"
                key={order.id}
              >
                <td className="px-5 py-4">
                  <div className="font-mono text-xs font-black text-[#1559b7]">
                    {order.code}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-[#8b98b1]">
                    {order.quantity} ədəd
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-bold text-[#07183a]">
                    {order.buyerName}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-[#8b98b1]">
                    {order.buyerType === "AGENT" ? "Agent" : "Tələbə"}
                  </div>
                </td>
                <td className="max-w-64 px-5 py-4">
                  <div className="truncate font-bold text-[#34456c]">
                    {order.serviceName}
                  </div>
                  {order.customerNote ? (
                    <div className="mt-1 truncate text-xs font-medium text-[#8b98b1]">
                      {order.customerNote}
                    </div>
                  ) : null}
                </td>
                <td className="px-5 py-4 font-black text-[#07183a]">
                  {formatMoney(order.totalAmount, order.currency)}
                </td>
                <td className="px-5 py-4">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-[#637392]">
                  {formatDate(order.createdAt)}
                </td>
                {canUpdate ? (
                  <td className="px-5 py-4 text-right">
                    <OrderUpdateDialog order={order} />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderUpdateDialog({ order }: { order: ServiceOrderRecord }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="rounded-xl border-[#dce6f4] bg-white font-bold text-[#34456c] hover:bg-[#eef5ff] hover:text-[#0b66ff]"
          size="sm"
          variant="outline"
        >
          Yenilə
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[1.45rem] border-[#dce6f4] bg-white p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#e7eef8] px-6 py-5 text-left">
          <DialogTitle className="text-xl font-black text-[#07183a]">
            {order.code}
          </DialogTitle>
          <DialogDescription className="font-medium text-[#637392]">
            {order.buyerName} · {order.serviceName}
          </DialogDescription>
        </DialogHeader>
        <form action={updateServiceOrderAction} className="grid gap-5 p-6">
          <input name="orderId" type="hidden" value={order.id} />
          <Field label="Status">
            <select
              className={selectClassName}
              defaultValue={order.status}
              name="status"
            >
              <option value="PENDING">Gözləyir</option>
              <option value="APPROVED">Təsdiqlənib</option>
              <option value="IN_PROGRESS">İcradadır</option>
              <option value="COMPLETED">Tamamlanıb</option>
              <option value="CANCELLED">Ləğv edilib</option>
            </select>
          </Field>
          <Field label="Daxili qeyd">
            <Textarea
              className="min-h-24 rounded-2xl border-[#dce6f4] bg-[#fbfdff] text-sm font-semibold"
              defaultValue={order.internalNote}
              maxLength={1000}
              name="internalNote"
              placeholder="Bu qeyd yalnız əməkdaşlara görünür"
            />
          </Field>
          <SubmitButton label="Sifarişi yenilə" />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AudiencePriceField({
  checked,
  defaultPrice,
  label,
  name,
  priceName,
}: {
  checked: boolean;
  defaultPrice?: number;
  label: string;
  name: string;
  priceName: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dce6f4] bg-[#fbfdff] p-4">
      <label className="flex cursor-pointer items-center gap-3">
        <input
          className="size-4 rounded border-[#cbd7e8] accent-[#0b66ff]"
          defaultChecked={checked}
          name={name}
          type="checkbox"
        />
        <span className="text-sm font-black text-[#07183a]">{label}</span>
      </label>
      <Input
        className={cn(inputClassName, "mt-3 bg-white")}
        defaultValue={defaultPrice}
        min="0"
        name={priceName}
        placeholder="0.00"
        step="0.01"
        type="number"
      />
    </div>
  );
}

function PriceBox({
  active,
  icon: Icon,
  label,
  price,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  price: MoneyValue | null;
}) {
  return (
    <div className="rounded-2xl border border-[#e5edf7] bg-[#fbfdff] p-4">
      <div className="flex items-center gap-2 text-xs font-black text-[#71809f]">
        <Icon className="size-4 text-[#1559b7]" />
        {label}
      </div>
      <div className="mt-2 text-xl font-black text-[#07183a]">
        {active
          ? price
            ? formatMoney(price.amount, price.currency)
            : "Sorğu ilə"
          : "Satışa bağlı deyil"}
      </div>
    </div>
  );
}

function ViewButton({
  active,
  count,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  count?: number;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active) {
      buttonRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [active]);

  return (
    <button
      className={cn(
        "flex h-10 flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-black transition sm:flex-none",
        active
          ? "bg-[#0b66ff] text-white shadow-[0_8px_20px_rgba(37,99,235,0.2)]"
          : "text-[#637392] hover:bg-[#eef5ff] hover:text-[#0b66ff]",
      )}
      onClick={onClick}
      ref={buttonRef}
      type="button"
    >
      <Icon className="size-4" />
      {label}
      {count !== undefined ? (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px]",
            active ? "bg-white/20 text-white" : "bg-[#e8f1ff] text-[#1559b7]",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function MetricCard({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone: "amber" | "blue" | "green" | "violet";
  value: string;
}) {
  const tones = {
    amber: "bg-amber-500 shadow-amber-500/20",
    blue: "bg-[#1559b7] shadow-blue-500/20",
    green: "bg-emerald-500 shadow-emerald-500/20",
    violet: "bg-violet-500 shadow-violet-500/20",
  };

  return (
    <div className="rounded-[1.65rem] border border-[#dce6f4] bg-white p-4 shadow-[0_18px_50px_rgba(29,78,216,0.06)]">
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg",
            tones[tone],
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#637392]">{label}</div>
          <div className="mt-1 truncate text-xl font-black text-[#07183a]">
            {value}
          </div>
          <div className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#71809f]">
            {detail}
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceStatusBadge({
  status,
}: {
  status: ServiceAdminRecord["status"];
}) {
  const labels = {
    ACTIVE: "Aktiv",
    ARCHIVED: "Arxivdə",
    INACTIVE: "Deaktiv",
  };

  return (
    <Badge
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11px] font-black",
        status === "ACTIVE" &&
          "border-emerald-100 bg-emerald-50 text-emerald-600",
        status === "INACTIVE" && "border-amber-100 bg-amber-50 text-amber-700",
        status === "ARCHIVED" && "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {labels[status]}
    </Badge>
  );
}

function PriceKindBadge({
  kind,
}: {
  kind: PortalServicesWorkspaceData["services"][number]["priceKind"];
}) {
  const label =
    kind === "quote-required"
      ? "Qiymət sorğusu"
      : kind === "agent-custom"
        ? "Sizə özəl qiymət"
        : kind === "agent-base"
          ? "Agent qiyməti"
          : kind === "student-base"
            ? "Tələbə qiyməti"
            : "Qiymət yoxdur";

  return (
    <Badge
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] font-black",
        kind === "agent-custom" || kind === "quote-required"
          ? "border-violet-100 bg-violet-50 text-violet-700"
          : kind === "unavailable"
            ? "border-slate-200 bg-slate-50 text-slate-600"
            : "border-blue-100 bg-blue-50 text-[#1559b7]",
      )}
    >
      {label}
    </Badge>
  );
}

function OrderStatusBadge({
  status,
}: {
  status: ServiceOrderRecord["status"];
}) {
  const config = {
    APPROVED: {
      icon: CheckCircle2Icon,
      label: "Təsdiqlənib",
      style: "border-blue-100 bg-blue-50 text-[#1559b7]",
    },
    CANCELLED: {
      icon: XCircleIcon,
      label: "Ləğv edilib",
      style: "border-red-100 bg-red-50 text-red-600",
    },
    COMPLETED: {
      icon: PackageCheckIcon,
      label: "Tamamlanıb",
      style: "border-emerald-100 bg-emerald-50 text-emerald-600",
    },
    IN_PROGRESS: {
      icon: Settings2Icon,
      label: "İcradadır",
      style: "border-violet-100 bg-violet-50 text-violet-700",
    },
    PENDING: {
      icon: Clock3Icon,
      label: "Gözləyir",
      style: "border-amber-100 bg-amber-50 text-amber-700",
    },
  } as const;
  const item = config[status];
  const Icon = item.icon;

  return (
    <Badge
      aria-label={item.label}
      className={cn(
        "inline-flex gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black",
        item.style,
      )}
    >
      <Icon className="size-3" />
      {item.label}
    </Badge>
  );
}

function FeedbackBanner({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) {
    return null;
  }

  const isError = Boolean(error);
  const Icon = isError ? CircleAlertIcon : CheckCircle2Icon;

  return (
    <div
      className={cn(
        "mt-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold",
        isError
          ? "border-red-100 bg-red-50 text-red-700"
          : "border-emerald-100 bg-emerald-50 text-emerald-700",
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" />
      {isError ? getErrorMessage(error) : getSuccessMessage(success)}
    </div>
  );
}

function EmptyState({
  action,
  icon: Icon,
  text,
  title,
}: {
  action?: React.ReactNode;
  icon: LucideIcon;
  text: string;
  title: string;
}) {
  return (
    <div className="col-span-full flex min-h-56 flex-col items-center justify-center rounded-[1.65rem] border border-dashed border-[#cfd9e8] bg-white px-5 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-[#e8f1ff] text-[#1559b7]">
        <Icon className="size-5" />
      </span>
      <div className="mt-4 font-black text-[#07183a]">{title}</div>
      <p className="mt-1 max-w-md text-sm font-semibold leading-6 text-[#637392]">
        {text}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
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

function SubmitButton({
  compact = false,
  label,
}: {
  compact?: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={cn(
        "rounded-2xl bg-[#0b66ff] font-black text-white hover:bg-[#075be8]",
        compact ? "h-11 px-4" : "h-11 px-6",
      )}
      disabled={pending}
      type="submit"
    >
      {pending ? "Saxlanılır..." : label}
    </Button>
  );
}

function formatMoney(amount: number, currency: string) {
  const [whole = "0", fraction = "00"] = amount.toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const decimals = fraction === "00" ? "" : `.${fraction.replace(/0$/, "")}`;
  return `${currency} ${grouped}${decimals}`;
}

function formatDate(value: string) {
  const date = new Date(value);
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

  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getSuccessMessage(code?: string) {
  const messages: Record<string, string> = {
    "agent-price-removed": "Agentə özəl qiymət deaktiv edildi.",
    "agent-price-saved": "Agentə özəl qiymət saxlanıldı.",
    "document-manager-assigned": "Sifariş meneceri yeniləndi.",
    "document-order-created": "Yeni sənəd sifarişi yaradıldı.",
    "document-payment-confirmed": "Ödəniş uğurla təsdiqləndi.",
    "document-status-updated": "Sənəd sifarişinin statusu yeniləndi.",
    "order-created": "Sifariş göndərildi və komandaya çatdı.",
    "order-updated": "Sifariş statusu yeniləndi.",
    "price-proposal-accepted":
      "Fərdi agent qiyməti təsdiqləndi və aktivləşdirildi.",
    "price-proposal-declined":
      "Təklifdən imtina edildi; cari qiymət dəyişmədi.",
    "price-proposal-sent": "Fərdi qiymət agentə təsdiq üçün göndərildi.",
    "quote-accepted": "Qiymət təklifi qəbul edildi və sifariş yaradıldı.",
    "quote-declined": "Qiymət təklifindən imtina edildi.",
    "quote-offered": "Qiymət təklifi agentə göndərildi.",
    "quote-rejected": "Qiymət sorğusu səbəblə rədd edildi.",
    "quote-request-created": "Qiymət sorğusu komandaya göndərildi.",
    "service-archived": "Xidmət arxivləndi.",
    "service-created": "Yeni xidmət yaradıldı.",
    "service-updated": "Xidmət yeniləndi.",
  };

  return messages[code ?? ""] ?? "Əməliyyat uğurla tamamlandı.";
}

function getErrorMessage(code?: string) {
  const messages: Record<string, string> = {
    "buyer-not-found": "Portal alıcısı müəyyən edilə bilmədi.",
    "document-manager-validation": "Menecer seçimini yoxlayın.",
    "document-order-agent-not-found": "Seçilmiş agent tapılmadı.",
    "document-order-code-failed": "Unikal sifariş kodu yaradıla bilmədi.",
    "document-order-failed":
      "Sənəd sifarişi yaradıla bilmədi. Yenidən cəhd edin.",
    "document-order-manager-not-found":
      "Seçilmiş menecer aktiv deyil və ya tapılmadı.",
    "document-order-not-found": "Sənəd sifarişi tapılmadı.",
    "document-order-service-not-found":
      "Seçilmiş xidmət aktiv deyil və ya tapılmadı.",
    "document-order-student-not-found":
      "Seçilmiş tələbə aktiv deyil və ya tapılmadı.",
    "document-order-validation":
      "Sənəd, tələbə və sifariş məlumatlarını yoxlayın.",
    "document-payment-not-open":
      "Ödəniş artıq təsdiqlənib və ya sifariş tapılmadı.",
    "document-payment-validation": "Ödəniş məbləğini yoxlayın.",
    "document-status-failed": "Status yenilənə bilmədi. Yenidən cəhd edin.",
    "document-status-transition": "Bu status keçidinə icazə verilmir.",
    "document-status-validation":
      "Yeni status və təhvil məlumatlarını yoxlayın.",
    "order-failed": "Sifariş göndərilə bilmədi. Yenidən cəhd edin.",
    "order-not-found": "Sifariş tapılmadı.",
    "order-update-validation": "Sifariş məlumatlarını yoxlayın.",
    "order-validation": "Sifariş məlumatlarını yoxlayın.",
    "price-not-found": "Qiymət qeydi tapılmadı.",
    "price-unavailable": "Bu xidmət üçün aktiv qiymət yoxdur.",
    "price-validation": "Agent və qiymət məlumatlarını yoxlayın.",
    "price-proposal-already-open":
      "Bu agent və xidmət üçün artıq açıq qiymət təklifi var.",
    "price-proposal-failed": "Fərdi qiymət təklifi göndərilə bilmədi.",
    "price-proposal-not-discount":
      "Təklif standart qiymətdən aşağı və eyni valyutada olmalıdır.",
    "price-proposal-unavailable":
      "Aktiv agent və ya standart xidmət qiyməti tapılmadı.",
    "price-proposal-validation":
      "Agent, qiymət və tarix məlumatlarını yoxlayın.",
    "quote-agent-only":
      "Qiymət sorğusu yalnız agent portalından göndərilə bilər.",
    "quote-already-open": "Bu xidmət üçün artıq açıq qiymət sorğunuz var.",
    "quote-decision-failed": "Qiymət təklifi üzrə qərar saxlanıla bilmədi.",
    "quote-decision-validation": "Qərarı və imtina səbəbini yoxlayın.",
    "quote-expired": "Bu qiymət təklifinin müddəti bitib. Yeni sorğu göndərin.",
    "quote-failed": "Qiymət sorğusu göndərilə bilmədi. Yenidən cəhd edin.",
    "quote-not-offered":
      "Bu sorğu artıq aktiv qiymət təklifi mərhələsində deyil.",
    "quote-not-pending":
      "Bu sorğu artıq cavablandırılıb və dəyişdirilə bilməz.",
    "quote-offer-failed": "Qiymət təklifi göndərilə bilmədi.",
    "quote-offer-validation": "Qiymət, valyuta və son tarixi yoxlayın.",
    "quote-price-missing": "Sorğunun təsdiqlənmiş qiyməti tapılmadı.",
    "quote-reject-failed": "Sorğu rədd edilə bilmədi.",
    "quote-reject-validation": "Rədd səbəbini ən azı 3 simvol ilə yazın.",
    "quote-required": "Agent sifarişi üçün əvvəlcə qiymət sorğusu göndərin.",
    "quote-validation": "Xidmət, say və sorğu qeydini yoxlayın.",
    "service-not-found": "Xidmət tapılmadı.",
    "service-unavailable": "Bu xidmət hazırda satış üçün açıq deyil.",
    "service-validation":
      "Xidmətin adı, auditoriyası və qiymətlərini yoxlayın.",
  };

  return messages[code ?? ""] ?? "Əməliyyat tamamlana bilmədi.";
}

const inputClassName =
  "h-11 rounded-2xl border-[#dce6f4] bg-[#fbfdff] px-4 text-sm font-semibold text-[#07183a] placeholder:text-[#9aa7bd] focus-visible:border-[#1559b7] focus-visible:ring-[#1559b7]/10";

const selectClassName =
  "h-11 w-full rounded-2xl border border-[#dce6f4] bg-[#fbfdff] px-4 text-sm font-semibold text-[#07183a] outline-none transition focus:border-[#1559b7] focus:ring-4 focus:ring-[#1559b7]/10";
