import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { renewalsApi } from "@/api/renewals";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Card, CardSection, DescriptionList } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInvalidate } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import { useI18n } from "@/i18n";
import { formatDate, formatDateTime, fullName } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";
import { paths } from "@/routes/paths";
import { ApproveRenewalDialog } from "./RenewalDialogs";

export default function RenewalDetailPage() {
  const { id = "" } = useParams();
  const { t, lang } = useI18n();
  const apiError = useApiError();
  const { role } = useAuth();
  const inv = useInvalidate();
  const manager = role === "OWNER" || role === "ADMIN";
  const q = useQuery({
    queryKey: ["lease-renewals", id],
    queryFn: () => renewalsApi.get(id),
  });
  const [dlg, setDlg] = useState<"approve" | "reject" | "cancel" | null>(null);
  const after = async (msg?: string) => {
    if (msg) toast.success(msg);
    setDlg(null);
    await inv.renewals();
    await q.refetch();
  };
  const fail = async (e: unknown) => {
    setDlg(null);
    toast.error(apiError(e));
    await q.refetch();
  };
  const reject = useMutation({
    mutationFn: () => renewalsApi.reject(id),
    onSuccess: () => after(t("lrr.rejectedToast")),
    onError: fail,
  });
  const cancel = useMutation({
    mutationFn: () => renewalsApi.cancel(id),
    onSuccess: () => after(t("lrr.withdrawnToast")),
    onError: fail,
  });

  if (q.isLoading) return <LoadingSkeleton />;
  if (q.error || !q.data)
    return (
      <Card>
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </Card>
    );
  const r = q.data;
  const pending = r.status === "PENDING";
  const currentEnd = (r.lease?.endDate ?? r.requestedEndDate).slice(0, 10);

  return (
    <>
      <PageHeader
        title={t("lrr.title")}
        subtitle={
          <span className="flex flex-wrap items-center gap-3">
            <StatusBadge kind="rentalRequest" value={r.status} />
            {r.unit && <span>{t("units.unit", { n: r.unit.unitNumber })}</span>}
          </span>
        }
        actions={
          pending ? (
            manager ? (
              <>
                <Button
                  variant="secondary"
                  className="text-[var(--red-fg)]"
                  icon={<X className="size-4" />}
                  onClick={() => setDlg("reject")}
                >
                  {t("lrr.reject")}
                </Button>
                <Button
                  icon={<Check className="size-4" />}
                  onClick={() => setDlg("approve")}
                >
                  {t("lrr.approve")}
                </Button>
              </>
            ) : role === "TENANT" ? (
              <Button variant="secondary" onClick={() => setDlg("cancel")}>
                {t("lrr.withdraw")}
              </Button>
            ) : null
          ) : null
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSection>
          <DescriptionList
            items={[
              {
                label: t("lrr.currentEnd"),
                value: (
                  <span className="num">
                    {formatDate(r.lease?.endDate, lang)}
                  </span>
                ),
              },
              {
                label: t("lrr.requestedEnd"),
                value: (
                  <span className="num font-semibold">
                    {formatDate(r.requestedEndDate, lang)}
                  </span>
                ),
              },
              { label: t("lrr.message"), value: r.message || "—", wide: true },
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
        <CardSection>
          <DescriptionList
            items={[
              ...(manager
                ? [{ label: t("lrr.tenant"), value: fullName(r.tenant) || "—" }]
                : []),
              {
                label: t("lrr.unit"),
                value: r.unit ? t("units.unit", { n: r.unit.unitNumber }) : "—",
              },
              {
                label: t("lrr.lease"),
                value: (
                  <Link
                    className="font-medium underline underline-offset-4"
                    to={paths.lease(r.leaseId)}
                  >
                    {t("lrr.viewLease")}
                  </Link>
                ),
              },
            ]}
          />
        </CardSection>
      </div>
      <ConfirmDialog
        open={dlg === "reject"}
        destructive
        loading={reject.isPending}
        title={t("lrr.rejectTitle")}
        description={t("lrr.rejectText")}
        confirmLabel={t("lrr.reject")}
        onConfirm={() => reject.mutate()}
        onCancel={() => setDlg(null)}
      />
      <ConfirmDialog
        open={dlg === "cancel"}
        destructive
        loading={cancel.isPending}
        title={t("lrr.withdrawTitle")}
        description={t("lrr.withdrawText")}
        confirmLabel={t("lrr.withdraw")}
        onConfirm={() => cancel.mutate()}
        onCancel={() => setDlg(null)}
      />
      {dlg === "approve" && (
        <ApproveRenewalDialog
          open
          onOpenChange={(o) => !o && setDlg(null)}
          requestId={id}
          requestedEnd={r.requestedEndDate.slice(0, 10)}
          currentEnd={currentEnd}
          onDone={() => after()}
        />
      )}
    </>
  );
}
