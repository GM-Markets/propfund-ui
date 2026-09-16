import { describe, expect, it } from "vitest";

import { ACTIVE_ACCOUNT_EXISTS_COPY, getPackage } from "@/lib/propfund/rules";
import type { ChallengePackage, Deposit } from "@/lib/propfund/types";

import { BARRED_CHECKOUT_COPY, checkoutView } from "./checkout";
import { depositOutcome, depositSteps } from "./deposit-steps";
import { equityChartGeometry } from "./equity-chart";
import { INVALID_ADDRESS_COPY, checkPayoutAddress, payoutChecklist, resolvePayoutAddress } from "./payouts";

const core = getPackage("core") as ChallengePackage;
const elite = getPackage("elite") as ChallengePackage;
const WALLET = "0x7E5700000000000000000000000000000000Beef";
const OTHER = "0x1111111111111111111111111111111111111111";

describe("checkoutView", () => {
  const base = { hasRebuyOffer: false, depositCreditUsd: 0, barred: false, hasActiveAccount: false };

  it("charges the full fee with no rebuy", () => {
    const v = checkoutView({ pkg: core, ...base });
    expect(v.rebuyOpen).toBe(false);
    expect(v.amountDueUsd).toBe(99);
    expect(v.lines.map((l) => l.id)).toEqual(["fee", "due"]);
    expect(v.lines[0]).toMatchObject({ amountUsd: 99, struck: false });
    expect(v.blocked).toBeNull();
  });

  it("strikes the full fee and adds the rebuy fee and discount line when a rebuy is open", () => {
    const v = checkoutView({ pkg: elite, ...base, hasRebuyOffer: true });
    expect(v.rebuyOpen).toBe(true);
    expect(v.lines.map((l) => l.id)).toEqual(["fee", "rebuy", "discount", "due"]);
    expect(v.lines[0]).toMatchObject({ amountUsd: 999, struck: true });
    expect(v.lines[1]).toMatchObject({ amountUsd: 799 });
    expect(v.lines[2].label).toBe("Rebuy discount: 20% off");
    expect(v.amountDueUsd).toBe(799);
  });

  it("applies deposit credit up to the price", () => {
    const partial = checkoutView({ pkg: core, ...base, depositCreditUsd: 30.5 });
    expect(partial.creditAppliedUsd).toBe(30.5);
    expect(partial.amountDueUsd).toBe(68.5);
    expect(partial.coveredByCredit).toBe(false);
    expect(partial.lines.find((l) => l.id === "credit")?.amountUsd).toBe(-30.5);

    const full = checkoutView({ pkg: core, ...base, depositCreditUsd: 500 });
    expect(full.creditAppliedUsd).toBe(99);
    expect(full.amountDueUsd).toBe(0);
    expect(full.coveredByCredit).toBe(true);
  });

  it("blocks an active account and a barred user (barred never gets rebuy pricing)", () => {
    expect(checkoutView({ pkg: core, ...base, hasActiveAccount: true }).blocked).toEqual({
      code: "ACTIVE_ACCOUNT_EXISTS",
      message: ACTIVE_ACCOUNT_EXISTS_COPY,
    });
    const barred = checkoutView({ pkg: core, ...base, barred: true, hasRebuyOffer: true, hasActiveAccount: true });
    expect(barred.blocked).toEqual({ code: "BARRED", message: BARRED_CHECKOUT_COPY });
    expect(barred.rebuyOpen).toBe(false);
    expect(barred.amountDueUsd).toBe(99);
  });
});

describe("depositSteps", () => {
  const dep = (over: Partial<Deposit>) =>
    ({
      status: "waiting",
      confirmations: 0,
      requiredConfirmations: 12,
      accountId: null,
      amountDueUsd: 99,
      amountReceivedUsd: null,
      ...over,
    }) as Deposit;

  const states = (d: Deposit) => depositSteps(d).map((s) => s.state);

  it("waits for the transfer", () => {
    expect(states(dep({}))).toEqual(["current", "upcoming", "upcoming", "upcoming"]);
    expect(depositSteps(dep({}))[0].label).toBe("Waiting for deposit");
  });

  it("counts confirmations while confirming", () => {
    const d = dep({ status: "confirming", confirmations: 3, amountReceivedUsd: 99 });
    expect(states(d)).toEqual(["complete", "current", "upcoming", "upcoming"]);
    expect(depositSteps(d)[1].label).toBe("Confirming (3 of 12 confirmations)");
  });

  it("caps the count at the required confirmations", () => {
    const d = dep({ status: "confirming", confirmations: 20, requiredConfirmations: 1 });
    expect(depositSteps(d)[1].label).toBe("Confirming (1 of 1 confirmations)");
  });

  it("finishes with the account created", () => {
    const pendingAccount = dep({ status: "confirmed", confirmations: 12, amountReceivedUsd: 99 });
    expect(states(pendingAccount)).toEqual(["complete", "complete", "complete", "current"]);
    expect(states({ ...pendingAccount, accountId: "acc_1" })).toEqual(["complete", "complete", "complete", "complete"]);
  });

  it("flags underpaid and expired deposits", () => {
    expect(states(dep({ status: "underpaid", amountReceivedUsd: 50 }))).toEqual([
      "complete",
      "complete",
      "attention",
      "upcoming",
    ]);
    expect(states(dep({ status: "expired" }))[0]).toBe("attention");
  });

  it("reports overpayment and underpayment credit", () => {
    expect(depositOutcome(dep({}))).toEqual({ kind: "pending" });
    expect(depositOutcome(dep({ status: "confirmed", amountReceivedUsd: 99 }))).toEqual({ kind: "exact" });
    expect(depositOutcome(dep({ status: "confirmed", amountReceivedUsd: 150 }))).toEqual({
      kind: "overpaid",
      creditUsd: 51,
    });
    expect(depositOutcome(dep({ status: "underpaid", amountReceivedUsd: 40 }))).toEqual({
      kind: "underpaid",
      creditUsd: 40,
    });
    expect(depositOutcome(dep({ status: "expired" }))).toEqual({ kind: "expired" });
  });
});

describe("payoutChecklist", () => {
  const ok = {
    phase: "funded" as const,
    active: true,
    kycStatus: "verified" as const,
    flat: true,
    realizedProfitUsd: 50,
    hasPayoutUnderReview: false,
  };

  it("is eligible when every rule holds ($50 is enough)", () => {
    const c = payoutChecklist(ok);
    expect(c.eligible).toBe(true);
    expect(c.items.every((i) => i.met)).toBe(true);
    expect(c.items.map((i) => i.id)).toEqual(["not_funded", "not_verified", "not_flat", "below_minimum", "pending"]);
  });

  it("lists each blocker with rules copy", () => {
    const c = payoutChecklist({
      phase: "challenge",
      active: true,
      kycStatus: "in_review",
      flat: false,
      realizedProfitUsd: 49.99,
      hasPayoutUnderReview: true,
    });
    expect(c.eligible).toBe(false);
    expect(c.items.filter((i) => !i.met).map((i) => i.id)).toEqual([
      "not_funded",
      "not_verified",
      "not_flat",
      "below_minimum",
      "pending",
    ]);
    expect(c.items[3].label).toBe("Realized profit of at least $50");
    expect(c.items[0].hint).toBe("Payouts open once you graduate to a funded account.");
  });

  it("treats a closed funded account as not funded", () => {
    const c = payoutChecklist({ ...ok, active: false });
    expect(c.items.find((i) => i.id === "not_funded")?.met).toBe(false);
  });
});

describe("payout address", () => {
  it("validates an Arbitrum (EVM) address", () => {
    expect(checkPayoutAddress("", WALLET)).toEqual({ valid: false, error: null, isPropfundWallet: false });
    expect(checkPayoutAddress("0x123", WALLET)).toEqual({
      valid: false,
      error: INVALID_ADDRESS_COPY,
      isPropfundWallet: false,
    });
    expect(checkPayoutAddress(`0x${"g".repeat(40)}`, WALLET).valid).toBe(false);
    expect(checkPayoutAddress(`  ${OTHER} `, WALLET)).toEqual({ valid: true, error: null, isPropfundWallet: false });
    expect(checkPayoutAddress(WALLET.toLowerCase(), WALLET).isPropfundWallet).toBe(true);
  });

  it("defaults to the Propfund wallet", () => {
    expect(resolvePayoutAddress({ mode: "propfund_wallet", propfundWallet: WALLET })).toEqual({
      ready: true,
      address: WALLET,
      confirmControlsAddress: false,
      needsConfirmation: false,
    });
    expect(resolvePayoutAddress({ mode: "propfund_wallet", propfundWallet: null }).ready).toBe(false);
  });

  it("needs the control checkbox for another address", () => {
    const unconfirmed = resolvePayoutAddress({ mode: "custom", value: OTHER, confirmed: false, propfundWallet: WALLET });
    expect(unconfirmed).toMatchObject({ ready: false, needsConfirmation: true, address: OTHER });
    const confirmed = resolvePayoutAddress({ mode: "custom", value: OTHER, confirmed: true, propfundWallet: WALLET });
    expect(confirmed).toEqual({ ready: true, address: OTHER, confirmControlsAddress: true, needsConfirmation: true });
    const invalid = resolvePayoutAddress({ mode: "custom", value: "0xabc", confirmed: true, propfundWallet: WALLET });
    expect(invalid).toMatchObject({ ready: false, address: null });
    const same = resolvePayoutAddress({ mode: "custom", value: WALLET, confirmed: false, propfundWallet: WALLET });
    expect(same).toMatchObject({ ready: true, needsConfirmation: false });
  });
});

describe("equityChartGeometry", () => {
  it("returns empty paths without points", () => {
    expect(equityChartGeometry([], { width: 100, height: 50 }).line).toBe("");
  });

  it("scales points and references into the box", () => {
    const g = equityChartGeometry(
      [
        { t: 0, equity: 100 },
        { t: 10, equity: 110 },
      ],
      { width: 100, height: 50, padding: 0, references: [{ id: "floor", value: 90 }] },
    );
    expect(g.min).toBe(90);
    expect(g.max).toBe(110);
    expect(g.line).toBe("M0 25 L100 0");
    expect(g.area).toBe("M0 25 L100 0 L100 50 L0 50 Z");
    expect(g.references).toEqual([{ id: "floor", value: 90, y: 50 }]);
  });

  it("draws a flat line for a single point", () => {
    const g = equityChartGeometry([{ t: 5, equity: 100 }], { width: 100, height: 50, padding: 10 });
    expect(g.line).toBe("M10 25 L90 25");
  });
});
