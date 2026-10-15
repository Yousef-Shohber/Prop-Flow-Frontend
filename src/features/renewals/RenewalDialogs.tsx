import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { leasesApi } from "@/api/leases";
import { renewalsApi } from "@/api/renewals";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { DateField, Textarea } from "@/components/ui/Field";
import { Banner } from "@/components/ui/Misc";
import { useInvalidate } from "@/hooks/queries";
import { toast } from "@/hooks/useToast";
import { useI18n } from "@/i18n";
import { addDaysISO } from "@/lib/dates";
import { normalizeError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { makeSchemas } from "@/lib/schemas";
import { useApiError } from "@/lib/useApiError";

interface BaseProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leaseId: string;
  currentEnd: string;
  onDone?: () => void;
}

function useRenewalForm(currentEnd: string, defaultEnd: string) {
  const { t } = useI18n();
  const schema = useMemo(
    () => makeSchemas(t).renewal(currentEnd),
    [t, currentEnd],
  );
  return useForm<{ endDate: string; message?: string }>({
    resolver: zodResolver(schema as any),
    defaultValues: { endDate: defaultEnd, message: "" },
  });
}

/** Tenant: ask the owner to extend an ACTIVE lease. */
export function RequestRenewalDialog({
  open,
  onOpenChange,
  leaseId,
  currentEnd,
  onDone,
}: BaseProps) {
  const { t } = useI18n();
  const apiError = useApiError();
  const inv = useInvalidate();
  const [err, setErr] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useRenewalForm(currentEnd, addDaysISO(currentEnd, 1));
  const submit = handleSubmit(async (v) => {
    setErr(null);
    try {
      await renewalsApi.create({
        leaseId,
        endDate: v.endDate,
        ...(v.message?.trim() ? { message: v.message.trim() } : {}),
      });
      toast.success(t("lrr.sentToast"));
      await inv.renewals();
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      const code = normalizeError(e).code;
      if (code === "INVALID_DATE" || code === "RENEWAL_END_NOT_AFTER_CURRENT")
        setError("endDate", { type: "server", message: apiError(e) });
      else setErr(apiError(e));
    }
  });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("lrr.requestTitle")}
      description={t("lrr.requestText")}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {err && <Banner tone="red">{err}</Banner>}
        <DateField
          label={t("lrr.requestedEnd")}
          min={addDaysISO(currentEnd, 1)}
          hint={`${t("lrr.currentEnd")}: ${formatDate(currentEnd)}`}
          error={errors.endDate?.message}
          {...register("endDate")}
        />
        <Textarea
          label={t("lrr.message")}
          optional
          maxLength={1000}
          error={errors.message?.message}
          {...register("message")}
        />
        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t("lrr.request")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Owner/admin: approve a request, optionally granting a different end date (pre-filled with the requested one). */
export function ApproveRenewalDialog({
  open,
  onOpenChange,
  requestId,
  requestedEnd,
  currentEnd,
  onDone,
}: Omit<BaseProps, "leaseId"> & { requestId: string; requestedEnd: string }) {
  const { t, lang } = useI18n();
  const apiError = useApiError();
  const inv = useInvalidate();
  const [err, setErr] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useRenewalForm(currentEnd, requestedEnd);
  const submit = handleSubmit(async (v) => {
    setErr(null);
    try {
      await renewalsApi.approve(requestId, v.endDate);
      toast.success(
        t("lrr.approvedToast", { date: formatDate(v.endDate, lang) }),
      );
      await inv.renewals();
      await inv.leases();
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      const code = normalizeError(e).code;
      if (code === "LEASE_DATES_OVERLAP")
        setError("endDate", { type: "server", message: t("lrr.overlap") });
      else if (
        code === "INVALID_DATE" ||
        code === "RENEWAL_END_NOT_AFTER_CURRENT"
      )
        setError("endDate", { type: "server", message: apiError(e) });
      else {
        setErr(apiError(e));
        onDone?.();
      }
    }
  });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("lrr.approveTitle")}
      description={t("lrr.approveText")}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {err && <Banner tone="red">{err}</Banner>}
        <DateField
          label={t("lrr.grantDate")}
          min={addDaysISO(currentEnd, 1)}
          hint={`${t("lrr.requestedEnd")}: ${formatDate(requestedEnd, lang)}`}
          error={errors.endDate?.message}
          {...register("endDate")}
        />
        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t("lrr.approve")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** Owner/admin: renew an ACTIVE lease directly (POST /leases/:id/renew). */
export function RenewLeaseDialog({
  open,
  onOpenChange,
  leaseId,
  currentEnd,
  onDone,
}: BaseProps) {
  const { t, lang } = useI18n();
  const apiError = useApiError();
  const inv = useInvalidate();
  const [err, setErr] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useRenewalForm(currentEnd, addDaysISO(currentEnd, 1));
  const submit = handleSubmit(async (v) => {
    setErr(null);
    try {
      await leasesApi.renew(leaseId, v.endDate);
      toast.success(
        t("leases.renewedToast") + ` — ${formatDate(v.endDate, lang)}`,
      );
      await inv.leases();
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      const code = normalizeError(e).code;
      if (code === "LEASE_DATES_OVERLAP")
        setError("endDate", { type: "server", message: t("lrr.overlap") });
      else if (
        code === "INVALID_DATE" ||
        code === "RENEWAL_END_NOT_AFTER_CURRENT"
      )
        setError("endDate", { type: "server", message: apiError(e) });
      else {
        setErr(apiError(e));
        onDone?.();
      }
    }
  });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("leases.renewTitle")}
      description={t("leases.renewText")}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {err && <Banner tone="red">{err}</Banner>}
        <DateField
          label={t("leases.renewMin")}
          min={addDaysISO(currentEnd, 1)}
          hint={`${t("lrr.currentEnd")}: ${formatDate(currentEnd, lang)}`}
          error={errors.endDate?.message}
          {...register("endDate")}
        />
        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t("leases.renew")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
