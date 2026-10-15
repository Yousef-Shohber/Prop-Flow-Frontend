import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { leasesApi } from "@/api/leases";
import { maintenanceApi } from "@/api/maintenance";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { Banner, Card, CardSection } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, LoadingSkeleton } from "@/components/ui/States";
import { useInvalidate } from "@/hooks/queries";
import { toast } from "@/hooks/useToast";
import { useEnumLabel, useI18n } from "@/i18n";
import { mapDetailsToFields, normalizeError } from "@/lib/errors";
import { useSchemas } from "@/lib/schemas";
import { useApiError } from "@/lib/useApiError";
import { paths } from "@/routes/paths";
import { MaintenanceCategory, MaintenancePriority } from "@/types/enums";
import { FileSignature } from "lucide-react";

interface Values {
  unitId: string;
  title: string;
  description: string;
  category: (typeof MaintenanceCategory)[number];
  priority: (typeof MaintenancePriority)[number];
}

export default function MaintenanceNewPage() {
  const { t } = useI18n();
  const label = useEnumLabel();
  const apiError = useApiError();
  const schemas = useSchemas();
  const navigate = useNavigate();
  const inv = useInvalidate();
  const [sp] = useSearchParams();
  const [files, setFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  // the tenant's ACTIVE leases: each carries unit { id, unitNumber, propertyId }, so no extra unit calls
  const leases = useQuery({
    queryKey: [
      "leases",
      "list",
      { status: "ACTIVE", limit: 100, for: "maintenance" },
    ],
    queryFn: () => leasesApi.list({ status: "ACTIVE", limit: 100 }),
  });
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schemas.maintenance),
    defaultValues: {
      unitId: sp.get("unitId") ?? "",
      title: "",
      description: "",
      category: "PLUMBING",
      priority: "MEDIUM",
    },
  });
  const active = leases.data?.data ?? [];
  useEffect(() => {
    if (active.length === 1) setValue("unitId", active[0].unitId);
  }, [active.length]); // eslint-disable-line

  if (leases.isLoading) return <LoadingSkeleton />;
  if (active.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={FileSignature}
          title={t("mnt.noLease")}
          description={t("mnt.noLeaseText")}
          action={<Button to={paths.leases}>{t("mnt.goLeases")}</Button>}
        />
      </Card>
    );
  }

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      const m = await maintenanceApi.create(
        {
          unitId: v.unitId,
          title: v.title.trim(),
          description: v.description.trim(),
          category: v.category,
          priority: v.priority,
        },
        files,
      );
      toast.success(t("mnt.createdToast"));
      await inv.maintenance();
      navigate(paths.maintenanceItem(m.id), { replace: true });
    } catch (e) {
      const err = normalizeError(e);
      if (err.code === "NO_ACTIVE_LEASE" || err.code === "LEASE_NOT_ACTIVE") {
        await leases.refetch();
        setFormError(t("mnt.leaseEnded"));
        return;
      }
      const rest = mapDetailsToFields(
        err.details,
        ["unitId", "title", "description", "category", "priority"],
        setError,
      );
      if (rest.length || !err.details?.length) setFormError(apiError(e));
    }
  });

  return (
    <>
      <PageHeader title={t("mnt.new")} />
      <form
        onSubmit={onSubmit}
        noValidate
        className="mx-auto max-w-3xl space-y-6"
      >
        {formError && <Banner tone="red">{formError}</Banner>}
        <CardSection>
          <div className="space-y-5">
            {active.length > 1 && (
              <Select
                label={t("mnt.pickUnit")}
                error={errors.unitId?.message}
                {...register("unitId")}
              >
                <option value="">{t("v.pickOne")}</option>
                {active.map((l) => (
                  <option key={l.id} value={l.unitId}>
                    {t("units.unit", { n: l.unit.unitNumber })}
                  </option>
                ))}
              </Select>
            )}
            <Input
              label={t("mnt.titleField")}
              maxLength={150}
              error={errors.title?.message}
              {...register("title")}
            />
            <Textarea
              label={t("mnt.description")}
              maxLength={2000}
              error={errors.description?.message}
              {...register("description")}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label={t("mnt.category")}
                error={errors.category?.message}
                {...register("category")}
              >
                {MaintenanceCategory.map((v) => (
                  <option key={v} value={v}>
                    {label("cat", v)}
                  </option>
                ))}
              </Select>
              <Select
                label={t("mnt.priority")}
                error={errors.priority?.message}
                {...register("priority")}
              >
                {MaintenancePriority.map((v) => (
                  <option key={v} value={v}>
                    {label("pri", v)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardSection>
        <CardSection title={t("mnt.images")}>
          <ImageUploader
            mode="deferred"
            value={[]}
            maxFiles={5}
            hint={t("mnt.imagesHint")}
            onFilesChange={setFiles}
          />
        </CardSection>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t("mnt.new")}
          </Button>
        </div>
      </form>
    </>
  );
}
