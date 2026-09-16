import { cva, type VariantProps } from "class-variance-authority";

import { meterFillPct } from "@/lib/propfund/terminal";
import { cn } from "@/lib/utils";

const meterFillVariants = cva("h-full rounded-full transition-[width,background-color] duration-300", {
  variants: {
    tone: {
      neutral: "bg-foreground/55",
      amber: "bg-warning",
      red: "bg-destructive",
      progress: "bg-success",
    },
  },
  defaultVariants: { tone: "neutral" },
});

/** Thin meter bar. Tone comes from the rules (`LimitMeter.tone`), or `progress` for the target. */
export function MeterBar({
  value,
  tone,
  label,
  className,
}: {
  /** 0–1 */
  value: number;
  label: string;
  className?: string;
} & VariantProps<typeof meterFillVariants>) {
  const pct = meterFillPct(value);
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn("h-1 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div className={meterFillVariants({ tone })} style={{ width: `${pct}%` }} />
    </div>
  );
}
