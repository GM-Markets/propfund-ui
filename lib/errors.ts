/**
 * Human-readable copy for known API error codes. Keeps the UI from ever
 * showing a raw JSON blob or an opaque code to an end user. Unknown codes fall
 * back to the server message (already cleaned by the hsc client) or a generic
 * line.
 */
const FRIENDLY: Record<string, string> = {
  UNKNOWN: "Something went wrong. Please try again.",
  HS_INTERNAL_ERROR: "Our server hit an unexpected error. Please try again in a moment.",
  V2_INVALID_CREDENTIALS: "That email or password doesn't match our records.",
  V2_EMAIL_NOT_VERIFIED: "Please verify your email before signing in.",
  V2_OTP_INVALID: "That code is incorrect or has expired. Request a new one.",
  V2_OTP_EXPIRED: "That code has expired. Request a new one.",
  // The API emits ``V2_EMAIL_EXISTS`` (M5 normalized-email uniqueness). The
  // ``V2_EMAIL_TAKEN`` alias is kept for backwards-compat with older builds.
  V2_EMAIL_EXISTS: "An account with this email already exists. Try signing in.",
  V2_EMAIL_TAKEN: "An account with this email already exists. Try signing in.",
  // Login throttle (H1). The API includes a retry-after hint in the message.
  V2_THROTTLED: "Too many login attempts. Please wait a moment and try again.",
  V2_RATE_LIMITED: "Too many attempts. Please wait a moment and try again.",
  // MFA challenge incomplete — surfaced when a partially-authenticated client
  // tries to access a protected route before submitting the second factor.
  V2_MFA_PENDING: "Two-factor verification is required to continue.",
  // OAuth/scope errors — usually means the platform owner needs to grant the
  // tenant a wider ``allowed_scopes`` list.
  V2_INVALID_SCOPE: "This app isn't allowed to request that capability. Contact support.",
  V2_SCOPE_MISSING: "This app doesn't have permission to access that resource.",
  V2_AGREEMENT_REQUIRED: "Sign the current agreement before you trade or buy a challenge.",
  V2_KYC_NOT_CONFIGURED: "Identity verification isn't available right now.",
  V2_SUMSUB_NOT_CONFIGURED: "Identity verification isn't configured for this app yet.",
  V2_SUMSUB_HTTP: "Identity verification provider is temporarily unavailable.",
  V2_PAYMENTS_NOT_CONFIGURED: "Payments aren't configured for this app yet.",
  V2_DEV_SIMULATE_DISABLED: "Simulated KYC and payments are only available in development.",
  VANTA_UNREACHABLE: "Can't reach the desk service. Start the gateway and Vanta locally.",
};

export function friendlyError(code: string | undefined, fallback?: string): string {
  if (fallback?.includes("spot sell exceeds long inventory")) {
    return "You can only sell spot you already hold.";
  }
  if (code && FRIENDLY[code]) return FRIENDLY[code];
  if (fallback && fallback.trim() && !fallback.trim().startsWith("{")) return fallback;
  return FRIENDLY.UNKNOWN;
}
