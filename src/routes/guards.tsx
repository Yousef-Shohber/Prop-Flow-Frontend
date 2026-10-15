import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/layout/Logo";
import { ROLE_HOME, paths } from "./paths";
import type { UserRole } from "@/types/enums";
import { CloudOff } from "lucide-react";

export function Splash() {
  const t = useT();
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-bg"
      role="status"
    >
      <LogoMark className="size-14 animate-pulse" />
      <p className="text-sm text-muted">{t("layout.splash")}</p>
    </div>
  );
}

/** Blocks everything until the boot refresh resolved (spec §2.1). */
export function RequireAuth() {
  const { isBooting, isAuthenticated, user, bootError, retryBoot } = useAuth();
  const t = useT();
  const loc = useLocation();
  if (isBooting) return <Splash />;
  if (bootError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <span
          className="inline-flex size-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--amber-bg)", color: "var(--amber-fg)" }}
        >
          <CloudOff className="size-7" />
        </span>
        <p className="max-w-sm text-sm text-muted">{t("auth.bootError")}</p>
        <Button onClick={retryBoot}>{t("common.retry")}</Button>
      </div>
    );
  }
  if (!isAuthenticated)
    return (
      <Navigate
        to={paths.login}
        replace
        state={{ from: loc.pathname + loc.search }}
      />
    );
  if (user && !user.roleSelected)
    return <Navigate to={paths.chooseRole} replace />;
  return <Outlet />;
}

/** Login / register: signed-in people go home instead. */
export function PublicOnly() {
  const { isBooting, isAuthenticated, user } = useAuth();
  if (isBooting) return <Splash />;
  if (isAuthenticated && user)
    return (
      <Navigate
        to={user.roleSelected ? ROLE_HOME[user.role] : paths.chooseRole}
        replace
      />
    );
  return <Outlet />;
}

/** The choose-role screen needs a session but not a role. */
export function RequireSessionOnly() {
  const { isBooting, isAuthenticated, user } = useAuth();
  if (isBooting) return <Splash />;
  if (!isAuthenticated) return <Navigate to={paths.login} replace />;
  if (user?.roleSelected) return <Navigate to={ROLE_HOME[user.role]} replace />;
  return <Outlet />;
}

export function RequireRole({ roles }: { roles: readonly UserRole[] }) {
  const { role } = useAuth();
  if (!role || !roles.includes(role))
    return <Navigate to={paths.forbidden} replace />;
  return <Outlet />;
}
