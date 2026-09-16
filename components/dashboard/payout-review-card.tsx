"use client";

import Link from "next/link";
import { ArrowRight, Hourglass } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDayDate, formatUsd, truncateAddress } from "@/lib/propfund/format";
import { useNow } from "@/lib/propfund/hooks";
import { PAYOUT_REVIEW_DAYS, reviewDay, reviewDayLabel } from "@/lib/propfund/rules";
import type { Payout } from "@/lib/propfund/types";
import { cn } from "@/lib/utils";

/** "Day 3 of 7 · pays Tue 22 Sep" with a day-of-7 progress bar (PRD §10 Payouts). */
export function PayoutReviewCard({
  payout,
  showLink = false,
  className,
}: {
  payout: Payout;
  showLink?: boolean;
  className?: string;
}) {
  const now = useNow(30_000);
  const day = now === undefined ? null : reviewDay(payout.requestedAt, now);

  return (
    <Card className={cn("p-5", className)} data-testid="payout-review-card">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex size-7 items-center justify-center rounded-md bg-warning/15 text-warning">
          <Hourglass className="size-4" aria-hidden="true" />
        </span>
        Payout under review
      </div>
      <div className="mt-3 h-5 text-sm text-foreground">
        {now === undefined ? (
          <Skeleton className="h-5 w-44" />
        ) : (
          <span data-testid="payout-review-label">
            {reviewDayLabel(payout.requestedAt, now)} · pays {formatDayDate(payout.paysAt)}
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label="Review progress"
        aria-valuemin={0}
        aria-valuemax={PAYOUT_REVIEW_DAYS}
        aria-valuenow={day ?? 0}
        className="mt-3 grid h-2 gap-1"
        style={{ gridTemplateColumns: `repeat(${PAYOUT_REVIEW_DAYS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: PAYOUT_REVIEW_DAYS }).map((_, i) => (
          <span
            key={i}
            className={cn("rounded-full", day !== null && i < day ? "bg-warning" : "bg-muted")}
          />
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">You receive</dt>
          <dd className="mt-0.5 font-mono font-medium tabular-nums">{formatUsd(payout.traderUsd, 2)} USDC</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">To (Arbitrum)</dt>
          <dd className="mt-0.5 truncate font-mono tabular-nums" title={payout.address}>
            {truncateAddress(payout.address)}
          </dd>
        </div>
      </dl>
      {showLink && (
        <Link
          href="/dashboard/payouts"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View payouts
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      )}
    </Card>
  );
}
