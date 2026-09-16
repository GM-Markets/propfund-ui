"use client";

import Link from "next/link";
import { ArrowRight, CandlestickChart, Flag } from "lucide-react";

import { PhaseBadge } from "@/components/dashboard/badges";
import { LimitMeter } from "@/components/dashboard/limit-meter";
import { Stat, pnlClass } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPct, formatSignedPct, formatSignedUsd, formatUsd } from "@/lib/propfund/format";
import { useAccountMetrics } from "@/lib/propfund/hooks";
import { TARGET_BANNER_COPY, getPackage } from "@/lib/propfund/rules";
import type { Account } from "@/lib/propfund/types";
import { cn } from "@/lib/utils";

/** Fixed-size skeleton shared by the card's loading state and the route skeleton. */
export function ActiveAccountCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-5 sm:p-6", className)} aria-hidden="true">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="hidden h-9 w-32 sm:block" />
      </div>
      <Skeleton className="mt-6 h-4 w-16" />
      <Skeleton className="mt-2 h-9 w-48" />
      <div className="mt-5 grid grid-cols-2 gap-4">
        <Skeleton className="h-14 sm:h-10" />
        <Skeleton className="h-14 sm:h-10" />
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Skeleton className="h-[3.375rem]" />
        <Skeleton className="h-[3.375rem]" />
      </div>
      <Skeleton className="mt-6 h-[3.375rem]" />
      <Skeleton className="mt-6 h-10 sm:hidden" />
    </Card>
  );
}

export function ActiveAccountCard({ account }: { account: Account }) {
  const metrics = useAccountMetrics(account.id);
  const pkg = getPackage(account.packageId);

  if (metrics === undefined) return <ActiveAccountCardSkeleton />;
  if (metrics === null) return null;

  const title = `${pkg?.name ?? "Account"} · ${formatUsd(account.accountSize)}`;
  const targetProfit = metrics.target ? metrics.target.level - metrics.baseline : 0;

  return (
    <Card className="p-5 sm:p-6" data-testid="active-account-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <h2 className="truncate text-base font-semibold tracking-tight">{title}</h2>
          <PhaseBadge phase={account.phase} />
        </div>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/dashboard/terminal">
            <CandlestickChart />
            Open terminal
          </Link>
        </Button>
      </div>

      <div className="mt-6 text-xs text-muted-foreground">Equity</div>
      <div className="mt-1 font-mono text-3xl font-semibold tabular-nums tracking-tight" data-testid="overview-equity">
        {formatUsd(metrics.equity, 2)}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <Stat
          label="Today's P&L"
          value={
            <>
              {formatSignedUsd(metrics.todayPnl)}{" "}
              <span className="block text-xs sm:inline">({formatSignedPct(metrics.todayPnl / metrics.baseline)})</span>
            </>
          }
          valueClassName={pnlClass(metrics.todayPnl)}
        />
        <Stat
          label="Total P&L"
          value={
            <>
              {formatSignedUsd(metrics.totalPnl)}{" "}
              <span className="block text-xs sm:inline">({formatSignedPct(metrics.totalPnl / metrics.baseline)})</span>
            </>
          }
          valueClassName={pnlClass(metrics.totalPnl)}
        />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <LimitMeter label="Daily loss limit" meter={metrics.daily} />
        <LimitMeter label="Max loss limit" meter={metrics.max} />
      </div>

      {metrics.target ? (
        <div className="mt-6">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="font-medium text-foreground/90">Profit target</span>
            <span className="font-mono tabular-nums text-muted-foreground">{formatPct(metrics.target.progress)}</span>
          </div>
          <div
            role="progressbar"
            aria-label="Profit target progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(metrics.target.progress * 100)}
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                metrics.target.reached ? "bg-success" : "bg-primary",
              )}
              style={{ width: `${Math.round(metrics.target.progress * 1000) / 10}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">
              {formatUsd(Math.max(0, metrics.totalPnl), 2)} of {formatUsd(targetProfit)}
            </span>
            <span className="font-mono tabular-nums">reached at {formatUsd(metrics.target.level)}</span>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex h-[3.75rem] items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4">
          <Stat
            label="Realized profit"
            value={formatSignedUsd(metrics.realizedProfit)}
            valueClassName={pnlClass(metrics.realizedProfit)}
          />
          <Link
            href="/dashboard/payouts"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Payouts
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}

      {metrics.showTargetBanner && (
        <p className="mt-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          <Flag className="size-4 shrink-0" aria-hidden="true" />
          {TARGET_BANNER_COPY}
        </p>
      )}

      <Button asChild className="mt-6 w-full sm:hidden">
        <Link href="/dashboard/terminal">
          <CandlestickChart />
          Open terminal
        </Link>
      </Button>
    </Card>
  );
}
