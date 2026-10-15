import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { renewalsApi } from "@/api/renewals";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FilterBar, type FilterField } from "@/components/ui/FilterBar";
import { CountBadge, PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useListParams } from "@/hooks/useListParams";
import { useEnumLabel, useI18n } from "@/i18n";
import { formatDate, fullName } from "@/lib/format";
import { paths } from "@/routes/paths";
import { LeaseRenewalRequestStatus } from "@/types/enums";
import type { LeaseRenewalRequest } from "@/types/models";

const DEFAULT_FILTERS = { status: "PENDING" };

/** Inbox: PENDING by default (spec §13), "All" is an explicit choice. */
export default function RenewalsPage() {
  const { t, lang } = useI18n();
  const label = useEnumLabel();
  const { role } = useAuth();
  const navigate = useNavigate();
  const tenant = role === "TENANT";
  const { state, update, reset } = useListParams({
    sortBy: "createdAt",
    sortOrder: "DESC",
    filters: DEFAULT_FILTERS,
  });
  const f = state.filters;
  const params = {
    page: state.page,
    limit: state.limit,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    status: (f.status || undefined) as never,
    leaseId: f.leaseId,
  };
  const q = useQuery({
    queryKey: ["lease-renewals", "list", params],
    queryFn: () => renewalsApi.list(params),
    placeholderData: (p) => p,
  });

  const fields: FilterField[] = [
    {
      type: "select",
      key: "status",
      label: t("common.status"),
      options: LeaseRenewalRequestStatus.map((v) => ({
        value: v,
        label: label("lrr", v),
      })),
    },
  ];
  const columns: Column<LeaseRenewalRequest>[] = [
    {
      key: "unit",
      header: t("lrr.unit"),
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
            header: t("lrr.tenant"),
            cell: (r: LeaseRenewalRequest) => fullName(r.tenant) || "—",
          },
        ]
      : []),
    {
      key: "current",
      header: t("lrr.currentEnd"),
      cell: (r) => (
        <span className="num text-muted">
          {formatDate(r.lease?.endDate, lang)}
        </span>
      ),
    },
    {
      key: "requested",
      header: t("lrr.requestedEnd"),
      sortKey: "requestedEndDate",
      cell: (r) => (
        <span className="num font-medium">
          {formatDate(r.requestedEndDate, lang)}
        </span>
      ),
    },
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
  const filtered = f.status !== "PENDING" || !!f.leaseId;

  return (
    <>
      <PageHeader
        icon={RefreshCw}
        badge={<CountBadge n={q.data?.meta.total} />}
        title={t("lrr.title")}
        subtitle={tenant ? t("lrr.subTenant") : t("lrr.subOwner")}
      />
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
        onRowClick={(r) => navigate(paths.renewal(r.id))}
        emptyState={
          filtered ? (
            <EmptyState variant="no-results" onClear={reset} />
          ) : (
            <EmptyState
              icon={RefreshCw}
              title={t("lrr.empty")}
              description={t("lrr.emptyText")}
            />
          )
        }
        mobileCard={(r) => (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">
                {t("units.unit", { n: r.unit?.unitNumber ?? "—" })}
              </p>
              <StatusBadge kind="rentalRequest" value={r.status} />
            </div>
            {!tenant && <p className="text-sm">{fullName(r.tenant)}</p>}
            <p className="num text-xs text-muted">
              {t("lrr.requestedEnd")}: {formatDate(r.requestedEndDate, lang)}
            </p>
          </div>
        )}
      />
    </>
  );
}
