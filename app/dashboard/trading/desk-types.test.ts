import { describe, expect, it } from "vitest";

import { liveDeskBalance, markLivePosition, type DeskBalance, type DeskPosition } from "./desk-types";

const LONG: DeskPosition = {
  coin: "PURR",
  side: "long",
  size: 278_344.7764,
  entry_price: 0.010778,
  mark_price: 0.010778,
  notional: 3_000,
  unrealized_pnl: -0.56,
};

describe("markLivePosition", () => {
  it("reprices mark, notional, and uPnL from the live mid", () => {
    const next = markLivePosition(LONG, 0.010773);
    expect(next.mark_price).toBe(0.010773);
    expect(next.notional).toBeCloseTo(278_344.7764 * 0.010773, 6);
    expect(next.unrealized_pnl).toBeCloseTo((0.010773 - 0.010778) * 278_344.7764, 6);
  });

  it("flips sign for shorts", () => {
    const next = markLivePosition({ ...LONG, side: "short" }, 0.010773);
    expect(next.unrealized_pnl).toBeCloseTo((0.010778 - 0.010773) * 278_344.7764, 6);
  });
});

describe("liveDeskBalance", () => {
  it("keeps header equity and uPnL on the same live marks as the blotter", () => {
    const balance: DeskBalance = {
      account_size: 10_000,
      status: "evaluation",
      cash: 9_044.68,
      used_margin: 1_000,
      equity: 10_044.12,
      unrealized_pnl: -0.56,
    };
    const positions = [markLivePosition(LONG, 0.010773)];
    const live = liveDeskBalance(balance, positions);
    expect(live?.unrealized_pnl).toBeCloseTo(positions[0].unrealized_pnl ?? 0, 8);
    expect(live?.equity).toBeCloseTo(9_044.68 + 1_000 + (live?.unrealized_pnl ?? 0), 8);
    expect(live?.unrealized_pnl).not.toBeCloseTo(-0.56, 2);
  });
});
