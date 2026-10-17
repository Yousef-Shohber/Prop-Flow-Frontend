import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { Card } from "./Misc";
import { Pagination } from "./Pagination";
import { ErrorState, LoadingSkeleton } from "./States";

export interface Column<T> {
  key: string;
  header: ReactNode;
  sortKey?: string;
  cell: (row: T) => ReactNode;
  className?: string;
}
export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | undefined;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onLimitChange?: (l: number) => void;
  sort?: { sortBy?: string; sortOrder: "ASC" | "DESC" };
  onSortChange?: (s: { sortBy: string; sortOrder: "ASC" | "DESC" }) => void;
  onRowClick?: (row: T) => void;
  emptyState: ReactNode;
  mobileCard?: (row: T) => ReactNode;
  rowKey: (row: T) => string;
}

/** Real table semantics on desktop, stacked cards on mobile; sort, page and limit are driven by the URL. */
export function DataTable<T>(p: DataTableProps<T>) {
  const t = useT();
  const { columns, data, isLoading, error } = p;
  const rows = data ?? [];
  const showEmpty = !isLoading && !error && rows.length === 0;

  const sortOn = (sortKey: string) => {
    if (!p.onSortChange) return;
    const same = p.sort?.sortBy === sortKey;
    p.onSortChange({
      sortBy: sortKey,
      sortOrder: same && p.sort?.sortOrder === "DESC" ? "ASC" : "DESC",
    });
  };
  const onKey = (e: KeyboardEvent, row: T) => {
    // ignore keys pressed on buttons/links nested inside the row
    if (e.target !== e.currentTarget) return;
    if (p.onRowClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      p.onRowClick(row);
    }
  };

  return (
    <Card className="overflow-hidden">
      {isLoading && <LoadingSkeleton variant="table" />}
      {!isLoading && !!error && (
        <ErrorState error={error} onRetry={p.onRetry} />
      )}
      {showEmpty && p.emptyState}
      {!isLoading && !error && rows.length > 0 && (
        <>
          {/* desktop / tablet */}
          <div
            className={cn("overflow-x-auto", p.mobileCard && "hidden md:block")}
          >
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-surface-2/95 backdrop-blur">
                <tr>
                  {columns.map((c) => {
                    const active = !!c.sortKey && p.sort?.sortBy === c.sortKey;
                    return (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={
                          active
                            ? p.sort?.sortOrder === "ASC"
                              ? "ascending"
                              : "descending"
                            : undefined
                        }
                        className={cn(
                          "whitespace-nowrap px-4 py-3 text-start text-xs font-semibold text-muted",
                          c.className,
                        )}
                      >
                        {c.sortKey && p.onSortChange ? (
                          <button
                            type="button"
                            onClick={() => sortOn(c.sortKey!)}
                            aria-label={`${t("a11y.sort")}: ${typeof c.header === "string" ? c.header : c.key}`}
                            className="tap-area -mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-surface-3 hover:text-ink"
                          >
                            {c.header}
                            {active ? (
                              p.sort?.sortOrder === "ASC" ? (
                                <ArrowUp className="size-3.5" aria-hidden />
                              ) : (
                                <ArrowDown className="size-3.5" aria-hidden />
                              )
                            ) : (
                              <ChevronsUpDown
                                className="size-3.5 opacity-40"
                                aria-hidden
                              />
                            )}
                          </button>
                        ) : (
                          c.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr
                    key={p.rowKey(row)}
                    onClick={
                      p.onRowClick ? () => p.onRowClick!(row) : undefined
                    }
                    onKeyDown={(e) => onKey(e, row)}
                    tabIndex={p.onRowClick ? 0 : undefined}
                    className={cn(
                      "transition-colors",
                      p.onRowClick &&
                        "cursor-pointer hover:bg-surface-2/70 focus-visible:bg-surface-2",
                    )}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn("px-4 py-3 align-middle", c.className)}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* mobile */}
          {p.mobileCard && (
            <ul className="divide-y divide-line md:hidden">
              {rows.map((row) => (
                <li
                  key={p.rowKey(row)}
                  data-testid="mobile-card"
                  onClick={p.onRowClick ? () => p.onRowClick!(row) : undefined}
                  onKeyDown={(e) => onKey(e, row)}
                  tabIndex={p.onRowClick ? 0 : undefined}
                  className={cn(
                    "p-4",
                    p.onRowClick &&
                      "cursor-pointer active:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2",
                  )}
                >
                  {p.mobileCard!(row)}
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={p.page}
            limit={p.limit}
            total={p.total}
            totalPages={p.totalPages}
            onPageChange={p.onPageChange}
            onLimitChange={p.onLimitChange}
          />
        </>
      )}
    </Card>
  );
}
