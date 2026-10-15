import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Play, UserPlus, X, XCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { maintenanceApi } from "@/api/maintenance";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { DateField, Textarea } from "@/components/ui/Field";
import { ImageUploader } from "@/components/ui/ImageUploader";
import {
  Banner,
  Card,
  CardSection,
  DescriptionList,
  Tag,
} from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UserPicker } from "@/components/ui/UserPicker";
import { useAllStaff, useAllTenants, useInvalidate } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import { useEnumLabel, useI18n } from "@/i18n";
import { todayISO } from "@/lib/dates";
import { normalizeError } from "@/lib/errors";
import { formatDate, formatDateTime, fullName } from "@/lib/format";
import { useSchemas } from "@/lib/schemas";
import { useApiError } from "@/lib/useApiError";
import { cn } from "@/lib/utils";
import type {
  DirectoryUser,
  ImageRef,
  MaintenanceRequest,
} from "@/types/models";
import { Gallery } from "../properties/Gallery";
import { PropertyLink } from "../units/UnitBits";

function PhotoGrid({
  images,
  onRemove,
  label,
}: {
  images: ImageRef[];
  onRemove?: (id: string) => void;
  label: string;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
      {images.map((img) => (
        <li
          key={img.publicId}
          className="group relative aspect-square overflow-hidden rounded-xl bg-surface-2"
        >
          <a href={img.url} target="_blank" rel="noreferrer">
            <img
              src={img.url}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          </a>
          {onRemove && (
            <button
              type="button"
              aria-label={label}
              onClick={() => onRemove(img.publicId)}
              className="absolute end-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/65 text-white hover:bg-black/85"
            >
              <X className="size-3.5" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function AssignDialog({
  id,
  onClose,
  onDone,
}: {
  id: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const apiError = useApiError();
  const schemas = useSchemas();
  const [staff, setStaff] = useState<DirectoryUser | null>(null);
  const [staffErr, setStaffErr] = useState<string>();
  const [err, setErr] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemas.assign),
    defaultValues: { scheduledDate: "", notes: "" },
  });
  const submit = handleSubmit(async (v) => {
    setErr(null);
    if (!staff) {
      setStaffErr(t("v.required"));
      return;
    }
    try {
      await maintenanceApi.assign(id, {
        assignedStaffId: staff.id,
        ...(v.scheduledDate ? { scheduledDate: v.scheduledDate } : {}),
        ...(v.notes?.trim() ? { notes: v.notes.trim() } : {}),
      });
      toast.success(t("mnt.assignedToast"));
      onDone();
      onClose();
    } catch (e) {
      const code = normalizeError(e).code;
      if (code === "STAFF_INVALID") setStaffErr(t("mnt.invalidStaff"));
      else {
        setErr(apiError(e));
        if (normalizeError(e).status === 409) onDone();
      }
    }
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={t("mnt.assignTitle")}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {err && <Banner tone="red">{err}</Banner>}
        <UserPicker
          role="MAINTENANCE_STAFF"
          label={t("mnt.staff")}
          value={staff}
          onChange={(u) => {
            setStaff(u);
            setStaffErr(undefined);
          }}
          error={staffErr}
          placeholder={t("common.search")}
        />
        <DateField
          label={t("mnt.scheduledDate")}
          optional
          min={todayISO()}
          error={errors.scheduledDate?.message}
          {...register("scheduledDate")}
        />
        <Textarea
          label={t("mnt.notes")}
          optional
          maxLength={1000}
          error={errors.notes?.message}
          {...register("notes")}
        />
        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t("mnt.assign")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function CompleteDialog({
  id,
  onClose,
  onDone,
}: {
  id: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const apiError = useApiError();
  const schemas = useSchemas();
  const [files, setFiles] = useState<File[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemas.complete),
    defaultValues: { resolutionDescription: "", notes: "" },
  });
  const submit = handleSubmit(async (v) => {
    setErr(null);
    try {
      await maintenanceApi.complete(
        id,
        {
          resolutionDescription: v.resolutionDescription.trim(),
          ...(v.notes?.trim() ? { notes: v.notes.trim() } : {}),
        },
        files,
      );
      toast.success(t("mnt.completedToast"));
      onDone();
      onClose();
    } catch (e) {
      setErr(apiError(e));
      if (normalizeError(e).status === 409) onDone();
    }
  });
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={t("mnt.complete")}
      className="max-w-lg"
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {err && <Banner tone="red">{err}</Banner>}
        <Textarea
          label={t("mnt.resolution")}
          hint={t("mnt.resolutionHint")}
          maxLength={2000}
          error={errors.resolutionDescription?.message}
          {...register("resolutionDescription")}
        />
        <Textarea
          label={t("mnt.notes")}
          optional
          maxLength={1000}
          rows={2}
          error={errors.notes?.message}
          {...register("notes")}
        />
        <ImageUploader
          mode="deferred"
          value={[]}
          maxFiles={5}
          label={t("mnt.completionImages")}
          hint={t("mnt.imagesHint")}
          onFilesChange={setFiles}
        />
        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {t("mnt.complete")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default function MaintenanceDetailPage() {
  const { id = "" } = useParams();
  const { t, lang } = useI18n();
  const label = useEnumLabel();
  const apiError = useApiError();
  const { user, role } = useAuth();
  const isManager = role === "OWNER" || role === "ADMIN";
  const tenants = useAllTenants(isManager);
  const techs = useAllStaff(isManager);
  const qc = useQueryClient();
  const inv = useInvalidate();
  const q = useQuery({
    queryKey: ["maintenance", id],
    queryFn: () => maintenanceApi.get(id),
  });
  const history = useQuery({
    queryKey: ["maintenance", id, "history"],
    queryFn: () => maintenanceApi.history(id),
    enabled: !!q.data,
  });
  const [dlg, setDlg] = useState<"assign" | "complete" | "cancel" | null>(null);

  const refresh = async () => {
    await inv.maintenance();
    await q.refetch();
    await history.refetch();
  };
  const put = (m: MaintenanceRequest) => {
    qc.setQueryData(["maintenance", id], m);
  };
  const fail = async (e: unknown) => {
    setDlg(null);
    toast.error(apiError(e));
    await refresh();
  }; // 409: refetch and explain
  const simple = (fn: () => Promise<unknown>, msg: string) =>
    useMutation({
      mutationFn: fn,
      onSuccess: async () => {
        toast.success(msg);
        setDlg(null);
        await refresh();
      },
      onError: fail,
    });
  const start = simple(() => maintenanceApi.start(id), t("mnt.startedToast"));
  const close = simple(() => maintenanceApi.close(id), t("mnt.closedToast"));
  const cancel = simple(
    () => maintenanceApi.cancel(id),
    t("mnt.cancelledToast"),
  );

  if (q.isLoading) return <LoadingSkeleton />;
  if (q.error || !q.data)
    return (
      <Card>
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </Card>
    );
  const m = q.data;
  const manager = role === "OWNER" || role === "ADMIN";
  const ownTenant = role === "TENANT" && m.tenantId === user?.id;
  const assignedStaff =
    role === "MAINTENANCE_STAFF" && m.assignedStaffId === user?.id; // never ADMIN/owner for start/complete
  const canWrite = ownTenant || manager;

  const tenantName = fullName(tenants.data?.find((u) => u.id === m.tenantId));
  const staffName = fullName(
    techs.data?.find((u) => u.id === m.assignedStaffId),
  );
  const actor = (changedById: string) =>
    changedById === user?.id
      ? t("mnt.actors.you")
      : changedById === m.tenantId
        ? tenantName || t("mnt.actors.tenant")
        : changedById === m.assignedStaffId
          ? staffName || t("mnt.actors.tech")
          : t("mnt.actors.manager");
  const actions = (
    <>
      {manager && m.status === "OPEN" && (
        <Button
          icon={<UserPlus className="size-4" />}
          onClick={() => setDlg("assign")}
        >
          {t("mnt.assign")}
        </Button>
      )}
      {assignedStaff && m.status === "ASSIGNED" && (
        <Button
          icon={<Play className="size-4" />}
          loading={start.isPending}
          onClick={() => start.mutate()}
        >
          {t("mnt.start")}
        </Button>
      )}
      {assignedStaff && m.status === "IN_PROGRESS" && (
        <Button
          icon={<CheckCheck className="size-4" />}
          onClick={() => setDlg("complete")}
        >
          {t("mnt.complete")}
        </Button>
      )}
      {canWrite && m.status === "RESOLVED" && (
        <Button
          icon={<CheckCheck className="size-4" />}
          loading={close.isPending}
          onClick={() => close.mutate()}
        >
          {t("mnt.close")}
        </Button>
      )}
      {canWrite && (m.status === "OPEN" || m.status === "ASSIGNED") && (
        <Button
          variant="secondary"
          className="text-[var(--red-fg)]"
          icon={<XCircle className="size-4" />}
          onClick={() => setDlg("cancel")}
        >
          {t("mnt.cancel")}
        </Button>
      )}
    </>
  );

  return (
    <>
      <PageHeader
        title={m.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <StatusBadge kind="maintenance" value={m.status} />
            <StatusBadge kind="priority" value={m.priority} />
            <Tag>{label("cat", m.category)}</Tag>
          </span>
        }
        actions={actions}
      />
      {assignedStaff && (
        <Banner tone="blue" className="mb-5">
          {t("mnt.assignedToYou")}
        </Banner>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <CardSection title={t("mnt.description")}>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {m.description}
            </p>
          </CardSection>
          <CardSection title={t("mnt.images")}>
            {canWrite && m.status === "OPEN" ? (
              <>
                <ImageUploader
                  mode="immediate"
                  value={m.images}
                  maxFiles={5}
                  hint={t("mnt.imagesHint")}
                  onUpload={async (files, onProgress) => {
                    put(
                      await maintenanceApi.uploadImages(id, files, onProgress),
                    );
                  }}
                  onRemove={async (publicId) => {
                    put(await maintenanceApi.deleteImage(id, publicId));
                  }}
                  onError={() => void refresh()}
                />
              </>
            ) : m.images.length ? (
              <Gallery images={m.images} alt={m.title} />
            ) : (
              <p className="text-sm text-muted">{t("properties.noPhoto")}</p>
            )}
            {m.status !== "OPEN" && canWrite && (
              <p className="mt-3 text-xs text-muted">
                {t("mnt.photosOpenOnly")}
              </p>
            )}
          </CardSection>
          {(m.resolutionDescription || m.completionImages.length > 0) && (
            <CardSection title={t("mnt.resolutionTitle")}>
              {m.resolutionDescription && (
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {m.resolutionDescription}
                </p>
              )}
              {m.completionImages.length > 0 && (
                <div className={cn(m.resolutionDescription && "mt-4")}>
                  <PhotoGrid
                    images={m.completionImages}
                    label={t("mnt.removeCompletion")}
                    onRemove={
                      assignedStaff && m.status === "RESOLVED"
                        ? async (publicId) => {
                            try {
                              put(
                                await maintenanceApi.deleteCompletionImage(
                                  id,
                                  publicId,
                                ),
                              );
                            } catch (e) {
                              toast.error(apiError(e));
                              void refresh();
                            }
                          }
                        : undefined
                    }
                  />
                </div>
              )}
            </CardSection>
          )}
        </div>
        <div className="space-y-6">
          <CardSection title={t("mnt.assignment")}>
            <DescriptionList
              items={[
                {
                  label: t("mnt.unit"),
                  value: (
                    <span className="flex flex-col">
                      <span>{t("units.unit", { n: m.unit.unitNumber })}</span>
                      <PropertyLink
                        propertyId={m.unit.propertyId}
                        className="text-xs text-muted"
                      />
                    </span>
                  ),
                },
                {
                  label: t("mnt.staff"),
                  value: m.assignedStaffId
                    ? assignedStaff
                      ? t("mnt.assignedToYou")
                      : staffName || t("mnt.assignedStaff")
                    : t("mnt.notAssigned"),
                },
                ...(manager
                  ? [
                      {
                        label: t("mnt.actors.tenant"),
                        value: tenantName || "—",
                      },
                    ]
                  : []),
                {
                  label: t("mnt.scheduled"),
                  value: (
                    <span className="num">
                      {m.scheduledDate
                        ? formatDate(m.scheduledDate, lang)
                        : "—"}
                    </span>
                  ),
                },
                {
                  label: t("mnt.createdAt"),
                  value: (
                    <span className="num">
                      {formatDateTime(m.createdAt, lang)}
                    </span>
                  ),
                },
              ]}
              className="sm:grid-cols-1"
            />
          </CardSection>
          <CardSection title={t("mnt.timeline")}>
            <ol className="relative space-y-5 ps-6 before:absolute before:inset-y-1 before:start-[0.4rem] before:w-px before:bg-line">
              <li className="relative">
                <span className="absolute -start-6 top-1 size-3 rounded-full border-2 border-bg bg-faint" />
                <p className="text-sm font-medium">{t("mnt.reported")}</p>
                <p className="num text-xs text-muted">
                  {formatDateTime(m.createdAt, lang)}
                </p>
              </li>
              {history.data?.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -start-6 top-1 size-3 rounded-full border-2 border-bg bg-accent" />
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge kind="maintenance" value={h.newStatus} />
                    <span className="text-xs text-muted">
                      {actor(h.changedById)}
                    </span>
                  </div>
                  <p className="num mt-1 text-xs text-muted">
                    {formatDateTime(h.createdAt, lang)}
                  </p>
                  {h.notes && (
                    <p className="mt-1.5 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                      {h.notes}
                    </p>
                  )}
                  {h.newStatus === "RESOLVED" && m.resolutionDescription && (
                    <p className="mt-1.5 rounded-lg bg-surface-2 px-3 py-2 text-sm">
                      {m.resolutionDescription}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </CardSection>
        </div>
      </div>

      {dlg === "assign" && (
        <AssignDialog
          id={id}
          onClose={() => setDlg(null)}
          onDone={() => void refresh()}
        />
      )}
      {dlg === "complete" && (
        <CompleteDialog
          id={id}
          onClose={() => setDlg(null)}
          onDone={() => void refresh()}
        />
      )}
      <ConfirmDialog
        open={dlg === "cancel"}
        destructive
        loading={cancel.isPending}
        title={t("mnt.cancelTitle")}
        description={t("mnt.cancelText")}
        confirmLabel={t("mnt.cancel")}
        onConfirm={() => cancel.mutate()}
        onCancel={() => setDlg(null)}
      />
    </>
  );
}
