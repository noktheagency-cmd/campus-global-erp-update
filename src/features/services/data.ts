import "server-only";

import { can } from "@/lib/auth/permissions";
import {
  getSessionAgentId,
  getSessionStudentId,
  type AuthSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type {
  DocumentOrderRecord,
  DocumentOrderStatus,
  ServiceAdminRecord,
  ServiceOrderRecord,
  ServiceQuoteRequestRecord,
  ServicesWorkspaceData,
} from "@/features/services/types";

const quoteRequestSelect = {
  agent: {
    select: {
      companyName: true,
      firstName: true,
      lastName: true,
    },
  },
  agentRespondedAt: true,
  agentResponseNote: true,
  code: true,
  createdAt: true,
  id: true,
  offerValidUntil: true,
  offeredCurrency: true,
  offeredUnitPrice: true,
  order: { select: { code: true } },
  purpose: true,
  quantity: true,
  requestNote: true,
  reviewedAt: true,
  reviewedBy: { select: { email: true, name: true } },
  serviceId: true,
  serviceNameSnapshot: true,
  staffResponseNote: true,
  status: true,
  standardCurrency: true,
  standardUnitPrice: true,
} as const;

export async function getServicesWorkspaceData(
  session: AuthSession,
): Promise<ServicesWorkspaceData> {
  if (session.portalType === "staff") {
    return getStaffServicesData(session);
  }

  return getPortalServicesData(session);
}

async function getStaffServicesData(
  session: AuthSession,
): Promise<ServicesWorkspaceData> {
  const now = new Date();
  const [
    services,
    agents,
    students,
    managers,
    orders,
    quoteRequests,
    documentOrders,
    pendingOrders,
    completedOrders,
    pendingQuoteRequests,
  ] = await Promise.all([
    prisma.service.findMany({
      include: {
        _count: { select: { orders: true, quoteRequests: true } },
        prices: {
          include: {
            agent: {
              select: {
                companyName: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { validFrom: "desc" },
          where: {
            isActive: true,
            validFrom: { lte: now },
            OR: [{ validUntil: null }, { validUntil: { gt: now } }],
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      where: { status: { not: "ARCHIVED" } },
    }),
    prisma.agent.findMany({
      orderBy: [{ companyName: "asc" }, { firstName: "asc" }],
      select: {
        companyName: true,
        firstName: true,
        id: true,
        lastName: true,
      },
      where: { portalStatus: { not: "SUSPENDED" } },
    }),
    prisma.student.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: {
        firstName: true,
        id: true,
        lastName: true,
        passportNo: true,
      },
      where: { status: "ACTIVE" },
    }),
    prisma.user.findMany({
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { email: true, id: true, name: true },
      where: {
        role: { notIn: ["AGENT", "STUDENT"] },
        status: "ACTIVE",
      },
    }),
    prisma.serviceOrder.findMany({
      include: {
        agent: {
          select: {
            companyName: true,
            firstName: true,
            lastName: true,
          },
        },
        student: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.serviceQuoteRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: quoteRequestSelect,
      take: 100,
    }),
    prisma.documentOrder.findMany({
      include: {
        agent: {
          select: {
            companyName: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: { select: { email: true, name: true } },
        manager: { select: { email: true, name: true } },
        statusHistory: {
          include: { changedBy: { select: { email: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
        student: {
          select: { firstName: true, lastName: true, passportNo: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.serviceOrder.count({
      where: { status: { in: ["PENDING", "APPROVED", "IN_PROGRESS"] } },
    }),
    prisma.serviceOrder.count({ where: { status: "COMPLETED" } }),
    prisma.serviceQuoteRequest.count({ where: { status: "PENDING" } }),
  ]);

  const documentOrderMetrics = documentOrders.reduce(
    (metrics, order) => {
      metrics.ALL += 1;
      metrics[order.status] += 1;
      return metrics;
    },
    {
      ALL: 0,
      AT_OFFICE: 0,
      DELIVERED: 0,
      IN_PROGRESS: 0,
      ORDERED: 0,
      PREPARING: 0,
      RETURNED: 0,
    } satisfies Record<DocumentOrderStatus | "ALL", number>,
  );

  const mappedQuoteRequests = quoteRequests.map(mapQuoteRequest);
  const mappedServices = services.map((service): ServiceAdminRecord => {
    const studentPrice = service.prices.find(
      (price) => price.audience === "STUDENT" && !price.agentId,
    );
    const agentBasePrice = service.prices.find(
      (price) => price.audience === "AGENT" && !price.agentId,
    );
    const agentOverrides = service.prices
      .filter((price) => price.audience === "AGENT" && price.agentId)
      .map((price) => ({
        agentId: price.agentId!,
        agentName: getAgentName(price.agent),
        amount: Number(price.amount),
        currency: price.currency,
        id: price.id,
        validFrom: price.validFrom.toISOString(),
      }));

    return {
      agentBasePrice: agentBasePrice
        ? {
            amount: Number(agentBasePrice.amount),
            currency: agentBasePrice.currency,
          }
        : null,
      agentOverrides,
      availableToAgents: service.availableToAgents,
      availableToStudents: service.availableToStudents,
      createdAt: service.createdAt.toISOString(),
      description: service.description ?? "",
      id: service.id,
      name: service.name,
      orderCount: service._count.orders,
      priceProposals: mappedQuoteRequests.filter(
        (request) =>
          request.serviceId === service.id &&
          request.purpose === "PRICE_OVERRIDE",
      ),
      quoteRequestCount: service._count.quoteRequests,
      sortOrder: service.sortOrder,
      status: service.status,
      studentPrice: studentPrice
        ? {
            amount: Number(studentPrice.amount),
            currency: studentPrice.currency,
          }
        : null,
      updatedAt: service.updatedAt.toISOString(),
    };
  });

  return {
    agents: agents.map((agent) => ({
      id: agent.id,
      label: getAgentName(agent),
    })),
    canCreateDocumentOrders: can(session.role, "services:manage"),
    canManage: can(session.role, "services:manage"),
    canReviewQuotes: can(session.role, "services:manage"),
    canUpdateDocumentOrders: can(session.role, "service-orders:update"),
    canUpdateOrders: can(session.role, "service-orders:update"),
    documentOrderMetrics,
    documentOrderOptions: {
      agents: agents.map((agent) => ({
        id: agent.id,
        label: getAgentName(agent),
      })),
      managers: managers.map((manager) => ({
        id: manager.id,
        label: manager.name?.trim() || manager.email,
      })),
      services: services
        .filter((service) => service.status === "ACTIVE")
        .map((service) => ({ id: service.id, label: service.name })),
      students: students.map((student) => ({
        id: student.id,
        label: `${student.firstName} ${student.lastName}`,
        passportNo: student.passportNo ?? undefined,
      })),
    },
    documentOrders: documentOrders.map(mapDocumentOrder),
    metrics: {
      activeServices: services.filter((service) => service.status === "ACTIVE")
        .length,
      completedOrders,
      customAgentPrices: mappedServices.reduce(
        (total, service) => total + service.agentOverrides.length,
        0,
      ),
      pendingOrders,
      pendingQuoteRequests,
    },
    mode: "staff",
    orders: orders.map(mapOrder),
    quoteRequests: mappedQuoteRequests,
    services: mappedServices,
  };
}

async function getPortalServicesData(
  session: AuthSession,
): Promise<ServicesWorkspaceData> {
  const buyerType = session.portalType === "agent" ? "AGENT" : "STUDENT";
  const agentId = getSessionAgentId(session);
  const studentId = getSessionStudentId(session);
  const now = new Date();

  const [services, orders, quoteRequests] = await Promise.all([
    prisma.service.findMany({
      include: {
        prices: {
          orderBy: { validFrom: "desc" },
          where:
            buyerType === "AGENT"
              ? {
                  audience: "AGENT",
                  isActive: true,
                  validFrom: { lte: now },
                  OR: [
                    { agentId: null },
                    { agentId: agentId ?? "__missing_agent__" },
                  ],
                  AND: [
                    { OR: [{ validUntil: null }, { validUntil: { gt: now } }] },
                  ],
                }
              : {
                  agentId: null,
                  audience: "STUDENT",
                  isActive: true,
                  validFrom: { lte: now },
                  OR: [{ validUntil: null }, { validUntil: { gt: now } }],
                },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      where: {
        status: "ACTIVE",
        ...(buyerType === "AGENT"
          ? { availableToAgents: true }
          : { availableToStudents: true }),
      },
    }),
    prisma.serviceOrder.findMany({
      include: {
        agent: {
          select: {
            companyName: true,
            firstName: true,
            lastName: true,
          },
        },
        student: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      where:
        buyerType === "AGENT"
          ? { agentId: agentId ?? "__missing_agent__" }
          : { studentId: studentId ?? "__missing_student__" },
    }),
    buyerType === "AGENT"
      ? prisma.serviceQuoteRequest.findMany({
          orderBy: { createdAt: "desc" },
          select: quoteRequestSelect,
          take: 50,
          where: { agentId: agentId ?? "__missing_agent__" },
        })
      : Promise.resolve([]),
  ]);

  const mappedQuoteRequests = quoteRequests.map(mapQuoteRequest);
  const activeQuoteByServiceId = new Map<string, ServiceQuoteRequestRecord>();
  for (const quoteRequest of mappedQuoteRequests) {
    const isActive =
      quoteRequest.status === "PENDING" ||
      (quoteRequest.status === "OFFERED" && !quoteRequest.isExpired);
    if (
      quoteRequest.purpose === "ORDER" &&
      isActive &&
      !activeQuoteByServiceId.has(quoteRequest.serviceId)
    ) {
      activeQuoteByServiceId.set(quoteRequest.serviceId, quoteRequest);
    }
  }

  return {
    buyerType,
    mode: "portal",
    orders: orders.map(mapOrder),
    quoteRequests: mappedQuoteRequests,
    services: services.map((service) => {
      const basePrice = service.prices.find((price) => !price.agentId);
      const customPrice = service.prices.find(
        (price) => buyerType === "AGENT" && price.agentId === agentId,
      );
      const effectivePrice = customPrice ?? basePrice;
      const activeQuote =
        buyerType === "AGENT"
          ? (activeQuoteByServiceId.get(service.id) ?? null)
          : null;

      return {
        activeQuote,
        available: Boolean(effectivePrice),
        description: service.description ?? "",
        id: service.id,
        name: service.name,
        price: effectivePrice
          ? {
              amount: Number(effectivePrice.amount),
              currency: effectivePrice.currency,
            }
          : null,
        priceKind:
          buyerType === "AGENT"
            ? customPrice
              ? ("agent-custom" as const)
              : basePrice
                ? ("agent-base" as const)
                : ("quote-required" as const)
            : basePrice
              ? ("student-base" as const)
              : ("unavailable" as const),
      };
    }),
  };
}

function mapOrder(order: {
  agent: {
    companyName: string | null;
    firstName: string;
    lastName: string;
  } | null;
  buyerType: "AGENT" | "STUDENT";
  code: string;
  createdAt: Date;
  currency: string;
  customerNote: string | null;
  id: string;
  internalNote: string | null;
  quantity: number;
  serviceNameSnapshot: string;
  status: "PENDING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  student: { firstName: string; lastName: string } | null;
  totalAmount: { toString(): string };
  unitPrice: { toString(): string };
}): ServiceOrderRecord {
  return {
    buyerName:
      order.buyerType === "AGENT"
        ? getAgentName(order.agent)
        : order.student
          ? `${order.student.firstName} ${order.student.lastName}`
          : "Tələbə",
    buyerType: order.buyerType,
    code: order.code,
    createdAt: order.createdAt.toISOString(),
    currency: order.currency,
    customerNote: order.customerNote ?? "",
    id: order.id,
    internalNote: order.internalNote ?? "",
    quantity: order.quantity,
    serviceName: order.serviceNameSnapshot,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    unitPrice: Number(order.unitPrice),
  };
}

function mapQuoteRequest(quoteRequest: {
  agent: {
    companyName: string | null;
    firstName: string;
    lastName: string;
  };
  agentRespondedAt: Date | null;
  agentResponseNote: string | null;
  code: string;
  createdAt: Date;
  id: string;
  offerValidUntil: Date | null;
  offeredCurrency: string | null;
  offeredUnitPrice: { toString(): string } | null;
  order: { code: string } | null;
  purpose: "ORDER" | "PRICE_OVERRIDE";
  quantity: number;
  requestNote: string | null;
  reviewedAt: Date | null;
  reviewedBy: { email: string; name: string | null } | null;
  serviceId: string;
  serviceNameSnapshot: string;
  staffResponseNote: string | null;
  status:
    | "PENDING"
    | "OFFERED"
    | "REJECTED"
    | "ACCEPTED"
    | "DECLINED"
    | "EXPIRED";
  standardCurrency: string | null;
  standardUnitPrice: { toString(): string } | null;
}): ServiceQuoteRequestRecord {
  const offeredUnitPrice = quoteRequest.offeredUnitPrice
    ? Number(quoteRequest.offeredUnitPrice)
    : null;
  const isExpired =
    quoteRequest.status === "EXPIRED" ||
    (quoteRequest.status === "OFFERED" &&
      Boolean(
        quoteRequest.offerValidUntil &&
        quoteRequest.offerValidUntil.getTime() <= Date.now(),
      ));

  return {
    agentName: getAgentName(quoteRequest.agent),
    agentRespondedAt: quoteRequest.agentRespondedAt?.toISOString() ?? null,
    agentResponseNote: quoteRequest.agentResponseNote ?? "",
    code: quoteRequest.code,
    createdAt: quoteRequest.createdAt.toISOString(),
    currency: quoteRequest.offeredCurrency,
    id: quoteRequest.id,
    isExpired,
    offerValidUntil: quoteRequest.offerValidUntil?.toISOString() ?? null,
    offeredUnitPrice,
    orderCode: quoteRequest.order?.code ?? null,
    purpose: quoteRequest.purpose,
    quantity: quoteRequest.quantity,
    requestNote: quoteRequest.requestNote ?? "",
    reviewedAt: quoteRequest.reviewedAt?.toISOString() ?? null,
    reviewerName:
      quoteRequest.reviewedBy?.name?.trim() ||
      quoteRequest.reviewedBy?.email ||
      "",
    serviceId: quoteRequest.serviceId,
    serviceName: quoteRequest.serviceNameSnapshot,
    staffResponseNote: quoteRequest.staffResponseNote ?? "",
    status: quoteRequest.status,
    standardCurrency: quoteRequest.standardCurrency,
    standardUnitPrice: quoteRequest.standardUnitPrice
      ? Number(quoteRequest.standardUnitPrice)
      : null,
    totalAmount:
      offeredUnitPrice === null
        ? null
        : offeredUnitPrice * quoteRequest.quantity,
  };
}

function mapDocumentOrder(order: {
  agent: {
    companyName: string | null;
    firstName: string;
    lastName: string;
  } | null;
  agentId: string | null;
  beneficiaryFin: string | null;
  beneficiaryName: string | null;
  beneficiaryPassport: string | null;
  beneficiarySurname: string | null;
  code: string;
  createdAt: Date;
  createdBy: { email: string; name: string | null };
  currency: string;
  deliveredAt: Date | null;
  deliveryDate: Date | null;
  externalStudentName: string | null;
  externalStudentPassport: string | null;
  externalStudentSurname: string | null;
  id: string;
  manager: { email: string; name: string | null } | null;
  managerId: string | null;
  note: string | null;
  paidAt: Date | null;
  paymentStatus: "UNPAID" | "PAID";
  price: { toString(): string } | null;
  recipientFin: string | null;
  recipientName: string | null;
  recipientSurname: string | null;
  recipientType: "STUDENT" | "AGENT" | "OTHER" | null;
  serviceId: string | null;
  serviceNameSnapshot: string;
  source: "SYSTEM" | "WHATSAPP" | "PHONE";
  status: DocumentOrderStatus;
  statusHistory: Array<{
    changedBy: { email: string; name: string | null };
    createdAt: Date;
    id: string;
    note: string | null;
    status: DocumentOrderStatus;
  }>;
  student: {
    firstName: string;
    lastName: string;
    passportNo: string | null;
  } | null;
  studentId: string | null;
}): DocumentOrderRecord {
  return {
    agentId: order.agentId,
    agentName: order.agent ? getAgentName(order.agent) : "",
    beneficiaryFin: order.beneficiaryFin ?? "",
    beneficiaryName: order.beneficiaryName ?? "",
    beneficiaryPassport: order.beneficiaryPassport ?? "",
    beneficiarySurname: order.beneficiarySurname ?? "",
    code: order.code,
    createdAt: order.createdAt.toISOString(),
    createdByName: order.createdBy.name?.trim() || order.createdBy.email,
    currency: order.currency,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    deliveryDate: order.deliveryDate?.toISOString() ?? null,
    externalStudentPassport: order.externalStudentPassport ?? "",
    id: order.id,
    managerId: order.managerId,
    managerName: order.manager?.name?.trim() || order.manager?.email || "",
    note: order.note ?? "",
    paidAt: order.paidAt?.toISOString() ?? null,
    paymentStatus: order.paymentStatus,
    price: order.price === null ? null : Number(order.price),
    recipientFin: order.recipientFin ?? "",
    recipientName: order.recipientName ?? "",
    recipientSurname: order.recipientSurname ?? "",
    recipientType: order.recipientType,
    serviceId: order.serviceId,
    serviceName: order.serviceNameSnapshot,
    source: order.source,
    status: order.status,
    statusHistory: order.statusHistory.map((entry) => ({
      changedByName: entry.changedBy.name?.trim() || entry.changedBy.email,
      createdAt: entry.createdAt.toISOString(),
      id: entry.id,
      note: entry.note ?? "",
      status: entry.status,
    })),
    studentId: order.studentId,
    studentName: order.student
      ? `${order.student.firstName} ${order.student.lastName}`
      : `${order.externalStudentName ?? ""} ${order.externalStudentSurname ?? ""}`.trim(),
  };
}

function getAgentName(
  agent: {
    companyName: string | null;
    firstName: string;
    lastName: string;
  } | null,
) {
  if (!agent) {
    return "Agent";
  }

  return (
    agent.companyName?.trim() ||
    `${agent.firstName} ${agent.lastName}`.trim() ||
    "Agent"
  );
}
