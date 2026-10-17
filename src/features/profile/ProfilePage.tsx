import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Hourglass,
  Monitor,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { authApi } from "@/api/auth";
import { usersApi } from "@/api/users";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ImageUploader } from "@/components/ui/ImageUploader";
import {
  Avatar,
  Banner,
  CardSection,
  DescriptionList,
} from "@/components/ui/Misc";
import { PageHeader } from "@/components/ui/PageHeader";
import { meKey, useAuth } from "@/hooks/useAuth";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";
import { toast } from "@/hooks/useToast";
import { useI18n, type Lang } from "@/i18n";
import { mapDetailsToFields, normalizeError } from "@/lib/errors";
import { formatDate, fullName } from "@/lib/format";
import { useSchemas } from "@/lib/schemas";
import { useApiError } from "@/lib/useApiError";
import { cn } from "@/lib/utils";
import { PasswordField } from "../auth/PasswordField";
import type { User } from "@/types/models";

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-control border border-line-strong bg-surface-2 p-1"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === o.value
              ? "bg-surface text-ink shadow-soft"
              : "text-muted hover:text-ink",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ProfileForm({ user }: { user: User }) {
  const { t } = useI18n();
  const apiError = useApiError();
  const schemas = useSchemas();
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(schemas.profile),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
    },
  });
  useEffect(
    () =>
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? "",
      }),
    [user, reset],
  );
  const submit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      const me = await usersApi.updateMe({
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        ...(v.phone?.trim()
          ? { phone: v.phone.trim() }
          : user.phone
            ? { phone: null }
            : {}),
      });
      qc.setQueryData(meKey, me);
      toast.success(t("profile.savedToast"));
    } catch (e) {
      const err = normalizeError(e);
      const rest = mapDetailsToFields(
        err.details,
        ["firstName", "lastName", "phone"],
        setError,
      );
      if (rest.length || !err.details?.length) setFormError(apiError(e));
    }
  });
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && <Banner tone="red">{formError}</Banner>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t("profile.firstName")}
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <Input
          label={t("profile.lastName")}
          error={errors.lastName?.message}
          {...register("lastName")}
        />
        <Input
          label={t("profile.phone")}
          optional
          type="tel"
          dir="ltr"
          className="text-start"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label={t("profile.email")}
          value={user.email}
          readOnly
          disabled
          dir="ltr"
          className="text-start"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          {t("common.saveChanges")}
        </Button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const { t } = useI18n();
  const apiError = useApiError();
  const schemas = useSchemas();
  const [noPassword, setNoPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schemas.changePassword),
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
  });
  const submit = handleSubmit(async (v) => {
    setNoPassword(false);
    try {
      const res = await authApi.changePassword({
        currentPassword: v.currentPassword,
        newPassword: v.newPassword,
      });
      toast.success(res?.message || t("profile.savedToast"));
      reset(); // this session stays valid
    } catch (e) {
      const code = normalizeError(e).code;
      if (code === "CURRENT_PASSWORD_INCORRECT")
        setError("currentPassword", { type: "server", message: apiError(e) });
      else if (code === "PASSWORD_UNCHANGED")
        setError("newPassword", { type: "server", message: apiError(e) });
      else if (code === "NO_PASSWORD_SET") setNoPassword(true);
      else toast.error(apiError(e));
    }
  });
  if (noPassword) return <Banner tone="blue">{t("profile.googleOnly")}</Banner>;
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <PasswordField
        label={t("profile.currentPassword")}
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PasswordField
          label={t("profile.newPassword")}
          autoComplete="new-password"
          showStrength
          value={watch("newPassword")}
          error={errors.newPassword?.message}
          {...register("newPassword")}
        />
        <PasswordField
          label={t("profile.confirm")}
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register("confirm")}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          {t("profile.changePassword")}
        </Button>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const { mode, setMode } = useTheme();
  const qc = useQueryClient();
  if (!user) return null;
  const refreshMe = (u: User) => qc.setQueryData(meKey, u);

  return (
    <>
      <PageHeader
        icon={UserRound}
        title={t("profile.title")}
        subtitle={t("profile.sub")}
      />
      <div className="mx-auto grid max-w-4xl gap-6">
        <CardSection>
          <div className="flex flex-wrap items-center gap-5">
            <Avatar user={user} size={72} />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold">{fullName(user)}</h2>
              <p
                className="text-sm text-muted"
                dir="ltr"
                style={{ textAlign: "start" }}
              >
                {user.email}
              </p>
              <p className="mt-1 text-xs text-faint">
                {t("profile.memberSince", {
                  date: formatDate(user.createdAt, lang),
                })}
              </p>
            </div>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium">
              {t(`roles.${user.role}`)}
            </span>
          </div>
          {user.role === "OWNER" && (
            <div
              className="mt-5 flex items-start gap-3 rounded-card px-4 py-3"
              style={{
                background: `var(--${user.ownerVerified ? "green" : "amber"}-bg)`,
                color: `var(--${user.ownerVerified ? "green" : "amber"}-fg)`,
              }}
            >
              {user.ownerVerified ? (
                <BadgeCheck className="mt-0.5 size-5 shrink-0" />
              ) : (
                <Hourglass className="mt-0.5 size-5 shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {user.ownerVerified
                    ? t("profile.verified")
                    : t("profile.awaiting")}
                </p>
                <p className="text-sm opacity-90">
                  {user.ownerVerified
                    ? t("profile.verifiedText")
                    : t("profile.awaitingText")}
                </p>
              </div>
            </div>
          )}
        </CardSection>

        <CardSection title={t("profile.avatar")}>
          <ImageUploader
            mode="immediate"
            maxFiles={1}
            value={user.avatar ? [user.avatar] : []}
            hint={t("profile.avatarHint")}
            onUpload={async (files, onProgress) => {
              refreshMe(await usersApi.uploadAvatar(files[0], onProgress));
              toast.success(t("profile.avatarToast"));
            }}
            onRemove={async () => {
              refreshMe(await usersApi.deleteAvatar());
              toast.success(t("profile.avatarRemoved"));
            }}
          />
        </CardSection>

        <CardSection title={t("profile.title")}>
          <ProfileForm user={user} />
        </CardSection>
        <CardSection title={t("profile.security")}>
          <PasswordForm />
        </CardSection>

        <CardSection title={t("profile.preferences")}>
          <DescriptionList
            className="sm:grid-cols-1 gap-y-5"
            items={[
              {
                label: t("profile.language"),
                value: (
                  <Segmented<Lang>
                    label={t("profile.language")}
                    value={lang}
                    onChange={setLang}
                    options={[
                      { value: "ar", label: "العربية" },
                      { value: "en", label: "English" },
                    ]}
                  />
                ),
              },
              {
                label: t("profile.themeLabel"),
                value: (
                  <Segmented<ThemeMode>
                    label={t("profile.themeLabel")}
                    value={mode}
                    onChange={setMode}
                    options={[
                      {
                        value: "light",
                        label: t("theme.light"),
                        icon: <Sun className="size-4" />,
                      },
                      {
                        value: "dark",
                        label: t("theme.dark"),
                        icon: <Moon className="size-4" />,
                      },
                      {
                        value: "system",
                        label: t("theme.system"),
                        icon: <Monitor className="size-4" />,
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        </CardSection>
      </div>
    </>
  );
}
