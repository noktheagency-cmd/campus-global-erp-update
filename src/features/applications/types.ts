import type {
  APPLICATION_LIST_SORTS,
  APPLICATION_STATUSES,
} from "@/features/applications/constants";

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type ApplicationsListSort = (typeof APPLICATION_LIST_SORTS)[number];

export type ApplicationsSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type ApplicationsListFilters = {
  query: string;
  completion: "all" | "completed" | "incomplete";
  studentName: string;
  passportNo: string;
  portalNo: string;
  applicationNo: string;
  status: string;
  country: string;
  periodId: string;
  levelId: string;
  agentId: string;
  universityId: string;
  programId: string;
  managerId: string;
  dateFrom: string;
  dateTo: string;
  sort: ApplicationsListSort;
  page: number;
  pageSize: number;
};

export type ApplicationsPagination = {
  totalItems: number;
  totalPages: number;
  resultStart: number;
  resultEnd: number;
};

export type ApplicationRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentPhotoUrl: string;
  studentEmail: string;
  studentPhone: string;
  passportNo: string;
  identityNo: string;
  citizenship: string;
  agent: string;
  manager: string;
  applicationCount: number;
  submittedApplications: number;
  draftApplications: number;
  latestApplicationId: string;
  latestApplicationCode: string;
  latestCountry: string;
  latestPeriod: string;
  latestLevel: string;
  status: string;
  statusCode: ApplicationStatus;
  missingRequiredDocuments: number;
  createdAt: string;
  updatedAt: string;
  countries: string[];
  levels: string[];
  applications: Array<{
    id: string;
    code: string;
    country: string;
    period: string;
    level: string;
    status: string;
    statusCode: ApplicationStatus;
    agent: string;
    manager: string;
    createdAt: string;
    choicesCount: number;
    choices: Array<{
      campusName: string;
      id: string;
      priority: number;
      statusCode: ApplicationStatus | null;
      universityId: string;
      universityName: string;
      universityCity: string;
      universityCountry: string;
      programId: string;
      programName: string;
      educationLevel: string;
      educationLanguage: string;
    }>;
    missingRequiredDocuments: number;
    updatedAt: string;
  }>;
};

export type ApplicationsDashboardData = {
  metrics: {
    totalApplications: number;
    todayApplications: number;
    completedApplications: number;
    incompleteApplications: number;
    missingApplications: number;
    todayDate: string;
  };
  rows: ApplicationRow[];
  filters: ApplicationsListFilters;
  pagination: ApplicationsPagination;
  filterOptions: {
    statuses: string[];
    countries: string[];
    periods: Array<{ label: string; value: string }>;
    levels: Array<{ label: string; value: string }>;
    agents: Array<{ label: string; value: string }>;
    universities: Array<{ label: string; value: string }>;
    programs: Array<{ label: string; value: string }>;
    managers: Array<{ label: string; value: string }>;
  };
  dataSource: "database" | "unavailable";
};

export type ApplicationPeriodOption = {
  id: string;
  name: string;
  year: number;
  season: string;
  deadline: string | null;
};

export type ApplicationCountryOption = {
  country: string;
  universityCount: number;
};

export type ApplicationLevelOption = {
  aliases: readonly string[];
  educationLevelId: string;
  icon: string;
  key: string;
  label: string;
};

export type ApplicationProgramOption = {
  id: string;
  universityId: string;
  universityName: string;
  universityType: string;
  programId: string;
  programName: string;
  educationLevelId: string;
  educationLevelName: string;
  language: string;
  city: string;
  country: string;
  tuitionId: string | null;
  periodId: string | null;
  periodName: string | null;
  tuitionFee: number | null;
  discountedTuitionFee: number | null;
  currency: string;
};

export type AgentSelectOption = {
  label: string;
  value: string;
};

export type CurrentStudentApplicationProfil = {
  id?: string;
  address: string;
  birthDate: string;
  citizenship: string;
  contactEmail: string;
  fatherName: string;
  firstName: string;
  gender: string;
  identityNo: string;
  lastName: string;
  loginEmail: string;
  maritalStatus: string;
  motherName: string;
  passportNo: string;
  phone: string;
  documents: Record<string, ApplicationStudentDocument>;
  education: WizardEducationPayload;
  exam: WizardExamPayload;
};

export type ApplicationStudentDocument = {
  id: string;
  documentKey: string;
  fileName: string;
  fileSize: number | null;
  fileUrl: string;
  mimeType: string | null;
  uploadedAt: string | null;
};

export type ApplicationStudentOption = CurrentStudentApplicationProfil & {
  agentId: string;
  agentLabel: string;
  label: string;
};

export type ApplicationCreateOptions = {
  agents: AgentSelectOption[];
  countries: ApplicationCountryOption[];
  currentStudent: CurrentStudentApplicationProfil | null;
  levels: ApplicationLevelOption[];
  periods: ApplicationPeriodOption[];
  programs: ApplicationProgramOption[];
  students: ApplicationStudentOption[];
  dataSource: "database" | "unavailable";
  viewer: "workspace" | "student";
};

export type WizardChoicePayload = {
  universityId: string;
  programId: string;
  tuitionId?: string | null;
};

export type WizardEducationPayload = {
  institutionName: string;
  country?: string;
  city?: string;
  startYear?: string;
  endYear?: string;
  gradingSystem?: string;
  averageScore?: string;
};

export type WizardExamPayload = {
  examName?: string;
  score?: string;
  maxScore?: string;
  examDate?: string;
};

export type WizardExistingDocumentPayload = {
  documentId: string;
  documentKey: string;
};
