/**
 * Single place that reads environment variables for the Propfund app (PRD §13).
 * Components and hooks import from here; nothing else touches `process.env`.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time, so each one must be read
 * with its literal name.
 */

/** Sign-in app ID. Empty string when not configured. */
export const PRIVY_APP_ID: string = (process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "").trim();

/** Optional sign-in client ID. */
export const PRIVY_CLIENT_ID: string | undefined =
  (process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID ?? "").trim() || undefined;

/** `NEXT_PUBLIC_TEST_CONTROLS=true`. Never set in production. */
export const TEST_CONTROLS_FLAG: boolean = process.env.NEXT_PUBLIC_TEST_CONTROLS === "true";

export const IS_PRODUCTION_BUILD: boolean = process.env.NODE_ENV === "production";

/**
 * `NEXT_PUBLIC_DEMO_BUILD=true` — a production build made for local review, so
 * routes are prefetched and navigation is instant while the test controls and
 * the local test sign-in still work. **Never set it for the deployed app.**
 */
export const DEMO_BUILD: boolean = process.env.NEXT_PUBLIC_DEMO_BUILD === "true";

/** The test controls drawer: flag on, and either dev or an explicit demo build (PRD §12). */
export const TEST_CONTROLS_ENABLED: boolean = TEST_CONTROLS_FLAG && (!IS_PRODUCTION_BUILD || DEMO_BUILD);

export type AuthMode = "privy" | "mock";

/**
 * - `privy`: an app ID is set, real sign-in (email, Google, wallet).
 * - `mock`: no app ID. "Continue with Google" signs in a demo user whose data
 *   lives in this browser only. No Google account is contacted. Used locally
 *   and on preview/demo deployments until the sign-in app ID is configured.
 */
export const AUTH_MODE: AuthMode = PRIVY_APP_ID ? "privy" : "mock";

/** Published payout wallet for the transparency page, or null (show "Published at launch"). */
export const PAYOUT_WALLET_ARBITRUM: string | null =
  (process.env.NEXT_PUBLIC_PAYOUT_WALLET_ARBITRUM ?? "").trim() || null;

/** JSON map of chain → treasury address for the transparency page. Invalid JSON → {}. */
export const TREASURY_ADDRESSES: Partial<Record<string, string>> = parseAddressMap(
  process.env.NEXT_PUBLIC_TREASURY_ADDRESSES,
);

function parseAddressMap(raw: string | undefined): Partial<Record<string, string>> {
  if (!raw || !raw.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) out[k] = v.trim();
    }
    return out;
  } catch {
    // Malformed env JSON: treat as "not published" rather than crashing the page.
    return {};
  }
}

/** Where violation appeals go (PRD §9 violation screen). */
export const APPEAL_CONTACT_EMAIL = "support@propfund.io";
