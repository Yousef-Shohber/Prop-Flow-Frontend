import { useQueries, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { leasesApi } from "@/api/leases";
import { maintenanceApi } from "@/api/maintenance";
import { propertiesApi } from "@/api/properties";
import { rentalRequestsApi } from "@/api/rentalRequests";
import { renewalsApi } from "@/api/renewals";
import { unitsApi } from "@/api/units";
import { useI18n } from "@/i18n";
import { normalizeError } from "@/lib/errors";
import { fetchAll } from "@/lib/fetchAll";
import { fullName } from "@/lib/format";
import type { AuditLog } from "@/types/models";
import { REF_KEYS, type RefKind, type RefResolver } from "./describe";

type Gone = { gone: true };
type Name = (id?: string | null) => string;

/**
 * Turns the ids found in the visible audit rows into readable labels. The API's own enrichment
 * (`actor`, `entityLabel`, `refs`) wins when present; otherwise each unique id is looked up once
 * (cached 10 minutes). A 404 means the record is gone: it renders as "No longer available", never as an id.
 */
export function useAuditRefs(logs: AuditLog[] | undefined, userName: Name) {
  const { t } = useI18n();

  const props = useQuery({
    queryKey: ["audit-logs", "property-names"],
    queryFn: async () => {
      const { rows } = await fetchAll((page, limit) =>
        propertiesApi.list({ page, limit, sortBy: "name", sortOrder: "ASC" }),
      );
      return new Map(rows.map((p) => [p.id, p.name]));
    },
    staleTime: 10 * 60_000,
    retry: false,
  });
  const propName = useCallback(
    (id?: string) => (id ? props.data?.get(id) : undefined),
    [props.data],
  );

  const wanted = useMemo(() => {
    const s = new Map<string, { kind: RefKind; id: string }>();
    const add = (kind: RefKind, id: unknown) => {
      if (
        typeof id === "string" &&
        id &&
        kind !== "User" &&
        kind !== "Property"
      )
        s.set(`${kind}:${id}`, { kind, id });
    };
    for (const l of logs ?? []) {
      if (l.entityLabel === undefined) add(l.entity as RefKind, l.entityId);
      for (const [k, kind] of Object.entries(REF_KEYS))
        if (!l.refs?.[k]) add(kind, l.metadata?.[k]);
    }
    return [...s.values()];
  }, [logs]);

  const unitLabel = (u: { unitNumber: string; propertyId: string }) => {
    const p = propName(u.propertyId);
    return p
      ? `${t("units.unit", { n: u.unitNumber })} · ${p}`
      : t("units.unit", { n: u.unitNumber });
  };

  const results = useQueries({
    queries: wanted.map(({ kind, id }) => ({
      queryKey: ["audit-logs", "ref", kind, id, props.data ? "p" : "-"],
      staleTime: 10 * 60_000,
      retry: false,
      queryFn: async (): Promise<string | Gone | null> => {
        try {
          switch (kind) {
            case "Unit":
              return unitLabel(await unitsApi.get(id));
            case "Lease": {
              const l = await leasesApi.get(id);
              const who = userName(l.tenantId);
              return who ? `${who} — ${unitLabel(l.unit)}` : unitLabel(l.unit);
            }
            case "RentalRequest": {
              const r = await rentalRequestsApi.get(id);
              const who = fullName(r.tenant) || userName(r.tenantId);
              const u = r.unit ? unitLabel(r.unit) : "";
              return [who, u].filter(Boolean).join(" — ") || null;
            }
            case "LeaseRenewalRequest": {
              const r = await renewalsApi.get(id);
              const who = fullName(r.tenant) || userName(r.tenantId);
              const u = r.unit ? unitLabel(r.unit) : "";
              return [who, u].filter(Boolean).join(" — ") || null;
            }
            case "MaintenanceRequest":
              return (await maintenanceApi.get(id)).title;
            default:
              return null;
          }
        } catch (e) {
          if (normalizeError(e).status === 404) return { gone: true };
          return null;
        }
      },
    })),
  });

  const table = useMemo(() => {
    const m = new Map<
      string,
      { done: boolean; value: string | null | undefined }
    >();
    wanted.forEach((w, i) => {
      const r = results[i];
      const v = r?.data;
      m.set(`${w.kind}:${w.id}`, {
        done: !!r && !r.isLoading,
        value: v && typeof v === "object" ? null : (v ?? undefined),
      });
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, results.map((r) => r.dataUpdatedAt).join(",")]);

  const ref: RefResolver = useCallback(
    (kind, id) => {
      if (kind === "User") return userName(id) || undefined;
      if (kind === "Property") {
        if (props.isLoading) return undefined;
        return props.data?.get(id) ?? null;
      }
      const hit = table.get(`${kind}:${id}`);
      return hit?.done ? hit.value : undefined;
    },
    [table, userName, props.data, props.isLoading],
  );

  /** Label of the record the entry points to (API value first). `undefined` while still loading. */
  const entityOf = useCallback(
    (l: AuditLog): string | null | undefined => {
      if (typeof l.entityLabel === "string") return l.entityLabel;
      if (l.entityLabel === null) return null;
      if (!l.entityId) return null;
      if (l.entity === "User") return userName(l.entityId) || null;
      return ref(l.entity as RefKind, l.entityId);
    },
    [ref, userName],
  );

  /** Same for ids inside metadata (API `refs` first). */
  const refOf = useCallback(
    (l: AuditLog): RefResolver =>
      (kind, id, key) => {
        const r = key ? l.refs?.[key] : undefined;
        if (r) return r.label;
        return ref(kind, id);
      },
    [ref],
  );

  return { entityOf, refOf, loading: results.some((r) => r.isLoading) };
}
