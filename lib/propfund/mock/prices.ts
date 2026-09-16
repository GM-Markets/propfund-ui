/**
 * Simulated price feed (PRD §12): a 1-second random walk for the 12 markets,
 * rolling candle history (1m/5m/15m/1h), a synthetic 10-level order book and
 * recent trades. Browser-only timers; safe to import on the server.
 */
import { MARKETS, getMarket, roundToTick } from "@/lib/propfund/markets";
import type { AssetClass, Market } from "@/lib/propfund/types";

import { now } from "./clock";
import { readJson, storageKeys, writeJson } from "./storage";

export type Timeframe = "1m" | "5m" | "15m" | "1h";
export const TIMEFRAMES: readonly Timeframe[] = ["1m", "5m", "15m", "1h"];
const TF_SECONDS: Record<Timeframe, number> = { "1m": 60, "5m": 300, "15m": 900, "1h": 3_600 };
const HISTORY_BARS = 300;
/** 1h charts show one week; every other timeframe shows HISTORY_BARS. */
const HOURLY_BARS = 168;
const DAY_MINUTES = 1_440;
/** One canonical 1m history per market feeds every timeframe and the 24h stats. */
const BASE_MINUTES = HOURLY_BARS * 60;
const TICK_MS = 1_000;

export type Quote = {
  symbol: string;
  /** Mark (mid). Orders fill here. */
  price: number;
  bid: number;
  ask: number;
  /** Price 24h ago (simulated). */
  open24h: number;
  change24h: number;
  changePct24h: number;
  high24h: number;
  low24h: number;
  /** Direction of the last tick. */
  direction: "up" | "down" | "flat";
  updatedAt: number;
};

/** Candle times are UTC seconds (lightweight-charts `UTCTimestamp`). */
export type Candle = { time: number; open: number; high: number; low: number; close: number };

export type BookLevel = { price: number; size: number; total: number };
export type OrderBook = { symbol: string; bids: BookLevel[]; asks: BookLevel[]; spread: number; updatedAt: number };

export type Trade = { id: string; price: number; size: number; side: "buy" | "sell"; at: number };

/** Per-second volatility by asset class (scaled for a lively demo). */
const SIGMA: Record<AssetClass, number> = {
  crypto: 0.00028,
  forex: 0.000045,
  commodities: 0.00012,
  equities: 0.00016,
};

function sigmaFor(m: Market): number {
  if (m.symbol === "BTC") return 0.0002;
  if (m.symbol === "WTI") return 0.00018;
  return SIGMA[m.assetClass];
}

function gaussian(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function spreadFor(m: Market, price: number): number {
  const bps = m.assetClass === "forex" ? 0.4 : m.assetClass === "crypto" ? 1 : 1.5;
  return Math.max(m.tickSize, roundToTick((price * bps) / 10_000, m.tickSize));
}

// ── state ──────────────────────────────────────────────────────────────────

let quotes: Record<string, Quote> = {};
let quotesList: Quote[] = [];
let initialized = false;
let timer: ReturnType<typeof setInterval> | null = null;
let tickCount = 0;
const listeners = new Set<() => void>();
const candles = new Map<string, Candle[]>();
const baseCandles = new Map<string, Candle[]>();
const trades = new Map<string, Trade[]>();
const books = new Map<string, { version: number; book: OrderBook }>();

type DayStats = { open24h: number; high24h: number; low24h: number };

/**
 * Rolling 24h open/high/low from the 1m history, cached per symbol. A full scan
 * is 1,440 bars × 12 markets, which is far too much to redo every second: while
 * the window still ends on the same minute only the newest bar can move, so the
 * cached extremes just widen to the new price. The scan runs again when the
 * series gains a bar (once a minute per market).
 */
const dayStatsCache = new Map<string, DayStats & { length: number; lastTime: number }>();

function scanDayStats(series: readonly Candle[], price: number): DayStats {
  const start = Math.max(0, series.length - DAY_MINUTES);
  let high = price;
  let low = price;
  for (let i = start; i < series.length; i++) {
    if (series[i].high > high) high = series[i].high;
    if (series[i].low < low) low = series[i].low;
  }
  return { open24h: series[start]?.open ?? price, high24h: high, low24h: low };
}

function dayStats(symbol: string, series: readonly Candle[], price: number): DayStats {
  const last = series[series.length - 1];
  const cached = dayStatsCache.get(symbol);
  if (cached && cached.length === series.length && cached.lastTime === (last?.time ?? 0)) {
    if (price > cached.high24h) cached.high24h = price;
    if (price < cached.low24h) cached.low24h = price;
    return cached;
  }
  const next = scanDayStats(series, price);
  dayStatsCache.set(symbol, { ...next, length: series.length, lastTime: last?.time ?? 0 });
  return next;
}

function makeQuote(m: Market, price: number, stats: DayStats, prev?: Quote): Quote {
  const p = roundToTick(price, m.tickSize);
  const half = spreadFor(m, p) / 2;
  const change = p - stats.open24h;
  return {
    symbol: m.symbol,
    price: p,
    bid: roundToTick(p - half, m.tickSize),
    ask: roundToTick(p + half, m.tickSize),
    open24h: stats.open24h,
    change24h: roundToTick(change, m.tickSize),
    changePct24h: stats.open24h ? change / stats.open24h : 0,
    high24h: stats.high24h,
    low24h: stats.low24h,
    direction: !prev || prev.price === p ? "flat" : p > prev.price ? "up" : "down",
    updatedAt: now(),
  };
}

function init() {
  if (initialized) return;
  initialized = true;
  const stored = readJson<Record<string, number>>(storageKeys.prices) ?? {};
  const next: Record<string, Quote> = {};
  for (const m of MARKETS) {
    const last = stored[m.symbol];
    // Ignore stored prices that drifted implausibly far (corrupt or stale data).
    const price =
      typeof last === "number" && last > m.referencePrice * 0.5 && last < m.referencePrice * 1.5
        ? last
        : m.referencePrice;
    const series = generateHistory(m, 60, BASE_MINUTES, price);
    baseCandles.set(m.symbol, series);
    next[m.symbol] = makeQuote(m, price, dayStats(m.symbol, series, price));
  }
  quotes = next;
  quotesList = MARKETS.map((m) => quotes[m.symbol]);
}

function emit() {
  quotesList = MARKETS.map((m) => quotes[m.symbol]);
  listeners.forEach((l) => l());
}

function persist() {
  const out: Record<string, number> = {};
  for (const q of quotesList) out[q.symbol] = q.price;
  writeJson(storageKeys.prices, out);
}

function applyPrice(symbol: string, rawPrice: number) {
  const m = getMarket(symbol);
  const prev = quotes[symbol];
  if (!m || !prev) return;
  const price = roundToTick(Math.max(m.tickSize, rawPrice), m.tickSize);
  // The 1 m base history is internal (never handed to React), so it is updated
  // in place: copying 10,080 bars for all 12 markets every second was the
  // single most expensive thing the feed did.
  const series = baseCandles.get(symbol) ?? [];
  updateSeriesInPlace(series, 60, price, BASE_MINUTES);
  const q = makeQuote(m, price, dayStats(symbol, series, price), prev);
  quotes = { ...quotes, [symbol]: q };
  updateCandles(symbol, q.price);
  pushTrades(m, q);
}

/** One random-walk step for every market. */
export function tick(): void {
  init();
  for (const m of MARKETS) {
    const p = quotes[m.symbol].price;
    // Light mean reversion toward the reference keeps long sessions realistic.
    const revert = ((m.referencePrice - p) / m.referencePrice) * 0.0005;
    applyPrice(m.symbol, p * (1 + sigmaFor(m) * gaussian() + revert));
  }
  tickCount++;
  if (tickCount % 5 === 0) persist();
  emit();
}

/** Start the 1 s feed (browser only, idempotent). */
export function startPriceFeed(): void {
  if (typeof window === "undefined" || timer) return;
  init();
  timer = setInterval(tick, TICK_MS);
}

export function stopPriceFeed(): void {
  if (timer) clearInterval(timer);
  timer = null;
}

export function subscribePrices(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getQuote(symbol: string): Quote | undefined {
  init();
  return quotes[symbol];
}

/** Stable array reference between ticks. */
export function getQuotes(): readonly Quote[] {
  init();
  return quotesList;
}

/**
 * symbol → mark, for rule evaluation. Cached per tick: the engine and every
 * `useAccountMetrics` caller ask for it on the same tick, and the shared object
 * also keeps their `useMemo` dependencies stable.
 */
let marksCache: { version: number; marks: Record<string, number> } | null = null;

export function getMarks(): Record<string, number> {
  init();
  if (marksCache && marksCache.version === tickCount) return marksCache.marks;
  const out: Record<string, number> = {};
  for (const q of quotesList) out[q.symbol] = q.price;
  marksCache = { version: tickCount, marks: out };
  return out;
}

/** Monotonic tick counter (changes on every tick or manual price move). */
export function getPriceVersion(): number {
  return tickCount;
}

/** Test controls: set a mark directly and notify subscribers immediately. */
export function setMark(symbol: string, price: number): void {
  init();
  applyPrice(symbol, price);
  tickCount++;
  persist();
  emit();
}

/** Test controls: move a market by a fraction (0.01 = +1%). */
export function nudgeMark(symbol: string, fraction: number): void {
  const q = getQuote(symbol);
  if (q) setMark(symbol, q.price * (1 + fraction));
}

/** Reset all marks to reference prices. */
export function resetPrices(): void {
  initialized = false;
  quotes = {};
  candles.clear();
  baseCandles.clear();
  trades.clear();
  books.clear();
  dayStatsCache.clear();
  marksCache = null;
  writeJson(storageKeys.prices, {});
  init();
  tickCount++;
  emit();
}

// ── candles ────────────────────────────────────────────────────────────────

const candleKey = (symbol: string, tf: Timeframe) => `${symbol}:${tf}`;

function generateHistory(m: Market, step: number, bars: number, endPrice: number): Candle[] {
  const nowSec = Math.floor(now() / 1000);
  const lastStart = Math.floor(nowSec / step) * step;
  const sigma = sigmaFor(m) * Math.sqrt(step);
  // Walk backwards from the current price so the series ends where the feed is.
  const out: Candle[] = new Array(bars);
  let close = endPrice;
  for (let i = bars - 1; i >= 0; i--) {
    const open = close / (1 + sigma * gaussian());
    const wick = Math.abs(sigma * gaussian()) * 0.6;
    const high = Math.max(open, close) * (1 + wick);
    const low = Math.min(open, close) * (1 - Math.abs(sigma * gaussian()) * 0.6);
    out[i] = {
      time: lastStart - (bars - 1 - i) * step,
      open: roundToTick(open, m.tickSize),
      high: roundToTick(high, m.tickSize),
      low: roundToTick(low, m.tickSize),
      close: roundToTick(close, m.tickSize),
    };
    close = open;
  }
  const last = out[bars - 1];
  last.close = roundToTick(endPrice, m.tickSize);
  last.high = Math.max(last.high, last.close);
  last.low = Math.min(last.low, last.close);
  return out;
}

/**
 * Same as `updateSeries` but mutates the array. Only for series that never
 * reach React (the 1 m base history), where a stable identity is fine.
 */
function updateSeriesInPlace(series: Candle[], step: number, price: number, maxBars: number): void {
  const last = series[series.length - 1];
  if (!last) return;
  const bucket = Math.floor(Math.floor(now() / 1000) / step) * step;
  if (bucket > last.time) {
    if (series.length >= maxBars * 2) series.splice(0, series.length - maxBars);
    series.push({ time: bucket, open: last.close, high: Math.max(last.close, price), low: Math.min(last.close, price), close: price });
    return;
  }
  if (price > last.high) last.high = price;
  if (price < last.low) last.low = price;
  last.close = price;
}

/** Apply a new price to a candle series of `step` seconds, keeping at most ~2× `maxBars`. */
function updateSeries(series: Candle[], step: number, price: number, maxBars: number): Candle[] {
  const last = series[series.length - 1];
  if (!last) return series;
  const bucket = Math.floor(Math.floor(now() / 1000) / step) * step;
  if (bucket > last.time) {
    const kept = series.length >= maxBars * 2 ? series.slice(series.length - maxBars) : series;
    return [...kept, { time: bucket, open: last.close, high: Math.max(last.close, price), low: Math.min(last.close, price), close: price }];
  }
  const next = series.slice(0, -1);
  next.push({ ...last, high: Math.max(last.high, price), low: Math.min(last.low, price), close: price });
  return next;
}

/** Bucket the 1m history into a coarser timeframe. */
function aggregate(base: readonly Candle[], step: number, bars: number): Candle[] {
  const out: Candle[] = [];
  for (const c of base) {
    const bucket = Math.floor(c.time / step) * step;
    const cur = out[out.length - 1];
    if (cur && cur.time === bucket) {
      cur.high = Math.max(cur.high, c.high);
      cur.low = Math.min(cur.low, c.low);
      cur.close = c.close;
    } else {
      out.push({ time: bucket, open: c.open, high: c.high, low: c.low, close: c.close });
    }
  }
  return out.slice(-bars);
}

function barsFor(tf: Timeframe): number {
  return tf === "1h" ? HOURLY_BARS : HISTORY_BARS;
}

function updateCandles(symbol: string, price: number) {
  for (const tf of TIMEFRAMES) {
    const key = candleKey(symbol, tf);
    const series = candles.get(key);
    if (!series) continue; // derived lazily on first read
    candles.set(key, updateSeries(series, TF_SECONDS[tf], price, barsFor(tf)));
  }
}

/** Candle history ending at the current price. New array reference on every update. */
export function getCandles(symbol: string, tf: Timeframe): readonly Candle[] {
  init();
  const key = candleKey(symbol, tf);
  let series = candles.get(key);
  if (!series) {
    const m = getMarket(symbol);
    const q = quotes[symbol];
    const base = baseCandles.get(symbol);
    if (!m || !q || !base) return [];
    series = aggregate(base, TF_SECONDS[tf], barsFor(tf));
    candles.set(key, series);
  }
  return series;
}

// ── order book + trades ────────────────────────────────────────────────────

function pushTrades(m: Market, q: Quote) {
  const list = trades.get(m.symbol) ?? [];
  const n = 1 + Math.floor(Math.random() * 3);
  const added: Trade[] = [];
  for (let i = 0; i < n; i++) {
    const side = Math.random() < 0.5 ? "buy" : "sell";
    added.push({
      id: `${m.symbol}-${q.updatedAt}-${i}`,
      price: side === "buy" ? q.ask : q.bid,
      size: baseSize(m, q.price) * (0.1 + Math.random() * 1.9),
      side,
      at: q.updatedAt,
    });
  }
  trades.set(m.symbol, [...added, ...list].slice(0, 40));
}

/** Typical order size in base units (~$5k–$50k notional). */
function baseSize(m: Market, price: number): number {
  const usd = m.assetClass === "forex" ? 250_000 : m.assetClass === "crypto" ? 25_000 : 15_000;
  return m.quote === "JPY" ? usd : usd / price;
}

/** Most recent first. */
export function getRecentTrades(symbol: string): readonly Trade[] {
  init();
  return trades.get(symbol) ?? [];
}

/** Synthetic 10-level book around the mark, regenerated once per tick. */
export function getOrderBook(symbol: string): OrderBook | undefined {
  init();
  const m = getMarket(symbol);
  const q = quotes[symbol];
  if (!m || !q) return undefined;
  const cached = books.get(symbol);
  if (cached && cached.version === tickCount) return cached.book;
  const step = Math.max(m.tickSize, roundToTick(q.price * 0.00008, m.tickSize));
  const unit = baseSize(m, q.price);
  const side = (dir: 1 | -1, start: number): BookLevel[] => {
    let total = 0;
    return Array.from({ length: 10 }, (_, i) => {
      const size = unit * (0.2 + Math.random() * (0.6 + i * 0.25));
      total += size;
      return { price: roundToTick(start + dir * i * step, m.tickSize), size, total };
    });
  };
  const book: OrderBook = {
    symbol,
    bids: side(-1, q.bid),
    asks: side(1, q.ask),
    spread: roundToTick(q.ask - q.bid, m.tickSize),
    updatedAt: q.updatedAt,
  };
  books.set(symbol, { version: tickCount, book });
  return book;
}
