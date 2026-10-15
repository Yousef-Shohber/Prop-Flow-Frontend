import { Link } from "react-router-dom";
import { PublicFooter, PublicHeader } from "@/components/layout/PublicLayout";
import { Banner } from "@/components/ui/Misc";
import { useI18n } from "@/i18n";

/** Legal pages are placeholders on purpose: the real text must come from the business (spec §27). */
export default function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const { t, raw } = useI18n();
  const sections = raw<string[]>("legal.sections");
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-14">
        <h1 className="text-3xl font-bold">
          {kind === "terms" ? t("legal.termsTitle") : t("legal.privacyTitle")}
        </h1>
        <p className="mt-2 text-sm text-faint">{t("legal.updated")}</p>
        <Banner tone="amber" className="mt-6">
          {t("legal.placeholder")}
        </Banner>
        <div className="mt-8 space-y-7">
          {sections.map((s, i) => (
            <section key={s}>
              <h2 className="mb-2 text-lg font-semibold">
                <span className="num text-faint">{i + 1}.</span> {s}
              </h2>
              <div className="space-y-2" aria-hidden>
                <div
                  className="skeleton h-3.5 w-full"
                  style={{ animation: "none" }}
                />
                <div
                  className="skeleton h-3.5 w-11/12"
                  style={{ animation: "none" }}
                />
                <div
                  className="skeleton h-3.5 w-2/3"
                  style={{ animation: "none" }}
                />
              </div>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm">
          <Link to="/" className="font-medium underline underline-offset-4">
            {t("nav.dashboard")}
          </Link>
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}
