// Dates are strict YYYY-MM-DD strings end to end (spec §1). Never serialise a Date object.
const pad = (n: number) => String(n).padStart(2, "0");
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISODate(new Date());

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
/** `YYYY-MM-DD` compares correctly as a string. */
export const cmpDate = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
export const isPast = (s: string) => cmpDate(s, todayISO()) < 0;
export const withinWindow = (start: string, end: string, day = todayISO()) =>
  cmpDate(start, day) <= 0 && cmpDate(day, end) <= 0;
