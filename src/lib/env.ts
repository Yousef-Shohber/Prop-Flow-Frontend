export const env = {
  apiBase:
    (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api/v1",
  googleEnabled: String(import.meta.env.VITE_GOOGLE_OAUTH_ENABLED) === "true",
  currency: (import.meta.env.VITE_CURRENCY_CODE as string | undefined) || "EGP",
  supportEmail:
    (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) || "",
  /** digits only with country code, e.g. 201001234567 */
  whatsapp: (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) || "",
  timezone:
    (import.meta.env.VITE_APP_TIMEZONE as string | undefined) || "Africa/Cairo",
  mock: String(import.meta.env.VITE_MOCK) === "true",
};
