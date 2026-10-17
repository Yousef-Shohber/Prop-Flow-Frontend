import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { propertiesApi, type PropertyInput } from "@/api/properties";
import { usersApi } from "@/api/users";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { Banner, CardSection } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { useInvalidate, useProperty } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import { useEnumLabel, useI18n } from "@/i18n";
import { mapDetailsToFields, normalizeError } from "@/lib/errors";
import { fullName } from "@/lib/format";
import { useSchemas } from "@/lib/schemas";
import { useApiError } from "@/lib/useApiError";
import { paths } from "@/routes/paths";
import { PROPERTY_TYPE_DEFAULTS, PropertyType } from "@/types/enums";
import {
  UnitFields,
  unitPayload,
  type UnitFormValues,
} from "../units/UnitFields";

type Values = {
  name: string;
  propertyType: PropertyType;
  address: string;
  city: string;
  country?: string;
  description?: string;
} & Partial<UnitFormValues>;
const FIELDS = [
  "name",
  "propertyType",
  "address",
  "city",
  "country",
  "description",
  "area",
  "rentAmount",
  "bedrooms",
  "bathrooms",
  "floor",
] as const;

export default function PropertyFormPage() {
  const { id } = useParams();
  const editing = !!id;
  const { t } = useI18n();
  const label = useEnumLabel();
  const apiError = useApiError();
  const schemas = useSchemas();
  const { role } = useAuth();
  const navigate = useNavigate();
  const inv = useInvalidate();
  const existing = useProperty(id, editing);
  const [files, setFiles] = useState<File[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [ownerErr, setOwnerErr] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);

  const owners = useQuery({
    queryKey: ["users", "owners-active"],
    queryFn: () =>
      usersApi.list({
        role: "OWNER",
        isActive: true,
        limit: 100,
        sortBy: "createdAt",
      }),
    enabled: role === "ADMIN" && !editing,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<Values>({
    defaultValues: {
      name: "",
      propertyType: "BUILDING",
      address: "",
      city: "",
      country: "",
      description: "",
      area: "",
      rentAmount: "",
      bedrooms: "1",
      bathrooms: "1",
      floor: "",
    },
    resolver: (values, ctx, opts) => {
      const single =
        !editing &&
        PROPERTY_TYPE_DEFAULTS[(values as Values).propertyType] === "single";
      const schema = single
        ? schemas.property.and(schemas.singleUnit)
        : schemas.property;
      return zodResolver(schema as any)(values, ctx, opts);
    },
  });
  const type = watch("propertyType");
  const single = !editing && PROPERTY_TYPE_DEFAULTS[type] === "single";

  useEffect(() => {
    if (existing.data)
      reset({
        name: existing.data.name,
        propertyType: existing.data.propertyType,
        address: existing.data.address,
        city: existing.data.city,
        country: existing.data.country,
        description: existing.data.description ?? "",
      });
  }, [existing.data, reset]);

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    setOwnerErr(undefined);
    if (!editing && role === "ADMIN" && !ownerId) {
      setOwnerErr(t("v.ownerRequired"));
      return;
    }
    try {
      if (editing) {
        const patch: Partial<PropertyInput> = {};
        (
          [
            "name",
            "propertyType",
            "address",
            "city",
            "country",
            "description",
          ] as const
        ).forEach((k) => {
          if (dirtyFields[k])
            (patch as any)[k] = (v[k] as string)?.trim?.() ?? v[k];
        });
        if (Object.keys(patch).length) await propertiesApi.update(id!, patch);
        await inv.units();
        toast.success(t("properties.updatedToast"));
        navigate(paths.property(id!));
        return;
      }
      const body: PropertyInput = {
        name: v.name.trim(),
        propertyType: v.propertyType,
        address: v.address.trim(),
        city: v.city.trim(),
        ...(v.country?.trim() ? { country: v.country.trim() } : {}),
        ...(v.description?.trim() ? { description: v.description.trim() } : {}),
        ...(role === "ADMIN" ? { ownerId } : {}),
        ...(single ? { unit: unitPayload(v as UnitFormValues) } : {}),
      };
      const created = await propertiesApi.create(body);
      if (files.length) {
        try {
          await propertiesApi.uploadImages(created.id, files);
        } catch (e) {
          toast.error(apiError(e));
        }
      }
      await inv.units();
      if (single) {
        toast.success(t("properties.createdToast"));
        navigate(paths.property(created.id));
      } else {
        toast.success(t("properties.savedAndAdd"));
        navigate(paths.unitNew(created.id));
      }
    } catch (e) {
      const err = normalizeError(e);
      if (err.code === "OWNER_REQUIRED" || err.code === "OWNER_INVALID") {
        setOwnerErr(apiError(e));
        return;
      }
      const rest = mapDetailsToFields(err.details, FIELDS, setError);
      if (rest.length || !err.details?.length) setFormError(apiError(e));
    }
  });

  if (editing && existing.isLoading) return <LoadingSkeleton />;
  if (editing && existing.error)
    return (
      <ErrorState error={existing.error} onRetry={() => existing.refetch()} />
    );
  const e = (k: keyof Values) => errors[k]?.message as string | undefined;

  return (
    <>
      <PageHeader
        title={editing ? t("properties.editTitle") : t("properties.newTitle")}
        subtitle={t("properties.wholeNote")}
      />
      <form
        onSubmit={onSubmit}
        noValidate
        className="mx-auto max-w-3xl space-y-6"
      >
        {formError && <Banner tone="red">{formError}</Banner>}
        <CardSection title={t("properties.tabDetails")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {role === "ADMIN" && !editing && (
              <Select
                wrapperClassName="sm:col-span-2"
                label={t("properties.owner")}
                value={ownerId}
                onChange={(ev) => {
                  setOwnerId(ev.target.value);
                  setOwnerErr(undefined);
                }}
                error={ownerErr}
              >
                <option value="">{t("properties.ownerPick")}</option>
                {owners.data?.data.map((o) => (
                  <option key={o.id} value={o.id}>
                    {fullName(o)} — {o.email}
                  </option>
                ))}
              </Select>
            )}
            <Input
              wrapperClassName="sm:col-span-2"
              label={t("properties.name")}
              error={e("name")}
              maxLength={150}
              {...register("name")}
            />
            <Select
              label={t("properties.type")}
              error={e("propertyType")}
              {...register("propertyType")}
            >
              {PropertyType.map((v) => (
                <option key={v} value={v}>
                  {label("ptype", v)}
                </option>
              ))}
            </Select>
            <Input
              label={t("properties.city")}
              error={e("city")}
              {...register("city")}
            />
            <Input
              wrapperClassName="sm:col-span-2"
              label={t("properties.address")}
              error={e("address")}
              {...register("address")}
            />
            <Input
              label={t("properties.country")}
              optional
              error={e("country")}
              {...register("country")}
            />
            <Textarea
              wrapperClassName="sm:col-span-2"
              label={t("properties.description")}
              optional
              error={e("description")}
              maxLength={2000}
              {...register("description")}
            />
          </div>
        </CardSection>

        {single && (
          <CardSection title={t("properties.singleTitle")}>
            <p className="mb-4 text-sm text-muted">
              {t("properties.singleHint")}
            </p>
            <UnitFields register={register} errors={errors} />
          </CardSection>
        )}
        {!editing && !single && (
          <p className="text-sm text-muted">{t("properties.multiHint")}</p>
        )}

        {!editing && (
          <CardSection title={t("properties.images")}>
            <ImageUploader
              mode="deferred"
              value={[]}
              maxFiles={10}
              hint={t("properties.imagesHint")}
              onFilesChange={setFiles}
            />
          </CardSection>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {editing ? t("common.saveChanges") : t("common.create")}
          </Button>
        </div>
      </form>
    </>
  );
}
