import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  Bell,
  Check,
  Building2,
  CalendarRange,
  ChevronDown,
  ClipboardCheck,
  Download,
  FileDown,
  FileSignature,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  Plus,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { PublicFooter } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/Button";
import Magnet from "@/components/reactbits/Magnet";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import {
  gsap,
  prefersReducedMotion,
  ScrollTrigger,
  useSmoothScroll,
} from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ROLE_HOME, paths } from "@/routes/paths";
import { BuildingScene, StatusLegend } from "./BuildingScene";
import { LandingHeader } from "./LandingHeader";
import { BenefitsSection, ProductTour } from "./LandingExtras";
import {
  FlowSection,
  HeroPhoto,
  ProblemSection,
  RolesSection,
  SpacesSection,
  TrustSection,
} from "./LandingSections";
import { Photo } from "@/components/ui/Photo";

function Faq({
  q,
  a,
  open,
  onToggle,
  id,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <div className="border-b border-line">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-p`}
          id={`${id}-b`}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-6 py-5 text-start text-base font-semibold transition-colors hover:text-accent-ink dark:hover:text-accent"
        >
          {q}
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-faint transition-transform duration-300",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </h3>
      <div
        id={`${id}-p`}
        role="region"
        aria-labelledby={`${id}-b`}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <p className="max-w-2xl pb-5 text-sm leading-relaxed text-muted">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

const FEATURE_ICONS = {
  units: Building2,
  requests: ClipboardCheck,
  leases: FileSignature,
  maintenance: Wrench,
  notifications: Bell,
  dashboard: LayoutDashboard,
  timeline: CalendarRange,
  rentroll: FileSpreadsheet,
  pdf: FileDown,
  export: Download,
  roles: Users,
  audit: History,
  security: ShieldCheck,
} as const;

export default function LandingPage() {
  const { t, raw, lang } = useI18n();
  const { user } = useAuth();
  const root = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  useSmoothScroll(true);
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  useGSAP(
    () => {
      const reduce = prefersReducedMotion();
      if (reduce) return;
      // headline: word by word (never per letter: Arabic letters must stay joined)
      gsap.from("[data-hero-word]", {
        yPercent: 110,
        opacity: 0,
        duration: 0.8,
        ease: "power4.out",
        stagger: 0.07,
        delay: 0.1,
      });
      gsap.from("[data-hero-fade]", {
        opacity: 0,
        y: 18,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.55,
      });
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 28,
          duration: 0.7,
          ease: "power3.out",
          clearProps: "all",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>("[data-line]").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleY: 0 },
          {
            scaleY: 1,
            transformOrigin: "top",
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement,
              start: "top 70%",
              end: "bottom 70%",
              scrub: true,
            },
          },
        );
      });
      return () => ScrollTrigger.getAll().forEach((s) => s.kill());
    },
    { scope: root, dependencies: [lang] },
  );

  const features = Object.entries(raw<Record<string, string[]>>("landing.f"));
  const tenantSteps = raw<string[]>("landing.tenantSteps");
  const ownerSteps = raw<string[]>("landing.ownerSteps");
  const faq = raw<string[][]>("landing.faq");
  const words = t("landing.heroTitle").split(" ");

  return (
    <div ref={root} className="overflow-x-clip">
      <a href="#main" className="skip-link">
        {t("a11y.skip")}
      </a>
      <LandingHeader />

      <main id="main">
        {/* ---------- hero ---------- */}
        <section className="relative isolate pt-28 sm:pt-32 lg:pt-36">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 -z-10 h-[46rem] bg-[radial-gradient(60%_50%_at_75%_30%,var(--accent-soft),transparent_70%)] opacity-80 rtl:[background-position:left]"
          />
          <div className="mx-auto grid grid-cols-1 max-w-6xl items-center gap-12 px-4 pb-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:pb-28">
            <div>
              <p
                data-hero-fade
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-medium text-muted"
              >
                <span className="size-1.5 rounded-full bg-[var(--green-dot)]" />
                {t("app.tagline")}
              </p>
              <h1
                className="text-[2.6rem] font-bold leading-[1.15] sm:text-6xl lg:text-[4.1rem] lg:leading-[1.08]"
                aria-label={t("landing.heroTitle")}
              >
                {words.map((w, i) => (
                  <span
                    key={i}
                    className="inline-block overflow-hidden pb-[0.12em] align-bottom"
                  >
                    <span data-hero-word className="inline-block" aria-hidden>
                      {w}
                      {i < words.length - 1 ? "\u00A0" : ""}
                    </span>
                  </span>
                ))}
              </h1>
              <p
                data-hero-fade
                className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
              >
                {t("landing.heroText")}
              </p>
              <div
                data-hero-fade
                className="mt-9 flex flex-wrap items-center gap-3"
              >
                <Magnet padding={60} magnetStrength={3}>
                  <Button
                    to={user ? ROLE_HOME[user.role] : paths.register}
                    size="lg"
                    icon={
                      <ArrowRight className="size-4.5 rtl:rotate-180 order-last" />
                    }
                  >
                    {user ? t("nav.dashboard") : t("landing.ctaStart")}
                  </Button>
                </Magnet>
                {!user && (
                  <Button to={paths.login} variant="secondary" size="lg">
                    {t("landing.ctaLogin")}
                  </Button>
                )}
              </div>
              <ul
                data-hero-fade
                className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted"
              >
                {raw<string[]>("landing.heroPoints").map((p) => (
                  <li key={p} className="inline-flex items-center gap-2">
                    <Check
                      className="size-4 text-[var(--green-dot)]"
                      aria-hidden
                    />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div
              data-hero-fade
              className="relative mx-auto w-full max-w-md pb-10 lg:max-w-none lg:pb-0 lg:pe-6"
            >
              <HeroPhoto />
              <div className="absolute -bottom-0 start-4 w-[62%] max-w-[17rem] rounded-card border border-line bg-surface/95 p-4 shadow-pop backdrop-blur-sm sm:start-6 lg:-start-8 lg:bottom-8">
                <BuildingScene className="mx-auto w-full" cols={5} rows={4} />
                <p className="mt-3 text-xs font-semibold">
                  {t("landing.legendTitle")}
                </p>
                <StatusLegend
                  labels={{
                    available: t("e.unit.AVAILABLE"),
                    rented: t("e.unit.RENTED"),
                    maintenance: t("e.unit.MAINTENANCE"),
                  }}
                />
                <p className="mt-2 text-[0.6875rem] text-faint">
                  {t("landing.legendNote")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <ProblemSection />
        <BenefitsSection />
        <ProductTour />
        <SpacesSection />
        <FlowSection />
        <RolesSection />

        {/* ---------- features ---------- */}
        <section id="features" className="py-24">
          <div className="mx-auto grid grid-cols-1 max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <h2 data-reveal className="text-3xl font-bold sm:text-4xl">
                {t("landing.featuresTitle")}
              </h2>
              <p data-reveal className="mt-4 max-w-sm text-muted">
                {t("landing.featuresIntro")}
              </p>
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {features.map(([key, [title, text]]) => {
                const Icon =
                  FEATURE_ICONS[key as keyof typeof FEATURE_ICONS] ?? Plus;
                return (
                  <li key={key} data-reveal className="group flex gap-5 py-6">
                    <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">
                        {text}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <TrustSection />

        {/* ---------- how ---------- */}
        <section id="how" className="bg-surface-2/50 py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 data-reveal className="text-3xl font-bold sm:text-4xl">
              {t("landing.howTitle")}
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-14 md:grid-cols-2">
              {[
                { title: t("landing.howTenant"), steps: tenantSteps },
                { title: t("landing.howOwner"), steps: ownerSteps },
              ].map((col) => (
                <div key={col.title}>
                  <h3
                    data-reveal
                    className="mb-6 text-lg font-semibold text-accent-ink dark:text-accent"
                  >
                    {col.title}
                  </h3>
                  <ol className="relative space-y-7 ps-12">
                    <span
                      aria-hidden
                      className="absolute inset-y-1 start-[1.1rem] w-px bg-line"
                    />
                    <span
                      aria-hidden
                      data-line
                      className="absolute inset-y-1 start-[1.1rem] w-px origin-top bg-accent"
                    />
                    {col.steps.map((s, i) => (
                      <li key={i} data-reveal className="relative">
                        <span className="num absolute -start-12 top-0 flex size-9 items-center justify-center rounded-full border border-line-strong bg-bg text-sm font-semibold">
                          {i + 1}
                        </span>
                        <p className="pt-1.5 text-base font-medium">{s}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- faq ---------- */}
        <section id="faq" className="py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 data-reveal className="mb-8 text-3xl font-bold sm:text-4xl">
              {t("landing.faqTitle")}
            </h2>
            <div data-reveal className="border-t border-line">
              {faq.map(([q, a], i) => (
                <Faq
                  key={i}
                  id={`faq-${i}`}
                  q={q}
                  a={a}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ---------- cta ---------- */}
        <section className="px-4 pb-24 sm:px-6">
          <div
            data-reveal
            className="grain relative isolate mx-auto max-w-6xl overflow-hidden rounded-sheet bg-[#1d2b5f] px-6 py-16 text-center text-white dark:bg-[#18213f] sm:px-12"
          >
            <Photo
              name="cta-skyline"
              variant="tower"
              alt=""
              className="pointer-events-none absolute inset-0 z-0 size-full opacity-25"
            />

            <div
              aria-hidden
              className="pointer-events-none absolute -end-10 -top-16 z-0 size-64 rounded-full bg-[#f0b04a]/20 blur-3xl"
            />

            <div className="relative z-10">
              <h2 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">
                {t("landing.ctaTitle")}
              </h2>

              <p className="mx-auto mt-4 max-w-lg text-white/75">
                {t("landing.ctaText")}
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button
                  to={user ? ROLE_HOME[user.role] : paths.register}
                  variant="accent"
                  size="lg"
                >
                  {user ? t("nav.dashboard") : t("landing.ctaStart")}
                </Button>

                {!user && (
                  <Button
                    to={paths.login}
                    size="lg"
                    className="border border-white/25 bg-transparent text-white shadow-none hover:bg-white/10"
                  >
                    {t("landing.ctaLogin")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
