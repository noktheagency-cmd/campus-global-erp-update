"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClockIcon,
  CheckIcon,
  CircleIcon,
  PlusIcon,
  SearchIcon,
  UserRoundCogIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateCrmTaskStatusAction } from "@/features/crm/actions";
import {
  CRM_TASK_PRIORITY_LABELS,
  CRM_TASK_STATUS_LABELS,
} from "@/features/crm/constants";
import { formatCrmDateTime } from "@/features/crm/formatters";
import { CrmTaskDialog } from "@/features/crm/components/crm-dialogs";
import type {
  CrmRecord,
  CrmTaskRecord,
  CrmTaskStatusCode,
  CrmTeamMember,
} from "@/features/crm/types";
import { cn } from "@/lib/utils";

type TaskWithRecord = CrmTaskRecord & { record: CrmRecord };

export function CrmTasksView({
  canManage,
  records,
  teamMembers,
}: {
  canManage: boolean;
  records: CrmRecord[];
  teamMembers: CrmTeamMember[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [status, setStatus] = useState<CrmTaskStatusCode | "all">("all");
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id ?? "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const tasks = useMemo(
    () =>
      records.flatMap((record) =>
        record.tasks.map((task) => ({ ...task, record })),
      ),
    [records],
  );
  const filteredTasks = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("az");
    return tasks.filter(
      (task) =>
        (status === "all" || task.status === status) &&
        (!normalizedQuery ||
          `${task.title} ${task.record.name} ${task.assignedTo?.name ?? ""}`
            .toLocaleLowerCase("az")
            .includes(normalizedQuery)),
    );
  }, [deferredQuery, status, tasks]);
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0] ?? null;

  function updateStatus(taskId: string, nextStatus: CrmTaskStatusCode) {
    startTransition(async () => {
      const result = await updateCrmTaskStatusAction({ status: nextStatus, taskId });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <section className="mt-4 overflow-hidden rounded-[1.25rem] border border-[#dce6f4] bg-white shadow-[0_12px_36px_rgba(29,78,216,0.045)]">
      <div className="flex flex-col gap-3 border-b border-[#e5edf8] p-3 lg:flex-row lg:items-center">
        <label className="relative block min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b9ab5]" />
          <Input
            aria-label="Tapşırıq və ya müştəri axtar"
            className="h-10 rounded-xl border-[#dce6f4] bg-[#fbfdff] pl-9 text-xs font-semibold"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tapşırıq və ya müştəri axtar"
            value={query}
          />
        </label>
        <Select
          onValueChange={(value) => setStatus(value as CrmTaskStatusCode | "all")}
          value={status}
        >
          <SelectTrigger aria-label="Tapşırıq statusu" className="h-10 w-full rounded-xl border-[#dce6f4] bg-[#fbfdff] text-xs font-bold lg:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Bütün statuslar</SelectItem>
            {Object.entries(CRM_TASK_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setSelectedRecordId} value={selectedRecordId}>
          <SelectTrigger aria-label="Tapşırıq üçün kontakt" className="h-10 w-full rounded-xl border-[#dce6f4] bg-[#fbfdff] text-xs font-bold lg:w-56">
            <SelectValue placeholder="Kontakt seçin" />
          </SelectTrigger>
          <SelectContent>
            {records.map((record) => (
              <SelectItem key={record.id} value={record.id}>{record.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="h-10 rounded-xl bg-[#0b66ff] px-4 text-xs font-black hover:bg-[#075be8]"
          disabled={!canManage || !selectedRecord}
          onClick={() => setDialogOpen(true)}
          type="button"
        >
          <PlusIcon data-icon="inline-start" />
          Yeni tapşırıq
        </Button>
      </div>

      <div className="flex items-center justify-between border-b border-[#e5edf8] bg-[#fbfdff] px-4 py-2.5">
        <div className="text-xs font-black text-[#24365f]">Tapşırıq reyestri</div>
        <div className="text-[11px] font-bold text-[#71809f]">{filteredTasks.length} nəticə</div>
      </div>

      {filteredTasks.length ? (
        <div className="divide-y divide-[#edf2f9]">
          {filteredTasks.map((task) => (
            <TaskRow
              canManage={canManage}
              isPending={isPending}
              key={task.id}
              onStatusChange={updateStatus}
              task={task}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#eff5ff] text-[#0b66ff]">
            <CalendarClockIcon className="size-5" />
          </span>
          <h2 className="mt-3 text-sm font-black text-[#14264b]">Tapşırıq tapılmadı</h2>
          <p className="mt-1 text-xs font-medium text-[#71809f]">Filterləri dəyişin və ya yeni tapşırıq yaradın.</p>
        </div>
      )}

      {selectedRecord ? (
        <CrmTaskDialog
          onOpenChange={setDialogOpen}
          open={dialogOpen}
          record={selectedRecord}
          teamMembers={teamMembers}
        />
      ) : null}
    </section>
  );
}

function TaskRow({
  canManage,
  isPending,
  onStatusChange,
  task,
}: {
  canManage: boolean;
  isPending: boolean;
  onStatusChange: (taskId: string, status: CrmTaskStatusCode) => void;
  task: TaskWithRecord;
}) {
  const completed = task.status === "COMPLETED";

  return (
    <div className="grid gap-3 px-4 py-3.5 [contain-intrinsic-size:72px] [content-visibility:auto] lg:grid-cols-[minmax(240px,1.3fr)_minmax(170px,.8fr)_minmax(140px,.65fr)_120px_112px] lg:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <button
          aria-label={completed ? "Tapşırığı yenidən aç" : "Tapşırığı tamamla"}
          className={cn(
            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border transition",
            completed
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-[#cfdbea] bg-white text-[#91a0b9] hover:border-[#0b66ff] hover:text-[#0b66ff]",
          )}
          disabled={!canManage || isPending}
          onClick={() => onStatusChange(task.id, completed ? "TODO" : "COMPLETED")}
          type="button"
        >
          {completed ? <CheckIcon className="size-3.5" /> : <CircleIcon className="size-3.5" />}
        </button>
        <div className="min-w-0">
          <div className={cn("truncate text-xs font-black text-[#24365f]", completed && "text-[#91a0b9] line-through")}>{task.title}</div>
          <div className="mt-1 line-clamp-1 text-[10px] font-medium text-[#71809f]">{task.description || "Əlavə qeyd yoxdur"}</div>
        </div>
      </div>
      <div className="min-w-0">
        <div className="truncate text-[10px] font-black text-[#34456c]">{task.record.name}</div>
        <div className="mt-0.5 text-[9px] font-semibold text-[#91a0b9]">{task.record.kind === "agent" ? "Agent" : "Fərdi müştəri"}</div>
      </div>
      <div className="flex items-center gap-2 text-[10px] font-bold text-[#4c5f83]">
        <UserRoundCogIcon className="size-3.5 text-[#71809f]" />
        <span className="truncate">{task.assignedTo?.name ?? "Təyin edilməyib"}</span>
      </div>
      <div className="text-[10px] font-bold text-[#4c5f83]">{formatCrmDateTime(task.dueAt)}</div>
      <div className="flex items-center justify-between gap-2 lg:justify-end">
        <span className={cn("rounded-lg px-2 py-1 text-[9px] font-black", priorityTone(task.priority))}>{CRM_TASK_PRIORITY_LABELS[task.priority]}</span>
        <Select
          disabled={!canManage || isPending}
          onValueChange={(value) => onStatusChange(task.id, value as CrmTaskStatusCode)}
          value={task.status}
        >
          <SelectTrigger aria-label={`${task.title} statusu`} className="h-8 w-9 rounded-lg border-[#dce6f4] px-2 [&_svg:first-of-type]:hidden">
            <SelectValue className="sr-only" />
          </SelectTrigger>
          <SelectContent align="end">
            {Object.entries(CRM_TASK_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function priorityTone(priority: CrmTaskRecord["priority"]) {
  if (priority === "URGENT") return "bg-red-50 text-red-700";
  if (priority === "HIGH") return "bg-amber-50 text-amber-700";
  if (priority === "LOW") return "bg-slate-100 text-slate-600";
  return "bg-blue-50 text-[#0b66ff]";
}
