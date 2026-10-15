import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export interface ListState {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder: "ASC" | "DESC";
  filters: Record<string, string>;
}
const RESERVED = ["page", "limit", "sortBy", "sortOrder"];

/**
 * Filters, sort and pagination live in the URL query string so list pages are
 * shareable and survive a reload (spec §4).
 */
export function useListParams(
  defaults: {
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    limit?: number;
    filters?: Record<string, string>;
  } = {},
) {
  const [sp, setSp] = useSearchParams();

  const state = useMemo<ListState>(() => {
    const filters: Record<string, string> = { ...(defaults.filters ?? {}) };
    sp.forEach((v, k) => {
      if (!RESERVED.includes(k)) filters[k] = v;
    });
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(
        1,
        parseInt(sp.get("limit") ?? String(defaults.limit ?? 20), 10) || 20,
      ),
    );
    const so = sp.get("sortOrder");
    return {
      page,
      limit,
      sortBy: sp.get("sortBy") ?? defaults.sortBy,
      sortOrder:
        so === "ASC" || so === "DESC" ? so : (defaults.sortOrder ?? "DESC"),
      filters,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const update = useCallback(
    (
      patch: Partial<Omit<ListState, "filters">> & {
        filters?: Record<string, string | undefined>;
      },
    ) => {
      setSp(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (patch.page !== undefined)
            patch.page > 1
              ? next.set("page", String(patch.page))
              : next.delete("page");
          if (patch.limit !== undefined)
            patch.limit !== (defaults.limit ?? 20)
              ? next.set("limit", String(patch.limit))
              : next.delete("limit");
          if (patch.sortBy !== undefined) next.set("sortBy", patch.sortBy);
          if (patch.sortOrder !== undefined)
            next.set("sortOrder", patch.sortOrder);
          if (patch.filters) {
            for (const [k, v] of Object.entries(patch.filters)) {
              if (v === undefined || v === "") {
                // an explicit empty value must override a non-empty default
                if (defaults.filters && defaults.filters[k]) next.set(k, "");
                else next.delete(k);
              } else next.set(k, v);
            }
            next.delete("page"); // any filter change goes back to page 1
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSp, defaults.limit, defaults.filters],
  );

  const reset = useCallback(
    () => setSp(new URLSearchParams(), { replace: true }),
    [setSp],
  );
  return { state, update, reset };
}
