import { ArrowRight, Building2, Images, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useFromState } from "@/lib/backTo";
import { Photo } from "@/components/ui/Photo";
import { Tag } from "@/components/ui/Misc";
import { useEnumLabel, useI18n } from "@/i18n";
import { formatRelative } from "@/lib/format";
import { TYPE_PHOTO } from "@/lib/photos";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import type { Property } from "@/types/models";

/** Small square thumbnail used in tables: the owner's photo, or a neutral icon. */
export function Cover({
  url,
  alt,
  className,
}: {
  url?: string;
  alt: string;
  className?: string;
}) {
  return url ? (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
    />
  ) : (
    <div
      className={`${className ?? ""} flex items-center justify-center bg-surface-2 text-faint`}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <Building2 className="size-5" aria-hidden />
    </div>
  );
}

const FRESH_DAYS = 14;
/** A listing counts as new for two weeks; derived from the real createdAt, never invented. */
export const isFresh = (iso: string, now = Date.now()) =>
  now - new Date(iso).getTime() < FRESH_DAYS * 86_400_000;

export function PropertyCard({
  property,
  className,
}: {
  property: Property;
  className?: string;
}) {
  const label = useEnumLabel();
  const { t, lang } = useI18n();
  const state = useFromState();
  const photos = property.images.length;
  const fresh = isFresh(property.createdAt);
  return (
    <Link
      to={paths.property(property.id)}
      state={state}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-pop focus-visible:-translate-y-1",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        <Photo
          src={property.images[0]?.url}
          variant={TYPE_PHOTO[property.propertyType].variant}
          alt={
            property.images[0]
              ? t("properties.coverAlt", { name: property.name })
              : ""
          }
          overlay
          className="size-full transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute start-3 top-3 flex items-center gap-1.5">
          <Tag className="bg-surface/90 text-ink backdrop-blur">
            {label("ptype", property.propertyType)}
          </Tag>
          {fresh && (
            <Tag className="bg-accent text-[#1b1405]">
              {t("discover.badgeNew")}
            </Tag>
          )}
        </span>
        {photos > 1 && (
          <span className="num absolute end-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            <Images className="size-3.5" aria-hidden />
            {photos}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="truncate text-base font-semibold">{property.name}</h3>
        <p className="flex items-center gap-1.5 truncate text-sm text-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {property.city}
          {property.address
            ? `${lang === "ar" ? "، " : ", "}${property.address}`
            : ""}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-xs text-faint">
          <span>
            {t("discover.addedAgo", {
              when: formatRelative(property.createdAt, lang),
            })}
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-accent-ink transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 dark:text-accent">
            {t("discover.viewDetails")}
            <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
