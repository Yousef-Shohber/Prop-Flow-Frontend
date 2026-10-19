import { useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Eye,
  KeyRound,
  MessageSquareText,
  PhoneCall,
  ScrollText,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Photo, type SceneVariant } from "@/components/ui/Photo";
import type { PhotoName } from "@/lib/photos";
import { StatusBadge, type BadgeKind } from "@/components/ui/StatusBadge";
import { Switch } from "@/components/ui/Switch";
import { Tabs, TabContent, TabList, TabTrigger } from "@/components/ui/Tabs";
import { Tag } from "@/components/ui/Misc";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";

/* ---------- the problem: how small portfolios usually run ---------- */

export function ProblemSection() {
  const { t, raw } = useI18n();
  const items = raw<string[][]>("landing.problem.items");
  const icons = [MessageSquareText, CalendarClock, PhoneCall];
  return (
    <section className="py-20" aria-labelledby="problem-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2
            id="problem-title"
            data-reveal
            className="text-3xl font-bold sm:text-4xl"
          >
            {t("landing.problem.title")}
          </h2>
          <p data-reveal className="mt-4 text-muted">
            {t("landing.problem.intro")}
          </p>
        </div>
        <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map(([title, text], i) => {
            const Icon = icons[i] ?? MessageSquareText;
            return (
              <li
                key={title}
                data-reveal
                className="rounded-card border border-line bg-surface p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--red-bg)] text-[var(--red-fg)]">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {text}
                </p>
              </li>
            );
          })}
        </ul>
        <p
          data-reveal
          className="mt-8 flex items-center gap-3 text-base font-medium"
        >
          <span aria-hidden className="h-px w-10 shrink-0 bg-accent" />
          {t("landing.problem.close")}
        </p>
      </div>
    </section>
  );
}

/* ---------- gallery: the kinds of space PropFlow manages ---------- */

const TILES: {
  name: PhotoName;
  variant: SceneVariant;
  alt: string;
  cls: string;
}[] = [
  {
    name: "gallery-tower",
    variant: "tower",
    alt: "landing.alt.tower",
    cls: "sm:col-span-2 sm:row-span-2 aspect-[4/3] sm:aspect-auto",
  },
  {
    name: "gallery-villa",
    variant: "villa",
    alt: "landing.alt.villa",
    cls: "aspect-[4/3]",
  },
  {
    name: "gallery-interior",
    variant: "interior",
    alt: "landing.alt.interior",
    cls: "aspect-[4/3]",
  },
  {
    name: "gallery-commercial",
    variant: "street",
    alt: "landing.alt.commercial",
    cls: "sm:col-span-2 aspect-[16/7]",
  },
];

export function SpacesSection() {
  const { t, raw } = useI18n();
  const items = raw<string[][]>("landing.spaces.items");
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 data-reveal className="text-3xl font-bold sm:text-4xl">
            {t("landing.spaces.title")}
          </h2>
          <p data-reveal className="mt-4 text-muted">
            {t("landing.spaces.intro")}
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-4 sm:grid-rows-[repeat(3,minmax(0,13rem))]">
          {TILES.map((tile, i) => (
            <div
              key={tile.name}
              data-reveal
              className={cn(
                "group relative overflow-hidden rounded-card border border-line",
                tile.cls,
              )}
            >
              <Photo
                name={tile.name}
                variant={tile.variant}
                alt={t(tile.alt)}
                overlay
                className="size-full transition-transform duration-700 group-hover:scale-[1.03]"
              >
                <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                  <p className="font-display text-lg font-semibold">
                    {items[i]?.[0]}
                  </p>
                  <p className="mt-0.5 max-w-sm text-sm text-white/80">
                    {items[i]?.[1]}
                  </p>
                </div>
              </Photo>
            </div>
          ))}
        </div>
        <div
          data-reveal
          className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface px-5 py-4"
        >
          <p className="max-w-xl text-sm text-muted">
            {t("landing.spaces.note")}
          </p>
          <Button to={paths.register} variant="secondary">
            {t("landing.spaces.cta")}
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------- workflow: request -> lease -> repair, with the real statuses ---------- */

const FLOW: [BadgeKind, string][] = [
  ["rentalRequest", "PENDING"],
  ["rentalRequest", "APPROVED"],
  ["lease", "PENDING"],
  ["lease", "ACTIVE"],
  ["maintenance", "RESOLVED"],
];

export function FlowSection() {
  const { t, raw } = useI18n();
  const steps = raw<string[][]>("landing.flow.steps");
  return (
    <section className="border-y border-line bg-surface-2/50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 data-reveal className="text-3xl font-bold sm:text-4xl">
            {t("landing.flow.title")}
          </h2>
          <p data-reveal className="mt-4 text-muted">
            {t("landing.flow.intro")}
          </p>
        </div>
        <ol className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-5">
          {steps.map(([title, text], i) => (
            <li
              key={title}
              data-reveal
              className="flex flex-col gap-3 bg-surface p-5"
            >
              <span className="num text-sm font-semibold text-faint">
                {i + 1}
              </span>
              <StatusBadge
                kind={FLOW[i][0]}
                value={FLOW[i][1]}
                className="self-start"
              />
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
        <p data-reveal className="mt-4 text-xs text-faint">
          {t("landing.flow.note")}
        </p>
      </div>
    </section>
  );
}

/* ---------- roles: what each person sees (illustrative interface, no real data) ---------- */

function Bar({ w }: { w: string }) {
  return (
    <span
      aria-hidden
      className="block h-2.5 rounded-full bg-surface-3"
      style={{ width: w }}
    />
  );
}

function PreviewFrame({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <figure
      className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5"
      aria-label={label}
    >
      <div aria-hidden className="space-y-3">
        {children}
      </div>
      <figcaption className="mt-4 border-t border-line pt-3 text-xs text-faint">
        {label}
      </figcaption>
    </figure>
  );
}

function RolePreview({
  role,
}: {
  role: "tenant" | "owner" | "staff" | "admin";
}) {
  const { t } = useI18n();
  const label = t("landing.roles.sample");
  const fakeBtn =
    "pointer-events-none inline-flex h-8 items-center rounded-control px-3 text-xs font-medium";
  if (role === "tenant")
    return (
      <PreviewFrame label={label}>
        {(
          [
            ["rentalRequest", "APPROVED"],
            ["lease", "ACTIVE"],
            ["maintenance", "IN_PROGRESS"],
          ] as [BadgeKind, string][]
        ).map(([k, v], i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 rounded-control border border-line p-3"
          >
            <div className="w-1/2 space-y-2">
              <Bar w="70%" />
              <Bar w="45%" />
            </div>
            <StatusBadge kind={k} value={v} />
          </div>
        ))}
      </PreviewFrame>
    );
  if (role === "owner")
    return (
      <PreviewFrame label={label}>
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line p-3"
          >
            <div className="w-2/5 space-y-2">
              <Bar w="75%" />
              <Bar w="50%" />
            </div>
            <div className="flex gap-2">
              <span className={cn(fakeBtn, "bg-primary text-on-primary")}>
                {t("rr.approve")}
              </span>
              <span className={cn(fakeBtn, "border border-line-strong")}>
                {t("rr.reject")}
              </span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-control bg-surface-2 p-3 text-sm">
          <span>{t("nav.leases")}</span>
          <StatusBadge kind="lease" value="PENDING" />
        </div>
      </PreviewFrame>
    );
  if (role === "staff")
    return (
      <PreviewFrame label={label}>
        <div className="space-y-3 rounded-control border border-line p-4">
          <div className="flex items-center justify-between">
            <StatusBadge kind="priority" value="URGENT" />
            <StatusBadge kind="maintenance" value="ASSIGNED" />
          </div>
          <Bar w="80%" />
          <Bar w="55%" />
          <span className={cn(fakeBtn, "bg-primary text-on-primary")}>
            {t("mnt.start")}
          </span>
        </div>
      </PreviewFrame>
    );
  return (
    <PreviewFrame label={label}>
      <div className="flex items-center justify-between gap-4 rounded-control border border-line p-3">
        <div className="w-1/2 space-y-2">
          <Bar w="65%" />
          <Bar w="40%" />
        </div>
        <div className="flex items-center gap-3">
          <Tag>{t("e.role.OWNER")}</Tag>
          <Switch checked label="" onCheckedChange={() => {}} disabled />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Tag>{t("e.audit.OWNER_VERIFICATION_CHANGED")}</Tag>
        <Tag>{t("e.audit.LEASE_ACTIVATED")}</Tag>
        <Tag>{t("e.audit.UNIT_UPDATED")}</Tag>
      </div>
    </PreviewFrame>
  );
}

const ROLE_TABS = ["tenant", "owner", "staff", "admin"] as const;

export function RolesSection() {
  const { t, raw } = useI18n();
  const [tab, setTab] = useState<(typeof ROLE_TABS)[number]>("tenant");
  const name: Record<(typeof ROLE_TABS)[number], string> = {
    tenant: t("landing.tenants"),
    owner: t("landing.owners"),
    staff: t("landing.staff"),
    admin: t("landing.roles.adminName"),
  };
  return (
    <section id="roles" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 data-reveal className="max-w-2xl text-3xl font-bold sm:text-4xl">
          {t("landing.whoTitle")}
        </h2>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as typeof tab)}
          className="mt-10"
        >
          <TabList className="scroll-x">
            {ROLE_TABS.map((r) => (
              <TabTrigger key={r} value={r}>
                {name[r]}
              </TabTrigger>
            ))}
          </TabList>
          {ROLE_TABS.map((r) => (
            <TabContent
              key={r}
              value={r}
              className="grid grid-cols-1 items-start gap-10 outline-none lg:grid-cols-[1.1fr_0.9fr]"
            >
              <div>
                <p className="max-w-lg text-lg text-muted">
                  {t(
                    r === "admin"
                      ? "landing.roles.adminText"
                      : `landing.${r === "tenant" ? "tenantsText" : r === "owner" ? "ownersText" : "staffText"}`,
                  )}
                </p>
                <ul className="mt-6 space-y-3">
                  {raw<string[]>(`landing.roles.${r}`).map((x) => (
                    <li key={x} className="flex items-start gap-3 text-sm">
                      <CheckCircle2
                        className="mt-0.5 size-4.5 shrink-0 text-[var(--green-dot)]"
                        aria-hidden
                      />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <RolePreview role={r} />
            </TabContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

/* ---------- trust: only things the platform really does ---------- */

const TRUST_ICONS = [KeyRound, UserCheck, ScrollText, Eye];

export function TrustSection() {
  const { t, raw } = useI18n();
  const items = raw<string[][]>("landing.trust.items");
  return (
    <section className="border-y border-line bg-surface-2/50 py-24">
      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <ShieldCheck
            data-reveal
            className="mb-4 size-9 text-accent"
            aria-hidden
          />
          <h2 data-reveal className="text-3xl font-bold sm:text-4xl">
            {t("landing.trust.title")}
          </h2>
          <p data-reveal className="mt-4 max-w-sm text-muted">
            {t("landing.trust.intro")}
          </p>
        </div>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
          {items.map(([title, text], i) => {
            const Icon = TRUST_ICONS[i] ?? ShieldCheck;
            return (
              <div key={title} data-reveal>
                <dt className="flex items-center gap-2.5 text-base font-semibold">
                  <Icon
                    className="size-[1.15rem] text-accent-ink dark:text-accent"
                    aria-hidden
                  />
                  {title}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted">
                  {text}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

export function HeroPhoto() {
  const { t } = useI18n();
  return (
    <Photo
      name="hero-residential"
      variant="villa"
      alt={t("landing.alt.hero")}
      eager
      className="aspect-[4/5] w-full rounded-sheet border border-line shadow-pop sm:aspect-[5/4] lg:aspect-[4/5]"
    />
  );
}

export function CtaLink() {
  const { t } = useI18n();
  return (
    <Link
      to={paths.register}
      className="tap-area inline-flex items-center gap-1 font-medium underline"
    >
      {t("landing.ctaStart")}
      <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
    </Link>
  );
}
export { Button };
