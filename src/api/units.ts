import {
  progress,
  del,
  get,
  getList,
  patch,
  post,
  qs,
  toFormData,
} from "./client";
import type { Unit } from "@/types/models";
import type { UnitStatus } from "@/types/enums";
import type { ListParams } from "@/types/api";

export interface UnitPayload {
  unitNumber: string;
  floor?: number | null;
  area: number;
  rentAmount: number;
  bedrooms: number;
  bathrooms: number;
  description?: string;
}
export type UnitListParams = {
  status?: UnitStatus;
  bedrooms?: number | string;
  minArea?: number | string;
  maxArea?: number | string;
  minPrice?: number | string;
  maxPrice?: number | string;
  propertyId?: string;
} & ListParams;

export const unitsApi = {
  list: (p: UnitListParams) => getList<Unit>("/units", qs(p)),
  get: (id: string) => get<Unit>(`/units/${id}`),
  create: (propertyId: string, b: UnitPayload) =>
    post<Unit>(`/properties/${propertyId}/units`, b),
  update: (id: string, b: Partial<UnitPayload>) =>
    patch<Unit>(`/units/${id}`, b),
  remove: (id: string) => del(`/units/${id}`),
  setStatus: (
    id: string,
    status: Extract<UnitStatus, "AVAILABLE" | "MAINTENANCE">,
  ) => patch<Unit>(`/units/${id}/status`, { status }),
  uploadImages: (
    id: string,
    files: File[],
    onProgress?: (pct: number) => void,
  ) =>
    post<Unit>(
      `/units/${id}/images`,
      toFormData({}, { images: files }),
      progress(onProgress),
    ),
  deleteImage: (id: string, publicId: string) =>
    del<Unit>(`/units/${id}/images`, { publicId }),
};
