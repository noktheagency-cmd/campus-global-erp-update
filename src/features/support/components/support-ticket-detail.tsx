"use client";

import { useActionState, useId, useState } from "react";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  Clock3Icon,
  FileTextIcon,
  FolderKanbanIcon,
  PaperclipIcon,
  SendIcon,
  ShieldCheckIcon,
  TagIcon,
  UserRoundIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  assignSupportTicketAction,
  replySupportTicketAction,
  updateSupportTicketPriorityAction,
  updateSupportTicketStatusAction,
} from "@/features/support/actions";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_STATUS_LABELS,
} from "@/features/support/constants";
import {
  PriorityPill,
  StatusPill,
  formatSupportDateTime,
  getInitials,
} from "@/features/support/components/support-ticket-list";
import type {
  SupportActionState,
  SupportTeamMember,
  SupportTicketRecord,
} from "@/features/support/types";
import { cn } from "@/lib/utils";

const INITIAL_STATE: SupportActionState = { message: "", status: "idle" };

export function SupportTicketDetail({
  canManage,
  currentUserId,
  returnTo,
  teamMembers,
  ticket,
}: {
  canManage: boolean;
  currentUserId: string;
  returnTo: string;
  teamMembers: SupportTeamMember[];
  ticket: SupportTicketRecord | null;
}) {
  if (!ticket) {
    return (
      <aside className="flex min-h-[560px] items-center justify-center rounded-[1.25rem] border border-[#dce6f4] bg-white p-8 text-center shadow-[0_12px_36px_rgba(29,78,216,0.045)]">
        <div>
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#0b66ff]">
            <ShieldCheckIcon className="size-6" />
          </span>
          <h2 className="mt-4 text-base font-black text-[#17305b]">
            Ticket seçin
          </h2>
          <p className="mt-1 text-xs font-medium leading-5 text-[#74829d]">
            Müraciətin detalları və yazışma burada görünəcək.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-[1.25rem] border border-[#dce6f4] bg-white shadow-[0_12px_36px_rgba(29,78,216,0.045)] 2xl:max-h-[calc(100svh-10.5rem)]">
      <div className="border-b border-[#e2eaf5] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-black tracking-wide text-[#24406f]">
            {ticket.code}
          </span>
          <div className="flex items-center gap-2">
            <PriorityPill priority={ticket.priority} />
            <StatusPill status={ticket.status} />
          </div>
        </div>

        <div className="mt-4 flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#cfe0f6] bg-[#f2f7ff] text-sm font-black text-[#0b66ff]">
            {getInitials(ticket.requesterName)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-[#0b1d42]">
              {ticket.subject}
            </h2>
            <p className="mt-1 truncate text-xs font-semibold text-[#6a7896]">
              {ticket.requesterName} · {ticket.requesterEmail}
            </p>
          </div>
        </div>

        <dl className="mt-4 grid gap-2.5 text-xs">
          <SupportInfoRow icon={FolderKanbanIcon} label="Kateqoriya">
            <span>{SUPPORT_CATEGORY_LABELS[ticket.category]}</span>
          </SupportInfoRow>
          <SupportInfoRow icon={TagIcon} label="Prioritet">
            {canManage ? (
              <AutoSubmitSelect
                action={updateSupportTicketPriorityAction}
                name="priority"
                options={Object.entries(SUPPORT_PRIORITY_LABELS)}
                returnTo={returnTo}
                ticketId={ticket.id}
                value={ticket.priority}
              />
            ) : (
              <PriorityPill priority={ticket.priority} />
            )}
          </SupportInfoRow>
          <SupportInfoRow icon={CheckCircle2Icon} label="Status">
            {canManage ? (
              <AutoSubmitSelect
                action={updateSupportTicketStatusAction}
                name="status"
                options={Object.entries(SUPPORT_STATUS_LABELS)}
                returnTo={returnTo}
                ticketId={ticket.id}
                value={ticket.status}
              />
            ) : (
              <StatusPill status={ticket.status} />
            )}
          </SupportInfoRow>
          {canManage ? (
            <SupportInfoRow icon={UserRoundIcon} label="Təyinat">
              <AutoSubmitSelect
                action={assignSupportTicketAction}
                name="assignedToId"
                options={[
                  ["unassigned", "Təyin edilməyib"],
                  ...teamMembers.map(
                    (member) => [member.id, member.name] as [string, string],
                  ),
                ]}
                returnTo={returnTo}
                ticketId={ticket.id}
                value={ticket.assignedTo?.id ?? "unassigned"}
              />
            </SupportInfoRow>
          ) : ticket.assignedTo ? (
            <SupportInfoRow icon={UserRoundIcon} label="Məsul şəxs">
              <span>{ticket.assignedTo.name}</span>
            </SupportInfoRow>
          ) : null}
          <SupportInfoRow icon={Clock3Icon} label="SLA">
            <SlaValue ticket={ticket} />
          </SupportInfoRow>
        </dl>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#7987a2]">
          Müsahibə
        </p>
        {ticket.messageLimitReached ? (
          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-700">
            Performans üçün yalnız son 100 mesaj göstərilir.
          </p>
        ) : null}
        <div className="relative mt-4 space-y-5 before:absolute before:bottom-4 before:left-[17px] before:top-4 before:w-px before:bg-[#dbe5f2]">
          {ticket.messages.map((message) => {
            const isRequester = message.author?.id === ticket.requesterId;
            const isOwn = message.author?.id === currentUserId;
            const isInternal = message.kind === "INTERNAL_NOTE";

            return (
              <article className="relative flex gap-3" key={message.id}>
                <span
                  className={cn(
                    "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border text-[10px] font-black",
                    isInternal
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : isRequester
                        ? "border-[#cfe0f6] bg-[#f2f7ff] text-[#0b66ff]"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700",
                  )}
                >
                  {isInternal
                    ? "Q"
                    : getInitials(message.author?.name ?? "Dəstək")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className="text-xs font-black text-[#23375d]">
                      {message.author?.name ?? "Sistem"}
                      {isOwn ? " (siz)" : ""}
                      {isInternal ? (
                        <span className="ml-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700">
                          Daxili qeyd
                        </span>
                      ) : null}
                    </p>
                    <time className="text-[10px] font-semibold text-[#8490a8]">
                      {formatSupportDateTime(message.createdAt)}
                    </time>
                  </div>
                  <div
                    className={cn(
                      "mt-2 rounded-2xl border px-3.5 py-3 text-xs font-medium leading-5 text-[#435576]",
                      isInternal
                        ? "border-amber-200 bg-amber-50/70"
                        : isRequester
                          ? "border-[#dde6f2] bg-[#f8faff]"
                          : "border-[#d7e5f8] bg-[#f1f6ff]",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.body}</p>
                    {message.attachments.length > 0 ? (
                      <div className="mt-3 space-y-2 border-t border-current/10 pt-2.5">
                        {message.attachments.map((attachment) =>
                          attachment.url ? (
                            <a
                              className="flex items-center gap-2 rounded-xl bg-white/70 px-2.5 py-2 text-[11px] font-black text-[#0b66ff] transition hover:bg-white"
                              href={attachment.url}
                              key={attachment.id}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <FileTextIcon className="size-4 shrink-0" />
                              <span className="min-w-0 flex-1 truncate">
                                {attachment.fileName}
                              </span>
                              <span className="shrink-0 text-[9px] font-bold text-[#8290aa]">
                                {formatFileSize(attachment.fileSize)}
                              </span>
                            </a>
                          ) : (
                            <div
                              className="flex items-center gap-2 rounded-xl bg-white/70 px-2.5 py-2 text-[11px] font-bold text-[#8290aa]"
                              key={attachment.id}
                            >
                              <FileTextIcon className="size-4" />
                              <span className="truncate">
                                {attachment.fileName}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <ReplyComposer
        canManage={canManage}
        returnTo={returnTo}
        ticketId={ticket.id}
      />
    </aside>
  );
}

function ReplyComposer({
  canManage,
  returnTo,
  ticketId,
}: {
  canManage: boolean;
  returnTo: string;
  ticketId: string;
}) {
  const fileInputId = useId();
  const [fileName, setFileName] = useState("");
  const [internal, setInternal] = useState(false);
  const [state, formAction, pending] = useActionState(
    replySupportTicketAction,
    INITIAL_STATE,
  );

  return (
    <form
      action={formAction}
      className="border-t border-[#e2eaf5] bg-[#fbfdff] p-3.5"
    >
      <input name="ticketId" type="hidden" value={ticketId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <input
        name="internal"
        type="hidden"
        value={internal ? "true" : "false"}
      />
      <Textarea
        aria-label="Ticket cavabı"
        className="min-h-20 resize-y rounded-xl border-[#d9e4f2] bg-white px-3 py-2.5 text-xs font-medium leading-5 placeholder:text-[#93a0b7]"
        maxLength={5000}
        name="body"
        placeholder={
          internal ? "Komanda üçün daxili qeyd yazın..." : "Cavabınızı yazın..."
        }
      />
      {state.status === "error" ? (
        <p
          aria-live="polite"
          className="mt-2 text-[11px] font-bold text-red-600"
        >
          {state.fieldErrors?.body?.[0] ?? state.message}
        </p>
      ) : null}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <input
          accept=".png,.jpg,.jpeg,.pdf,application/pdf,image/png,image/jpeg"
          className="sr-only"
          id={fileInputId}
          name="attachment"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
          type="file"
        />
        <label
          className="inline-flex h-9 max-w-full cursor-pointer items-center gap-2 rounded-xl border border-[#d7e3f2] bg-white px-3 text-[10px] font-black text-[#0b66ff] transition hover:bg-[#f5f9ff]"
          htmlFor={fileInputId}
        >
          <PaperclipIcon className="size-3.5 shrink-0" />
          <span className="truncate">{fileName || "Fayl əlavə et"}</span>
        </label>
        {canManage ? (
          <button
            aria-pressed={internal}
            className="ml-auto inline-flex h-9 items-center gap-2 rounded-xl px-2 text-[10px] font-black text-[#5f6f8e] transition hover:bg-[#f1f5fb]"
            onClick={() => setInternal((current) => !current)}
            type="button"
          >
            <span
              className={cn(
                "relative h-5 w-9 rounded-full bg-[#dce5f1] transition",
                internal && "bg-amber-400",
              )}
            >
              <span
                className={cn(
                  "absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition",
                  internal && "translate-x-4",
                )}
              />
            </span>
            Daxili qeyd
          </button>
        ) : null}
        <Button
          className={cn(
            "h-9 rounded-xl px-3 text-[10px] font-black",
            internal
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "bg-[#0b66ff] text-white hover:bg-[#075be8]",
          )}
          disabled={pending}
          type="submit"
        >
          <SendIcon data-icon="inline-start" />
          {pending
            ? "Göndərilir..."
            : internal
              ? "Qeyd əlavə et"
              : "Cavab göndər"}
        </Button>
      </div>
      {state.fieldErrors?.attachment?.[0] ? (
        <p className="mt-2 text-[11px] font-bold text-red-600">
          {state.fieldErrors.attachment[0]}
        </p>
      ) : null}
    </form>
  );
}

function SupportInfoRow({
  children,
  icon: Icon,
  label,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="grid min-h-8 grid-cols-[18px_82px_minmax(0,1fr)] items-center gap-2 text-[#60708e]">
      <Icon className="size-4" />
      <dt className="font-semibold">{label}</dt>
      <dd className="min-w-0 justify-self-end text-right font-bold text-[#31456d]">
        {children}
      </dd>
    </div>
  );
}

function AutoSubmitSelect({
  action,
  name,
  options,
  returnTo,
  ticketId,
  value,
}: {
  action: (formData: FormData) => void | Promise<void>;
  name: string;
  options: Array<[string, string]>;
  returnTo: string;
  ticketId: string;
  value: string;
}) {
  return (
    <form action={action} className="relative inline-flex max-w-full">
      <input name="ticketId" type="hidden" value={ticketId} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <select
        aria-label={name}
        className="h-8 max-w-44 appearance-none truncate rounded-xl border border-[#d8e3f1] bg-[#fbfdff] py-1 pl-2.5 pr-7 text-[10px] font-black text-[#294269] outline-none transition focus:border-[#83b7ff] focus:ring-2 focus:ring-[#0b66ff]/15"
        defaultValue={value}
        name={name}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#6e7d98]" />
    </form>
  );
}

function SlaValue({ ticket }: { ticket: SupportTicketRecord }) {
  return (
    <span
      className={cn(
        ticket.firstResponseAt && "text-emerald-700",
        ticket.slaBreached && "text-red-600",
        !ticket.firstResponseAt && !ticket.slaBreached && "text-amber-600",
      )}
    >
      {ticket.slaLabel}
    </span>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
