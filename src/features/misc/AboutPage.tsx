import { Mail, MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { PublicFooter, PublicHeader } from "@/components/layout/PublicLayout";
import {
  hasContactInfo,
  waDigits,
  waLink,
} from "@/components/layout/ContactLinks";
import { useI18n } from "@/i18n";
import { env } from "@/lib/env";
import { paths } from "@/routes/paths";

/** /about : who PropFlow is for, plus every contact channel that is configured. */
export default function AboutPage() {
  const { t, raw } = useI18n();
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);
  const principles = raw<string[][]>("about.principles");
  const rows = [
    env.supportEmail && {
      icon: Mail,
      label: t("about.email"),
      text: env.supportEmail,
      href: `mailto:${env.supportEmail}`,
      ltr: true,
    },
    env.whatsapp && {
      icon: MessageCircle,
      label: t("about.whatsapp"),
      text: `+${waDigits()}`,
      href: waLink(),
      ltr: true,
    },
  ].filter(Boolean) as {
    icon: typeof Mail;
    label: string;
    text: string;
    href?: string;
    ltr: boolean;
  }[];

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-14">
        <h1 className="text-3xl font-bold">{t("about.title")}</h1>
        <p className="mt-2 text-sm text-faint">{t("about.subtitle")}</p>
        <p className="mt-6 text-base leading-relaxed text-muted">
          {t("about.intro")}
        </p>

        <section className="mt-12" aria-labelledby="about-how">
          <h2 id="about-how" className="text-xl font-semibold">
            {t("about.principlesTitle")}
          </h2>
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {principles.map(([title, text]) => (
              <li
                key={title}
                className="rounded-card border border-line bg-surface p-5"
              >
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section
          id="contact"
          className="mt-14 scroll-mt-24"
          aria-labelledby="about-contact"
        >
          <h2 id="about-contact" className="text-xl font-semibold">
            {t("about.contactTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t("about.contactIntro")}
          </p>
          {hasContactInfo() ? (
            <>
              {rows.length > 0 && (
                <ul className="mt-6 divide-y divide-line rounded-card border border-line bg-surface">
                  {rows.map((r) => (
                    <li key={r.label} className="flex items-center gap-4 p-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
                        <r.icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs text-faint">{r.label}</p>
                        {r.href ? (
                          <a
                            href={r.href}
                            target={
                              r.href.startsWith("http") ? "_blank" : undefined
                            }
                            rel="noopener noreferrer"
                            dir={r.ltr ? "ltr" : undefined}
                            className="tap-area block truncate text-sm font-medium underline-offset-4 hover:underline"
                          >
                            {r.text}
                          </a>
                        ) : (
                          <p className="text-sm font-medium">{r.text}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="mt-6 rounded-card border border-line bg-surface-2/50 p-5 text-sm text-muted">
              {t("about.none")}{" "}
              <Link
                to={paths.help}
                className="tap-area font-medium text-ink underline underline-offset-4"
              >
                {t("about.helpCta")}
              </Link>
            </p>
          )}
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
