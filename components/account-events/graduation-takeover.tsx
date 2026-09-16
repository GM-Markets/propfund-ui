"use client";

import { Check, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/propfund/format";
import {
  MIN_PAYOUT_USD,
  PAYOUT_REVIEW_DAYS,
  PROPFUND_SHARE,
  TRADER_SHARE,
  dailyLossLimit,
  getPackage,
} from "@/lib/propfund/rules";
import type { Account } from "@/lib/propfund/types";

import { FactGrid, TakeoverShell } from "./takeover-shell";

/**
 * Graduation screen (PRD §8): the funded account size, payout rules and
 * "Go to funded account".
 */
export function GraduationTakeover({
  funded,
  challenge,
  onDismiss,
  onContinue,
}: {
  funded: Account;
  challenge?: Account | null;
  onDismiss: () => void;
  /** Defaults to dismissing onto the terminal, which now trades the funded account. */
  onContinue?: () => void;
}) {
  const pkg = getPackage(funded.packageId);
  const rules = [
    `${Math.round(TRADER_SHARE * 100)}% of realized profit is yours, ${Math.round(PROPFUND_SHARE * 100)}% goes to Propfund.`,
    `Request a payout once realized profit is at least ${formatUsd(MIN_PAYOUT_USD)} and the account is flat.`,
    "A one-time identity check is the first step of your first payout request.",
    `Paid in USDC on Arbitrum ${PAYOUT_REVIEW_DAYS} days after you request.`,
    "Same loss limits: 3% daily and 5% max of the baseline. No profit target.",
  ];

  return (
    <TakeoverShell
      testId="graduation-takeover"
      icon={Trophy}
      tone="success"
      eyebrow="Challenge passed"
      title="You're funded"
      description={
        <>
          Your {pkg?.name ?? ""} challenge hit the +10% target. Your funded account opens at {formatUsd(funded.accountSize)}.
        </>
      }
      onDismiss={onDismiss}
      footer={
        <Button type="button" size="lg" className="w-full" onClick={onContinue ?? onDismiss} data-testid="go-to-funded">
          Go to funded account
        </Button>
      }
    >
      <FactGrid
        items={[
          { label: "Funded account", value: formatUsd(funded.accountSize), tone: "success" },
          { label: "Starting baseline", value: formatUsd(funded.baseline) },
          { label: "Daily loss limit", value: formatUsd(dailyLossLimit(funded.baseline)) },
          {
            label: "Challenge ended at",
            value: challenge ? formatUsd(challenge.balance, 2) : "—",
          },
        ]}
      />

      <div>
        <h3 className="text-sm font-semibold">Payout rules</h3>
        <ul className="mt-2.5 space-y-2">
          {rules.map((r) => (
            <li key={r} className="flex gap-2.5 text-sm text-muted-foreground">
              <Check className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Challenge profit isn&apos;t paid out. Trading on the funded account starts from a clean baseline.
      </p>
    </TakeoverShell>
  );
}
