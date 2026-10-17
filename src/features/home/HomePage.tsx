import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { DiscoverSection } from "@/features/discover/DiscoverSection";
import { useAuth } from "@/hooks/useAuth";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
import { FeaturedUnits } from "./FeaturedUnits";
import { HomeCta } from "./HomeCta";
import { HomeHero } from "./HomeHero";
import { HomeStory } from "./HomeStory";
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
  // data loads after mount and moves everything below it, so scroll positions are re-measured when the page height changes
  useEffect(() => {
    const el = root.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let id: number;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(id);
      id = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(id);
      ro.disconnect();
    };
  }, []);
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
      <HomeStory role={role} />
      <HomeCta role={role} />
    </div>
  );
}
