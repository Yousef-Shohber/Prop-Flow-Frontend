import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Remove empty / undefined values so they are never sent as query params. */
export function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj))
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  return out as Partial<T>;
}
