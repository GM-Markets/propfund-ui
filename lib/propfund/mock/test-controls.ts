/**
 * Test controls (PRD §12). Used by the drawer in components/test-controls.tsx
 * and by unit tests. Never exposed in production builds (the drawer isn't
 * rendered), but these functions only ever touch local mock data.
 */
import { MARKETS, getMarket } from "@/lib/propfund/markets";
import {
  activeAccount,
  dailyBreachLevel,
  latestAccount,
  maxBreachLevel,
  rebuyOfferAfterBreach,
  roundCents,
  targetLevel,
} from "@/lib/propfund/rules";
import type {
  Account,
  ChainId,
  Order,
  OrderSide,
  PackageId,
  TokenSymbol,
  ViolationCode,
} from "@/lib/propfund/types";

import { advanceDays, advanceToNextUtcMidnight, now, resetClock } from "./clock";
import {
  accountPositions,
  applyViolationDraft,
  closePositionAt,
  equityOf,
  evaluate,
  evaluateDraft,
  fillOrder,
} from "./engine";
import { ServiceError } from "./errors";
import { deterministicAddress, newId } from "./ids";
import { getMarks, nudgeMark, resetPrices, setMark } from "./prices";
import { commit, requireData, resetUserData } from "./store";
import {
  completeTestCardPayment,
  createCardCheckout,
  requestPayout,
  simulateDepositConfirmations,
} from "./service";

// ── prices ─────────────────────────────────────────────────────────────────

/** Move one market (or all) by a fraction: 0.01 = +1%, -0.01 = −1%. */
export function movePrice(symbol: string | "all", fraction: number): void {
  const symbols = symbol === "all" ? MARKETS.map((m) => m.symbol) : [symbol];
  for (const s of symbols) nudgeMark(s, fraction);
  evaluate();
}

/**
 * Bring the active account's equity to `targetEquity`. With open positions the
 * largest position's market is moved (real price path, so meters and TP/SL
 * react). When flat, a test balance adjustment is booked instead.
 */
function driveEquityTo(targetEquity: number): void {
  const d = requireData();
  const account = activeAccount(d.accounts);
  if (!account) throw new ServiceError("NO_ACTIVE_ACCOUNT", "No active account to move.");
  const marks = getMarks();
  const positions = accountPositions(d, account.id);
  const equity = equityOf(d, account, marks);
  const delta = targetEquity - equity;

  if (positions.length) {
    const largest = [...positions].sort((a, b) => b.entryNotionalUsd - a.entryNotionalUsd)[0];
    const market = getMarket(largest.symbol);
    const mark = marks[largest.symbol];
    if (market && mark !== undefined) {
      const dir = largest.side === "long" ? 1 : -1;
      // USD P&L per unit of price move (JPY-quoted converts at the new price; close enough for a jump).
      const perUnit = market.quote === "JPY" ? largest.quantity / mark : largest.quantity;
      const nextMark = mark + delta / (perUnit * dir);
      if (nextMark > market.tickSize) {
        // Nudge one tick past so rounding to tick size still crosses the level.
        setMark(largest.symbol, nextMark + dir * market.tickSize * Math.sign(delta || 1));
        evaluate();
        return;
      }
    }
  }

  commit((draft) => {
    const a = activeAccount(draft.accounts);
    if (!a) return false;
    const at = now();
    a.balance = roundCents(a.balance + delta);
    draft.fills.push({
      id: newId("adj"),
      accountId: a.id,
      orderId: null,
      symbol: "USD",
      side: delta >= 0 ? "buy" : "sell",
      price: 1,
      quantity: roundCents(Math.abs(delta)),
      notionalUsd: 0,
      realizedPnl: roundCents(delta),
      kind: "adjustment",
      at,
    });
    evaluateDraft(draft, getMarks(), at);
  });
}

export function jumpToDailyBreach(): void {
  const account = activeAccount(requireData().accounts);
  if (!account) throw new ServiceError("NO_ACTIVE_ACCOUNT", "No active account.");
  driveEquityTo(dailyBreachLevel(account.sod, account.baseline) - 1);
}

export function jumpToMaxBreach(): void {
  const account = activeAccount(requireData().accounts);
  if (!account) throw new ServiceError("NO_ACTIVE_ACCOUNT", "No active account.");
  driveEquityTo(maxBreachLevel(account.baseline) - 1);
}

export function jumpToTarget(): void {
  const account = activeAccount(requireData().accounts);
  if (!account) throw new ServiceError("NO_ACTIVE_ACCOUNT", "No active account.");
  // Funded accounts have no target; use +10% of B anyway to create payable profit.
  driveEquityTo(targetLevel(account.baseline) + 1);
}

// ── clock ──────────────────────────────────────────────────────────────────

export function advanceClockToMidnight(): void {
  advanceToNextUtcMidnight();
  evaluate();
}

export function advanceClockDays(days: number): void {
  advanceDays(days);
  evaluate();
}

// ── identity verification ──────────────────────────────────────────────────

function setKyc(status: "verified" | "needs_info" | "rejected", note: string | null) {
  commit((d) => {
    const at = now();
    d.kyc = { status, submittedAt: d.kyc.submittedAt ?? at, updatedAt: at, note };
  });
}

export function approveKyc(): void {
  setKyc("verified", null);
}

export function requestMoreKycInfo(note = "The photo of your ID was unreadable. Upload a clearer photo."): void {
  setKyc("needs_info", note);
}

/**
 * Reject verification. An ordinary rejection lets the trader retry. A restricted
 * or sanctioned person (V8 / V7) or a reused identity (V3) is a violation.
 */
export function rejectKyc(opts: { violation?: "V3" | "V7" | "V8" } = {}): void {
  setKyc("rejected", opts.violation ? "Identity verification failed." : "We couldn't verify your identity. You can try again.");
  if (opts.violation) flagViolation(opts.violation);
}

// ── deposits + wallet ──────────────────────────────────────────────────────

/** Deliver the most recent waiting deposit (or a specific one). */
export async function confirmDeposit(depositId?: string, amountUsd?: number): Promise<void> {
  const d = requireData();
  const target = depositId
    ? d.deposits.find((x) => x.id === depositId)
    : [...d.deposits].reverse().find((x) => x.status === "waiting");
  if (!target) throw new ServiceError("NOT_FOUND", "No deposit is waiting for a transfer.");
  await simulateDepositConfirmations(target.id, { amountUsd });
}

export function fundWallet(chain: ChainId, token: TokenSymbol, amount: number): void {
  commit((d) => {
    const bal = d.walletBalances.find((b) => b.chain === chain && b.token === token);
    if (bal) bal.amount = roundCents(bal.amount + amount);
    else d.walletBalances.push({ chain, token, amount });
  });
}

export function setRestrictedRegion(on: boolean): void {
  commit((d) => {
    d.testFlags.restrictedRegion = on;
  });
}

// ── violations + payouts ───────────────────────────────────────────────────

export function flagViolation(code: ViolationCode): void {
  commit((d) => {
    applyViolationDraft(d, code, getMarks(), now());
  });
}

/** Return a payout under review (non-violation failure): P is credited back. */
export function returnPayout(payoutId?: string): void {
  commit((d) => {
    const p = payoutId
      ? d.payouts.find((x) => x.id === payoutId)
      : [...d.payouts].reverse().find((x) => x.status === "under_review");
    if (!p || p.status !== "under_review") {
      throw new ServiceError("NOT_FOUND", "No payout is under review.");
    }
    const at = now();
    p.status = "returned";
    p.returnedAt = at;
    p.note = "Returned: the payout address was rejected. Request again.";
    const account = d.accounts.find((a) => a.id === p.accountId);
    if (account) {
      account.balance = roundCents(account.balance + p.profitUsd);
      account.sod = roundCents(account.sod + p.profitUsd);
    }
  });
}

// ── buying a challenge ─────────────────────────────────────────────────────

/**
 * Buy a package now with a simulated card payment (PRD §4), so the account,
 * the payment record and History all read as a real purchase. Throws the PRD's
 * own copy when a rule blocks it ("You already have an active account.").
 */
export async function buyChallenge(packageId: PackageId): Promise<Account> {
  const checkout = await createCardCheckout({ packageId, agreedToTerms: true });
  const { payment, account } = await completeTestCardPayment(checkout.id, "succeeded");
  if (!account) {
    throw new ServiceError("INVALID_STATE", payment.failureReason ?? "The purchase couldn't be completed.");
  }
  return account;
}

/**
 * Open a rebuy offer without waiting for a breach, so rebuy pricing (PRD §7)
 * can be reviewed on demand. A barred user never gets one.
 */
export function unlockRebuyOffer(): void {
  commit((d) => {
    if (d.user.barred) {
      throw new ServiceError("BARRED", "There is no rebuy after a confirmed violation.");
    }
    const from = latestAccount(d.accounts);
    d.rebuyOffer = rebuyOfferAfterBreach(d.rebuyOffer, from?.id ?? newId("acct"), now(), d.user.barred);
  });
}

/** Buy at the rebuy fee: unlocks the offer first when no breach has opened one. */
export async function buyChallengeAtRebuy(packageId: PackageId): Promise<Account> {
  unlockRebuyOffer();
  return buyChallenge(packageId);
}

// ── state building blocks ──────────────────────────────────────────────────

/** All states use Core: $10,000 · fee $99 · daily $300 · max $500 · target $1,000. */
export const SCENARIO_PACKAGE: PackageId = "core";

/** Price move used to book a designed P&L through a real trade. */
const TRADE_MOVE = 0.025;

/** Profit that carries a $10,000 challenge past the +10% target. */
const GRADUATION_PROFIT = 1_020;
/** Realized profit on the funded account before a payout request. */
const PAYOUT_PROFIT = 1_240;
/** Payable profit that is lost to a breach before it is ever requested. */
const PRE_PAYOUT_PROFIT = 640;

/** Open a market position on the active account through the engine (no latency). */
function openPosition(symbol: string, side: OrderSide, notionalUsd: number, leverage: number): void {
  commit((d) => {
    const account = activeAccount(d.accounts);
    if (!account) throw new ServiceError("NO_ACTIVE_ACCOUNT", "No active account.");
    const marks = getMarks();
    const mark = marks[symbol];
    if (mark === undefined) throw new ServiceError("VALIDATION", `No price for ${symbol} yet.`);
    const at = now();
    const order: Order = {
      id: newId("ord"),
      accountId: account.id,
      symbol,
      side,
      type: "market",
      notionalUsd: roundCents(notionalUsd),
      leverage,
      limitPrice: null,
      takeProfit: null,
      stopLoss: null,
      status: "working",
      createdAt: at,
      filledAt: null,
      fillPrice: null,
      cancelledAt: null,
      note: null,
    };
    fillOrder(d, account, order, mark, marks, at);
    d.orders.push(order);
    evaluateDraft(d, marks, at);
  });
}

/** Close every open position at the mark (the engine then re-checks graduation). */
function closeAllPositions(): void {
  commit((d) => {
    const account = activeAccount(d.accounts);
    if (!account) return false;
    const marks = getMarks();
    const at = now();
    const open = accountPositions(d, account.id);
    if (!open.length) return false;
    for (const p of open) closePositionAt(d, account, p, marks[p.symbol] ?? p.entryPrice, "manual_close", at);
    evaluateDraft(d, marks, at);
  });
}

/**
 * Book `profitUsd` of realized P&L through a real round trip, so balance,
 * stats, fills and the equity curve are all what the engine would have written.
 * Requires a flat account.
 */
function bookRealized(profitUsd: number, symbol = "BTC"): void {
  if (!profitUsd) return;
  openPosition(symbol, "buy", Math.abs(profitUsd) / TRADE_MOVE, 10);
  movePrice(symbol, profitUsd > 0 ? TRADE_MOVE : -TRADE_MOVE);
  closeAllPositions();
}

function clearTakeover(): void {
  commit((d) => {
    if (!d.takeover) return false;
    d.takeover = null;
  });
}

/** Buy a challenge, trade it past +10%, go flat: the engine graduates it (PRD §8). */
async function graduateToFunded(): Promise<void> {
  await buyChallenge(SCENARIO_PACKAGE);
  bookRealized(GRADUATION_PROFIT);
  // Identity verification is the first step of the first payout request (PRD §8).
  approveKyc();
}

/** Request a payout of all realized profit to the Propfund wallet. */
async function requestPayoutAsUser(): Promise<void> {
  const d = requireData();
  const account = activeAccount(d.accounts);
  if (!account) throw new ServiceError("NO_ACTIVE_ACCOUNT", "No active account.");
  const address = d.user.walletAddress ?? deterministicAddress(d.user.id, "wallet");
  await requestPayout({ accountId: account.id, address, confirmControlsAddress: true });
}

// ── states ─────────────────────────────────────────────────────────────────

/**
 * One-tap account states for design review (PRD §12). Each one wipes the
 * signed-in user's data first, so a state is always reached the same way, and
 * each is built with the real engine, so every figure obeys §5–§9.
 * Signing out is handled in the drawer, since it belongs to the session.
 */
export type ScenarioId =
  | "new-user"
  | "challenge-trades"
  | "challenge-blown-up"
  | "graduated"
  | "funded-trades"
  | "payout-requested"
  | "payout-paid"
  | "blow-up-after-graduation"
  | "blow-up-before-payout"
  | "blow-up-after-payout";

export const SCENARIOS: { id: ScenarioId; label: string; description: string }[] = [
  { id: "new-user", label: "New user", description: "Signed in, nothing bought yet" },
  {
    id: "challenge-trades",
    label: "Challenge · active trades",
    description: "$10,000 challenge, 3 open positions, $210 of the $300 daily limit used",
  },
  {
    id: "challenge-blown-up",
    label: "Challenge · blown up",
    description: "Daily-limit breach, read-only account, breach takeover and 20%-off rebuy",
  },
  {
    id: "graduated",
    label: "Graduated",
    description: "Funded at $10,000, identity verified, graduation takeover showing",
  },
  {
    id: "funded-trades",
    label: "Funded · active trades",
    description: "Trades post-graduation: 3 open positions, +$260 on the day",
  },
  {
    id: "payout-requested",
    label: "Payout requested",
    description: "$1,240 profit under review, day 4 of 7, baseline already reset",
  },
  {
    id: "payout-paid",
    label: "Payout paid",
    description: "Paid on D+7 in USDC with a tx hash; $992 to the trader, $248 to Propfund",
  },
  {
    id: "blow-up-after-graduation",
    label: "Blow-up after graduation",
    description: "Max-loss floor hit on the funded account, no payout ever requested",
  },
  {
    id: "blow-up-before-payout",
    label: "Blow-up before payout",
    description: "$640 of payable profit given back to a daily breach before requesting",
  },
  {
    id: "blow-up-after-payout",
    label: "Blow-up after payout",
    description: "Payout paid, then a daily breach on the reset baseline",
  },
];

/** Put the signed-in user's data into a known state. */
export async function applyScenario(id: ScenarioId): Promise<void> {
  resetAllData();
  if (id === "new-user") return;

  if (id === "challenge-trades") {
    await buyChallenge(SCENARIO_PACKAGE);
    openPosition("BTC", "buy", 12_000, 10);
    openPosition("ETH", "sell", 10_000, 5);
    openPosition("XAUUSD", "buy", 8_000, 5);
    movePrice("BTC", 0.015); // long: +$180
    movePrice("ETH", 0.015); // short: −$150
    movePrice("XAUUSD", -0.03); // long: −$240 → −$210, 70% of the daily limit (amber)
    return;
  }

  if (id === "challenge-blown-up") {
    await buyChallenge(SCENARIO_PACKAGE);
    bookRealized(120, "ETH"); // a closed winner first, so the breach screen has stats
    openPosition("BTC", "buy", 12_000, 10);
    jumpToDailyBreach();
    return;
  }

  await graduateToFunded();
  if (id === "graduated") return;
  clearTakeover();

  if (id === "funded-trades") {
    openPosition("BTC", "buy", 20_000, 10);
    openPosition("ETH", "sell", 10_000, 5);
    openPosition("NVDA", "buy", 8_000, 5);
    movePrice("BTC", 0.02); // long: +$400
    movePrice("ETH", 0.01); // short: −$100
    movePrice("NVDA", -0.005); // long: −$40 → +$260 on the day
    return;
  }

  if (id === "blow-up-after-graduation") {
    bookRealized(-250, "ETH"); // day 1: $250 of the $300 daily limit
    advanceClockToMidnight(); // SOD rolls to $9,750, so the $9,500 floor now bites first
    openPosition("BTC", "buy", 10_000, 10);
    jumpToMaxBreach();
    return;
  }

  if (id === "blow-up-before-payout") {
    bookRealized(PRE_PAYOUT_PROFIT); // payable profit, never requested
    openPosition("BTC", "buy", 10_000, 10);
    jumpToDailyBreach();
    return;
  }

  // The remaining states all run a payout through the real request (PRD §8).
  bookRealized(PAYOUT_PROFIT);
  await requestPayoutAsUser();
  advanceClockDays(3); // day 4 of 7, three days still to run
  if (id === "payout-requested") return;

  advanceClockDays(5); // past D+7: the engine pays it and writes the tx hash
  if (id === "payout-paid") return;

  // blow-up-after-payout: breach on the baseline the payout reset.
  openPosition("BTC", "buy", 10_000, 10);
  jumpToDailyBreach();
}

// ── reset ──────────────────────────────────────────────────────────────────

/** Wipe the signed-in user's data, the clock offset and prices. */
export function resetAllData(): void {
  resetClock();
  resetPrices();
  resetUserData();
}
