import * as RD from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/layout/Logo";
import { LangToggle, ThemeToggle } from "@/components/layout/Toggles";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { ROLE_HOME, paths } from "@/routes/paths";

/** Section anchors of the public page; shared by the header, the mobile menu and the footer. */
export const LANDING_LINKS = [
  { href: "#tour", key: "landing.tourNav" },
  { href: "#roles", key: "landing.whoNav" },
  { href: "#features", key: "nav.features" },
  { href: "#how", key: "nav.how" },
  { href: "#faq", key: "nav.faq" },
] as const;

/** Fixed header: transparent over the hero, frosted once the page scrolls; full navigation in a sheet on small screens. */
export function LandingHeader() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 16);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const account = user ? (
    <Button to={ROLE_HOME[user.role]} size="sm" className="ms-1.5">
      {t("nav.dashboard")}
    </Button>
  ) : (
    <>
      <Button
        to={paths.login}
        variant="ghost"
        size="sm"
        className="hidden sm:inline-flex"
      >
        {t("nav.login")}
      </Button>
      <Button to={paths.register} size="sm" className="ms-1.5">
        {t("nav.register")}
      </Button>
    </>
  );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-30 border-b transition-colors duration-300",
        scrolled
          ? "border-line bg-bg/85 backdrop-blur-md"
          : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" aria-label="PropFlow">
          <Logo />
        </Link>
        <nav
          className="hidden items-center gap-7 text-sm font-medium text-muted lg:flex"
          aria-label={t("a11y.mainNav")}
        >
          {LANDING_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="tap-area transition-colors hover:text-ink"
            >
              {t(l.key)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <LangToggle />
          <ThemeToggle />
          {account}
          <RD.Root open={open} onOpenChange={setOpen}>
            <RD.Trigger asChild>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-control text-ink hover:bg-surface-2 lg:hidden"
                aria-label={t("a11y.menu")}
              >
                <Menu className="size-5" />
              </button>
            </RD.Trigger>
            <RD.Portal>
              <RD.Overlay
                className="fixed inset-0 z-50 bg-[#0a1020]/55 lg:hidden"
                style={{ animation: "fade-in .18s ease-out" }}
              />
              <RD.Content
                aria-describedby={undefined}
                className="fixed inset-y-0 end-0 z-50 flex w-[19rem] max-w-[88vw] flex-col bg-bg shadow-pop focus:outline-none lg:hidden"
                style={{
                  animation: `${lang === "ar" ? "sheet-in-start" : "sheet-in-end"} .24s cubic-bezier(.2,.8,.2,1)`,
                }}
              >
                <div className="flex h-[4.25rem] items-center justify-between px-5">
                  <RD.Title className="sr-only">{t("a11y.mainNav")}</RD.Title>
                  <Logo />
                  <RD.Close
                    className="rounded-lg p-2 text-muted hover:bg-surface-2"
                    aria-label={t("a11y.closeMenu")}
                  >
                    <X className="size-5" />
                  </RD.Close>
                </div>
                <nav
                  aria-label={t("a11y.mainNav")}
                  className="flex flex-col gap-1 px-3 pt-2"
                >
                  {LANDING_LINKS.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="rounded-control px-3 py-3 text-base font-medium hover:bg-surface-2"
                    >
                      {t(l.key)}
                    </a>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-2.5 border-t border-line p-5">
                  {user ? (
                    <Button to={ROLE_HOME[user.role]} size="lg">
                      {t("nav.dashboard")}
                    </Button>
                  ) : (
                    <>
                      <Button to={paths.register} size="lg">
                        {t("landing.ctaStart")}
                      </Button>
                      <Button to={paths.login} variant="secondary" size="lg">
                        {t("nav.login")}
                      </Button>
                    </>
                  )}
                </div>
              </RD.Content>
            </RD.Portal>
          </RD.Root>
        </div>
      </div>
    </header>
  );
}
