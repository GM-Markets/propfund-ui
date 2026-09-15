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
    for (const key of [market.wire, market.coin, `${market.coin}/USDC`, `${market.coin}-USDC`]) {
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

export function isPerpTapeCoin(coin: string): boolean {
  if (!coin || coin.startsWith("@")) return false;
  const upper = coin.toUpperCase();
  return upper !== "USDC" && upper !== "USDT";
}

/**
 * Catalog plus every perp on the live `allMids` tape. The picker must not
 * stay on the 4-coin fallback when the websocket is already streaming.
 */
export function mergeTapePerps<T extends { coin: string; wire?: string; mid: number; max_leverage: number }>(
  catalog: T[],
  mids: HypMids | undefined,
): T[] {
  const byCoin = new Map<string, T>();
  for (const row of overlayMarketMids(catalog, mids)) {
    byCoin.set(row.coin, row);
  }
  if (mids) {
    for (const [coin, px] of Object.entries(mids)) {
      if (!isPerpTapeCoin(coin) || byCoin.has(coin)) continue;
      const mid = Number(px);
      if (!(mid > 0)) continue;
      byCoin.set(coin, { coin, wire: coin, mid, max_leverage: 50 } as T);
    }
  }
  return [...byCoin.values()].sort((a, b) => a.coin.localeCompare(b.coin));
}
