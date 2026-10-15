import { useSyncExternalStore } from "react";

export type ToastKind = "success" | "error" | "info";
export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function push(kind: ToastKind, message: string, ttl = 5000) {
  const id = ++seq;
  items = [...items.slice(-3), { id, kind, message }];
  emit();
  if (ttl > 0) setTimeout(() => dismiss(id), ttl);
  return id;
}
export function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

/** toast.success("Lease activated") — always a specific message, never just "Success". */
export const toast = {
  success: (m: string) => push("success", m),
  error: (m: string) => push("error", m, 7000),
  info: (m: string) => push("info", m),
};
export function useToasts() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => items,
    () => items,
  );
}
