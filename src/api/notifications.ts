import { getList, patch, qs } from "./client";
import type { AppNotification } from "@/types/models";
import type { ListParams } from "@/types/api";

export const notificationsApi = {
  list: (p: { unread?: boolean } & ListParams) =>
    getList<AppNotification>("/notifications", qs(p)),
  markRead: (id: string) => patch<AppNotification>(`/notifications/${id}/read`),
  markAllRead: () => patch("/notifications/read-all"),
};
