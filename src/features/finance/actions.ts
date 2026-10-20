"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { FINANCE_BASE_CURRENCY } from "@/features/finance/constants";
import {
  financeAccountSchema,
  financeBudgetSchema,
  financeCategorySchema,
  financeExchangeRateSchema,
  financeObligationSchema,
  financePostSchema,
  financeTransactionSchema,
  financeVoidSchema,
} from "@/features/finance/schemas";
import type { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function createFinanceAccountAction(formData: FormData) {
  const session = await requirePermission("finance:manage");
  const parsed = financeAccountSchema.safeParse({
    accountNumber: getString(formData, "accountNumber"),
    bankName: getString(formData, "bankName"),
    currency: getString(formData, "currency"),
    exchangeRate: getString(formData, "exchangeRate") || "1",
    name: getString(formData, "name"),
    openingBalance: getString(formData, "openingBalance") || "0",
    openingBalanceDate: getString(formData, "openingBalanceDate"),
    type: getString(formData, "type"),
  });

  if (!parsed.success) {
    redirectWithError("account-validation");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const account = await tx.financeAccount.create({
        data: {
          accountNumber: parsed.data.accountNumber,
          bankName: parsed.data.bankName,
          baseCurrency: FINANCE_BASE_CURRENCY,
          createdById: session.userId,
          currency: parsed.data.currency,
          exchangeRate:
            parsed.data.currency === FINANCE_BASE_CURRENCY
              ? 1
              : parsed.data.exchangeRate,
          name: parsed.data.name,
          openingBalance: parsed.data.openingBalance,
          openingBalanceDate: parsed.data.openingBalanceDate,
          type: parsed.data.type,
        },
      });

      await createFinanceAudit(tx, {
        action: "CREATED",
        entityId: account.id,
        entityType: "ACCOUNT",
        newValue: {
          currency: account.currency,
          name: account.name,
          openingBalance: account.openingBalance.toString(),
          type: account.type,
        },
        userId: session.userId,
      });
    });
  } catch {
    redirectWithError("account-create-failed");
  }

  revalidateFinance();
  redirect("/finance?success=account-created");
}

export async function createFinanceCategoryAction(formData: FormData) {
  const session = await requirePermission("finance:manage");
  const parsed = financeCategorySchema.safeParse({
    name: getString(formData, "name"),
    type: getString(formData, "type"),
  });

  if (!parsed.success) {
    redirectWithError("category-validation");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const category = await tx.financeCategory.create({
        data: {
          createdById: session.userId,
          name: parsed.data.name,
          type: parsed.data.type,
        },
      });
      await createFinanceAudit(tx, {
        action: "CREATED",
        entityId: category.id,
        entityType: "CATEGORY",
        newValue: { name: category.name, type: category.type },
        userId: session.userId,
      });
    });
  } catch {
    redirectWithError("category-create-failed");
  }

  revalidateFinance();
  redirect("/finance?success=category-created");
}

export async function createFinanceTransactionAction(formData: FormData) {
  const session = await requirePermission("finance:post");
  const parsed = financeTransactionSchema.safeParse({
    accountId: getString(formData, "accountId"),
    amount: getString(formData, "amount"),
    categoryId: getString(formData, "categoryId"),
    counterpartyName: getString(formData, "counterpartyName"),
    counterpartyType: getString(formData, "counterpartyType") || undefined,
    description: getString(formData, "description"),
    destinationAccountId: getString(formData, "destinationAccountId"),
    destinationAmount: getString(formData, "destinationAmount"),
    effectiveAt: getString(formData, "effectiveAt"),
    exchangeRate: getString(formData, "exchangeRate") || "1",
    obligationId: getString(formData, "obligationId"),
    reference: getString(formData, "reference"),
    status: getString(formData, "status") || "POSTED",
    type: getString(formData, "type"),
  });

  if (!parsed.success) {
    redirectWithError("transaction-validation");
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        if (parsed.data.obligationId) {
          await tx.$queryRaw<Array<{ id: string }>>`
          select "id"
          from public."finance_obligations"
          where "id" = ${parsed.data.obligationId}
          for update
        `;
        }
        const account = await tx.financeAccount.findFirst({
          select: { currency: true, id: true, status: true },
          where: { id: parsed.data.accountId, status: "ACTIVE" },
        });
        const destinationAccount = parsed.data.destinationAccountId
          ? await tx.financeAccount.findFirst({
              select: { currency: true, id: true, status: true },
              where: {
                id: parsed.data.destinationAccountId,
                status: "ACTIVE",
              },
            })
          : null;
        const category = parsed.data.categoryId
          ? await tx.financeCategory.findFirst({
              select: { id: true, status: true, type: true },
              where: { id: parsed.data.categoryId, status: "ACTIVE" },
            })
          : null;
        const obligation = parsed.data.obligationId
          ? await tx.financeObligation.findFirst({
              include: {
                settlements: {
                  select: {
                    amount: true,
                    transaction: { select: { status: true } },
                  },
                },
              },
              where: {
                id: parsed.data.obligationId,
                status: { in: ["OPEN", "PARTIALLY_PAID"] },
              },
            })
          : null;

        if (!account) {
          throw new FinanceActionError("account-not-found");
        }
        if (parsed.data.type === "TRANSFER" && !destinationAccount) {
          throw new FinanceActionError("destination-account-not-found");
        }
        if (parsed.data.type !== "TRANSFER") {
          const expectedCategoryType =
            parsed.data.type === "INCOME" ? "INCOME" : "EXPENSE";
          if (!category || category.type !== expectedCategoryType) {
            throw new FinanceActionError("category-mismatch");
          }
        }
        if (parsed.data.obligationId && !obligation) {
          throw new FinanceActionError("obligation-not-found");
        }
        if (obligation) {
          const expectedType =
            obligation.type === "RECEIVABLE" ? "INCOME" : "EXPENSE";
          if (
            parsed.data.type !== expectedType ||
            obligation.currency !== account.currency
          ) {
            throw new FinanceActionError("obligation-transaction-mismatch");
          }
        }

        const destinationAmount =
          parsed.data.type === "TRANSFER"
            ? account.currency === destinationAccount?.currency
              ? parsed.data.amount
              : parsed.data.destinationAmount
            : undefined;
        if (parsed.data.type === "TRANSFER" && !destinationAmount) {
          throw new FinanceActionError("destination-amount-required");
        }

        const exchangeRate =
          account.currency === FINANCE_BASE_CURRENCY
            ? 1
            : parsed.data.exchangeRate;
        const baseAmount = roundMoney(parsed.data.amount * exchangeRate);
        const now = new Date();
        const transaction = await tx.financeTransaction.create({
          data: {
            accountId: account.id,
            amount: parsed.data.amount,
            baseAmount,
            baseCurrency: FINANCE_BASE_CURRENCY,
            categoryId: parsed.data.type === "TRANSFER" ? null : category?.id,
            code: createFinanceCode("FIN"),
            counterpartyName: parsed.data.counterpartyName,
            counterpartyType: parsed.data.counterpartyType,
            createdById: session.userId,
            currency: account.currency,
            description: parsed.data.description,
            destinationAccountId:
              parsed.data.type === "TRANSFER" ? destinationAccount?.id : null,
            destinationAmount,
            destinationCurrency:
              parsed.data.type === "TRANSFER"
                ? destinationAccount?.currency
                : null,
            effectiveAt: parsed.data.effectiveAt,
            exchangeRate,
            postedAt: parsed.data.status === "POSTED" ? now : null,
            postedById: parsed.data.status === "POSTED" ? session.userId : null,
            reference: parsed.data.reference,
            status: parsed.data.status,
            type: parsed.data.type,
          },
        });

        if (obligation && parsed.data.status === "POSTED") {
          const paidBefore = obligation.settlements.reduce(
            (total, settlement) =>
              total +
              (settlement.transaction.status === "POSTED"
                ? Number(settlement.amount)
                : 0),
            0,
          );
          const nextPaid = paidBefore + parsed.data.amount;
          if (nextPaid > Number(obligation.amount) + 0.005) {
            throw new FinanceActionError("settlement-exceeds-outstanding");
          }
          await tx.financeSettlement.create({
            data: {
              amount: parsed.data.amount,
              obligationId: obligation.id,
              transactionId: transaction.id,
            },
          });
          const obligationStatus =
            nextPaid >= Number(obligation.amount) - 0.005
              ? "PAID"
              : "PARTIALLY_PAID";
          await tx.financeObligation.update({
            data: {
              status: obligationStatus,
            },
            where: { id: obligation.id },
          });
          if (
            obligation.type === "PAYABLE" &&
            obligation.relatedEntityType === "COMMISSION_CALCULATION" &&
            obligation.relatedEntityId
          ) {
            const calculation = await tx.commissionCalculation.findFirst({
              select: { agentId: true, code: true, id: true, status: true },
              where: {
                agentPayableId: obligation.id,
                id: obligation.relatedEntityId,
                status: { in: ["PAYABLE", "PARTIALLY_PAID"] },
              },
            });
            if (calculation) {
              const commissionStatus =
                obligationStatus === "PAID" ? "PAID" : "PARTIALLY_PAID";
              await tx.commissionCalculation.update({
                data: { status: commissionStatus },
                where: { id: calculation.id },
              });
              await tx.agent.update({
                data: {
                  commissionBalance: {
                    decrement: roundMoney(
                      parsed.data.amount * Number(obligation.exchangeRate),
                    ),
                  },
                },
                where: { id: calculation.agentId },
              });
              await tx.commissionAuditLog.create({
                data: {
                  action: commissionStatus === "PAID" ? "PAID" : "UPDATED",
                  entityId: calculation.id,
                  entityType: "CALCULATION",
                  newValue: {
                    code: calculation.code,
                    paidAmount: roundMoney(nextPaid),
                    status: commissionStatus,
                    transactionId: transaction.id,
                  },
                  oldValue: { status: calculation.status },
                  userId: session.userId,
                },
              });
            }
          }
          await createFinanceAudit(tx, {
            action: "SETTLED",
            entityId: obligation.id,
            entityType: "OBLIGATION",
            newValue: {
              paidAmount: roundMoney(nextPaid),
              status: obligationStatus,
              transactionId: transaction.id,
            },
            oldValue: {
              paidAmount: roundMoney(paidBefore),
              status: obligation.status,
            },
            userId: session.userId,
          });
        }

        await createFinanceAudit(tx, {
          action: parsed.data.status === "POSTED" ? "POSTED" : "CREATED",
          entityId: transaction.id,
          entityType: "TRANSACTION",
          newValue: {
            amount: transaction.amount.toString(),
            code: transaction.code,
            currency: transaction.currency,
            status: transaction.status,
            type: transaction.type,
          },
          userId: session.userId,
        });
      },
      { timeout: 30000 },
    );
  } catch (error) {
    console.error("Finance transaction creation failed", error);
    redirectWithError(
      error instanceof FinanceActionError
        ? error.message
        : "transaction-create-failed",
    );
  }

  revalidateFinance();
  redirect("/finance?success=transaction-created");
}

export async function createFinanceObligationAction(formData: FormData) {
  const session = await requirePermission("finance:manage");
  const parsed = financeObligationSchema.safeParse({
    amount: getString(formData, "amount"),
    categoryId: getString(formData, "categoryId"),
    counterpartyName: getString(formData, "counterpartyName"),
    counterpartyType: getString(formData, "counterpartyType"),
    currency: getString(formData, "currency"),
    description: getString(formData, "description"),
    dueDate: getString(formData, "dueDate"),
    exchangeRate: getString(formData, "exchangeRate") || "1",
    issueDate: getString(formData, "issueDate"),
    reference: getString(formData, "reference"),
    type: getString(formData, "type"),
  });

  if (!parsed.success) {
    redirectWithError("obligation-validation");
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (parsed.data.categoryId) {
        const category = await tx.financeCategory.findFirst({
          select: { type: true },
          where: { id: parsed.data.categoryId, status: "ACTIVE" },
        });
        const expectedType =
          parsed.data.type === "RECEIVABLE" ? "INCOME" : "EXPENSE";
        if (!category || category.type !== expectedType) {
          throw new FinanceActionError("category-mismatch");
        }
      }

      const exchangeRate =
        parsed.data.currency === FINANCE_BASE_CURRENCY
          ? 1
          : parsed.data.exchangeRate;
      const obligation = await tx.financeObligation.create({
        data: {
          amount: parsed.data.amount,
          baseAmount: roundMoney(parsed.data.amount * exchangeRate),
          baseCurrency: FINANCE_BASE_CURRENCY,
          categoryId: parsed.data.categoryId,
          code: createFinanceCode(
            parsed.data.type === "RECEIVABLE" ? "DBT" : "KRD",
          ),
          counterpartyName: parsed.data.counterpartyName,
          counterpartyType: parsed.data.counterpartyType,
          createdById: session.userId,
          currency: parsed.data.currency,
          description: parsed.data.description,
          dueDate: parsed.data.dueDate,
          exchangeRate,
          issueDate: parsed.data.issueDate,
          reference: parsed.data.reference,
          type: parsed.data.type,
        },
      });

      await createFinanceAudit(tx, {
        action: "CREATED",
        entityId: obligation.id,
        entityType: "OBLIGATION",
        newValue: {
          amount: obligation.amount.toString(),
          code: obligation.code,
          currency: obligation.currency,
          type: obligation.type,
        },
        userId: session.userId,
      });
    });
  } catch (error) {
    redirectWithError(
      error instanceof FinanceActionError
        ? error.message
        : "obligation-create-failed",
    );
  }

  revalidateFinance();
  redirect("/finance?success=obligation-created");
}

export async function createFinanceBudgetAction(formData: FormData) {
  const session = await requirePermission("finance:manage");
  const parsed = financeBudgetSchema.safeParse({
    categoryId: getString(formData, "categoryId"),
    currency: getString(formData, "currency"),
    endDate: getString(formData, "endDate"),
    name: getString(formData, "name"),
    plannedAmount: getString(formData, "plannedAmount"),
    startDate: getString(formData, "startDate"),
    status: getString(formData, "status") || "ACTIVE",
  });

  if (!parsed.success) {
    redirectWithError("budget-validation");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const category = await tx.financeCategory.findFirst({
        select: { id: true, type: true },
        where: { id: parsed.data.categoryId, status: "ACTIVE" },
      });
      if (!category || category.type !== "EXPENSE") {
        throw new FinanceActionError("budget-category-mismatch");
      }
      const budget = await tx.financeBudget.create({
        data: {
          createdById: session.userId,
          currency: parsed.data.currency,
          endDate: parsed.data.endDate,
          lines: {
            create: {
              categoryId: category.id,
              plannedAmount: parsed.data.plannedAmount,
            },
          },
          name: parsed.data.name,
          startDate: parsed.data.startDate,
          status: parsed.data.status,
        },
      });
      await createFinanceAudit(tx, {
        action: "CREATED",
        entityId: budget.id,
        entityType: "BUDGET",
        newValue: {
          currency: budget.currency,
          name: budget.name,
          status: budget.status,
        },
        userId: session.userId,
      });
    });
  } catch (error) {
    redirectWithError(
      error instanceof FinanceActionError
        ? error.message
        : "budget-create-failed",
    );
  }

  revalidateFinance();
  redirect("/finance?success=budget-created");
}

export async function postFinanceDraftAction(formData: FormData) {
  const session = await requirePermission("finance:post");
  const parsed = financePostSchema.safeParse({
    transactionId: getString(formData, "transactionId"),
  });
  if (!parsed.success) {
    redirectWithError("post-validation");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.financeTransaction.findFirst({
        select: {
          account: { select: { status: true } },
          category: { select: { status: true, type: true } },
          destinationAccount: { select: { status: true } },
          id: true,
          type: true,
        },
        where: { id: parsed.data.transactionId, status: "DRAFT" },
      });
      if (!existing) {
        throw new FinanceActionError("transaction-not-postable");
      }
      if (existing.account.status !== "ACTIVE") {
        throw new FinanceActionError("account-not-found");
      }
      if (
        existing.type === "TRANSFER" &&
        existing.destinationAccount?.status !== "ACTIVE"
      ) {
        throw new FinanceActionError("destination-account-not-found");
      }
      if (existing.type !== "TRANSFER") {
        const expectedCategoryType =
          existing.type === "INCOME" ? "INCOME" : "EXPENSE";
        if (
          existing.category?.status !== "ACTIVE" ||
          existing.category.type !== expectedCategoryType
        ) {
          throw new FinanceActionError("category-mismatch");
        }
      }

      await tx.financeTransaction.update({
        data: {
          postedAt: new Date(),
          postedById: session.userId,
          status: "POSTED",
        },
        where: { id: existing.id },
      });
      await createFinanceAudit(tx, {
        action: "POSTED",
        entityId: existing.id,
        entityType: "TRANSACTION",
        newValue: { status: "POSTED" },
        oldValue: { status: "DRAFT" },
        userId: session.userId,
      });
    });
  } catch (error) {
    redirectWithError(
      error instanceof FinanceActionError ? error.message : "post-failed",
    );
  }

  revalidateFinance();
  redirect("/finance?success=transaction-posted");
}

export async function voidFinanceTransactionAction(formData: FormData) {
  const session = await requirePermission("finance:void");
  const parsed = financeVoidSchema.safeParse({
    reason: getString(formData, "reason"),
    transactionId: getString(formData, "transactionId"),
  });
  if (!parsed.success) {
    redirectWithError("void-validation");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.financeTransaction.findFirst({
        include: {
          settlements: { select: { amount: true, obligationId: true } },
        },
        where: { id: parsed.data.transactionId, status: "POSTED" },
      });
      if (!existing) {
        throw new FinanceActionError("transaction-not-voidable");
      }
      await tx.financeTransaction.update({
        data: {
          status: "VOID",
          voidReason: parsed.data.reason,
          voidedAt: new Date(),
          voidedById: session.userId,
        },
        where: { id: existing.id },
      });

      const obligationIds = [
        ...new Set(existing.settlements.map((item) => item.obligationId)),
      ];
      if (obligationIds.length > 0) {
        const [affectedObligations, remainingSettlements] = await Promise.all([
          tx.financeObligation.findMany({
            select: {
              amount: true,
              exchangeRate: true,
              id: true,
              relatedEntityId: true,
              relatedEntityType: true,
              status: true,
              type: true,
            },
            where: { id: { in: obligationIds } },
          }),
          tx.financeSettlement.findMany({
            select: { amount: true, obligationId: true },
            where: {
              obligationId: { in: obligationIds },
              transaction: { status: "POSTED" },
            },
          }),
        ]);
        const paidByObligation = new Map<string, number>();
        for (const settlement of remainingSettlements) {
          paidByObligation.set(
            settlement.obligationId,
            (paidByObligation.get(settlement.obligationId) ?? 0) +
              Number(settlement.amount),
          );
        }
        await Promise.all(
          affectedObligations.map(async (obligation) => {
            const paid = paidByObligation.get(obligation.id) ?? 0;
            const nextStatus =
              paid <= 0.005
                ? "OPEN"
                : paid >= Number(obligation.amount) - 0.005
                  ? "PAID"
                  : "PARTIALLY_PAID";
            await tx.financeObligation.update({
              data: {
                status: nextStatus,
              },
              where: { id: obligation.id },
            });
            if (
              obligation.type === "PAYABLE" &&
              obligation.relatedEntityType === "COMMISSION_CALCULATION" &&
              obligation.relatedEntityId
            ) {
              const calculation = await tx.commissionCalculation.findFirst({
                select: { agentId: true, code: true, id: true, status: true },
                where: {
                  agentPayableId: obligation.id,
                  id: obligation.relatedEntityId,
                },
              });
              const reversedAmount = existing.settlements
                .filter(
                  (settlement) => settlement.obligationId === obligation.id,
                )
                .reduce(
                  (total, settlement) => total + Number(settlement.amount),
                  0,
                );
              if (calculation) {
                const commissionStatus =
                  nextStatus === "PAID"
                    ? "PAID"
                    : nextStatus === "PARTIALLY_PAID"
                      ? "PARTIALLY_PAID"
                      : "PAYABLE";
                await Promise.all([
                  tx.commissionCalculation.update({
                    data: { status: commissionStatus },
                    where: { id: calculation.id },
                  }),
                  reversedAmount > 0
                    ? tx.agent.update({
                        data: {
                          commissionBalance: {
                            increment: roundMoney(
                              reversedAmount * Number(obligation.exchangeRate),
                            ),
                          },
                        },
                        where: { id: calculation.agentId },
                      })
                    : Promise.resolve(null),
                  tx.commissionAuditLog.create({
                    data: {
                      action: "UPDATED",
                      entityId: calculation.id,
                      entityType: "CALCULATION",
                      newValue: {
                        code: calculation.code,
                        paidAmount: roundMoney(paid),
                        status: commissionStatus,
                        voidedTransactionId: existing.id,
                      },
                      oldValue: { status: calculation.status },
                      userId: session.userId,
                    },
                  }),
                ]);
              }
            }
            await createFinanceAudit(tx, {
              action: "UPDATED",
              entityId: obligation.id,
              entityType: "OBLIGATION",
              newValue: {
                paidAmount: roundMoney(paid),
                status: nextStatus,
                voidedTransactionId: existing.id,
              },
              oldValue: { status: obligation.status },
              userId: session.userId,
            });
          }),
        );
      }

      await createFinanceAudit(tx, {
        action: "VOIDED",
        entityId: existing.id,
        entityType: "TRANSACTION",
        newValue: { reason: parsed.data.reason, status: "VOID" },
        oldValue: { status: "POSTED" },
        userId: session.userId,
      });
    });
  } catch (error) {
    redirectWithError(
      error instanceof FinanceActionError ? error.message : "void-failed",
    );
  }

  revalidateFinance();
  redirect("/finance?success=transaction-voided");
}

export async function updateFinanceExchangeRateAction(formData: FormData) {
  const session = await requirePermission("finance:manage");
  const parsed = financeExchangeRateSchema.safeParse({
    accountId: getString(formData, "accountId"),
    exchangeRate: getString(formData, "exchangeRate"),
  });
  if (!parsed.success) {
    redirectWithError("exchange-rate-validation");
  }
  try {
    await prisma.$transaction(async (tx) => {
      const account = await tx.financeAccount.findFirst({
        select: { currency: true, exchangeRate: true, id: true },
        where: { id: parsed.data.accountId, status: "ACTIVE" },
      });
      if (!account) {
        throw new FinanceActionError("account-not-found");
      }

      const nextExchangeRate =
        account.currency === FINANCE_BASE_CURRENCY
          ? 1
          : parsed.data.exchangeRate;
      await tx.financeAccount.update({
        data: { exchangeRate: nextExchangeRate },
        where: { id: account.id },
      });
      await createFinanceAudit(tx, {
        action: "UPDATED",
        entityId: account.id,
        entityType: "ACCOUNT",
        newValue: { exchangeRate: nextExchangeRate },
        oldValue: { exchangeRate: account.exchangeRate.toString() },
        userId: session.userId,
      });
    });
  } catch (error) {
    redirectWithError(
      error instanceof FinanceActionError
        ? error.message
        : "exchange-rate-update-failed",
    );
  }
  revalidateFinance();
  redirect("/finance?success=exchange-rate-updated");
}

async function createFinanceAudit(
  tx: Prisma.TransactionClient,
  input: {
    action: "CREATED" | "POSTED" | "SETTLED" | "UPDATED" | "VOIDED";
    entityId: string;
    entityType:
      | "ACCOUNT"
      | "BUDGET"
      | "CATEGORY"
      | "OBLIGATION"
      | "TRANSACTION";
    newValue?: Prisma.InputJsonValue;
    oldValue?: Prisma.InputJsonValue;
    userId: string;
  },
) {
  await tx.financeAuditLog.create({
    data: {
      action: input.action,
      entityId: input.entityId,
      entityType: input.entityType,
      newValue: input.newValue,
      oldValue: input.oldValue,
      userId: input.userId,
    },
  });
}

function createFinanceCode(prefix: "DBT" | "FIN" | "KRD") {
  const now = new Date();
  const date = [
    String(now.getUTCFullYear()).slice(-2),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");
  return `${prefix}-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateFinance() {
  revalidatePath("/finance");
  revalidatePath("/az/finance");
  revalidatePath("/commissions");
  revalidatePath("/az/commissions");
}

function redirectWithError(code: string): never {
  redirect(`/finance?error=${encodeURIComponent(code)}`);
}

class FinanceActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FinanceActionError";
  }
}
