import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { authApi } from "@/api/auth";
import { Banner } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useI18n } from "@/i18n";
import { useSchemas } from "@/lib/schemas";
import { useApiError } from "@/lib/useApiError";
import { paths } from "@/routes/paths";
import { AuthLayout } from "./AuthLayout";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const apiError = useApiError();
  const schemas = useSchemas();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemas.forgot),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      await authApi.forgotPassword({ email: v.email.trim() });
      setSentTo(v.email.trim());
    } catch (e) {
      setFormError(apiError(e));
    }
  });

  return (
    <AuthLayout
      title={t("auth.forgot.title")}
      subtitle={t("auth.forgot.subtitle")}
      footer={
        <Link
          to={paths.login}
          className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4"
        >
          {t("auth.forgot.back")}
        </Link>
      }
    >
      {sentTo ? (
        <div className="space-y-5">
          <Banner
            tone="green"
            title={
              <span className="flex items-center gap-2">
                <MailCheck className="size-4" />
                {t("auth.forgot.sent")}
              </span>
            }
          />
          <Button
            size="lg"
            className="w-full"
            to={paths.resetPassword}
            state={{ email: sentTo }}
          >
            {t("auth.forgot.haveCode")}
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {formError && <Banner tone="red">{formError}</Banner>}
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
          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={isSubmitting}
          >
            {t("auth.forgot.submit")}
          </Button>
          <Button variant="ghost" className="w-full" to={paths.resetPassword}>
            {t("auth.forgot.haveCode")}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
