"use client";

import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BanknoteIcon,
  BriefcaseBusinessIcon,
  CalendarCheck2Icon,
  CalendarClockIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleDollarSignIcon,
  Clock3Icon,
  LockKeyholeIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  TrendingUpIcon,
  UserPlusIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  moveHrCandidateAction,
  updateHrPayrollStatusAction,
} from "@/features/hr/actions";
import {
  ATTENDANCE_STATUS_LABELS,
  CANDIDATE_STAGE_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
  PAYROLL_STATUS_LABELS,
  REVIEW_STATUS_LABELS,
  VACANCY_STATUS_LABELS,
  WORK_MODE_LABELS,
} from "@/features/hr/constants";
import {
  formatHrDate,
  formatHrMoney,
  getHrInitials,
  getTodayInputValue,
} from "@/features/hr/format";
import type {
  HrAttendanceStatus,
  HrCandidateRecord,
  HrCandidateStage,
  HrEmployeeRecord,
  HrLeaveRequestRecord,
  HrPayrollItemRecord,
  HrPerformanceReviewRecord,
  HrWorkspaceData,
} from "@/features/hr/types";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-10 rounded-xl border border-[#d8e2ee] bg-white px-3 text-xs font-medium text-[#31476f] outline-none transition focus:border-[#6ca7ff] focus:ring-2 focus:ring-[#dceaff]";

export function HrAttendanceRegister({
  data,
  onRecord,
}: {
  data: HrWorkspaceData;
  onRecord: (employee: HrEmployeeRecord) => void;
}) {
  const latestDate = data.attendance[0]?.workDate ?? getTodayInputValue();
  const [workDate, setWorkDate] = useState(latestDate);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const rows = useMemo(() => {
    const query = search.toLocaleLowerCase("az-AZ");
    return data.employees
      .filter((employee) => employee.employmentStatus !== "TERMINATED")
      .map((employee) => ({
        attendance: data.attendance.find(
          (row) => row.employeeId === employee.id && row.workDate === workDate,
        ),
        employee,
      }))
      .filter(({ attendance, employee }) => {
        const matchesSearch =
          !query ||
          `${employee.fullName} ${employee.department} ${employee.position}`
            .toLocaleLowerCase("az-AZ")
            .includes(query);
        const rowStatus = attendance?.status ?? "UNRECORDED";
        return matchesSearch && (status === "ALL" || rowStatus === status);
      });
  }, [data.attendance, data.employees, search, status, workDate]);
  const dayRows = data.attendance.filter((row) => row.workDate === workDate);
  const atWork = dayRows.filter((row) =>
    ["PRESENT", "LATE", "REMOTE"].includes(row.status),
  ).length;

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#dce5f0] bg-white shadow-[0_10px_30px_rgba(29,53,87,0.035)]">
      <div className="grid gap-3 border-b border-[#e1e8f1] p-4 md:grid-cols-[180px_minmax(220px,1fr)_180px_auto]">
        <Input
          aria-label="Davamiyyət tarixi"
          className="h-10 rounded-xl border-[#d8e2ee] bg-white text-xs text-[#31476f]"
          onChange={(event) => setWorkDate(event.target.value)}
          type="date"
          value={workDate}
        />
        <label className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8997ae]" />
          <Input
            className="h-10 rounded-xl border-[#d8e2ee] bg-white pl-9 text-xs"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Əməkdaş və ya departament axtar"
            value={search}
          />
        </label>
        <select
          className={selectClassName}
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        >
          <option value="ALL">Bütün statuslar</option>
          {Object.entries(ATTENDANCE_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
          <option value="UNRECORDED">Qeyd edilməyib</option>
        </select>
        <div className="flex items-center justify-end gap-2 text-[10px] font-semibold text-[#617397]">
          <span className="rounded-full bg-[#eaf8f1] px-2.5 py-1 text-[#07885a]">
            İşdə {atWork}
          </span>
          <span className="rounded-full bg-[#eef3fa] px-2.5 py-1">
            Qeyd {dayRows.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-[#e2eaf3] border-b border-[#e2eaf3] sm:grid-cols-4 sm:divide-y-0">
        <SummaryMetric
          icon={UsersRoundIcon}
          label="Aktiv heyət"
          value={data.metrics.activeEmployees}
        />
        <SummaryMetric
          icon={CalendarCheck2Icon}
          label="İşdə"
          tone="green"
          value={atWork}
        />
        <SummaryMetric
          icon={Clock3Icon}
          label="Gecikmə"
          tone="orange"
          value={dayRows.filter((row) => row.status === "LATE").length}
        />
        <SummaryMetric
          icon={TrendingUpIcon}
          label="Davamiyyət"
          tone="blue"
          value={`${data.metrics.attendanceRate}%`}
        />
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#e5ecf4] bg-[#fbfcfe] text-[9px] uppercase tracking-[0.08em] text-[#7786a0]">
              <th className="px-5 py-3">Əməkdaş</th>
              <th className="px-3 py-3">Departament</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Giriş</th>
              <th className="px-3 py-3">Çıxış</th>
              <th className="px-3 py-3">Qeyd</th>
              <th className="w-24 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8eef5]">
            {rows.map(({ attendance, employee }) => (
              <tr className="transition hover:bg-[#f8fbff]" key={employee.id}>
                <td className="px-5 py-3">
                  <PersonCell employee={employee} />
                </td>
                <td className="px-3 py-3 text-[10px] text-[#465f85]">
                  {employee.department}
                </td>
                <td className="px-3 py-3">
                  {attendance ? (
                    <AttendanceBadge status={attendance.status} />
                  ) : (
                    <span className="rounded-full bg-[#eef2f7] px-2.5 py-1 text-[9px] font-semibold text-[#72809a]">
                      Qeyd yoxdur
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-xs font-semibold text-[#344f78]">
                  {attendance?.checkIn || "—"}
                </td>
                <td className="px-3 py-3 text-xs text-[#566e92]">
                  {attendance?.checkOut || "—"}
                </td>
                <td className="max-w-48 px-3 py-3 text-[10px] text-[#73819d]">
                  <span className="line-clamp-2">
                    {attendance?.note || "—"}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  {data.canManageAttendance ? (
                    <Button
                      className="h-8 rounded-lg border-[#d8e2ee] bg-white px-2.5 text-[9px] font-semibold text-[#456287] hover:bg-[#eef5ff]"
                      onClick={() => onRecord(employee)}
                      variant="outline"
                    >
                      <PencilIcon className="size-3" />
                      Qeyd et
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-[#e8eef5] md:hidden">
        {rows.map(({ attendance, employee }) => (
          <div className="space-y-2 px-4 py-3" key={employee.id}>
            <div className="flex items-center justify-between gap-3">
              <PersonCell employee={employee} />
              {attendance ? (
                <AttendanceBadge status={attendance.status} />
              ) : (
                <span className="text-[9px] text-[#7e8ca5]">Qeyd yoxdur</span>
              )}
            </div>
            <div className="flex items-center justify-between pl-10 text-[10px] text-[#65769a]">
              <span>
                Giriş:{" "}
                <strong className="text-[#365079]">
                  {attendance?.checkIn || "—"}
                </strong>
              </span>
              <span>
                Çıxış:{" "}
                <strong className="text-[#365079]">
                  {attendance?.checkOut || "—"}
                </strong>
              </span>
              {data.canManageAttendance ? (
                <Button
                  className="h-7 rounded-lg px-2 text-[9px]"
                  onClick={() => onRecord(employee)}
                  variant="outline"
                >
                  Qeyd et
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HrLeaveRegister({
  data,
  onCreate,
  onReview,
}: {
  data: HrWorkspaceData;
  onCreate: () => void;
  onReview: (
    request: HrLeaveRequestRecord,
    decision: "APPROVED" | "REJECTED",
  ) => void;
}) {
  const [status, setStatus] = useState("ALL");
  const rows = data.leaveRequests.filter(
    (request) => status === "ALL" || request.status === status,
  );

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#dce5f0] bg-white shadow-[0_10px_30px_rgba(29,53,87,0.035)]">
      <div className="flex flex-col justify-between gap-3 border-b border-[#e1e8f1] p-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-bold text-[#152a52]">
            Məzuniyyət idarəetməsi
          </h2>
          <p className="mt-1 text-[10px] text-[#7887a2]">
            Sorğular, qərarlar və illik balanslar bir reyestrdə
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className={selectClassName}
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="ALL">Bütün statuslar</option>
            {Object.entries(LEAVE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {data.canManage ? (
            <Button
              className="h-10 rounded-xl bg-[#0b66ff] px-3 text-xs font-bold text-white hover:bg-[#0758dc]"
              onClick={onCreate}
            >
              <PlusIcon className="size-4" />
              Yeni sorğu
            </Button>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-[#e2eaf3] border-b border-[#e2eaf3] sm:grid-cols-4 sm:divide-y-0">
        <SummaryMetric
          icon={Clock3Icon}
          label="Gözləyir"
          tone="orange"
          value={
            data.leaveRequests.filter((row) => row.status === "PENDING").length
          }
        />
        <SummaryMetric
          icon={CheckIcon}
          label="Təsdiqlənib"
          tone="green"
          value={
            data.leaveRequests.filter((row) => row.status === "APPROVED").length
          }
        />
        <SummaryMetric
          icon={XIcon}
          label="Rədd edilib"
          value={
            data.leaveRequests.filter((row) => row.status === "REJECTED").length
          }
        />
        <SummaryMetric
          icon={CalendarClockIcon}
          label="Bu ay gün"
          tone="blue"
          value={data.leaveRequests
            .filter((row) => row.status === "APPROVED")
            .reduce((sum, row) => sum + row.days, 0)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#e5ecf4] bg-[#fbfcfe] text-[9px] uppercase tracking-[0.08em] text-[#7786a0]">
              <th className="px-5 py-3">Əməkdaş</th>
              <th className="px-3 py-3">Kod</th>
              <th className="px-3 py-3">Növ</th>
              <th className="px-3 py-3">Tarix aralığı</th>
              <th className="px-3 py-3">Gün</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Qərar verən</th>
              <th className="w-24 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8eef5]">
            {rows.map((request) => (
              <tr className="transition hover:bg-[#f8fbff]" key={request.id}>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2.5">
                    <Initials name={request.employeeName} />
                    <span>
                      <strong className="block text-xs font-semibold text-[#2c436b]">
                        {request.employeeName}
                      </strong>
                      <span className="text-[9px] text-[#8592a8]">
                        {request.employeeCode}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3 text-[10px] font-semibold text-[#536b90]">
                  {request.code}
                </td>
                <td className="px-3 py-3 text-[10px] text-[#40587f]">
                  {LEAVE_TYPE_LABELS[request.type]}
                </td>
                <td className="px-3 py-3 text-[10px] text-[#40587f]">
                  {formatHrDate(request.startDate)} –{" "}
                  {formatHrDate(request.endDate)}
                </td>
                <td className="px-3 py-3 text-xs font-bold text-[#253f68]">
                  {request.days}
                </td>
                <td className="px-3 py-3">
                  <LeaveBadge status={request.status} />
                </td>
                <td className="px-3 py-3 text-[10px] text-[#71819e]">
                  {request.reviewedBy || "—"}
                </td>
                <td className="px-3 py-3">
                  {request.status === "PENDING" && data.canApproveLeave ? (
                    <div className="flex gap-1.5">
                      <Button
                        aria-label="Təsdiqlə"
                        className="size-8 rounded-full border-[#a6dfc6] bg-white text-[#07975f] hover:bg-[#edfbf4]"
                        onClick={() => onReview(request, "APPROVED")}
                        size="icon"
                        variant="outline"
                      >
                        <CheckIcon className="size-3.5" />
                      </Button>
                      <Button
                        aria-label="Rədd et"
                        className="size-8 rounded-full border-[#ffc3c7] bg-white text-[#e33d49] hover:bg-[#fff2f3]"
                        onClick={() => onReview(request, "REJECTED")}
                        size="icon"
                        variant="outline"
                      >
                        <XIcon className="size-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? (
        <RegisterEmpty
          icon={CalendarClockIcon}
          label="Bu filtrə uyğun məzuniyyət sorğusu yoxdur."
        />
      ) : null}
    </section>
  );
}

export function HrRecruitmentRegister({
  data,
  locale,
  onCreateCandidate,
  onCreateVacancy,
}: {
  data: HrWorkspaceData;
  locale: AppLocale;
  onCreateCandidate: (vacancyId?: string) => void;
  onCreateVacancy: () => void;
}) {
  const [selectedId, setSelectedId] = useState(data.vacancies[0]?.id ?? "");
  const selected =
    data.vacancies.find((vacancy) => vacancy.id === selectedId) ??
    data.vacancies[0];
  const stages = Object.keys(CANDIDATE_STAGE_LABELS) as HrCandidateStage[];

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="overflow-hidden rounded-[20px] border border-[#dce5f0] bg-white shadow-[0_10px_30px_rgba(29,53,87,0.035)]">
        <div className="flex items-center justify-between border-b border-[#e3eaf3] p-4">
          <div>
            <h2 className="text-sm font-bold text-[#152a52]">Vakansiyalar</h2>
            <p className="mt-1 text-[10px] text-[#7b89a4]">
              {data.metrics.openVacancies} açıq vakansiya
            </p>
          </div>
          {data.canManage ? (
            <Button
              className="size-9 rounded-xl bg-[#0b66ff] text-white hover:bg-[#0758dc]"
              onClick={onCreateVacancy}
              size="icon"
            >
              <PlusIcon className="size-4" />
            </Button>
          ) : null}
        </div>
        <div className="divide-y divide-[#e7edf5]">
          {data.vacancies.map((vacancy) => (
            <button
              className={cn(
                "w-full px-4 py-3 text-left transition hover:bg-[#f8fbff]",
                selected?.id === vacancy.id &&
                  "bg-[#f1f6ff] shadow-[inset_3px_0_0_#0b66ff]",
              )}
              key={vacancy.id}
              onClick={() => setSelectedId(vacancy.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <strong className="block truncate text-xs font-bold text-[#263f69]">
                    {vacancy.title}
                  </strong>
                  <span className="mt-1 block truncate text-[10px] text-[#71819e]">
                    {vacancy.department} · {WORK_MODE_LABELS[vacancy.workMode]}
                  </span>
                </div>
                <VacancyBadge status={vacancy.status} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[9px] text-[#8290a8]">
                <span>{vacancy.code}</span>
                <span>{vacancy.candidateCount} namizəd</span>
              </div>
            </button>
          ))}
        </div>
        {!data.vacancies.length ? (
          <RegisterEmpty
            icon={BriefcaseBusinessIcon}
            label="Vakansiya yaradılmayıb."
          />
        ) : null}
      </section>

      <section className="min-w-0 overflow-hidden rounded-[20px] border border-[#dce5f0] bg-white shadow-[0_10px_30px_rgba(29,53,87,0.035)]">
        {selected ? (
          <>
            <div className="flex flex-col justify-between gap-3 border-b border-[#e3eaf3] p-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold text-[#152a52]">
                    {selected.title}
                  </h2>
                  <VacancyBadge status={selected.status} />
                </div>
                <p className="mt-1 text-[10px] text-[#7585a0]">
                  {selected.department} ·{" "}
                  {selected.location || "Məkan göstərilməyib"} ·{" "}
                  {selected.hiringManagerName || "Menecer təyin edilməyib"}
                </p>
              </div>
              {data.canManage ? (
                <Button
                  className="h-9 rounded-xl bg-[#0b66ff] px-3 text-[10px] font-bold text-white hover:bg-[#0758dc]"
                  onClick={() => onCreateCandidate(selected.id)}
                >
                  <UserPlusIcon className="size-3.5" />
                  Namizəd əlavə et
                </Button>
              ) : null}
            </div>
            <div className="overflow-x-auto p-4">
              <div className="grid min-w-[1180px] grid-cols-6 gap-3">
                {stages.map((stage) => {
                  const candidates = selected.candidates.filter(
                    (candidate) => candidate.stage === stage,
                  );
                  return (
                    <div
                      className="rounded-2xl border border-[#e0e8f2] bg-[#f8faff] p-2.5"
                      key={stage}
                    >
                      <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
                        <strong className="text-[10px] font-bold text-[#3b5278]">
                          {CANDIDATE_STAGE_LABELS[stage]}
                        </strong>
                        <span className="flex size-5 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#6780a5]">
                          {candidates.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {candidates.map((candidate) => (
                          <CandidateCard
                            candidate={candidate}
                            canManage={data.canManage && !data.isPreview}
                            key={candidate.id}
                            locale={locale}
                          />
                        ))}
                        {!candidates.length ? (
                          <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-[#d4dfec] text-center text-[9px] text-[#93a0b5]">
                            Namizəd yoxdur
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <RegisterEmpty
            icon={BriefcaseBusinessIcon}
            label="Pipeline üçün vakansiya seçin."
          />
        )}
      </section>
    </div>
  );
}

export function HrPerformanceRegister({
  data,
  onCreate,
}: {
  data: HrWorkspaceData;
  onCreate: (employeeId?: string) => void;
}) {
  const completed = data.performanceReviews.filter(
    (review) => review.status === "COMPLETED",
  );
  const average = completed.length
    ? completed.reduce((sum, review) => sum + (review.score ?? 0), 0) /
      completed.length
    : 0;
  const [status, setStatus] = useState("ALL");
  const rows = data.performanceReviews.filter(
    (review) => status === "ALL" || review.status === status,
  );

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#dce5f0] bg-white shadow-[0_10px_30px_rgba(29,53,87,0.035)]">
      <div className="flex flex-col justify-between gap-3 border-b border-[#e1e8f1] p-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-bold text-[#152a52]">
            Performans dövrləri
          </h2>
          <p className="mt-1 text-[10px] text-[#7887a2]">
            Məqsəd, geribildirim və nəticə qiymətləndirmələri
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className={selectClassName}
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="ALL">Bütün statuslar</option>
            {Object.entries(REVIEW_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {data.canManage ? (
            <Button
              className="h-10 rounded-xl bg-[#0b66ff] px-3 text-xs font-bold text-white hover:bg-[#0758dc]"
              onClick={() => onCreate()}
            >
              <PlusIcon className="size-4" />
              Yeni qiymətləndirmə
            </Button>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-[#e2eaf3] border-b border-[#e2eaf3] sm:grid-cols-4 sm:divide-y-0">
        <SummaryMetric
          icon={StarIcon}
          label="Orta bal"
          tone="blue"
          value={average ? average.toFixed(1) : "—"}
        />
        <SummaryMetric
          icon={BadgeCheckIcon}
          label="Tamamlanıb"
          tone="green"
          value={completed.length}
        />
        <SummaryMetric
          icon={Clock3Icon}
          label="Davam edir"
          tone="orange"
          value={
            data.performanceReviews.filter(
              (review) => review.status === "IN_PROGRESS",
            ).length
          }
        />
        <SummaryMetric
          icon={UsersRoundIcon}
          label="Əhatə"
          value={`${Math.round((completed.length / Math.max(1, data.metrics.activeEmployees)) * 100)}%`}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#e5ecf4] bg-[#fbfcfe] text-[9px] uppercase tracking-[0.08em] text-[#7786a0]">
              <th className="px-5 py-3">Əməkdaş</th>
              <th className="px-3 py-3">Qiymətləndirən</th>
              <th className="px-3 py-3">Dövr</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Bal</th>
              <th className="px-3 py-3">Güclü tərəflər</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8eef5]">
            {rows.map((review) => (
              <ReviewRow key={review.id} onCreate={onCreate} review={review} />
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? (
        <RegisterEmpty
          icon={TrendingUpIcon}
          label="Qiymətləndirmə qeydi yoxdur."
        />
      ) : null}
    </section>
  );
}

export function HrPayrollRegister({
  data,
  locale,
  onCreate,
  onEditItem,
  onSelectRun,
}: {
  data: HrWorkspaceData;
  locale: AppLocale;
  onCreate: () => void;
  onEditItem: (item: HrPayrollItemRecord) => void;
  onSelectRun: (runId: string) => void;
}) {
  const selectedId = data.selectedPayrollRunId || data.payrollRuns[0]?.id || "";
  const selected =
    data.payrollRuns.find((run) => run.id === selectedId) ??
    data.payrollRuns[0];

  if (!data.canViewPayroll) {
    return (
      <section className="flex min-h-[520px] flex-col items-center justify-center rounded-[20px] border border-[#dce5f0] bg-white px-6 text-center shadow-[0_10px_30px_rgba(29,53,87,0.035)]">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#edf3ff] text-[#4069a6]">
          <LockKeyholeIcon className="size-6" />
        </span>
        <h2 className="mt-4 text-base font-bold text-[#18325d]">
          Məxfi əmək haqqı sahəsi
        </h2>
        <p className="mt-2 max-w-md text-xs leading-5 text-[#72819d]">
          Bu bölmə yalnız `hr:payroll` səlahiyyəti olan HR, Maliyyə və
          administrator rolları üçün açıqdır.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[20px] border border-[#dce5f0] bg-white shadow-[0_10px_30px_rgba(29,53,87,0.035)]">
        <div className="flex flex-col justify-between gap-3 border-b border-[#e1e8f1] p-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-bold text-[#152a52]">
              Əmək haqqı dövrləri
            </h2>
            <p className="mt-1 text-[10px] text-[#7887a2]">
              Bonus, tutulma, təsdiq və ödəniş statusları
            </p>
          </div>
          <div className="flex gap-2">
            <select
              className={selectClassName}
              onChange={(event) => onSelectRun(event.target.value)}
              value={selected?.id ?? ""}
            >
              {data.payrollRuns.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.code} · {PAYROLL_STATUS_LABELS[run.status]}
                </option>
              ))}
            </select>
            <Button
              className="h-10 rounded-xl bg-[#0b66ff] px-3 text-xs font-bold text-white hover:bg-[#0758dc]"
              onClick={onCreate}
            >
              <PlusIcon className="size-4" />
              Yeni dövr
            </Button>
          </div>
        </div>
        {selected ? (
          <>
            <div className="grid grid-cols-2 divide-x divide-y divide-[#e2eaf3] border-b border-[#e2eaf3] lg:grid-cols-5 lg:divide-y-0">
              <SummaryMetric
                icon={BanknoteIcon}
                label="Brüt maaş"
                value={formatHrMoney(selected.totalGross, selected.currency)}
              />
              <SummaryMetric
                icon={TrendingUpIcon}
                label="Bonus"
                tone="green"
                value={formatHrMoney(selected.totalBonus, selected.currency)}
              />
              <SummaryMetric
                icon={CircleDollarSignIcon}
                label="Tutulma"
                tone="orange"
                value={formatHrMoney(
                  selected.totalDeductions,
                  selected.currency,
                )}
              />
              <SummaryMetric
                icon={CircleDollarSignIcon}
                label="Net ödəniş"
                tone="blue"
                value={formatHrMoney(selected.totalNet, selected.currency)}
              />
              <SummaryMetric
                icon={UsersRoundIcon}
                label="Əməkdaş"
                value={selected.items.length}
              />
            </div>
            <div className="flex flex-col justify-between gap-3 border-b border-[#e4ebf4] px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <PayrollBadge status={selected.status} />
                <span className="text-[10px] text-[#6e7f9d]">
                  {formatHrDate(selected.periodStart)} –{" "}
                  {formatHrDate(selected.periodEnd)}
                </span>
              </div>
              {!data.isPreview ? (
                <div className="flex gap-2">
                  {selected.status === "DRAFT" ? (
                    <PayrollStatusForm
                      label="Təsdiqlə"
                      locale={locale}
                      payrollRunId={selected.id}
                      status="APPROVED"
                    />
                  ) : null}
                  {selected.status === "APPROVED" ? (
                    <PayrollStatusForm
                      label="Ödənildi"
                      locale={locale}
                      payrollRunId={selected.id}
                      status="PAID"
                    />
                  ) : null}
                  {["DRAFT", "APPROVED"].includes(selected.status) ? (
                    <PayrollStatusForm
                      label="Ləğv et"
                      locale={locale}
                      payrollRunId={selected.id}
                      status="CANCELLED"
                      variant="outline"
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#e5ecf4] bg-[#fbfcfe] text-[9px] uppercase tracking-[0.08em] text-[#7786a0]">
                    <th className="px-5 py-3">Əməkdaş</th>
                    <th className="px-3 py-3">Əsas maaş</th>
                    <th className="px-3 py-3">Bonus</th>
                    <th className="px-3 py-3">Tutulma</th>
                    <th className="px-3 py-3">Net maaş</th>
                    <th className="px-3 py-3">Qeyd</th>
                    <th className="w-20 px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8eef5]">
                  {selected.items.map((item) => (
                    <tr className="transition hover:bg-[#f8fbff]" key={item.id}>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2.5">
                          <Initials name={item.employeeName} />
                          <span>
                            <strong className="block text-xs font-semibold text-[#2c436b]">
                              {item.employeeName}
                            </strong>
                            <span className="text-[9px] text-[#8592a8]">
                              {item.employeeCode}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[10px] font-semibold text-[#365079]">
                        {formatHrMoney(item.baseSalary, item.currency)}
                      </td>
                      <td className="px-3 py-3 text-[10px] font-semibold text-[#07885a]">
                        +{formatHrMoney(item.bonus, item.currency)}
                      </td>
                      <td className="px-3 py-3 text-[10px] font-semibold text-[#d97a00]">
                        −{formatHrMoney(item.deductions, item.currency)}
                      </td>
                      <td className="px-3 py-3 text-xs font-bold text-[#0b66ff]">
                        {formatHrMoney(item.netSalary, item.currency)}
                      </td>
                      <td className="max-w-52 px-3 py-3 text-[10px] text-[#7483a0]">
                        <span className="line-clamp-2">{item.note || "—"}</span>
                      </td>
                      <td className="px-3 py-3">
                        {selected.status === "DRAFT" ? (
                          <Button
                            className="h-8 rounded-lg border-[#d8e2ee] bg-white px-2 text-[9px]"
                            onClick={() => onEditItem(item)}
                            variant="outline"
                          >
                            <PencilIcon className="size-3" />
                            Dəyiş
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <RegisterEmpty
            icon={BanknoteIcon}
            label="Payroll dövrü yaradılmayıb."
          />
        )}
      </section>
    </div>
  );
}

function CandidateCard({
  candidate,
  canManage,
  locale,
}: {
  candidate: HrCandidateRecord;
  canManage: boolean;
  locale: AppLocale;
}) {
  return (
    <article className="rounded-xl border border-[#dce5f0] bg-white p-3 shadow-[0_6px_16px_rgba(29,53,87,0.04)]">
      <div className="flex items-start gap-2">
        <Initials name={candidate.fullName} />
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-[10px] font-bold text-[#2c446d]">
            {candidate.fullName}
          </strong>
          <span className="mt-0.5 block truncate text-[8px] text-[#8491a8]">
            {candidate.email}
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[8px] text-[#7a89a4]">
        <span>{candidate.source || "Birbaşa"}</span>
        <span className="flex items-center gap-0.5">
          <StarIcon className="size-2.5 fill-[#f6a700] text-[#f6a700]" />
          {candidate.rating}/5
        </span>
      </div>
      {candidate.nextInterviewAt ? (
        <div className="mt-2 flex items-center gap-1 text-[8px] font-semibold text-[#506b94]">
          <CalendarClockIcon className="size-3" />
          {formatHrDate(candidate.nextInterviewAt, "dd MMM, HH:mm")}
        </div>
      ) : null}
      {canManage ? (
        <form action={moveHrCandidateAction} className="mt-2 flex gap-1">
          <input name="candidateId" type="hidden" value={candidate.id} />
          <input name="locale" type="hidden" value={locale} />
          <select
            className="h-7 min-w-0 flex-1 rounded-lg border border-[#d8e2ee] bg-white px-1.5 text-[8px] text-[#425b81]"
            defaultValue={candidate.stage}
            name="stage"
          >
            {Object.entries(CANDIDATE_STAGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button
            className="size-7 rounded-lg bg-[#0b66ff] text-white"
            size="icon"
            type="submit"
          >
            <ArrowRightIcon className="size-3" />
          </Button>
        </form>
      ) : null}
    </article>
  );
}

function ReviewRow({
  onCreate,
  review,
}: {
  onCreate: (employeeId?: string) => void;
  review: HrPerformanceReviewRecord;
}) {
  return (
    <tr className="transition hover:bg-[#f8fbff]">
      <td className="px-5 py-3">
        <span className="flex items-center gap-2.5">
          <Initials name={review.employeeName} />
          <strong className="text-xs font-semibold text-[#2c436b]">
            {review.employeeName}
          </strong>
        </span>
      </td>
      <td className="px-3 py-3 text-[10px] text-[#50698f]">
        {review.reviewerName || "—"}
      </td>
      <td className="px-3 py-3 text-[10px] text-[#50698f]">
        {formatHrDate(review.periodStart)} – {formatHrDate(review.periodEnd)}
      </td>
      <td className="px-3 py-3">
        <ReviewBadge status={review.status} />
      </td>
      <td className="px-3 py-3">
        <span className="flex items-center gap-1 text-xs font-bold text-[#2c4f7d]">
          <StarIcon className="size-3.5 fill-[#f6a700] text-[#f6a700]" />
          {review.score?.toFixed(1) ?? "—"}
        </span>
      </td>
      <td className="max-w-64 px-3 py-3 text-[10px] text-[#6f809e]">
        <span className="line-clamp-2">{review.strengths || "—"}</span>
      </td>
      <td className="px-3 py-3">
        <Button
          aria-label="Yeni qiymətləndirmə"
          className="size-8 rounded-lg border-[#d8e2ee] bg-white text-[#46658f]"
          onClick={() => onCreate(review.employeeId)}
          size="icon"
          variant="outline"
        >
          <ChevronRightIcon className="size-3.5" />
        </Button>
      </td>
    </tr>
  );
}

function PayrollStatusForm({
  label,
  locale,
  payrollRunId,
  status,
  variant = "default",
}: {
  label: string;
  locale: AppLocale;
  payrollRunId: string;
  status: "APPROVED" | "PAID" | "CANCELLED";
  variant?: "default" | "outline";
}) {
  return (
    <form action={updateHrPayrollStatusAction}>
      <input name="locale" type="hidden" value={locale} />
      <input name="payrollRunId" type="hidden" value={payrollRunId} />
      <input name="status" type="hidden" value={status} />
      <Button
        className={cn(
          "h-8 rounded-lg px-3 text-[9px] font-bold",
          variant === "default" && "bg-[#0b66ff] text-white hover:bg-[#0758dc]",
        )}
        type="submit"
        variant={variant}
      >
        {label}
      </Button>
    </form>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof UsersRoundIcon;
  label: string;
  tone?: "blue" | "green" | "orange";
  value: React.ReactNode;
}) {
  return (
    <div className="flex min-h-20 items-center gap-3 px-4 py-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#edf2f9] text-[#587096]",
          tone === "blue" && "bg-[#eaf2ff] text-[#0b66ff]",
          tone === "green" && "bg-[#e9f8f0] text-[#0a9a65]",
          tone === "orange" && "bg-[#fff2df] text-[#db7b00]",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-[9px] text-[#7483a0]">{label}</span>
        <strong className="mt-0.5 block text-sm font-bold text-[#263f69]">
          {value}
        </strong>
      </span>
    </div>
  );
}

function PersonCell({ employee }: { employee: HrEmployeeRecord }) {
  return (
    <span className="flex min-w-[190px] items-center gap-2.5">
      <Initials name={employee.fullName} />
      <span className="min-w-0">
        <strong className="block truncate text-xs font-semibold text-[#2c436b]">
          {employee.fullName}
        </strong>
        <span className="mt-0.5 block truncate text-[9px] text-[#8592a8]">
          {employee.position}
        </span>
      </span>
    </span>
  );
}

function Initials({ name }: { name: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-[9px] font-bold text-[#3567b5]">
      {getHrInitials(name)}
    </span>
  );
}

function AttendanceBadge({ status }: { status: HrAttendanceStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold",
        status === "PRESENT" && "bg-[#e9f8f0] text-[#07885a]",
        status === "LATE" && "bg-[#fff2df] text-[#d97a00]",
        status === "REMOTE" && "bg-[#eaf2ff] text-[#0b66ff]",
        ["ABSENT", "SICK_LEAVE", "VACATION"].includes(status) &&
          "bg-[#fff0f1] text-[#d33f4b]",
      )}
    >
      {ATTENDANCE_STATUS_LABELS[status]}
    </span>
  );
}

function LeaveBadge({ status }: { status: HrLeaveRequestRecord["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold",
        status === "APPROVED" && "bg-[#e9f8f0] text-[#07885a]",
        status === "PENDING" && "bg-[#fff2df] text-[#d97a00]",
        status === "REJECTED" && "bg-[#fff0f1] text-[#d33f4b]",
        status === "CANCELLED" && "bg-[#eef2f7] text-[#6d7d98]",
      )}
    >
      {LEAVE_STATUS_LABELS[status]}
    </span>
  );
}

function VacancyBadge({
  status,
}: {
  status: keyof typeof VACANCY_STATUS_LABELS;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-1 text-[8px] font-semibold",
        status === "OPEN" && "bg-[#e9f8f0] text-[#07885a]",
        status === "DRAFT" && "bg-[#eaf2ff] text-[#0b66ff]",
        status === "PAUSED" && "bg-[#fff2df] text-[#d97a00]",
        status === "CLOSED" && "bg-[#eef2f7] text-[#6d7d98]",
      )}
    >
      {VACANCY_STATUS_LABELS[status]}
    </span>
  );
}

function ReviewBadge({
  status,
}: {
  status: HrPerformanceReviewRecord["status"];
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold",
        status === "COMPLETED" && "bg-[#e9f8f0] text-[#07885a]",
        status === "IN_PROGRESS" && "bg-[#eaf2ff] text-[#0b66ff]",
        status === "DRAFT" && "bg-[#eef2f7] text-[#6d7d98]",
      )}
    >
      {REVIEW_STATUS_LABELS[status]}
    </span>
  );
}

function PayrollBadge({
  status,
}: {
  status: keyof typeof PAYROLL_STATUS_LABELS;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold",
        status === "PAID" && "bg-[#e9f8f0] text-[#07885a]",
        status === "APPROVED" && "bg-[#eaf2ff] text-[#0b66ff]",
        status === "DRAFT" && "bg-[#fff2df] text-[#d97a00]",
        status === "CANCELLED" && "bg-[#fff0f1] text-[#d33f4b]",
      )}
    >
      {PAYROLL_STATUS_LABELS[status]}
    </span>
  );
}

function RegisterEmpty({
  icon: Icon,
  label,
}: {
  icon: typeof UsersRoundIcon;
  label: string;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-[#edf3ff] text-[#4f72a7]">
        <Icon className="size-5" />
      </span>
      <p className="max-w-sm text-xs text-[#7887a1]">{label}</p>
    </div>
  );
}
