"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheckIcon,
  BookOpenIcon,
  BoxIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  Clock3Icon,
  Edit3Icon,
  EyeIcon,
  FileCheck2Icon,
  FileTextIcon,
  FilterIcon,
  GraduationCapIcon,
  PauseCircleIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  TriangleAlertIcon,
  UniversityIcon,
  UsersRoundIcon,
  XCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CommissionPackageAgreementDrawer } from "@/features/commissions/components/commission-package-agreement-drawer";
import { CommissionPackageDrawer } from "@/features/commissions/components/commission-package-drawer";
import {
  createCommissionTermVersionAction,
  reviewCommissionPackageAgreementAction,
  updateCommissionPackageStatusAction,
} from "@/features/commissions/package-actions";
import type {
  CommissionPackageAgreementRecord,
  CommissionPackageRecord,
  CommissionPackageRuleRecord,
  CommissionPackageWorkspaceData,
} from "@/features/commissions/package-types";
import { cn } from "@/lib/utils";

const successMessages: Record<string, string> = {
  "package-activated": "Komissiya paketi aktivləşdirildi.",
  "package-agreement-approved": "Agent müqaviləsi təsdiqləndi.",
  "package-agreement-rejected": "Agent müqaviləsinə imtina verildi.",
  "package-agreement-submitted": "Paket müqaviləsi təsdiqə göndərildi.",
  "package-created": "Komissiya paketi yaradıldı.",
  "package-paused": "Komissiya paketi deaktiv edildi.",
  "package-updated": "Komissiya paketi yeniləndi.",
  "term-created": "Yeni ümumi şərt versiyası yaradıldı.",
};

const errorMessages: Record<string, string> = {
  "agreement-agent-only": "Paket müqaviləsini yalnız agent göndərə bilər.",
  "agreement-review-stale": "Müqavilə artıq işlənib və ya tapılmadı.",
  "agreement-review-failed": "Müqavilə qərarı saxlanıla bilmədi.",
  "agreement-review-validation": "Müqavilə qərarını yoxlayın.",
  "package-agreement-coverage-conflict":
    "Bu agent, akademik il və universitet üçün artıq təsdiqlənmiş başqa paket var.",
  "package-agreement-duplicate":
    "Bu paket və akademik il üzrə artıq aktiv sorğu var.",
  "package-agreement-submit-failed": "Paket müqaviləsi göndərilə bilmədi.",
  "package-agreement-university-invalid":
    "Seçilən universitet paketə daxil deyil.",
  "package-agreement-validation":
    "Paket, akademik il, universitet və şərt razılığını yoxlayın.",
  "package-duplicate": "Eyni ad və akademik il üzrə paket mövcuddur.",
  "package-not-found": "Komissiya paketi tapılmadı.",
  "package-save-failed": "Komissiya paketi saxlanıla bilmədi.",
  "package-scholarship-program-invalid":
    "Burs üçün seçilən ixtisas aktiv deyil və ya paket universitetlərinə aid deyil.",
  "package-scholarship-program-level":
    "Seçilən ixtisas burs tərkibindəki təhsil pilləsinə uyğun deyil.",
  "package-status-failed": "Paketin statusu dəyişdirilə bilmədi.",
  "package-status-validation": "Paket statusu sorğusu düzgün deyil.",
  "package-terms-unavailable": "Aktiv ümumi şərt versiyası yoxdur.",
  "package-university-invalid": "Seçilən universitetlərdən biri aktiv deyil.",
  "package-validation": "Paket məlumatlarını və bütün qaydaları yoxlayın.",
  "term-save-failed": "Şərt versiyası saxlanıla bilmədi.",
  "term-validation": "Şərt başlığı, versiyası və mətnini yoxlayın.",
  "term-version-duplicate": "Bu versiya nömrəsi artıq mövcuddur.",
};

const tabs = [
  { id: "packages", label: "Paketlər" },
  { id: "agreements", label: "Müqavilələr" },
  { id: "terms", label: "Şərtlər" },
] as const;

type WorkspaceTab = (typeof tabs)[number]["id"];

export function CommissionPackageWorkspace({
  data,
  error,
  locale,
  success,
}: {
  data: CommissionPackageWorkspaceData;
  error: string;
  locale: string;
  success: string;
}) {
  const [tab, setTab] = useState<WorkspaceTab>("packages");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [packageDrawerOpen, setPackageDrawerOpen] = useState(false);
  const [agreementDrawerOpen, setAgreementDrawerOpen] = useState(false);
  const [editingPackage, setEditingPackage] =
    useState<CommissionPackageRecord | null>(null);
  const [viewingPackage, setViewingPackage] =
    useState<CommissionPackageRecord | null>(null);
  const isAgent = data.portalType === "agent";
  const normalizedQuery = normalize(query);

  const packages = useMemo(
    () =>
      data.packages.filter((item) => {
        const matchesQuery = normalize(
          `${item.name} ${item.description ?? ""} ${item.universities.map((university) => university.name).join(" ")}`,
        ).includes(normalizedQuery);
        const matchesStatus =
          statusFilter === "ALL" || item.status === statusFilter;
        const matchesYear =
          yearFilter === "ALL" || item.academicYear === yearFilter;
        return matchesQuery && matchesStatus && matchesYear;
      }),
    [data.packages, normalizedQuery, statusFilter, yearFilter],
  );

  const agreements = useMemo(
    () =>
      data.agreements.filter((item) =>
        normalize(
          `${item.code} ${item.agentName} ${item.packageName} ${item.academicYear} ${item.universities.map((university) => university.name).join(" ")}`,
        ).includes(normalizedQuery),
      ),
    [data.agreements, normalizedQuery],
  );

  function openCreatePackage() {
    setEditingPackage(null);
    setPackageDrawerOpen(true);
  }

  function openEditPackage(pkg: CommissionPackageRecord) {
    setEditingPackage(pkg);
    setPackageDrawerOpen(true);
  }

  return (
    <div className="min-h-full bg-[#f6f9ff] px-4 py-5 text-[#0b1f44] sm:px-5 lg:px-8 lg:py-7">
      <header className="flex flex-col justify-between gap-5 border-b border-[#dce5f0] pb-5 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-[2rem] font-bold tracking-[-0.035em] text-[#0b1f44] lg:text-[2.2rem]">
            {isAgent ? "Komissiya paketlərim" : "Komissiyalar"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#63749a]">
            {isAgent
              ? "Aktiv paketlər, göndərdiyiniz müqavilələr və qüvvədə olan ümumi şərtlər"
              : "Paketlər, agent müqavilələri və şərtlərin idarə edilməsi"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {isAgent ? (
            <Button
              className="h-10 rounded-xl bg-[#0b66ff] px-4 text-xs font-bold text-white shadow-[0_10px_24px_rgba(11,102,255,0.22)] hover:bg-[#0758dc]"
              onClick={() => setAgreementDrawerOpen(true)}
            >
              <SendIcon className="size-4" />
              Müqavilə göndər
            </Button>
          ) : data.canManage ? (
            <Button
              className="h-10 rounded-xl bg-[#0b66ff] px-4 text-xs font-bold text-white shadow-[0_10px_24px_rgba(11,102,255,0.22)] hover:bg-[#0758dc]"
              onClick={openCreatePackage}
            >
              <PlusIcon className="size-4" />
              Yeni paket
            </Button>
          ) : null}
        </div>
      </header>

      {data.availability !== "READY" ? (
        <div
          className={cn(
            "mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
            data.availability === "UNAVAILABLE"
              ? "border-[#ffd0d2] bg-[#fff2f3] text-[#9f2730]"
              : "border-[#c9daf5] bg-[#eef5ff] text-[#315b90]",
          )}
          role="status"
        >
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            {data.availability === "UNAVAILABLE"
              ? "Paket məlumat bazası hazırda əlçatan deyil. Yazma əməliyyatları dayandırılıb."
              : "Yeni paket axını demo məlumatlarla göstərilir. Schema tətbiq edilən kimi real məlumatlar avtomatik görünəcək."}
          </span>
        </div>
      ) : null}

      {success || error ? (
        <div
          className={cn(
            "mt-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold",
            error
              ? "border-[#ffd0d2] bg-[#fff2f3] text-[#b92b33]"
              : "border-[#c5ecd9] bg-[#edfbf4] text-[#05774d]",
          )}
          role="status"
        >
          {error ? (
            <TriangleAlertIcon className="size-4 shrink-0" />
          ) : (
            <CheckCircle2Icon className="size-4 shrink-0" />
          )}
          {error
            ? (errorMessages[error] ?? "Komissiya əməliyyatı tamamlanmadı.")
            : (successMessages[success] ?? "Komissiya məlumatları yeniləndi.")}
        </div>
      ) : null}

      <Tabs
        className="mt-2"
        onValueChange={(value) => setTab(value as WorkspaceTab)}
        value={tab}
      >
        <div className="-mx-4 overflow-x-auto border-b border-[#dfe7f1] px-4 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8">
          <TabsList className="h-14 min-w-max gap-8 p-0" variant="line">
            {tabs.map((item) => (
              <TabsTrigger
                className="h-14 flex-none px-1 text-sm font-semibold text-[#52678d] after:bottom-0 after:h-[2px] after:bg-[#0b66ff] data-active:text-[#0b66ff]"
                key={item.id}
                value={item.id}
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent className="mt-4 space-y-4" value="packages">
          <MetricsRail data={data} />
          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
            <Panel
              className="min-w-0"
              title="Komissiya paketləri"
              toolbar={
                <PackageFilters
                  academicYears={data.options.academicYears}
                  onQueryChange={setQuery}
                  onStatusChange={setStatusFilter}
                  onYearChange={setYearFilter}
                  query={query}
                  status={statusFilter}
                  year={yearFilter}
                />
              }
            >
              <PackageRegister
                canManage={data.canManage}
                locale={locale}
                onEdit={openEditPackage}
                onView={setViewingPackage}
                packages={packages}
              />
            </Panel>
            {!isAgent ? (
              <PendingRail
                agreements={data.agreements}
                onShowAgreements={() => setTab("agreements")}
                onShowTerms={() => setTab("terms")}
              />
            ) : null}
          </div>
        </TabsContent>

        <TabsContent className="mt-4" value="agreements">
          <Panel
            title={isAgent ? "Paket müqavilələrim" : "Agent müqavilələri"}
            toolbar={
              <SearchField
                onChange={setQuery}
                placeholder="Agent, paket və ya universitet..."
                value={query}
              />
            }
          >
            <AgreementRegister
              agreements={agreements}
              canManage={data.canManage}
              locale={locale}
            />
          </Panel>
        </TabsContent>

        <TabsContent className="mt-4" value="terms">
          <TermsWorkspace data={data} locale={locale} />
        </TabsContent>
      </Tabs>

      {data.canManage ? (
        <CommissionPackageDrawer
          data={data}
          editingPackage={editingPackage}
          key={`${packageDrawerOpen ? "open" : "closed"}:${editingPackage?.id ?? "new"}`}
          locale={locale}
          onOpenChange={setPackageDrawerOpen}
          open={packageDrawerOpen}
        />
      ) : null}
      {isAgent ? (
        <CommissionPackageAgreementDrawer
          data={data}
          key={agreementDrawerOpen ? "open" : "closed"}
          locale={locale}
          onOpenChange={setAgreementDrawerOpen}
          open={agreementDrawerOpen}
        />
      ) : null}
      <PackageDetailSheet
        onOpenChange={(open) => !open && setViewingPackage(null)}
        open={Boolean(viewingPackage)}
        packageRecord={viewingPackage}
      />
    </div>
  );
}

function MetricsRail({ data }: { data: CommissionPackageWorkspaceData }) {
  const metrics = [
    {
      icon: BoxIcon,
      label: "Paket sayı",
      tone: "blue",
      value: data.metrics.packages,
    },
    {
      icon: BadgeCheckIcon,
      label: "Aktiv paket",
      tone: "green",
      value: data.metrics.activePackages,
    },
    {
      icon: Clock3Icon,
      label: "Təsdiq gözləyən",
      tone: "amber",
      value: data.metrics.pendingAgreements,
    },
    {
      icon: FileCheck2Icon,
      label: "Müqavilə",
      tone: "blue",
      value: data.metrics.agreements,
    },
  ] as const;
  return (
    <div className="grid overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-[0_8px_28px_rgba(35,58,95,0.05)] grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            className="flex min-h-24 items-center gap-3 border-b border-r border-[#dfe7f1] px-4 py-4 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0 xl:border-b-0 xl:even:border-r xl:last:border-r-0"
            key={metric.label}
          >
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full",
                metric.tone === "green"
                  ? "bg-[#eaf8f0] text-[#14945c]"
                  : metric.tone === "amber"
                    ? "bg-[#fff4dc] text-[#e68b00]"
                    : "bg-[#eaf2ff] text-[#0b66ff]",
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-[#657697] sm:text-xs">
                {metric.label}
              </span>
              <span className="mt-1 block text-xl font-bold tabular-nums text-[#10264f]">
                {metric.value}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PackageFilters({
  academicYears,
  onQueryChange,
  onStatusChange,
  onYearChange,
  query,
  status,
  year,
}: {
  academicYears: string[];
  onQueryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onYearChange: (value: string) => void;
  query: string;
  status: string;
  year: string;
}) {
  return (
    <div className="grid w-full gap-2 sm:flex sm:w-auto sm:items-center">
      <SearchField
        onChange={onQueryChange}
        placeholder="Paket və ya universitet axtar"
        value={query}
      />
      <label className="relative">
        <FilterIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#6d82a4]" />
        <select
          aria-label="Status filtri"
          className={filterSelectClass}
          onChange={(event) => onStatusChange(event.target.value)}
          value={status}
        >
          <option value="ALL">Hamısı</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="DRAFT">Qaralama</option>
          <option value="INACTIVE">Deaktiv</option>
        </select>
      </label>
      <label className="relative">
        <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#6d82a4]" />
        <select
          aria-label="Akademik il filtri"
          className={filterSelectClass}
          onChange={(event) => onYearChange(event.target.value)}
          value={year}
        >
          <option value="ALL">Bütün illər</option>
          {academicYears.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function PackageRegister({
  canManage,
  locale,
  onEdit,
  onView,
  packages,
}: {
  canManage: boolean;
  locale: string;
  onEdit: (pkg: CommissionPackageRecord) => void;
  onView: (pkg: CommissionPackageRecord) => void;
  packages: CommissionPackageRecord[];
}) {
  if (!packages.length)
    return <EmptyState label="Komissiya paketi tapılmadı" />;
  return (
    <>
      <div className="hidden min-w-[840px] grid-cols-[1.55fr_.52fr_.65fr_.62fr_.5fr_.55fr_1.45fr_110px] gap-3 border-b border-[#e2e9f2] bg-[#fbfcfe] px-4 py-3 text-[10px] font-bold text-[#6c7e9d] md:grid">
        <span>Paket</span>
        <span>Status</span>
        <span>Akademik il</span>
        <span>Universitet</span>
        <span>Qayda</span>
        <span>Müqavilə</span>
        <span>Qayda xülasəsi</span>
        <span className="text-right">Əməliyyatlar</span>
      </div>
      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[840px]">
          {packages.map((pkg) => (
            <DesktopPackageRow
              canManage={canManage}
              key={pkg.id}
              locale={locale}
              onEdit={onEdit}
              onView={onView}
              packageRecord={pkg}
            />
          ))}
        </div>
      </div>
      <div className="divide-y divide-[#e4ebf3] md:hidden">
        {packages.map((pkg) => (
          <MobilePackageRow
            canManage={canManage}
            key={pkg.id}
            locale={locale}
            onEdit={onEdit}
            onView={onView}
            packageRecord={pkg}
          />
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-[#e3eaf3] px-4 py-3 text-[11px] text-[#6d7f9e]">
        <span>{packages.length} nəticə</span>
        <span>Səhifə 1 / 1</span>
      </div>
    </>
  );
}

function DesktopPackageRow({
  canManage,
  locale,
  onEdit,
  onView,
  packageRecord,
}: PackageRowProps) {
  return (
    <div className="grid min-h-32 grid-cols-[1.55fr_.52fr_.65fr_.62fr_.5fr_.55fr_1.45fr_110px] items-center gap-3 border-b border-[#e7edf4] px-4 py-4 text-xs last:border-b-0">
      <div className="min-w-0">
        <strong className="block truncate text-sm text-[#142c55]">
          {packageRecord.name}
        </strong>
        <span className="mt-1.5 line-clamp-2 block text-[11px] leading-4 text-[#6b7d9b]">
          {packageRecord.description ?? "Təsvir əlavə edilməyib"}
        </span>
      </div>
      <StatusBadge status={packageRecord.status} />
      <span className="text-[#53698d]">
        {packageRecord.academicYear ?? "—"}
      </span>
      <span className="font-bold tabular-nums text-[#203a63]">
        {packageRecord.universities.length}
        <small className="mt-0.5 block font-normal text-[#7788a5]">
          universitet
        </small>
      </span>
      <span className="font-bold tabular-nums text-[#203a63]">
        {packageRecord.rules.length}
        <small className="mt-0.5 block font-normal text-[#7788a5]">qayda</small>
      </span>
      <span className="font-bold tabular-nums text-[#203a63]">
        {packageRecord.agreementCount}
        <small className="mt-0.5 block font-normal text-[#7788a5]">
          müqavilə
        </small>
      </span>
      <RuleSummary packageRecord={packageRecord} />
      <PackageActions
        canManage={canManage}
        locale={locale}
        onEdit={onEdit}
        onView={onView}
        packageRecord={packageRecord}
      />
    </div>
  );
}

function MobilePackageRow(props: PackageRowProps) {
  const { packageRecord } = props;
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-6 text-[#142c55]">
            {packageRecord.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#71819d]">
            {packageRecord.description ?? "Təsvir əlavə edilməyib"}
          </p>
        </div>
        <StatusBadge status={packageRecord.status} />
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x divide-[#e1e8f1] rounded-xl border border-[#e0e8f1] bg-[#fbfdff] py-3 text-center">
        <MobileCount
          label="universitet"
          value={packageRecord.universities.length}
        />
        <MobileCount label="qayda" value={packageRecord.rules.length} />
        <MobileCount label="müqavilə" value={packageRecord.agreementCount} />
      </div>
      <div className="mt-4">
        <RuleSummary packageRecord={packageRecord} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#e6ecf3] pt-3">
        <span className="text-xs font-semibold text-[#697b9a]">
          {packageRecord.academicYear ?? "Bütün illər"}
        </span>
        <PackageActions {...props} />
      </div>
    </article>
  );
}

type PackageRowProps = {
  canManage: boolean;
  locale: string;
  onEdit: (pkg: CommissionPackageRecord) => void;
  onView: (pkg: CommissionPackageRecord) => void;
  packageRecord: CommissionPackageRecord;
};

function PackageActions({
  canManage,
  locale,
  onEdit,
  onView,
  packageRecord,
}: PackageRowProps) {
  return (
    <div className="flex justify-end gap-1.5">
      <IconButton label="Paketə bax" onClick={() => onView(packageRecord)}>
        <EyeIcon className="size-3.5" />
      </IconButton>
      {canManage ? (
        <>
          <IconButton
            label="Paketi redaktə et"
            onClick={() => onEdit(packageRecord)}
          >
            <Edit3Icon className="size-3.5" />
          </IconButton>
          <form action={updateCommissionPackageStatusAction}>
            <input name="locale" type="hidden" value={locale} />
            <input name="packageId" type="hidden" value={packageRecord.id} />
            <input
              name="status"
              type="hidden"
              value={packageRecord.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
            />
            <button
              aria-label={
                packageRecord.status === "ACTIVE"
                  ? "Paketi deaktiv et"
                  : "Paketi aktivləşdir"
              }
              className="flex size-8 items-center justify-center rounded-lg border border-[#d6e0ed] bg-white text-[#466084] hover:border-[#0b66ff] hover:text-[#0b66ff]"
              type="submit"
            >
              {packageRecord.status === "ACTIVE" ? (
                <PauseCircleIcon className="size-3.5" />
              ) : (
                <CheckCircle2Icon className="size-3.5" />
              )}
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}

function RuleSummary({
  packageRecord,
}: {
  packageRecord: CommissionPackageRecord;
}) {
  const bachelor = packageRecord.rules.find(
    (rule) => rule.educationLevel === "BACHELOR",
  );
  const master = packageRecord.rules.find(
    (rule) => rule.educationLevel === "MASTER",
  );
  const scholarship = packageRecord.scholarships[0];
  return (
    <ul className="space-y-1 text-[11px] leading-4 text-[#4e6387]">
      {bachelor ? <li>• Bakalavr: {formatRule(bachelor)}</li> : null}
      {master ? <li>• Magistr: {formatRule(master)}</li> : null}
      {scholarship ? (
        <li>
          • {educationLevelLabel(scholarship.educationLevel)} bursu:{" "}
          {formatScholarshipTrigger(scholarship)} →{" "}
          {formatScholarshipComposition(scholarship)}
        </li>
      ) : null}
      {packageRecord.mixedScholarship ? (
        <li>
          • Qarışıq burs: ilk {packageRecord.mixedScholarship.firstThreshold},
          sonra hər {packageRecord.mixedScholarship.additionalInterval} tələbə
        </li>
      ) : null}
    </ul>
  );
}

function PendingRail({
  agreements,
  onShowAgreements,
  onShowTerms,
}: {
  agreements: CommissionPackageAgreementRecord[];
  onShowAgreements: () => void;
  onShowTerms: () => void;
}) {
  const pending = agreements.filter((item) => item.status === "PENDING");
  return (
    <aside className="space-y-4">
      <Panel title="Təsdiq gözləyən müqavilələr">
        {pending.length ? (
          <div className="divide-y divide-[#e3eaf3]">
            {pending.slice(0, 3).map((item) => (
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f8fbff]"
                key={item.id}
                onClick={onShowAgreements}
                type="button"
              >
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs text-[#18335c]">
                    {item.agentName}
                  </strong>
                  <span className="mt-1 block truncate text-[10px] text-[#71829e]">
                    {item.packageName}
                  </span>
                </span>
                <span className="text-right text-[10px] text-[#65799a]">
                  <strong className="block text-xs text-[#203c67]">
                    {item.universities.length}
                  </strong>
                  universitet
                </span>
                <ChevronRightIcon className="size-4 text-[#0b66ff]" />
              </button>
            ))}
          </div>
        ) : (
          <EmptyState compact label="Təsdiq gözləyən müqavilə yoxdur" />
        )}
      </Panel>
      <Panel title="Sürətli keçidlər">
        <button
          className="flex w-full items-center gap-3 border-b border-[#e4ebf3] px-4 py-3 text-left text-xs font-semibold text-[#415a80] hover:bg-[#f8fbff] hover:text-[#0b66ff]"
          onClick={onShowAgreements}
          type="button"
        >
          <FileCheck2Icon className="size-4 text-[#0b66ff]" />
          Bütün müqavilələr
          <ChevronRightIcon className="ml-auto size-4" />
        </button>
        <button
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-xs font-semibold text-[#415a80] hover:bg-[#f8fbff] hover:text-[#0b66ff]"
          onClick={onShowTerms}
          type="button"
        >
          <BookOpenIcon className="size-4 text-[#0b66ff]" />
          Ümumi şərtlər
          <ChevronRightIcon className="ml-auto size-4" />
        </button>
      </Panel>
    </aside>
  );
}

function AgreementRegister({
  agreements,
  canManage,
  locale,
}: {
  agreements: CommissionPackageAgreementRecord[];
  canManage: boolean;
  locale: string;
}) {
  if (!agreements.length) return <EmptyState label="Müqavilə tapılmadı" />;
  return (
    <div>
      <div className="grid gap-3 p-3 md:hidden">
        {agreements.map((agreement) => (
          <article className="rounded-xl border border-[#e5ecf3] bg-white p-4 text-xs" key={agreement.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <strong className="block text-[#18335c]">{agreement.agentName}</strong>
                <span className="text-[10px] text-[#71829e]">{agreement.code}</span>
              </div>
              <AgreementStatusBadge status={agreement.status} />
            </div>
            <p className="mt-3 font-semibold text-[#334d75]">{agreement.packageName}</p>
            <p className="mt-1 text-[#5f7292]">{agreement.academicYear} · {agreement.universities.map((item) => item.name).join(", ")}</p>
            <p className="mt-1 text-[#5f7292]">Göndərilib: {formatDate(agreement.submittedAt)} · Burs: {agreement.earnedScholarships}</p>
            {canManage && agreement.status === "PENDING" ? (
              <div className="mt-3 grid gap-2 border-t border-[#e5ecf3] pt-3">
                <form action={reviewCommissionPackageAgreementAction}>
                  <input name="locale" type="hidden" value={locale} />
                  <input name="agreementId" type="hidden" value={agreement.id} />
                  <input name="status" type="hidden" value="APPROVED" />
                  <Button className="h-9 w-full bg-[#eaf8f0] text-[#0c8751] hover:bg-[#daf2e5]" type="submit">Təsdiqlə</Button>
                </form>
                <form action={reviewCommissionPackageAgreementAction} className="flex gap-2">
                  <input name="locale" type="hidden" value={locale} />
                  <input name="agreementId" type="hidden" value={agreement.id} />
                  <input name="status" type="hidden" value="REJECTED" />
                  <input className="h-9 min-w-0 flex-1 rounded-lg border border-[#d7e1ee] px-2" minLength={3} name="rejectionReason" placeholder="İmtina səbəbi" required />
                  <Button className="h-9" type="submit" variant="outline">İmtina et</Button>
                </form>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[940px] border-collapse text-left text-xs">
        <thead className="bg-[#fbfcfe] text-[10px] font-bold text-[#6c7e9d]">
          <tr>
            <th className="px-4 py-3">Kod / Agent</th>
            <th className="px-4 py-3">Paket</th>
            <th className="px-4 py-3">Akademik il</th>
            <th className="px-4 py-3">Universitetlər</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Qazanılmış burs</th>
            <th className="px-4 py-3">Göndərilib</th>
            {canManage ? <th className="px-4 py-3">Qərar</th> : null}
          </tr>
        </thead>
        <tbody>
          {agreements.map((agreement) => (
            <tr
              className="border-t border-[#e5ecf3] align-top"
              key={agreement.id}
            >
              <td className="px-4 py-4">
                <strong className="block text-[#18335c]">
                  {agreement.agentName}
                </strong>
                <span className="mt-1 block text-[10px] text-[#71829e]">
                  {agreement.code}
                </span>
              </td>
              <td className="px-4 py-4 font-semibold text-[#334d75]">
                {agreement.packageName}
              </td>
              <td className="px-4 py-4 text-[#5f7292]">
                {agreement.academicYear}
              </td>
              <td className="px-4 py-4 text-[#5f7292]">
                <strong className="text-[#203a63]">
                  {agreement.universities.length}
                </strong>{" "}
                universitet
                <span className="mt-1 block max-w-48 truncate text-[10px] text-[#8090aa]">
                  {agreement.universities.map((item) => item.name).join(", ")}
                </span>
              </td>
              <td className="px-4 py-4">
                <AgreementStatusBadge status={agreement.status} />
              </td>
              <td className="px-4 py-4 font-bold tabular-nums text-[#0b66ff]">
                {agreement.earnedScholarships}
              </td>
              <td className="px-4 py-4 text-[#5f7292]">
                {formatDate(agreement.submittedAt)}
              </td>
              {canManage ? (
                <td className="px-4 py-4">
                  {agreement.status === "PENDING" ? (
                    <div className="flex min-w-60 flex-col gap-2">
                      <form action={reviewCommissionPackageAgreementAction}>
                        <input name="locale" type="hidden" value={locale} />
                        <input
                          name="agreementId"
                          type="hidden"
                          value={agreement.id}
                        />
                        <input name="status" type="hidden" value="APPROVED" />
                        <Button
                          className="h-8 w-full rounded-lg bg-[#eaf8f0] text-[11px] font-bold text-[#0c8751] hover:bg-[#daf2e5]"
                          type="submit"
                        >
                          <CheckCircle2Icon className="size-3.5" /> Təsdiqlə
                        </Button>
                      </form>
                      <form
                        action={reviewCommissionPackageAgreementAction}
                        className="flex gap-1.5"
                      >
                        <input name="locale" type="hidden" value={locale} />
                        <input
                          name="agreementId"
                          type="hidden"
                          value={agreement.id}
                        />
                        <input name="status" type="hidden" value="REJECTED" />
                        <input
                          className="h-8 min-w-0 flex-1 rounded-lg border border-[#d7e1ee] px-2 text-[10px] outline-none focus:border-[#e44853]"
                          minLength={3}
                          name="rejectionReason"
                          placeholder="İmtina səbəbi"
                          required
                        />
                        <Button
                          aria-label="Müqaviləyə imtina ver"
                          className="size-8 rounded-lg border-[#f0c9cc] text-[#d83f4a] hover:bg-[#fff2f3]"
                          size="icon"
                          type="submit"
                          variant="outline"
                        >
                          <XCircleIcon className="size-3.5" />
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#7a8ca7]">
                      Qərar verilib
                    </span>
                  )}
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

function TermsWorkspace({
  data,
  locale,
}: {
  data: CommissionPackageWorkspaceData;
  locale: string;
}) {
  const activeTerm = data.terms.find((term) => term.isActive);
  const nextVersion = recommendNextVersion(
    data.terms.map((term) => term.version),
  );
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[.9fr_1.1fr]">
      {data.canManage ? (
        <Panel title="Yeni şərt versiyası yarat">
          <form
            action={createCommissionTermVersionAction}
            className="space-y-4 p-4 sm:p-5"
          >
            <input name="locale" type="hidden" value={locale} />
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <label className="space-y-1.5">
                <span className={fieldLabelClass}>Başlıq</span>
                <input
                  className={textInputClass}
                  defaultValue="Agent müqaviləsinin ümumi şərtləri"
                  maxLength={160}
                  name="title"
                  required
                />
              </label>
              <label className="space-y-1.5">
                <span className={fieldLabelClass}>Versiya</span>
                <input
                  className={textInputClass}
                  defaultValue={nextVersion}
                  name="version"
                  pattern="\d+\.\d+"
                  required
                />
              </label>
            </div>
            <label className="space-y-1.5">
              <span className={fieldLabelClass}>Şərtlər mətni</span>
              <Textarea
                className="min-h-72 rounded-xl border-[#d7e1ee] text-xs leading-5"
                defaultValue={activeTerm?.content ?? defaultTermsText}
                maxLength={50_000}
                name="content"
                required
              />
            </label>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#425b80]">
                <input
                  className="size-4 accent-[#0b66ff]"
                  defaultChecked
                  name="isActive"
                  type="checkbox"
                />
                Aktiv versiya et
              </label>
              <Button
                className="h-10 rounded-xl bg-[#0b66ff] px-5 text-xs font-bold text-white hover:bg-[#0758dc]"
                disabled={data.availability === "UNAVAILABLE"}
                type="submit"
              >
                <PlusIcon className="size-4" />
                Versiyanı saxla
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}
      <Panel title="Şərt versiyaları">
        {data.terms.length ? (
          <div className="divide-y divide-[#e3eaf3]">
            {data.terms.map((term) => (
              <article className="p-4 sm:p-5" key={term.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[#17325b]">
                        {term.title}
                      </h3>
                      {term.isActive ? (
                        <span className="rounded-full border border-[#bfe7d1] bg-[#eaf8f0] px-2 py-0.5 text-[10px] font-bold text-[#0c8751]">
                          Aktiv
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[10px] text-[#7687a2]">
                      v{term.version} · {formatDate(term.createdAt)}
                    </p>
                  </div>
                  <FileTextIcon className="size-5 text-[#0b66ff]" />
                </div>
                <p className="mt-4 max-h-48 overflow-y-auto whitespace-pre-line rounded-xl bg-[#f8fbff] p-4 text-[11px] leading-5 text-[#5d7193]">
                  {term.content}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState label="Şərt versiyası yaradılmayıb" />
        )}
      </Panel>
    </div>
  );
}

function PackageDetailSheet({
  onOpenChange,
  open,
  packageRecord,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  packageRecord: CommissionPackageRecord | null;
}) {
  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="gap-0 overflow-y-auto border-[#d4dfed] bg-white p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[620px]"
        side="right"
      >
        {packageRecord ? (
          <>
            <SheetHeader className="border-b border-[#e0e7f1] px-5 py-5 pr-14 sm:px-6">
              <SheetTitle className="text-xl font-bold text-[#0b1f44]">
                {packageRecord.name}
              </SheetTitle>
              <SheetDescription className="mt-1 text-xs leading-5 text-[#68799b]">
                {packageRecord.description ?? "Paket təsviri əlavə edilməyib."}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-5 py-5 sm:px-6">
              <div className="grid grid-cols-3 divide-x divide-[#e2e9f2] rounded-xl border border-[#dbe4ef] bg-[#fbfdff] py-4 text-center">
                <MobileCount
                  label="universitet"
                  value={packageRecord.universities.length}
                />
                <MobileCount label="qayda" value={packageRecord.rules.length} />
                <MobileCount
                  label="müqavilə"
                  value={packageRecord.agreementCount}
                />
              </div>
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#17325b]">
                  <UniversityIcon className="size-4 text-[#0b66ff]" />
                  Universitetlər
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {packageRecord.universities.map((university) => (
                    <div
                      className="rounded-lg border border-[#dfe7f1] bg-white px-3 py-2 text-xs text-[#40597f]"
                      key={university.id}
                    >
                      {university.name}
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#17325b]">
                  <GraduationCapIcon className="size-4 text-[#0b66ff]" />
                  Komissiya qaydaları
                </h3>
                <div className="overflow-hidden rounded-xl border border-[#dbe4ef]">
                  {packageRecord.rules.map((rule) => (
                    <div
                      className="grid grid-cols-[1fr_1.2fr] border-b border-[#e6edf4] px-3 py-3 text-xs last:border-b-0"
                      key={rule.id}
                    >
                      <strong className="text-[#203b66]">
                        {educationLevelLabel(rule.educationLevel)}
                      </strong>
                      <span className="text-[#5c7193]">
                        {ruleTypeLabel(rule.commissionType)} ·{" "}
                        {formatRule(rule)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
              {packageRecord.scholarships.length ||
              packageRecord.mixedScholarship ? (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#17325b]">
                    <UsersRoundIcon className="size-4 text-[#0b66ff]" />
                    Təqaüd şərtləri
                  </h3>
                  <div className="space-y-2">
                    {packageRecord.scholarships.map((item) => (
                      <div
                        className="rounded-xl border border-[#dbe4ef] bg-[#f8fbff] px-4 py-3 text-xs text-[#526789]"
                        key={item.id}
                      >
                        <strong className="text-[#203b66]">
                          {educationLevelLabel(item.educationLevel)}:
                        </strong>{" "}
                        {formatScholarshipTrigger(item)}
                        <span className="mt-1.5 block font-semibold text-[#0b61e8]">
                          {formatScholarshipComposition(item)}
                        </span>
                        <span className="mt-1 block text-[10px] text-[#7183a0]">
                          {item.awards
                            .map((award) =>
                              award.allPrograms
                                ? `${educationLevelLabel(award.educationLevel)}: bütün ixtisaslar`
                                : `${educationLevelLabel(award.educationLevel)}: ${award.programs.length} ixtisas`,
                            )
                            .join(" · ")}
                        </span>
                      </div>
                    ))}
                    {packageRecord.mixedScholarship ? (
                      <div className="rounded-xl border border-[#b9d3f7] bg-[#f3f8ff] px-4 py-3 text-xs text-[#526789]">
                        <strong className="text-[#203b66]">
                          Qarışıq pilləli burs:
                        </strong>{" "}
                        İlk {packageRecord.mixedScholarship.firstThreshold}{" "}
                        tələbədə 1 burs, sonra hər{" "}
                        {packageRecord.mixedScholarship.additionalInterval}{" "}
                        əlavə tələbəyə 1 burs
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function formatScholarshipComposition(
  scholarship: CommissionPackageRecord["scholarships"][number],
) {
  return scholarship.awards
    .map(
      (award) =>
        `${award.quantity} ${educationLevelLabel(award.educationLevel).toLocaleLowerCase("az-AZ")}`,
    )
    .join(" + ");
}

function formatScholarshipTrigger(
  scholarship: CommissionPackageRecord["scholarships"][number],
) {
  return scholarship.triggerType === "FIRST_THEN_EVERY"
    ? `ilk ${scholarship.studentThreshold} tələbədə ${scholarship.scholarshipCount} paket, sonra hər ${scholarship.additionalInterval ?? "—"} əlavə tələbəyə eyni paket`
    : `hər ${scholarship.studentThreshold} tələbədən ${scholarship.scholarshipCount} burs paketi`;
}

function Panel({
  children,
  className,
  title,
  toolbar,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
  toolbar?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-[0_8px_28px_rgba(35,58,95,0.04)]",
        className,
      )}
    >
      <div className="flex min-h-14 flex-col justify-between gap-3 border-b border-[#e1e8f1] px-4 py-3 sm:flex-row sm:items-center sm:px-5">
        <h2 className="shrink-0 text-base font-bold text-[#122951]">{title}</h2>
        {toolbar}
      </div>
      {children}
    </section>
  );
}

function SearchField({
  onChange,
  placeholder,
  value,
}: {
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="relative block min-w-0 flex-1 sm:w-56 sm:flex-none">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#7890b1]" />
      <input
        className="h-9 w-full rounded-xl border border-[#d6e0ed] bg-white pl-9 pr-3 text-xs text-[#243d68] outline-none placeholder:text-[#8c9bb4] focus:border-[#0b66ff] focus:ring-3 focus:ring-[#0b66ff]/10"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </label>
  );
}

function StatusBadge({
  status,
}: {
  status: CommissionPackageRecord["status"];
}) {
  const label =
    status === "ACTIVE" ? "Aktiv" : status === "DRAFT" ? "Qaralama" : "Deaktiv";
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-2 py-1 text-[10px] font-bold",
        status === "ACTIVE"
          ? "border-[#bfe7d1] bg-[#eaf8f0] text-[#0c8751]"
          : status === "DRAFT"
            ? "border-[#f0d9a8] bg-[#fff7e6] text-[#9a6500]"
            : "border-[#d8e0ea] bg-[#f5f7fa] text-[#667792]",
      )}
    >
      {label}
    </span>
  );
}

function AgreementStatusBadge({
  status,
}: {
  status: CommissionPackageAgreementRecord["status"];
}) {
  const label =
    status === "APPROVED"
      ? "Təsdiqlənib"
      : status === "REJECTED"
        ? "İmtina"
        : "Gözləyir";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-1 text-[10px] font-bold",
        status === "APPROVED"
          ? "border-[#bfe7d1] bg-[#eaf8f0] text-[#0c8751]"
          : status === "REJECTED"
            ? "border-[#f0c4c8] bg-[#fff1f2] text-[#c33843]"
            : "border-[#f1d7a2] bg-[#fff6e4] text-[#a66b00]",
      )}
    >
      {label}
    </span>
  );
}

function MobileCount({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <strong className="block text-base tabular-nums text-[#17345f]">
        {value}
      </strong>
      <small className="mt-1 block text-[10px] text-[#71829f]">{label}</small>
    </span>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-lg border border-[#d6e0ed] bg-white text-[#466084] hover:border-[#0b66ff] hover:text-[#0b66ff]"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function EmptyState({
  compact = false,
  label,
}: {
  compact?: boolean;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-5 text-center text-[#7485a1]",
        compact ? "py-8" : "py-16",
      )}
    >
      <BoxIcon className="mb-3 size-7 text-[#a7b6ca]" />
      <p className="text-xs font-semibold">{label}</p>
    </div>
  );
}

function formatRule(rule: CommissionPackageRuleRecord) {
  if (rule.commissionType === "FIXED") {
    return `${rule.currency} ${formatNumber(rule.fixedAmount ?? 0)}`;
  }
  return `${formatNumber(rule.rateTier1 ?? 0)}%-dək / ${formatNumber(rule.rateTier2 ?? 0)}%`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("az-AZ", { maximumFractionDigits: 2 }).format(
    value,
  );
}

function ruleTypeLabel(type: CommissionPackageRuleRecord["commissionType"]) {
  return type === "FIXED"
    ? "Sabit məbləğ"
    : type === "PERCENTAGE_CASH"
      ? "Nağd faiz"
      : "Gecikmiş faiz";
}

function educationLevelLabel(
  level: CommissionPackageRuleRecord["educationLevel"],
) {
  return {
    ASSOCIATE: "Önlisans",
    BACHELOR: "Bakalavr",
    MASTER: "Magistr",
    PHD: "Doktorantura",
    FOUNDATION: "Hazırlıq",
    LANGUAGE: "Dil kursu",
  }[level];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function recommendNextVersion(versions: string[]) {
  const latest = versions
    .map((version) => version.split(".").map(Number))
    .filter(
      ([major, minor]) => Number.isFinite(major) && Number.isFinite(minor),
    )
    .sort((a, b) => (b[0] ?? 0) - (a[0] ?? 0) || (b[1] ?? 0) - (a[1] ?? 0))[0];
  return latest ? `${latest[0]}.${(latest[1] ?? 0) + 1}` : "1.0";
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("az-AZ");
}

const filterSelectClass =
  "h-9 w-full appearance-none rounded-xl border border-[#d6e0ed] bg-white pl-9 pr-8 text-xs font-semibold text-[#40587e] outline-none focus:border-[#0b66ff] sm:w-auto";
const fieldLabelClass = "block text-[11px] font-semibold text-[#52698e]";
const textInputClass =
  "h-10 w-full rounded-xl border border-[#d7e1ee] bg-white px-3 text-xs text-[#253d67] outline-none focus:border-[#0b66ff] focus:ring-3 focus:ring-[#0b66ff]/10";

const defaultTermsText = `1. TƏRƏFLƏR
Bu müqavilə Campus Global (bundan sonra “Şirkət”) və Agent arasında bağlanır.

2. MÜQAVİLƏNİN PREDMETİ
Agent, Şirkətin paketdə göstərdiyi universitetlərə tələbə cəlb etmə xidmətləri göstərir.

3. KOMİSSİYA ÖDƏNİŞLƏRİ
Komissiya paketdə göstərilən təhsil səviyyəsi, komissiya növü və tələbə həddinə uyğun hesablanır.

4. TƏQAÜD ŞƏRTLƏRİ
Təqaüd sayı paketdə göstərilən nisbətə uyğun hesablanır.

5. MÜQAVİLƏNİN MÜDDƏTİ
Müqavilə seçilmiş akademik il üçün etibarlıdır.`;
