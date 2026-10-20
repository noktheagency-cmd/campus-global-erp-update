export type CommissionMethod = "PERCENTAGE" | "FIXED";
export type CommissionAgreementStatus =
  | "DRAFT"
  | "ACTIVE"
  | "SUSPENDED"
  | "EXPIRED"
  | "ARCHIVED";
export type CommissionCalculationStatus =
  | "CALCULATED"
  | "UNDER_REVIEW"
  | "PAYABLE"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED";

export type CommissionAgreementRecord = {
  agentId: string;
  agentName: string;
  agentValue: number;
  campusValue: number;
  code: string;
  createdAt: string;
  currency: string;
  documentAccessUrl: string | null;
  documentName: string | null;
  id: string;
  installmentPolicy: "EVERY_PAYMENT" | "FIRST_PAYMENT_ONLY";
  method: {
    agent: CommissionMethod;
    campus: CommissionMethod;
  };
  notes: string | null;
  paymentTermDays: number;
  programId: string | null;
  scopeLabel: string;
  status: CommissionAgreementStatus;
  universityId: string;
  universityName: string;
  validFrom: string;
  validUntil: string;
};

export type CommissionCalculationRecord = {
  agentAmount: number;
  agentName: string;
  applicationCode: string;
  basisAmount: number;
  campusAmount: number;
  code: string;
  createdAt: string;
  currency: string;
  educationLevel: string | null;
  grossCommissionAmount: number;
  id: string;
  packageAgreementCode: string | null;
  paidAgentAmount: number;
  payableDueDate: string;
  scholarshipCreditsEarned: number;
  scholarshipAwardSummary: string[];
  source: "LEGACY_AGREEMENT" | "PACKAGE_AGREEMENT";
  status: CommissionCalculationStatus;
  studentOrdinal: number | null;
  studentName: string;
  universityName: string;
};

export type CommissionPaymentRecord = {
  amount: number;
  applicationCode: string;
  code: string;
  currency: string;
  id: string;
  paidAt: string;
  reference: string;
  status: "POSTED" | "VOID";
  studentName: string;
  universityName: string;
};

export type CommissionAuditRecord = {
  action: string;
  actor: string;
  createdAt: string;
  entityCode: string;
  entityType: "AGREEMENT" | "PAYMENT" | "CALCULATION";
  id: string;
  summary: string;
};

export type CommissionSelectOption = {
  id: string;
  label: string;
};

export type CommissionProgramOption = CommissionSelectOption & {
  universityId: string;
};

export type CommissionApplicationOption = CommissionSelectOption & {
  agentId: string;
  currency: string;
  universityId: string;
};

export type CommissionWorkspaceData = {
  activeAgentId: string | null;
  agreements: CommissionAgreementRecord[];
  universityAgreements: Array<{
    id: string;
    code: string;
    universityName: string;
    scopeLabel: string;
    currency: string;
    grossMethod: "FIXED" | "PERCENTAGE";
    grossValue: number;
    validFrom: string;
    validUntil: string;
    status: string;
  }>;
  applications: CommissionApplicationOption[];
  audit: CommissionAuditRecord[];
  availability: "READY" | "PREVIEW" | "UNAVAILABLE";
  canApprove: boolean;
  canManage: boolean;
  calculations: CommissionCalculationRecord[];
  isPreview: boolean;
  metrics: {
    activeAgreements: number;
    activePackageAgreements: number;
    agentEarnedBase: number;
    agentLiabilityBase: number;
    companyEarnedBase: number;
    paidToAgentsBase: number;
    pendingApproval: number;
  };
  options: {
    agents: CommissionSelectOption[];
    programs: CommissionProgramOption[];
    universities: CommissionSelectOption[];
  };
  payments: CommissionPaymentRecord[];
  portalType: "staff" | "agent";
};
