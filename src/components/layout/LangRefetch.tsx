import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { usersApi } from "@/api/users";
import { meKey, useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";

/** When the language changes, refetch data so server-provided text (names, places, descriptions) follows the language. */
export function LangRefetch() {
  const { lang } = useI18n();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    void qc.invalidateQueries();
    // the signed-in user's own record has no query observer: refresh it explicitly (header name, profile)
    if (isAuthenticated)
      usersApi
        .me()
        .then((me) => qc.setQueryData(meKey, me))
        .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);
  return null;
}
