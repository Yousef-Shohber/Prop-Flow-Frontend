import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { rentalRequestsApi } from "@/api/rentalRequests";
import { Button } from "@/components/ui/Button";
import { DateField, Textarea } from "@/components/ui/Field";
import { Banner, Card, CardSection, Money } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, LoadingSkeleton } from "@/components/ui/States";
import { useInvalidate, useUnit } from "@/hooks/queries";
import { toast } from "@/hooks/useToast";
import { useI18n } from "@/i18n";
import { isPast } from "@/lib/dates";
import { mapDetailsToFields, normalizeError } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import { useSchemas } from "@/lib/schemas";
import { useApiError } from "@/lib/useApiError";
import { paths } from "@/routes/paths";
import {
  UnitSpecs,
  UnitThumb,
  PropertyLink,
  useUnitImages,
} from "../units/UnitBits";
import { FileQuestion } from "lucide-react";

interface Values {
  startDate: string;
  endDate: string;
  message?: string;
}

export default function RentalRequestNewPage() {
  const [sp] = useSearchParams();
  const unitId = sp.get("unitId") ?? "";
  const { t, lang } = useI18n();
  const apiError = useApiError();
  const schemas = useSchemas();
  const navigate = useNavigate();
  const inv = useInvalidate();
  const unit = useUnit(unitId, !!unitId);
  const unitImages = useUnitImages(unit.data);
  const existing = useQuery({
    queryKey: ["rental-requests", "pending-for-unit", unitId],
    queryFn: () =>
      rentalRequestsApi.list({ unitId, status: "PENDING", limit: 1 }),
    enabled: !!unitId,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schemas.rentalRequest as any),
    defaultValues: { startDate: "", endDate: "", message: "" },
  });
  const start = watch("startDate");

  if (!unitId || unit.error)
    return (
      <>
        <PageHeader title={t("rr.new")} />
        <Card>
          <EmptyState
            icon={FileQuestion}
            title={t("units.unavailable")}
            description={t("units.unavailableText")}
            action={
              <Button to={paths.properties}>{t("rr.backToProperty")}</Button>
            }
          />
        </Card>
      </>
    );
  if (unit.isLoading || existing.isLoading) return <LoadingSkeleton />;
  const u = unit.data!;
  const pendingId = existing.data?.data[0]?.id;

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      const r = await rentalRequestsApi.create({
        unitId,
        startDate: v.startDate,
        endDate: v.endDate,
        ...(v.message?.trim() ? { message: v.message.trim() } : {}),
      });
      toast.success(t("rr.createdToast"));
      await inv.requests();
      navigate(paths.rentalRequest(r.id), { replace: true });
    } catch (e) {
      const err = normalizeError(e);
      if (err.code === "LEASE_DATES_OVERLAP") {
        setError("startDate", { type: "server", message: t("rr.datesTaken") });
        setError("endDate", { type: "server", message: t("rr.datesTaken") });
      } else if (
        err.code === "END_DATE_IN_PAST" ||
        err.code === "INVALID_DATE_RANGE" ||
        err.code === "INVALID_DATE"
      )
        setError("endDate", { type: "server", message: apiError(e) });
      else if (err.code === "RENTAL_REQUEST_DUPLICATE_PENDING") {
        await existing.refetch();
        setFormError(apiError(e));
      } else {
        const rest = mapDetailsToFields(
          err.details,
          ["startDate", "endDate", "message"],
          setError,
        );
        if (rest.length || !err.details?.length) setFormError(apiError(e));
      }
    }
  });

  return (
    <>
      <PageHeader title={t("rr.new")} />
      <div className="mx-auto grid grid-cols-1 max-w-4xl gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card className="h-fit overflow-hidden">
          {unitImages.images[0] ? (
            <img
              src={unitImages.images[0].url}
              alt=""
              className="aspect-[16/10] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center bg-surface-2">
              <UnitThumb unit={u} className="size-16 rounded-xl" />
            </div>
          )}
          <div className="space-y-2 p-5">
            <div className="flex items-baseline justify-between gap-3">
              <Link
                className="tap-area text-lg font-semibold hover:underline"
                to={paths.unit(u.id)}
              >
                {t("units.unit", { n: u.unitNumber })}
              </Link>
              <Money>
                <span className="font-display text-xl font-bold">
                  {formatMoney(u.rentAmount, lang)}
                </span>
              </Money>
            </div>
            <PropertyLink
              propertyId={u.propertyId}
              className="text-sm text-muted"
            />
            <UnitSpecs unit={u} />
          </div>
        </Card>
        <div>
          {pendingId ? (
            <Banner
              tone="blue"
              title={t("rr.alreadyPending")}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  to={paths.rentalRequest(pendingId)}
                >
                  {t("rr.viewPending")}
                </Button>
              }
            />
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              <Banner tone="blue">{t("rr.notReserved")}</Banner>
              {formError && <Banner tone="red">{formError}</Banner>}
              <CardSection title={t("rr.period")}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DateField
                    label={t("rr.start")}
                    error={errors.startDate?.message}
                    hint={
                      start && isPast(start) ? t("rr.startPastWarn") : undefined
                    }
                    {...register("startDate")}
                  />
                  <DateField
                    label={t("rr.end")}
                    error={errors.endDate?.message}
                    {...register("endDate")}
                  />
                </div>
                <Textarea
                  className="mt-4"
                  label={t("rr.message")}
                  hint={t("rr.messageHint")}
                  optional
                  maxLength={1000}
                  error={errors.message?.message}
                  {...register("message")}
                />
              </CardSection>
              <div className="flex justify-end">
                <Button type="submit" size="lg" loading={isSubmitting}>
                  {t("rr.submit")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
