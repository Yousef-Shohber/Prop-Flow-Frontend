import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/enums";

/** UX only: hides controls that would fail anyway. The backend enforces ownership. */
export function RoleGate({
  roles,
  fallback = null,
  children,
}: {
  roles: readonly UserRole[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { role } = useAuth();
  return <>{role && roles.includes(role) ? children : fallback}</>;
}
export const useHasRole = (...roles: UserRole[]) => {
  const { role } = useAuth();
  return !!role && roles.includes(role);
};
