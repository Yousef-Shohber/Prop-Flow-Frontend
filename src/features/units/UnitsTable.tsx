import { useNavigate } from "react-router-dom";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Money } from "@/components/ui/Misc";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useI18n } from "@/i18n";
import { formatMoney, formatNumber } from "@/lib/format";
import { useFromState } from "@/lib/backTo";
import { paths } from "@/routes/paths";
import type { Paginated } from "@/types/api";
import type { Unit } from "@/types/models";
import { PropertyLink, UnitSpecs, UnitThumb } from "./UnitBits";
import type { ReactNode } from "react";

export function UnitsTable({
  result,
  isLoading,
  error,
  onRetry,
  page,
  limit,
  onPageChange,
  onLimitChange,
  sort,
  onSortChange,
  emptyState,
  showProperty = true,
}: {
  result?: Paginated<Unit>;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  page: number;
  limit: number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  sort?: { sortBy?: string; sortOrder: "ASC" | "DESC" };
  onSortChange?: (s: { sortBy: string; sortOrder: "ASC" | "DESC" }) => void;
  emptyState: ReactNode;
  showProperty?: boolean;
}) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const fromState = useFromState();
  const columns: Column<Unit>[] = [
    {
      key: "photo",
      header: "",
      className: "w-16",
      cell: (u) => <UnitThumb unit={u} />,
    },
    {
      key: "unit",
      header: t("units.number"),
      sortKey: "unitNumber",
      cell: (u) => <span className="font-medium">{u.unitNumber}</span>,
    },
    ...(showProperty
      ? [
          {
            key: "property",
            header: t("units.property"),
            cell: (u: Unit) => <PropertyLink propertyId={u.propertyId} />,
          },
        ]
      : []),
    {
      key: "status",
      header: t("units.status"),
      cell: (u) => <StatusBadge kind="unit" value={u.status} />,
    },
    {
      key: "beds",
      header: t("units.bedrooms"),
      sortKey: "bedrooms",
      cell: (u) => (
        <span className="num">{formatNumber(u.bedrooms, lang)}</span>
      ),
    },
    {
      key: "area",
      header: t("units.area"),
      sortKey: "area",
      cell: (u) => <span className="num">{formatNumber(u.area, lang)}</span>,
    },
    {
      key: "rent",
      header: t("units.rent"),
      sortKey: "rentAmount",
      cell: (u) => <Money>{formatMoney(u.rentAmount, lang)}</Money>,
    },
  ];
  return (
    <DataTable
      columns={columns}
      data={result?.data}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      rowKey={(u) => u.id}
      page={page}
      limit={limit}
      total={result?.meta.total ?? 0}
      totalPages={result?.meta.totalPages ?? 1}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      sort={sort}
      onSortChange={onSortChange}
      onRowClick={(u) => navigate(paths.unit(u.id), { state: fromState })}
      emptyState={emptyState}
      mobileCard={(u) => (
        <div className="flex items-center gap-3">
          <UnitThumb unit={u} className="size-14 rounded-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">
                {t("units.unit", { n: u.unitNumber })}
              </p>
              <StatusBadge kind="unit" value={u.status} />
            </div>
            <UnitSpecs unit={u} className="mt-1" />
            <p className="num mt-0.5 text-sm font-semibold">
              {formatMoney(u.rentAmount, lang)}
            </p>
          </div>
        </div>
      )}
    />
  );
}
