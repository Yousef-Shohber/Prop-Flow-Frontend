import { env } from "@/lib/env";

/** Only WhatsApp and email, and only when configured in the environment. */
export const hasContactInfo = () => !!(env.supportEmail || env.whatsapp);

export const waDigits = () => env.whatsapp.replace(/\D/g, "");
export const waLink = () => `https://wa.me/${waDigits()}`;
