import { useState } from "react";
import { cn } from "@/lib/utils";
import { photoUrl, type PhotoName } from "@/lib/photos";

export type SceneVariant = "tower" | "villa" | "interior" | "street";

/** deterministic pseudo-random so illustrations never change between renders */
const seeded = (i: number) => {
  const x = Math.sin(i * 78.233 + 1.7) * 43758.5453;
  return x - Math.floor(x);
};

function Windows({
  x,
  y,
  cols,
  rows,
  w = 9,
  h = 11,
  gap = 6,
}: {
  x: number;
  y: number;
  cols: number;
  rows: number;
  w?: number;
  h?: number;
  gap?: number;
}) {
  return (
    <>
      {Array.from({ length: cols * rows }).map((_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const s = seeded(i + x + y);
        return (
          <rect
            key={i}
            x={x + c * (w + gap)}
            y={y + r * (h + gap)}
            width={w}
            height={h}
            rx="1.5"
            fill={s < 0.3 ? "var(--accent)" : "var(--surface)"}
            opacity={s < 0.3 ? 0.95 : 0.55}
          />
        );
      })}
    </>
  );
}

/**
 * Fallback artwork shown where a photograph has not been supplied (or failed to load).
 * Drawn with theme variables so it works in light and dark mode. Purely decorative.
 */
export function ArtScene({
  variant = "tower",
  className,
}: {
  variant?: SceneVariant;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={cn("size-full", className)}
    >
      <rect width="400" height="300" fill="var(--surface-2)" />
      {variant === "tower" && (
        <>
          <circle cx="318" cy="70" r="30" fill="var(--accent-soft)" />
          <rect
            x="30"
            y="140"
            width="80"
            height="160"
            fill="var(--surface-3)"
          />
          <rect x="130" y="60" width="110" height="240" fill="var(--primary)" />
          <rect
            x="262"
            y="110"
            width="90"
            height="190"
            fill="var(--surface-3)"
          />
          <Windows x={146} y={78} cols={5} rows={9} w={9} h={11} gap={7} />
          <Windows x={44} y={156} cols={3} rows={5} w={9} h={11} gap={9} />
          <Windows x={276} y={126} cols={4} rows={6} w={9} h={11} gap={7} />
          <rect
            x="0"
            y="288"
            width="400"
            height="12"
            fill="var(--line-strong)"
          />
        </>
      )}
      {variant === "villa" && (
        <>
          <circle cx="330" cy="62" r="26" fill="var(--accent-soft)" />
          <rect x="0" y="236" width="400" height="64" fill="var(--green-bg)" />
          <rect x="96" y="132" width="208" height="110" fill="var(--surface)" />
          <polygon points="82,136 200,64 318,136" fill="var(--primary)" />
          <rect
            x="186"
            y="176"
            width="28"
            height="66"
            rx="3"
            fill="var(--accent)"
          />
          <rect
            x="116"
            y="160"
            width="46"
            height="36"
            rx="3"
            fill="var(--blue-bg)"
            stroke="var(--line-strong)"
          />
          <rect
            x="238"
            y="160"
            width="46"
            height="36"
            rx="3"
            fill="var(--blue-bg)"
            stroke="var(--line-strong)"
          />
          <circle
            cx="58"
            cy="206"
            r="30"
            fill="var(--green-dot)"
            opacity=".55"
          />
          <rect x="55" y="226" width="6" height="22" fill="var(--gray-dot)" />
          <circle
            cx="346"
            cy="212"
            r="22"
            fill="var(--green-dot)"
            opacity=".45"
          />
          <rect x="343" y="228" width="6" height="20" fill="var(--gray-dot)" />
        </>
      )}
      {variant === "interior" && (
        <>
          <rect y="212" width="400" height="88" fill="var(--surface-3)" />
          <rect
            x="226"
            y="44"
            width="130"
            height="118"
            rx="4"
            fill="var(--blue-bg)"
            stroke="var(--line-strong)"
            strokeWidth="4"
          />
          <line
            x1="291"
            y1="44"
            x2="291"
            y2="162"
            stroke="var(--line-strong)"
            strokeWidth="3"
          />
          <line
            x1="226"
            y1="103"
            x2="356"
            y2="103"
            stroke="var(--line-strong)"
            strokeWidth="3"
          />
          <rect
            x="40"
            y="150"
            width="190"
            height="66"
            rx="14"
            fill="var(--primary)"
          />
          <rect
            x="52"
            y="128"
            width="166"
            height="40"
            rx="12"
            fill="var(--primary-hover)"
          />
          <rect x="60" y="212" width="8" height="14" fill="var(--gray-dot)" />
          <rect x="202" y="212" width="8" height="14" fill="var(--gray-dot)" />
          <line
            x1="316"
            y1="150"
            x2="316"
            y2="236"
            stroke="var(--gray-dot)"
            strokeWidth="4"
          />
          <ellipse cx="316" cy="146" rx="22" ry="14" fill="var(--accent)" />
          <rect
            x="262"
            y="236"
            width="104"
            height="8"
            rx="4"
            fill="var(--surface-2)"
          />
        </>
      )}
      {variant === "street" && (
        <>
          <rect
            x="0"
            y="262"
            width="400"
            height="38"
            fill="var(--line-strong)"
          />
          {[
            { x: 14, w: 82, h: 150, c: "var(--surface-3)" },
            { x: 104, w: 96, h: 200, c: "var(--primary)" },
            { x: 208, w: 78, h: 130, c: "var(--surface-3)" },
            { x: 294, w: 92, h: 176, c: "var(--primary-hover)" },
          ].map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={262 - b.h} width={b.w} height={b.h} fill={b.c} />
              <Windows
                x={b.x + 12}
                y={262 - b.h + 14}
                cols={Math.floor((b.w - 14) / 15)}
                rows={Math.floor((b.h - 50) / 17)}
                w={9}
                h={11}
                gap={6}
              />
              <rect
                x={b.x + b.w / 2 - 8}
                y={262 - 24}
                width="16"
                height="24"
                rx="2"
                fill="var(--accent)"
              />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

/**
 * A photograph with a graceful fallback. If `src` is missing or fails to load, the matching illustration is shown,
 * so the layout never breaks while real photography is being sourced (see docs/ASSETS.md).
 */
export function Photo({
  src: srcProp,
  name,
  alt,
  variant = "tower",
  className,
  eager,
  overlay,
  children,
}: {
  /** a direct URL (e.g. an image uploaded to a property) */ src?:
    | string
    | null;
  /** a bundled photograph, by file name */ name?: PhotoName;
  alt: string;
  variant?: SceneVariant;
  className?: string;
  eager?: boolean;
  overlay?: boolean;
  children?: React.ReactNode;
}) {
  const src = srcProp ?? (name ? photoUrl(name) : undefined);
  // Failure/loaded state is remembered per URL, so a `src` that arrives later (or changes) is evaluated afresh
  // instead of inheriting the "failed" state of the previous render, which had no src yet.
  const [failedSrc, setFailedSrc] = useState<string>();
  const [loadedSrc, setLoadedSrc] = useState<string>();
  const failed = !src || failedSrc === src;
  const loaded = loadedSrc === src;
  // the container always has its own size (aspect ratio from the caller), so the image never shifts the layout
  return (
    <div
      className={cn("relative isolate overflow-hidden bg-surface-2", className)}
      role={failed && alt ? "img" : undefined}
      aria-label={failed && alt ? alt : undefined}
      aria-hidden={failed && !alt ? true : undefined}
    >
      {failed && (
        <div className="absolute inset-0">
          <ArtScene variant={variant} />
        </div>
      )}
      {!failed && (
        <img
          src={src!}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailedSrc(src)}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      {overlay && (
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#0a1020]/70 via-[#0a1020]/10 to-transparent"
        />
      )}
      {children}
    </div>
  );
}
