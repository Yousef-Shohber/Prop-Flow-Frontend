import { env } from "./env";
// Dates are strict YYYY-MM-DD strings end to end (spec §1). Never serialise a Date object.
const pad = (n: number) => String(n).padStart(2, "0");
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** "Today" is decided in the business timezone (VITE_APP_TIMEZONE, default Africa/Cairo), never the device's. */
/** Calendar day (YYYY-MM-DD) of an instant in the business timezone. */
export const dayOfInstant = (iso: string): string => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso.slice(0, 10) : todayISO(d);
};
export const todayISO = (now: Date = new Date()): string => {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: env.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    if (/^\d{4}-\d{2}-\d{2}$/.test(parts)) return parts;
  } catch {
    /* invalid timezone: fall through */
  }
  return toISODate(now);
};

export function parseISODate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  // rejects 2026-02-31 style dates
  return date.getFullYear() === y &&
    date.getMonth() === mo - 1 &&
    date.getDate() === d
    ? date
    : null;
}
export const isValidISODate = (s: string) => parseISODate(s) !== null;

export function addDaysISO(s: string, days: number): string {
  const d = parseISODate(s);
  if (!d) return s;
  d.setDate(d.getDate() + days);
  return toISODate(d);
}
/** First day of the month of `iso`. */
export const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`;
/** First day of the month `n` months after (or before) the month of `iso`. */
export function addMonthsISO(iso: string, n: number): string {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-01`;
}
/** Whole days from a to b (b - a), calendar based so DST never shifts the count. */
export function diffDays(a: string, b: string): number {
  const pa = /^(\d{4})-(\d{2})-(\d{2})/.exec(a);
  const pb = /^(\d{4})-(\d{2})-(\d{2})/.exec(b);
  if (!pa || !pb) return 0;
  const ms = (m: RegExpExecArray) => Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return Math.round((ms(pb) - ms(pa)) / 86_400_000);
}
/** `YYYY-MM-DD` compares correctly as a string. */
export const cmpDate = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
export const isPast = (s: string) => cmpDate(s, todayISO()) < 0;
export const withinWindow = (start: string, end: string, day = todayISO()) =>
  cmpDate(start, day) <= 0 && cmpDate(day, end) <= 0;
