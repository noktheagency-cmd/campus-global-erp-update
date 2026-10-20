import type { Prisma } from "@/generated/prisma/client";

export const STUDENT_CHAT_ACTIVITY_KIND = "student-chat-message";

export type StudentChatMessage = {
  id: string;
  body: string;
  authorEmail: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
  createdAtIso: string;
  senderPortalType: "agent" | "staff" | "student";
};

export type StudentChatActivityRecord = {
  createdAt: Date;
  id: string;
  newValue: Prisma.JsonValue | null;
  user: {
    email: string;
    name: string | null;
    role: string;
  } | null;
};

export function buildStudentChatPayload({
  applicationId,
  body,
  senderPortalType,
  senderRole,
  studentId,
}: {
  applicationId?: string | null;
  body: string;
  senderPortalType: "agent" | "staff" | "student";
  senderRole: string;
  studentId: string;
}) {
  return {
    applicationId: applicationId || null,
    body,
    kind: STUDENT_CHAT_ACTIVITY_KIND,
    senderPortalType,
    senderRole,
    studentId,
  };
}

export function mapStudentChatMessage(
  activity: StudentChatActivityRecord,
): StudentChatMessage | null {
  const payload = getChatPayload(activity.newValue);

  if (!payload) {
    return null;
  }

  return {
    authorEmail: activity.user?.email ?? "",
    authorName:
      activity.user?.name ||
      activity.user?.email ||
      formatRole(payload.senderRole),
    authorRole: formatRole(payload.senderRole),
    body: payload.body,
    createdAt: formatDateTime(activity.createdAt),
    createdAtIso: activity.createdAt.toISOString(),
    id: activity.id,
    senderPortalType: payload.senderPortalType,
  };
}

export function mapStudentChatMessages(
  activities: StudentChatActivityRecord[],
) {
  return activities
    .map(mapStudentChatMessage)
    .filter((message): message is StudentChatMessage => Boolean(message));
}

export function isStudentChatActivity(value: Prisma.JsonValue | null) {
  return Boolean(getChatPayload(value));
}

function getChatPayload(value: Prisma.JsonValue | null) {
  if (!isPlainObject(value) || value.kind !== STUDENT_CHAT_ACTIVITY_KIND) {
    return null;
  }

  const body = typeof value.body === "string" ? value.body.trim() : "";
  let senderPortalType: StudentChatMessage["senderPortalType"] = "staff";

  if (
    value.senderPortalType === "student" ||
    value.senderPortalType === "agent" ||
    value.senderPortalType === "staff"
  ) {
    senderPortalType = value.senderPortalType;
  }
  const senderRole =
    typeof value.senderRole === "string" ? value.senderRole : senderPortalType;

  if (!body) {
    return null;
  }

  return {
    body,
    senderPortalType,
    senderRole,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("az", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatRole(value: string) {
  const labels: Record<string, string> = {
    ADMIN: "Admin",
    AGENT: "Agent",
    CONSULTANT: "Məsləhətçi",
    FINANCE: "Maliyyə",
    MANAGER: "Menecer",
    READ_ONLY: "İzləyici",
    STUDENT: "Tələbə",
    SUPER_ADMIN: "Super admin",
  };

  return labels[value] ?? value;
}
