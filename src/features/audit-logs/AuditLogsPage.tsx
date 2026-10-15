import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ScrollText, History } from "lucide-react";
import { useState } from "react";
import { auditLogsApi } from "@/api/auditLogs";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { FilterBar, type FilterField } from "@/components/ui/FilterBar";
import { Tag } from "@/components/ui/Misc";
import { CountBadge, PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { useListParams } from "@/hooks/useListParams";
import { useEnumLabel, useI18n } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AuditAction } from "@/types/enums";
import type { AuditLog } from "@/types/models";

export const ENTITY_SUGGESTIONS = [
  "Property",
  "Unit",
  "Lease",
  "RentalRequest",
  "MaintenanceRequest",
  "User",
];
const shortId = (id?: string | null) => (id ? `#${id.slice(0, 8)}` : "—");
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

  const fields: FilterField[] = [
    {
      type: "select",
      key: "action",
      label: t("audit.action"),
      options: AuditAction.map((v) => ({ value: v, label: label("audit", v) })),
    },
    {
      type: "text",
      key: "entity",
      label: t("audit.entity"),
      placeholder: ENTITY_SUGGESTIONS.join(" / "),
    },
    { type: "text", key: "userId", label: t("audit.userId") },
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
      cell: (l) => (
        <span
          className="num font-mono text-xs text-muted"
          title={l.userId ?? ""}
        >
          {shortId(l.userId)}
        </span>
      ),
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
          <span
            className="num font-mono text-xs text-muted"
            title={l.entityId ?? ""}
          >
            {shortId(l.entityId)}
          </span>
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
                <dt className="text-xs text-faint">{t("audit.userId")}</dt>
                <dd
                  className="break-all font-mono text-xs"
                  dir="ltr"
                  style={{ textAlign: "start" }}
                >
                  {open.userId ?? "—"}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-faint">{t("audit.entity")}</dt>
                <dd
                  className="break-all font-mono text-xs"
                  dir="ltr"
                  style={{ textAlign: "start" }}
                >
                  {ent(open.entity)} · {open.entityId ?? "—"}
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
