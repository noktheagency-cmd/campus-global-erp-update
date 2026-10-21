import type { CommissionPackageEducationLevel } from "@/features/commissions/package-types";

export type AgentBursWallet = {
  availablePoints: number;
  earnedPoints: number;
  packageAgreementId: string | null;
  packageName: string | null;
  recentRedemptions: AgentBursRedemptionSummary[];
  spentPoints: number;
  targets: AgentBursTargetOption[];
};

export type AgentBursRedemptionSummary = {
  createdAt: string;
  educationLevel: CommissionPackageEducationLevel;
  id: string;
  pointsCost: number;
  programName: string | null;
  studentName: string;
};

export type AgentBursTargetOption = {
  educationLevel: CommissionPackageEducationLevel;
  label: string;
  pointsCost: number;
  programId: string | null;
  programLabel: string | null;
};
