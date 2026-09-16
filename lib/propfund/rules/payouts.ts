/**
 * Payouts (PRD §8): 100% of realized profit, $50 minimum, one under review at
 * a time, 80/20 split, USDC on Arbitrum on D + 7.
 */
import type { KycStatus, PayoutStatus, Phase } from "@/lib/propfund/types";

import { roundCents } from "./packages";
import { payDate } from "./time";

export const MIN_PAYOUT_USD = 50;
export const TRADER_SHARE = 0.8;
export const PROPFUND_SHARE = 0.2;
export const PAYOUT_CHAIN = "arbitrum" as const;
export const PAYOUT_TOKEN = "USDC" as const;
export const CUSTOM_ADDRESS_CONFIRM_COPY = "I control this address on Arbitrum";

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  under_review: "Under review",
  paid: "Paid",
  voided: "Voided",
  returned: "Returned",
};

export const KYC_STATUS_LABEL: Record<KycStatus, string> = {
  not_started: "Not started",
  in_review: "In review",
  verified: "Verified",
  needs_info: "Needs more info",
  rejected: "Rejected",
};

export function splitProfit(profitUsd: number): { trader: number; propfund: number } {
  const trader = roundCents(profitUsd * TRADER_SHARE);
  return { trader, propfund: roundCents(profitUsd - trader) };
}

/** Realized profit available for payout: balance − B. */
export function realizedProfit(balance: number, baseline: number): number {
  return roundCents(balance - baseline);
}

export type PayoutBlocker =
  | "not_funded"
  | "not_verified"
  | "not_flat"
  | "below_minimum"
  | "pending";

export const PAYOUT_BLOCKER_COPY: Record<PayoutBlocker, string> = {
  not_funded: "Payouts open once you graduate to a funded account.",
  not_verified: "Verify your identity to request your first payout.",
  not_flat: "Close all positions and cancel working orders first.",
  below_minimum: `Realized profit must be at least $${MIN_PAYOUT_USD}.`,
  pending: "You already have a payout under review.",
};

export function payoutBlockers(input: {
  phase: Phase | null;
  active: boolean;
  kycStatus: KycStatus;
  flat: boolean;
  realizedProfitUsd: number;
  hasPayoutUnderReview: boolean;
}): PayoutBlocker[] {
  const out: PayoutBlocker[] = [];
  if (input.phase !== "funded" || !input.active) out.push("not_funded");
  if (input.kycStatus !== "verified") out.push("not_verified");
  if (input.hasPayoutUnderReview) out.push("pending");
  if (!input.flat) out.push("not_flat");
  if (!(input.realizedProfitUsd >= MIN_PAYOUT_USD)) out.push("below_minimum");
  return out;
}

export type PayoutEffect = {
  profitUsd: number;
  traderUsd: number;
  propfundUsd: number;
  newBalance: number;
  /** B resets to the new balance. */
  newBaseline: number;
  /** SOD drops by P. */
  newSod: number;
  paysAt: number;
};

/**
 * Effect of submitting a payout on day D (PRD §8):
 * balance −P, B = new balance, SOD −P, pays on D + 7.
 */
export function applyPayout(
  account: { balance: number; baseline: number; sod: number },
  requestedAtMs: number,
): PayoutEffect {
  const P = realizedProfit(account.balance, account.baseline);
  const { trader, propfund } = splitProfit(P);
  const newBalance = roundCents(account.balance - P);
  return {
    profitUsd: P,
    traderUsd: trader,
    propfundUsd: propfund,
    newBalance,
    newBaseline: newBalance,
    newSod: roundCents(account.sod - P),
    paysAt: payDate(requestedAtMs),
  };
}

const EVM_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export function isEvmAddress(value: string): boolean {
  return EVM_ADDRESS_RE.test(value.trim());
}

export function arbiscanTxUrl(hash: string): string {
  return `https://arbiscan.io/tx/${hash}`;
}

export function arbiscanAddressUrl(address: string): string {
  return `https://arbiscan.io/address/${address}`;
}
