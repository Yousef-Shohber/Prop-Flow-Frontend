import { getList, qs } from "./client";
import type { AuditLog } from "@/types/models";
import type { ListParams } from "@/types/api";

export const auditLogsApi = {
  list: (
    p: { action?: string; entity?: string; userId?: string } & ListParams,
  ) => getList<AuditLog>("/audit-logs", qs(p)),
};
