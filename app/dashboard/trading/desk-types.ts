export type MarketType = "perp" | "spot";
export type OrderSide = "buy" | "sell";
export type SizeUnit = "usd" | "coin";

export type DeskMarket = {
  coin: string;
  mid: number;
  max_leverage: number;
  /** Hyperliquid allMids key (`BTC`, `@107`). */
  wire?: string;
};

export type DeskPosition = {
  id?: string;
  coin?: string;
  side?: string;
  size?: number;
  entry_price?: number;
  leverage?: number;
  mark_price?: number;
  unrealized_pnl?: number;
  notional?: number;
  market_type?: string;
};

export type DeskFill = {
  id?: string;
  coin?: string;
  side?: string;
  qty?: number;
  price?: number;
  realized_pnl?: number;
  created_at?: string;
  market_type?: string;
};

export type DeskBalance = {
  account_size: number;
  status: string;
  cash?: number;
  equity?: number;
  used_margin?: number;
  unrealized_pnl?: number;
  realized_pnl?: number;
};

export type DeskSnapshot = {
  positions: DeskPosition[];
  orders: Array<Record<string, unknown>>;
  history: DeskFill[];
  balance: DeskBalance;
};

export const FALLBACK_PERPS: DeskMarket[] = [
  { coin: "BTC", wire: "BTC", mid: 0, max_leverage: 40 },
  { coin: "ETH", wire: "ETH", mid: 0, max_leverage: 25 },
  { coin: "SOL", wire: "SOL", mid: 0, max_leverage: 20 },
];

export const FALLBACK_SPOTS: DeskMarket[] = [{ coin: "PURR", wire: "@107", mid: 0, max_leverage: 1 }];

export function money(value: number | undefined | null, digits = 2): string {
  const n = Number(value ?? 0);
  const body = Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (n < 0) return `-$${body}`;
  if (n > 0) return `+$${body}`;
  return `$${body}`;
}

export function absMoney(value: number | undefined | null, digits = 2): string {
  return `$${Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function formatPx(value: number | undefined | null): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const digits = n >= 1000 ? 2 : n >= 1 ? 4 : 6;
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function formatCoinSize(value: number | undefined | null): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "—";
  const digits = n >= 1 ? 4 : n >= 0.01 ? 5 : 6;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: Math.min(digits, 4),
    maximumFractionDigits: digits,
  });
}

export function pnlClass(value: number): string {
  if (value > 0) return "text-success";
  if (value < 0) return "text-destructive";
  return "text-muted-foreground";
}

export function displayCoin(coin: string): string {
  return coin.includes(":") ? coin.split(":").pop() ?? coin : coin;
}

/** Desk positions store `long`/`short`; fills store `buy`/`sell`. */
export function isLongSide(side: string | undefined | null): boolean {
  const value = String(side ?? "").toLowerCase();
  return value === "long" || value === "buy";
}

export function isSpotMarket(type: string | undefined | null): boolean {
  return String(type ?? "").toLowerCase() === "spot";
}

/** Spot is cash inventory (buy/sell). Perps are long/short. */
export function sideLabel(side: string | undefined | null, marketType?: string | null): string {
  if (isSpotMarket(marketType)) return isLongSide(side) ? "Buy" : "Sell";
  return isLongSide(side) ? "Long" : "Short";
}

/** Revalue a position from a live mid. Same formula as Vanta `unrealizedPnl`. */
export function markLivePosition(pos: DeskPosition, mark: number): DeskPosition {
  const entry = Number(pos.entry_price) || 0;
  const size = Number(pos.size) || 0;
  if (!(mark > 0) || !(size > 0)) return pos;
  const sign = isLongSide(pos.side) ? 1 : -1;
  const unrealized_pnl = entry > 0 ? (mark - entry) * size * sign : Number(pos.unrealized_pnl ?? 0);
  const notional = size * mark;
  if (mark === pos.mark_price && unrealized_pnl === pos.unrealized_pnl && notional === pos.notional) {
    return pos;
  }
  return { ...pos, mark_price: mark, unrealized_pnl, notional };
}

/** Header equity/uPnL must match the blotter: cash + used margin + live uPnL. */
export function liveDeskBalance(balance: DeskBalance | null | undefined, positions: DeskPosition[]): DeskBalance | null {
  if (!balance) return null;
  const unrealized_pnl = positions.reduce((sum, row) => sum + Number(row.unrealized_pnl ?? 0), 0);
  const cash = Number(balance.cash ?? 0);
  const used_margin = Number(balance.used_margin ?? 0);
  return {
    ...balance,
    unrealized_pnl,
    equity: cash + used_margin + unrealized_pnl,
  };
}

export function asPosition(row: Record<string, unknown>): DeskPosition {
  return row as DeskPosition;
}

export function asFill(row: Record<string, unknown>): DeskFill {
  return row as DeskFill;
}
