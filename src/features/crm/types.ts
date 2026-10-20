export type CrmEntityKind = "individual" | "agent";

export type CrmView = "overview" | "individuals" | "agents" | "tasks";

export type CrmStageCode =
  | "NEW_LEAD"
  | "CONTACTED"
  | "CONSULTATION"
  | "DOCUMENT_COLLECTION"
  | "APPLICATION"
  | "OFFER"
  | "ENROLLED"
  | "PARTNER_ONBOARDING"
  | "ACTIVE_PARTNER"
  | "WON"
  | "LOST";

export type CrmStatusCode =
  | "ACTIVE"
  | "FOLLOW_UP"
  | "PAUSED"
  | "WON"
  | "LOST";

export type CrmSourceCode =
  | "WEBSITE"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "WHATSAPP"
  | "REFERRAL"
  | "AGENT_REFERRAL"
  | "EVENT"
  | "MANUAL"
  | "OTHER";

export type CrmTaskStatusCode =
  | "TODO"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type CrmTaskPriorityCode = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type CrmInteractionTypeCode =
  | "CALL"
  | "EMAIL"
  | "WHATSAPP"
  | "MEETING"
  | "NOTE"
  | "APPLICATION"
  | "DOCUMENT"
  | "SYSTEM";

export type CrmTeamMember = {
  id: string;
  name: string;
};

export type CrmTaskRecord = {
  assignedTo: CrmTeamMember | null;
  completedAt: string | null;
  description: string;
  dueAt: string;
  id: string;
  priority: CrmTaskPriorityCode;
  status: CrmTaskStatusCode;
  title: string;
};

export type CrmActivityRecord = {
  actor: string;
  body: string;
  id: string;
  occurredAt: string;
  subject: string;
  type: CrmInteractionTypeCode;
};

export type CrmApplicationSummary = {
  code: string;
  id: string;
  status: string;
  updatedAt: string;
};

export type CrmStudentSummary = {
  id: string;
  name: string;
  stage: string;
};

export type CrmContactSummary = {
  email: string;
  fullName: string;
  isPrimary: boolean;
  phone: string;
  position: string;
  whatsapp: string;
};

export type CrmRecord = {
  activities: CrmActivityRecord[];
  activeApplications: number;
  address: string;
  agentName: string;
  applications: CrmApplicationSummary[];
  avatarUrl: string;
  birthDate: string;
  citizenship: string;
  commissionBalance: number;
  companyName: string;
  contacts: CrmContactSummary[];
  conversionRate: number;
  country: string;
  createdAt: string;
  documentCount: number;
  email: string;
  id: string;
  initials: string;
  kind: CrmEntityKind;
  lastContactAt: string | null;
  name: string;
  nextFollowUpAt: string | null;
  owner: CrmTeamMember | null;
  phone: string;
  portalStatus: string;
  preferredDestination: string;
  profileId: string | null;
  source: CrmSourceCode;
  stage: CrmStageCode;
  status: CrmStatusCode;
  students: CrmStudentSummary[];
  studentsCount: number;
  tags: string[];
  tasks: CrmTaskRecord[];
  tier: string;
  updatedAt: string;
};

export type CrmDashboardData = {
  canManage: boolean;
  records: CrmRecord[];
  teamMembers: CrmTeamMember[];
  usingFallback: boolean;
};

export type CrmActionResult = {
  message: string;
  ok: boolean;
};

export type CrmSubjectInput = {
  kind: CrmEntityKind;
  subjectId: string;
};
