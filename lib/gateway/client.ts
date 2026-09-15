/**
 * Flo gateway identity. `GET /api/users/me` is the session — not Vanta `/van/v2/me`.
 */
import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import { hscConfig } from "@/lib/hsc/config";

import { gatewayApiBase } from "./config";
import { unwrapGatewayProfile, type GatewayProfile } from "./profile";

export class GatewayApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "GatewayApiError";
  }
}

async function sessionToken(override?: string): Promise<string | undefined> {
  return override ?? (await cookies()).get(hscConfig.sessionCookieName)?.value;
}

function readError(parsed: unknown, statusText: string): { code: string; message: string } {
  const env = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  const nested =
    env?.error && typeof env.error === "object"
      ? (env.error as Record<string, unknown>)
      : env?.detail && typeof env.detail === "object"
        ? (env.detail as Record<string, unknown>)
        : env;
  const code = nested && typeof nested.code === "string" ? nested.code : typeof env?.type === "string" ? env.type : "UNKNOWN";
  const message =
    (nested && typeof nested.message === "string" && nested.message) ||
    (typeof env?.message === "string" && env.message) ||
    statusText;
  return { code, message };
}

export async function fetchGatewayMe(sessionTokenOverride?: string): Promise<GatewayProfile> {
  const token = await sessionToken(sessionTokenOverride);
  if (!token) {
    throw new GatewayApiError(401, "UNAUTHORIZED", "Sign in again to continue.");
  }

  let resp: Response;
  try {
    resp = await fetch(`${gatewayApiBase()}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    throw new GatewayApiError(
      504,
      timedOut ? "GATEWAY_TIMEOUT" : "GATEWAY_UNREACHABLE",
      timedOut
        ? `Gateway did not respond in time (${gatewayApiBase()})`
        : e instanceof Error
          ? e.message
          : "Gateway unreachable",
    );
  }

  const text = await resp.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = text;
    }
  }
  if (!resp.ok) {
    const err = readError(parsed, resp.statusText);
    throw new GatewayApiError(resp.status, err.code, err.message);
  }
  const profile = unwrapGatewayProfile(parsed);
  if (!profile) {
    throw new GatewayApiError(502, "INVALID_PROFILE", "Gateway /users/me did not return a profile");
  }
  return profile;
}

/** One `/api/users/me` per server render. */
export const getGatewayMe = cache(() => fetchGatewayMe());
