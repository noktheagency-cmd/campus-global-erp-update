import type {
  HrAttendanceStatus,
  HrCandidateStage,
  HrEmploymentStatus,
  HrEmploymentType,
  HrLeaveStatus,
  HrLeaveType,
  HrPayrollStatus,
  HrReviewStatus,
  HrVacancyStatus,
  HrWorkMode,
} from "@/features/hr/types";

export const HR_TABS = [
  { id: "overview", label: "İcmal" },
  { id: "employees", label: "Əməkdaşlar" },
  { id: "attendance", label: "Davamiyyət" },
  { id: "leave", label: "Məzuniyyət" },
  { id: "recruitment", label: "İşə qəbul" },
  { id: "performance", label: "Performans" },
  { id: "payroll", label: "Əmək haqqı" },
] as const;

export type HrTab = (typeof HR_TABS)[number]["id"];

export const EMPLOYMENT_STATUS_LABELS: Record<HrEmploymentStatus, string> = {
  ACTIVE: "Aktiv",
  PROBATION: "Sınaq müddəti",
  ON_LEAVE: "Məzuniyyətdə",
  INACTIVE: "Qeyri-aktiv",
  TERMINATED: "İşdən ayrılıb",
};

export const EMPLOYMENT_TYPE_LABELS: Record<HrEmploymentType, string> = {
  FULL_TIME: "Tam ştat",
  PART_TIME: "Yarım ştat",
  CONTRACT: "Müqaviləli",
  INTERN: "Təcrübəçi",
};

export const WORK_MODE_LABELS: Record<HrWorkMode, string> = {
  ONSITE: "Ofisdən",
  HYBRID: "Hibrid",
  REMOTE: "Uzaqdan",
};

export const ATTENDANCE_STATUS_LABELS: Record<HrAttendanceStatus, string> = {
  PRESENT: "Vaxtında",
  LATE: "Gecikib",
  REMOTE: "Uzaqdan",
  ABSENT: "İşdə deyil",
  SICK_LEAVE: "Xəstəlik",
  VACATION: "Məzuniyyət",
};

export const LEAVE_TYPE_LABELS: Record<HrLeaveType, string> = {
  ANNUAL: "İllik məzuniyyət",
  SICK: "Xəstəlik",
  UNPAID: "Ödənişsiz",
  MATERNITY: "Analıq",
  PATERNITY: "Atalıq",
  STUDY: "Təhsil",
  OTHER: "Digər",
};

export const LEAVE_STATUS_LABELS: Record<HrLeaveStatus, string> = {
  PENDING: "Təsdiq gözləyir",
  APPROVED: "Təsdiqlənib",
  REJECTED: "Rədd edilib",
  CANCELLED: "Ləğv edilib",
};

export const VACANCY_STATUS_LABELS: Record<HrVacancyStatus, string> = {
  DRAFT: "Qaralama",
  OPEN: "Açıq",
  PAUSED: "Dayandırılıb",
  CLOSED: "Bağlanıb",
};

export const CANDIDATE_STAGE_LABELS: Record<HrCandidateStage, string> = {
  APPLIED: "Müraciət",
  SCREENING: "İlkin baxış",
  INTERVIEW: "Müsahibə",
  OFFER: "Təklif",
  HIRED: "İşə qəbul",
  REJECTED: "Rədd",
};

export const REVIEW_STATUS_LABELS: Record<HrReviewStatus, string> = {
  DRAFT: "Qaralama",
  IN_PROGRESS: "Davam edir",
  COMPLETED: "Tamamlanıb",
};

export const PAYROLL_STATUS_LABELS: Record<HrPayrollStatus, string> = {
  DRAFT: "Qaralama",
  APPROVED: "Təsdiqlənib",
  PAID: "Ödənilib",
  CANCELLED: "Ləğv edilib",
};

export const HR_DEPARTMENT_COLORS = [
  "#0b66ff",
  "#17b26a",
  "#f79009",
  "#7a5af8",
  "#39a7d8",
  "#ee46bc",
] as const;
