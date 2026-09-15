/**
 * Flo gateway connection. Auth is the gateway's job.
 *
 * This app sends the Privy identity token as `Authorization: Bearer`.
 * The gateway verifies it and proxies `/van` to Vanta with `x-user-*`.
 */
import "server-only";

import { gatewayOrigin } from "@/lib/gateway/config";

export const hscConfig = {
  baseUrl: process.env.VANTA_API_BASE_URL ?? process.env.HSC_API_BASE_URL ?? `${gatewayOrigin()}/van`,
  webhookSecret: process.env.VANTA_WEBHOOK_SECRET ?? process.env.HSC_WEBHOOK_SECRET ?? "",
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "vanta_privy_session",
};
