import type { Paginated } from "@/types/api";

export const EXPORT_PAGE_SIZE = 100;
export const EXPORT_CAP = 5000;

/** Pages through a list endpoint (100 per request) up to a hard cap. */
export async function fetchAll<T>(
  load: (page: number, limit: number) => Promise<Paginated<T>>,
  cap = EXPORT_CAP,
): Promise<{ rows: T[]; total: number; truncated: boolean }> {
  const rows: T[] = [];
  let total = 0;
  for (let page = 1; rows.length < cap; page++) {
    const r = await load(page, EXPORT_PAGE_SIZE);
    total = r.meta.total;
    rows.push(...r.data);
    if (page >= r.meta.totalPages || r.data.length === 0) break;
  }
  const truncated = total > cap || rows.length > cap;
  return { rows: rows.slice(0, cap), total, truncated };
}
