import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { leasesApi } from "@/api/leases";
import { propertiesApi } from "@/api/properties";
import { unitsApi } from "@/api/units";
import { LogoMark } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Stamp } from "@/components/ui/Stamp";
import { ExportButton } from "@/components/ui/ExportButton";
import { Select } from "@/components/ui/Field";
import { Card } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/ui/States";
import { useAllTenants } from "@/hooks/queries";
import { useI18n } from "@/i18n";
import { diffDays, todayISO } from "@/lib/dates";
import { fetchAll } from "@/lib/fetchAll";
import { formatDate, formatMoney, formatNumber, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";

type SortKey = "unit" | "tenant" | "end" | "rent" | "left";

export default function RentRollPage() {
  const { t, lang } = useI18n();
  const [sp, setSp] = useSearchParams();
  const property = sp.get("property") ?? "";
  const [sort, setSort] = useState<{ key: SortKey; dir: "ASC" | "DESC" }>({
    key: "unit",
    dir: "ASC",
  });
  const today = todayISO();
  const n = (v: number) => formatNumber(v, lang);

  const props = useQuery({
    queryKey: ["properties", "rent-roll"],
    queryFn: async () =>
      (
        await fetchAll((page, limit) =>
          propertiesApi.list({ page, limit, sortBy: "name", sortOrder: "ASC" }),
        )
      ).rows,
  });
  const units = useQuery({
    queryKey: ["units", "rent-roll"],
    queryFn: async () =>
      (await fetchAll((page, limit) => unitsApi.list({ page, limit }))).rows,
  });
  const leases = useQuery({
    queryKey: ["leases", "rent-roll"],
    queryFn: async () =>
      (
        await fetchAll((page, limit) =>
          leasesApi.list({ page, limit, status: "ACTIVE" }),
        )
      ).rows,
  });
  const tenants = useAllTenants(true);
  const tenantName = useMemo(
    () => new Map((tenants.data ?? []).map((u) => [u.id, fullName(u)])),
    [tenants.data],
  );
  const propName = useMemo(
    () => new Map((props.data ?? []).map((p) => [p.id, p.name])),
    [props.data],
  );

  const rows = useMemo(() => {
    const list = (leases.data ?? [])
      .filter((l) => !property || l.unit.propertyId === property)
      .map((l) => ({
        id: l.id,
        unit: l.unit.unitNumber,
        property: propName.get(l.unit.propertyId) ?? "",
        tenant: tenantName.get(l.tenantId) ?? "",
        start: l.startDate.slice(0, 10),
        end: l.endDate.slice(0, 10),
        rent: l.rentAmount,
        left: diffDays(today, l.endDate.slice(0, 10)),
      }));
    const dir = sort.dir === "ASC" ? 1 : -1;
    return list.sort((a, b) => {
      const x = a[sort.key === "left" ? "left" : sort.key];
      const y = b[sort.key === "left" ? "left" : sort.key];
      const c =
        typeof x === "number" && typeof y === "number"
          ? x - y
          : String(x).localeCompare(String(y), lang, { numeric: true });
      return c * dir || a.unit.localeCompare(b.unit, lang, { numeric: true });
    });
  }, [leases.data, property, propName, tenantName, sort, today, lang]);

  const scopeUnits = (units.data ?? []).filter(
    (u) => !property || u.propertyId === property,
  );
  const occupied = scopeUnits.filter((u) => u.status === "RENTED").length;
  const rate = scopeUnits.length
    ? Math.round((occupied / scopeUnits.length) * 100)
    : 0;
  const monthly = rows.reduce((s, r) => s + r.rent, 0);
  const within = (d: number) =>
    rows.filter((r) => r.left >= 0 && r.left <= d).length;

  const loading = leases.isLoading || units.isLoading || props.isLoading;
  const error = leases.error || units.error || props.error;

  const toggle = (key: SortKey) =>
    setSort((s) => ({
      key,
      dir: s.key === key && s.dir === "ASC" ? "DESC" : "ASC",
    }));
  const Th = ({
    k,
    children,
    num,
  }: {
    k: SortKey;
    children: string;
    num?: boolean;
  }) => (
    <th
      scope="col"
      aria-sort={
        sort.key === k
          ? sort.dir === "ASC"
            ? "ascending"
            : "descending"
          : "none"
      }
      className={cn(
        "px-4 py-3 text-start text-xs font-semibold text-muted",
        num && "text-end",
      )}
    >
      <button
        type="button"
        onClick={() => toggle(k)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {children}
        {sort.key === k ? (
          sort.dir === "ASC" ? (
            <ArrowUp className="size-3.5" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5" aria-hidden />
          )
        ) : (
          <ChevronsUpDown
            className="size-3.5 text-faint no-print"
            aria-hidden
          />
        )}
      </button>
    </th>
  );

  const stat = (labelText: string, value: string) => (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="text-xs font-medium text-muted">{labelText}</p>
      <p className="num mt-1 font-display text-xl font-bold" dir="auto">
        {value}
      </p>
    </div>
  );

  return (
    <>
      <div className="print-only mb-6 items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <LogoMark className="size-10" />
          <span className="font-display text-xl font-bold">
            PropFlow · {t("rent.title")}
          </span>
        </div>
        <span className="num text-sm text-muted">
          {formatDate(today, lang)}
        </span>
      </div>
      <PageHeader
        icon={FileSpreadsheet}
        title={t("rent.title")}
        subtitle={t("rent.sub")}
        actions={
          <>
            <ExportButton
              name="rent-roll"
              disabled={rows.length === 0}
              load={async () => ({
                headers: [
                  t("export.col.unit"),
                  t("export.col.property"),
                  t("export.col.tenant"),
                  t("export.col.start"),
                  t("export.col.end"),
                  t("export.col.rent"),
                  t("export.col.daysLeft"),
                ],
                rows: rows.map((r) => [
                  r.unit,
                  r.property,
                  r.tenant,
                  r.start,
                  r.end,
                  r.rent,
                  r.left,
                ]),
              })}
            />
            <Button
              variant="secondary"
              icon={<Printer className="size-4" />}
              onClick={() => window.print()}
            >
              {t("lp.print")}
            </Button>
          </>
        }
      />
      <div className="no-print mb-5 max-w-xs">
        <Select
          label={t("tl.property")}
          value={property}
          onChange={(e) => {
            const next = new URLSearchParams(sp);
            if (e.target.value) next.set("property", e.target.value);
            else next.delete("property");
            setSp(next, { replace: true });
          }}
        >
          <option value="">{t("tl.allProperties")}</option>
          {(props.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <LoadingSkeleton variant="stats" />
      ) : error ? (
        <Card>
          <ErrorState
            error={error}
            onRetry={() => {
              void leases.refetch();
              void units.refetch();
              void props.refetch();
            }}
          />
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
            {stat(t("rent.monthly"), formatMoney(monthly, lang))}
            {stat(
              t("rent.occupied"),
              `${n(occupied)} / ${n(scopeUnits.length)}`,
            )}
            {stat(t("rent.occupancy"), `${n(rate)}%`)}
            {stat(t("rent.end30"), n(within(30)))}
            {stat(t("rent.end60"), n(within(60)))}
            {stat(t("rent.end90"), n(within(90)))}
          </div>
          {rows.length === 0 ? (
            <Card>
              <EmptyState
                icon={FileSpreadsheet}
                title={t("rent.emptyTitle")}
                description={t("rent.emptyText")}
                action={<Button to={paths.leaseNew}>{t("leases.new")}</Button>}
              />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div
                className="overflow-x-auto"
                tabIndex={0}
                role="region"
                aria-label={t("rent.title")}
              >
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="border-b border-line bg-surface-2/60">
                    <tr>
                      <Th k="unit">{t("leases.unit")}</Th>
                      <Th k="tenant">{t("leases.tenant")}</Th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-start text-xs font-semibold text-muted"
                      >
                        {t("leases.dates")}
                      </th>
                      <Th k="rent" num>
                        {t("leases.rent")}
                      </Th>
                      <Th k="left" num>
                        {t("rent.daysLeft")}
                      </Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-2/40">
                        <td className="px-4 py-3">
                          <Link
                            to={paths.lease(r.id)}
                            className="font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                            dir="auto"
                          >
                            {t("units.unit", { n: r.unit })}
                          </Link>
                          {r.property && (
                            <p
                              className="max-w-56 truncate text-xs text-muted"
                              dir="auto"
                            >
                              {r.property}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3" dir="auto">
                          {r.tenant || "—"}
                        </td>
                        <td className="num whitespace-nowrap px-4 py-3 text-muted">
                          {formatDate(r.start, lang)} →{" "}
                          {formatDate(r.end, lang)}
                        </td>
                        <td className="num px-4 py-3 text-end font-medium">
                          {formatMoney(r.rent, lang)}
                        </td>
                        <td
                          className={cn(
                            "num px-4 py-3 text-end",
                            r.left <= 30 &&
                              "font-medium text-[var(--amber-fg)]",
                          )}
                        >
                          {n(r.left)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-line-strong bg-surface-2/60">
                    <tr>
                      <td className="px-4 py-3 font-semibold" colSpan={3}>
                        {t("rent.total")}
                      </td>
                      <td className="num px-4 py-3 text-end font-semibold">
                        {formatMoney(monthly, lang)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
      <div
        className="print-only mt-10 items-end justify-between gap-6"
        style={{ breakInside: "avoid" }}
      >
        <div className="w-56">
          <div className="h-14 border-b border-[#17202e]" />
          <p className="mt-1.5 text-xs text-muted">{t("rent.approvedBy")}</p>
        </div>
        <Stamp
          date={new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date())}
          status="RENT ROLL"
        />
      </div>
    </>
  );
}
