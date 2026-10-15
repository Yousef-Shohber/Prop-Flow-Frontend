import { Bath, BedDouble, DoorOpen, Maximize2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useFromState } from "@/lib/backTo";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useProperty, usePendingRequestMap } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Unit } from "@/types/models";

/** Unit list items carry no property name: resolve it lazily through the shared ['properties', id] cache. */
export function PropertyLink({
  propertyId,
  className,
}: {
  propertyId: string;
  className?: string;
}) {
  const q = useProperty(propertyId);
  if (!q.data)
    return (
      <span className={`text-faint ${className ?? ""}`}>
        {q.isLoading ? "…" : "—"}
      </span>
    );
  return (
    <Link
      to={paths.property(propertyId)}
      onClick={(e) => e.stopPropagation()}
      className={`font-medium hover:underline ${className ?? ""}`}
    >
      {q.data.name}
    </Link>
  );
}

export function UnitSpecs({
  unit,
  className,
}: {
  unit: Pick<Unit, "bedrooms" | "bathrooms" | "area">;
  className?: string;
}) {
  const { lang } = useI18n();
  const n = (v: number) => formatNumber(v, lang);
  return (
    <ul
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted ${className ?? ""}`}
    >
      <li className="flex items-center gap-1.5">
        <BedDouble className="size-4" aria-hidden />
        <span className="num">{n(unit.bedrooms)}</span>
      </li>
      <li className="flex items-center gap-1.5">
        <Bath className="size-4" aria-hidden />
        <span className="num">{n(unit.bathrooms)}</span>
      </li>
      <li className="flex items-center gap-1.5">
        <Maximize2 className="size-4" aria-hidden />
        <span className="num">{n(unit.area)} m²</span>
      </li>
    </ul>
  );
}

export function UnitThumb({
  unit,
  className = "size-11 rounded-lg",
}: {
  unit: Pick<Unit, "images">;
  className?: string;
}) {
  return unit.images[0] ? (
    <img
      src={unit.images[0].url}
      alt=""
      loading="lazy"
      className={`${className} object-cover`}
    />
  ) : (
    <span
      className={`${className} flex items-center justify-center bg-surface-2 text-faint`}
    >
      <DoorOpen className="size-5" aria-hidden />
    </span>
  );
}

/** Tenant call-to-action: "Request to rent", or a link to the request they already have (spec §16). */
export function RentCta({
  unit,
  size = "sm",
  pending,
}: {
  unit: Pick<Unit, "id" | "status">;
  size?: "sm" | "md";
  pending?: Map<string, string>;
}) {
  const { role } = useAuth();
  const { t } = useI18n();
  const own = usePendingRequestMap();
  const map = pending ?? own;
  if (role !== "TENANT" || unit.status !== "AVAILABLE") return null;
  const existing = map.get(unit.id);
  if (existing)
    return (
      <Button
        size={size}
        variant="secondary"
        to={paths.rentalRequest(existing)}
      >
        {t("units.viewRequest")}
      </Button>
    );
  return (
    <Button size={size} to={paths.rentalRequestNew(unit.id)}>
      {t("properties.requestToRent")}
    </Button>
  );
}

export function UnitCard({
  unit,
  pending,
  className,
}: {
  unit: Unit;
  pending?: Map<string, string>;
  className?: string;
}) {
  const { t, lang } = useI18n();
  const state = useFromState();
  return (
    <div
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-pop",
        className,
      )}
    >
      <Link
        to={paths.unit(unit.id)}
        state={state}
        tabIndex={-1}
        aria-hidden
        className="block"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
          <Photo
            src={unit.images[0]?.url}
            variant="interior"
            alt=""
            overlay
            className="size-full transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute start-3 top-3">
            <StatusBadge kind="unit" value={unit.status} />
          </span>
          <span className="num absolute end-3 bottom-3 rounded-full bg-surface/95 px-3 py-1 text-sm font-bold text-ink shadow-soft backdrop-blur">
            {formatMoney(unit.rentAmount, lang)}
            <span className="ms-1 text-xs font-medium text-muted">
              {t("units.perMonth")}
            </span>
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          to={paths.unit(unit.id)}
          state={state}
          className="truncate text-base font-semibold hover:underline"
        >
          {t("units.unit", { n: unit.unitNumber })}
        </Link>
        <PropertyLink
          propertyId={unit.propertyId}
          className="truncate text-sm text-muted"
        />
        <UnitSpecs unit={unit} />
        <div className="mt-auto flex justify-end pt-2">
          <RentCta unit={unit} pending={pending} />
        </div>
      </div>
    </div>
  );
}
