import { useCallback } from "react";
import { useI18n } from "@/i18n";
import type { AppNotification } from "@/types/models";

/**
 * The single place that localizes notifications. The API text is English; in the Arabic UI the
 * matching localized sentence for the notification type is used (falling back to the server text).
 */
export function useNotificationText() {
  const { t, lang, has } = useI18n();
  return useCallback(
    (n: Pick<AppNotification, "type" | "title" | "message">) => {
      const loc = lang === "ar" && has(`notifText.${n.type}.title`);
      return {
        localized: loc,
        title: loc ? t(`notifText.${n.type}.title`) : n.title,
        message: loc ? t(`notifText.${n.type}.message`) : n.message,
      };
    },
    [t, lang, has],
  );
}
