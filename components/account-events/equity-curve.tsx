"use client";

import * as React from "react";

import { equityCurveGeometry } from "@/lib/propfund/chart-data";
import { formatUsd } from "@/lib/propfund/format";
import type { EquityPoint } from "@/lib/propfund/types";
import { cn } from "@/lib/utils";

const W = 600;
const H = 140;

/** Small SVG equity curve with optional reference lines (baseline, breach level). */
export function EquityCurve({
  points,
  references = [],
  tone = "neutral",
  className,
}: {
  points: readonly EquityPoint[];
  references?: readonly { value: number; label: string; tone: "danger" | "muted" }[];
  tone?: "neutral" | "danger" | "success";
  className?: string;
}) {
  const gradientId = `eq-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const geometry = equityCurveGeometry(points, W, H, { padding: 8, include: references.map((r) => r.value) });
  if (!geometry) {
    return <div className={cn("flex h-36 items-center justify-center rounded-lg border border-border text-xs text-muted-foreground", className)}>No equity history yet.</div>;
  }
  const stroke = tone === "danger" ? "hsl(var(--destructive))" : tone === "success" ? "hsl(var(--success))" : "hsl(var(--primary))";

  return (
    <figure className={cn("relative overflow-hidden rounded-lg border border-border bg-background/40", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-36 w-full" role="img" aria-label="Account equity over time">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {references.map((r) => (
          <line
            key={r.label}
            x1={0}
            x2={W}
            y1={geometry.y(r.value)}
            y2={geometry.y(r.value)}
            stroke={r.tone === "danger" ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))"}
            strokeOpacity={r.tone === "danger" ? 0.8 : 0.4}
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={geometry.area} fill={`url(#${gradientId})`} />
        <path d={geometry.line} fill="none" stroke={stroke} strokeWidth={1.75} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      {references.length > 0 && (
        <figcaption className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-3 py-1.5 font-mono text-[10px] tabular-nums text-muted-foreground">
          {references.map((r) => (
            <span key={r.label} className="flex items-center gap-1.5">
              <span className={cn("h-px w-3 border-t border-dashed", r.tone === "danger" ? "border-destructive" : "border-muted-foreground")} />
              {r.label} {formatUsd(r.value)}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
