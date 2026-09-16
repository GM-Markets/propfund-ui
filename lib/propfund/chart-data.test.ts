import { describe, expect, it } from "vitest";

import {
  candleSyncMode,
  equityCurveGeometry,
  hslTokenToRgba,
  priceFormatForTick,
  syntheticVolume,
  toVolumeBar,
} from "./chart-data";

const c = (time: number, close = 100, open = 100) => ({ time, open, high: Math.max(open, close) + 1, low: Math.min(open, close) - 1, close });

describe("theme colours", () => {
  it("converts HSL tokens to rgba", () => {
    expect(hslTokenToRgba("0 0% 100%")).toBe("rgba(255, 255, 255, 1)");
    expect(hslTokenToRgba("0 100% 50%")).toBe("rgba(255, 0, 0, 1)");
    expect(hslTokenToRgba("120 100% 50% / 0.5")).toBe("rgba(0, 255, 0, 0.5)");
    expect(hslTokenToRgba("240 100% 50%", 0.2)).toBe("rgba(0, 0, 255, 0.2)");
    expect(hslTokenToRgba("210 40% 92% / 8%")).toMatch(/, 0.08\)$/);
    expect(hslTokenToRgba("not a colour")).toBeNull();
  });
});

describe("price format", () => {
  it("derives precision from the tick size", () => {
    expect(priceFormatForTick(0.1)).toEqual({ type: "price", precision: 1, minMove: 0.1 });
    expect(priceFormatForTick(0.00001)).toEqual({ type: "price", precision: 5, minMove: 0.00001 });
  });
});

describe("volume", () => {
  it("is stable per bar and coloured by direction", () => {
    expect(syntheticVolume("BTC", c(60))).toBe(syntheticVolume("BTC", c(60)));
    expect(syntheticVolume("BTC", c(60))).toBeGreaterThan(0);
    expect(toVolumeBar("BTC", c(60, 101, 100), "up", "down").color).toBe("up");
    expect(toVolumeBar("BTC", c(60, 99, 100), "up", "down").color).toBe("down");
  });
});

describe("candle sync", () => {
  const a = [c(0), c(60), c(120)];

  it("sets on first load, updates the live bar or one appended bar", () => {
    expect(candleSyncMode(null, a)).toBe("set");
    expect(candleSyncMode(a, a)).toBe("none");
    expect(candleSyncMode(a, [c(0), c(60), c(120, 105)])).toBe("update");
    expect(candleSyncMode(a, [...a, c(180)])).toBe("update");
  });

  it("resets when history changes shape", () => {
    expect(candleSyncMode(a, [c(60), c(120), c(180)])).toBe("set");
    expect(candleSyncMode(a, [c(0), c(60)])).toBe("set");
    expect(candleSyncMode(a, [])).toBe("set");
    expect(candleSyncMode(null, [])).toBe("none");
  });
});

describe("equity curve geometry", () => {
  it("builds line and area paths within the box", () => {
    const g = equityCurveGeometry(
      [
        { t: 0, equity: 100 },
        { t: 10, equity: 110 },
        { t: 20, equity: 90 },
      ],
      200,
      100,
      { padding: 0, include: [80] },
    );
    expect(g).not.toBeNull();
    expect(g!.line.startsWith("M0.00,")).toBe(true);
    expect(g!.area.endsWith("Z")).toBe(true);
    expect(g!.min).toBe(80);
    expect(g!.max).toBe(110);
    expect(g!.y(110)).toBe(0);
    expect(g!.y(80)).toBe(100);
  });

  it("handles a single point and empty input", () => {
    expect(equityCurveGeometry([{ t: 5, equity: 100 }], 100, 50)).not.toBeNull();
    expect(equityCurveGeometry([], 100, 50)).toBeNull();
  });
});
