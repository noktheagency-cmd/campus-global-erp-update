"use server";

import { randomBytes, randomInt } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  agentPriceProposalSchema,
  agentPriceSchema,
  documentOrderCreateSchema,
  documentOrderManagerSchema,
  documentOrderPaymentSchema,
  documentOrderStatusSchema,
  serviceMutationSchema,
  serviceOrderSchema,
  serviceOrderUpdateSchema,
  serviceQuoteCreateSchema,
  serviceQuoteDecisionSchema,
  serviceQuoteOfferSchema,
  serviceQuoteRejectSchema,
} from "@/features/services/schemas";
import type { Prisma } from "@/generated/prisma/client";
import type { DocumentOrderStatus } from "@/features/services/types";
import {
  getSessionAgentId,
  getSessionStudentId,
  requirePermission,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function createServiceAction(formData: FormData) {
  const session = await requirePermission("services:manage");
  const parsed = serviceMutationSchema.safeParse(readServiceForm(formData));

  if (!parsed.success) {
    redirectWithError("service-validation");
  }

  await prisma.$transaction(async (tx) => {
    const service = await tx.service.create({
      data: {
        availableToAgents: parsed.data.availableToAgents,
        availableToStudents: parsed.data.availableToStudents,
        createdById: session.userId,
        description: emptyToNull(parsed.data.description),
        name: parsed.data.name,
        sortOrder: parsed.data.sortOrder,
        status: parsed.data.status,
      },
    });

    await createBasePrices(tx, {
      agentAmount: parsed.data.agentBasePrice,
      availableToAgents: parsed.data.availableToAgents,
      availableToStudents: parsed.data.availableToStudents,
      createdById: session.userId,
      currency: parsed.data.currency,
      serviceId: service.id,
      studentAmount: parsed.data.studentPrice,
    });
  });

  revalidateServices();
  redirect("/services?success=service-created");
}

export async function updateServiceAction(formData: FormData) {
  const session = await requirePermission("services:manage");
  const serviceId = getString(formData, "serviceId");
  const parsed = serviceMutationSchema.safeParse(readServiceForm(formData));

  if (!serviceId || !parsed.success) {
    redirectWithError("service-validation");
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.service.findUnique({
      select: { id: true },
      where: { id: serviceId },
    });

    if (!existing) {
      throw new Error("Service not found.");
    }

    await tx.service.update({
      data: {
        availableToAgents: parsed.data.availableToAgents,
        availableToStudents: parsed.data.availableToStudents,
        description: emptyToNull(parsed.data.description),
        name: parsed.data.name,
        sortOrder: parsed.data.sortOrder,
        status: parsed.data.status,
      },
      where: { id: serviceId },
    });

    await deactivatePrices(tx, {
      audience: "AGENT",
      serviceId,
      ...(parsed.data.availableToAgents ? { agentId: null } : {}),
    });
    await deactivatePrices(tx, {
      audience: "STUDENT",
      serviceId,
    });

    if (!parsed.data.availableToAgents) {
      await deactivatePrices(tx, { audience: "AGENT", serviceId });
    }

    await createBasePrices(tx, {
      agentAmount: parsed.data.agentBasePrice,
      availableToAgents: parsed.data.availableToAgents,
      availableToStudents: parsed.data.availableToStudents,
      createdById: session.userId,
      currency: parsed.data.currency,
      serviceId,
      studentAmount: parsed.data.studentPrice,
    });
  });

  revalidateServices();
  redirect("/services?success=service-updated");
}

export async function archiveServiceAction(formData: FormData) {
  await requirePermission("services:manage");
  const serviceId = getString(formData, "serviceId");

  if (!serviceId) {
    redirectWithError("service-not-found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.service.update({
      data: { status: "ARCHIVED" },
      where: { id: serviceId },
    });
    await tx.servicePrice.updateMany({
      data: { isActive: false, validUntil: new Date() },
      where: { isActive: true, serviceId },
    });
  });

  revalidateServices();
  redirect("/services?success=service-archived");
}

export async function upsertAgentServicePriceAction(formData: FormData) {
  const session = await requirePermission("services:manage");
  const parsed = agentPriceSchema.safeParse({
    agentId: getString(formData, "agentId"),
    amount: getString(formData, "amount"),
    currency: getString(formData, "currency"),
    serviceId: getString(formData, "serviceId"),
  });

  if (!parsed.success) {
    redirectWithError("price-validation");
  }

  await prisma.$transaction(async (tx) => {
    const [service, agent] = await Promise.all([
      tx.service.findFirst({
        select: { id: true },
        where: {
          availableToAgents: true,
          id: parsed.data.serviceId,
          status: { not: "ARCHIVED" },
        },
      }),
      tx.agent.findUnique({
        select: { id: true },
        where: { id: parsed.data.agentId },
      }),
    ]);

    if (!service || !agent) {
      throw new Error("Service or agent not found.");
    }

    await tx.servicePrice.updateMany({
      data: { isActive: false, validUntil: new Date() },
      where: {
        agentId: parsed.data.agentId,
        isActive: true,
        serviceId: parsed.data.serviceId,
      },
    });
    await tx.servicePrice.create({
      data: {
        agentId: parsed.data.agentId,
        amount: parsed.data.amount,
        audience: "AGENT",
        createdById: session.userId,
        currency: parsed.data.currency,
        serviceId: parsed.data.serviceId,
      },
    });
  });

  revalidateServices();
  redirect("/services?success=agent-price-saved");
}

export async function createAgentServicePriceProposalAction(
  formData: FormData,
) {
  const session = await requirePermission("services:manage");
  const parsed = agentPriceProposalSchema.safeParse({
    agentId: getString(formData, "agentId"),
    amount: getString(formData, "amount"),
    currency: getString(formData, "currency"),
    offerValidUntil: parseOptionalBakuDateTime(
      getString(formData, "offerValidUntil"),
    ),
    serviceId: getString(formData, "serviceId"),
    staffResponseNote: getString(formData, "staffResponseNote"),
  });
  const returnTo = getSafeStaffPriceReturnPath(
    getString(formData, "returnTo"),
    getString(formData, "agentId"),
  );

  if (!parsed.success) {
    redirectWithTarget(returnTo, "error", "price-proposal-validation");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.serviceQuoteRequest.updateMany({
        data: { status: "EXPIRED" },
        where: {
          agentId: parsed.data.agentId,
          offerValidUntil: { lte: now },
          purpose: "PRICE_OVERRIDE",
          serviceId: parsed.data.serviceId,
          status: "OFFERED",
        },
      });

      const [service, agent, openProposal] = await Promise.all([
        tx.service.findFirst({
          include: {
            prices: {
              orderBy: { validFrom: "desc" },
              take: 1,
              where: {
                agentId: null,
                audience: "AGENT",
                isActive: true,
                validFrom: { lte: now },
                OR: [{ validUntil: null }, { validUntil: { gt: now } }],
              },
            },
          },
          where: {
            availableToAgents: true,
            id: parsed.data.serviceId,
            status: "ACTIVE",
          },
        }),
        tx.agent.findFirst({
          select: { id: true },
          where: {
            id: parsed.data.agentId,
            portalStatus: { not: "SUSPENDED" },
          },
        }),
        tx.serviceQuoteRequest.findFirst({
          select: { id: true },
          where: {
            agentId: parsed.data.agentId,
            purpose: "PRICE_OVERRIDE",
            serviceId: parsed.data.serviceId,
            status: "OFFERED",
          },
        }),
      ]);

      const standardPrice = service?.prices[0];
      if (!service || !standardPrice || !agent) {
        throw new ServiceQuoteError("price-proposal-unavailable");
      }
      if (openProposal) {
        throw new ServiceQuoteError("price-proposal-already-open");
      }
      if (
        parsed.data.currency !== standardPrice.currency ||
        parsed.data.amount >= Number(standardPrice.amount)
      ) {
        throw new ServiceQuoteError("price-proposal-not-discount");
      }

      const proposal = await tx.serviceQuoteRequest.create({
        data: {
          agentId: agent.id,
          code: createQuoteCode(),
          createdById: session.userId,
          offerValidUntil: parsed.data.offerValidUntil,
          offeredCurrency: parsed.data.currency,
          offeredUnitPrice: parsed.data.amount,
          purpose: "PRICE_OVERRIDE",
          quantity: 1,
          reviewedAt: now,
          reviewedById: session.userId,
          serviceId: service.id,
          serviceNameSnapshot: service.name,
          staffResponseNote: emptyToNull(parsed.data.staffResponseNote),
          standardCurrency: standardPrice.currency,
          standardUnitPrice: standardPrice.amount,
          status: "OFFERED",
        },
      });

      const discount = Math.round(
        (1 - parsed.data.amount / Number(standardPrice.amount)) * 100,
      );
      await tx.agentNotification.create({
        data: {
          actionHref: "/profile?services=open",
          agentId: agent.id,
          entityId: agent.id,
          entityType: "AGENT",
          message: `${service.name} üçün ${parsed.data.amount} ${parsed.data.currency} fərdi qiymət (${discount}% endirim) təsdiqinizə göndərildi. Təsdiqədək standart qiymət qüvvədədir.`,
          title: `${proposal.code} · Fərdi qiymət təklifi`,
          type: "SYSTEM",
        },
      });
      await tx.activityLog.create({
        data: {
          action: "PRICE_UPDATED",
          entityId: agent.id,
          entityType: "AGENT",
          newValue: {
            amount: parsed.data.amount,
            currency: parsed.data.currency,
            purpose: "PRICE_OVERRIDE",
            quoteRequestId: proposal.id,
            serviceId: service.id,
            standardAmount: Number(standardPrice.amount),
            status: "OFFERED",
          },
          userId: session.userId,
        },
      });
    });
  } catch (error) {
    if (error instanceof ServiceQuoteError) {
      redirectWithTarget(returnTo, "error", error.message);
    }
    if (isUniqueConstraintError(error)) {
      redirectWithTarget(returnTo, "error", "price-proposal-already-open");
    }
    redirectWithTarget(returnTo, "error", "price-proposal-failed");
  }

  revalidateAgentPricing(parsed.data.agentId);
  redirectWithTarget(returnTo, "success", "price-proposal-sent");
}

export async function removeAgentServicePriceAction(formData: FormData) {
  await requirePermission("services:manage");
  const priceId = getString(formData, "priceId");

  if (!priceId) {
    redirectWithError("price-not-found");
  }

  await prisma.servicePrice.update({
    data: { isActive: false, validUntil: new Date() },
    where: { id: priceId },
  });

  revalidateServices();
  redirect("/services?success=agent-price-removed");
}

export async function createServiceQuoteRequestAction(formData: FormData) {
  const session = await requirePermission("services:purchase");
  const agentId = getSessionAgentId(session);
  const returnTo = getSafeAgentPriceReturnPath(getString(formData, "returnTo"));
  const parsed = serviceQuoteCreateSchema.safeParse({
    quantity: getString(formData, "quantity"),
    requestNote: getString(formData, "requestNote"),
    serviceId: getString(formData, "serviceId"),
  });

  if (session.portalType !== "agent" || !agentId) {
    redirectWithTarget(returnTo, "error", "quote-agent-only");
  }

  if (!parsed.success) {
    redirectWithTarget(returnTo, "error", "quote-validation");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.serviceQuoteRequest.updateMany({
        data: { status: "EXPIRED" },
        where: {
          agentId,
          offerValidUntil: { lte: now },
          serviceId: parsed.data.serviceId,
          status: "OFFERED",
        },
      });

      const [service, openRequest] = await Promise.all([
        tx.service.findFirst({
          select: { id: true, name: true },
          where: {
            availableToAgents: true,
            id: parsed.data.serviceId,
            status: "ACTIVE",
          },
        }),
        tx.serviceQuoteRequest.findFirst({
          select: { id: true },
          where: {
            agentId,
            serviceId: parsed.data.serviceId,
            status: { in: ["PENDING", "OFFERED"] },
          },
        }),
      ]);

      if (!service) {
        throw new ServiceQuoteError("service-unavailable");
      }

      if (openRequest) {
        throw new ServiceQuoteError("quote-already-open");
      }

      const request = await tx.serviceQuoteRequest.create({
        data: {
          agentId,
          code: createQuoteCode(),
          createdById: session.userId,
          quantity: parsed.data.quantity,
          requestNote: emptyToNull(parsed.data.requestNote),
          serviceId: service.id,
          serviceNameSnapshot: service.name,
        },
      });
      await tx.activityLog.create({
        data: {
          action: "CREATED",
          entityId: request.agentId,
          entityType: "AGENT",
          newValue: {
            quantity: request.quantity,
            quoteRequestCode: request.code,
            quoteRequestId: request.id,
            serviceId: request.serviceId,
            status: request.status,
          },
          userId: session.userId,
        },
      });
    });
  } catch (error) {
    if (error instanceof ServiceQuoteError) {
      redirectWithTarget(returnTo, "error", error.message);
    }

    if (isUniqueConstraintError(error)) {
      redirectWithTarget(returnTo, "error", "quote-already-open");
    }

    redirectWithTarget(returnTo, "error", "quote-failed");
  }

  revalidateAgentPricing(agentId);
  redirectWithTarget(returnTo, "success", "quote-request-created");
}

export async function offerServiceQuoteAction(formData: FormData) {
  const session = await requirePermission("services:manage");
  const parsed = serviceQuoteOfferSchema.safeParse({
    amount: getString(formData, "amount"),
    currency: getString(formData, "currency"),
    offerValidUntil: parseOptionalBakuDateTime(
      getString(formData, "offerValidUntil"),
    ),
    quoteRequestId: getString(formData, "quoteRequestId"),
    staffResponseNote: getString(formData, "staffResponseNote"),
  });

  if (!parsed.success) {
    redirectWithError("quote-offer-validation", "quotes");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const request = await tx.serviceQuoteRequest.findFirst({
        select: {
          agentId: true,
          code: true,
          id: true,
          serviceNameSnapshot: true,
        },
        where: { id: parsed.data.quoteRequestId, status: "PENDING" },
      });

      if (!request) {
        throw new ServiceQuoteError("quote-not-pending");
      }

      const updated = await tx.serviceQuoteRequest.updateMany({
        data: {
          offerValidUntil: parsed.data.offerValidUntil,
          offeredCurrency: parsed.data.currency,
          offeredUnitPrice: parsed.data.amount,
          reviewedAt: new Date(),
          reviewedById: session.userId,
          staffResponseNote: emptyToNull(parsed.data.staffResponseNote),
          status: "OFFERED",
        },
        where: { id: request.id, status: "PENDING" },
      });

      if (updated.count !== 1) {
        throw new ServiceQuoteError("quote-not-pending");
      }

      await tx.agentNotification.create({
        data: {
          actionHref: "/services?view=quotes",
          agentId: request.agentId,
          entityId: request.agentId,
          entityType: "AGENT",
          message: `${request.serviceNameSnapshot} üçün ${parsed.data.amount} ${parsed.data.currency} qiymət təklifi hazırdır.`,
          title: `${request.code} · Qiymət təklifi hazırdır`,
          type: "SYSTEM",
        },
      });
      await tx.activityLog.create({
        data: {
          action: "PRICE_UPDATED",
          entityId: request.agentId,
          entityType: "AGENT",
          newValue: {
            amount: parsed.data.amount,
            currency: parsed.data.currency,
            offerValidUntil: parsed.data.offerValidUntil?.toISOString() ?? null,
            quoteRequestId: request.id,
            status: "OFFERED",
          },
          oldValue: { status: "PENDING" },
          userId: session.userId,
        },
      });
    });
  } catch (error) {
    if (error instanceof ServiceQuoteError) {
      redirectWithError(error.message, "quotes");
    }

    redirectWithError("quote-offer-failed", "quotes");
  }

  revalidateServices();
  redirect("/services?view=quotes&success=quote-offered");
}

export async function rejectServiceQuoteAction(formData: FormData) {
  const session = await requirePermission("services:manage");
  const parsed = serviceQuoteRejectSchema.safeParse({
    quoteRequestId: getString(formData, "quoteRequestId"),
    reason: getString(formData, "reason"),
  });

  if (!parsed.success) {
    redirectWithError("quote-reject-validation", "quotes");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const request = await tx.serviceQuoteRequest.findFirst({
        select: {
          agentId: true,
          code: true,
          id: true,
          serviceNameSnapshot: true,
        },
        where: { id: parsed.data.quoteRequestId, status: "PENDING" },
      });

      if (!request) {
        throw new ServiceQuoteError("quote-not-pending");
      }

      const updated = await tx.serviceQuoteRequest.updateMany({
        data: {
          reviewedAt: new Date(),
          reviewedById: session.userId,
          staffResponseNote: parsed.data.reason,
          status: "REJECTED",
        },
        where: { id: request.id, status: "PENDING" },
      });

      if (updated.count !== 1) {
        throw new ServiceQuoteError("quote-not-pending");
      }

      await tx.agentNotification.create({
        data: {
          actionHref: "/services?view=quotes",
          agentId: request.agentId,
          entityId: request.agentId,
          entityType: "AGENT",
          message: `${request.serviceNameSnapshot} üçün qiymət sorğusu cavablandırılmadı. Səbəb: ${parsed.data.reason}`,
          title: `${request.code} · Qiymət sorğusu rədd edildi`,
          type: "SYSTEM",
        },
      });
      await tx.activityLog.create({
        data: {
          action: "STATUS_CHANGED",
          entityId: request.agentId,
          entityType: "AGENT",
          newValue: {
            quoteRequestId: request.id,
            reason: parsed.data.reason,
            status: "REJECTED",
          },
          oldValue: { status: "PENDING" },
          userId: session.userId,
        },
      });
    });
  } catch (error) {
    if (error instanceof ServiceQuoteError) {
      redirectWithError(error.message, "quotes");
    }

    redirectWithError("quote-reject-failed", "quotes");
  }

  revalidateServices();
  redirect("/services?view=quotes&success=quote-rejected");
}

export async function respondToServiceQuoteAction(formData: FormData) {
  const session = await requirePermission("services:purchase");
  const agentId = getSessionAgentId(session);
  const returnTo = getSafeAgentPriceReturnPath(getString(formData, "returnTo"));
  const parsed = serviceQuoteDecisionSchema.safeParse({
    decision: getString(formData, "decision"),
    quoteRequestId: getString(formData, "quoteRequestId"),
    reason: getString(formData, "reason"),
  });

  if (session.portalType !== "agent" || !agentId) {
    redirectWithTarget(returnTo, "error", "quote-agent-only");
  }

  if (!parsed.success) {
    redirectWithTarget(returnTo, "error", "quote-decision-validation");
  }

  let outcome:
    | "accepted"
    | "declined"
    | "expired"
    | "price-accepted"
    | "price-declined";

  try {
    outcome = await prisma.$transaction(async (tx) => {
      const request = await tx.serviceQuoteRequest.findFirst({
        select: {
          id: true,
          offerValidUntil: true,
          offeredCurrency: true,
          offeredUnitPrice: true,
          purpose: true,
          quantity: true,
          requestNote: true,
          serviceId: true,
          serviceNameSnapshot: true,
          status: true,
        },
        where: { agentId, id: parsed.data.quoteRequestId },
      });

      if (!request || request.status !== "OFFERED") {
        throw new ServiceQuoteError("quote-not-offered");
      }

      const now = new Date();
      if (
        request.offerValidUntil &&
        request.offerValidUntil.getTime() <= now.getTime()
      ) {
        const expired = await tx.serviceQuoteRequest.updateMany({
          data: { status: "EXPIRED" },
          where: { id: request.id, status: "OFFERED" },
        });
        if (expired.count === 1) {
          await tx.activityLog.create({
            data: {
              action: "STATUS_CHANGED",
              entityId: agentId,
              entityType: "AGENT",
              newValue: { quoteRequestId: request.id, status: "EXPIRED" },
              oldValue: { status: "OFFERED" },
              userId: session.userId,
            },
          });
        }
        return "expired";
      }

      if (
        request.offeredUnitPrice === null ||
        request.offeredCurrency === null
      ) {
        throw new ServiceQuoteError("quote-price-missing");
      }

      const updated = await tx.serviceQuoteRequest.updateMany({
        data: {
          agentRespondedAt: now,
          agentResponseNote: emptyToNull(parsed.data.reason),
          status: parsed.data.decision,
        },
        where: { id: request.id, status: "OFFERED" },
      });

      if (updated.count !== 1) {
        throw new ServiceQuoteError("quote-not-offered");
      }

      await tx.activityLog.create({
        data: {
          action: "STATUS_CHANGED",
          entityId: agentId,
          entityType: "AGENT",
          newValue: {
            quoteRequestId: request.id,
            reason: emptyToNull(parsed.data.reason),
            status: parsed.data.decision,
          },
          oldValue: { status: "OFFERED" },
          userId: session.userId,
        },
      });

      if (parsed.data.decision === "DECLINED") {
        return request.purpose === "PRICE_OVERRIDE"
          ? "price-declined"
          : "declined";
      }

      if (request.purpose === "PRICE_OVERRIDE") {
        const service = await tx.service.findFirst({
          select: { id: true },
          where: {
            availableToAgents: true,
            id: request.serviceId,
            status: "ACTIVE",
          },
        });
        if (!service) {
          throw new ServiceQuoteError("service-unavailable");
        }

        await tx.servicePrice.updateMany({
          data: { isActive: false, validUntil: now },
          where: {
            agentId,
            audience: "AGENT",
            isActive: true,
            serviceId: request.serviceId,
          },
        });
        await tx.servicePrice.create({
          data: {
            agentId,
            amount: request.offeredUnitPrice,
            audience: "AGENT",
            createdById: session.userId,
            currency: request.offeredCurrency,
            serviceId: request.serviceId,
            validFrom: now,
          },
        });

        return "price-accepted";
      }

      const unitPrice = Number(request.offeredUnitPrice);
      await tx.serviceOrder.create({
        data: {
          agentId,
          buyerType: "AGENT",
          code: createOrderCode(),
          createdById: session.userId,
          currency: request.offeredCurrency,
          customerNote: request.requestNote,
          quantity: request.quantity,
          quoteRequestId: request.id,
          serviceId: request.serviceId,
          serviceNameSnapshot: request.serviceNameSnapshot,
          status: "APPROVED",
          totalAmount: unitPrice * request.quantity,
          unitPrice: request.offeredUnitPrice,
        },
      });

      return "accepted";
    });
  } catch (error) {
    if (error instanceof ServiceQuoteError) {
      redirectWithTarget(returnTo, "error", error.message);
    }

    redirectWithTarget(returnTo, "error", "quote-decision-failed");
  }

  if (outcome === "expired") {
    revalidateAgentPricing(agentId);
    redirectWithTarget(returnTo, "error", "quote-expired");
  }

  revalidateAgentPricing(agentId);
  const successCode =
    outcome === "accepted"
      ? "quote-accepted"
      : outcome === "declined"
        ? "quote-declined"
        : outcome === "price-accepted"
          ? "price-proposal-accepted"
          : "price-proposal-declined";
  redirectWithTarget(returnTo, "success", successCode);
}

export async function createServiceOrderAction(formData: FormData) {
  const session = await requirePermission("services:purchase");
  const parsed = serviceOrderSchema.safeParse({
    customerNote: getString(formData, "customerNote"),
    quantity: getString(formData, "quantity"),
    serviceId: getString(formData, "serviceId"),
  });

  if (!parsed.success) {
    redirectWithError("order-validation");
  }

  const buyerType = session.portalType === "agent" ? "AGENT" : "STUDENT";
  const studentId = getSessionStudentId(session);

  if (buyerType === "AGENT") {
    redirectWithError("quote-required", "quotes");
  }

  if (!studentId) {
    redirectWithError("buyer-not-found");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const service = await tx.service.findFirst({
        select: {
          availableToStudents: true,
          id: true,
          name: true,
        },
        where: { id: parsed.data.serviceId, status: "ACTIVE" },
      });

      if (!service || !service.availableToStudents) {
        throw new ServiceOrderError("service-unavailable");
      }

      const now = new Date();
      const commonPriceWhere = {
        audience: "STUDENT" as const,
        isActive: true,
        serviceId: service.id,
        validFrom: { lte: now },
        OR: [{ validUntil: null }, { validUntil: { gt: now } }],
      } satisfies Prisma.ServicePriceWhereInput;
      const price = await tx.servicePrice.findFirst({
        orderBy: { validFrom: "desc" },
        where: { ...commonPriceWhere, agentId: null },
      });

      if (!price) {
        throw new ServiceOrderError("price-unavailable");
      }

      const totalAmount = Number(price.amount) * parsed.data.quantity;
      await tx.serviceOrder.create({
        data: {
          agentId: null,
          buyerType: "STUDENT",
          code: createOrderCode(),
          createdById: session.userId,
          currency: price.currency,
          customerNote: emptyToNull(parsed.data.customerNote),
          priceId: price.id,
          quantity: parsed.data.quantity,
          serviceId: service.id,
          serviceNameSnapshot: service.name,
          studentId,
          totalAmount,
          unitPrice: price.amount,
        },
      });
    });
  } catch (error) {
    if (error instanceof ServiceOrderError) {
      redirectWithError(error.message);
    }

    redirectWithError("order-failed");
  }

  revalidateServices();
  redirect("/services?success=order-created");
}

export async function updateServiceOrderAction(formData: FormData) {
  await requirePermission("service-orders:update");
  const parsed = serviceOrderUpdateSchema.safeParse({
    internalNote: getString(formData, "internalNote"),
    orderId: getString(formData, "orderId"),
    status: getString(formData, "status"),
  });

  if (!parsed.success) {
    redirectWithError("order-update-validation");
  }

  const existing = await prisma.serviceOrder.findUnique({
    select: { status: true },
    where: { id: parsed.data.orderId },
  });

  if (!existing) {
    redirectWithError("order-not-found");
  }

  await prisma.serviceOrder.update({
    data: {
      internalNote: emptyToNull(parsed.data.internalNote),
      status: parsed.data.status,
    },
    where: { id: parsed.data.orderId },
  });

  revalidateServices();
  redirect("/services?success=order-updated");
}

export async function createDocumentOrderAction(formData: FormData) {
  const session = await requirePermission("services:manage");
  const parsed = documentOrderCreateSchema.safeParse({
    agentId: getString(formData, "agentId"),
    beneficiaryFin: getString(formData, "beneficiaryFin"),
    beneficiaryName: getString(formData, "beneficiaryName"),
    beneficiaryPassport: getString(formData, "beneficiaryPassport"),
    beneficiarySurname: getString(formData, "beneficiarySurname"),
    currency: getString(formData, "currency") || "AZN",
    deliveryDate: parseOptionalBakuDateTime(
      getString(formData, "deliveryDate"),
    ),
    externalStudentName: getString(formData, "externalStudentName"),
    externalStudentPassport: getString(formData, "externalStudentPassport"),
    externalStudentSurname: getString(formData, "externalStudentSurname"),
    managerId: getString(formData, "managerId"),
    manualServiceName: getString(formData, "manualServiceName"),
    note: getString(formData, "note"),
    price: getString(formData, "price"),
    serviceId: getString(formData, "serviceId"),
    source: getString(formData, "source") || "SYSTEM",
    studentId: getString(formData, "studentId"),
  });

  if (!parsed.success) {
    redirectWithError("document-order-validation", "document-orders");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const [service, student, agent, manager] = await Promise.all([
        parsed.data.serviceId
          ? tx.service.findFirst({
              select: { id: true, name: true },
              where: { id: parsed.data.serviceId, status: "ACTIVE" },
            })
          : Promise.resolve(null),
        parsed.data.studentId
          ? tx.student.findFirst({
              select: { id: true },
              where: { id: parsed.data.studentId, status: "ACTIVE" },
            })
          : Promise.resolve(null),
        parsed.data.agentId
          ? tx.agent.findFirst({
              select: { id: true },
              where: {
                id: parsed.data.agentId,
                portalStatus: { not: "SUSPENDED" },
              },
            })
          : Promise.resolve(null),
        parsed.data.managerId
          ? tx.user.findFirst({
              select: { id: true },
              where: {
                id: parsed.data.managerId,
                role: { notIn: ["AGENT", "STUDENT"] },
                status: "ACTIVE",
              },
            })
          : Promise.resolve(null),
      ]);

      if (parsed.data.serviceId && !service) {
        throw new DocumentOrderError("document-order-service-not-found");
      }
      if (parsed.data.studentId && !student) {
        throw new DocumentOrderError("document-order-student-not-found");
      }
      if (parsed.data.agentId && !agent) {
        throw new DocumentOrderError("document-order-agent-not-found");
      }
      if (parsed.data.managerId && !manager) {
        throw new DocumentOrderError("document-order-manager-not-found");
      }

      const code = await createDocumentOrderCode(tx);
      await tx.documentOrder.create({
        data: {
          agentId: agent?.id,
          beneficiaryFin: emptyToNull(parsed.data.beneficiaryFin),
          beneficiaryName: emptyToNull(parsed.data.beneficiaryName),
          beneficiaryPassport: emptyToNull(parsed.data.beneficiaryPassport),
          beneficiarySurname: emptyToNull(parsed.data.beneficiarySurname),
          code,
          createdById: session.userId,
          currency: parsed.data.currency,
          deliveryDate: parsed.data.deliveryDate,
          externalStudentName: emptyToNull(parsed.data.externalStudentName),
          externalStudentPassport: emptyToNull(
            parsed.data.externalStudentPassport,
          ),
          externalStudentSurname: emptyToNull(
            parsed.data.externalStudentSurname,
          ),
          managerId: manager?.id,
          note: emptyToNull(parsed.data.note),
          price: parsed.data.price,
          serviceId: service?.id,
          serviceNameSnapshot:
            service?.name || parsed.data.manualServiceName || "Sənəd xidməti",
          source: parsed.data.source,
          statusHistory: {
            create: {
              changedById: session.userId,
              note: "Sifariş yaradıldı.",
              status: "ORDERED",
            },
          },
          studentId: student?.id,
        },
      });
    });
  } catch (error) {
    if (error instanceof DocumentOrderError) {
      redirectWithError(error.message, "document-orders");
    }
    redirectWithError("document-order-failed", "document-orders");
  }

  revalidateServices();
  redirect("/services?view=document-orders&success=document-order-created");
}

export async function updateDocumentOrderStatusAction(formData: FormData) {
  const session = await requirePermission("service-orders:update");
  const parsed = documentOrderStatusSchema.safeParse({
    note: getString(formData, "note"),
    orderId: getString(formData, "orderId"),
    recipientFin: getString(formData, "recipientFin"),
    recipientName: getString(formData, "recipientName"),
    recipientSurname: getString(formData, "recipientSurname"),
    recipientType: getString(formData, "recipientType") || undefined,
    status: getString(formData, "status"),
  });

  if (!parsed.success) {
    redirectWithError("document-status-validation", "document-orders");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.documentOrder.findUnique({
        select: { status: true },
        where: { id: parsed.data.orderId },
      });
      if (!order) {
        throw new DocumentOrderError("document-order-not-found");
      }
      if (
        !isAllowedDocumentStatusTransition(order.status, parsed.data.status)
      ) {
        throw new DocumentOrderError("document-status-transition");
      }

      const isDelivered = parsed.data.status === "DELIVERED";
      const updated = await tx.documentOrder.updateMany({
        data: {
          deliveredAt: isDelivered ? new Date() : null,
          recipientFin: isDelivered
            ? emptyToNull(parsed.data.recipientFin)
            : null,
          recipientName: isDelivered
            ? emptyToNull(parsed.data.recipientName)
            : null,
          recipientSurname: isDelivered
            ? emptyToNull(parsed.data.recipientSurname)
            : null,
          recipientType: isDelivered ? parsed.data.recipientType : null,
          status: parsed.data.status,
        },
        where: { id: parsed.data.orderId, status: order.status },
      });
      if (updated.count !== 1) {
        throw new DocumentOrderError("document-status-transition");
      }
      await tx.documentOrderStatusHistory.create({
        data: {
          changedById: session.userId,
          note: emptyToNull(parsed.data.note),
          orderId: parsed.data.orderId,
          status: parsed.data.status,
        },
      });
    });
  } catch (error) {
    if (error instanceof DocumentOrderError) {
      redirectWithError(error.message, "document-orders");
    }
    redirectWithError("document-status-failed", "document-orders");
  }

  revalidateServices();
  redirect("/services?view=document-orders&success=document-status-updated");
}

export async function confirmDocumentOrderPaymentAction(formData: FormData) {
  await requirePermission("service-orders:update");
  const parsed = documentOrderPaymentSchema.safeParse({
    amount: getString(formData, "amount"),
    orderId: getString(formData, "orderId"),
  });

  if (!parsed.success) {
    redirectWithError("document-payment-validation", "document-orders");
  }

  const result = await prisma.documentOrder.updateMany({
    data: {
      paidAt: new Date(),
      paymentStatus: "PAID",
      price: parsed.data.amount,
    },
    where: { id: parsed.data.orderId, paymentStatus: "UNPAID" },
  });

  if (result.count !== 1) {
    redirectWithError("document-payment-not-open", "document-orders");
  }

  revalidateServices();
  redirect("/services?view=document-orders&success=document-payment-confirmed");
}

export async function assignDocumentOrderManagerAction(formData: FormData) {
  await requirePermission("service-orders:update");
  const parsed = documentOrderManagerSchema.safeParse({
    managerId: getString(formData, "managerId"),
    orderId: getString(formData, "orderId"),
  });

  if (!parsed.success) {
    redirectWithError("document-manager-validation", "document-orders");
  }

  if (parsed.data.managerId) {
    const manager = await prisma.user.findFirst({
      select: { id: true },
      where: {
        id: parsed.data.managerId,
        role: { notIn: ["AGENT", "STUDENT"] },
        status: "ACTIVE",
      },
    });
    if (!manager) {
      redirectWithError("document-order-manager-not-found", "document-orders");
    }
  }

  const result = await prisma.documentOrder.updateMany({
    data: { managerId: parsed.data.managerId ?? null },
    where: { id: parsed.data.orderId },
  });
  if (result.count !== 1) {
    redirectWithError("document-order-not-found", "document-orders");
  }

  revalidateServices();
  redirect("/services?view=document-orders&success=document-manager-assigned");
}

function readServiceForm(formData: FormData) {
  return {
    agentBasePrice: getString(formData, "agentBasePrice"),
    availableToAgents: getBoolean(formData, "availableToAgents"),
    availableToStudents: getBoolean(formData, "availableToStudents"),
    currency: getString(formData, "currency") || "AZN",
    description: getString(formData, "description"),
    name: getString(formData, "name"),
    sortOrder: getString(formData, "sortOrder") || "0",
    status: getString(formData, "status") || "ACTIVE",
    studentPrice: getString(formData, "studentPrice"),
  };
}

async function createBasePrices(
  tx: Prisma.TransactionClient,
  input: {
    agentAmount?: number;
    availableToAgents: boolean;
    availableToStudents: boolean;
    createdById: string;
    currency: string;
    serviceId: string;
    studentAmount?: number;
  },
) {
  if (input.availableToAgents && input.agentAmount !== undefined) {
    await tx.servicePrice.create({
      data: {
        amount: input.agentAmount,
        audience: "AGENT",
        createdById: input.createdById,
        currency: input.currency,
        serviceId: input.serviceId,
      },
    });
  }

  if (input.availableToStudents && input.studentAmount !== undefined) {
    await tx.servicePrice.create({
      data: {
        amount: input.studentAmount,
        audience: "STUDENT",
        createdById: input.createdById,
        currency: input.currency,
        serviceId: input.serviceId,
      },
    });
  }
}

async function deactivatePrices(
  tx: Prisma.TransactionClient,
  where: {
    agentId?: null;
    audience: "AGENT" | "STUDENT";
    serviceId: string;
  },
) {
  await tx.servicePrice.updateMany({
    data: { isActive: false, validUntil: new Date() },
    where: { ...where, isActive: true },
  });
}

function createOrderCode() {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `SRV-${year}${month}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function createQuoteCode() {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `QTE-${year}${month}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

async function createDocumentOrderCode(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = `DOC-${year}-${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;
    const exists = await tx.documentOrder.findUnique({
      select: { id: true },
      where: { code },
    });
    if (!exists) {
      return code;
    }
  }

  throw new DocumentOrderError("document-order-code-failed");
}

function isAllowedDocumentStatusTransition(
  current: DocumentOrderStatus,
  next: DocumentOrderStatus,
) {
  if (next === "RETURNED") {
    return current !== "DELIVERED" && current !== "RETURNED";
  }

  const nextByStatus: Partial<
    Record<DocumentOrderStatus, DocumentOrderStatus>
  > = {
    AT_OFFICE: "DELIVERED",
    IN_PROGRESS: "PREPARING",
    ORDERED: "IN_PROGRESS",
    PREPARING: "AT_OFFICE",
  };

  return nextByStatus[current] === next;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

function emptyToNull(value?: string) {
  return value?.trim() ? value.trim() : null;
}

function parseOptionalBakuDateTime(value: string) {
  if (!value) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00+04:00`);
  }

  const hasTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const normalized = hasTimeZone
    ? value
    : `${value}${value.length === 16 ? ":00" : ""}+04:00`;
  return new Date(normalized);
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function revalidateServices() {
  revalidatePath("/services");
  revalidatePath("/az/services");
  revalidatePath("/dashboard");
  revalidatePath("/az/dashboard");
}

function revalidateAgentPricing(agentId: string) {
  revalidateServices();
  revalidatePath("/profile");
  revalidatePath("/az/profile");
  revalidatePath(`/agents/${agentId}`);
  revalidatePath(`/az/agents/${agentId}`);
}

function getSafeStaffPriceReturnPath(value: string, agentId: string) {
  if (
    value === `/agents/${agentId}` ||
    value === `/az/agents/${agentId}` ||
    value === `/agents/${agentId}?services=open` ||
    value === `/az/agents/${agentId}?services=open`
  ) {
    return value;
  }

  return "/services";
}

function getSafeAgentPriceReturnPath(value: string) {
  if (
    value === "/profile" ||
    value === "/az/profile" ||
    value === "/profile?services=open" ||
    value === "/az/profile?services=open"
  ) {
    return value;
  }

  return "/services?view=quotes";
}

function redirectWithTarget(
  target: string,
  kind: "error" | "success",
  code: string,
): never {
  const separator = target.includes("?") ? "&" : "?";
  redirect(`${target}${separator}${kind}=${encodeURIComponent(code)}`);
}

function redirectWithError(
  code: string,
  view?: "quotes" | "document-orders",
): never {
  redirect(`/services?${view ? `view=${view}&` : ""}error=${code}`);
}

class ServiceOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceOrderError";
  }
}

class ServiceQuoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServiceQuoteError";
  }
}

class DocumentOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentOrderError";
  }
}
