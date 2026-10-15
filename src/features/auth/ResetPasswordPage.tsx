import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { Banner } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { toast } from "@/hooks/useToast";
import { useI18n } from "@/i18n";
import { useSchemas } from "@/lib/schemas";
import { useApiError } from "@/lib/useApiError";
import { paths } from "@/routes/paths";
import { AuthLayout } from "./AuthLayout";
import { PasswordField } from "./PasswordField";
import { OtpInput } from "./VerifyEmailPage";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const apiError = useApiError();
  const schemas = useSchemas();
  const navigate = useNavigate();
  const loc = useLocation() as { state?: { email?: string } };
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemas.reset),
    defaultValues: {
      email: loc.state?.email ?? "",
      otp: "",
      newPassword: "",
      confirm: "",
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      await authApi.resetPassword({
        email: v.email.trim(),
        otp: v.otp,
        newPassword: v.newPassword,
      });
      toast.success(t("auth.reset.done"));
      navigate(paths.login, { replace: true });
    } catch (e) {
      setFormError(apiError(e));
    }
  });

  return (
    <AuthLayout
      title={t("auth.reset.title")}
      subtitle={t("auth.reset.subtitle")}
      footer={
        <Link
          to={paths.login}
          className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4"
        >
          {t("auth.forgot.back")}
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {formError && <Banner tone="red">{formError}</Banner>}
        <Input
          label={t("common.email")}
          type="email"
          dir="ltr"
          className="text-start"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <OtpInput
          label={t("auth.reset.code")}
          error={errors.otp?.message}
          {...register("otp")}
        />
        <PasswordField
          label={t("auth.reset.newPassword")}
          autoComplete="new-password"
          showStrength
          value={watch("newPassword")}
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <PasswordField
          label={t("auth.reset.confirm")}
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register("confirm")}
        />
        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
        >
          {t("auth.reset.submit")}
        </Button>
      </form>
    </AuthLayout>
  );
}
