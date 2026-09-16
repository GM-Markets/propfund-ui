import { describe, expect, it } from "vitest";

import { MARKETS } from "@/lib/propfund/markets";
import { buyingPower } from "@/lib/propfund/rules";

import {
  availableToTrade,
  bookView,
  dailyHeadroomAfterStop,
  estimateExitPnl,
  formatCompactUsd,
  formatSize,
  groupMarkets,
  meterFillPct,
  notionalForShare,
  orderGate,
  parseAmount,
  resolveSymbol,
  shareOfBuyingPower,
  winRate,
  type OrderGateInput,
} from "./terminal";

describe("markets", () => {
  it("resolves ?symbol= to a known market or the default", () => {
    expect(resolveSymbol("ETH")).toBe("ETH");
    expect(resolveSymbol("eurusd")).toBe("EURUSD");
    expect(resolveSymbol("DOGE")).toBe("BTC");
    expect(resolveSymbol(null)).toBe("BTC");
  });

  it("groups the 12 markets by asset class in a fixed order", () => {
    const groups = groupMarkets(MARKETS);
    expect(groups.map((g) => g.label)).toEqual(["Crypto", "Forex", "Commodities", "Equities"]);
    expect(groups.reduce((n, g) => n + g.markets.length, 0)).toBe(12);
  });

  it("searches symbol, display name and name, dropping empty groups", () => {
    expect(groupMarkets(MARKETS, "gold").flatMap((g) => g.markets.map((m) => m.symbol))).toEqual(["XAUUSD"]);
    expect(groupMarkets(MARKETS, "eur/usd").flatMap((g) => g.markets.map((m) => m.symbol))).toEqual(["EURUSD"]);
    expect(groupMarkets(MARKETS, "zzz")).toEqual([]);
  });
});

describe("order book view", () => {
  const book = {
    asks: [
      { price: 101, size: 2, total: 2 },
      { price: 102, size: 3, total: 5 },
    ],
    bids: [
      { price: 99, size: 4, total: 4 },
      { price: 98, size: 6, total: 10 },
    ],
    spread: 2,
  };

  it("orders asks highest first and scales depth to the deepest side", () => {
    const v = bookView(book);
    expect(v.asks.map((r) => r.price)).toEqual([102, 101]);
    expect(v.bids.map((r) => r.price)).toEqual([99, 98]);
    expect(v.bids[1].depth).toBe(1);
    expect(v.asks[0].depth).toBe(0.5);
    expect(v.mid).toBe(100);
    expect(v.spreadPct).toBeCloseTo(0.02);
  });

  it("handles an empty book", () => {
    const v = bookView({ asks: [], bids: [], spread: 0 });
    expect(v).toMatchObject({ asks: [], bids: [], mid: 0, spreadPct: 0 });
  });

  it("formats sizes by magnitude", () => {
    expect(formatSize(1_250_000)).toBe("1.25M");
    expect(formatSize(25_300)).toBe("25.3K");
    expect(formatSize(1_250)).toBe("1,250");
    expect(formatSize(12.5)).toBe("12.50");
    expect(formatSize(0.25134)).toBe("0.2513");
  });
});

describe("meter formatting", () => {
  it("compacts dollars for tight meters", () => {
    expect(formatCompactUsd(950)).toBe("$950");
    expect(formatCompactUsd(1_500)).toBe("$1.5k");
    expect(formatCompactUsd(3_000)).toBe("$3k");
    expect(formatCompactUsd(12_540)).toBe("$12.5k");
    expect(formatCompactUsd(1_200_000)).toBe("$1.2M");
    expect(formatCompactUsd(-250)).toBe("-$250");
  });

  it("clamps bar widths", () => {
    expect(meterFillPct(0.4567)).toBe(45.7);
    expect(meterFillPct(1.4)).toBe(100);
    expect(meterFillPct(-1)).toBe(0);
    expect(meterFillPct(Number.NaN)).toBe(0);
  });
});

describe("order form buying power and sizing", () => {
  it("uses the rules buying power at the chosen leverage", () => {
    expect(availableToTrade(1_000, 5)).toBe(buyingPower(1_000, 5));
    expect(availableToTrade(1_000, 5)).toBe(5_000);
    expect(availableToTrade(1_000, 25)).toBe(10_000);
    expect(availableToTrade(-50, 10)).toBe(0);
  });

  it("sizes chips as a share of buying power without exceeding it", () => {
    expect(notionalForShare(9_999.99, 1)).toBe(9_999.99);
    expect(notionalForShare(10_000, 0.25)).toBe(2_500);
    expect(notionalForShare(333.33, 0.5)).toBe(166.66);
    expect(notionalForShare(10_000, 0)).toBe(0);
    expect(shareOfBuyingPower(2_500, 10_000)).toBe(0.25);
    expect(shareOfBuyingPower(20_000, 10_000)).toBe(1);
    expect(shareOfBuyingPower(null, 10_000)).toBe(0);
  });

  it("parses typed amounts", () => {
    expect(parseAmount("1,250.50")).toBe(1250.5);
    expect(parseAmount("$500")).toBe(500);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("12a")).toBeNull();
  });
});

describe("TP/SL effect", () => {
  const USD = { quote: "USD" as const };

  it("estimates P&L at the exit for a new order", () => {
    // $10,000 long at 100 → 100 units; stop at 98 → −$200, target at 105 → +$500.
    expect(estimateExitPnl(USD, "buy", 10_000, 100, 98)).toBe(-200);
    expect(estimateExitPnl(USD, "buy", 10_000, 100, 105)).toBe(500);
    expect(estimateExitPnl(USD, "sell", 10_000, 100, 98)).toBe(200);
    expect(estimateExitPnl(USD, "buy", 0, 100, 98)).toBe(0);
  });

  it("projects daily headroom and tone after a stop", () => {
    const daily = { limit: 300, remainingUsd: 300 };
    const after = dailyHeadroomAfterStop(daily, -100);
    expect(after).toMatchObject({ remainingAfterUsd: 200, tone: "neutral", breaches: false });
    expect(after.usedAfter).toBeCloseTo(1 / 3);
    // In profit today: headroom above the limit reads as 0% used.
    expect(dailyHeadroomAfterStop({ limit: 300, remainingUsd: 450 }, -100).usedAfter).toBe(0);
    expect(dailyHeadroomAfterStop(daily, -210).tone).toBe("amber");
    expect(dailyHeadroomAfterStop(daily, -280).tone).toBe("red");
    expect(dailyHeadroomAfterStop(daily, -320)).toMatchObject({ breaches: true, tone: "red", usedAfter: 1 });
    // A profitable stop never adds headroom.
    expect(dailyHeadroomAfterStop(daily, 50).remainingAfterUsd).toBe(300);
  });
});

describe("order gate", () => {
  const base: OrderGateInput = {
    active: true,
    pending: false,
    type: "market",
    side: "buy",
    notionalUsd: 1_000,
    buyingPowerUsd: 5_000,
    opposesPosition: false,
    mark: 100,
    limitPrice: null,
    takeProfit: null,
    stopLoss: null,
  };

  it("allows a valid order", () => {
    expect(orderGate(base)).toEqual({ canSubmit: true, reason: null });
  });

  it("gates with a helper line, never blocking the side", () => {
    expect(orderGate({ ...base, active: false }).reason).toMatch(/active account/);
    expect(orderGate({ ...base, notionalUsd: null }).reason).toBe("Enter a size to place an order.");
    expect(orderGate({ ...base, notionalUsd: 5 }).reason).toBe("Minimum order size is $10.");
    expect(orderGate({ ...base, type: "limit" }).reason).toBe("Enter a limit price.");
    expect(orderGate({ ...base, notionalUsd: 6_000 }).canSubmit).toBe(false);
    expect(orderGate({ ...base, buyingPowerUsd: 0 }).reason).toMatch(/No buying power/);
    expect(orderGate({ ...base, pending: true })).toEqual({ canSubmit: false, reason: null });
  });

  it("lets a sell against a long through regardless of buying power", () => {
    expect(orderGate({ ...base, side: "sell", notionalUsd: 6_000, buyingPowerUsd: 0, opposesPosition: true }).canSubmit).toBe(true);
  });

  it("validates TP/SL against the limit price or the mark via rules", () => {
    expect(orderGate({ ...base, takeProfit: 99 }).reason).toMatch(/Take-profit must be above/);
    expect(orderGate({ ...base, side: "sell", stopLoss: 99 }).reason).toMatch(/Stop-loss must be above/);
    expect(orderGate({ ...base, type: "limit", limitPrice: 90, takeProfit: 95 }).canSubmit).toBe(true);
  });
});

describe("stats", () => {
  it("computes win rate over closed results", () => {
    expect(winRate({ wins: 3, losses: 1 })).toBe(0.75);
    expect(winRate({ wins: 0, losses: 0 })).toBeNull();
  });
});
