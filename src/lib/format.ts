import { env } from "./env";
import { parseISODate } from "./dates";

/** "IN_PROGRESS" -> "In progress" (fallback when no translation exists) */
export function formatEnum(value: string | null | undefined): string {
  if (!value) return "—";
  const s = value.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const localeTag = (lang: string) =>
  lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB";

export function formatDate(
  iso: string | null | undefined,
  lang = "en",
): string {
  if (!iso) return "—";
  const d = parseISODate(iso.slice(0, 10)) ?? new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(localeTag(lang), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(
  iso: string | null | undefined,
  lang = "en",
): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(localeTag(lang), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatRelative(iso: string, lang = "en"): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(localeTag(lang), { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of steps)
    if (Math.abs(diff) >= secs)
      return rtf.format(Math.round(diff / secs), unit);
  return rtf.format(Math.round(diff), "second");
}

export function formatMoney(
  amount: number | null | undefined,
  lang = "en",
): string {
  if (amount === null || amount === undefined) return "—";
  try {
    return new Intl.NumberFormat(localeTag(lang), {
      style: "currency",
      currency: env.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${new Intl.NumberFormat(localeTag(lang)).format(amount)} ${env.currency}`;
  }
}

export const formatNumber = (
  n: number,
  lang = "en",
  opts?: Intl.NumberFormatOptions,
) => new Intl.NumberFormat(localeTag(lang), opts).format(n);

/** hours -> "3 h" / "2 d 4 h"; null -> "—" */
export function formatHours(h: number | null | undefined, lang = "en"): string {
  if (h === null || h === undefined) return "—";
  const ar = lang === "ar";
  if (h < 1)
    return ar
      ? `${Math.max(1, Math.round(h * 60))} د`
      : `${Math.max(1, Math.round(h * 60))} min`;
  if (h < 48)
    return ar
      ? `${formatNumber(Math.round(h * 10) / 10, lang)} س`
      : `${formatNumber(Math.round(h * 10) / 10, lang)} h`;
  const d = Math.floor(h / 24);
  const rem = Math.round(h - d * 24);
  return ar ? `${d} يوم ${rem} س` : `${d} d ${rem} h`;
}

export const fullName = (
  u?: { firstName?: string; lastName?: string } | null,
) => (u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "");

export const initials = (
  u?: { firstName?: string; lastName?: string } | null,
) =>
  u
    ? `${(u.firstName ?? "").charAt(0)}${(u.lastName ?? "").charAt(0)}`.toUpperCase()
    : "";
