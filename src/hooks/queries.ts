import { useQuery, useQueryClient } from "@tanstack/react-query";
import { propertiesApi } from "@/api/properties";
import { rentalRequestsApi } from "@/api/rentalRequests";
import { unitsApi } from "@/api/units";
import { useAuth } from "./useAuth";

/** Cached under ['properties', id] so every list can resolve names lazily (spec §21). */
export const useProperty = (id?: string, enabled = true) =>
  useQuery({
    queryKey: ["properties", id],
    queryFn: () => propertiesApi.get(id!),
    enabled: !!id && enabled,
    staleTime: 60_000,
  });
export const useUnit = (id?: string, enabled = true) =>
  useQuery({
    queryKey: ["units", id],
    queryFn: () => unitsApi.get(id!),
    enabled: !!id && enabled,
  });

/** Tenant only: unitId -> id of the tenant's own PENDING request (one lookup for a whole list). */
export function usePendingRequestMap() {
  const { role } = useAuth();
  const q = useQuery({
    queryKey: ["rental-requests", "pending-map"],
    queryFn: () => rentalRequestsApi.list({ status: "PENDING", limit: 100 }),
    enabled: role === "TENANT",
    staleTime: 30_000,
  });
  const map = new Map<string, string>();
  q.data?.data.forEach((r) => map.set(r.unitId, r.id));
  return map;
}

/** Cache invalidation per spec §21: related lists must not go stale after a write. */
export function useInvalidate() {
  const qc = useQueryClient();
  return {
    units: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["units"] }),
        qc.invalidateQueries({ queryKey: ["properties"] }),
        qc.invalidateQueries({ queryKey: ["analytics"] }),
      ]),
    leases: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["leases"] }),
        qc.invalidateQueries({ queryKey: ["units"] }),
        qc.invalidateQueries({ queryKey: ["properties"] }),
        qc.invalidateQueries({ queryKey: ["rental-requests"] }),
        qc.invalidateQueries({ queryKey: ["lease-renewals"] }),
        qc.invalidateQueries({ queryKey: ["analytics"] }),
        qc.invalidateQueries({ queryKey: ["notifications"] }),
      ]),
    requests: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["rental-requests"] }),
        qc.invalidateQueries({ queryKey: ["leases"] }),
        qc.invalidateQueries({ queryKey: ["notifications"] }),
      ]),
    renewals: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["lease-renewals"] }),
        qc.invalidateQueries({ queryKey: ["leases"] }),
        qc.invalidateQueries({ queryKey: ["notifications"] }),
      ]),
    maintenance: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["maintenance"] }),
        qc.invalidateQueries({ queryKey: ["analytics"] }),
        qc.invalidateQueries({ queryKey: ["notifications"] }),
      ]),
    me: () => qc.invalidateQueries({ queryKey: ["users", "me"] }),
  };
}
