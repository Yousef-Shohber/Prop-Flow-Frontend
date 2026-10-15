import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ClipboardList,
  DoorOpen,
  FileCheck2,
  History,
  LayoutDashboard,
  Plus,
  Timer,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import { analyticsApi } from "@/api/analytics";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { Card, CardSection } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/ui/States";
import { QuickActions } from "@/features/home/HomeWidgets";
import { useAuth } from "@/hooks/useAuth";
import { useEnumLabel, useI18n } from "@/i18n";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { formatHours, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { DashboardStats } from "@/types/models";

function OccupancyRing({ d }: { d: DashboardStats }) {
  const { t, lang } = useI18n();
  const arc = useRef<SVGCircleElement>(null);
  const r = 74;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, d.occupancyRate));
  const other = Math.max(0, d.totalUnits - d.occupiedUnits - d.availableUnits);
  useGSAP(
    () => {
      if (!arc.current) return;
      if (prefersReducedMotion()) {
        arc.current.style.strokeDashoffset = String(c * (1 - pct / 100));
        return;
      }
      gsap.fromTo(
        arc.current,
        { strokeDashoffset: c },
        {
          strokeDashoffset: c * (1 - pct / 100),
          duration: 1.3,
          ease: "power3.out",
        },
      );
    },
    { dependencies: [pct] },
  );
  const legend = [
    {
      label: t("dashboard.occupied"),
      v: d.occupiedUnits,
      dot: "var(--blue-dot)",
    },
    {
      label: t("dashboard.available"),
      v: d.availableUnits,
      dot: "var(--green-dot)",
    },
    ...(other > 0
      ? [{ label: t("dashboard.other"), v: other, dot: "var(--gray-dot)" }]
      : []),
  ];
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
        <div className="relative size-44 shrink-0">
          <svg
            viewBox="0 0 180 180"
            className="size-full -rotate-90"
            role="img"
            aria-label={`${t("dashboard.occupancy")}: ${formatNumber(pct, lang, { maximumFractionDigits: 1 })}%`}
          >
            <circle
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke="var(--surface-3)"
              strokeWidth="14"
            />
            <circle
              ref={arc}
              cx="90"
              cy="90"
              r={r}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <CountUp
              value={pct}
              decimals={pct % 1 ? 1 : 0}
              suffix="%"
              className="font-display text-4xl font-bold"
            />
            <span className="text-xs text-muted">
              {t("dashboard.occupancy")}
            </span>
          </div>
        </div>
        <dl className="grid w-full grid-cols-3 gap-4 text-center sm:grid-cols-1 sm:text-start">
          {legend.map((x) => (
            <div key={x.label}>
              <dt className="flex items-center justify-center gap-2 text-xs text-muted sm:justify-start">
                <span
                  className="size-2 rounded-[3px]"
                  style={{ background: x.dot }}
                />
                {x.label}
              </dt>
              <dd className="num font-display text-2xl font-semibold">
                {formatNumber(x.v, lang)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {d.totalUnits > 0 && (
        <div className="mt-auto" aria-hidden>
          <div
            className="flex h-2.5 overflow-hidden rounded-full bg-surface-3"
            dir="ltr"
          >
            {legend.map((x) => (
              <span
                key={x.label}
                style={{
                  width: `${(x.v / d.totalUnits) * 100}%`,
                  background: x.dot,
                }}
              />
            ))}
          </div>
          <Link
            to={paths.units}
            className="mt-3 inline-block text-sm font-medium text-accent-ink hover:underline dark:text-accent"
          >
            {t("dashboard.viewUnits")}
          </Link>
        </div>
      )}
    </div>
  );
}

/** Clickable KPI tile. Every tile has the same height so rows line up. */
function Stat({
  icon: Icon,
  label,
  value,
  tone,
  to,
}: {
  icon: typeof Wrench;
  label: string;
  value: number;
  tone: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      data-stat
      className="group relative flex h-full items-center gap-4 overflow-hidden rounded-card border border-line bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 start-0 w-1"
        style={{ background: `var(--${tone}-dot)` }}
      />
      <span
        className="flex size-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
        style={{ background: `var(--${tone}-bg)`, color: `var(--${tone}-fg)` }}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm text-muted">{label}</span>
        <span className="num block font-display text-3xl font-semibold leading-tight">
          <CountUp value={value} />
        </span>
      </span>
    </Link>
  );
}

function LeaseSplit({ active, expired }: { active: number; expired: number }) {
  const { t, lang } = useI18n();
  const total = active + expired;
  if (total === 0)
    return (
      <EmptyState
        compact
        icon={FileCheck2}
        title={t("dashboard.noLeases")}
        description={t("dashboard.noLeasesText")}
      />
    );
  const rows = [
    {
      label: t("dashboard.activeLeases"),
      v: active,
      color: "var(--green-dot)",
      to: `${paths.leases}?status=ACTIVE`,
    },
    {
      label: t("dashboard.expiredLeases"),
      v: expired,
      color: "var(--red-dot)",
      to: `${paths.leases}?status=EXPIRED`,
    },
  ];
  return (
    <div className="flex flex-1 flex-col gap-5">
      <div
        className="flex h-3 overflow-hidden rounded-full bg-surface-3"
        dir="ltr"
        role="img"
        aria-label={t("dashboard.leaseSplit")}
      >
        {rows.map((r) => (
          <span
            key={r.label}
            style={{ width: `${(r.v / total) * 100}%`, background: r.color }}
          />
        ))}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <li key={r.label}>
            <Link
              to={r.to}
              className="block rounded-control border border-line p-3.5 transition-colors hover:bg-surface-2"
            >
              <span className="flex items-center gap-2 text-xs text-muted">
                <span
                  className="size-2 rounded-[3px]"
                  style={{ background: r.color }}
                />
                {r.label}
              </span>
              <span className="num mt-1 block font-display text-2xl font-semibold">
                {formatNumber(r.v, lang)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        to={paths.leases}
        className="mt-auto text-sm font-medium text-accent-ink hover:underline dark:text-accent"
      >
        {t("dashboard.viewLeases")}
      </Link>
    </div>
  );
}

function Categories({
  data,
}: {
  data: DashboardStats["mostCommonMaintenanceCategories"];
}) {
  const { t, lang } = useI18n();
  const label = useEnumLabel();
  const ref = useRef<HTMLUListElement>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      gsap.fromTo(
        ref.current.querySelectorAll("[data-bar]"),
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: "left center",
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
        },
      );
    },
    { scope: ref, dependencies: [data] },
  );
  if (data.length === 0)
    return (
      <EmptyState compact icon={Wrench} title={t("dashboard.noCategories")} />
    );
  return (
    <ul ref={ref} className="space-y-3.5">
      {data.map((d) => (
        <li key={d.category}>
          <div className="mb-1.5 flex justify-between text-sm">
            <span>{label("cat", d.category)}</span>
            <span className="num font-semibold">
              {formatNumber(d.count, lang)}
            </span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-surface-3"
            dir="ltr"
          >
            <div
              data-bar
              className="h-full rounded-full bg-accent"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function MaintenanceOverview({ d }: { d: DashboardStats }) {
  const { t, lang } = useI18n();
  const rows = [
    {
      icon: Wrench,
      tone: "amber",
      label: t("dashboard.openMaint"),
      value: (
        <span className="num font-display text-2xl font-semibold">
          {formatNumber(d.openMaintenanceRequests, lang)}
        </span>
      ),
      to: `${paths.maintenance}?status=OPEN`,
    },
    {
      icon: FileCheck2,
      tone: "green",
      label: t("dashboard.resolvedMaint"),
      value: (
        <span className="num font-display text-2xl font-semibold">
          {formatNumber(d.resolvedMaintenanceRequests, lang)}
        </span>
      ),
      to: `${paths.maintenance}?status=RESOLVED`,
    },
    {
      icon: Timer,
      tone: "orange",
      label: t("dashboard.avgResolution"),
      value: (
        <span className="num font-display text-2xl font-semibold">
          {formatHours(d.avgMaintenanceResolutionHours, lang)}
        </span>
      ),
      hint:
        d.avgMaintenanceResolutionHours === null
          ? t("dashboard.avgHint")
          : undefined,
      to: paths.maintenance,
    },
  ];
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <Link
            to={r.to}
            className="flex items-center gap-4 rounded-control border border-line p-3.5 transition-colors hover:bg-surface-2"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: `var(--${r.tone}-bg)`,
                color: `var(--${r.tone}-fg)`,
              }}
            >
              <r.icon className="size-[1.15rem]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-muted">{r.label}</span>
              {r.hint && (
                <span className="block text-xs text-faint">{r.hint}</span>
              )}
            </span>
            {r.value}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { user, role } = useAuth();
  const q = useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: analyticsApi.dashboard,
  });
  const grid = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion() || !q.data || !grid.current) return;
      gsap.from(grid.current.querySelectorAll("[data-stat]"), {
        opacity: 0,
        y: 18,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.06,
        clearProps: "all",
      });
    },
    { scope: grid, dependencies: [!!q.data] },
  );

  const d = q.data;
  const shortcuts = [
    {
      to: paths.rentalRequests,
      icon: ClipboardList,
      label: t("dashboard.reviewRequests"),
    },
    { to: paths.leaseNew, icon: FileCheck2, label: t("home.newLease") },
    { to: paths.units, icon: DoorOpen, label: t("nav.units") },
    ...(role === "ADMIN"
      ? [
          {
            to: `${paths.users}?role=OWNER`,
            icon: UserCheck,
            label: t("dashboard.pendingOwners"),
          },
          { to: paths.users, icon: Users, label: t("nav.users") },
          { to: paths.auditLogs, icon: History, label: t("nav.auditLogs") },
        ]
      : [{ to: paths.home, icon: LayoutDashboard, label: t("nav.home") }]),
  ];
  return (
    <>
      <PageHeader
        icon={LayoutDashboard}
        title={t("dashboard.greeting", { name: user?.firstName ?? "" })}
        subtitle={
          role === "ADMIN" ? t("dashboard.adminSub") : t("dashboard.ownerSub")
        }
        actions={
          <Button to={paths.propertyNew} icon={<Plus className="size-4" />}>
            {t("dashboard.addProperty")}
          </Button>
        }
      />
      {q.isLoading && <LoadingSkeleton variant="stats" />}
      {q.error && (
        <Card>
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        </Card>
      )}
      {d && (
        <div ref={grid} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon={Building2}
              tone="blue"
              label={t("dashboard.totalProperties")}
              value={d.totalProperties}
              to={paths.properties}
            />
            <Stat
              icon={DoorOpen}
              tone="teal"
              label={t("dashboard.totalUnits")}
              value={d.totalUnits}
              to={paths.units}
            />
            <Stat
              icon={FileCheck2}
              tone="green"
              label={t("dashboard.activeLeases")}
              value={d.activeLeases}
              to={`${paths.leases}?status=ACTIVE`}
            />
            <Stat
              icon={Wrench}
              tone="amber"
              label={t("dashboard.openMaint")}
              value={d.openMaintenanceRequests}
              to={`${paths.maintenance}?status=OPEN`}
            />
          </div>
          <div className="grid items-stretch gap-5 lg:grid-cols-2">
            <CardSection
              data-stat
              title={t("dashboard.occupancy")}
              className="flex h-full flex-col"
            >
              <OccupancyRing d={d} />
            </CardSection>
            <CardSection
              data-stat
              title={t("dashboard.leasesTitle")}
              className="flex h-full flex-col"
            >
              <LeaseSplit active={d.activeLeases} expired={d.expiredLeases} />
            </CardSection>
          </div>
          <div className={cn("grid items-stretch gap-5 lg:grid-cols-2")}>
            <CardSection
              data-stat
              title={t("dashboard.maintTitle")}
              className="flex h-full flex-col"
            >
              <MaintenanceOverview d={d} />
            </CardSection>
            <CardSection
              data-stat
              title={t("dashboard.categories")}
              className="flex h-full flex-col"
            >
              <Categories data={d.mostCommonMaintenanceCategories} />
            </CardSection>
          </div>
          <div data-stat>
            <QuickActions items={shortcuts} />
          </div>
          <p className="text-xs text-faint">{t("dashboard.cache")}</p>
        </div>
      )}
    </>
  );
}
