/**
 * Geometry for the inline SVG equity curve on account statements. Pure.
 */
import type { EquityPoint } from "@/lib/propfund/types";

export type ChartReference = { id: string; value: number };

export type EquityChartGeometry = {
  /** SVG path `d` for the line (empty when there are no points). */
  line: string;
  /** Closed path for the area fill under the line. */
  area: string;
  /** y coordinate per reference, in the same order. Null when outside the range. */
  references: { id: string; value: number; y: number }[];
  min: number;
  max: number;
};

export function equityChartGeometry(
  points: readonly EquityPoint[],
  opts: { width: number; height: number; padding?: number; references?: readonly ChartReference[] },
): EquityChartGeometry {
  const { width, height } = opts;
  const pad = opts.padding ?? 8;
  const refs = opts.references ?? [];
  if (points.length === 0) return { line: "", area: "", references: [], min: 0, max: 0 };

  const values = [...points.map((p) => p.equity), ...refs.map((r) => r.value)];
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (max - min < 1e-9) {
    min -= 1;
    max += 1;
  }
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const spanT = t1 - t0;

  const x = (t: number, i: number) =>
    pad + (spanT > 0 ? ((t - t0) / spanT) : points.length > 1 ? i / (points.length - 1) : 0.5) * (width - 2 * pad);
  const y = (v: number) => pad + (1 - (v - min) / (max - min)) * (height - 2 * pad);
  const r = (n: number) => Math.round(n * 100) / 100;

  const coords = points.map((p, i) => [r(x(p.t, i)), r(y(p.equity))] as const);
  // A single point draws a flat segment across the chart.
  const drawn = coords.length === 1 ? [[pad, coords[0][1]] as const, [width - pad, coords[0][1]] as const] : coords;

  const line = drawn.map(([cx, cy], i) => `${i === 0 ? "M" : "L"}${cx} ${cy}`).join(" ");
  const bottom = r(height - pad);
  const area = `${line} L${drawn[drawn.length - 1][0]} ${bottom} L${drawn[0][0]} ${bottom} Z`;

  return {
    line,
    area,
    references: refs.map((ref) => ({ id: ref.id, value: ref.value, y: r(y(ref.value)) })),
    min,
    max,
  };
}
