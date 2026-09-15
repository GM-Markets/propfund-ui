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
    const bare = coin.includes(":") ? coin.slice(coin.indexOf(":") + 1) : coin;
    for (const key of [market.wire, coin, bare, `${coin}/USDC`, `${coin}-USDC`, `${bare}/USDC`]) {
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
 * Canonical live perps only. HIP-3 builder books (`hyna:FIX`, `xyz:GOLD`, `flx:…`)
 * are not on the public allMids tape and must stay out of the picker.
 */
export function isListedPerpCoin(coin: string): boolean {
  if (!coin || coin.includes(":") || coin.startsWith("@") || coin.startsWith("#")) return false;
  if (!/[A-Za-z]/.test(coin)) return false;
  const upper = coin.toUpperCase();
  return upper !== "USDC" && upper !== "USDT";
}

/** @deprecated Use `isListedPerpCoin`. */
export function isPerpTapeCoin(coin: string): boolean {
  return isListedPerpCoin(coin);
}

/**
 * Overlay live `allMids` prices onto the Hyperliquid meta catalog.
 * Drop builder-dex and prediction-market ids — they have no live tape.
 */
export function mergeTapePerps<T extends { coin: string; wire?: string; mid: number; max_leverage: number }>(
  catalog: T[],
  mids: HypMids | undefined,
): T[] {
  return overlayMarketMids(catalog.filter((row) => isListedPerpCoin(row.coin)), mids);
}
