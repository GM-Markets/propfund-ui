import { describe, expect, it } from "vitest";

import { applyLiveBar, fillBarGaps } from "./liveBar";

describe("fillBarGaps", () => {
  it("inserts flat bars between holes and through now", () => {
    const bars = fillBarGaps(
      [
        { time: 0, open: 1, high: 1, low: 1, close: 1, volume: 1 },
        { time: 3_000, open: 2, high: 2, low: 2, close: 2, volume: 1 },
      ],
      1_000,
      4_000,
    );
    expect(bars.map((row) => row.time)).toEqual([0, 1_000, 2_000, 3_000, 4_000]);
    expect(bars[1]).toMatchObject({ open: 1, close: 1, volume: 0 });
  });
});

describe("applyLiveBar", () => {
  it("updates the forming bar and opens the next bucket", () => {
    const first = applyLiveBar(null, 10, 1_000, 1_500);
    expect(first[0]).toMatchObject({ time: 1_000, open: 10, close: 10 });
    const same = applyLiveBar(first[0]!, 12, 1_000, 1_800);
    expect(same[0]).toMatchObject({ time: 1_000, open: 10, high: 12, close: 12 });
    const next = applyLiveBar(same[0]!, 11, 1_000, 2_400);
    expect(next.at(-1)).toMatchObject({ time: 2_000, close: 11 });
  });
});
