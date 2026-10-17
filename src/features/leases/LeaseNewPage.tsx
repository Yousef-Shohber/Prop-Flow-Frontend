import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { leasesApi } from "@/api/leases";
import { unitsApi } from "@/api/units";
import { Button } from "@/components/ui/Button";
import { DateField, Select, Textarea } from "@/components/ui/Field";
import { Banner, CardSection } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { UserPicker } from "@/components/ui/UserPicker";
import { useInvalidate } from "@/hooks/queries";
import { toast } from "@/hooks/useToast";
import { useEnumLabel, useI18n } from "@/i18n";
import { mapDetailsToFields, normalizeError } from "@/lib/errors";
import { formatMoney } from "@/lib/format";
import { useSchemas } from "@/lib/schemas";
import { useApiError } from "@/lib/useApiError";
import { paths } from "@/routes/paths";
import type { DirectoryUser } from "@/types/models";

interface Values {
  unitId: string;
  startDate: string;
  endDate: string;
  notes?: string;
}

export default function LeaseNewPage() {
  const [sp] = useSearchParams();
  const { t, lang } = useI18n();
  const label = useEnumLabel();
  const apiError = useApiError();
  const schemas = useSchemas();
  const navigate = useNavigate();
  const inv = useInvalidate();
  const [tenant, setTenant] = useState<DirectoryUser | null>(null);
  const [tenantErr, setTenantErr] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const units = useQuery({
    queryKey: ["units", "list", { limit: 100, for: "lease-picker" }],
    queryFn: () =>
      unitsApi.list({ limit: 100, sortBy: "unitNumber", sortOrder: "ASC" }),
  });
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schemas.lease as any),
    defaultValues: {
      unitId: sp.get("unitId") ?? "",
      startDate: "",
      endDate: "",
      notes: "",
    },
  });
  const unitList = units.data?.data ?? [];
  const selected = unitList.find((u) => u.id === watch("unitId"));

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    setTenantErr(undefined);
    if (!tenant) {
      setTenantErr(t("v.required"));
      return;
    }
    try {
      const lease = await leasesApi.create({
        tenantId: tenant.id,
        unitId: v.unitId,
        startDate: v.startDate,
        endDate: v.endDate,
        ...(v.notes?.trim() ? { notes: v.notes.trim() } : {}),
      });
      toast.success(t("leases.createdToast"));
      await inv.leases();
      navigate(paths.lease(lease.id), { replace: true });
    } catch (e) {
      const err = normalizeError(e);
      if (err.code === "LEASE_DATES_OVERLAP") {
        const m = t("rr.datesTaken");
        setError("startDate", { type: "server", message: m });
        setError("endDate", { type: "server", message: m });
      } else if (err.code === "UNIT_NOT_AVAILABLE")
        setError("unitId", { type: "server", message: apiError(e) });
      else if (
        err.code === "END_DATE_IN_PAST" ||
        err.code === "INVALID_DATE_RANGE" ||
        err.code === "INVALID_DATE"
      )
        setError("endDate", { type: "server", message: apiError(e) });
      else if (err.code === "TENANT_NOT_ACTIVE") setTenantErr(apiError(e));
      else {
        const rest = mapDetailsToFields(
          err.details,
          ["unitId", "startDate", "endDate", "notes"],
          setError,
        );
        if (rest.length || !err.details?.length) setFormError(apiError(e));
      }
    }
  });

  return (
    <>
      <PageHeader title={t("leases.new")} subtitle={t("leases.rentCopied")} />
      <form
        onSubmit={onSubmit}
        noValidate
        className="mx-auto max-w-3xl space-y-6"
      >
        {formError && <Banner tone="red">{formError}</Banner>}
        <CardSection>
          <div className="space-y-5">
            <UserPicker
              role="TENANT"
              label={t("leases.tenant")}
              value={tenant}
              onChange={(u) => {
                setTenant(u);
                setTenantErr(undefined);
              }}
              error={tenantErr}
            />
            <Select
              label={t("leases.unit")}
              hint={t("leases.onlyAvailable")}
              error={errors.unitId?.message}
              {...register("unitId")}
            >
              <option value="">{t("leases.unitPick")}</option>
              {unitList.map((u) => (
                <option
                  key={u.id}
                  value={u.id}
                  disabled={u.status !== "AVAILABLE"}
                >
                  {t("units.unit", { n: u.unitNumber })}
                  {u.status !== "AVAILABLE"
                    ? ` — ${t("leases.notAvailable", { status: label("unit", u.status) })}`
                    : ""}
                </option>
              ))}
            </Select>
            {selected && (
              <p className="rounded-control bg-surface-2 px-3.5 py-2.5 text-sm">
                <span className="text-muted">{t("leases.rent")}: </span>
                <span className="num font-semibold">
                  {formatMoney(selected.rentAmount, lang)}
                </span>
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DateField
                label={t("leases.start")}
                error={errors.startDate?.message}
                {...register("startDate")}
              />
              <DateField
                label={t("leases.end")}
                error={errors.endDate?.message}
                {...register("endDate")}
              />
            </div>
            <Textarea
              label={t("leases.notes")}
              optional
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
          <Button type="submit" loading={isSubmitting}>
            {t("common.create")}
          </Button>
        </div>
      </form>
    </>
  );
}
