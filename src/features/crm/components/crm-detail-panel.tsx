"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BanknoteIcon,
  BriefcaseBusinessIcon,
  CalendarClockIcon,
  CheckIcon,
  CircleIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  Globe2Icon,
  GraduationCapIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  NotebookPenIcon,
  PhoneIcon,
  PlusIcon,
  TrendingUpIcon,
  UserRoundCogIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateCrmProfileAction } from "@/features/crm/actions";
import {
  AGENT_STAGES,
  CRM_INTERACTION_LABELS,
  CRM_SOURCE_LABELS,
  CRM_STAGE_LABELS,
  CRM_STATUS_LABELS,
  INDIVIDUAL_STAGES,
} from "@/features/crm/constants";
import { formatCrmDateTime } from "@/features/crm/formatters";
import {
  CrmInteractionDialog,
  CrmTaskDialog,
} from "@/features/crm/components/crm-dialogs";
import type {
  CrmInteractionTypeCode,
  CrmRecord,
  CrmSourceCode,
  CrmStageCode,
  CrmStatusCode,
  CrmTeamMember,
} from "@/features/crm/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type DetailTab =
  | "overview"
  | "activity"
  | "applications"
  | "documents"
  | "contacts"
  | "students"
  | "finance";

export function CrmDetailPanel({
  canManage,
  onClose,
  record,
  teamMembers,
}: {
  canManage: boolean;
  onClose: () => void;
  record: CrmRecord | null;
  teamMembers: CrmTeamMember[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [taskOpen, setTaskOpen] = useState(false);
  const [interactionOpen, setInteractionOpen] = useState(false);
  const [interactionType, setInteractionType] =
    useState<CrmInteractionTypeCode>("NOTE");
  const [isUpdating, startUpdate] = useTransition();
  const [localStage, setLocalStage] = useState<CrmStageCode>(
    record?.stage ?? "NEW_LEAD",
  );
  const [localStatus, setLocalStatus] = useState<CrmStatusCode>(
    record?.status ?? "ACTIVE",
  );
  const [localSource, setLocalSource] = useState<CrmSourceCode>(
    record?.source ?? "MANUAL",
  );
  const [localOwnerId, setLocalOwnerId] = useState(
    record?.owner?.id ?? "unassigned",
  );

  if (!record) {
    return (
      <aside className="hidden min-h-[620px] items-center justify-center rounded-[1.25rem] border border-dashed border-[#cfdbea] bg-white/70 p-6 text-center 2xl:flex">
        <div>
          <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-[#eff5ff] text-[#0b66ff]">
            <UserRoundCogIcon className="size-5" />
          </span>
          <p className="mt-3 text-xs font-bold text-[#637392]">
            360° məlumat üçün reyestrdən qeyd seçin.
          </p>
        </div>
      </aside>
    );
  }

  const tabs =
    record.kind === "agent"
      ? ([
          ["overview", "Ümumi"],
          ["contacts", "Əlaqələr"],
          ["students", "Tələbələr"],
          ["applications", "Müraciətlər"],
          ["finance", "Maliyyə"],
          ["activity", "Fəaliyyət"],
        ] as Array<[DetailTab, string]>)
      : ([
          ["overview", "Ümumi"],
          ["activity", "Fəaliyyət"],
          ["applications", "Müraciətlər"],
          ["documents", "Sənədlər"],
        ] as Array<[DetailTab, string]>);

  function openInteraction(type: CrmInteractionTypeCode) {
    setInteractionType(type);
    setInteractionOpen(true);
  }

  function updateProfile(
    patch: Partial<{
      ownerId: string | null;
      source: CrmSourceCode;
      stage: CrmStageCode;
      status: CrmStatusCode;
    }>,
  ) {
    if (!canManage || !record) return;
    const subject = { kind: record.kind, subjectId: record.id } as const;

    startUpdate(async () => {
      const result = await updateCrmProfileAction({
        ...subject,
        ...patch,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <aside className="min-w-0 overflow-hidden rounded-[1.25rem] border border-[#dce6f4] bg-white shadow-[0_12px_36px_rgba(29,78,216,0.05)]">
      <div className="flex items-center justify-between border-b border-[#e5edf8] px-4 py-3.5">
        <h2 className="text-sm font-black text-[#14264b]">
          {record.kind === "agent" ? "Agent 360°" : "Fərdi müştəri 360°"}
        </h2>
        <Button
          aria-label="Detal panelini bağla"
          className="size-8 rounded-xl text-[#637392] hover:bg-[#f1f6ff] hover:text-[#0b66ff]"
          onClick={onClose}
          size="icon"
          type="button"
          variant="ghost"
        >
          <XIcon className="size-4" />
        </Button>
      </div>

      <div className="border-b border-[#e5edf8] p-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-12 border border-[#dce6f4] bg-[#eff5ff]">
            <AvatarImage alt={record.name} src={record.avatarUrl} />
            <AvatarFallback className="bg-[#eff5ff] text-sm font-black text-[#0b66ff]">
              {record.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-[#14264b]">{record.name}</div>
                <div className="mt-0.5 truncate text-[10px] font-semibold text-[#71809f]">
                  {record.companyName || record.preferredDestination}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-[#4c5f83]">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      record.status === "ACTIVE"
                        ? "bg-emerald-500"
                        : record.status === "FOLLOW_UP"
                          ? "bg-amber-500"
                          : "bg-slate-400",
                    )}
                  />
                  {CRM_STATUS_LABELS[record.status]}
                </div>
                {record.tier ? (
                  <span className="mt-1 inline-flex rounded-md bg-violet-50 px-1.5 py-0.5 text-[8px] font-black text-violet-700">
                    {record.tier}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button
            asChild
            className="h-9 rounded-xl border-[#dce6f4] bg-white px-2 text-[10px] font-black text-[#0b66ff] hover:bg-[#f1f6ff]"
            variant="outline"
          >
            <a href={`tel:${normalizePhone(record.phone)}`}>
              <PhoneIcon data-icon="inline-start" />
              Zəng et
            </a>
          </Button>
          <Button
            asChild
            className="h-9 rounded-xl border-[#dce6f4] bg-white px-2 text-[10px] font-black text-[#0b66ff] hover:bg-[#f1f6ff]"
            variant="outline"
          >
            <a href={`mailto:${record.email}`}>
              <MessageSquareTextIcon data-icon="inline-start" />
              Mesaj
            </a>
          </Button>
          <Button
            className="h-9 rounded-xl border-[#dce6f4] bg-white px-2 text-[10px] font-black text-[#0b66ff] hover:bg-[#f1f6ff]"
            disabled={!canManage}
            onClick={() => setTaskOpen(true)}
            type="button"
            variant="outline"
          >
            <ClipboardCheckIcon data-icon="inline-start" />
            Tapşırıq
          </Button>
        </div>

        <div className="mt-4 grid gap-2.5 border-t border-[#edf2f9] pt-3">
          <InfoRow icon={PhoneIcon} label="Telefon" value={record.phone} />
          <InfoRow icon={MailIcon} label="E-poçt" value={record.email} />
          <InfoRow icon={Globe2Icon} label="Ölkə" value={record.country} />
          <InfoRow
            icon={UserRoundCogIcon}
            label="Məsul şəxs"
            value={record.owner?.name ?? "Təyin edilməyib"}
          />
          <InfoRow
            icon={CalendarClockIcon}
            label="Son əlaqə"
            value={formatCrmDateTime(record.lastContactAt)}
          />
        </div>
      </div>

      <nav className="flex gap-0.5 overflow-x-auto border-b border-[#e5edf8] px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(([value, label]) => (
          <button
            className={cn(
              "relative h-11 shrink-0 px-2.5 text-[10px] font-bold text-[#71809f] transition hover:text-[#0b66ff]",
              activeTab === value && "text-[#0b66ff]",
            )}
            key={value}
            onClick={() => setActiveTab(value)}
            type="button"
          >
            {label}
            {activeTab === value ? (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#0b66ff]" />
            ) : null}
          </button>
        ))}
      </nav>

      <div className="max-h-[720px] overflow-y-auto p-3">
        {activeTab === "overview" ? (
          <OverviewTab
            canManage={canManage}
            isUpdating={isUpdating}
            localOwnerId={localOwnerId}
            localSource={localSource}
            localStage={localStage}
            localStatus={localStatus}
            onOwnerChange={(value) => {
              setLocalOwnerId(value);
              updateProfile({ ownerId: value === "unassigned" ? null : value });
            }}
            onSourceChange={(value) => {
              setLocalSource(value);
              updateProfile({ source: value });
            }}
            onStageChange={(value) => {
              setLocalStage(value);
              updateProfile({ stage: value });
            }}
            onStatusChange={(value) => {
              setLocalStatus(value);
              updateProfile({ status: value });
            }}
            record={record}
            teamMembers={teamMembers}
          />
        ) : null}
        {activeTab === "activity" ? (
          <ActivityTab onAdd={() => openInteraction("NOTE")} record={record} />
        ) : null}
        {activeTab === "applications" ? <ApplicationsTab record={record} /> : null}
        {activeTab === "documents" ? <DocumentsTab record={record} /> : null}
        {activeTab === "contacts" ? <ContactsTab record={record} /> : null}
        {activeTab === "students" ? <StudentsTab record={record} /> : null}
        {activeTab === "finance" ? <FinanceTab record={record} /> : null}
      </div>

      <div className="border-t border-[#e5edf8] bg-[#fbfdff] p-3">
        <NextTask record={record} onCreate={() => setTaskOpen(true)} />
      </div>

      <CrmTaskDialog
        onOpenChange={setTaskOpen}
        open={taskOpen}
        record={record}
        teamMembers={teamMembers}
      />
      <CrmInteractionDialog
        initialType={interactionType}
        key={`${record.id}-${interactionType}`}
        onOpenChange={setInteractionOpen}
        open={interactionOpen}
        record={record}
      />
    </aside>
  );
}

function OverviewTab({
  canManage,
  isUpdating,
  localOwnerId,
  localSource,
  localStage,
  localStatus,
  onOwnerChange,
  onSourceChange,
  onStageChange,
  onStatusChange,
  record,
  teamMembers,
}: {
  canManage: boolean;
  isUpdating: boolean;
  localOwnerId: string;
  localSource: CrmSourceCode;
  localStage: CrmStageCode;
  localStatus: CrmStatusCode;
  onOwnerChange: (value: string) => void;
  onSourceChange: (value: CrmSourceCode) => void;
  onStageChange: (value: CrmStageCode) => void;
  onStatusChange: (value: CrmStatusCode) => void;
  record: CrmRecord;
  teamMembers: CrmTeamMember[];
}) {
  const stages = record.kind === "agent" ? AGENT_STAGES : INDIVIDUAL_STAGES;

  return (
    <div className="grid gap-3">
      <Section title="CRM idarəetməsi">
        <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
          <CompactSelect
            disabled={!canManage || isUpdating}
            label="Mərhələ"
            onValueChange={(value) => onStageChange(value as CrmStageCode)}
            options={stages.map((value) => [value, CRM_STAGE_LABELS[value]])}
            value={localStage}
          />
          <CompactSelect
            disabled={!canManage || isUpdating}
            label="Status"
            onValueChange={(value) => onStatusChange(value as CrmStatusCode)}
            options={Object.entries(CRM_STATUS_LABELS)}
            value={localStatus}
          />
          <CompactSelect
            disabled={!canManage || isUpdating}
            label="Mənbə"
            onValueChange={(value) => onSourceChange(value as CrmSourceCode)}
            options={Object.entries(CRM_SOURCE_LABELS)}
            value={localSource}
          />
          <CompactSelect
            disabled={!canManage || isUpdating}
            label="Məsul şəxs"
            onValueChange={onOwnerChange}
            options={[
              ["unassigned", "Təyin edilməyib"],
              ...teamMembers.map((member) => [member.id, member.name] as [string, string]),
            ]}
            value={localOwnerId}
          />
        </div>
      </Section>

      {record.kind === "agent" ? (
        <>
          <Section title="İcmal göstəriciləri">
            <div className="grid grid-cols-2 gap-2">
              <Stat icon={UsersRoundIcon} label="Tələbə" value={record.studentsCount} />
              <Stat icon={FileTextIcon} label="Aktiv müraciət" value={record.activeApplications} />
              <Stat icon={TrendingUpIcon} label="Konversiya" value={`${record.conversionRate}%`} />
              <Stat icon={BanknoteIcon} label="Komissiya balansı" value={formatMoney(record.commissionBalance)} />
            </div>
          </Section>
          <StageProgress record={record} />
        </>
      ) : (
        <>
          <Section title="Müştəri məlumatları">
            <div className="grid gap-2.5">
              <InfoRow icon={MapPinIcon} label="Ünvan" value={record.address} />
              <InfoRow icon={Globe2Icon} label="Vətəndaşlıq" value={record.citizenship} />
              <InfoRow icon={GraduationCapIcon} label="İstiqamət" value={record.preferredDestination} />
              <InfoRow icon={BriefcaseBusinessIcon} label="Agent" value={record.agentName} />
              <InfoRow icon={FileTextIcon} label="Sənədlər" value={`${record.documentCount} sənəd`} />
            </div>
          </Section>
          <StageProgress record={record} />
        </>
      )}
    </div>
  );
}

function ActivityTab({ onAdd, record }: { onAdd: () => void; record: CrmRecord }) {
  return (
    <Section
      action={
        <Button
          className="h-8 rounded-lg border-[#dce6f4] px-2 text-[9px] font-black text-[#0b66ff]"
          onClick={onAdd}
          type="button"
          variant="outline"
        >
          <PlusIcon data-icon="inline-start" />
          Qeyd əlavə et
        </Button>
      }
      title="Son fəaliyyətlər"
    >
      {record.activities.length ? (
        <div className="grid gap-0">
          {record.activities.map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div className="relative flex gap-3 pb-4 last:pb-0" key={activity.id}>
                {index < record.activities.length - 1 ? (
                  <span className="absolute left-[15px] top-7 h-[calc(100%-18px)] w-px bg-[#dce6f4]" />
                ) : null}
                <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eff5ff] text-[#0b66ff]">
                  <Icon className="size-3.5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[10px] font-black text-[#24365f]">{activity.subject}</div>
                    <div className="shrink-0 text-[8px] font-bold text-[#91a0b9]">{formatCrmDateTime(activity.occurredAt)}</div>
                  </div>
                  <p className="mt-1 text-[9px] font-medium leading-4 text-[#71809f]">{activity.body || CRM_INTERACTION_LABELS[activity.type]}</p>
                  <div className="mt-1 text-[8px] font-bold text-[#a0acc1]">{activity.actor}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptySection text="Hələ əlaqə qeydi yoxdur." />
      )}
    </Section>
  );
}

function ApplicationsTab({ record }: { record: CrmRecord }) {
  return (
    <Section title={`Müraciətlər · ${record.applications.length}`}>
      {record.applications.length ? (
        <div className="grid gap-2">
          {record.applications.map((application) => (
            <Link
              className="flex items-center gap-3 rounded-xl border border-[#e5edf8] bg-[#fbfdff] p-3 transition hover:border-[#b8d2fa] hover:bg-[#f4f8ff]"
              href={`/applications/${application.id}`}
              key={application.id}
            >
              <span className="flex size-8 items-center justify-center rounded-xl bg-[#eff5ff] text-[#0b66ff]">
                <FileTextIcon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black text-[#24365f]">{application.code}</div>
                <div className="mt-0.5 text-[9px] font-semibold text-[#71809f]">{application.status}</div>
              </div>
              <div className="text-[8px] font-bold text-[#91a0b9]">{formatCrmDateTime(application.updatedAt)}</div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptySection text="Bu qeyd üzrə müraciət yoxdur." />
      )}
    </Section>
  );
}

function DocumentsTab({ record }: { record: CrmRecord }) {
  return (
    <Section title="Sənəd vəziyyəti">
      <div className="flex items-center gap-3 rounded-xl border border-[#e5edf8] bg-[#fbfdff] p-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#eff5ff] text-[#0b66ff]">
          <FileTextIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-[#14264b]">{record.documentCount}</div>
          <div className="text-[9px] font-semibold text-[#71809f]">Ümumi sənəd</div>
        </div>
        <Button asChild className="h-8 rounded-lg text-[9px] font-black" variant="outline">
          <Link href={`/applications/students/${record.id}`}>Sənədlərə bax</Link>
        </Button>
      </div>
    </Section>
  );
}

function ContactsTab({ record }: { record: CrmRecord }) {
  return (
    <Section title={`Əlaqəli şəxslər · ${record.contacts.length}`}>
      {record.contacts.length ? (
        <div className="grid gap-2">
          {record.contacts.map((contact) => (
            <div className="rounded-xl border border-[#e5edf8] bg-[#fbfdff] p-3" key={`${contact.fullName}-${contact.email}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] font-black text-[#24365f]">{contact.fullName}</div>
                  <div className="mt-0.5 text-[9px] font-semibold text-[#71809f]">{contact.position || "Əlaqəli şəxs"}</div>
                </div>
                {contact.isPrimary ? (
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[8px] font-black text-emerald-700">Əsas əlaqə</span>
                ) : null}
              </div>
              <div className="mt-2 grid gap-1.5 text-[9px] font-semibold text-[#4c5f83]">
                {contact.phone ? <div>{contact.phone}</div> : null}
                {contact.email ? <div>{contact.email}</div> : null}
                {contact.whatsapp ? <div>WhatsApp: {contact.whatsapp}</div> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptySection text="Əlaqəli şəxs əlavə edilməyib." />
      )}
    </Section>
  );
}

function StudentsTab({ record }: { record: CrmRecord }) {
  return (
    <Section title={`Agent tələbələri · ${record.studentsCount}`}>
      {record.students.length ? (
        <div className="grid gap-2">
          {record.students.map((student) => (
            <Link
              className="flex items-center gap-3 rounded-xl border border-[#e5edf8] bg-[#fbfdff] p-3 hover:border-[#b8d2fa]"
              href={`/applications/students/${student.id}`}
              key={student.id}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-[#eff5ff] text-[9px] font-black text-[#0b66ff]">{getInitials(student.name)}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[10px] font-black text-[#24365f]">{student.name}</div>
                <div className="mt-0.5 text-[9px] font-semibold text-[#71809f]">{student.stage}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptySection text="Bu agentə bağlı tələbə tapılmadı." />
      )}
    </Section>
  );
}

function FinanceTab({ record }: { record: CrmRecord }) {
  return (
    <div className="grid gap-3">
      <Section title="Maliyyə xülasəsi">
        <div className="rounded-xl border border-[#dce6f4] bg-[#f6f9ff] p-4">
          <div className="text-[9px] font-black uppercase tracking-[0.05em] text-[#71809f]">Komissiya balansı</div>
          <div className="mt-1 text-2xl font-black tabular-nums text-[#14264b]">{formatMoney(record.commissionBalance)}</div>
          <div className="mt-2 text-[9px] font-semibold text-[#71809f]">Aktiv müraciətlər və təsdiqlənmiş xidmətlər əsasında.</div>
        </div>
      </Section>
      <Button asChild className="h-9 rounded-xl text-[10px] font-black" variant="outline">
        <Link href="/finance">Maliyyə moduluna keç</Link>
      </Button>
    </div>
  );
}

function NextTask({ record, onCreate }: { record: CrmRecord; onCreate: () => void }) {
  const nextTask = record.tasks.find(
    (task) => task.status === "TODO" || task.status === "IN_PROGRESS",
  );

  return (
    <div>
      <div className="mb-2 text-[10px] font-black text-[#24365f]">Növbəti tapşırıq</div>
      {nextTask ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-[#dce6f4] bg-white p-2.5">
          <CircleIcon className="size-4 shrink-0 text-[#9aacc7]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[9px] font-black text-[#24365f]">{nextTask.title}</div>
            <div className="mt-0.5 truncate text-[8px] font-semibold text-[#71809f]">{nextTask.assignedTo?.name ?? "Təyin edilməyib"}</div>
          </div>
          <div className="shrink-0 text-[8px] font-black text-[#ef4444]">{formatCrmDateTime(nextTask.dueAt)}</div>
        </div>
      ) : (
        <button
          className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#cfdbea] bg-white text-[9px] font-black text-[#0b66ff] hover:bg-[#f4f8ff]"
          onClick={onCreate}
          type="button"
        >
          <PlusIcon className="size-3.5" />
          Yeni tapşırıq yarat
        </button>
      )}
    </div>
  );
}

function StageProgress({ record }: { record: CrmRecord }) {
  const stages = record.kind === "agent" ? AGENT_STAGES.slice(0, 4) : INDIVIDUAL_STAGES.slice(0, 7);
  const activeIndex = Math.max(0, stages.indexOf(record.stage));

  return (
    <Section title={record.kind === "agent" ? "Tərəfdaşlıq mərhələsi" : "Müştəri mərhələsi"}>
      <div className="flex items-start gap-0 overflow-x-auto pb-1">
        {stages.map((stage, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;
          return (
            <div className="flex min-w-[72px] flex-1 flex-col items-center" key={stage}>
              <div className="flex w-full items-center">
                <span className={cn("h-px flex-1", index === 0 ? "bg-transparent" : complete || active ? "bg-emerald-400" : "bg-[#dce6f4]")} />
                <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border text-[8px] font-black", complete ? "border-emerald-500 bg-emerald-500 text-white" : active ? "border-[#0b66ff] bg-[#0b66ff] text-white" : "border-[#cfdbea] bg-white text-[#91a0b9]")}>{complete ? <CheckIcon className="size-3" /> : index + 1}</span>
                <span className={cn("h-px flex-1", index === stages.length - 1 ? "bg-transparent" : index < activeIndex ? "bg-emerald-400" : "bg-[#dce6f4]")} />
              </div>
              <div className="mt-1.5 max-w-[72px] text-center text-[7px] font-bold leading-3 text-[#71809f]">{CRM_STAGE_LABELS[stage]}</div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function CompactSelect({ disabled, label, onValueChange, options, value }: { disabled: boolean; label: string; onValueChange: (value: string) => void; options: Array<[string, string]>; value: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-[8px] font-black uppercase tracking-[0.04em] text-[#91a0b9]">{label}</span>
      <Select disabled={disabled} onValueChange={onValueChange} value={value}>
        <SelectTrigger className="h-9 rounded-xl border-[#dce6f4] bg-[#fbfdff] px-2.5 text-[9px] font-bold text-[#34456c]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>{optionLabel}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function Section({ action, children, title }: { action?: React.ReactNode; children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-2xl border border-[#e5edf8] bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-black text-[#24365f]">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-[#e5edf8] bg-[#fbfdff] p-2.5">
      <div className="flex items-center gap-1.5 text-[#0b66ff]"><Icon className="size-3" /><span className="text-[8px] font-bold text-[#71809f]">{label}</span></div>
      <div className="mt-1 text-sm font-black tabular-nums text-[#14264b]">{value}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[14px_82px_minmax(0,1fr)] items-start gap-2 text-[9px]">
      <Icon className="mt-0.5 size-3.5 text-[#71809f]" strokeWidth={1.7} />
      <span className="font-bold text-[#91a0b9]">{label}</span>
      <span className="min-w-0 break-words font-semibold text-[#34456c]">{value}</span>
    </div>
  );
}

function EmptySection({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#dce6f4] bg-[#fbfdff] px-4 py-8 text-center">
      <NotebookPenIcon className="mx-auto size-5 text-[#a0acc1]" />
      <p className="mt-2 text-[9px] font-bold text-[#71809f]">{text}</p>
    </div>
  );
}

function getActivityIcon(type: CrmInteractionTypeCode): LucideIcon {
  if (type === "CALL") return PhoneIcon;
  if (type === "EMAIL") return MailIcon;
  if (type === "WHATSAPP") return MessageSquareTextIcon;
  if (type === "APPLICATION") return FileTextIcon;
  if (type === "DOCUMENT") return ClipboardCheckIcon;
  if (type === "MEETING") return UsersRoundIcon;
  return NotebookPenIcon;
}

function normalizePhone(phone: string) {
  return phone.replace(/[^+\d]/g, "");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("az-AZ", { currency: "AZN", maximumFractionDigits: 0, style: "currency" }).format(value);
}

function getInitials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
}
