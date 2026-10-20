"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgePercentIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  Clock3Icon,
  DownloadIcon,
  FileCheck2Icon,
  LandmarkIcon,
  PlusIcon,
  ReceiptTextIcon,
  SearchIcon,
  TriangleAlertIcon,
  UserRoundCheckIcon,
  WalletCardsIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CommissionAgreementDrawer,
  CommissionPaymentDrawer,
} from "@/features/commissions/components/commission-drawers";
import {
  AgreementsRegister,
  AuditRegister,
  CalculationsRegister,
  CoverageRegister,
  formatMoney,
  PaymentsRegister,
} from "@/features/commissions/components/commission-registers";
import { UniversityCommissionAgreements } from "@/features/commissions/components/university-commission-agreements";
import {
  COMMISSION_TABS,
  type CommissionTab,
} from "@/features/commissions/constants";
import type { CommissionWorkspaceData } from "@/features/commissions/types";
import { cn } from "@/lib/utils";

const successMessages: Record<string, string> = {
  "university-agreement-created":
    "Universitetin ümumi komissiya müqaviləsi aktivləşdirildi.",
  "university-agreement-suspended": "Universitet müqaviləsi dayandırıldı.",
  "agreement-activated": "Komissiya müqaviləsi aktivləşdirildi.",
  "agreement-archived": "Komissiya müqaviləsi arxivləndi.",
  "agreement-drafted": "Komissiya müqaviləsi qaralama kimi saxlanıldı.",
  "agreement-suspended": "Komissiya müqaviləsi dayandırıldı.",
  "calculation-approved":
    "Hesablama təsdiqləndi, uyğun maliyyə öhdəlikləri yaradıldı.",
  "payment-calculated":
    "Ödəniş POSTED kimi qeydə alındı və komissiya payları hesablandı.",
};

const errorMessages: Record<string, string> = {
  "university-agreement-validation":
    "Universitet müqaviləsinin məbləğini, tarixini və əhatəsini yoxlayın.",
  "university-agreement-create-failed":
    "Universitet müqaviləsi yaradıla bilmədi.",
  "university-agreement-overlap":
    "Bu universitet, proqram və valyuta üçün tarixləri üst-üstə düşən aktiv müqavilə var.",
  "university-agreement-conflict":
    "Bu ödənişə bir neçə universitet müqaviləsi uyğun gəlir.",
  "university-agreement-not-found":
    "Bu ödəniş üçün aktiv universitet komissiya müqaviləsi yoxdur.",
  "university-commission-below-agent":
    "Universitetin ümumi komissiyası agent payından az ola bilməz.",
  "agent-not-found": "Seçilmiş agent aktiv deyil və ya tapılmadı.",
  "agreement-create-failed": "Müqavilə yaradıla bilmədi.",
  "agreement-file-invalid":
    "Müqavilə sənədi PDF/DOCX və maksimum 10 MB olmalıdır.",
  "agreement-not-found":
    "Bu ödəniş üçün uyğun təsdiqlənmiş komissiya paketi və ya aktiv köhnə müqavilə tapılmadı.",
  "agreement-overlap":
    "Eyni agent, universitet və əhatə üçün tarixləri üst-üstə düşən aktiv müqavilə mövcuddur.",
  "agreement-validation":
    "Müqavilə sahələrini və komissiya paylarını yoxlayın.",
  "agreement-expired": "Müddəti bitmiş müqavilə aktivləşdirilə bilməz.",
  "agreement-status-failed": "Müqavilənin statusu dəyişdirilə bilmədi.",
  "agreement-status-transition": "Bu status keçidinə icazə verilmir.",
  "agreement-status-validation": "Müqavilə statusu sorğusu düzgün deyil.",
  "application-agent-missing": "Müraciət heç bir agentə bağlı deyil.",
  "application-not-eligible":
    "Yalnız qəbul edilmiş və ya qeydiyyatdan keçmiş müraciət üzrə ödəniş hesablana bilər.",
  "approval-failed": "Hesablama maliyyəyə ötürülə bilmədi.",
  "calculation-not-approvable": "Bu hesablama artıq işlənib və ya ləğv edilib.",
  "commission-exceeds-payment": "Ümumi komissiya ödəniş məbləğini keçə bilməz.",
  "commission-rounds-to-zero": "Bu ödəniş üzrə komissiya qəpiyə yuvarlaqlandıqda sıfır olur.",
  "education-level-unsupported":
    "Müraciətin təhsil səviyyəsi komissiya paketində tanınmır.",
  "first-payment-already-calculated":
    "Bu müqavilə yalnız ilk ödənişə tətbiq olunur və artıq hesablanıb.",
  "payment-create-failed": "Ödəniş və komissiya hesablaması yaradıla bilmədi.",
  "payment-reference-duplicate":
    "Bu müraciət üzrə həmin ödəniş referansı artıq qeydə alınıb.",
  "payment-file-invalid":
    "Ödəniş sübutu PDF/JPG/PNG/WEBP və maksimum 10 MB olmalıdır.",
  "payment-validation":
    "Ödəniş məbləği, tarix və valyuta məlumatlarını yoxlayın.",
  "program-not-found": "Seçilmiş proqram bu universitetə aid deyil.",
  "package-agreement-conflict":
    "Bu agent və universitet üçün birdən çox təsdiqlənmiş paket tapıldı.",
  "package-currency-mismatch":
    "Ödəniş valyutası paket qaydasının valyutası ilə uyğun deyil.",
  "package-rule-not-found":
    "Müraciətin təhsil səviyyəsi üçün aktiv paket qaydası yoxdur.",
  "package-student-order-invalid":
    "Paket üzrə tələbə sırası hesablana bilmədi.",
  "university-not-found": "Seçilmiş universitet aktiv deyil və ya tapılmadı.",
};

export function CommissionWorkspace({
  data,
  defaultDate,
  error,
  locale,
  success,
}: {
  data: CommissionWorkspaceData;
  defaultDate: string;
  error: string;
  locale: string;
  success: string;
}) {
  const [tab, setTab] = useState<CommissionTab>("overview");
  const [query, setQuery] = useState("");
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const isAgent = data.portalType === "agent";
  const mutationsEnabled = data.availability === "READY";
  const normalizedQuery = normalize(query);
  const agreements = useMemo(
    () =>
      data.agreements.filter((item) =>
        normalize(
          `${item.code} ${item.agentName} ${item.universityName} ${item.scopeLabel}`,
        ).includes(normalizedQuery),
      ),
    [data.agreements, normalizedQuery],
  );
  const calculations = useMemo(
    () =>
      data.calculations.filter((item) =>
        normalize(
          `${item.code} ${item.studentName} ${item.applicationCode} ${item.agentName} ${item.universityName}`,
        ).includes(normalizedQuery),
      ),
    [data.calculations, normalizedQuery],
  );
  const payments = useMemo(
    () =>
      data.payments.filter((item) =>
        normalize(
          `${item.code} ${item.studentName} ${item.applicationCode} ${item.universityName} ${item.reference}`,
        ).includes(normalizedQuery),
      ),
    [data.payments, normalizedQuery],
  );
  function exportReport() {
    const headers = [
      "Kod",
      "Tələbə",
      "Müraciət",
      "Universitet",
      "Ödənilən məbləğ",
      "Campus Global payı",
      "Agent payı",
      "Valyuta",
      "Status",
    ];
    const rows = calculations.map((item) => [
      item.code,
      item.studentName,
      item.applicationCode,
      item.universityName,
      item.basisAmount,
      item.campusAmount,
      item.agentAmount,
      item.currency,
      item.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `campus-global-commissions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-full bg-[#f6f9ff] px-4 py-5 text-[#0b1f44] sm:px-5 lg:px-8 lg:py-7">
      <header className="flex flex-col justify-between gap-5 border-b border-[#dce5f0] pb-5 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-[2rem] font-bold tracking-[-0.035em] text-[#0b1f44] lg:text-[2.2rem]">
            {isAgent ? "Komissiyalarım" : "Komissiyalar"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#63749a]">
            {isAgent
              ? "Aktiv müqavilələriniz, hesablanmış qazancınız və ödəniş vəziyyətiniz"
              : "Universitet müqavilələri, agent payları və ödənişə bağlı qazancın idarə edilməsi"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            className="h-10 rounded-xl border-[#d8e2ee] bg-white px-3 text-xs font-semibold text-[#31476f] hover:bg-[#f8fbff]"
            onClick={exportReport}
            variant="outline"
          >
            <DownloadIcon className="size-4" />
            Hesabatı ixrac et
          </Button>
          {data.canManage ? (
            <>
              <Button
                className="h-10 rounded-xl border-[#bdd3f5] bg-white px-4 text-xs font-bold text-[#0b61e8] hover:bg-[#f1f7ff]"
                disabled={!mutationsEnabled}
                onClick={() => setPaymentOpen(true)}
                variant="outline"
              >
                <ReceiptTextIcon className="size-4" />
                Ödəniş qeydə al
              </Button>
              <Button
                className="h-10 rounded-xl bg-[#0b66ff] px-4 text-xs font-bold text-white shadow-[0_10px_24px_rgba(11,102,255,0.22)] hover:bg-[#0758dc]"
                disabled={!mutationsEnabled}
                onClick={() => setAgreementOpen(true)}
              >
                <PlusIcon className="size-4" />
                Yeni müqavilə
              </Button>
            </>
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
              ? "Komissiya məlumat bazası hazırda əlçatan deyil. Məlumat itkisini önləmək üçün yazma əməliyyatları dayandırılıb."
              : "Bu, demo məlumatlarla önizləmə rejimidir. Yazma əməliyyatları deaktivdir."}
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
        onValueChange={(value) => setTab(value as CommissionTab)}
        value={tab}
      >
        <div className="-mx-4 overflow-x-auto border-b border-[#dfe7f1] px-4 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8">
          <TabsList className="h-14 min-w-max gap-8 p-0" variant="line">
            {COMMISSION_TABS.filter(
              (item) => !isAgent || item.id !== "audit",
            ).map((item) => (
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

        <TabsContent className="mt-4 space-y-4" value="overview">
          <div className="grid overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-[0_8px_28px_rgba(35,58,95,0.05)] sm:grid-cols-2 xl:grid-cols-4">
            {isAgent ? (
              <>
                <Metric
                  icon={FileCheck2Icon}
                  label="Aktiv müqavilələr"
                  tone="blue"
                  value={String(data.metrics.activeAgreements)}
                />
                <Metric
                  icon={CircleDollarSignIcon}
                  label="Qazanılmış komissiya"
                  tone="green"
                  value={formatMoney(data.metrics.agentEarnedBase)}
                />
                <Metric
                  icon={Clock3Icon}
                  label="Ödənişə hazır"
                  tone="amber"
                  value={formatMoney(data.metrics.agentLiabilityBase)}
                />
                <Metric
                  icon={WalletCardsIcon}
                  label="Ödənilib"
                  tone="violet"
                  value={formatMoney(data.metrics.paidToAgentsBase)}
                />
              </>
            ) : (
              <>
                <Metric
                  icon={FileCheck2Icon}
                  label="Aktiv müqavilələr"
                  tone="blue"
                  value={String(data.metrics.activeAgreements)}
                />
                <Metric
                  icon={CircleDollarSignIcon}
                  label="Qazanılmış komissiya"
                  tone="green"
                  value={formatMoney(data.metrics.companyEarnedBase)}
                />
                <Metric
                  icon={UserRoundCheckIcon}
                  label="Agent öhdəliyi"
                  tone="amber"
                  value={formatMoney(data.metrics.agentLiabilityBase)}
                />
                <Metric
                  icon={Clock3Icon}
                  label="Təsdiq gözləyən"
                  tone="red"
                  value={String(data.metrics.pendingApproval)}
                />
              </>
            )}
          </div>

          {!isAgent ? <CommissionProcessRail /> : null}
          {!isAgent ? (
            <UniversityCommissionAgreements
              data={data}
              defaultDate={defaultDate}
              locale={locale}
            />
          ) : null}

          {data.metrics.activePackageAgreements > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dbe4ef] bg-white p-4 text-sm text-[#52678d]">
              <span>
                {data.metrics.activePackageAgreements} təsdiqlənmiş aktiv paket
                müqaviləsi
              </span>
              <Link
                className="font-bold text-[#0b61e8] hover:underline"
                href="/commissions"
              >
                Paket müqavilələrinə bax
              </Link>
            </div>
          ) : null}

          <Panel
            action={
              <button
                className="text-xs font-bold text-[#0b61e8] hover:underline"
                onClick={() => setTab("agreements")}
                type="button"
              >
                Hamısına bax
              </button>
            }
            title="Əvvəlki tip aktiv müqavilələr"
            toolbar={
              <SearchField
                onChange={setQuery}
                placeholder="Agent və ya universitet..."
                value={query}
              />
            }
          >
            <AgreementsRegister
              agreements={agreements
                .filter((item) => item.status === "ACTIVE")
                .slice(0, 5)}
              canManage={data.canManage}
              locale={locale}
              mutationsEnabled={mutationsEnabled}
              showCampusShare={!isAgent}
            />
          </Panel>

          <div className="grid gap-4 xl:grid-cols-[.82fr_1.18fr]">
            <Panel
              action={
                <button
                  className="text-xs font-bold text-[#0b61e8] hover:underline"
                  onClick={() => setTab("agreements")}
                  type="button"
                >
                  Tam hesabatı aç
                </button>
              }
              title={isAgent ? "Müqavilə əhatəm" : "Müqavilə əhatəsi"}
            >
              <div className="grid grid-cols-[1.3fr_.8fr_.7fr] border-b border-[#e1e8f1] bg-[#fbfcfe] px-5 py-3 text-[10px] font-semibold text-[#66799a]">
                <span>Universitet</span>
                <span className="hidden sm:block">Agent</span>
                <span className="text-right">Agent payı</span>
              </div>
              <CoverageRegister agreements={agreements} />
            </Panel>
            <Panel
              action={
                <button
                  className="text-xs font-bold text-[#0b61e8] hover:underline"
                  onClick={() => setTab("calculations")}
                  type="button"
                >
                  Hamısına bax
                </button>
              }
              title="Son hesablamalar"
            >
              <CalculationsRegister
                calculations={calculations.slice(0, 5)}
                canApprove={data.canApprove}
                compact
                locale={locale}
                mutationsEnabled={mutationsEnabled}
                showAgent={false}
                showCampusShare={!isAgent}
              />
            </Panel>
          </div>
        </TabsContent>

        <TabsContent className="mt-4" value="agreements">
          <Panel
            title={
              isAgent ? "Komissiya müqavilələrim" : "Komissiya müqavilələri"
            }
            toolbar={
              <SearchField
                onChange={setQuery}
                placeholder="Müqavilələrdə axtar..."
                value={query}
              />
            }
          >
            <AgreementsRegister
              agreements={agreements}
              canManage={data.canManage}
              locale={locale}
              mutationsEnabled={mutationsEnabled}
              showCampusShare={!isAgent}
            />
          </Panel>
        </TabsContent>

        <TabsContent className="mt-4" value="calculations">
          <Panel
            title={
              isAgent ? "Qazanc hesablamalarım" : "Komissiya hesablamaları"
            }
            toolbar={
              <SearchField
                onChange={setQuery}
                placeholder="Tələbə, agent və ya kod..."
                value={query}
              />
            }
          >
            <CalculationsRegister
              calculations={calculations}
              canApprove={data.canApprove}
              locale={locale}
              mutationsEnabled={mutationsEnabled}
              showAgent={!isAgent}
              showCampusShare={!isAgent}
            />
          </Panel>
        </TabsContent>

        <TabsContent className="mt-4" value="payments">
          <Panel
            title="Komissiyaya əsas olan tələbə ödənişləri"
            toolbar={
              <SearchField
                onChange={setQuery}
                placeholder="Ödənişlərdə axtar..."
                value={query}
              />
            }
          >
            <PaymentsRegister payments={payments} />
          </Panel>
        </TabsContent>

        {!isAgent ? (
          <TabsContent className="mt-4" value="audit">
            <Panel title="Komissiya audit jurnalı">
              <AuditRegister audit={data.audit} />
            </Panel>
          </TabsContent>
        ) : null}
      </Tabs>

      {data.canManage && mutationsEnabled ? (
        <>
          <CommissionAgreementDrawer
            data={data}
            defaultDate={defaultDate}
            locale={locale}
            onOpenChange={setAgreementOpen}
            open={agreementOpen}
          />
          <CommissionPaymentDrawer
            data={data}
            defaultDate={defaultDate}
            locale={locale}
            onOpenChange={setPaymentOpen}
            open={paymentOpen}
          />
        </>
      ) : null}
    </div>
  );
}

function CommissionProcessRail() {
  const steps = [
    {
      description: "Qəbul üzrə tələbə ödənişi POST edildi",
      icon: ReceiptTextIcon,
      title: "Ödəniş qeydə alındı",
      tone: "green",
    },
    {
      description: "Agent, universitet və proqram şərtləri kilidləndi",
      icon: FileCheck2Icon,
      title: "Müqavilə uyğunlaşdırıldı",
      tone: "blue",
    },
    {
      description: "Campus Global və agent payları hesablandı",
      icon: CalculatorIcon,
      title: "Paylar hesablandı",
      tone: "blue",
    },
    {
      description: "Müvafiq debitor və agent öhdəlikləri yaradıldı",
      icon: LandmarkIcon,
      title: "Maliyyəyə ötürüldü",
      tone: "slate",
    },
  ] as const;

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#dbe4ef] bg-white px-4 py-4 shadow-[0_8px_28px_rgba(35,58,95,0.04)]">
      <div className="flex min-w-[850px] items-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div className="contents" key={step.title}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full border",
                    step.tone === "green" &&
                      "border-[#38a971] bg-[#effbf5] text-[#13925a]",
                    step.tone === "blue" &&
                      "border-[#4387f8] bg-[#f1f6ff] text-[#0b66ff]",
                    step.tone === "slate" &&
                      "border-[#9fb1ca] bg-[#f7f9fc] text-[#536b90]",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-[#172f59]">
                    {step.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-4 text-[#6c7d9c]">
                    {step.description}
                  </span>
                </span>
              </div>
              {index < steps.length - 1 ? (
                <span className="mx-4 h-px w-10 shrink-0 border-t border-dashed border-[#91a5c3]" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof BadgePercentIcon;
  label: string;
  tone: "amber" | "blue" | "green" | "red" | "violet";
  value: string;
}) {
  const toneClass = {
    amber: "bg-[#fff4dc] text-[#e68b00]",
    blue: "bg-[#eaf2ff] text-[#0b66ff]",
    green: "bg-[#eaf8f0] text-[#14945c]",
    red: "bg-[#fff0f1] text-[#e44853]",
    violet: "bg-[#f0edff] text-[#6e55d9]",
  }[tone];
  return (
    <div className="flex min-h-24 items-center gap-4 border-b border-[#dfe7f1] px-5 py-4 last:border-b-0 sm:[&:nth-child(odd)]:border-r sm:[&:nth-last-child(-n+2)]:border-b-0 xl:border-b-0 xl:border-r xl:last:border-r-0">
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full",
          toneClass,
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-[#657697]">
          {label}
        </span>
        <span className="mt-1 block truncate text-xl font-bold tabular-nums tracking-[-0.02em] text-[#10264f]">
          {value}
        </span>
      </span>
    </div>
  );
}

function Panel({
  action,
  children,
  title,
  toolbar,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  title: string;
  toolbar?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#dbe4ef] bg-white shadow-[0_8px_28px_rgba(35,58,95,0.04)]">
      <div className="flex min-h-14 flex-col justify-between gap-3 border-b border-[#e1e8f1] px-4 py-3 sm:flex-row sm:items-center sm:px-5">
        <h2 className="text-base font-bold text-[#122951]">{title}</h2>
        <div className="flex items-center gap-3">
          {toolbar}
          {action}
        </div>
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
    <label className="relative block min-w-0 flex-1 sm:w-52 sm:flex-none">
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

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("az-AZ");
}

function escapeCsv(value: string | number) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
