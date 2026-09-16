/**
 * Account strip metrics: equity, P&L, meters, target (PRD §5, §7, §8, §10).
 */
import { getMarket } from "@/lib/propfund/markets";
import type { Account, AccountMetrics, Position } from "@/lib/propfund/types";

import { dailyMeter, maxMeter, targetLevel, targetProgress } from "./limits";
import { roundCents } from "./packages";
import { MAX_LEVERAGE, unrealizedPnl } from "./trading";

export type Marks = Readonly<Record<string, number | undefined>>;

/** Sum of unrealized P&L at the marks. Positions without a mark count as 0. */
export function totalUnrealized(positions: readonly Position[], marks: Marks): number {
  let sum = 0;
  for (const p of positions) {
    const market = getMarket(p.symbol);
    const mark = marks[p.symbol];
    if (!market || mark === undefined) continue;
    sum += unrealizedPnl(market, p, mark);
  }
  return sum;
}

export function accountEquity(
  account: Pick<Account, "balance">,
  positions: readonly Position[],
  marks: Marks,
): number {
  return account.balance + totalUnrealized(positions, marks);
}

/** Flat: no open positions and no working orders (PRD §5). */
export function isFlat(openPositions: number, workingOrders: number): boolean {
  return openPositions === 0 && workingOrders === 0;
}

export function computeAccountMetrics(
  account: Account,
  positions: readonly Position[],
  workingOrders: number,
  marks: Marks,
): AccountMetrics {
  const unrealized = totalUnrealized(positions, marks);
  const equity = account.balance + unrealized;
  const B = account.baseline;
  const marginUsed = positions.reduce((s, p) => s + p.marginUsd, 0);
  const freeMargin = Math.max(0, equity - marginUsed);
  const isChallenge = account.phase === "challenge";
  const target = isChallenge
    ? {
        level: targetLevel(B),
        progress: targetProgress(equity, B),
        reached: equity >= targetLevel(B),
      }
    : null;
  const flat = isFlat(positions.length, workingOrders);

  return {
    accountId: account.id,
    phase: account.phase,
    status: account.status,
    baseline: B,
    balance: roundCents(account.balance),
    equity: roundCents(equity),
    unrealizedPnl: roundCents(unrealized),
    sod: account.sod,
    todayPnl: roundCents(equity - account.sod),
    totalPnl: roundCents(equity - B),
    realizedProfit: roundCents(account.balance - B),
    daily: dailyMeter(equity, account.sod, B),
    max: maxMeter(equity, B),
    target,
    marginUsedUsd: roundCents(marginUsed),
    freeMarginUsd: roundCents(freeMargin),
    buyingPowerUsd: roundCents(freeMargin * MAX_LEVERAGE),
    openPositions: positions.length,
    workingOrders,
    flat,
    showTargetBanner:
      isChallenge && account.status === "active" && !!target?.reached && !flat,
  };
}
