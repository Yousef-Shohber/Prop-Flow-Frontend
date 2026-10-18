import { useQuery } from "@tanstack/react-query";
import { CalendarRange, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { leasesApi } from "@/api/leases";
import { propertiesApi } from "@/api/properties";
import { unitsApi } from "@/api/units";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Card } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAllTenants } from "@/hooks/queries";
import { useEnumLabel, useI18n } from "@/i18n";
import {
  addDaysISO,
  addMonthsISO,
  diffDays,
  monthStart,
  todayISO,
} from "@/lib/dates";
import { fetchAll } from "@/lib/fetchAll";
import { formatDate, fullName, localeTag } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Lease, Unit } from "@/types/models";

const SPANS = [3, 6, 12] as const;
const LABEL_W = 176;
const LANE_H = 30;
const TONE: Record<string, string> = {
  PENDING: "amber",
  ACTIVE: "green",
  TERMINATED: "gray",
  EXPIRED: "red",
};

/** Greedy lane assignment so overlapping leases of one unit never sit on top of each other. */
function assignLanes(leases: Lease[]) {
  const sorted = [...leases].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  const ends: string[] = [];
  const out = sorted.map((l) => {
    let lane = ends.findIndex((e) => e < l.startDate.slice(0, 10));
    if (lane === -1) lane = ends.length;
    ends[lane] = l.endDate.slice(0, 10);
    return { lease: l, lane };
  });
  return { items: out, lanes: Math.max(1, ends.length) };
}

export default function TimelinePage() {
  const { t, lang } = useI18n();
  const label = useEnumLabel();
  const [sp, setSp] = useSearchParams();
  const today = todayISO();

  const spanRaw = Number(sp.get("span"));
  const span = (SPANS as readonly number[]).includes(spanRaw) ? spanRaw : 6;
  const fromRaw = sp.get("from") ?? "";
  const from = /^\d{4}-\d{2}-01$/.test(fromRaw) ? fromRaw : monthStart(today);
  const property = sp.get("property") ?? "";
  const winEnd = addMonthsISO(from, span); // exclusive
  const total = Math.max(1, diffDays(from, winEnd));

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    setSp(next, { replace: true });
  };

  const props = useQuery({
    queryKey: ["properties", "timeline"],
    queryFn: async () =>
      (
        await fetchAll((page, limit) =>
          propertiesApi.list({ page, limit, sortBy: "name", sortOrder: "ASC" }),
        )
      ).rows,
  });
  const units = useQuery({
    queryKey: ["units", "timeline", property],
    queryFn: async () =>
      (
        await fetchAll((page, limit) =>
          unitsApi.list({
            page,
            limit,
            sortBy: "unitNumber",
            sortOrder: "ASC",
            propertyId: property || undefined,
          }),
        )
      ).rows,
  });
  const leases = useQuery({
    queryKey: ["leases", "timeline"],
    queryFn: async () =>
      (await fetchAll((page, limit) => leasesApi.list({ page, limit }))).rows,
  });
  const tenants = useAllTenants(true);
  const tenantName = useMemo(
    () => new Map((tenants.data ?? []).map((u) => [u.id, fullName(u)])),
    [tenants.data],
  );

  const pct = (iso: string) => (diffDays(from, iso) / total) * 100;
  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat(localeTag(lang), {
        month: "short",
        ...(span > 6 ? { year: "2-digit" as const } : {}),
      }),
    [lang, span],
  );
  const months = useMemo(
    () =>
      Array.from({ length: span }, (_, i) => {
        const s = addMonthsISO(from, i);
        const e = addMonthsISO(from, i + 1);
        const [y, m] = [Number(s.slice(0, 4)), Number(s.slice(5, 7))];
        return {
          start: s,
          left: (diffDays(from, s) / total) * 100,
          width: (diffDays(s, e) / total) * 100,
          text: fmt.format(new Date(y, m - 1, 1)),
        };
      }),
    [from, span, total, fmt],
  );

  const grouped = useMemo(() => {
    const byUnit = new Map<string, Lease[]>();
    for (const l of leases.data ?? []) {
      const s = l.startDate.slice(0, 10);
      const e = l.endDate.slice(0, 10);
      if (s >= winEnd || addDaysISO(e, 1) <= from) continue;
      byUnit.set(l.unitId, [...(byUnit.get(l.unitId) ?? []), l]);
    }
    const names = new Map((props.data ?? []).map((p) => [p.id, p.name]));
    const groups = new Map<string, { name: string; units: Unit[] }>();
    for (const u of units.data ?? []) {
      const g = groups.get(u.propertyId) ?? {
        name: names.get(u.propertyId) ?? "—",
        units: [],
      };
      g.units.push(u);
      groups.set(u.propertyId, g);
    }
    return {
      byUnit,
      groups: [...groups.entries()].sort((a, b) =>
        a[1].name.localeCompare(b[1].name),
      ),
    };
  }, [leases.data, units.data, props.data, from, winEnd]);

  const ending = useMemo(() => {
    const limit = addDaysISO(today, 30);
    const unitIds = new Set((units.data ?? []).map((u) => u.id));
    const names = new Map((units.data ?? []).map((u) => [u.id, u.unitNumber]));
    return (leases.data ?? [])
      .filter(
        (l) =>
          l.status === "ACTIVE" &&
          l.endDate.slice(0, 10) >= today &&
          l.endDate.slice(0, 10) <= limit &&
          unitIds.has(l.unitId),
      )
      .sort((a, b) => a.endDate.localeCompare(b.endDate))
      .map((l) => ({ l, unit: names.get(l.unitId) ?? l.unit.unitNumber }));
  }, [leases.data, units.data, today]);

  const loading = units.isLoading || leases.isLoading || props.isLoading;
  const error = units.error || leases.error || props.error;
  const retry = () => {
    void units.refetch();
    void leases.refetch();
    void props.refetch();
  };
  const showToday = today >= from && today < winEnd;
  const minW = LABEL_W + span * 112;
  const rangeText = `${formatDate(from, lang)} – ${formatDate(addDaysISO(winEnd, -1), lang)}`;

  return (
    <>
      <PageHeader
        icon={CalendarRange}
        title={t("tl.title")}
        subtitle={t("tl.sub")}
      />

      <div className="mb-5 flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            aria-label={t("tl.prev")}
            onClick={() => setParams({ from: addMonthsISO(from, -span) })}
          >
            <ChevronLeft className="size-5 rtl:rotate-180" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => setParams({ from: null })}
            disabled={from === monthStart(today)}
          >
            {t("tl.today")}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label={t("tl.next")}
            onClick={() => setParams({ from: addMonthsISO(from, span) })}
          >
            <ChevronRight className="size-5 rtl:rotate-180" />
          </Button>
        </div>
        <div
          role="group"
          aria-label={t("tl.span")}
          className="flex overflow-hidden rounded-control border border-line-strong"
        >
          {SPANS.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={span === n}
              onClick={() => setParams({ span: n === 6 ? null : String(n) })}
              className={cn(
                "h-11 min-w-14 px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                span === n
                  ? "bg-primary text-on-primary"
                  : "bg-surface hover:bg-surface-2",
              )}
            >
              {t("tl.months", { n })}
            </button>
          ))}
        </div>
        <Select
          label={t("tl.property")}
          wrapperClassName="min-w-48"
          value={property}
          onChange={(e) => setParams({ property: e.target.value || null })}
        >
          <option value="">{t("tl.allProperties")}</option>
          {(props.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <p className="num ms-auto text-sm text-muted" dir="auto">
          {rangeText}
        </p>
      </div>

      <ul
        className="mb-4 flex flex-wrap items-center gap-2"
        aria-label={t("tl.legend")}
      >
        {["ACTIVE", "PENDING", "EXPIRED", "TERMINATED"].map((s) => (
          <li key={s}>
            <StatusBadge kind="lease" value={s} />
          </li>
        ))}
      </ul>

      {loading ? (
        <LoadingSkeleton variant="table" rows={6} />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={retry} />
        </Card>
      ) : grouped.groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarRange}
            title={t("tl.emptyTitle")}
            description={t("tl.emptyText")}
            action={
              <Button to={paths.propertyNew} icon={<Plus className="size-4" />}>
                {t("tl.addProperty")}
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div
            className="overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label={t("tl.title")}
          >
            <div style={{ minWidth: minW }}>
              {/* month header */}
              <div className="flex border-b border-line bg-surface-2/60">
                <div
                  className="sticky z-20 shrink-0 border-e border-line bg-surface-2 px-3 py-2.5 text-xs font-semibold text-muted"
                  style={{ width: LABEL_W, insetInlineStart: 0 }}
                >
                  {t("leases.unit")}
                </div>
                <div className="relative h-10 flex-1">
                  {months.map((m) => (
                    <div
                      key={m.start}
                      className="absolute inset-y-0 flex items-center border-s border-line ps-2 text-xs font-medium text-muted"
                      style={{
                        insetInlineStart: `${m.left}%`,
                        width: `${m.width}%`,
                      }}
                    >
                      <span className="truncate">{m.text}</span>
                    </div>
                  ))}
                  {showToday && (
                    <span
                      className="absolute top-0 z-10 -translate-x-1/2 rounded-b-md bg-accent px-1.5 py-0.5 text-[0.625rem] font-semibold text-[#1b1405] rtl:translate-x-1/2"
                      style={{ insetInlineStart: `${pct(today)}%` }}
                    >
                      {t("tl.today")}
                    </span>
                  )}
                </div>
              </div>

              {grouped.groups.map(([pid, g]) => (
                <section key={pid} aria-label={g.name}>
                  <div className="flex border-b border-line bg-surface-2/40">
                    <div
                      className="sticky z-20 flex shrink-0 items-baseline gap-2 border-e border-line bg-surface-2 px-3 py-2"
                      style={{ width: LABEL_W, insetInlineStart: 0 }}
                    >
                      <h2
                        className="truncate text-sm font-semibold"
                        dir="auto"
                        title={g.name}
                      >
                        {g.name}
                      </h2>
                      <span className="num shrink-0 text-xs text-faint">
                        {t("tl.unitsCount", { n: g.units.length })}
                      </span>
                    </div>
                    <div className="flex-1" />
                  </div>
                  {g.units.map((u) => {
                    const { items, lanes } = assignLanes(
                      grouped.byUnit.get(u.id) ?? [],
                    );
                    const height = lanes * LANE_H + 14;
                    return (
                      <div
                        key={u.id}
                        className="flex border-b border-line last:border-b-0"
                      >
                        <div
                          className="sticky z-20 shrink-0 border-e border-line bg-surface px-3 py-2.5"
                          style={{ width: LABEL_W, insetInlineStart: 0 }}
                        >
                          <Link
                            to={paths.unit(u.id)}
                            className="tap-area block truncate text-sm font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                            title={t("units.unit", { n: u.unitNumber })}
                            dir="auto"
                          >
                            {t("units.unit", { n: u.unitNumber })}
                          </Link>
                          <span className="mt-0.5 block text-xs text-faint">
                            {label("unit", u.status)}
                          </span>
                        </div>
                        <div className="relative flex-1" style={{ height }}>
                          {months.map((m) => (
                            <span
                              key={m.start}
                              aria-hidden
                              className="absolute inset-y-0 border-s border-line/70"
                              style={{ insetInlineStart: `${m.left}%` }}
                            />
                          ))}
                          {showToday && (
                            <span
                              aria-hidden
                              className="absolute inset-y-0 z-[1] w-0.5 bg-accent"
                              style={{ insetInlineStart: `${pct(today)}%` }}
                            />
                          )}
                          {items.length === 0 && (
                            <span
                              className={cn(
                                "absolute inset-y-0 start-3 flex items-center text-xs",
                                u.status === "AVAILABLE"
                                  ? "font-medium text-[var(--green-fg)]"
                                  : "text-faint",
                              )}
                            >
                              {u.status === "AVAILABLE"
                                ? t("tl.available")
                                : t("tl.noLeases")}
                            </span>
                          )}
                          {items.map(({ lease: l, lane }) => {
                            const s = l.startDate.slice(0, 10);
                            const e = addDaysISO(l.endDate.slice(0, 10), 1);
                            const cs = s < from ? from : s;
                            const ce = e > winEnd ? winEnd : e;
                            const left = pct(cs);
                            const width = Math.max(0, pct(ce) - left);
                            const tone = TONE[l.status] ?? "gray";
                            const who =
                              tenantName.get(l.tenantId) ||
                              t("tl.unknownTenant");
                            const range = `${formatDate(s, lang)} → ${formatDate(l.endDate, lang)}`;
                            return (
                              <Link
                                key={l.id}
                                to={paths.lease(l.id)}
                                title={`${who} · ${range} · ${label("lease", l.status)}`}
                                aria-label={t("tl.barLabel", {
                                  who,
                                  from: formatDate(s, lang),
                                  to: formatDate(l.endDate, lang),
                                  status: label("lease", l.status),
                                })}
                                className="absolute z-[2] flex min-w-7 items-center overflow-hidden rounded-lg border px-2 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                                style={{
                                  insetInlineStart: `${left}%`,
                                  width: `${width}%`,
                                  top: 7 + lane * LANE_H,
                                  height: LANE_H - 4,
                                  background: `var(--${tone}-bg)`,
                                  color: `var(--${tone}-fg)`,
                                  borderColor: `var(--${tone}-dot)`,
                                }}
                              >
                                <span className="truncate" dir="auto">
                                  {who}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>
          </div>
        </Card>
      )}

      {!loading && !error && grouped.groups.length > 0 && (
        <section className="mt-8" aria-labelledby="tl-ending">
          <h2 id="tl-ending" className="mb-3 text-base font-semibold">
            {t("tl.ending")}
          </h2>
          {ending.length === 0 ? (
            <p className="text-sm text-muted">{t("tl.endingEmpty")}</p>
          ) : (
            <Card>
              <ul className="divide-y divide-line">
                {ending.map(({ l, unit }) => (
                  <li key={l.id}>
                    <Link
                      to={paths.lease(l.id)}
                      className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface-2/60 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                    >
                      <span className="min-w-0">
                        <span
                          className="block truncate text-sm font-medium"
                          dir="auto"
                        >
                          {tenantName.get(l.tenantId) || t("tl.unknownTenant")}
                        </span>
                        <span className="block text-xs text-muted">
                          {t("units.unit", { n: unit })}
                        </span>
                      </span>
                      <span className="num text-sm text-[var(--amber-fg)]">
                        {formatDate(l.endDate, lang)} ·{" "}
                        {t("tl.daysLeft", {
                          n: diffDays(today, l.endDate.slice(0, 10)),
                        })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      )}
    </>
  );
}
