"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildStudentChatPayload } from "@/features/applications/student-chat";
import { can } from "@/lib/auth/permissions";
import {
  getSessionAgentId,
  getSessionStudentId,
  requireSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const maxMessageLength = 1200;

export async function sendStudentChatMessageAction(formData: FormData) {
  const session = await requireSession();
  const studentId = getString(formData, "studentId");
  const applicationId = emptyToNull(getString(formData, "applicationId"));
  const returnTo = normalizeReturnTo(getString(formData, "returnTo"));
  const body = getString(formData, "body").trim();

  if (!studentId) {
    redirect(withParam(returnTo, "error", "message-forbidden"));
  }

  if (!body) {
    redirect(withParam(returnTo, "error", "message-empty"));
  }

  if (body.length > maxMessageLength) {
    redirect(withParam(returnTo, "error", "message-too-long"));
  }

  const student = await prisma.student.findUnique({
    select: {
      agentId: true,
      id: true,
      status: true,
    },
    where: { id: studentId },
  });

  if (!student || student.status !== "ACTIVE") {
    redirect(withParam(returnTo, "error", "message-forbidden"));
  }

  const scopedStudentId = getSessionStudentId(session);
  const scopedAgentId = getSessionAgentId(session);
  const hasAccess =
    (session.portalType === "student" && scopedStudentId === studentId) ||
    (session.portalType === "agent" && scopedAgentId === student.agentId) ||
    (session.portalType === "staff" &&
      (can(session.role, "students:read") ||
        can(session.role, "applications:read")));

  if (!hasAccess) {
    redirect(withParam(returnTo, "error", "message-forbidden"));
  }

  await prisma.activityLog.create({
    data: {
      action: "UPDATED",
      entityId: studentId,
      entityType: "STUDENT",
      newValue: buildStudentChatPayload({
        applicationId,
        body,
        senderPortalType: session.portalType,
        senderRole: session.role,
        studentId,
      }),
      userId: session.userId,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/az/dashboard");
  revalidatePath(`/applications/students/${studentId}`);
  revalidatePath(`/az/applications/students/${studentId}`);

  redirect(withParam(returnTo, "success", "message-sent"));
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function emptyToNull(value: string) {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeReturnTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function withParam(path: string, key: "error" | "success", value: string) {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.delete("error");
  params.delete("success");
  params.set(key, value);
  const search = params.toString();

  return search ? `${pathname}?${search}` : pathname;
}
