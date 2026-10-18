import { useI18n } from "@/i18n";
import { formatNumber } from "@/lib/format";

/**
 * Shows a statistic exactly as received. It used to tween up from 0 on mount, which briefly displayed wrong
 * figures (the real value, then 0, then every number in between) before settling on the right one.
 */
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
  const { lang } = useI18n();
  return (
    <span className={className}>
      {`${formatNumber(value, lang, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`}
    </span>
  );
}
