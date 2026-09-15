import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const detach = vi.fn();
const subscribeHlAllMidsMock = vi.fn(() => detach);

vi.mock("@/lib/hl/all-mids", () => ({
  subscribeHlAllMids: (listener: (mids: Record<string, string>) => void) => subscribeHlAllMidsMock(listener),
}));

const { getHypMidsSnapshot, subscribeSharedHypMids } = await import("./mids-feed");

describe("subscribeSharedHypMids", () => {
  beforeEach(() => {
    subscribeHlAllMidsMock.mockClear();
    detach.mockClear();
  });

  afterEach(() => {
    // Drop the module-level socket when the last listener unsubscribes in each test.
  });

  it("opens one Hyperliquid allMids socket no matter how many consumers subscribe", () => {
    const stopA = subscribeSharedHypMids(vi.fn());
    const stopB = subscribeSharedHypMids(vi.fn());
    expect(subscribeHlAllMidsMock).toHaveBeenCalledTimes(1);
    stopA();
    expect(detach).not.toHaveBeenCalled();
    stopB();
    expect(detach).toHaveBeenCalledOnce();
  });

  it("merges ticks so every open position keeps a live mid", () => {
    const a = vi.fn();
    const stopA = subscribeSharedHypMids(a);
    const push = subscribeHlAllMidsMock.mock.calls[0][0] as (mids: Record<string, string>) => void;
    push({ BTC: "76956.5" });
    push({ SOL: "100.67" });
    expect(getHypMidsSnapshot()).toEqual({ BTC: "76956.5", SOL: "100.67" });
    expect(a).toHaveBeenLastCalledWith({ BTC: "76956.5", SOL: "100.67" });
    stopA();
  });
});
