import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { unitsApi } from "@/api/units";
import { Button } from "@/components/ui/Button";
import { Banner, CardSection } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { useInvalidate, useProperty, useUnit } from "@/hooks/queries";
import { toast } from "@/hooks/useToast";
import { useI18n } from "@/i18n";
import { mapDetailsToFields, normalizeError } from "@/lib/errors";
import { useSchemas } from "@/lib/schemas";
import { useApiError } from "@/lib/useApiError";
import { paths } from "@/routes/paths";
import { UnitFields, unitPayload, type UnitFormValues } from "./UnitFields";

/** /properties/:propertyId/units/new  and  /units/:id/edit */
export default function UnitFormPage() {
  const { propertyId, id } = useParams();
  const editing = !!id;
  const { t } = useI18n();
  const apiError = useApiError();
  const schemas = useSchemas();
  const navigate = useNavigate();
  const inv = useInvalidate();
  const unit = useUnit(id, editing);
  const property = useProperty(propertyId ?? unit.data?.propertyId);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UnitFormValues>({
    resolver: zodResolver(schemas.unit as any),
    defaultValues: {
      unitNumber: "",
      area: "",
      rentAmount: "",
      bedrooms: "1",
      bathrooms: "1",
      floor: "",
      description: "",
    },
  });
  useEffect(() => {
    const u = unit.data;
    if (!u) return;
    reset({
      unitNumber: u.unitNumber,
      area: String(u.area),
      rentAmount: String(u.rentAmount),
      bedrooms: String(u.bedrooms),
      bathrooms: String(u.bathrooms),
      floor: u.floor === null ? "" : String(u.floor),
      description: u.description ?? "",
    });
  }, [unit.data, reset]);

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      const body = { unitNumber: v.unitNumber!.trim(), ...unitPayload(v) };
      if (editing) {
        await unitsApi.update(id!, body);
        toast.success(t("units.updatedToast"));
        await inv.units();
        navigate(paths.unit(id!));
      } else {
        const created = await unitsApi.create(propertyId!, body);
        toast.success(t("units.createdToast"));
        await inv.units();
        navigate(paths.unit(created.id));
      }
    } catch (e) {
      const err = normalizeError(e);
      if (
        err.code === "UNIT_NUMBER_TAKEN" ||
        (err.status === 409 && !editing)
      ) {
        setError("unitNumber", {
          type: "server",
          message: t("units.numberTaken"),
        });
        return;
      }
      if (err.code === "UNIT_RENTED") {
        setFormError(t("units.editLocked"));
        return;
      }
      const rest = mapDetailsToFields(
        err.details,
        [
          "unitNumber",
          "floor",
          "area",
          "rentAmount",
          "bedrooms",
          "bathrooms",
          "description",
        ],
        setError,
      );
      if (rest.length || !err.details?.length) setFormError(apiError(e));
    }
  });

  if (editing && unit.isLoading) return <LoadingSkeleton />;
  if (editing && unit.error)
    return <ErrorState error={unit.error} onRetry={() => unit.refetch()} />;
  const locked = editing && unit.data?.status === "RENTED";

  return (
    <>
      <PageHeader
        title={editing ? t("units.editTitle") : t("units.newTitle")}
        subtitle={
          property.data
            ? t("units.fromProperty", { name: property.data.name })
            : undefined
        }
      />
      <form
        onSubmit={onSubmit}
        noValidate
        className="mx-auto max-w-3xl space-y-6"
      >
        {locked && <Banner tone="amber">{t("units.editLocked")}</Banner>}
        {formError && <Banner tone="red">{formError}</Banner>}
        <CardSection>
          <UnitFields
            register={register}
            errors={errors}
            withNumber
            disabled={locked}
          />
        </CardSection>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={locked}>
            {editing ? t("common.saveChanges") : t("common.create")}
          </Button>
        </div>
      </form>
    </>
  );
}
