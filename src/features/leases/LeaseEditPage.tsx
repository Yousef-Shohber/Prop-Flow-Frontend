import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { leasesApi } from "@/api/leases";
import { Button } from "@/components/ui/Button";
import { DateField, Textarea } from "@/components/ui/Field";
import { Banner, CardSection } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { useInvalidate } from "@/hooks/queries";
import { toast } from "@/hooks/useToast";
import { useI18n } from "@/i18n";
import { mapDetailsToFields, normalizeError } from "@/lib/errors";
import { useSchemas } from "@/lib/schemas";
import { useApiError } from "@/lib/useApiError";
import { paths } from "@/routes/paths";

interface Values {
  startDate: string;
  endDate: string;
  notes?: string;
}

export default function LeaseEditPage() {
  const { id = "" } = useParams();
  const { t } = useI18n();
  const apiError = useApiError();
  const schemas = useSchemas();
  const navigate = useNavigate();
  const inv = useInvalidate();
  const q = useQuery({
    queryKey: ["leases", id],
    queryFn: () => leasesApi.get(id),
  });
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schemas.leaseEdit as any),
    defaultValues: { startDate: "", endDate: "", notes: "" },
  });
  useEffect(() => {
    if (q.data)
      reset({
        startDate: q.data.startDate.slice(0, 10),
        endDate: q.data.endDate.slice(0, 10),
        notes: q.data.notes ?? "",
      });
  }, [q.data, reset]);

  if (q.isLoading) return <LoadingSkeleton />;
  if (q.error || !q.data)
    return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const blocked = q.data.status !== "PENDING";

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      await leasesApi.update(id, {
        startDate: v.startDate,
        endDate: v.endDate,
        notes: v.notes?.trim() ?? "",
      });
      toast.success(t("leases.updatedToast"));
      await inv.leases();
      navigate(paths.lease(id));
    } catch (e) {
      const err = normalizeError(e);
      if (err.code === "LEASE_DATES_OVERLAP") {
        const m = t("rr.datesTaken");
        setError("startDate", { type: "server", message: m });
        setError("endDate", { type: "server", message: m });
      } else {
        const rest = mapDetailsToFields(
          err.details,
          ["startDate", "endDate", "notes"],
          setError,
        );
        if (rest.length || !err.details?.length) setFormError(apiError(e));
        if (err.code === "LEASE_NOT_PENDING") void q.refetch();
      }
    }
  });

  return (
    <>
      <PageHeader
        title={t("leases.edit")}
        subtitle={t("units.unit", { n: q.data.unit.unitNumber })}
      />
      <form
        onSubmit={onSubmit}
        noValidate
        className="mx-auto max-w-2xl space-y-6"
      >
        {blocked && <Banner tone="amber">{t("leases.editLocked")}</Banner>}
        {formError && <Banner tone="red">{formError}</Banner>}
        <CardSection>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateField
                label={t("leases.start")}
                disabled={blocked}
                error={errors.startDate?.message}
                {...register("startDate")}
              />
              <DateField
                label={t("leases.end")}
                disabled={blocked}
                error={errors.endDate?.message}
                {...register("endDate")}
              />
            </div>
            <Textarea
              label={t("leases.notes")}
              optional
              disabled={blocked}
              maxLength={1000}
              error={errors.notes?.message}
              {...register("notes")}
            />
          </div>
        </CardSection>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={blocked}>
            {t("common.saveChanges")}
          </Button>
        </div>
      </form>
    </>
  );
}
