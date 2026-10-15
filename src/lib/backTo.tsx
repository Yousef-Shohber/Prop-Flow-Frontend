import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useI18n } from "@/i18n";

/** Router state attached to links that lead to a detail page, so the detail page can return to the exact list URL. */
export function useFromState() {
  const loc = useLocation();
  return { from: loc.pathname + loc.search };
}

/** Only same-app, path-style values are accepted (state can come from history entries we did not write). */
const safe = (v: unknown): string | null =>
  typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : null;

/**
 * "Back to results" link for detail pages. Uses the list URL (filters, sort, page) the user came from,
 * and falls back to the plain list when the page was opened directly.
 */
export function BackLink({
  fallback,
  fallbackLabel,
}: {
  fallback: string;
  fallbackLabel: string;
}) {
  const { t } = useI18n();
  const loc = useLocation();
  const from = safe((loc.state as { from?: unknown } | null)?.from);
  const to = from ?? fallback;
  const path = to.split("?")[0];
  const label = !from
    ? fallbackLabel
    : path === "/home"
      ? t("discover.backToResults")
      : path === "/units"
        ? t("discover.backToUnits")
        : path === "/properties"
          ? t("discover.backToProperties")
          : t("common.back");
  return (
    <Link
      to={to}
      className="mb-3 inline-flex items-center gap-1.5 rounded-lg py-1 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
      {label}
    </Link>
  );
}
