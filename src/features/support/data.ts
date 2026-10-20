import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { can } from "@/lib/auth/permissions";
import type { AuthSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createDocumentAccessUrls } from "@/lib/supabase/storage";
import type {
  SupportTicketRecord,
  SupportTicketSummaryRecord,
  SupportWorkspaceData,
  SupportWorkspaceQuery,
} from "@/features/support/types";

const ACTIVE_SUPPORT_STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "WAITING_FOR_REQUESTER",
] as const;
const SUPPORT_PAGE_SIZE = 30;
const SUPPORT_MESSAGE_LIMIT = 100;

const SUPPORT_SUMMARY_SELECT = {
  assignedTo: { select: { email: true, id: true, name: true } },
  category: true,
  code: true,
  createdAt: true,
  firstResponseAt: true,
  id: true,
  lastActivityAt: true,
  priority: true,
  requesterEmailSnapshot: true,
  requesterId: true,
  requesterNameSnapshot: true,
  status: true,
  subject: true,
} satisfies Prisma.SupportTicketSelect;

type SupportSummaryRow = Prisma.SupportTicketGetPayload<{
  select: typeof SUPPORT_SUMMARY_SELECT;
}>;

export async function getSupportWorkspaceData(
  session: AuthSession,
  query: SupportWorkspaceQuery = {},
): Promise<SupportWorkspaceData> {
  const canManage = can(session.role, "tickets:manage");
  const canCreate = can(session.role, "tickets:create");
  const scopeWhere: Prisma.SupportTicketWhereInput = canManage
    ? {}
    : { requesterId: session.userId };
  const filteredWhere = buildFilteredWhere(scopeWhere, query);
  const cursor = decodeCursor(query.cursor);
  const direction = cursor ? (query.direction ?? "next") : undefined;
  const listWhere = cursor
    ? {
        AND: [
          filteredWhere,
          buildCursorWhere(cursor, direction === "previous"),
        ],
      }
    : filteredWhere;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const requestedTicketPromise = query.selectedTicketId
    ? findTicketDetail({
        canManage,
        scopeWhere,
        ticketId: query.selectedTicketId,
      })
    : null;

  const [
    listRows,
    resultCount,
    statusCounts,
    assignedToMe,
    resolvedToday,
    teamMembers,
  ] = await Promise.all([
    prisma.supportTicket.findMany({
      orderBy:
        direction === "previous"
          ? [{ lastActivityAt: "asc" }, { id: "asc" }]
          : [{ lastActivityAt: "desc" }, { id: "desc" }],
      select: SUPPORT_SUMMARY_SELECT,
      take: SUPPORT_PAGE_SIZE + 1,
      where: listWhere,
    }),
    prisma.supportTicket.count({ where: filteredWhere }),
    prisma.supportTicket.groupBy({
      _count: { _all: true },
      by: ["status"],
      where: scopeWhere,
    }),
    canManage
      ? prisma.supportTicket.count({
          where: {
            assignedToId: session.userId,
            status: { in: [...ACTIVE_SUPPORT_STATUSES] },
          },
        })
      : Promise.resolve(0),
    prisma.supportTicket.count({
      where: {
        AND: [scopeWhere, { resolvedAt: { gte: today } }],
      },
    }),
    canManage
      ? prisma.user.findMany({
          orderBy: [{ name: "asc" }, { email: "asc" }],
          select: { email: true, id: true, name: true },
          where: {
            role: { in: ["SUPER_ADMIN", "ADMIN", "MANAGER", "CONSULTANT"] },
            status: "ACTIVE",
          },
        })
      : Promise.resolve([]),
  ]);

  const hasExtraRow = listRows.length > SUPPORT_PAGE_SIZE;
  const pageRows = listRows.slice(0, SUPPORT_PAGE_SIZE);

  if (direction === "previous") {
    pageRows.reverse();
  }

  const tickets = pageRows.map(mapSummary);
  let selectedTicket = requestedTicketPromise
    ? await requestedTicketPromise
    : null;

  if (!selectedTicket && tickets[0]) {
    selectedTicket = await findTicketDetail({
      canManage,
      scopeWhere,
      ticketId: tickets[0].id,
    });
  }

  const hasPrevious = cursor ? direction === "next" || hasExtraRow : false;
  const hasNext = cursor
    ? direction === "previous" || hasExtraRow
    : hasExtraRow;
  const statusCountMap = new Map(
    statusCounts.map((entry) => [entry.status, entry._count._all]),
  );
  const mine = [...statusCountMap.values()].reduce(
    (total, count) => total + count,
    0,
  );

  return {
    canCreate,
    canManage,
    currentUserId: session.userId,
    filters: {
      category: query.category ?? "all",
      priority: query.priority ?? "all",
      query: query.query ?? "",
      status: query.status ?? "all",
    },
    metrics: {
      assignedToMe,
      mine,
      open: ACTIVE_SUPPORT_STATUSES.reduce(
        (total, status) => total + (statusCountMap.get(status) ?? 0),
        0,
      ),
      resolvedToday,
      waiting: statusCountMap.get("WAITING_FOR_REQUESTER") ?? 0,
    },
    pagination: {
      nextCursor:
        hasNext && pageRows.at(-1) ? encodeCursor(pageRows.at(-1)!) : null,
      previousCursor:
        hasPrevious && pageRows[0] ? encodeCursor(pageRows[0]) : null,
      resultCount,
    },
    selectedTicket,
    teamMembers: teamMembers.map((member) => ({
      email: member.email,
      id: member.id,
      name: member.name || member.email,
    })),
    tickets,
  };
}

function buildFilteredWhere(
  scopeWhere: Prisma.SupportTicketWhereInput,
  query: SupportWorkspaceQuery,
): Prisma.SupportTicketWhereInput {
  const and: Prisma.SupportTicketWhereInput[] = [scopeWhere];
  const search = query.query?.trim().slice(0, 100);

  if (query.category) and.push({ category: query.category });
  if (query.priority) and.push({ priority: query.priority });
  if (query.status) and.push({ status: query.status });
  if (search) {
    and.push({
      OR: [
        { code: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        {
          requesterNameSnapshot: { contains: search, mode: "insensitive" },
        },
        {
          requesterEmailSnapshot: { contains: search, mode: "insensitive" },
        },
      ],
    });
  }

  return { AND: and };
}

function buildCursorWhere(
  cursor: { at: Date; id: string },
  previous: boolean,
): Prisma.SupportTicketWhereInput {
  const dateOperator = previous ? { gt: cursor.at } : { lt: cursor.at };
  const idOperator = previous ? { gt: cursor.id } : { lt: cursor.id };

  return {
    OR: [
      { lastActivityAt: dateOperator },
      { id: idOperator, lastActivityAt: cursor.at },
    ],
  };
}

async function findTicketDetail({
  canManage,
  scopeWhere,
  ticketId,
}: {
  canManage: boolean;
  scopeWhere: Prisma.SupportTicketWhereInput;
  ticketId: string;
}): Promise<SupportTicketRecord | null> {
  const ticket = await prisma.supportTicket.findFirst({
    select: {
      ...SUPPORT_SUMMARY_SELECT,
      closedAt: true,
      description: true,
      messages: {
        orderBy: { createdAt: "desc" },
        select: {
          attachments: {
            select: {
              fileName: true,
              fileSize: true,
              fileUrl: true,
              id: true,
              mimeType: true,
            },
          },
          author: { select: { email: true, id: true, name: true } },
          body: true,
          createdAt: true,
          id: true,
          kind: true,
        },
        take: SUPPORT_MESSAGE_LIMIT + 1,
        ...(canManage ? {} : { where: { kind: { not: "INTERNAL_NOTE" } } }),
      },
      relatedModule: true,
      resolvedAt: true,
    },
    where: { AND: [scopeWhere, { id: ticketId }] },
  });

  if (!ticket) return null;

  const messageLimitReached = ticket.messages.length > SUPPORT_MESSAGE_LIMIT;
  const messages = ticket.messages.slice(0, SUPPORT_MESSAGE_LIMIT).reverse();
  const accessUrls = await createDocumentAccessUrls(
    messages.flatMap((message) =>
      message.attachments.map((attachment) => attachment.fileUrl),
    ),
  );

  return {
    ...mapSummary(ticket),
    closedAt: ticket.closedAt?.toISOString() ?? null,
    createdAt: ticket.createdAt.toISOString(),
    description: ticket.description,
    firstResponseAt: ticket.firstResponseAt?.toISOString() ?? null,
    messageLimitReached,
    messages: messages.map((message) => ({
      attachments: message.attachments.map((attachment) => ({
        fileName: attachment.fileName,
        fileSize: attachment.fileSize,
        id: attachment.id,
        mimeType: attachment.mimeType,
        url: accessUrls.get(attachment.fileUrl) ?? null,
      })),
      author: message.author
        ? {
            email: message.author.email,
            id: message.author.id,
            name: message.author.name || message.author.email,
          }
        : null,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      id: message.id,
      kind: message.kind,
    })),
    relatedModule: ticket.relatedModule,
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
  };
}

function mapSummary(ticket: SupportSummaryRow): SupportTicketSummaryRecord {
  return {
    assignedTo: ticket.assignedTo
      ? {
          email: ticket.assignedTo.email,
          id: ticket.assignedTo.id,
          name: ticket.assignedTo.name || ticket.assignedTo.email,
        }
      : null,
    category: ticket.category,
    code: ticket.code,
    id: ticket.id,
    lastActivityAt: ticket.lastActivityAt.toISOString(),
    priority: ticket.priority,
    requesterEmail: ticket.requesterEmailSnapshot,
    requesterId: ticket.requesterId,
    requesterName: ticket.requesterNameSnapshot,
    ...getSlaState({
      createdAt: ticket.createdAt,
      firstResponseAt: ticket.firstResponseAt,
      priority: ticket.priority,
    }),
    status: ticket.status,
    subject: ticket.subject,
  };
}

function encodeCursor(
  ticket: Pick<SupportSummaryRow, "id" | "lastActivityAt">,
) {
  return Buffer.from(
    JSON.stringify({ at: ticket.lastActivityAt.toISOString(), id: ticket.id }),
  ).toString("base64url");
}

function decodeCursor(value?: string) {
  if (!value || value.length > 512) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as {
      at?: unknown;
      id?: unknown;
    };
    const at = typeof parsed.at === "string" ? new Date(parsed.at) : null;

    if (
      !at ||
      Number.isNaN(at.getTime()) ||
      typeof parsed.id !== "string" ||
      parsed.id.length > 128
    ) {
      return null;
    }

    return { at, id: parsed.id };
  } catch {
    return null;
  }
}

function getSlaState({
  createdAt,
  firstResponseAt,
  priority,
}: {
  createdAt: Date;
  firstResponseAt: Date | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}) {
  if (firstResponseAt) {
    return { slaBreached: false, slaLabel: "İlk cavab verildi" };
  }

  const targetMinutes = { LOW: 480, MEDIUM: 240, HIGH: 60, URGENT: 30 }[
    priority
  ];
  const remaining = createdAt.getTime() + targetMinutes * 60_000 - Date.now();

  if (remaining <= 0) {
    return { slaBreached: true, slaLabel: "SLA vaxtı keçib" };
  }

  const minutes = Math.ceil(remaining / 60_000);
  const value =
    minutes >= 60 ? `${Math.floor(minutes / 60)} saat` : `${minutes} dəq`;
  return { slaBreached: false, slaLabel: `İlk cavab: ${value} qalıb` };
}
