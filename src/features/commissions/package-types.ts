export type CommissionPackageStatus = "DRAFT" | "ACTIVE" | "INACTIVE";
export type CommissionPackageEducationLevel =
  | "ASSOCIATE"
  | "BACHELOR"
  | "MASTER"
  | "PHD"
  | "FOUNDATION"
  | "LANGUAGE";
export type CommissionPackageRuleType =
  | "FIXED"
  | "PERCENTAGE_CASH"
  | "PERCENTAGE_DELAYED";
export type CommissionPackageScholarshipTriggerType =
  | "FIXED_INTERVAL"
  | "FIRST_THEN_EVERY";
export type CommissionPackageAgreementStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type CommissionPackageRuleRecord = {
  commissionType: CommissionPackageRuleType;
  currency: string;
  educationLevel: CommissionPackageEducationLevel;
  fixedAmount: number | null;
  id: string;
  isActive: boolean;
  rateTier1: number | null;
  rateTier2: number | null;
  tierThreshold: number;
};

export type CommissionPackageScholarshipRecord = {
  additionalInterval: number | null;
  awards: CommissionPackageScholarshipAwardRecord[];
  description: string | null;
  educationLevel: CommissionPackageEducationLevel;
  id: string;
  scholarshipCount: number;
  studentThreshold: number;
  triggerType: CommissionPackageScholarshipTriggerType;
};

export type CommissionPackageScholarshipAwardRecord = {
  allPrograms: boolean;
  educationLevel: CommissionPackageEducationLevel;
  id: string;
  programs: CommissionPackageProgramOption[];
  quantity: number;
};

export type CommissionPackageProgramOption = {
  educationLevel: CommissionPackageEducationLevel;
  id: string;
  label: string;
  universityId: string;
  universityLabel: string;
};

export type CommissionPackageMixedScholarshipRecord = {
  additionalInterval: number;
  description: string | null;
  firstThreshold: number;
  id: string;
};

export type CommissionPackageRecord = {
  academicYear: string | null;
  agreementCount: number;
  createdAt: string;
  description: string | null;
  id: string;
  mixedScholarship: CommissionPackageMixedScholarshipRecord | null;
  name: string;
  rules: CommissionPackageRuleRecord[];
  scholarships: CommissionPackageScholarshipRecord[];
  status: CommissionPackageStatus;
  universities: Array<{ id: string; name: string }>;
  updatedAt: string;
};

export type CommissionPackageAgreementRecord = {
  academicYear: string;
  agentId: string;
  agentName: string;
  code: string;
  id: string;
  packageId: string;
  packageName: string;
  rejectionReason: string | null;
  earnedScholarships: number;
  status: CommissionPackageAgreementStatus;
  submittedAt: string;
  termVersion: string | null;
  universities: Array<{ id: string; name: string }>;
};

export type CommissionTermVersionRecord = {
  content: string;
  createdAt: string;
  id: string;
  isActive: boolean;
  title: string;
  version: string;
};

export type CommissionPackageWorkspaceData = {
  activeAgentId: string | null;
  agreements: CommissionPackageAgreementRecord[];
  availability: "READY" | "PREVIEW" | "UNAVAILABLE";
  canManage: boolean;
  isPreview: boolean;
  metrics: {
    activePackages: number;
    agreements: number;
    packages: number;
    pendingAgreements: number;
  };
  options: {
    academicYears: string[];
    programs: CommissionPackageProgramOption[];
    universities: Array<{ id: string; label: string }>;
  };
  packages: CommissionPackageRecord[];
  portalType: "staff" | "agent";
  terms: CommissionTermVersionRecord[];
};
