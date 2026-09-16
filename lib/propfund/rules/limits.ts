/**
 * Loss limits, target and meters (PRD §5, §7, §8). Pure functions.
 *
 * Every limit check uses equity and runs on every price tick.
 */
import type { BreachRule, LimitMeter, MeterTone } from "@/lib/propfund/types";

import { DAILY_LOSS_PCT, MAX_LOSS_PCT, TARGET_PCT, roundCents } from "./packages";

/** Amber at ≥ 70% used, red at ≥ 90% used (PRD §7 warnings). */
export const METER_AMBER_AT = 0.7;
export const METER_RED_AT = 0.9;

export function meterTone(usedFraction: number): MeterTone {
  if (usedFraction >= METER_RED_AT) return "red";
  if (usedFraction >= METER_AMBER_AT) return "amber";
  return "neutral";
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** Daily loss limit in dollars: fixed at 3% of B. */
export function dailyLossLimit(baseline: number): number {
  return roundCents(DAILY_LOSS_PCT * baseline);
}

/** Max loss limit in dollars: 5% of B. */
export function maxLossLimit(baseline: number): number {
  return roundCents(MAX_LOSS_PCT * baseline);
}

/** Equity at or below this breaches the daily limit: SOD − 0.03·B. */
export function dailyBreachLevel(sod: number, baseline: number): number {
  return roundCents(sod - dailyLossLimit(baseline));
}

/** Fixed max-loss floor: 0.95·B. Never trails. */
export function maxBreachLevel(baseline: number): number {
  return roundCents(baseline - maxLossLimit(baseline));
}

/** Graduation target: 1.10·B. */
export function targetLevel(baseline: number): number {
  return roundCents(baseline + TARGET_PCT * baseline);
}

export function isDailyBreached(equity: number, sod: number, baseline: number): boolean {
  return equity <= dailyBreachLevel(sod, baseline);
}

export function isMaxBreached(equity: number, baseline: number): boolean {
  return equity <= maxBreachLevel(baseline);
}

/**
 * Which rule, if any, the equity breaches. When both are hit on the same tick
 * the max loss rule is reported (it is the harder floor).
 */
export function detectBreach(
  equity: number,
  sod: number,
  baseline: number,
): { rule: BreachRule; limit: number } | null {
  if (isMaxBreached(equity, baseline)) return { rule: "max", limit: maxBreachLevel(baseline) };
  if (isDailyBreached(equity, sod, baseline)) {
    return { rule: "daily", limit: dailyBreachLevel(sod, baseline) };
  }
  return null;
}

/** Fraction (0–1) of the daily limit used, measured down from SOD. */
export function dailyLossUsed(equity: number, sod: number, baseline: number): number {
  return clamp01((sod - equity) / dailyLossLimit(baseline));
}

/** Fraction (0–1) of the max limit used, measured down from B. */
export function maxLossUsed(equity: number, baseline: number): number {
  return clamp01((baseline - equity) / maxLossLimit(baseline));
}

/** Fraction (0–1) of the way from B to the +10% target. */
export function targetProgress(equity: number, baseline: number): number {
  return clamp01((equity - baseline) / roundCents(TARGET_PCT * baseline));
}

export function dailyMeter(equity: number, sod: number, baseline: number): LimitMeter {
  const limit = dailyLossLimit(baseline);
  const breachAt = dailyBreachLevel(sod, baseline);
  const used = dailyLossUsed(equity, sod, baseline);
  return {
    limit,
    breachAt,
    used,
    usedUsd: roundCents(Math.max(0, Math.min(limit, sod - equity))),
    remainingUsd: roundCents(Math.max(0, equity - breachAt)),
    tone: meterTone(used),
  };
}

export function maxMeter(equity: number, baseline: number): LimitMeter {
  const limit = maxLossLimit(baseline);
  const breachAt = maxBreachLevel(baseline);
  const used = maxLossUsed(equity, baseline);
  return {
    limit,
    breachAt,
    used,
    usedUsd: roundCents(Math.max(0, Math.min(limit, baseline - equity))),
    remainingUsd: roundCents(Math.max(0, equity - breachAt)),
    tone: meterTone(used),
  };
}
