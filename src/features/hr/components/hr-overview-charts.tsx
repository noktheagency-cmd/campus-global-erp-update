import type { HrDepartmentPoint, HrTrendPoint } from "@/features/hr/types";

const TREND_WIDTH = 700;
const TREND_HEIGHT = 250;
const TREND_PADDING = { bottom: 30, left: 38, right: 14, top: 12 };

type TrendKey = "headcount" | "joined" | "left";

const TREND_SERIES: Array<{
  color: string;
  dashed?: boolean;
  key: TrendKey;
  label: string;
}> = [
  { color: "#0b66ff", key: "headcount", label: "Əməkdaş sayı" },
  { color: "#17b26a", dashed: true, key: "joined", label: "Qoşulanlar" },
  { color: "#f04438", dashed: true, key: "left", label: "Ayrılanlar" },
];

export function HrTrendChart({ data }: { data: HrTrendPoint[] }) {
  if (!data.length) {
    return <ChartEmptyState label="Trend məlumatı yoxdur." />;
  }

  const plotWidth = TREND_WIDTH - TREND_PADDING.left - TREND_PADDING.right;
  const plotHeight = TREND_HEIGHT - TREND_PADDING.top - TREND_PADDING.bottom;
  const maximum = Math.max(
    1,
    ...data.flatMap((point) => [point.headcount, point.joined, point.left]),
  );
  const x = (index: number) =>
    TREND_PADDING.left +
    (data.length === 1
      ? plotWidth / 2
      : (index / (data.length - 1)) * plotWidth);
  const y = (value: number) =>
    TREND_PADDING.top + plotHeight - (value / maximum) * plotHeight;
  const gridLines = Array.from({ length: 5 }, (_, index) => {
    const value = Math.round(maximum - (maximum * index) / 4);
    return {
      value,
      y: TREND_PADDING.top + (plotHeight * index) / 4,
    };
  });

  return (
    <svg
      aria-label="Əməkdaş sayı, qoşulan və ayrılan əməkdaşların aylıq trendi"
      className="h-full w-full overflow-visible"
      preserveAspectRatio="none"
      role="img"
      viewBox={`0 0 ${TREND_WIDTH} ${TREND_HEIGHT}`}
    >
      <title>Əməkdaşların aylıq dəyişiklik trendi</title>
      {gridLines.map((line) => (
        <g key={`${line.value}-${line.y}`}>
          <line
            stroke="#e8eef6"
            x1={TREND_PADDING.left}
            x2={TREND_WIDTH - TREND_PADDING.right}
            y1={line.y}
            y2={line.y}
          />
          <text
            fill="#7181a0"
            fontSize="10"
            textAnchor="end"
            x={TREND_PADDING.left - 8}
            y={line.y + 3}
          >
            {line.value}
          </text>
        </g>
      ))}
      {data.map((point, index) => (
        <text
          fill="#7181a0"
          fontSize="10"
          key={`${point.label}-${index}`}
          textAnchor="middle"
          x={x(index)}
          y={TREND_HEIGHT - 7}
        >
          {point.label}
        </text>
      ))}
      {TREND_SERIES.map((series) => {
        const points = data
          .map((point, index) => `${x(index)},${y(point[series.key])}`)
          .join(" ");

        return (
          <g key={series.key}>
            <polyline
              fill="none"
              points={points}
              stroke={series.color}
              strokeDasharray={series.dashed ? "5 5" : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={series.key === "headcount" ? 2.2 : 1.6}
            />
            {data.map((point, index) => (
              <circle
                cx={x(index)}
                cy={y(point[series.key])}
                fill={series.color}
                key={`${series.key}-${point.label}-${index}`}
                r={series.key === "headcount" ? 3 : 2.5}
              >
                <title>{`${point.label} — ${series.label}: ${point[series.key]}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function HrDepartmentChart({ data }: { data: HrDepartmentPoint[] }) {
  const total = data.reduce((sum, department) => sum + department.count, 0);
  let cursor = 0;
  const segments = data.map((department) => {
    const start = cursor;
    cursor += total ? (department.count / total) * 100 : 0;
    return `${department.color} ${start}% ${cursor}%`;
  });

  return (
    <div
      aria-label={
        total
          ? `Departamentlər üzrə ${total} əməkdaşın bölgüsü`
          : "Departament bölgüsü məlumatı yoxdur"
      }
      className="relative size-full rounded-full"
      role="img"
      style={{
        background: total
          ? `conic-gradient(${segments.join(", ")})`
          : "#e8eef6",
      }}
    >
      <div className="absolute inset-[18%] rounded-full bg-white" />
      <span className="sr-only">
        {data
          .map(
            (department) => `${department.name}: ${department.count} əməkdaş`,
          )
          .join("; ")}
      </span>
    </div>
  );
}

function ChartEmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl bg-[#f6f9ff] text-xs font-medium text-[#7b89a5]">
      {label}
    </div>
  );
}
