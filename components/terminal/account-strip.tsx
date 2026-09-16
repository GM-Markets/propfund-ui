"use client";

import * as React from "react";
import Link from "next/link";
import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatSignedPct, formatSignedUsd, formatUsd } from "@/lib/propfund/format";
import { useAccountMetrics, useCurrentAccount, useNow } from "@/lib/propfund/hooks";
import { OUTCOME_LABEL, PHASE_LABEL, getPackage, nextUtcMidnight } from "@/lib/propfund/rules";
import { formatCompactUsd } from "@/lib/propfund/terminal";
import type { Account, AccountMetrics } from "@/lib/propfund/types";
import { cn } from "@/lib/utils";

import { MeterBar } from "./meter-bar";

/**
 * Account strip (PRD §10.3): phase, equity, today's P&L, total P&L vs B, the
 * daily and max loss meters and target progress (challenge only). Desktop is
 * one row; below lg it wraps into two rows of three, never scrolling sideways.
 */

const CELL = "flex h-[62px] min-w-0 flex-col justify-center gap-1 bg-background px-3 lg:h-auto lg:px-4";
const LABEL = "truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground";
const VALUE = "truncate font-mono text-sm font-semibold tabular-nums lg:text-[15px]";

function pnlTone(n: number) {
  return n > 0 ? "text-success" : n < 0 ? "text-destructive" : "text-foreground";
}

export function AccountStripSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-3 gap-px bg-border lg:flex lg:h-[60px]">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={cn(CELL, i < 3 ? "lg:w-36 lg:flex-none" : "lg:flex-1")}>
          <Skeleton className="h-2.5 w-14" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function AccountStrip() {
  const account = useCurrentAccount();
  const metrics = useAccountMetrics(account?.id);

  if (account === undefined || (account && metrics === undefined)) return <AccountStripSkeleton />;

  if (!account || !metrics) {
    return (
      <div className="flex h-[125px] items-center justify-between gap-3 bg-background px-4 lg:h-[60px]">
        <div className="min-w-0">
          <p className="text-sm font-medium">No account yet</p>
          <p className="text-xs text-muted-foreground">Buy a challenge to start trading. Prices below are live.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/challenges">Buy a challenge</Link>
        </Button>
      </div>
    );
  }

  return <StripContent account={account} metrics={metrics} />;
}

function StripContent({ account, metrics }: { account: Account; metrics: AccountMetrics }) {
  const pkg = getPackage(account.packageId);
  const active = account.status === "active";
  const totalPct = metrics.baseline > 0 ? metrics.totalPnl / metrics.baseline : 0;

  return (
    <div
      data-testid="account-strip"
      className="grid grid-cols-3 gap-px bg-border lg:flex lg:h-[60px]"
    >
      <div className={cn(CELL, "lg:w-40 lg:flex-none")}>
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={LABEL}>Equity</span>
          <Badge
            variant={!active ? "destructive" : account.phase === "funded" ? "success" : "default"}
            className="hidden h-4 shrink-0 px-1.5 py-0 text-[10px] leading-none sm:inline-flex"
          >
            {active ? PHASE_LABEL[account.phase] : OUTCOME_LABEL[account.status]}
          </Badge>
        </div>
        <span className={VALUE} data-testid="strip-equity">
          {formatUsd(metrics.equity, 2)}
        </span>
      </div>

      <div className={cn(CELL, "lg:w-32 lg:flex-none")}>
        <span className={LABEL}>Today&apos;s P&amp;L</span>
        <span className={cn(VALUE, pnlTone(metrics.todayPnl))}>{formatSignedUsd(metrics.todayPnl)}</span>
      </div>

      <div className={cn(CELL, "lg:w-44 lg:flex-none")}>
        <span className={LABEL} title={`Versus baseline ${formatUsd(metrics.baseline)}`}>
          Total P&amp;L
          <span className="hidden normal-case tracking-normal xl:inline"> · {pkg ? pkg.name : ""} {formatCompactUsd(account.accountSize)}</span>
        </span>
        <span className={cn(VALUE, pnlTone(metrics.totalPnl))}>
          {formatSignedUsd(metrics.totalPnl)}
          <span className="ml-1.5 hidden text-[11px] font-medium opacity-80 sm:inline">{formatSignedPct(totalPct)}</span>
        </span>
      </div>

      <DailyMeterCell metrics={metrics} />

      <div className={cn(CELL, "lg:min-w-40 lg:flex-1")}>
        <div className="flex min-w-0 flex-col 2xl:flex-row 2xl:items-baseline 2xl:justify-between 2xl:gap-2">
          <span className={LABEL}>Max loss</span>
          <span className="truncate font-mono text-[11px] tabular-nums text-muted-foreground">
            <span className="text-foreground lg:hidden">{formatCompactUsd(metrics.max.remainingUsd)}</span>
            <span className="hidden text-foreground lg:inline">{formatUsd(metrics.max.remainingUsd)}</span>
            <span className="hidden sm:inline"> to floor</span>
          </span>
        </div>
        <MeterBar value={metrics.max.used} tone={metrics.max.tone} label="Max loss limit used" />
        <span className="hidden truncate font-mono text-[10px] tabular-nums text-muted-foreground 2xl:block">
          Floor {formatUsd(metrics.max.breachAt)} · {Math.round(metrics.max.used * 100)}% used
        </span>
      </div>

      {metrics.target ? (
        <div className={cn(CELL, "lg:min-w-40 lg:flex-1")}>
          <div className="flex min-w-0 flex-col 2xl:flex-row 2xl:items-baseline 2xl:justify-between 2xl:gap-2">
            <span className={LABEL}>Target</span>
            <span className="truncate font-mono text-[11px] tabular-nums text-muted-foreground">
              {Math.round(metrics.target.progress * 100)}%
            </span>
          </div>
          <MeterBar value={metrics.target.progress} tone="progress" label="Progress to profit target" />
          <span className="hidden truncate font-mono text-[10px] tabular-nums text-muted-foreground 2xl:block">
            {formatUsd(Math.max(0, metrics.equity - metrics.baseline))} of {formatUsd(metrics.target.level - metrics.baseline)} · +10%
          </span>
        </div>
      ) : (
        <div className={cn(CELL, "lg:min-w-40 lg:flex-1")}>
          <span className={LABEL}>Realized profit</span>
          <span className={cn(VALUE, pnlTone(metrics.realizedProfit))}>{formatSignedUsd(metrics.realizedProfit)}</span>
        </div>
      )}
    </div>
  );
}

function DailyMeterCell({ metrics }: { metrics: AccountMetrics }) {
  const [open, setOpen] = React.useState(false);
  const { daily } = metrics;
  return (
    <div className={cn(CELL, "lg:min-w-44 lg:flex-1")}>
      <div className="flex min-w-0 flex-col 2xl:flex-row 2xl:items-baseline 2xl:justify-between 2xl:gap-2">
        <span className="flex min-w-0 items-center gap-1">
          <span className={LABEL}>Daily loss</span>
          <Tooltip open={open} onOpenChange={setOpen} delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="How the daily loss limit works"
                onClick={() => setOpen((o) => !o)}
                className="-m-1 rounded p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <Info className="size-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" className="max-w-72 text-pretty leading-relaxed">
              <DailyTooltip metrics={metrics} />
            </TooltipContent>
          </Tooltip>
        </span>
        <span className="truncate font-mono text-[11px] tabular-nums text-muted-foreground">
          <span className="text-foreground lg:hidden">{formatCompactUsd(daily.usedUsd)}</span>
          <span className="hidden text-foreground lg:inline">{formatUsd(daily.usedUsd)}</span>
          <span className="lg:hidden"> / {formatCompactUsd(daily.limit)}</span>
          <span className="hidden lg:inline"> of {formatUsd(daily.limit)}</span>
        </span>
      </div>
      <MeterBar value={daily.used} tone={daily.tone} label="Daily loss limit used" />
      <span className="hidden truncate font-mono text-[10px] tabular-nums text-muted-foreground 2xl:block">
        Breach at {formatUsd(daily.breachAt)} · {formatUsd(daily.remainingUsd)} left
      </span>
    </div>
  );
}

function DailyTooltip({ metrics }: { metrics: AccountMetrics }) {
  const now = useNow(15_000);
  const reset = now === undefined ? null : nextUtcMidnight(now) - now;
  const h = reset === null ? 0 : Math.floor(reset / 3_600_000);
  const m = reset === null ? 0 : Math.floor((reset % 3_600_000) / 60_000);
  return (
    <div className="space-y-1.5">
      <p>
        Your equity may fall up to <strong className="font-semibold">{formatUsd(metrics.daily.limit)}</strong> (3% of your
        baseline) below today&apos;s start-of-day balance (SOD).
      </p>
      <p className="font-mono tabular-nums text-muted-foreground">
        SOD {formatUsd(metrics.sod, 2)} · breach at {formatUsd(metrics.daily.breachAt, 2)}
      </p>
      <p className="text-muted-foreground">
        SOD resets to your balance at 00:00 UTC{reset !== null ? ` (in ${h}h ${m}m)` : ""}.
      </p>
    </div>
  );
}
