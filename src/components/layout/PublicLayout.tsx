import { Link, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n";
import { env } from "@/lib/env";
import { ROLE_HOME, paths } from "@/routes/paths";
import { Button } from "../ui/Button";
import { Logo } from "./Logo";
import { waDigits, waLink } from "./ContactLinks";
import { LangToggle, ThemeToggle } from "./Toggles";

export function PublicHeader({ transparent }: { transparent?: boolean }) {
  const t = useT();
  const { user } = useAuth();
  return (
    <header
      className={
        transparent ? "absolute inset-x-0 top-0 z-20" : "border-b border-line"
      }
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link to="/" aria-label="PropFlow">
          <Logo />
        </Link>
        <div className="flex items-center gap-1.5">
          <LangToggle />
          <ThemeToggle />
          {user ? (
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
          )}
        </div>
      </div>
    </header>
  );
}

const FOOTER_ANCHORS = [
  { hash: "#features", key: "nav.features" },
  { hash: "#roles", key: "landing.whoNav" },
  { hash: "#how", key: "nav.how" },
  { hash: "#faq", key: "nav.faq" },
] as const;

export function PublicFooter() {
  const t = useT();
  const { user } = useAuth();
  const col = "space-y-2.5 text-sm";
  const link = "tap-area text-muted transition-colors hover:text-ink";
  const head = "mb-3 text-sm font-semibold";
  return (
    <footer className="border-t border-line bg-surface-2/40">
      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {t("landing.footer.blurb")}
          </p>
          <div className="mt-5 flex items-center gap-1.5">
            <LangToggle />
            <ThemeToggle />
          </div>
        </div>
        <nav aria-label={t("landing.footer.product")}>
          <h2 className={head}>{t("landing.footer.product")}</h2>
          <ul className={col}>
            {FOOTER_ANCHORS.map((a) => (
              <li key={a.hash}>
                <Link className={link} to={{ pathname: "/", hash: a.hash }}>
                  {t(a.key)}
                </Link>
              </li>
            ))}
            <li>
              <Link className={link} to={paths.help}>
                {t("nav.help")}
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label={t("landing.footer.account")}>
          <h2 className={head}>{t("landing.footer.account")}</h2>
          <ul className={col}>
            {user ? (
              <li>
                <Link className={link} to={ROLE_HOME[user.role]}>
                  {t("nav.dashboard")}
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link className={link} to={paths.login}>
                    {t("nav.login")}
                  </Link>
                </li>
                <li>
                  <Link className={link} to={paths.register}>
                    {t("nav.register")}
                  </Link>
                </li>
                <li>
                  <Link className={link} to={paths.forgotPassword}>
                    {t("landing.footer.forgot")}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        <nav aria-label={t("landing.footer.company")}>
          <h2 className={head}>{t("landing.footer.company")}</h2>
          <ul className={col}>
            <li>
              <Link className={link} to={paths.about}>
                {t("nav.about")}
              </Link>
            </li>
            {env.supportEmail && (
              <li>
                <a
                  className={link}
                  href={`mailto:${env.supportEmail}`}
                  dir="ltr"
                >
                  {env.supportEmail}
                </a>
              </li>
            )}
            {env.whatsapp && (
              <li>
                <a
                  className={link}
                  href={waLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                >
                  WhatsApp +{waDigits()}
                </a>
              </li>
            )}
          </ul>
        </nav>
        <nav aria-label={t("landing.footer.legal")}>
          <h2 className={head}>{t("landing.footer.legal")}</h2>
          <ul className={col}>
            <li>
              <Link className={link} to={paths.terms}>
                {t("nav.terms")}
              </Link>
            </li>
            <li>
              <Link className={link} to={paths.privacy}>
                {t("nav.privacy")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-faint sm:px-6">
          © {new Date().getFullYear()} PropFlow. {t("landing.footerNote")}
        </p>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
