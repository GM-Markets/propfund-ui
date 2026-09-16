import { cva } from "class-variance-authority";

import { formatPct, formatUsd } from "@/lib/propfund/format";
import type { LimitMeter as LimitMeterData, MeterTone } from "@/lib/propfund/types";
import { cn } from "@/lib/utils";

const barVariants = cva("h-full rounded-full transition-[width] duration-500", {
  variants: {
    tone: {
      neutral: "bg-foreground/50",
      amber: "bg-warning",
      red: "bg-destructive",
    },
  },
});

const valueVariants = cva("font-mono tabular-nums", {
  variants: {
    tone: {
      neutral: "text-muted-foreground",
      amber: "text-warning",
      red: "text-destructive",
    },
  },
});

/** Loss-limit meter (PRD §7): neutral below 70% used, amber at 70%+, red at 90%+. Tone comes from rules. */
export function LimitMeter({
  label,
  meter,
  className,
}: {
  label: string;
  meter: LimitMeterData;
  className?: string;
}) {
  const tone: MeterTone = meter.tone;
  const pct = Math.round(meter.used * 1000) / 10;
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-foreground/90">
          {label} <span className="font-mono font-normal text-muted-foreground">{formatUsd(meter.limit)}</span>
        </span>
        <span className={valueVariants({ tone })}>{formatPct(meter.used)} used</span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} used`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className={barVariants({ tone })} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <span className="font-mono tabular-nums">{formatUsd(meter.remainingUsd, 2)} left</span>
        <span className="font-mono tabular-nums">breach at {formatUsd(meter.breachAt, 2)}</span>
      </div>
    </div>
  );
}
