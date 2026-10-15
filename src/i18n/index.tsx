import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "./en";
import ar from "./ar";

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Widen<U>[]
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T;
export type Dict = Widen<typeof en>;
export type Lang = "ar" | "en";

const dicts: Record<Lang, Dict> = { en, ar };
export const dir = (lang: Lang) => (lang === "ar" ? "rtl" : "ltr");

function resolve(d: unknown, key: string): unknown {
  let cur: any = d;
  for (const part of key.split(".")) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}
const interpolate = (s: string, vars?: Record<string, string | number>) =>
  vars
    ? s.replace(/\{(\w+)\}/g, (_, k) =>
        vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
      )
    : s;

export type TFn = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

interface I18nValue {
  lang: Lang;
  dir: "rtl" | "ltr";
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: TFn;
  has: (key: string) => boolean;
  raw: <T = unknown>(key: string) => T;
}
const I18nContext = createContext<I18nValue | null>(null);

const readLang = (): Lang => {
  try {
    const v = localStorage.getItem("pf-lang");
    if (v === "ar" || v === "en") return v;
  } catch {
    /* ignore */
  }
  return import.meta.env.VITE_DEFAULT_LANG === "en" ? "en" : "ar";
};

export function I18nProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initial ?? readLang());

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dir(lang);
    document.title =
      lang === "ar"
        ? "PropFlow — إدارة العقارات والإيجارات في مكان واحد"
        : "PropFlow — Property and rental management in one place";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("pf-lang", l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const d = dicts[lang];
    const t: TFn = (key, vars) => {
      const v = resolve(d, key) ?? resolve(dicts.en, key);
      if (typeof v !== "string") return key;
      return interpolate(v, vars);
    };
    return {
      lang,
      dir: dir(lang),
      setLang,
      toggleLang: () => setLang(lang === "ar" ? "en" : "ar"),
      t,
      has: (key) => typeof resolve(d, key) === "string",
      raw: <T,>(key: string) =>
        (resolve(d, key) ?? resolve(dicts.en, key)) as T,
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
export const useT = () => useI18n().t;

export type EnumFamily =
  | "unit"
  | "lease"
  | "rr"
  | "lrr"
  | "mnt"
  | "pri"
  | "cat"
  | "ptype"
  | "role"
  | "notif"
  | "audit";
export function enumLabel(
  t: TFn,
  has: (k: string) => boolean,
  family: EnumFamily,
  value: string | null | undefined,
): string {
  if (!value) return "—";
  const key = `e.${family}.${value}`;
  if (has(key)) return t(key);
  const s = value.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export function useEnumLabel() {
  const { t, has } = useI18n();
  return useCallback(
    (family: EnumFamily, value: string | null | undefined) =>
      enumLabel(t, has, family, value),
    [t, has],
  );
}
