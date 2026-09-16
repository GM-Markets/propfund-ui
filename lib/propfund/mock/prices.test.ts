import { describe, expect, it } from "vitest";

import { MARKETS } from "@/lib/propfund/markets";

import { getCandles, getQuote, nudgeMark, resetPrices } from "./prices";

describe("price feed history", () => {
  it("keeps the 24h stats consistent with the chart history", () => {
    resetPrices();
    for (const m of MARKETS) {
      const q = getQuote(m.symbol)!;
      const oneMinute = getCandles(m.symbol, "1m");
      expect(q.low24h).toBeLessThanOrEqual(q.price);
      expect(q.high24h).toBeGreaterThanOrEqual(q.price);
      for (const c of oneMinute) {
        expect(c.high).toBeLessThanOrEqual(q.high24h);
        expect(c.low).toBeGreaterThanOrEqual(q.low24h);
      }
    }
  });

  it("ends every timeframe at the live price, including after a move", () => {
    resetPrices();
    nudgeMark("BTC", 0.01);
    const q = getQuote("BTC")!;
    for (const tf of ["1m", "5m", "15m", "1h"] as const) {
      const series = getCandles("BTC", tf);
      expect(series.length).toBeGreaterThan(100);
      expect(series[series.length - 1].close).toBe(q.price);
    }
    expect(q.high24h).toBeGreaterThanOrEqual(q.price);
  });

  it("aggregates coarser timeframes from the same 1m path", () => {
    resetPrices();
    const hourly = getCandles("ETH", "1h");
    const fifteen = getCandles("ETH", "15m");
    const lastHour = hourly[hourly.length - 1];
    const inHour = fifteen.filter((c) => c.time >= lastHour.time);
    expect(Math.max(...inHour.map((c) => c.high))).toBe(lastHour.high);
    expect(Math.min(...inHour.map((c) => c.low))).toBe(lastHour.low);
  });
});
