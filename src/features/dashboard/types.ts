export type DashboardRange = "7d" | "30d" | "90d";

export type DashboardTrendPoint = {
  applications: number;
  label: string;
  offers: number;
  revenue: number;
  students: number;
  visas: number;
};

export type DashboardMetric = {
  delta: number;
  sparkline: number[];
  value: number;
};

export type DashboardApplication = {
  code: string;
  id: string;
  programName: string;
  status: string;
  statusCode: string;
  studentName: string;
  universityName: string;
  updatedAt: string;
};

export type DashboardTask = {
  description: string;
  dueLabel: string;
  href: string;
  id: string;
  title: string;
  tone: "danger" | "primary" | "muted";
};

export type DashboardDestination = {
  color: string;
  country: string;
  share: number;
  value: number;
};

export type AdminDashboardData = {
  dataSource: "database" | "fallback";
  dateRangeLabel: string;
  destinations: DashboardDestination[];
  metrics: {
    applications: DashboardMetric;
    offers: DashboardMetric;
    revenue: DashboardMetric & { currency: string };
    students: DashboardMetric;
    visaSuccess: DashboardMetric;
  };
  range: DashboardRange;
  recentApplications: DashboardApplication[];
  tasks: DashboardTask[];
  trend: DashboardTrendPoint[];
};
