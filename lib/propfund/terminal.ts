/**
 * Pure view helpers for the terminal (PRD §10.3). Every trading number here is
 * composed from `@/lib/propfund/rules`; nothing re-derives a rule.
 */
import { DEFAULT_SYMBOL, getMarket } from "@/lib/propfund/markets";
import {
  MIN_ORDER_NOTIONAL_USD,
  buyingPower,
  meterTone,
  pnlUsd,
  positionSideFor,
  quantityForNotional,
  roundCents,
  validateExits,
} from "@/lib/propfund/rules";
import type { AccountStats, AssetClass, FillKind, LimitMeter, Market, MeterTone, OrderSide, OrderType } from "@/lib/propfund/types";

// ── markets ────────────────────────────────────────────────────────────────

export const ASSET_CLASS_ORDER: readonly AssetClass[] = ["crypto", "forex", "commodities", "equities"];

export const ASSET_CLASS_LABEL: Record<AssetClass, string> = {
  crypto: "Crypto",
  forex: "Forex",
  commodities: "Commodities",
  equities: "Equities",
};

/** A `?symbol=` value that names a market, else the default market. */
export function resolveSymbol(param: string | null | undefined): string {
  if (!param) return DEFAULT_SYMBOL;
  const upper = param.trim().toUpperCase();
  return getMarket(upper) ? upper : DEFAULT_SYMBOL;
}

export type MarketGroup = { assetClass: AssetClass; label: string; markets: Market[] };

/** Filter by symbol, display name or name (case-insensitive) and group by asset class. Empty groups are dropped. */
export function groupMarkets(markets: readonly Market[], query = ""): MarketGroup[] {
  const q = query.trim().toLowerCase().replace(/[\s/]/g, "");
  const matches = (m: Market) =>
    !q ||
    m.symbol.toLowerCase().includes(q) ||
    m.displayName.toLowerCase().replace(/[\s/]/g, "").includes(q) ||
    m.name.toLowerCase().replace(/[\s/]/g, "").includes(q);
  return ASSET_CLASS_ORDER.map((assetClass) => ({
    assetClass,
    label: ASSET_CLASS_LABEL[assetClass],
    markets: markets.filter((m) => m.assetClass === assetClass && matches(m)),
  })).filter((g) => g.markets.length > 0);
}

// ── order book ─────────────────────────────────────────────────────────────

type Level = { price: number; size: number; total: number };
export type DepthRow = Level & { /** 0–1 share of the deepest cumulative total on either side. */ depth: number };

export type BookView = {
  /** Highest price first, so the best ask sits next to the spread row. */
  asks: DepthRow[];
  /** Best bid first. */
  bids: DepthRow[];
  spread: number;
  /** Spread as a fraction of the mid price. */
  spreadPct: number;
  mid: number;
};

/** Depth bars and display order for a book whose levels are best-first with cumulative totals. */
export function bookView(book: { bids: readonly Level[]; asks: readonly Level[]; spread: number }, rows = 10): BookView {
  const asks = book.asks.slice(0, rows);
  const bids = book.bids.slice(0, rows);
  const maxTotal = Math.max(0, ...asks.map((l) => l.total), ...bids.map((l) => l.total));
  const withDepth = (l: Level): DepthRow => ({ ...l, depth: maxTotal > 0 ? Math.min(1, l.total / maxTotal) : 0 });
  const bestAsk = asks[0]?.price;
  const bestBid = bids[0]?.price;
  const mid = bestAsk !== undefined && bestBid !== undefined ? (bestAsk + bestBid) / 2 : (bestAsk ?? bestBid ?? 0);
  return {
    asks: asks.map(withDepth).reverse(),
    bids: bids.map(withDepth),
    spread: book.spread,
    spreadPct: mid > 0 ? book.spread / mid : 0,
    mid,
  };
}

/** Base-unit size: `1.25M`, `25.3K`, `1,250`, `12.50`, `0.2513`. */
export function formatSize(size: number): string {
  const n = Number.isFinite(size) ? Math.abs(size) : 0;
  const sign = size < 0 ? "-" : "";
  if (n >= 1_000_000) return `${sign}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${sign}${(n / 1_000).toFixed(1)}K`;
  if (n >= 100) return `${sign}${Math.round(n).toLocaleString("en-US")}`;
  if (n >= 1) return `${sign}${n.toFixed(2)}`;
  return `${sign}${n.toFixed(4)}`;
}

// ── meters ─────────────────────────────────────────────────────────────────

/** `$950`, `$1.5k`, `$12.5k`, `$100k`, `$1.2M`. For tight mobile meters. */
export function formatCompactUsd(n: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  const sign = safe < 0 ? "-" : "";
  const a = Math.abs(safe);
  const trim = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, ""));
  if (a >= 1_000_000) return `${sign}$${trim(Math.round(a / 100_000) / 10)}M`;
  if (a >= 1_000) return `${sign}$${trim(Math.round(a / 100) / 10)}k`;
  return `${sign}$${Math.round(a)}`;
}

/** 0–1 fraction → bar width percentage (clamped, one decimal). */
export function meterFillPct(fraction: number): number {
  if (!Number.isFinite(fraction)) return 0;
  return Math.round(Math.min(1, Math.max(0, fraction)) * 1000) / 10;
}

// ── order form ─────────────────────────────────────────────────────────────

export const SIZE_PCT_STEPS = [0, 0.25, 0.5, 0.75, 1] as const;

/** Buying power for the form: free margin × chosen leverage (rules). */
export function availableToTrade(freeMarginUsd: number, leverage: number): number {
  return buyingPower(freeMarginUsd, leverage);
}

/** USD notional for a share of buying power, floored to cents so 100% never exceeds it. */
export function notionalForShare(buyingPowerUsd: number, share: number): number {
  const s = Math.min(1, Math.max(0, share));
  return Math.floor(Math.max(0, buyingPowerUsd) * s * 100) / 100;
}

/** Share (0–1) of buying power a notional uses. */
export function shareOfBuyingPower(notionalUsd: number | null, buyingPowerUsd: number): number {
  if (!notionalUsd || notionalUsd <= 0 || buyingPowerUsd <= 0) return 0;
  return Math.min(1, notionalUsd / buyingPowerUsd);
}

/** Parse a user-typed amount ("1,250.5") into a positive number, else null. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[,\s$]/g, "");
  if (!cleaned || !/^\d*\.?\d*$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Estimated USD P&L if a new order of `notionalUsd` entered at `reference` exits at `exit`. */
export function estimateExitPnl(
  market: Pick<Market, "quote">,
  side: OrderSide,
  notionalUsd: number,
  reference: number,
  exit: number,
): number {
  if (!(notionalUsd > 0) || !(reference > 0) || !(exit > 0)) return 0;
  const quantity = quantityForNotional(market, notionalUsd, reference);
  return roundCents(pnlUsd(market, positionSideFor(side), quantity, reference, exit));
}

export type HeadroomEffect = {
  /** Daily headroom left today if the stop-loss is hit (can be negative). */
  remainingAfterUsd: number;
  /** 0–1 share of the daily limit used after the stop. */
  usedAfter: number;
  tone: MeterTone;
  /** The stop sits beyond the daily breach level. */
  breaches: boolean;
};

/**
 * Effect of a stop-loss on today's daily loss headroom, holding everything
 * else at the current mark. `stopPnlUsd` is the (negative) P&L at the stop.
 */
export function dailyHeadroomAfterStop(daily: Pick<LimitMeter, "limit" | "remainingUsd">, stopPnlUsd: number): HeadroomEffect {
  const remainingAfterUsd = roundCents(daily.remainingUsd + Math.min(0, stopPnlUsd));
  const usedAfter = daily.limit > 0 ? Math.min(1, Math.max(0, 1 - remainingAfterUsd / daily.limit)) : 1;
  return {
    remainingAfterUsd,
    usedAfter,
    tone: remainingAfterUsd <= 0 ? "red" : meterTone(usedAfter),
    breaches: remainingAfterUsd <= 0,
  };
}

export type OrderGateInput = {
  active: boolean;
  pending: boolean;
  type: OrderType;
  side: OrderSide;
  notionalUsd: number | null;
  buyingPowerUsd: number;
  /** The order trades against an open position in the same symbol (reduce, close or flip). */
  opposesPosition: boolean;
  mark: number | null;
  limitPrice: number | null;
  takeProfit: number | null;
  stopLoss: number | null;
};

export type OrderGate = { canSubmit: boolean; reason: string | null };

/**
 * Whether the submit button is enabled, with a calm helper line when not.
 * Inputs stay interactive either way; the service is the final validator.
 */
export function orderGate(i: OrderGateInput): OrderGate {
  const block = (reason: string): OrderGate => ({ canSubmit: false, reason });
  if (!i.active) return block("Trading opens with an active account.");
  if (i.pending) return { canSubmit: false, reason: null };
  if (i.mark === null) return block("Waiting for a price.");
  if (i.notionalUsd === null) return block("Enter a size to place an order.");
  if (i.notionalUsd < MIN_ORDER_NOTIONAL_USD) return block(`Minimum order size is $${MIN_ORDER_NOTIONAL_USD}.`);
  if (i.type === "limit" && i.limitPrice === null) return block("Enter a limit price.");
  if (!i.opposesPosition && i.notionalUsd > i.buyingPowerUsd + 0.005) {
    return block(i.buyingPowerUsd <= 0 ? "No buying power left. Close a position to free margin." : "Size is above your available to trade. Lower it or raise leverage.");
  }
  const reference = i.type === "limit" && i.limitPrice !== null ? i.limitPrice : i.mark;
  const exitError = validateExits(positionSideFor(i.side), reference, i.takeProfit, i.stopLoss);
  if (exitError) return block(exitError);
  return { canSubmit: true, reason: null };
}

// ── history + stats ────────────────────────────────────────────────────────

export const FILL_KIND_LABEL: Record<FillKind, string> = {
  open: "Open",
  increase: "Increase",
  reduce: "Reduce",
  close: "Close",
  flip: "Flip",
  take_profit: "Take-profit",
  stop_loss: "Stop-loss",
  manual_close: "Closed by you",
  breach: "Breach close",
  violation: "Violation close",
  inactivity: "Inactivity close",
  adjustment: "Adjustment",
};

/** Wins ÷ closed trades with a result, or null when there are none. */
export function winRate(stats: Pick<AccountStats, "wins" | "losses">): number | null {
  const n = stats.wins + stats.losses;
  return n > 0 ? stats.wins / n : null;
}
