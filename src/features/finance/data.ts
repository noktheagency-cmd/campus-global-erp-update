import "server-only";

import {
  differenceInCalendarDays,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { az } from "date-fns/locale";

import { FINANCE_BASE_CURRENCY } from "@/features/finance/constants";
import {
  createFinanceDemoData,
  demoFinanceCategories,
} from "@/features/finance/data/demo-data";
import type {
  FinanceAgingBucket,
  FinanceAgingSummary,
  FinanceBudgetRecord,
  FinanceChartPoint,
  FinanceObligationRecord,
  FinanceTransactionRecord,
  FinanceWorkspaceData,
} from "@/features/finance/types";
import type { Prisma } from "@/generated/prisma/client";
import { can } from "@/lib/auth/permissions";
import type { AuthSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

type FinanceDataOptions = { preview?: boolean };

type ChartRow = { expense: string; income: string; month: Date | string };
type AgingRow = {
  amount: string;
  bucket: FinanceAgingBucket;
  count: bigint | number;
  type: "PAYABLE" | "RECEIVABLE";
};
type BudgetActualRow = { actual: string; budgetId: string; categoryId: string };
type BalanceRow = { accountId: string; total: string };

const accountSelect = {
  accountNumber: true,
  bankName: true,
  baseCurrency: true,
  currency: true,
  exchangeRate: true,
  id: true,
  name: true,
  openingBalance: true,
  openingBalanceDate: true,
  status: true,
  type: true,
} satisfies Prisma.FinanceAccountSelect;

const categorySelect = {
  id: true,
  isSystem: true,
  name: true,
  status: true,
  type: true,
} satisfies Prisma.FinanceCategorySelect;

const transactionSelect = {
  account: { select: { name: true } },
  accountId: true,
  amount: true,
  baseAmount: true,
  baseCurrency: true,
  category: { select: { id: true, name: true } },
  code: true,
  counterpartyName: true,
  counterpartyType: true,
  createdBy: { select: { email: true, name: true } },
  currency: true,
  description: true,
  destinationAccount: { select: { id: true, name: true } },
  destinationAmount: true,
  destinationCurrency: true,
  effectiveAt: true,
  exchangeRate: true,
  id: true,
  reference: true,
  status: true,
  type: true,
  voidReason: true,
} satisfies Prisma.FinanceTransactionSelect;

const obligationSelect = {
  amount: true,
  baseAmount: true,
  category: { select: { id: true, name: true } },
  code: true,
  counterpartyName: true,
  counterpartyType: true,
  currency: true,
  description: true,
  dueDate: true,
  exchangeRate: true,
  id: true,
  issueDate: true,
  reference: true,
  settlements: {
    select: { amount: true, transaction: { select: { status: true } } },
  },
  status: true,
  type: true,
} satisfies Prisma.FinanceObligationSelect;

const budgetSelect = {
  currency: true,
  endDate: true,
  id: true,
  lines: {
    select: {
      category: { select: { name: true } },
      categoryId: true,
      id: true,
      plannedAmount: true,
    },
  },
  name: true,
  startDate: true,
  status: true,
} satisfies Prisma.FinanceBudgetSelect;

type TransactionQueryRecord = Prisma.FinanceTransactionGetPayload<{
  select: typeof transactionSelect;
}>;
type ObligationQueryRecord = Prisma.FinanceObligationGetPayload<{
  select: typeof obligationSelect;
}>;
type BudgetQueryRecord = Prisma.FinanceBudgetGetPayload<{
  select: typeof budgetSelect;
}>;

export async function getFinanceWorkspaceData(
  session: AuthSession,
  options: FinanceDataOptions = {},
): Promise<FinanceWorkspaceData> {
  const permissions = {
    canManage: can(session.role, "finance:manage"),
    canPost: can(session.role, "finance:post"),
    canVoid: can(session.role, "finance:void"),
  };

  if (options.preview) {
    return createFinanceDemoData(permissions);
  }

  const now = new Date();
  const chartStart = startOfMonth(subMonths(now, 11));

  try {
    const [
      accounts,
      categories,
      recentTransactions,
      obligations,
      budgets,
      balanceRows,
      chartRows,
      agingRows,
      budgetActualRows,
    ] = await Promise.all([
      prisma.financeAccount.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: accountSelect,
        take: 100,
        where: { status: { not: "ARCHIVED" } },
      }),
      prisma.financeCategory.findMany({
        orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
        select: categorySelect,
        take: 250,
        where: { status: { not: "ARCHIVED" } },
      }),
      prisma.financeTransaction.findMany({
        orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }],
        select: transactionSelect,
        take: 160,
      }),
      prisma.financeObligation.findMany({
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        select: obligationSelect,
        take: 120,
        where: { status: { not: "CANCELLED" } },
      }),
      prisma.financeBudget.findMany({
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
        select: budgetSelect,
        take: 12,
      }),
      prisma.$queryRaw<BalanceRow[]>`
        select "accountId", coalesce(sum("delta"), 0)::text as "total"
        from (
          select
            "account_id" as "accountId",
            case when "type" = 'INCOME' then "amount" else -"amount" end as "delta"
          from public."finance_transactions"
          where "status" = 'POSTED'

          union all

          select
            "destination_account_id" as "accountId",
            "destination_amount" as "delta"
          from public."finance_transactions"
          where "status" = 'POSTED'
            and "type" = 'TRANSFER'
            and "destination_account_id" is not null
        ) ledger
        group by "accountId"
      `,
      prisma.$queryRaw<ChartRow[]>`
        select
          date_trunc('month', "effective_at") as "month",
          coalesce(sum("base_amount") filter (where "type" = 'INCOME'), 0)::text as "income",
          coalesce(sum("base_amount") filter (where "type" = 'EXPENSE'), 0)::text as "expense"
        from public."finance_transactions"
        where "status" = 'POSTED'
          and "base_currency" = ${FINANCE_BASE_CURRENCY}
          and "effective_at" >= ${chartStart}
        group by date_trunc('month', "effective_at")
        order by date_trunc('month', "effective_at") asc
      `,
      prisma.$queryRaw<AgingRow[]>`
        with settlement_totals as (
          select s."obligation_id", coalesce(sum(s."amount"), 0) as "paid"
          from public."finance_settlements" s
          join public."finance_transactions" t on t."id" = s."transaction_id"
          where t."status" = 'POSTED'
          group by s."obligation_id"
        ), open_obligations as (
          select
            o."type",
            greatest(o."amount" - coalesce(st."paid", 0), 0) * o."exchange_rate" as "outstanding_base",
            case
              when o."due_date" >= current_date then 'CURRENT'
              when current_date - o."due_date" <= 30 then 'DAYS_1_30'
              when current_date - o."due_date" <= 60 then 'DAYS_31_60'
              else 'DAYS_60_PLUS'
            end as "bucket"
          from public."finance_obligations" o
          left join settlement_totals st on st."obligation_id" = o."id"
          where o."status" not in ('PAID', 'CANCELLED')
            and o."base_currency" = ${FINANCE_BASE_CURRENCY}
        )
        select
          "type",
          "bucket",
          coalesce(sum("outstanding_base"), 0)::text as "amount",
          count(*) as "count"
        from open_obligations
        where "outstanding_base" > 0
        group by "type", "bucket"
      `,
      prisma.$queryRaw<BudgetActualRow[]>`
        select
          b."id" as "budgetId",
          bl."category_id" as "categoryId",
          coalesce(sum(
            case
              when t."currency" = b."currency" then t."amount"
              when t."base_currency" = b."currency" then t."base_amount"
              else 0
            end
          ), 0)::text as "actual"
        from public."finance_budgets" b
        join public."finance_budget_lines" bl on bl."budget_id" = b."id"
        left join public."finance_transactions" t
          on t."category_id" = bl."category_id"
          and t."type" = 'EXPENSE'
          and t."status" = 'POSTED'
          and t."effective_at" between b."start_date" and b."end_date"
          and (t."currency" = b."currency" or t."base_currency" = b."currency")
        group by b."id", bl."category_id"
      `,
    ]);

    const balanceByAccount = new Map(
      balanceRows.map((row) => [row.accountId, Number(row.total)]),
    );

    const mappedAccounts = accounts.map((account) => {
      const balance =
        Number(account.openingBalance) +
        (balanceByAccount.get(account.id) ?? 0);
      return {
        accountNumber: account.accountNumber ?? "",
        balance,
        bankName: account.bankName ?? "",
        baseBalance: balance * Number(account.exchangeRate),
        baseCurrency: account.baseCurrency,
        currency: account.currency,
        exchangeRate: Number(account.exchangeRate),
        id: account.id,
        name: account.name,
        openingBalance: Number(account.openingBalance),
        openingBalanceDate: toDateString(account.openingBalanceDate),
        status: account.status,
        type: account.type,
      };
    });

    const chart = buildChart(chartRows, now);
    const currentPoint = chart.at(-1) ?? { expense: 0, income: 0 };
    const previousPoint = chart.at(-2) ?? { expense: 0, income: 0 };
    const aging = buildAgingSummary(agingRows);
    const overdueCount = agingRows.reduce(
      (total, row) =>
        total +
        (row.type === "RECEIVABLE" && row.bucket !== "CURRENT"
          ? Number(row.count)
          : 0),
      0,
    );
    const overdueReceivables =
      aging.RECEIVABLE.DAYS_1_30 +
      aging.RECEIVABLE.DAYS_31_60 +
      aging.RECEIVABLE.DAYS_60_PLUS;

    return {
      ...permissions,
      accounts: mappedAccounts,
      aging,
      baseCurrency: FINANCE_BASE_CURRENCY,
      budgets: mapBudgets(budgets, budgetActualRows),
      categories: categories.map((category) => ({
        id: category.id,
        isSystem: category.isSystem,
        name: category.name,
        status: category.status,
        type: category.type,
      })),
      chart,
      isPreview: false,
      metrics: {
        expense: currentPoint.expense,
        expenseChange: getPercentChange(
          currentPoint.expense,
          previousPoint.expense,
        ),
        income: currentPoint.income,
        incomeChange: getPercentChange(
          currentPoint.income,
          previousPoint.income,
        ),
        netCashFlow: currentPoint.income - currentPoint.expense,
        overdueCount,
        overdueReceivables,
        totalBalance: mappedAccounts
          .filter((account) => account.status === "ACTIVE")
          .reduce((total, account) => total + account.baseBalance, 0),
      },
      obligations: obligations.map(mapObligation),
      transactions: recentTransactions.map(mapTransaction),
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `Finance data unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return createEmptyFinanceData(permissions);
  }
}

function buildChart(rows: ChartRow[], now: Date): FinanceChartPoint[] {
  const byMonth = new Map(
    rows.map((row) => [format(new Date(row.month), "yyyy-MM"), row]),
  );

  return Array.from({ length: 12 }, (_, index) => {
    const date = startOfMonth(subMonths(now, 11 - index));
    const month = format(date, "yyyy-MM");
    const row = byMonth.get(month);
    return {
      expense: Number(row?.expense ?? 0),
      income: Number(row?.income ?? 0),
      label: format(date, "MMM yy", { locale: az }).replace(".", ""),
      month,
    };
  });
}

function buildAgingSummary(rows: AgingRow[]): FinanceAgingSummary {
  const summary: FinanceAgingSummary = {
    PAYABLE: { CURRENT: 0, DAYS_1_30: 0, DAYS_31_60: 0, DAYS_60_PLUS: 0 },
    RECEIVABLE: { CURRENT: 0, DAYS_1_30: 0, DAYS_31_60: 0, DAYS_60_PLUS: 0 },
  };
  for (const row of rows) {
    summary[row.type][row.bucket] = Number(row.amount);
  }
  return summary;
}

function mapTransaction(
  transaction: TransactionQueryRecord,
): FinanceTransactionRecord {
  return {
    accountId: transaction.accountId,
    accountName: transaction.account.name,
    amount: Number(transaction.amount),
    baseAmount: Number(transaction.baseAmount),
    baseCurrency: transaction.baseCurrency,
    categoryId: transaction.category?.id ?? null,
    categoryName:
      transaction.category?.name ??
      (transaction.type === "TRANSFER" ? "Transfer" : "Kateqoriyasız"),
    code: transaction.code,
    counterpartyName: transaction.counterpartyName ?? "—",
    counterpartyType: transaction.counterpartyType,
    createdBy:
      transaction.createdBy?.name ?? transaction.createdBy?.email ?? "Sistem",
    currency: transaction.currency,
    description: transaction.description ?? "",
    destinationAccountId: transaction.destinationAccount?.id ?? null,
    destinationAccountName: transaction.destinationAccount?.name ?? "",
    destinationAmount:
      transaction.destinationAmount === null
        ? null
        : Number(transaction.destinationAmount),
    destinationCurrency: transaction.destinationCurrency,
    effectiveAt: toDateString(transaction.effectiveAt),
    exchangeRate: Number(transaction.exchangeRate),
    id: transaction.id,
    reference: transaction.reference ?? "",
    status: transaction.status,
    type: transaction.type,
    voidReason: transaction.voidReason ?? "",
  };
}

function mapObligation(
  obligation: ObligationQueryRecord,
): FinanceObligationRecord {
  const paidAmount = obligation.settlements.reduce(
    (total, settlement) =>
      total +
      (settlement.transaction.status === "POSTED"
        ? Number(settlement.amount)
        : 0),
    0,
  );
  const outstandingAmount = Math.max(0, Number(obligation.amount) - paidAmount);
  const daysOverdue = differenceInCalendarDays(new Date(), obligation.dueDate);
  return {
    agingBucket: getAgingBucket(daysOverdue),
    amount: Number(obligation.amount),
    baseAmount: Number(obligation.baseAmount),
    categoryId: obligation.category?.id ?? null,
    categoryName: obligation.category?.name ?? "Kateqoriyasız",
    code: obligation.code,
    counterpartyName: obligation.counterpartyName,
    counterpartyType: obligation.counterpartyType,
    currency: obligation.currency,
    description: obligation.description ?? "",
    dueDate: toDateString(obligation.dueDate),
    exchangeRate: Number(obligation.exchangeRate),
    id: obligation.id,
    isOverdue: daysOverdue > 0 && outstandingAmount > 0,
    issueDate: toDateString(obligation.issueDate),
    outstandingAmount,
    paidAmount,
    reference: obligation.reference ?? "",
    status: obligation.status,
    type: obligation.type,
  };
}

function mapBudgets(
  budgets: BudgetQueryRecord[],
  actualRows: BudgetActualRow[],
): FinanceBudgetRecord[] {
  const actualByLine = new Map(
    actualRows.map((row) => [
      `${row.budgetId}:${row.categoryId}`,
      Number(row.actual),
    ]),
  );
  return budgets.map((budget) => ({
    currency: budget.currency,
    endDate: toDateString(budget.endDate),
    id: budget.id,
    lines: budget.lines.map((line) => {
      const plannedAmount = Number(line.plannedAmount);
      const actualAmount =
        actualByLine.get(`${budget.id}:${line.categoryId}`) ?? 0;
      return {
        actualAmount,
        categoryId: line.categoryId,
        categoryName: line.category.name,
        id: line.id,
        plannedAmount,
        usagePercent:
          plannedAmount > 0 ? (actualAmount / plannedAmount) * 100 : 0,
      };
    }),
    name: budget.name,
    startDate: toDateString(budget.startDate),
    status: budget.status,
  }));
}

function createEmptyFinanceData(
  permissions: Pick<FinanceWorkspaceData, "canManage" | "canPost" | "canVoid">,
): FinanceWorkspaceData {
  return {
    ...permissions,
    accounts: [],
    aging: buildAgingSummary([]),
    baseCurrency: FINANCE_BASE_CURRENCY,
    budgets: [],
    categories: demoFinanceCategories,
    chart: buildChart([], new Date()),
    isPreview: false,
    metrics: {
      expense: 0,
      expenseChange: null,
      income: 0,
      incomeChange: null,
      netCashFlow: 0,
      overdueCount: 0,
      overdueReceivables: 0,
      totalBalance: 0,
    },
    obligations: [],
    transactions: [],
  };
}

function getAgingBucket(daysOverdue: number): FinanceAgingBucket {
  if (daysOverdue <= 0) return "CURRENT";
  if (daysOverdue <= 30) return "DAYS_1_30";
  if (daysOverdue <= 60) return "DAYS_31_60";
  return "DAYS_60_PLUS";
}

function getPercentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? null : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function toDateString(date: Date) {
  return format(date, "yyyy-MM-dd");
}
