/**
 * Chart adapters for the terminal and account screens: theme colours from the
 * CSS tokens, price formats from tick sizes, a synthetic volume strip for the
 * simulated candles, and SVG geometry for small equity curves. Pure functions.
 */
import { decimalsForTick } from "@/lib/propfund/format";

type CandleLike = { time: number; open: number; high: number; low: number; close: number };

/**
 * Convert an HSL token value as written in globals.css ("222 28% 5%" or
 * "210 40% 92% / 0.08") to `rgba(r, g, b, a)`. Returns null when unparsable.
 */
export function hslTokenToRgba(token: string, alpha?: number): string | null {
  const m = token.trim().match(/^(-?[\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*\/\s*([\d.]+%?))?$/);
  if (!m) return null;
  const h = (((Number(m[1]) % 360) + 360) % 360) / 360;
  const s = Math.min(1, Number(m[2]) / 100);
  const l = Math.min(1, Number(m[3]) / 100);
  let a = 1;
  if (m[4] !== undefined) a = m[4].endsWith("%") ? Number(m[4].slice(0, -1)) / 100 : Number(m[4]);
  if (alpha !== undefined) a = alpha;
  const hue = (p: number, q: number, t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  let r = l;
  let g = l;
  let b = l;
  if (s > 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  const to255 = (v: number) => Math.round(v * 255);
  const alphaStr = Math.round(Math.min(1, Math.max(0, a)) * 1000) / 1000;
  return `rgba(${to255(r)}, ${to255(g)}, ${to255(b)}, ${alphaStr})`;
}

/** lightweight-charts price format for a market tick size. */
export function priceFormatForTick(tickSize: number): { type: "price"; precision: number; minMove: number } {
  return { type: "price", precision: decimalsForTick(tickSize), minMove: tickSize };
}

/** Deterministic 0–1 hash of a string (FNV-1a). */
function hash01(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0xffffffff;
}

/**
 * Simulated volume for a candle: stable for a given symbol and bar time (so it
 * doesn't jump on every tick), larger on wider bars.
 */
export function syntheticVolume(symbol: string, candle: CandleLike): number {
  const base = 0.35 + hash01(`${symbol}:${candle.time}`) * 0.65;
  const range = candle.close > 0 ? (candle.high - candle.low) / candle.close : 0;
  return Math.round(base * (1 + Math.min(range * 400, 3)) * 1000);
}

export type VolumeBar = { time: number; value: number; color: string };

export function toVolumeBar(symbol: string, candle: CandleLike, upColor: string, downColor: string): VolumeBar {
  return {
    time: candle.time,
    value: syntheticVolume(symbol, candle),
    color: candle.close >= candle.open ? upColor : downColor,
  };
}

export function toLinePoint(candle: CandleLike): { time: number; value: number } {
  return { time: candle.time, value: candle.close };
}

/**
 * How to push a new candle array into a series that last received `prev`:
 * `update` when only the last bar changed or one bar was appended, `set` for
 * anything else (new symbol, new timeframe, history regenerated).
 */
export function candleSyncMode(
  prev: readonly CandleLike[] | null,
  next: readonly CandleLike[],
): "set" | "update" | "none" {
  if (prev === next) return "none";
  if (!next.length) return prev?.length ? "set" : "none";
  if (!prev || !prev.length) return "set";
  const prevLast = prev[prev.length - 1];
  const nextLast = next[next.length - 1];
  if (prev[0].time !== next[0].time) return "set";
  if (next.length === prev.length && nextLast.time === prevLast.time) return "update";
  if (next.length === prev.length + 1 && next[next.length - 2].time === prevLast.time) return "update";
  return "set";
}

export type CurveGeometry = {
  line: string;
  area: string;
  min: number;
  max: number;
  /** Map a value to a y coordinate inside the box. */
  y: (value: number) => number;
};

/**
 * SVG paths for an equity curve in a `width × height` box. `include` extends
 * the vertical range (e.g. the breach level) so reference lines stay visible.
 */
export function equityCurveGeometry(
  points: readonly { t: number; equity: number }[],
  width: number,
  height: number,
  opts: { padding?: number; include?: readonly number[] } = {},
): CurveGeometry | null {
  if (!points.length || width <= 0 || height <= 0) return null;
  const pad = opts.padding ?? 4;
  const values = [...points.map((p) => p.equity), ...(opts.include ?? [])];
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (max === min) {
    const bump = Math.max(1, Math.abs(max) * 0.001);
    min -= bump;
    max += bump;
  }
  const series = points.length === 1 ? [points[0], { ...points[0], t: points[0].t + 1 }] : points;
  const t0 = series[0].t;
  const t1 = series[series.length - 1].t;
  const spanT = t1 - t0 || 1;
  const x = (t: number) => pad + ((t - t0) / spanT) * (width - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / (max - min)) * (height - pad * 2);
  const coords = series.map((p) => `${x(p.t).toFixed(2)},${y(p.equity).toFixed(2)}`);
  const line = `M${coords.join("L")}`;
  const bottom = (height - pad).toFixed(2);
  const area = `${line}L${x(t1).toFixed(2)},${bottom}L${x(t0).toFixed(2)},${bottom}Z`;
  return { line, area, min, max, y };
}
