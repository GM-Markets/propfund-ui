import * as React from "react";
import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";

/** Noun-label section heading with a short descriptor (e.g. "Recent accounts / Your last five accounts"). */
export function SectionHeading({
  title,
  description,
  action,
  className,
  as: Tag = "h2",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2", className)}>
      <div className="min-w-0">
        <Tag className={cn("font-semibold tracking-tight", Tag === "h2" ? "text-lg" : "text-base")}>{title}</Tag>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Label over a value (stats inside cards). */
export function Stat({
  label,
  value,
  className,
  valueClassName,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 truncate font-mono text-sm font-medium tabular-nums", valueClassName)}>{value}</div>
    </div>
  );
}

/** Label / value row (order summaries, mobile table cards). */
export function Row({
  label,
  value,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-1.5 text-sm", className)}>
      <dt className="min-w-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{value}</dd>
    </div>
  );
}

/** P&L tone: green up, red down, muted flat. */
export function pnlClass(n: number): string {
  if (n > 0.004) return "text-success";
  if (n < -0.004) return "text-destructive";
  return "text-muted-foreground";
}

export function ExternalTextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 font-mono text-primary underline-offset-4 hover:underline",
        className,
      )}
    >
      {children}
      <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
    </a>
  );
}

/** Mobile replacement for a table row: a bordered card of label/value rows. */
export function MobileCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-card p-4", className)}>{children}</div>;
}

/** `1,250.00 USDC` (1 USDC = 1 USDT = $1 for fees, PRD §4). */
export function formatTokenAmount(amount: number, token: string): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${safe.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${token}`;
}
