import { get, getList, patch, post, qs } from "./client";
import type { Lease } from "@/types/models";
import type { LeaseStatus } from "@/types/enums";
import type { ListParams } from "@/types/api";

export const leasesApi = {
  list: (
    p: {
      status?: LeaseStatus;
      unitId?: string;
      tenantId?: string;
    } & ListParams,
  ) => getList<Lease>("/leases", qs(p)),
  get: (id: string) => get<Lease>(`/leases/${id}`),
  create: (b: {
    tenantId: string;
    unitId: string;
    startDate: string;
    endDate: string;
    notes?: string;
  }) => post<Lease>("/leases", b),
  update: (
    id: string,
    b: { startDate?: string; endDate?: string; notes?: string },
  ) => patch<Lease>(`/leases/${id}`, b),
  activate: (id: string) => post<Lease>(`/leases/${id}/activate`),
  terminate: (id: string) => post<Lease>(`/leases/${id}/terminate`),
  renew: (id: string, endDate: string) =>
    post<Lease>(`/leases/${id}/renew`, { endDate }),
};
