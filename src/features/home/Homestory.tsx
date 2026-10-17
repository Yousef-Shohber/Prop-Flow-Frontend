import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  Bell,
  Building2,
  CheckCheck,
  ClipboardList,
  FileSignature,
  LayoutDashboard,
  Play,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Photo, type SceneVariant } from "@/components/ui/Photo";
import { useI18n } from "@/i18n";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import type { PhotoName } from "@/lib/photos";
import type { UserRole } from "@/types/enums";

type Shot = { name: PhotoName; variant: SceneVariant; icon: LucideIcon };

/** Three illustrative photos + an icon per step, per role (copy lives in i18n: home.story.<ROLE>). */
const STEPS: Record<UserRole, Shot[]> = {
  TENANT: [
    { name: "hero-residential", variant: "villa", icon: Search },
    { name: "gallery-interior", variant: "interior", icon: FileSignature },
    { name: "gallery-villa", variant: "villa", icon: ShieldCheck },
  ],
  OWNER: [
    { name: "gallery-tower2", variant: "tower", icon: Building2 },
    { name: "gallery-commercial", variant: "street", icon: ClipboardList },
    { name: "gallery-tower", variant: "tower", icon: LayoutDashboard },
  ],
  ADMIN: [
    { name: "cta-skyline", variant: "tower", icon: ShieldCheck },
    { name: "gallery-tower", variant: "tower", icon: Users },
    { name: "gallery-commercial", variant: "street", icon: LayoutDashboard },
  ],
  MAINTENANCE_STAFF: [
    { name: "gallery-interior", variant: "interior", icon: Bell },
    { name: "gallery-tower2", variant: "tower", icon: Play },
    { name: "hero-residential", variant: "villa", icon: CheckCheck },
  ],
};

/**
 * Scroll storytelling for the home page: three steps, each with a large photograph that is revealed with a clip
 * and drifts slowly while you scroll (parallax), next to the step copy. Static for reduced-motion users.
 */
export function HomeStory({ role }: { role: UserRole }) {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      gsap.utils.toArray<HTMLElement>("[data-step]").forEach((step) => {
        const frame = step.querySelector("[data-frame]");
        const drift = step.querySelector("[data-drift]");
        const copy = step.querySelector("[data-copy]");
        if (frame)
          gsap.fromTo(
            frame,
            { clipPath: "inset(100% 0% 0% 0% round 24px)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 24px)",
              duration: 1.1,
              ease: "power3.out",
              clearProps: "clipPath",
              scrollTrigger: { trigger: step, start: "top 80%", once: true },
            },
          );
        if (drift)
          gsap.fromTo(
            drift,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: {
                trigger: step,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        if (copy)
          gsap.from(copy.children, {
            opacity: 0,
            y: 24,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: step, start: "top 75%", once: true },
          });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-labelledby="home-story-title"
      className="rounded-sheet border border-line bg-surface px-6 py-10 sm:px-10 sm:py-14"
    >
      <div className="max-w-2xl">
        <p className="mb-3 inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-ink">
          {t("home.story.eyebrow")}
        </p>
        <h2
          id="home-story-title"
          className="text-2xl font-bold sm:text-4xl sm:leading-tight"
        >
          {t(`home.story.${role}.title`)}
        </h2>
      </div>

      <ol className="mt-10 space-y-14 sm:mt-14 sm:space-y-24">
        {STEPS[role].map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={i}
              data-step
              className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-16"
            >
              <div
                data-frame
                className={`relative h-72 overflow-hidden rounded-3xl border border-line shadow-pop sm:h-96 ${i % 2 ? "lg:order-2" : ""}`}
              >
                <div data-drift className="absolute -inset-y-[8%] inset-x-0">
                  <Photo
                    name={s.name}
                    variant={s.variant}
                    alt=""
                    className="size-full"
                  />
                </div>
                <span className="absolute start-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#20334a] shadow-sm backdrop-blur">
                  <Icon className="size-4" aria-hidden />
                  {t("home.story.step", { n: i + 1 })}
                </span>
              </div>
              <div data-copy className="min-w-0">
                <span
                  aria-hidden
                  className="num block font-display text-6xl font-bold leading-none sm:text-7xl"
                  style={{
                    // decorative step number: fading fill rather than low-contrast text
                    backgroundImage:
                      "linear-gradient(to bottom, color-mix(in srgb, var(--accent) 45%, transparent), transparent 90%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-xl font-bold sm:text-2xl">
                  {t(`home.story.${role}.s${i + 1}.title`)}
                </h3>
                <p className="mt-3 max-w-md text-base text-muted sm:text-lg">
                  {t(`home.story.${role}.s${i + 1}.text`)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
