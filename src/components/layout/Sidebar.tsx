import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { useI18n } from "@/i18n";
import { Logo } from "./Logo";
import { navFor } from "./nav";
import { paths } from "@/routes/paths";

export const unreadKey = ["notifications", "unread-count"] as const;
export function useUnreadCount() {
  return useQuery({
    queryKey: unreadKey,
    queryFn: async () =>
      (await notificationsApi.list({ limit: 1 })).meta.unreadCount ?? 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 20_000,
  });
}

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = useAuth();
  const { t, lang } = useI18n();
  const { data: unread = 0 } = useUnreadCount();
  const groups = navFor(role);
  return (
    <nav
      aria-label={t("a11y.mainNav")}
      className="flex-1 space-y-6 overflow-y-auto px-3 py-4"
    >
      {groups.map((g) => (
        <div key={g.labelKey}>
          <p className="mb-1.5 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-faint">
            {t(g.labelKey)}
          </p>
          <ul className="space-y-0.5">
            {g.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-surface text-ink shadow-soft"
                        : "text-muted hover:bg-surface/60 hover:text-ink",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-y-2 start-0 w-[3px] rounded-full bg-accent transition-transform duration-200",
                          isActive ? "scale-y-100" : "scale-y-0",
                        )}
                      />
                      <item.icon
                        className={cn(
                          "size-[1.15rem] shrink-0",
                          isActive
                            ? "text-accent-ink dark:text-accent"
                            : "text-faint group-hover:text-muted",
                        )}
                        aria-hidden
                      />
                      <span className="flex-1 truncate">
                        {t(item.labelKey)}
                      </span>
                      {item.to === paths.notifications && unread > 0 && (
                        <span
                          className="num rounded-full bg-accent px-1.5 py-0.5 text-[0.6875rem] font-bold leading-none text-[#1b1405]"
                          aria-label={t("notif.bell", { n: unread })}
                        >
                          {unread > 99 ? "99+" : formatNumber(unread, lang)}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="no-print sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-line bg-surface-2/60 lg:flex">
      <div className="flex h-16 items-center px-5">
        <NavLink to="/" aria-label="PropFlow">
          <Logo />
        </NavLink>
      </div>
      <NavList />
      <p className="px-5 py-4 text-xs text-faint" dir="ltr">
        PropFlow · Team
      </p>
    </aside>
  );
}
export { useT };
