import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Pencil, Trash2, Wrench } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { unitsApi } from "@/api/units";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ImageUploader } from "@/components/ui/ImageUploader";
import {
  Banner,
  Card,
  CardSection,
  DescriptionList,
  Money,
} from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/lib/backTo";
import { ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Switch } from "@/components/ui/Switch";
import { useInvalidate, usePendingRequestMap, useUnit } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import { useI18n } from "@/i18n";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { useApiError } from "@/lib/useApiError";
import { paths } from "@/routes/paths";
import { Gallery } from "../properties/Gallery";
import { PropertyLink, RentCta } from "./UnitBits";
import type { Unit } from "@/types/models";

export default function UnitDetailPage() {
  const { id = "" } = useParams();
  const { t, lang } = useI18n();
  const apiError = useApiError();
  const { role } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const inv = useInvalidate();
  const manager = role === "OWNER" || role === "ADMIN";
  const q = useUnit(id);
  const pending = usePendingRequestMap();
  const [confirm, setConfirm] = useState(false);

  const put = (u: Unit) => {
    qc.setQueryData(["units", id], u);
    void qc.invalidateQueries({ queryKey: ["units", "list"] });
  };
  const status = useMutation({
    mutationFn: (s: "AVAILABLE" | "MAINTENANCE") => unitsApi.setStatus(id, s),
    onSuccess: async (u) => {
      put(u);
      toast.success(t("units.statusToast"));
      await inv.units();
    },
    onError: (e) => toast.error(apiError(e)),
  });
  const del = useMutation({
    mutationFn: () => unitsApi.remove(id),
    onSuccess: async () => {
      toast.success(t("units.deletedToast"));
      const pid = q.data?.propertyId;
      qc.removeQueries({ queryKey: ["units", id] });
      await inv.units();
      navigate(pid ? paths.property(pid) : paths.units, { replace: true });
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
  const u = q.data;
  const rented = u.status === "RENTED";

  return (
    <>
      <BackLink
        fallback={paths.units}
        fallbackLabel={t("discover.backToUnits")}
      />
      <PageHeader
        title={t("units.unit", { n: u.unitNumber })}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusBadge kind="unit" value={u.status} />
            <PropertyLink propertyId={u.propertyId} />
          </span>
        }
        actions={
          manager ? (
            <>
              <Button
                variant="secondary"
                icon={<FileText className="size-4" />}
                to={`${paths.leases}?unitId=${u.id}`}
              >
                {t("units.leasesFor")}
              </Button>
              {rented ? (
                <Button
                  variant="secondary"
                  disabled
                  icon={<Pencil className="size-4" />}
                >
                  {t("common.edit")}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  to={paths.unitEdit(id)}
                  icon={<Pencil className="size-4" />}
                >
                  {t("common.edit")}
                </Button>
              )}
              <Button
                variant="secondary"
                className="text-[var(--red-fg)]"
                disabled={rented}
                icon={<Trash2 className="size-4" />}
                onClick={() => setConfirm(true)}
              >
                {t("common.delete")}
              </Button>
            </>
          ) : role === "TENANT" ? (
            rented ? (
              <>
                <Button variant="secondary" to={paths.leases}>
                  {t("units.yourLease")}
                </Button>
                <Button
                  to={paths.maintenanceNew}
                  icon={<Wrench className="size-4" />}
                >
                  {t("units.report")}
                </Button>
              </>
            ) : (
              <RentCta unit={u} size="md" pending={pending} />
            )
          ) : null
        }
      />

      {role === "TENANT" && rented && (
        <Banner tone="blue" className="mb-6">
          {t("units.yourUnit")}
        </Banner>
      )}
      {manager && rented && (
        <Banner tone="blue" className="mb-6">
          {t("units.editLocked")}
        </Banner>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Gallery
          images={u.images}
          alt={t("units.unit", { n: u.unitNumber })}
          variant="interior"
        />
        <div className="space-y-6">
          <CardSection>
            <p className="mb-4">
              <span className="text-xs font-medium text-faint">
                {t("units.rentLabel")}
              </span>
              <br />
              <Money>
                <span className="font-display text-3xl font-bold">
                  {formatMoney(u.rentAmount, lang)}
                </span>
              </Money>
            </p>
            <DescriptionList
              items={[
                {
                  label: t("units.bedrooms"),
                  value: (
                    <span className="num">
                      {formatNumber(u.bedrooms, lang)}
                    </span>
                  ),
                },
                {
                  label: t("units.bathrooms"),
                  value: (
                    <span className="num">
                      {formatNumber(u.bathrooms, lang)}
                    </span>
                  ),
                },
                {
                  label: t("units.area"),
                  value: (
                    <span className="num">{formatNumber(u.area, lang)}</span>
                  ),
                },
                {
                  label: t("units.floor"),
                  value:
                    u.floor === null ? (
                      "—"
                    ) : (
                      <span className="num">{formatNumber(u.floor, lang)}</span>
                    ),
                },
                {
                  label: t("properties.description"),
                  value: u.description || "—",
                  wide: true,
                },
                {
                  label: t("common.created"),
                  value: (
                    <span className="num">{formatDate(u.createdAt, lang)}</span>
                  ),
                },
              ]}
            />
          </CardSection>
          {manager && (
            <CardSection title={t("units.status")}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {t("units.markMaintenance")}
                  </p>
                  {rented && (
                    <p className="mt-1 text-xs text-muted">
                      {t("units.rentedLocked")}
                    </p>
                  )}
                </div>
                <Switch
                  label={t("units.markMaintenance")}
                  checked={u.status === "MAINTENANCE"}
                  disabled={rented || status.isPending}
                  onCheckedChange={(on) =>
                    status.mutate(on ? "MAINTENANCE" : "AVAILABLE")
                  }
                />
              </div>
            </CardSection>
          )}
        </div>
      </div>

      {manager && (
        <CardSection className="mt-6" title={t("units.images")}>
          <ImageUploader
            mode="immediate"
            value={u.images}
            maxFiles={10}
            hint={t("properties.imagesHint")}
            onUpload={async (files, onProgress) => {
              put(await unitsApi.uploadImages(id, files, onProgress));
            }}
            onRemove={async (publicId) => {
              put(await unitsApi.deleteImage(id, publicId));
            }}
          />
        </CardSection>
      )}
      <ConfirmDialog
        open={confirm}
        destructive
        loading={del.isPending}
        title={t("units.deleteTitle")}
        description={t("units.deleteText", { n: u.unitNumber })}
        confirmLabel={t("common.delete")}
        onConfirm={() => del.mutate()}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
