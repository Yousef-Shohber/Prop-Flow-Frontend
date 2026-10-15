import { Clock, Flame } from "lucide-react";
import { useEnumLabel, type EnumFamily } from "@/i18n";
import { cn } from "@/lib/utils";

export type BadgeKind =
  | "unit"
  | "lease"
  | "rentalRequest"
  | "maintenance"
  | "priority";
type Tone = "green" | "blue" | "amber" | "red" | "teal" | "gray" | "orange";

/** Semantic colours (spec §7.2). Always paired with a text label — never colour alone. */
export const STATUS_TONES: Record<BadgeKind, Record<string, Tone>> = {
  unit: { AVAILABLE: "green", RENTED: "blue", MAINTENANCE: "amber" },
  lease: {
    PENDING: "amber",
    ACTIVE: "green",
    TERMINATED: "gray",
    EXPIRED: "red",
  },
  rentalRequest: {
    PENDING: "amber",
    APPROVED: "green",
    REJECTED: "red",
    CANCELLED: "gray",
    EXPIRED: "orange",
  },
  maintenance: {
    OPEN: "amber",
    ASSIGNED: "blue",
    IN_PROGRESS: "blue",
    RESOLVED: "teal",
    CLOSED: "gray",
    CANCELLED: "red",
  },
  priority: { LOW: "gray", MEDIUM: "blue", HIGH: "amber", URGENT: "red" },
};
const FAMILY: Record<BadgeKind, EnumFamily> = {
  unit: "unit",
  lease: "lease",
  rentalRequest: "rr",
  maintenance: "mnt",
  priority: "pri",
};

export function StatusBadge({
  kind,
  value,
  className,
}: {
  kind: BadgeKind;
  value: string | null | undefined;
  className?: string;
}) {
  const label = useEnumLabel();
  if (!value) return <span className="text-faint">—</span>;
  const tone = STATUS_TONES[kind][value] ?? "gray";
  const expired = kind === "rentalRequest" && value === "EXPIRED";
  const urgent = kind === "priority" && value === "URGENT";
  return (
    <span
      data-tone={tone}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        className,
      )}
      style={{ background: `var(--${tone}-bg)`, color: `var(--${tone}-fg)` }}
    >
      {expired ? (
        <Clock className="size-3" aria-hidden />
      ) : urgent ? (
        <Flame className="size-3" aria-hidden />
      ) : (
        <span
          className="size-1.5 rounded-full"
          style={{ background: `var(--${tone}-dot)` }}
          aria-hidden
        />
      )}
      {label(FAMILY[kind], value)}
    </span>
  );
}
