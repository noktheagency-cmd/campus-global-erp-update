const AZ_SHORT_MONTHS = [
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

const bakuDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Baku",
});

export function formatCrmDateTime(
  value: string | null,
  emptyLabel = "Təyin edilməyib",
) {
  if (!value) return emptyLabel;

  const parts = Object.fromEntries(
    bakuDateTimeFormatter
      .formatToParts(new Date(value))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const month = AZ_SHORT_MONTHS[Number(parts.month) - 1];

  return `${parts.day} ${month}, ${parts.hour}:${parts.minute}`;
}
