import { describe, expect, it } from "vitest";

import { formatDayDate } from "@/lib/propfund/format";

import { activeAccount, canGraduate, isRebuyEligible, rebuyOfferAfterBreach } from "./lifecycle";
import {
  applyPayout,
  isEvmAddress,
  payoutBlockers,
  splitProfit,
} from "./payouts";
import { DAY_MS, isInactive, nextUtcMidnight, reviewDayLabel, rolloverSod, utcDayKey } from "./time";
import { violationConsequences } from "./violations";
import { confirmationsLabel, requiredConfirmations, settleDeposit } from "./deposits";

const T0 = Date.UTC(2026, 8, 15, 10, 30); // Tue 15 Sep 2026 10:30 UTC

describe("PRD §8 graduation", () => {
  const base = {
    phase: "challenge" as const,
    status: "active" as const,
    baseline: 100_000,
    flat: true,
    violationClean: true,
  };

  it("needs equity ≥ 1.10·B and flat", () => {
    expect(canGraduate({ ...base, equity: 110_000 })).toBe(true);
    expect(canGraduate({ ...base, equity: 109_999.99 })).toBe(false);
    expect(canGraduate({ ...base, equity: 111_000, flat: false })).toBe(false);
  });

  it("needs a clean violation check, a challenge and an active account", () => {
    expect(canGraduate({ ...base, equity: 111_000, violationClean: false })).toBe(false);
    expect(canGraduate({ ...base, equity: 111_000, phase: "funded" })).toBe(false);
    expect(canGraduate({ ...base, equity: 111_000, status: "breached" })).toBe(false);
  });
});

describe("PRD §8 payouts", () => {
  it("$106,200 balance on B $100,000 → P $6,200, trader $4,960, Propfund $1,240, new B $100,000", () => {
    const fx = applyPayout({ balance: 106_200, baseline: 100_000, sod: 106_200 }, T0);
    expect(fx).toEqual({
      profitUsd: 6_200,
      traderUsd: 4_960,
      propfundUsd: 1_240,
      newBalance: 100_000,
      newBaseline: 100_000,
      newSod: 100_000,
      paysAt: T0 + 7 * DAY_MS,
    });
    expect(formatDayDate(fx.paysAt)).toBe("Tue 22 Sep");
  });

  it("SOD drops by P even when SOD differs from balance", () => {
    expect(applyPayout({ balance: 106_200, baseline: 100_000, sod: 105_000 }, T0).newSod).toBe(98_800);
  });

  it("splits 80/20", () => {
    expect(splitProfit(1_000)).toEqual({ trader: 800, propfund: 200 });
    expect(splitProfit(50)).toEqual({ trader: 40, propfund: 10 });
  });

  it("is allowed only when funded, verified, flat, ≥ $50 and nothing under review", () => {
    const ok = {
      phase: "funded" as const,
      active: true,
      kycStatus: "verified" as const,
      flat: true,
      realizedProfitUsd: 50,
      hasPayoutUnderReview: false,
    };
    expect(payoutBlockers(ok)).toEqual([]);
    expect(payoutBlockers({ ...ok, realizedProfitUsd: 49.99 })).toEqual(["below_minimum"]);
    expect(payoutBlockers({ ...ok, flat: false })).toEqual(["not_flat"]);
    expect(payoutBlockers({ ...ok, hasPayoutUnderReview: true })).toEqual(["pending"]);
    expect(payoutBlockers({ ...ok, kycStatus: "in_review" })).toEqual(["not_verified"]);
    expect(payoutBlockers({ ...ok, phase: "challenge" })).toEqual(["not_funded"]);
    expect(payoutBlockers({ ...ok, active: false })).toEqual(["not_funded"]);
  });

  it("review counter reads Day N of 7", () => {
    const req = Date.UTC(2026, 8, 15, 23, 0);
    expect(reviewDayLabel(req, Date.UTC(2026, 8, 15, 23, 30))).toBe("Day 1 of 7");
    expect(reviewDayLabel(req, Date.UTC(2026, 8, 17, 1, 0))).toBe("Day 3 of 7");
    expect(reviewDayLabel(req, Date.UTC(2026, 8, 30))).toBe("Day 7 of 7");
  });

  it("validates Arbitrum payout addresses", () => {
    expect(isEvmAddress("0x" + "a".repeat(40))).toBe(true);
    expect(isEvmAddress("0x123")).toBe(false);
  });
});

describe("PRD §5 SOD rollover at 00:00 UTC", () => {
  it("resets SOD to balance on a new UTC day only", () => {
    const acct = { sodDay: utcDayKey(T0), balance: 101_200 };
    expect(rolloverSod(acct, T0 + 60_000)).toBeNull();
    const midnight = nextUtcMidnight(T0);
    expect(new Date(midnight).toISOString()).toBe("2026-09-16T00:00:00.000Z");
    expect(rolloverSod(acct, midnight - 1)).toBeNull();
    expect(rolloverSod(acct, midnight)).toEqual({ sod: 101_200, sodDay: "2026-09-16" });
  });

  it("closes an account after 60 days without a trade", () => {
    expect(isInactive({ lastTradeAt: T0, createdAt: T0 }, T0 + 59 * DAY_MS)).toBe(false);
    expect(isInactive({ lastTradeAt: null, createdAt: T0 }, T0 + 60 * DAY_MS)).toBe(true);
  });
});

describe("PRD §7 rebuy", () => {
  it("unlocks after a breach in either phase, stays until the next purchase", () => {
    expect(isRebuyEligible([{ status: "breached", createdAt: 2 }], false)).toBe(true);
    expect(
      isRebuyEligible(
        [
          { status: "breached", createdAt: 1 },
          { status: "active", createdAt: 2 },
        ],
        false,
      ),
    ).toBe(false);
    expect(isRebuyEligible([], false)).toBe(false);
  });

  it("is never offered after a violation", () => {
    expect(isRebuyEligible([{ status: "breached", createdAt: 1 }], true)).toBe(false);
    expect(
      isRebuyEligible(
        [
          { status: "terminated", createdAt: 1 },
          { status: "breached", createdAt: 2 },
        ],
        false,
      ),
    ).toBe(false);
    expect(rebuyOfferAfterBreach(null, "a1", T0, true)).toBeNull();
  });

  it("does not compound: an existing offer is kept as is", () => {
    const offer = rebuyOfferAfterBreach(null, "a1", T0, false)!;
    expect(offer).toEqual({ unlockedAt: T0, fromAccountId: "a1", discountPct: 20 });
    expect(rebuyOfferAfterBreach(offer, "a2", T0 + 1, false)).toBe(offer);
  });

  it("activeAccount finds the one open account", () => {
    expect(
      activeAccount([
        { status: "breached", createdAt: 1 },
        { status: "active", createdAt: 2 },
      ])?.createdAt,
    ).toBe(2);
    expect(activeAccount([{ status: "graduated", createdAt: 1 }])).toBeNull();
  });
});

describe("PRD §9 violation consequences", () => {
  it("terminates open accounts, voids payouts under review, bars the user, no rebuy", () => {
    const c = violationConsequences(
      [
        { id: "a1", status: "breached" },
        { id: "a2", status: "active" },
      ],
      [
        { id: "p1", status: "paid", profitUsd: 1_000 },
        { id: "p2", status: "under_review", profitUsd: 6_200 },
      ],
    );
    expect(c).toEqual({
      terminateAccountIds: ["a2"],
      voidPayoutIds: ["p2"],
      voidedUsd: 6_200,
      barUser: true,
      rebuyOffered: false,
      reversePaidPayouts: false,
    });
  });
});

describe("PRD §4 deposits", () => {
  it("confirmations per chain", () => {
    expect(requiredConfirmations("arbitrum")).toBe(1);
    expect(requiredConfirmations("base")).toBe(1);
    expect(requiredConfirmations("ethereum")).toBe(12);
    expect(requiredConfirmations("bnb")).toBe(15);
    expect(confirmationsLabel(3, 12)).toBe("Confirming (3 of 12 confirmations)");
  });

  it("credits any overpayment; underpayment is not accepted and fully credited", () => {
    expect(settleDeposit(99, 99)).toEqual({ accepted: true, creditUsd: 0 });
    expect(settleDeposit(99, 120.5)).toEqual({ accepted: true, creditUsd: 21.5 });
    expect(settleDeposit(99, 50)).toEqual({ accepted: false, creditUsd: 50 });
  });
});
