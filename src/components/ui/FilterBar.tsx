import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { DateField, Input, Select } from "./Field";

export type FilterField =
  | {
      type: "select";
      key: string;
      label: string;
      options: { value: string; label: string }[];
      allLabel?: string;
    }
  | {
      type: "text";
      key: string;
      label: string;
      debounceMs?: number;
      placeholder?: string;
      wide?: boolean;
    }
  | { type: "number"; key: string; label: string; min?: number; max?: number }
  | { type: "dateRange"; fromKey: string; toKey: string; label: string };

function Debounced({
  value,
  onCommit,
  ms = 350,
  ...rest
}: {
  value: string;
  onCommit: (v: string) => void;
  ms?: number;
  label: string;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  wrapperClassName?: string;
}) {
  const [local, setLocal] = useState(value);
  const debounced = useDebounce(local, ms);
  useEffect(() => {
    setLocal(value);
  }, [value]); // external changes (reset, chips, back button)
  useEffect(() => {
    if (debounced !== value)
      onCommit(
        debounced,
      ); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [debounced]);
  return (
    <Input {...rest} value={local} onChange={(e) => setLocal(e.target.value)} />
  );
}

/** Renders only the fields it is given; never add a filter the endpoint does not accept (spec §8). */
export function FilterBar({
  fields,
  values,
  onChange,
  onReset,
  className,
}: {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (patch: Record<string, string | undefined>) => void;
  onReset: () => void;
  className?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const chips: { key: string; label: string; text: string }[] = [];
  for (const f of fields) {
    if (f.type === "dateRange") {
      if (values[f.fromKey])
        chips.push({
          key: f.fromKey,
          label: `${f.label} ${t("common.from")}`,
          text: values[f.fromKey],
        });
      if (values[f.toKey])
        chips.push({
          key: f.toKey,
          label: `${f.label} ${t("common.to")}`,
          text: values[f.toKey],
        });
    } else if (values[f.key]) {
      const text =
        f.type === "select"
          ? (f.options.find((o) => o.value === values[f.key])?.label ??
            values[f.key])
          : values[f.key];
      chips.push({ key: f.key, label: f.label, text });
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 sm:hidden">
        <Button
          variant="secondary"
          size="sm"
          icon={<SlidersHorizontal className="size-4" />}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          {t("common.filters")}
          {chips.length > 0 ? ` (${chips.length})` : ""}
        </Button>
        {chips.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            {t("common.reset")}
          </Button>
        )}
      </div>

      <div
        role="search"
        className={cn(
          "grid-cols-2 items-end gap-3 rounded-card border border-line bg-surface p-4 shadow-soft md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
          open ? "grid" : "hidden sm:grid",
        )}
      >
        {fields.map((f) => {
          if (f.type === "select") {
            return (
              <Select
                key={f.key}
                label={f.label}
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  onChange({ [f.key]: e.target.value || undefined })
                }
              >
                <option value="">{f.allLabel ?? t("common.all")}</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            );
          }
          if (f.type === "text") {
            return (
              <Debounced
                key={f.key}
                label={f.label}
                ms={f.debounceMs}
                placeholder={f.placeholder}
                maxLength={150}
                wrapperClassName={
                  f.wide ? "col-span-2 md:col-span-2" : undefined
                }
                value={values[f.key] ?? ""}
                onCommit={(v) => onChange({ [f.key]: v || undefined })}
              />
            );
          }
          if (f.type === "number") {
            return (
              <Debounced
                key={f.key}
                label={f.label}
                type="number"
                min={f.min ?? 0}
                max={f.max}
                value={values[f.key] ?? ""}
                onCommit={(v) => onChange({ [f.key]: v || undefined })}
              />
            );
          }
          return (
            <div key={f.fromKey} className="col-span-2 grid grid-cols-2 gap-3">
              <DateField
                label={`${f.label} ${t("common.from")}`}
                value={values[f.fromKey] ?? ""}
                onChange={(e) =>
                  onChange({ [f.fromKey]: e.target.value || undefined })
                }
              />
              <DateField
                label={`${f.label} ${t("common.to")}`}
                value={values[f.toKey] ?? ""}
                onChange={(e) =>
                  onChange({ [f.toKey]: e.target.value || undefined })
                }
              />
            </div>
          );
        })}
        <div className="hidden sm:block">
          <Button
            variant="ghost"
            onClick={onReset}
            disabled={chips.length === 0}
          >
            {t("common.reset")}
          </Button>
        </div>
      </div>

      {chips.length > 0 && (
        <ul
          className="flex flex-wrap gap-2"
          aria-label={t("common.activeFilters")}
        >
          {chips.map((c) => (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => onChange({ [c.key]: undefined })}
                className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1 text-xs text-ink hover:bg-surface-2"
              >
                <span className="text-faint">{c.label}:</span>{" "}
                <span className="num font-medium">{c.text}</span>
                <X
                  className="size-3.5 text-faint"
                  aria-label={t("common.remove")}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
