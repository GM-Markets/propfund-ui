"use server";

import * as hsc from "@/lib/hsc/client";

import type { ActionResult } from "./auth";

/**
 * Live, read-only "Run it now" examples for the docs pages.
 *
 * Every operation here is a GET-style read so a developer can safely poke the
 * API from the browser. Calls use the signed-in Privy session cookie — the
 * same Bearer the rest of the app sends to the Flo gateway. Mutating
 * endpoints are intentionally omitted.
 */
export type DocsOperation =
  | "apps.me"
  | "auth.me"
  | "kyc.status"
  | "payments.listPropAccounts"
  | "connect.list"
  | "payouts.list"
  | "payouts.estimate"
  | "apiKeys.list"
  | "webhooks.list"
  | "agreements.status"
  | "agreements.audits"
  | "trading.positions"
  | "trading.orders"
  | "trading.history"
  | "trading.balance"
  | "trading.deskPoll";

async function firstPropId(): Promise<string | undefined> {
  const accounts = await hsc.payments.listPropAccounts();
  return accounts[0]?.id;
}

async function run(op: DocsOperation): Promise<unknown> {
  switch (op) {
    case "apps.me":
      return hsc.apps.me();
    case "auth.me":
      return hsc.auth.me();
    case "kyc.status":
      return hsc.kyc.status();
    case "payments.listPropAccounts":
      return hsc.payments.listPropAccounts();
    case "connect.list":
      return hsc.connect.list();
    case "payouts.list":
      return hsc.payouts.list();
    case "payouts.estimate":
      return hsc.payouts.estimate();
    case "apiKeys.list":
      return hsc.apiKeys.list();
    case "webhooks.list":
      return hsc.webhooks.list();
    case "agreements.status":
      return hsc.agreements.status();
    case "agreements.audits":
      return hsc.agreements.audits();
    case "trading.positions":
      return hsc.trading.positions(await firstPropId());
    case "trading.orders":
      return hsc.trading.orders(await firstPropId());
    case "trading.history":
      return hsc.trading.history(await firstPropId());
    case "trading.balance":
      return hsc.trading.balance(await firstPropId());
    case "trading.deskPoll":
      return hsc.trading.deskPoll(await firstPropId());
    default:
      throw new hsc.HscApiError(400, "UNKNOWN_OPERATION", `Unknown operation: ${op}`);
  }
}

export async function runDocsRequestAction(
  op: DocsOperation,
): Promise<ActionResult<{ status: number; body: unknown }>> {
  try {
    const body = await run(op);
    return { ok: true, data: { status: 200, body } };
  } catch (e) {
    if (e instanceof hsc.HscApiError) {
      // Surface the upstream status/body so the panel teaches the real shape of
      // an error (e.g. 401 when the developer isn't signed in).
      return {
        ok: true,
        data: {
          status: e.status,
          body: { error: { code: e.code, message: e.message, retryable: e.retryable } },
        },
      };
    }
    return { ok: false, code: "UNKNOWN", message: e instanceof Error ? e.message : "Unknown error" };
  }
}
