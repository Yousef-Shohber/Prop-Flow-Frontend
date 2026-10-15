import { Languages, Moon, Sun } from "lucide-react";
import { useI18n } from "@/i18n";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const btn =
  "inline-flex h-10 items-center justify-center rounded-control px-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, cycle } = useTheme();
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(btn, "w-10 px-0", className)}
      aria-label={t("a11y.theme")}
      title={resolved === "dark" ? t("theme.light") : t("theme.dark")}
    >
      {resolved === "dark" ? (
        <Sun className="size-[1.15rem]" />
      ) : (
        <Moon className="size-[1.15rem]" />
      )}
    </button>
  );
}
export function LangToggle({ className }: { className?: string }) {
  const { lang, toggleLang, t } = useI18n();
  return (
    <button
      type="button"
      onClick={toggleLang}
      className={cn(btn, "gap-1.5", className)}
      aria-label={t("a11y.language")}
      lang={lang === "ar" ? "en" : "ar"}
    >
      <Languages className="size-[1.1rem]" aria-hidden />
      <span className="hidden sm:inline">
        {lang === "ar" ? "English" : "العربية"}
      </span>
      <span className="text-xs font-bold sm:hidden" aria-hidden>
        {lang === "ar" ? "EN" : "ع"}
      </span>
    </button>
  );
}
