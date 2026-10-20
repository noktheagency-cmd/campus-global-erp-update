"use server";

import { revalidatePath } from "next/cache";

import {
  crmInteractionCreateSchema,
  crmProfileUpdateSchema,
  crmTaskCreateSchema,
  crmTaskStatusSchema,
  crmSubjectSchema,
} from "@/features/crm/schemas";
import type { CrmActionResult, CrmSubjectInput } from "@/features/crm/types";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";

export async function createCrmTaskAction(
  input: unknown,
): Promise<CrmActionResult> {
  const session = await requirePermission("crm:manage");
  const parsed = crmTaskCreateSchema.safeParse(input);

  if (!parsed.success) {
    return { message: "Tapşırıq məlumatları natamamdır.", ok: false };
  }

  try {
    const profile = await ensureCrmProfile(parsed.data, session.userId);

    await prisma.$transaction([
      prisma.crmTask.create({
        data: {
          assignedToId: parsed.data.assignedToId || session.userId,
          createdById: session.userId,
          description: parsed.data.description || null,
          dueAt: parsed.data.dueAt,
          priority: parsed.data.priority,
          profileId: profile.id,
          title: parsed.data.title,
        },
      }),
      prisma.crmProfile.update({
        data: { nextFollowUpAt: parsed.data.dueAt },
        where: { id: profile.id },
      }),
    ]);
  } catch (error) {
    return actionError("Tapşırıq yaradıla bilmədi.", error);
  }

  revalidateCrm();
  return { message: "Tapşırıq yaradıldı.", ok: true };
}

export async function recordCrmInteractionAction(
  input: unknown,
): Promise<CrmActionResult> {
  const session = await requirePermission("crm:manage");
  const parsed = crmInteractionCreateSchema.safeParse(input);

  if (!parsed.success) {
    return { message: "Əlaqə qeydi üçün məlumatları yoxlayın.", ok: false };
  }

  try {
    const profile = await ensureCrmProfile(parsed.data, session.userId);
    const occurredAt = parsed.data.occurredAt ?? new Date();

    await prisma.$transaction([
      prisma.crmInteraction.create({
        data: {
          authorId: session.userId,
          body: parsed.data.body || null,
          direction: parsed.data.direction,
          occurredAt,
          profileId: profile.id,
          subject: parsed.data.subject,
          type: parsed.data.type,
        },
      }),
      prisma.crmProfile.update({
        data: { lastContactAt: occurredAt },
        where: { id: profile.id },
      }),
    ]);
  } catch (error) {
    return actionError("Əlaqə tarixçəyə əlavə edilə bilmədi.", error);
  }

  revalidateCrm();
  return { message: "Əlaqə tarixçəyə əlavə edildi.", ok: true };
}

export async function updateCrmProfileAction(
  input: unknown,
): Promise<CrmActionResult> {
  const session = await requirePermission("crm:manage");
  const parsed = crmProfileUpdateSchema.safeParse(input);

  if (!parsed.success) {
    return { message: "CRM profil məlumatlarını yoxlayın.", ok: false };
  }

  try {
    const profile = await ensureCrmProfile(parsed.data, session.userId);

    await prisma.crmProfile.update({
      data: {
        nextFollowUpAt: parsed.data.nextFollowUpAt,
        ownerId: parsed.data.ownerId,
        preferredDestination: parsed.data.preferredDestination,
        source: parsed.data.source,
        stage: parsed.data.stage,
        status: parsed.data.status,
      },
      where: { id: profile.id },
    });
  } catch (error) {
    return actionError("CRM profili yenilənə bilmədi.", error);
  }

  revalidateCrm();
  return { message: "CRM profili yeniləndi.", ok: true };
}

export async function updateCrmTaskStatusAction(
  input: unknown,
): Promise<CrmActionResult> {
  await requirePermission("crm:manage");
  const parsed = crmTaskStatusSchema.safeParse(input);

  if (!parsed.success) {
    return { message: "Tapşırıq statusu yanlışdır.", ok: false };
  }

  try {
    await prisma.crmTask.update({
      data: {
        completedAt: parsed.data.status === "COMPLETED" ? new Date() : null,
        status: parsed.data.status,
      },
      where: { id: parsed.data.taskId },
    });
  } catch (error) {
    return actionError("Tapşırıq statusu dəyişdirilə bilmədi.", error);
  }

  revalidateCrm();
  return { message: "Tapşırıq statusu yeniləndi.", ok: true };
}

async function ensureCrmProfile(
  subjectInput: CrmSubjectInput,
  currentUserId: string,
) {
  const subject = crmSubjectSchema.parse(subjectInput);

  if (subject.kind === "individual") {
    const student = await prisma.student.findUnique({
      select: { id: true, stage: true },
      where: { id: subject.subjectId },
    });

    if (!student) {
      throw new Error("Individual CRM subject not found");
    }

    return prisma.crmProfile.upsert({
      create: {
        createdById: currentUserId,
        entityType: "INDIVIDUAL",
        ownerId: currentUserId,
        stage: toInitialStudentStage(student.stage),
        studentId: student.id,
      },
      update: {},
      where: { studentId: student.id },
    });
  }

  const agent = await prisma.agent.findUnique({
    select: { id: true, portalStatus: true },
    where: { id: subject.subjectId },
  });

  if (!agent) {
    throw new Error("Agent CRM subject not found");
  }

  return prisma.crmProfile.upsert({
    create: {
      agentId: agent.id,
      createdById: currentUserId,
      entityType: "AGENT",
      ownerId: currentUserId,
      stage:
        agent.portalStatus === "READY"
          ? "ACTIVE_PARTNER"
          : "PARTNER_ONBOARDING",
    },
    update: {},
    where: { agentId: agent.id },
  });
}

function toInitialStudentStage(stage: string) {
  const normalized = stage.toLowerCase();

  if (normalized.includes("offer")) return "OFFER" as const;
  if (normalized.includes("enroll")) return "ENROLLED" as const;
  if (normalized.includes("application") || normalized.includes("visa")) {
    return "APPLICATION" as const;
  }
  if (normalized.includes("document")) return "DOCUMENT_COLLECTION" as const;

  return "CONTACTED" as const;
}

function revalidateCrm() {
  revalidatePath("/crm");
  revalidatePath("/az/crm");
  revalidatePath("/en/crm");
}

function actionError(message: string, error: unknown): CrmActionResult {
  if (process.env.NODE_ENV === "development") {
    console.error(message, error);
  }

  return { message, ok: false };
}
