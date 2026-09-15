"use server";

import { redirect } from "next/navigation";

import { HscApiError, auth } from "@/lib/hsc/client";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

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
    await auth.me();
  } catch (error) {
    await clearSessionCookie();
    const message =
      error instanceof HscApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Gateway rejected the identity token";
    return { ok: false, code: error instanceof HscApiError ? error.code : "UNAUTHORIZED", message };
  }
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login?signedOut=1");
}
