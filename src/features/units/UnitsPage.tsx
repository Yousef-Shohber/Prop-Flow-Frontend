import { useQuery } from "@tanstack/react-query";
import { DoorOpen } from "lucide-react";
import { propertiesApi } from "@/api/properties";
import { unitsApi } from "@/api/units";
import { Card } from "@/components/ui/Misc";
import { FilterBar, type FilterField } from "@/components/ui/FilterBar";
import { CountBadge, PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Field";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/ui/States";
import { useAuth } from "@/hooks/useAuth";
import { usePendingRequestMap } from "@/hooks/queries";
import { useListParams } from "@/hooks/useListParams";
import { useEnumLabel, useI18n } from "@/i18n";
import { UnitStatus } from "@/types/enums";
import { UnitCard } from "./UnitBits";
import { UnitsTable } from "./UnitsTable";

const TENANT_SORTS: Record<
  string,
  { sortBy: string; sortOrder: "ASC" | "DESC" }
> = {
  newest: { sortBy: "createdAt", sortOrder: "DESC" },
  priceAsc: { sortBy: "rentAmount", sortOrder: "ASC" },
  priceDesc: { sortBy: "rentAmount", sortOrder: "DESC" },
};

export default function UnitsPage() {
  const { t } = useI18n();
  const label = useEnumLabel();
  const { role } = useAuth();
  const isTenant = role === "TENANT";
  const { state, update, reset } = useListParams({
    sortBy: "createdAt",
    sortOrder: "DESC",
    limit: isTenant ? 12 : 20,
  });
  const f = state.filters;
  const pending = usePendingRequestMap();

  // owners/admins can filter by property: their own properties from GET /properties
  const props = useQuery({
    queryKey: ["properties", "list", { limit: 100, for: "filter" }],
    queryFn: () =>
      propertiesApi.list({ limit: 100, sortBy: "name", sortOrder: "ASC" }),
    enabled: !isTenant,
  });

  const params = {
    page: state.page,
    limit: state.limit,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    bedrooms: f.bedrooms,
    minArea: f.minArea,
    maxArea: f.maxArea,
    minPrice: f.minPrice,
    maxPrice: f.maxPrice,
    ...(isTenant
      ? {}
      : { status: f.status as never, propertyId: f.propertyId }),
  };
  const q = useQuery({
    queryKey: ["units", "list", params],
    queryFn: () => unitsApi.list(params),
    placeholderData: (p) => p,
  });

  const fields: FilterField[] = [
    ...(isTenant
      ? []
      : [
          {
            type: "select" as const,
            key: "status",
            label: t("units.status"),
            options: UnitStatus.map((v) => ({
              value: v,
              label: label("unit", v),
            })),
          },
          {
            type: "select" as const,
            key: "propertyId",
            label: t("units.property"),
            allLabel: t("units.allProperties"),
            options: (props.data?.data ?? []).map((p) => ({
              value: p.id,
              label: p.name,
            })),
          },
        ]),
    { type: "number", key: "bedrooms", label: t("units.bedrooms") },
    { type: "number", key: "minArea", label: t("units.minArea"), max: 9999 },
    { type: "number", key: "maxArea", label: t("units.maxArea"), max: 9999 },
    { type: "number", key: "minPrice", label: t("units.minPrice") },
    { type: "number", key: "maxPrice", label: t("units.maxPrice") },
  ];

  const hasFilters = Object.values(f).some(Boolean);
  const empty = hasFilters ? (
    <EmptyState variant="no-results" onClear={reset} />
  ) : (
    <EmptyState
      icon={DoorOpen}
      title={t("units.noUnits")}
      description={t("units.noUnitsText")}
    />
  );
  const sortKey =
    Object.entries(TENANT_SORTS).find(
      ([, v]) => v.sortBy === state.sortBy && v.sortOrder === state.sortOrder,
    )?.[0] ?? "newest";

  return (
    <>
      <PageHeader
        icon={DoorOpen}
        badge={<CountBadge n={q.data?.meta.total} />}
        title={t("units.title")}
        subtitle={isTenant ? t("units.subTenant") : t("units.subOwner")}
      />
      <div className="mb-5 space-y-4">
        <FilterBar
          fields={fields}
          values={f}
          onChange={(patch) => update({ filters: patch })}
          onReset={reset}
        />
        {isTenant && (
          <div className="max-w-56">
            <Select
              label={t("common.sortBy")}
              value={sortKey}
              onChange={(e) =>
                update({ ...TENANT_SORTS[e.target.value], page: 1 })
              }
            >
              <option value="newest">{t("units.sortNewest")}</option>
              <option value="priceAsc">{t("units.sortPriceAsc")}</option>
              <option value="priceDesc">{t("units.sortPriceDesc")}</option>
            </Select>
          </div>
        )}
      </div>

      {isTenant ? (
        q.isLoading ? (
          <LoadingSkeleton variant="cards" rows={6} />
        ) : q.error ? (
          <Card>
            <ErrorState error={q.error} onRetry={() => q.refetch()} />
          </Card>
        ) : q.data && q.data.data.length === 0 ? (
          <Card>{empty}</Card>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {q.data?.data.map((u) => (
                <li key={u.id}>
                  <UnitCard unit={u} pending={pending} />
                </li>
              ))}
            </ul>
            {q.data && (
              <Card className="mt-6">
                <Pagination
                  {...q.data.meta}
                  onPageChange={(page) => update({ page })}
                  onLimitChange={(limit) => update({ limit, page: 1 })}
                />
              </Card>
            )}
          </>
        )
      ) : (
        <UnitsTable
          result={q.data}
          isLoading={q.isLoading}
          error={q.error}
          onRetry={() => q.refetch()}
          page={state.page}
          limit={state.limit}
          onPageChange={(page) => update({ page })}
          onLimitChange={(limit) => update({ limit, page: 1 })}
          sort={{ sortBy: state.sortBy, sortOrder: state.sortOrder }}
          onSortChange={(s) => update({ ...s, page: 1 })}
          emptyState={empty}
        />
      )}
    </>
  );
}
