"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertTriangleIcon,
  BanknoteIcon,
  BriefcaseBusinessIcon,
  CalendarCheck2Icon,
  CheckIcon,
  LoaderCircleIcon,
  PlusIcon,
  StarIcon,
  UserPlusIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  createHrCandidateAction,
  createHrEmployeeAction,
  createHrLeaveRequestAction,
  createHrPayrollRunAction,
  createHrPerformanceReviewAction,
  createHrVacancyAction,
  reviewHrLeaveRequestAction,
  updateHrEmployeeAction,
  updateHrPayrollItemAction,
  upsertHrAttendanceAction,
} from "@/features/hr/actions";
import {
  ATTENDANCE_STATUS_LABELS,
  CANDIDATE_STAGE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  LEAVE_TYPE_LABELS,
  REVIEW_STATUS_LABELS,
  VACANCY_STATUS_LABELS,
  WORK_MODE_LABELS,
} from "@/features/hr/constants";
import { HrEmployeeProfile } from "@/features/hr/components/hr-employees";
import {
  formatHrDate,
  formatHrMoney,
  getTodayInputValue,
} from "@/features/hr/format";
import type {
  HrEmployeeRecord,
  HrLeaveRequestRecord,
  HrPayrollItemRecord,
  HrWorkspaceData,
} from "@/features/hr/types";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export type HrDialogState =
  | { kind: "attendance"; employee: HrEmployeeRecord }
  | { kind: "candidate"; vacancyId?: string }
  | { kind: "closed" }
  | { kind: "employee"; employee?: HrEmployeeRecord }
  | { kind: "employee-detail"; employeeId: string }
  | { kind: "leave" }
  | {
      decision: "APPROVED" | "REJECTED";
      kind: "leave-review";
      request: HrLeaveRequestRecord;
    }
  | { employeeId?: string; kind: "performance" }
  | { kind: "payroll" }
  | { item: HrPayrollItemRecord; kind: "payroll-item" }
  | { kind: "vacancy" };

const fieldClassName =
  "h-11 rounded-xl border-[#d8e2ee] bg-white text-sm text-[#263c65] placeholder:text-[#9aa7bb] focus-visible:border-[#6ca7ff] focus-visible:ring-[#dceaff]";
const selectClassName =
  "h-11 w-full rounded-xl border border-[#d8e2ee] bg-white px-3 text-sm text-[#263c65] outline-none transition focus:border-[#6ca7ff] focus:ring-2 focus:ring-[#dceaff]";

export function HrDialogs({
  data,
  locale,
  onChange,
  state,
}: {
  data: HrWorkspaceData;
  locale: AppLocale;
  onChange: (state: HrDialogState) => void;
  state: HrDialogState;
}) {
  const detailEmployee =
    state.kind === "employee-detail"
      ? data.employees.find((employee) => employee.id === state.employeeId)
      : undefined;

  return (
    <>
      <EmployeeSheet
        data={data}
        employee={state.kind === "employee" ? state.employee : undefined}
        locale={locale}
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "employee"}
      />
      <Sheet
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "employee-detail"}
      >
        <SheetContent
          className="w-full gap-0 border-[#d8e2ee] bg-white p-0 sm:max-w-[430px]"
          side="right"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Əməkdaş 360°</SheetTitle>
            <SheetDescription>Əməkdaş profili</SheetDescription>
          </SheetHeader>
          {detailEmployee ? (
            <HrEmployeeProfile
              canManage={data.canManage}
              employee={detailEmployee}
              onEdit={() =>
                onChange({ employee: detailEmployee, kind: "employee" })
              }
              onRecordAttendance={() =>
                onChange({ employee: detailEmployee, kind: "attendance" })
              }
            />
          ) : null}
        </SheetContent>
      </Sheet>
      <AttendanceDialog
        employee={state.kind === "attendance" ? state.employee : null}
        locale={locale}
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "attendance"}
      />
      <LeaveDialog
        data={data}
        locale={locale}
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "leave"}
      />
      <LeaveReviewDialog
        decision={state.kind === "leave-review" ? state.decision : "APPROVED"}
        locale={locale}
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "leave-review"}
        request={state.kind === "leave-review" ? state.request : null}
      />
      <VacancyDialog
        data={data}
        locale={locale}
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "vacancy"}
      />
      <CandidateDialog
        data={data}
        locale={locale}
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "candidate"}
        vacancyId={state.kind === "candidate" ? state.vacancyId : undefined}
      />
      <PerformanceDialog
        data={data}
        employeeId={state.kind === "performance" ? state.employeeId : undefined}
        locale={locale}
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "performance"}
      />
      <PayrollDialog
        locale={locale}
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "payroll"}
      />
      <PayrollItemDialog
        item={state.kind === "payroll-item" ? state.item : null}
        key={
          state.kind === "payroll-item" ? state.item.id : "payroll-item-closed"
        }
        locale={locale}
        onOpenChange={(open) => !open && onChange({ kind: "closed" })}
        open={state.kind === "payroll-item"}
      />
    </>
  );
}

function EmployeeSheet({
  data,
  employee,
  locale,
  onOpenChange,
  open,
}: {
  data: HrWorkspaceData;
  employee?: HrEmployeeRecord;
  locale: AppLocale;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const action = employee ? updateHrEmployeeAction : createHrEmployeeAction;

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="w-full gap-0 border-[#d8e2ee] bg-white p-0 sm:max-w-[680px]"
        side="right"
      >
        <SheetHeader className="border-b border-[#e4ebf4] px-6 pb-5 pt-6 pr-14">
          <SheetTitle className="text-2xl font-bold tracking-[-0.02em] text-[#0b1f44]">
            {employee ? "Əməkdaş profilini redaktə et" : "Yeni əməkdaş"}
          </SheetTitle>
          <SheetDescription className="mt-1 text-xs leading-5 text-[#66789a]">
            Şəxsi, iş, əlaqə və kompensasiya məlumatlarını vahid profildə
            saxlayın.
          </SheetDescription>
        </SheetHeader>
        <form
          action={action}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <input name="locale" type="hidden" value={locale} />
          {employee ? (
            <input name="employeeId" type="hidden" value={employee.id} />
          ) : null}
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <FormSection
              icon={UsersRoundIcon}
              title="Şəxsi və əlaqə məlumatları"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ad">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.firstName}
                    name="firstName"
                    required
                  />
                </Field>
                <Field label="Soyad">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.lastName}
                    name="lastName"
                    required
                  />
                </Field>
                <Field label="Korporativ e-poçt">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.email}
                    name="email"
                    required
                    type="email"
                  />
                </Field>
                <Field label="Telefon">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.phone}
                    name="phone"
                    placeholder="+994 50 000 00 00"
                  />
                </Field>
                <Field label="Doğum tarixi">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.birthDate}
                    name="birthDate"
                    type="date"
                  />
                </Field>
                <Field label="Ünvan">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.address}
                    name="address"
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection icon={BriefcaseBusinessIcon} title="İş məlumatları">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Departament">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.department}
                    name="department"
                    required
                  />
                </Field>
                <Field label="Vəzifə">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.position}
                    name="position"
                    required
                  />
                </Field>
                <Field label="Menecer">
                  <select
                    className={selectClassName}
                    defaultValue={employee?.managerId ?? ""}
                    name="managerId"
                  >
                    <option value="">Menecer təyin edilməyib</option>
                    {data.employees
                      .filter(
                        (item) =>
                          item.id !== employee?.id &&
                          item.employmentStatus !== "TERMINATED",
                      )
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.fullName} · {item.position}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="İşə başlama">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.hiredAt ?? getTodayInputValue()}
                    name="hiredAt"
                    required
                    type="date"
                  />
                </Field>
                <Field label="Müqavilə bitmə tarixi">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.contractEndDate}
                    name="contractEndDate"
                    type="date"
                  />
                </Field>
                <Field label="İş yeri / ofis">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.office ?? "Bakı ofisi"}
                    name="office"
                  />
                </Field>
                <Field label="İş tipi">
                  <select
                    className={selectClassName}
                    defaultValue={employee?.employmentType ?? "FULL_TIME"}
                    name="employmentType"
                  >
                    {Object.entries(EMPLOYMENT_TYPE_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </Field>
                <Field label="İş rejimi">
                  <select
                    className={selectClassName}
                    defaultValue={employee?.workMode ?? "ONSITE"}
                    name="workMode"
                  >
                    {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    className={selectClassName}
                    defaultValue={employee?.employmentStatus ?? "ACTIVE"}
                    name="employmentStatus"
                  >
                    {Object.entries(EMPLOYMENT_STATUS_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </Field>
                <Field label="İllik məzuniyyət limiti">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.annualLeaveAllowance ?? 21}
                    min="0"
                    name="annualLeaveAllowance"
                    required
                    type="number"
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection icon={BanknoteIcon} title="Kompensasiya">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Aylıq əsas maaş">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.salary ?? 0}
                    min="0"
                    name="salary"
                    required
                    step="0.01"
                    type="number"
                  />
                </Field>
                <Field label="Valyuta">
                  <select
                    className={selectClassName}
                    defaultValue={employee?.currency ?? "AZN"}
                    name="currency"
                  >
                    <option value="AZN">AZN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </Field>
              </div>
            </FormSection>

            <FormSection icon={AlertTriangleIcon} title="Fövqəladə əlaqə">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Əlaqə şəxsi">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.emergencyContactName}
                    name="emergencyContactName"
                  />
                </Field>
                <Field label="Əlaqə telefonu">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.emergencyContactPhone}
                    name="emergencyContactPhone"
                  />
                </Field>
                <Field label="Yaxınlıq">
                  <Input
                    className={fieldClassName}
                    defaultValue={employee?.emergencyContactRelation}
                    name="emergencyContactRelation"
                    placeholder="Həyat yoldaşı, valideyn..."
                  />
                </Field>
              </div>
            </FormSection>

            <Field label="Daxili qeyd">
              <Textarea
                className="min-h-24 rounded-xl border-[#d8e2ee] text-sm"
                defaultValue={employee?.notes}
                name="notes"
              />
            </Field>
          </div>
          <div className="flex items-center justify-between border-t border-[#e4ebf4] bg-[#fbfcfe] px-6 py-4">
            <Button
              className="h-10 rounded-xl px-4 text-xs"
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Ləğv et
            </Button>
            <SubmitButton
              label={employee ? "Dəyişiklikləri saxla" : "Əməkdaşı yarat"}
            />
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function AttendanceDialog({
  employee,
  locale,
  onOpenChange,
  open,
}: {
  employee: HrEmployeeRecord | null;
  locale: AppLocale;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [status, setStatus] = useState("PRESENT");
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="border-[#d8e2ee] bg-white sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0b1f44]">
            Davamiyyət qeydi
          </DialogTitle>
          <DialogDescription className="text-xs text-[#697a9b]">
            {employee?.fullName} üçün giriş, çıxış və iş statusunu yeniləyin.
          </DialogDescription>
        </DialogHeader>
        <form action={upsertHrAttendanceAction} className="space-y-5">
          <input name="employeeId" type="hidden" value={employee?.id ?? ""} />
          <input name="locale" type="hidden" value={locale} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tarix">
              <Input
                className={fieldClassName}
                defaultValue={getTodayInputValue()}
                name="workDate"
                required
                type="date"
              />
            </Field>
            <Field label="Status">
              <select
                className={selectClassName}
                name="status"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                {Object.entries(ATTENDANCE_STATUS_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Giriş vaxtı">
              <Input
                className={fieldClassName}
                defaultValue={
                  status === "PRESENT" || status === "REMOTE" ? "09:00" : ""
                }
                disabled={["ABSENT", "SICK_LEAVE", "VACATION"].includes(status)}
                name="checkIn"
                type="time"
              />
            </Field>
            <Field label="Çıxış vaxtı">
              <Input
                className={fieldClassName}
                disabled={["ABSENT", "SICK_LEAVE", "VACATION"].includes(status)}
                name="checkOut"
                type="time"
              />
            </Field>
          </div>
          <Field label="Qeyd">
            <Textarea
              className="min-h-20 rounded-xl border-[#d8e2ee]"
              name="note"
              placeholder="Gecikmə, uzaqdan iş və ya icazə səbəbi"
            />
          </Field>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Ləğv et
            </Button>
            <SubmitButton icon={CalendarCheck2Icon} label="Qeydi saxla" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LeaveDialog({
  data,
  locale,
  onOpenChange,
  open,
}: {
  data: HrWorkspaceData;
  locale: AppLocale;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="border-[#d8e2ee] bg-white sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0b1f44]">
            Yeni məzuniyyət sorğusu
          </DialogTitle>
          <DialogDescription className="text-xs text-[#697a9b]">
            Tarix aralığını seçin; iş günlərinin sayı avtomatik hesablanacaq.
          </DialogDescription>
        </DialogHeader>
        <form action={createHrLeaveRequestAction} className="space-y-5">
          <input name="locale" type="hidden" value={locale} />
          <Field label="Əməkdaş">
            <select className={selectClassName} name="employeeId" required>
              <option value="">Əməkdaş seçin</option>
              {data.employees
                .filter(
                  (employee) => employee.employmentStatus !== "TERMINATED",
                )
                .map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} · {employee.department}
                  </option>
                ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Məzuniyyət növü">
              <select
                className={selectClassName}
                defaultValue="ANNUAL"
                name="type"
              >
                {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <div />
            <Field label="Başlanğıc">
              <Input
                className={fieldClassName}
                name="startDate"
                required
                type="date"
              />
            </Field>
            <Field label="Bitmə">
              <Input
                className={fieldClassName}
                name="endDate"
                required
                type="date"
              />
            </Field>
          </div>
          <Field label="Səbəb">
            <Textarea
              className="min-h-24 rounded-xl border-[#d8e2ee]"
              name="reason"
            />
          </Field>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Ləğv et
            </Button>
            <SubmitButton label="Sorğunu yarat" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LeaveReviewDialog({
  decision,
  locale,
  onOpenChange,
  open,
  request,
}: {
  decision: "APPROVED" | "REJECTED";
  locale: AppLocale;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  request: HrLeaveRequestRecord | null;
}) {
  const approve = decision === "APPROVED";
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="border-[#d8e2ee] bg-white sm:max-w-[480px]">
        <DialogHeader>
          <div
            className={cn(
              "mb-2 flex size-10 items-center justify-center rounded-full",
              approve
                ? "bg-[#e9f8f0] text-[#07975f]"
                : "bg-[#fff0f1] text-[#df3f4a]",
            )}
          >
            {approve ? (
              <CheckIcon className="size-5" />
            ) : (
              <XIcon className="size-5" />
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-[#0b1f44]">
            Sorğunu {approve ? "təsdiqlə" : "rədd et"}
          </DialogTitle>
          <DialogDescription className="text-xs leading-5 text-[#697a9b]">
            {request?.employeeName} ·{" "}
            {request
              ? `${formatHrDate(request.startDate)} – ${formatHrDate(request.endDate)}`
              : ""}{" "}
            · {request?.days} iş günü
          </DialogDescription>
        </DialogHeader>
        <form action={reviewHrLeaveRequestAction} className="space-y-5">
          <input name="decision" type="hidden" value={decision} />
          <input name="locale" type="hidden" value={locale} />
          <input name="requestId" type="hidden" value={request?.id ?? ""} />
          <Field label="Qərar qeydi">
            <Textarea
              className="min-h-24 rounded-xl border-[#d8e2ee]"
              name="reviewNote"
              placeholder={
                approve ? "Təsdiq qeydi (istəyə bağlı)" : "Rədd səbəbi"
              }
              required={!approve}
            />
          </Field>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Geri
            </Button>
            <SubmitButton
              destructive={!approve}
              label={approve ? "Təsdiqlə" : "Rədd et"}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VacancyDialog({
  data,
  locale,
  onOpenChange,
  open,
}: {
  data: HrWorkspaceData;
  locale: AppLocale;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90svh] overflow-y-auto border-[#d8e2ee] bg-white sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0b1f44]">
            Yeni vakansiya
          </DialogTitle>
          <DialogDescription className="text-xs text-[#697a9b]">
            Vəzifə, iş rejimi, headcount və işə qəbul menecerini təyin edin.
          </DialogDescription>
        </DialogHeader>
        <form action={createHrVacancyAction} className="space-y-5">
          <input name="locale" type="hidden" value={locale} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vakansiya adı">
              <Input className={fieldClassName} name="title" required />
            </Field>
            <Field label="Departament">
              <Input className={fieldClassName} name="department" required />
            </Field>
            <Field label="Məkan">
              <Input
                className={fieldClassName}
                defaultValue="Bakı"
                name="location"
              />
            </Field>
            <Field label="Headcount">
              <Input
                className={fieldClassName}
                defaultValue="1"
                max="100"
                min="1"
                name="headcount"
                required
                type="number"
              />
            </Field>
            <Field label="İş tipi">
              <select
                className={selectClassName}
                defaultValue="FULL_TIME"
                name="employmentType"
              >
                {Object.entries(EMPLOYMENT_TYPE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field label="İş rejimi">
              <select
                className={selectClassName}
                defaultValue="ONSITE"
                name="workMode"
              >
                {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className={selectClassName}
                defaultValue="OPEN"
                name="status"
              >
                {Object.entries(VACANCY_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bağlanma tarixi">
              <Input
                className={fieldClassName}
                name="closingDate"
                type="date"
              />
            </Field>
          </div>
          <Field label="İşə qəbul meneceri">
            <select className={selectClassName} name="hiringManagerId">
              <option value="">Menecer seçilməyib</option>
              {data.employees
                .filter(
                  (employee) => employee.employmentStatus !== "TERMINATED",
                )
                .map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} · {employee.position}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Təsvir">
            <Textarea
              className="min-h-28 rounded-xl border-[#d8e2ee]"
              name="description"
            />
          </Field>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Ləğv et
            </Button>
            <SubmitButton
              icon={BriefcaseBusinessIcon}
              label="Vakansiyanı yarat"
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CandidateDialog({
  data,
  locale,
  onOpenChange,
  open,
  vacancyId,
}: {
  data: HrWorkspaceData;
  locale: AppLocale;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  vacancyId?: string;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90svh] overflow-y-auto border-[#d8e2ee] bg-white sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0b1f44]">
            Namizəd əlavə et
          </DialogTitle>
          <DialogDescription className="text-xs text-[#697a9b]">
            Namizədi seçilmiş vakansiyanın pipeline-na daxil edin.
          </DialogDescription>
        </DialogHeader>
        <form action={createHrCandidateAction} className="space-y-5">
          <input name="locale" type="hidden" value={locale} />
          <Field label="Vakansiya">
            <select
              className={selectClassName}
              defaultValue={vacancyId ?? ""}
              name="vacancyId"
              required
            >
              <option value="">Vakansiya seçin</option>
              {data.vacancies
                .filter((vacancy) => ["DRAFT", "OPEN"].includes(vacancy.status))
                .map((vacancy) => (
                  <option key={vacancy.id} value={vacancy.id}>
                    {vacancy.title} · {vacancy.department}
                  </option>
                ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ad">
              <Input className={fieldClassName} name="firstName" required />
            </Field>
            <Field label="Soyad">
              <Input className={fieldClassName} name="lastName" required />
            </Field>
            <Field label="E-poçt">
              <Input
                className={fieldClassName}
                name="email"
                required
                type="email"
              />
            </Field>
            <Field label="Telefon">
              <Input className={fieldClassName} name="phone" />
            </Field>
            <Field label="Mənbə">
              <Input
                className={fieldClassName}
                name="source"
                placeholder="LinkedIn, tövsiyə..."
              />
            </Field>
            <Field label="Mərhələ">
              <select
                className={selectClassName}
                defaultValue="APPLIED"
                name="stage"
              >
                {Object.entries(CANDIDATE_STAGE_LABELS).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Reytinq">
              <Input
                className={fieldClassName}
                defaultValue="0"
                max="5"
                min="0"
                name="rating"
                type="number"
              />
            </Field>
            <Field label="Müraciət tarixi">
              <Input
                className={fieldClassName}
                defaultValue={getTodayInputValue()}
                name="appliedAt"
                required
                type="date"
              />
            </Field>
            <Field label="Gözlənilən maaş">
              <Input
                className={fieldClassName}
                min="0"
                name="expectedSalary"
                step="0.01"
                type="number"
              />
            </Field>
            <Field label="Valyuta">
              <select
                className={selectClassName}
                defaultValue="AZN"
                name="currency"
              >
                <option value="AZN">AZN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </Field>
            <Field label="Növbəti müsahibə">
              <Input
                className={fieldClassName}
                name="nextInterviewAt"
                type="datetime-local"
              />
            </Field>
          </div>
          <Field label="Qeyd">
            <Textarea
              className="min-h-24 rounded-xl border-[#d8e2ee]"
              name="notes"
            />
          </Field>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Ləğv et
            </Button>
            <SubmitButton icon={UserPlusIcon} label="Namizədi əlavə et" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PerformanceDialog({
  data,
  employeeId,
  locale,
  onOpenChange,
  open,
}: {
  data: HrWorkspaceData;
  employeeId?: string;
  locale: AppLocale;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90svh] overflow-y-auto border-[#d8e2ee] bg-white sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0b1f44]">
            Performans qiymətləndirməsi
          </DialogTitle>
          <DialogDescription className="text-xs text-[#697a9b]">
            Dövr, bal, geribildirim və növbəti məqsədləri qeyd edin.
          </DialogDescription>
        </DialogHeader>
        <form action={createHrPerformanceReviewAction} className="space-y-5">
          <input name="locale" type="hidden" value={locale} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Əməkdaş">
              <select
                className={selectClassName}
                defaultValue={employeeId ?? ""}
                name="employeeId"
                required
              >
                <option value="">Əməkdaş seçin</option>
                {data.employees
                  .filter(
                    (employee) => employee.employmentStatus !== "TERMINATED",
                  )
                  .map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName} · {employee.position}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Qiymətləndirən">
              <select className={selectClassName} name="reviewerId">
                <option value="">Qiymətləndirən seçin</option>
                {data.employees
                  .filter(
                    (employee) => employee.employmentStatus !== "TERMINATED",
                  )
                  .map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Dövrün başlanğıcı">
              <Input
                className={fieldClassName}
                name="periodStart"
                required
                type="date"
              />
            </Field>
            <Field label="Dövrün sonu">
              <Input
                className={fieldClassName}
                name="periodEnd"
                required
                type="date"
              />
            </Field>
            <Field label="Status">
              <select
                className={selectClassName}
                defaultValue="DRAFT"
                name="status"
              >
                {Object.entries(REVIEW_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bal (0–5)">
              <Input
                className={fieldClassName}
                max="5"
                min="0"
                name="score"
                step="0.1"
                type="number"
              />
            </Field>
          </div>
          <Field label="Güclü tərəflər">
            <Textarea
              className="min-h-20 rounded-xl border-[#d8e2ee]"
              name="strengths"
            />
          </Field>
          <Field label="İnkişaf sahələri">
            <Textarea
              className="min-h-20 rounded-xl border-[#d8e2ee]"
              name="improvements"
            />
          </Field>
          <Field label="Növbəti məqsədlər">
            <Textarea
              className="min-h-20 rounded-xl border-[#d8e2ee]"
              name="goals"
            />
          </Field>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Ləğv et
            </Button>
            <SubmitButton icon={StarIcon} label="Qiymətləndirməni yarat" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PayrollDialog({
  locale,
  onOpenChange,
  open,
}: {
  locale: AppLocale;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const period = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`,
      start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`,
    };
  }, []);
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="border-[#d8e2ee] bg-white sm:max-w-[520px]">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-[#eaf2ff] text-[#0b66ff]">
            <BanknoteIcon className="size-5" />
          </div>
          <DialogTitle className="text-xl font-bold text-[#0b1f44]">
            Yeni payroll dövrü
          </DialogTitle>
          <DialogDescription className="text-xs leading-5 text-[#697a9b]">
            Aktiv əməkdaşların əsas maaşlarından qaralama payroll avtomatik
            yaradılacaq.
          </DialogDescription>
        </DialogHeader>
        <form action={createHrPayrollRunAction} className="space-y-5">
          <input name="locale" type="hidden" value={locale} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Dövrün başlanğıcı">
              <Input
                className={fieldClassName}
                defaultValue={period.start}
                name="periodStart"
                required
                type="date"
              />
            </Field>
            <Field label="Dövrün sonu">
              <Input
                className={fieldClassName}
                defaultValue={period.end}
                name="periodEnd"
                required
                type="date"
              />
            </Field>
            <Field label="Valyuta">
              <select
                className={selectClassName}
                defaultValue="AZN"
                name="currency"
              >
                <option value="AZN">AZN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </Field>
          </div>
          <div className="rounded-xl border border-[#cfe1ff] bg-[#eef5ff] px-4 py-3 text-[10px] leading-5 text-[#3c5f8e]">
            Payroll əvvəlcə qaralama kimi yaradılır. Bonus və tutulmaları
            dəyişdikdən sonra ayrıca təsdiqləyin.
          </div>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Ləğv et
            </Button>
            <SubmitButton label="Payroll yarat" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PayrollItemDialog({
  item,
  locale,
  onOpenChange,
  open,
}: {
  item: HrPayrollItemRecord | null;
  locale: AppLocale;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [bonus, setBonus] = useState(String(item?.bonus ?? 0));
  const [deductions, setDeductions] = useState(String(item?.deductions ?? 0));
  const net =
    (item?.baseSalary ?? 0) + (Number(bonus) || 0) - (Number(deductions) || 0);
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="border-[#d8e2ee] bg-white sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0b1f44]">
            Payroll sətrini dəyiş
          </DialogTitle>
          <DialogDescription className="text-xs text-[#697a9b]">
            {item?.employeeName} · Əsas maaş{" "}
            {item ? formatHrMoney(item.baseSalary, item.currency) : ""}
          </DialogDescription>
        </DialogHeader>
        <form action={updateHrPayrollItemAction} className="space-y-5">
          <input name="itemId" type="hidden" value={item?.id ?? ""} />
          <input name="locale" type="hidden" value={locale} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bonus">
              <Input
                className={fieldClassName}
                min="0"
                name="bonus"
                onChange={(event) => setBonus(event.target.value)}
                step="0.01"
                type="number"
                value={bonus}
              />
            </Field>
            <Field label="Tutulma">
              <Input
                className={fieldClassName}
                min="0"
                name="deductions"
                onChange={(event) => setDeductions(event.target.value)}
                step="0.01"
                type="number"
                value={deductions}
              />
            </Field>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[#dce6f2] bg-[#f8fbff] px-4 py-3">
            <span className="text-xs font-semibold text-[#607397]">
              Hesablanan net maaş
            </span>
            <strong
              className={cn(
                "text-base font-bold",
                net >= 0 ? "text-[#0b66ff]" : "text-[#d33f4b]",
              )}
            >
              {formatHrMoney(net, item?.currency ?? "AZN")}
            </strong>
          </div>
          <Field label="Qeyd">
            <Textarea
              className="min-h-20 rounded-xl border-[#d8e2ee]"
              defaultValue={item?.note}
              name="note"
            />
          </Field>
          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Ləğv et
            </Button>
            <SubmitButton label="Sətri yenilə" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormSection({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: typeof PlusIcon;
  title: string;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 border-b border-[#e7edf5] pb-2">
        <Icon className="size-4 text-[#0b66ff]" />
        <h3 className="text-sm font-bold text-[#20395f]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-2 text-xs font-semibold text-[#4b6085]">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SubmitButton({
  destructive = false,
  icon: Icon = PlusIcon,
  label,
}: {
  destructive?: boolean;
  icon?: typeof PlusIcon;
  label: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      className={cn(
        "h-10 rounded-xl px-4 text-xs font-bold text-white",
        destructive
          ? "bg-[#e23f4b] hover:bg-[#c9343f]"
          : "bg-[#0b66ff] hover:bg-[#0758dc]",
      )}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <LoaderCircleIcon className="size-4 animate-spin" />
      ) : (
        <Icon className="size-4" />
      )}
      {pending ? "Saxlanılır..." : label}
    </Button>
  );
}
