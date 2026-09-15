"use client";

import { getIdentityToken } from "@privy-io/react-auth";

import { readBrowserApiError, vantaBrowserBase } from "@/lib/vanta/http";

export { readBrowserApiError, vantaBrowserBase } from "@/lib/vanta/http";

export class VantaBrowserError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "VantaBrowserError";
  }
}

export async function vantaFetch<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const token = (await getIdentityToken())?.trim();
  if (!token) {
    throw new VantaBrowserError(401, "UNAUTHORIZED", "Sign in again to continue.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.json !== undefined) headers.set("Content-Type", "application/json");

  const resp = await fetch(`${vantaBrowserBase()}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    cache: "no-store",
  });
  if (resp.status === 204) return undefined as T;

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
    const err = readBrowserApiError(parsed);
    throw new VantaBrowserError(
      resp.status,
      err.code,
      err.message ?? (typeof parsed === "string" ? parsed : resp.statusText),
    );
  }
  return parsed as T;
}

export type CreatedApiKey = {
  id: string;
  label: string;
  key_id?: string;
  key_secret?: string;
  key?: string;
  prop_account_id?: string | null;
};

export const browserApiKeys = {
  create: (body: { label: string; prop_account_id?: string }) =>
    vantaFetch<CreatedApiKey>("/v2/api-keys", { method: "POST", json: body }),
  revoke: (id: string) => vantaFetch<{ revoked?: boolean } | undefined>(`/v2/api-keys/${id}`, { method: "DELETE" }),
};

export type BrowserMe = {
  user_id: string;
  agreement_signed: boolean;
  agreement_version: string | null;
  prop_accounts: Array<{
    id: string;
    tier_id: string;
    asset_class: string;
    account_size: number;
    status: string;
    is_test?: boolean;
  }>;
};

export type CopyTradeStatus = "active" | "paused" | "stopped";
export type CopyMarkets = "all" | "perp" | "spot";

export type CopySubscription = {
  id: string;
  prop_account_id: string;
  leader_address: string;
  scale_bps: number;
  alloc_usd: number;
  markets: CopyMarkets;
  max_leverage: number;
  status: CopyTradeStatus;
  created_at: string;
  updated_at: string;
};

export type CopyFill = {
  id: string;
  leader_tid: string;
  coin: string;
  side: string;
  market_type: string;
  leader_notional: number;
  follower_value: number;
  reduce_only: boolean;
  status: "copied" | "skipped" | "failed";
  error: string | null;
  created_at: string;
};

function propAccountHeader(id: string): HeadersInit {
  return { "X-Prop-Account": id };
}

export const browserAuth = {
  me: () => vantaFetch<BrowserMe>("/v2/me"),
};

export const browserCopyTrade = {
  list: (propAccountId: string) =>
    vantaFetch<CopySubscription[]>("/v2/copy-trade/subscriptions", {
      headers: propAccountHeader(propAccountId),
    }),
  start: (
    propAccountId: string,
    body: { leader_address: string; scale_bps?: number; alloc_usd?: number; markets?: CopyMarkets; max_leverage?: number },
  ) =>
    vantaFetch<CopySubscription>("/v2/copy-trade/subscriptions", {
      method: "POST",
      json: body,
      headers: propAccountHeader(propAccountId),
    }),
  setStatus: (id: string, status: CopyTradeStatus) =>
    vantaFetch<CopySubscription>(`/v2/copy-trade/subscriptions/${id}`, {
      method: "POST",
      json: { status },
    }),
  fills: (id: string) => vantaFetch<CopyFill[]>(`/v2/copy-trade/subscriptions/${id}/fills`),
};

export { percentToScaleBps, scaleBpsToPercent } from "./copy-scale";
