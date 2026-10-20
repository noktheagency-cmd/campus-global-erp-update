"use client";

import { useState, useTransition } from "react";
import {
  CalendarDaysIcon,
  CheckCircle2Icon,
  DownloadIcon,
  LoaderCircleIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HR_TABS, type HrTab } from "@/features/hr/constants";
import type { HrDialogState } from "@/features/hr/components/hr-dialogs";
import { HrOverview } from "@/features/hr/components/hr-overview";
import type { HrWorkspaceData } from "@/features/hr/types";
import { defaultLocale, type AppLocale } from "@/i18n/routing";

const HrDialogs = dynamic(() =>
  import("@/features/hr/components/hr-dialogs").then(
    (module) => module.HrDialogs,
  ),
);
const HrEmployees = dynamic(
  () =>
    import("@/features/hr/components/hr-employees").then(
      (module) => module.HrEmployees,
    ),
  { loading: () => <RegisterLoading /> },
);
const HrAttendanceRegister = dynamic(
  () =>
    import("@/features/hr/components/hr-registers").then(
      (module) => module.HrAttendanceRegister,
    ),
  { loading: () => <RegisterLoading /> },
);
const HrLeaveRegister = dynamic(
  () =>
    import("@/features/hr/components/hr-registers").then(
      (module) => module.HrLeaveRegister,
    ),
  { loading: () => <RegisterLoading /> },
);
const HrRecruitmentRegister = dynamic(
  () =>
    import("@/features/hr/components/hr-registers").then(
      (module) => module.HrRecruitmentRegister,
    ),
  { loading: () => <RegisterLoading /> },
);
const HrPerformanceRegister = dynamic(
  () =>
    import("@/features/hr/components/hr-registers").then(
      (module) => module.HrPerformanceRegister,
    ),
  { loading: () => <RegisterLoading /> },
);
const HrPayrollRegister = dynamic(
  () =>
    import("@/features/hr/components/hr-registers").then(
      (module) => module.HrPayrollRegister,
    ),
  { loading: () => <RegisterLoading /> },
);

const errorMessages: Record<string, string> = {
  "attendance-save-failed": "Davamiyyət qeydi saxlanmadı.",
  "attendance-validation": "Davamiyyət məlumatlarını yoxlayın.",
  "candidate-create-failed": "Namizəd yaradılmadı.",
  "candidate-stage-invalid": "Namizəd mərhələsi düzgün deyil.",
  "candidate-update-failed": "Namizəd mərhələsi yenilənmədi.",
  "candidate-validation": "Namizəd məlumatlarını yoxlayın.",
  "employee-create-failed": "Əməkdaş yaradılmadı. E-poçt unikal olmalıdır.",
  "employee-manager-self": "Əməkdaş öz meneceri ola bilməz.",
  "employee-update-failed": "Əməkdaş məlumatları yenilənmədi.",
  "employee-validation": "Əməkdaş məlumatlarında tamamlanmamış sahələr var.",
  "leave-create-failed": "Məzuniyyət sorğusu yaradılmadı.",
  "leave-not-pending": "Bu sorğu artıq emal olunub.",
  "leave-overlap": "Seçilən tarixlərdə başqa aktiv məzuniyyət sorğusu var.",
  "leave-review-failed": "Məzuniyyət qərarı saxlanmadı.",
  "leave-review-invalid": "Məzuniyyət qərarı düzgün deyil.",
  "leave-validation": "Məzuniyyət tarixlərini və əməkdaşı yoxlayın.",
  "payroll-create-failed":
    "Payroll dövrü yaradılmadı. Bu dövr artıq mövcud ola bilər.",
  "payroll-item-update-failed": "Payroll sətri yenilənmədi.",
  "payroll-item-validation": "Bonus və tutulma məlumatlarını yoxlayın.",
  "payroll-negative-net": "Tutulma net maaşı mənfi edə bilməz.",
  "payroll-no-employees":
    "Seçilən valyutada maaşı olan aktiv əməkdaş tapılmadı.",
  "payroll-not-editable": "Yalnız qaralama payroll sətrləri dəyişdirilə bilər.",
  "payroll-status-failed": "Payroll statusu yenilənmədi.",
  "payroll-status-invalid": "Payroll status əməliyyatı düzgün deyil.",
  "payroll-status-transition": "Bu payroll status keçidi mümkün deyil.",
  "payroll-validation": "Payroll dövrünü yoxlayın.",
  "preview-readonly":
    "Demo məlumatı dəyişdirilmir. Real bazada yeni qeyd yaradın.",
  "review-create-failed": "Performans qiymətləndirməsi yaradılmadı.",
  "review-validation": "Qiymətləndirmə sahələrini yoxlayın.",
  "vacancy-create-failed": "Vakansiya yaradılmadı.",
  "vacancy-not-open":
    "Namizəd yalnız açıq və ya qaralama vakansiyaya əlavə edilə bilər.",
  "vacancy-validation": "Vakansiya məlumatlarını yoxlayın.",
};

const successMessages: Record<string, string> = {
  "attendance-saved": "Davamiyyət qeydi yeniləndi.",
  "candidate-created": "Namizəd pipeline-a əlavə edildi.",
  "candidate-updated": "Namizəd mərhələsi yeniləndi.",
  "employee-created": "Yeni əməkdaş reyestrə əlavə edildi.",
  "employee-updated": "Əməkdaş profili yeniləndi.",
  "leave-approved": "Məzuniyyət təsdiqləndi.",
  "leave-created": "Məzuniyyət sorğusu yaradıldı.",
  "leave-rejected": "Məzuniyyət sorğusu rədd edildi.",
  "payroll-created": "Payroll dövrü yaradıldı.",
  "payroll-item-updated": "Payroll sətri yeniləndi.",
  "payroll-status-updated": "Payroll statusu yeniləndi.",
  "review-created": "Performans qiymətləndirməsi yaradıldı.",
  "vacancy-created": "Vakansiya yaradıldı.",
};

const monthNames = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avqust",
  "sentyabr",
  "oktyabr",
  "noyabr",
  "dekabr",
] as const;

export function HrWorkspace({
  data,
  error,
  initialEmployeeId,
  initialTab,
  locale,
  success,
}: {
  data: HrWorkspaceData;
  error: string;
  initialEmployeeId: string;
  initialTab: HrTab;
  locale: AppLocale;
  success: string;
}) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [dialog, setDialog] = useState<HrDialogState>({ kind: "closed" });
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  const monthLabel = formatMonthLabel(selectedMonth);

  function navigateToTab(tab: HrTab, values: Record<string, string> = {}) {
    const search = new URLSearchParams({ tab });
    if (data.isPreview) {
      search.set("preview", "1");
    }
    Object.entries(values).forEach(([key, value]) => {
      if (value && value !== "ALL") {
        search.set(key, value);
      }
    });
    const prefix = locale === defaultLocale ? "" : `/${locale}`;
    startNavigation(() => router.push(`${prefix}/hr?${search.toString()}`));
  }

  return (
    <div className="min-h-full bg-[#f6f9ff] px-4 py-5 text-[#0b1f44] sm:px-5 lg:px-8 lg:py-7">
      <header className="flex flex-col justify-between gap-5 border-b border-[#dce5f0] pb-5 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-[2rem] font-bold tracking-[-0.035em] text-[#0b1f44] lg:text-[2.2rem]">
            İnsan resursları
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#63749a]">
            Əməkdaşları, davamiyyəti və komanda inkişafını vahid mərkəzdən idarə
            edin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative flex h-10 items-center gap-2 rounded-xl border border-[#d8e2ee] bg-white px-3 text-xs font-semibold text-[#31476f] shadow-sm">
            <CalendarDaysIcon className="size-4 text-[#42628d]" />
            <span className="capitalize">{monthLabel}</span>
            <input
              aria-label="Hesabat ayı"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(event) => setSelectedMonth(event.target.value)}
              type="month"
              value={selectedMonth}
            />
          </label>
          <Button
            asChild
            className="h-10 rounded-xl border-[#d8e2ee] bg-white px-3 text-xs font-semibold text-[#31476f] hover:bg-[#f8fbff]"
            variant="outline"
          >
            <Link href="/api/hr/employees/export">
              <DownloadIcon className="size-4" />
              Hesabatı endir
            </Link>
          </Button>
          {data.canManage ? (
            <Button
              aria-label="Yeni əməkdaş"
              className="h-10 rounded-xl bg-[#0b66ff] px-3 text-xs font-bold text-white shadow-[0_10px_24px_rgba(11,102,255,0.22)] hover:bg-[#0758dc] sm:px-4"
              onClick={() => setDialog({ kind: "employee" })}
            >
              <PlusIcon className="size-4" />
              <span className="hidden sm:inline">Yeni əməkdaş</span>
            </Button>
          ) : null}
        </div>
      </header>

      {success || error ? (
        <div
          className={
            error
              ? "mt-5 flex items-center gap-3 rounded-xl border border-[#ffd0d2] bg-[#fff2f3] px-4 py-3 text-sm font-semibold text-[#b92b33]"
              : "mt-5 flex items-center gap-3 rounded-xl border border-[#c5ecd9] bg-[#edfbf4] px-4 py-3 text-sm font-semibold text-[#05774d]"
          }
          role="status"
        >
          {error ? (
            <TriangleAlertIcon className="size-4 shrink-0" />
          ) : (
            <CheckCircle2Icon className="size-4 shrink-0" />
          )}
          {error
            ? (errorMessages[error] ?? "HR əməliyyatı tamamlanmadı.")
            : (successMessages[success] ?? "HR məlumatları yeniləndi.")}
        </div>
      ) : null}

      {data.isPreview ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#cfe1ff] bg-[#eef5ff] px-4 py-2.5 text-xs font-semibold text-[#24549a]">
          <span className="size-2 rounded-full bg-[#0b66ff]" />
          Demo məlumatları göstərilir. Migration tətbiq olunandan sonra real HR
          reyestri avtomatik açılacaq.
        </div>
      ) : null}

      <Tabs
        aria-busy={isNavigating}
        className="mt-2"
        onValueChange={(value) => navigateToTab(value as HrTab)}
        value={initialTab}
      >
        <div className="-mx-4 overflow-x-auto border-b border-[#dfe7f1] px-4 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8">
          <TabsList className="h-14 min-w-max gap-7 p-0" variant="line">
            {HR_TABS.map((item) => (
              <TabsTrigger
                className="h-14 flex-none px-1 text-sm font-semibold text-[#52678d] after:bottom-0 after:h-[2px] after:bg-[#0b66ff] data-active:text-[#0b66ff]"
                key={item.id}
                value={item.id}
              >
                {item.label}
                {isNavigating && item.id === initialTab ? (
                  <LoaderCircleIcon className="size-3 animate-spin" />
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {initialTab === "overview" ? (
          <TabsContent className="mt-5" value="overview">
            <HrOverview
              data={data}
              onOpenEmployee={(employeeId) => {
                navigateToTab("employees", { employee: employeeId });
              }}
              onReviewLeave={(request, decision) =>
                setDialog({ decision, kind: "leave-review", request })
              }
            />
          </TabsContent>
        ) : null}
        {initialTab === "employees" ? (
          <TabsContent className="mt-5" value="employees">
            <HrEmployees
              data={data}
              initialEmployeeId={initialEmployeeId}
              key={`${data.employeePage.page}:${data.employeeFilters.department}:${data.employeeFilters.status}:${data.employeeFilters.workMode}:${data.employeeFilters.search}:${initialEmployeeId}`}
              onCreate={() => setDialog({ kind: "employee" })}
              onEdit={(employee) => setDialog({ employee, kind: "employee" })}
              onFilter={(filters) =>
                navigateToTab("employees", {
                  department: filters.department,
                  mode: filters.workMode,
                  q: filters.search,
                  status: filters.status,
                })
              }
              onRecordAttendance={(employee) =>
                setDialog({ employee, kind: "attendance" })
              }
              onPageChange={(page) =>
                navigateToTab("employees", {
                  department: data.employeeFilters.department,
                  mode: data.employeeFilters.workMode,
                  page: String(page),
                  q: data.employeeFilters.search,
                  status: data.employeeFilters.status,
                })
              }
            />
          </TabsContent>
        ) : null}
        {initialTab === "attendance" ? (
          <TabsContent className="mt-5" value="attendance">
            <HrAttendanceRegister
              data={data}
              onRecord={(employee) =>
                setDialog({ employee, kind: "attendance" })
              }
            />
          </TabsContent>
        ) : null}
        {initialTab === "leave" ? (
          <TabsContent className="mt-5" value="leave">
            <HrLeaveRegister
              data={data}
              onCreate={() => setDialog({ kind: "leave" })}
              onReview={(request, decision) =>
                setDialog({ decision, kind: "leave-review", request })
              }
            />
          </TabsContent>
        ) : null}
        {initialTab === "recruitment" ? (
          <TabsContent className="mt-5" value="recruitment">
            <HrRecruitmentRegister
              data={data}
              locale={locale}
              onCreateCandidate={(vacancyId) =>
                setDialog({ kind: "candidate", vacancyId })
              }
              onCreateVacancy={() => setDialog({ kind: "vacancy" })}
            />
          </TabsContent>
        ) : null}
        {initialTab === "performance" ? (
          <TabsContent className="mt-5" value="performance">
            <HrPerformanceRegister
              data={data}
              onCreate={(employeeId) =>
                setDialog({ employeeId, kind: "performance" })
              }
            />
          </TabsContent>
        ) : null}
        {initialTab === "payroll" ? (
          <TabsContent className="mt-5" value="payroll">
            <HrPayrollRegister
              data={data}
              locale={locale}
              onCreate={() => setDialog({ kind: "payroll" })}
              onEditItem={(item) => setDialog({ item, kind: "payroll-item" })}
              onSelectRun={(runId) => navigateToTab("payroll", { run: runId })}
            />
          </TabsContent>
        ) : null}
      </Tabs>

      {dialog.kind !== "closed" ? (
        <HrDialogs
          data={data}
          locale={locale}
          onChange={setDialog}
          state={dialog}
        />
      ) : null}
    </div>
  );
}

function formatMonthLabel(value: string) {
  const [year, rawMonth] = value.split("-");
  const month = Number(rawMonth);

  return `${monthNames[month - 1] ?? rawMonth} ${year}`;
}

function RegisterLoading() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-[20px] border border-[#dce5f0] bg-white text-sm font-semibold text-[#627497]">
      <LoaderCircleIcon className="mr-2 size-4 animate-spin text-[#0b66ff]" />
      Bölmə yüklənir…
    </div>
  );
}
