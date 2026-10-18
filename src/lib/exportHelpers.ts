import { propertiesApi } from "@/api/properties";
import { usersApi } from "@/api/users";
import { fetchAll } from "./fetchAll";
import { fullName } from "./format";

/** id -> property name for every property the caller may read (used only inside CSV exports). */
export async function loadPropertyNames(): Promise<Map<string, string>> {
  const { rows } = await fetchAll((page, limit) =>
    propertiesApi.list({ page, limit, sortBy: "name", sortOrder: "ASC" }),
  );
  return new Map(rows.map((p) => [p.id, p.name]));
}

/** id -> tenant name (owner / admin only, via the tenant directory). */
export async function loadTenantNames(): Promise<Map<string, string>> {
  const { rows } = await fetchAll((page, limit) =>
    usersApi.directory({ role: "TENANT", page, limit }),
  );
  return new Map(rows.map((u) => [u.id, fullName(u)]));
}
