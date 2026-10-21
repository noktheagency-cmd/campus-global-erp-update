import "server-only";

import type {
  AgentBursTargetOption,
  AgentBursWallet,
} from "@/features/commissions/burs-types";
import { resolvePackageEducationLevel } from "@/features/commissions/package-engine";
import type { CommissionPackageEducationLevel } from "@/features/commissions/package-types";
import { prisma } from "@/lib/db";

export type {
  AgentBursRedemptionSummary,
  AgentBursTargetOption,
  AgentBursWallet,
} from "@/features/commissions/burs-types";

export async function getAgentBursWallet(
  agentId: string,
): Promise<AgentBursWallet> {
  const empty: AgentBursWallet = {
    availablePoints: 0,
    earnedPoints: 0,
    packageAgreementId: null,
    packageName: null,
    recentRedemptions: [],
    spentPoints: 0,
    targets: [],
  };

  if (!agentId.trim() || !process.env.DATABASE_URL) return empty;

  try {
    return await loadAgentBursWallet(agentId);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Agent burs wallet unavailable: ${String(error)}`);
    }
    return empty;
  }
}

async function loadAgentBursWallet(agentId: string): Promise<AgentBursWallet> {
  const agreement = await prisma.commissionPackageAgreement.findFirst({
    include: {
      package: {
        include: {
          scholarships: {
            include: {
              awards: {
                include: {
                  programs: {
                    include: {
                      program: {
                        select: {
                          educationLevel: { select: { name: true } },
                          id: true,
                          name: true,
                          university: { select: { name: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { reviewedAt: "desc" },
    where: { agentId, status: "APPROVED" },
  });

  const [earnedAgg, spentAgg, redemptions] = await Promise.all([
    prisma.commissionCalculation.aggregate({
      _sum: { scholarshipCreditsEarned: true },
      where: {
        agentId,
        payment: { status: "POSTED" },
        ...(agreement ? { packageAgreementId: agreement.id } : {}),
      },
    }),
    prisma.agentScholarshipRedemption.aggregate({
      _sum: { pointsCost: true },
      where: {
        agentId,
        status: "CONFIRMED",
        ...(agreement ? { packageAgreementId: agreement.id } : {}),
      },
    }),
    prisma.agentScholarshipRedemption.findMany({
      include: {
        program: { select: { name: true } },
        student: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      where: { agentId, status: "CONFIRMED" },
    }),
  ]);

  const earnedPoints = earnedAgg._sum.scholarshipCreditsEarned ?? 0;
  const spentPoints = Number(spentAgg._sum.pointsCost ?? 0);
  const availablePoints = roundPoints(Math.max(0, earnedPoints - spentPoints));
  const targets = agreement
    ? buildBursTargets(agreement.package.scholarships)
    : [];

  return {
    availablePoints,
    earnedPoints,
    packageAgreementId: agreement?.id ?? null,
    packageName: agreement?.package.name ?? null,
    recentRedemptions: redemptions.map((item) => ({
      createdAt: item.createdAt.toISOString(),
      educationLevel: item.educationLevel,
      id: item.id,
      pointsCost: Number(item.pointsCost),
      programName: item.program?.name ?? null,
      studentName: `${item.student.firstName} ${item.student.lastName}`,
    })),
    spentPoints,
    targets,
  };
}

export function resolveBursPointsCost({
  awards,
  educationLevel,
  programId,
}: {
  awards: Array<{
    allPrograms: boolean;
    educationLevel: CommissionPackageEducationLevel;
    programs: Array<{ programId: string; quantity: number }>;
    quantity: number;
  }>;
  educationLevel: CommissionPackageEducationLevel;
  programId?: string | null;
}): number | null {
  const award = awards.find((item) => item.educationLevel === educationLevel);
  if (!award) return null;

  if (award.allPrograms || award.programs.length === 0) {
    return pointsFromQuantity(award.quantity);
  }

  if (!programId) return null;
  const program = award.programs.find((item) => item.programId === programId);
  if (!program) return null;
  return pointsFromQuantity(program.quantity);
}

function buildBursTargets(
  scholarships: Array<{
    awards: Array<{
      allPrograms: boolean;
      educationLevel: CommissionPackageEducationLevel;
      programs: Array<{
        program: {
          educationLevel: { name: string };
          id: string;
          name: string;
          university: { name: string };
        };
        quantity: number;
      }>;
      quantity: number;
    }>;
  }>,
): AgentBursTargetOption[] {
  const targets: AgentBursTargetOption[] = [];
  const seen = new Set<string>();

  for (const scholarship of scholarships) {
    for (const award of scholarship.awards) {
      if (award.allPrograms || award.programs.length === 0) {
        const key = `${award.educationLevel}:all`;
        if (seen.has(key)) continue;
        seen.add(key);
        targets.push({
          educationLevel: award.educationLevel,
          label: `${levelLabel(award.educationLevel)} · bütün ixtisaslar`,
          pointsCost: pointsFromQuantity(award.quantity),
          programId: null,
          programLabel: null,
        });
        continue;
      }

      for (const link of award.programs) {
        const key = `${award.educationLevel}:${link.program.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const resolved = resolvePackageEducationLevel(
          link.program.educationLevel.name,
        );
        if (resolved !== award.educationLevel) continue;
        targets.push({
          educationLevel: award.educationLevel,
          label: `${levelLabel(award.educationLevel)} · ${link.program.name}`,
          pointsCost: pointsFromQuantity(link.quantity),
          programId: link.program.id,
          programLabel: `${link.program.name} · ${link.program.university.name}`,
        });
      }
    }
  }

  return targets.sort((left, right) => left.label.localeCompare(right.label, "az"));
}

function pointsFromQuantity(quantity: number) {
  const safe = Math.max(1, quantity);
  return roundPoints(1 / safe);
}

function roundPoints(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function levelLabel(level: CommissionPackageEducationLevel) {
  const labels: Record<CommissionPackageEducationLevel, string> = {
    ASSOCIATE: "Önlisans",
    BACHELOR: "Bakalavr",
    FOUNDATION: "Hazırlıq",
    LANGUAGE: "Dil kursu",
    MASTER: "Magistr",
    PHD: "Doktorantura",
  };
  return labels[level];
}
