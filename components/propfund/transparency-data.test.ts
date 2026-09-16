import { describe, expect, it } from "vitest";

import { challengePackages, PAYOUT_REVIEW_DAYS, TRADER_SPLIT_PCT } from "./site-data";
import {
  ASSET_CLASSES,
  TRANSPARENCY_SCALES,
  type TransparencyData,
  type TransparencyScale,
  buildSampleTransparencyData,
  getTransparencyData,
  parseTransparencyScale,
} from "./transparency-data";

const data = getTransparencyData();
const { series, stats, dates } = data;
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
const close = (a: number, b: number, tolerance = 0.01) => Math.abs(a - b) <= tolerance;

describe("transparency sample data", () => {
  it("is labelled as sample data and ends before today", () => {
    expect(data.mode).toBe("sample");
    expect(dates.at(-1)).toBe(data.asOf);
    expect(dates.length).toBe(240);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it("is deterministic", () => {
    expect(buildSampleTransparencyData()).toEqual(data);
  });

  it("aligns every series with the dates", () => {
    const flat: number[][] = [
      series.activeTraders, series.payingTraders, series.revenueDaily, series.revenueCumulative, series.breachesDaily, series.breachesMax,
      series.notionalVolume, series.tradeCount, series.fundedTraders, series.fundedCapital, series.payoutsDaily, series.payoutsCumulative,
      series.hedgingRealizedCumulative, series.hedgingUnrealized,
      ...Object.values(series.revenueByPackage), ...Object.values(series.purchasesByPackage), ...Object.values(series.volumeByAssetClass),
    ];
    for (const values of flat) expect(values).toHaveLength(dates.length);
    expect(series.passRate).toHaveLength(dates.length);
  });

  it("keeps revenue consistent with packages and fees", () => {
    expect(Object.keys(series.revenueByPackage)).toEqual(challengePackages.map((plan) => plan.id));
    dates.forEach((_, d) => {
      expect(sum(Object.values(series.revenueByPackage).map((values) => values[d]))).toBe(series.revenueDaily[d]);
    });
    expect(series.revenueCumulative.at(-1)).toBe(stats.feeRevenueLifetime);
    expect(stats.challengesSold).toBe(sum(Object.values(series.purchasesByPackage).map(sum)));

    // Every purchase is at the full fee or the rebuy fee.
    challengePackages.forEach((plan) => {
      const revenue = sum(series.revenueByPackage[plan.id]);
      const count = sum(series.purchasesByPackage[plan.id]);
      expect(revenue).toBeGreaterThanOrEqual(count * plan.rebuyFee);
      expect(revenue).toBeLessThanOrEqual(count * plan.fee);
    });
    expect(stats.annualizedRunRate).toBe(Math.round((sum(series.revenueDaily.slice(-30)) * 365) / 30));
  });

  it("pays 80% of profit, 7 days after the request", () => {
    expect(data.recentPayouts.length).toBeGreaterThan(0);
    for (const payout of data.recentPayouts) {
      expect(payout.amount).toBe(Math.round(payout.profit * 100 * TRADER_SPLIT_PCT) / 100);
      expect(payout.profit).toBeGreaterThanOrEqual(50);
      const days = (Date.parse(payout.paidOn) - Date.parse(payout.requestedOn)) / 86_400_000;
      expect(days).toBe(PAYOUT_REVIEW_DAYS);
      expect(payout.traderId).toMatch(/^T-[0-9A-F]{4}$/);
      expect(payout.txHash).toBeNull();
      expect(payout.paidOn <= data.asOf).toBe(true);
    }
    const paidOn = data.recentPayouts.map((payout) => payout.paidOn);
    expect([...paidOn].sort().reverse()).toEqual(paidOn);
    expect(close(series.payoutsCumulative.at(-1) ?? 0, stats.totalPayouts)).toBe(true);
    expect(close(sum(series.payoutsDaily), stats.totalPayouts, 0.05)).toBe(true);
    expect(stats.largestPayout).toBeGreaterThanOrEqual(Math.max(...data.recentPayouts.map((payout) => payout.amount)));
    expect(stats.medianHoursToPay).toBeGreaterThanOrEqual(PAYOUT_REVIEW_DAYS * 24 - 24);
  });

  it("has plausible, internally consistent headline figures", () => {
    expect(stats.passRate).toBeGreaterThan(0.05);
    expect(stats.passRate).toBeLessThan(0.25);
    expect(stats.passRate).toBeCloseTo(stats.passes / stats.resolvedChallenges, 10);
    expect(series.passRate.at(-1)).toBeCloseTo(stats.passRate, 10);
    expect(stats.payoutsShareOfRevenue).toBeGreaterThan(0.1);
    expect(stats.payoutsShareOfRevenue).toBeLessThan(0.6);
    expect(stats.payoutsShareOfRevenue).toBeCloseTo(stats.totalPayouts / stats.feeRevenueLifetime, 10);
    expect(stats.payingTraders).toBe(series.payingTraders.at(-1));
    expect(stats.payingTraders).toBeLessThanOrEqual(stats.challengesSold);
    expect(stats.activeTraders30d).toBeGreaterThanOrEqual(series.activeTraders.at(-1) ?? 0);
    expect(stats.activeTraders30d).toBeLessThanOrEqual(stats.payingTraders);
    expect(stats.fundedTraders).toBe(series.fundedTraders.at(-1));
    expect(stats.fundedCapital).toBe(series.fundedCapital.at(-1));
    expect(stats.fundedTraders).toBeLessThanOrEqual(stats.passes);
    expect(stats.hedgingRealized).toBe(series.hedgingRealizedCumulative.at(-1));
    expect(stats.hedgingCoverage).toBeCloseTo(stats.hedgingRealized / stats.totalPayouts, 10);
    for (const value of series.activeTraders) expect(value).toBeGreaterThanOrEqual(0);
    for (const value of series.fundedTraders) expect(value).toBeGreaterThanOrEqual(0);
  });

  it("splits trading volume across asset classes exactly", () => {
    expect(Object.keys(series.volumeByAssetClass)).toEqual([...ASSET_CLASSES]);
    dates.forEach((_, d) => {
      expect(sum(ASSET_CLASSES.map((name) => series.volumeByAssetClass[name][d]))).toBe(series.notionalVolume[d]);
    });
  });

  it("contains no addresses or transaction hashes", () => {
    expect(JSON.stringify(data)).not.toMatch(/0x[0-9a-fA-F]{8,}/);
  });
});

/** Three sizes of the same business for design review (PRD §11, §12). */
describe("transparency sample scales", () => {
  const byScale = Object.fromEntries(
    TRANSPARENCY_SCALES.map((scale) => [scale.id, getTransparencyData(scale.id)]),
  ) as Record<TransparencyScale, TransparencyData>;

  it("offers limited, many and mega, each with a description", () => {
    expect(TRANSPARENCY_SCALES.map((s) => s.id)).toEqual(["small", "medium", "mega"]);
    expect(TRANSPARENCY_SCALES.map((s) => s.label)).toEqual(["Limited users", "Many users", "Mega user base"]);
    for (const scale of TRANSPARENCY_SCALES) expect(scale.description.length).toBeGreaterThan(0);
  });

  it("defaults to the current dataset when no scale is asked for", () => {
    expect(getTransparencyData()).toEqual(data);
    expect(byScale.medium).toEqual(data);
    expect(parseTransparencyScale(undefined)).toBeNull();
    expect(parseTransparencyScale("huge")).toBeNull();
    expect(parseTransparencyScale("mega")).toBe("mega");
    expect(parseTransparencyScale(["small"])).toBe("small");
  });

  it.each(TRANSPARENCY_SCALES.map((s) => s.id))("%s is internally consistent", (scale) => {
    const d = byScale[scale];
    const s = d.series;

    expect(d.mode).toBe("sample");
    expect(d.dates).toHaveLength(240);
    expect(d.dates.at(-1)).toBe(d.asOf);
    for (const values of [
      s.activeTraders, s.payingTraders, s.revenueDaily, s.fundedTraders, s.fundedCapital, s.payoutsDaily,
      ...Object.values(s.revenueByPackage), ...Object.values(s.volumeByAssetClass),
    ]) {
      expect(values).toHaveLength(d.dates.length);
    }

    // Fees come from the §3 table, and every purchase is a full fee or a rebuy fee.
    challengePackages.forEach((plan) => {
      const revenue = sum(s.revenueByPackage[plan.id]);
      const count = sum(s.purchasesByPackage[plan.id]);
      expect(count).toBeGreaterThan(0);
      expect(revenue).toBeGreaterThanOrEqual(count * plan.rebuyFee);
      expect(revenue).toBeLessThanOrEqual(count * plan.fee);
    });
    expect(s.revenueCumulative.at(-1)).toBe(d.stats.feeRevenueLifetime);
    d.dates.forEach((_, i) => {
      expect(sum(Object.values(s.revenueByPackage).map((v) => v[i]))).toBe(s.revenueDaily[i]);
      expect(sum(ASSET_CLASSES.map((name) => s.volumeByAssetClass[name][i]))).toBe(s.notionalVolume[i]);
    });

    // Payouts: 80% of trader profit, paid on T+7, never below the $50 minimum.
    expect(d.recentPayouts.length).toBeGreaterThan(0);
    for (const payout of d.recentPayouts) {
      expect(payout.amount).toBe(Math.round(payout.profit * 100 * TRADER_SPLIT_PCT) / 100);
      expect(payout.profit).toBeGreaterThanOrEqual(50);
      expect((Date.parse(payout.paidOn) - Date.parse(payout.requestedOn)) / 86_400_000).toBe(PAYOUT_REVIEW_DAYS);
      expect(payout.traderId).toMatch(/^T-[0-9A-F]{4,6}$/);
      expect(payout.paidOn <= d.asOf).toBe(true);
    }
    expect(new Set(d.recentPayouts.map((p) => p.id)).size).toBe(d.recentPayouts.length);
    expect(close(s.payoutsCumulative.at(-1) ?? 0, d.stats.totalPayouts)).toBe(true);

    // Ratios stay plausible at every size.
    expect(d.stats.passRate).toBeCloseTo(d.stats.passes / d.stats.resolvedChallenges, 10);
    expect(d.stats.passRate).toBeGreaterThan(0.05);
    expect(d.stats.passRate).toBeLessThan(0.25);
    expect(d.stats.payoutsShareOfRevenue).toBeCloseTo(d.stats.totalPayouts / d.stats.feeRevenueLifetime, 10);
    expect(d.stats.payoutsShareOfRevenue).toBeGreaterThan(0.05);
    expect(d.stats.payoutsShareOfRevenue).toBeLessThan(0.9);
    expect(d.stats.medianHoursToPay).toBeGreaterThanOrEqual(PAYOUT_REVIEW_DAYS * 24 - 24);
    expect(d.stats.payingTraders).toBe(s.payingTraders.at(-1));
    expect(d.stats.fundedTraders).toBe(s.fundedTraders.at(-1));
    expect(d.stats.fundedCapital).toBe(s.fundedCapital.at(-1));
    expect(d.stats.fundedTraders).toBeLessThanOrEqual(d.stats.passes);
    expect(d.stats.activeTraders30d).toBeLessThanOrEqual(d.stats.payingTraders);
    expect(JSON.stringify(d)).not.toMatch(/0x[0-9a-fA-F]{8,}/);
  });

  it("grows on every headline figure: mega > many > limited", () => {
    const headline = [
      "feeRevenueLifetime", "annualizedRunRate", "totalPayouts", "payoutCount",
      "activeTraders30d", "payingTraders", "fundedTraders", "fundedCapital", "challengesSold", "passes",
      "resolvedChallenges",
    ] as const;
    for (const key of headline) {
      expect(byScale.small.stats[key]).toBeGreaterThan(0);
      expect(byScale.medium.stats[key]).toBeGreaterThan(byScale.small.stats[key]);
      expect(byScale.mega.stats[key]).toBeGreaterThan(byScale.medium.stats[key]);
    }
    // The largest single payout is capped by the largest package (80% of the
    // profit on a $100,000 account), so it saturates instead of scaling.
    expect(byScale.small.stats.largestPayout).toBeLessThan(byScale.medium.stats.largestPayout);
    expect(byScale.mega.stats.largestPayout).toBeGreaterThan(byScale.small.stats.largestPayout);
    for (const d of Object.values(byScale)) {
      expect(d.stats.largestPayout).toBeGreaterThan(0);
      expect(d.stats.largestPayout).toBeLessThanOrEqual(0.8 * 0.075 * 100_000);
    }
    // The chart series grow with them.
    expect(byScale.mega.series.activeTraders.at(-1)!).toBeGreaterThan(byScale.medium.series.activeTraders.at(-1)!);
    expect(byScale.medium.series.activeTraders.at(-1)!).toBeGreaterThan(byScale.small.series.activeTraders.at(-1)!);
    expect(byScale.mega.series.revenueCumulative.at(-1)!).toBeGreaterThan(byScale.medium.series.revenueCumulative.at(-1)!);
    expect(byScale.medium.series.revenueCumulative.at(-1)!).toBeGreaterThan(byScale.small.series.revenueCumulative.at(-1)!);
  });
});
