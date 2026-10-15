import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, CheckCheck, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "@/api/notifications";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Switch } from "@/components/ui/Switch";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  SuccessState,
} from "@/components/ui/States";
import { unreadKey } from "@/components/layout/Sidebar";
import { toast } from "@/hooks/useToast";
import { useListParams } from "@/hooks/useListParams";
import { useEnumLabel, useI18n } from "@/i18n";
import { formatRelative } from "@/lib/format";
import { notificationTarget } from "./target";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Paginated } from "@/types/api";
import type { AppNotification } from "@/types/models";

export { notificationTarget };

export default function NotificationsPage() {
  const { t, lang, has } = useI18n();
  const label = useEnumLabel();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { state, update } = useListParams({ limit: 20 });
  const unreadOnly = state.filters.unread === "true";
  const params = {
    page: state.page,
    limit: state.limit,
    unread: unreadOnly ? true : undefined,
  };
  const q = useQuery({
    queryKey: ["notifications", "list", params],
    queryFn: () => notificationsApi.list(params),
    placeholderData: (p) => p,
  });
  const unread = q.data?.meta.unreadCount ?? 0;

  const read = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      // optimistic: flip the row and the badge, roll back on error
      await qc.cancelQueries({ queryKey: ["notifications"] });
      const prev = qc.getQueriesData<Paginated<AppNotification>>({
        queryKey: ["notifications", "list"],
      });
      const prevCount = qc.getQueryData<number>(unreadKey);
      qc.setQueriesData<Paginated<AppNotification>>(
        { queryKey: ["notifications", "list"] },
        (old) =>
          old && {
            ...old,
            data: old.data.map((n) =>
              n.id === id ? { ...n, isRead: true } : n,
            ),
            meta: {
              ...old.meta,
              unreadCount: Math.max(0, (old.meta.unreadCount ?? 1) - 1),
            },
          },
      );
      qc.setQueryData<number>(unreadKey, (c) => Math.max(0, (c ?? 1) - 1));
      return { prev, prevCount };
    },
    onError: (_e, _id, ctx) => {
      ctx?.prev.forEach(([k, d]) => qc.setQueryData(k, d));
      if (ctx?.prevCount !== undefined)
        qc.setQueryData(unreadKey, ctx.prevCount);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const readAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: async () => {
      toast.success(t("notif.markedAll"));
      await qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const open = (n: AppNotification) => {
    if (!n.isRead) read.mutate(n.id);
    if (n.type === "OWNER_VERIFICATION_CHANGED")
      void qc.invalidateQueries({ queryKey: ["users", "me"] }); // hides/shows the unverified banner
    const to = notificationTarget(n);
    if (to) navigate(to);
  };

  return (
    <>
      <PageHeader
        icon={Bell}
        title={t("notif.title")}
        actions={
          <>
            <label className="flex items-center gap-2.5 text-sm">
              <Switch
                label={t("notif.unreadOnly")}
                checked={unreadOnly}
                onCheckedChange={(on) =>
                  update({ filters: { unread: on ? "true" : undefined } })
                }
              />
              {t("notif.unreadOnly")}
            </label>
            <Button
              variant="secondary"
              icon={<CheckCheck className="size-4" />}
              disabled={unread === 0}
              loading={readAll.isPending}
              onClick={() => readAll.mutate()}
            >
              {t("notif.markAll")}
            </Button>
          </>
        }
      />
      <Card className="overflow-hidden">
        {q.isLoading ? (
          <LoadingSkeleton variant="list" rows={6} />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : q.data && q.data.data.length === 0 ? (
          unreadOnly ? (
            <SuccessState
              title={t("notif.empty")}
              description={t("notif.emptyText")}
            />
          ) : (
            <EmptyState
              icon={Bell}
              title={t("notif.none")}
              description={t("notif.emptyText")}
            />
          )
        ) : (
          <>
            <ul className="divide-y divide-line">
              {q.data?.data.map((n) => {
                const target = notificationTarget(n);
                // the API sends English text; in Arabic we show the matching localized sentence for the notification type
                const loc = lang === "ar" && has(`notifText.${n.type}.title`);
                const title = loc ? t(`notifText.${n.type}.title`) : n.title;
                const message = loc
                  ? t(`notifText.${n.type}.message`)
                  : n.message;
                const Row = target || !n.isRead ? "button" : "div";
                return (
                  <li key={n.id}>
                    <Row
                      {...(Row === "button"
                        ? { type: "button" as const, onClick: () => open(n) }
                        : {})}
                      className={cn(
                        "flex w-full items-start gap-4 px-5 py-4 text-start transition-colors",
                        Row === "button" && "hover:bg-surface-2/70",
                        !n.isRead && "bg-accent-soft/40",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl",
                          n.isRead
                            ? "bg-surface-2 text-faint"
                            : "bg-accent-soft text-accent-ink",
                        )}
                      >
                        {n.isRead ? (
                          <Bell className="size-5" />
                        ) : (
                          <BellRing className="size-5" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <span
                            className={cn(
                              "text-sm",
                              !n.isRead ? "font-semibold" : "font-medium",
                            )}
                          >
                            {title}
                          </span>
                          {!loc && (
                            <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[0.6875rem] text-muted">
                              {label("notif", n.type)}
                            </span>
                          )}
                        </span>
                        <span
                          className="mt-0.5 block text-sm text-muted"
                          dir="auto"
                        >
                          {message}
                        </span>
                        <span className="mt-1.5 block text-xs text-faint">
                          {formatRelative(n.createdAt, lang)}
                        </span>
                      </span>
                      {!n.isRead && (
                        <span
                          className="mt-2 size-2.5 shrink-0 rounded-full bg-accent"
                          aria-label={t("notif.unread")}
                        />
                      )}
                      {target && (
                        <ChevronLeft
                          className="mt-2 size-4 shrink-0 text-faint ltr:rotate-180"
                          aria-hidden
                        />
                      )}
                    </Row>
                  </li>
                );
              })}
            </ul>
            {q.data && (
              <Pagination
                {...q.data.meta}
                onPageChange={(page) => update({ page })}
                onLimitChange={(limit) => update({ limit, page: 1 })}
              />
            )}
          </>
        )}
      </Card>
    </>
  );
}
