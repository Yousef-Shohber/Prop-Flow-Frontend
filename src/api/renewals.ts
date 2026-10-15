import { get, getList, post, qs } from "./client";
import type { LeaseRenewalRequest } from "@/types/models";
import type { LeaseRenewalRequestStatus } from "@/types/enums";
import type { ListParams } from "@/types/api";

export const renewalsApi = {
  list: (
    p: { status?: LeaseRenewalRequestStatus; leaseId?: string } & ListParams,
  ) => getList<LeaseRenewalRequest>("/lease-renewal-requests", qs(p)),
  get: (id: string) =>
    get<LeaseRenewalRequest>(`/lease-renewal-requests/${id}`),
  create: (b: { leaseId: string; endDate: string; message?: string }) =>
    post<LeaseRenewalRequest>("/lease-renewal-requests", b),
  approve: (id: string, endDate?: string) =>
    post<LeaseRenewalRequest>(
      `/lease-renewal-requests/${id}/approve`,
      endDate ? { endDate } : undefined,
    ),
  reject: (id: string) =>
    post<LeaseRenewalRequest>(`/lease-renewal-requests/${id}/reject`),
  cancel: (id: string) =>
    post<LeaseRenewalRequest>(`/lease-renewal-requests/${id}/cancel`),
};
