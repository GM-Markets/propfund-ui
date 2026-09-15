"use server";

import { redirect } from "next/navigation";

import { fetchGatewayMe, GatewayApiError } from "@/lib/gateway/client";
import { auth, HscApiError } from "@/lib/hsc/client";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { readCache } from "@/lib/ttl-cache";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; code: string; message: string };

export async function establishSessionAction(identityToken: string): Promise<ActionResult> {
  const token = identityToken.trim();
  if (!token) {
    return { ok: false, code: "UNKNOWN", message: "Missing identity token" };
  }
  await setSessionCookie(token, null);
  try {
    await fetchGatewayMe(token);
  } catch (error) {
    await clearSessionCookie();
    const message =
      error instanceof GatewayApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Gateway rejected the identity token";
    return { ok: false, code: error instanceof GatewayApiError ? error.code : "UNAUTHORIZED", message };
  }
  try {
    await auth.me();
  } catch (error) {
    if (error instanceof HscApiError && (error.status === 401 || error.status === 403)) {
      await clearSessionCookie();
      return { ok: false, code: error.code, message: error.message };
    }
    // Desk claim is best-effort — session is the gateway profile.
  }
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  readCache.invalidate();
  await clearSessionCookie();
  redirect("/login");
}
