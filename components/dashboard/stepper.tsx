import { cva } from "class-variance-authority";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import type { StepState } from "@/lib/propfund/view/deposit-steps";
import { cn } from "@/lib/utils";

const dotVariants = cva("flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold", {
  variants: {
    state: {
      complete: "border-success/40 bg-success/15 text-success",
      current: "border-primary/50 bg-primary/15 text-primary",
      upcoming: "border-border bg-muted/40 text-muted-foreground",
      attention: "border-warning/40 bg-warning/15 text-warning",
    },
  },
});

const labelVariants = cva("text-sm", {
  variants: {
    state: {
      complete: "text-foreground",
      current: "font-medium text-foreground",
      upcoming: "text-muted-foreground",
      attention: "font-medium text-warning",
    },
  },
});

export type StepperItem = { id: string; label: string; state: StepState; detail?: string };

/** Vertical status stepper (deposit status, identity verification). */
export function Stepper({
  steps,
  className,
  label,
  spinCurrent = true,
}: {
  steps: StepperItem[];
  className?: string;
  label: string;
  /** Spinner on the current step (live status). Off for user-driven steps. */
  spinCurrent?: boolean;
}) {
  return (
    <ol className={cn("flex flex-col", className)} aria-label={label}>
      {steps.map((step, i) => (
        <li key={step.id} className="flex gap-3" aria-current={step.state === "current" ? "step" : undefined}>
          <div className="flex flex-col items-center">
            <span className={dotVariants({ state: step.state })}>
              {step.state === "complete" ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : step.state === "current" && spinCurrent ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : step.state === "attention" ? (
                <AlertCircle className="size-3.5" aria-hidden="true" />
              ) : (
                i + 1
              )}
            </span>
            {i < steps.length - 1 && (
              <span
                className={cn("my-1 w-px flex-1", step.state === "complete" ? "bg-success/40" : "bg-border")}
                aria-hidden="true"
              />
            )}
          </div>
          <div className={cn("min-w-0 pt-0.5", i < steps.length - 1 && "pb-4")}>
            <div className={labelVariants({ state: step.state })}>{step.label}</div>
            {step.detail && <div className="mt-0.5 text-xs text-muted-foreground">{step.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
