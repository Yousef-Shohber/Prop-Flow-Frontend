import { useQuery, useQueryClient } from "@tanstack/react-query";
import { propertiesApi } from "@/api/properties";
import { rentalRequestsApi } from "@/api/rentalRequests";
import { unitsApi } from "@/api/units";
import { usersApi } from "@/api/users";
import type { DirectoryUser, User } from "@/types/models";
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

/** Admin only: every user (paged through GET /users), so ids can be shown as names and searched by name. */
export const useAllUsers = (enabled = true) =>
  useQuery({
    queryKey: ["users", "all"],
    queryFn: async () => {
      const all: User[] = [];
      for (let page = 1; page <= 20; page++) {
        const r = await usersApi.list({ page, limit: 100 });
        all.push(...r.data);
        if (page >= r.meta.totalPages) break;
      }
      return all;
    },
    enabled,
    staleTime: 5 * 60_000,
  });

/** Owner / admin: every tenant (paged through GET /users/directory), so a tenantId can be shown as a name. */
export const useAllTenants = (enabled = true) =>
  useQuery({
    queryKey: ["users", "directory", "all-tenants"],
    queryFn: async () => {
      const all: DirectoryUser[] = [];
      for (let page = 1; page <= 20; page++) {
        const r = await usersApi.directory({
          role: "TENANT",
          page,
          limit: 100,
        });
        all.push(...r.data);
        if (page >= r.meta.totalPages) break;
      }
      return all;
    },
    enabled,
    staleTime: 5 * 60_000,
  });

/** Owner / admin: every technician (paged through GET /users/directory), so an assignedStaffId can be shown as a name. */
export const useAllStaff = (enabled = true) =>
  useQuery({
    queryKey: ["users", "directory", "all-staff"],
    queryFn: async () => {
      const all: DirectoryUser[] = [];
      for (let page = 1; page <= 20; page++) {
        const r = await usersApi.directory({
          role: "MAINTENANCE_STAFF",
          page,
          limit: 100,
        });
        all.push(...r.data);
        if (page >= r.meta.totalPages) break;
      }
      return all;
    },
    enabled,
    staleTime: 5 * 60_000,
  });
