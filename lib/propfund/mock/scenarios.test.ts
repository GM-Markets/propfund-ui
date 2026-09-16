import { beforeEach, describe, expect, it } from "vitest";

import {
  MIN_PAYOUT_USD,
  activeAccount,
  computeAccountMetrics,
  dailyBreachLevel,
  latestAccount,
  maxBreachLevel,
  reviewDayLabel,
  splitProfit,
  targetLevel,
} from "@/lib/propfund/rules";
import type { Account } from "@/lib/propfund/types";

import { _setClockOffsetForTests, now } from "./clock";
import { getMarks, resetPrices } from "./prices";
import { configureMockService } from "./service";
import { getSnapshot, requireData, setHydrationDelay, setSessionUser } from "./store";
import { SCENARIOS, SCENARIO_PACKAGE, applyScenario, buyChallenge, buyChallengeAtRebuy } from "./test-controls";

const WALLET = `0x${"5".repeat(40)}`;
/** Core (PRD §3): $10,000 · fee $99 · rebuy $79 · daily $300 · max $500 · target $1,000. */
const SIZE = 10_000;
const DAY_MS = 86_400_000;

function data() {
  return requireData();
}

function account(): Account {
  const a = activeAccount(data().accounts);
  if (!a) throw new Error("no active account");
  return a;
}

/** The account the scenario ended on, active or closed. */
function current(): Account {
  const a = latestAccount(data().accounts);
  if (!a) throw new Error("no account");
  return a;
}

function positions(accountId: string) {
  return data().positions.filter((p) => p.accountId === accountId);
}

beforeEach(async () => {
  configureMockService({ latencyMs: [0, 0] });
  setHydrationDelay(0);
  window.localStorage.clear();
  _setClockOffsetForTests(0);
  await setSessionUser(null);
  resetPrices();
  await setSessionUser({ id: `user-${Math.random()}`, email: "t@example.com", walletAddress: WALLET });
});

/** One-tap states for design review (PRD §12), each PRD-correct (§5–§9). */
describe("scenarios", () => {
  it("offers every state in the drawer with a description", () => {
    expect(SCENARIOS.map((s) => s.id)).toEqual([
      "new-user",
      "challenge-trades",
      "challenge-blown-up",
      "graduated",
      "funded-trades",
      "payout-requested",
      "payout-paid",
      "blow-up-after-graduation",
      "blow-up-before-payout",
      "blow-up-after-payout",
    ]);
    for (const s of SCENARIOS) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(0);
    }
  });

  it("wipes the previous state first, so every state is reproducible", async () => {
    await applyScenario("payout-paid");
    await applyScenario("new-user");
    const d = data();
    expect(d.accounts).toHaveLength(0);
    expect(d.payouts).toHaveLength(0);
    expect(d.positions).toHaveLength(0);
    expect(d.fills).toHaveLength(0);
    expect(d.payments).toHaveLength(0);
    expect(d.rebuyOffer).toBeNull();
    expect(d.takeover).toBeNull();
    expect(d.kyc.status).toBe("not_started");
    expect(d.user.barred).toBe(false);
  });

  it("challenge · active trades: 3 open positions, mixed P&L, meters part-used", async () => {
    await applyScenario("challenge-trades");
    const a = account();
    expect(a.phase).toBe("challenge");
    expect(a.status).toBe("active");
    expect(a.packageId).toBe(SCENARIO_PACKAGE);
    expect(a.accountSize).toBe(SIZE);
    expect(a.baseline).toBe(SIZE);
    expect(a.sod).toBe(SIZE);
    // Nothing is closed yet, so the balance is still the baseline.
    expect(a.balance).toBe(SIZE);

    const open = positions(a.id);
    expect(open).toHaveLength(3);
    expect(new Set(open.map((p) => p.symbol)).size).toBe(3);
    expect(open.some((p) => p.side === "long")).toBe(true);
    expect(open.some((p) => p.side === "short")).toBe(true);

    // Unrealized: BTC +180, ETH −150, XAU −240 = −210, i.e. 70% of the $300 daily limit.
    const m = computeAccountMetrics(a, open, 0, getMarks());
    expect(m.unrealizedPnl).toBeCloseTo(-210, 0);
    expect(m.equity).toBeCloseTo(SIZE - 210, 0);
    expect(m.todayPnl).toBeCloseTo(-210, 0);
    expect(m.daily.limit).toBe(300);
    expect(m.daily.used).toBeCloseTo(0.7, 2);
    expect(m.daily.tone).toBe("amber");
    expect(m.max.limit).toBe(500);
    expect(m.max.used).toBeCloseTo(0.42, 2);
    expect(m.max.tone).toBe("neutral");
    expect(m.target?.level).toBe(targetLevel(SIZE));
    // Positions on both sides of the book: one winner, two losers.
    const pnl = open.map((p) => (p.side === "long" ? 1 : -1) * p.quantity * (getMarks()[p.symbol] - p.entryPrice));
    expect(pnl.filter((v) => v > 0)).toHaveLength(1);
    expect(pnl.filter((v) => v < 0)).toHaveLength(2);
    expect(data().takeover).toBeNull();
  });

  it("challenge · blown up: daily breach, read-only, rebuy offer and takeover", async () => {
    await applyScenario("challenge-blown-up");
    const d = data();
    const a = current();
    expect(activeAccount(d.accounts)).toBeNull();
    expect(a.status).toBe("breached");
    expect(a.phase).toBe("challenge");
    expect(a.closedAt).not.toBeNull();
    expect(a.breach?.rule).toBe("daily");
    expect(a.breach?.limit).toBe(dailyBreachLevel(a.sod, a.baseline));
    expect(a.breach!.equity).toBeLessThanOrEqual(a.breach!.limit);
    // Everything closed at the mark and the balance is the breach equity.
    expect(positions(a.id)).toHaveLength(0);
    expect(a.balance).toBeCloseTo(a.breach!.equity, 2);
    // A closed winner before the breach, so the screen has stats.
    expect(a.stats.trades).toBeGreaterThanOrEqual(2);
    expect(a.stats.wins).toBeGreaterThanOrEqual(1);
    // Rebuy at 20% off stays open until the next purchase (PRD §7).
    expect(d.rebuyOffer).toMatchObject({ fromAccountId: a.id, discountPct: 20 });
    expect(d.takeover).toMatchObject({ kind: "breach", accountId: a.id });
    expect(d.user.barred).toBe(false);
  });

  it("graduated: the challenge passes and a funded account opens at the package size", async () => {
    await applyScenario("graduated");
    const d = data();
    const challenge = d.accounts.find((a) => a.phase === "challenge")!;
    const funded = account();

    expect(challenge.status).toBe("graduated");
    expect(challenge.balance).toBeGreaterThanOrEqual(targetLevel(challenge.baseline));
    expect(funded.phase).toBe("funded");
    expect(funded.status).toBe("active");
    expect(funded.parentAccountId).toBe(challenge.id);
    // Challenge profit is not paid out: the funded account opens at the package size.
    expect(funded.baseline).toBe(SIZE);
    expect(funded.balance).toBe(SIZE);
    expect(funded.sod).toBe(SIZE);
    expect(funded.feePaidUsd).toBe(0);
    expect(d.kyc.status).toBe("verified");
    expect(d.payouts).toHaveLength(0);
    expect(d.takeover).toMatchObject({ kind: "graduation", fundedAccountId: funded.id });
  });

  it("funded · active trades: positions on the funded account, past graduation", async () => {
    await applyScenario("funded-trades");
    const d = data();
    const funded = account();
    expect(funded.phase).toBe("funded");
    expect(funded.baseline).toBe(SIZE);
    expect(positions(funded.id)).toHaveLength(3);
    expect(new Set(positions(funded.id).map((p) => p.symbol)).size).toBe(3);
    expect(d.takeover).toBeNull();
    expect(d.accounts.some((a) => a.status === "graduated")).toBe(true);
  });

  it("payout requested: P debited, B reset, SOD lowered, under review to D+7", async () => {
    await applyScenario("payout-requested");
    const d = data();
    const funded = account();
    const payout = d.payouts[0];

    expect(d.payouts).toHaveLength(1);
    expect(payout.status).toBe("under_review");
    expect(payout.accountId).toBe(funded.id);
    expect(payout.address).toBe(WALLET);
    expect(payout.customAddress).toBe(false);
    // 100% of realized profit, split 80/20 (PRD §8).
    expect(payout.profitUsd).toBeGreaterThanOrEqual(MIN_PAYOUT_USD);
    expect(payout.profitUsd).toBeCloseTo(1_240, 0);
    expect(payout.traderUsd).toBe(splitProfit(payout.profitUsd).trader);
    expect(payout.propfundUsd).toBe(splitProfit(payout.profitUsd).propfund);
    expect(payout.traderUsd + payout.propfundUsd).toBeCloseTo(payout.profitUsd, 2);
    // Balance debited by P and B reset to the new balance.
    expect(payout.baselineBefore).toBe(SIZE);
    expect(payout.baselineAfter).toBe(funded.baseline);
    expect(funded.balance).toBeCloseTo(SIZE, 2);
    expect(funded.baseline).toBe(funded.balance);
    expect(payout.paysAt).toBe(payout.requestedAt + 7 * DAY_MS);
    expect(payout.paidAt).toBeNull();
    expect(payout.txHash).toBeNull();
    // A few days into the review, with days still to run.
    expect(reviewDayLabel(payout.requestedAt, now())).toBe("Day 4 of 7");
    expect(payout.paysAt).toBeGreaterThan(now());
    // Flat, so a second request is only blocked by the one under review.
    expect(positions(funded.id)).toHaveLength(0);
    expect(funded.status).toBe("active");
  });

  it("payout paid: sent on D+7 with a tx hash, on the reset baseline", async () => {
    await applyScenario("payout-paid");
    const d = data();
    const funded = account();
    const payout = d.payouts[0];

    expect(payout.status).toBe("paid");
    expect(payout.paidAt).toBe(payout.paysAt);
    expect(payout.txHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(now()).toBeGreaterThanOrEqual(payout.paysAt);
    expect(funded.status).toBe("active");
    expect(funded.baseline).toBe(payout.baselineAfter);
    expect(funded.baseline).toBe(funded.balance);
    expect(funded.balance).toBeCloseTo(SIZE, 2);
    // SOD has rolled over to the new balance, so the daily limit counts from there.
    expect(funded.sod).toBe(funded.balance);
    expect(d.kyc.status).toBe("verified");
  });

  it("blow-up after graduation: max-loss floor, no payout ever requested", async () => {
    await applyScenario("blow-up-after-graduation");
    const d = data();
    const funded = current();

    expect(funded.phase).toBe("funded");
    expect(funded.status).toBe("breached");
    expect(funded.breach?.rule).toBe("max");
    expect(funded.breach?.limit).toBe(maxBreachLevel(funded.baseline));
    expect(funded.breach!.equity).toBeLessThanOrEqual(maxBreachLevel(funded.baseline));
    // The daily limit had more room left than the floor, so "max" is unambiguous.
    expect(funded.breach!.equity).toBeGreaterThan(dailyBreachLevel(funded.sod, funded.baseline));
    expect(d.payouts).toHaveLength(0);
    expect(positions(funded.id)).toHaveLength(0);
    expect(d.rebuyOffer).not.toBeNull();
    expect(d.takeover).toMatchObject({ kind: "breach", accountId: funded.id });
  });

  it("blow-up before payout: payable profit earned, then given back", async () => {
    await applyScenario("blow-up-before-payout");
    const d = data();
    const funded = current();

    expect(funded.phase).toBe("funded");
    expect(funded.status).toBe("breached");
    expect(funded.breach?.rule).toBe("daily");
    expect(funded.breach?.limit).toBe(dailyBreachLevel(funded.sod, funded.baseline));
    // Profit of at least the $50 minimum was on the table before the breach.
    expect(funded.stats.bestTrade).toBeGreaterThanOrEqual(MIN_PAYOUT_USD);
    expect(funded.stats.bestTrade).toBeCloseTo(640, 0);
    expect(d.kyc.status).toBe("verified");
    // It was never requested, so nothing is owed.
    expect(d.payouts).toHaveLength(0);
    expect(funded.balance).toBeLessThan(funded.baseline);
    expect(d.rebuyOffer).not.toBeNull();
  });

  it("blow-up after payout: the paid payout stands, the breach is on the reset baseline", async () => {
    await applyScenario("blow-up-after-payout");
    const d = data();
    const funded = current();
    const payout = d.payouts[0];

    expect(payout.status).toBe("paid");
    expect(payout.txHash).not.toBeNull();
    expect(payout.baselineAfter).toBeCloseTo(SIZE, 2);
    expect(funded.status).toBe("breached");
    expect(funded.phase).toBe("funded");
    expect(funded.breach?.rule).toBe("daily");
    // The breach is measured against the baseline the payout reset, not the old one.
    expect(funded.baseline).toBe(payout.baselineAfter);
    expect(funded.breach?.limit).toBe(dailyBreachLevel(funded.sod, funded.baseline));
    expect(d.rebuyOffer).not.toBeNull();
  });
});

/** Buying a chosen package from the drawer (PRD §3, §4). */
describe("buy a challenge", () => {
  it("provisions the chosen package at the full fee", async () => {
    const a = await buyChallenge("plus");
    expect(a).toMatchObject({
      packageId: "plus",
      accountSize: 25_000,
      phase: "challenge",
      status: "active",
      pricing: "full",
      feePaidUsd: 249,
      baseline: 25_000,
      balance: 25_000,
    });
    expect(data().payments[0]).toMatchObject({ method: "card", status: "succeeded", amountUsd: 249, testMode: true });
  });

  it("buys at the rebuy fee, and the offer is consumed by the purchase", async () => {
    const a = await buyChallengeAtRebuy("elite");
    expect(a).toMatchObject({ packageId: "elite", pricing: "rebuy", feePaidUsd: 799, accountSize: 100_000 });
    expect(data().rebuyOffer).toBeNull();
  });

  it("honours one active account per user", async () => {
    await buyChallenge("starter");
    await expect(buyChallenge("core")).rejects.toMatchObject({
      code: "ACTIVE_ACCOUNT_EXISTS",
      message: "You already have an active account.",
    });
    expect(data().accounts).toHaveLength(1);
  });

  it("refuses a barred profile after a confirmed violation", async () => {
    await applyScenario("challenge-trades");
    const { flagViolation } = await import("./test-controls");
    flagViolation("V2");
    expect(getSnapshot().status).toBe("ready");
    await expect(buyChallenge("core")).rejects.toMatchObject({ code: "BARRED" });
    await expect(buyChallengeAtRebuy("core")).rejects.toMatchObject({ code: "BARRED" });
  });
});
