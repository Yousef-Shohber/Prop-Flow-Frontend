import { Link } from "react-router-dom";
import { useT } from "@/i18n";
import { paths } from "@/routes/paths";

const linkCls =
  "font-medium text-ink underline decoration-accent decoration-2 underline-offset-4";

/** "Terms" and "Privacy" links; they open in a new tab so a half-filled form is never lost. */
export function TermsLink() {
  const t = useT();
  return (
    <Link to={paths.terms} target="_blank" rel="noopener" className={linkCls}>
      {t("nav.terms")}
    </Link>
  );
}
export function PrivacyLink() {
  const t = useT();
  return (
    <Link to={paths.privacy} target="_blank" rel="noopener" className={linkCls}>
      {t("nav.privacy")}
    </Link>
  );
}
