import type {
  DashboardDestination,
  DashboardTrendPoint,
} from "@/features/dashboard/types";

const CHART_WIDTH = 1_000;
const CHART_HEIGHT = 180;
const CHART_PADDING = 10;

export function SparklineChart({
  color,
  gradientId,
  values,
}: {
  color: string;
  gradientId: string;
  values: number[];
}) {
  const points = getNormalizedPoints(values, 100, 38, 2);
  const linePath = buildSmoothPath(points);
  const areaPath = buildAreaPath(points, 38);
  const currentValue = values.at(-1) ?? 0;

  return (
    <svg
      aria-label={`Trend, son göstərici ${formatInteger(currentValue)}`}
      className="h-full w-full"
      preserveAspectRatio="none"
      role="img"
      viewBox="0 0 100 38"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
      {linePath ? (
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
}

export function ApplicationsOverviewChart({
  data,
}: {
  data: DashboardTrendPoint[];
}) {
  const maximum = Math.max(
    1,
    ...data.flatMap((point) => [point.applications, point.offers, point.visas]),
  );
  const series = [
    {
      color: "#0b66ff",
      key: "applications" as const,
      label: "Müraciətlər",
    },
    {
      color: "#23bf62",
      key: "offers" as const,
      label: "Təklif məktubları",
    },
    {
      color: "#7c3aed",
      key: "visas" as const,
      label: "Viza müraciətləri",
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col" data-chart="applications">
      <svg
        aria-label="Müraciətlər, təklif məktubları və viza müraciətləri trendi"
        className="min-h-0 flex-1 overflow-visible"
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        <title>Müraciətlər üzrə dövr trendi</title>
        {Array.from({ length: 5 }, (_, index) => {
          const y = CHART_PADDING +
            ((CHART_HEIGHT - CHART_PADDING * 2) * index) / 4;
          return (
            <line
              key={index}
              stroke="#e8eef6"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              x1="0"
              x2={CHART_WIDTH}
              y1={y}
              y2={y}
            />
          );
        })}
        {series.map((item) => {
          const values = data.map((point) => point[item.key]);
          const points = getScaledPoints(values, maximum);
          return (
            <path
              d={buildSmoothPath(points)}
              fill="none"
              key={item.key}
              stroke={item.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {data.map((point, index) => {
          const sliceWidth = CHART_WIDTH / Math.max(1, data.length);
          return (
            <rect
              fill="transparent"
              height={CHART_HEIGHT}
              key={`${point.label}-${index}`}
              width={sliceWidth}
              x={sliceWidth * index}
              y="0"
            >
              <title>{`${point.label}: ${formatInteger(point.applications)} müraciət, ${formatInteger(point.offers)} təklif, ${formatInteger(point.visas)} viza`}</title>
            </rect>
          );
        })}
      </svg>
      <ChartLabels labels={data.map((point) => point.label)} />
    </div>
  );
}

export function DestinationChart({
  data,
}: {
  data: DashboardDestination[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const segments = data.map((item, index) => {
    const share = total ? (item.value / total) * 100 : 0;
    const offset = data
      .slice(0, index)
      .reduce(
        (sum, previous) =>
          sum + (total ? (previous.value / total) * 100 : 0),
        0,
      );

    return { dash: Math.max(0, share - 0.8), item, offset };
  });

  return (
    <div className="relative h-full min-h-[190px] w-full">
      <svg
        aria-label={`Ən çox seçilən ölkələr, ümumi ${formatInteger(total)}`}
        className="h-full w-full"
        role="img"
        viewBox="0 0 180 180"
      >
        <title>Ən çox seçilən ölkələr</title>
        <circle
          cx="90"
          cy="90"
          fill="none"
          r="61"
          stroke="#edf2f8"
          strokeWidth="28"
        />
        {segments.map(({ dash, item, offset }) => {
          return (
            <circle
              cx="90"
              cy="90"
              fill="none"
              key={item.country}
              pathLength="100"
              r="61"
              stroke={item.color}
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              strokeWidth="28"
              transform="rotate(-90 90 90)"
            >
              <title>{`${item.country}: ${formatInteger(item.value)} (${item.share}%)`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold tracking-[-0.04em] text-[#071938]">
          {formatInteger(total)}
        </span>
        <span className="mt-0.5 text-[11px] font-medium text-[#7b89a6]">
          Ümumi
        </span>
      </div>
    </div>
  );
}

export function RevenueChart({
  currency,
  data,
}: {
  currency: string;
  data: DashboardTrendPoint[];
}) {
  const maximum = Math.max(1, ...data.map((point) => point.revenue));
  const slotWidth = CHART_WIDTH / Math.max(1, data.length);
  const barWidth = slotWidth * 0.56;

  return (
    <div className="flex h-full min-h-0 flex-col" data-chart="revenue">
      <svg
        aria-label="Dövriyyə dinamikası"
        className="min-h-0 flex-1"
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        <title>Dövriyyə dinamikası</title>
        <defs>
          <linearGradient id="dashboard-revenue-bars" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0b66ff" />
            <stop offset="100%" stopColor="#6fa7ff" />
          </linearGradient>
        </defs>
        {Array.from({ length: 4 }, (_, index) => {
          const y = CHART_PADDING +
            ((CHART_HEIGHT - CHART_PADDING * 2) * index) / 3;
          return (
            <line
              key={index}
              stroke="#e8eef6"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              x1="0"
              x2={CHART_WIDTH}
              y1={y}
              y2={y}
            />
          );
        })}
        {data.map((point, index) => {
          const height =
            (point.revenue / maximum) * (CHART_HEIGHT - CHART_PADDING * 2);
          const x = index * slotWidth + (slotWidth - barWidth) / 2;
          const y = CHART_HEIGHT - CHART_PADDING - height;

          return (
            <rect
              fill="url(#dashboard-revenue-bars)"
              height={Math.max(2, height)}
              key={`${point.label}-${index}`}
              rx="5"
              width={barWidth}
              x={x}
              y={y}
            >
              <title>{`${point.label}: ${formatMoney(point.revenue, currency)}`}</title>
            </rect>
          );
        })}
      </svg>
      <ChartLabels labels={data.map((point) => point.label)} />
    </div>
  );
}

function ChartLabels({ labels }: { labels: string[] }) {
  const visibleLabels = getVisibleLabels(labels, 5);

  return (
    <div
      aria-hidden
      className="mt-1 flex shrink-0 justify-between text-[10px] font-medium text-[#71809f]"
    >
      {visibleLabels.map((item) => (
        <span key={`${item.index}-${item.label}`}>{item.label}</span>
      ))}
    </div>
  );
}

function getVisibleLabels(labels: string[], limit: number) {
  if (labels.length <= limit) {
    return labels.map((label, index) => ({ index, label }));
  }

  const lastIndex = labels.length - 1;
  return Array.from({ length: limit }, (_, index) => {
    const labelIndex = Math.round((index / (limit - 1)) * lastIndex);
    return { index: labelIndex, label: labels[labelIndex] ?? "" };
  });
}

function getScaledPoints(values: number[], maximum: number) {
  const height = CHART_HEIGHT - CHART_PADDING * 2;
  return values.map((value, index) => ({
    x:
      values.length <= 1
        ? CHART_WIDTH / 2
        : (index / (values.length - 1)) * CHART_WIDTH,
    y: CHART_HEIGHT - CHART_PADDING - (value / maximum) * height,
  }));
}

function getNormalizedPoints(
  values: number[],
  width: number,
  height: number,
  padding: number,
) {
  if (!values.length) return [];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;

  return values.map((value, index) => ({
    x: values.length <= 1 ? width / 2 : (index / (values.length - 1)) * width,
    y: padding + ((maximum - value) / range) * (height - padding * 2),
  }));
}

function buildSmoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const midX = (previous.x + point.x) / 2;
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}

function buildAreaPath(points: Array<{ x: number; y: number }>, height: number) {
  if (!points.length) return "";
  const line = buildSmoothPath(points);
  const first = points[0];
  const last = points.at(-1)!;
  return `${line} L ${last.x} ${height} L ${first.x} ${height} Z`;
}

function formatMoney(value: number, currency: string) {
  const symbols: Record<string, string> = {
    AUD: "A$",
    AZN: "₼",
    CAD: "C$",
    EUR: "€",
    GBP: "£",
    USD: "$",
  };

  return `${symbols[currency] ?? `${currency} `}${formatCompactNumber(value)}`;
}

function formatCompactNumber(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `${formatDecimal(value / 1_000_000)}M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `${formatDecimal(value / 1_000)}K`;
  }

  return formatInteger(value);
}

function formatInteger(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatDecimal(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return rounded.toString().replace(".", ",");
}
