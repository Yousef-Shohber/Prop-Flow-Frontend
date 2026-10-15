import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

const SHOW_AFTER = 480; // px scrolled before the button appears
const R = 20;
const C = 2 * Math.PI * R;

/** Floating "back to top": a ring around the arrow shows how far down the page you are (echoes the occupancy ring). */
export function ScrollToTop() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const ring = useRef<SVGCircleElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      setVisible(y > SHOW_AFTER);
      if (ring.current)
        ring.current.style.strokeDashoffset = String(
          C * (1 - Math.min(1, y / max)),
        );
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!btn.current || prefersReducedMotion()) return;
    gsap.to(btn.current, {
      autoAlpha: visible ? 1 : 0,
      y: visible ? 0 : 16,
      scale: visible ? 1 : 0.9,
      duration: 0.3,
      ease: "power2.out",
      overwrite: true,
    });
  }, [visible]);

  const go = () =>
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });

  return (
    <button
      ref={btn}
      type="button"
      onClick={go}
      aria-label={t("a11y.top")}
      title={t("a11y.top")}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      style={
        prefersReducedMotion()
          ? {
              opacity: visible ? 1 : 0,
              pointerEvents: visible ? "auto" : "none",
            }
          : { opacity: 0, visibility: "hidden" }
      }
      className={cn(
        "group fixed bottom-5 end-5 z-40 flex size-12 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-pop transition-colors hover:border-accent hover:bg-accent-soft sm:bottom-6 sm:end-6",
      )}
    >
      <svg
        viewBox="0 0 48 48"
        className="absolute inset-0 size-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="24"
          cy="24"
          r={R}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth="2.5"
        />
        <circle
          ref={ring}
          cx="24"
          cy="24"
          r={R}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C}
        />
      </svg>
      <ArrowUp
        className="relative size-[1.15rem] transition-transform duration-200 group-hover:-translate-y-0.5"
        aria-hidden
      />
    </button>
  );
}
