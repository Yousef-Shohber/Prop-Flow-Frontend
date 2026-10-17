import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { normalizeError } from "./errors";

const http = (status: number, data: unknown) =>
  new AxiosError("x", "ERR", undefined, undefined, {
    status,
    statusText: "",
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe("normalizeError", () => {
  it("reads the backend error code, never the message", () => {
    const e = normalizeError(http(409, { code: "UNIT_RENTED", message: "ignored" }));
    expect(e).toMatchObject({ status: 409, kind: "conflict", code: "UNIT_RENTED", retryable: false });
  });
  it("keeps validation details", () => {
    expect(normalizeError(http(400, { code: "VALIDATION_FAILED", details: ["phone must be a valid phone number"] })).details).toEqual([
      "phone must be a valid phone number",
    ]);
  });
  it("flags 429 and 5xx as retryable", () => {
    expect(normalizeError(http(429, {})).retryable).toBe(true);
    expect(normalizeError(http(503, {})).retryable).toBe(true);
  });
  it("maps a missing response to a network error", () => {
    expect(normalizeError(new AxiosError("Network Error"))).toMatchObject({ status: 0, kind: "network" });
  });
});
