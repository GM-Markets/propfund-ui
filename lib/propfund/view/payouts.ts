/**
 * Payout eligibility checklist and payout address validation (PRD §8). Pure.
 */
import {
  MIN_PAYOUT_USD,
  PAYOUT_BLOCKER_COPY,
  isEvmAddress,
  payoutBlockers,
  type PayoutBlocker,
} from "@/lib/propfund/rules";
import type { KycStatus, Phase, PayoutStatus } from "@/lib/propfund/types";

export type ChecklistItem = {
  id: PayoutBlocker;
  label: string;
  met: boolean;
  /** What to do when not met (rules copy). */
  hint: string;
};

const CHECKLIST_ORDER: readonly PayoutBlocker[] = ["not_funded", "not_verified", "not_flat", "below_minimum", "pending"];

const CHECKLIST_LABEL: Record<PayoutBlocker, string> = {
  not_funded: "Funded account",
  not_verified: "Identity verified",
  not_flat: "No open positions or working orders",
  below_minimum: `Realized profit of at least $${MIN_PAYOUT_USD}`,
  pending: "No other payout under review",
};

export function payoutChecklist(input: {
  phase: Phase | null;
  active: boolean;
  kycStatus: KycStatus;
  flat: boolean;
  realizedProfitUsd: number;
  hasPayoutUnderReview: boolean;
}): { items: ChecklistItem[]; eligible: boolean } {
  const blockers = new Set(payoutBlockers(input));
  const items = CHECKLIST_ORDER.map((id) => ({
    id,
    label: CHECKLIST_LABEL[id],
    met: !blockers.has(id),
    hint: PAYOUT_BLOCKER_COPY[id],
  }));
  return { items, eligible: blockers.size === 0 };
}

export type AddressCheck = {
  /** Usable for a payout request. */
  valid: boolean;
  /** Inline error to show (null while empty or valid). */
  error: string | null;
  /** Same as the Propfund wallet: no confirmation needed. */
  isPropfundWallet: boolean;
};

export const INVALID_ADDRESS_COPY = "Enter a valid Arbitrum address: 0x followed by 40 characters (0–9, a–f).";

export function checkPayoutAddress(value: string, propfundWallet: string | null): AddressCheck {
  const v = value.trim();
  if (!v) return { valid: false, error: null, isPropfundWallet: false };
  if (!isEvmAddress(v)) return { valid: false, error: INVALID_ADDRESS_COPY, isPropfundWallet: false };
  const isPropfundWallet = !!propfundWallet && v.toLowerCase() === propfundWallet.toLowerCase();
  return { valid: true, error: null, isPropfundWallet };
}

export type PayoutAddressChoice =
  | { mode: "propfund_wallet"; propfundWallet: string | null }
  | { mode: "custom"; value: string; confirmed: boolean; propfundWallet: string | null };

/**
 * Resolve the address to submit and whether the request can go ahead.
 * A custom address needs the "I control this address on Arbitrum" checkbox
 * unless it is the Propfund wallet itself.
 */
export function resolvePayoutAddress(choice: PayoutAddressChoice): {
  ready: boolean;
  address: string | null;
  confirmControlsAddress: boolean;
  needsConfirmation: boolean;
} {
  if (choice.mode === "propfund_wallet") {
    return {
      ready: !!choice.propfundWallet,
      address: choice.propfundWallet,
      confirmControlsAddress: false,
      needsConfirmation: false,
    };
  }
  const check = checkPayoutAddress(choice.value, choice.propfundWallet);
  const needsConfirmation = check.valid && !check.isPropfundWallet;
  return {
    ready: check.valid && (!needsConfirmation || choice.confirmed),
    address: check.valid ? choice.value.trim() : null,
    confirmControlsAddress: needsConfirmation && choice.confirmed,
    needsConfirmation,
  };
}

/** Status meanings from PRD §8 (tooltips and mobile cards). */
export const PAYOUT_STATUS_MEANING: Record<PayoutStatus, string> = {
  under_review: "Violation checks run for 7 days. The profit is already debited from your balance.",
  paid: "Sent in USDC on Arbitrum.",
  voided: "A violation was confirmed. The profit is forfeited.",
  returned: "The payout couldn't be sent (for example, the address was rejected). The profit is back in your balance; request again.",
};
