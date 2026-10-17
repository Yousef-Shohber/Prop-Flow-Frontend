import { zodResolver } from "@hookform/resolvers/zod";
import { Building, KeyRound } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { Banner } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { toast } from "@/hooks/useToast";
import { useI18n } from "@/i18n";
import { mapDetailsToFields, normalizeError } from "@/lib/errors";
import { useSchemas } from "@/lib/schemas";
import { useApiError } from "@/lib/useApiError";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { AuthLayout } from "./AuthLayout";
import { GoogleButton } from "./LoginPage";
import { PasswordField } from "./PasswordField";
import { env } from "@/lib/env";

interface Values {
  firstName: string;
  lastName: string;
  phone?: string;
  email: string;
  password: string;
  role: "TENANT" | "OWNER";
}

export default function RegisterPage() {
  const { t } = useI18n();
  const apiError = useApiError();
  const schemas = useSchemas();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schemas.register),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
      role: "TENANT",
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      await authApi.register({
        ...v,
        email: v.email.trim(),
        phone: v.phone?.trim() || undefined,
      });
      toast.success(t("auth.verify.subtitle", { email: v.email.trim() }));
      navigate(paths.verifyEmail, { state: { email: v.email.trim() } });
    } catch (e) {
      const err = normalizeError(e);
      if (err.code === "EMAIL_ALREADY_REGISTERED" || err.status === 409)
        setError("email", { type: "server", message: apiError(e) });
      else {
        const rest = mapDetailsToFields(
          err.details,
          ["firstName", "lastName", "phone", "email", "password", "role"],
          setError,
        );
        if (rest.length || !err.details?.length) setFormError(apiError(e));
      }
    }
  });

  const roles = [
    {
      value: "TENANT" as const,
      icon: KeyRound,
      title: t("auth.register.tenant"),
      desc: t("auth.register.tenantDesc"),
    },
    {
      value: "OWNER" as const,
      icon: Building,
      title: t("auth.register.owner"),
      desc: t("auth.register.ownerDesc"),
    },
  ];

  return (
    <AuthLayout
      variant="register"
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      footer={
        <>
          {t("auth.register.have")}{" "}
          <Link
            to={paths.login}
            className="tap-area font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4"
          >
            {t("auth.register.signIn")}
          </Link>
        </>
      }
    >
      {formError && (
        <Banner tone="red" className="mb-5">
          {formError}
        </Banner>
      )}
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">
                {t("auth.register.role")}
              </legend>
              <div className="grid grid-cols-2 gap-3" role="radiogroup">
                {roles.map((r) => (
                  <label
                    key={r.value}
                    className={cn(
                      "relative flex cursor-pointer flex-col gap-1 rounded-card border p-3.5 transition-all focus-within:ring-2 focus-within:ring-ring/40",
                      field.value === r.value
                        ? "border-accent bg-accent-soft"
                        : "border-line-strong bg-surface hover:border-faint",
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      name={field.name}
                      value={r.value}
                      checked={field.value === r.value}
                      onChange={() => field.onChange(r.value)}
                    />
                    <r.icon
                      className={cn(
                        "size-5",
                        field.value === r.value
                          ? "text-accent-ink"
                          : "text-muted",
                      )}
                      aria-hidden
                    />
                    <span className="text-sm font-semibold">{r.title}</span>
                    <span className="text-xs leading-snug text-muted">
                      {r.desc}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t("auth.register.firstName")}
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <Input
            label={t("auth.register.lastName")}
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>
        <Input
          label={t("auth.register.email")}
          type="email"
          dir="ltr"
          className="text-start"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label={t("auth.register.phone")}
          type="tel"
          dir="ltr"
          className="text-start"
          optional
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <PasswordField
          label={t("auth.register.password")}
          hint={t("auth.register.passwordHint")}
          autoComplete="new-password"
          showStrength
          value={watch("password")}
          error={errors.password?.message}
          {...register("password")}
        />
        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
        >
          {t("auth.register.submit")}
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
