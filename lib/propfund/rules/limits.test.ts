import { describe, expect, it } from "vitest";

import {
  dailyBreachLevel,
  dailyLossLimit,
  dailyLossUsed,
  dailyMeter,
  detectBreach,
  isDailyBreached,
  isMaxBreached,
  maxBreachLevel,
  maxLossUsed,
  maxMeter,
  meterTone,
  targetLevel,
  targetProgress,
} from "./limits";

const ELITE = 100_000;

describe("PRD §7 Elite example (B = $100,000)", () => {
  it("daily limit is $3,000 counting down from SOD: SOD $101,200 → breach at $98,200", () => {
    expect(dailyLossLimit(ELITE)).toBe(3_000);
    expect(dailyBreachLevel(101_200, ELITE)).toBe(98_200);
    expect(isDailyBreached(98_200.01, 101_200, ELITE)).toBe(false);
    expect(isDailyBreached(98_200, 101_200, ELITE)).toBe(true);
    expect(detectBreach(98_200, 101_200, ELITE)).toEqual({ rule: "daily", limit: 98_200 });
  });

  it("max loss is a fixed floor at $95,000, however much profit came before", () => {
    expect(maxBreachLevel(ELITE)).toBe(95_000);
    expect(isMaxBreached(95_000.01, ELITE)).toBe(false);
    expect(isMaxBreached(95_000, ELITE)).toBe(true);
    // After running to $108k, $96k is not a max breach: the floor never trails.
    expect(isMaxBreached(96_000, ELITE)).toBe(false);
  });

  it("reports the max rule when both are hit on the same tick", () => {
    expect(detectBreach(94_000, 96_500, ELITE)).toEqual({ rule: "max", limit: 95_000 });
  });

  it("no breach above both levels", () => {
    expect(detectBreach(99_000, 101_200, ELITE)).toBeNull();
  });

  it("target is +10%: $110,000", () => {
    expect(targetLevel(ELITE)).toBe(110_000);
  });
});

describe("limits at every package size", () => {
  it.each([
    [5_000, 150, 4_750, 5_500],
    [10_000, 300, 9_500, 11_000],
    [25_000, 750, 23_750, 27_500],
    [50_000, 1_500, 47_500, 55_000],
    [100_000, 3_000, 95_000, 110_000],
  ])("B=%i → daily $%i, floor $%i, target $%i", (b, daily, floor, target) => {
    expect(dailyLossLimit(b)).toBe(daily);
    expect(maxBreachLevel(b)).toBe(floor);
    expect(targetLevel(b)).toBe(target);
  });
});

describe("meters: neutral < 70%, amber ≥ 70%, red ≥ 90%", () => {
  it("tone thresholds", () => {
    expect(meterTone(0)).toBe("neutral");
    expect(meterTone(0.6999)).toBe("neutral");
    expect(meterTone(0.7)).toBe("amber");
    expect(meterTone(0.8999)).toBe("amber");
    expect(meterTone(0.9)).toBe("red");
    expect(meterTone(1)).toBe("red");
  });

  it("daily used is measured from SOD, not B", () => {
    expect(dailyLossUsed(99_100, 101_200, ELITE)).toBeCloseTo(0.7, 10);
    expect(dailyMeter(99_100, 101_200, ELITE)).toMatchObject({
      limit: 3_000,
      breachAt: 98_200,
      usedUsd: 2_100,
      remainingUsd: 900,
      tone: "amber",
    });
    expect(dailyMeter(98_500, 101_200, ELITE).tone).toBe("red");
    expect(dailyLossUsed(102_000, 101_200, ELITE)).toBe(0);
  });

  it("max used is measured from B and clamps to 0–1", () => {
    expect(maxLossUsed(110_000, ELITE)).toBe(0);
    expect(maxLossUsed(97_500, ELITE)).toBeCloseTo(0.5, 10);
    expect(maxMeter(96_500, ELITE).tone).toBe("amber");
    expect(maxMeter(95_500, ELITE)).toMatchObject({ tone: "red", remainingUsd: 500 });
    expect(maxLossUsed(90_000, ELITE)).toBe(1);
  });

  it("target progress runs from B to +10%", () => {
    expect(targetProgress(99_000, ELITE)).toBe(0);
    expect(targetProgress(105_000, ELITE)).toBeCloseTo(0.5, 10);
    expect(targetProgress(112_000, ELITE)).toBe(1);
  });
});
