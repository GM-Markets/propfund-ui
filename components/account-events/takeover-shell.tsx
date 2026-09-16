"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, type LucideIcon } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const iconVariants = cva("flex size-11 shrink-0 items-center justify-center rounded-full", {
  variants: {
    tone: {
      danger: "bg-destructive/15 text-destructive",
      success: "bg-success/15 text-success",
      warning: "bg-warning/15 text-warning",
    },
  },
  defaultVariants: { tone: "danger" },
});

/**
 * Full-attention screen over the terminal for account events (PRD §7, §8, §9).
 * Radix Dialog: focus trap, Esc dismisses. Clicking outside does not, so the
 * event isn't lost by accident.
 */
export function TakeoverShell({
  icon: Icon,
  tone,
  eyebrow,
  title,
  description,
  onDismiss,
  dismissLabel = "Back to terminal",
  children,
  footer,
  testId,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  onDismiss: () => void;
  dismissLabel?: string;
  children?: React.ReactNode;
  footer: React.ReactNode;
  testId?: string;
} & VariantProps<typeof iconVariants>) {
  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent
        hideClose
        onInteractOutside={(e) => e.preventDefault()}
        data-testid={testId}
        className="flex max-h-[calc(100dvh-2rem)] max-w-xl flex-col gap-0 overflow-hidden p-0"
      >
        <div className="flex items-start gap-4 border-b border-border px-5 py-5 sm:px-6">
          <span className={iconVariants({ tone })}>
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
            <DialogTitle className="mt-1 text-xl leading-tight">{title}</DialogTitle>
            {description ? (
              <DialogDescription className="mt-1.5 text-sm">{description}</DialogDescription>
            ) : (
              <DialogDescription className="sr-only">{eyebrow}</DialogDescription>
            )}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className="-mr-1 -mt-1 rounded-md p-1.5 text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        <div className={cn("flex flex-col gap-2 border-t border-border px-5 py-4 sm:px-6")}>{footer}</div>
      </DialogContent>
    </Dialog>
  );
}

/** Label / value pairs in a tight grid. */
export function FactGrid({ items, columns = 2 }: { items: { label: string; value: React.ReactNode; tone?: "danger" | "success" }[]; columns?: 2 | 4 }) {
  return (
    <dl className={cn("grid gap-px overflow-hidden rounded-lg border border-border bg-border", columns === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2")}>
      {items.map((it) => (
        <div key={it.label} className="min-w-0 bg-popover px-3 py-2.5">
          <dt className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{it.label}</dt>
          <dd
            className={cn(
              "mt-0.5 break-words font-mono text-sm font-semibold tabular-nums",
              it.tone === "danger" && "text-destructive",
              it.tone === "success" && "text-success",
            )}
          >
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
