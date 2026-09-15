import "server-only";

import { createHmac } from "crypto";

/** Same default the gateway uses when `GATEWAY_WS_AUTH_SECRET` is unset. */
const FALLBACK_SECRET = "cmFuZG9tLXNlY3JldC1rZXktZm9yLWZlZWQ=";

export function gatewayWsAuthPayload(nonce: string, ts: number): string {
  return `${nonce}.${ts}`;
}

function gatewayWsAuthSecret(): string {
  return process.env.GATEWAY_WS_AUTH_SECRET?.trim() || FALLBACK_SECRET;
}

export function signGatewayWsChallenge(nonce: string, ts: number): string {
  if (!nonce.trim() || !Number.isFinite(ts)) {
    throw new Error("nonce and ts are required");
  }
  return createHmac("sha256", gatewayWsAuthSecret())
    .update(gatewayWsAuthPayload(nonce.trim(), ts))
    .digest("hex");
}

export function isGatewayWsAuthSecretConfigured(): boolean {
  return Boolean(gatewayWsAuthSecret());
}
