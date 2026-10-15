import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Total from the list endpoint's meta, shown next to the title. Rendered only once the API has answered. */
export function CountBadge({ n }: { n: number | undefined }) {
  const { lang } = useI18n();
  if (n === undefined) return null;
  return (
    <span className="num rounded-full bg-surface-3 px-2.5 py-0.5 text-sm font-medium text-muted">
      {formatNumber(n, lang)}
    </span>
  );
}

/** Page title block shared by every screen: optional icon tile, eyebrow, count badge, subtitle and actions. */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
  eyebrow,
  icon: Icon,
  badge,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  eyebrow?: ReactNode;
  icon?: LucideIcon;
  badge?: ReactNode;
}) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        {Icon && (
          <span
            aria-hidden
            className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink sm:flex"
          >
            <Icon className="size-6" />
          </span>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-ink">
              {eyebrow}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold sm:text-[1.75rem]">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5">{actions}</div>
      )}
    </header>
  );
}
