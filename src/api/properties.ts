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
import type { Property } from "@/types/models";
import type { PropertyType } from "@/types/enums";
import type { ListParams } from "@/types/api";

export interface UnitInput {
  unitNumber?: string;
  floor?: number | null;
  area: number;
  rentAmount: number;
  bedrooms: number;
  bathrooms: number;
  description?: string;
}
export interface PropertyInput {
  name: string;
  description?: string;
  propertyType: PropertyType;
  address: string;
  city: string;
  country?: string;
  ownerId?: string;
  unit?: UnitInput;
}
export type PropertyListParams = {
  search?: string;
  city?: string;
  propertyType?: PropertyType;
} & ListParams;

export const propertiesApi = {
  list: (p: PropertyListParams) => getList<Property>("/properties", qs(p)),
  get: (id: string) => get<Property>(`/properties/${id}`),
  create: (b: PropertyInput) => post<Property>("/properties", b),
  update: (id: string, b: Partial<Omit<PropertyInput, "ownerId" | "unit">>) =>
    patch<Property>(`/properties/${id}`, b),
  remove: (id: string) => del(`/properties/${id}`),
  uploadImages: (
    id: string,
    files: File[],
    onProgress?: (pct: number) => void,
  ) =>
    post<Property>(
      `/properties/${id}/images`,
      toFormData({}, { images: files }),
      progress(onProgress),
    ),
  deleteImage: (id: string, publicId: string) =>
    del<Property>(`/properties/${id}/images`, { publicId }),
};
