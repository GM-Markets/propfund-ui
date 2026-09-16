/**
 * Snapshot semantics of the live hooks. Each of them is read by several screens
 * at once and is re-derived on every price tick, so they must hand back the very
 * same object when the numbers have not moved — that identity is what stops a
 * BTC tick from re-rendering screens that have nothing to do with BTC.
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useAccountMetrics, useLivePositions, useOrders, useWallet } from "@/lib/propfund/hooks";

import { _setClockOffsetForTests } from "./mock/clock";
import { resetPrices, setMark, tick } from "./mock/prices";
import { completeTestCardPayment, configureMockService, createCardCheckout, placeOrder } from "./mock/service";
import { getSnapshot, setHydrationDelay, setSessionUser } from "./mock/store";

const WALLET = "0x" + "3".repeat(40);

function data() {
  const s = getSnapshot();
  if (s.status !== "ready") throw new Error("not ready");
  return s.data;
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

describe("useAccountMetrics", () => {
  it("keeps one object across ticks while the account is flat", async () => {
    await buyChallenge();
    const { result } = renderHook(() => useAccountMetrics());
    const first = result.current;
    expect(first?.equity).toBeGreaterThan(0);
    act(() => tick());
    act(() => tick());
    expect(result.current).toBe(first);
  });

  it("produces a new object when an open position's mark moves", async () => {
    await buyChallenge();
    await act(async () => {
      await placeOrder({ symbol: "ETH", side: "buy", type: "market", notionalUsd: 50_000, leverage: 5 });
    });
    const { result } = renderHook(() => useAccountMetrics());
    const first = result.current!;
    act(() => setMark("ETH", data().positions[0].entryPrice * 1.01));
    expect(result.current).not.toBe(first);
    expect(result.current!.equity).toBeGreaterThan(first.equity);
  });

  it("gives every caller the same object, so they render together", async () => {
    await buyChallenge();
    const a = renderHook(() => useAccountMetrics());
    const b = renderHook(() => useAccountMetrics());
    expect(a.result.current).toBe(b.result.current);
  });
});

describe("useLivePositions", () => {
  it("keeps one empty array across ticks when there is nothing open", async () => {
    await buyChallenge();
    const { result } = renderHook(() => useLivePositions());
    const first = result.current;
    expect(first).toEqual([]);
    act(() => tick());
    expect(result.current).toBe(first);
  });

  it("re-derives when the mark moves a position", async () => {
    await buyChallenge();
    await act(async () => {
      await placeOrder({ symbol: "SOL", side: "buy", type: "market", notionalUsd: 20_000, leverage: 5 });
    });
    const { result } = renderHook(() => useLivePositions());
    const first = result.current!;
    expect(first).toHaveLength(1);
    act(() => setMark("SOL", first[0].entryPrice * 1.02));
    expect(result.current).not.toBe(first);
    expect(result.current![0].unrealizedPnl).toBeGreaterThan(first[0].unrealizedPnl);
  });
});

describe("store-backed selectors", () => {
  it("keep their reference when a commit touched nothing they read", async () => {
    await buyChallenge();
    const orders = renderHook(() => useOrders());
    const wallet = renderHook(() => useWallet());
    const firstOrders = orders.result.current;
    const firstWallet = wallet.result.current;
    // A trade rewrites the whole data object; the wallet is untouched by it.
    await act(async () => {
      await placeOrder({ symbol: "ETH", side: "buy", type: "market", notionalUsd: 10_000, leverage: 5 });
    });
    expect(wallet.result.current).toBe(firstWallet);
    expect(orders.result.current).not.toBe(firstOrders);
    expect(orders.result.current).toHaveLength(1);
  });
});
