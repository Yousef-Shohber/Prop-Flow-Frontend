import { useQuery } from "@tanstack/react-query";
import { Plus, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { maintenanceApi } from "@/api/maintenance";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FilterBar, type FilterField } from "@/components/ui/FilterBar";
import { ExportButton } from "@/components/ui/ExportButton";
import { fetchAll } from "@/lib/fetchAll";
import { CountBadge, PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tag } from "@/components/ui/Misc";
import { useAuth } from "@/hooks/useAuth";
import { useListParams } from "@/hooks/useListParams";
import { useEnumLabel, useI18n } from "@/i18n";
import { formatDate } from "@/lib/format";
import { paths } from "@/routes/paths";
import {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
} from "@/types/enums";
import type { MaintenanceRequest } from "@/types/models";
import { PropertyLink } from "../units/UnitBits";

export default function MaintenancePage() {
  const { t, lang } = useI18n();
  const label = useEnumLabel();
  const { role } = useAuth();
  const navigate = useNavigate();
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
    priority: f.priority as never,
    category: f.category as never,
  };
  const q = useQuery({
    queryKey: ["maintenance", "list", params],
    queryFn: () => maintenanceApi.list(params),
    placeholderData: (p) => p,
  });

  const fields: FilterField[] = [
    {
      type: "select",
      key: "status",
      label: t("common.status"),
      options: MaintenanceStatus.map((v) => ({
        value: v,
        label: label("mnt", v),
      })),
    },
    {
      type: "select",
      key: "priority",
      label: t("mnt.priority"),
      options: MaintenancePriority.map((v) => ({
        value: v,
        label: label("pri", v),
      })),
    },
    {
      type: "select",
      key: "category",
      label: t("mnt.category"),
      options: MaintenanceCategory.map((v) => ({
        value: v,
        label: label("cat", v),
      })),
    },
  ];
  const columns: Column<MaintenanceRequest>[] = [
    {
      key: "title",
      header: t("mnt.titleField"),
      cell: (m) => (
        <span className="line-clamp-1 max-w-64 font-medium">{m.title}</span>
      ),
    },
    {
      key: "category",
      header: t("mnt.category"),
      cell: (m) => <Tag>{label("cat", m.category)}</Tag>,
    },
    {
      key: "priority",
      header: t("mnt.priority"),
      sortKey: "priority",
      cell: (m) => <StatusBadge kind="priority" value={m.priority} />,
    },
    {
      key: "status",
      header: t("common.status"),
      sortKey: "status",
      cell: (m) => <StatusBadge kind="maintenance" value={m.status} />,
    },
    {
      key: "unit",
      header: t("mnt.unit"),
      cell: (m) => (
        <div>
          <p>{t("units.unit", { n: m.unit.unitNumber })}</p>
          <PropertyLink
            propertyId={m.unit.propertyId}
            className="text-xs text-muted"
          />
        </div>
      ),
    },
    {
      key: "scheduled",
      header: t("mnt.scheduled"),
      cell: (m) => (
        <span className="num text-muted">
          {m.scheduledDate ? formatDate(m.scheduledDate, lang) : "—"}
        </span>
      ),
    },
    {
      key: "created",
      header: t("mnt.createdAt"),
      sortKey: "createdAt",
      cell: (m) => (
        <span className="num text-muted">{formatDate(m.createdAt, lang)}</span>
      ),
    },
  ];
  const sub =
    role === "TENANT"
      ? t("mnt.subTenant")
      : role === "MAINTENANCE_STAFF"
        ? t("mnt.subStaff")
        : t("mnt.subOwner");
  const has = Object.values(f).some(Boolean);

  return (
    <>
      <PageHeader
        icon={Wrench}
        badge={<CountBadge n={q.data?.meta.total} />}
        title={t("mnt.title")}
        subtitle={sub}
        actions={
          <>
            {(role === "OWNER" || role === "ADMIN") && (
              <ExportButton
                name="maintenance"
                disabled={!q.data?.meta.total}
                load={async () => {
                  const { page: _p, limit: _l, ...filters } = params;
                  const { rows, truncated } = await fetchAll((page, limit) =>
                    maintenanceApi.list({ ...filters, page, limit }),
                  );
                  return {
                    truncated,
                    headers: [
                      t("export.col.title"),
                      t("export.col.unit"),
                      t("export.col.category"),
                      t("export.col.priority"),
                      t("export.col.status"),
                      t("export.col.scheduled"),
                      t("export.col.created"),
                      t("export.col.resolved"),
                    ],
                    rows: rows.map((m) => [
                      m.title,
                      m.unit.unitNumber,
                      label("cat", m.category),
                      label("pri", m.priority),
                      label("mnt", m.status),
                      m.scheduledDate ?? "",
                      m.createdAt.slice(0, 10),
                      m.resolvedAt ? m.resolvedAt.slice(0, 10) : "",
                    ]),
                  };
                }}
              />
            )}
            {role === "TENANT" && (
              <Button
                to={paths.maintenanceNew}
                icon={<Plus className="size-4" />}
              >
                {t("mnt.new")}
              </Button>
            )}
          </>
        }
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
        rowKey={(m) => m.id}
        page={state.page}
        limit={state.limit}
        total={q.data?.meta.total ?? 0}
        totalPages={q.data?.meta.totalPages ?? 1}
        onPageChange={(page) => update({ page })}
        onLimitChange={(limit) => update({ limit, page: 1 })}
        sort={{ sortBy: state.sortBy, sortOrder: state.sortOrder }}
        onSortChange={(s) => update({ ...s, page: 1 })}
        onRowClick={(m) => navigate(paths.maintenanceItem(m.id))}
        emptyState={
          has ? (
            <EmptyState variant="no-results" onClear={reset} />
          ) : (
            <EmptyState
              icon={Wrench}
              title={t("mnt.empty")}
              description={
                role === "TENANT"
                  ? t("mnt.emptyTenant")
                  : role === "MAINTENANCE_STAFF"
                    ? t("mnt.emptyStaff")
                    : undefined
              }
              action={
                role === "TENANT" && (
                  <Button to={paths.maintenanceNew}>{t("mnt.new")}</Button>
                )
              }
            />
          )
        }
        mobileCard={(m) => (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{m.title}</p>
              <StatusBadge kind="maintenance" value={m.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <StatusBadge kind="priority" value={m.priority} />
              <span>{t("units.unit", { n: m.unit.unitNumber })}</span>
              <span className="num">{formatDate(m.createdAt, lang)}</span>
            </div>
          </div>
        )}
      />
    </>
  );
}
