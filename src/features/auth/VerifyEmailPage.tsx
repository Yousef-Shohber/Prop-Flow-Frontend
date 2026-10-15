import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { Banner } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { toast } from "@/hooks/useToast";
import { useI18n } from "@/i18n";
import { normalizeError } from "@/lib/errors";
import { useSchemas } from "@/lib/schemas";
import { useApiError } from "@/lib/useApiError";
import { paths } from "@/routes/paths";
import { AuthLayout } from "./AuthLayout";

export const OTP_COOLDOWN = 60;

export function OtpInput(props: React.ComponentProps<typeof Input>) {
  return (
    <Input
      {...props}
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      dir="ltr"
      placeholder="••••••"
      className="num h-14 text-center text-2xl font-semibold tracking-[0.55em]"
    />
  );
}

export default function VerifyEmailPage() {
  const { t } = useI18n();
  const apiError = useApiError();
  const schemas = useSchemas();
  const navigate = useNavigate();
  const loc = useLocation() as { state?: { email?: string } };
  const initial = loc.state?.email ?? "";

  const [cooldown, setCooldown] = useState(initial ? OTP_COOLDOWN : 0);
  const [formError, setFormError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemas.verify),
    defaultValues: { email: initial, otp: "" },
  });

  useEffect(() => {
    if (cooldown <= 0) return;

    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);

    try {
      await authApi.verifyEmail({
        email: v.email.trim(),
        otp: v.otp,
      });

      toast.success(t("auth.verify.done"));
      navigate(paths.login, { replace: true });
    } catch (e) {
      setFormError(apiError(e));
    }
  });

  const resend = async () => {
    if (!(await trigger("email"))) return;

    setResending(true);

    try {
      await authApi.resendOtp({
        email: getValues("email").trim(),
      });

      toast.info(t("auth.verify.resent"));
      setCooldown(OTP_COOLDOWN);
    } catch (e) {
      const err = normalizeError(e);
      toast.error(apiError(e));

      if (err.status === 429) {
        setCooldown(OTP_COOLDOWN);
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title={t("auth.verify.title")}
      subtitle={
        initial
          ? t("auth.verify.subtitle", { email: initial })
          : t("auth.verify.needEmail")
      }
      footer={
        <Link
          to={paths.login}
          className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4"
        >
          {t("auth.verify.back")}
        </Link>
      }
    >
      {formError && (
        <Banner tone="red" className="mb-5">
          {formError}
        </Banner>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {!initial && (
          <Input
            label={t("common.email")}
            type="email"
            dir="ltr"
            className="text-start"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
        )}

        <Controller
          name="otp"
          control={control}
          render={({ field }) => (
            <OtpInput
              name={field.name}
              value={field.value}
              onChange={(e) => {
                field.onChange(e.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              onBlur={field.onBlur}
              ref={field.ref}
              label={t("auth.verify.code")}
              autoFocus
              error={errors.otp?.message}
            />
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
        >
          {t("auth.verify.submit")}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={resend}
          loading={resending}
          disabled={cooldown > 0 || resending}
        >
          {cooldown > 0
            ? t("auth.verify.resendIn", { s: cooldown })
            : t("auth.verify.resend")}
        </Button>
      </form>
    </AuthLayout>
  );
}
