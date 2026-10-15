import { useQueries, useQuery } from "@tanstack/react-query";
import { propertiesApi } from "@/api/properties";
import { unitsApi } from "@/api/units";
import { PropertyType } from "@/types/enums";

/**
 * Real catalogue numbers for the Home page, read from the `meta.total` of one-row list calls
 * (GET /properties and GET /units?status=AVAILABLE). Visibility rules are the server's: a tenant sees what
 * tenants may see, an owner sees their own portfolio.
 */
export function useCatalogTotals(enabled = true) {
  const properties = useQuery({
    queryKey: ["properties", "totals"],
    queryFn: () => propertiesApi.list({ page: 1, limit: 1 }),
    enabled,
    staleTime: 60_000,
  });
  const units = useQuery({
    queryKey: ["units", "totals", "available"],
    queryFn: () => unitsApi.list({ page: 1, limit: 1, status: "AVAILABLE" }),
    enabled,
    staleTime: 60_000,
  });
  return {
    properties: properties.data?.meta.total,
    availableUnits: units.data?.meta.total,
    isLoading: properties.isLoading || units.isLoading,
    isError: properties.isError || units.isError,
  };
}

/** Number of properties per type, for the badges on the "Browse by type" tiles (one request per type). */
export function useTypeCounts(enabled = true) {
  const results = useQueries({
    queries: PropertyType.map((propertyType) => ({
      queryKey: ["properties", "type-count", propertyType],
      staleTime: 60_000,
      enabled,
      queryFn: () => propertiesApi.list({ page: 1, limit: 1, propertyType }),
    })),
  });
  const counts: Partial<Record<PropertyType, number>> = {};
  results.forEach((r, i) => {
    if (r.data) counts[PropertyType[i]] = r.data.meta.total;
  });
  return { counts, isLoading: results.some((r) => r.isLoading) };
}
