import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { rentalRequestsApi } from "@/api/rentalRequests";
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
import { useInvalidate, useUnit } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import { useI18n } from "@/i18n";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  fullName,
} from "@/lib/format";
import { useApiError } from "@/lib/useApiError";
import { paths } from "@/routes/paths";
import { PropertyLink } from "../units/UnitBits";

export default function RentalRequestDetailPage() {
  const { id = "" } = useParams();
  const { t, lang } = useI18n();
  const apiError = useApiError();
  const { role } = useAuth();
  const navigate = useNavigate();
  const inv = useInvalidate();
  const manager = role === "OWNER" || role === "ADMIN";
  const q = useQuery({
    queryKey: ["rental-requests", id],
    queryFn: () => rentalRequestsApi.get(id),
  });
  const r = q.data;
  const others = useQuery({
    queryKey: ["rental-requests", "others", r?.unitId],
    queryFn: () =>
      rentalRequestsApi.list({
        unitId: r!.unitId,
        status: "PENDING",
        limit: 100,
      }),
    enabled: manager && r?.status === "PENDING",
  });
  const unitQ = useUnit(r?.unitId, role === "TENANT" && !!r);
  const [dialog, setDialog] = useState<"reject" | "cancel" | null>(null);

  const done = async (msg: string) => {
    toast.success(msg);
    await inv.requests();
    await q.refetch();
    setDialog(null);
  };
  const fail = async (e: unknown) => {
    setDialog(null);
    toast.error(apiError(e));
    await q.refetch();
  }; // 409: refetch and explain
  const approve = useMutation({
    mutationFn: () => rentalRequestsApi.approve(id),
    onSuccess: async (res) => {
      toast.success(t("rr.approvedToast"));
      await inv.requests();
      await q.refetch();
      if (res.leaseId) navigate(paths.lease(res.leaseId));
    },
    onError: fail,
  });
  const reject = useMutation({
    mutationFn: () => rentalRequestsApi.reject(id),
    onSuccess: () => done(t("rr.rejectedToast")),
    onError: fail,
  });
  const cancel = useMutation({
    mutationFn: () => rentalRequestsApi.cancel(id),
    onSuccess: () => done(t("rr.withdrawnToast")),
    onError: fail,
  });

  if (q.isLoading) return <LoadingSkeleton />;
  if (q.error || !r)
    return (
      <Card>
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </Card>
    );
  const pending = r.status === "PENDING";
  const otherCount = Math.max(0, (others.data?.meta.total ?? 0) - 1);
  const copy: Record<string, string> = {
    PENDING: t("rr.pendingCopy"),
    APPROVED: t("rr.approvedCopy"),
    REJECTED: t("rr.rejectedCopy"),
    CANCELLED: t("rr.cancelledCopy"),
    EXPIRED: t("rr.expiredCopy"),
  };
  const unitLinkable = manager || unitQ.data?.status === "AVAILABLE";
  const unitLabel = t("units.unit", { n: r.unit?.unitNumber ?? "—" });

  return (
    <>
      <PageHeader
        title={unitLabel}
        subtitle={
          <span className="flex flex-wrap items-center gap-3">
            <StatusBadge kind="rentalRequest" value={r.status} />
            {r.unit && <PropertyLink propertyId={r.unit.propertyId} />}
          </span>
        }
        actions={
          manager && pending ? (
            <>
              <Button
                variant="secondary"
                className="text-[var(--red-fg)]"
                icon={<X className="size-4" />}
                onClick={() => setDialog("reject")}
              >
                {t("rr.reject")}
              </Button>
              <Button
                icon={<Check className="size-4" />}
                loading={approve.isPending}
                onClick={() => approve.mutate()}
              >
                {t("rr.approve")}
              </Button>
            </>
          ) : role === "TENANT" && pending ? (
            <Button variant="secondary" onClick={() => setDialog("cancel")}>
              {t("rr.withdraw")}
            </Button>
          ) : role === "TENANT" && r.status === "EXPIRED" ? (
            <Button to={paths.rentalRequestNew(r.unitId)}>
              {t("rr.again")}
            </Button>
          ) : null
        }
      />

      <Banner
        tone={
          pending
            ? "amber"
            : r.status === "APPROVED"
              ? "green"
              : r.status === "EXPIRED"
                ? "amber"
                : r.status === "REJECTED"
                  ? "red"
                  : "blue"
        }
        className="mb-6"
        action={
          r.status === "APPROVED" && r.leaseId ? (
            <Button size="sm" variant="secondary" to={paths.lease(r.leaseId)}>
              {t("rr.viewLease")}
            </Button>
          ) : undefined
        }
      >
        {role === "TENANT" || !pending ? copy[r.status] : t("rr.activateNote")}
        {manager && pending && otherCount > 0 && (
          <span className="mt-1 block text-xs opacity-90">
            {t("rr.otherPending", { n: otherCount })}
          </span>
        )}
      </Banner>

      <div className="grid gap-6 lg:grid-cols-2">
        <CardSection title={t("rr.period")}>
          <DescriptionList
            items={[
              {
                label: t("rr.start"),
                value: (
                  <span className="num">{formatDate(r.startDate, lang)}</span>
                ),
              },
              {
                label: t("rr.end"),
                value: (
                  <span className="num">{formatDate(r.endDate, lang)}</span>
                ),
              },
              {
                label: t("rr.rentAtRequest"),
                value: <Money>{formatMoney(r.rentAmount, lang)}</Money>,
              },
              ...(r.unit && r.unit.rentAmount !== r.rentAmount
                ? [
                    {
                      label: t("rr.rentNow"),
                      value: (
                        <Money>{formatMoney(r.unit.rentAmount, lang)}</Money>
                      ),
                    },
                  ]
                : []),
              { label: t("rr.message"), value: r.message || "—", wide: true },
              {
                label: t("common.created"),
                value: (
                  <span className="num">
                    {formatDateTime(r.createdAt, lang)}
                  </span>
                ),
              },
            ]}
          />
        </CardSection>
        <div className="space-y-6">
          {manager && r.tenant && (
            <CardSection title={t("rr.requester")}>
              <DescriptionList
                items={[
                  { label: t("common.name"), value: fullName(r.tenant) },
                  {
                    label: t("common.phone"),
                    value: r.tenant.phone ? (
                      <span className="num ltr">{r.tenant.phone}</span>
                    ) : (
                      "—"
                    ),
                  },
                ]}
              />
            </CardSection>
          )}
          <CardSection title={t("rr.unit")}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">{unitLabel}</span>
              {r.unit && unitLinkable && (
                <Link
                  className="text-sm font-medium underline underline-offset-4"
                  to={paths.unit(r.unit.id)}
                >
                  {t("common.view")}
                </Link>
              )}
            </div>
          </CardSection>
        </div>
      </div>

      <ConfirmDialog
        open={dialog === "reject"}
        destructive
        loading={reject.isPending}
        title={t("rr.rejectTitle")}
        description={t("rr.rejectText")}
        confirmLabel={t("rr.reject")}
        onConfirm={() => reject.mutate()}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "cancel"}
        destructive
        loading={cancel.isPending}
        title={t("rr.withdrawTitle")}
        description={t("rr.withdrawText")}
        confirmLabel={t("rr.withdraw")}
        onConfirm={() => cancel.mutate()}
        onCancel={() => setDialog(null)}
      />
    </>
  );
}
