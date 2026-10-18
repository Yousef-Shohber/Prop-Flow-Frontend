import * as RD from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CornerDownLeft,
  Languages,
  LogOut,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { propertiesApi } from "@/api/properties";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { navFor } from "./nav";
import type { LucideIcon } from "lucide-react";

export const PALETTE_EVENT = "pf:open-palette";
export const openPalette = () => window.dispatchEvent(new Event(PALETTE_EVENT));

interface Cmd {
  id: string;
  group: string;
  label: string;
  icon: LucideIcon;
  run: () => void;
}

/** Ctrl/Cmd+K: jump to any page, switch language or theme, sign out, or find a property by name. */
export function CommandPalette() {
  const { t, lang, toggleLang } = useI18n();
  const { role, logout } = useAuth();
  const { resolved, cycle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [debounced, setDebounced] = useState("");
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(PALETTE_EVENT, onOpen);
    };
  }, []);
  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  const canSearch = !!role && role !== "MAINTENANCE_STAFF";
  const found = useQuery({
    queryKey: ["properties", "palette", debounced],
    queryFn: () => propertiesApi.list({ search: debounced, limit: 5 }),
    enabled: open && canSearch && debounced.length >= 2,
    staleTime: 30_000,
  });

  const go = (to: string) => () => navigate(to);
  const commands = useMemo<Cmd[]>(() => {
    const pages: Cmd[] = navFor(role)
      .flatMap((g) => g.items)
      .map((i) => ({
        id: i.to,
        group: t("palette.pages"),
        label: t(i.labelKey),
        icon: i.icon,
        run: go(i.to),
      }));
    const actions: Cmd[] = [
      {
        id: "lang",
        group: t("palette.actions"),
        label: t("palette.lang"),
        icon: Languages,
        run: toggleLang,
      },
      {
        id: "theme",
        group: t("palette.actions"),
        label: resolved === "dark" ? t("palette.light") : t("palette.dark"),
        icon: resolved === "dark" ? Sun : Moon,
        run: cycle,
      },
      {
        id: "logout",
        group: t("palette.actions"),
        label: t("nav.logout"),
        icon: LogOut,
        run: () => void logout(),
      },
    ];
    const props: Cmd[] = (found.data?.data ?? []).map((p) => ({
      id: `p-${p.id}`,
      group: t("palette.properties"),
      label: p.name,
      icon: Building2,
      run: go(paths.property(p.id)),
    }));
    const q = query.trim().toLocaleLowerCase(lang);
    const match = (c: Cmd) => !q || c.label.toLocaleLowerCase(lang).includes(q);
    return [...props, ...pages.filter(match), ...actions.filter(match)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, t, query, resolved, found.data, lang]);

  useEffect(() => setActive(0), [query, found.data]);
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const choose = (c?: Cmd) => {
    if (!c) return;
    setOpen(false);
    setTimeout(c.run, 0);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(commands.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(commands[active]);
    }
  };

  let lastGroup = "";
  return (
    <RD.Root open={open} onOpenChange={setOpen}>
      <RD.Portal>
        <RD.Overlay
          className="no-print fixed inset-0 z-50 bg-[#0a1020]/55 backdrop-blur-[2px]"
          style={{ animation: "fade-in .15s ease-out" }}
        />
        <RD.Content
          aria-describedby={undefined}
          className="no-print fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-sheet border border-line bg-surface shadow-pop focus:outline-none"
        >
          <RD.Title className="sr-only">{t("palette.title")}</RD.Title>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="size-5 shrink-0 text-faint" aria-hidden />
            <input
              autoFocus
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={
                commands[active] ? `${listId}-${active}` : undefined
              }
              aria-label={t("palette.title")}
              placeholder={t("palette.placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              dir="auto"
              className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-faint"
            />
            <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-xs text-faint sm:block">
              Esc
            </kbd>
          </div>
          <ul
            id={listId}
            role="listbox"
            ref={listRef}
            className="max-h-[50vh] overflow-y-auto p-2"
          >
            {commands.length === 0 && (
              <li
                role="presentation"
                className="px-3 py-8 text-center text-sm text-muted"
              >
                {t("palette.none")}
              </li>
            )}
            {commands.map((c, i) => {
              const header = c.group !== lastGroup;
              lastGroup = c.group;
              return (
                <li key={c.id} role="presentation">
                  {header && (
                    <p className="px-3 pb-1 pt-3 text-xs font-semibold text-faint">
                      {c.group}
                    </p>
                  )}
                  <div
                    id={`${listId}-${i}`}
                    data-idx={i}
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => choose(c)}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm",
                      i === active
                        ? "bg-accent-soft text-accent-ink"
                        : "text-ink",
                    )}
                  >
                    <c.icon className="size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate" dir="auto">
                      {c.label}
                    </span>
                    {i === active && (
                      <CornerDownLeft
                        className="size-3.5 shrink-0 opacity-60 rtl:-scale-x-100"
                        aria-hidden
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
