"use client";

import { READ_TTL_MS, readCache } from "@/lib/ttl-cache";
import { readBrowserApiError, unreachableDeskError, vantaBrowserBase } from "@/lib/vanta/http";

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

let cachedToken: string | null = null;

async function deskBearer(): Promise<string> {
  if (cachedToken) return cachedToken;
  let resp: Response;
  try {
    resp = await fetch("/api/session", { cache: "no-store" });
  } catch (cause) {
    const err = unreachableDeskError(cause);
    throw new VantaBrowserError(503, err.code, err.message);
  }
  if (!resp.ok) {
    throw new VantaBrowserError(401, "UNAUTHORIZED", "Sign in again to continue.");
  }
  const body = (await resp.json()) as { token?: string };
  const token = body.token?.trim();
  if (!token) {
    throw new VantaBrowserError(401, "UNAUTHORIZED", "Sign in again to continue.");
  }
  cachedToken = token;
  return token;
}

export async function vantaFetch<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const token = await deskBearer();

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.json !== undefined) headers.set("Content-Type", "application/json");

  let resp: Response;
  try {
    resp = await fetch(`${vantaBrowserBase()}${path}`, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
      cache: "no-store",
    });
  } catch (cause) {
    const err = unreachableDeskError(cause);
    throw new VantaBrowserError(503, err.code, err.message);
  }
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

export const browserAuth = {
  me: async () => {
    const token = await deskBearer();
    return readCache.remember(`van:me:${token}`, () => vantaFetch<BrowserMe>("/v2/me"), READ_TTL_MS);
  },
};

