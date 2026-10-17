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
import type { DirectoryUser, User } from "@/types/models";
import type { UserRole } from "@/types/enums";
import type { ListParams } from "@/types/api";

export const usersApi = {
  me: () => get<User>("/users/me"),
  updateMe: (b: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
  }) => patch<User>("/users/me", b),
  selectRole: (role: "TENANT" | "OWNER") =>
    patch<User>("/users/me/role", { role }),
  uploadAvatar: (file: File, onProgress?: (pct: number) => void) =>
    post<User>(
      "/users/me/avatar",
      toFormData({}, { avatar: [file] }),
      progress(onProgress),
    ),
  deleteAvatar: () => del<User>("/users/me/avatar"),
  directory: (
    p: { role: "TENANT" | "MAINTENANCE_STAFF"; search?: string } & ListParams,
  ) => getList<DirectoryUser>("/users/directory", qs(p)),
  list: (p: { role?: UserRole; isActive?: boolean } & ListParams) =>
    getList<User>("/users", qs(p)),
  setStatus: (id: string, isActive: boolean) =>
    patch<User>(`/users/${id}/status`, { isActive }),
  setRole: (id: string, role: UserRole) =>
    patch<User>(`/users/${id}/role`, { role }),
  setOwnerVerification: (id: string, ownerVerified: boolean) =>
    patch<User>(`/users/${id}/owner-verification`, { ownerVerified }),
};
