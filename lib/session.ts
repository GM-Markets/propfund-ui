/**
 * End-user session cookie — the Privy identity token sent as
 * `Authorization: Bearer` to the Flo gateway `/van` routes.
 */
import "server-only";

import { cookies } from "next/headers";

import { hscConfig } from "./hsc/config";

const ONE_DAY_SECONDS = 60 * 60 * 24;

export async function setSessionCookie(
  sessionToken: string,
  expiresAtIso: string | null,
): Promise<void> {
  const jar = await cookies();
  const expires = expiresAtIso ? new Date(expiresAtIso) : new Date(Date.now() + ONE_DAY_SECONDS * 1000);
  jar.set({
    name: hscConfig.sessionCookieName,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set({
    name: hscConfig.sessionCookieName,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function getSessionTokenFromCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(hscConfig.sessionCookieName)?.value;
}
