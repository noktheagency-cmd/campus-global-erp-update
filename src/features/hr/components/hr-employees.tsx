"use client";

import { useState } from "react";
import {
  BriefcaseBusinessIcon,
  Building2Icon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock3Icon,
  MailIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  RefreshCcwIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  UsersRoundIcon,
  WalletCardsIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  EMPLOYMENT_STATUS_LABELS,
  WORK_MODE_LABELS,
} from "@/features/hr/constants";
import {
  formatHrDate,
  formatHrMoney,
  getHrInitials,
} from "@/features/hr/format";
import type {
  HrEmployeeRecord,
  HrEmploymentStatus,
  HrWorkspaceData,
} from "@/features/hr/types";
import { cn } from "@/lib/utils";

const selectClassName =
  "h-11 rounded-xl border border-[#d8e2ee] bg-white px-3 text-xs font-medium text-[#31476f] outline-none transition focus:border-[#6ca7ff] focus:ring-2 focus:ring-[#dceaff]";

export function HrEmployees({
  data,
  initialEmployeeId,
  onCreate,
  onEdit,
  onFilter,
  onRecordAttendance,
  onPageChange,
}: {
  data: HrWorkspaceData;
  initialEmployeeId: string;
  onCreate: () => void;
  onEdit: (employee: HrEmployeeRecord) => void;
  onFilter: (filters: HrWorkspaceData["employeeFilters"]) => void;
  onPageChange: (page: number) => void;
  onRecordAttendance: (employee: HrEmployeeRecord) => void;
}) {
  const [search, setSearch] = useState(data.employeeFilters.search);
  const [department, setDepartment] = useState(data.employeeFilters.department);
  const [status, setStatus] = useState(data.employeeFilters.status);
  const [workMode, setWorkMode] = useState(data.employeeFilters.workMode);
  const [selectedId, setSelectedId] = useState(
    data.employees.some((employee) => employee.id === initialEmployeeId)
      ? initialEmployeeId
      : (data.employees[0]?.id ?? ""),
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const filtered = data.employees;
  const selected =
    data.employees.find((employee) => employee.id === selectedId) ??
    filtered[0] ??
    null;

  function selectEmployee(employee: HrEmployeeRecord) {
    setSelectedId(employee.id);
    if (window.matchMedia("(max-width: 1279px)").matches) {
      setMobileOpen(true);
    }
  }

  function resetFilters() {
    setSearch("");
    setDepartment("ALL");
    setStatus("ALL");
    setWorkMode("ALL");
    onFilter({ department: "ALL", search: "", status: "ALL", workMode: "ALL" });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="min-w-0 overflow-hidden rounded-[20px] border border-[#dce5f0] bg-white shadow-[0_10px_30px_rgba(29,53,87,0.035)]">
        <form
          className="grid gap-3 border-b border-[#e1e8f1] p-4 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.4fr)_minmax(140px,.7fr)_minmax(140px,.7fr)_minmax(140px,.7fr)_auto_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            onFilter({ department, search, status, workMode });
          }}
        >
          <label className="relative md:col-span-2 xl:col-span-1">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8494ad]" />
            <Input
              aria-label="Əməkdaş axtarışı"
              className="h-11 rounded-xl border-[#d8e2ee] bg-white pl-9 text-xs text-[#2c426a] placeholder:text-[#9aa8bc]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ad, vəzifə və ya e-poçt axtar"
              value={search}
            />
          </label>
          <select
            aria-label="Departament filtri"
            className={selectClassName}
            onChange={(event) => setDepartment(event.target.value)}
            value={department}
          >
            <option value="ALL">Bütün departamentlər</option>
            {data.employeeDepartments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            aria-label="Əməkdaş statusu filtri"
            className={selectClassName}
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="ALL">Bütün statuslar</option>
            {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="İş rejimi filtri"
            className={selectClassName}
            onChange={(event) => setWorkMode(event.target.value)}
            value={workMode}
          >
            <option value="ALL">Bütün iş rejimləri</option>
            {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button
            className="h-11 rounded-xl bg-[#0b66ff] px-3 text-xs font-bold text-white hover:bg-[#0758dc]"
            type="submit"
          >
            <SearchIcon className="size-3.5" />
            Tətbiq et
          </Button>
          <Button
            className="h-11 rounded-xl border-[#d8e2ee] bg-white px-3 text-xs font-semibold text-[#587096] hover:bg-[#f7faff]"
            onClick={resetFilters}
            type="button"
            variant="outline"
          >
            <RefreshCcwIcon className="size-3.5" />
            Sıfırla
          </Button>
        </form>

        <div className="flex items-center justify-between border-b border-[#e7edf5] px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-[#152a52]">
              Əməkdaş reyestri
            </h2>
            <p className="mt-0.5 text-[10px] text-[#7585a1]">
              Bu səhifədə {filtered.length} nəticə · ümumi{" "}
              {data.employeePage.total}
            </p>
          </div>
          {data.canManage ? (
            <Button
              className="h-9 rounded-xl bg-[#0b66ff] px-3 text-[11px] font-bold text-white hover:bg-[#0758dc]"
              onClick={onCreate}
            >
              <PlusIcon className="size-3.5" />
              Əlavə et
            </Button>
          ) : null}
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[930px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e5ecf4] bg-[#fbfcfe] text-[9px] uppercase tracking-[0.08em] text-[#7786a0]">
                <th className="px-4 py-3 font-semibold">Əməkdaş</th>
                <th className="px-3 py-3 font-semibold">ID</th>
                <th className="px-3 py-3 font-semibold">Departament</th>
                <th className="px-3 py-3 font-semibold">Vəzifə</th>
                <th className="px-3 py-3 font-semibold">İş rejimi</th>
                <th className="px-3 py-3 font-semibold">İşə başlama</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="w-10 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eef5]">
              {filtered.map((employee) => (
                <tr
                  className={cn(
                    "group cursor-pointer transition hover:bg-[#f8fbff]",
                    selected?.id === employee.id &&
                      "bg-[#f2f7ff] shadow-[inset_3px_0_0_#0b66ff]",
                  )}
                  key={employee.id}
                  onClick={() => selectEmployee(employee)}
                >
                  <td className="px-4 py-3">
                    <div className="flex min-w-[190px] items-center gap-3">
                      <EmployeeAvatar name={employee.fullName} />
                      <span className="min-w-0">
                        <strong className="block truncate text-xs font-semibold text-[#253c66]">
                          {employee.fullName}
                        </strong>
                        <span className="mt-0.5 block truncate text-[9px] text-[#7c8ba5]">
                          {employee.email}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[10px] font-semibold text-[#50698f]">
                    {employee.employeeCode}
                  </td>
                  <td className="px-3 py-3 text-[10px] text-[#40587f]">
                    {employee.department}
                  </td>
                  <td className="max-w-[150px] px-3 py-3 text-[10px] text-[#40587f]">
                    <span className="line-clamp-2">{employee.position}</span>
                  </td>
                  <td className="px-3 py-3 text-[10px] text-[#40587f]">
                    {WORK_MODE_LABELS[employee.workMode]}
                  </td>
                  <td className="px-3 py-3 text-[10px] text-[#40587f]">
                    {formatHrDate(employee.hiredAt)}
                  </td>
                  <td className="px-3 py-3">
                    <EmployeeStatus status={employee.employmentStatus} />
                  </td>
                  <td className="px-2 py-3">
                    <ChevronRightIcon className="size-4 text-[#94a2b7] transition group-hover:translate-x-0.5 group-hover:text-[#0b66ff]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[#e8eef5] lg:hidden">
          {filtered.map((employee) => (
            <button
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#f8fbff]"
              key={employee.id}
              onClick={() => selectEmployee(employee)}
              type="button"
            >
              <EmployeeAvatar name={employee.fullName} />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs font-semibold text-[#253c66]">
                  {employee.fullName}
                </strong>
                <span className="mt-0.5 block truncate text-[10px] text-[#7483a0]">
                  {employee.position} · {employee.department}
                </span>
              </span>
              <EmployeeStatus status={employee.employmentStatus} />
              <ChevronRightIcon className="size-4 text-[#93a1b8]" />
            </button>
          ))}
        </div>

        {!filtered.length ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#edf3ff] text-[#4d72aa]">
              <UsersRoundIcon className="size-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#243b64]">
                Nəticə tapılmadı
              </h3>
              <p className="mt-1 text-xs text-[#7b8aa5]">
                Filtrləri dəyişin və ya yeni əməkdaş yaradın.
              </p>
            </div>
          </div>
        ) : null}

        {data.employeePage.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-[#e7edf5] px-4 py-3">
            <span className="text-[10px] font-medium text-[#7585a1]">
              Səhifə {data.employeePage.page} / {data.employeePage.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                className="h-8 rounded-lg border-[#d8e2ee] px-2.5 text-[10px]"
                disabled={data.employeePage.page <= 1}
                onClick={() => onPageChange(data.employeePage.page - 1)}
                variant="outline"
              >
                <ChevronLeftIcon className="size-3.5" />
                Əvvəlki
              </Button>
              <Button
                className="h-8 rounded-lg border-[#d8e2ee] px-2.5 text-[10px]"
                disabled={
                  data.employeePage.page >= data.employeePage.totalPages
                }
                onClick={() => onPageChange(data.employeePage.page + 1)}
                variant="outline"
              >
                Növbəti
                <ChevronRightIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <aside className="hidden overflow-hidden rounded-[20px] border border-[#dce5f0] bg-white shadow-[0_10px_30px_rgba(29,53,87,0.035)] xl:block">
        {selected ? (
          <HrEmployeeProfile
            canManage={data.canManage}
            employee={selected}
            onEdit={() => onEdit(selected)}
            onRecordAttendance={() => onRecordAttendance(selected)}
          />
        ) : null}
      </aside>

      <Sheet onOpenChange={setMobileOpen} open={mobileOpen}>
        <SheetContent
          className="w-full gap-0 border-[#d8e2ee] bg-white p-0 sm:max-w-md xl:hidden"
          side="right"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Əməkdaş 360°</SheetTitle>
          </SheetHeader>
          {selected ? (
            <HrEmployeeProfile
              canManage={data.canManage}
              employee={selected}
              onEdit={() => onEdit(selected)}
              onRecordAttendance={() => onRecordAttendance(selected)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function HrEmployeeProfile({
  canManage,
  employee,
  onEdit,
  onRecordAttendance,
}: {
  canManage: boolean;
  employee: HrEmployeeRecord;
  onEdit: () => void;
  onRecordAttendance: () => void;
}) {
  const completeness = [
    {
      complete: Boolean(employee.email && employee.phone),
      label: "Əlaqə məlumatları",
    },
    {
      complete: Boolean(
        employee.emergencyContactName && employee.emergencyContactPhone,
      ),
      label: "Fövqəladə əlaqə",
    },
    { complete: Boolean(employee.address), label: "Yaşayış ünvanı" },
    { complete: Boolean(employee.managerName), label: "Menecer təyinatı" },
    {
      complete: employee.salary !== null && employee.salary > 0,
      label: "Kompensasiya məlumatı",
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-[#e2e9f2] px-5 py-4">
        <h2 className="text-base font-bold text-[#10234a]">Əməkdaş 360°</h2>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <div className="flex items-center gap-3">
          <EmployeeAvatar
            className="size-14 text-sm"
            name={employee.fullName}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold text-[#18305a]">
                {employee.fullName}
              </h3>
              <EmployeeStatus status={employee.employmentStatus} />
            </div>
            <p className="mt-1 truncate text-xs text-[#65779a]">
              {employee.position}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-[#8a97ad]">
              {employee.employeeCode}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {canManage ? (
            <Button
              className="h-9 rounded-xl border-[#d9e3ef] bg-white px-2 text-[10px] font-semibold text-[#37527d] hover:bg-[#f6f9ff]"
              onClick={onEdit}
              variant="outline"
            >
              <PencilIcon className="size-3.5" />
              Redaktə
            </Button>
          ) : null}
          <Button
            asChild
            className="h-9 rounded-xl border-[#d9e3ef] bg-white px-2 text-[10px] font-semibold text-[#37527d] hover:bg-[#f6f9ff]"
            variant="outline"
          >
            <a href={`mailto:${employee.email}`}>
              <MailIcon className="size-3.5" />
              E-poçt
            </a>
          </Button>
          <Button
            className="h-9 rounded-xl border-[#d9e3ef] bg-white px-2 text-[10px] font-semibold text-[#37527d] hover:bg-[#f6f9ff]"
            onClick={onRecordAttendance}
            variant="outline"
          >
            <CalendarDaysIcon className="size-3.5" />
            Davamiyyət
          </Button>
        </div>

        <ProfileSection title="Əsas məlumatlar">
          <ProfileFact icon={MailIcon} label="E-poçt" value={employee.email} />
          <ProfileFact
            icon={PhoneIcon}
            label="Telefon"
            value={employee.phone || "—"}
          />
          <ProfileFact
            icon={Building2Icon}
            label="Departament"
            value={employee.department}
          />
          <ProfileFact
            icon={BriefcaseBusinessIcon}
            label="İş rejimi"
            value={WORK_MODE_LABELS[employee.workMode]}
          />
          <ProfileFact
            icon={CalendarDaysIcon}
            label="İşə başlama"
            value={formatHrDate(employee.hiredAt)}
          />
          <ProfileFact
            icon={UserRoundIcon}
            label="Menecer"
            value={employee.managerName || "Təyin edilməyib"}
          />
          <ProfileFact
            icon={MapPinIcon}
            label="İş yeri"
            value={employee.office || "—"}
          />
        </ProfileSection>

        {employee.salary !== null ? (
          <ProfileSection title="Kompensasiya">
            <div className="rounded-xl border border-[#dce6f2] bg-[#f8fbff] p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[10px] font-semibold text-[#65769a]">
                  <WalletCardsIcon className="size-3.5 text-[#0b66ff]" />
                  Əsas aylıq maaş
                </span>
                <strong className="text-sm font-bold text-[#16315f]">
                  {formatHrMoney(employee.salary, employee.currency)}
                </strong>
              </div>
            </div>
          </ProfileSection>
        ) : null}

        <ProfileSection title="Məzuniyyət balansı">
          <div className="grid grid-cols-3 gap-2">
            <MiniMetric
              label="İllik limit"
              value={`${employee.annualLeaveAllowance} gün`}
            />
            <MiniMetric
              label="İstifadə"
              value={`${employee.usedLeaveDays} gün`}
            />
            <MiniMetric
              label="Qalıq"
              tone="blue"
              value={`${employee.remainingLeaveDays} gün`}
            />
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7eef8]">
            <span
              className="block h-full rounded-full bg-[#0b66ff]"
              style={{
                width: `${Math.min(100, (employee.usedLeaveDays / Math.max(1, employee.annualLeaveAllowance)) * 100)}%`,
              }}
            />
          </div>
        </ProfileSection>

        <ProfileSection title="Cari ay davamiyyəti">
          <div className="grid grid-cols-5 gap-1.5">
            <MiniMetric
              label="İş günü"
              value={employee.attendanceSummary.workDays}
            />
            <MiniMetric
              label="İştirak"
              value={employee.attendanceSummary.present}
            />
            <MiniMetric
              label="Gecikmə"
              value={employee.attendanceSummary.late}
            />
            <MiniMetric
              label="Uzaqdan"
              value={employee.attendanceSummary.remote}
            />
            <MiniMetric
              label="Yoxluq"
              value={employee.attendanceSummary.absent}
            />
          </div>
        </ProfileSection>

        <ProfileSection title="Fövqəladə əlaqə">
          <ProfileFact
            icon={UserRoundIcon}
            label="Ad"
            value={employee.emergencyContactName || "Məlumat yoxdur"}
          />
          <ProfileFact
            icon={PhoneIcon}
            label="Əlaqə"
            value={employee.emergencyContactPhone || "—"}
          />
          <ProfileFact
            icon={ShieldCheckIcon}
            label="Yaxınlıq"
            value={employee.emergencyContactRelation || "—"}
          />
        </ProfileSection>

        <ProfileSection title="Profil tamlığı">
          <div className="divide-y divide-[#e6edf5] rounded-xl border border-[#dce5f0]">
            {completeness.map((item) => (
              <div
                className="flex items-center justify-between gap-3 px-3 py-2"
                key={item.label}
              >
                <span className="text-[10px] font-medium text-[#50678e]">
                  {item.label}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 text-[9px] font-semibold",
                    item.complete ? "text-[#0a9a65]" : "text-[#d98400]",
                  )}
                >
                  {item.complete ? (
                    <CheckCircle2Icon className="size-3.5" />
                  ) : (
                    <Clock3Icon className="size-3.5" />
                  )}
                  {item.complete ? "Tamamdır" : "Gözləyir"}
                </span>
              </div>
            ))}
          </div>
        </ProfileSection>
      </div>
    </div>
  );
}

function ProfileSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-bold text-[#1f3964]">{title}</h4>
      {children}
    </section>
  );
}

function ProfileFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MailIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[16px_88px_1fr] items-start gap-2 py-1.5 text-[10px]">
      <Icon className="mt-0.5 size-3.5 text-[#8594ac]" />
      <span className="text-[#7a89a4]">{label}</span>
      <span className="min-w-0 break-words font-medium text-[#365079]">
        {value}
      </span>
    </div>
  );
}

function MiniMetric({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: "blue";
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#e0e8f2] bg-[#fbfcfe] px-2 py-2 text-center">
      <strong
        className={cn(
          "block text-xs font-bold text-[#29466f]",
          tone === "blue" && "text-[#0b66ff]",
        )}
      >
        {value}
      </strong>
      <span className="mt-0.5 block truncate text-[8px] text-[#8190aa]">
        {label}
      </span>
    </div>
  );
}

function EmployeeAvatar({
  className,
  name,
}: {
  className?: string;
  name: string;
}) {
  const tones = [
    "bg-[#eaf2ff] text-[#3567b5]",
    "bg-[#eef8f2] text-[#16845c]",
    "bg-[#f4efff] text-[#7652bc]",
    "bg-[#fff3e5] text-[#c66d00]",
  ];
  const tone = tones[name.charCodeAt(0) % tones.length];
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
        tone,
        className,
      )}
    >
      {getHrInitials(name)}
    </span>
  );
}

function EmployeeStatus({ status }: { status: HrEmploymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-28 items-center truncate rounded-full px-2.5 py-1 text-[9px] font-semibold",
        ["ACTIVE", "PROBATION"].includes(status) &&
          "bg-[#eaf8f1] text-[#07885a]",
        status === "ON_LEAVE" && "bg-[#fff3df] text-[#d97a00]",
        ["INACTIVE", "TERMINATED"].includes(status) &&
          "bg-[#fff0f1] text-[#d33f4b]",
      )}
    >
      {EMPLOYMENT_STATUS_LABELS[status]}
    </span>
  );
}
