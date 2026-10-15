import * as DM from "@radix-ui/react-dropdown-menu";
import * as RD from "@radix-ui/react-dialog";
import { Bell, ChevronDown, LogOut, Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { fullName, formatNumber } from "@/lib/format";
import { paths } from "@/routes/paths";
import { Avatar } from "../ui/Misc";
import { Logo } from "./Logo";
import { NavList, useUnreadCount } from "./Sidebar";
import { LangToggle, ThemeToggle } from "./Toggles";
import { NAV_GROUPS } from "./nav";
import { cn } from "@/lib/utils";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function useCrumbs() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length === 0) return [];
  const all = NAV_GROUPS.flatMap((g) => g.items);
  const root = all.find((i) => i.to === `/${segs[0]}`);
  const crumbs: { label: string; to?: string }[] = [
    {
      label: root ? t(root.labelKey) : segs[0],
      to: segs.length > 1 ? `/${segs[0]}` : undefined,
    },
  ];
  for (let i = 1; i < segs.length; i++) {
    const s = segs[i];
    if (s === "new") crumbs.push({ label: t("common.create") });
    else if (s === "edit") crumbs.push({ label: t("common.edit") });
    else if (UUID.test(s)) crumbs.push({ label: t("common.details") });
    else if (s === "units") continue;
    else crumbs.push({ label: s });
  }
  return crumbs;
}

export function Header() {
  const { user, logout } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const crumbs = useCrumbs();
  const [drawer, setDrawer] = useState(false);
  const { data: unread = 0 } = useUnreadCount();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-bg/85 px-4 backdrop-blur-md sm:px-6">
      <RD.Root open={drawer} onOpenChange={setDrawer}>
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
            className="fixed inset-y-0 start-0 z-50 flex w-[18rem] max-w-[85vw] flex-col bg-bg shadow-pop focus:outline-none lg:hidden"
            style={{
              animation: `${lang === "ar" ? "sheet-in-end" : "sheet-in-start"} .24s cubic-bezier(.2,.8,.2,1)`,
            }}
          >
            <div className="flex h-16 items-center justify-between px-5">
              <RD.Title className="sr-only">{t("a11y.mainNav")}</RD.Title>
              <Logo />
              <RD.Close
                className="rounded-lg p-2 text-muted hover:bg-surface-2"
                aria-label={t("a11y.closeMenu")}
              >
                <X className="size-5" />
              </RD.Close>
            </div>
            <NavList onNavigate={() => setDrawer(false)} />
          </RD.Content>
        </RD.Portal>
      </RD.Root>

      <nav
        aria-label={t("a11y.breadcrumbs")}
        className="hidden min-w-0 flex-1 sm:block"
      >
        <ol className="flex items-center gap-1.5 text-sm text-muted">
          {crumbs.map((c, i) => (
            <li key={i} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && (
                <span aria-hidden className="text-faint rtl:rotate-180">
                  ›
                </span>
              )}
              {c.to ? (
                <Link to={c.to} className="truncate hover:text-ink">
                  {c.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate",
                    i === crumbs.length - 1 && "font-medium text-ink",
                  )}
                  aria-current={i === crumbs.length - 1 ? "page" : undefined}
                >
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex-1 sm:hidden" />

      <LangToggle />
      <ThemeToggle />
      <Link
        to={paths.notifications}
        className="relative inline-flex size-10 items-center justify-center rounded-control text-muted hover:bg-surface-2 hover:text-ink"
        aria-label={
          unread > 0 ? t("notif.bell", { n: unread }) : t("a11y.notifications")
        }
      >
        <Bell className="size-[1.15rem]" />
        {unread > 0 && (
          <span className="num absolute end-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.625rem] font-bold leading-4 text-[#1b1405]">
            {unread > 99 ? "99+" : formatNumber(unread, lang)}
          </span>
        )}
      </Link>

      <DM.Root>
        <DM.Trigger
          className="flex items-center gap-2 rounded-control p-1 pe-2 hover:bg-surface-2"
          aria-label={t("a11y.userMenu")}
        >
          <Avatar user={user} size={34} />
          <span className="hidden max-w-32 truncate text-sm font-medium md:block">
            {user?.firstName}
          </span>
          <ChevronDown
            className="hidden size-4 text-faint md:block"
            aria-hidden
          />
        </DM.Trigger>
        <DM.Portal>
          <DM.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-56 rounded-xl border border-line bg-surface p-1.5 shadow-pop"
            style={{ animation: "fade-in .12s ease-out" }}
          >
            <div className="px-3 pb-2 pt-1.5">
              <p className="truncate text-sm font-semibold">{fullName(user)}</p>
              <p
                className="truncate text-xs text-muted"
                dir="ltr"
                style={{ textAlign: "start" }}
              >
                {user?.email}
              </p>
            </div>
            <DM.Separator className="my-1 h-px bg-line" />
            <DM.Item
              onSelect={() => navigate(paths.profile)}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-surface-2"
            >
              <UserRound className="size-4 text-muted" />
              {t("nav.profile")}
            </DM.Item>
            <DM.Item
              onSelect={async () => {
                await logout();
                navigate(paths.login, { replace: true });
              }}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-surface-2"
            >
              <LogOut className="size-4 text-muted" />
              {t("nav.logout")}
            </DM.Item>
          </DM.Content>
        </DM.Portal>
      </DM.Root>
    </header>
  );
}
