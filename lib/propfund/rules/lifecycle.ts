/**
 * Account states, graduation and rebuy (PRD §6, §7, §8).
 */
import type { Account, AccountStatus, Phase, RebuyOffer } from "@/lib/propfund/types";

import { targetLevel } from "./limits";

export const PHASE_LABEL: Record<Phase, string> = {
  challenge: "Challenge",
  funded: "Funded",
};

/** History outcome labels (PRD §10 History). */
export const OUTCOME_LABEL: Record<AccountStatus, string> = {
  active: "Active",
  graduated: "Graduated",
  breached: "Breached",
  terminated: "Terminated",
  closed_inactive: "Closed for inactivity",
};

export const TARGET_BANNER_COPY = "Target reached. Close positions and cancel orders to graduate.";
export const ACTIVE_ACCOUNT_EXISTS_COPY = "You already have an active account.";

/** The one open account (CHALLENGE or FUNDED) per user. Newest wins if data is inconsistent. */
export function activeAccount<T extends Pick<Account, "status" | "createdAt">>(
  accounts: readonly T[],
): T | null {
  let best: T | null = null;
  for (const a of accounts) {
    if (a.status !== "active") continue;
    if (!best || a.createdAt >= best.createdAt) best = a;
  }
  return best;
}

/** Most recent account; on equal timestamps the later-created entry wins. */
export function latestAccount<T extends Pick<Account, "createdAt">>(accounts: readonly T[]): T | null {
  let best: T | null = null;
  for (const a of accounts) if (!best || a.createdAt >= best.createdAt) best = a;
  return best;
}

/** Newest first by `key`; ties keep reverse insertion order (later entries first). */
export function newestFirst<T>(items: readonly T[], key: (item: T) => number): T[] {
  return [...items].reverse().sort((a, b) => key(b) - key(a));
}

/**
 * Graduation (PRD §8): a challenge account, still active, equity ≥ 1.10·B, flat,
 * and a clean violation check.
 */
export function canGraduate(input: {
  phase: Phase;
  status: AccountStatus;
  equity: number;
  baseline: number;
  flat: boolean;
  violationClean: boolean;
}): boolean {
  return (
    input.phase === "challenge" &&
    input.status === "active" &&
    input.flat &&
    input.violationClean &&
    input.equity >= targetLevel(input.baseline)
  );
}

/**
 * A breach in either phase unlocks rebuy pricing on any package. It stays open
 * until the next purchase. Never for a barred user (violation termination).
 */
export function rebuyOfferAfterBreach(
  current: RebuyOffer | null,
  breachedAccountId: string,
  atMs: number,
  barred: boolean,
): RebuyOffer | null {
  if (barred) return null;
  if (current) return current;
  return { unlockedAt: atMs, fromAccountId: breachedAccountId, discountPct: 20 };
}

/** Rebuy eligibility from history alone (for a backend without a stored offer). */
export function isRebuyEligible(
  accounts: readonly Pick<Account, "status" | "createdAt">[],
  barred: boolean,
): boolean {
  if (barred) return false;
  if (accounts.some((a) => a.status === "terminated")) return false;
  // Any later purchase (or a funded account opened from it) is newer than the
  // breached account, so "newest account is breached" = offer still open.
  return latestAccount(accounts)?.status === "breached";
}
