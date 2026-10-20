"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatFinanceMoney } from "@/features/finance/format";
import type { FinanceChartPoint } from "@/features/finance/types";
import { cn } from "@/lib/utils";

export function FinanceCashFlowChart({
  chart,
  currency,
}: {
  chart: FinanceChartPoint[];
  currency: string;
}) {
  return (
    <BarChart
      data={chart}
      margin={{ bottom: 0, left: -15, right: 4, top: 8 }}
      responsive
      style={{ height: "100%", minWidth: 0, width: "100%" }}
    >
      <CartesianGrid stroke="#e8eef6" strokeDasharray="0" vertical={false} />
      <XAxis
        axisLine={false}
        dataKey="label"
        fontSize={11}
        stroke="#64759a"
        tickLine={false}
      />
      <YAxis
        axisLine={false}
        fontSize={11}
        stroke="#64759a"
        tickFormatter={(value) => `${Math.round(Number(value) / 1000)}K`}
        tickLine={false}
        width={46}
      />
      <ChartTooltip
        content={<FinanceChartTooltip currency={currency} />}
        cursor={{ fill: "#f4f7fb" }}
      />
      <Bar
        dataKey="income"
        fill="#09ad6b"
        maxBarSize={22}
        radius={[5, 5, 0, 0]}
      />
      <Bar
        dataKey="expense"
        fill="#ff4d52"
        maxBarSize={22}
        radius={[5, 5, 0, 0]}
      />
    </BarChart>
  );
}

function FinanceChartTooltip({
  active,
  currency,
  label,
  payload,
}: {
  active?: boolean;
  currency: string;
  label?: string;
  payload?: Array<{ dataKey: string; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#dce6f2] bg-white p-3 shadow-[0_12px_32px_rgba(31,65,123,0.16)]">
      <p className="text-xs font-bold text-[#1d345e]">{label}</p>
      {payload.map((item) => (
        <p
          className={cn(
            "mt-1 text-xs font-semibold",
            item.dataKey === "income" ? "text-[#00a566]" : "text-[#ef4048]",
          )}
          key={item.dataKey}
        >
          {item.dataKey === "income" ? "Gəlir" : "Xərc"}:{" "}
          {formatFinanceMoney(item.value, currency)}
        </p>
      ))}
    </div>
  );
}
