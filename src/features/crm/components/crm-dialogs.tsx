"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createCrmTaskAction,
  recordCrmInteractionAction,
} from "@/features/crm/actions";
import {
  CRM_INTERACTION_LABELS,
  CRM_TASK_PRIORITY_LABELS,
} from "@/features/crm/constants";
import type {
  CrmInteractionTypeCode,
  CrmRecord,
  CrmTaskPriorityCode,
  CrmTeamMember,
} from "@/features/crm/types";

export function CrmTaskDialog({
  onOpenChange,
  open,
  record,
  teamMembers,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  record: CrmRecord;
  teamMembers: CrmTeamMember[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [priority, setPriority] = useState<CrmTaskPriorityCode>("MEDIUM");
  const [assignedToId, setAssignedToId] = useState(
    record.owner?.id ?? teamMembers[0]?.id ?? "unassigned",
  );

  function submitTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createCrmTaskAction({
        assignedToId:
          assignedToId === "unassigned" ? undefined : assignedToId,
        description: String(formData.get("description") ?? ""),
        dueAt: String(formData.get("dueAt") ?? ""),
        kind: record.kind,
        priority,
        subjectId: record.id,
        title: String(formData.get("title") ?? ""),
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-2xl border-[#dce6f4] bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-[#14264b]">
            Yeni tapşırıq
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-[#71809f]">
            {record.name} üçün növbəti izləmə addımını planlaşdırın.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submitTask}>
          <Field label="Tapşırığın adı">
            <Input
              aria-label="Tapşırığın adı"
              autoFocus
              className="h-10 rounded-xl border-[#dce6f4] text-xs font-semibold"
              name="title"
              placeholder="Məsələn: qəbul şərtlərini müzakirə et"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Son tarix">
              <Input
                aria-label="Son tarix"
                className="h-10 rounded-xl border-[#dce6f4] text-xs font-semibold"
                defaultValue={toDateTimeLocal(record.nextFollowUpAt)}
                name="dueAt"
                required
                type="datetime-local"
              />
            </Field>
            <Field label="Prioritet">
              <Select
                onValueChange={(value) =>
                  setPriority(value as CrmTaskPriorityCode)
                }
                value={priority}
              >
                <SelectTrigger aria-label="Prioritet" className="h-10 rounded-xl border-[#dce6f4] text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CRM_TASK_PRIORITY_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Məsul şəxs">
            <Select onValueChange={setAssignedToId} value={assignedToId}>
              <SelectTrigger aria-label="Məsul şəxs" className="h-10 rounded-xl border-[#dce6f4] text-xs font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Təyin edilməyib</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Qeyd">
            <Textarea
              aria-label="Tapşırıq qeydi"
              className="min-h-24 rounded-xl border-[#dce6f4] text-xs font-medium"
              name="description"
              placeholder="Tapşırıq üçün əlavə məlumat..."
            />
          </Field>
          <DialogFooter className="mt-1 border-[#e5edf8] bg-[#f8fbff]">
            <Button
              className="h-10 rounded-xl bg-[#0b66ff] px-5 text-xs font-black hover:bg-[#075be8]"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Yaradılır..." : "Tapşırıq yarat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CrmInteractionDialog({
  initialType = "NOTE",
  onOpenChange,
  open,
  record,
}: {
  initialType?: CrmInteractionTypeCode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  record: CrmRecord;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<CrmInteractionTypeCode>(initialType);

  function submitInteraction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await recordCrmInteractionAction({
        body: String(formData.get("body") ?? ""),
        direction: String(formData.get("direction") ?? "INTERNAL"),
        kind: record.kind,
        subject: String(formData.get("subject") ?? ""),
        subjectId: record.id,
        type,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-2xl border-[#dce6f4] bg-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-[#14264b]">
            Əlaqə qeydi
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-[#71809f]">
            {record.name} ilə ünsiyyəti tarixçəyə əlavə edin.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submitInteraction}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Əlaqə tipi">
              <Select
                onValueChange={(value) =>
                  setType(value as CrmInteractionTypeCode)
                }
                value={type}
              >
                <SelectTrigger aria-label="Əlaqə tipi" className="h-10 rounded-xl border-[#dce6f4] text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CRM_INTERACTION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="İstiqamət">
              <select
                aria-label="Əlaqə istiqaməti"
                className="h-10 w-full rounded-xl border border-[#dce6f4] bg-white px-3 text-xs font-bold text-[#34456c] outline-none focus:border-[#0b66ff]"
                defaultValue="OUTBOUND"
                name="direction"
              >
                <option value="OUTBOUND">Gedən əlaqə</option>
                <option value="INBOUND">Gələn əlaqə</option>
                <option value="INTERNAL">Daxili qeyd</option>
              </select>
            </Field>
          </div>
          <Field label="Başlıq">
            <Input
              aria-label="Əlaqə başlığı"
              autoFocus
              className="h-10 rounded-xl border-[#dce6f4] text-xs font-semibold"
              name="subject"
              placeholder="Əlaqənin qısa nəticəsi"
              required
            />
          </Field>
          <Field label="Ətraflı qeyd">
            <Textarea
              aria-label="Ətraflı əlaqə qeydi"
              className="min-h-28 rounded-xl border-[#dce6f4] text-xs font-medium"
              name="body"
              placeholder="Danışılan mövzular və növbəti addımlar..."
            />
          </Field>
          <DialogFooter className="mt-1 border-[#e5edf8] bg-[#f8fbff]">
            <Button
              className="h-10 rounded-xl bg-[#0b66ff] px-5 text-xs font-black hover:bg-[#075be8]"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Əlavə edilir..." : "Tarixçəyə əlavə et"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[10px] font-black uppercase tracking-[0.05em] text-[#637392]">
        {label}
      </Label>
      {children}
    </div>
  );
}

function toDateTimeLocal(value: string | null) {
  const date = value ? new Date(value) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
