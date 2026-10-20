"use client";

import { useActionState, useId, useState } from "react";
import {
  CheckCircle2Icon,
  PaperclipIcon,
  PlusIcon,
  UploadCloudIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSupportTicketAction } from "@/features/support/actions";
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_PRIORITY_LABELS,
  SUPPORT_RELATED_MODULES,
} from "@/features/support/constants";
import type { SupportActionState } from "@/features/support/types";

const INITIAL_STATE: SupportActionState = { message: "", status: "idle" };

export function NewSupportTicketDialog({ returnTo }: { returnTo: string }) {
  const fileInputId = useId();
  const [fileName, setFileName] = useState("");
  const [state, formAction, pending] = useActionState(
    createSupportTicketAction,
    INITIAL_STATE,
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-xl bg-[#0b66ff] px-4 text-xs font-black shadow-[0_10px_24px_rgba(11,102,255,0.22)] hover:bg-[#075be8]">
          <PlusIcon data-icon="inline-start" />
          Yeni ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-2rem)] w-[680px] max-w-[calc(100%-1.5rem)] gap-0 overflow-y-auto rounded-[1.75rem] border border-[#dbe6f4] bg-white p-0 shadow-[0_28px_90px_rgba(9,30,66,0.22)] sm:max-w-[680px]">
        <form action={formAction}>
          <input name="returnTo" type="hidden" value={returnTo} />
          <DialogHeader className="px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
            <DialogTitle className="text-xl font-black tracking-tight text-[#07183a] sm:text-2xl">
              Yeni ticket aç
            </DialogTitle>
            <DialogDescription className="text-xs font-medium leading-5 text-[#667798] sm:text-sm">
              Problemi ətraflı təsvir edin, dəstək komandası sizə daha tez kömək
              etsin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 pb-5 sm:px-6">
            <SupportField
              error={state.fieldErrors?.subject?.[0]}
              label="Mövzu"
              required
            >
              <Input
                aria-label="Mövzu"
                autoFocus
                className="h-11 rounded-xl border-[#d9e4f2] bg-[#fbfdff] px-3 text-sm font-semibold placeholder:font-medium placeholder:text-[#98a5bb]"
                maxLength={160}
                name="subject"
                placeholder="Problemi qısa şəkildə yazın"
                required
              />
            </SupportField>

            <div className="grid gap-4 sm:grid-cols-2">
              <SupportField
                error={state.fieldErrors?.category?.[0]}
                label="Kateqoriya"
                required
              >
                <Select defaultValue="TECHNICAL" name="category">
                  <SelectTrigger
                    aria-label="Kateqoriya"
                    className="h-11 w-full rounded-xl border-[#d9e4f2] bg-[#fbfdff] px-3 text-sm font-bold text-[#24375f]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUPPORT_CATEGORY_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </SupportField>
              <SupportField
                error={state.fieldErrors?.priority?.[0]}
                label="Prioritet"
                required
              >
                <Select defaultValue="MEDIUM" name="priority">
                  <SelectTrigger
                    aria-label="Prioritet"
                    className="h-11 w-full rounded-xl border-[#d9e4f2] bg-[#fbfdff] px-3 text-sm font-bold text-[#24375f]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUPPORT_PRIORITY_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </SupportField>
            </div>

            <SupportField
              error={state.fieldErrors?.description?.[0]}
              label="Təsvir"
              required
            >
              <Textarea
                aria-label="Təsvir"
                className="min-h-28 resize-y rounded-xl border-[#d9e4f2] bg-[#fbfdff] px-3 py-3 text-sm font-medium leading-6 placeholder:text-[#98a5bb]"
                maxLength={5000}
                name="description"
                placeholder="Nə baş verdi, hansı səhifədə və hansı addımlardan sonra problem yarandı?"
                required
              />
            </SupportField>

            <SupportField label="Əlaqəli bölmə">
              <Select defaultValue="applications" name="relatedModule">
                <SelectTrigger
                  aria-label="Əlaqəli bölmə"
                  className="h-11 w-full rounded-xl border-[#d9e4f2] bg-[#fbfdff] px-3 text-sm font-bold text-[#24375f]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_RELATED_MODULES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SupportField>

            <SupportField
              error={state.fieldErrors?.attachment?.[0]}
              label="Fayl"
            >
              <input
                accept=".png,.jpg,.jpeg,.pdf,application/pdf,image/png,image/jpeg"
                className="sr-only"
                id={fileInputId}
                name="attachment"
                onChange={(event) =>
                  setFileName(event.target.files?.[0]?.name ?? "")
                }
                type="file"
              />
              <label
                className="flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-[#cbd9ec] bg-[#fbfdff] px-4 py-3 text-center transition hover:border-[#7eb4ff] hover:bg-[#f6faff]"
                htmlFor={fileInputId}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#d9e5f5] bg-white text-[#0b66ff]">
                  {fileName ? (
                    <PaperclipIcon className="size-5" />
                  ) : (
                    <UploadCloudIcon className="size-5" />
                  )}
                </span>
                <span className="min-w-0 text-left">
                  <span className="block truncate text-xs font-black text-[#24375f] sm:text-sm">
                    {fileName || "Faylları bura atın və ya seçin"}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-medium text-[#7a89a5]">
                    PNG, JPG, PDF · maksimum 10 MB
                  </span>
                </span>
              </label>
            </SupportField>

            <div className="flex gap-3 rounded-2xl border border-[#d7e4f8] bg-[#f5f9ff] p-3.5">
              <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-[#0b66ff]" />
              <div>
                <p className="text-xs font-black text-[#19325e]">
                  Dəqiq məlumat daha sürətli həll deməkdir.
                </p>
                <p className="mt-1 text-[11px] font-medium leading-5 text-[#667798]">
                  Xəta mesajını, ekran görüntüsünü və gözlədiyiniz nəticəni
                  əlavə edin.
                </p>
              </div>
            </div>

            {state.status === "error" ? (
              <p
                aria-live="polite"
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700"
              >
                {state.message}
              </p>
            ) : null}
          </div>

          <DialogFooter className="sticky bottom-0 z-10 mx-0 mb-0 rounded-b-[1.75rem] border-[#e2eaf5] bg-[#f8faff] px-5 py-4 sm:px-6">
            <DialogClose asChild>
              <Button
                className="h-10 rounded-xl border-[#d9e3f0] bg-white px-5 text-xs font-black text-[#34456c] hover:bg-[#f5f8fd]"
                type="button"
                variant="outline"
              >
                Ləğv et
              </Button>
            </DialogClose>
            <Button
              className="h-10 rounded-xl bg-[#0b66ff] px-5 text-xs font-black shadow-[0_8px_20px_rgba(11,102,255,0.2)] hover:bg-[#075be8]"
              disabled={pending}
              type="submit"
            >
              {pending ? "Yaradılır..." : "Ticket yarat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SupportField({
  children,
  error,
  label,
  required = false,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="block space-y-1.5">
      <span className="text-xs font-black text-[#25385f]">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {children}
      {error ? (
        <span className="block text-[11px] font-bold text-red-600">
          {error}
        </span>
      ) : null}
    </div>
  );
}
