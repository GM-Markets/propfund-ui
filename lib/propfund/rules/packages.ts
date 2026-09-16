/**
 * Packages and fees (PRD §3). Same rules at every size.
 */
import type { ChallengePackage, PackageId, PricingKind } from "@/lib/propfund/types";

export const DAILY_LOSS_PCT = 0.03;
export const MAX_LOSS_PCT = 0.05;
export const TARGET_PCT = 0.1;
export const REBUY_DISCOUNT_PCT = 20 as const;

/** `round(0.01 × account size) − 1`, whole dollars. */
export function challengeFee(accountSize: number): number {
  return Math.round(0.01 * accountSize) - 1;
}

/** `round(0.008 × account size) − 1`, whole dollars. */
export function rebuyFee(accountSize: number): number {
  return Math.round(0.008 * accountSize) - 1;
}

function build(id: PackageId, name: string, accountSize: number): ChallengePackage {
  return {
    id,
    name,
    accountSize,
    fee: challengeFee(accountSize),
    rebuyFee: rebuyFee(accountSize),
    dailyLossLimit: Math.round(DAILY_LOSS_PCT * accountSize),
    maxLossLimit: Math.round(MAX_LOSS_PCT * accountSize),
    target: Math.round(TARGET_PCT * accountSize),
  };
}

export const PACKAGES: readonly ChallengePackage[] = [
  build("starter", "Starter", 5_000),
  build("core", "Core", 10_000),
  build("plus", "Plus", 25_000),
  build("pro", "Pro", 50_000),
  build("elite", "Elite", 100_000),
];

export function getPackage(id: string): ChallengePackage | undefined {
  return PACKAGES.find((p) => p.id === id);
}

export function isPackageId(id: string): id is PackageId {
  return PACKAGES.some((p) => p.id === id);
}

export type CheckoutPrice = {
  pricing: PricingKind;
  /** Full fee (shown struck through when a rebuy is open). */
  fullFee: number;
  rebuyFee: number;
  /** What the trader pays before deposit credit. */
  price: number;
  /** "Rebuy discount: 20% off" when rebuy pricing applies. */
  discountLabel: string | null;
};

/** Checkout price for a package given whether a rebuy offer is open (PRD §7 Rebuy). */
export function checkoutPrice(pkg: ChallengePackage, rebuyOpen: boolean): CheckoutPrice {
  return {
    pricing: rebuyOpen ? "rebuy" : "full",
    fullFee: pkg.fee,
    rebuyFee: pkg.rebuyFee,
    price: rebuyOpen ? pkg.rebuyFee : pkg.fee,
    discountLabel: rebuyOpen ? `Rebuy discount: ${REBUY_DISCOUNT_PCT}% off` : null,
  };
}

/** Deposit credit applied to a price: never more than the price. */
export function applyCredit(price: number, creditUsd: number): {
  creditAppliedUsd: number;
  amountDueUsd: number;
} {
  const creditAppliedUsd = Math.max(0, Math.min(price, creditUsd));
  return { creditAppliedUsd, amountDueUsd: roundCents(price - creditAppliedUsd) };
}

export function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}
