import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ScrollText, History } from "lucide-react";
import { useMemo, useState } from "react";
import { auditLogsApi } from "@/api/auditLogs";
import { leasesApi } from "@/api/leases";
import { maintenanceApi } from "@/api/maintenance";
import { propertiesApi } from "@/api/properties";
import { renewalsApi } from "@/api/renewals";
import { rentalRequestsApi } from "@/api/rentalRequests";
import { unitsApi } from "@/api/units";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { FilterBar, type FilterField } from "@/components/ui/FilterBar";
import { Tag } from "@/components/ui/Misc";
import { CountBadge, PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { useAllUsers } from "@/hooks/queries";
import { useListParams } from "@/hooks/useListParams";
import { useEnumLabel, useI18n } from "@/i18n";
import { formatDateTime, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AuditAction } from "@/types/enums";
import type { AuditLog } from "@/types/models";

export const ENTITIES = [
  "Property",
  "Unit",
  "Lease",
  "RentalRequest",
  "LeaseRenewalRequest",
  "MaintenanceRequest",
  "User",
];

/** Entities whose id can be resolved to a readable name (users come from the users list instead). */
type Resolved = { text: string; unit?: boolean } | null;
const ENTITY_LOOKUP: Record<string, (id: string) => Promise<Resolved>> = {
  Property: async (id) => ({ text: (await propertiesApi.get(id)).name }),
  Unit: async (id) => ({
    text: (await unitsApi.get(id)).unitNumber,
    unit: true,
  }),
  Lease: async (id) => ({
    text: (await leasesApi.get(id)).unit.unitNumber,
    unit: true,
  }),
  MaintenanceRequest: async (id) => ({
    text: (await maintenanceApi.get(id)).title,
  }),
  RentalRequest: async (id) => {
    const r = await rentalRequestsApi.get(id);
    const tenant = fullName(r.tenant);
    if (tenant) return { text: tenant };
    return r.unit ? { text: r.unit.unitNumber, unit: true } : null;
  },
  LeaseRenewalRequest: async (id) => {
    const r = await renewalsApi.get(id);
    const tenant = fullName(r.tenant);
    if (tenant) return { text: tenant };
    return r.unit ? { text: r.unit.unitNumber, unit: true } : null;
  },
};
const metaName = (m: AuditLog["metadata"]) => {
  for (const k of ["name", "title"]) {
    const v = m?.[k];
    if (typeof v === "string") return v;
  }
  return "";
};

/** Shows the entity's name instead of its id; renders nothing while loading or when it can't be resolved (e.g. deleted). */
function EntityName({
  log,
  userName,
}: {
  log: AuditLog;
  userName: (id?: string | null) => string;
}) {
  const { t } = useI18n();
  const lookup = ENTITY_LOOKUP[log.entity];
  const q = useQuery({
    queryKey: ["audit-logs", "entity-name", log.entity, log.entityId],
    queryFn: () => lookup(log.entityId!),
    enabled: !!log.entityId && !!lookup,
    retry: false,
    staleTime: 5 * 60_000,
  });
  let text = "";
  if (log.entity === "User") text = userName(log.entityId);
  else if (q.data)
    text = q.data.unit ? t("units.unit", { n: q.data.text }) : q.data.text;
  else if (q.isError) text = metaName(log.metadata);
  if (!text) return null;
  return (
    <span className="min-w-0 truncate text-sm" dir="auto">
      {text}
    </span>
  );
}
const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

/** metadata has no fixed schema: `changes` renders as before -> after, everything else as formatted JSON. */
export function MetadataView({ metadata }: { metadata: AuditLog["metadata"] }) {
  const { t } = useI18n();
  if (!metadata || Object.keys(metadata).length === 0)
    return <p className="text-sm text-muted">—</p>;
  const { changes, ...rest } = metadata as Record<string, unknown>;
  return (
    <div className="space-y-4">
      {isObj(changes) && (
        <div>
          <p className="mb-2 text-xs font-semibold text-faint">
            {t("audit.changes")}
          </p>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {Object.entries(changes).map(([field, v]) => {
              const c = isObj(v) ? v : { before: v, after: undefined };
              return (
                <li
                  key={field}
                  className={cn(
                    "flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2.5 text-sm",
                    field === "rentAmount" && "bg-accent-soft/60",
                  )}
                >
                  <span className="w-28 shrink-0 font-medium">{field}</span>
                  <span
                    className="num rounded bg-[var(--red-bg)] px-1.5 text-[var(--red-fg)]"
                    dir="auto"
                  >
                    {String(c.before ?? "—")}
                  </span>
                  <ArrowRight
                    className="size-3.5 text-faint rtl:rotate-180"
                    aria-hidden
                  />
                  <span
                    className="num rounded bg-[var(--green-bg)] px-1.5 text-[var(--green-fg)]"
                    dir="auto"
                  >
                    {String(c.after ?? "—")}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {Object.keys(rest).length > 0 && (
        <pre
          dir="ltr"
          className="max-h-72 overflow-auto rounded-xl bg-surface-2 p-3.5 text-start text-xs leading-relaxed"
        >
          {JSON.stringify(rest, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  const { t, lang, has: hasKey } = useI18n();
  const label = useEnumLabel();
  const ent = (e: string) => (hasKey(`entity.${e}`) ? t(`entity.${e}`) : e);
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
    action: f.action,
    entity: f.entity,
    userId: f.userId,
  };
  const q = useQuery({
    queryKey: ["audit-logs", "list", params],
    queryFn: () => auditLogsApi.list(params),
    placeholderData: (p) => p,
  });
  const [open, setOpen] = useState<AuditLog | null>(null);
  const users = useAllUsers();
  const userMap = useMemo(
    () => new Map((users.data ?? []).map((u) => [u.id, u])),
    [users.data],
  );
  const userName = (id?: string | null) =>
    id ? fullName(userMap.get(id)) : "";

  const fields: FilterField[] = [
    {
      type: "select",
      key: "action",
      label: t("audit.action"),
      options: AuditAction.map((v) => ({ value: v, label: label("audit", v) })),
    },
    {
      type: "select",
      key: "entity",
      label: t("audit.entity"),
      options: ENTITIES.map((v) => ({ value: v, label: ent(v) })),
    },
    {
      type: "user",
      key: "userId",
      label: t("audit.userId"),
      users: users.data ?? [],
      placeholder: t("audit.searchUser"),
    },
  ];
  const columns: Column<AuditLog>[] = [
    {
      key: "when",
      header: t("audit.when"),
      sortKey: "createdAt",
      cell: (l) => (
        <span className="num whitespace-nowrap text-muted">
          {formatDateTime(l.createdAt, lang)}
        </span>
      ),
    },
    {
      key: "actor",
      header: t("audit.actor"),
      cell: (l) => <span className="text-sm">{userName(l.userId) || "—"}</span>,
    },
    {
      key: "action",
      header: t("audit.action"),
      cell: (l) => (
        <span className="font-medium">{label("audit", l.action)}</span>
      ),
    },
    {
      key: "entity",
      header: t("audit.entity"),
      cell: (l) => (
        <div className="flex items-center gap-2">
          <Tag>{ent(l.entity)}</Tag>
          <EntityName log={l} userName={userName} />
        </div>
      ),
    },
    {
      key: "details",
      header: "",
      cell: (l) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(l);
          }}
        >
          {t("audit.expand")}
        </Button>
      ),
    },
  ];
  const has = Object.values(f).some(Boolean);

  return (
    <>
      <PageHeader
        icon={History}
        badge={<CountBadge n={q.data?.meta.total} />}
        title={t("audit.title")}
        subtitle={t("audit.sub")}
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
        rowKey={(l) => l.id}
        page={state.page}
        limit={state.limit}
        total={q.data?.meta.total ?? 0}
        totalPages={q.data?.meta.totalPages ?? 1}
        onPageChange={(page) => update({ page })}
        onLimitChange={(limit) => update({ limit, page: 1 })}
        sort={{ sortBy: state.sortBy, sortOrder: state.sortOrder }}
        onSortChange={(s) => update({ ...s, page: 1 })}
        onRowClick={setOpen}
        emptyState={
          has ? (
            <EmptyState variant="no-results" onClear={reset} />
          ) : (
            <EmptyState icon={ScrollText} title={t("audit.empty")} />
          )
        }
        mobileCard={(l) => (
          <div className="space-y-1">
            <p className="font-semibold">{label("audit", l.action)}</p>
            <p className="text-xs text-muted">
              <Tag>{ent(l.entity)}</Tag>{" "}
              <span className="num">{formatDateTime(l.createdAt, lang)}</span>
            </p>
          </div>
        )}
      />
      <Dialog
        open={!!open}
        onOpenChange={(o) => !o && setOpen(null)}
        title={open ? label("audit", open.action) : ""}
        className="max-w-xl"
      >
        {open && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-faint">{t("audit.when")}</dt>
                <dd className="num">{formatDateTime(open.createdAt, lang)}</dd>
              </div>
              <div>
                <dt className="text-xs text-faint">{t("audit.ip")}</dt>
                <dd className="num" dir="ltr" style={{ textAlign: "start" }}>
                  {open.ipAddress ?? "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-faint">{t("audit.actor")}</dt>
                <dd className="text-sm">{userName(open.userId) || "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-faint">{t("audit.entity")}</dt>
                <dd className="flex items-center gap-2">
                  <Tag>{ent(open.entity)}</Tag>
                  <EntityName log={open} userName={userName} />
                </dd>
              </div>
            </dl>
            <MetadataView metadata={open.metadata} />
          </div>
        )}
      </Dialog>
    </>
  );
}
