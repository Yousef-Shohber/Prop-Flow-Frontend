import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicFooter, PublicHeader } from "@/components/layout/PublicLayout";
import { useI18n } from "@/i18n";
import { env } from "@/lib/env";
import { paths } from "@/routes/paths";

type LegalDoc = { intro: string; sections: [string, string[]][] };

/** Terms of use and privacy policy. The text lives in the dictionaries under `legal.terms` / `legal.privacy`. */
export default function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const { t, raw } = useI18n();
  const doc = raw<LegalDoc>(`legal.${kind}`);
  const last = doc.sections.length - 1;
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-14">
        <h1 className="text-3xl font-bold">
          {kind === "terms" ? t("legal.termsTitle") : t("legal.privacyTitle")}
        </h1>
        <p className="mt-2 text-sm text-faint">{t("legal.updated")}</p>
        <p className="mt-6 text-base leading-relaxed text-muted">{doc.intro}</p>

        <div className="mt-10 space-y-8">
          {doc.sections.map(([title, paragraphs], i) => (
            <section key={title} aria-labelledby={`legal-${kind}-${i}`}>
              <h2
                id={`legal-${kind}-${i}`}
                className="mb-3 text-lg font-semibold"
              >
                <span className="num text-faint">{i + 1}.</span> {title}
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-muted">
                {paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              {i === last && (
                <p className="mt-4 text-sm">
                  {env.supportEmail ? (
                    <a
                      href={`mailto:${env.supportEmail}`}
                      className="tap-area inline-flex items-center gap-2 font-medium underline underline-offset-4"
                    >
                      <Mail className="size-4" aria-hidden />
                      <span dir="ltr">{env.supportEmail}</span>
                    </a>
                  ) : (
                    <Link
                      to={`${paths.about}#contact`}
                      className="tap-area font-medium underline underline-offset-4"
                    >
                      {t("legal.contactHelp")}
                    </Link>
                  )}
                </p>
              )}
            </section>
          ))}
        </div>

        <p className="mt-12 border-t border-line pt-6 text-sm">
          <Link
            to="/"
            className="tap-area font-medium underline underline-offset-4"
          >
            {t("legal.back")}
          </Link>
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}
