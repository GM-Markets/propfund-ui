/**
 * Account violations and their consequences (PRD §9).
 */
import type { AccountStatus, PayoutStatus, ViolationCode } from "@/lib/propfund/types";

export const VIOLATIONS: Record<ViolationCode, { title: string; reason: string }> = {
  V1: {
    title: "Algorithmic or automated trading",
    reason:
      "Orders on your account were placed by automation (a bot, script, macro or browser automation). Every order must be placed by hand in the terminal.",
  },
  V2: {
    title: "Wash or cross-account hedging",
    reason:
      "Your account held positions that offset positions in the same instrument on other accounts you control or coordinate with.",
  },
  V3: {
    title: "Multiple identities",
    reason:
      "More than one profile is linked to the same person, device, network, wallet, payment method or verified identity.",
  },
  V4: {
    title: "Copy and signal trading",
    reason: "Your trades mirrored another trader, a trade copier or a signal group.",
  },
  V5: {
    title: "Account sharing or paid passing",
    reason: "Someone other than you logged in to or traded your account.",
  },
  V6: {
    title: "Exploiting the platform",
    reason: "Trades on your account exploited stale or wrong prices, latency or a platform bug.",
  },
  V7: {
    title: "Payment abuse",
    reason:
      "A payment on your profile was disputed, used a stolen card or wallet, or is linked to a sanctioned address.",
  },
  V8: {
    title: "Restricted access",
    reason: "Your profile was used from a restricted jurisdiction or through a VPN or proxy that hid your location.",
  },
};

export const VIOLATION_CODES = Object.keys(VIOLATIONS) as ViolationCode[];

export type ViolationConsequences = {
  /** Open accounts to close and terminate. */
  terminateAccountIds: string[];
  /** Payouts under review to void (profit forfeited). */
  voidPayoutIds: string[];
  voidedUsd: number;
  barUser: true;
  rebuyOffered: false;
  /** Paid payouts are not reversed on-chain. */
  reversePaidPayouts: false;
};

export function violationConsequences(
  accounts: readonly { id: string; status: AccountStatus }[],
  payouts: readonly { id: string; status: PayoutStatus; profitUsd: number }[],
): ViolationConsequences {
  const underReview = payouts.filter((p) => p.status === "under_review");
  return {
    terminateAccountIds: accounts.filter((a) => a.status === "active").map((a) => a.id),
    voidPayoutIds: underReview.map((p) => p.id),
    voidedUsd: Math.round(underReview.reduce((s, p) => s + p.profitUsd, 0) * 100) / 100,
    barUser: true,
    rebuyOffered: false,
    reversePaidPayouts: false,
  };
}
