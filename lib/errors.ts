/**
 * User-facing error copy. Service errors (lib/propfund/mock/errors.ts) already
 * carry friendly messages; this maps generic codes and guards against raw
 * payloads or blank messages ever reaching the UI.
 */
const FRIENDLY: Record<string, string> = {
  UNKNOWN: "Something went wrong. Please try again.",
  NETWORK: "Couldn't reach the server. Check your connection and try again.",
  UNAUTHENTICATED: "Sign in to continue.",
  NOT_READY: "Your account is still loading. Try again in a moment.",
  RATE_LIMITED: "Too many attempts. Please wait a moment and try again.",
};

export function friendlyError(code: string | undefined, fallback?: string): string {
  if (code && FRIENDLY[code]) return FRIENDLY[code];
  if (fallback && fallback.trim() && !fallback.trim().startsWith("{")) return fallback;
  return FRIENDLY.UNKNOWN;
}

/** Message for any thrown value: a service error's own copy, else a generic line. */
export function errorMessage(e: unknown): string {
  if (e && typeof e === "object") {
    const { code, message } = e as { code?: unknown; message?: unknown };
    return friendlyError(typeof code === "string" ? code : undefined, typeof message === "string" ? message : undefined);
  }
  return FRIENDLY.UNKNOWN;
}
