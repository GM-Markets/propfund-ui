/**
 * The tick path. `evaluate()` runs once a second and `commit()` deep-clones the
 * whole store, so it first asks `evaluateNeeded()` whether anything could
 * change. These tests hold the two in step: whenever the cheap check says "no",
 * the full pass must agree, and every rule that does fire must be seen by both.
 */
import { beforeEach, describe, expect, it } from "vitest";

import { DAY_MS } from "@/lib/propfund/rules";

import { _setClockOffsetForTests, now } from "./clock";
import { evaluate, evaluateDraft, evaluateNeeded } from "./engine";
import { getMarks, resetPrices, setMark } from "./prices";
import { closePosition, completeTestCardPayment, configureMockService, createCardCheckout, placeOrder } from "./service";
import { getSnapshot, setHydrationDelay, setSessionUser, type UserData } from "./store";

const WALLET = "0x" + "2".repeat(40);

function data(): UserData {
  const s = getSnapshot();
  if (s.status !== "ready") throw new Error("not ready");
  return s.data;
}

/** True when a full evaluation pass would change anything, without committing. */
function draftWouldChange(): boolean {
  return evaluateDraft(structuredClone(data()), getMarks(), now());
}

async function buyChallenge() {
  const checkout = await createCardCheckout({ packageId: "elite", agreedToTerms: true });
  const res = await completeTestCardPayment(checkout.id, "succeeded");
  return res.account!;
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

describe("evaluateNeeded", () => {
  it("is false with no account, and the full pass agrees", () => {
    expect(evaluateNeeded(data(), getMarks(), now())).toBe(false);
    expect(draftWouldChange()).toBe(false);
  });

  it("is false on a quiet account between equity samples, and the full pass agrees", async () => {
    await buyChallenge();
    evaluate();
    expect(evaluateNeeded(data(), getMarks(), now())).toBe(false);
    expect(draftWouldChange()).toBe(false);
  });

  it("never claims nothing changed when the full pass does change something", async () => {
    await buyChallenge();
    await placeOrder({ symbol: "ETH", side: "buy", type: "market", notionalUsd: 50_000, leverage: 5 });
    evaluate();
    const mark = getMarks().ETH;
    // Walk the price around and check the two agree at every step.
    for (const move of [1.002, 0.995, 1.03, 0.9, 1.2]) {
      setMark("ETH", mark * move);
      const needed = evaluateNeeded(data(), getMarks(), now());
      if (draftWouldChange()) expect(needed).toBe(true);
      evaluate();
    }
  });

  it("sees a stop-loss that the price has crossed", async () => {
    await buyChallenge();
    const mark = getMarks().ETH;
    await placeOrder({
      symbol: "ETH",
      side: "buy",
      type: "market",
      notionalUsd: 20_000,
      leverage: 5,
      sl: mark * 0.99,
    });
    evaluate();
    expect(evaluateNeeded(data(), getMarks(), now())).toBe(false);
    setMark("ETH", mark * 0.98);
    expect(evaluateNeeded(data(), getMarks(), now())).toBe(true);
    evaluate();
    expect(data().positions).toHaveLength(0);
  });

  it("sees a working limit order that the price has crossed", async () => {
    await buyChallenge();
    const mark = getMarks().SOL;
    await placeOrder({ symbol: "SOL", side: "buy", type: "limit", notionalUsd: 10_000, leverage: 5, limitPrice: mark * 0.97 });
    expect(evaluateNeeded(data(), getMarks(), now())).toBe(false);
    setMark("SOL", mark * 0.96);
    expect(evaluateNeeded(data(), getMarks(), now())).toBe(true);
    evaluate();
    expect(data().orders[0].status).toBe("filled");
  });

  it("sees the start-of-day rollover after midnight UTC", async () => {
    await buyChallenge();
    evaluate();
    expect(evaluateNeeded(data(), getMarks(), now())).toBe(false);
    _setClockOffsetForTests(DAY_MS);
    expect(evaluateNeeded(data(), getMarks(), now())).toBe(true);
    evaluate();
    _setClockOffsetForTests(0);
  });

  it("sees a breach", async () => {
    await buyChallenge();
    const mark = getMarks().ETH;
    await placeOrder({ symbol: "ETH", side: "buy", type: "market", notionalUsd: 200_000, leverage: 10 });
    evaluate();
    expect(evaluateNeeded(data(), getMarks(), now())).toBe(false);
    setMark("ETH", mark * 0.9);
    expect(evaluateNeeded(data(), getMarks(), now())).toBe(true);
    evaluate();
    expect(data().accounts[0].status).toBe("breached");
    setMark("ETH", mark);
  });

  it("leaves nothing for the tick to do after a graduation", async () => {
    const account = await buyChallenge();
    const mark = getMarks().ETH;
    await placeOrder({ symbol: "ETH", side: "buy", type: "market", notionalUsd: 400_000, leverage: 10 });
    const position = data().positions[0];
    setMark("ETH", mark * 1.4);
    // Closing the position graduates inside the action itself.
    await closePosition(position.id);
    expect(data().accounts.find((a) => a.id === account.id)!.status).toBe("graduated");
    expect(data().takeover?.kind).toBe("graduation");
    // The funded account that replaced it is quiet, so the next tick is a no-op.
    expect(evaluateNeeded(data(), getMarks(), now())).toBe(false);
    expect(draftWouldChange()).toBe(false);
    setMark("ETH", mark);
  });
});
