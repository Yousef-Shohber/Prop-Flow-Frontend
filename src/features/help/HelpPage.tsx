import { LifeBuoy, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { PublicFooter, PublicHeader } from "@/components/layout/PublicLayout";
import { Splash } from "@/routes/guards";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Card } from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import type { UserRole } from "@/types/enums";

/** Stable ids (anchors) per role; the texts live in the dictionaries under help.g.<key>. */
const GUIDES: Record<UserRole, { id: string; key: string }[]> = {
  TENANT: [
    { id: "tenant-request", key: "tRequest" },
    { id: "tenant-follow", key: "tFollow" },
    { id: "tenant-repair", key: "tRepair" },
    { id: "tenant-renew", key: "tRenew" },
  ],
  OWNER: [
    { id: "owner-property", key: "oProperty" },
    { id: "owner-requests", key: "oRequests" },
    { id: "owner-lease", key: "oLease" },
    { id: "owner-renew", key: "oRenew" },
    { id: "owner-verify", key: "oVerify" },
  ],
  MAINTENANCE_STAFF: [{ id: "staff-work", key: "sWork" }],
  ADMIN: [
    { id: "admin-verify", key: "aVerify" },
    { id: "admin-audit", key: "aAudit" },
  ],
};
const FAQ = [
  "lang",
  "password",
  "hidden",
  "activate",
  "export",
  "print",
  "reports",
];
const PUBLIC_ROLES: UserRole[] = ["TENANT", "OWNER"];

/** Signed-in people get the app shell, visitors get the public header and footer. */
export function HelpGate() {
  const { isBooting, user } = useAuth();
  if (isBooting) return <Splash />;
  if (user && user.roleSelected) return <AppShell />;
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-8 outline-none sm:px-6"
      >
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}

export default function HelpPage() {
  const { t, raw, lang } = useI18n();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const roles: UserRole[] = user?.roleSelected ? [user.role] : PUBLIC_ROLES;
  const norm = (s: string) => s.toLocaleLowerCase(lang === "ar" ? "ar" : "en");
  const q = norm(query.trim());

  const sections = useMemo(() => {
    const match = (...parts: string[]) =>
      !q || parts.some((p) => norm(p).includes(q));
    const groups = roles.map((r) => ({
      role: r,
      guides: GUIDES[r]
        .map((g) => {
          const title = t(`help.g.${g.key}.title`);
          const steps = raw<string[]>(`help.g.${g.key}.steps`) ?? [];
          return { ...g, title, steps };
        })
        .filter((g) => match(g.title, ...g.steps)),
    }));
    const faq = FAQ.map((id) => ({
      id: `faq-${id}`,
      q: t(`help.faq.${id}.q`),
      a: t(`help.faq.${id}.a`),
    })).filter((f) => match(f.q, f.a));
    return { groups, faq };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, lang, user?.role, user?.roleSelected]);

  const toc = [
    ...sections.groups.flatMap((g) =>
      g.guides.map((x) => ({ id: x.id, title: x.title })),
    ),
    ...(sections.faq.length ? [{ id: "faq", title: t("help.faqTitle") }] : []),
  ];
  const empty = toc.length === 0;

  return (
    <>
      <PageHeader
        icon={LifeBuoy}
        title={t("help.title")}
        subtitle={t("help.sub")}
      />
      <div className="relative mb-8 max-w-xl">
        <Input
          type="search"
          label={t("help.search")}
          placeholder={t("help.searchHint")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          dir="auto"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={t("help.clear")}
            className="absolute bottom-0 end-1 flex size-11 items-center justify-center rounded-md text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {empty ? (
        <Card>
          <EmptyState
            variant="no-results"
            icon={Search}
            title={t("help.noResults")}
            description={t("help.noResultsText")}
            action={
              <Button variant="secondary" onClick={() => setQuery("")}>
                {t("help.clear")}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_15rem]">
          <div className="min-w-0 space-y-10">
            {sections.groups.map(
              (g) =>
                g.guides.length > 0 && (
                  <section key={g.role} aria-labelledby={`grp-${g.role}`}>
                    <h2
                      id={`grp-${g.role}`}
                      className="mb-4 text-lg font-semibold"
                    >
                      {t("help.guidesFor", { role: t(`help.group.${g.role}`) })}
                    </h2>
                    <div className="space-y-4">
                      {g.guides.map((x) => (
                        <Card
                          key={x.id}
                          id={x.id}
                          className="scroll-mt-24 p-5 sm:p-6"
                        >
                          <h3 className="text-base font-semibold">{x.title}</h3>
                          <ol className="mt-3 list-decimal space-y-2 ps-5 text-sm leading-relaxed text-muted marker:font-medium marker:text-ink">
                            {x.steps.map((s) => (
                              <li key={s}>{s}</li>
                            ))}
                          </ol>
                        </Card>
                      ))}
                    </div>
                  </section>
                ),
            )}
            {sections.faq.length > 0 && (
              <section
                id="faq"
                className="scroll-mt-24"
                aria-labelledby="faq-title"
              >
                <h2 id="faq-title" className="mb-4 text-lg font-semibold">
                  {t("help.faqTitle")}
                </h2>
                <div className="space-y-3">
                  {sections.faq.map((f) => (
                    <details
                      key={f.id}
                      id={f.id}
                      className="group scroll-mt-24 rounded-card border border-line bg-surface"
                    >
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
                        {f.q}
                        <span
                          aria-hidden
                          className="text-faint transition group-open:rotate-90 rtl:-scale-x-100"
                        >
                          ›
                        </span>
                      </summary>
                      <p className="px-5 pb-4 text-sm leading-relaxed text-muted">
                        {f.a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>
          <nav aria-label={t("help.onThisPage")} className="hidden lg:block">
            <div className="sticky top-24">
              <p className="mb-3 text-xs font-semibold text-faint">
                {t("help.onThisPage")}
              </p>
              <ul className="space-y-1 border-s border-line">
                {toc.map((x) => (
                  <li key={x.id}>
                    <a
                      href={`#${x.id}`}
                      className="-ms-px block border-s-2 border-transparent py-1.5 ps-3 text-sm text-muted hover:border-accent hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {x.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
