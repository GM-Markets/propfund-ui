"use server";

import * as hsc from "@/lib/hsc/client";

import type { ActionResult } from "./auth";

function failure(e: unknown): ActionResult {
  if (e instanceof hsc.HscApiError) return { ok: false, code: e.code, message: e.message };
  return { ok: false, code: "UNKNOWN", message: e instanceof Error ? e.message : "Unknown error" };
}

export async function deskPollAction(propAccountId?: string) {
  try {
    return { ok: true as const, data: await hsc.trading.deskPoll(propAccountId) };
  } catch (e) {
    return failure(e);
  }
}

export async function listMarketsAction() {
  try {
    return { ok: true as const, data: await hsc.trading.markets() };
  } catch (e) {
    return failure(e);
  }
}

export async function submitOrderAction(
  body: {
    trade_pair: string;
    market_type: "perp" | "spot";
    side: "buy" | "sell";
    quantity?: number;
    value?: number;
    leverage?: number;
  },
  propAccountId?: string,
) {
  try {
    return { ok: true as const, data: await hsc.trading.submit(body, propAccountId) };
  } catch (e) {
    return failure(e);
  }
}

export async function closePositionAction(
  body: { trade_pair: string; market_type?: "perp" | "spot" },
  propAccountId?: string,
) {
  try {
    return { ok: true as const, data: await hsc.trading.close(body, propAccountId) };
  } catch (e) {
    return failure(e);
  }
}
