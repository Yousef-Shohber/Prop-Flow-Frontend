import { ArrowRight, Building2, DoorOpen, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { Photo } from "@/components/ui/Photo";
import { useCatalogTotals } from "@/hooks/discover";
import { useI18n } from "@/i18n";
import { todayISO } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { paths } from "@/routes/paths";
import type { UserRole } from "@/types/enums";

type Part = "morning" | "afternoon" | "evening";
export const dayPart = (hour: number): Part =>
  hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

function HeroStat({
  to,
  icon: Icon,
  label,
  value,
  failed,
}: {
  to: string;
  icon: typeof Building2;
  label: string;
  value?: number;
  failed?: boolean;
}) {
  return (
    <li>
      <Link
        to={to}
        className="group flex min-w-40 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/15"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
          <Icon className="size-5" aria-hidden />
        </span>
        <span>
          <span className="num block font-display text-2xl font-semibold leading-none">
            {failed ? (
              <span aria-label="—">—</span>
            ) : value === undefined ? (
              <span
                className="inline-block h-6 w-10 animate-pulse rounded bg-white/20 align-middle"
                aria-hidden
              />
            ) : (
              <CountUp value={value} />
            )}
          </span>
          <span className="mt-1 block text-xs text-white/75">{label}</span>
        </span>
      </Link>
    </li>
  );
}

/** Decorative photo collage; real listing photos only ever appear on cards, so this stays aria-hidden. */
function Collage() {
  return (
    <div aria-hidden className="relative hidden h-72 lg:block">
      <Photo
        name="gallery-tower"
        variant="tower"
        alt=""
        eager
        className="absolute end-0 top-0 h-48 w-60 rounded-2xl border border-white/20 shadow-pop"
      />
      <Photo
        name="gallery-villa"
        variant="villa"
        alt=""
        eager
        className="absolute start-2 top-14 h-44 w-52 rounded-2xl border border-white/20 shadow-pop"
      />
      <Photo
        name="gallery-interior"
        variant="interior"
        alt=""
        className="float-slow absolute bottom-0 end-12 h-36 w-48 rounded-2xl border border-white/20 shadow-pop"
      />
      <span className="absolute -start-2 bottom-6 size-24 rounded-full bg-accent/30 blur-2xl" />
    </div>
  );
}

export function HomeHero({
  role,
  name,
  overlap,
}: {
  role: UserRole;
  name: string;
  overlap?: boolean;
}) {
  const { t, lang } = useI18n();
  const browse = role !== "MAINTENANCE_STAFF";
  const totals = useCatalogTotals(browse);
  const cta: Record<
    UserRole,
    { primary: [string, string]; secondary?: [string, string] }
  > = {
    TENANT: {
      primary: [t("home.ctaTenant"), paths.properties],
      secondary: [t("home.ctaTenant2"), paths.leases],
    },
    OWNER: {
      primary: [t("home.ctaOwner"), paths.leases],
      secondary: [t("home.ctaOwner2"), paths.propertyNew],
    },
    ADMIN: {
      primary: [t("home.ctaAdmin"), `${paths.users}?role=OWNER`],
      secondary: [t("home.ctaAdmin2"), paths.dashboard],
    },
    MAINTENANCE_STAFF: { primary: [t("home.ctaStaff"), paths.maintenance] },
  };
  const c = cta[role];
  return (
    <section
      data-rise
      aria-labelledby="home-title"
      className="hero-navy grain relative isolate overflow-hidden rounded-sheet border border-white/10 text-white"
    >
      <div
        className={`grid items-center gap-8 px-6 pt-9 sm:px-10 sm:pt-12 lg:grid-cols-[1.15fr_0.85fr] ${overlap ? "pb-24 sm:pb-28" : "pb-9 sm:pb-12"}`}
      >
        <div className="min-w-0">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
            <ShieldCheck className="size-3.5" aria-hidden />
            {t(`roles.${role}`)} · {formatDate(todayISO(), lang)}
          </p>
          <h1
            id="home-title"
            className="text-3xl font-bold sm:text-[2.6rem] sm:leading-[1.15]"
          >
            {t(`home.greeting.${dayPart(new Date().getHours())}`, { name })}
          </h1>
          <p className="mt-3 max-w-xl text-base text-white/80 sm:text-lg">
            {t(`home.sub.${role}`)}
          </p>
          <div
            className={`mt-7 flex-wrap gap-3 ${role === "TENANT" ? "hidden sm:flex" : "flex"}`}
          >
            <Button
              to={c.primary[1]}
              variant="accent"
              size="lg"
              icon={
                <ArrowRight
                  className="order-last size-4 rtl:rotate-180"
                  aria-hidden
                />
              }
            >
              {c.primary[0]}
            </Button>
            {c.secondary && (
              <Button
                to={c.secondary[1]}
                size="lg"
                className="border border-white/25 bg-transparent text-white shadow-none hover:bg-white/10"
              >
                {c.secondary[0]}
              </Button>
            )}
          </div>
          {browse && (
            <ul
              aria-label={t("home.statsAria")}
              className="mt-7 flex flex-wrap gap-3"
            >
              <HeroStat
                to={paths.properties}
                icon={Building2}
                label={
                  role === "OWNER"
                    ? t("home.stat.yourProperties")
                    : t("home.stat.properties")
                }
                value={totals.properties}
                failed={totals.isError && totals.properties === undefined}
              />
              <HeroStat
                to={`${paths.units}${role === "TENANT" ? "" : "?status=AVAILABLE"}`}
                icon={DoorOpen}
                label={t("home.stat.availableUnits")}
                value={totals.availableUnits}
                failed={totals.isError && totals.availableUnits === undefined}
              />
            </ul>
          )}
        </div>
        <Collage />
      </div>
    </section>
  );
}
