import { progress, del, get, getList, post, qs, toFormData } from "./client";
import type {
  MaintenanceHistoryItem,
  MaintenanceRequest,
} from "@/types/models";
import type {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
} from "@/types/enums";
import type { ListParams } from "@/types/api";

export const maintenanceApi = {
  list: (
    p: {
      status?: MaintenanceStatus;
      priority?: MaintenancePriority;
      category?: MaintenanceCategory;
    } & ListParams,
  ) => getList<MaintenanceRequest>("/maintenance", qs(p)),
  get: (id: string) => get<MaintenanceRequest>(`/maintenance/${id}`),
  history: (id: string) =>
    get<MaintenanceHistoryItem[]>(`/maintenance/${id}/history`),
  create: (
    b: {
      unitId: string;
      title: string;
      description: string;
      category: MaintenanceCategory;
      priority: MaintenancePriority;
    },
    images: File[],
  ) => post<MaintenanceRequest>("/maintenance", toFormData(b, { images })),
  uploadImages: (
    id: string,
    files: File[],
    onProgress?: (pct: number) => void,
  ) =>
    post<MaintenanceRequest>(
      `/maintenance/${id}/images`,
      toFormData({}, { images: files }),
      progress(onProgress),
    ),
  deleteImage: (id: string, publicId: string) =>
    del<MaintenanceRequest>(`/maintenance/${id}/images`, { publicId }),
  assign: (
    id: string,
    b: { assignedStaffId: string; scheduledDate?: string; notes?: string },
  ) => post<MaintenanceRequest>(`/maintenance/${id}/assign`, b),
  start: (id: string, notes?: string) =>
    post<MaintenanceRequest>(
      `/maintenance/${id}/start`,
      notes ? { notes } : {},
    ),
  complete: (
    id: string,
    b: { resolutionDescription: string; notes?: string },
    completionImages: File[],
  ) =>
    post<MaintenanceRequest>(
      `/maintenance/${id}/complete`,
      toFormData(b, { completionImages }),
    ),
  close: (id: string, notes?: string) =>
    post<MaintenanceRequest>(
      `/maintenance/${id}/close`,
      notes ? { notes } : {},
    ),
  cancel: (id: string, notes?: string) =>
    post<MaintenanceRequest>(
      `/maintenance/${id}/cancel`,
      notes ? { notes } : {},
    ),
  deleteCompletionImage: (id: string, publicId: string) =>
    del<MaintenanceRequest>(`/maintenance/${id}/completion-images`, {
      publicId,
    }),
};
