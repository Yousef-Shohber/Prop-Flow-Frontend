import { get } from "./client";
import type { DashboardStats } from "@/types/models";
export const analyticsApi = {
  dashboard: () => get<DashboardStats>("/analytics/dashboard"),
};
