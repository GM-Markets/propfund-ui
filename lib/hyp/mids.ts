/** Mid price per Hyperliquid coin, keyed by wire symbol (`BTC`, `@107`). */
export type HypMids = Record<string, string>;

/** Gateway WebSocket channel — one upstream `allMids` stream serves every client. */
export const HYP_MIDS_CHANNEL = "/hyp/api/mids/stream";

export function parseHypMids(raw: unknown): HypMids | null {
  const value = typeof raw === "string" ? safeJson(raw) : raw;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.mids && typeof record.mids === "object" && !Array.isArray(record.mids)) {
    return parseHypMids(record.mids);
  }
  if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) {
    const nested = parseHypMids(record.data);
    if (nested) return nested;
  }
  const out: HypMids = {};
  for (const [coin, px] of Object.entries(record)) {
    if (coin === "success" || coin === "channel") continue;
    if (typeof px === "string" && px.trim()) out[coin] = px;
    else if (typeof px === "number" && Number.isFinite(px)) out[coin] = String(px);
  }
  return Object.keys(out).length > 0 ? out : null;
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function midFromTape(
  mids: HypMids | undefined,
  market: { coin: string; wire?: string; mid?: number },
): number {
  if (mids) {
    const coin = market.coin ?? "";
    const wire = market.wire ?? "";
    // HIP-3 / HIP-4 / spot wires are exact allMids keys. Bare UBTC is not @140.
    const exact =
      coin.includes(":") ||
      wire.includes(":") ||
      coin.startsWith("#") ||
      wire.startsWith("#") ||
      wire.startsWith("@") ||
      wire.includes("/");
    const keys = exact ? [wire, coin] : [wire, coin, `${coin}/USDC`, `${coin}-USDC`];
    for (const key of keys) {
      if (!key) continue;
      const n = Number(mids[key] ?? mids[key.toUpperCase()]);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  const fallback = Number(market.mid);
  return Number.isFinite(fallback) ? fallback : 0;
}

export function overlayMarketMids<T extends { coin: string; wire?: string; mid: number }>(
  markets: T[],
  mids: HypMids | undefined,
): T[] {
  if (!mids) return markets;
  let changed = false;
  const next = markets.map((row) => {
    const mid = midFromTape(mids, row);
    if (mid === row.mid) return row;
    changed = true;
    return { ...row, mid };
  });
  return changed ? next : markets;
}

/**
 * Desk perps: canonical tickers plus HIP-3 (`xyz:AAPL`). Drop spots, prediction
 * ids, and quote coins. HIP-3 marks come from metaAndAssetCtxs when allMids
 * has no dex key.
 */
export function isListedPerpCoin(coin: string): boolean {
  if (!coin || coin.startsWith("@") || coin.startsWith("#")) return false;
  const base = coin.includes(":") ? coin.slice(coin.indexOf(":") + 1) : coin;
  if (!base || !/[A-Za-z]/.test(base)) return false;
  const upper = base.toUpperCase();
  return upper !== "USDC" && upper !== "USDT";
}

/** @deprecated Use `isListedPerpCoin`. */
export function isPerpTapeCoin(coin: string): boolean {
  return isListedPerpCoin(coin);
}

/**
 * Overlay live `allMids` prices onto the perp catalog (canonical + HIP-3).
 * HIP-4 hash ids live on the Outcomes book.
 */
export function mergeTapePerps<T extends { coin: string; wire?: string; mid: number; max_leverage: number }>(
  catalog: T[],
  mids: HypMids | undefined,
): T[] {
  return overlayMarketMids(catalog.filter((row) => isListedPerpCoin(row.coin)), mids);
}
