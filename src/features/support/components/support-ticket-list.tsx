"use client";

import { InboxIcon } from "lucide-react";

import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_STATUS_LABELS,
} from "@/features/support/constants";
import type { SupportTicketSummaryRecord } from "@/features/support/types";
import { cn } from "@/lib/utils";

const SUPPORT_MONTH_LABELS = [
  "yan",
  "fev",
  "mar",
  "apr",
  "may",
  "iyn",
  "iyl",
  "avq",
  "sen",
  "okt",
  "noy",
  "dek",
] as const;

export function SupportTicketList({
  onSelect,
  selectedId,
  tickets,
}: {
  onSelect: (id: string) => void;
  selectedId: string | null;
  tickets: SupportTicketSummaryRecord[];
}) {
  if (tickets.length === 0) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#0b66ff]">
          <InboxIcon className="size-6" />
        </span>
        <h2 className="mt-4 text-base font-black text-[#132a52]">
          Ticket tapılmadı
        </h2>
        <p className="mt-1 max-w-sm text-xs font-medium leading-5 text-[#73819d]">
          Axtarış və filterləri dəyişin və ya yeni support ticket yaradın.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[850px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#e3ebf6] text-[10px] font-black uppercase tracking-[0.055em] text-[#72819d]">
            <th className="w-[29%] px-4 py-3">Ticket</th>
            <th className="w-[18%] px-3 py-3">Müraciətçi</th>
            <th className="w-[15%] px-3 py-3">Kateqoriya</th>
            <th className="w-[12%] px-3 py-3">Prioritet</th>
            <th className="w-[14%] px-3 py-3">Status</th>
            <th className="w-[12%] px-3 py-3">Son aktivlik</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const selected = ticket.id === selectedId;
            return (
              <tr
                aria-selected={selected}
                className={cn(
                  "cursor-pointer border-b border-[#e8eef7] text-xs transition outline-none last:border-b-0 hover:bg-[#f7faff] focus-visible:bg-[#f0f6ff]",
                  selected && "bg-[#f0f6ff] shadow-[inset_3px_0_0_#0b66ff]",
                )}
                key={ticket.id}
                onClick={() => onSelect(ticket.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(ticket.id);
                  }
                }}
                tabIndex={0}
              >
                <td className="px-4 py-3.5">
                  <span className="block font-black text-[#0b66ff]">
                    {ticket.code}
                  </span>
                  <span className="mt-1 block max-w-60 truncate font-semibold text-[#405276]">
                    {ticket.subject}
                  </span>
                </td>
                <td className="px-3 py-3.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#cfe0f6] bg-[#f4f8ff] text-[10px] font-black text-[#0b66ff]">
                      {getInitials(ticket.requesterName)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-[#23375f]">
                        {ticket.requesterName}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] font-medium text-[#8490a7]">
                        {ticket.requesterEmail}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3.5 font-semibold text-[#60708e]">
                  {SUPPORT_CATEGORY_LABELS[ticket.category]}
                </td>
                <td className="px-3 py-3.5">
                  <PriorityPill priority={ticket.priority} />
                </td>
                <td className="px-3 py-3.5">
                  <StatusPill status={ticket.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-[11px] font-semibold text-[#70809e]">
                  <span suppressHydrationWarning>
                    {formatSupportDateTime(ticket.lastActivityAt)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function PriorityPill({
  priority,
}: {
  priority: SupportTicketSummaryRecord["priority"];
}) {
  const classes = {
    LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
    MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
    HIGH: "border-rose-200 bg-rose-50 text-rose-700",
    URGENT: "border-red-300 bg-red-50 text-red-700",
  }[priority];

  return (
    <span
      className={cn(
        "inline-flex rounded-lg border px-2 py-1 text-[10px] font-black",
        classes,
      )}
    >
      {SUPPORT_PRIORITY_LABELS[priority]}
    </span>
  );
}

export function StatusPill({
  status,
}: {
  status: SupportTicketSummaryRecord["status"];
}) {
  const classes = {
    NEW: "border-blue-200 bg-blue-50 text-[#0b66ff]",
    IN_PROGRESS: "border-sky-200 bg-sky-50 text-sky-700",
    WAITING_FOR_REQUESTER: "border-amber-200 bg-amber-50 text-amber-700",
    RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    CLOSED: "border-slate-200 bg-slate-100 text-slate-600",
  }[status];

  return (
    <span
      className={cn(
        "inline-flex rounded-lg border px-2 py-1 text-[10px] font-black",
        classes,
      )}
    >
      {SUPPORT_STATUS_LABELS[status]}
    </span>
  );
}

export function getInitials(value: string) {
  const parts = value.split(/[\s@._-]+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "T"}${parts[1]?.[0] ?? parts[0]?.[1] ?? ""}`
    .toLocaleUpperCase("az")
    .slice(0, 2);
}

export function formatSupportDateTime(value: string) {
  const date = new Date(value);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");

  return `${day} ${SUPPORT_MONTH_LABELS[date.getUTCMonth()]}, ${hour}:${minute}`;
}
