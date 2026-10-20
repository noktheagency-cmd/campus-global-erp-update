"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  ArrowDownLeftIcon,
  ArrowLeftRightIcon,
  ArrowUpRightIcon,
  BanknoteIcon,
  CalendarDaysIcon,
  CircleDollarSignIcon,
  LandmarkIcon,
  PlusIcon,
  SearchIcon,
  WalletCardsIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateFinanceExchangeRateAction } from "@/features/finance/actions";
import {
  FINANCE_ACCOUNT_TYPE_LABELS,
  FINANCE_TRANSACTION_STATUS_LABELS,
  FINANCE_TRANSACTION_TYPE_LABELS,
} from "@/features/finance/constants";
import {
  formatFinanceDate,
  formatFinanceMoney,
} from "@/features/finance/format";
import type {
  FinanceAccountRecord,
  FinanceBudgetRecord,
  FinanceCategoryRecord,
  FinanceObligationRecord,
  FinanceObligationType,
  FinanceTransactionRecord,
} from "@/features/finance/types";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-11 rounded-xl border border-[#d9e3ef] bg-white px-3 text-sm font-semibold text-[#31476f] outline-none transition focus:border-[#6ca7ff] focus:ring-2 focus:ring-[#dceaff]";

function preloadFinanceDialogs() {
  void import("@/features/finance/components/finance-dialogs");
}

export function TransactionsRegister({
  canPost,
  canVoid,
  onCreate,
  onPost,
  onVoid,
  transactions,
}: {
  canPost: boolean;
  canVoid: boolean;
  onCreate: () => void;
  onPost: (transaction: FinanceTransactionRecord) => void;
  onVoid: (transaction: FinanceTransactionRecord) => void;
  transactions: FinanceTransactionRecord[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [type, setType] = useState("ALL");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("az"));
  const filtered = useMemo(
    () =>
      transactions.filter((transaction) => {
        const matchesQuery =
          !deferredQuery ||
          [
            transaction.code,
            transaction.counterpartyName,
            transaction.categoryName,
            transaction.reference,
            transaction.accountName,
          ].some((value) =>
            value.toLocaleLowerCase("az").includes(deferredQuery),
          );
        return (
          matchesQuery &&
          (status === "ALL" || transaction.status === status) &&
          (type === "ALL" || transaction.type === type)
        );
      }),
    [deferredQuery, status, transactions, type],
  );

  return (
    <section className="overflow-hidden rounded-[1.55rem] border border-[#dce6f2] bg-white shadow-[0_14px_38px_rgba(31,65,123,0.055)]">
      <RegisterHeader
        action={
          canPost ? { label: "Yeni əməliyyat", onClick: onCreate } : undefined
        }
        description="Gəlir, xərc, transfer, qaralama və ləğv qeydlərinin tam jurnalı"
        title="Əməliyyat jurnalı"
      />
      <div className="grid gap-3 border-y border-[#e5ecf5] bg-[#fbfcfe] p-4 md:grid-cols-[minmax(240px,1fr)_180px_180px]">
        <label className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8a99b4]" />
          <Input
            className="h-11 rounded-xl border-[#d9e3ef] bg-white pl-10 text-sm"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Kod, tərəf, kateqoriya və ya hesab axtar"
            value={query}
          />
        </label>
        <select
          aria-label="Əməliyyat növü"
          className={selectClassName}
          onChange={(event) => setType(event.target.value)}
          value={type}
        >
          <option value="ALL">Bütün növlər</option>
          <option value="INCOME">Gəlir</option>
          <option value="EXPENSE">Xərc</option>
          <option value="TRANSFER">Transfer</option>
        </select>
        <select
          aria-label="Əməliyyat statusu"
          className={selectClassName}
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        >
          <option value="ALL">Bütün statuslar</option>
          <option value="POSTED">Tamamlandı</option>
          <option value="DRAFT">Qaralama</option>
          <option value="VOID">Ləğv edildi</option>
        </select>
      </div>

      {filtered.length ? (
        <>
          <div className="hidden grid-cols-[1.05fr_1.3fr_1fr_0.9fr_0.85fr_0.8fr_72px] gap-4 border-b border-[#e5ecf5] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.05em] text-[#7485a5] lg:grid">
            <span>Kod / tarix</span>
            <span>Əməliyyat</span>
            <span>Hesab</span>
            <span>Tərəf</span>
            <span>Məbləğ</span>
            <span>Status</span>
            <span>Əməl</span>
          </div>
          <div className="divide-y divide-[#e8eef6]">
            {filtered.map((transaction) => (
              <TransactionRegisterRow
                canPost={canPost}
                canVoid={canVoid}
                key={transaction.id}
                onPost={onPost}
                onVoid={onVoid}
                transaction={transaction}
              />
            ))}
          </div>
          <div className="border-t border-[#e5ecf5] bg-[#fbfcfe] px-5 py-3 text-xs font-semibold text-[#6f809f]">
            Cəmi {filtered.length} əməliyyat göstərilir
          </div>
        </>
      ) : (
        <RegisterEmpty
          description="Filtrlərə uyğun maliyyə əməliyyatı tapılmadı."
          icon={WalletCardsIcon}
          title="Əməliyyat yoxdur"
        />
      )}
    </section>
  );
}

function TransactionRegisterRow({
  canPost,
  canVoid,
  onPost,
  onVoid,
  transaction,
}: {
  canPost: boolean;
  canVoid: boolean;
  onPost: (transaction: FinanceTransactionRecord) => void;
  onVoid: (transaction: FinanceTransactionRecord) => void;
  transaction: FinanceTransactionRecord;
}) {
  const Icon =
    transaction.type === "INCOME"
      ? ArrowDownLeftIcon
      : transaction.type === "EXPENSE"
        ? ArrowUpRightIcon
        : ArrowLeftRightIcon;
  return (
    <div className="grid gap-3 px-5 py-4 transition hover:bg-[#f9fbfe] lg:grid-cols-[1.05fr_1.3fr_1fr_0.9fr_0.85fr_0.8fr_72px] lg:items-center lg:gap-4">
      <div>
        <span className="block font-mono text-xs font-bold text-[#1658bd]">
          {transaction.code}
        </span>
        <span className="mt-1 block text-[11px] text-[#7888a5]">
          {formatFinanceDate(transaction.effectiveAt)}
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border",
            transaction.type === "INCOME"
              ? "border-[#a7e7ca] text-[#00a566]"
              : transaction.type === "EXPENSE"
                ? "border-[#ffb1b4] text-[#ef4048]"
                : "border-[#a7c9ff] text-[#0b66ff]",
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold text-[#17305b]">
            {FINANCE_TRANSACTION_TYPE_LABELS[transaction.type]}
          </span>
          <span className="block truncate text-[11px] text-[#7c8ba6]">
            {transaction.categoryName}
          </span>
        </span>
      </div>
      <div className="min-w-0 text-xs">
        <span className="block truncate font-semibold text-[#324a75]">
          {transaction.accountName}
        </span>
        {transaction.destinationAccountName ? (
          <span className="block truncate text-[11px] text-[#8090aa]">
            → {transaction.destinationAccountName}
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <span className="block truncate text-xs font-semibold text-[#324a75]">
          {transaction.counterpartyName}
        </span>
        <span className="block truncate text-[11px] text-[#8795ad]">
          {transaction.reference || "Referans yoxdur"}
        </span>
      </div>
      <div>
        <span
          className={cn(
            "block text-xs font-bold",
            transaction.type === "INCOME"
              ? "text-[#00a566]"
              : transaction.type === "EXPENSE"
                ? "text-[#ef4048]"
                : "text-[#0b66ff]",
          )}
        >
          {formatFinanceMoney(transaction.amount, transaction.currency)}
        </span>
        {transaction.currency !== transaction.baseCurrency ? (
          <span className="block text-[10px] text-[#8593aa]">
            {formatFinanceMoney(
              transaction.baseAmount,
              transaction.baseCurrency,
            )}
          </span>
        ) : null}
      </div>
      <StatusTag status={transaction.status} />
      <div>
        {canPost && transaction.status === "DRAFT" ? (
          <Button
            className="h-8 rounded-lg px-2.5 text-[11px] text-[#0b61eb] hover:bg-[#edf4ff] hover:text-[#0758dc]"
            onFocus={preloadFinanceDialogs}
            onMouseEnter={preloadFinanceDialogs}
            onClick={() => onPost(transaction)}
            size="sm"
            variant="ghost"
          >
            Təsdiqlə
          </Button>
        ) : canVoid && transaction.status === "POSTED" ? (
          <Button
            className="h-8 rounded-lg px-2.5 text-[11px] text-[#d63a41] hover:bg-[#fff0f1] hover:text-[#bb2028]"
            onFocus={preloadFinanceDialogs}
            onMouseEnter={preloadFinanceDialogs}
            onClick={() => onVoid(transaction)}
            size="sm"
            variant="ghost"
          >
            Ləğv et
          </Button>
        ) : (
          <span className="text-xs text-[#a2aec0]">—</span>
        )}
      </div>
    </div>
  );
}

export function ObligationsRegister({
  canManage,
  obligations,
  onCreate,
  onSettle,
  type,
}: {
  canManage: boolean;
  obligations: FinanceObligationRecord[];
  onCreate: (type: FinanceObligationType) => void;
  onSettle: (obligation: FinanceObligationRecord) => void;
  type: FinanceObligationType;
}) {
  const rows = obligations.filter((item) => item.type === type);
  const openAmount = rows.reduce(
    (sum, row) => sum + row.outstandingAmount * row.exchangeRate,
    0,
  );
  const overdueAmount = rows.reduce(
    (sum, row) =>
      sum + (row.isOverdue ? row.outstandingAmount * row.exchangeRate : 0),
    0,
  );
  const closedAmount = rows.reduce(
    (sum, row) => sum + row.paidAmount * row.exchangeRate,
    0,
  );
  const title =
    type === "RECEIVABLE" ? "Debitor alacaqları" : "Kreditor öhdəlikləri";

  return (
    <section className="overflow-hidden rounded-[1.55rem] border border-[#dce6f2] bg-white shadow-[0_14px_38px_rgba(31,65,123,0.055)]">
      <RegisterHeader
        action={
          canManage
            ? {
                label: type === "RECEIVABLE" ? "Yeni alacaq" : "Yeni öhdəlik",
                onClick: () => onCreate(type),
              }
            : undefined
        }
        description={
          type === "RECEIVABLE"
            ? "Müştəri, agent və tərəfdaşlardan alınacaq məbləğlər"
            : "Universitet, agent və təchizatçılara ödəniləcək məbləğlər"
        }
        title={title}
      />
      <div className="grid border-y border-[#e5ecf5] bg-[#fbfcfe] sm:grid-cols-3">
        <ObligationMetric label="Açıq qalıq" value={openAmount} />
        <ObligationMetric
          className="border-t sm:border-l sm:border-t-0"
          label="Gecikmiş"
          tone="danger"
          value={overdueAmount}
        />
        <ObligationMetric
          className="border-t sm:border-l sm:border-t-0"
          label="Ödənilmiş hissə"
          tone="success"
          value={closedAmount}
        />
      </div>
      {rows.length ? (
        <div className="divide-y divide-[#e8eef6]">
          {rows.map((obligation) => (
            <div
              className="grid gap-3 px-5 py-4 transition hover:bg-[#f9fbfe] lg:grid-cols-[1fr_1.15fr_0.85fr_0.85fr_0.85fr_0.72fr] lg:items-center"
              key={obligation.id}
            >
              <div>
                <span className="block font-mono text-xs font-bold text-[#1658bd]">
                  {obligation.code}
                </span>
                <span className="mt-1 block text-[11px] text-[#8391aa]">
                  {obligation.reference || "Referans yoxdur"}
                </span>
              </div>
              <div className="min-w-0">
                <span className="block truncate text-sm font-bold text-[#17305b]">
                  {obligation.counterpartyName}
                </span>
                <span className="block truncate text-xs text-[#7c8ba6]">
                  {obligation.categoryName}
                </span>
              </div>
              <div>
                <span
                  className={cn(
                    "block text-xs font-bold",
                    obligation.isOverdue ? "text-[#d93c44]" : "text-[#314a75]",
                  )}
                >
                  {formatFinanceDate(obligation.dueDate)}
                </span>
                <span className="block text-[10px] text-[#8795ad]">
                  Son ödəniş tarixi
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-[#172d56]">
                  {formatFinanceMoney(obligation.amount, obligation.currency)}
                </span>
                <span className="block text-[10px] text-[#8795ad]">
                  Sənəd məbləği
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-[#d17900]">
                  {formatFinanceMoney(
                    obligation.outstandingAmount,
                    obligation.currency,
                  )}
                </span>
                <span className="block text-[10px] text-[#8795ad]">
                  Açıq qalıq
                </span>
              </div>
              <div className="flex items-center justify-end gap-2">
                {canManage && obligation.outstandingAmount > 0 ? (
                  <Button
                    className="h-8 rounded-lg bg-[#eaf2ff] px-3 text-[11px] font-bold text-[#0b61eb] hover:bg-[#dceaff]"
                    onFocus={preloadFinanceDialogs}
                    onMouseEnter={preloadFinanceDialogs}
                    onClick={() => onSettle(obligation)}
                    size="sm"
                    variant="ghost"
                  >
                    Ödəniş
                  </Button>
                ) : (
                  <span className="text-xs font-semibold text-[#09a268]">
                    Bağlanıb
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <RegisterEmpty
          description={`${title} reyestrində hələ qeyd yoxdur.`}
          icon={CircleDollarSignIcon}
          title="Qeyd yoxdur"
        />
      )}
    </section>
  );
}

export function BudgetRegister({
  budgets,
  canManage,
  onCreate,
}: {
  budgets: FinanceBudgetRecord[];
  canManage: boolean;
  onCreate: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-[1.55rem] border border-[#dce6f2] bg-white shadow-[0_14px_38px_rgba(31,65,123,0.055)]">
      <RegisterHeader
        action={
          canManage ? { label: "Yeni büdcə", onClick: onCreate } : undefined
        }
        description="Kateqoriyalar üzrə plan, fakt və istifadə limitləri"
        title="Büdcə nəzarəti"
      />
      {budgets.length ? (
        <div className="divide-y divide-[#e5ecf5]">
          {budgets.map((budget) => (
            <div className="p-5" key={budget.id}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#142a53]">
                      {budget.name}
                    </h3>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold",
                        budget.status === "ACTIVE"
                          ? "bg-[#ebfaf3] text-[#058252]"
                          : budget.status === "DRAFT"
                            ? "bg-[#fff7e6] text-[#a96800]"
                            : "bg-[#eef2f7] text-[#687896]",
                      )}
                    >
                      {budget.status === "ACTIVE"
                        ? "Aktiv"
                        : budget.status === "DRAFT"
                          ? "Qaralama"
                          : "Bağlı"}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[#7888a5]">
                    <CalendarDaysIcon className="size-3.5" />{" "}
                    {formatFinanceDate(budget.startDate)} –{" "}
                    {formatFinanceDate(budget.endDate)}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#0b66ff]">
                  {budget.currency}
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {budget.lines.map((line) => (
                  <div
                    className="grid gap-2 md:grid-cols-[minmax(170px,0.8fr)_minmax(240px,1.5fr)_180px] md:items-center"
                    key={line.id}
                  >
                    <span className="text-sm font-semibold text-[#344c75]">
                      {line.categoryName}
                    </span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#edf2f7]">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          line.usagePercent > 100
                            ? "bg-[#ef4048]"
                            : line.usagePercent > 85
                              ? "bg-[#f1a21b]"
                              : "bg-[#0b66ff]",
                        )}
                        style={{
                          width: `${Math.min(line.usagePercent, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs md:block md:text-right">
                      <span className="font-bold text-[#17305b]">
                        {formatFinanceMoney(line.actualAmount, budget.currency)}
                      </span>
                      <span className="text-[#8593aa]">
                        {" "}
                        /{" "}
                        {formatFinanceMoney(
                          line.plannedAmount,
                          budget.currency,
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <RegisterEmpty
          description="İlk aylıq və ya rüblük xərc büdcəsini yaradın."
          icon={CalendarDaysIcon}
          title="Büdcə yoxdur"
        />
      )}
    </section>
  );
}

export function AccountsRegister({
  accounts,
  canManage,
  categories,
  onCreateAccount,
  onCreateCategory,
}: {
  accounts: FinanceAccountRecord[];
  canManage: boolean;
  categories: FinanceCategoryRecord[];
  onCreateAccount: () => void;
  onCreateCategory: () => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.65fr)]">
      <section className="overflow-hidden rounded-[1.55rem] border border-[#dce6f2] bg-white shadow-[0_14px_38px_rgba(31,65,123,0.055)]">
        <RegisterHeader
          action={
            canManage
              ? { label: "Yeni hesab", onClick: onCreateAccount }
              : undefined
          }
          description="Bank, kassa və rəqəmsal hesabların valyuta üzrə qalıqları"
          title="Maliyyə hesabları"
        />
        {accounts.length ? (
          <div className="divide-y divide-[#e8eef6]">
            {accounts.map((account) => {
              const Icon =
                account.type === "BANK"
                  ? LandmarkIcon
                  : account.type === "CASH"
                    ? BanknoteIcon
                    : WalletCardsIcon;
              return (
                <div
                  className="grid gap-4 px-5 py-5 md:grid-cols-[1.3fr_0.75fr_0.75fr_1fr] md:items-center"
                  key={account.id}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-[#eaf2ff] text-[#0b66ff]">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[#17305b]">
                        {account.name}
                      </span>
                      <span className="block truncate text-xs text-[#7f8da8]">
                        {FINANCE_ACCOUNT_TYPE_LABELS[account.type]} ·{" "}
                        {account.accountNumber || "Nömrə yoxdur"}
                      </span>
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-[#17305b]">
                      {formatFinanceMoney(account.balance, account.currency)}
                    </span>
                    <span className="block text-[10px] text-[#8593aa]">
                      Cari qalıq
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-[#0b66ff]">
                      {formatFinanceMoney(
                        account.baseBalance,
                        account.baseCurrency,
                      )}
                    </span>
                    <span className="block text-[10px] text-[#8593aa]">
                      Baza qarşılığı
                    </span>
                  </div>
                  {canManage && account.currency !== account.baseCurrency ? (
                    <form
                      action={updateFinanceExchangeRateAction}
                      className="flex items-end gap-2"
                    >
                      <input
                        name="accountId"
                        type="hidden"
                        value={account.id}
                      />
                      <label className="min-w-0 flex-1">
                        <span className="mb-1 block text-[10px] font-bold text-[#6f809f]">
                          1 {account.currency} = AZN
                        </span>
                        <Input
                          className="h-9 rounded-lg"
                          defaultValue={account.exchangeRate}
                          min="0.00000001"
                          name="exchangeRate"
                          step="0.00000001"
                          type="number"
                        />
                      </label>
                      <Button
                        className="h-9 rounded-lg px-3 text-xs"
                        type="submit"
                        variant="outline"
                      >
                        Yenilə
                      </Button>
                    </form>
                  ) : (
                    <span className="text-xs font-semibold text-[#7790b2]">
                      Baza valyutası
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <RegisterEmpty
            description="Əməliyyat yaratmazdan əvvəl ən azı bir hesab əlavə edin."
            icon={LandmarkIcon}
            title="Hesab yoxdur"
          />
        )}
      </section>

      <section className="overflow-hidden rounded-[1.55rem] border border-[#dce6f2] bg-white shadow-[0_14px_38px_rgba(31,65,123,0.055)]">
        <RegisterHeader
          action={
            canManage
              ? { label: "Kateqoriya əlavə et", onClick: onCreateCategory }
              : undefined
          }
          description="Gəlir və xərc təsnifatı"
          title="Kateqoriyalar"
        />
        <div className="divide-y divide-[#e8eef6]">
          {categories.map((category) => (
            <div
              className="flex items-center justify-between gap-3 px-5 py-3.5"
              key={category.id}
            >
              <span className="text-sm font-semibold text-[#314a75]">
                {category.name}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-bold",
                  category.type === "INCOME"
                    ? "bg-[#eaf9f2] text-[#058252]"
                    : "bg-[#fff0f1] text-[#cb353d]",
                )}
              >
                {category.type === "INCOME" ? "Gəlir" : "Xərc"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RegisterHeader({
  action,
  description,
  title,
}: {
  action?: { label: string; onClick: () => void };
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 px-5 py-5 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-lg font-bold text-[#0b1f44]">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-[#6f809f]">{description}</p>
      </div>
      {action ? (
        <Button
          className="h-10 rounded-xl bg-[#0b66ff] px-4 text-xs font-bold text-white shadow-[0_10px_24px_rgba(11,102,255,0.22)] hover:bg-[#0758dc]"
          onFocus={preloadFinanceDialogs}
          onMouseEnter={preloadFinanceDialogs}
          onClick={action.onClick}
        >
          <PlusIcon className="size-4" />
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

function RegisterEmpty({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: typeof WalletCardsIcon;
  title: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-[#edf3fc] text-[#7890b5]">
        <Icon className="size-6" />
      </span>
      <p className="mt-3 text-sm font-bold text-[#334b75]">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-[#7e8ca7]">
        {description}
      </p>
    </div>
  );
}

function StatusTag({ status }: { status: FinanceTransactionRecord["status"] }) {
  return (
    <span
      className={cn(
        "w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold",
        status === "POSTED" && "border-[#c8ead9] bg-[#ebfaf3] text-[#058252]",
        status === "DRAFT" && "border-[#f5dab0] bg-[#fff8e9] text-[#a96800]",
        status === "VOID" && "border-[#ffd0d2] bg-[#fff0f1] text-[#cf353d]",
      )}
    >
      {FINANCE_TRANSACTION_STATUS_LABELS[status]}
    </span>
  );
}

function ObligationMetric({
  className,
  label,
  tone = "default",
  value,
}: {
  className?: string;
  label: string;
  tone?: "default" | "danger" | "success";
  value: number;
}) {
  return (
    <div className={cn("border-[#e5ecf5] px-5 py-4", className)}>
      <span className="block text-xs font-semibold text-[#7182a0]">
        {label}
      </span>
      <span
        className={cn(
          "mt-1 block text-lg font-bold",
          tone === "default" && "text-[#17305b]",
          tone === "danger" && "text-[#d93c44]",
          tone === "success" && "text-[#058252]",
        )}
      >
        {formatFinanceMoney(value, "AZN")}
      </span>
    </div>
  );
}
