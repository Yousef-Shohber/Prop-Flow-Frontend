import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { propertiesApi } from "@/api/properties";
import { unitsApi } from "@/api/units";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ImageUploader } from "@/components/ui/ImageUploader";
import {
  Card,
  CardSection,
  DescriptionList,
  Money,
  Tag,
} from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from "@/components/ui/States";
import { TabContent, TabList, TabTrigger, Tabs } from "@/components/ui/Tabs";
import {
  useProperty,
  usePendingRequestMap,
  useInvalidate,
} from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import { useEnumLabel, useI18n } from "@/i18n";
import { formatMoney, formatDate, formatNumber } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";
import { BackLink } from "@/lib/backTo";
import { paths } from "@/routes/paths";
import { RentCta, UnitSpecs, UnitThumb } from "../units/UnitBits";
import { UnitsTable } from "../units/UnitsTable";
import { Gallery } from "./Gallery";
import { TYPE_PHOTO } from "@/lib/photos";
import type { Property } from "@/types/models";

export default function PropertyDetailPage() {
  const { id = "" } = useParams();
  const { t, lang } = useI18n();
  const label = useEnumLabel();
  const apiError = useApiError();
  const { role } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const inv = useInvalidate();
  const manager = role === "OWNER" || role === "ADMIN";
  const q = useProperty(id);
  const pending = usePendingRequestMap();
  const [confirm, setConfirm] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<{
    sortBy?: string;
    sortOrder: "ASC" | "DESC";
  }>({ sortBy: "unitNumber", sortOrder: "ASC" });

  const units = useQuery({
    queryKey: ["units", "list", { propertyId: id, page, limit, ...sort }],
    queryFn: () => unitsApi.list({ propertyId: id, page, limit, ...sort }),
    enabled: manager && !!id,
    placeholderData: (p) => p,
  });

  const put = (p: Property) => {
    qc.setQueryData(["properties", id], p);
    void qc.invalidateQueries({ queryKey: ["properties", "list"] });
  };
  const del = useMutation({
    mutationFn: () => propertiesApi.remove(id),
    onSuccess: async () => {
      toast.success(t("properties.deletedToast"));
      qc.removeQueries({ queryKey: ["properties", id] });
      await inv.units();
      navigate(paths.properties, { replace: true });
    },
    onError: (e) => {
      setConfirm(false);
      toast.error(apiError(e));
    },
  });

  if (q.isLoading) return <LoadingSkeleton />;
  if (q.error || !q.data)
    return (
      <Card>
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </Card>
    );
  const p = q.data;

  const info = (
    <DescriptionList
      items={[
        {
          label: t("properties.type"),
          value: <Tag>{label("ptype", p.propertyType)}</Tag>,
        },
        { label: t("properties.city"), value: p.city },
        { label: t("properties.address"), value: p.address, wide: true },
        { label: t("properties.country"), value: p.country },
        {
          label: t("common.created"),
          value: <span className="num">{formatDate(p.createdAt, lang)}</span>,
        },
        {
          label: t("properties.description"),
          value: p.description || "—",
          wide: true,
        },
      ]}
    />
  );

  return (
    <>
      <BackLink
        fallback={paths.properties}
        fallbackLabel={t("discover.backToProperties")}
      />
      <PageHeader
        title={p.name}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {p.city}
            {lang === "ar" ? "، " : ", "}
            {p.country}
          </span>
        }
        actions={
          manager && (
            <>
              <Button
                variant="secondary"
                to={paths.propertyEdit(id)}
                icon={<Pencil className="size-4" />}
              >
                {t("common.edit")}
              </Button>
              <Button
                variant="secondary"
                className="text-[var(--red-fg)]"
                icon={<Trash2 className="size-4" />}
                onClick={() => setConfirm(true)}
              >
                {t("common.delete")}
              </Button>
            </>
          )
        }
      />

      {!manager && (p.units ?? []).length > 0 && (
        <p className="-mt-3 mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Tag>
            {t("discover.availableCount", {
              n: formatNumber(p.units!.length, lang),
            })}
          </Tag>
          <Tag>
            {t("discover.fromRent", {
              price: formatMoney(
                Math.min(...p.units!.map((u) => u.rentAmount)),
                lang,
              ),
            })}
          </Tag>
        </p>
      )}
      {!manager ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <Gallery
              images={p.images}
              alt={p.name}
              variant={TYPE_PHOTO[p.propertyType].variant}
            />
            <CardSection>{info}</CardSection>
          </div>
          <section aria-labelledby="avail">
            <h2 id="avail" className="mb-4 text-lg font-semibold">
              {t("properties.availableUnits")}
            </h2>
            {(p.units ?? []).length === 0 ? (
              <Card>
                <EmptyState compact title={t("properties.noUnits")} />
              </Card>
            ) : (
              <ul className="space-y-3">
                {p.units!.map((u) => (
                  <li key={u.id}>
                    <Card className="flex items-center gap-4 p-3.5">
                      <UnitThumb unit={u} className="size-16 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <a
                            className="tap-area font-semibold hover:underline"
                            href={paths.unit(u.id)}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(paths.unit(u.id));
                            }}
                          >
                            {t("units.unit", { n: u.unitNumber })}
                          </a>
                          <Money>
                            <span className="font-display font-bold">
                              {formatMoney(u.rentAmount, lang)}
                            </span>
                          </Money>
                        </div>
                        <UnitSpecs unit={u} className="mt-0.5" />
                        <div className="mt-2.5">
                          <RentCta unit={u} pending={pending} />
                        </div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <Tabs defaultValue="details">
          <TabList>
            <TabTrigger value="details">
              {t("properties.tabDetails")}
            </TabTrigger>
            <TabTrigger value="units">
              {t("properties.tabUnits")}
              {units.data
                ? ` (${formatNumber(units.data.meta.total, lang)})`
                : ""}
            </TabTrigger>
          </TabList>
          <TabContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
              <Gallery
                images={p.images}
                alt={p.name}
                variant={TYPE_PHOTO[p.propertyType].variant}
              />
              <CardSection>{info}</CardSection>
            </div>
            <CardSection title={t("properties.images")}>
              <ImageUploader
                mode="immediate"
                value={p.images}
                maxFiles={10}
                label={undefined}
                hint={t("properties.imagesHint")}
                onUpload={async (files, onProgress) => {
                  put(await propertiesApi.uploadImages(id, files, onProgress));
                  toast.success(t("properties.updatedToast"));
                }}
                onRemove={async (publicId) => {
                  put(await propertiesApi.deleteImage(id, publicId));
                }}
              />
            </CardSection>
          </TabContent>
          <TabContent value="units" className="space-y-4">
            <div className="flex justify-end">
              <Button to={paths.unitNew(id)} icon={<Plus className="size-4" />}>
                {t("properties.addUnit")}
              </Button>
            </div>
            <UnitsTable
              result={units.data}
              isLoading={units.isLoading}
              error={units.error}
              onRetry={() => units.refetch()}
              page={page}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
              sort={sort}
              onSortChange={(s) => {
                setSort(s);
                setPage(1);
              }}
              showProperty={false}
              emptyState={
                <EmptyState
                  title={t("properties.noUnitsOwner")}
                  description={t("properties.noUnitsOwnerText")}
                  action={
                    <Button
                      to={paths.unitNew(id)}
                      icon={<Plus className="size-4" />}
                    >
                      {t("properties.addUnit")}
                    </Button>
                  }
                />
              }
            />
          </TabContent>
        </Tabs>
      )}

      <ConfirmDialog
        open={confirm}
        destructive
        loading={del.isPending}
        title={t("properties.deleteTitle")}
        description={t("properties.deleteText", { name: p.name })}
        confirmLabel={t("common.delete")}
        onConfirm={() => del.mutate()}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
