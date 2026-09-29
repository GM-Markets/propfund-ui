"use client";

import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

const TICKS = [0, 25, 50, 75, 100] as const;

export function SizePctSlider({
  value,
  disabled,
  onChange,
  ariaLabel,
}: {
  value: number;
  disabled?: boolean;
  onChange: (pct: number) => void;
  ariaLabel: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={cn("flex items-center gap-3", disabled && "pointer-events-none opacity-40")}>
      <span
        className="relative h-6 min-w-0 flex-1"
        style={{ "--pct": pct } as CSSProperties}
      >
        <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" aria-hidden />
        <span
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
        {TICKS.map((tick) => (
          <span
            key={tick}
            aria-hidden
            className={cn(
              "absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
              pct >= tick ? "bg-primary" : "bg-muted-foreground/40",
            )}
            style={{ left: `${tick}%` }}
          />
        ))}
        <span
          aria-hidden
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-card"
          style={{ left: `${pct}%` }}
        />
        <input
          type="range"
          className="absolute inset-0 z-10 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          min={0}
          max={100}
          step={1}
          value={pct}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={ariaLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${pct} percent`}
        />
      </span>
      <span className="w-10 text-right font-mono text-xs tabular-nums text-muted-foreground">{pct}%</span>
    </div>
  );
}
