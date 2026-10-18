import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileDown } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { leasesApi } from "@/api/leases";
import { propertiesApi } from "@/api/properties";
import { unitsApi } from "@/api/units";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Misc";
import { ErrorState, LoadingSkeleton } from "@/components/ui/States";
import { useAllTenants, useAllUsers } from "@/hooks/queries";
import { useAuth } from "@/hooks/useAuth";
import { useEnumLabel, useI18n } from "@/i18n";
import { diffDays, todayISO } from "@/lib/dates";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  fullName,
} from "@/lib/format";
import { paths } from "@/routes/paths";

const INK = "#17202e";
const MUTED = "#566074";
const LINE = "#d9ddd5";
const NAVY = "#1d2b5f";

/** Round seal carrying the site name. Pure SVG so it prints sharply and ignores dark mode. */
function Stamp({ date, status }: { date: string; status: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 200 200"
      width="132"
      height="132"
      role="img"
      aria-label="PropFlow"
      style={{ transform: "rotate(-9deg)" }}
    >
      <defs>
        <path
          id={`ring-${id}`}
          d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0"
        />
      </defs>
      <circle
        cx="100"
        cy="100"
        r="94"
        fill="none"
        stroke={NAVY}
        strokeWidth="4"
      />
      <circle
        cx="100"
        cy="100"
        r="87"
        fill="none"
        stroke={NAVY}
        strokeWidth="1.2"
      />
      <circle
        cx="100"
        cy="100"
        r="52"
        fill="none"
        stroke={NAVY}
        strokeWidth="1.2"
      />
      <text
        fontSize="14.5"
        fontWeight="700"
        letterSpacing="3.2"
        fill={NAVY}
        fontFamily="Arial, Helvetica, sans-serif"
      >
        <textPath href={`#ring-${id}`} startOffset="0">
          PROPFLOW • PROPERTY MANAGEMENT •
        </textPath>
      </text>
      <path
        d="M100 68 123 87v26a4 4 0 0 1-4 4H81a4 4 0 0 1-4-4V87Z"
        fill="none"
        stroke={NAVY}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <text
        x="100"
        y="140"
        textAnchor="middle"
        fontSize="19"
        fontWeight="800"
        fill={NAVY}
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="1"
      >
        PropFlow
      </text>
      <text
        x="100"
        y="157"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill={NAVY}
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="2"
      >
        {status}
      </text>
      <text
        x="100"
        y="169"
        textAnchor="middle"
        fontSize="9"
        fill={NAVY}
        fontFamily="Arial, Helvetica, sans-serif"
      >
        {date}
      </text>
    </svg>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-6" style={{ breakInside: "avoid" }}>
      <h2
        className="mb-2 flex items-baseline gap-2 border-b pb-1.5 text-[0.95rem] font-bold"
        style={{ borderColor: NAVY, color: NAVY }}
      >
        <span className="num">{n}.</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Rows({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2" style={{ color: INK }}>
      {items.map((it, i) => (
        <div
          key={i}
          className="flex gap-3 border-b px-1 py-2 text-[0.85rem]"
          style={{ borderColor: LINE }}
        >
          <dt className="w-36 shrink-0" style={{ color: MUTED }}>
            {it.label}
          </dt>
          <dd className="min-w-0 flex-1 break-words font-medium" dir="auto">
            {it.value || "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function ContractPage() {
  const { id = "" } = useParams();
  const [sp] = useSearchParams();
  const { t, lang } = useI18n();
  const label = useEnumLabel();
  const { user, role } = useAuth();
  const manager = role === "OWNER" || role === "ADMIN";

  const lease = useQuery({
    queryKey: ["leases", id],
    queryFn: () => leasesApi.get(id),
  });
  const l = lease.data;
  const property = useQuery({
    queryKey: ["properties", l?.unit.propertyId],
    queryFn: () => propertiesApi.get(l!.unit.propertyId),
    enabled: !!l,
  });
  const unit = useQuery({
    queryKey: ["units", l?.unitId],
    queryFn: () => unitsApi.get(l!.unitId),
    enabled: !!l,
  });
  const tenants = useAllTenants(manager);
  const users = useAllUsers(role === "ADMIN");

  const loading = lease.isLoading || property.isLoading || unit.isLoading;
  const ready = !!l && !loading;

  // browsers use the title as the default PDF file name
  useEffect(() => {
    if (!l) return;
    const prev = document.title;
    document.title = `PropFlow-lease-${l.unit.unitNumber}-${l.startDate.slice(0, 10)}`;
    return () => {
      document.title = prev;
    };
  }, [l]);
  // opened from the list's PDF button: go straight to the print dialog once everything is drawn
  useEffect(() => {
    if (ready && sp.get("print") === "1") {
      const id = setTimeout(() => window.print(), 600);
      return () => clearTimeout(id);
    }
  }, [ready, sp]);

  if (lease.error) {
    return (
      <Card>
        <ErrorState error={lease.error} onRetry={() => lease.refetch()} />
      </Card>
    );
  }
  if (!l || loading) return <LoadingSkeleton />;

  const p = property.data;
  const u = unit.data;
  const start = l.startDate.slice(0, 10);
  const end = l.endDate.slice(0, 10);
  const days = diffDays(start, end) + 1;
  const months = Math.max(1, Math.round(days / 30.4375));
  const n = (v: number) => formatNumber(v, lang);

  const tenantUser =
    role === "TENANT" && user?.id === l.tenantId ? user : undefined;
  const tenantDir = (tenants.data ?? []).find((x) => x.id === l.tenantId);
  const tenantName = fullName(tenantUser ?? tenantDir);
  const tenantEmail = tenantUser?.email ?? tenantDir?.email ?? "";
  const tenantPhone = tenantUser?.phone ?? "";
  const ownerUser =
    role === "OWNER" && user?.id === p?.ownerId
      ? user
      : (users.data ?? []).find((x) => x.id === p?.ownerId);
  const ownerName = fullName(ownerUser);
  const ref = `PF-${l.id.slice(0, 8).toUpperCase()}`;
  const issued = formatDateTime(new Date().toISOString(), lang);
  const stampDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());
  const place = [p?.address, p?.city, p?.country].filter(Boolean).join(", ");

  return (
    <>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={paths.lease(l.id)}
          className="tap-area inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
          {t("contract.back")}
        </Link>
        <Button
          icon={<FileDown className="size-4" />}
          onClick={() => window.print()}
        >
          {t("contract.download")}
        </Button>
      </div>
      <p className="no-print mb-4 text-sm text-muted">{t("contract.hint")}</p>

      <article
        className="contract-paper mx-auto w-full max-w-[210mm] rounded-sm px-[12mm] py-[11mm] shadow-pop"
        style={{ background: "#fff", color: INK }}
        aria-label={t("contract.title")}
      >
        {/* letterhead */}
        <header
          className="flex items-start justify-between gap-4 border-b-2 pb-4"
          style={{ borderColor: NAVY }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex size-12 items-center justify-center rounded-xl"
              style={{ background: NAVY }}
              aria-hidden
            >
              <svg viewBox="0 0 40 40" className="size-8">
                <path
                  d="M20 7 33.5 18.2V30.6a3.6 3.6 0 0 1-3.6 3.6H10.1a3.6 3.6 0 0 1-3.6-3.6V18.2Z"
                  fill="#fff"
                />
                <path
                  d="M8 33C15 33 16 25 22 25S29 21 34 18V33Z"
                  fill="#e0962a"
                />
              </svg>
            </span>
            <div>
              <p
                className="font-display text-2xl font-extrabold leading-none"
                style={{ color: NAVY }}
              >
                PropFlow
              </p>
              <p className="mt-1 text-xs" style={{ color: MUTED }}>
                {t("contract.tagline")}
              </p>
            </div>
          </div>
          <div className="text-end text-xs" style={{ color: MUTED }}>
            <p
              className="text-base font-bold"
              style={{ color: INK }}
              dir="auto"
            >
              {t("contract.title")}
            </p>
            <p className="num mt-1" dir="ltr" style={{ textAlign: "end" }}>
              {ref}
            </p>
            <p className="num mt-0.5">{issued}</p>
          </div>
        </header>

        <Section n={1} title={t("contract.parties")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div
              className="rounded-lg border p-3"
              style={{ borderColor: LINE }}
            >
              <p
                className="mb-1 text-xs font-semibold"
                style={{ color: MUTED }}
              >
                {t("contract.landlord")}
              </p>
              <p className="font-bold" dir="auto">
                {ownerName || "—"}
              </p>
              {ownerUser?.email && (
                <p className="text-sm" style={{ color: MUTED }} dir="ltr">
                  {ownerUser.email}
                </p>
              )}
              {ownerUser?.phone && (
                <p className="num text-sm" style={{ color: MUTED }} dir="ltr">
                  {ownerUser.phone}
                </p>
              )}
            </div>
            <div
              className="rounded-lg border p-3"
              style={{ borderColor: LINE }}
            >
              <p
                className="mb-1 text-xs font-semibold"
                style={{ color: MUTED }}
              >
                {t("contract.tenant")}
              </p>
              <p className="font-bold" dir="auto">
                {tenantName || "—"}
              </p>
              {tenantEmail && (
                <p className="text-sm" style={{ color: MUTED }} dir="ltr">
                  {tenantEmail}
                </p>
              )}
              {tenantPhone && (
                <p className="num text-sm" style={{ color: MUTED }} dir="ltr">
                  {tenantPhone}
                </p>
              )}
            </div>
          </div>
        </Section>

        <Section n={2} title={t("contract.property")}>
          <Rows
            items={[
              { label: t("tl.property"), value: p?.name },
              {
                label: t("contract.type"),
                value: p ? label("ptype", p.propertyType) : "",
              },
              { label: t("contract.address"), value: place },
              {
                label: t("leases.unit"),
                value: t("units.unit", { n: l.unit.unitNumber }),
              },
              {
                label: t("contract.floor"),
                value: u?.floor != null ? n(u.floor) : "",
              },
              { label: t("contract.area"), value: u ? `${n(u.area)} m²` : "" },
              { label: t("contract.bedrooms"), value: u ? n(u.bedrooms) : "" },
              {
                label: t("contract.bathrooms"),
                value: u ? n(u.bathrooms) : "",
              },
            ]}
          />
        </Section>

        <Section n={3} title={t("contract.term")}>
          <Rows
            items={[
              {
                label: t("leases.start"),
                value: <span className="num">{formatDate(start, lang)}</span>,
              },
              {
                label: t("leases.end"),
                value: <span className="num">{formatDate(end, lang)}</span>,
              },
              {
                label: t("contract.duration"),
                value: t("contract.durationValue", {
                  days: n(days),
                  months: n(months),
                }),
              },
              {
                label: t("leases.rent"),
                value: (
                  <span className="num">
                    {formatMoney(l.rentAmount, lang)} / {t("contract.month")}
                  </span>
                ),
              },
              { label: t("leases.status"), value: label("lease", l.status) },
              {
                label: t("contract.created"),
                value: (
                  <span className="num">{formatDate(l.createdAt, lang)}</span>
                ),
              },
            ]}
          />
        </Section>

        {l.notes && (
          <Section n={4} title={t("leases.notes")}>
            <p
              className="whitespace-pre-wrap rounded-lg border p-3 text-[0.85rem] leading-relaxed"
              style={{ borderColor: LINE }}
              dir="auto"
            >
              {l.notes}
            </p>
          </Section>
        )}

        <Section n={l.notes ? 5 : 4} title={t("contract.signatures")}>
          <div
            className="grid items-end gap-6 sm:grid-cols-[1fr_auto_1fr]"
            style={{ breakInside: "avoid" }}
          >
            {[
              [t("contract.landlord"), ownerName],
              [t("contract.tenant"), tenantName],
            ].map(([role_, name], i) => (
              <div key={i} className={i === 1 ? "sm:order-3" : "sm:order-1"}>
                <div className="h-16 border-b" style={{ borderColor: INK }} />
                <p
                  className="mt-1.5 text-xs font-semibold"
                  style={{ color: MUTED }}
                >
                  {role_}
                </p>
                <p className="text-sm font-medium" dir="auto">
                  {name || "—"}
                </p>
                <p className="mt-2 text-xs" style={{ color: MUTED }}>
                  {t("contract.date")}: ____ / ____ / ________
                </p>
              </div>
            ))}
            <div className="flex justify-center sm:order-2">
              <Stamp date={stampDate} status={l.status} />
            </div>
          </div>
        </Section>

        <footer
          className="mt-8 border-t pt-3 text-[0.7rem] leading-relaxed"
          style={{ borderColor: LINE, color: MUTED }}
        >
          <p dir="auto">{t("contract.disclaimer")}</p>
          <p className="num mt-1 flex flex-wrap justify-between gap-2">
            <span dir="ltr">{ref}</span>
            <span>PropFlow · {formatDate(todayISO(), lang)}</span>
          </p>
        </footer>
      </article>
    </>
  );
}
