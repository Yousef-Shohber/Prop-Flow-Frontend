import { useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n";
import { paths } from "@/routes/paths";
import { Banner } from "../ui/Misc";
import { Button } from "../ui/Button";
import { ErrorBoundary } from "../ui/ErrorBoundary";
import { CommandPalette } from "./CommandPalette";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

/** Route change: content eases in. Skipped for reduced-motion and for query-string-only changes. */
function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return;
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.42,
          ease: "power3.out",
          clearProps: "transform,opacity",
        },
      );
    },
    { dependencies: [pathname], scope: ref },
  );
  return <div ref={ref}>{children}</div>;
}

export function AppShell() {
  const { user } = useAuth();
  const t = useT();
  const { pathname } = useLocation();
  const showBanner = /^\/(home|dashboard|properties|units)(\/|$)/.test(
    pathname,
  );
  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="skip-link">
        {t("a11y.skip")}
      </a>
      <CommandPalette />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1320px] flex-1 px-4 pb-16 pt-6 outline-none sm:px-6 lg:px-8 lg:pt-8"
        >
          {showBanner && user?.role === "OWNER" && !user.ownerVerified && (
            <Banner
              className="mb-6"
              title={t("layout.unverifiedTitle")}
              action={
                <Button size="sm" variant="secondary" to={paths.profile}>
                  {t("nav.profile")}
                </Button>
              }
            >
              {t("layout.unverified")}
            </Banner>
          )}
          <ErrorBoundary key={pathname}>
            <PageTransition>
              <Outlet />
            </PageTransition>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export { Link };
