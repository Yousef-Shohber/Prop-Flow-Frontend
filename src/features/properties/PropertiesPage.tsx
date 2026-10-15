import { useQuery } from "@tanstack/react-query";
import { Plus, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { propertiesApi } from "@/api/properties";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FilterBar, type FilterField } from "@/components/ui/FilterBar";
import { Card, Tag } from "@/components/ui/Misc";
import { CountBadge, PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/ui/States";
import { useAuth } from "@/hooks/useAuth";
import { useListParams } from "@/hooks/useListParams";
import { useEnumLabel, useI18n } from "@/i18n";
import { formatDate } from "@/lib/format";
import { useFromState } from "@/lib/backTo";
import { paths } from "@/routes/paths";
import { PropertyType } from "@/types/enums";
import type { Property } from "@/types/models";
import { Cover, PropertyCard } from "./PropertyBits";

export default function PropertiesPage() {
  const { t, lang } = useI18n();
  const label = useEnumLabel();
  const { role } = useAuth();
  const navigate = useNavigate();
  const fromState = useFromState();
  const isTenant = role === "TENANT";
  const { state, update, reset } = useListParams({
    sortBy: "createdAt",
    sortOrder: "DESC",
    limit: isTenant ? 12 : 20,
  });
  const f = state.filters;

  const params = {
    page: state.page,
    limit: state.limit,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    search: f.search,
    city: f.city,
    propertyType: f.propertyType as PropertyType | undefined,
  };
  const q = useQuery({
    queryKey: ["properties", "list", params],
    queryFn: () => propertiesApi.list(params),
    placeholderData: (p) => p,
  });

  const fields: FilterField[] = [
    {
      type: "text",
      key: "search",
      label: t("common.search"),
      placeholder: t("properties.search"),
      wide: true,
    },
    { type: "text", key: "city", label: t("properties.city") },
    {
      type: "select",
      key: "propertyType",
      label: t("properties.type"),
      options: PropertyType.map((v) => ({
        value: v,
        label: label("ptype", v),
      })),
    },
  ];

  const columns: Column<Property>[] = [
    {
      key: "photo",
      header: "",
      className: "w-16",
      cell: (p) => (
        <Cover
          url={p.images[0]?.url}
          alt=""
          className="size-11 rounded-lg object-cover"
        />
      ),
    },
    {
      key: "name",
      header: t("properties.name"),
      sortKey: "name",
      cell: (p) => <span className="font-medium">{p.name}</span>,
    },
    {
      key: "city",
      header: t("properties.city"),
      sortKey: "city",
      cell: (p) => p.city,
    },
    {
      key: "type",
      header: t("properties.type"),
      cell: (p) => <Tag>{label("ptype", p.propertyType)}</Tag>,
    },
    {
      key: "created",
      header: t("common.created"),
      sortKey: "createdAt",
      cell: (p) => (
        <span className="num text-muted">{formatDate(p.createdAt, lang)}</span>
      ),
    },
  ];

  const hasFilters = Object.values(f).some(Boolean);
  const empty = hasFilters ? (
    <EmptyState variant="no-results" onClear={reset} />
  ) : (
    <EmptyState
      title={t("empty.noData")}
      description={
        isTenant ? t("properties.noUnits") : t("properties.noUnitsOwnerText")
      }
      action={
        !isTenant && (
          <Button to={paths.propertyNew} icon={<Plus className="size-4" />}>
            {t("properties.new")}
          </Button>
        )
      }
    />
  );

  return (
    <>
      <PageHeader
        icon={Building2}
        badge={<CountBadge n={q.data?.meta.total} />}
        title={t("properties.title")}
        subtitle={
          isTenant ? t("properties.subTenant") : t("properties.subOwner")
        }
        actions={
          !isTenant && (
            <Button to={paths.propertyNew} icon={<Plus className="size-4" />}>
              {t("properties.new")}
            </Button>
          )
        }
      />
      <FilterBar
        className="mb-5"
        fields={fields}
        values={f}
        onChange={(patch) => update({ filters: patch })}
        onReset={reset}
      />

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
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {q.data?.data.map((p) => (
                <li key={p.id}>
                  <PropertyCard property={p} />
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
        <DataTable
          columns={columns}
          data={q.data?.data}
          isLoading={q.isLoading}
          error={q.error}
          onRetry={() => q.refetch()}
          rowKey={(p) => p.id}
          page={state.page}
          limit={state.limit}
          total={q.data?.meta.total ?? 0}
          totalPages={q.data?.meta.totalPages ?? 1}
          onPageChange={(page) => update({ page })}
          onLimitChange={(limit) => update({ limit, page: 1 })}
          sort={{ sortBy: state.sortBy, sortOrder: state.sortOrder }}
          onSortChange={(s) => update({ ...s, page: 1 })}
          onRowClick={(p) =>
            navigate(paths.property(p.id), { state: fromState })
          }
          emptyState={empty}
          mobileCard={(p) => (
            <div className="flex items-center gap-3">
              <Cover
                url={p.images[0]?.url}
                alt=""
                className="size-14 rounded-xl object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="truncate text-sm text-muted">
                  {p.city} · {label("ptype", p.propertyType)}
                </p>
              </div>
            </div>
          )}
        />
      )}
    </>
  );
}
