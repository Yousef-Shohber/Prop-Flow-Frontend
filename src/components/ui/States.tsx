import {
  CheckCircle2,
  CloudOff,
  FileQuestion,
  Inbox,
  SearchX,
  ServerCrash,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { useT } from "@/i18n";
import { normalizeError } from "@/lib/errors";
import { cn } from "@/lib/utils";

function Shell({
  icon: Icon,
  title,
  description,
  action,
  tone = "gray",
  compact,
}: {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        compact ? "px-4 py-8" : "px-6 py-14",
      )}
    >
      <span
        className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl"
        style={{
          background: `var(--${tone}-bg)`,
          color: `var(--${tone}-fg)`,
          boxShadow: `0 0 0 10px color-mix(in srgb, var(--${tone}-bg) 45%, transparent)`,
        }}
      >
        <Icon className="size-7" aria-hidden />
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function EmptyState({
  variant = "no-data",
  title,
  description,
  action,
  icon,
  compact,
  onClear,
}: {
  variant?: "no-data" | "no-results";
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
  compact?: boolean;
  onClear?: () => void;
}) {
  const t = useT();
  if (variant === "no-results") {
    return (
      <Shell
        compact={compact}
        icon={icon ?? SearchX}
        title={title ?? t("empty.noResults")}
        description={description ?? t("empty.noResultsText")}
        action={
          action ??
          (onClear && (
            <Button variant="secondary" onClick={onClear}>
              {t("common.clearFilters")}
            </Button>
          ))
        }
      />
    );
  }
  return (
    <Shell
      compact={compact}
      icon={icon ?? Inbox}
      title={title ?? t("empty.noData")}
      description={description}
      action={action}
      tone="amber"
    />
  );
}

/** A positive "nothing to do" state (inbox zero, all caught up). Distinct from an empty list and from an error. */
export function SuccessState({
  title,
  description,
  action,
  compact,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <Shell
      compact={compact}
      icon={CheckCircle2}
      tone="green"
      title={title}
      description={description}
      action={action}
    />
  );
}

/** Chooses the view from the normalized error (spec §7.1): 403, 404, offline, 5xx, anything else. */
export function ErrorState({
  error,
  onRetry,
  compact,
}: {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
}) {
  const t = useT();
  const e = normalizeError(error);
  const retry = onRetry && (
    <Button variant="secondary" onClick={onRetry}>
      {t("common.retry")}
    </Button>
  );
  if (e.status === 403)
    return (
      <Shell
        compact={compact}
        tone="red"
        icon={ShieldAlert}
        title={t("layout.noAccessTitle")}
        description={t("layout.noAccess")}
      />
    );
  if (e.status === 404)
    return (
      <Shell
        compact={compact}
        tone="gray"
        icon={FileQuestion}
        title={t("layout.gone")}
        description={t("layout.goneText")}
      />
    );
  if (e.kind === "network")
    return (
      <Shell
        compact={compact}
        tone="amber"
        icon={CloudOff}
        title={t("layout.offline")}
        description={t("layout.offlineText")}
        action={retry}
      />
    );
  return (
    <Shell
      compact={compact}
      tone="red"
      icon={ServerCrash}
      title={t("layout.serverError")}
      description={t("layout.serverErrorText")}
      action={retry}
    />
  );
}

export function LoadingSkeleton({
  variant = "detail",
  rows = 5,
}: {
  variant?: "table" | "cards" | "detail" | "stats" | "list";
  rows?: number;
}) {
  const t = useT();
  return (
    <div
      role="status"
      aria-label={t("common.loading")}
      className="animate-[fade-in_.3s_ease]"
    >
      {variant === "table" && (
        <div className="space-y-3 p-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="skeleton size-10 shrink-0 rounded-lg" />
              <div className="skeleton h-4 flex-1" />
              <div className="skeleton hidden h-4 w-24 sm:block" />
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      )}
      {variant === "cards" && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-card border border-line bg-surface"
            >
              <div className="skeleton h-44 rounded-none" />
              <div className="space-y-2.5 p-4">
                <div className="skeleton h-5 w-2/3" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-4 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}
      {variant === "stats" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-[5.5rem] rounded-card" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="skeleton h-72 rounded-card" />
            <div className="skeleton h-72 rounded-card" />
          </div>
        </div>
      )}
      {variant === "list" && (
        <ul className="divide-y divide-line">
          {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className="flex items-start gap-4 px-5 py-4">
              <div className="skeleton size-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-3.5 w-3/4" />
                <div className="skeleton h-3 w-24" />
              </div>
            </li>
          ))}
        </ul>
      )}
      {variant === "detail" && (
        <div className="space-y-5">
          <div className="skeleton h-64 rounded-card" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="skeleton h-40 rounded-card md:col-span-2" />
            <div className="skeleton h-40 rounded-card" />
          </div>
        </div>
      )}
      <span className="sr-only">{t("common.loading")}</span>
    </div>
  );
}
