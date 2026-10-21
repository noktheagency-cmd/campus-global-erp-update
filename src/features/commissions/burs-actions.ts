"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { resolveBursPointsCost } from "@/features/commissions/burs-wallet";
import {
  getSessionAgentId,
  requirePermission,
  requireSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const redeemSchema = z.object({
  agentId: z.string().trim().min(1),
  educationLevel: z.enum([
    "ASSOCIATE",
    "BACHELOR",
    "MASTER",
    "PHD",
    "FOUNDATION",
    "LANGUAGE",
  ]),
  packageAgreementId: z.string().trim().min(1),
  programId: z.string().trim().optional(),
  studentId: z.string().trim().min(1),
});

export async function redeemAgentBursAction(formData: FormData) {
  const session = await requireSession();
  const sessionAgentId = getSessionAgentId(session);
  const returnTo = getSafeReturnPath(getString(formData, "returnTo"));

  const parsed = redeemSchema.safeParse({
    agentId: getString(formData, "agentId"),
    educationLevel: getString(formData, "educationLevel"),
    packageAgreementId: getString(formData, "packageAgreementId"),
    programId: getString(formData, "programId") || undefined,
    studentId: getString(formData, "studentId"),
  });

  if (!parsed.success) {
    redirectWith(returnTo, "error", "burs-validation");
  }

  const isOwnAgent = sessionAgentId === parsed.data.agentId;
  if (!isOwnAgent) {
    await requirePermission("agents:update");
  } else if (!sessionAgentId) {
    redirectWith(returnTo, "error", "burs-forbidden");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const [agreement, student, earnedAgg, spentAgg] = await Promise.all([
        tx.commissionPackageAgreement.findFirst({
          include: {
            package: {
              include: {
                scholarships: {
                  include: {
                    awards: {
                      include: {
                        programs: {
                          select: { programId: true, quantity: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          where: {
            agentId: parsed.data.agentId,
            id: parsed.data.packageAgreementId,
            status: "APPROVED",
          },
        }),
        tx.student.findFirst({
          select: { agentId: true, id: true, portalStatus: true },
          where: { agentId: parsed.data.agentId, id: parsed.data.studentId },
        }),
        tx.commissionCalculation.aggregate({
          _sum: { scholarshipCreditsEarned: true },
          where: {
            agentId: parsed.data.agentId,
            packageAgreementId: parsed.data.packageAgreementId,
            payment: { status: "POSTED" },
          },
        }),
        tx.agentScholarshipRedemption.aggregate({
          _sum: { pointsCost: true },
          where: {
            agentId: parsed.data.agentId,
            packageAgreementId: parsed.data.packageAgreementId,
            status: "CONFIRMED",
          },
        }),
      ]);

      if (!agreement) throw new BursActionError("burs-agreement-missing");
      if (!student) throw new BursActionError("burs-student-missing");

      const awards = agreement.package.scholarships.flatMap((item) =>
        item.awards.map((award) => ({
          allPrograms: award.allPrograms,
          educationLevel: award.educationLevel,
          programs: award.programs.map((program) => ({
            programId: program.programId,
            quantity: program.quantity,
          })),
          quantity: award.quantity,
        })),
      );

      const pointsCost = resolveBursPointsCost({
        awards,
        educationLevel: parsed.data.educationLevel,
        programId: parsed.data.programId,
      });
      if (pointsCost === null) throw new BursActionError("burs-target-invalid");

      const earnedPoints = earnedAgg._sum.scholarshipCreditsEarned ?? 0;
      const spentPoints = Number(spentAgg._sum.pointsCost ?? 0);
      const availablePoints = Math.max(0, earnedPoints - spentPoints);
      if (availablePoints + 1e-9 < pointsCost) {
        throw new BursActionError("burs-insufficient");
      }

      const existing = await tx.agentScholarshipRedemption.findFirst({
        select: { id: true },
        where: {
          agentId: parsed.data.agentId,
          status: "CONFIRMED",
          studentId: parsed.data.studentId,
        },
      });
      if (existing) throw new BursActionError("burs-student-already");

      await tx.agentScholarshipRedemption.create({
        data: {
          agentId: parsed.data.agentId,
          createdById: session.userId,
          educationLevel: parsed.data.educationLevel,
          packageAgreementId: agreement.id,
          pointsCost,
          programId: parsed.data.programId || null,
          status: "CONFIRMED",
          studentId: student.id,
        },
      });

      await tx.student.update({
        data: {
          portalStatus:
            student.portalStatus === "READY" ? student.portalStatus : "READY",
          stage: "Scholarship",
        },
        where: { id: student.id },
      });
    });
  } catch (error) {
    if (error instanceof BursActionError) {
      redirectWith(returnTo, "error", error.code);
    }
    console.error("Burs redemption failed", error);
    redirectWith(returnTo, "error", "burs-failed");
  }

  revalidatePath(`/agents/${parsed.data.agentId}`);
  revalidatePath("/profile");
  revalidatePath("/az/profile");
  revalidatePath("/commissions");
  redirectWith(returnTo, "success", "burs-redeemed");
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getSafeReturnPath(value: string) {
  if (
    value.startsWith("/agents/") ||
    value.startsWith("/profile") ||
    value.startsWith("/commissions")
  ) {
    return value.split("#")[0] ?? "/profile";
  }
  return "/profile";
}

function redirectWith(
  returnTo: string,
  kind: "error" | "success",
  code: string,
): never {
  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}${kind}=${encodeURIComponent(code)}`);
}

class BursActionError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "BursActionError";
  }
}
