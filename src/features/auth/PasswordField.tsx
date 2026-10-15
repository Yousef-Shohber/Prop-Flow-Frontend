import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/Field";
import { useT } from "@/i18n";
import { passwordStrength } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
  hint?: string;
  showStrength?: boolean;
};

export const PasswordField = forwardRef<HTMLInputElement, Props>(
  function PasswordField({ showStrength, ...props }, ref) {
    const [shown, setShown] = useState(false);
    const t = useT();
    const strength = showStrength
      ? passwordStrength(String(props.value ?? ""))
      : 0;
    const labels = ["weak", "fair", "good", "strong"] as const;
    const colors = [
      "var(--red-dot)",
      "var(--amber-dot)",
      "var(--teal-dot)",
      "var(--green-dot)",
    ];
    return (
      <div>
        <div className="relative">
          <Input
            ref={ref}
            type={shown ? "text" : "password"}
            dir="ltr"
            className="pe-11 text-start"
            {...props}
          />
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-pressed={shown}
            aria-label={shown ? "Hide password" : "Show password"}
            className={cn(
              "absolute end-2 flex size-8 items-center justify-center rounded-md text-faint hover:bg-surface-2 hover:text-ink",
              "top-[2rem]",
            )}
          >
            {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {showStrength && String(props.value ?? "").length > 0 && (
          <div className="mt-2" aria-live="polite">
            <div className="flex gap-1.5" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-1 flex-1 rounded-full bg-surface-3 transition-colors"
                  style={
                    i <= strength ? { background: colors[strength] } : undefined
                  }
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">
              {t("auth.strength.label")}:{" "}
              {t(`auth.strength.${labels[strength]}`)}
            </p>
          </div>
        )}
      </div>
    );
  },
);
