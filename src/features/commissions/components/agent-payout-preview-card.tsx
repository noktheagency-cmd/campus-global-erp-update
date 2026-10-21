import type { AgentPayoutPreview } from "@/features/commissions/agent-payout-preview";

function money(value: number, currency: string) {
  return `${new Intl.NumberFormat("az-AZ", { maximumFractionDigits: 2 }).format(value)} ${currency}`;
}

export function AgentPayoutPreviewCard({
  preview,
}: {
  preview: AgentPayoutPreview;
}) {
  const { account, cash, currency, rates } = preview;
  const rows: Array<{
    account: string;
    cash: string;
    label: string;
    strong?: boolean;
  }> = [
    {
      account: money(account.gross, currency),
      cash: money(cash.gross, currency),
      label: "Ümumi komissiya",
    },
    {
      account:
        account.educationTax > 0
          ? `− ${money(account.educationTax, currency)}`
          : "—",
      cash: "—",
      label: `Təhsil vergisi (${rates.educationTaxRate}%)`,
    },
    {
      account: account.vat > 0 ? `− ${money(account.vat, currency)}` : "—",
      cash: "—",
      label: `KDV (${rates.vatRate}%)`,
    },
    {
      account: account.azv > 0 ? `− ${money(account.azv, currency)}` : "—",
      cash: "—",
      label: `AZV (${rates.azvRate}%)`,
    },
    {
      account: money(account.net, currency),
      cash: money(cash.net, currency),
      label: "Əldə ediləcək məbləğ",
      strong: true,
    },
  ];

  return (
    <section className="rounded-[1.15rem] border border-[#dce6f4] bg-white p-4 shadow-[0_14px_38px_rgba(29,78,216,0.045)]">
      <h3 className="text-sm font-bold text-[#17325b]">
        Komissiya: nağd və hesabla çıxarış
      </h3>
      <p className="mt-1 text-xs text-[#6a7d9c]">
        {preview.universityName} · {preview.programName}
        {preview.isEstimate
          ? " · Məbləğ ixtisasın təhsil haqqına görə təxminidir."
          : ""}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <ChannelBadge
          active={preview.cashPayoutActive}
          label="Nağd"
        />
        <ChannelBadge
          active={preview.accountPayoutActive}
          label="Hesabla"
        />
        {preview.holdInAccount ? (
          <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            Hesabda saxlanılır
          </span>
        ) : null}
      </div>
      <div className="mt-3 overflow-x-auto rounded-xl border border-[#dbe4ef]">
        <table className="w-full min-w-[420px] text-xs">
          <thead>
            <tr className="bg-[#f9fbfe] text-left text-[10px] font-bold text-[#6a7d9c]">
              <th className="px-3 py-2">Göstərici</th>
              <th className="px-3 py-2 text-right">
                Nağd
                {!preview.cashPayoutActive ? " (bağlı)" : ""}
              </th>
              <th className="px-3 py-2 text-right">
                Hesabla
                {!preview.accountPayoutActive ? " (bağlı)" : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                className={`border-t border-[#e8eef5] ${
                  row.strong
                    ? "bg-[#f3f8ff] font-bold text-[#17325b]"
                    : "text-[#3d5276]"
                }`}
                key={row.label}
              >
                <td className="px-3 py-2">{row.label}</td>
                <td
                  className={`px-3 py-2 text-right tabular-nums ${
                    preview.cashPayoutActive ? "" : "opacity-40"
                  }`}
                >
                  {row.cash}
                </td>
                <td
                  className={`px-3 py-2 text-right tabular-nums ${
                    preview.accountPayoutActive ? "" : "opacity-40"
                  }`}
                >
                  {row.account}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-[#7688a6]">
        Ödəniş müddəti:{" "}
        {preview.paymentTermDays === 0
          ? "dərhal"
          : `${preview.paymentTermDays} gün`}
        .
      </p>
    </section>
  );
}

function ChannelBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={
        active
          ? "rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
          : "rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2 py-0.5 text-[10px] font-bold text-[#94a3b8]"
      }
    >
      {label}: {active ? "aktiv" : "bağlı"}
    </span>
  );
}
