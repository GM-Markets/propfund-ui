/**
 * Typed BFF client for Vanta through the Flo gateway (`/van`).
 *
 * Sends the Privy identity token as Bearer. The gateway authenticates;
 * this client never spoofs `x-user-*`.
 */
import "server-only";

import { cookies } from "next/headers";

import { hscConfig } from "./config";

export class HscApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryable = false,
  ) {
    super(message);
    this.name = "HscApiError";
  }
}

type Init = RequestInit & {
  json?: unknown;
  authedAsUser?: boolean;
  sessionTokenOverride?: string;
};

async function hsc<T = unknown>(path: string, init: Init = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (init.authedAsUser !== false) {
    const session =
      init.sessionTokenOverride ?? (await cookies()).get(hscConfig.sessionCookieName)?.value;
    if (session) {
      headers.set("Authorization", `Bearer ${session}`);
    }
  }

  let resp: Response;
  try {
    resp = await fetch(`${hscConfig.baseUrl}${path}`, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(8_000),
    });
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    throw new HscApiError(
      504,
      timedOut ? "GATEWAY_TIMEOUT" : "GATEWAY_UNREACHABLE",
      timedOut
        ? `Gateway did not respond in time (${hscConfig.baseUrl})`
        : e instanceof Error
          ? e.message
          : "Gateway unreachable",
      true,
    );
  }
  if (resp.status === 204) return undefined as T;
  const text = await resp.text();
  const parsed = text ? safeJson(text) : null;
  if (!resp.ok) {
    const err = readApiError(parsed);
    throw new HscApiError(
      resp.status,
      err.code,
      err.message ?? (typeof parsed === "string" ? parsed : resp.statusText),
      err.retryable,
    );
  }
  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Vanta uses `{ error }`, older FastAPI uses `{ detail }`, the gateway uses `{ type, message }`. */
function readApiError(parsed: unknown): { code: string; message?: string; retryable: boolean } {
  if (!parsed || typeof parsed !== "object") {
    return { code: "UNKNOWN", retryable: false };
  }
  const env = parsed as {
    code?: string;
    type?: string;
    message?: string;
    retryable?: boolean;
    detail?: { code?: string; message?: string; retryable?: boolean };
    error?: { code?: string; message?: string; retryable?: boolean };
  };
  const nested = env.detail ?? env.error;
  const code = nested?.code ?? env.code ?? env.type;
  return {
    code: typeof code === "string" && code ? code : "UNKNOWN",
    message: nested?.message ?? env.message,
    retryable: Boolean(nested?.retryable ?? env.retryable),
  };
}

export type VantaMe = {
  user_id: string;
  gateway_user_id: string | null;
  source_type: string;
  source: string;
  app_id: string;
  partner?: { app_id: string; slug: string; name: string };
  kyc_status: string;
  kyc_verified_at: string | null;
  agreement_signed: boolean;
  agreement_version: string | null;
  prop_accounts: PropAccountSummary[];
};

export const auth = {
  me: () => hsc<VantaMe>("/v2/me"),
};

export const apps = {
  me: () =>
    hsc<{
      app_id: string;
      slug: string;
      name: string;
      entity_hotkey: string | null;
      allowed_scopes: string[];
      active: boolean;
    }>("/v2/apps/me"),
};

export const kyc = {
  status: () =>
    hsc<{
      user_id: string;
      kyc_provider: string | null;
      kyc_status: "unverified" | "processing" | "needs_input" | "verified" | "failed";
      kyc_verified_at: string | null;
      kyc_failure_reason: string | null;
    }>("/v2/kyc/status"),
  stripeSession: () =>
    hsc<{
      client_secret: string | null;
      verification_session_id: string | null;
      user_id: string;
      url: string | null;
      status: string;
      provider: "stripe_identity";
    }>("/v2/kyc/stripe/session", { method: "POST" }),
};

export const payments = {
  listTiers: () =>
    hsc<
      Array<{
        id: string;
        market: string;
        asset_class: string;
        account_size: number;
        price_cents: number;
        currency: string;
        rule_pack_id: string;
        kyc_optional: boolean;
        active: boolean;
      }>
    >("/v2/payments/tiers"),
  checkout: (body: {
    tier_id: string;
    market: string;
    asset_class: string;
    account_size: number;
    amount_cents: number;
    currency?: string;
  }) =>
    hsc<{
      payment_id: string;
      provider: string;
      provider_payment_id: string | null;
      client_secret: string | null;
      amount_cents: number;
      currency: string;
      status: string;
      tier_id: string;
    }>("/v2/payments/checkout", { method: "POST", json: body }),
  freeAccount: (body: { tier_id: string; asset_class: string; account_size: number; market?: string }) =>
    hsc<PropAccountSummary>("/v2/payments/free", { method: "POST", json: body }),
  listPropAccounts: () => hsc<PropAccountSummary[]>("/v2/payments/prop-accounts"),
  getPropAccount: (id: string) => hsc<PropAccountSummary>(`/v2/payments/prop-accounts/${id}`),
};

export type PropAccountSummary = {
  id: string;
  tier_id: string;
  market?: string;
  asset_class: string;
  account_size: number;
  status: string;
  payment_id?: string | null;
  provider?: string;
  provider_payment_id?: string | null;
  eliminated_at?: string | null;
  elimination_reason?: string | null;
  equity_at_burn?: number | null;
  subaccount_id: number | null;
  subaccount_uuid: string | null;
  synthetic_hotkey: string | null;
  is_test?: boolean;
};

export const agreements = {
  sign: (body: { agreement_version: string; signature_name: string }) =>
    hsc<{ signed: boolean; signed_at: string; agreement_version: string }>(
      "/v2/agreements/sign",
      { method: "POST", json: body },
    ),
  status: () =>
    hsc<{ signed: boolean; signed_at: string | null; agreement_version: string | null }>(
      "/v2/agreements/status",
    ),
  audits: () =>
    hsc<
      Array<{
        id: string;
        agreement_version: string;
        signature_name: string;
        signed_at: string;
        document_url: string | null;
      }>
    >("/v2/agreements/audits"),
};

export const apiKeys = {
  create: (body: { label: string; prop_account_id?: string }) =>
    hsc<{
      id: string;
      label: string;
      key_id: string;
      key_secret: string;
      key: string;
      prop_account_id: string | null;
    }>("/v2/api-keys", { method: "POST", json: body }),
  list: () =>
    hsc<Array<{ id: string; label: string; key_id: string; revoked_at: string | null }>>(
      "/v2/api-keys",
    ),
  revoke: (id: string) => hsc<{ revoked: boolean } | undefined>(`/v2/api-keys/${id}`, { method: "DELETE" }),
};

export const trading = {
  submit: (
    body: {
      trade_pair: string;
      market_type: "perp" | "spot";
      side: "buy" | "sell";
      quantity?: number;
      value?: number;
      leverage?: number;
    },
    propAccountId?: string,
  ) =>
    hsc<Record<string, unknown>>("/v2/trading/orders", {
      method: "POST",
      json: body,
      headers: propAccountIdHeader(propAccountId),
    }),
  close: (body: { trade_pair?: string; market_type?: "perp" | "spot"; position_id?: string }, propAccountId?: string) =>
    hsc<Record<string, unknown>>("/v2/trading/close", {
      method: "POST",
      json: body,
      headers: propAccountIdHeader(propAccountId),
    }),
  orders: (propAccountId?: string) =>
    hsc<Array<Record<string, unknown>> | { orders?: Array<Record<string, unknown>> }>(
      "/v2/trading/orders",
      { headers: propAccountIdHeader(propAccountId) },
    ),
  positions: (propAccountId?: string) =>
    hsc<{ positions?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>(
      "/v2/trading/positions",
      { headers: propAccountIdHeader(propAccountId) },
    ),
  balance: (propAccountId?: string) =>
    hsc<Record<string, unknown>>("/v2/trading/balance", {
      headers: propAccountIdHeader(propAccountId),
    }),
  history: (propAccountId?: string) =>
    hsc<Array<Record<string, unknown>> | { history?: Array<Record<string, unknown>> }>(
      "/v2/trading/history",
      { headers: propAccountIdHeader(propAccountId) },
    ),
  deskPoll: (propAccountId?: string) =>
    hsc<{
      positions: Array<Record<string, unknown>>;
      orders: Array<Record<string, unknown>>;
      history: Array<Record<string, unknown>>;
      balance: {
        account_size: number;
        status: string;
        cash?: number;
        equity?: number;
        used_margin?: number;
        unrealized_pnl?: number;
        realized_pnl?: number;
      };
    }>("/v2/trading/desk-poll", { headers: propAccountIdHeader(propAccountId) }),
  markets: () =>
    hsc<{
      markets: Array<{ coin: string; mid: number; max_leverage: number; wire?: string }>;
      spots?: Array<{ coin: string; mid: number; max_leverage: number; wire?: string }>;
    }>("/v2/trading/markets"),
};

function propAccountIdHeader(id?: string): Record<string, string> {
  return id ? { "X-Prop-Account": id } : {};
}

export const webhooks = {
  register: (body: { url: string; events: string[]; description?: string }) =>
    hsc<{
      id: string;
      url: string;
      events: string[];
      active: boolean;
      description: string | null;
      secret: string | null;
    }>("/v2/webhook-endpoints", { method: "POST", json: body }),
  list: () =>
    hsc<
      Array<{
        id: string;
        url: string;
        events: string[];
        active: boolean;
        description: string | null;
      }>
    >("/v2/webhook-endpoints"),
  remove: (id: string) =>
    hsc<{ deactivated: boolean }>(`/v2/webhook-endpoints/${id}`, {
      method: "DELETE",
      authedAsUser: true,
    }),
};

export type ConnectAccount = {
  id: string;
  stripe_account_id: string;
  onboarding_url?: string;
  status: string | null;
  payouts_enabled: boolean;
  charges_enabled: boolean;
  details_submitted: boolean;
};

export type PayoutResponse = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  stripe_transfer_id: string | null;
  failure_reason: string | null;
  requested_at: string | null;
  completed_at: string | null;
};

export type PayoutEstimate = {
  amount_usd: number;
  amount_cents: number;
  currency: string;
  available: boolean;
};

/** Payouts / Connect are not on the latest Vanta surface yet. */
export const connect = {
  list: async (): Promise<ConnectAccount[]> => [],
  createAccount: async (_country = "US"): Promise<ConnectAccount & { onboarding_url: string }> => {
    throw new HscApiError(501, "V2_NOT_IMPLEMENTED", "Connect payouts are not on this Vanta API yet");
  },
  refreshLink: async (_stripeAccountId: string): Promise<{ onboarding_url: string }> => {
    throw new HscApiError(501, "V2_NOT_IMPLEMENTED", "Connect payouts are not on this Vanta API yet");
  },
};

export const payouts = {
  list: async (): Promise<PayoutResponse[]> => [],
  estimate: async (_propAccountId?: string): Promise<PayoutEstimate> => ({
    amount_usd: 0,
    amount_cents: 0,
    currency: "usd",
    available: false,
  }),
  request: async (_body: { amount_cents: number; prop_account_id?: string }): Promise<PayoutResponse> => {
    throw new HscApiError(501, "V2_NOT_IMPLEMENTED", "Reward payouts are not on this Vanta API yet");
  },
};
