"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { GraduationCapIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AgentStudentSummary } from "@/features/agents/types";
import { redeemAgentBursAction } from "@/features/commissions/burs-actions";
import type { AgentBursWallet } from "@/features/commissions/burs-types";
import { cn } from "@/lib/utils";

const bursMessages: Record<string, string> = {
  "burs-agreement-missing": "Təsdiqlənmiş komissiya paket müqaviləsi tapılmadı.",
  "burs-failed": "Burs təyinatı saxlanıla bilmədi.",
  "burs-forbidden": "Bu əməliyyat üçün icazəniz yoxdur.",
  "burs-insufficient": "Kifayət qədər burs xalı yoxdur.",
  "burs-redeemed": "Burs təyin olundu və tələbə portal üçün hazırlandı.",
  "burs-student-already": "Bu tələbəyə artıq burs təyin edilib.",
  "burs-student-missing": "Tələbə tapılmadı və ya agentə bağlı deyil.",
  "burs-target-invalid": "Seçilmiş pillə/ixtisas paket tərkibində yoxdur.",
  "burs-validation": "Tələbə və burs hədəfini seçin.",
};

export function AgentBursWalletCard({
  agentId,
  error,
  returnTo,
  students,
  success,
  wallet,
}: {
  agentId: string;
  error?: string;
  returnTo: string;
  students: AgentStudentSummary[];
  success?: string;
  wallet: AgentBursWallet;
}) {
  const [targetKey, setTargetKey] = useState(wallet.targets[0]?.label ?? "");
  const selectedTarget = useMemo(
    () => wallet.targets.find((item) => item.label === targetKey) ?? null,
    [targetKey, wallet.targets],
  );
  const feedback = error || success;
  const feedbackText = feedback ? bursMessages[feedback] : null;

  return (
    <section className="rounded-2xl border border-[#dbe5f1] bg-white">
      <div className="border-b border-[#e8eef5] px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-black text-[#102442]">
          <GraduationCapIcon className="size-4 text-[#0b66ff]" />
          Qazanılmış burslar
        </h2>
        <p className="mt-1 text-xs leading-5 text-[#71809a]">
          {wallet.packageName
            ? `${wallet.packageName} şərtlərinə görə burs xalı`
            : "Təsdiqlənmiş paket müqaviləsi olduqda burs xalı hesablanır"}
        </p>
      </div>

      <div className="grid gap-3 px-5 py-4 sm:grid-cols-3">
        <Metric label="Qazanılan" value={wallet.earnedPoints} />
        <Metric label="İstifadə" value={wallet.spentPoints} />
        <Metric accent label="Qalıq xal" value={wallet.availablePoints} />
      </div>

      {feedbackText ? (
        <div
          className={cn(
            "mx-5 mb-3 rounded-xl border px-3 py-2 text-xs font-semibold",
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {feedbackText}
        </div>
      ) : null}

      {wallet.packageAgreementId && wallet.targets.length > 0 ? (
        <form
          action={redeemAgentBursAction}
          className="space-y-3 border-t border-[#edf2f7] px-5 py-4"
        >
          <input name="agentId" type="hidden" value={agentId} />
          <input
            name="packageAgreementId"
            type="hidden"
            value={wallet.packageAgreementId}
          />
          <input name="returnTo" type="hidden" value={returnTo} />
          {selectedTarget ? (
            <>
              <input
                name="educationLevel"
                type="hidden"
                value={selectedTarget.educationLevel}
              />
              {selectedTarget.programId ? (
                <input
                  name="programId"
                  type="hidden"
                  value={selectedTarget.programId}
                />
              ) : null}
            </>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-[#8190a8]">
              Tələbə
            </span>
            <select
              className="h-10 w-full rounded-xl border border-[#d7e1ee] bg-white px-3 text-xs font-semibold text-[#253d67]"
              name="studentId"
              required
            >
              <option value="">Seçin</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-[#8190a8]">
              Burs hədəfi
            </span>
            <select
              className="h-10 w-full rounded-xl border border-[#d7e1ee] bg-white px-3 text-xs font-semibold text-[#253d67]"
              onChange={(event) => setTargetKey(event.target.value)}
              required
              value={targetKey}
            >
              {wallet.targets.map((target) => (
                <option key={target.label} value={target.label}>
                  {target.label} · {formatPoints(target.pointsCost)} xal
                </option>
              ))}
            </select>
          </label>

          {selectedTarget ? (
            <p className="rounded-xl border border-[#d7e8ff] bg-[#f3f8ff] px-3 py-2 text-xs font-semibold leading-5 text-[#0b61e8]">
              Bu ixtisasda şəxsə burs vermək üçün{" "}
              <strong>{formatPoints(selectedTarget.pointsCost)} burs xalı</strong>{" "}
              istifadə olunacaq. Razılaşıb təsdiqləsəniz xal çıxacaq və tələbə
              portal üçün hazırlanacaq.
            </p>
          ) : null}

          <SubmitButton
            disabled={
              !selectedTarget ||
              wallet.availablePoints < (selectedTarget?.pointsCost ?? 0) ||
              students.length === 0
            }
          />
        </form>
      ) : (
        <p className="border-t border-[#edf2f7] px-5 py-4 text-xs font-semibold text-[#8190a8]">
          Burs təyin etmək üçün təsdiqlənmiş paket və tərkib lazımdır.
        </p>
      )}

      {wallet.recentRedemptions.length > 0 ? (
        <div className="border-t border-[#edf2f7]">
          <p className="px-5 py-3 text-[10px] font-black uppercase tracking-wide text-[#8190a8]">
            Son təyinatlar
          </p>
          <div className="divide-y divide-[#edf2f7]">
            {wallet.recentRedemptions.map((item) => (
              <div
                className="flex items-center justify-between gap-3 px-5 py-3 text-xs"
                key={item.id}
              >
                <span className="min-w-0">
                  <span className="block truncate font-bold text-[#102442]">
                    {item.studentName}
                  </span>
                  <span className="mt-0.5 block truncate text-[#71809a]">
                    {item.programName ?? item.educationLevel}
                  </span>
                </span>
                <span className="shrink-0 font-bold tabular-nums text-[#0b66ff]">
                  −{formatPoints(item.pointsCost)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Metric({
  accent,
  label,
  value,
}: {
  accent?: boolean;
  label: string;
  value: number;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5",
        accent
          ? "border-[#bfd6ff] bg-[#f3f8ff]"
          : "border-[#e5edf6] bg-[#fbfdff]",
      )}
    >
      <p className="text-[10px] font-bold uppercase text-[#8190a8]">{label}</p>
      <p className="mt-0.5 text-lg font-black tabular-nums text-[#102442]">
        {formatPoints(value)}
      </p>
    </div>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      className="h-10 w-full rounded-xl text-xs font-bold"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Təsdiqlənir..." : "Razıyam — bursu təyin et"}
    </Button>
  );
}

function formatPoints(value: number) {
  return new Intl.NumberFormat("az-AZ", {
    maximumFractionDigits: 2,
  }).format(value);
}
