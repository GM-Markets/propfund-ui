import { hyperliquidInfoUrl } from "@/lib/hl/all-mids";
import { parseOutcomeCatalog } from "@/lib/hl/hip4";
import { isQuotedSpotMid, spotDisplayName, spotDisplayTicker, spotPairLabel } from "@/lib/hl/spot";

export type HlCatalogMarket = {
  coin: string;
  wire: string;
  mid: number;
  max_leverage: number;
  /** UI label — HIP-3 shows `AAPL`, Unit spots show `BTC`, HIP-4 shows the question. */
  label?: string;
  dex?: string;
  kind?: "perp" | "hip3" | "hip4" | "spot";
  pair?: string;
  name?: string;
};

const INFO_TIMEOUT_MS = 15_000;

type RawUniverseRow = { name?: unknown; maxLeverage?: unknown };
type RawCtx = { midPx?: unknown; markPx?: unknown; coin?: unknown };
type RawSpotToken = { name?: unknown; index?: unknown; fullName?: unknown };
type RawSpotPair = { name?: unknown; index?: unknown; tokens?: unknown };

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asName(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function qualifyHip3(dex: string, name: string): string {
  if (!name) return "";
  if (name.includes(":")) {
    const colon = name.indexOf(":");
    return `${name.slice(0, colon).toLowerCase()}:${name.slice(colon + 1).toUpperCase()}`;
  }
  return `${dex.toLowerCase()}:${name.toUpperCase()}`;
}

async function postInfo<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch(hyperliquidInfoUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(INFO_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Hyperliquid ${String(body.type)} failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export function parsePerpCatalog(
  payload: unknown,
  dex?: string,
): HlCatalogMarket[] {
  const meta = Array.isArray(payload) ? payload[0] : payload;
  const ctxs = Array.isArray(payload) && Array.isArray(payload[1]) ? payload[1] : [];
  const universe = Array.isArray((meta as { universe?: unknown })?.universe)
    ? ((meta as { universe: RawUniverseRow[] }).universe)
    : [];
  const out: HlCatalogMarket[] = [];
  universe.forEach((row, index) => {
    const raw = asName(row.name);
    if (!raw || raw.startsWith("#") || raw.startsWith("@")) return;
    const coin = dex ? qualifyHip3(dex, raw) : raw;
    const ctx = (ctxs[index] ?? {}) as RawCtx;
    const mid = asNumber(ctx.midPx) ?? asNumber(ctx.markPx) ?? 0;
    const maxLeverage = asNumber(row.maxLeverage);
    if (!(maxLeverage && maxLeverage > 0)) return;
    const dexName = coin.includes(":") ? coin.slice(0, coin.indexOf(":")) : "";
    const label = dexName ? coin.slice(coin.indexOf(":") + 1) : coin;
    out.push({
      coin,
      wire: coin,
      mid: mid > 0 ? mid : 0,
      max_leverage: maxLeverage,
      label,
      kind: dexName ? "hip3" : "perp",
      ...(dexName ? { dex: dexName } : {}),
    });
  });
  return out;
}

export function parseSpotCatalog(payload: unknown): HlCatalogMarket[] {
  const meta = Array.isArray(payload) ? payload[0] : payload;
  const ctxs = Array.isArray(payload) && Array.isArray(payload[1]) ? payload[1] : [];
  const tokens = new Map<number, { name: string; fullName: string }>();
  const rawTokens = Array.isArray((meta as { tokens?: unknown })?.tokens)
    ? ((meta as { tokens: RawSpotToken[] }).tokens)
    : [];
  rawTokens.forEach((row, position) => {
    const index = asNumber(row.index) ?? position;
    const name = asName(row.name);
    if (name) tokens.set(index, { name, fullName: asName(row.fullName) });
  });
  const pairs = Array.isArray((meta as { universe?: unknown })?.universe)
    ? ((meta as { universe: RawSpotPair[] }).universe)
    : [];
  // HL ctxs are not parallel to universe — join on the pair's wire name.
  const contexts = new Map<string, RawCtx>();
  for (const row of ctxs) {
    const ctx = (row ?? {}) as RawCtx;
    const key = asName(ctx.coin);
    if (key && !contexts.has(key)) contexts.set(key, ctx);
  }
  const out: HlCatalogMarket[] = [];
  pairs.forEach((pair, position) => {
    const ids = Array.isArray(pair.tokens) ? pair.tokens : [];
    const baseToken = tokens.get(Number(ids[0]));
    const quoteToken = tokens.get(Number(ids[1]));
    const base = baseToken?.name ?? "";
    const quote = (quoteToken?.name ?? "").toUpperCase();
    if (!base || quote !== "USDC" || base.toUpperCase() === "USDC") return;
    if (isTradFiSpotBase(base)) return;
    const spotIndex = asNumber(pair.index) ?? position;
    const wire = asName(pair.name) || `@${spotIndex}`;
    const ctx = contexts.get(wire) ?? {};
    const mid = asNumber(ctx.midPx) ?? asNumber(ctx.markPx) ?? 0;
    if (!isQuotedSpotMid(mid)) return;
    const symbol = base.toUpperCase();
    out.push({
      coin: symbol,
      wire,
      mid,
      max_leverage: 1,
      label: spotDisplayTicker(symbol, baseToken?.fullName),
      name: spotDisplayName(symbol, baseToken?.fullName),
      pair: spotPairLabel(symbol),
      kind: "spot",
    });
  });
  return out.sort((a, b) => (a.label ?? a.coin).localeCompare(b.label ?? b.coin) || a.coin.localeCompare(b.coin));
}

export function parsePerpDexNames(payload: unknown): string[] {
  if (!Array.isArray(payload)) return [];
  const names: string[] = [];
  for (const entry of payload) {
    if (!entry || typeof entry !== "object") continue;
    const name = asName((entry as { name?: unknown }).name);
    if (name) names.push(name);
  }
  return names;
}

/** Spot tokens that share a ticker with a cash equity / HIP-3 stock perp. */
const TRADFI_SPOT_BASES = new Set([
  "AAPL",
  "TSLA",
  "NVDA",
  "MSFT",
  "AMZN",
  "GOOG",
  "GOOGL",
  "META",
  "NFLX",
  "AMD",
  "INTC",
  "IBM",
  "SPY",
  "QQQ",
  "IWM",
  "DIA",
  "VOO",
  "GOLD",
  "SILVER",
  "OIL",
]);

export function isTradFiSpotBase(name: string): boolean {
  const raw = name.trim().toUpperCase();
  const base = raw.includes(":") ? raw.slice(raw.indexOf(":") + 1) : raw;
  return TRADFI_SPOT_BASES.has(base);
}

export async function fetchHlCanonicalPerps(): Promise<HlCatalogMarket[]> {
  return parsePerpCatalog(
    await postInfo<[Record<string, unknown>, RawCtx[]]>({ type: "metaAndAssetCtxs" }),
  ).sort((a, b) => a.coin.localeCompare(b.coin));
}

export async function fetchHlHip3Perps(): Promise<HlCatalogMarket[]> {
  const dexNames = parsePerpDexNames(await postInfo<unknown>({ type: "perpDexs" }));
  const extras = await Promise.all(
    dexNames.map(async (dex) => {
      try {
        return parsePerpCatalog(
          await postInfo<[Record<string, unknown>, RawCtx[]]>({ type: "metaAndAssetCtxs", dex }),
          dex,
        );
      } catch {
        return [];
      }
    }),
  );
  return extras.flat().sort((a, b) => a.coin.localeCompare(b.coin));
}

export async function fetchHlPerpCatalog(): Promise<HlCatalogMarket[]> {
  const [canonical, hip3] = await Promise.all([
    fetchHlCanonicalPerps(),
    fetchHlHip3Perps().catch(() => [] as HlCatalogMarket[]),
  ]);
  return [...canonical, ...hip3].sort((a, b) => (a.label ?? a.coin).localeCompare(b.label ?? b.coin) || a.coin.localeCompare(b.coin));
}

export async function fetchHlHip4Outcomes(): Promise<HlCatalogMarket[]> {
  const [meta, mids] = await Promise.all([
    postInfo<unknown>({ type: "outcomeMeta" }),
    postInfo<Record<string, string>>({ type: "allMids" }).catch(() => ({}) as Record<string, string>),
  ]);
  return parseOutcomeCatalog(meta, mids);
}

export async function fetchHlSpotCatalog(): Promise<HlCatalogMarket[]> {
  return parseSpotCatalog(
    await postInfo<[Record<string, unknown>, RawCtx[]]>({ type: "spotMetaAndAssetCtxs" }),
  );
}

export type HlCandleInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export type HlCandle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export function parseHlCandles(payload: unknown): HlCandle[] {
  if (!Array.isArray(payload)) return [];
  const out: HlCandle[] = [];
  for (const row of payload) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const t = asNumber(item.t);
    const o = asNumber(item.o);
    const h = asNumber(item.h);
    const l = asNumber(item.l);
    const c = asNumber(item.c);
    const v = asNumber(item.v) ?? 0;
    if (t == null || o == null || h == null || l == null || c == null) continue;
    out.push({ t, o, h, l, c, v });
  }
  return out.sort((a, b) => a.t - b.t);
}

export async function fetchHlCandlesRange(
  coin: string,
  interval: HlCandleInterval,
  startTime: number,
  endTime: number,
): Promise<HlCandle[]> {
  const start = Math.max(0, Math.floor(startTime));
  const end = Math.max(start, Math.floor(endTime));
  return parseHlCandles(
    await postInfo<unknown>({
      type: "candleSnapshot",
      req: { coin, interval, startTime: start, endTime: end },
    }),
  );
}

export async function fetchHlCandles(
  coin: string,
  interval: HlCandleInterval,
  lookbackMs: number,
): Promise<HlCandle[]> {
  const endTime = Date.now();
  return fetchHlCandlesRange(coin, interval, endTime - lookbackMs, endTime);
}
