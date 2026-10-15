import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { dismiss, useToasts } from "@/hooks/useToast";
import { useT } from "@/i18n";

const ICON = { success: CheckCircle2, error: XCircle, info: Info } as const;
const TONE = { success: "green", error: "red", info: "blue" } as const;

/** Toasts live in an aria-live region (spec §7.4). */
export function Toaster() {
  const items = useToasts();
  const t = useT();
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-start sm:p-6"
    >
      {items.map((it) => {
        const Icon = ICON[it.kind];
        const tone = TONE[it.kind];
        return (
          <div
            key={it.id}
            role={it.kind === "error" ? "alert" : "status"}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 ps-4 shadow-pop"
            style={{
              animation: "toast-in .22s cubic-bezier(.2,.8,.2,1)",
              borderInlineStart: `4px solid var(--${tone}-dot)`,
            }}
          >
            <Icon
              className="mt-0.5 size-5 shrink-0"
              style={{ color: `var(--${tone}-dot)` }}
              aria-hidden
            />
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink">
              {it.message}
            </p>
            <button
              className="-m-1 rounded-md p-1 text-faint hover:bg-surface-2 hover:text-ink"
              onClick={() => dismiss(it.id)}
              aria-label={t("common.close")}
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
