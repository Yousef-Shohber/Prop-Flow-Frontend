import { useQuery } from "@tanstack/react-query";
import { Building2, DoorOpen, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { propertiesApi } from "@/api/properties";
import { unitsApi } from "@/api/units";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Card } from "@/components/ui/Misc";
import { Pagination } from "@/components/ui/Pagination";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/ui/States";
import { PropertyCard } from "@/features/properties/PropertyBits";
import { UnitCard } from "@/features/units/UnitBits";
import { useDebounce } from "@/hooks/useDebounce";
import { useListParams } from "@/hooks/useListParams";
import { useEnumLabel, useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { Photo } from "@/components/ui/Photo";
import { TYPE_PHOTO } from "@/lib/photos";
import { useTypeCounts } from "@/hooks/discover";
import { formatNumber } from "@/lib/format";
import { PropertyType, UnitStatus } from "@/types/enums";
import type { UserRole } from "@/types/enums";

type View = "properties" | "units";
type Sort = { sortBy: string; sortOrder: "ASC" | "DESC" };

const NEWEST: Sort = { sortBy: "createdAt", sortOrder: "DESC" };
const PROPERTY_SORTS: Record<string, Sort> = {
  newest: NEWEST,
  nameAsc: { sortBy: "name", sortOrder: "ASC" },
  cityAsc: { sortBy: "city", sortOrder: "ASC" },
};
const UNIT_SORTS: Record<string, Sort> = {
  newest: NEWEST,
  priceAsc: { sortBy: "rentAmount", sortOrder: "ASC" },
  priceDesc: { sortBy: "rentAmount", sortOrder: "DESC" },
};
const TEXT_KEYS = ["search", "city", "minPrice", "maxPrice"] as const;
type Draft = Record<(typeof TEXT_KEYS)[number], string>;
const digits = (v: string) => v.replace(/\D/g, "");

/**
 * Search block of the Home page. Every filter lives in the URL (/home?search=…&page=2), so opening a result and
 * pressing Back restores the same search. Filters sent to the API are only the ones the endpoints document:
 * GET /properties (search, city, propertyType) and GET /units (status, bedrooms, minPrice, maxPrice).
 */
export function DiscoverSection({
  role,
  showCounts = false,
}: {
  role: Extract<UserRole, "TENANT" | "OWNER" | "ADMIN">;
  showCounts?: boolean;
}) {
  const { t, lang } = useI18n();
  const label = useEnumLabel();
  const isTenant = role === "TENANT";
  const { state, update } = useListParams({ limit: 6 });
  const [, setSp] = useSearchParams();
  const f = state.filters;
  const view: View = f.view === "units" ? "units" : "properties";
  const sorts = view === "units" ? UNIT_SORTS : PROPERTY_SORTS;

  const urlDraft: Draft = {
    search: f.search ?? "",
    city: f.city ?? "",
    minPrice: f.minPrice ?? "",
    maxPrice: f.maxPrice ?? "",
  };
  const urlKey = JSON.stringify(urlDraft);
  const [draft, setDraft] = useState<Draft>(urlDraft);
  const committed = useRef(urlKey);
  const debounced = useDebounce(draft, 350);

  // Back button, "clear" and tab changes rewrite the URL: mirror it into the inputs (but not our own commits).
  useEffect(() => {
    if (urlKey !== committed.current) {
      committed.current = urlKey;
      setDraft(JSON.parse(urlKey));
    }
  }, [urlKey]);

  const commit = (d: Draft) => {
    const key = JSON.stringify(d);
    if (key === committed.current) return;
    committed.current = key;
    update({ filters: { ...d } });
  };
  useEffect(() => {
    commit(
      debounced,
    ); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [debounced]);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    commit(draft);
  };
  const set = (k: keyof Draft, v: string) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const active =
    [
      "search",
      "city",
      "propertyType",
      "bedrooms",
      "minPrice",
      "maxPrice",
      "status",
    ].some((k) => !!f[k]) || state.page > 1;
  const limit = active ? 6 : 3;
  const sortKey =
    Object.entries(sorts).find(
      ([, s]) => s.sortBy === state.sortBy && s.sortOrder === state.sortOrder,
    )?.[0] ?? "newest";
  const sort = sorts[sortKey];

  const propParams = {
    page: state.page,
    limit,
    ...sort,
    search: f.search,
    city: f.city,
    propertyType: f.propertyType as PropertyType | undefined,
  };
  const unitParams = {
    page: state.page,
    limit,
    ...sort,
    bedrooms: f.bedrooms,
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
    status: isTenant
      ? ("AVAILABLE" as const)
      : (f.status as UnitStatus | undefined),
  };
  const props = useQuery({
    queryKey: ["properties", "discover", propParams],
    queryFn: () => propertiesApi.list(propParams),
    enabled: view === "properties",
    placeholderData: (p) => p,
  });
  const units = useQuery({
    queryKey: ["units", "discover", unitParams],
    queryFn: () => unitsApi.list(unitParams),
    enabled: view === "units",
    placeholderData: (p) => p,
  });
  const q = view === "units" ? units : props;
  const meta = q.data?.meta;
  const typeCounts = useTypeCounts(showCounts && view === "properties");

  // The two endpoints accept different filters, so a tab switch (or "clear") rewrites the whole query string at once.
  const resetTo = (v: View) => {
    const blank: Draft = { search: "", city: "", minPrice: "", maxPrice: "" };
    committed.current = JSON.stringify(blank);
    setDraft(blank);
    setSp(
      v === "units"
        ? new URLSearchParams({ view: "units" })
        : new URLSearchParams(),
      { replace: true },
    );
  };
  const setView = (v: View) => {
    if (v !== view) resetTo(v);
  };
  const clear = () => resetTo(view);

  const heading = active
    ? t("discover.resultsFor")
    : view === "units"
      ? t("discover.newestUnits")
      : role === "OWNER"
        ? t("discover.yourProperties")
        : t("discover.newestProperties");

  const tab = (v: View, text: string, Icon: typeof Building2) => (
    <button
      type="button"
      role="tab"
      aria-selected={view === v}
      onClick={() => setView(v)}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
        view === v
          ? "bg-primary text-white"
          : "text-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {text}
    </button>
  );

  const empty = active ? (
    <EmptyState variant="no-results" onClear={clear} />
  ) : view === "units" ? (
    <EmptyState
      title={t("home.noUnits")}
      description={t("home.noUnitsText")}
      icon={DoorOpen}
    />
  ) : (
    <EmptyState
      icon={Building2}
      title={t("home.noProperties")}
      description={
        role === "OWNER"
          ? t("home.noPropertiesOwner")
          : t("home.noPropertiesTenant")
      }
      action={
        role !== "TENANT" ? (
          <Button to={paths.propertyNew} icon={<Plus className="size-4" />}>
            {t("dashboard.addProperty")}
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <section aria-label={t("discover.searchAria")} className="space-y-5">
      <form
        role="search"
        onSubmit={onSubmit}
        data-rise
        className="relative z-10 -mt-16 space-y-4 rounded-sheet border border-line bg-surface p-4 shadow-pop ring-1 ring-black/[0.02] sm:-mt-20 sm:mx-6 sm:p-6"
      >
        <div
          role="tablist"
          aria-label={t("discover.tabsAria")}
          className="flex gap-1"
        >
          {tab("properties", t("discover.tabProperties"), Building2)}
          {tab("units", t("discover.tabUnits"), DoorOpen)}
        </div>

        {view === "properties" ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-[2fr_1fr_1fr_auto]">
            <Input
              label={t("discover.keyword")}
              placeholder={t("discover.keywordPlaceholder")}
              value={draft.search}
              maxLength={100}
              startAdornment={<Search className="size-4" aria-hidden />}
              onChange={(e) => set("search", e.target.value)}
              wrapperClassName="col-span-2 lg:col-span-1"
            />
            <Input
              label={t("discover.city")}
              value={draft.city}
              maxLength={100}
              onChange={(e) => set("city", e.target.value)}
            />
            <Select
              label={t("discover.type")}
              value={f.propertyType ?? ""}
              onChange={(e) =>
                update({
                  filters: { propertyType: e.target.value || undefined },
                })
              }
            >
              <option value="">{t("discover.allTypes")}</option>
              {PropertyType.map((v) => (
                <option key={v} value={v}>
                  {label("ptype", v)}
                </option>
              ))}
            </Select>
            <Button
              type="submit"
              size="lg"
              className="col-span-2 self-end lg:col-span-1"
              icon={<Search className="size-4" aria-hidden />}
            >
              {t("discover.submit")}
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              "grid grid-cols-2 gap-3",
              isTenant
                ? "lg:grid-cols-[1fr_1fr_1fr_auto]"
                : "lg:grid-cols-[1fr_1fr_1fr_1fr_auto]",
            )}
          >
            <Select
              wrapperClassName="col-span-2 lg:col-span-1"
              label={t("discover.bedrooms")}
              value={f.bedrooms ?? ""}
              onChange={(e) =>
                update({ filters: { bedrooms: e.target.value || undefined } })
              }
            >
              <option value="">{t("discover.anyBedrooms")}</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <Input
              label={t("discover.minRent")}
              inputMode="numeric"
              dir="ltr"
              value={draft.minPrice}
              maxLength={9}
              onChange={(e) => set("minPrice", digits(e.target.value))}
            />
            <Input
              label={t("discover.maxRent")}
              inputMode="numeric"
              dir="ltr"
              value={draft.maxPrice}
              maxLength={9}
              onChange={(e) => set("maxPrice", digits(e.target.value))}
            />
            {!isTenant && (
              <Select
                label={t("discover.availability")}
                value={f.status ?? ""}
                onChange={(e) =>
                  update({ filters: { status: e.target.value || undefined } })
                }
              >
                <option value="">{t("discover.anyStatus")}</option>
                {UnitStatus.map((v) => (
                  <option key={v} value={v}>
                    {label("unit", v)}
                  </option>
                ))}
              </Select>
            )}
            <Button
              type="submit"
              size="lg"
              className="col-span-2 self-end lg:col-span-1"
              icon={<Search className="size-4" aria-hidden />}
            >
              {t("discover.submit")}
            </Button>
          </div>
        )}
        {view === "units" && isTenant && (
          <p className="text-xs text-muted">
            {t("discover.unitsOnlyAvailable")}
          </p>
        )}
      </form>

      {view === "properties" && (
        <div data-rise>
          <h2 className="mb-3 font-display text-xl font-semibold">
            {t("discover.browseByType")}
          </h2>
          <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {PropertyType.map((v) => {
              const on = f.propertyType === v;
              const count = typeCounts.counts[v];
              return (
                <li key={v} className="w-40 shrink-0 snap-start sm:w-auto">
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      update({ filters: { propertyType: on ? undefined : v } })
                    }
                    className={cn(
                      "group relative block h-28 w-full overflow-hidden rounded-card border text-start shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 sm:h-36",
                      on
                        ? "border-accent ring-2 ring-accent/60"
                        : "border-line hover:border-line-strong",
                    )}
                  >
                    <Photo
                      name={TYPE_PHOTO[v].photo}
                      variant={TYPE_PHOTO[v].variant}
                      alt=""
                      overlay
                      className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                    />
                    {count !== undefined && (
                      <span
                        aria-hidden
                        className="num absolute end-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur"
                      >
                        {formatNumber(count, lang)}
                      </span>
                    )}
                    <span className="absolute inset-x-3 bottom-2.5 text-sm font-semibold text-white drop-shadow">
                      {label("ptype", v)}
                    </span>
                    {count !== undefined && (
                      <span className="sr-only">
                        {" "}
                        {t("discover.typeCount", {
                          n: formatNumber(count, lang),
                        })}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div data-rise className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-xl font-semibold">{heading}</h2>
            {active && meta && (
              <span className="num text-sm text-muted" aria-live="polite">
                {t("discover.resultCount", {
                  n: formatNumber(meta.total, lang),
                })}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {active && (
              <Button variant="ghost" size="sm" onClick={clear}>
                {t("common.clearFilters")}
              </Button>
            )}
            <Select
              label={t("discover.sort")}
              value={sortKey}
              wrapperClassName="min-w-44"
              onChange={(e) => update({ ...sorts[e.target.value], page: 1 })}
            >
              {Object.keys(sorts).map((k) => (
                <option key={k} value={k}>
                  {t(`discover.sort${k[0].toUpperCase()}${k.slice(1)}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div aria-live="polite" aria-busy={q.isFetching}>
          {q.isLoading ? (
            <LoadingSkeleton variant="cards" rows={limit} />
          ) : q.error ? (
            <Card>
              <ErrorState error={q.error} onRetry={() => q.refetch()} />
            </Card>
          ) : meta && meta.total === 0 ? (
            <Card>{empty}</Card>
          ) : (
            <div
              className={cn(
                "transition-opacity",
                q.isPlaceholderData && "opacity-60",
              )}
            >
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {view === "units"
                  ? units.data?.data.map((u) => (
                      <li key={u.id}>
                        <UnitCard unit={u} />
                      </li>
                    ))
                  : props.data?.data.map((p) => (
                      <li key={p.id}>
                        <PropertyCard property={p} />
                      </li>
                    ))}
              </ul>
              {meta && active && (
                <Card className="mt-5">
                  <Pagination
                    {...meta}
                    onPageChange={(page) => update({ page })}
                  />
                </Card>
              )}
              {meta && !active && meta.total > limit && (
                <p className="mt-4 text-end text-sm">
                  <Link
                    className="font-medium text-accent-ink hover:underline dark:text-accent"
                    to={view === "units" ? paths.units : paths.properties}
                  >
                    {t("home.seeAll")}
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
