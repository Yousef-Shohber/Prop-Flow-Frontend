import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useT } from "@/i18n";
import { fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { DateField, Input, Select } from "./Field";
import { Avatar } from "./Misc";

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
  | {
      type: "user";
      key: string;
      label: string;
      users: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      }[];
      placeholder?: string;
    }
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

/** Search a user by name / email; the filter value stays the user id (what the endpoint accepts). */
function UserSearchField({
  label,
  value,
  users,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  users: { id: string; firstName: string; lastName: string; email: string }[];
  placeholder?: string;
  onChange: (id: string | undefined) => void;
}) {
  const t = useT();
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = value ? users.find((u) => u.id === value) : undefined;
  const q = text.trim().toLowerCase();
  const options = (
    q
      ? users.filter((u) =>
          `${fullName(u)} ${u.email}`.toLowerCase().includes(q),
        )
      : users
  ).slice(0, 8);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  useEffect(() => setActive(0), [q]);

  const pick = (u: { id: string }) => {
    onChange(u.id);
    setOpen(false);
    setText("");
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && options[active]) {
      e.preventDefault();
      pick(options[active]);
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={box} className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {selected ? (
        <div className="flex h-11 items-center gap-2 rounded-control border border-line-strong bg-surface-2/60 px-3">
          <Avatar user={selected} size={24} />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {fullName(selected)}
          </span>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label={t("common.remove")}
            className="rounded-md p-1 text-muted hover:bg-surface-3"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search
            className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-faint"
            aria-hidden
          />
          <input
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder={placeholder}
            maxLength={150}
            autoComplete="off"
            className="h-11 w-full rounded-control border border-line-strong bg-surface ps-10 pe-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          {open && (
            <ul
              id={`${id}-list`}
              role="listbox"
              className="absolute z-30 mt-1.5 max-h-64 w-full min-w-56 overflow-auto rounded-xl border border-line bg-surface p-1 shadow-pop"
            >
              {options.length === 0 && (
                <li className="px-3 py-3 text-sm text-muted">
                  {t("empty.noResults")}
                </li>
              )}
              {options.map((u, i) => (
                <li
                  key={u.id}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(u);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2",
                    i === active && "bg-surface-2",
                  )}
                >
                  <Avatar user={u} size={28} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {fullName(u)}
                    </span>
                    <span
                      className="block truncate text-xs text-muted"
                      dir="ltr"
                      style={{ textAlign: "start" }}
                    >
                      {u.email}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
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
          : f.type === "user"
            ? fullName(f.users.find((u) => u.id === values[f.key])) || "…"
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
          if (f.type === "user") {
            return (
              <UserSearchField
                key={f.key}
                label={f.label}
                value={values[f.key] ?? ""}
                users={f.users}
                placeholder={f.placeholder}
                onChange={(id) => onChange({ [f.key]: id })}
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
