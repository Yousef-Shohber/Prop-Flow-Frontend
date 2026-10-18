import { CalendarClock } from "lucide-react";
import { useI18n } from "@/i18n";
import { diffDays, todayISO } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LeaseStatus } from "@/types/enums";

/** Day X of Y, days left (amber when 30 or fewer), "starts in N days" for a lease that has not started. */
export function LeaseProgress({
  start,
  end,
  status,
  className,
}: {
  start: string;
  end: string;
  status: LeaseStatus | string;
  className?: string;
}) {
  const { t, lang } = useI18n();
  if (status !== "ACTIVE" && status !== "PENDING") return null;
  const today = todayISO();
  const total = Math.max(1, diffDays(start, end) + 1);
  const n = (v: number) => formatNumber(v, lang);

  if (diffDays(today, start) > 0) {
    const d = diffDays(today, start);
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 text-sm text-muted",
          className,
        )}
      >
        <CalendarClock className="size-4 shrink-0" aria-hidden />
        <span>{t("lp.startsIn", { n: n(d) })}</span>
      </div>
    );
  }
  if (diffDays(end, today) > 0) return null; // period already ended

  const day = Math.min(total, diffDays(start, today) + 1);
  const left = diffDays(today, end);
  const pct = Math.round((day / total) * 100);
  const soon = left <= 30;
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
        <span className="font-medium">
          {t("lp.dayOf", { x: n(day), y: n(total) })}
        </span>
        <span
          className={cn(
            "font-medium",
            soon ? "text-[var(--amber-fg)]" : "text-muted",
          )}
        >
          {left === 0 ? t("lp.lastDay") : t("lp.left", { n: n(left) })}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={t("lp.dayOf", { x: n(day), y: n(total) })}
        className="h-2.5 overflow-hidden rounded-full bg-surface-3"
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(3, pct)}%`,
            background: soon ? "var(--amber-dot)" : "var(--accent)",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        />
      </div>
    </div>
  );
}
