import {
  Bell,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  Globe2,
  Images,
  LayoutDashboard,
  Moon,
  Search,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tabs, TabContent, TabList, TabTrigger } from "@/components/ui/Tabs";
import { useEnumLabel, useI18n } from "@/i18n";
import { TYPE_PHOTO } from "@/lib/photos";
import { paths } from "@/routes/paths";
import type { PropertyType } from "@/types/enums";

/* ---------- benefits: what you get, stated without invented numbers ---------- */

const BENEFIT_ICONS = [ClipboardCheck, Globe2, Users, Images, Moon, Bell];

export function BenefitsSection() {
  const { t, raw } = useI18n();
  const items = raw<string[][]>("landing.benefits.items");
  return (
    <section className="py-20 sm:py-24" aria-labelledby="benefits-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2
            id="benefits-title"
            data-reveal
            className="text-3xl font-bold sm:text-4xl"
          >
            {t("landing.benefits.title")}
          </h2>
          <p data-reveal className="mt-4 text-muted">
            {t("landing.benefits.intro")}
          </p>
        </div>
        <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(([title, text], i) => {
            const Icon = BENEFIT_ICONS[i] ?? CheckCircle2;
            return (
              <li
                key={title}
                data-reveal
                className="group rounded-card border border-line bg-surface p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-card"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {text}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- product tour: three illustrative screens (never real data) ---------- */

function Bar({ w, className = "" }: { w: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`block h-2.5 rounded-full bg-surface-3 ${className}`}
      style={{ width: w }}
    />
  );
}

function Frame({
  caption,
  children,
}: {
  caption: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <figure className="overflow-hidden rounded-sheet border border-line bg-surface shadow-pop">
      <div
        aria-hidden
        className="flex items-center gap-1.5 border-b border-line bg-surface-2 px-4 py-3"
      >
        <span className="size-2.5 rounded-full bg-[var(--red-dot)]/70" />
        <span className="size-2.5 rounded-full bg-[var(--amber-dot)]/70" />
        <span className="size-2.5 rounded-full bg-[var(--green-dot)]/70" />
        <span className="ms-4 h-5 max-w-56 flex-1 rounded-md bg-surface-3" />
      </div>
      <div aria-hidden className="bg-bg/60 p-4 sm:p-6">
        {children}
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-xs text-muted">
        <span>{caption}</span>
        <span className="text-faint">{t("landing.roles.sample")}</span>
      </figcaption>
    </figure>
  );
}

const SHOW: PropertyType[] = ["BUILDING", "VILLA", "STUDIO"];

function DiscoverMock() {
  const { t } = useI18n();
  const label = useEnumLabel();
  return (
    <>
      <div className="flex items-center gap-3 rounded-control border border-line bg-surface p-2.5 ps-4 shadow-soft">
        <Search className="size-4 text-faint" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm text-faint">
          {t("discover.keywordPlaceholder")}
        </span>
        <span className="rounded-control bg-primary px-4 py-2 text-xs font-medium text-on-primary">
          {t("discover.submit")}
        </span>
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {SHOW.map((v) => (
          <li
            key={v}
            className="overflow-hidden rounded-card border border-line bg-surface"
          >
            <Photo
              name={TYPE_PHOTO[v].photo}
              variant={TYPE_PHOTO[v].variant}
              alt=""
              className="aspect-[4/3] w-full"
            />
            <div className="space-y-2 p-3">
              <span className="text-xs font-semibold">{label("ptype", v)}</span>
              <Bar w="75%" />
              <Bar w="50%" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function DashboardMock() {
  const { t } = useI18n();
  const stats: [typeof Building2, string][] = [
    [Building2, t("dashboard.totalProperties")],
    [DoorOpen, t("dashboard.totalUnits")],
    [ClipboardCheck, t("dashboard.activeLeases")],
    [Wrench, t("dashboard.openMaint")],
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.1fr]">
      <div className="grid grid-cols-2 gap-3">
        {stats.map(([Icon, text]) => (
          <div
            key={text}
            className="space-y-2 rounded-card border border-line bg-surface p-3.5"
          >
            <Icon className="size-4 text-accent-ink" aria-hidden />
            <p className="truncate text-xs text-muted">{text}</p>
            <Bar w="40%" className="h-4" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 rounded-card border border-line bg-surface p-4">
        <svg
          viewBox="0 0 100 100"
          className="size-24 shrink-0 -rotate-90"
          aria-hidden
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth="11"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray="251"
            strokeDashoffset="85"
          />
        </svg>
        <div className="min-w-0 flex-1 space-y-2.5">
          <p className="text-xs font-semibold">{t("dashboard.occupancy")}</p>
          <Bar w="90%" />
          <Bar w="70%" />
          <Bar w="55%" />
        </div>
      </div>
    </div>
  );
}
const STEPS = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED"] as const;
function MaintenanceMock() {
  return (
    <ol className="relative space-y-3 ps-8">
      <span
        aria-hidden
        className="absolute inset-y-2 start-[0.6rem] w-px bg-line-strong"
      />
      {STEPS.map((s) => (
        <li
          key={s}
          className="relative flex items-center justify-between gap-4 rounded-card border border-line bg-surface p-3.5"
        >
          <span
            aria-hidden
            className="absolute -start-[1.6rem] top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-bg bg-accent"
          />
          <div className="w-1/2 space-y-2">
            <Bar w="75%" />
            <Bar w="45%" />
          </div>
          <StatusBadge kind="maintenance" value={s} />
        </li>
      ))}
    </ol>
  );
}

export function ProductTour() {
  const { t, raw } = useI18n();
  const tabs = raw<string[]>("landing.tour.tabs");
  const captions = raw<string[]>("landing.tour.captions");
  const [tab, setTab] = useState("0");
  const icons = [Search, LayoutDashboard, Wrench];

  return (
    <section
      id="tour"
      className="border-y border-line bg-surface-2/50 py-20 sm:py-24"
      aria-labelledby="tour-title"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2
            id="tour-title"
            data-reveal
            className="text-3xl font-bold sm:text-4xl"
          >
            {t("landing.tour.title")}
          </h2>
          <p data-reveal className="mt-4 text-muted">
            {t("landing.tour.intro")}
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-10">
          <TabList className="scroll-x">
            {tabs.map((name, i) => {
              const Icon = icons[i];

              return (
                <TabTrigger key={name} value={String(i)}>
                  <span className="inline-flex items-center gap-2">
                    <Icon className="size-4" aria-hidden />
                    {name}
                  </span>
                </TabTrigger>
              );
            })}
          </TabList>

          {[DiscoverMock, DashboardMock, MaintenanceMock].map((Mock, i) => (
            <TabContent key={i} value={String(i)} className="outline-none">
              <Frame caption={captions[i]}>
                <Mock />
              </Frame>
            </TabContent>
          ))}
        </Tabs>

        <div
          data-reveal
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button to={paths.register} size="lg">
            {t("landing.ctaStart")}
          </Button>

          <Button to={paths.login} variant="secondary" size="lg">
            {t("landing.ctaLogin")}
          </Button>
        </div>
      </div>
    </section>
  );
}
