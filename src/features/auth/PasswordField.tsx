import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/Field";
import { useT } from "@/i18n";
import { passwordStrength } from "@/lib/schemas";

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
        <Input
          ref={ref}
          type={shown ? "text" : "password"}
          dir="ltr"
          // the input is forced LTR, so the eye and its padding both use the physical right side
          className="pr-12 text-start"
          endAdornmentClassName="right-2"
          endAdornment={
            <button
              type="button"
              onClick={() => setShown((s) => !s)}
              aria-pressed={shown}
              aria-label={shown ? "Hide password" : "Show password"}
              className="flex size-8 items-center justify-center rounded-md text-faint hover:bg-surface-2 hover:text-ink"
            >
              {shown ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          }
          {...props}
        />
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
