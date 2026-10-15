import { useCallback } from "react";
import { useI18n } from "@/i18n";
import { normalizeError, type NormalizedError } from "./errors";

/** Server error -> translated text. The `code` decides, never the English `message`. */
export function useApiError() {
  const { t, has } = useI18n();
  return useCallback(
    (error: unknown): string => {
      const e: NormalizedError = normalizeError(error);
      if (e.kind === "network") return t("err.NETWORK");
      if (has(`err.${e.code}`)) return t(`err.${e.code}`);
      const byStatus = has(`err.status.${e.status}`)
        ? t(`err.status.${e.status}`)
        : e.status >= 500
          ? t("err.status.500")
          : t("err.status.400");
      return byStatus;
    },
    [t, has],
  );
}
