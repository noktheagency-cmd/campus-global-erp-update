export type FinanceAccountType = "BANK" | "CASH" | "DIGITAL_WALLET";
export type FinanceAccountStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type FinanceCategoryType = "INCOME" | "EXPENSE";
export type FinanceTransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type FinanceTransactionStatus = "DRAFT" | "POSTED" | "VOID";
export type FinanceCounterpartyType =
  | "STUDENT"
  | "AGENT"
  | "UNIVERSITY"
  | "VENDOR"
  | "PARTNER"
  | "OTHER";
export type FinanceObligationType = "RECEIVABLE" | "PAYABLE";
export type FinanceObligationStatus =
  | "OPEN"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED";
export type FinanceBudgetStatus = "DRAFT" | "ACTIVE" | "CLOSED";
export type FinanceAgingBucket =
  | "CURRENT"
  | "DAYS_1_30"
  | "DAYS_31_60"
  | "DAYS_60_PLUS";

export type FinanceAccountRecord = {
  accountNumber: string;
  balance: number;
  bankName: string;
  baseBalance: number;
  baseCurrency: string;
  currency: string;
  exchangeRate: number;
  id: string;
  name: string;
  openingBalance: number;
  openingBalanceDate: string;
  status: FinanceAccountStatus;
  type: FinanceAccountType;
};

export type FinanceCategoryRecord = {
  id: string;
  isSystem: boolean;
  name: string;
  status: FinanceAccountStatus;
  type: FinanceCategoryType;
};

export type FinanceTransactionRecord = {
  accountId: string;
  accountName: string;
  amount: number;
  baseAmount: number;
  baseCurrency: string;
  categoryId: string | null;
  categoryName: string;
  code: string;
  counterpartyName: string;
  counterpartyType: FinanceCounterpartyType | null;
  createdBy: string;
  currency: string;
  description: string;
  destinationAccountId: string | null;
  destinationAccountName: string;
  destinationAmount: number | null;
  destinationCurrency: string | null;
  effectiveAt: string;
  exchangeRate: number;
  id: string;
  reference: string;
  status: FinanceTransactionStatus;
  type: FinanceTransactionType;
  voidReason: string;
};

export type FinanceObligationRecord = {
  agingBucket: FinanceAgingBucket;
  amount: number;
  baseAmount: number;
  categoryId: string | null;
  categoryName: string;
  code: string;
  counterpartyName: string;
  counterpartyType: FinanceCounterpartyType;
  currency: string;
  description: string;
  dueDate: string;
  exchangeRate: number;
  id: string;
  isOverdue: boolean;
  issueDate: string;
  outstandingAmount: number;
  paidAmount: number;
  reference: string;
  status: FinanceObligationStatus;
  type: FinanceObligationType;
};

export type FinanceBudgetLineRecord = {
  actualAmount: number;
  categoryId: string;
  categoryName: string;
  id: string;
  plannedAmount: number;
  usagePercent: number;
};

export type FinanceBudgetRecord = {
  currency: string;
  endDate: string;
  id: string;
  lines: FinanceBudgetLineRecord[];
  name: string;
  startDate: string;
  status: FinanceBudgetStatus;
};

export type FinanceChartPoint = {
  expense: number;
  income: number;
  label: string;
  month: string;
};

export type FinanceAgingSummary = Record<
  FinanceObligationType,
  Record<FinanceAgingBucket, number>
>;

export type FinanceWorkspaceData = {
  accounts: FinanceAccountRecord[];
  aging: FinanceAgingSummary;
  baseCurrency: string;
  budgets: FinanceBudgetRecord[];
  canManage: boolean;
  canPost: boolean;
  canVoid: boolean;
  categories: FinanceCategoryRecord[];
  chart: FinanceChartPoint[];
  isPreview: boolean;
  metrics: {
    expense: number;
    expenseChange: number | null;
    income: number;
    incomeChange: number | null;
    netCashFlow: number;
    overdueCount: number;
    overdueReceivables: number;
    totalBalance: number;
  };
  obligations: FinanceObligationRecord[];
  transactions: FinanceTransactionRecord[];
};
