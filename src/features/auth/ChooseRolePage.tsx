import { Building, KeyRound, TriangleAlert } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usersApi } from "@/api/users";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Misc";
import { meKey } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { normalizeError } from "@/lib/errors";
import { useApiError } from "@/lib/useApiError";
import { cn } from "@/lib/utils";
import { ROLE_HOME } from "@/routes/paths";
import { AuthLayout } from "./AuthLayout";

export default function ChooseRolePage() {
  const { t } = useI18n();
  const apiError = useApiError();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [role, setRole] = useState<"TENANT" | "OWNER" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!role) return;
    setBusy(true);
    setError(null);
    try {
      const me = await usersApi.selectRole(role);
      qc.setQueryData(meKey, me);
      navigate(ROLE_HOME[me.role], { replace: true });
    } catch (e) {
      if (normalizeError(e).code === "ROLE_ALREADY_SELECTED") {
        // not a failure: someone already chose
        const me = await usersApi.me();
        qc.setQueryData(meKey, me);
        navigate(ROLE_HOME[me.role], { replace: true });
      } else setError(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const options = [
    {
      value: "TENANT" as const,
      icon: KeyRound,
      title: t("auth.role.tenant"),
      desc: t("auth.role.tenantDesc"),
    },
    {
      value: "OWNER" as const,
      icon: Building,
      title: t("auth.role.owner"),
      desc: t("auth.role.ownerDesc"),
    },
  ];
  return (
    <AuthLayout title={t("auth.role.title")} subtitle={t("auth.role.subtitle")}>
      <div className="space-y-5">
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          role="radiogroup"
          aria-label={t("auth.role.title")}
        >
          {options.map((o) => (
            <label
              key={o.value}
              className={cn(
                "flex cursor-pointer flex-col gap-2 rounded-card border-2 p-5 transition-all focus-within:ring-2 focus-within:ring-ring/40",
                role === o.value
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-surface hover:border-line-strong",
              )}
            >
              <input
                type="radio"
                name="role"
                className="sr-only"
                checked={role === o.value}
                onChange={() => setRole(o.value)}
              />
              <o.icon
                className={cn(
                  "size-7",
                  role === o.value ? "text-accent-ink" : "text-muted",
                )}
                aria-hidden
              />
              <span className="text-base font-semibold">{o.title}</span>
              <span className="text-sm text-muted">{o.desc}</span>
            </label>
          ))}
        </div>
        <p className="flex items-start gap-2 text-sm text-muted">
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-[var(--amber-dot)]"
            aria-hidden
          />
          {t("auth.role.warning")}
        </p>
        {error && <Banner tone="red">{error}</Banner>}
        <Button
          size="lg"
          className="w-full"
          disabled={!role}
          loading={busy}
          onClick={submit}
        >
          {role
            ? t("auth.role.confirm", {
                role:
                  role === "TENANT"
                    ? t("auth.role.tenant")
                    : t("auth.role.owner"),
              })
            : t("auth.role.pick")}
        </Button>
      </div>
    </AuthLayout>
  );
}
