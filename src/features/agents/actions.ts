"use server";

import { randomBytes, scryptSync } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { agentCreateSchema } from "@/features/agents/schemas";
import type { RelatedEntityType } from "@/generated/prisma/client";
import {
  getSessionAgentId,
  requirePermission,
  requireSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  deleteStorageFile,
  uploadAgentLogoFile,
} from "@/lib/supabase/storage";

export type ActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const initialActionErrorMessage = "Agent yaradıla bilmədi.";
const maxAgentPhotoBytes = 5 * 1024 * 1024;
const allowedAgentPhotoTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function createAgentAction(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requirePermission("agents:create");
  const parsed = agentCreateSchema.safeParse({
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    companyName: getString(formData, "companyName"),
    logoUrl: getString(formData, "logoUrl"),
    profilePhotoUrl: getString(formData, "profilePhotoUrl"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    phone: getString(formData, "mobilePhone"),
    country: getString(formData, "country"),
    address: getString(formData, "address"),
    instagramUrl: getString(formData, "instagramUrl"),
    socialLinks: parseJsonArray(formData, "socialLinksJson"),
    contacts: parseJsonArray(formData, "contactsJson"),
    internalNotes: getString(formData, "internalNotes"),
    portalStatus: "READY",
    tier: "STARTER",
    canRegisterStudents: getBoolean(formData, "canRegisterStudents"),
    ownStudentsOnly: getBoolean(formData, "ownStudentsOnly"),
    portalReporting: getBoolean(formData, "portalReporting"),
  });

  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  const file = getFile(formData, "profilePhoto");
  const photoValidationMessage = file ? validateAgentPhotoFile(file) : null;

  if (photoValidationMessage) {
    return {
      status: "error",
      message: photoValidationMessage,
      fieldErrors: { profilePhotoUrl: [photoValidationMessage] },
    };
  }

  let profilePhotoUrl = parsed.data.profilePhotoUrl;
  let uploadedPhotoUrl = "";

  if (file) {
    try {
      const uploadedLogo = await uploadAgentLogoFile({ file });
      profilePhotoUrl = uploadedLogo.fileUrl;
      uploadedPhotoUrl = uploadedLogo.fileUrl;
    } catch (error) {
      return {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Agentin profil şəkli yüklənə bilmədi.",
      };
    }
  }

  try {
    const currentUserId = session.userId;
    const passwordHash = hashPassword(parsed.data.password);
    const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`;
    const agentLogValue = Object.fromEntries(
      Object.entries(parsed.data).filter(([key]) => key !== "password"),
    );

    await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: parsed.data.email },
        select: { id: true, role: true },
      });

      if (existingUser && existingUser.role !== "AGENT") {
        throw new AgentActionError("email-owned-by-staff");
      }

      const portalUser = existingUser
        ? await tx.user.update({
            where: { id: existingUser.id },
            data: {
              name: fullName,
              status: "ACTIVE",
            },
            select: { id: true },
          })
        : await tx.user.create({
            data: {
              email: parsed.data.email,
              name: fullName,
              role: "AGENT",
              status: "ACTIVE",
            },
            select: { id: true },
          });

      // Older production databases use logo_url as the agent's image field.
      // Keeping one canonical column avoids selecting the unavailable
      // profile_photo_url column while preserving the current UI contract.
      const agentImageUrl = profilePhotoUrl || parsed.data.logoUrl;
      const agent = await tx.agent.create({
        data: {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          companyName: emptyToNull(parsed.data.companyName),
          logoUrl: emptyToNull(agentImageUrl),
          email: parsed.data.email,
          passwordHash,
          phone: emptyToNull(parsed.data.phone),
          country: emptyToNull(parsed.data.country),
          address: emptyToNull(parsed.data.address),
          instagramUrl: emptyToNull(parsed.data.instagramUrl),
          internalNotes: emptyToNull(parsed.data.internalNotes),
          portalStatus: parsed.data.portalStatus,
          tier: parsed.data.tier,
          canRegisterStudents: parsed.data.canRegisterStudents,
          ownStudentsOnly: parsed.data.ownStudentsOnly,
          portalReporting: parsed.data.portalReporting,
          userId: portalUser.id,
          createdById: currentUserId,
          socialLinks: {
            create: parsed.data.socialLinks.map((socialLink) => ({
              platform: socialLink.platform,
              url: socialLink.url,
            })),
          },
          contacts: {
            create: parsed.data.contacts.map((contact) => ({
              email: emptyToNull(contact.email),
              fullName: contact.fullName,
              isPrimary: contact.isPrimary,
              phone: emptyToNull(contact.phone),
              position: emptyToNull(contact.position),
              whatsapp: emptyToNull(contact.whatsapp),
            })),
          },
        },
        select: { id: true },
      });

      await tx.activityLog.create({
        data: {
          entityType: "AGENT" satisfies RelatedEntityType,
          entityId: agent.id,
          action: "CREATED",
          newValue: {
            ...agentLogValue,
            profilePhotoUrl: agentImageUrl,
          },
          userId: currentUserId,
        },
      });
    });
  } catch (error) {
    if (uploadedPhotoUrl) {
      await deleteStorageFile(uploadedPhotoUrl).catch(() => undefined);
    }

    return databaseError(error, initialActionErrorMessage);
  }

  revalidateAgents();
  redirect("/agents?success=agent-created");
}

export async function markAgentNotificationReadAction(formData: FormData) {
  const notificationId = getString(formData, "notificationId");
  const session = await requireSession();
  const agentId = getSessionAgentId(session);

  if (!agentId || !notificationId) {
    return;
  }

  await prisma.agentNotification.updateMany({
    data: { readAt: new Date() },
    where: {
      agentId,
      id: notificationId,
      readAt: null,
    },
  });

  revalidateAgentNotifications();
}

export async function markAllAgentNotificationsReadAction() {
  const session = await requireSession();
  const agentId = getSessionAgentId(session);

  if (!agentId) {
    return;
  }

  await prisma.agentNotification.updateMany({
    data: { readAt: new Date() },
    where: { agentId, readAt: null },
  });

  revalidateAgentNotifications();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return trimmed === "__none__" || trimmed === "__empty" ? "" : trimmed;
}

function getBoolean(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

function getFile(formData: FormData, key: string) {
  const value = formData.get(key);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function parseJsonArray(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function validateAgentPhotoFile(file: File) {
  if (!allowedAgentPhotoTypes.has(file.type)) {
    return "Profil şəkli JPG, PNG və ya WebP formatında olmalıdır.";
  }

  if (file.size > maxAgentPhotoBytes) {
    return "Profil şəkli 5 MB-dan böyük ola bilməz.";
  }

  return null;
}

function emptyToNull(value?: string) {
  return value && value.length > 0 ? value : null;
}

function validationError(fieldErrors: Record<string, string[] | undefined>) {
  return {
    status: "error" as const,
    message: "Zəhmət olmasa işarələnmiş sahələri yoxlayın.",
    fieldErrors: Object.fromEntries(
      Object.entries(fieldErrors).filter(
        ([, value]) => value && value.length > 0,
      ),
    ) as Record<string, string[]>,
  };
}

function databaseError(error: unknown, fallbackMessage: string): ActionState {
  if (error instanceof AgentActionError) {
    return {
      status: "error",
      message: "Bu e-poçt artıq əməkdaş hesabında istifadə olunur.",
    };
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  if (code === "P2002") {
    return {
      status: "error",
      message: "Bu e-poçtla agent artıq mövcuddur.",
    };
  }

  return {
    status: "error",
    message: fallbackMessage,
  };
}

function revalidateAgents() {
  revalidatePath("/agents");
  revalidatePath("/az/agents");
}

function revalidateAgentNotifications() {
  revalidatePath("/dashboard");
  revalidatePath("/updates");
  revalidatePath("/az/dashboard");
  revalidatePath("/az/updates");
}

class AgentActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentActionError";
  }
}
