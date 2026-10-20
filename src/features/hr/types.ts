export type HrEmploymentStatus =
  | "ACTIVE"
  | "PROBATION"
  | "ON_LEAVE"
  | "INACTIVE"
  | "TERMINATED";

export type HrEmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERN";

export type HrWorkMode = "ONSITE" | "HYBRID" | "REMOTE";

export type HrAttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "REMOTE"
  | "ABSENT"
  | "SICK_LEAVE"
  | "VACATION";

export type HrLeaveType =
  | "ANNUAL"
  | "SICK"
  | "UNPAID"
  | "MATERNITY"
  | "PATERNITY"
  | "STUDY"
  | "OTHER";

export type HrLeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type HrVacancyStatus = "DRAFT" | "OPEN" | "PAUSED" | "CLOSED";

export type HrCandidateStage =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

export type HrReviewStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED";
export type HrPayrollStatus = "DRAFT" | "APPROVED" | "PAID" | "CANCELLED";

export type HrEmployeeRecord = {
  address: string;
  annualLeaveAllowance: number;
  attendanceSummary: {
    absent: number;
    late: number;
    present: number;
    remote: number;
    workDays: number;
  };
  birthDate: string;
  contractEndDate: string;
  currency: string;
  department: string;
  email: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  employeeCode: string;
  employmentStatus: HrEmploymentStatus;
  employmentType: HrEmploymentType;
  firstName: string;
  fullName: string;
  hiredAt: string;
  id: string;
  lastName: string;
  managerId: string;
  managerName: string;
  notes: string;
  office: string;
  phone: string;
  position: string;
  remainingLeaveDays: number;
  salary: number | null;
  terminatedAt: string;
  usedLeaveDays: number;
  workMode: HrWorkMode;
};

export type HrAttendanceRecord = {
  checkIn: string;
  checkOut: string;
  department: string;
  employeeCode: string;
  employeeId: string;
  employeeName: string;
  id: string;
  note: string;
  position: string;
  status: HrAttendanceStatus;
  workDate: string;
};

export type HrLeaveRequestRecord = {
  code: string;
  createdAt: string;
  days: number;
  employeeCode: string;
  employeeId: string;
  employeeName: string;
  endDate: string;
  id: string;
  reason: string;
  reviewNote: string;
  reviewedAt: string;
  reviewedBy: string;
  startDate: string;
  status: HrLeaveStatus;
  type: HrLeaveType;
};

export type HrCandidateRecord = {
  appliedAt: string;
  currency: string;
  email: string;
  expectedSalary: number | null;
  firstName: string;
  fullName: string;
  id: string;
  lastName: string;
  nextInterviewAt: string;
  notes: string;
  phone: string;
  rating: number;
  source: string;
  stage: HrCandidateStage;
  vacancyId: string;
};

export type HrVacancyRecord = {
  candidateCount: number;
  candidates: HrCandidateRecord[];
  closingDate: string;
  code: string;
  department: string;
  description: string;
  employmentType: HrEmploymentType;
  headcount: number;
  hiredCount: number;
  hiringManagerId: string;
  hiringManagerName: string;
  id: string;
  location: string;
  status: HrVacancyStatus;
  title: string;
  workMode: HrWorkMode;
};

export type HrPerformanceReviewRecord = {
  completedAt: string;
  employeeId: string;
  employeeName: string;
  goals: string;
  id: string;
  improvements: string;
  periodEnd: string;
  periodStart: string;
  reviewerId: string;
  reviewerName: string;
  score: number | null;
  status: HrReviewStatus;
  strengths: string;
};

export type HrPayrollItemRecord = {
  baseSalary: number;
  bonus: number;
  currency: string;
  deductions: number;
  employeeCode: string;
  employeeId: string;
  employeeName: string;
  id: string;
  netSalary: number;
  note: string;
};

export type HrPayrollRunRecord = {
  approvedAt: string;
  approvedBy: string;
  code: string;
  currency: string;
  id: string;
  items: HrPayrollItemRecord[];
  paidAt: string;
  periodEnd: string;
  periodStart: string;
  status: HrPayrollStatus;
  totalBonus: number;
  totalDeductions: number;
  totalGross: number;
  totalNet: number;
};

export type HrTrendPoint = {
  headcount: number;
  joined: number;
  label: string;
  left: number;
  month: string;
};

export type HrDepartmentPoint = {
  color: string;
  count: number;
  name: string;
  percentage: number;
};

export type HrUpcomingEvent = {
  date: string;
  detail: string;
  employeeId: string;
  employeeName: string;
  id: string;
  type: "BIRTHDAY" | "ANNIVERSARY" | "CONTRACT_END";
};

export type HrWorkspaceData = {
  attendance: HrAttendanceRecord[];
  canApproveLeave: boolean;
  canManage: boolean;
  canManageAttendance: boolean;
  canViewPayroll: boolean;
  departments: HrDepartmentPoint[];
  employees: HrEmployeeRecord[];
  employeeDepartments: string[];
  employeeFilters: {
    department: string;
    search: string;
    status: string;
    workMode: string;
  };
  employeePage: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  isPreview: boolean;
  leaveRequests: HrLeaveRequestRecord[];
  metrics: {
    activeEmployees: number;
    attendanceRate: number;
    employeesAtWorkToday: number;
    employeesOnLeave: number;
    openVacancies: number;
    pendingLeaveRequests: number;
    totalEmployees: number;
  };
  payrollRuns: HrPayrollRunRecord[];
  selectedPayrollRunId: string;
  performanceReviews: HrPerformanceReviewRecord[];
  trend: HrTrendPoint[];
  upcomingEvents: HrUpcomingEvent[];
  vacancies: HrVacancyRecord[];
};
