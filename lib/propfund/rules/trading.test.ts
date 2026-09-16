import { describe, expect, it } from "vitest";

import type { Account, Position } from "@/lib/propfund/types";

import { computeAccountMetrics } from "./metrics";
import {
  buyingPower,
  exitTrigger,
  limitCrossed,
  netFill,
  pnlUsd,
  validateExits,
} from "./trading";

const USD = { quote: "USD" as const };
const JPY = { quote: "JPY" as const };

describe("P&L", () => {
  it("USD-quoted long and short", () => {
    expect(pnlUsd(USD, "long", 2, 100, 110)).toBe(20);
    expect(pnlUsd(USD, "short", 2, 100, 110)).toBe(-20);
  });

  it("USD/JPY converts quote P&L at the exit price", () => {
    expect(pnlUsd(JPY, "long", 100_000, 147, 148)).toBeCloseTo(100_000 / 148, 6);
  });
});

describe("netting", () => {
  it("opens, increases with an average entry, reduces, closes and flips", () => {
    const open = netFill(USD, null, "buy", 1, 100);
    expect(open).toEqual({ position: { side: "long", quantity: 1, entryPrice: 100 }, realizedPnl: 0, kind: "open" });
    const inc = netFill(USD, open.position, "buy", 1, 110);
    expect(inc.position).toEqual({ side: "long", quantity: 2, entryPrice: 105 });
    const red = netFill(USD, inc.position, "sell", 0.5, 115);
    expect(red).toMatchObject({ kind: "reduce", realizedPnl: 5, position: { quantity: 1.5, entryPrice: 105 } });
    const close = netFill(USD, red.position, "sell", 1.5, 100);
    expect(close).toEqual({ position: null, realizedPnl: -7.5, kind: "close" });
    const flip = netFill(USD, { side: "long", quantity: 1, entryPrice: 100 }, "sell", 3, 90);
    expect(flip).toEqual({ position: { side: "short", quantity: 2, entryPrice: 90 }, realizedPnl: -10, kind: "flip" });
  });
});

describe("orders and exits", () => {
  it("limit orders fill when price crosses", () => {
    expect(limitCrossed("buy", 100, 100.01)).toBe(false);
    expect(limitCrossed("buy", 100, 100)).toBe(true);
    expect(limitCrossed("sell", 100, 99.99)).toBe(false);
    expect(limitCrossed("sell", 100, 100.5)).toBe(true);
  });

  it("TP/SL trigger on the right side", () => {
    const long = { side: "long" as const, takeProfit: 110, stopLoss: 95 };
    expect(exitTrigger(long, 100)).toBeNull();
    expect(exitTrigger(long, 110)).toBe("take_profit");
    expect(exitTrigger(long, 94)).toBe("stop_loss");
    const short = { side: "short" as const, takeProfit: 90, stopLoss: 105 };
    expect(exitTrigger(short, 89)).toBe("take_profit");
    expect(exitTrigger(short, 105)).toBe("stop_loss");
  });

  it("validates TP/SL placement", () => {
    expect(validateExits("long", 100, 110, 95)).toBeNull();
    expect(validateExits("long", 100, 99, null)).toMatch(/above/);
    expect(validateExits("short", 100, null, 99)).toMatch(/above/);
  });

  it("buying power is free margin × leverage, capped at 10×", () => {
    expect(buyingPower(10_000, 5)).toBe(50_000);
    expect(buyingPower(10_000, 25)).toBe(100_000);
  });
});

describe("account metrics", () => {
  const account: Account = {
    id: "a1",
    userId: "u",
    packageId: "elite",
    accountSize: 100_000,
    phase: "challenge",
    status: "active",
    feePaidUsd: 999,
    pricing: "full",
    paymentId: null,
    parentAccountId: null,
    baseline: 100_000,
    balance: 101_200,
    sod: 101_200,
    sodDay: "2026-09-15",
    createdAt: 0,
    closedAt: null,
    lastTradeAt: null,
    breach: null,
    violation: null,
    stats: { trades: 0, wins: 0, losses: 0, realizedPnl: 0, bestTrade: 0, worstTrade: 0, volumeUsd: 0 },
    equityCurve: [],
  };
  const pos: Position = {
    id: "p1",
    accountId: "a1",
    symbol: "ETH",
    side: "long",
    quantity: 10,
    entryPrice: 3_000,
    leverage: 5,
    entryNotionalUsd: 30_000,
    marginUsd: 6_000,
    takeProfit: null,
    stopLoss: null,
    openedAt: 0,
    updatedAt: 0,
  };

  it("derives equity, P&L, meters and buying power", () => {
    // ETH down $210 × 10 = −$2,100 → equity $99,100, 70% of the daily limit used.
    const m = computeAccountMetrics(account, [pos], 0, { ETH: 2_790 });
    expect(m.equity).toBe(99_100);
    expect(m.todayPnl).toBe(-2_100);
    expect(m.totalPnl).toBe(-900);
    expect(m.daily).toMatchObject({ breachAt: 98_200, tone: "amber" });
    expect(m.max).toMatchObject({ breachAt: 95_000, tone: "neutral" });
    expect(m.marginUsedUsd).toBe(6_000);
    expect(m.freeMarginUsd).toBe(93_100);
    expect(m.flat).toBe(false);
    expect(m.target).toMatchObject({ level: 110_000, reached: false });
  });

  it("shows the target banner only with positions open on a challenge at ≥ 110%", () => {
    const m = computeAccountMetrics({ ...account, balance: 100_000 }, [pos], 0, { ETH: 4_000 });
    expect(m.target?.reached).toBe(true);
    expect(m.showTargetBanner).toBe(true);
    expect(computeAccountMetrics({ ...account, phase: "funded" }, [pos], 0, { ETH: 4_000 }).target).toBeNull();
  });

  it("is not flat while orders are working", () => {
    expect(computeAccountMetrics(account, [], 1, {}).flat).toBe(false);
    expect(computeAccountMetrics(account, [], 0, {}).flat).toBe(true);
  });
});
