import { useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { useT } from "@/i18n";
import { Logo } from "@/components/layout/Logo";
import { LangToggle, ThemeToggle } from "@/components/layout/Toggles";
import { BuildingScene } from "@/features/landing/BuildingScene";
import { cn } from "@/lib/utils";

type AuthLayoutProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "login" | "register";
};

/** Split screen: the form on the reading side, a quiet animated facade on the other. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  variant = "login",
}: AuthLayoutProps) {
  const t = useT();
  const card = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !card.current) return;

      gsap.from(card.current.children, {
        opacity: 0,
        y: 18,
        duration: 0.55,
        ease: "power3.out",
        stagger: 0.07,
      });
    },
    { scope: card },
  );

  return (
    <div className="grid grid-cols-1 min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      {/* Form */}
      <div className="flex flex-col px-5 py-5 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="PropFlow">
            <Logo />
          </Link>

          <div className="flex items-center gap-1">
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>

        <main
          id="main"
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10"
        >
          <div ref={card}>
            <h1 className="text-[1.75rem] font-semibold sm:text-3xl">
              {title}
            </h1>

            {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}

            <div className="mt-8">{children}</div>

            {footer && (
              <div className="mt-8 text-center text-sm text-muted">
                {footer}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Illustration */}
      <aside
        aria-hidden="true"
        className="relative hidden bg-[#1d2b5f] dark:bg-[#111a33] lg:block"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_30%_20%,rgb(255_255_255/0.10),transparent)]" />

        <div
          className={cn(
            "relative p-12",
            variant === "login" && "flex h-full flex-col justify-end",
            variant === "register" && "min-h-full",
          )}
        >
          <div className={cn(variant === "register" && "sticky top-6")}>
            <BuildingScene
              className="mx-auto w-full max-w-md"
              tone="onPrimary"
              cols={6}
              rows={7}
            />

            <p className="mt-10 max-w-sm text-lg font-medium leading-relaxed text-white/90">
              {t("landing.heroTitle")}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
