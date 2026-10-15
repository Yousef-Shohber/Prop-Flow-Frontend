import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Photo } from "@/components/ui/Photo";
import { useI18n } from "@/i18n";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { paths } from "@/routes/paths";
import type { UserRole } from "@/types/enums";

/** Closing banner: a photo that slowly settles as it scrolls into view, with the role's next best action. */
export function HomeCta({ role }: { role: UserRole }) {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);
  const target: Record<UserRole, [string, string]> = {
    TENANT: [t("home.ctaTenant"), paths.properties],
    OWNER: [t("home.ctaOwner2"), paths.propertyNew],
    ADMIN: [t("home.ctaAdmin2"), paths.dashboard],
    MAINTENANCE_STAFF: [t("home.ctaStaff"), paths.maintenance],
  };
  const [label, to] = target[role];

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      gsap.fromTo(
        "[data-cta-photo]",
        { scale: 1.2 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top bottom",
            end: "bottom 45%",
            scrub: true,
          },
        },
      );
      gsap.from("[data-cta-copy] > *", {
        opacity: 0,
        y: 22,
        duration: 0.7,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 78%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-labelledby="home-cta-title"
      className="hero-navy grain relative isolate grid overflow-hidden rounded-sheet border border-white/10 text-white lg:grid-cols-2"
    >
      <div data-cta-copy className="px-6 py-10 sm:px-10 sm:py-14 lg:py-20">
        <h2
          id="home-cta-title"
          className="text-2xl font-bold sm:text-4xl sm:leading-tight"
        >
          {t(`home.endCta.${role}.title`)}
        </h2>
        <p className="mt-3 max-w-md text-base text-white/80 sm:text-lg">
          {t(`home.endCta.${role}.text`)}
        </p>
        <div className="mt-7">
          <Button
            to={to}
            variant="accent"
            size="lg"
            icon={
              <ArrowRight
                className="order-last size-4 rtl:rotate-180"
                aria-hidden
              />
            }
          >
            {label}
          </Button>
        </div>
      </div>
      <div
        aria-hidden
        className="relative order-first h-56 overflow-hidden [mask-image:linear-gradient(to_top,transparent,black_55%)] lg:order-last lg:h-auto lg:min-h-80 lg:[mask-image:linear-gradient(to_right,transparent,black_50%)] rtl:lg:[mask-image:linear-gradient(to_left,transparent,black_50%)]"
      >
        <div data-cta-photo className="absolute inset-0">
          <Photo
            name="cta-skyline"
            variant="tower"
            alt=""
            className="size-full"
          />
        </div>
      </div>
    </section>
  );
}
