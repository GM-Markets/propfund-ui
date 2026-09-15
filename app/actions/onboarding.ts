"use server";

import { revalidatePath } from "next/cache";

import * as hsc from "@/lib/hsc/client";

import type { ActionResult } from "./auth";

function revalidateDesk(): void {
  revalidatePath("/dashboard", "layout");
}

function failure(e: unknown): ActionResult {
  if (e instanceof hsc.HscApiError) return { ok: false, code: e.code, message: e.message };
  return { ok: false, code: "UNKNOWN", message: e instanceof Error ? e.message : "Unknown error" };
}

export async function getKycStatusAction() {
  try {
    return { ok: true as const, data: await hsc.kyc.status() };
  } catch (e) {
    return failure(e);
  }
}

export async function getKycSessionAction() {
  try {
    const data = await hsc.kyc.stripeSession();
    revalidateDesk();
    return { ok: true as const, data };
  } catch (e) {
    return failure(e);
  }
}

export async function simulateKycAction(outcome: "success" | "failure") {
  try {
    const data = await hsc.kyc.simulate({ outcome });
    revalidateDesk();
    return { ok: true as const, data };
  } catch (e) {
    return failure(e);
  }
}

export async function listTiersAction() {
  try {
    return { ok: true as const, data: await hsc.payments.listTiers() };
  } catch (e) {
    return failure(e);
  }
}

export async function signAgreementAction(input: { agreement_version: string; signature_name: string }) {
  try {
    const data = await hsc.agreements.sign(input);
    revalidateDesk();
    return { ok: true as const, data };
  } catch (e) {
    return failure(e);
  }
}

export async function createCheckoutAction(input: {
  tier_id: string;
  market: string;
  asset_class: string;
  account_size: number;
  amount_cents: number;
}) {
  try {
    return { ok: true as const, data: await hsc.payments.checkout(input) };
  } catch (e) {
    return failure(e);
  }
}

export async function simulateCheckoutAction(input: {
  outcome: "success" | "failure";
  tier_id: string;
  market: string;
  asset_class: string;
  account_size: number;
  amount_cents: number;
}) {
  try {
    const data = await hsc.payments.simulate(input);
    if (input.outcome === "success" && data.account) {
      hsc.dropCachedReads();
      revalidateDesk();
    }
    return { ok: true as const, data };
  } catch (e) {
    return failure(e);
  }
}

export async function forgetDeskReadsAction() {
  hsc.dropCachedReads();
  revalidateDesk();
}

export async function createFreeAccountAction(input: {
  tier_id: string;
  asset_class: string;
  account_size: number;
  market?: string;
}) {
  try {
    const data = await hsc.payments.freeAccount(input);
    revalidateDesk();
    return { ok: true as const, data };
  } catch (e) {
    return failure(e);
  }
}

export async function listPropAccountsAction() {
  try {
    return { ok: true as const, data: await hsc.payments.listPropAccounts() };
  } catch (e) {
    return failure(e);
  }
}
