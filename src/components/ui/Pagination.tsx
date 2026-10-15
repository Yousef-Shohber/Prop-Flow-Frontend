import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n";
import { formatNumber } from "@/lib/format";
import { Button } from "./Button";

export const PAGE_SIZES = [10, 20, 50, 100] as const;

export function Pagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onLimitChange?: (l: number) => void;
}) {
  const { t, lang } = useI18n();
  const pages = Math.max(1, totalPages);
  return (
    <nav
      aria-label={t("a11y.pagination")}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-muted"
    >
      <span className="num">
        {t("common.results", { n: formatNumber(total, lang) })}
      </span>
      <div className="flex items-center gap-3">
        {onLimitChange && (
          <label className="hidden items-center gap-2 sm:flex">
            <span className="text-xs">{t("common.perPage")}</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-9 rounded-lg border border-line-strong bg-surface px-2 text-sm text-ink"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="icon"
            className="size-9"
            aria-label={t("common.previous")}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </Button>
          <span className="num min-w-24 text-center text-xs text-ink">
            {t("common.page", {
              page: formatNumber(page, lang),
              total: formatNumber(pages, lang),
            })}
          </span>
          <Button
            variant="secondary"
            size="icon"
            className="size-9"
            aria-label={t("common.next")}
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
