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
