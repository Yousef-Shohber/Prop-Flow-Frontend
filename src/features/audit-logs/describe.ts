import type { TFn } from "@/i18n";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import type { AuditLog } from "@/types/models";

export type RefKind =
  | "Property"
  | "Unit"
  | "Lease"
  | "RentalRequest"
  | "LeaseRenewalRequest"
  | "MaintenanceRequest"
  | "User";

/** metadata key -> record kind its value points to */
export const REF_KEYS: Record<string, RefKind> = {
  unitId: "Unit",
  propertyId: "Property",
  leaseId: "Lease",
  assignedStaffId: "User",
  renewalRequestId: "LeaseRenewalRequest",
};

/** undefined = unknown / still loading, null = the record no longer exists, string = its label */
export type RefResolver = (
  kind: RefKind,
  id: string,
  key?: string,
) => string | null | undefined;

export interface DescribeCtx {
  t: TFn;
  has: (k: string) => boolean;
  lang: string;
  enumLabel: (family: any, v: string | null | undefined) => string;
  ref: RefResolver;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const HIDDEN: Record<string, string[]> = {
  USER_STATUS_CHANGED: ["isActive"],
  OWNER_VERIFICATION_CHANGED: ["ownerVerified"],
  ROLE_CHANGED: ["role", "previousRole", "source"],
  UNIT_STATUS_CHANGED: ["previousStatus", "newStatus"],
  RENTAL_REQUEST_REJECTED: ["reason"],
  LEASE_TERMINATED: ["reason"],
  LEASE_RENEWED: ["previousEndDate", "newEndDate"],
  LEASE_RENEWAL_REQUESTED: ["requestedEndDate"],
  RENTAL_REQUEST_CREATED: ["startDate", "endDate"],
  MAINTENANCE_ASSIGNED: ["assignedStaffId"],
};

const humanize = (k: string) => {
  const s = k
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function fieldLabel(ctx: DescribeCtx, key: string) {
  return ctx.has(`audit.field.${key}`)
    ? ctx.t(`audit.field.${key}`)
    : humanize(key);
}

/** Formats one value by the field it belongs to. Returns "" when it must not be shown (e.g. a bare id). */
export function formatValue(ctx: DescribeCtx, key: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean")
    return v ? ctx.t("export.yes") : ctx.t("export.no");
  if (typeof v === "number") {
    if (key === "rentAmount") return formatMoney(v, ctx.lang);
    if (key === "area") return `${formatNumber(v, ctx.lang)} m²`;
    return formatNumber(v, ctx.lang);
  }
  if (typeof v === "string") {
    if (UUID.test(v)) {
      const kind = REF_KEYS[key];
      const label = kind ? ctx.ref(kind, v, key) : undefined;
      return label ?? "";
    }
    if (DATE.test(v)) return formatDate(v, ctx.lang);
    if (key === "propertyType") return ctx.enumLabel("ptype", v);
    if (key === "status" || key === "previousStatus" || key === "newStatus")
      return ctx.enumLabel("unit", v);
    if (key === "role" || key === "previousRole")
      return ctx.enumLabel("role", v);
    if (/^[A-Z][A-Z0-9_]+$/.test(v)) {
      if (ctx.has(`audit.why.${v}`)) return ctx.t(`audit.why.${v}`);
      return humanize(v);
    }
    return v;
  }
  return "";
}

export interface Change {
  field: string;
  label: string;
  before: string;
  after: string;
  money: boolean;
}

export function getChanges(ctx: DescribeCtx, log: AuditLog): Change[] {
  const raw = log.metadata?.changes;
  if (!isObj(raw)) return [];
  return Object.entries(raw).map(([field, v]) => {
    const c = isObj(v) ? v : { before: v, after: undefined };
    return {
      field,
      label: fieldLabel(ctx, field),
      before: formatValue(ctx, field, c.before) || "—",
      after: formatValue(ctx, field, c.after) || "—",
      money: field === "rentAmount",
    };
  });
}

/** One-line localized summary (spec 6.1). Empty string when the action name says it all. */
export function summarize(ctx: DescribeCtx, log: AuditLog): string {
  const { t, enumLabel } = ctx;
  const m = log.metadata ?? {};
  const str = (k: string) => (typeof m[k] === "string" ? (m[k] as string) : "");
  switch (log.action) {
    case "USER_STATUS_CHANGED":
      return typeof m.isActive === "boolean"
        ? t(m.isActive ? "audit.s.userActivated" : "audit.s.userDeactivated")
        : "";
    case "OWNER_VERIFICATION_CHANGED":
      return typeof m.ownerVerified === "boolean"
        ? t(
            m.ownerVerified
              ? "audit.s.ownerVerified"
              : "audit.s.ownerUnverified",
          )
        : "";
    case "ROLE_CHANGED": {
      if (m.source === "SELF_SELECTION")
        return t("audit.s.roleSelf", { role: enumLabel("role", str("role")) });
      if (str("previousRole") && str("role"))
        return t("audit.s.roleChanged", {
          from: enumLabel("role", str("previousRole")),
          to: enumLabel("role", str("role")),
        });
      return str("role")
        ? t("audit.s.roleSet", { role: enumLabel("role", str("role")) })
        : "";
    }
    case "UNIT_STATUS_CHANGED":
      return str("previousStatus") && str("newStatus")
        ? t("audit.fromTo", {
            from: enumLabel("unit", str("previousStatus")),
            to: enumLabel("unit", str("newStatus")),
          })
        : "";
    case "RENTAL_REQUEST_REJECTED":
    case "LEASE_TERMINATED": {
      const r = str("reason");
      return r && ctx.has(`audit.why.${r}`) ? t(`audit.why.${r}`) : "";
    }
    case "LEASE_RENEWED":
    case "LEASE_RENEWAL_REQUESTED": {
      const d = str("newEndDate") || str("requestedEndDate");
      return DATE.test(d)
        ? t("audit.s.until", { date: formatDate(d, ctx.lang) })
        : "";
    }
    case "MAINTENANCE_ASSIGNED": {
      const id = str("assignedStaffId");
      const name = id ? ctx.ref("User", id, "assignedStaffId") : undefined;
      return name ? t("audit.s.assignedTo", { name }) : "";
    }
    case "RENTAL_REQUEST_CREATED":
      return DATE.test(str("startDate")) && DATE.test(str("endDate"))
        ? t("audit.s.range", {
            from: formatDate(str("startDate"), ctx.lang),
            to: formatDate(str("endDate"), ctx.lang),
          })
        : "";
    case "PROPERTY_UPDATED":
    case "UNIT_UPDATED": {
      const ch = getChanges(ctx, log);
      if (ch.length === 0) return "";
      const first = ch
        .slice(0, 2)
        .map((c) => `${c.label}: ${c.before} → ${c.after}`)
        .join(" · ");
      return ch.length > 2
        ? `${first} ${t("audit.s.more", { n: ch.length - 2 })}`
        : first;
    }
    default:
      return "";
  }
}

/** Readable key/value list of the remaining metadata. Unknown keys are humanized, bare ids are never printed. */
export function detailsList(ctx: DescribeCtx, log: AuditLog) {
  const m = log.metadata ?? {};
  const hidden = new Set(["changes", ...(HIDDEN[log.action] ?? [])]);
  const out: { key: string; label: string; value: string }[] = [];
  for (const [k, v] of Object.entries(m)) {
    if (hidden.has(k) || isObj(v) || Array.isArray(v)) continue;
    const value = formatValue(ctx, k, v);
    if (!value) continue;
    out.push({ key: k, label: fieldLabel(ctx, k), value });
  }
  return out;
}

/** The record a log entry points to, for the "open record" link. */
export function recordPath(log: AuditLog): string | null {
  if (!log.entityId) return null;
  switch (log.entity) {
    case "Property":
      return `/properties/${log.entityId}`;
    case "Unit":
      return `/units/${log.entityId}`;
    case "Lease":
      return `/leases/${log.entityId}`;
    case "RentalRequest":
      return `/rental-requests/${log.entityId}`;
    case "LeaseRenewalRequest":
      return `/lease-renewal-requests/${log.entityId}`;
    case "MaintenanceRequest":
      return `/maintenance/${log.entityId}`;
    default:
      return null;
  }
}
