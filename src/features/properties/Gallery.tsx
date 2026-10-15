import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { useState } from "react";
import { Photo, type SceneVariant } from "@/components/ui/Photo";
import { useI18n } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ImageRef } from "@/types/models";

const arrow =
  "absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface/90 text-ink shadow-soft backdrop-blur transition hover:bg-surface focus-visible:outline-2";

/** Owner-uploaded photos with previous/next controls; without uploads it shows the neutral illustration, never stock imagery. */
export function Gallery({
  images,
  alt,
  variant = "tower",
}: {
  images: ImageRef[];
  alt: string;
  variant?: SceneVariant;
}) {
  const { t, lang } = useI18n();
  const [i, setI] = useState(0);
  const n = images.length;
  const idx = Math.min(i, Math.max(0, n - 1));
  const cur = images[idx];
  const go = (d: number) => setI((idx + d + n) % n);
  if (!cur) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden rounded-card border border-line">
        <Photo variant={variant} alt="" className="absolute inset-0" />
        <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-4 pt-10 text-sm text-white">
          {t("properties.noPhoto")}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-card border border-line bg-surface-2">
        <img
          key={cur.publicId}
          src={cur.url}
          alt={alt}
          className="aspect-[16/10] w-full object-cover"
          style={{ animation: "fade-in .35s ease" }}
        />
        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t("gallery.prev")}
              className={cn(arrow, "start-3")}
            >
              <ChevronLeft className="size-5 rtl:rotate-180" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t("gallery.next")}
              className={cn(arrow, "end-3")}
            >
              <ChevronRight className="size-5 rtl:rotate-180" aria-hidden />
            </button>
            <span
              className="num absolute end-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur"
              aria-live="polite"
            >
              <Images className="size-3.5" aria-hidden />
              {formatNumber(idx + 1, lang)} / {formatNumber(n, lang)}
            </span>
          </>
        )}
      </div>
      {n > 1 && (
        <ul className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          {images.map((img, k) => (
            <li key={img.publicId} className="shrink-0">
              <button
                type="button"
                onClick={() => setI(k)}
                aria-label={`${alt} ${k + 1}`}
                aria-current={k === idx}
                className={cn(
                  "block overflow-hidden rounded-xl border-2 transition",
                  k === idx
                    ? "border-accent"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <img
                  src={img.url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-16 object-cover sm:size-20"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
