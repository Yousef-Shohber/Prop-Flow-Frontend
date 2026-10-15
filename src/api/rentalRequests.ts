import { get, getList, post, qs } from "./client";
import type { RentalRequest } from "@/types/models";
import type { RentalRequestStatus } from "@/types/enums";
import type { ListParams } from "@/types/api";

export const rentalRequestsApi = {
  list: (p: { status?: RentalRequestStatus; unitId?: string } & ListParams) =>
    getList<RentalRequest>("/rental-requests", qs(p)),
  get: (id: string) => get<RentalRequest>(`/rental-requests/${id}`),
  create: (b: {
    unitId: string;
    startDate: string;
    endDate: string;
    message?: string;
  }) => post<RentalRequest>("/rental-requests", b),
  approve: (id: string) =>
    post<RentalRequest>(`/rental-requests/${id}/approve`),
  reject: (id: string) => post<RentalRequest>(`/rental-requests/${id}/reject`),
  cancel: (id: string) => post<RentalRequest>(`/rental-requests/${id}/cancel`),
};
