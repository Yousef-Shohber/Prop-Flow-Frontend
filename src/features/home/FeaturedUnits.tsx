import { useQuery } from "@tanstack/react-query";
import { ArrowRight, DoorOpen } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { unitsApi } from "@/api/units";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Card } from "@/components/ui/Misc";
import { usePendingRequestMap } from "@/hooks/queries";
import { useI18n } from "@/i18n";
import { UnitCard } from "@/features/units/UnitBits";
import { paths } from "@/routes/paths";
import type { UserRole } from "@/types/enums";

/** Search keys owned by DiscoverSection: while any of them is set, the featured strip steps aside. */
const SEARCH_KEYS = [
  "search",
  "city",
  "propertyType",
  "bedrooms",
  "minPrice",
  "maxPrice",
  "status",
  "view",
  "page",
];

/**
 * "Available now" strip: the newest units straight from GET /units (tenants only ever receive AVAILABLE ones;
 * owners and admins see the latest units of their scope). Hidden during an active search or on the units tab.
 */
export function FeaturedUnits({ role }: { role: UserRole }) {
  const { t } = useI18n();
  const [sp] = useSearchParams();
  const searching = SEARCH_KEYS.some((k) => sp.has(k));
  const tenant = role === "TENANT";
  const params = {
    page: 1,
    limit: 4,
    sortBy: "createdAt",
    sortOrder: "DESC" as const,
    ...(tenant ? { status: "AVAILABLE" as const } : {}),
  };
  const q = useQuery({
    queryKey: ["units", "featured", params],
    queryFn: () => unitsApi.list(params),
    enabled: !searching,
  });
  const pending = usePendingRequestMap();
  if (searching) return null;
  const units = Array.isArray(q.data?.data) ? q.data.data : [];
  return (
    <section data-rise aria-labelledby="featured-units" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="featured-units"
            className="font-display text-xl font-semibold"
          >
            {tenant ? t("home.availableNow") : t("home.latestUnits")}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {tenant ? t("home.availableNowText") : t("home.latestUnitsText")}
          </p>
        </div>
        <Link
          to={paths.units}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent-ink hover:underline dark:text-accent"
        >
          {t("home.seeAllUnits")}
          <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden />
        </Link>
      </div>
      {q.isLoading ? (
        <div
          role="status"
          aria-label={t("common.loading")}
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton aspect-[4/3] rounded-card" />
          ))}
        </div>
      ) : q.error ? (
        <Card>
          <ErrorState compact error={q.error} onRetry={() => q.refetch()} />
        </Card>
      ) : units.length === 0 ? (
        <Card>
          <EmptyState
            compact
            icon={DoorOpen}
            title={t("home.noUnits")}
            description={t("home.noUnitsText")}
          />
        </Card>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {units.map((u) => (
            <li key={u.id}>
              <UnitCard unit={u} pending={pending} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
