export type StudentGender = "Male" | "Female";
export type StudentMaritalStatus = "Single" | "Married";
export type StudentPortalStatus = "Ready" | "Pending" | "Needs email";
export type StudentStage =
  | "Profil"
  | "Application"
  | "Offer"
  | "Enrollment"
  | "Visa";

export type StudentRecord = {
  id: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  motherName: string;
  birthDate: string;
  email: string;
  contactEmail: string;
  phone: string;
  address: string;
  passportNo: string;
  identityNo: string;
  citizenship: string;
  agent: string;
  gender: StudentGender;
  maritalStatus: StudentMaritalStatus;
  stage: StudentStage;
  portalStatus: StudentPortalStatus;
  documentCount: number;
  missingItems: number;
  updatedAt: string;
};

export type StudentsListSort =
  | "updated-desc"
  | "name-asc"
  | "stage-asc";

export type StudentsListFilters = {
  query: string;
  citizenship: string;
  agent: string;
  portalStatus: string;
  sort: StudentsListSort;
  page: number;
  pageSize: number;
};

export type StudentsListPagination = {
  totalItems: number;
  totalPages: number;
  resultStart: number;
  resultEnd: number;
};

export type StudentsDashboardMetrics = {
  totalStudents: number;
  activeApplications: number;
  portalQueue: number;
  missingDocuments: number;
};

export type StudentSelectOption = {
  label: string;
  value: string;
};

export type StudentCreateOptions = {
  agents: StudentSelectOption[];
  dataSource: "database" | "fallback" | "unavailable";
};

export type StudentsDashboardData = {
  metrics: StudentsDashboardMetrics;
  rows: StudentRecord[];
  filters: StudentsListFilters;
  pagination: StudentsListPagination;
  filterOptions: {
    agents: StudentSelectOption[];
    citizenships: string[];
    portalStatuses: StudentPortalStatus[];
  };
};

export type StudentsSearchParams = Record<
  string,
  string | string[] | undefined
>;
