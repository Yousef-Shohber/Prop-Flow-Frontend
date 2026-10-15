import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/lib/env";
import { normalizeError } from "@/lib/errors";
import { sleep } from "@/lib/utils";
import type { ApiResponse, Paginated } from "@/types/api";

// ---- access token lives in a module-level variable ONLY (never storage) ----
let accessToken: string | null = null;
export const getAccessToken = () => accessToken;
export const setAccessToken = (t: string | null) => {
  accessToken = t;
};

export type SessionEndReason = "expired" | "inactive";
let onSessionEnded: ((reason: SessionEndReason) => void) | null = null;
export const setSessionEndedHandler = (
  fn: ((reason: SessionEndReason) => void) | null,
) => {
  onSessionEnded = fn;
};

export const api = axios.create({
  baseURL: env.apiBase,
  withCredentials: true,
  timeout: 60_000,
});

if (env.mock && import.meta.env.DEV) {
  // Dev-only in-memory backend. The branch is removed from production bundles.
  const { installMockAdapter } = await import("@/mocks/adapter");
  installMockAdapter(api);
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.set("Authorization", `Bearer ${accessToken}`);
  return config;
});

// ---- single in-flight refresh, shared by every concurrent 401 ----
let refreshing: Promise<string> | null = null;

async function callRefresh(): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  // bare axios call: no interceptors, so a failing refresh can never loop
  const doCall = () =>
    axios.post<ApiResponse<{ accessToken: string; expiresIn: number }>>(
      `${env.apiBase}/auth/refresh`,
      null,
      {
        withCredentials: true,
        timeout: 20_000,
        adapter: api.defaults.adapter,
      },
    );
  try {
    return (await doCall()).data.data;
  } catch (e) {
    // refresh shares the 5/min /auth limit: on 429 wait briefly and retry once, never log out for it
    if (axios.isAxiosError(e) && e.response?.status === 429) {
      await sleep(1500);
      return (await doCall()).data.data;
    }
    throw e;
  }
}

export function refreshSession(): Promise<string> {
  if (!refreshing) {
    refreshing = callRefresh()
      .then((r) => {
        setAccessToken(r.accessToken);
        return r.accessToken;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

type Retriable = InternalAxiosRequestConfig & { _retried?: boolean };
const isAuthPath = (url?: string) => !!url && /\/auth\//.test(url);

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as Retriable | undefined;
    const status = error.response?.status;
    const code = (error.response?.data as { code?: string } | undefined)?.code;

    if (status === 401 && original && !isAuthPath(original.url)) {
      if (code === "ACCOUNT_INACTIVE") {
        setAccessToken(null);
        onSessionEnded?.("inactive");
        return Promise.reject(error);
      }
      if (!original._retried) {
        original._retried = true;
        try {
          const token = await refreshSession();
          original.headers.set("Authorization", `Bearer ${token}`);
          return api(original);
        } catch (refreshErr) {
          const st = axios.isAxiosError(refreshErr)
            ? refreshErr.response?.status
            : undefined;
          if (
            st === 429 ||
            !axios.isAxiosError(refreshErr) ||
            !refreshErr.response
          )
            return Promise.reject(error); // keep the session
          setAccessToken(null);
          onSessionEnded?.("expired");
          return Promise.reject(error);
        }
      }
    }
    return Promise.reject(error);
  },
);

// ---- thin wrappers: every endpoint function returns unwrapped `data` ----
export async function get<T>(
  url: string,
  params?: object,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    return (await api.get<ApiResponse<T>>(url, { params, ...config })).data
      .data;
  } catch (e) {
    throw normalizeError(e);
  }
}
export async function getList<T>(
  url: string,
  params?: object,
): Promise<Paginated<T>> {
  try {
    const res = (await api.get<ApiResponse<T[]>>(url, { params })).data;
    return {
      data: res.data ?? [],
      meta: res.meta ?? {
        page: 1,
        limit: res.data?.length ?? 0,
        total: res.data?.length ?? 0,
        totalPages: 1,
      },
    };
  } catch (e) {
    throw normalizeError(e);
  }
}
export async function post<T = unknown>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    return (await api.post<ApiResponse<T>>(url, body, config)).data.data;
  } catch (e) {
    throw normalizeError(e);
  }
}
export async function patch<T = unknown>(
  url: string,
  body?: unknown,
): Promise<T> {
  try {
    return (await api.patch<ApiResponse<T>>(url, body)).data.data;
  } catch (e) {
    throw normalizeError(e);
  }
}
export async function del<T = unknown>(
  url: string,
  body?: unknown,
): Promise<T> {
  try {
    return (
      await api.delete<ApiResponse<T>>(url, body ? { data: body } : undefined)
    ).data.data;
  } catch (e) {
    throw normalizeError(e);
  }
}
/** Booleans go out as the literal strings "true"/"false" (spec §1). */
export const qs = (p: object) => {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(p as Record<string, unknown>)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = typeof v === "boolean" ? String(v) : (v as string | number);
  }
  return out;
};
export function toFormData(
  fields: Record<string, string | number | undefined | null>,
  files: Record<string, File[]> = {},
): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields))
    if (v !== undefined && v !== null && v !== "") fd.append(k, String(v));
  for (const [k, list] of Object.entries(files))
    list.forEach((f) => fd.append(k, f));
  return fd;
}

export const progress = (
  cb?: (pct: number) => void,
): AxiosRequestConfig | undefined =>
  cb
    ? {
        onUploadProgress: (e) =>
          cb(Math.round(((e.loaded ?? 0) * 100) / (e.total || e.loaded || 1))),
      }
    : undefined;
