import * as RS from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  className?: string;
}) {
  return (
    <RS.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border border-transparent bg-surface-3 transition-colors data-[state=checked]:bg-[var(--green-dot)] disabled:opacity-50",
        className,
      )}
    >
      <RS.Thumb className="absolute start-0.5 top-0.5 block size-5 rounded-full bg-white shadow transition-[inset-inline-start] duration-200 data-[state=checked]:start-[1.375rem]" />
    </RS.Root>
  );
}
