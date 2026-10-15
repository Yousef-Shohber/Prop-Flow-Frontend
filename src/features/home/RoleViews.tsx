import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ClipboardList,
  DoorOpen,
  FileSignature,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { analyticsApi } from "@/api/analytics";
import { leasesApi } from "@/api/leases";
import { maintenanceApi } from "@/api/maintenance";
import { rentalRequestsApi } from "@/api/rentalRequests";
import { renewalsApi } from "@/api/renewals";
import { Button } from "@/components/ui/Button";
import { EmptyState, SuccessState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useI18n } from "@/i18n";
import { formatDate, formatNumber, fullName } from "@/lib/format";
import { paths } from "@/routes/paths";
import { Link } from "react-router-dom";
import type { Lease, MaintenanceRequest, RentalRequest } from "@/types/models";
import {
  Activity,
  Kpi,
  Panel,
  QuickActions,
  Row,
  daysLeft,
  personName,
} from "./HomeWidgets";

export function TenantView() {
  const { t, lang } = useI18n();

  const leases = useQuery({
    queryKey: ["leases", { status: "ACTIVE", page: 1, limit: 3, home: true }],
    queryFn: () => leasesApi.list({ status: "ACTIVE", page: 1, limit: 3 }),
  });

  const pending = useQuery({
    queryKey: [
      "rental-requests",
      { status: "PENDING", page: 1, limit: 5, home: true },
    ],
    queryFn: () =>
      rentalRequestsApi.list({ status: "PENDING", page: 1, limit: 5 }),
  });

  const maint = useQuery({
    queryKey: ["maintenance", { page: 1, limit: 100, home: true }],
    queryFn: () => maintenanceApi.list({ page: 1, limit: 100 }),
  });

  const activeMaint = (maint.data?.data ?? []).filter((m: MaintenanceRequest) =>
    ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(m.status),
  );

  const myLeases: Lease[] = leases.data?.data ?? [];
  const reqs: RentalRequest[] = pending.data?.data ?? [];

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          icon={FileSignature}
          tone="green"
          label={t("home.kpi.activeLeases")}
          value={leases.data?.meta.total}
          loading={leases.isLoading}
          to={`${paths.leases}?status=ACTIVE`}
        />

        <Kpi
          icon={ClipboardList}
          tone="amber"
          label={t("home.kpi.pendingRequests")}
          value={pending.data?.meta.total}
          loading={pending.isLoading}
          to={`${paths.rentalRequests}?status=PENDING`}
        />

        <Kpi
          icon={Wrench}
          tone="blue"
          label={t("home.kpi.activeMaintenance")}
          value={maint.data ? activeMaint.length : undefined}
          loading={maint.isLoading}
          to={paths.maintenance}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Panel
          title={t("home.myLease")}
          to={paths.leases}
          linkLabel={t("home.seeAll")}
          loading={leases.isLoading}
          error={leases.error}
          onRetry={() => leases.refetch()}
          empty={
            myLeases.length === 0 ? (
              <EmptyState
                compact
                icon={FileSignature}
                title={t("home.noLease")}
                description={t("home.noLeaseText")}
                action={
                  <Button
                    to={paths.properties}
                    icon={<Search className="size-4" />}
                  >
                    {t("home.ctaTenant")}
                  </Button>
                }
              />
            ) : undefined
          }
        >
          <ul className="space-y-3">
            {myLeases.map((l) => {
              const left = daysLeft(l.endDate);

              return (
                <li key={l.id}>
                  <Link
                    to={paths.lease(l.id)}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line p-4 transition-colors hover:bg-surface-2"
                  >
                    <span>
                      <span className="block font-semibold">
                        {t("units.unit", { n: l.unit.unitNumber })}
                      </span>
                      <span className="block text-sm text-muted">
                        {formatDate(l.startDate, lang)} →{" "}
                        {formatDate(l.endDate, lang)}
                      </span>
                    </span>

                    <span className="text-end">
                      <StatusBadge kind="lease" value={l.status} />
                      {left !== null && left >= 0 && (
                        <span className="mt-1 block text-xs text-muted">
                          {t("home.daysLeft", {
                            n: formatNumber(left, lang),
                          })}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          title={t("home.myRequests")}
          to={paths.rentalRequests}
          linkLabel={t("home.seeAll")}
          loading={pending.isLoading}
          error={pending.error}
          onRetry={() => pending.refetch()}
          empty={
            reqs.length === 0 ? (
              <EmptyState
                compact
                icon={ClipboardList}
                title={t("home.noRequests")}
                description={t("home.noRequestsText")}
              />
            ) : undefined
          }
        >
          <ul className="-mx-2 divide-y divide-line">
            {reqs.map((r) => (
              <Row
                key={r.id}
                to={paths.rentalRequest(r.id)}
                title={t("units.unit", {
                  n: r.unit?.unitNumber ?? "—",
                })}
                meta={`${formatDate(r.startDate, lang)} → ${formatDate(r.endDate, lang)}`}
                end={<StatusBadge kind="rentalRequest" value={r.status} />}
              />
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Activity />

        <QuickActions
          items={[
            {
              to: paths.properties,
              icon: Search,
              label: t("home.ctaTenant"),
            },
            {
              to: paths.maintenanceNew,
              icon: Wrench,
              label: t("home.reportProblem"),
            },
            {
              to: paths.rentalRequests,
              icon: ClipboardList,
              label: t("nav.rentalRequests"),
            },
            {
              to: paths.renewals,
              icon: RefreshCw,
              label: t("nav.renewals"),
            },
          ]}
        />
      </div>
    </>
  );
}

export function ManagerView({ role }: { role: "OWNER" | "ADMIN" }) {
  const { t, lang } = useI18n();

  const stats = useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: analyticsApi.dashboard,
  });

  const reqs = useQuery({
    queryKey: [
      "rental-requests",
      { status: "PENDING", page: 1, limit: 4, home: true },
    ],
    queryFn: () =>
      rentalRequestsApi.list({ status: "PENDING", page: 1, limit: 4 }),
  });

  const renewals = useQuery({
    queryKey: [
      "lease-renewals",
      { status: "PENDING", page: 1, limit: 4, home: true },
    ],
    queryFn: () => renewalsApi.list({ status: "PENDING", page: 1, limit: 4 }),
  });

  const openMaint = useQuery({
    queryKey: [
      "maintenance",
      { status: "OPEN", page: 1, limit: 4, home: true },
    ],
    queryFn: () => maintenanceApi.list({ status: "OPEN", page: 1, limit: 4 }),
  });

  const attention =
    (reqs.data?.meta.total ?? 0) +
    (renewals.data?.meta.total ?? 0) +
    (openMaint.data?.meta.total ?? 0);

  const allLoaded = !!reqs.data && !!renewals.data && !!openMaint.data;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={Building2}
          tone="blue"
          label={t("dashboard.occupancy")}
          value={stats.data?.occupancyRate}
          suffix="%"
          loading={stats.isLoading}
          to={paths.dashboard}
        />

        <Kpi
          icon={ClipboardList}
          tone="amber"
          label={t("home.kpi.pendingRequests")}
          value={reqs.data?.meta.total}
          loading={reqs.isLoading}
          to={`${paths.rentalRequests}?status=PENDING`}
        />

        <Kpi
          icon={RefreshCw}
          tone="teal"
          label={t("home.kpi.pendingRenewals")}
          value={renewals.data?.meta.total}
          loading={renewals.isLoading}
          to={paths.renewals}
        />

        <Kpi
          icon={Wrench}
          tone="orange"
          label={t("home.kpi.openMaintenance")}
          value={stats.data?.openMaintenanceRequests}
          loading={stats.isLoading}
          to={`${paths.maintenance}?status=OPEN`}
        />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
        <Panel
          title={t("home.attention")}
          loading={!allLoaded && !reqs.error}
          error={reqs.error ?? renewals.error ?? openMaint.error}
          onRetry={() => {
            reqs.refetch();
            renewals.refetch();
            openMaint.refetch();
          }}
          empty={
            allLoaded && attention === 0 ? (
              <SuccessState
                compact
                title={t("home.allClear")}
                description={t("home.allClearText")}
              />
            ) : undefined
          }
        >
          <div className="space-y-5">
            {(reqs.data?.data.length ?? 0) > 0 && (
              <div>
                <h3 className="mb-1 text-xs font-semibold text-faint">
                  {t("nav.rentalRequests")}
                </h3>

                <ul className="-mx-2 divide-y divide-line">
                  {reqs.data!.data.map((r) => (
                    <Row
                      key={r.id}
                      to={paths.rentalRequest(r.id)}
                      title={
                        personName(r) ||
                        t("units.unit", {
                          n: r.unit?.unitNumber ?? "—",
                        })
                      }
                      meta={`${t("units.unit", {
                        n: r.unit?.unitNumber ?? "—",
                      })} · ${formatDate(r.startDate, lang)} → ${formatDate(r.endDate, lang)}`}
                      end={
                        <StatusBadge kind="rentalRequest" value={r.status} />
                      }
                    />
                  ))}
                </ul>
              </div>
            )}

            {(renewals.data?.data.length ?? 0) > 0 && (
              <div>
                <h3 className="mb-1 text-xs font-semibold text-faint">
                  {t("nav.renewals")}
                </h3>

                <ul className="-mx-2 divide-y divide-line">
                  {renewals.data!.data.map((r) => (
                    <Row
                      key={r.id}
                      to={paths.renewal(r.id)}
                      title={
                        r.tenant
                          ? fullName(r.tenant)
                          : t("units.unit", {
                              n: r.unit?.unitNumber ?? "—",
                            })
                      }
                      meta={`${t("units.unit", {
                        n: r.unit?.unitNumber ?? "—",
                      })} · ${t("home.requestedUntil", {
                        date: formatDate(r.requestedEndDate, lang),
                      })}`}
                      end={
                        <StatusBadge kind="rentalRequest" value={r.status} />
                      }
                    />
                  ))}
                </ul>
              </div>
            )}

            {(openMaint.data?.data.length ?? 0) > 0 && (
              <div>
                <h3 className="mb-1 text-xs font-semibold text-faint">
                  {t("nav.maintenance")}
                </h3>

                <ul className="-mx-2 divide-y divide-line">
                  {openMaint.data!.data.map((m) => (
                    <Row
                      key={m.id}
                      to={paths.maintenanceItem(m.id)}
                      title={m.title}
                      meta={t("units.unit", {
                        n: m.unit?.unitNumber ?? "—",
                      })}
                      end={<StatusBadge kind="priority" value={m.priority} />}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Panel>

        <QuickActions
          items={[
            {
              to: paths.propertyNew,
              icon: Plus,
              label: t("dashboard.addProperty"),
            },
            {
              to: paths.leaseNew,
              icon: FileSignature,
              label: t("home.newLease"),
            },
            {
              to: paths.dashboard,
              icon: LayoutDashboard,
              label: t("nav.dashboard"),
            },
            {
              to: paths.units,
              icon: DoorOpen,
              label: t("nav.units"),
            },
            ...(role === "ADMIN"
              ? [
                  {
                    to: `${paths.users}?role=OWNER`,
                    icon: ShieldCheck,
                    label: t("dashboard.pendingOwners"),
                  },
                ]
              : []),
          ]}
        />

        <div className="lg:col-span-2">
          <Activity />
        </div>
      </div>
    </>
  );
}

export function StaffView() {
  const { t, lang } = useI18n();

  const assigned = useQuery({
    queryKey: [
      "maintenance",
      { status: "ASSIGNED", page: 1, limit: 5, home: true },
    ],
    queryFn: () =>
      maintenanceApi.list({ status: "ASSIGNED", page: 1, limit: 5 }),
  });

  const working = useQuery({
    queryKey: [
      "maintenance",
      { status: "IN_PROGRESS", page: 1, limit: 5, home: true },
    ],
    queryFn: () =>
      maintenanceApi.list({ status: "IN_PROGRESS", page: 1, limit: 5 }),
  });

  const jobs = (list?: MaintenanceRequest[]) =>
    (list ?? []).map((m) => (
      <Row
        key={m.id}
        to={paths.maintenanceItem(m.id)}
        title={m.title}
        meta={`${t("units.unit", {
          n: m.unit?.unitNumber ?? "—",
        })}${m.scheduledDate ? ` · ${formatDate(m.scheduledDate, lang)}` : ""}`}
        end={<StatusBadge kind="priority" value={m.priority} />}
      />
    ));

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Kpi
          icon={Wrench}
          tone="blue"
          label={t("home.kpi.toStart")}
          value={assigned.data?.meta.total}
          loading={assigned.isLoading}
          to={`${paths.maintenance}?status=ASSIGNED`}
        />

        <Kpi
          icon={RefreshCw}
          tone="amber"
          label={t("home.kpi.inProgress")}
          value={working.data?.meta.total}
          loading={working.isLoading}
          to={`${paths.maintenance}?status=IN_PROGRESS`}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Panel
          title={t("home.readyToStart")}
          to={`${paths.maintenance}?status=ASSIGNED`}
          linkLabel={t("home.seeAll")}
          loading={assigned.isLoading}
          error={assigned.error}
          onRetry={() => assigned.refetch()}
          empty={
            (assigned.data?.data.length ?? 0) === 0 ? (
              <EmptyState
                compact
                icon={Wrench}
                title={t("home.noJobs")}
                description={t("home.noJobsText")}
              />
            ) : undefined
          }
        >
          <ul className="-mx-2 divide-y divide-line">
            {jobs(assigned.data?.data)}
          </ul>
        </Panel>

        <Panel
          title={t("home.inProgressNow")}
          to={`${paths.maintenance}?status=IN_PROGRESS`}
          linkLabel={t("home.seeAll")}
          loading={working.isLoading}
          error={working.error}
          onRetry={() => working.refetch()}
          empty={
            (working.data?.data.length ?? 0) === 0 ? (
              <EmptyState
                compact
                icon={RefreshCw}
                title={t("home.nothingInProgress")}
                description={t("home.nothingInProgressText")}
              />
            ) : undefined
          }
        >
          <ul className="-mx-2 divide-y divide-line">
            {jobs(working.data?.data)}
          </ul>
        </Panel>
      </div>

      <Activity />
    </>
  );
}
