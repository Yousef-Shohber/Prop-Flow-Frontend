import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarPlus, Check, Pencil, Wrench, XOctagon } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { leasesApi } from "@/api/leases";
import { renewalsApi } from "@/api/renewals";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import {
  Banner,
  Card,
  CardSection,
  DescriptionList,
  Money,
} from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAllTenants, useInvalidate } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import { useI18n } from "@/i18n";
import { isPast, todayISO, withinWindow, cmpDate } from "@/lib/dates";
import { formatDate, formatMoney, fullName } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";
import { normalizeError } from "@/lib/errors";
import { paths } from "@/routes/paths";
import {
  ApproveRenewalDialog,
  RenewLeaseDialog,
  RequestRenewalDialog,
} from "../renewals/RenewalDialogs";
import { PropertyLink } from "../units/UnitBits";

export default function LeaseDetailPage() {
  const { id = "" } = useParams();
  const { t, lang } = useI18n();
  const apiError = useApiError();
  const { role } = useAuth();
  const tenants = useAllTenants(role !== "TENANT");
  const inv = useInvalidate();
  const manager = role === "OWNER" || role === "ADMIN";
  const q = useQuery({
    queryKey: ["leases", id],
    queryFn: () => leasesApi.get(id),
  });
  const l = q.data;
  const renewal = useQuery({
    queryKey: ["lease-renewals", "pending", id],
    queryFn: () =>
      renewalsApi.list({ leaseId: id, status: "PENDING", limit: 1 }),
    enabled: !!l && l.status === "ACTIVE",
  });
  const [dlg, setDlg] = useState<
    "terminate" | "renew" | "request" | "approve" | "reject" | "cancel" | null
  >(null);

  const refresh = async () => {
    await inv.leases();
    await q.refetch();
    await renewal.refetch();
  };
  const fail = async (e: unknown) => {
    setDlg(null);
    toast.error(apiError(e));
    await refresh();
  }; // state changed elsewhere: explain, then refetch
  const activate = useMutation({
    mutationFn: () => leasesApi.activate(id),
    onSuccess: async () => {
      toast.success(t("leases.activatedToast"));
      await refresh();
    },
    onError: fail,
  });
  const terminate = useMutation({
    mutationFn: () => leasesApi.terminate(id),
    onSuccess: async () => {
      setDlg(null);
      toast.success(t("leases.terminatedToast"));
      await refresh();
    },
    onError: fail,
  });
  const pendingRenewal = renewal.data?.data[0];
  const rejectRenewal = useMutation({
    mutationFn: () => renewalsApi.reject(pendingRenewal!.id),
    onSuccess: async () => {
      setDlg(null);
      toast.success(t("lrr.rejectedToast"));
      await refresh();
    },
    onError: fail,
  });
  const cancelRenewal = useMutation({
    mutationFn: () => renewalsApi.cancel(pendingRenewal!.id),
    onSuccess: async () => {
      setDlg(null);
      toast.success(t("lrr.withdrawnToast"));
      await refresh();
    },
    onError: fail,
  });

  if (q.isLoading) return <LoadingSkeleton />;
  if (q.error || !l)
    return (
      <Card>
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </Card>
    );

  const start = l.startDate.slice(0, 10);
  const end = l.endDate.slice(0, 10);
  const pending = l.status === "PENDING";
  const active = l.status === "ACTIVE";
  const notStarted = cmpDate(start, todayISO()) > 0;
  const ended = isPast(end);
  const canActivate = pending && withinWindow(start, end);
  const activateReason = pending
    ? notStarted
      ? t("leases.notStarted", { date: formatDate(start, lang) })
      : ended
        ? t("leases.periodEnded")
        : ""
    : "";
  const tenant = role === "TENANT";

  return (
    <>
      <PageHeader
        title={t("units.unit", { n: l.unit.unitNumber })}
        subtitle={
          <span className="flex flex-wrap items-center gap-3">
            <StatusBadge kind="lease" value={l.status} />
            <PropertyLink propertyId={l.unit.propertyId} />
          </span>
        }
        actions={
          manager ? (
            <>
              {pending && (
                <Button
                  variant="secondary"
                  to={paths.leaseEdit(id)}
                  icon={<Pencil className="size-4" />}
                >
                  {t("common.edit")}
                </Button>
              )}
              {active && (
                <Button
                  variant="secondary"
                  icon={<CalendarPlus className="size-4" />}
                  onClick={() => setDlg("renew")}
                >
                  {t("leases.renew")}
                </Button>
              )}
              {(pending || active) && (
                <Button
                  variant="secondary"
                  className="text-[var(--red-fg)]"
                  icon={<XOctagon className="size-4" />}
                  onClick={() => setDlg("terminate")}
                >
                  {t("leases.terminate")}
                </Button>
              )}
              {pending && (
                <Button
                  icon={<Check className="size-4" />}
                  disabled={!canActivate}
                  loading={activate.isPending}
                  onClick={() => activate.mutate()}
                >
                  {t("leases.activate")}
                </Button>
              )}
            </>
          ) : tenant && active ? (
            <>
              <Button
                variant="secondary"
                icon={<Wrench className="size-4" />}
                to={`${paths.maintenanceNew}?unitId=${l.unitId}`}
              >
                {t("units.report")}
              </Button>
              {!pendingRenewal && (
                <Button
                  icon={<CalendarPlus className="size-4" />}
                  onClick={() => setDlg("request")}
                >
                  {t("lrr.request")}
                </Button>
              )}
            </>
          ) : null
        }
      />

      {manager && pending && activateReason && (
        <Banner
          tone="amber"
          className="mb-4"
          action={
            ended ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDlg("terminate")}
              >
                {t("leases.terminate")}
              </Button>
            ) : undefined
          }
        >
          {activateReason}
        </Banner>
      )}
      {pending && ended && (
        <Banner tone="amber" className="mb-4">
          {t("leases.datesPassed")}
        </Banner>
      )}
      {l.status === "EXPIRED" && manager && (
        <Banner
          tone="blue"
          className="mb-4"
          action={
            <Button
              size="sm"
              variant="secondary"
              to={`${paths.leaseNew}?unitId=${l.unitId}`}
            >
              {t("leases.new")}
            </Button>
          }
        >
          {t("leases.expiredNote")}
        </Banner>
      )}
      {pendingRenewal && (
        <Banner
          tone="blue"
          className="mb-4"
          title={t("lrr.banner", {
            date: formatDate(pendingRenewal.requestedEndDate, lang),
          })}
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                to={paths.renewal(pendingRenewal.id)}
              >
                {t("common.view")}
              </Button>
              {manager && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setDlg("reject")}
                  >
                    {t("lrr.reject")}
                  </Button>
                  <Button size="sm" onClick={() => setDlg("approve")}>
                    {t("lrr.approve")}
                  </Button>
                </>
              )}
              {tenant && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setDlg("cancel")}
                >
                  {t("lrr.withdraw")}
                </Button>
              )}
            </div>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <CardSection title={t("leases.dates")}>
          <DescriptionList
            items={[
              ...(tenant
                ? []
                : [
                    {
                      label: t("leases.tenant"),
                      value:
                        fullName(
                          tenants.data?.find((u) => u.id === l.tenantId),
                        ) || "—",
                    },
                  ]),
              {
                label: t("leases.start"),
                value: <span className="num">{formatDate(start, lang)}</span>,
              },
              {
                label: t("leases.end"),
                value: <span className="num">{formatDate(end, lang)}</span>,
              },
              {
                label: t("leases.rent"),
                value: (
                  <Money>
                    <span className="font-display text-xl font-bold">
                      {formatMoney(l.rentAmount, lang)}
                    </span>
                  </Money>
                ),
              },
              {
                label: t("common.status"),
                value: <StatusBadge kind="lease" value={l.status} />,
              },
              { label: t("leases.notes"), value: l.notes || "—", wide: true },
            ]}
          />
        </CardSection>
        <CardSection title={t("leases.unit")}>
          <div className="space-y-3">
            <p className="font-medium">
              {t("units.unit", { n: l.unit.unitNumber })}
            </p>
            <PropertyLink
              propertyId={l.unit.propertyId}
              className="text-sm text-muted"
            />
            <div>
              <Link
                to={paths.unit(l.unitId)}
                className="tap-area text-sm font-medium underline underline-offset-4"
              >
                {t("leases.viewUnit")}
              </Link>
            </div>
          </div>
        </CardSection>
      </div>

      <ConfirmDialog
        open={dlg === "terminate"}
        destructive
        loading={terminate.isPending}
        title={t("leases.terminateTitle")}
        description={t("leases.terminateText")}
        confirmLabel={t("leases.terminate")}
        onConfirm={() => terminate.mutate()}
        onCancel={() => setDlg(null)}
      />
      <ConfirmDialog
        open={dlg === "reject"}
        destructive
        loading={rejectRenewal.isPending}
        title={t("lrr.rejectTitle")}
        description={t("lrr.rejectText")}
        confirmLabel={t("lrr.reject")}
        onConfirm={() => rejectRenewal.mutate()}
        onCancel={() => setDlg(null)}
      />
      <ConfirmDialog
        open={dlg === "cancel"}
        destructive
        loading={cancelRenewal.isPending}
        title={t("lrr.withdrawTitle")}
        description={t("lrr.withdrawText")}
        confirmLabel={t("lrr.withdraw")}
        onConfirm={() => cancelRenewal.mutate()}
        onCancel={() => setDlg(null)}
      />
      {dlg === "renew" && (
        <RenewLeaseDialog
          open
          onOpenChange={(o) => !o && setDlg(null)}
          leaseId={id}
          currentEnd={end}
          onDone={refresh}
        />
      )}
      {dlg === "request" && (
        <RequestRenewalDialog
          open
          onOpenChange={(o) => !o && setDlg(null)}
          leaseId={id}
          currentEnd={end}
          onDone={refresh}
        />
      )}
      {dlg === "approve" && pendingRenewal && (
        <ApproveRenewalDialog
          open
          onOpenChange={(o) => !o && setDlg(null)}
          requestId={pendingRenewal.id}
          requestedEnd={pendingRenewal.requestedEndDate.slice(0, 10)}
          currentEnd={end}
          onDone={refresh}
        />
      )}
    </>
  );
}
export { normalizeError };
