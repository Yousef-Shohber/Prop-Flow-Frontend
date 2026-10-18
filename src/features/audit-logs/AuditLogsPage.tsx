import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Copy,
  ExternalLink,
  History,
  ScrollText,
  UserRound,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { auditLogsApi } from "@/api/auditLogs";
import { Avatar, Tag } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { ExportButton } from "@/components/ui/ExportButton";
import { FilterBar, type FilterField } from "@/components/ui/FilterBar";
import { CountBadge, PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { useAllUsers } from "@/hooks/queries";
import { useListParams } from "@/hooks/useListParams";
import { toast } from "@/hooks/useToast";
import { useEnumLabel, useI18n } from "@/i18n";
import { fetchAll } from "@/lib/fetchAll";
import { formatDateTime, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AuditAction } from "@/types/enums";
import type { AuditLog } from "@/types/models";
import {
  detailsList,
  getChanges,
  recordPath,
  summarize,
  type DescribeCtx,
} from "./describe";
import { useAuditRefs } from "./useAuditRefs";

const ENTITIES = [
  "Property",
  "Unit",
  "Lease",
  "RentalRequest",
  "LeaseRenewalRequest",
  "MaintenanceRequest",
  "User",
];

function CopyId({ value }: { value: string }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      aria-label={t("audit.copy")}
      title={t("audit.copy")}
      onClick={() => {
        void navigator.clipboard
          ?.writeText(value)
          .then(() => toast.success(t("audit.copied")))
          .catch(() => undefined);
      }}
    >
      <Copy className="size-4" aria-hidden />
    </button>
  );
}

export default function AuditLogsPage() {
  const { t, lang, has } = useI18n();
  const label = useEnumLabel();
  const ent = (e: string) => (has(`entity.${e}`) ? t(`entity.${e}`) : e);
  const { state, update, reset } = useListParams({
    sortBy: "createdAt",
    sortOrder: "DESC",
    limit: 20,
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
  const userName = useCallback(
    (id?: string | null) => (id ? fullName(userMap.get(id)) : ""),
    [userMap],
  );
  const { entityOf, refOf } = useAuditRefs(q.data?.data, userName);

  const actorOf = (l: AuditLog) => {
    const a = l.actor ?? (l.userId ? userMap.get(l.userId) : undefined);
    return a
      ? {
          name: fullName(a),
          role: a.role,
          email: a.email,
          avatar: userMap.get(l.userId ?? "")?.avatar ?? null,
        }
      : null;
  };
  const ctxFor = (l: AuditLog): DescribeCtx => ({
    t,
    has,
    lang,
    enumLabel: label as DescribeCtx["enumLabel"],
    ref: refOf(l),
  });

  const recordLabel = (l: AuditLog) => {
    const v = entityOf(l);
    if (v === undefined) return <span className="text-faint">…</span>;
    if (v === null)
      return (
        <span className="text-xs text-faint">{t("audit.unavailable")}</span>
      );
    return (
      <span className="min-w-0 truncate text-sm" dir="auto">
        {v}
      </span>
    );
  };

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
      label: t("audit.record"),
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
      cell: (l) => {
        const a = actorOf(l);
        if (!a)
          return (
            <span className="text-muted">
              {l.userId ? "…" : t("audit.system")}
            </span>
          );
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar
              user={{
                firstName: a.name.split(" ")[0],
                lastName: a.name.split(" ").slice(1).join(" "),
                avatar: a.avatar,
              }}
              size={30}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" dir="auto">
                {a.name}
              </p>
              <p className="text-xs text-muted">{label("role", a.role)}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "what",
      header: t("audit.whatHappened"),
      cell: (l) => {
        const s = summarize(ctxFor(l), l);
        return (
          <div className="min-w-0">
            <p className="font-medium">{label("audit", l.action)}</p>
            {s && (
              <p className="mt-0.5 text-xs text-muted" dir="auto">
                {s}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "record",
      header: t("audit.record"),
      cell: (l) => (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Tag>{ent(l.entity)}</Tag>
          {recordLabel(l)}
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
  const has_ = Object.values(f).some(Boolean);

  const exportLoad = async () => {
    const { page: _p, limit: _l, ...filters } = params;
    const { rows, truncated } = await fetchAll((page, limit) =>
      auditLogsApi.list({ ...filters, page, limit }),
    );
    return {
      truncated,
      headers: [
        t("export.col.when"),
        t("export.col.by"),
        t("export.col.email"),
        t("export.col.action"),
        t("export.col.type"),
        t("export.col.record"),
        t("export.col.details"),
      ],
      rows: rows.map((l) => {
        const a = actorOf(l);
        const rec =
          typeof l.entityLabel === "string"
            ? l.entityLabel
            : l.entity === "User"
              ? userName(l.entityId)
              : "";
        return [
          formatDateTime(l.createdAt, lang),
          a?.name ?? "",
          a?.email ?? "",
          label("audit", l.action),
          ent(l.entity),
          rec,
          summarize(ctxFor(l), l),
        ];
      }),
    };
  };

  const ctxOpen = open ? ctxFor(open) : null;
  const changes = open && ctxOpen ? getChanges(ctxOpen, open) : [];
  const list = open && ctxOpen ? detailsList(ctxOpen, open) : [];
  const summary = open && ctxOpen ? summarize(ctxOpen, open) : "";
  const openActor = open ? actorOf(open) : null;
  const link = open ? recordPath(open) : null;
  const rec = open ? entityOf(open) : undefined;

  return (
    <>
      <PageHeader
        icon={History}
        badge={<CountBadge n={q.data?.meta.total} />}
        title={t("audit.title")}
        subtitle={t("audit.sub")}
        actions={
          <ExportButton
            name="audit-log"
            disabled={!q.data?.meta.total}
            load={exportLoad}
          />
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
          has_ ? (
            <EmptyState variant="no-results" onClear={reset} />
          ) : (
            <EmptyState icon={ScrollText} title={t("audit.empty")} />
          )
        }
        mobileCard={(l) => {
          const a = actorOf(l);
          const s = summarize(ctxFor(l), l);
          return (
            <div className="space-y-1">
              <p className="font-semibold">{label("audit", l.action)}</p>
              {s && (
                <p className="text-sm text-muted" dir="auto">
                  {s}
                </p>
              )}
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                <Tag>{ent(l.entity)}</Tag>
                {a && <span dir="auto">{a.name}</span>}
                <span className="num">{formatDateTime(l.createdAt, lang)}</span>
              </p>
            </div>
          );
        }}
      />
      <Dialog
        open={!!open}
        onOpenChange={(o) => !o && setOpen(null)}
        title={open ? label("audit", open.action) : ""}
        className="max-w-xl"
      >
        {open && (
          <div className="space-y-5">
            {summary && (
              <p
                className="rounded-xl bg-surface-2 px-4 py-3 text-sm"
                dir="auto"
              >
                {summary}
              </p>
            )}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
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
                <dd className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span dir="auto">
                    {openActor
                      ? `${openActor.name} · ${label("role", openActor.role)}`
                      : open.userId
                        ? "…"
                        : t("audit.system")}
                  </span>
                  {open.userId && (
                    <button
                      type="button"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-accent-ink hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                      onClick={() => {
                        update({ filters: { userId: open.userId! }, page: 1 });
                        setOpen(null);
                      }}
                    >
                      <UserRound className="size-3.5" aria-hidden />
                      {t("audit.onlyThis")}
                    </button>
                  )}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-faint">{t("audit.record")}</dt>
                <dd className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Tag>{ent(open.entity)}</Tag>
                  <span dir="auto">
                    {rec === undefined
                      ? "…"
                      : rec === null
                        ? t("audit.unavailable")
                        : rec}
                  </span>
                  {link && rec !== null && (
                    <Link
                      to={link}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-accent-ink hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <ExternalLink className="size-3.5" aria-hidden />
                      {t("audit.openRecord")}
                    </Link>
                  )}
                </dd>
              </div>
            </dl>

            {changes.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-faint">
                  {t("audit.changes")}
                </p>
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {changes.map((c) => (
                    <li
                      key={c.field}
                      className={cn(
                        "flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2.5 text-sm",
                        c.money && "bg-accent-soft/60",
                      )}
                    >
                      <span className="w-28 shrink-0 font-medium">
                        {c.label}
                      </span>
                      <span
                        className="rounded bg-[var(--red-bg)] px-1.5 text-[var(--red-fg)]"
                        dir="auto"
                      >
                        {c.before}
                      </span>
                      <ArrowRight
                        className="size-3.5 text-faint rtl:rotate-180"
                        aria-hidden
                      />
                      <span
                        className="rounded bg-[var(--green-bg)] px-1.5 text-[var(--green-fg)]"
                        dir="auto"
                      >
                        {c.after}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {list.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-faint">
                  {t("audit.detailsTitle")}
                </p>
                <dl className="divide-y divide-line rounded-xl border border-line text-sm">
                  {list.map((d) => (
                    <div
                      key={d.key}
                      className="flex flex-wrap gap-x-3 gap-y-0.5 px-3.5 py-2.5"
                    >
                      <dt className="w-36 shrink-0 text-muted">{d.label}</dt>
                      <dd className="min-w-0 break-words" dir="auto">
                        {d.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <details className="group rounded-xl border border-line">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3.5 text-sm font-medium text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                {t("audit.technical")}
                <span
                  aria-hidden
                  className="text-faint transition group-open:rotate-90 rtl:-scale-x-100"
                >
                  ›
                </span>
              </summary>
              <dl className="divide-y divide-line border-t border-line text-xs">
                {[
                  [t("audit.entryId"), open.id],
                  [t("audit.actorId"), open.userId],
                  [t("audit.recordId"), open.entityId],
                ]
                  .filter(([, v]) => !!v)
                  .map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center gap-2 px-3.5 py-1.5"
                    >
                      <dt className="w-24 shrink-0 text-muted">{k}</dt>
                      <dd
                        className="min-w-0 flex-1 break-all font-mono"
                        dir="ltr"
                        style={{ textAlign: "start" }}
                      >
                        {v}
                      </dd>
                      <CopyId value={v as string} />
                    </div>
                  ))}
              </dl>
            </details>
          </div>
        )}
      </Dialog>
    </>
  );
}
