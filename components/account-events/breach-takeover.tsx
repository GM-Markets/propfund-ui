"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDateTime, formatPct, formatSignedUsd, formatUsd } from "@/lib/propfund/format";
import { PHASE_LABEL, REBUY_DISCOUNT_PCT, getPackage } from "@/lib/propfund/rules";
import { winRate } from "@/lib/propfund/terminal";
import type { Account } from "@/lib/propfund/types";

import { EquityCurve } from "./equity-curve";
import { FactGrid, TakeoverShell } from "./takeover-shell";

const RULE_COPY = {
  daily: { title: "Daily loss limit hit", detail: "Equity reached 3% of the baseline below today's start-of-day balance." },
  max: { title: "Max loss limit hit", detail: "Equity reached the fixed floor 5% below the baseline." },
} as const;

/**
 * Breach screen (PRD §7): the rule hit, when, equity at breach vs the limit,
 * the account's equity curve and stats, and the 20%-off rebuy.
 */
export function BreachTakeover({
  account,
  rebuyOpen = true,
  onDismiss,
}: {
  account: Account;
  /** A rebuy offer is open (false only for barred users). */
  rebuyOpen?: boolean;
  onDismiss: () => void;
}) {
  const breach = account.breach;
  const pkg = getPackage(account.packageId);
  const rule = breach ? RULE_COPY[breach.rule] : null;
  const rate = winRate(account.stats);

  return (
    <TakeoverShell
      testId="breach-takeover"
      icon={ShieldAlert}
      tone="danger"
      eyebrow={`${pkg?.name ?? "Account"} ${formatUsd(account.accountSize)} · ${PHASE_LABEL[account.phase]} breached`}
      title={rule?.title ?? "Account breached"}
      description={rule?.detail}
      onDismiss={onDismiss}
      dismissLabel="Close and view the read-only terminal"
      footer={
        <>
          <Button asChild size="lg" className="w-full" onClick={onDismiss}>
            <Link href="/dashboard/challenges">
              {rebuyOpen ? `Start a new challenge · ${REBUY_DISCOUNT_PCT}% off` : "Buy a challenge"}
            </Link>
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" onClick={onDismiss}>
              <Link href="/dashboard/history">View statement</Link>
            </Button>
            <Button type="button" variant="ghost" onClick={onDismiss}>
              Back to terminal
            </Button>
          </div>
        </>
      }
    >
      {breach && (
        <FactGrid
          items={[
            { label: "Equity at breach", value: formatUsd(breach.equity, 2), tone: "danger" },
            { label: "Limit", value: formatUsd(breach.limit, 2) },
            { label: "Rule", value: breach.rule === "daily" ? "Daily loss (3%)" : "Max loss (5%)" },
            { label: "Time (UTC)", value: formatDateTime(breach.at).replace(" UTC", "") },
          ]}
        />
      )}

      <EquityCurve
        points={account.equityCurve}
        tone="danger"
        references={[
          { value: account.baseline, label: "Baseline", tone: "muted" },
          ...(breach ? [{ value: breach.limit, label: "Limit", tone: "danger" as const }] : []),
        ]}
      />

      <FactGrid
        columns={4}
        items={[
          { label: "Trades", value: account.stats.trades.toLocaleString("en-US") },
          { label: "Win rate", value: rate === null ? "—" : formatPct(rate, 0) },
          { label: "Best trade", value: account.stats.bestTrade > 0 ? formatSignedUsd(account.stats.bestTrade) : "—", tone: account.stats.bestTrade > 0 ? "success" : undefined },
          { label: "Worst trade", value: account.stats.worstTrade < 0 ? formatSignedUsd(account.stats.worstTrade) : "—", tone: account.stats.worstTrade < 0 ? "danger" : undefined },
        ]}
      />

      <p className="text-xs leading-relaxed text-muted-foreground">
        Every position closed at the mark and all orders were cancelled. This account is now read-only. A breach is
        final and the fee isn&apos;t refunded. The {REBUY_DISCOUNT_PCT}% rebuy discount applies to any package and stays open
        until your next purchase.
      </p>
    </TakeoverShell>
  );
}
