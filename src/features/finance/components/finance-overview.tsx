"use client";

import dynamic from "next/dynamic";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BanknoteIcon,
  Building2Icon,
  Clock3Icon,
  LandmarkIcon,
  TrendingUpIcon,
  WalletCardsIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatFinanceDate,
  formatFinanceMoney,
  formatFinancePercent,
} from "@/features/finance/format";
import type {
  FinanceAccountRecord,
  FinanceAgingBucket,
  FinanceAgingSummary,
  FinanceTransactionRecord,
  FinanceWorkspaceData,
} from "@/features/finance/types";
import { cn } from "@/lib/utils";

const FinanceCashFlowChart = dynamic(
  () =>
    import("@/features/finance/components/finance-cash-flow-chart").then(
      (module) => module.FinanceCashFlowChart,
    ),
  {
    loading: () => <FinanceChartLoading />,
    ssr: false,
  },
);

const CHART_LOADING_HEIGHTS = [58, 72, 64, 84, 52, 76, 68, 88, 61, 73, 56, 79];

const agingBuckets: Array<{
  id: FinanceAgingBucket;
  label: string;
  color: string;
  textColor: string;
}> = [
  {
    color: "bg-[#0bb875]",
    id: "CURRENT",
    label: "Cari",
    textColor: "text-[#058252]",
  },
  {
    color: "bg-[#93d99b]",
    id: "DAYS_1_30",
    label: "1–30 gün",
    textColor: "text-[#2b8d55]",
  },
  {
    color: "bg-[#ffad45]",
    id: "DAYS_31_60",
    label: "31–60 gün",
    textColor: "text-[#9a5a00]",
  },
  {
    color: "bg-[#ff4d52]",
    id: "DAYS_60_PLUS",
    label: "60+ gün",
    textColor: "text-[#c32f35]",
  },
];

export function FinanceOverview({
  data,
  onOpenTab,
}: {
  data: FinanceWorkspaceData;
  onOpenTab: (tab: "accounts" | "receivables" | "transactions") => void;
}) {
  return (
    <div className="space-y-4">
      <SummaryBand data={data} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(310px,0.82fr)]">
        <section className="rounded-[1.55rem] border border-[#dce6f2] bg-white p-4 shadow-[0_14px_38px_rgba(31,65,123,0.055)] lg:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#0b1f44]">Pul axını</h2>
              <div className="mt-2 flex items-center gap-5 text-xs font-medium text-[#63749a]">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#09ad6b]" /> Gəlir
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-[#ff4d52]" /> Xərc
                </span>
              </div>
            </div>
            <span className="rounded-xl border border-[#dce5f0] bg-[#fbfdff] px-3 py-2 text-xs font-semibold text-[#31446c]">
              Son 12 ay
            </span>
          </div>
          <div className="mt-5 h-[270px] w-full lg:h-[292px]">
            <FinanceCashFlowChart
              chart={data.chart}
              currency={data.baseCurrency}
            />
          </div>
        </section>

        <AccountsPanel
          accounts={data.accounts}
          baseCurrency={data.baseCurrency}
          onOpen={() => onOpenTab("accounts")}
          totalBalance={data.metrics.totalBalance}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(360px,0.92fr)_minmax(0,1.48fr)]">
        <AgingPanel
          aging={data.aging}
          currency={data.baseCurrency}
          onOpen={() => onOpenTab("receivables")}
        />
        <RecentTransactions
          transactions={data.transactions.slice(0, 5)}
          onOpen={() => onOpenTab("transactions")}
        />
      </div>
    </div>
  );
}

function SummaryBand({ data }: { data: FinanceWorkspaceData }) {
  const items = [
    {
      detail: null,
      icon: WalletCardsIcon,
      label: "Ümumi balans",
      tone: "blue",
      value: data.metrics.totalBalance,
    },
    {
      detail: formatFinancePercent(data.metrics.incomeChange),
      icon: ArrowUpRightIcon,
      label: "Gəlir",
      tone: "green",
      value: data.metrics.income,
    },
    {
      detail: formatFinancePercent(data.metrics.expenseChange),
      icon: ArrowDownLeftIcon,
      label: "Xərc",
      tone: "red",
      value: data.metrics.expense,
    },
    {
      detail: null,
      icon: TrendingUpIcon,
      label: "Xalis pul axını",
      tone: "green",
      value: data.metrics.netCashFlow,
    },
    {
      detail: `${data.metrics.overdueCount} sənəd`,
      icon: Clock3Icon,
      label: "Gecikmiş alacaqlar",
      tone: "amber",
      value: data.metrics.overdueReceivables,
    },
  ] as const;

  return (
    <section className="grid overflow-hidden rounded-[1.55rem] border border-[#dce6f2] bg-white shadow-[0_14px_38px_rgba(31,65,123,0.055)] sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            className={cn(
              "flex min-h-28 items-center gap-3 px-4 py-4 lg:px-5",
              index > 0 && "border-t border-[#e5ecf5] sm:border-l",
              index === 2 && "sm:border-l-0 xl:border-l",
              index > 1 && "sm:border-t xl:border-t-0",
            )}
            key={item.label}
          >
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full",
                item.tone === "blue" && "bg-[#e9f1ff] text-[#0b66ff]",
                item.tone === "green" && "bg-[#e5f7ef] text-[#08a465]",
                item.tone === "red" && "bg-[#ffe8e8] text-[#ff4048]",
                item.tone === "amber" && "bg-[#fff1dc] text-[#f49300]",
              )}
            >
              <Icon className="size-5" strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-[#67789b]">
                {item.label}
              </span>
              <span className="mt-1 block truncate text-[18px] font-bold tracking-[-0.02em] text-[#0b1f44]">
                {formatFinanceMoney(item.value, data.baseCurrency)}
              </span>
              {item.detail ? (
                <span
                  className={cn(
                    "mt-0.5 block text-xs font-bold",
                    item.tone === "green" && "text-[#00a566]",
                    item.tone === "red" && "text-[#f0444b]",
                    item.tone === "amber" && "text-[#eb8a00]",
                  )}
                >
                  {item.detail}
                </span>
              ) : null}
            </span>
          </div>
        );
      })}
    </section>
  );
}

function AccountsPanel({
  accounts,
  baseCurrency,
  onOpen,
  totalBalance,
}: {
  accounts: FinanceAccountRecord[];
  baseCurrency: string;
  onOpen: () => void;
  totalBalance: number;
}) {
  return (
    <section className="overflow-hidden rounded-[1.55rem] border border-[#dce6f2] bg-white shadow-[0_14px_38px_rgba(31,65,123,0.055)]">
      <div className="flex items-center justify-between border-b border-[#e5ecf5] px-5 py-4">
        <h2 className="text-lg font-bold text-[#0b1f44]">Hesablar</h2>
        <Button
          className="h-auto px-0 text-xs font-semibold text-[#0b66ff]"
          onClick={onOpen}
          variant="link"
        >
          Hamısına bax
        </Button>
      </div>
      <div className="divide-y divide-[#e8eef6]">
        {accounts.length > 0 ? (
          accounts.slice(0, 4).map((account) => {
            const Icon =
              account.type === "CASH"
                ? BanknoteIcon
                : account.type === "BANK"
                  ? LandmarkIcon
                  : WalletCardsIcon;
            return (
              <div
                className="flex items-center gap-3 px-5 py-4"
                key={account.id}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    account.type === "CASH"
                      ? "bg-[#e8f8ef] text-[#00a566]"
                      : "bg-[#e9f1ff] text-[#0b66ff]",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[#10244a]">
                    {account.name}
                  </span>
                  <span className="block truncate text-xs text-[#7585a4]">
                    {account.currency} hesabı
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-sm font-bold text-[#10244a]">
                    {formatFinanceMoney(account.balance, account.currency)}
                  </span>
                  <span className="block text-[11px] font-semibold text-[#8a99b4]">
                    {account.currency}
                  </span>
                </span>
              </div>
            );
          })
        ) : (
          <div className="flex min-h-44 flex-col items-center justify-center px-6 text-center">
            <Building2Icon className="size-7 text-[#a0afc7]" />
            <p className="mt-3 text-sm font-semibold text-[#40557d]">
              Hələ maliyyə hesabı yoxdur
            </p>
            <p className="mt-1 text-xs text-[#8290ab]">
              İlk bank və ya kassa hesabını əlavə edin.
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-[#e5ecf5] bg-[#fbfdff] px-5 py-4">
        <span className="text-sm font-bold text-[#21375f]">Ümumi balans</span>
        <span className="text-sm font-bold text-[#0b66ff]">
          {formatFinanceMoney(totalBalance, baseCurrency)}
        </span>
      </div>
    </section>
  );
}

function AgingPanel({
  aging,
  currency,
  onOpen,
}: {
  aging: FinanceAgingSummary;
  currency: string;
  onOpen: () => void;
}) {
  return (
    <section className="rounded-[1.55rem] border border-[#dce6f2] bg-white p-4 shadow-[0_14px_38px_rgba(31,65,123,0.055)] lg:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#0b1f44]">
          Debitor / kreditor vəziyyəti
        </h2>
        <Button
          className="h-auto px-0 text-xs font-semibold text-[#0b66ff]"
          onClick={onOpen}
          variant="link"
        >
          Hamısına bax
        </Button>
      </div>
      <div className="mt-5 space-y-6">
        <AgingRow
          label="Debitor alacaqları"
          summary={aging.RECEIVABLE}
          currency={currency}
        />
        <div className="border-t border-[#e8eef6]" />
        <AgingRow
          label="Kreditor öhdəlikləri"
          summary={aging.PAYABLE}
          currency={currency}
        />
      </div>
    </section>
  );
}

function AgingRow({
  currency,
  label,
  summary,
}: {
  currency: string;
  label: string;
  summary: Record<FinanceAgingBucket, number>;
}) {
  const total = agingBuckets.reduce(
    (sum, bucket) => sum + summary[bucket.id],
    0,
  );
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-[#40557d]">{label}</span>
        <span className="font-bold text-[#142951]">
          {formatFinanceMoney(total, currency)}
        </span>
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-[#edf2f7]">
        {agingBuckets.map((bucket) => (
          <span
            className={bucket.color}
            key={bucket.id}
            style={{
              width:
                total > 0 ? `${(summary[bucket.id] / total) * 100}%` : "25%",
            }}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {agingBuckets.map((bucket) => {
          const share =
            total > 0 ? Math.round((summary[bucket.id] / total) * 100) : 0;
          return (
            <div className="text-center" key={bucket.id}>
              <div
                className={cn(
                  "truncate text-[11px] font-bold",
                  bucket.textColor,
                )}
              >
                {formatFinanceMoney(summary[bucket.id], currency, {
                  compact: true,
                })}
              </div>
              <div className="mt-0.5 text-[10px] text-[#7d8ca7]">
                ({share}%)
              </div>
              <div className="mt-0.5 text-[10px] font-semibold text-[#657698]">
                {bucket.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentTransactions({
  onOpen,
  transactions,
}: {
  onOpen: () => void;
  transactions: FinanceTransactionRecord[];
}) {
  return (
    <section className="overflow-hidden rounded-[1.55rem] border border-[#dce6f2] bg-white shadow-[0_14px_38px_rgba(31,65,123,0.055)]">
      <div className="flex items-center justify-between border-b border-[#e5ecf5] px-5 py-4">
        <h2 className="text-lg font-bold text-[#0b1f44]">Son əməliyyatlar</h2>
        <Button
          className="h-auto px-0 text-xs font-semibold text-[#0b66ff]"
          onClick={onOpen}
          variant="link"
        >
          Hamısına bax
        </Button>
      </div>
      {transactions.length > 0 ? (
        <>
          <div className="hidden grid-cols-[1.25fr_1fr_0.9fr_0.75fr_0.8fr] gap-3 border-b border-[#e9eff6] bg-[#fbfcfe] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.04em] text-[#7485a5] md:grid">
            <span>Əməliyyat</span>
            <span>Tərəf</span>
            <span>Tarix</span>
            <span>Məbləğ</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-[#e9eff6]">
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
          <WalletCardsIcon className="size-7 text-[#a0afc7]" />
          <p className="mt-3 text-sm font-semibold text-[#40557d]">
            Əməliyyat yoxdur
          </p>
          <p className="mt-1 text-xs text-[#8290ab]">
            İlk gəlir və ya xərc qeydiniz burada görünəcək.
          </p>
        </div>
      )}
    </section>
  );
}

function TransactionRow({
  transaction,
}: {
  transaction: FinanceTransactionRecord;
}) {
  const isIncome = transaction.type === "INCOME";
  const isTransfer = transaction.type === "TRANSFER";
  return (
    <div className="grid gap-2 px-5 py-3.5 transition hover:bg-[#f9fbfe] md:grid-cols-[1.25fr_1fr_0.9fr_0.75fr_0.8fr] md:items-center md:gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border",
            isIncome
              ? "border-[#9fe4c4] text-[#00a566]"
              : isTransfer
                ? "border-[#9dc3ff] text-[#0b66ff]"
                : "border-[#ffacae] text-[#f0444b]",
          )}
        >
          {isIncome ? (
            <ArrowDownLeftIcon className="size-3.5" />
          ) : (
            <ArrowUpRightIcon className="size-3.5" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold text-[#17305b]">
            {transaction.categoryName}
          </span>
          <span className="block truncate text-[10px] text-[#8190aa]">
            {transaction.code}
          </span>
        </span>
      </div>
      <span className="truncate text-xs font-medium text-[#334a73]">
        {transaction.counterpartyName}
      </span>
      <span className="text-xs text-[#68799a]">
        {formatFinanceDate(transaction.effectiveAt)}
      </span>
      <span
        className={cn(
          "text-xs font-bold",
          isIncome
            ? "text-[#00a566]"
            : isTransfer
              ? "text-[#0b66ff]"
              : "text-[#ef4048]",
        )}
      >
        {formatFinanceMoney(transaction.amount, transaction.currency)}
      </span>
      <span
        className={cn(
          "w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold",
          transaction.status === "POSTED" &&
            "border-[#c9eddc] bg-[#edfbf4] text-[#058252]",
          transaction.status === "DRAFT" &&
            "border-[#f7dcae] bg-[#fff8e9] text-[#b36b00]",
          transaction.status === "VOID" &&
            "border-[#ffd1d2] bg-[#fff1f1] text-[#d3343a]",
        )}
      >
        {transaction.status === "POSTED"
          ? "Tamamlandı"
          : transaction.status === "DRAFT"
            ? "Qaralama"
            : "Ləğv edildi"}
      </span>
    </div>
  );
}

function FinanceChartLoading() {
  return (
    <div
      aria-label="Pul axını qrafiki yüklənir"
      className="flex h-full animate-pulse items-end gap-3 px-3 pb-4"
      role="status"
    >
      {CHART_LOADING_HEIGHTS.map((height, index) => (
        <span
          className="min-w-2 flex-1 rounded-t bg-[#e9eff8]"
          key={`${height}-${index}`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}
