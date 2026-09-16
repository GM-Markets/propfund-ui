/**
 * Checkout pricing view-model (PRD §3, §4, §7 Rebuy). Pure: composes the
 * rules (`checkoutPrice`, `applyCredit`) with the user's state so package
 * cards and the checkout sheet show the same numbers the service charges.
 */
import { ACTIVE_ACCOUNT_EXISTS_COPY, applyCredit, checkoutPrice, type CheckoutPrice } from "@/lib/propfund/rules";
import type { ChallengePackage } from "@/lib/propfund/types";

export const BARRED_CHECKOUT_COPY =
  "New challenges aren't available on this profile after a confirmed violation. If you think this is a mistake, contact support.";

export type CheckoutBlock = {
  code: "BARRED" | "ACTIVE_ACCOUNT_EXISTS";
  message: string;
};

export type CheckoutLine = {
  id: "fee" | "rebuy" | "discount" | "credit" | "due";
  label: string;
  amountUsd: number | null;
  /** Shown struck through (full fee when rebuy pricing applies). */
  struck?: boolean;
  /** Negative adjustment (credit) or emphasized total. */
  kind?: "adjustment" | "total" | "note";
};

export type CheckoutView = {
  price: CheckoutPrice;
  rebuyOpen: boolean;
  creditAppliedUsd: number;
  amountDueUsd: number;
  /** Deposit balance covers the whole price: pay with credit, no transfer. */
  coveredByCredit: boolean;
  lines: CheckoutLine[];
  blocked: CheckoutBlock | null;
};

export function checkoutView(input: {
  pkg: ChallengePackage;
  hasRebuyOffer: boolean;
  depositCreditUsd: number;
  barred: boolean;
  hasActiveAccount: boolean;
}): CheckoutView {
  // A barred user never gets rebuy pricing (mirrors the service quote).
  const rebuyOpen = input.hasRebuyOffer && !input.barred;
  const price = checkoutPrice(input.pkg, rebuyOpen);
  const { creditAppliedUsd, amountDueUsd } = applyCredit(price.price, input.depositCreditUsd);

  const lines: CheckoutLine[] = [];
  lines.push({ id: "fee", label: "Challenge fee", amountUsd: price.fullFee, struck: rebuyOpen });
  if (rebuyOpen) {
    lines.push({ id: "rebuy", label: "Rebuy fee", amountUsd: price.rebuyFee });
    lines.push({ id: "discount", label: price.discountLabel ?? "", amountUsd: null, kind: "note" });
  }
  if (creditAppliedUsd > 0) {
    lines.push({ id: "credit", label: "Deposit balance applied", amountUsd: -creditAppliedUsd, kind: "adjustment" });
  }
  lines.push({ id: "due", label: "Total due", amountUsd: amountDueUsd, kind: "total" });

  let blocked: CheckoutBlock | null = null;
  if (input.barred) blocked = { code: "BARRED", message: BARRED_CHECKOUT_COPY };
  else if (input.hasActiveAccount) blocked = { code: "ACTIVE_ACCOUNT_EXISTS", message: ACTIVE_ACCOUNT_EXISTS_COPY };

  return {
    price,
    rebuyOpen,
    creditAppliedUsd,
    amountDueUsd,
    coveredByCredit: amountDueUsd <= 0,
    lines,
    blocked,
  };
}
