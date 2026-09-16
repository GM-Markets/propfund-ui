import * as React from "react";

import { formatUsd } from "@/lib/propfund/format";
import type { EquityPoint } from "@/lib/propfund/types";
import { equityChartGeometry, type ChartReference } from "@/lib/propfund/view/equity-chart";
import { cn } from "@/lib/utils";

const W = 640;
const H = 200;

export type EquityCurveReference = ChartReference & { label: string; tone: "muted" | "success" | "destructive" };

const REF_STROKE: Record<EquityCurveReference["tone"], string> = {
  muted: "hsl(var(--muted-foreground) / 0.5)",
  success: "hsl(var(--success) / 0.7)",
  destructive: "hsl(var(--destructive) / 0.7)",
};

/** Inline SVG equity curve with reference lines (baseline, target, max-loss floor). */
export function EquityCurve({
  points,
  references = [],
  className,
}: {
  points: readonly EquityPoint[];
  references?: readonly EquityCurveReference[];
  className?: string;
}) {
  const gradientId = React.useId();
  const g = equityChartGeometry(points, { width: W, height: H, padding: 10, references });

  if (!g.line) {
    return (
      <div className={cn("flex h-[200px] items-center justify-center text-sm text-muted-foreground", className)}>
        No equity data yet.
      </div>
    );
  }

  const last = points[points.length - 1]?.equity ?? 0;
  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-[200px] w-full"
        role="img"
        aria-label={`Equity curve, latest ${formatUsd(last, 2)}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {g.references.map((r, i) => (
          <line
            key={r.id}
            x1={0}
            x2={W}
            y1={r.y}
            y2={r.y}
            stroke={REF_STROKE[references[i].tone]}
            strokeDasharray="4 4"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={g.area} fill={`url(#${gradientId})`} />
        <path
          d={g.line}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {references.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {references.map((r) => (
            <li key={r.id} className="flex items-center gap-1.5">
              <span className="inline-block h-px w-4 border-t border-dashed" style={{ borderColor: REF_STROKE[r.tone] }} />
              {r.label} {formatUsd(r.value)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
