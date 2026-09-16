/**
 * Position maths for the simulated terminal (PRD §10 order form, §12 execution).
 * Pure functions: no clock, no store.
 */
import type { Market, OrderSide, Position, PositionSide } from "@/lib/propfund/types";

import { roundCents } from "./packages";

export const MAX_LEVERAGE = 10;
export const MIN_LEVERAGE = 1;
export const MIN_ORDER_NOTIONAL_USD = 10;
/** Size chips on the order form: share of buying power. */
export const SIZE_CHIPS = [0.25, 0.5, 0.75, 1] as const;

export function sideDirection(side: PositionSide | OrderSide): 1 | -1 {
  return side === "long" || side === "buy" ? 1 : -1;
}

export function positionSideFor(orderSide: OrderSide): PositionSide {
  return orderSide === "buy" ? "long" : "short";
}

/** Closing a position means trading the opposite way. */
export function closingSide(side: PositionSide): OrderSide {
  return side === "long" ? "sell" : "buy";
}

/** USD notional of `quantity` base units at `price`. USD/JPY's base is USD. */
export function notionalUsd(market: Pick<Market, "quote">, quantity: number, price: number): number {
  return market.quote === "JPY" ? quantity : quantity * price;
}

/** Base units bought by `usd` notional at `price`. */
export function quantityForNotional(market: Pick<Market, "quote">, usd: number, price: number): number {
  return market.quote === "JPY" ? usd : usd / price;
}

/** P&L in USD for `quantity` moving from `entry` to `exit`. */
export function pnlUsd(
  market: Pick<Market, "quote">,
  side: PositionSide,
  quantity: number,
  entry: number,
  exit: number,
): number {
  const quotePnl = sideDirection(side) * quantity * (exit - entry);
  return market.quote === "JPY" ? quotePnl / exit : quotePnl;
}

export function unrealizedPnl(
  market: Pick<Market, "quote">,
  position: Pick<Position, "side" | "quantity" | "entryPrice">,
  mark: number,
): number {
  return pnlUsd(market, position.side, position.quantity, position.entryPrice, mark);
}

/** Buying power at a leverage: free margin × leverage. */
export function buyingPower(freeMarginUsd: number, leverage: number): number {
  return roundCents(Math.max(0, freeMarginUsd) * clampLeverage(leverage));
}

export function clampLeverage(leverage: number): number {
  if (!Number.isFinite(leverage)) return MIN_LEVERAGE;
  return Math.min(MAX_LEVERAGE, Math.max(MIN_LEVERAGE, leverage));
}

/** Limit orders fill when price crosses: buy at or below, sell at or above. */
export function limitCrossed(side: OrderSide, limitPrice: number, mark: number): boolean {
  return side === "buy" ? mark <= limitPrice : mark >= limitPrice;
}

/** Take-profit / stop-loss trigger for an open position at the mark. */
export function exitTrigger(
  position: Pick<Position, "side" | "takeProfit" | "stopLoss">,
  mark: number,
): "take_profit" | "stop_loss" | null {
  const long = position.side === "long";
  if (position.stopLoss !== null) {
    if (long ? mark <= position.stopLoss : mark >= position.stopLoss) return "stop_loss";
  }
  if (position.takeProfit !== null) {
    if (long ? mark >= position.takeProfit : mark <= position.takeProfit) return "take_profit";
  }
  return null;
}

/**
 * TP must sit on the profit side of the reference price and SL on the loss
 * side. Returns an error message or null.
 */
export function validateExits(
  side: PositionSide,
  reference: number,
  takeProfit: number | null,
  stopLoss: number | null,
): string | null {
  const long = side === "long";
  if (takeProfit !== null) {
    if (!(takeProfit > 0)) return "Take-profit must be above zero.";
    if (long ? takeProfit <= reference : takeProfit >= reference) {
      return long
        ? "Take-profit must be above the entry price for a buy."
        : "Take-profit must be below the entry price for a sell.";
    }
  }
  if (stopLoss !== null) {
    if (!(stopLoss > 0)) return "Stop-loss must be above zero.";
    if (long ? stopLoss >= reference : stopLoss <= reference) {
      return long
        ? "Stop-loss must be below the entry price for a buy."
        : "Stop-loss must be above the entry price for a sell.";
    }
  }
  return null;
}

export type NetFillResult = {
  /** The position after the fill, or null when fully closed. */
  position: Pick<Position, "side" | "quantity" | "entryPrice"> | null;
  realizedPnl: number;
  kind: "open" | "increase" | "reduce" | "close" | "flip";
};

/**
 * Net a fill against an existing position in the same symbol (one position per
 * symbol per account). Adding averages the entry; trading against reduces,
 * closes or flips and realizes P&L on the closed quantity.
 */
export function netFill(
  market: Pick<Market, "quote">,
  existing: Pick<Position, "side" | "quantity" | "entryPrice"> | null,
  orderSide: OrderSide,
  quantity: number,
  price: number,
): NetFillResult {
  const side = positionSideFor(orderSide);
  if (!existing || existing.quantity <= 0) {
    return { position: { side, quantity, entryPrice: price }, realizedPnl: 0, kind: "open" };
  }
  if (existing.side === side) {
    const total = existing.quantity + quantity;
    const entryPrice = (existing.entryPrice * existing.quantity + price * quantity) / total;
    return { position: { side, quantity: total, entryPrice }, realizedPnl: 0, kind: "increase" };
  }
  const closedQty = Math.min(existing.quantity, quantity);
  const realized = pnlUsd(market, existing.side, closedQty, existing.entryPrice, price);
  const remaining = existing.quantity - quantity;
  const EPS = 1e-12;
  if (Math.abs(remaining) <= EPS * Math.max(1, existing.quantity)) {
    return { position: null, realizedPnl: realized, kind: "close" };
  }
  if (remaining > 0) {
    return {
      position: { side: existing.side, quantity: remaining, entryPrice: existing.entryPrice },
      realizedPnl: realized,
      kind: "reduce",
    };
  }
  return {
    position: { side, quantity: -remaining, entryPrice: price },
    realizedPnl: realized,
    kind: "flip",
  };
}
