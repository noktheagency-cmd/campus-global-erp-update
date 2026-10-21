"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAgentPayoutSettingsAction } from "@/features/agents/actions";
import type { AgentPortalProfil } from "@/features/agents/types";
import { cn } from "@/lib/utils";

export function AgentPayoutSettingsForm({
  agent,
  error,
  success,
}: {
  agent: AgentPortalProfil;
  error?: string;
  success?: string;
}) {
  return (
    <form action={updateAgentPayoutSettingsAction} className="space-y-1">
      <input name="agentId" type="hidden" value={agent.id} />
      <input name="returnTo" type="hidden" value={`/agents/${agent.id}`} />

      <PayoutFeedback error={error} success={success} />

      <ToggleRow
        defaultChecked={agent.cashPayoutActive}
        description="Nağd çıxarış kanallı aktiv olsun"
        label="Nağd ödəniş"
        name="cashPayoutActive"
      />
      <ToggleRow
        defaultChecked={agent.accountPayoutActive}
        description="Hesabla çıxarış aktiv olsun"
        label="Hesaba köçürmə"
        name="accountPayoutActive"
      />
      <ToggleRow
        defaultChecked={agent.holdInAccount}
        description="Komissiya hesabda saxlanılsın, birbaşa ödənilməsin"
        label="Hesabda saxla"
        name="holdInAccount"
      />
      <ToggleRow
        defaultChecked={agent.manualPayoutManagement}
        description="Nağd/hesab məbləğləri əl ilə idarə olunsun"
        label="Əll idarəetmə"
        name="manualPayoutManagement"
      />

      <div className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#31486b]">Ödəniş faizi</p>
          <p className="mt-0.5 text-[11px] text-[#8190a8]">
            Ödəniləcək hissə (%); qalanı hesabda saxlanılır
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            className="h-9 w-20 rounded-lg border-[#d7e1ee] text-right text-sm tabular-nums"
            defaultValue={agent.payoutPercentage}
            max={100}
            min={0}
            name="payoutPercentage"
            required
            step="0.01"
            type="number"
          />
          <span className="text-xs font-bold text-[#526482]">%</span>
        </div>
      </div>

      <div className="border-t border-[#edf2f7] pt-3 pb-1">
        <SubmitButton />
      </div>
    </form>
  );
}

function ToggleRow({
  defaultChecked,
  description,
  label,
  name,
}: {
  defaultChecked: boolean;
  description: string;
  label: string;
  name: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#31486b]">
          {label}
        </span>
        <span className="mt-0.5 block text-[11px] leading-4 text-[#8190a8]">
          {description}
        </span>
      </span>
      <input
        className="mt-1 size-4 shrink-0 rounded border-[#b7c6da] text-[#0b66ff] focus:ring-[#0b66ff]/30"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
        value="true"
      />
    </label>
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
      {pending ? "Saxlanılır..." : "Ödəniş ayarlarını saxla"}
    </Button>
  );
}

function PayoutFeedback({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  const payoutCodes = new Set([
    "payout-settings-failed",
    "payout-settings-saved",
    "payout-settings-validation",
  ]);
  const code = error || success;
  if (!code || !payoutCodes.has(code)) return null;

  const messages: Record<string, string> = {
    "payout-settings-failed": "Ödəniş ayarları saxlanıla bilmədi.",
    "payout-settings-saved": "Ödəniş ayarları yeniləndi.",
    "payout-settings-validation": "Ödəniş faizini 0–100 aralığında daxil edin.",
  };
  const isError = Boolean(error);

  return (
    <div
      className={cn(
        "mb-2 rounded-xl border px-3 py-2 text-xs font-semibold",
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {messages[code] ?? code}
    </div>
  );
}
