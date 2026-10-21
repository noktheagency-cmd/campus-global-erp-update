"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAgentPasswordAction } from "@/features/agents/actions";
import { cn } from "@/lib/utils";

export function AgentPasswordForm({
  agentId,
  error,
  success,
}: {
  agentId: string;
  error?: string;
  success?: string;
}) {
  const codes = new Set([
    "password-failed",
    "password-updated",
    "password-validation",
  ]);
  const code = error || success;
  const show = code && codes.has(code);
  const messages: Record<string, string> = {
    "password-failed": "Şifrə dəyişdirilə bilmədi.",
    "password-updated": "Agent şifrəsi yeniləndi.",
    "password-validation": "Şifrə ən azı 8 simvol olmalı və təsdiqlə eyni olmalıdır.",
  };

  return (
    <form action={updateAgentPasswordAction} className="space-y-3 px-5 py-4">
      <input name="agentId" type="hidden" value={agentId} />
      <input name="returnTo" type="hidden" value={`/agents/${agentId}`} />
      {show ? (
        <div
          className={cn(
            "rounded-xl border px-3 py-2 text-xs font-semibold",
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {messages[code] ?? code}
        </div>
      ) : null}
      <label className="block space-y-1.5">
        <span className="text-[10px] font-bold uppercase text-[#8190a8]">
          Yeni şifrə
        </span>
        <Input
          autoComplete="new-password"
          className="h-10 rounded-xl border-[#d7e1ee] text-sm"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-[10px] font-bold uppercase text-[#8190a8]">
          Şifrəni təsdiqlə
        </span>
        <Input
          autoComplete="new-password"
          className="h-10 rounded-xl border-[#d7e1ee] text-sm"
          minLength={8}
          name="confirmPassword"
          required
          type="password"
        />
      </label>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      className="h-9 w-full rounded-xl text-xs font-bold"
      disabled={pending}
      type="submit"
    >
      {pending ? "Yenilənir..." : "Şifrəni dəyiş"}
    </Button>
  );
}
