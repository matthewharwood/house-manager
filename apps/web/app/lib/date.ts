// Local-date helpers operating on "YYYY-MM-DD" strings (no time, no timezone
// drift). Tasks/cadence project onto these; the UI formats from them.

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso(): string {
  return toIso(new Date());
}

export function parseIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function addDays(iso: string, days: number): string {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

export function addMonths(iso: string, months: number): string {
  const date = parseIso(iso);
  date.setMonth(date.getMonth() + months);
  return toIso(date);
}

export function weekdayOf(iso: string): number {
  return parseIso(iso).getDay(); // 0 = Sunday … 6 = Saturday
}

export function startOfWeek(iso: string): string {
  return addDays(iso, -weekdayOf(iso));
}

export function startOfMonth(iso: string): string {
  const date = parseIso(iso);
  return toIso(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function daysInMonth(iso: string): number {
  const date = parseIso(iso);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

const SHORT_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"] as const;
export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function formatDayLabel(iso: string): string {
  const date = parseIso(iso);
  return `${SHORT_WEEKDAYS[date.getDay()]} ${date.getDate()}`;
}

export function formatLongDay(iso: string): string {
  const date = parseIso(iso);
  return `${SHORT_WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatMonthTitle(iso: string): string {
  const date = parseIso(iso);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
