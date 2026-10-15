import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { DiscoverSection } from "@/features/discover/DiscoverSection";
import { useAuth } from "@/hooks/useAuth";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { FeaturedUnits } from "./FeaturedUnits";
import { HomeHero } from "./HomeHero";
import { ManagerView, StaffView, TenantView } from "./RoleViews";

/**
 * Authenticated discovery landing page (/home): hero with live catalogue numbers, search (state in the URL),
 * browse-by-type tiles with real counts, newest properties, available units, and the role's own insights.
 */
export default function HomePage() {
  const { user, role } = useAuth();
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      gsap.from(root.current.querySelectorAll("[data-rise]"), {
        opacity: 0,
        y: 16,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.06,
        clearProps: "all",
      });
    },
    { scope: root },
  );
  if (!user || !role) return null;
  const browse = role !== "MAINTENANCE_STAFF";
  return (
    <div ref={root} className="space-y-8">
      <HomeHero role={role} name={user.firstName} overlap={browse} />
      {browse && <DiscoverSection role={role} showCounts />}
      {browse && <FeaturedUnits role={role} />}
      {role === "TENANT" && <TenantView />}
      {(role === "OWNER" || role === "ADMIN") && <ManagerView role={role} />}
      {role === "MAINTENANCE_STAFF" && <StaffView />}
    </div>
  );
}
