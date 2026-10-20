import type {
  AGREEMENT_STATUSES,
  CURRENCIES,
  ENTITY_STATUSES,
  PARTNERSHIP_STATUSES,
  PROGRAM_STATUSES,
  SCHOOL_TYPES,
} from "@/features/universities/constants";

export type SchoolType = (typeof SCHOOL_TYPES)[number];
export type PartnershipStatus = (typeof PARTNERSHIP_STATUSES)[number];
export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];
export type EntityStatus = (typeof ENTITY_STATUSES)[number];
export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];
export type Currency = (typeof CURRENCIES)[number];

export type UniversityRecord = {
  id: string;
  name: string;
  country: string;
  city: string;
  schoolType: SchoolType;
  partnershipStatus: PartnershipStatus;
  agreementStatus: string;
  activePrograms: number;
  activePeriods: number;
  discountedPrograms: number;
  mainContact: string;
  updatedAt: string;
  status: EntityStatus;
  programs: Array<{
    id: string;
    name: string;
    level: string;
    language: string;
    status: ProgramStatus;
    tuitionFee: number;
    discountedTuitionFee?: number;
    currency: Currency;
    period: string;
  }>;
};

export type UniversityTableRow = {
  id: string;
  name: string;
  country: string;
  city: string;
  location: string;
  logoAccessUrl: string | null;
  logoUrl: string | null;
  type: string;
  partner: string;
  agreement: string;
  programs: number;
  contact: string;
  status: string;
  updated: string;
};

export type ProgramTableRow = {
  id: string;
  tuitionId?: string | null;
  universityId: string;
  universityName: string;
  name: string;
  country: string;
  city: string;
  campus: string;
  level: string;
  language: string;
  duration: string;
  studyMode: string;
  status: string;
  period: string;
  periodStatus: string;
  tuitionFee: number | null;
  discountedTuitionFee: number | null;
  currency: string;
  priceStatus: string;
  updated: string;
};

export type UniversitiesViewMode = "universities" | "programs";

export type UniversitiesListSort =
  | "updated-desc"
  | "name-asc"
  | "programs-desc";

export type ProgramListSort =
  | "updated-desc"
  | "name-asc"
  | "tuition-asc"
  | "tuition-desc";

export type ProgramDiscountFilter = "all" | "discounted" | "standard";

export type UniversitiesListFilters = {
  query: string;
  country: string;
  city: string;
  program: string;
  language: string;
  contactQuery: string;
  schoolType: string;
  partnershipStatus: string;
  agreementStatus: string;
  status: string;
  sort: UniversitiesListSort;
  page: number;
  pageSize: number;
};

export type UniversitiesListPagination = {
  totalItems: number;
  totalPages: number;
  resultStart: number;
  resultEnd: number;
};

export type ProgramListFilters = {
  query: string;
  program: string;
  country: string;
  city: string;
  universityId: string;
  level: string;
  language: string;
  programStatus: string;
  periodStatus: string;
  priceStatus: string;
  currency: string;
  discount: ProgramDiscountFilter;
  tuitionMin: number | null;
  tuitionMax: number | null;
  sort: ProgramListSort;
  page: number;
  pageSize: number;
};

export type UniversitiesFilterOptions = {
  countries: string[];
  cities: string[];
  programs: string[];
  programUniversities: Array<{ label: string; value: string }>;
  educationLevels: string[];
  educationLanguages: string[];
  periods: string[];
  currencies: string[];
};

export type CountryChartDatum = {
  name: string;
  value: number;
  color: string;
};

export type UniversitiesDashboardMetrics = {
  totalUniversities: number;
  activePartnerships: number;
  activePrograms: number;
  activeApplications: number;
};

export type UniversitiesDashboardData = {
  view: UniversitiesViewMode;
  metrics: UniversitiesDashboardMetrics;
  countryData: CountryChartDatum[];
  tableRows: UniversityTableRow[];
  programRows: ProgramTableRow[];
  filters: UniversitiesListFilters;
  programFilters: ProgramListFilters;
  pagination: UniversitiesListPagination;
  programPagination: UniversitiesListPagination;
  filterOptions: UniversitiesFilterOptions;
  totalUniversities: number;
  dataSource: "database" | "fallback";
};
