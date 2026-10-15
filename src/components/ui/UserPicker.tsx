import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useRef, useState } from "react";
import { usersApi } from "@/api/users";
import { useDebounce } from "@/hooks/useDebounce";
import { useT } from "@/i18n";
import { fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DirectoryUser } from "@/types/models";
import { Avatar } from "./Misc";
import { Spinner } from "./Button";

/** Type-ahead over GET /users/directory (spec §11): the only way to pick tenants / technicians by name. */
export function UserPicker({
  role,
  value,
  onChange,
  label,
  error,
  placeholder,
  disabled,
}: {
  role: "TENANT" | "MAINTENANCE_STAFF";
  value: DirectoryUser | null;
  onChange: (u: DirectoryUser | null) => void;
  label: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const t = useT();
  const id = useId();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const debounced = useDebounce(text.trim(), 300);
  const box = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["users", "directory", role, debounced],
    queryFn: () =>
      usersApi.directory({ role, search: debounced || undefined, limit: 8 }),
    enabled: open && !value,
  });
  const options = data?.data ?? [];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  useEffect(() => setActive(0), [debounced]);

  const pick = (u: DirectoryUser) => {
    onChange(u);
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
      {value ? (
        <div className="flex items-center gap-3 rounded-control border border-line-strong bg-surface-2/60 px-3 py-2">
          <Avatar user={value} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{fullName(value)}</p>
            <p
              className="truncate text-xs text-muted"
              dir="ltr"
              style={{ textAlign: "start" }}
            >
              {value.email}
            </p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={t("common.remove")}
              className="rounded-md p-1 text-muted hover:bg-surface-3"
            >
              <X className="size-4" />
            </button>
          )}
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
            aria-invalid={!!error || undefined}
            disabled={disabled}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder={placeholder ?? t("leases.pickTenant")}
            maxLength={150}
            autoComplete="off"
            className="h-11 w-full rounded-control border border-line-strong bg-surface ps-10 pe-9 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 aria-[invalid=true]:border-danger"
          />
          {isFetching && (
            <Spinner className="absolute inset-y-0 end-3 my-auto size-4" />
          )}
          {open && (
            <ul
              id={`${id}-list`}
              role="listbox"
              className="absolute z-30 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-pop"
            >
              {options.length === 0 && !isFetching && (
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
                  <Avatar user={u} size={30} />
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
      {error && (
        <p role="alert" className="text-xs font-medium text-[var(--red-fg)]">
          {error}
        </p>
      )}
    </div>
  );
}
