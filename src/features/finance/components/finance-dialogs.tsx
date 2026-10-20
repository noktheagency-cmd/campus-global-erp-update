"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertTriangleIcon,
  ArrowDownLeftIcon,
  ArrowLeftRightIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  BadgeCheckIcon,
  InfoIcon,
  LandmarkIcon,
  LoaderCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createFinanceAccountAction,
  createFinanceBudgetAction,
  createFinanceCategoryAction,
  createFinanceObligationAction,
  createFinanceTransactionAction,
  postFinanceDraftAction,
  voidFinanceTransactionAction,
} from "@/features/finance/actions";
import {
  FINANCE_ACCOUNT_TYPE_LABELS,
  FINANCE_BASE_CURRENCY,
  FINANCE_COUNTERPARTY_LABELS,
  FINANCE_CURRENCIES,
} from "@/features/finance/constants";
import {
  formatFinanceMoney,
  getTodayInputValue,
} from "@/features/finance/format";
import type {
  FinanceObligationRecord,
  FinanceObligationType,
  FinanceTransactionRecord,
  FinanceTransactionType,
  FinanceWorkspaceData,
} from "@/features/finance/types";
import { cn } from "@/lib/utils";

export type FinanceDialogState =
  | { kind: "account" }
  | { kind: "budget" }
  | { kind: "category" }
  | { kind: "closed" }
  | { kind: "obligation"; obligationType: FinanceObligationType }
  | { kind: "post"; transaction: FinanceTransactionRecord }
  | { kind: "transaction"; obligation?: FinanceObligationRecord }
  | { kind: "void"; transaction: FinanceTransactionRecord };

const fieldClassName =
  "h-11 rounded-xl border-[#d8e2ee] bg-white text-sm text-[#263c65] placeholder:text-[#9aa7bb] focus-visible:border-[#6ca7ff] focus-visible:ring-[#dceaff]";
const selectClassName =
  "h-11 w-full rounded-xl border border-[#d8e2ee] bg-white px-3 text-sm text-[#263c65] outline-none transition focus:border-[#6ca7ff] focus:ring-2 focus:ring-[#dceaff]";

export function FinanceDialogs({
  data,
  onChange,
  state,
}: {
  data: FinanceWorkspaceData;
  onChange: (state: FinanceDialogState) => void;
  state: FinanceDialogState;
}) {
  return (
    <>
      <TransactionDialog
        data={data}
        key={
          state.kind === "transaction"
            ? (state.obligation?.id ?? "new")
            : "closed"
        }
        obligation={state.kind === "transaction" ? state.obligation : undefined}
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "transaction"}
      />
      <AccountDialog
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "account"}
      />
      <CategoryDialog
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "category"}
      />
      <ObligationDialog
        data={data}
        obligationType={
          state.kind === "obligation" ? state.obligationType : "RECEIVABLE"
        }
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "obligation"}
      />
      <BudgetDialog
        data={data}
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "budget"}
      />
      <VoidDialog
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "void"}
        transaction={state.kind === "void" ? state.transaction : null}
      />
      <PostDraftDialog
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "post"}
        transaction={state.kind === "post" ? state.transaction : null}
      />
    </>
  );
}

function TransactionDialog({
  data,
  obligation,
  onOpenChange,
  open,
}: {
  data: FinanceWorkspaceData;
  obligation?: FinanceObligationRecord;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const initialType: FinanceTransactionType = obligation
    ? obligation.type === "RECEIVABLE"
      ? "INCOME"
      : "EXPENSE"
    : "INCOME";
  const [type, setType] = useState<FinanceTransactionType>(initialType);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState(
    obligation ? String(obligation.outstandingAmount) : "",
  );
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const account = data.accounts.find((item) => item.id === accountId);
  const destinationAccount = data.accounts.find(
    (item) => item.id === destinationAccountId,
  );
  const categories = data.categories.filter(
    (category) =>
      category.status === "ACTIVE" &&
      category.type === (type === "INCOME" ? "INCOME" : "EXPENSE"),
  );
  const amountValue = Number(amount) || 0;
  const previewBalance = account
    ? account.balance + (type === "INCOME" ? amountValue : -amountValue)
    : 0;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="grid h-[min(860px,92svh)] w-[calc(100%-1.5rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-[1.5rem] border-[#d8e2ee] bg-white p-0 sm:w-full sm:max-w-3xl">
        <DialogHeader className="border-b border-[#e4ebf4] px-6 pb-5 pt-6 pr-14 text-left">
          <DialogTitle className="text-2xl font-bold tracking-[-0.02em] text-[#0b1f44]">
            {obligation ? "Ödənişi qeyd et" : "Yeni əməliyyat"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs leading-5 text-[#66789a]">
            {obligation
              ? `${obligation.code} üzrə açıq qalığı hesabla bağlayın`
              : "Maliyyə qeydini yaradın və hesab qalığını yeniləyin"}
          </DialogDescription>
        </DialogHeader>

        <form
          action={createFinanceTransactionAction}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#d7e2ef] bg-[#fbfcfe]">
              <TypeButton
                disabled={Boolean(obligation)}
                icon={ArrowDownLeftIcon}
                label="Gəlir"
                onClick={() => setType("INCOME")}
                selected={type === "INCOME"}
                tone="green"
              />
              <TypeButton
                disabled={Boolean(obligation)}
                icon={ArrowUpRightIcon}
                label="Xərc"
                onClick={() => setType("EXPENSE")}
                selected={type === "EXPENSE"}
                tone="red"
              />
              <TypeButton
                disabled={Boolean(obligation)}
                icon={ArrowLeftRightIcon}
                label="Transfer"
                onClick={() => setType("TRANSFER")}
                selected={type === "TRANSFER"}
                tone="blue"
              />
            </div>
            <input name="type" type="hidden" value={type} />
            {obligation ? (
              <input name="obligationId" type="hidden" value={obligation.id} />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Məbləğ">
                <Input
                  className={fieldClassName}
                  max="999999999999.99"
                  min="0.01"
                  name="amount"
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                  required
                  step="0.01"
                  type="number"
                  value={amount}
                />
              </Field>
              <Field label="Hesab">
                <select
                  className={selectClassName}
                  name="accountId"
                  onChange={(event) => setAccountId(event.target.value)}
                  required
                  value={accountId}
                >
                  <option value="">Hesab seçin</option>
                  {data.accounts
                    .filter(
                      (item) =>
                        item.status === "ACTIVE" &&
                        (!obligation || item.currency === obligation.currency),
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.currency}
                      </option>
                    ))}
                </select>
              </Field>
              {type === "TRANSFER" ? (
                <>
                  <Field label="Təyinat hesabı">
                    <select
                      className={selectClassName}
                      name="destinationAccountId"
                      onChange={(event) =>
                        setDestinationAccountId(event.target.value)
                      }
                      required
                      value={destinationAccountId}
                    >
                      <option value="">Hesab seçin</option>
                      {data.accounts
                        .filter(
                          (item) =>
                            item.status === "ACTIVE" && item.id !== accountId,
                        )
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} · {item.currency}
                          </option>
                        ))}
                    </select>
                  </Field>
                  {account &&
                  destinationAccount &&
                  account.currency !== destinationAccount.currency ? (
                    <Field
                      label={`Təyinat məbləği (${destinationAccount.currency})`}
                    >
                      <Input
                        className={fieldClassName}
                        min="0.01"
                        name="destinationAmount"
                        required
                        step="0.01"
                        type="number"
                      />
                    </Field>
                  ) : null}
                </>
              ) : (
                <Field label="Kateqoriya">
                  <select
                    className={selectClassName}
                    defaultValue={obligation?.categoryId ?? ""}
                    name="categoryId"
                    required
                  >
                    <option value="">Kateqoriya seçin</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Valyuta">
                <Input
                  className={fieldClassName}
                  disabled
                  readOnly
                  value={
                    account?.currency ??
                    obligation?.currency ??
                    "Hesabdan seçilir"
                  }
                />
              </Field>
              <Field label="Tarix">
                <Input
                  className={fieldClassName}
                  defaultValue={getTodayInputValue()}
                  name="effectiveAt"
                  required
                  type="date"
                />
              </Field>
              {account?.currency !== FINANCE_BASE_CURRENCY && account ? (
                <Field label={`1 ${account.currency} = AZN`}>
                  <Input
                    className={fieldClassName}
                    defaultValue={account.exchangeRate}
                    min="0.00000001"
                    name="exchangeRate"
                    required
                    step="0.00000001"
                    type="number"
                  />
                </Field>
              ) : (
                <input name="exchangeRate" type="hidden" value="1" />
              )}
              {type !== "TRANSFER" ? (
                <>
                  <Field label="Tərəf növü">
                    <select
                      className={selectClassName}
                      defaultValue={obligation?.counterpartyType ?? ""}
                      name="counterpartyType"
                    >
                      <option value="">Növ seçin</option>
                      {Object.entries(FINANCE_COUNTERPARTY_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                  <Field label="Tərəf">
                    <Input
                      className={fieldClassName}
                      defaultValue={obligation?.counterpartyName ?? ""}
                      name="counterpartyName"
                      placeholder="Şəxs və ya şirkət"
                    />
                  </Field>
                </>
              ) : null}
              <Field label="Referans">
                <Input
                  className={fieldClassName}
                  defaultValue={obligation?.reference ?? ""}
                  name="reference"
                  placeholder="Sənəd və ya invoice №"
                />
              </Field>
            </div>
            <Field label="Qeyd">
              <Textarea
                className="min-h-24 rounded-xl border-[#d8e2ee] text-sm"
                defaultValue={obligation?.description ?? ""}
                maxLength={300}
                name="description"
                placeholder="Əməliyyat haqqında əlavə qeyd..."
              />
            </Field>

            {account ? (
              <div className="rounded-xl border border-[#cdebdc] bg-[#f4fcf8] p-4">
                <p className="text-xs font-bold text-[#078454]">
                  Qalıq dəyişikliyi
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-white text-[#0b66ff] shadow-sm">
                    <LandmarkIcon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-[#18315d]">
                      {account.name}
                    </span>
                    <span className="block text-[10px] text-[#7586a4]">
                      {account.currency}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-[#52678e]">
                    {formatFinanceMoney(account.balance, account.currency)}
                  </span>
                  <ArrowRightIcon className="size-4 text-[#64789b]" />
                  <span
                    className={cn(
                      "text-xs font-bold",
                      type === "INCOME" ? "text-[#00a566]" : "text-[#e24149]",
                    )}
                  >
                    {formatFinanceMoney(previewBalance, account.currency)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#e2eaf3] bg-white px-6 pb-5 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {!obligation ? (
                <ActionSubmitButton
                  className="h-11 rounded-xl border-[#0b66ff] text-[#0b61eb]"
                  name="status"
                  value="DRAFT"
                  variant="outline"
                >
                  Qaralama saxla
                </ActionSubmitButton>
              ) : null}
              <ActionSubmitButton
                className={cn(
                  "h-11 rounded-xl bg-[#0b66ff] font-bold text-white shadow-[0_10px_24px_rgba(11,102,255,0.2)] hover:bg-[#0758dc]",
                  obligation && "sm:col-span-2",
                )}
                name="status"
                value="POSTED"
              >
                Əməliyyatı təsdiqlə
              </ActionSubmitButton>
            </div>
            <p className="mt-4 flex items-start gap-2 text-[11px] leading-4 text-[#6f809f]">
              <InfoIcon className="mt-0.5 size-3.5 shrink-0" /> Təsdiqlənmiş
              əməliyyat silinmir; yalnız ləğv qeydi ilə düzəldilir.
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AccountDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const today = getTodayInputValue();
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[92svh] overflow-y-auto rounded-[1.4rem] p-5 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0b1f44]">
            Yeni maliyyə hesabı
          </DialogTitle>
          <DialogDescription>
            Bank, kassa və ya rəqəmsal hesabın açılış qalığını qeyd edin.
          </DialogDescription>
        </DialogHeader>
        <form
          action={createFinanceAccountAction}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field className="sm:col-span-2" label="Hesab adı">
            <Input
              className={fieldClassName}
              name="name"
              placeholder="Məsələn: Kapital Bank AZN"
              required
            />
          </Field>
          <Field label="Hesab növü">
            <select className={selectClassName} defaultValue="BANK" name="type">
              {Object.entries(FINANCE_ACCOUNT_TYPE_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label="Valyuta">
            <select
              className={selectClassName}
              defaultValue="AZN"
              name="currency"
            >
              {FINANCE_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bank / provayder">
            <Input
              className={fieldClassName}
              name="bankName"
              placeholder="Məsələn: Kapital Bank"
            />
          </Field>
          <Field label="Hesab nömrəsi">
            <Input
              className={fieldClassName}
              name="accountNumber"
              placeholder="IBAN və ya maskalı nömrə"
            />
          </Field>
          <Field label="Açılış qalığı">
            <Input
              className={fieldClassName}
              defaultValue="0"
              name="openingBalance"
              step="0.01"
              type="number"
            />
          </Field>
          <Field label="Açılış tarixi">
            <Input
              className={fieldClassName}
              defaultValue={today}
              name="openingBalanceDate"
              required
              type="date"
            />
          </Field>
          <Field className="sm:col-span-2" label="AZN məzənnəsi">
            <Input
              className={fieldClassName}
              defaultValue="1"
              min="0.00000001"
              name="exchangeRate"
              required
              step="0.00000001"
              type="number"
            />
            <span className="mt-1 block text-[10px] text-[#7f8da8]">
              AZN hesabı üçün 1 saxlayın; xarici valyuta üçün cari hesabat
              məzənnəsini yazın.
            </span>
          </Field>
          <DialogFooter className="sm:col-span-2">
            <ActionSubmitButton className="bg-[#0b66ff] text-white hover:bg-[#0758dc]">
              Hesabı yarat
            </ActionSubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-[1.4rem] p-5 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0b1f44]">
            Yeni kateqoriya
          </DialogTitle>
          <DialogDescription>
            Əməliyyat və büdcə hesabatları üçün təsnifat yaradın.
          </DialogDescription>
        </DialogHeader>
        <form action={createFinanceCategoryAction} className="space-y-4">
          <Field label="Kateqoriya adı">
            <Input
              className={fieldClassName}
              name="name"
              placeholder="Məsələn: Tədbir xərcləri"
              required
            />
          </Field>
          <Field label="Növ">
            <select
              className={selectClassName}
              defaultValue="EXPENSE"
              name="type"
            >
              <option value="INCOME">Gəlir</option>
              <option value="EXPENSE">Xərc</option>
            </select>
          </Field>
          <DialogFooter>
            <ActionSubmitButton className="bg-[#0b66ff] text-white hover:bg-[#0758dc]">
              Kateqoriyanı yarat
            </ActionSubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ObligationDialog({
  data,
  obligationType,
  onOpenChange,
  open,
}: {
  data: FinanceWorkspaceData;
  obligationType: FinanceObligationType;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const today = getTodayInputValue();
  const categories = data.categories.filter(
    (category) =>
      category.type ===
        (obligationType === "RECEIVABLE" ? "INCOME" : "EXPENSE") &&
      category.status === "ACTIVE",
  );
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[92svh] overflow-y-auto rounded-[1.4rem] p-5 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0b1f44]">
            {obligationType === "RECEIVABLE"
              ? "Yeni debitor alacağı"
              : "Yeni kreditor öhdəliyi"}
          </DialogTitle>
          <DialogDescription>
            Sənəd məbləğini, tərəfi və son ödəniş tarixini qeyd edin.
          </DialogDescription>
        </DialogHeader>
        <form
          action={createFinanceObligationAction}
          className="grid gap-4 sm:grid-cols-2"
        >
          <input name="type" type="hidden" value={obligationType} />
          <Field label="Tərəf növü">
            <select
              className={selectClassName}
              defaultValue={
                obligationType === "RECEIVABLE" ? "PARTNER" : "VENDOR"
              }
              name="counterpartyType"
            >
              {Object.entries(FINANCE_COUNTERPARTY_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </Field>
          <Field label="Tərəf">
            <Input
              className={fieldClassName}
              name="counterpartyName"
              placeholder="Şəxs və ya şirkət"
              required
            />
          </Field>
          <Field label="Məbləğ">
            <Input
              className={fieldClassName}
              min="0.01"
              name="amount"
              required
              step="0.01"
              type="number"
            />
          </Field>
          <Field label="Valyuta">
            <select
              className={selectClassName}
              defaultValue="AZN"
              name="currency"
            >
              {FINANCE_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Baza məzənnəsi">
            <Input
              className={fieldClassName}
              defaultValue="1"
              min="0.00000001"
              name="exchangeRate"
              required
              step="0.00000001"
              type="number"
            />
          </Field>
          <Field label="Kateqoriya">
            <select className={selectClassName} name="categoryId">
              <option value="">Kateqoriya seçin</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sənəd tarixi">
            <Input
              className={fieldClassName}
              defaultValue={today}
              name="issueDate"
              required
              type="date"
            />
          </Field>
          <Field label="Son ödəniş tarixi">
            <Input
              className={fieldClassName}
              defaultValue={today}
              name="dueDate"
              required
              type="date"
            />
          </Field>
          <Field label="Referans">
            <Input
              className={fieldClassName}
              name="reference"
              placeholder="Invoice və ya müqavilə №"
            />
          </Field>
          <Field className="sm:col-span-2" label="Qeyd">
            <Textarea
              className="min-h-20 rounded-xl border-[#d8e2ee]"
              maxLength={300}
              name="description"
            />
          </Field>
          <DialogFooter className="sm:col-span-2">
            <ActionSubmitButton className="bg-[#0b66ff] text-white hover:bg-[#0758dc]">
              Sənədi yarat
            </ActionSubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BudgetDialog({
  data,
  onOpenChange,
  open,
}: {
  data: FinanceWorkspaceData;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const today = getTodayInputValue();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1, 0);
  const endDate = new Date(
    nextMonth.getTime() - nextMonth.getTimezoneOffset() * 60_000,
  )
    .toISOString()
    .slice(0, 10);
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-[1.4rem] p-5 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0b1f44]">
            Yeni büdcə
          </DialogTitle>
          <DialogDescription>
            İlk xərc limitini yaradın; əlavə kateqoriyalar sonradan
            genişləndirilə bilər.
          </DialogDescription>
        </DialogHeader>
        <form
          action={createFinanceBudgetAction}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field className="sm:col-span-2" label="Büdcə adı">
            <Input
              className={fieldClassName}
              name="name"
              placeholder="Məsələn: Avqust əməliyyat büdcəsi"
              required
            />
          </Field>
          <Field label="Başlanğıc">
            <Input
              className={fieldClassName}
              defaultValue={today}
              name="startDate"
              required
              type="date"
            />
          </Field>
          <Field label="Bitmə">
            <Input
              className={fieldClassName}
              defaultValue={endDate}
              name="endDate"
              required
              type="date"
            />
          </Field>
          <Field label="Kateqoriya">
            <select className={selectClassName} name="categoryId" required>
              <option value="">Xərc kateqoriyası</option>
              {data.categories
                .filter(
                  (category) =>
                    category.type === "EXPENSE" && category.status === "ACTIVE",
                )
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Plan məbləği">
            <Input
              className={fieldClassName}
              min="0.01"
              name="plannedAmount"
              required
              step="0.01"
              type="number"
            />
          </Field>
          <Field label="Valyuta">
            <select
              className={selectClassName}
              defaultValue="AZN"
              name="currency"
            >
              {FINANCE_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={selectClassName}
              defaultValue="ACTIVE"
              name="status"
            >
              <option value="ACTIVE">Aktiv</option>
              <option value="DRAFT">Qaralama</option>
            </select>
          </Field>
          <DialogFooter className="sm:col-span-2">
            <ActionSubmitButton className="bg-[#0b66ff] text-white hover:bg-[#0758dc]">
              Büdcəni yarat
            </ActionSubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VoidDialog({
  onOpenChange,
  open,
  transaction,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  transaction: FinanceTransactionRecord | null;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-[1.4rem] p-5 sm:max-w-md">
        <DialogHeader>
          <span className="flex size-10 items-center justify-center rounded-full bg-[#fff0f1] text-[#d83a42]">
            <AlertTriangleIcon className="size-5" />
          </span>
          <DialogTitle className="text-xl font-bold text-[#0b1f44]">
            Əməliyyatı ləğv et
          </DialogTitle>
          <DialogDescription>
            {transaction?.code} qeydinin hesab təsiri geri alınacaq. Audit izi
            saxlanılacaq.
          </DialogDescription>
        </DialogHeader>
        <form action={voidFinanceTransactionAction} className="space-y-4">
          <input
            name="transactionId"
            type="hidden"
            value={transaction?.id ?? ""}
          />
          <Field label="Ləğv səbəbi">
            <Textarea
              className="min-h-24 rounded-xl border-[#d8e2ee]"
              maxLength={240}
              name="reason"
              placeholder="Səbəbi aydın şəkildə qeyd edin"
              required
            />
          </Field>
          <DialogFooter>
            <ActionSubmitButton className="bg-[#d83a42] text-white hover:bg-[#bd2931]">
              Ləğvi təsdiqlə
            </ActionSubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PostDraftDialog({
  onOpenChange,
  open,
  transaction,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  transaction: FinanceTransactionRecord | null;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[calc(100%-1.5rem)] rounded-[1.4rem] p-5 sm:max-w-md">
        <DialogHeader className="text-left">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#eaf2ff] text-[#0b66ff]">
            <BadgeCheckIcon className="size-5" />
          </span>
          <DialogTitle className="text-xl font-bold text-[#0b1f44]">
            Qaralamanı təsdiqlə
          </DialogTitle>
          <DialogDescription>
            {transaction?.code} əməliyyatı hesablara tətbiq ediləcək və sonradan
            yalnız ləğv qeydi ilə geri alına biləcək.
          </DialogDescription>
        </DialogHeader>
        <form action={postFinanceDraftAction}>
          <input
            name="transactionId"
            type="hidden"
            value={transaction?.id ?? ""}
          />
          <DialogFooter>
            <ActionSubmitButton className="bg-[#0b66ff] text-white hover:bg-[#0758dc]">
              Təsdiqlə və hesablara tətbiq et
            </ActionSubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TypeButton({
  disabled,
  icon: Icon,
  label,
  onClick,
  selected,
  tone,
}: {
  disabled: boolean;
  icon: typeof ArrowDownLeftIcon;
  label: string;
  onClick: () => void;
  selected: boolean;
  tone: "blue" | "green" | "red";
}) {
  return (
    <button
      className={cn(
        "flex h-12 items-center justify-center gap-2 border-r border-[#e1e8f1] text-xs font-bold transition last:border-r-0",
        selected
          ? "bg-white text-[#122a53] shadow-[inset_0_0_0_1px_#b9d3ff]"
          : "text-[#64769a] hover:bg-white",
        disabled && "cursor-default opacity-80",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon
        className={cn(
          "size-4",
          tone === "green" && "text-[#00a566]",
          tone === "red" && "text-[#ef4048]",
          tone === "blue" && "text-[#0b66ff]",
        )}
      />
      {label}
    </button>
  );
}

function Field({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-1.5 block text-xs font-bold text-[#52678d]">
        {label}
      </span>
      {children}
    </label>
  );
}

function ActionSubmitButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button
      className={className}
      disabled={pending || props.disabled}
      type="submit"
      {...props}
    >
      {pending ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
