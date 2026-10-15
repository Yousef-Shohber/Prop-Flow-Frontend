import { Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { usersApi } from "@/api/users";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FilterBar, type FilterField } from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/Field";
import { Avatar, Banner, Tag } from "@/components/ui/Misc";
import { CountBadge, PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { Switch } from "@/components/ui/Switch";
import { useInvalidate } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { useListParams } from "@/hooks/useListParams";
import { toast } from "@/hooks/useToast";
import { useEnumLabel, useI18n } from "@/i18n";
import { formatDate, fullName } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";
import { UserRole } from "@/types/enums";
import type { User } from "@/types/models";

export default function UsersPage() {
  const { t, lang } = useI18n();
  const label = useEnumLabel();
  const apiError = useApiError();
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const inv = useInvalidate();
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
    role: (f.role || undefined) as UserRole | undefined,
    isActive:
      f.isActive === "" || f.isActive === undefined
        ? undefined
        : f.isActive === "true",
  };
  const q = useQuery({
    queryKey: ["users", "list", params],
    queryFn: () => usersApi.list(params),
    placeholderData: (p) => p,
  });
  const [confirm, setConfirm] = useState<{
    kind: "deactivate" | "unverify";
    user: User;
  } | null>(null);

  const afterChange = async (u: User, extra?: "verification") => {
    await qc.invalidateQueries({ queryKey: ["users", "list"] });
    if (u.id === me?.id) await inv.me();
    if (extra)
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["properties"] }),
        qc.invalidateQueries({ queryKey: ["units"] }),
        qc.invalidateQueries({ queryKey: ["analytics"] }),
      ]);
  };
  const status = useMutation({
    mutationFn: ({ u, active }: { u: User; active: boolean }) =>
      usersApi.setStatus(u.id, active),
    onSuccess: async (_r, { u, active }) => {
      toast.success(
        active ? t("users.activatedToast") : t("users.deactivatedToast"),
      );
      setConfirm(null);
      await afterChange(u);
    },
    onError: (e) => {
      setConfirm(null);
      toast.error(apiError(e));
    },
  });
  const role = useMutation({
    mutationFn: ({ u, r }: { u: User; r: UserRole }) =>
      usersApi.setRole(u.id, r),
    onSuccess: async (_r, { u }) => {
      toast.success(t("users.roleToast"));
      await afterChange(u, "verification");
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const verify = useMutation({
    mutationFn: ({ u, v }: { u: User; v: boolean }) =>
      usersApi.setOwnerVerification(u.id, v),
    onSuccess: async (_r, { u, v }) => {
      toast.success(v ? t("users.verifiedToast") : t("users.unverifiedToast"));
      setConfirm(null);
      await afterChange(u, "verification");
    },
    onError: (e) => {
      setConfirm(null);
      toast.error(apiError(e));
    },
  });

  const fields: FilterField[] = [
    {
      type: "select",
      key: "role",
      label: t("users.role"),
      allLabel: t("users.allRoles"),
      options: UserRole.map((v) => ({ value: v, label: label("role", v) })),
    },
    {
      type: "select",
      key: "isActive",
      label: t("users.status"),
      allLabel: t("users.allStatus"),
      options: [
        { value: "true", label: t("users.activeOnly") },
        { value: "false", label: t("users.inactiveOnly") },
      ],
    },
  ];
  const columns: Column<User>[] = [
    {
      key: "user",
      header: t("users.user"),
      sortKey: "firstName",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar user={u} size={38} />
          <div className="min-w-0">
            <p className="truncate font-medium">{fullName(u)}</p>
            <p
              className="truncate text-xs text-muted"
              dir="ltr"
              style={{ textAlign: "start" }}
            >
              {u.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: t("users.role"),
      sortKey: "role",
      cell: (u) => (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label={t("users.role")}
            className="h-9 min-w-36 py-0 text-xs"
            wrapperClassName="w-40"
            value={u.role}
            disabled={u.id === me?.id || role.isPending}
            title={u.id === me?.id ? t("users.self") : undefined}
            onChange={(e) => role.mutate({ u, r: e.target.value as UserRole })}
          >
            {UserRole.map((r) => (
              <option key={r} value={r}>
                {label("role", r)}
              </option>
            ))}
          </Select>
          {!u.roleSelected && (
            <Tag className="bg-[var(--amber-bg)] text-[var(--amber-fg)]">
              {t("users.roleNotChosen")}
            </Tag>
          )}
        </div>
      ),
    },
    {
      key: "active",
      header: t("users.active"),
      cell: (u) => (
        <Switch
          label={`${t("users.active")}: ${fullName(u)}`}
          checked={u.isActive}
          disabled={u.id === me?.id || status.isPending}
          onCheckedChange={(on) =>
            on
              ? status.mutate({ u, active: true })
              : setConfirm({ kind: "deactivate", user: u })
          }
        />
      ),
    },
    {
      key: "verified",
      header: t("users.verified"),
      sortKey: undefined,
      cell: (u) =>
        u.role === "OWNER" ? (
          <Switch
            label={`${t("users.verified")}: ${fullName(u)}`}
            checked={u.ownerVerified}
            disabled={verify.isPending}
            onCheckedChange={(on) =>
              on
                ? verify.mutate({ u, v: true })
                : setConfirm({ kind: "unverify", user: u })
            }
          />
        ) : (
          <span className="text-faint">—</span>
        ),
    },
    {
      key: "joined",
      header: t("users.joined"),
      sortKey: "createdAt",
      cell: (u) => (
        <span className="num text-muted">{formatDate(u.createdAt, lang)}</span>
      ),
    },
  ];
  const has = Object.values(f).some(Boolean);

  return (
    <>
      <PageHeader
        icon={Users}
        badge={<CountBadge n={q.data?.meta.total} />}
        title={t("users.title")}
        subtitle={t("users.sub")}
      />
      <Banner tone="blue" className="mb-5">
        {t("users.pendingHint")} {t("users.roleChangeNote")}
      </Banner>
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
        rowKey={(u) => u.id}
        page={state.page}
        limit={state.limit}
        total={q.data?.meta.total ?? 0}
        totalPages={q.data?.meta.totalPages ?? 1}
        onPageChange={(page) => update({ page })}
        onLimitChange={(limit) => update({ limit, page: 1 })}
        sort={{ sortBy: state.sortBy, sortOrder: state.sortOrder }}
        onSortChange={(s) => update({ ...s, page: 1 })}
        emptyState={
          has ? (
            <EmptyState variant="no-results" onClear={reset} />
          ) : (
            <EmptyState title={t("empty.noData")} />
          )
        }
      />
      <ConfirmDialog
        open={confirm?.kind === "deactivate"}
        destructive
        loading={status.isPending}
        title={t("users.deactivateTitle", { name: fullName(confirm?.user) })}
        description={t("users.deactivateText")}
        confirmLabel={t("users.deactivated")}
        onConfirm={() =>
          confirm && status.mutate({ u: confirm.user, active: false })
        }
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.kind === "unverify"}
        destructive
        loading={verify.isPending}
        title={t("users.unverifyTitle")}
        description={t("users.unverifyText")}
        confirmLabel={t("common.confirm")}
        onConfirm={() =>
          confirm && verify.mutate({ u: confirm.user, v: false })
        }
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
