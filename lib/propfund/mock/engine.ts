/**
 * Rule engine for the mock service. Functions here mutate a draft `UserData`
 * (inside `commit`) and apply PRD §5–§9 using the pure rules in
 * lib/propfund/rules. `evaluate()` runs on every price tick.
 */
import { getMarket } from "@/lib/propfund/markets";
import {
  activeAccount,
  canGraduate,
  detectBreach,
  exitTrigger,
  getChain,
  getPackage,
  isInactive,
  limitCrossed,
  netFill,
  notionalUsd,
  quantityForNotional,
  rebuyOfferAfterBreach,
  rolloverSod,
  roundCents,
  settleDeposit,
  totalUnrealized,
  utcDayKey,
  violationConsequences,
  VIOLATIONS,
} from "@/lib/propfund/rules";
import type {
  Account,
  Deposit,
  FillKind,
  Order,
  OrderSide,
  PackageId,
  Payment,
  Position,
  PricingKind,
  ViolationCode,
} from "@/lib/propfund/types";

import { now } from "./clock";
import { ServiceError } from "./errors";
import { newId, randomTxHash } from "./ids";
import { getMarks, startPriceFeed, subscribePrices } from "./prices";
import { commit, getSnapshot, subscribe, type UserData } from "./store";

const EQUITY_SAMPLE_MS = 60_000;
const EQUITY_CURVE_CAP = 2_000;

type Marks = Record<string, number>;

// ── helpers ────────────────────────────────────────────────────────────────

export function accountPositions(d: UserData, accountId: string): Position[] {
  return d.positions.filter((p) => p.accountId === accountId);
}

export function workingOrders(d: UserData, accountId: string): Order[] {
  return d.orders.filter((o) => o.accountId === accountId && o.status === "working");
}

export function equityOf(d: UserData, account: Account, marks: Marks): number {
  return account.balance + totalUnrealized(accountPositions(d, account.id), marks);
}

function recordRealized(account: Account, realized: number, notional: number, at: number, counts: boolean) {
  const s = account.stats;
  s.volumeUsd = roundCents(s.volumeUsd + notional);
  account.lastTradeAt = at;
  if (!counts) return;
  s.trades += 1;
  s.realizedPnl = roundCents(s.realizedPnl + realized);
  if (realized > 0) s.wins += 1;
  if (realized < 0) s.losses += 1;
  s.bestTrade = roundCents(Math.max(s.bestTrade, realized));
  s.worstTrade = roundCents(Math.min(s.worstTrade, realized));
}

function sampleEquity(account: Account, equity: number, at: number, force = false) {
  const curve = account.equityCurve;
  const last = curve[curve.length - 1];
  if (!force && last && at - last.t < EQUITY_SAMPLE_MS) return false;
  curve.push({ t: at, equity: roundCents(equity) });
  if (curve.length > EQUITY_CURVE_CAP) curve.splice(0, curve.length - EQUITY_CURVE_CAP);
  return true;
}

// ── fills ──────────────────────────────────────────────────────────────────

/**
 * Execute `quantity` of `side` at `price` against the account's position in
 * `symbol` (netting). Books realized P&L into balance and writes a fill.
 */
export function executeFill(
  d: UserData,
  account: Account,
  input: {
    symbol: string;
    side: OrderSide;
    quantity: number;
    price: number;
    leverage: number;
    orderId: string | null;
    kind?: FillKind;
    takeProfit?: number | null;
    stopLoss?: number | null;
    at: number;
  },
) {
  const market = getMarket(input.symbol);
  if (!market) throw new ServiceError("VALIDATION", "Unknown market.");
  const idx = d.positions.findIndex((p) => p.accountId === account.id && p.symbol === input.symbol);
  const existing = idx >= 0 ? d.positions[idx] : null;
  const net = netFill(market, existing, input.side, input.quantity, input.price);
  const notional = notionalUsd(market, input.quantity, input.price);

  account.balance = roundCents(account.balance + net.realizedPnl);
  recordRealized(account, net.realizedPnl, notional, input.at, net.kind !== "open" && net.kind !== "increase");

  d.fills.push({
    id: newId("fill"),
    accountId: account.id,
    orderId: input.orderId,
    symbol: input.symbol,
    side: input.side,
    price: input.price,
    quantity: input.quantity,
    notionalUsd: roundCents(notional),
    realizedPnl: roundCents(net.realizedPnl),
    kind: input.kind ?? net.kind,
    at: input.at,
  });

  if (!net.position) {
    if (idx >= 0) d.positions.splice(idx, 1);
    return net;
  }

  const entryNotional = notionalUsd(market, net.position.quantity, net.position.entryPrice);
  if (net.kind === "open" || net.kind === "flip" || !existing) {
    d.positions = d.positions.filter((_, i) => i !== idx);
    d.positions.push({
      id: newId("pos"),
      accountId: account.id,
      symbol: input.symbol,
      side: net.position.side,
      quantity: net.position.quantity,
      entryPrice: net.position.entryPrice,
      leverage: input.leverage,
      entryNotionalUsd: roundCents(entryNotional),
      marginUsd: roundCents(entryNotional / input.leverage),
      takeProfit: input.takeProfit ?? null,
      stopLoss: input.stopLoss ?? null,
      openedAt: input.at,
      updatedAt: input.at,
    });
    return net;
  }

  const p = existing;
  if (net.kind === "increase") {
    const addedMargin = notional / input.leverage;
    p.marginUsd = roundCents(p.marginUsd + addedMargin);
  } else {
    // reduce: release margin in proportion to the closed quantity
    p.marginUsd = roundCents(p.marginUsd * (net.position.quantity / p.quantity));
  }
  p.quantity = net.position.quantity;
  p.entryPrice = net.position.entryPrice;
  p.entryNotionalUsd = roundCents(entryNotional);
  p.leverage = Math.round((p.entryNotionalUsd / Math.max(p.marginUsd, 1e-9)) * 100) / 100;
  if (input.takeProfit !== undefined && input.takeProfit !== null) p.takeProfit = input.takeProfit;
  if (input.stopLoss !== undefined && input.stopLoss !== null) p.stopLoss = input.stopLoss;
  p.updatedAt = input.at;
  return net;
}

/** Close a whole position at the mark. */
export function closePositionAt(
  d: UserData,
  account: Account,
  position: Position,
  price: number,
  kind: FillKind,
  at: number,
) {
  executeFill(d, account, {
    symbol: position.symbol,
    side: position.side === "long" ? "sell" : "buy",
    quantity: position.quantity,
    price,
    leverage: position.leverage,
    orderId: null,
    kind,
    at,
  });
}

function cancelWorking(d: UserData, accountId: string, note: string, at: number) {
  for (const o of d.orders) {
    if (o.accountId === accountId && o.status === "working") {
      o.status = "cancelled";
      o.cancelledAt = at;
      o.note = note;
    }
  }
}

/** Close everything at the marks, cancel orders, set a terminal status. */
function shutAccount(
  d: UserData,
  account: Account,
  marks: Marks,
  status: Account["status"],
  kind: FillKind,
  note: string,
  at: number,
) {
  for (const p of accountPositions(d, account.id)) {
    const mark = marks[p.symbol] ?? p.entryPrice;
    closePositionAt(d, account, p, mark, kind, at);
  }
  cancelWorking(d, account.id, note, at);
  account.status = status;
  account.closedAt = at;
  sampleEquity(account, account.balance, at, true);
}

// ── market orders ──────────────────────────────────────────────────────────

/** Fill an order now at `price`. Checks margin unless the order only reduces. */
export function fillOrder(d: UserData, account: Account, order: Order, price: number, marks: Marks, at: number) {
  const market = getMarket(order.symbol);
  if (!market) throw new ServiceError("VALIDATION", "Unknown market.");
  const quantity = quantityForNotional(market, order.notionalUsd, price);
  const existing = d.positions.find((p) => p.accountId === account.id && p.symbol === order.symbol);
  const reducesOnly =
    !!existing &&
    (existing.side === "long" ? order.side === "sell" : order.side === "buy") &&
    quantity <= existing.quantity + 1e-12;

  if (!reducesOnly) {
    const equity = equityOf(d, account, marks);
    const marginUsed = accountPositions(d, account.id).reduce((s, p) => s + p.marginUsd, 0);
    // A flip frees the existing position's margin before opening the remainder.
    const freed = existing && existing.side !== (order.side === "buy" ? "long" : "short") ? existing.marginUsd : 0;
    const openingNotional = existing && freed
      ? notionalUsd(market, quantity - existing.quantity, price)
      : order.notionalUsd;
    const required = openingNotional / order.leverage;
    if (required > equity - marginUsed + freed + 1e-6) {
      throw new ServiceError(
        "INSUFFICIENT_MARGIN",
        "Not enough buying power for this size. Lower the size or raise leverage.",
      );
    }
  }

  const q = quantity;
  const executed = executeFill(d, account, {
    symbol: order.symbol,
    side: order.side,
    quantity: q,
    price,
    leverage: order.leverage,
    orderId: order.id,
    takeProfit: order.takeProfit,
    stopLoss: order.stopLoss,
    at,
  });
  order.status = "filled";
  order.filledAt = at;
  order.fillPrice = price;
  return executed;
}

// ── purchases ──────────────────────────────────────────────────────────────

export function openChallengeAccount(
  d: UserData,
  input: { packageId: PackageId; pricing: PricingKind; feePaidUsd: number; paymentId: string; at: number },
): Account {
  const pkg = getPackage(input.packageId);
  if (!pkg) throw new ServiceError("VALIDATION", "Unknown package.");
  const account: Account = {
    id: newId("acct"),
    userId: d.user.id,
    packageId: pkg.id,
    accountSize: pkg.accountSize,
    phase: "challenge",
    status: "active",
    feePaidUsd: input.feePaidUsd,
    pricing: input.pricing,
    paymentId: input.paymentId,
    parentAccountId: null,
    baseline: pkg.accountSize,
    balance: pkg.accountSize,
    sod: pkg.accountSize,
    sodDay: utcDayKey(input.at),
    createdAt: input.at,
    closedAt: null,
    lastTradeAt: null,
    breach: null,
    violation: null,
    stats: { trades: 0, wins: 0, losses: 0, realizedPnl: 0, bestTrade: 0, worstTrade: 0, volumeUsd: 0 },
    equityCurve: [{ t: input.at, equity: pkg.accountSize }],
  };
  d.accounts.push(account);
  // Any purchase consumes an open rebuy offer (PRD §7: open until the next purchase).
  d.rebuyOffer = null;
  if (d.takeover?.kind === "breach") d.takeover = null;
  return account;
}

/**
 * Complete a pending payment: re-checks the one-active-account and barred
 * rules at completion time. On failure the charged amount is credited back.
 */
export function completePayment(d: UserData, payment: Payment, at: number): Account | null {
  if (d.user.barred || activeAccount(d.accounts)) {
    payment.status = "failed";
    payment.completedAt = at;
    payment.failureReason = d.user.barred
      ? "Your profile can't buy new challenges."
      : "You already have an active account.";
    d.user.depositCreditUsd = roundCents(d.user.depositCreditUsd + payment.amountUsd + payment.creditAppliedUsd);
    return null;
  }
  const account = openChallengeAccount(d, {
    packageId: payment.packageId,
    pricing: payment.pricing,
    feePaidUsd: payment.priceUsd,
    paymentId: payment.id,
    at,
  });
  payment.status = "succeeded";
  payment.completedAt = at;
  payment.accountId = account.id;
  return account;
}

function progressDeposits(d: UserData, at: number): boolean {
  let changed = false;
  for (const dep of d.deposits) {
    if (dep.status !== "confirming" || dep.confirmingSince === null) continue;
    const { blockTimeMs } = getChain(dep.chain);
    const n = Math.min(dep.requiredConfirmations, 1 + Math.floor((at - dep.confirmingSince) / blockTimeMs));
    if (n !== dep.confirmations) {
      dep.confirmations = n;
      changed = true;
    }
    if (n >= dep.requiredConfirmations) {
      finalizeDeposit(d, dep, at);
      changed = true;
    }
  }
  return changed;
}

function finalizeDeposit(d: UserData, dep: Deposit, at: number) {
  const payment = d.payments.find((p) => p.id === dep.paymentId);
  const received = dep.amountReceivedUsd ?? dep.amountDueUsd;
  const settle = settleDeposit(dep.amountDueUsd, received);
  dep.confirmedAt = at;
  if (!settle.accepted) {
    dep.status = "underpaid";
    d.user.depositCreditUsd = roundCents(d.user.depositCreditUsd + settle.creditUsd + dep.creditAppliedUsd);
    if (payment) {
      payment.status = "failed";
      payment.completedAt = at;
      payment.failureReason = "The amount received was below the fee. It was added to your deposit balance.";
    }
    return;
  }
  dep.status = "confirmed";
  d.user.depositCreditUsd = roundCents(d.user.depositCreditUsd + settle.creditUsd);
  if (payment) {
    const account = completePayment(d, payment, at);
    dep.accountId = account?.id ?? null;
  }
}

// ── evaluation (every tick) ────────────────────────────────────────────────

function breachAccount(d: UserData, account: Account, rule: "daily" | "max", limit: number, equity: number, marks: Marks, at: number) {
  shutAccount(d, account, marks, "breached", "breach", "Account breached", at);
  account.breach = { rule, at, equity: roundCents(equity), limit };
  d.rebuyOffer = rebuyOfferAfterBreach(d.rebuyOffer, account.id, at, d.user.barred);
  d.takeover = { kind: "breach", accountId: account.id, at };
}

function graduate(d: UserData, account: Account, at: number) {
  account.status = "graduated";
  account.closedAt = at;
  sampleEquity(account, account.balance, at, true);
  const funded: Account = {
    ...structuredClone(account),
    id: newId("acct"),
    phase: "funded",
    status: "active",
    feePaidUsd: 0,
    parentAccountId: account.id,
    baseline: account.accountSize,
    balance: account.accountSize,
    sod: account.accountSize,
    sodDay: utcDayKey(at),
    createdAt: at,
    closedAt: null,
    lastTradeAt: null,
    breach: null,
    violation: null,
    stats: { trades: 0, wins: 0, losses: 0, realizedPnl: 0, bestTrade: 0, worstTrade: 0, volumeUsd: 0 },
    equityCurve: [{ t: at, equity: account.accountSize }],
  };
  d.accounts.push(funded);
  d.takeover = { kind: "graduation", challengeAccountId: account.id, fundedAccountId: funded.id, at };
}

/**
 * Apply time and price rules to the draft. Returns true when anything changed.
 * Order: time rules (payouts, SOD, inactivity, deposits) → working limit
 * orders → TP/SL → breach → graduation → equity sample.
 */
export function evaluateDraft(d: UserData, marks: Marks, at: number): boolean {
  let changed = false;

  for (const p of d.payouts) {
    if (p.status === "under_review" && at >= p.paysAt) {
      p.status = "paid";
      p.paidAt = p.paysAt;
      p.txHash = randomTxHash();
      changed = true;
    }
  }

  if (progressDeposits(d, at)) changed = true;

  const account = activeAccount(d.accounts);
  if (!account) return changed;

  const roll = rolloverSod(account, at);
  if (roll) {
    account.sod = roll.sod;
    account.sodDay = roll.sodDay;
    changed = true;
  }

  if (isInactive(account, at)) {
    shutAccount(d, account, marks, "closed_inactive", "inactivity", "Closed for inactivity", at);
    return true;
  }

  for (const order of workingOrders(d, account.id)) {
    const mark = marks[order.symbol];
    if (mark === undefined || order.limitPrice === null) continue;
    if (!limitCrossed(order.side, order.limitPrice, mark)) continue;
    try {
      fillOrder(d, account, order, order.limitPrice, marks, at);
    } catch (e) {
      order.status = "rejected";
      order.cancelledAt = at;
      order.note = e instanceof ServiceError ? e.message : "Order couldn't be filled.";
    }
    changed = true;
  }

  for (const p of accountPositions(d, account.id)) {
    const mark = marks[p.symbol];
    if (mark === undefined) continue;
    const trigger = exitTrigger(p, mark);
    if (trigger) {
      closePositionAt(d, account, p, mark, trigger, at);
      changed = true;
    }
  }

  const equity = equityOf(d, account, marks);
  const breach = detectBreach(equity, account.sod, account.baseline);
  if (breach) {
    breachAccount(d, account, breach.rule, breach.limit, equity, marks, at);
    return true;
  }

  const flat = accountPositions(d, account.id).length === 0 && workingOrders(d, account.id).length === 0;
  if (
    canGraduate({
      phase: account.phase,
      status: account.status,
      equity,
      baseline: account.baseline,
      flat,
      violationClean: !d.user.barred && !account.violation,
    })
  ) {
    graduate(d, account, at);
    return true;
  }

  if (sampleEquity(account, equity, at, changed)) changed = true;
  return changed;
}

/**
 * Read-only mirror of `evaluateDraft`: true when that pass could change
 * anything. `commit` deep-clones the whole store, and the feed calls
 * `evaluate()` every second, so most ticks must not get that far. Keep this in
 * step with `evaluateDraft` — it is deliberately conservative (when in doubt,
 * return true) and `evaluateDraft` still decides what actually changes.
 */
export function evaluateNeeded(d: UserData, marks: Marks, at: number): boolean {
  for (const p of d.payouts) {
    if (p.status === "under_review" && at >= p.paysAt) return true;
  }

  for (const dep of d.deposits) {
    if (dep.status !== "confirming" || dep.confirmingSince === null) continue;
    const { blockTimeMs } = getChain(dep.chain);
    const n = Math.min(dep.requiredConfirmations, 1 + Math.floor((at - dep.confirmingSince) / blockTimeMs));
    if (n !== dep.confirmations || n >= dep.requiredConfirmations) return true;
  }

  const account = activeAccount(d.accounts);
  if (!account) return false;

  if (rolloverSod(account, at)) return true;
  if (isInactive(account, at)) return true;

  for (const order of workingOrders(d, account.id)) {
    const mark = marks[order.symbol];
    if (mark === undefined || order.limitPrice === null) continue;
    if (limitCrossed(order.side, order.limitPrice, mark)) return true;
  }

  const positions = accountPositions(d, account.id);
  for (const p of positions) {
    const mark = marks[p.symbol];
    if (mark !== undefined && exitTrigger(p, mark)) return true;
  }

  const equity = account.balance + totalUnrealized(positions, marks);
  if (detectBreach(equity, account.sod, account.baseline)) return true;
  if (
    canGraduate({
      phase: account.phase,
      status: account.status,
      equity,
      baseline: account.baseline,
      flat: positions.length === 0 && workingOrders(d, account.id).length === 0,
      violationClean: !d.user.barred && !account.violation,
    })
  ) {
    return true;
  }

  const last = account.equityCurve[account.equityCurve.length - 1];
  return !last || at - last.t >= EQUITY_SAMPLE_MS;
}

/** Evaluate the signed-in user's data against current marks and the mock clock. */
export function evaluate(): void {
  const snapshot = getSnapshot();
  if (snapshot.status !== "ready") return;
  const marks = getMarks();
  const at = now();
  if (!evaluateNeeded(snapshot.data, marks, at)) return;
  commit((d) => evaluateDraft(d, marks, at));
}

// ── violations ─────────────────────────────────────────────────────────────

export function applyViolationDraft(d: UserData, code: ViolationCode, marks: Marks, at: number) {
  const c = violationConsequences(d.accounts, d.payouts);
  const reason = VIOLATIONS[code].reason;
  for (const id of c.terminateAccountIds) {
    const account = d.accounts.find((a) => a.id === id);
    if (!account) continue;
    shutAccount(d, account, marks, "terminated", "violation", "Account terminated", at);
    account.violation = { code, reason, at, voidedUsd: c.voidedUsd };
  }
  for (const id of c.voidPayoutIds) {
    const p = d.payouts.find((x) => x.id === id);
    if (!p) continue;
    p.status = "voided";
    p.voidedAt = at;
    p.note = `Voided: violation ${code}`;
  }
  d.user.barred = true;
  d.rebuyOffer = null;
  d.takeover = { kind: "violation", code, reason, voidedUsd: c.voidedUsd, at };
}

// ── runtime ────────────────────────────────────────────────────────────────

let started = false;

/** Start the price feed and evaluate on every tick (browser only, idempotent). */
export function startEngine(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  startPriceFeed();
  subscribePrices(evaluate);
  // Evaluate as soon as a user's data finishes loading (SOD rollover, paid payouts).
  let lastStatus = getSnapshot().status;
  subscribe(() => {
    const status = getSnapshot().status;
    if (status === "ready" && lastStatus !== "ready") queueMicrotask(evaluate);
    lastStatus = status;
  });
}
