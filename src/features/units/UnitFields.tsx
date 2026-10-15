import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input, Textarea } from "@/components/ui/Field";
import { useT } from "@/i18n";

export interface UnitFormValues {
  unitNumber?: string;
  area: string;
  rentAmount: string;
  bedrooms: string;
  bathrooms: string;
  floor?: string;
  description?: string;
}

/** The same fields serve "add a unit" and the single-unit step of "new property". */
export function UnitFields({
  register,
  errors,
  withNumber,
  disabled,
}: {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  withNumber?: boolean;
  disabled?: boolean;
}) {
  const t = useT();
  const e = (k: string) => errors[k]?.message as string | undefined;
  const num = {
    inputMode: "numeric" as const,
    type: "number" as const,
    min: 0,
    step: 1,
    disabled,
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {withNumber && (
        <Input
          label={t("units.number")}
          error={e("unitNumber")}
          disabled={disabled}
          maxLength={50}
          {...register("unitNumber")}
        />
      )}
      <Input
        label={t("units.floor")}
        optional
        error={e("floor")}
        type="number"
        step={1}
        disabled={disabled}
        {...register("floor")}
      />
      <Input
        label={t("units.area")}
        error={e("area")}
        {...num}
        min={1}
        max={9999}
        {...register("area")}
      />
      <Input
        label={`${t("units.rentLabel")}`}
        error={e("rentAmount")}
        {...num}
        {...register("rentAmount")}
      />
      <Input
        label={t("units.bedrooms")}
        error={e("bedrooms")}
        {...num}
        {...register("bedrooms")}
      />
      <Input
        label={t("units.bathrooms")}
        error={e("bathrooms")}
        {...num}
        {...register("bathrooms")}
      />
      <Textarea
        wrapperClassName="sm:col-span-2"
        label={t("properties.description")}
        optional
        error={e("description")}
        disabled={disabled}
        maxLength={2000}
        {...register("description")}
      />
    </div>
  );
}

export const unitPayload = (v: UnitFormValues) => ({
  area: Number(v.area),
  rentAmount: Number(v.rentAmount),
  bedrooms: Number(v.bedrooms),
  bathrooms: Number(v.bathrooms),
  ...(v.floor !== undefined && v.floor !== ""
    ? { floor: Number(v.floor) }
    : {}),
  ...(v.description?.trim() ? { description: v.description.trim() } : {}),
});
