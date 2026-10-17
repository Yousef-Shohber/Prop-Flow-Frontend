import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Banner } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { env } from "@/lib/env";
import { normalizeError } from "@/lib/errors";
import { useSchemas } from "@/lib/schemas";
import { useApiError } from "@/lib/useApiError";
import { ROLE_HOME, paths } from "@/routes/paths";
import { AuthLayout } from "./AuthLayout";
import { PasswordField } from "./PasswordField";

interface Values {
  email: string;
  password: string;
}

export function GoogleButton() {
  const { t } = useI18n();
  return (
    <Button
      variant="secondary"
      size="lg"
      className="w-full"
      onClick={() => {
        window.location.href = `${env.apiBase}/auth/google`;
      }}
      icon={
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path
            fill="#4285F4"
            d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21.5 7.5 24 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.700 1.200 15.100 0 12 0 7.500 0 3.700 2.500 1.800 6.100l3.800 3c.9-2.700 3.400-4.300 6.400-4.300Z"
          />
        </svg>
      }
    >
      {t("auth.login.google")}
    </Button>
  );
}

export default function LoginPage() {
  const { t } = useI18n();
  const apiError = useApiError();
  const schemas = useSchemas();
  const { login, endedReason, clearEnded } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [code, setCode] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schemas.login),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (v) => {
    setCode(null);
    setServerError(null);
    clearEnded();
    try {
      const user = await login(v.email.trim(), v.password);
      const from = loc.state?.from;
      navigate(
        !user.roleSelected
          ? paths.chooseRole
          : from && from !== "/" && !from.startsWith("/login")
            ? from
            : ROLE_HOME[user.role],
        { replace: true },
      );
    } catch (e) {
      const err = normalizeError(e);
      setCode(err.code);
      setServerError(apiError(e));
    }
  });

  return (
    <AuthLayout
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      footer={
        <>
          {t("auth.login.noAccount")}{" "}
          <Link
            to={paths.register}
            className="tap-area font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4"
          >
            {t("auth.login.create")}
          </Link>
        </>
      }
    >
      {endedReason && !serverError && (
        <Banner tone="blue" className="mb-5">
          {endedReason === "inactive"
            ? t("auth.login.inactive")
            : t("auth.login.sessionEnded")}
        </Banner>
      )}
      {serverError && (
        <Banner
          tone="red"
          className="mb-5"
          action={
            code === "EMAIL_NOT_VERIFIED" ? (
              <Button
                size="sm"
                variant="secondary"
                to={paths.verifyEmail}
                state={{ email: getValues("email") }}
              >
                {t("auth.login.verifyCta")}
              </Button>
            ) : code === "ACCOUNT_DEACTIVATED" && env.supportEmail ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  window.location.href = `mailto:${env.supportEmail}`;
                }}
              >
                {t("auth.login.support")}
              </Button>
            ) : undefined
          }
        >
          {serverError}
        </Banner>
      )}
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Input
          label={t("common.email")}
          type="email"
          dir="ltr"
          className="text-start"
          autoComplete="email"
          autoFocus
          error={errors.email?.message}
          {...register("email")}
        />
        <PasswordField
          label={t("auth.register.password")}
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="flex justify-end -mt-2">
          <Link
            to={paths.forgotPassword}
            className="tap-area text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            {t("auth.login.forgot")}
          </Link>
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
        >
          {t("auth.login.submit")}
        </Button>
      </form>
      {env.googleEnabled && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-line" />
            {t("auth.login.or")}
            <span className="h-px flex-1 bg-line" />
          </div>
          <GoogleButton />
        </>
      )}
    </AuthLayout>
  );
}
