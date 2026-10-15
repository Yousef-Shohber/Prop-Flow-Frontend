import { useMemo, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const STATES = ["AVAILABLE", "RENTED", "MAINTENANCE"] as const;
type S = (typeof STATES)[number] | "DARK";

const VAR_COLOR: Record<S, string> = {
  AVAILABLE: "var(--green-dot)",
  RENTED: "var(--blue-dot)",
  MAINTENANCE: "var(--amber-dot)",
  DARK: "var(--surface-3)",
};
const FIXED_COLOR: Record<S, string> = {
  AVAILABLE: "#3dc47a",
  RENTED: "#6aa0f5",
  MAINTENANCE: "#f0b04a",
  DARK: "rgba(255,255,255,0.10)",
};

/** deterministic pseudo-random so the facade is the same on every load */
const seeded = (i: number) => {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * PropFlow's signature visual: a building whose windows are its units, coloured by status.
 * It is an illustration, not data. Windows change state slowly, the way real units do.
 */
export function BuildingScene({
  className,
  cols = 5,
  rows = 6,
  tone = "default",
  animate = true,
}: {
  className?: string;
  cols?: number;
  rows?: number;
  tone?: "default" | "onPrimary";
  animate?: boolean;
}) {
  const root = useRef<SVGSVGElement>(null);
  const palette = tone === "onPrimary" ? FIXED_COLOR : VAR_COLOR;

  const cell = 40;
  const gap = 12;
  const padX = 26;
  const top = 58;
  const bottom = 70;
  const w = padX * 2 + cols * cell + (cols - 1) * gap;
  const h = top + rows * cell + (rows - 1) * gap + bottom;

  const initial = useMemo<S[]>(
    () =>
      Array.from({ length: cols * rows }, (_, i) => {
        const r = seeded(i + cols * 7);
        return r < 0.16
          ? "DARK"
          : r < 0.5
            ? "RENTED"
            : r < 0.86
              ? "AVAILABLE"
              : "MAINTENANCE";
      }),
    [cols, rows],
  );

  useGSAP(
    () => {
      const svg = root.current;
      if (!svg) return;
      const wins = Array.from(
        svg.querySelectorAll<SVGRectElement>("[data-win]"),
      );
      if (!animate || prefersReducedMotion()) return;
      gsap.fromTo(
        svg.querySelector("[data-body]"),
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
      );
      gsap.fromTo(
        svg.querySelector("[data-roof]"),
        { strokeDashoffset: 260 },
        {
          strokeDashoffset: 0,
          duration: 1.1,
          ease: "power2.inOut",
          delay: 0.15,
        },
      );
      gsap.fromTo(
        wins,
        { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" },
        {
          opacity: 1,
          scale: 1,
          duration: 0.45,
          ease: "back.out(1.8)",
          stagger: { each: 0.022, from: "random" },
          delay: 0.35,
        },
      );

      // a window quietly changes status every couple of seconds
      const id = window.setInterval(() => {
        if (document.hidden) return;
        const el = wins[Math.floor(Math.random() * wins.length)];
        const cur = el.dataset.state as S;
        const pool = (
          cur === "DARK"
            ? ["AVAILABLE", "RENTED"]
            : STATES.filter((s) => s !== cur)
        ) as S[];
        const next = pool[Math.floor(Math.random() * pool.length)];
        el.dataset.state = next;
        el.style.fill = palette[next];
        gsap.fromTo(
          el,
          { scale: 1.18, transformOrigin: "50% 50%" },
          { scale: 1, duration: 0.5, ease: "power2.out" },
        );
      }, 2200);
      return () => window.clearInterval(id);
    },
    { scope: root, dependencies: [cols, rows, tone, animate] },
  );

  const body =
    tone === "onPrimary"
      ? { fill: "rgba(255,255,255,0.06)", stroke: "rgba(255,255,255,0.20)" }
      : { fill: "var(--surface)", stroke: "var(--line-strong)" };
  const accent = tone === "onPrimary" ? "#f0b04a" : "var(--accent)";

  return (
    <svg
      ref={root}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-hidden
      className={cn("block h-auto", className)}
    >
      <g data-body>
        <rect
          x="4"
          y={top - 26}
          width={w - 8}
          height={h - top + 22}
          rx="14"
          fill={body.fill}
          stroke={body.stroke}
          strokeWidth="1.5"
        />
        <rect
          x={w / 2 - 22}
          y={h - bottom + 20}
          width="44"
          height={bottom - 22}
          rx="8"
          fill={
            tone === "onPrimary" ? "rgba(255,255,255,0.14)" : "var(--surface-3)"
          }
        />
        <circle cx={w / 2 + 12} cy={h - bottom / 2 + 8} r="2.4" fill={accent} />
      </g>
      <path
        data-roof
        d={`M${w / 2 - 78} ${top - 20} L${w / 2} ${top - 46} L${w / 2 + 78} ${top - 20}`}
        fill="none"
        stroke={accent}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="260"
      />
      {initial.map((s, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        return (
          <rect
            key={i}
            data-win
            data-state={s}
            x={padX + c * (cell + gap)}
            y={top + r * (cell + gap)}
            width={cell}
            height={cell}
            rx="7"
            style={{ fill: palette[s], transition: "fill .7s ease" }}
          />
        );
      })}
    </svg>
  );
}

export function StatusLegend({
  className,
  labels,
}: {
  className?: string;
  labels: { available: string; rented: string; maintenance: string };
}) {
  const items: [string, string][] = [
    ["var(--green-dot)", labels.available],
    ["var(--blue-dot)", labels.rented],
    ["var(--amber-dot)", labels.maintenance],
  ];
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted",
        className,
      )}
    >
      {items.map(([c, l]) => (
        <li key={l} className="flex items-center gap-2">
          <span className="size-2.5 rounded-[3px]" style={{ background: c }} />
          {l}
        </li>
      ))}
    </ul>
  );
}
