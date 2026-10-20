"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  DownloadIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FINANCE_TABS, type FinanceTab } from "@/features/finance/constants";
import type { FinanceDialogState } from "@/features/finance/components/finance-dialogs";
import { FinanceOverview } from "@/features/finance/components/finance-overview";
import { escapeCsv } from "@/features/finance/format";
import type { FinanceWorkspaceData } from "@/features/finance/types";

const FinanceDialogs = dynamic(() =>
  import("@/features/finance/components/finance-dialogs").then(
    (module) => module.FinanceDialogs,
  ),
);

const TransactionsRegister = dynamic(
  () =>
    import("@/features/finance/components/finance-registers").then(
      (module) => module.TransactionsRegister,
    ),
  { loading: () => <FinanceSectionLoading /> },
);

const ObligationsRegister = dynamic(
  () =>
    import("@/features/finance/components/finance-registers").then(
      (module) => module.ObligationsRegister,
    ),
  { loading: () => <FinanceSectionLoading /> },
);

const BudgetRegister = dynamic(
  () =>
    import("@/features/finance/components/finance-registers").then(
      (module) => module.BudgetRegister,
    ),
  { loading: () => <FinanceSectionLoading /> },
);

const AccountsRegister = dynamic(
  () =>
    import("@/features/finance/components/finance-registers").then(
      (module) => module.AccountsRegister,
    ),
  { loading: () => <FinanceSectionLoading /> },
);

function preloadFinanceDialogs() {
  void import("@/features/finance/components/finance-dialogs");
}

function preloadFinanceRegisters() {
  void import("@/features/finance/components/finance-registers");
}

const successMessages: Record<string, string> = {
  "account-created": "Maliyyə hesabı yaradıldı.",
  "budget-created": "Büdcə və ilk plan sətri yaradıldı.",
  "category-created": "Maliyyə kateqoriyası yaradıldı.",
  "exchange-rate-updated": "Hesabın hesabat məzənnəsi yeniləndi.",
  "obligation-created": "Maliyyə öhdəliyi reyestrə əlavə edildi.",
  "transaction-created": "Maliyyə əməliyyatı uğurla yaradıldı.",
  "transaction-posted": "Qaralama əməliyyatı təsdiqləndi.",
  "transaction-voided": "Əməliyyat ləğv edildi və hesab təsiri geri alındı.",
};

const errorMessages: Record<string, string> = {
  "account-create-failed":
    "Hesab yaradıla bilmədi. Məlumatları və bağlantını yoxlayın.",
  "account-not-found": "Seçilmiş maliyyə hesabı aktiv deyil və ya tapılmadı.",
  "account-validation": "Hesab məlumatlarında düzəldilməli sahələr var.",
  "budget-category-mismatch":
    "Büdcə sətri üçün aktiv xərc kateqoriyası seçilməlidir.",
  "budget-create-failed": "Büdcə yaradıla bilmədi.",
  "budget-validation": "Büdcə tarixlərini və məbləğini yoxlayın.",
  "category-create-failed":
    "Kateqoriya yaradıla bilmədi; eyni ad artıq mövcud ola bilər.",
  "category-mismatch": "Əməliyyat növü ilə kateqoriya növü uyğun deyil.",
  "category-validation": "Kateqoriya adı və növü düzgün daxil edilməyib.",
  "destination-account-not-found":
    "Transfer üçün seçilən təyinat hesabı aktiv deyil.",
  "destination-amount-required":
    "Fərqli valyutalı transfer üçün təyinat məbləğini daxil edin.",
  "exchange-rate-update-failed": "Məzənnə yenilənə bilmədi.",
  "exchange-rate-validation": "Məzənnə sıfırdan böyük olmalıdır.",
  "obligation-create-failed": "Öhdəlik yaradıla bilmədi.",
  "obligation-not-found": "Seçilmiş öhdəlik açıq deyil və ya tapılmadı.",
  "obligation-transaction-mismatch":
    "Öhdəlik növü, valyutası və ödəniş əməliyyatı uyğun gəlmir.",
  "obligation-validation": "Öhdəlik məlumatlarında düzəldilməli sahələr var.",
  "settlement-exceeds-outstanding":
    "Ödəniş məbləği açıq qalıqdan böyük ola bilməz.",
  "transaction-create-failed": "Əməliyyat yaradıla bilmədi.",
  "transaction-not-voidable": "Yalnız tamamlanmış əməliyyat ləğv edilə bilər.",
  "transaction-not-postable": "Yalnız aktiv qaralama təsdiqlənə bilər.",
  "post-failed": "Qaralama əməliyyatı təsdiqlənə bilmədi.",
  "post-validation": "Təsdiqlənəcək qaralama düzgün seçilməyib.",
  "transaction-validation":
    "Əməliyyat məlumatlarında düzəldilməli sahələr var.",
  "void-failed": "Əməliyyatın ləğvi tamamlanmadı.",
  "void-validation": "Ləğv səbəbini ən azı 3 simvol ilə yazın.",
};

export function FinanceWorkspace({
  data,
  error,
  success,
}: {
  data: FinanceWorkspaceData;
  error: string;
  success: string;
}) {
  const [tab, setTab] = useState<FinanceTab>("overview");
  const [dialog, setDialog] = useState<FinanceDialogState>({ kind: "closed" });
  const [periodOpen, setPeriodOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    () => data.chart.at(-1)?.month ?? "",
  );
  const overviewData = useMemo(
    () => createPeriodData(data, selectedMonth),
    [data, selectedMonth],
  );
  const selectedPeriodLabel =
    data.chart.find((point) => point.month === selectedMonth)?.label ?? "Bu ay";

  function exportTransactions() {
    const headers = [
      "Kod",
      "Növ",
      "Status",
      "Tarix",
      "Hesab",
      "Tərəf",
      "Kateqoriya",
      "Məbləğ",
      "Valyuta",
      "Baza məbləği",
      "Referans",
    ];
    const rows = data.transactions.map((transaction) => [
      transaction.code,
      transaction.type,
      transaction.status,
      transaction.effectiveAt,
      transaction.accountName,
      transaction.counterpartyName,
      transaction.categoryName,
      transaction.amount,
      transaction.currency,
      transaction.baseAmount,
      transaction.reference,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => escapeCsv(value)).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `campus-global-finance-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-full bg-[#f6f9ff] px-4 py-5 text-[#0b1f44] sm:px-5 lg:px-8 lg:py-7">
      <header className="flex flex-col justify-between gap-5 border-b border-[#dce5f0] pb-5 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-[2rem] font-bold tracking-[-0.035em] text-[#0b1f44] lg:text-[2.2rem]">
            Maliyyə
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#63749a]">
            Pul axını, öhdəliklər və maliyyə nəticələrinin vahid idarəetməsi
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            className="h-10 rounded-xl border-[#d8e2ee] bg-white px-3 text-xs font-semibold text-[#31476f] hover:bg-[#f8fbff]"
            onClick={() => setPeriodOpen(true)}
            variant="outline"
          >
            <CalendarDaysIcon className="size-4 text-[#42628d]" />
            {selectedPeriodLabel}
          </Button>
          <Button
            className="h-10 rounded-xl border-[#d8e2ee] bg-white px-3 text-xs font-semibold text-[#31476f] hover:bg-[#f8fbff]"
            onClick={exportTransactions}
            variant="outline"
          >
            <DownloadIcon className="size-4" />
            Eksport
          </Button>
          {data.canPost ? (
            <Button
              className="h-10 rounded-xl bg-[#0b66ff] px-4 text-xs font-bold text-white shadow-[0_10px_24px_rgba(11,102,255,0.22)] hover:bg-[#0758dc]"
              onFocus={preloadFinanceDialogs}
              onMouseEnter={preloadFinanceDialogs}
              onClick={() => setDialog({ kind: "transaction" })}
            >
              <PlusIcon className="size-4" />
              Yeni əməliyyat
            </Button>
          ) : null}
        </div>
      </header>

      {success || error ? (
        <div
          className={
            error
              ? "mt-5 flex items-center gap-3 rounded-xl border border-[#ffd0d2] bg-[#fff2f3] px-4 py-3 text-sm font-semibold text-[#b92b33]"
              : "mt-5 flex items-center gap-3 rounded-xl border border-[#c5ecd9] bg-[#edfbf4] px-4 py-3 text-sm font-semibold text-[#05774d]"
          }
          role="status"
        >
          {error ? (
            <TriangleAlertIcon className="size-4 shrink-0" />
          ) : (
            <CheckCircle2Icon className="size-4 shrink-0" />
          )}
          {error
            ? (errorMessages[error] ?? "Maliyyə əməliyyatı tamamlanmadı.")
            : (successMessages[success] ?? "Maliyyə məlumatları yeniləndi.")}
        </div>
      ) : null}

      <Tabs
        className="mt-2"
        onValueChange={(value) => setTab(value as FinanceTab)}
        value={tab}
      >
        <div className="-mx-4 overflow-x-auto border-b border-[#dfe7f1] px-4 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8">
          <TabsList className="h-14 min-w-max gap-8 p-0" variant="line">
            {FINANCE_TABS.map((item) => (
              <TabsTrigger
                className="h-14 flex-none px-1 text-sm font-semibold text-[#52678d] after:bottom-0 after:h-[2px] after:bg-[#0b66ff] data-active:text-[#0b66ff]"
                key={item.id}
                onFocus={
                  item.id === "overview" ? undefined : preloadFinanceRegisters
                }
                onMouseEnter={
                  item.id === "overview" ? undefined : preloadFinanceRegisters
                }
                value={item.id}
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent className="mt-5" value="overview">
          <FinanceOverview
            data={overviewData}
            onOpenTab={(nextTab) => setTab(nextTab)}
          />
        </TabsContent>
        <TabsContent className="mt-5" value="transactions">
          {tab === "transactions" ? (
            <TransactionsRegister
              canPost={data.canPost}
              canVoid={data.canVoid}
              onCreate={() => setDialog({ kind: "transaction" })}
              onPost={(transaction) => setDialog({ kind: "post", transaction })}
              onVoid={(transaction) => setDialog({ kind: "void", transaction })}
              transactions={data.transactions}
            />
          ) : null}
        </TabsContent>
        <TabsContent className="mt-5" value="receivables">
          {tab === "receivables" ? (
            <ObligationsRegister
              canManage={data.canManage}
              obligations={data.obligations}
              onCreate={(obligationType) =>
                setDialog({ kind: "obligation", obligationType })
              }
              onSettle={(obligation) =>
                setDialog({ kind: "transaction", obligation })
              }
              type="RECEIVABLE"
            />
          ) : null}
        </TabsContent>
        <TabsContent className="mt-5" value="payables">
          {tab === "payables" ? (
            <ObligationsRegister
              canManage={data.canManage}
              obligations={data.obligations}
              onCreate={(obligationType) =>
                setDialog({ kind: "obligation", obligationType })
              }
              onSettle={(obligation) =>
                setDialog({ kind: "transaction", obligation })
              }
              type="PAYABLE"
            />
          ) : null}
        </TabsContent>
        <TabsContent className="mt-5" value="budget">
          {tab === "budget" ? (
            <BudgetRegister
              budgets={data.budgets}
              canManage={data.canManage}
              onCreate={() => setDialog({ kind: "budget" })}
            />
          ) : null}
        </TabsContent>
        <TabsContent className="mt-5" value="accounts">
          {tab === "accounts" ? (
            <AccountsRegister
              accounts={data.accounts}
              canManage={data.canManage}
              categories={data.categories}
              onCreateAccount={() => setDialog({ kind: "account" })}
              onCreateCategory={() => setDialog({ kind: "category" })}
            />
          ) : null}
        </TabsContent>
      </Tabs>

      {dialog.kind !== "closed" ? (
        <FinanceDialogs data={data} onChange={setDialog} state={dialog} />
      ) : null}

      <Dialog onOpenChange={setPeriodOpen} open={periodOpen}>
        <DialogContent className="w-[calc(100%-1.5rem)] rounded-[1.4rem] border-[#d8e2ee] p-5 sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold text-[#0b1f44]">
              Hesabat dövrü
            </DialogTitle>
            <DialogDescription>
              İcmaldakı gəlir, xərc və son əməliyyatlar üçün ay seçin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {data.chart.map((point) => (
              <Button
                aria-pressed={point.month === selectedMonth}
                className={
                  point.month === selectedMonth
                    ? "h-10 rounded-xl bg-[#0b66ff] text-xs font-bold text-white hover:bg-[#0758dc]"
                    : "h-10 rounded-xl border-[#d8e2ee] text-xs font-semibold text-[#40557d]"
                }
                key={point.month}
                onClick={() => {
                  setSelectedMonth(point.month);
                  setPeriodOpen(false);
                }}
                type="button"
                variant={point.month === selectedMonth ? "default" : "outline"}
              >
                {point.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function createPeriodData(
  data: FinanceWorkspaceData,
  selectedMonth: string,
): FinanceWorkspaceData {
  const selectedIndex = data.chart.findIndex(
    (point) => point.month === selectedMonth,
  );
  if (selectedIndex < 0) return data;

  const selected = data.chart[selectedIndex];
  const previous = data.chart[selectedIndex - 1];
  return {
    ...data,
    metrics: {
      ...data.metrics,
      expense: selected.expense,
      expenseChange: getPeriodChange(selected.expense, previous?.expense ?? 0),
      income: selected.income,
      incomeChange: getPeriodChange(selected.income, previous?.income ?? 0),
      netCashFlow: selected.income - selected.expense,
    },
    transactions: data.transactions.filter((transaction) =>
      transaction.effectiveAt.startsWith(selectedMonth),
    ),
  };
}

function getPeriodChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? null : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function FinanceSectionLoading() {
  return (
    <div
      aria-label="Maliyyə bölməsi yüklənir"
      className="min-h-72 animate-pulse rounded-[1.55rem] border border-[#dce6f2] bg-white p-5"
      role="status"
    >
      <div className="h-5 w-44 rounded bg-[#e8eef7]" />
      <div className="mt-3 h-3 w-72 max-w-full rounded bg-[#f0f4fa]" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="h-14 rounded-xl bg-[#f4f7fb]" key={index} />
        ))}
      </div>
    </div>
  );
}
