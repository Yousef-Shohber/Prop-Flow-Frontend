import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * A solid house with a flowing line rising through it: a home, and the flow of rent, requests and repairs.
 * Bold shapes only, so it stays readable down to favicon size; colours follow the theme (light / dark).
 */
export function LogoMark({ className }: { className?: string }) {
  const clip = `logo-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <defs>
        <clipPath id={clip}>
          <path d="M20 8 32.2 18.2V30.6a2.4 2.4 0 0 1-2.4 2.4H10.2a2.4 2.4 0 0 1-2.4-2.4V18.2Z" />
        </clipPath>
      </defs>
      <rect width="40" height="40" rx="11" fill="var(--primary)" />
      <path
        d="M20 7 33.5 18.2V30.6a3.6 3.6 0 0 1-3.6 3.6H10.1a3.6 3.6 0 0 1-3.6-3.6V18.2Z"
        fill="var(--on-primary)"
        stroke="var(--on-primary)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <g clipPath={`url(#${clip})`}>
        <path
          d="M4 33C13 33 15.5 23.5 22 23.5S29 19 37 15V37H4Z"
          fill="var(--accent)"
        />
        <path
          d="M4 33C13 33 15.5 23.5 22 23.5S29 19 37 15"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.8"
        />
      </g>
    </svg>
  );
}
export function Logo({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <span
          dir="ltr"
          className="font-display text-[1.2rem] font-bold tracking-tight"
        >
          Prop<span className="text-accent-ink dark:text-accent">Flow</span>
        </span>
      )}
    </span>
  );
}
