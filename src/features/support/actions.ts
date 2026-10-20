"use server";

import { randomBytes, randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  SUPPORT_FILE_MAX_BYTES,
  SUPPORT_FILE_MIME_TYPES,
} from "@/features/support/constants";
import {
  createSupportTicketSchema,
  supportReplySchema,
  supportTicketPrioritySchema,
  supportTicketStatusSchema,
} from "@/features/support/schemas";
import type { SupportActionState } from "@/features/support/types";
import { defaultLocale } from "@/i18n/routing";
import { can } from "@/lib/auth/permissions";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  deleteStorageFile,
  uploadSupportTicketAttachmentFile,
} from "@/lib/supabase/storage";

export async function createSupportTicketAction(
  _previousState: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const session = await requirePermission("tickets:create");
  const file = getFile(formData, "attachment");
  const parsed = createSupportTicketSchema.safeParse({
    category: getString(formData, "category"),
    description: getString(formData, "description"),
    priority: getString(formData, "priority"),
    relatedModule: emptyToUndefined(getString(formData, "relatedModule")),
    subject: getString(formData, "subject"),
  });

  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  const fileError = file ? getSupportFileError(file) : null;

  if (fileError) {
    return {
      fieldErrors: { attachment: [fileError] },
      message: fileError,
      status: "error",
    };
  }

  const requester = await prisma.user.findUnique({
    select: { email: true, id: true, name: true },
    where: { id: session.userId },
  });

  if (!requester) {
    return actionError("İstifadəçi hesabı tapılmadı.");
  }

  const ticketId = randomUUID();
  const messageId = randomUUID();
  let uploadedFile:
    | Awaited<ReturnType<typeof uploadSupportTicketAttachmentFile>>
    | undefined;

  try {
    if (file) {
      uploadedFile = await uploadSupportTicketAttachmentFile({
        file,
        messageId,
        ticketId,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.supportTicket.create({
        data: {
          category: parsed.data.category,
          code: createTicketCode(),
          description: parsed.data.description,
          id: ticketId,
          priority: parsed.data.priority,
          relatedModule: parsed.data.relatedModule,
          requesterEmailSnapshot: requester.email,
          requesterId: requester.id,
          requesterNameSnapshot: requester.name || requester.email,
          subject: parsed.data.subject,
        },
      });
      await tx.supportTicketMessage.create({
        data: {
          authorId: requester.id,
          body: parsed.data.description,
          id: messageId,
          kind: "PUBLIC_REPLY",
          ticketId,
        },
      });

      if (uploadedFile) {
        await tx.supportTicketAttachment.create({
          data: {
            fileName: uploadedFile.fileName,
            fileSize: uploadedFile.fileSize,
            fileUrl: uploadedFile.fileUrl,
            messageId,
            mimeType: uploadedFile.mimeType,
            ticketId,
            uploadedById: requester.id,
          },
        });
      }

      await tx.supportTicketActivity.create({
        data: {
          action: "CREATED",
          actorId: requester.id,
          detail: "Ticket yaradıldı.",
          metadata: {
            category: parsed.data.category,
            priority: parsed.data.priority,
          },
          ticketId,
        },
      });

      if (uploadedFile) {
        await tx.supportTicketActivity.create({
          data: {
            action: "ATTACHMENT_ADDED",
            actorId: requester.id,
            detail: uploadedFile.fileName,
            ticketId,
          },
        });
      }
    });
  } catch {
    if (uploadedFile) {
      await deleteStorageFile(uploadedFile.fileUrl).catch(() => undefined);
    }

    return actionError(
      file
        ? "Ticket və ya fayl yadda saxlanmadı. Storage bağlantısını yoxlayın."
        : "Ticket yaradılmadı. Bir qədər sonra yenidən cəhd edin.",
    );
  }

  revalidateSupport();
  redirect(
    buildSupportReturnTo(formData, {
      success: "ticket-created",
      ticket: ticketId,
    }),
  );
}

export async function replySupportTicketAction(
  _previousState: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const session = await requirePermission("tickets:read");
  const file = getFile(formData, "attachment");
  const body =
    getString(formData, "body") || (file ? "Fayl əlavə edildi." : "");
  const parsed = supportReplySchema.safeParse({
    body,
    internal: getBoolean(formData, "internal"),
    ticketId: getString(formData, "ticketId"),
  });

  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  const canManage = can(session.role, "tickets:manage");

  if (parsed.data.internal && !canManage) {
    return actionError("Daxili qeyd yalnız dəstək komandası üçün əlçatandır.");
  }

  const fileError = file ? getSupportFileError(file) : null;

  if (fileError) {
    return {
      fieldErrors: { attachment: [fileError] },
      message: fileError,
      status: "error",
    };
  }

  const ticket = await prisma.supportTicket.findUnique({
    select: {
      firstResponseAt: true,
      id: true,
      requesterId: true,
      status: true,
    },
    where: { id: parsed.data.ticketId },
  });

  if (!ticket || (!canManage && ticket.requesterId !== session.userId)) {
    return actionError("Ticket tapılmadı və ya bu ticket-ə girişiniz yoxdur.");
  }

  const messageId = randomUUID();
  let uploadedFile:
    | Awaited<ReturnType<typeof uploadSupportTicketAttachmentFile>>
    | undefined;

  try {
    if (file) {
      uploadedFile = await uploadSupportTicketAttachmentFile({
        file,
        messageId,
        ticketId: ticket.id,
      });
    }

    const now = new Date();
    const isPublicReply = !parsed.data.internal;
    const isSupportReply = canManage && ticket.requesterId !== session.userId;
    const shouldReopen =
      isPublicReply &&
      (ticket.status === "RESOLVED" || ticket.status === "CLOSED");
    const shouldStart = isSupportReply && ticket.status === "NEW";

    await prisma.$transaction(async (tx) => {
      await tx.supportTicketMessage.create({
        data: {
          authorId: session.userId,
          body: parsed.data.body,
          id: messageId,
          kind: parsed.data.internal ? "INTERNAL_NOTE" : "PUBLIC_REPLY",
          ticketId: ticket.id,
        },
      });

      if (uploadedFile) {
        await tx.supportTicketAttachment.create({
          data: {
            fileName: uploadedFile.fileName,
            fileSize: uploadedFile.fileSize,
            fileUrl: uploadedFile.fileUrl,
            messageId,
            mimeType: uploadedFile.mimeType,
            ticketId: ticket.id,
            uploadedById: session.userId,
          },
        });
      }

      await tx.supportTicket.update({
        data: {
          closedAt: shouldReopen ? null : undefined,
          firstResponseAt:
            isSupportReply && !ticket.firstResponseAt ? now : undefined,
          lastActivityAt: now,
          resolvedAt: shouldReopen ? null : undefined,
          status: shouldReopen || shouldStart ? "IN_PROGRESS" : undefined,
        },
        where: { id: ticket.id },
      });

      await tx.supportTicketActivity.create({
        data: {
          action: parsed.data.internal ? "INTERNAL_NOTE_ADDED" : "REPLIED",
          actorId: session.userId,
          detail: parsed.data.internal
            ? "Daxili qeyd əlavə edildi."
            : "Cavab göndərildi.",
          ticketId: ticket.id,
        },
      });

      if (uploadedFile) {
        await tx.supportTicketActivity.create({
          data: {
            action: "ATTACHMENT_ADDED",
            actorId: session.userId,
            detail: uploadedFile.fileName,
            ticketId: ticket.id,
          },
        });
      }

      if (shouldReopen || shouldStart) {
        await tx.supportTicketActivity.create({
          data: {
            action: "STATUS_CHANGED",
            actorId: session.userId,
            detail: shouldReopen
              ? "Ticket yenidən açıldı."
              : "Araşdırma başladı.",
            metadata: { from: ticket.status, to: "IN_PROGRESS" },
            ticketId: ticket.id,
          },
        });
      }
    });
  } catch {
    if (uploadedFile) {
      await deleteStorageFile(uploadedFile.fileUrl).catch(() => undefined);
    }

    return actionError(
      "Cavab göndərilmədi. Bir qədər sonra yenidən cəhd edin.",
    );
  }

  revalidateSupport();
  redirect(
    buildSupportReturnTo(formData, {
      success: "reply-sent",
      ticket: ticket.id,
    }),
  );
}

export async function updateSupportTicketStatusAction(formData: FormData) {
  const session = await requirePermission("tickets:manage");
  const ticketId = getString(formData, "ticketId");
  const parsed = supportTicketStatusSchema.safeParse(
    getString(formData, "status"),
  );

  if (!ticketId || !parsed.success) {
    redirect(
      buildSupportReturnTo(formData, {
        error: "invalid-status",
        ticket: ticketId,
      }),
    );
  }

  const existing = await prisma.supportTicket.findUnique({
    select: { status: true },
    where: { id: ticketId },
  });

  if (!existing) {
    redirect(buildSupportReturnTo(formData, { error: "ticket-not-found" }));
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.supportTicket.update({
      data: {
        closedAt: parsed.data === "CLOSED" ? now : null,
        lastActivityAt: now,
        resolvedAt: parsed.data === "RESOLVED" ? now : null,
        status: parsed.data,
      },
      where: { id: ticketId },
    }),
    prisma.supportTicketActivity.create({
      data: {
        action: "STATUS_CHANGED",
        actorId: session.userId,
        detail: "Ticket statusu yeniləndi.",
        metadata: { from: existing.status, to: parsed.data },
        ticketId,
      },
    }),
  ]);

  revalidateSupport();
  redirect(
    buildSupportReturnTo(formData, {
      success: "status-updated",
      ticket: ticketId,
    }),
  );
}

export async function updateSupportTicketPriorityAction(formData: FormData) {
  const session = await requirePermission("tickets:manage");
  const ticketId = getString(formData, "ticketId");
  const parsed = supportTicketPrioritySchema.safeParse(
    getString(formData, "priority"),
  );

  if (!ticketId || !parsed.success) {
    redirect(
      buildSupportReturnTo(formData, {
        error: "invalid-priority",
        ticket: ticketId,
      }),
    );
  }

  const existing = await prisma.supportTicket.findUnique({
    select: { priority: true },
    where: { id: ticketId },
  });

  if (!existing) {
    redirect(buildSupportReturnTo(formData, { error: "ticket-not-found" }));
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.supportTicket.update({
      data: { lastActivityAt: now, priority: parsed.data },
      where: { id: ticketId },
    }),
    prisma.supportTicketActivity.create({
      data: {
        action: "PRIORITY_CHANGED",
        actorId: session.userId,
        detail: "Ticket prioriteti yeniləndi.",
        metadata: { from: existing.priority, to: parsed.data },
        ticketId,
      },
    }),
  ]);

  revalidateSupport();
  redirect(
    buildSupportReturnTo(formData, {
      success: "priority-updated",
      ticket: ticketId,
    }),
  );
}

export async function assignSupportTicketAction(formData: FormData) {
  const session = await requirePermission("tickets:manage");
  const ticketId = getString(formData, "ticketId");
  const assigneeValue = getString(formData, "assignedToId");
  const assignedToId = assigneeValue === "unassigned" ? null : assigneeValue;

  if (!ticketId) {
    redirect(buildSupportReturnTo(formData, { error: "ticket-not-found" }));
  }

  if (assignedToId) {
    const member = await prisma.user.findFirst({
      select: { id: true },
      where: {
        id: assignedToId,
        role: { in: ["SUPER_ADMIN", "ADMIN", "MANAGER", "CONSULTANT"] },
        status: "ACTIVE",
      },
    });

    if (!member) {
      redirect(
        buildSupportReturnTo(formData, {
          error: "invalid-assignee",
          ticket: ticketId,
        }),
      );
    }
  }

  const existing = await prisma.supportTicket.findUnique({
    select: { assignedToId: true, status: true },
    where: { id: ticketId },
  });

  if (!existing) {
    redirect(buildSupportReturnTo(formData, { error: "ticket-not-found" }));
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.supportTicket.update({
      data: {
        assignedToId,
        lastActivityAt: now,
        status:
          assignedToId && existing.status === "NEW" ? "IN_PROGRESS" : undefined,
      },
      where: { id: ticketId },
    }),
    prisma.supportTicketActivity.create({
      data: {
        action: "ASSIGNED",
        actorId: session.userId,
        detail: assignedToId
          ? "Ticket məsul şəxsə təyin edildi."
          : "Təyinat silindi.",
        metadata: { from: existing.assignedToId, to: assignedToId },
        ticketId,
      },
    }),
  ]);

  revalidateSupport();
  redirect(
    buildSupportReturnTo(formData, {
      success: "assignment-updated",
      ticket: ticketId,
    }),
  );
}

function getSupportFileError(file: File) {
  if (file.size > SUPPORT_FILE_MAX_BYTES) {
    return "Fayl 10 MB-dan böyük ola bilməz.";
  }

  const allowedType = SUPPORT_FILE_MIME_TYPES.includes(
    file.type as (typeof SUPPORT_FILE_MIME_TYPES)[number],
  );
  const allowedExtension = /\.(pdf|png|jpe?g)$/i.test(file.name);

  if (!allowedType && !allowedExtension) {
    return "Yalnız PNG, JPG və PDF faylları qəbul edilir.";
  }

  return null;
}

function getFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "true" || value === "on";
}

function emptyToUndefined(value: string) {
  return value || undefined;
}

function validationError(fieldErrors: Record<string, string[] | undefined>) {
  return {
    fieldErrors: Object.fromEntries(
      Object.entries(fieldErrors).filter(([, messages]) => messages?.length),
    ) as Record<string, string[]>,
    message: "Form məlumatlarını yoxlayın.",
    status: "error" as const,
  };
}

function actionError(message: string): SupportActionState {
  return { message, status: "error" };
}

function createTicketCode() {
  const year = new Date().getUTCFullYear();
  const randomNumber = randomBytes(3).readUIntBE(0, 3) % 1_000_000;
  return `TCK-${year}-${String(randomNumber).padStart(6, "0")}`;
}

function buildSupportReturnTo(
  formData: FormData,
  params: { error?: string; success?: string; ticket?: string },
) {
  const rawReturnTo = getString(formData, "returnTo");
  const safeReturnTo =
    rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")
      ? new URL(rawReturnTo, "https://support.local")
      : new URL("/support", "https://support.local");
  const pathname = /\/support\/?$/.test(safeReturnTo.pathname)
    ? safeReturnTo.pathname
    : "/support";
  const redirectPathname = /^\/support\/?$/.test(pathname)
    ? `/${defaultLocale}/support`
    : pathname;
  const searchParams = new URLSearchParams();

  for (const key of ["category", "priority", "q", "status"] as const) {
    const value = safeReturnTo.searchParams.get(key)?.trim();
    const maxLength = key === "q" ? 100 : 32;
    if (value && value.length <= maxLength) searchParams.set(key, value);
  }

  if (params.ticket) searchParams.set("ticket", params.ticket);
  if (params.success) searchParams.set("success", params.success);
  if (params.error) searchParams.set("error", params.error);

  const search = searchParams.toString();
  return search ? `${redirectPathname}?${search}` : redirectPathname;
}

function revalidateSupport() {
  for (const path of [
    "/support",
    "/az/support",
    "/en/support",
    "/ru/support",
    "/tr/support",
  ]) {
    revalidatePath(path);
  }
}
