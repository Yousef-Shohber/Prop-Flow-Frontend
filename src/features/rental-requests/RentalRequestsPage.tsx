import { useQuery } from "@tanstack/react-query";
import { ClipboardList, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { rentalRequestsApi } from "@/api/rentalRequests";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FilterBar, type FilterField } from "@/components/ui/FilterBar";
import { Banner } from "@/components/ui/Misc";
import { CountBadge, PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useListParams } from "@/hooks/useListParams";
import { useEnumLabel, useI18n } from "@/i18n";
import { formatDate, fullName } from "@/lib/format";
import { paths } from "@/routes/paths";
import { RentalRequestStatus } from "@/types/enums";
import type { RentalRequest } from "@/types/models";

export default function RentalRequestsPage() {
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
    status: f.status as RentalRequestStatus | undefined,
    unitId: f.unitId,
  };
  const q = useQuery({
    queryKey: ["rental-requests", "list", params],
    queryFn: () => rentalRequestsApi.list(params),
    placeholderData: (p) => p,
  });

  const fields: FilterField[] = [
    {
      type: "select",
      key: "status",
      label: t("common.status"),
      options: RentalRequestStatus.map((v) => ({
        value: v,
        label: label("rr", v),
      })),
    },
  ];
  const dates = (r: RentalRequest) => (
    <span className="num whitespace-nowrap text-muted">
      {formatDate(r.startDate, lang)} → {formatDate(r.endDate, lang)}
    </span>
  );

  const columns: Column<RentalRequest>[] = [
    {
      key: "unit",
      header: t("rr.unit"),
      cell: (r) => (
        <span className="font-medium">
          {t("units.unit", { n: r.unit?.unitNumber ?? "—" })}
        </span>
      ),
    },
    ...(!tenant
      ? [
          {
            key: "tenant",
            header: t("rr.requester"),
            cell: (r: RentalRequest) => (
              <div>
                <p className="font-medium">{fullName(r.tenant) || "—"}</p>
                {r.tenant?.phone && (
                  <p
                    className="num text-xs text-muted"
                    dir="ltr"
                    style={{ textAlign: "start" }}
                  >
                    {r.tenant.phone}
                  </p>
                )}
              </div>
            ),
          },
        ]
      : []),
    { key: "dates", header: t("rr.period"), sortKey: "startDate", cell: dates },
    {
      key: "status",
      header: t("common.status"),
      cell: (r) => <StatusBadge kind="rentalRequest" value={r.status} />,
    },
    {
      key: "created",
      header: t("common.created"),
      sortKey: "createdAt",
      cell: (r) => (
        <span className="num text-muted">{formatDate(r.createdAt, lang)}</span>
      ),
    },
  ];
  const has = Object.values(f).some(Boolean);

  return (
    <>
      <PageHeader
        icon={ClipboardList}
        badge={<CountBadge n={q.data?.meta.total} />}
        title={t("rr.title")}
        subtitle={tenant ? t("rr.subTenant") : t("rr.subOwner")}
      />
      {f.unitId && (
        <Banner
          tone="blue"
          className="mb-4"
          action={
            <Button
              size="sm"
              variant="ghost"
              icon={<X className="size-4" />}
              onClick={() => update({ filters: { unitId: undefined } })}
            >
              {t("leases.clearScope")}
            </Button>
          }
        >
          {t("leases.forUnit")}
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
        rowKey={(r) => r.id}
        page={state.page}
        limit={state.limit}
        total={q.data?.meta.total ?? 0}
        totalPages={q.data?.meta.totalPages ?? 1}
        onPageChange={(page) => update({ page })}
        onLimitChange={(limit) => update({ limit, page: 1 })}
        sort={{ sortBy: state.sortBy, sortOrder: state.sortOrder }}
        onSortChange={(s) => update({ ...s, page: 1 })}
        onRowClick={(r) => navigate(paths.rentalRequest(r.id))}
        emptyState={
          has ? (
            <EmptyState variant="no-results" onClear={reset} />
          ) : (
            <EmptyState
              icon={ClipboardList}
              title={t("rr.empty")}
              description={tenant ? t("rr.emptyTenant") : undefined}
              action={
                tenant && (
                  <Button to={paths.properties}>{t("nav.properties")}</Button>
                )
              }
            />
          )
        }
        mobileCard={(r) => (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">
                {t("units.unit", { n: r.unit?.unitNumber ?? "—" })}
              </p>
              <StatusBadge kind="rentalRequest" value={r.status} />
            </div>
            {!tenant && <p className="text-sm">{fullName(r.tenant)}</p>}
            <p className="text-xs">{dates(r)}</p>
          </div>
        )}
      />
    </>
  );
}
