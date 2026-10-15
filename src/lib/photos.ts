import type { PropertyType } from "@/types/enums";
import type { SceneVariant } from "@/components/ui/Photo";

/**
 * Photography is opt-in by file name: drop `hero-residential.jpg` (or .webp/.png) into `src/assets/photos/`
 * and it is picked up, fingerprinted and cached by Vite. Missing files simply resolve to `undefined`, so the
 * UI shows its illustration instead of firing a 404 request. See docs/ASSETS.md for the full list.
 */
const files = import.meta.glob("../assets/photos/*.{jpg,jpeg,webp,png}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const byName = new Map<string, string>(
  Object.entries(files).map(([path, url]) => [
    path
      .split("/")
      .pop()!
      .replace(/\.[^.]+$/, ""),
    url,
  ]),
);

export type PhotoName =
  | "hero-residential"
  | "welcome-hero"
  | "gallery-tower"
  | "gallery-villa"
  | "gallery-interior"
  | "gallery-tower2"
  | "gallery-commercial"
  | "cta-skyline"
  | "type-townhouse"
  | "type-other";
export const photoUrl = (name: PhotoName): string | undefined =>
  byName.get(name);

/**
 * Illustrative marketing photo per property type (used by the type tiles, the landing showcase and as the
 * fallback artwork on cards). Listings themselves only ever show images their owner uploaded.
 */
export const TYPE_PHOTO: Record<
  PropertyType,
  { photo: PhotoName; variant: SceneVariant }
> = {
  BUILDING: { photo: "gallery-tower", variant: "tower" },
  VILLA: { photo: "gallery-villa", variant: "villa" },
  STUDIO: { photo: "gallery-interior", variant: "interior" },
  TOWNHOUSE: { photo: "type-townhouse", variant: "street" },
  COMMERCIAL: { photo: "gallery-commercial", variant: "street" },
  OTHER: { photo: "type-other", variant: "tower" },
};
