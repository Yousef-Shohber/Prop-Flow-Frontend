import { ArrowRight, Bell, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications";
import { CountUp } from "@/components/ui/CountUp";
import { CardSection } from "@/components/ui/Misc";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { notificationTarget } from "@/features/notifications/target";
import { useEnumLabel, useI18n } from "@/i18n";
import { todayISO, parseISODate } from "@/lib/dates";
import { formatRelative, fullName } from "@/lib/format";
import { paths } from "@/routes/paths";
import type { AppNotification, RentalRequest } from "@/types/models";

export function Kpi({
  icon: Icon,
  label,
  value,
  suffix,
  to,
  tone = "amber",
  loading,
}: {
  icon: LucideIcon;
  label: string;
  value?: number;
  suffix?: string;
  to: string;
  tone?: string;
  loading?: boolean;
}) {
  return (
    <Link
      to={to}
      data-rise
      className="group relative flex items-center gap-4 overflow-hidden rounded-card border border-line bg-surface p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card sm:p-5"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 start-0 w-1"
        style={{ background: `var(--${tone}-dot)` }}
      />
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
        style={{ background: `var(--${tone}-bg)`, color: `var(--${tone}-fg)` }}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm text-muted">{label}</span>
        <span className="num block font-display text-2xl font-semibold leading-tight">
          {loading || value === undefined ? (
            <span
              className="skeleton inline-block h-7 w-12 align-middle"
              aria-hidden
            />
          ) : (
            <CountUp
              value={value}
              suffix={suffix}
              decimals={value % 1 ? 1 : 0}
            />
          )}
        </span>
      </span>
    </Link>
  );
}

export function Row({
  to,
  title,
  meta,
  end,
}: {
  to: string;
  title: ReactNode;
  meta?: ReactNode;
  end?: ReactNode;
}) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-2"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{title}</span>
          {meta && (
            <span className="block truncate text-xs text-muted">{meta}</span>
          )}
        </span>
        {end}
      </Link>
    </li>
  );
}

export function Panel({
  title,
  to,
  linkLabel,
  loading,
  error,
  onRetry,
  empty,
  children,
  className,
}: {
  title: string;
  to?: string;
  linkLabel?: string;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <CardSection
      data-rise
      title={title}
      className={className}
      action={
        to && linkLabel ? (
          <Link
            to={to}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent-ink hover:underline dark:text-accent"
          >
            {linkLabel}
            <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
          </Link>
        ) : undefined
      }
    >
      {loading ? (
        <div role="status" className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState compact error={error} onRetry={onRetry} />
      ) : (
        (empty ?? children)
      )}
    </CardSection>
  );
}

export const personName = (r: Pick<RentalRequest, "tenant">) =>
  r.tenant ? fullName(r.tenant) : "";

export function daysLeft(end: string) {
  const d = parseISODate(end);
  const t = parseISODate(todayISO());
  return d && t ? Math.round((d.getTime() - t.getTime()) / 86_400_000) : null;
}

export function Activity() {
  const { t, lang } = useI18n();
  const label = useEnumLabel();
  const q = useQuery({
    queryKey: ["notifications", { page: 1, limit: 5, home: true }],
    queryFn: () => notificationsApi.list({ page: 1, limit: 5 }),
  });
  const items: AppNotification[] = q.data?.data ?? [];
  return (
    <Panel
      title={t("home.activity")}
      to={paths.notifications}
      linkLabel={t("home.seeAll")}
      loading={q.isLoading}
      error={q.error}
      onRetry={() => q.refetch()}
      empty={
        items.length === 0 ? (
          <EmptyState
            compact
            icon={Bell}
            title={t("home.activityEmpty")}
            description={t("home.activityEmptyText")}
          />
        ) : undefined
      }
    >
      <ul className="-mx-2 divide-y divide-line">
        {items.map((n) => (
          <Row
            key={n.id}
            to={notificationTarget(n) ?? paths.notifications}
            title={
              <>
                {!n.isRead && (
                  <span
                    className="me-2 inline-block size-2 rounded-full bg-accent align-middle"
                    aria-label={t("home.unread")}
                  />
                )}
                {n.title || label("notif", n.type)}
              </>
            }
            meta={`${label("notif", n.type)} · ${formatRelative(n.createdAt, lang)}`}
          />
        ))}
      </ul>
    </Panel>
  );
}

export function QuickActions({
  items,
}: {
  items: { to: string; icon: LucideIcon; label: string }[];
}) {
  const { t } = useI18n();

  return (
    <CardSection data-rise title={t("home.quick")}>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {items.map((a, index) => (
          <li
            key={a.to + a.label}
            className={
              items.length === 5 && index === 4 ? "sm:col-span-2" : undefined
            }
          >
            <Link
              to={a.to}
              className="group flex items-center gap-3 rounded-control border border-line px-3.5 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-2 hover:shadow-soft"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-ink transition-transform group-hover:scale-105">
                <a.icon className="size-[1.05rem]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 truncate">{a.label}</span>
              <ArrowRight
                className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </CardSection>
  );
}
