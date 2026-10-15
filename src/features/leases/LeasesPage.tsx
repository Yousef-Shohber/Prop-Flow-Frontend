import { useQuery } from "@tanstack/react-query";
import { FileSignature, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { leasesApi } from "@/api/leases";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FilterBar, type FilterField } from "@/components/ui/FilterBar";
import { Banner, Money } from "@/components/ui/Misc";
import { CountBadge, PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useListParams } from "@/hooks/useListParams";
import { useEnumLabel, useI18n } from "@/i18n";
import { formatDate, formatMoney } from "@/lib/format";
import { paths } from "@/routes/paths";
import { LeaseStatus } from "@/types/enums";
import type { Lease } from "@/types/models";
import { PropertyLink } from "../units/UnitBits";

export default function LeasesPage() {
  const { t, lang } = useI18n();
  const label = useEnumLabel();
  const { role } = useAuth();
  const navigate = useNavigate();
  const tenant = role === "TENANT";
  const { state, update, reset } = useListParams({
    sortBy: "createdAt",
    sortOrder: "DESC",
  });
  const f = state.filters;
  const params = {
    page: state.page,
    limit: state.limit,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    status: f.status as never,
    unitId: f.unitId,
    tenantId: f.tenantId,
  };
  const q = useQuery({
    queryKey: ["leases", "list", params],
    queryFn: () => leasesApi.list(params),
    placeholderData: (p) => p,
  });
  const fields: FilterField[] = [
    {
      type: "select",
      key: "status",
      label: t("common.status"),
      options: LeaseStatus.map((v) => ({ value: v, label: label("lease", v) })),
    },
  ];

  const dates = (l: Lease) => (
    <span className="num whitespace-nowrap text-muted">
      {formatDate(l.startDate, lang)} → {formatDate(l.endDate, lang)}
    </span>
  );
  const columns: Column<Lease>[] = [
    {
      key: "unit",
      header: t("leases.unit"),
      cell: (l) => (
        <div>
          <p className="font-medium">
            {t("units.unit", { n: l.unit.unitNumber })}
          </p>
          <PropertyLink
            propertyId={l.unit.propertyId}
            className="text-xs text-muted"
          />
        </div>
      ),
    },
    ...(!tenant
      ? [
          {
            key: "tenant",
            header: t("leases.tenant"),
            cell: (l: Lease) => (
              <button
                type="button"
                className="num rounded-md bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted hover:bg-surface-3"
                title={l.tenantId}
                onClick={(e) => {
                  e.stopPropagation();
                  update({ filters: { tenantId: l.tenantId } });
                }}
              >
                #{l.tenantId.slice(0, 8)}
              </button>
            ),
          },
        ]
      : []),
    {
      key: "dates",
      header: t("leases.dates"),
      sortKey: "startDate",
      cell: dates,
    },
    {
      key: "rent",
      header: t("leases.rent"),
      sortKey: "rentAmount",
      cell: (l) => <Money>{formatMoney(l.rentAmount, lang)}</Money>,
    },
    {
      key: "status",
      header: t("common.status"),
      cell: (l) => <StatusBadge kind="lease" value={l.status} />,
    },
  ];
  const has = Object.values(f).some(Boolean);

  return (
    <>
      <PageHeader
        icon={FileSignature}
        badge={<CountBadge n={q.data?.meta.total} />}
        title={t("leases.title")}
        subtitle={tenant ? t("leases.subTenant") : t("leases.subOwner")}
        actions={
          !tenant && (
            <Button to={paths.leaseNew} icon={<Plus className="size-4" />}>
              {t("leases.new")}
            </Button>
          )
        }
      />
      {(f.unitId || f.tenantId) && (
        <Banner
          tone="blue"
          className="mb-4"
          action={
            <Button
              size="sm"
              variant="ghost"
              icon={<X className="size-4" />}
              onClick={() =>
                update({ filters: { unitId: undefined, tenantId: undefined } })
              }
            >
              {t("leases.clearScope")}
            </Button>
          }
        >
          {f.unitId ? t("leases.forUnit") : t("leases.forTenant")}
        </Banner>
      )}
      <FilterBar
        className="mb-5"
        fields={fields}
        values={f}
        onChange={(patch) => update({ filters: patch })}
        onReset={reset}
      />
      <DataTable
        columns={columns}
        data={q.data?.data}
        isLoading={q.isLoading}
        error={q.error}
        onRetry={() => q.refetch()}
        rowKey={(l) => l.id}
        page={state.page}
        limit={state.limit}
        total={q.data?.meta.total ?? 0}
        totalPages={q.data?.meta.totalPages ?? 1}
        onPageChange={(page) => update({ page })}
        onLimitChange={(limit) => update({ limit, page: 1 })}
        sort={{ sortBy: state.sortBy, sortOrder: state.sortOrder }}
        onSortChange={(s) => update({ ...s, page: 1 })}
        onRowClick={(l) => navigate(paths.lease(l.id))}
        emptyState={
          has ? (
            <EmptyState variant="no-results" onClear={reset} />
          ) : (
            <EmptyState
              icon={FileSignature}
              title={t("leases.empty")}
              description={tenant ? t("leases.emptyTenant") : undefined}
              action={
                !tenant && (
                  <Button to={paths.leaseNew}>{t("leases.new")}</Button>
                )
              }
            />
          )
        }
        mobileCard={(l) => (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">
                {t("units.unit", { n: l.unit.unitNumber })}
              </p>
              <StatusBadge kind="lease" value={l.status} />
            </div>
            <p className="text-xs">{dates(l)}</p>
            <p className="num text-sm font-semibold">
              {formatMoney(l.rentAmount, lang)}
            </p>
          </div>
        )}
      />
    </>
  );
}
