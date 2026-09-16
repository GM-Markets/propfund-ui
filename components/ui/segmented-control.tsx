"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Single-choice segmented control (radio group semantics, arrow-key
 * navigation). Each option can carry its own active tone, e.g. Buy green and
 * Sell red.
 */

const segmentVariants = cva(
  "relative flex-1 whitespace-nowrap rounded-[calc(var(--radius)-4px)] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      tone: {
        neutral:
          "data-[state=on]:bg-foreground/[0.12] data-[state=on]:text-foreground data-[state=on]:ring-1 data-[state=on]:ring-inset data-[state=on]:ring-foreground/20",
        buy: "data-[state=on]:bg-success data-[state=on]:text-success-foreground",
        sell: "data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground",
      },
      size: {
        sm: "h-7 px-2.5 text-xs",
        md: "h-9 px-3 text-sm",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export type SegmentOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  tone?: VariantProps<typeof segmentVariants>["tone"];
};

export interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
  size?: VariantProps<typeof segmentVariants>["size"];
  "aria-label": string;
  className?: string;
}

function SegmentedControlInner<T extends string>(
  { value, onValueChange, options, size, className, ...aria }: SegmentedControlProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onValueChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={aria["aria-label"]}
      className={cn("flex w-full gap-0.5 rounded-lg bg-muted/70 p-0.5 text-muted-foreground", className)}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            data-state={on ? "on" : "off"}
            onClick={() => onValueChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(segmentVariants({ tone: o.tone, size }), !on && "hover:text-foreground")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const SegmentedControl = React.forwardRef(SegmentedControlInner) as <T extends string>(
  props: SegmentedControlProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => ReturnType<typeof SegmentedControlInner>;
(SegmentedControl as { displayName?: string }).displayName = "SegmentedControl";

export { SegmentedControl, segmentVariants };
