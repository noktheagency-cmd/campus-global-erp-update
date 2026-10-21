import type { AgentBursWallet } from "@/features/commissions/burs-types";
import type {
  MoneyValue,
  ServiceQuoteRequestRecord,
} from "@/features/services/types";

export type AgentPortalStatus = "Ready" | "Pending" | "Suspended";
export type AgentTier = "Starter" | "Growth" | "Premier";

export type AgentRecord = {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  instagramUrl: string;
  profilePhotoUrl: string;
  portalStatus: AgentPortalStatus;
  tier: AgentTier;
  studentsCount: number;
  activeApplications: number;
  conversionRate: number;
  commissionBalance: number;
  lastActivity: string;
  joinedAt: string;
};

export type AgentSocialLink = {
  id: string;
  platform: string;
  platformLabel: string;
  url: string;
};

export type AgentContact = {
  id: string;
  fullName: string;
  position: string;
  email: string;
  phone: string;
  whatsapp: string;
  isPrimary: boolean;
};

export type AgentNotification = {
  id: string;
  type:
    | "APPLICATION_CREATED"
    | "APPLICATION_STATUS"
    | "COMMISSION_UPDATED"
    | "DOCUMENT_REQUIRED"
    | "DOCUMENT_STATUS"
    | "STUDENT_CREATED"
    | "SYSTEM";
  title: string;
  message: string;
  actionHref: string;
  createdAt: string;
  read: boolean;
};

export type AgentPortalProfil = AgentRecord & {
  canRegisterStudents: boolean;
  ownStudentsOnly: boolean;
  portalReporting: boolean;
  logoUrl: string;
  internalNotes: string;
  socialLinks: AgentSocialLink[];
  contacts: AgentContact[];
  cashPayoutActive: boolean;
  accountPayoutActive: boolean;
  holdInAccount: boolean;
  manualPayoutManagement: boolean;
  payoutPercentage: number;
};

export type AgentStudentSummary = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  citizenship: string;
  stage: string;
  portalStatus: string;
  updatedAt: string;
};

export type AgentApplicationSummary = {
  id: string;
  code: string;
  studentName: string;
  country: string;
  period: string;
  status: string;
  statusCode: string;
  statusReason: string;
  missingRequiredDocuments: number;
  updatedAt: string;
};

export type AgentCommissionSummary = {
  agentAmount: number;
  code: string;
  currency: string;
  id: string;
  scholarshipCreditsEarned: number;
  status: string;
  studentName: string;
  universityName: string;
};

export type AgentPortalData = {
  agent: AgentPortalProfil;
  bursWallet: AgentBursWallet;
  canEditPayoutSettings: boolean;
  commissions: AgentCommissionSummary[];
  metrics: {
    totalStudents: number;
    activeApplications: number;
    submittedApplications: number;
    missingDocuments: number;
    conversionRate: number;
    commissionBalance: number;
    totalCommissionEarned: number;
  };
  students: AgentStudentSummary[];
  applications: AgentApplicationSummary[];
  notifications: AgentNotification[];
  services: AgentProfileServiceRecord[];
  unreadNotifications: number;
  dataSource: "database" | "fallback";
};

export type AgentProfileServiceRecord = {
  currentPrice: MoneyValue | null;
  description: string;
  id: string;
  isCustomPrice: boolean;
  name: string;
  proposals: ServiceQuoteRequestRecord[];
  standardPrice: MoneyValue | null;
};

export type AgentsListSort = "updated-desc" | "students-desc" | "name-asc";

export type AgentsListFilters = {
  query: string;
  country: string;
  portalStatus: string;
  tier: string;
  sort: AgentsListSort;
  page: number;
  pageSize: number;
};

export type AgentsListPagination = {
  totalItems: number;
  totalPages: number;
  resultStart: number;
  resultEnd: number;
};

export type AgentsDashboardMetrics = {
  totalAgents: number;
  activeAgents: number;
  registeredStudents: number;
  portalReady: number;
  commissionBalance: number;
};

export type AgentsDashboardData = {
  metrics: AgentsDashboardMetrics;
  rows: AgentRecord[];
  filters: AgentsListFilters;
  pagination: AgentsListPagination;
  filterOptions: {
    countries: string[];
    portalStatuses: AgentPortalStatus[];
    tiers: AgentTier[];
  };
};

export type AgentsSearchParams = Record<string, string | string[] | undefined>;
