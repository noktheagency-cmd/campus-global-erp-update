"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  MessageCircleIcon,
  SendIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sendStudentChatMessageAction } from "@/features/applications/student-chat-actions";
import type { StudentChatMessage } from "@/features/applications/student-chat";
import { cn } from "@/lib/utils";

type StudentChatPanelProps = {
  applicationId?: string;
  className?: string;
  messages: StudentChatMessage[];
  returnTo: string;
  studentId: string;
  viewer: "agent" | "staff" | "student";
};

export function StudentChatPanel({
  applicationId,
  className,
  messages,
  returnTo,
  studentId,
  viewer,
}: StudentChatPanelProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.25rem] border border-[#dce6f4] bg-white shadow-[0_12px_32px_rgba(29,78,216,0.04)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#edf2f8] bg-[#fbfdff] px-3 py-2.5 pr-12">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-black text-[#07183a]">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#0b66ff]">
              <MessageCircleIcon className="size-4" />
            </span>
            <span>Mesajlaşma</span>
          </div>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-[#71809f]">
            Qəbul prosesi ilə bağlı yazışmalar
          </p>
        </div>
        <Badge className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-black text-[#0b66ff]">
          {messages.length}
        </Badge>
      </div>

      <div className="max-h-[360px] space-y-2 overflow-y-auto px-3 py-3">
        {messages.length > 0 ? (
          messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              own={message.senderPortalType === viewer}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#dce6f4] bg-[#f8fbff] px-4 py-5 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#1559b7]">
              <MessageCircleIcon className="size-4" />
            </div>
            <div className="mt-2 text-sm font-black text-[#07183a]">
              Mesaj yoxdur
            </div>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#637392]">
              İlk mesajı yazın, söhbət burada görünəcək.
            </p>
          </div>
        )}
      </div>

      <form
        action={sendStudentChatMessageAction}
        className="border-t border-[#edf2f8] bg-[#fbfdff] p-2"
      >
        <input name="studentId" type="hidden" value={studentId} />
        <input name="returnTo" type="hidden" value={returnTo} />
        {applicationId ? (
          <input name="applicationId" type="hidden" value={applicationId} />
        ) : null}
        <label className="sr-only" htmlFor={`student-message-${studentId}`}>
          Mesaj yaz
        </label>
        <div className="flex items-end gap-2 rounded-2xl border border-[#dce6f4] bg-white p-1.5 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition focus-within:border-[#0b66ff] focus-within:ring-4 focus-within:ring-[#0b66ff]/10">
          <textarea
            className="max-h-24 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm font-semibold leading-5 text-[#07183a] outline-none placeholder:text-[#9aa6bd] focus:ring-0"
            id={`student-message-${studentId}`}
            maxLength={1200}
            name="body"
            placeholder="Mesaj yazın..."
            required
            rows={1}
          />
          <SendMessageButton />
        </div>
      </form>
    </section>
  );
}

export function FloatingStudentChatPanel(props: StudentChatPanelProps) {
  const searchParams = useSearchParams();
  const shouldOpenFromUrl = searchParams.get("chat") === "open";
  const [isOpen, setIsOpen] = useState(shouldOpenFromUrl);
  const incomingCount = props.messages.filter(
    (message) => message.senderPortalType !== props.viewer,
  ).length;
  const badgeLabel = incomingCount > 9 ? "9+" : String(incomingCount);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
      {isOpen ? (
        <div className="relative w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[1.35rem] border border-[#dce6f4] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <Button
            aria-label="Mesajları bağla"
            className="absolute right-2 top-2 z-10 size-8 rounded-xl border-[#dce6f4] bg-white/95 text-[#637392] shadow-sm hover:bg-[#eef5ff] hover:text-[#0b66ff]"
            onClick={() => setIsOpen(false)}
            size="icon"
            type="button"
            variant="outline"
          >
            <XIcon className="size-4" />
          </Button>
          <StudentChatPanel
            {...props}
            className="max-h-[min(620px,calc(100vh-8.5rem))] rounded-none border-0 shadow-none"
          />
        </div>
      ) : null}

      <button
        aria-label={isOpen ? "Mesajları bağla" : "Mesajlaşmanı aç"}
        aria-expanded={isOpen}
        className="relative flex size-14 items-center justify-center rounded-full bg-[#0b66ff] text-white shadow-[0_18px_42px_rgba(37,99,235,0.34)] transition hover:-translate-y-0.5 hover:bg-[#075be8] focus:outline-none focus:ring-4 focus:ring-[#0b66ff]/20"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <MessageCircleIcon className="size-6" />
        {incomingCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-6 items-center justify-center rounded-full border-2 border-white bg-[#ef405d] px-1.5 py-0.5 text-[11px] font-black leading-none text-white">
            {badgeLabel}
          </span>
        ) : null}
      </button>
    </div>
  );
}

function SendMessageButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-label="Mesaj göndər"
      className="h-10 shrink-0 rounded-xl bg-[#0b66ff] px-3 text-xs font-black shadow-[0_8px_18px_rgba(37,99,235,0.24)] hover:bg-[#075be8] disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      <SendIcon className="size-4" />
      <span className="hidden sm:inline">{pending ? "..." : "Göndər"}</span>
    </Button>
  );
}

function ChatBubble({
  message,
  own,
}: {
  message: StudentChatMessage;
  own: boolean;
}) {
  return (
    <div className={cn("flex gap-1.5", own ? "justify-end" : "justify-start")}>
      {!own ? (
        <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ff] text-[#1559b7]">
          <UserRoundIcon className="size-3.5" />
        </div>
      ) : null}
      <div
        className={cn(
          "max-w-[84%] rounded-2xl border px-3 py-1.5",
          own
            ? "border-blue-100 bg-[#0b66ff] text-white"
            : "border-[#dce6f4] bg-[#f8fbff] text-[#07183a]",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-black">
          <span>{message.authorName}</span>
          <span className={own ? "text-white/75" : "text-[#8a97b4]"}>
            {message.authorRole}
          </span>
        </div>
        <p className="mt-0.5 whitespace-pre-line text-sm font-semibold leading-5">
          {message.body}
        </p>
        <div
          className={cn(
            "mt-1 text-[10px] font-bold",
            own ? "text-white/70" : "text-[#8a97b4]",
          )}
        >
          {message.createdAt}
        </div>
      </div>
    </div>
  );
}
