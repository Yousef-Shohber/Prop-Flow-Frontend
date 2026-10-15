import axios from "axios";
import type { ApiErrorBody } from "@/types/api";

export type ErrorKind =
  | "network"
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "unprocessable"
  | "rateLimit"
  | "server"
  | "unknown";

export interface NormalizedError {
  status: number; // 0 when there was no response
  kind: ErrorKind;
  code: string;
  message: string; // server text — fallback only, never parsed
  details?: string[];
  retryable: boolean;
}

const kindFor = (status: number): ErrorKind => {
  if (status === 0) return "network";
  if (status === 400) return "validation";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  if (status === 409) return "conflict";
  if (status === 422) return "unprocessable";
  if (status === 429) return "rateLimit";
  if (status >= 500) return "server";
  return "unknown";
};

/** One normalizer for every API wrapper (spec §7.1). Branch on `code`/`status`, never on `message`. */
export function normalizeError(error: unknown): NormalizedError {
  if (
    (error as NormalizedError)?.kind &&
    typeof (error as NormalizedError).status === "number"
  ) {
    return error as NormalizedError;
  }
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return {
        status: 0,
        kind: "network",
        code: "NETWORK_ERROR",
        message: error.message,
        retryable: true,
      };
    }
    const status = error.response.status;
    const body = (error.response.data ?? {}) as Partial<ApiErrorBody>;
    const details = Array.isArray(body.details)
      ? body.details.map(String)
      : undefined;
    return {
      status,
      kind: kindFor(status),
      code:
        typeof body.code === "string"
          ? body.code
          : body.error?.toString().toUpperCase().replace(/\s+/g, "_") ||
            String(status),
      message: typeof body.message === "string" ? body.message : "",
      details,
      retryable: status >= 500 || status === 429,
    };
  }
  const msg = error instanceof Error ? error.message : "Unknown error";
  return {
    status: -1,
    kind: "unknown",
    code: "UNKNOWN",
    message: msg,
    retryable: false,
  };
}

/** Every 404/403 family carries a resource-specific code — branch on the status for those. */
export const isGone = (e: NormalizedError) =>
  e.status === 404 || e.status === 403;

/**
 * Map server `details[]` strings (class-validator style: "name must be ...") onto form fields.
 * Returns the messages that could not be matched to a field.
 */
export function mapDetailsToFields(
  details: string[] | undefined,
  fields: readonly string[],
  setError: (name: any, error: { type: string; message: string }) => void,
): string[] {
  const rest: string[] = [];
  for (const d of details ?? []) {
    const first = d.trim().split(/[\s.]/)[0];
    const hit = fields.find(
      (f) => f === first || f.toLowerCase() === first.toLowerCase(),
    );
    if (hit) setError(hit, { type: "server", message: d });
    else rest.push(d);
  }
  return rest;
}
