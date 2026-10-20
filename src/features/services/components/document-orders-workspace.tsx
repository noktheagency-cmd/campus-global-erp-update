"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  BadgeCheckIcon,
  BanknoteIcon,
  BarcodeIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleDotIcon,
  Clock3Icon,
  FileClockIcon,
  FileTextIcon,
  FilterIcon,
  HistoryIcon,
  PackageCheckIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  SendIcon,
  UserRoundCheckIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
import {
  assignDocumentOrderManagerAction,
  confirmDocumentOrderPaymentAction,
  createDocumentOrderAction,
  updateDocumentOrderStatusAction,
} from "@/features/services/actions";
import type {
  DocumentOrderOption,
  DocumentOrderRecord,
  DocumentOrderStatus,
  StaffServicesWorkspaceData,
} from "@/features/services/types";
import { cn } from "@/lib/utils";

type DocumentOrderFilters = {
  agentId: string;
  dateFrom: string;
  dateTo: string;
  query: string;
  serviceId: string;
  status: DocumentOrderStatus | "ALL";
};

const statusMeta: Record<
  DocumentOrderStatus,
  { icon: LucideIcon; label: string; badge: string; dot: string }
> = {
  AT_OFFICE: {
    badge: "bg-[#e9f0ff] text-[#315b9b] ring-[#cad9f1]",
    dot: "bg-[#5a7fbd]",
    icon: PackageCheckIcon,
    label: "Ofisdədir",
  },
  DELIVERED: {
    badge: "bg-[#e8f8ef] text-[#167348] ring-[#c8ecd9]",
    dot: "bg-[#22a06b]",
    icon: CheckCircle2Icon,
    label: "Təhvil verildi",
  },
  IN_PROGRESS: {
    badge: "bg-[#f1edff] text-[#6f4bc4] ring-[#dcd1fa]",
    dot: "bg-[#845fd7]",
    icon: FileClockIcon,
    label: "İcraya verildi",
  },
  ORDERED: {
    badge: "bg-[#eaf3ff] text-[#1763b8] ring-[#cde2fb]",
    dot: "bg-[#2184e8]",
    icon: FileTextIcon,
    label: "Sifariş edildi",
  },
  PREPARING: {
    badge: "bg-[#fff6dc] text-[#9a6800] ring-[#f4e1a5]",
    dot: "bg-[#d99b16]",
    icon: Clock3Icon,
    label: "Hazırlanır",
  },
  RETURNED: {
    badge: "bg-[#fff0f0] text-[#b33a3a] ring-[#f3cece]",
    dot: "bg-[#db5252]",
    icon: RotateCcwIcon,
    label: "Geri qaytarıldı",
  },
};

const sourceLabels = {
  PHONE: "Telefon",
  SYSTEM: "Sistem",
  WHATSAPP: "WhatsApp",
} as const;

const timelineSteps: DocumentOrderStatus[] = [
  "ORDERED",
  "IN_PROGRESS",
  "PREPARING",
  "AT_OFFICE",
  "DELIVERED",
];

const documentStatuses: DocumentOrderStatus[] = [
  "ORDERED",
  "IN_PROGRESS",
  "PREPARING",
  "AT_OFFICE",
  "DELIVERED",
  "RETURNED",
];

const initialFilters: DocumentOrderFilters = {
  agentId: "ALL",
  dateFrom: "",
  dateTo: "",
  query: "",
  serviceId: "ALL",
  status: "ALL",
};

export function DocumentOrdersWorkspace({
  canCreate,
  canUpdate,
  metrics,
  options,
  orders,
}: {
  canCreate: boolean;
  canUpdate: boolean;
  metrics: StaffServicesWorkspaceData["documentOrderMetrics"];
  options: StaffServicesWorkspaceData["documentOrderOptions"];
  orders: DocumentOrderRecord[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<DocumentOrderRecord | null>(null);
  const [filters, setFilters] = useState<DocumentOrderFilters>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredOrders = useMemo(() => {
    const query = filters.query.toLocaleLowerCase("az");
    return orders.filter((order) => {
      const searchable = [
        order.code,
        order.studentName,
        order.agentName,
        order.serviceName,
        order.externalStudentPassport,
      ]
        .join(" ")
        .toLocaleLowerCase("az");
      const createdDate = order.createdAt.slice(0, 10);

      return (
        (!query || searchable.includes(query)) &&
        (filters.status === "ALL" || order.status === filters.status) &&
        (filters.serviceId === "ALL" ||
          order.serviceId === filters.serviceId ||
          order.serviceName === filters.serviceId) &&
        (filters.agentId === "ALL" || order.agentId === filters.agentId) &&
        (!filters.dateFrom || createdDate >= filters.dateFrom) &&
        (!filters.dateTo || createdDate <= filters.dateTo)
      );
    });
  }, [filters, orders]);

  const hasAdvancedFilters =
    filters.agentId !== "ALL" ||
    filters.serviceId !== "ALL" ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-[#0b1f44]">
            Sənəd sifarişləri
          </h2>
          <p className="mt-1 text-sm font-medium text-[#6c7b98]">
            Sifarişdən təhvilə qədər bütün sənəd axınını izləyin.
          </p>
        </div>
        {canCreate ? (
          <Button
            className="h-11 gap-2 rounded-xl bg-[#0866ff] px-5 font-bold shadow-[0_8px_20px_rgba(8,102,255,0.18)] hover:bg-[#075bdc]"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon className="size-4" />
            Yeni sifariş
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-7">
        <StatusMetric
          active={filters.status === "ALL"}
          icon={BarcodeIcon}
          label="Hamısı"
          onClick={() => setFilters((value) => ({ ...value, status: "ALL" }))}
          tone="blue"
          value={metrics.ALL}
        />
        {documentStatuses.map((status) => (
          <StatusMetric
            active={filters.status === status}
            icon={statusMeta[status].icon}
            key={status}
            label={statusMeta[status].label}
            onClick={() => setFilters((value) => ({ ...value, status }))}
            tone={
              status === "DELIVERED"
                ? "green"
                : status === "RETURNED"
                  ? "red"
                  : status === "PREPARING"
                    ? "amber"
                    : "blue"
            }
            value={metrics[status]}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-[#dfe7f2] bg-white p-3 shadow-[0_8px_28px_rgba(31,63,104,0.05)]">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8190ac]" />
            <Input
              aria-label="Sənəd sifarişlərində axtarış"
              className="h-11 rounded-xl border-[#dce5f1] bg-[#fbfcff] pl-10 font-medium"
              onChange={(event) =>
                setFilters((value) => ({ ...value, query: event.target.value }))
              }
              placeholder="Barkod, tələbə, agent..."
              value={filters.query}
            />
          </div>
          <select
            aria-label="Status filtri"
            className={selectClassName("hidden min-w-48 lg:block")}
            onChange={(event) =>
              setFilters((value) => ({
                ...value,
                status: event.target.value as DocumentOrderStatus | "ALL",
              }))
            }
            value={filters.status}
          >
            <option value="ALL">Bütün statuslar</option>
            {documentStatuses.map((status) => (
              <option key={status} value={status}>
                {statusMeta[status].label}
              </option>
            ))}
          </select>
          <Button
            aria-expanded={filtersOpen}
            className={cn(
              "h-11 gap-2 rounded-xl border-[#dce5f1] bg-white px-4 font-bold text-[#435574] hover:bg-[#f5f8fd] hover:text-[#0b1f44]",
              hasAdvancedFilters && "border-[#98c2ff] bg-[#eef5ff] text-[#0866ff]",
            )}
            onClick={() => setFiltersOpen((value) => !value)}
            type="button"
            variant="outline"
          >
            <FilterIcon className="size-4" />
            Ətraflı filtr
          </Button>
        </div>

        {filtersOpen ? (
          <div className="mt-3 grid gap-3 border-t border-[#edf1f7] pt-3 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label="Sənəd növü">
              <select
                className={selectClassName()}
                onChange={(event) =>
                  setFilters((value) => ({
                    ...value,
                    serviceId: event.target.value,
                  }))
                }
                value={filters.serviceId}
              >
                <option value="ALL">Bütün sənəd növləri</option>
                {options.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.label}
                  </option>
                ))}
                {Array.from(
                  new Set(
                    orders.filter((order) => !order.serviceId).map((order) => order.serviceName),
                  ),
                ).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Agent">
              <select
                className={selectClassName()}
                onChange={(event) =>
                  setFilters((value) => ({
                    ...value,
                    agentId: event.target.value,
                  }))
                }
                value={filters.agentId}
              >
                <option value="ALL">Bütün agentlər</option>
                {options.agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.label}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Başlanğıc tarixi">
              <Input
                className="h-11 rounded-xl border-[#dce5f1] bg-[#fbfcff]"
                onChange={(event) =>
                  setFilters((value) => ({ ...value, dateFrom: event.target.value }))
                }
                type="date"
                value={filters.dateFrom}
              />
            </FilterField>
            <FilterField label="Son tarix">
              <div className="flex gap-2">
                <Input
                  className="h-11 rounded-xl border-[#dce5f1] bg-[#fbfcff]"
                  onChange={(event) =>
                    setFilters((value) => ({ ...value, dateTo: event.target.value }))
                  }
                  type="date"
                  value={filters.dateTo}
                />
                {hasAdvancedFilters ? (
                  <Button
                    aria-label="Filtrləri təmizlə"
                    className="size-11 shrink-0 rounded-xl"
                    onClick={() =>
                      setFilters((value) => ({
                        ...initialFilters,
                        query: value.query,
                        status: value.status,
                      }))
                    }
                    type="button"
                    variant="outline"
                  >
                    <XIcon className="size-4" />
                  </Button>
                ) : null}
              </div>
            </FilterField>
          </div>
        ) : null}
      </div>

      {filteredOrders.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-[#dfe7f2] bg-white shadow-[0_10px_30px_rgba(31,63,104,0.05)] lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-[#f7f9fd] text-[11px] font-black uppercase tracking-[0.08em] text-[#71809b]">
                  <tr>
                    <th className="px-5 py-4">Barkod</th>
                    <th className="px-4 py-4">Tələbə</th>
                    <th className="px-4 py-4">Sənəd növü</th>
                    <th className="px-4 py-4">Agent</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Qiymət</th>
                    <th className="px-4 py-4">Mənbə</th>
                    <th className="px-4 py-4">Təslim tarixi</th>
                    <th className="px-4 py-4">Tarix</th>
                    <th className="px-5 py-4 text-right">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf1f6]">
                  {filteredOrders.map((order) => (
                    <tr className="group hover:bg-[#f9fbff]" key={order.id}>
                      <td className="px-5 py-4">
                        <button
                          className="flex items-center gap-2 font-black text-[#0866ff]"
                          onClick={() => setDetailOrder(order)}
                          type="button"
                        >
                          <BarcodeIcon className="size-4 text-[#8aa7cf]" />
                          {order.code}
                        </button>
                      </td>
                      <td className="px-4 py-4 font-bold text-[#15284d]">
                        {order.studentName}
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#4c5e7c]">
                        {order.serviceName}
                      </td>
                      <td className="px-4 py-4 text-[#64728d]">
                        {order.agentName || "—"}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-black text-[#13274a]">
                          {formatMoney(order.price, order.currency)}
                        </div>
                        <span
                          className={cn(
                            "text-[11px] font-bold",
                            order.paymentStatus === "PAID"
                              ? "text-[#168153]"
                              : "text-[#a66c0c]",
                          )}
                        >
                          {order.paymentStatus === "PAID" ? "Ödənilib" : "Ödənilməyib"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#596986]">
                        {sourceLabels[order.source]}
                      </td>
                      <td className="px-4 py-4 text-[#596986]">
                        {formatDate(order.deliveryDate)}
                      </td>
                      <td className="px-4 py-4 text-[#596986]">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          className="rounded-xl border-[#dfe6f0] text-[#314766] hover:border-[#9dbdec] hover:bg-[#eef5ff] hover:text-[#0866ff]"
                          onClick={() => setDetailOrder(order)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Baxış
                          <ChevronRightIcon className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 lg:hidden">
            {filteredOrders.map((order) => (
              <button
                className="rounded-2xl border border-[#dfe7f2] bg-white p-4 text-left shadow-[0_8px_24px_rgba(31,63,104,0.05)] transition hover:border-[#a9c9f6]"
                key={order.id}
                onClick={() => setDetailOrder(order)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#edf5ff] text-[#0866ff]">
                      <BarcodeIcon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-[#0866ff]">
                        {order.code}
                      </div>
                      <div className="mt-1 truncate font-black text-[#13274a]">
                        {order.studentName}
                      </div>
                      <div className="mt-0.5 truncate text-sm font-medium text-[#667592]">
                        {order.serviceName}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#edf1f6] pt-3 text-xs font-semibold text-[#65738e]">
                  <span>{formatMoney(order.price, order.currency)}</span>
                  <span className="text-center">{sourceLabels[order.source]}</span>
                  <span className="flex items-center justify-end gap-1 text-[#29415f]">
                    {formatDate(order.createdAt)}
                    <ChevronRightIcon className="size-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#cfdbea] bg-white px-6 py-16 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#edf5ff] text-[#0866ff]">
            <FileTextIcon className="size-6" />
          </span>
          <h3 className="mt-4 text-lg font-black text-[#122648]">
            Sifariş tapılmadı
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#6b7994]">
            Axtarış və filtr meyarlarını dəyişin və ya yeni sənəd sifarişi yaradın.
          </p>
        </div>
      )}

      <CreateDocumentOrderSheet
        key={createOpen ? "create-open" : "create-closed"}
        onOpenChange={setCreateOpen}
        open={createOpen}
        options={options}
      />
      <DocumentOrderDetailSheet
        canUpdate={canUpdate}
        key={detailOrder?.id ?? "detail-closed"}
        managers={options.managers}
        onOpenChange={(open) => {
          if (!open) setDetailOrder(null);
        }}
        order={detailOrder}
        open={Boolean(detailOrder)}
      />
    </div>
  );
}

function CreateDocumentOrderSheet({
  onOpenChange,
  open,
  options,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  options: StaffServicesWorkspaceData["documentOrderOptions"];
}) {
  const [manualService, setManualService] = useState(false);
  const [externalStudent, setExternalStudent] = useState(false);

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="gap-0 border-[#dbe4ef] bg-white p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[720px]">
        <SheetHeader className="border-b border-[#e2e9f2] px-5 py-5 pr-14 sm:px-7">
          <SheetTitle className="text-xl font-black tracking-tight text-[#0b1f44]">
            Yeni sənəd sifarişi
          </SheetTitle>
          <SheetDescription className="mt-1 text-sm font-medium text-[#6a7892]">
            Sənəd, tələbə və təhvil məlumatlarını daxil edin. Sifariş “Sifariş edildi” statusunda açılacaq.
          </SheetDescription>
        </SheetHeader>
        <form action={createDocumentOrderAction} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
            <FormSection
              icon={FileTextIcon}
              subtitle="Sənəd növü, mənbə və maliyyə detalları"
              title="Sifariş məlumatları"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sənəd xidməti" required>
                  <select
                    className={selectClassName()}
                    disabled={manualService}
                    name="serviceId"
                    required={!manualService}
                  >
                    <option value="">Xidmət seçin</option>
                    {options.services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Sifariş mənbəyi" required>
                  <select className={selectClassName()} defaultValue="SYSTEM" name="source">
                    <option value="SYSTEM">Sistem</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="PHONE">Telefon</option>
                  </select>
                </Field>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#52627f]">
                <input
                  checked={manualService}
                  className="size-4 rounded border-[#cfd9e7] accent-[#0866ff]"
                  onChange={(event) => setManualService(event.target.checked)}
                  type="checkbox"
                />
                Siyahıda olmayan sənəd növü
              </label>
              {manualService ? (
                <Field label="Sənəd növünün adı" required>
                  <Input
                    className={inputClassName}
                    name="manualServiceName"
                    placeholder="Məsələn, Diploma çıxarışı"
                    required
                  />
                </Field>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Qiymət">
                  <div className="relative">
                    <Input className={cn(inputClassName, "pr-16")} min="0" name="price" step="0.01" type="number" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#6f7e98]">AZN</span>
                  </div>
                  <input name="currency" type="hidden" value="AZN" />
                </Field>
                <Field label="Planlanan təhvil tarixi">
                  <Input className={inputClassName} name="deliveryDate" type="date" />
                </Field>
              </div>
            </FormSection>

            <FormSection
              icon={UserRoundIcon}
              subtitle="Bazadakı tələbəni seçin və ya yeni məlumat daxil edin"
              title="Tələbə və agent"
            >
              <Field label="Tələbə" required>
                <select
                  className={selectClassName()}
                  disabled={externalStudent}
                  name="studentId"
                  required={!externalStudent}
                >
                  <option value="">Tələbə seçin</option>
                  {options.students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.label}{student.passportNo ? ` · ${student.passportNo}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#52627f]">
                <input
                  checked={externalStudent}
                  className="size-4 rounded border-[#cfd9e7] accent-[#0866ff]"
                  onChange={(event) => setExternalStudent(event.target.checked)}
                  type="checkbox"
                />
                Bazada olmayan tələbə
              </label>
              {externalStudent ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ad" required>
                    <Input className={inputClassName} name="externalStudentName" required />
                  </Field>
                  <Field label="Soyad" required>
                    <Input className={inputClassName} name="externalStudentSurname" required />
                  </Field>
                  <Field label="Pasport nömrəsi">
                    <Input className={inputClassName} name="externalStudentPassport" />
                  </Field>
                </div>
              ) : null}
              <Field label="Agent">
                <select className={selectClassName()} name="agentId">
                  <option value="">Agent təyin edilməyib</option>
                  {options.agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>{agent.label}</option>
                  ))}
                </select>
              </Field>
            </FormSection>

            <FormSection
              icon={UserRoundCheckIcon}
              subtitle="Sənəd başqa şəxs üçün hazırlanırsa doldurun"
              title="Benefisiar məlumatları"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ad"><Input className={inputClassName} name="beneficiaryName" /></Field>
                <Field label="Soyad"><Input className={inputClassName} name="beneficiarySurname" /></Field>
                <Field label="FİN"><Input className={inputClassName} name="beneficiaryFin" /></Field>
                <Field label="Pasport"><Input className={inputClassName} name="beneficiaryPassport" /></Field>
              </div>
            </FormSection>

            <FormSection
              icon={BadgeCheckIcon}
              subtitle="Məsul əməkdaş və daxili qeyd"
              title="İdarəetmə"
            >
              <Field label="Menecer">
                <select className={selectClassName()} name="managerId">
                  <option value="">Sonra təyin et</option>
                  {options.managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>{manager.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Qeyd">
                <Textarea className="min-h-24 rounded-xl border-[#dce5f1] bg-[#fbfcff]" name="note" placeholder="Komanda üçün əlavə məlumat..." />
              </Field>
            </FormSection>
          </div>

          <SheetFooter className="flex-row items-center justify-end border-t border-[#e2e9f2] bg-white px-5 py-4 sm:px-7">
            <SheetClose asChild>
              <Button className="rounded-xl" type="button" variant="outline">Ləğv et</Button>
            </SheetClose>
            <SubmitButton icon={PlusIcon} label="Sifarişi yarat" pendingLabel="Yaradılır..." />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function DocumentOrderDetailSheet({
  canUpdate,
  managers,
  onOpenChange,
  open,
  order,
}: {
  canUpdate: boolean;
  managers: DocumentOrderOption[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  order: DocumentOrderRecord | null;
}) {
  const transitions = order ? getNextStatuses(order.status) : [];
  const [nextStatus, setNextStatus] = useState<DocumentOrderStatus | "">(
    transitions[0] ?? "",
  );

  if (!order) return null;

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="gap-0 border-[#dbe4ef] bg-[#f7f9fd] p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[760px]">
        <SheetHeader className="border-b border-[#e0e7f1] bg-white px-5 py-5 pr-14 sm:px-7">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="text-xl font-black tracking-tight text-[#0b1f44]">
              {order.code}
            </SheetTitle>
            <StatusBadge status={order.status} />
            <span className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ring-inset",
              order.paymentStatus === "PAID"
                ? "bg-[#e8f8ef] text-[#167348] ring-[#c8ecd9]"
                : "bg-[#fff6dc] text-[#9a6800] ring-[#f4e1a5]",
            )}>
              {order.paymentStatus === "PAID" ? "Ödənilib" : "Ödənilməyib"}
            </span>
          </div>
          <SheetDescription className="mt-1 text-sm font-medium text-[#6a7892]">
            {order.studentName} · {order.serviceName}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
          <section className="rounded-2xl border border-[#dfe7f2] bg-white p-5">
            <div className="flex items-center gap-2">
              <HistoryIcon className="size-4 text-[#0866ff]" />
              <h3 className="text-sm font-black text-[#13274a]">İcra mərhələsi</h3>
            </div>
            {order.status === "RETURNED" ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#fff4f4] p-4 text-sm font-bold text-[#a63d3d]">
                <RotateCcwIcon className="size-5" />
                Sifariş geri qaytarılıb. Aşağıdakı tarixçədə səbəbi görə bilərsiniz.
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-5 gap-1">
                {timelineSteps.map((status, index) => {
                  const currentIndex = timelineSteps.indexOf(order.status);
                  const completed = index <= currentIndex;
                  const active = status === order.status;
                  return (
                    <div className="relative text-center" key={status}>
                      {index > 0 ? (
                        <span className={cn(
                          "absolute right-1/2 top-3.5 h-0.5 w-full",
                          completed ? "bg-[#4f91ed]" : "bg-[#dce5f0]",
                        )} />
                      ) : null}
                      <span className={cn(
                        "relative z-10 mx-auto flex size-7 items-center justify-center rounded-full border-2 bg-white",
                        completed ? "border-[#0866ff] text-[#0866ff]" : "border-[#cfd9e7] text-[#a2aec0]",
                        active && "bg-[#0866ff] text-white shadow-[0_0_0_4px_#e8f2ff]",
                      )}>
                        {completed && !active ? <CheckCircle2Icon className="size-4" /> : <CircleDotIcon className="size-3" />}
                      </span>
                      <div className={cn(
                        "mt-2 text-[10px] font-black leading-4",
                        completed ? "text-[#234773]" : "text-[#8a97aa]",
                      )}>
                        {statusMeta[status].label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#dfe7f2] bg-white p-5">
            <h3 className="text-sm font-black text-[#13274a]">Sifariş məlumatları</h3>
            <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <InfoItem label="Sənəd növü" value={order.serviceName} />
              <InfoItem label="Mənbə" value={sourceLabels[order.source]} />
              <InfoItem label="Tələbə" value={order.studentName} />
              <InfoItem label="Agent" value={order.agentName || "Təyin edilməyib"} />
              <InfoItem label="Qiymət" value={formatMoney(order.price, order.currency)} />
              <InfoItem label="Menecer" value={order.managerName || "Təyin edilməyib"} />
              <InfoItem label="Yaradılıb" value={formatDateTime(order.createdAt)} />
              <InfoItem label="Təhvil tarixi" value={formatDate(order.deliveryDate)} />
              <InfoItem label="Yaradan" value={order.createdByName} />
              <InfoItem
                label="Təhvil alan"
                value={order.recipientName ? `${order.recipientName} ${order.recipientSurname}` : "—"}
              />
            </dl>
            {order.note ? (
              <div className="mt-4 rounded-xl bg-[#f6f8fc] p-3 text-sm font-medium leading-6 text-[#566783]">
                {order.note}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[#dfe7f2] bg-white p-5">
            <div className="flex items-center gap-2">
              <HistoryIcon className="size-4 text-[#0866ff]" />
              <h3 className="text-sm font-black text-[#13274a]">Status tarixçəsi</h3>
            </div>
            <div className="mt-4 space-y-4">
              {order.statusHistory.map((entry, index) => (
                <div className="relative flex gap-3" key={entry.id}>
                  {index < order.statusHistory.length - 1 ? (
                    <span className="absolute bottom-[-17px] left-[7px] top-4 w-px bg-[#d9e2ee]" />
                  ) : null}
                  <span className={cn("relative mt-1.5 size-3.5 shrink-0 rounded-full ring-4 ring-white", statusMeta[entry.status].dot)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-black text-[#263a5c]">{statusMeta[entry.status].label}</span>
                      <span className="text-[11px] font-bold text-[#8a97aa]">{formatDateTime(entry.createdAt)}</span>
                    </div>
                    <div className="mt-0.5 text-xs font-semibold text-[#6f7d96]">{entry.changedByName}</div>
                    {entry.note ? <p className="mt-1 text-xs leading-5 text-[#687790]">{entry.note}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {canUpdate ? (
            <div className="grid gap-4 xl:grid-cols-3">
              <ActionCard icon={SendIcon} title="Statusu dəyiş">
                {transitions.length > 0 ? (
                  <form action={updateDocumentOrderStatusAction} className="space-y-3">
                    <input name="orderId" type="hidden" value={order.id} />
                    <select
                      className={selectClassName("h-10")}
                      name="status"
                      onChange={(event) => setNextStatus(event.target.value as DocumentOrderStatus)}
                      value={nextStatus}
                    >
                      {transitions.map((status) => (
                        <option key={status} value={status}>{statusMeta[status].label}</option>
                      ))}
                    </select>
                    {nextStatus === "DELIVERED" ? (
                      <div className="space-y-2 rounded-xl bg-[#f6f8fc] p-3">
                        <select className={selectClassName("h-10")} name="recipientType" required>
                          <option value="">Təhvil alan tipi</option>
                          <option value="STUDENT">Tələbə</option>
                          <option value="AGENT">Agent</option>
                          <option value="OTHER">Digər şəxs</option>
                        </select>
                        <Input className="h-10 rounded-xl" name="recipientName" placeholder="Ad" required />
                        <Input className="h-10 rounded-xl" name="recipientSurname" placeholder="Soyad" required />
                        <Input className="h-10 rounded-xl" name="recipientFin" placeholder="FİN (opsional)" />
                      </div>
                    ) : null}
                    <Textarea className="min-h-20 rounded-xl" name="note" placeholder="Status qeydi..." />
                    <SubmitButton compact icon={SendIcon} label="Statusu yenilə" pendingLabel="Yenilənir..." />
                  </form>
                ) : (
                  <p className="text-xs font-semibold leading-5 text-[#78859b]">Bu sifariş terminal statusdadır.</p>
                )}
              </ActionCard>

              <ActionCard icon={BanknoteIcon} title="Ödəniş">
                {order.paymentStatus === "UNPAID" ? (
                  <form action={confirmDocumentOrderPaymentAction} className="space-y-3">
                    <input name="orderId" type="hidden" value={order.id} />
                    <Field label="Məbləğ">
                      <Input className="h-10 rounded-xl" defaultValue={order.price ?? ""} min="0" name="amount" required step="0.01" type="number" />
                    </Field>
                    <SubmitButton compact icon={BadgeCheckIcon} label="Ödənişi təsdiqlə" pendingLabel="Təsdiqlənir..." />
                  </form>
                ) : (
                  <div className="rounded-xl bg-[#edf9f2] p-3 text-xs font-bold leading-5 text-[#18744a]">
                    {formatMoney(order.price, order.currency)} məbləğində ödəniş {formatDateTime(order.paidAt)} tarixində təsdiqlənib.
                  </div>
                )}
              </ActionCard>

              <ActionCard icon={UserRoundCheckIcon} title="Menecer">
                <form action={assignDocumentOrderManagerAction} className="space-y-3">
                  <input name="orderId" type="hidden" value={order.id} />
                  <select className={selectClassName("h-10")} defaultValue={order.managerId ?? ""} name="managerId">
                    <option value="">Təyin edilməyib</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>{manager.label}</option>
                    ))}
                  </select>
                  <SubmitButton compact icon={UserRoundCheckIcon} label="Meneceri saxla" pendingLabel="Saxlanılır..." />
                </form>
              </ActionCard>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StatusMetric({
  active,
  icon: Icon,
  label,
  onClick,
  tone,
  value,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone: "amber" | "blue" | "green" | "red";
  value: number;
}) {
  const tones = {
    amber: "bg-[#fff6dc] text-[#b07700]",
    blue: "bg-[#eaf3ff] text-[#0866ff]",
    green: "bg-[#e8f8ef] text-[#168153]",
    red: "bg-[#fff0f0] text-[#c14848]",
  };
  return (
    <button
      className={cn(
        "flex min-h-24 items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-[0_8px_24px_rgba(31,63,104,0.045)] transition",
        active ? "border-[#8dbbfb] ring-2 ring-[#ddebff]" : "border-[#dfe7f2] hover:border-[#b8cce8]",
      )}
      onClick={onClick}
      type="button"
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-black uppercase tracking-[0.06em] text-[#74829c]">{label}</span>
        <span className="mt-1 block text-2xl font-black text-[#10264a]">{value}</span>
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: DocumentOrderStatus }) {
  const meta = statusMeta[status];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ring-inset", meta.badge)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

function FormSection({
  children,
  icon: Icon,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  icon: LucideIcon;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-[#dfe7f2] bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3 border-b border-[#edf1f6] pb-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf5ff] text-[#0866ff]"><Icon className="size-5" /></span>
        <div>
          <h3 className="text-sm font-black text-[#13274a]">{title}</h3>
          <p className="mt-0.5 text-xs font-medium text-[#78859c]">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function ActionCard({ children, icon: Icon, title }: { children: React.ReactNode; icon: LucideIcon; title: string }) {
  return (
    <section className="rounded-2xl border border-[#dfe7f2] bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#13274a]"><Icon className="size-4 text-[#0866ff]" />{title}</div>
      {children}
    </section>
  );
}

function FilterField({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="space-y-1.5 text-xs font-black text-[#65738d]"><span>{label}</span>{children}</label>;
}

function Field({ children, label, required = false }: { children: React.ReactNode; label: string; required?: boolean }) {
  return (
    <label className="block space-y-1.5 text-xs font-black text-[#52627e]">
      <span>{label}{required ? <span className="ml-1 text-[#d04747]">*</span> : null}</span>
      {children}
    </label>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[11px] font-black uppercase tracking-[0.06em] text-[#8995a8]">{label}</dt><dd className="mt-1 text-sm font-bold text-[#314461]">{value}</dd></div>;
}

function SubmitButton({
  compact = false,
  icon: Icon,
  label,
  pendingLabel,
}: {
  compact?: boolean;
  icon: LucideIcon;
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button className={cn("gap-2 rounded-xl bg-[#0866ff] font-black hover:bg-[#075bdc]", compact ? "h-10 w-full text-xs" : "h-11 px-5")} disabled={pending} type="submit">
      {pending ? <Clock3Icon className="size-4 animate-spin" /> : <Icon className="size-4" />}
      {pending ? pendingLabel : label}
    </Button>
  );
}

function getNextStatuses(status: DocumentOrderStatus): DocumentOrderStatus[] {
  const nextByStatus: Partial<Record<DocumentOrderStatus, DocumentOrderStatus>> = {
    AT_OFFICE: "DELIVERED",
    IN_PROGRESS: "PREPARING",
    ORDERED: "IN_PROGRESS",
    PREPARING: "AT_OFFICE",
  };
  const next = nextByStatus[status];
  if (status === "DELIVERED" || status === "RETURNED") return [];
  return next ? [next, "RETURNED"] : ["RETURNED"];
}

function formatMoney(amount: number | null, currency: string) {
  if (amount === null) return "—";
  const [whole, fraction] = amount.toFixed(2).split(".");
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${groupedWhole}${fraction === "00" ? "" : `,${fraction}`} ${currency}`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = toBakuDate(value);
  return `${padDatePart(date.getUTCDate())}.${padDatePart(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = toBakuDate(value);
  return `${padDatePart(date.getUTCDate())}.${padDatePart(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}, ${padDatePart(date.getUTCHours())}:${padDatePart(date.getUTCMinutes())}`;
}

function toBakuDate(value: string) {
  return new Date(new Date(value).getTime() + 4 * 60 * 60 * 1000);
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

const inputClassName = "h-11 rounded-xl border-[#dce5f1] bg-[#fbfcff] font-medium";

function selectClassName(extra?: string) {
  return cn("h-11 w-full rounded-xl border border-[#dce5f1] bg-[#fbfcff] px-3 text-sm font-semibold text-[#263a5c] outline-none transition focus:border-[#75aaf3] focus:ring-2 focus:ring-[#e3efff] disabled:cursor-not-allowed disabled:opacity-50", extra);
}
