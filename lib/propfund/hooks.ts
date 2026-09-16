"use client";

/**
 * React bindings for the mock service. Every read hook subscribes with
 * `useSyncExternalStore` and returns:
 *   - `undefined` while signed-out data is loading (render a skeleton),
 *   - `null` when there is nothing (e.g. no active account),
 *   - the value otherwise.
 * Server render and hydration always see `undefined`, so there is no
 * signed-in/signed-out flicker.
 *
 * Mutations are plain async service functions (re-exported as `actions`); the
 * store updates and every hook re-renders on its own, so no refetching.
 */
import * as React from "react";

import { MARKETS, getMarket } from "@/lib/propfund/markets";
import { activeAccount, computeAccountMetrics, latestAccount, newestFirst } from "@/lib/propfund/rules";
import type {
  Account,
  AccountMetrics,
  CardCheckout,
  Deposit,
  Fill,
  Kyc,
  Market,
  Order,
  Payment,
  Payout,
  Position,
  RebuyOffer,
  Takeover,
  User,
  Wallet,
} from "@/lib/propfund/types";

import { now, subscribeClock } from "./mock/clock";
import { startEngine } from "./mock/engine";
import {
  getCandles,
  getMarks,
  getOrderBook,
  getPriceVersion,
  getQuote,
  getQuotes,
  getRecentTrades,
  subscribePrices,
  type Candle,
  type OrderBook,
  type Quote,
  type Timeframe,
  type Trade,
} from "./mock/prices";
import * as service from "./mock/service";
import { getSnapshot, subscribe, type StoreSnapshot, type UserData } from "./mock/store";

const serverUndefined = () => undefined;

// ── identity stabilisation ─────────────────────────────────────────────────

/**
 * True when two hook results are interchangeable for rendering. Every store
 * commit replaces the whole data object (it is cloned before mutating), so a
 * selector that read nothing the commit touched still produces a brand-new
 * array of brand-new records. Comparing by value here keeps the previous
 * reference, so only the screens whose numbers actually moved re-render. The
 * values involved are the small plain records the mock service stores.
 */
function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => sameValue(v, b[i]));
  }
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => sameValue((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

/** Keeps the previous value while the new one is equivalent to it. */
function useStable<T>(value: T): T {
  const ref = React.useRef(value);
  if (!sameValue(ref.current, value)) ref.current = value;
  return ref.current;
}

// ── base subscriptions ─────────────────────────────────────────────────────

function useStore(): StoreSnapshot | undefined {
  return React.useSyncExternalStore(subscribe, getSnapshot, serverUndefined);
}

/**
 * Select from ready data. The result is memoized on the data snapshot plus
 * `deps`, so it keeps its reference until the store or a dep changes, and is
 * then stabilised so an unrelated commit doesn't hand callers a new reference.
 */
function useData<T>(select: (d: UserData) => T, deps: readonly unknown[] = []): T | undefined {
  const snap = useStore();
  const data = snap?.status === "ready" ? snap.data : undefined;
  const selectRef = React.useRef(select);
  selectRef.current = select;
  const value = React.useMemo(
    () => (data ? selectRef.current(data) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, ...deps],
  );
  return useStable(value);
}

/** Price ticks and store commits, for values derived from both. */
function subscribeLive(listener: () => void): () => void {
  const offPrices = subscribePrices(listener);
  const offStore = subscribe(listener);
  return () => {
    offPrices();
    offStore();
  };
}

/**
 * A `useSyncExternalStore` snapshot that is recomputed at most once per
 * (store, tick) and keeps its reference when the value is unchanged, so React
 * skips the re-render entirely. Without this, every consumer of a derived value
 * re-rendered on all twelve markets' ticks even when its own numbers were the
 * same — a BTC tick redrew the wallet screen.
 */
function createLiveSnapshot<V>(compute: (key: string | null, data: UserData) => V, empty: V) {
  const cache = new Map<string, { data: UserData | null; version: number; value: V }>();
  return (key: string | null): V => {
    const snap = getSnapshot();
    const data = snap.status === "ready" ? snap.data : null;
    const version = getPriceVersion();
    const slot = cache.get(key ?? "");
    if (slot && slot.data === data && slot.version === version) return slot.value;
    const next = data ? compute(key, data) : empty;
    const value = slot && sameValue(slot.value, next) ? slot.value : next;
    cache.set(key ?? "", { data, version, value });
    return value;
  };
}

/** `ready` once the signed-in user's data is loaded. `signedOut` when there is no session. */
export function useServiceStatus(): "loading" | "ready" | "signed_out" {
  const snap = useStore();
  if (!snap || snap.status === "loading") return "loading";
  return snap.status;
}

// ── time ───────────────────────────────────────────────────────────────────

/**
 * One timer per interval, shared by every caller: separate timers drifted apart
 * and gave React a separate re-render pass each, for the same second.
 */
type Ticker = {
  value: number;
  listeners: Set<() => void>;
  timer: ReturnType<typeof setInterval> | null;
  offClock: (() => void) | null;
};
const tickers = new Map<number, Ticker>();

/** The shared record for an interval. Reading it never starts a timer. */
function clockTicker(intervalMs: number): Ticker {
  let ticker = tickers.get(intervalMs);
  if (!ticker) {
    ticker = { value: now(), listeners: new Set(), timer: null, offClock: null };
    tickers.set(intervalMs, ticker);
  }
  return ticker;
}

function startTicker(ticker: Ticker, intervalMs: number) {
  if (ticker.timer) return;
  const update = () => {
    ticker.value = now();
    ticker.listeners.forEach((l) => l());
  };
  ticker.value = now();
  ticker.timer = setInterval(update, intervalMs);
  ticker.offClock = subscribeClock(update);
}

function stopTicker(ticker: Ticker, intervalMs: number) {
  if (ticker.listeners.size > 0) return;
  if (ticker.timer) clearInterval(ticker.timer);
  ticker.offClock?.();
  tickers.delete(intervalMs);
}

/**
 * Mock-clock "now" in ms, re-rendering every `intervalMs` and whenever test
 * controls move the clock. `undefined` during SSR/hydration.
 */
export function useNow(intervalMs = 1_000): number | undefined {
  const subscribeNow = React.useCallback(
    (listener: () => void) => {
      const ticker = clockTicker(intervalMs);
      ticker.listeners.add(listener);
      startTicker(ticker, intervalMs);
      return () => {
        ticker.listeners.delete(listener);
        stopTicker(ticker, intervalMs);
      };
    },
    [intervalMs],
  );
  const getNow = React.useCallback(() => clockTicker(intervalMs).value, [intervalMs]);
  return React.useSyncExternalStore(subscribeNow, getNow, serverUndefined);
}

// ── markets ────────────────────────────────────────────────────────────────

/** Static catalogue of the 12 markets. */
export function useMarkets(): readonly Market[] {
  return MARKETS;
}

/** Live quotes for every market (new array each tick). */
export function useQuotes(): readonly Quote[] | undefined {
  React.useEffect(() => startEngine(), []);
  return React.useSyncExternalStore(subscribePrices, getQuotes, serverUndefined);
}

/** Live quote for one market: `{ market, quote }`. */
export function usePrices(symbol: string): { market: Market; quote: Quote } | undefined {
  React.useEffect(() => startEngine(), []);
  const getter = React.useCallback(() => getQuote(symbol), [symbol]);
  const quote = React.useSyncExternalStore(subscribePrices, getter, serverUndefined);
  const market = getMarket(symbol);
  return React.useMemo(() => (market && quote ? { market, quote } : undefined), [market, quote]);
}

/**
 * Candle history for a chart. The array reference changes on every tick; use
 * the last element with `series.update()` after the first `setData()`.
 */
export function useCandles(symbol: string, timeframe: Timeframe): readonly Candle[] | undefined {
  React.useEffect(() => startEngine(), []);
  const getter = React.useCallback(() => getCandles(symbol, timeframe), [symbol, timeframe]);
  return React.useSyncExternalStore(subscribePrices, getter, serverUndefined);
}

export function useOrderBook(symbol: string): OrderBook | undefined {
  React.useEffect(() => startEngine(), []);
  const getter = React.useCallback(() => getOrderBook(symbol), [symbol]);
  return React.useSyncExternalStore(subscribePrices, getter, serverUndefined);
}

/** Most recent first, up to 40. */
export function useRecentTrades(symbol: string): readonly Trade[] | undefined {
  React.useEffect(() => startEngine(), []);
  const getter = React.useCallback(() => getRecentTrades(symbol), [symbol]);
  return React.useSyncExternalStore(subscribePrices, getter, serverUndefined);
}

// ── user + accounts ────────────────────────────────────────────────────────

export function useUser(): User | undefined {
  return useData((d) => d.user);
}

/** All accounts, newest first. */
export function useAccounts(): Account[] | undefined {
  return useData((d) => newestFirst(d.accounts, (a) => a.createdAt));
}

export function useAccount(accountId: string | null | undefined): Account | null | undefined {
  return useData((d) => (accountId ? (d.accounts.find((a) => a.id === accountId) ?? null) : null), [accountId]);
}

/** The one active account (challenge or funded), or null. */
export function useActiveAccount(): Account | null | undefined {
  return useData((d) => activeAccount(d.accounts));
}

/**
 * The account screens should show: the active account, else the most recent
 * one (so a breached or terminated account stays visible read-only).
 */
export function useCurrentAccount(): Account | null | undefined {
  return useData((d) => activeAccount(d.accounts) ?? latestAccount(d.accounts));
}

function useAccountIdOrCurrent(accountId?: string): string | null | undefined {
  const current = useCurrentAccount();
  if (accountId) return accountId;
  if (current === undefined) return undefined;
  return current?.id ?? null;
}

/**
 * Live metrics (equity, today/total P&L, daily and max meters, target
 * progress, buying power) for an account, recomputed on every price tick.
 * Defaults to the current account.
 */
const metricsSnapshot = createLiveSnapshot<AccountMetrics | null | undefined>((id, data) => {
  const account = id ? data.accounts.find((a) => a.id === id) : undefined;
  if (!account) return null;
  const positions = data.positions.filter((p) => p.accountId === account.id);
  const working = data.orders.filter((o) => o.accountId === account.id && o.status === "working").length;
  return computeAccountMetrics(account, positions, working, getMarks());
}, undefined);

export function useAccountMetrics(accountId?: string): AccountMetrics | null | undefined {
  React.useEffect(() => startEngine(), []);
  const id = useAccountIdOrCurrent(accountId);
  const getter = React.useCallback(
    () => (id === undefined ? undefined : metricsSnapshot(id)),
    [id],
  );
  return React.useSyncExternalStore(subscribeLive, getter, serverUndefined);
}

/** Open positions for an account (default: current account). */
export function usePositions(accountId?: string): Position[] | undefined {
  const id = useAccountIdOrCurrent(accountId);
  return useData(
    (d) => (id === undefined ? undefined : id ? d.positions.filter((p) => p.accountId === id) : []),
    [id],
  );
}

/** Position with live mark and unrealized P&L. */
export type LivePosition = Position & { mark: number; unrealizedPnl: number; notionalUsd: number };

const livePositionsSnapshot = createLiveSnapshot<LivePosition[] | undefined>((id, data) => {
  if (!id) return [];
  const marks = getMarks();
  return data.positions
    .filter((p) => p.accountId === id)
    .map((p) => {
      const market = getMarket(p.symbol);
      const mark = marks[p.symbol] ?? p.entryPrice;
      const dir = p.side === "long" ? 1 : -1;
      const quotePnl = dir * p.quantity * (mark - p.entryPrice);
      const unrealizedPnl = market?.quote === "JPY" ? quotePnl / mark : quotePnl;
      const notionalUsd = market?.quote === "JPY" ? p.quantity : p.quantity * mark;
      return { ...p, mark, unrealizedPnl, notionalUsd };
    });
}, undefined);

export function useLivePositions(accountId?: string): LivePosition[] | undefined {
  React.useEffect(() => startEngine(), []);
  const id = useAccountIdOrCurrent(accountId);
  const getter = React.useCallback(
    () => (id === undefined ? undefined : livePositionsSnapshot(id)),
    [id],
  );
  return React.useSyncExternalStore(subscribeLive, getter, serverUndefined);
}

/** Orders for an account, newest first (all statuses; filter `status === "working"` for open orders). */
export function useOrders(accountId?: string): Order[] | undefined {
  const id = useAccountIdOrCurrent(accountId);
  return useData(
    (d) =>
      id === undefined
        ? undefined
        : id
          ? newestFirst(d.orders.filter((o) => o.accountId === id), (a) => a.createdAt)
          : [],
    [id],
  );
}

/** Fills (trade history) for an account, newest first. */
export function useFills(accountId?: string): Fill[] | undefined {
  const id = useAccountIdOrCurrent(accountId);
  return useData(
    (d) =>
      id === undefined ? undefined : id ? newestFirst(d.fills.filter((f) => f.accountId === id), (a) => a.at) : [],
    [id],
  );
}

// ── payments, payouts, identity, wallet ────────────────────────────────────

export function useRebuyOffer(): RebuyOffer | null | undefined {
  return useData((d) => d.rebuyOffer);
}

/** Current breach / graduation / violation takeover, if any. */
export function useTakeover(): Takeover | null | undefined {
  return useData((d) => d.takeover);
}

/** Newest first. */
export function usePayouts(): Payout[] | undefined {
  return useData((d) => newestFirst(d.payouts, (a) => a.requestedAt));
}

export function usePayoutUnderReview(): Payout | null | undefined {
  return useData((d) => d.payouts.find((p) => p.status === "under_review") ?? null);
}

export function useKyc(): Kyc | undefined {
  return useData((d) => d.kyc);
}

export function useWallet(): Wallet | undefined {
  return useData((d) => ({
    address: d.user.walletAddress,
    depositAddress: d.user.depositAddress,
    balances: d.walletBalances,
    depositCreditUsd: d.user.depositCreditUsd,
  }));
}

/** Newest first. */
export function useDeposits(): Deposit[] | undefined {
  return useData((d) => newestFirst(d.deposits, (a) => a.createdAt));
}

export function useDeposit(depositId: string | null | undefined): Deposit | null | undefined {
  return useData((d) => (depositId ? (d.deposits.find((x) => x.id === depositId) ?? null) : null), [depositId]);
}

export function useCardCheckout(checkoutId: string | null | undefined): CardCheckout | null | undefined {
  return useData(
    (d) => (checkoutId ? (d.cardCheckouts.find((c) => c.id === checkoutId) ?? null) : null),
    [checkoutId],
  );
}

/** Newest first (card, crypto and credit). */
export function usePayments(): Payment[] | undefined {
  return useData((d) => newestFirst(d.payments, (a) => a.createdAt));
}

// ── mutations ──────────────────────────────────────────────────────────────

/** Service mutations. Each returns a promise and throws `ServiceError` with user-facing copy. */
export const actions = {
  createCryptoDeposit: service.createCryptoDeposit,
  simulateDepositConfirmations: service.simulateDepositConfirmations,
  waitForDeposit: service.waitForDeposit,
  createCardCheckout: service.createCardCheckout,
  completeTestCardPayment: service.completeTestCardPayment,
  purchaseWithCredit: service.purchaseWithCredit,
  getCheckoutQuote: service.getCheckoutQuote,
  placeOrder: service.placeOrder,
  cancelOrder: service.cancelOrder,
  closePosition: service.closePosition,
  updatePositionExits: service.updatePositionExits,
  startKyc: service.startKyc,
  getPayoutPreview: service.getPayoutPreview,
  requestPayout: service.requestPayout,
  dismissTakeover: service.dismissTakeover,
  getAccountStatement: service.getAccountStatement,
} as const;

/**
 * Wrap an async action with pending/error state.
 *
 *   const place = useAction(actions.placeOrder);
 *   await place.run({ ... });  // place.pending, place.error
 */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const fnRef = React.useRef(fn);
  fnRef.current = fn;
  const run = React.useCallback(async (...args: A): Promise<R> => {
    setPending(true);
    setError(null);
    try {
      return await fnRef.current(...args);
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Something went wrong. Please try again.");
      setError(err);
      throw err;
    } finally {
      setPending(false);
    }
  }, []);
  const reset = React.useCallback(() => setError(null), []);
  return { run, pending, error, reset };
}
