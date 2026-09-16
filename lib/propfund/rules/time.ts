/**
 * Day boundaries, SOD rollover and payout dates (PRD §5, §8). All UTC.
 */

export const DAY_MS = 86_400_000;
export const PAYOUT_REVIEW_DAYS = 7;
export const INACTIVITY_DAYS = 60;

/** 00:00:00 UTC of the day containing `ms`. */
export function startOfUtcDay(ms: number): number {
  return Math.floor(ms / DAY_MS) * DAY_MS;
}

/** Next 00:00:00 UTC strictly after `ms`. */
export function nextUtcMidnight(ms: number): number {
  return startOfUtcDay(ms) + DAY_MS;
}

/** "2026-09-15" for the UTC day containing `ms`. */
export function utcDayKey(ms: number): string {
  return new Date(startOfUtcDay(ms)).toISOString().slice(0, 10);
}

/**
 * SOD rollover at 00:00 UTC: when the stored SOD belongs to an earlier day,
 * SOD becomes the current balance (balance at 00:00, since nothing trades
 * between the last evaluation and the boundary in a way that changes balance
 * without an evaluation). Returns null when no rollover is due.
 */
export function rolloverSod(
  account: { sodDay: string; balance: number },
  nowMs: number,
): { sod: number; sodDay: string } | null {
  const today = utcDayKey(nowMs);
  if (account.sodDay === today) return null;
  return { sod: account.balance, sodDay: today };
}

/** Pay date = request time + 7 calendar days (PRD §8). */
export function payDate(requestedAtMs: number): number {
  return requestedAtMs + PAYOUT_REVIEW_DAYS * DAY_MS;
}

/** Review day counter: day 1 on the request date (UTC), capped at 7. */
export function reviewDay(requestedAtMs: number, nowMs: number): number {
  const start = Math.floor(requestedAtMs / DAY_MS);
  const today = Math.floor(nowMs / DAY_MS);
  return Math.min(PAYOUT_REVIEW_DAYS, Math.max(1, today - start + 1));
}

/** "Day 3 of 7". */
export function reviewDayLabel(requestedAtMs: number, nowMs: number): string {
  return `Day ${reviewDay(requestedAtMs, nowMs)} of ${PAYOUT_REVIEW_DAYS}`;
}

/** An account with no trade in 60 days is closed for inactivity (PRD §8). */
export function isInactive(
  account: { lastTradeAt: number | null; createdAt: number },
  nowMs: number,
): boolean {
  const last = account.lastTradeAt ?? account.createdAt;
  return nowMs - last >= INACTIVITY_DAYS * DAY_MS;
}
