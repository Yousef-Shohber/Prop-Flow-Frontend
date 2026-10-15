import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";
import { useI18n } from "@/i18n";
import { formatNumber } from "@/lib/format";

/** Counts up once on mount (GSAP). Falls back to the final value for reduced motion. */
export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const { lang } = useI18n();
  const fmt = (n: number) =>
    `${formatNumber(n, lang, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = fmt(value);
      return;
    }
    const o = { v: 0 };
    const tw = gsap.to(o, {
      v: value,
      duration: 1.1,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = fmt(o.v);
      },
    });
    return () => {
      tw.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, lang, decimals, suffix]);
  return (
    <span ref={ref} className={className}>
      {fmt(value)}
    </span>
  );
}
