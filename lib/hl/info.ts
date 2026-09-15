import { hyperliquidInfoUrl } from "@/lib/hl/all-mids";

export type HlCatalogMarket = {
  coin: string;
  wire: string;
  mid: number;
  max_leverage: number;
};

const INFO_TIMEOUT_MS = 15_000;

type RawUniverseRow = { name?: unknown; maxLeverage?: unknown };
type RawCtx = { midPx?: unknown; markPx?: unknown; coin?: unknown };
type RawSpotToken = { name?: unknown; index?: unknown };
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
    out.push({ coin, wire: coin, mid: mid > 0 ? mid : 0, max_leverage: maxLeverage });
  });
  return out;
}

export function parseSpotCatalog(payload: unknown): HlCatalogMarket[] {
  const meta = Array.isArray(payload) ? payload[0] : payload;
  const ctxs = Array.isArray(payload) && Array.isArray(payload[1]) ? payload[1] : [];
  const tokens = new Map<number, string>();
  const rawTokens = Array.isArray((meta as { tokens?: unknown })?.tokens)
    ? ((meta as { tokens: RawSpotToken[] }).tokens)
    : [];
  rawTokens.forEach((row, position) => {
    const index = asNumber(row.index) ?? position;
    const name = asName(row.name);
    if (name) tokens.set(index, name);
  });
  const pairs = Array.isArray((meta as { universe?: unknown })?.universe)
    ? ((meta as { universe: RawSpotPair[] }).universe)
    : [];
  const out: HlCatalogMarket[] = [];
  pairs.forEach((pair, position) => {
    const ids = Array.isArray(pair.tokens) ? pair.tokens : [];
    const base = tokens.get(Number(ids[0])) ?? "";
    const quote = (tokens.get(Number(ids[1])) ?? "").toUpperCase();
    if (!base || quote !== "USDC" || base.toUpperCase() === "USDC") return;
    const spotIndex = asNumber(pair.index);
    const pairName = asName(pair.name);
    const ctx = (ctxs[position] ?? {}) as RawCtx;
    const wire = asName(ctx.coin) || pairName || (spotIndex != null ? `@${spotIndex}` : "");
    const mid = asNumber(ctx.midPx) ?? asNumber(ctx.markPx) ?? 0;
    out.push({ coin: base.toUpperCase(), wire, mid: mid > 0 ? mid : 0, max_leverage: 1 });
  });
  return out.sort((a, b) => a.coin.localeCompare(b.coin));
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
  return [...canonical, ...hip3].sort((a, b) => a.coin.localeCompare(b.coin));
}

export async function fetchHlSpotCatalog(): Promise<HlCatalogMarket[]> {
  return parseSpotCatalog(
    await postInfo<[Record<string, unknown>, RawCtx[]]>({ type: "spotMetaAndAssetCtxs" }),
  );
}
