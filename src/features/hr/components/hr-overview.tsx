"use client";

import {
  BriefcaseBusinessIcon,
  CakeSliceIcon,
  CalendarCheck2Icon,
  CheckIcon,
  Clock3Icon,
  FileWarningIcon,
  GiftIcon,
  PalmtreeIcon,
  UsersRoundIcon,
  UserRoundCheckIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ATTENDANCE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
} from "@/features/hr/constants";
import {
  HrDepartmentChart,
  HrTrendChart,
} from "@/features/hr/components/hr-overview-charts";
import { formatHrDate, getHrInitials } from "@/features/hr/format";
import type {
  HrLeaveRequestRecord,
  HrWorkspaceData,
} from "@/features/hr/types";
import { cn } from "@/lib/utils";

export function HrOverview({
  data,
  onOpenEmployee,
  onReviewLeave,
}: {
  data: HrWorkspaceData;
  onOpenEmployee: (employeeId: string) => void;
  onReviewLeave: (
    request: HrLeaveRequestRecord,
    decision: "APPROVED" | "REJECTED",
  ) => void;
}) {
  const latestAttendanceDate = data.attendance[0]?.workDate ?? "";
  const todaysAttendance = data.attendance
    .filter((row) => row.workDate === latestAttendanceDate)
    .slice(0, 5);
  const pendingLeave = data.leaveRequests
    .filter((request) => request.status === "PENDING")
    .slice(0, 5);

  const metrics = [
    {
      icon: UsersRoundIcon,
      label: "Ümumi əməkdaş",
      tone: "blue",
      value: data.metrics.totalEmployees,
    },
    {
      icon: UserRoundCheckIcon,
      label: "Aktiv",
      tone: "green",
      value: data.metrics.activeEmployees,
    },
    {
      icon: CalendarCheck2Icon,
      label: "Bu gün işdə",
      tone: "green",
      value: data.metrics.employeesAtWorkToday,
    },
    {
      icon: PalmtreeIcon,
      label: "Məzuniyyətdə",
      tone: "orange",
      value: data.metrics.employeesOnLeave,
    },
    {
      icon: BriefcaseBusinessIcon,
      label: "Açıq vakansiya",
      tone: "blue",
      value: data.metrics.openVacancies,
    },
  ] as const;

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 overflow-hidden rounded-[20px] border border-[#dce5f0] bg-white shadow-[0_10px_30px_rgba(29,53,87,0.035)] xl:grid-cols-5">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              className={cn(
                "flex min-h-24 items-center gap-3 px-3 py-4 sm:gap-4 sm:px-5",
                index % 2 === 1 && "border-l border-[#e3eaf3]",
                index > 1 && "border-t border-[#e3eaf3]",
                index > 0 && "xl:border-l xl:border-t-0",
                index === metrics.length - 1 &&
                  "col-span-2 border-l-0 xl:col-span-1 xl:border-l",
              )}
              key={metric.label}
            >
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-full",
                  metric.tone === "blue" && "bg-[#eaf2ff] text-[#0b66ff]",
                  metric.tone === "green" && "bg-[#e9f8f0] text-[#12a76d]",
                  metric.tone === "orange" && "bg-[#fff2df] text-[#f79009]",
                )}
              >
                <Icon className="size-6" strokeWidth={1.8} />
              </span>
              <span>
                <span className="block text-xs font-medium text-[#627497]">
                  {metric.label}
                </span>
                <strong className="mt-1 block text-2xl font-bold tracking-[-0.03em] text-[#10234a]">
                  {metric.value}
                </strong>
              </span>
            </div>
          );
        })}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.85fr)]">
        <Panel title="Əməkdaş sayı və dəyişiklik trendi">
          <div className="mb-2 flex flex-wrap gap-4 px-1 text-[11px] font-medium text-[#65769a]">
            <Legend color="#0b66ff" label="Əməkdaş sayı" />
            <Legend color="#17b26a" dashed label="Qoşulanlar" />
            <Legend color="#f04438" dashed label="Ayrılanlar" />
          </div>
          <div className="h-[270px] w-full">
            <HrTrendChart data={data.trend} />
          </div>
        </Panel>

        <Panel title="Departamentlər üzrə bölgü">
          <div className="grid min-h-[292px] items-center gap-4 sm:grid-cols-[190px_1fr] xl:grid-cols-[170px_1fr]">
            <div className="relative mx-auto size-[180px] xl:size-[165px]">
              <HrDepartmentChart data={data.departments} />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <strong className="text-2xl font-bold text-[#10234a]">
                  {data.metrics.totalEmployees}
                </strong>
                <span className="text-[11px] text-[#73819b]">Ümumi</span>
              </div>
            </div>
            <div className="divide-y divide-[#e7edf5]">
              {data.departments.map((department) => (
                <div
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2 text-xs"
                  key={department.name}
                >
                  <span className="flex min-w-0 items-center gap-2 font-medium text-[#2d4168]">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: department.color }}
                    />
                    <span className="truncate">{department.name}</span>
                  </span>
                  <strong className="text-[#1a315b]">{department.count}</strong>
                  <span className="w-9 text-right text-[#7282a2]">
                    {department.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.05fr_1fr]">
        <Panel action="Hamısına bax" title="Bu gün davamiyyət">
          <div className="divide-y divide-[#e8eef6]">
            {todaysAttendance.length ? (
              todaysAttendance.map((row) => (
                <button
                  className="grid w-full grid-cols-[minmax(0,1fr)_54px_auto] items-center gap-2 py-2.5 text-left transition hover:bg-[#f8fbff]"
                  key={row.id}
                  onClick={() => onOpenEmployee(row.employeeId)}
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <AvatarLabel name={row.employeeName} />
                    <span className="truncate text-xs font-semibold text-[#2a4068]">
                      {row.employeeName}
                    </span>
                  </span>
                  <span className="text-xs text-[#30486f]">
                    {row.checkIn || "—"}
                  </span>
                  <StatusBadge status={row.status} />
                </button>
              ))
            ) : (
              <EmptyLine label="Bu gün üçün davamiyyət qeydi yoxdur." />
            )}
          </div>
        </Panel>

        <Panel action="Hamısına bax" title="Təsdiq gözləyənlər">
          <div className="divide-y divide-[#e8eef6]">
            {pendingLeave.length ? (
              pendingLeave.map((request) => (
                <div
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5"
                  key={request.id}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <AvatarLabel name={request.employeeName} />
                      <strong className="truncate text-xs font-semibold text-[#2a4068]">
                        {request.employeeName}
                      </strong>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-9 text-[10px] text-[#7483a0]">
                      <span>
                        {formatHrDate(request.startDate, "dd MMM")} –{" "}
                        {formatHrDate(request.endDate, "dd MMM")}
                      </span>
                      <span>{LEAVE_TYPE_LABELS[request.type]}</span>
                    </div>
                  </div>
                  {data.canApproveLeave ? (
                    <div className="flex gap-1.5">
                      <Button
                        aria-label="Təsdiqlə"
                        className="size-8 rounded-full border-[#9fdec4] bg-white text-[#07975f] hover:bg-[#edfbf4]"
                        onClick={() => onReviewLeave(request, "APPROVED")}
                        size="icon"
                        variant="outline"
                      >
                        <CheckIcon className="size-3.5" />
                      </Button>
                      <Button
                        aria-label="Rədd et"
                        className="size-8 rounded-full border-[#ffc3c7] bg-white text-[#e33d49] hover:bg-[#fff2f3]"
                        onClick={() => onReviewLeave(request, "REJECTED")}
                        size="icon"
                        variant="outline"
                      >
                        <XIcon className="size-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <EmptyLine label="Gözləyən məzuniyyət sorğusu yoxdur." />
            )}
          </div>
        </Panel>

        <Panel action="Hamısına bax" title="Yaxın tarixlər">
          <div className="divide-y divide-[#e8eef6]">
            {data.upcomingEvents.slice(0, 6).map((event) => {
              const Icon =
                event.type === "BIRTHDAY"
                  ? CakeSliceIcon
                  : event.type === "ANNIVERSARY"
                    ? GiftIcon
                    : FileWarningIcon;
              return (
                <button
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-3 py-2.5 text-left transition hover:bg-[#f8fbff]"
                  key={event.id}
                  onClick={() => onOpenEmployee(event.employeeId)}
                  type="button"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] text-[#4269a4]">
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-xs font-semibold text-[#2a4068]">
                        {event.employeeName}
                      </strong>
                      <span className="block truncate text-[10px] text-[#7483a0]">
                        {event.detail}
                      </span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      event.type === "CONTRACT_END"
                        ? "text-[#e33d49]"
                        : "text-[#557098]",
                    )}
                  >
                    {formatHrDate(event.date, "dd MMM")}
                  </span>
                </button>
              );
            })}
            {!data.upcomingEvents.length ? (
              <EmptyLine label="Yaxın tarix yoxdur." />
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  action,
  children,
  title,
}: {
  action?: string;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-[20px] border border-[#dce5f0] bg-white p-4 shadow-[0_10px_30px_rgba(29,53,87,0.035)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-[-0.015em] text-[#10234a]">
          {title}
        </h2>
        {action ? (
          <span className="text-[11px] font-semibold text-[#0b66ff]">
            {action}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Legend({
  color,
  dashed = false,
  label,
}: {
  color: string;
  dashed?: boolean;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn("block w-6 border-t-2", dashed && "border-dashed")}
        style={{ borderColor: color }}
      />
      {label}
    </span>
  );
}

function AvatarLabel({ name }: { name: string }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-[9px] font-bold text-[#3567b5]">
      {getHrInitials(name)}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: keyof typeof ATTENDANCE_STATUS_LABELS;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[9px] font-semibold",
        status === "PRESENT" && "bg-[#e9f8f0] text-[#07885a]",
        status === "LATE" && "bg-[#fff2df] text-[#d97a00]",
        status === "REMOTE" && "bg-[#eaf2ff] text-[#0b66ff]",
        ["ABSENT", "SICK_LEAVE", "VACATION"].includes(status) &&
          "bg-[#fff1f2] text-[#d33e49]",
      )}
    >
      {ATTENDANCE_STATUS_LABELS[status]}
    </span>
  );
}

function EmptyLine({ label }: { label: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center text-xs text-[#7b89a5]">
      <Clock3Icon className="size-5 text-[#9aa9c0]" />
      {label}
    </div>
  );
}
