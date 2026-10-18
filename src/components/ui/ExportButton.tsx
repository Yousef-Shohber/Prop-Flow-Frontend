import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/hooks/useToast";
import { useI18n } from "@/i18n";
import { downloadCSV, toCSV, type CsvCell } from "@/lib/csv";
import { todayISO } from "@/lib/dates";
import { EXPORT_CAP } from "@/lib/fetchAll";
import { useApiError } from "@/lib/useApiError";

export interface ExportData {
  headers: string[];
  rows: CsvCell[][];
  truncated?: boolean;
}

/** Fetches every page matching the current filters on click, then downloads `<name>-YYYY-MM-DD.csv`. */
export function ExportButton({
  name,
  load,
  disabled,
}: {
  /** file name without date/extension, e.g. "leases" */
  name: string;
  load: () => Promise<ExportData>;
  disabled?: boolean;
}) {
  const { t, lang } = useI18n();
  const apiError = useApiError();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const d = await load();
      if (d.rows.length === 0) {
        toast.info(t("export.nothing"));
        return;
      }
      downloadCSV(`${name}-${todayISO()}.csv`, toCSV(d.headers, d.rows));
      toast.success(
        d.truncated
          ? t("export.truncated", {
              n: new Intl.NumberFormat(
                lang === "ar" ? "ar-EG-u-nu-latn" : "en-GB",
              ).format(EXPORT_CAP),
            })
          : t("export.done", { n: d.rows.length }),
      );
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button
      variant="secondary"
      icon={<Download className="size-4" />}
      loading={busy}
      disabled={disabled}
      onClick={run}
      className="no-print"
    >
      {t("export.csv")}
    </Button>
  );
}
