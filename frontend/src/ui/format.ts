// Local date-time formatting at minute precision (research R5).
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

export function formatDateTime(ms: number): string {
  return dateTimeFormat.format(new Date(ms));
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Value for <input type="datetime-local"> in local time, e.g. "2026-11-14T21:05". */
export function toDateTimeLocalValue(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parses a datetime-local value as local time. Returns NaN when empty or invalid. */
export function fromDateTimeLocalValue(value: string): number {
  if (!value) return NaN;
  return new Date(value).getTime();
}
