import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const detach = vi.fn();
const subscribeHlAllMidsMock = vi.fn<(onMids: (mids: Record<string, string>) => void) => () => void>(
  () => detach,
);
const fetchHlAllMidsMock = vi.fn(async (): Promise<Record<string, string> | null> => null);

vi.mock("@/lib/hl/all-mids", () => ({
  subscribeHlAllMids: (listener: (mids: Record<string, string>) => void) => subscribeHlAllMidsMock(listener),
  fetchHlAllMids: () => fetchHlAllMidsMock(),
}));

const { getHypMidsSnapshot, subscribeSharedHypMids, MIDS_PULSE_MS } = await import("./mids-feed");

describe("subscribeSharedHypMids", () => {
  beforeEach(() => {
    subscribeHlAllMidsMock.mockClear();
    fetchHlAllMidsMock.mockClear();
    fetchHlAllMidsMock.mockResolvedValue(null);
    detach.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it("pulls REST allMids immediately and again every 2s", async () => {
    vi.useFakeTimers();
    fetchHlAllMidsMock.mockResolvedValue({ ETH: "2479.1" });
    const a = vi.fn();
    const stop = subscribeSharedHypMids(a);
    await vi.advanceTimersByTimeAsync(0);
    expect(getHypMidsSnapshot().ETH).toBe("2479.1");
    fetchHlAllMidsMock.mockResolvedValue({ ETH: "2480.0" });
    await vi.advanceTimersByTimeAsync(MIDS_PULSE_MS);
    expect(getHypMidsSnapshot().ETH).toBe("2480.0");
    expect(fetchHlAllMidsMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    stop();
  });
});
