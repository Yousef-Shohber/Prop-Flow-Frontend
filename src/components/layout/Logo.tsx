import { cn } from "@/lib/utils";

/** A roofline over a flowing line: a home, and the flow of rent, requests and repairs. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-9", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <path
        d="M7 15.5 16 8l9 7.5"
        fill="none"
        stroke="var(--logo-roof)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 22.5c2.6-3 4.6 2.6 7.5-.2s4.9-2.8 7.5.2"
        fill="none"
        stroke="var(--on-primary)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
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
