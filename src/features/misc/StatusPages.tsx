import { Compass, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/layout/Logo";
import { LangToggle, ThemeToggle } from "@/components/layout/Toggles";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/i18n";
import { ROLE_HOME, paths } from "@/routes/paths";

function Page({
  icon: Icon,
  code,
  title,
  text,
}: {
  icon: typeof Compass;
  code: string;
  title: string;
  text: string;
}) {
  const t = useT();
  const { user } = useAuth();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-4">
        <Link to="/" aria-label="PropFlow">
          <LogoMark />
        </Link>
        <div className="flex gap-1">
          <LangToggle />
          <ThemeToggle />
        </div>
      </header>
      <main
        id="main"
        className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center"
      >
        <p
          className="font-display text-[7rem] font-bold leading-none text-surface-3 sm:text-[10rem]"
          aria-hidden
          dir="ltr"
        >
          {code}
        </p>
        <span className="-mt-6 mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink">
          <Icon className="size-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-md text-muted">{text}</p>
        <Button
          className="mt-7"
          size="lg"
          to={user ? ROLE_HOME[user.role] : paths.landing}
        >
          {t("layout.goHome")}
        </Button>
      </main>
    </div>
  );
}
export const NotFoundPage = () => {
  const t = useT();
  return (
    <Page
      icon={Compass}
      code="404"
      title={t("layout.notFoundTitle")}
      text={t("layout.notFound")}
    />
  );
};
export const ForbiddenPage = () => {
  const t = useT();
  return (
    <Page
      icon={ShieldAlert}
      code="403"
      title={t("layout.noAccessTitle")}
      text={t("layout.noAccess")}
    />
  );
};
