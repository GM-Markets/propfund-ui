import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SectionHeading } from "@/components/dashboard/primitives";
import { Card } from "@/components/ui/card";
import {
  DAILY_LOSS_PCT,
  INACTIVITY_DAYS,
  MAX_LOSS_PCT,
  MIN_PAYOUT_USD,
  PAYOUT_REVIEW_DAYS,
  REBUY_DISCOUNT_PCT,
  TARGET_PCT,
  TRADER_SHARE,
} from "@/lib/propfund/rules";

const pct = (f: number) => `${Math.round(f * 100)}%`;

const RULES: { title: string; body: string }[] = [
  {
    title: "Daily loss limit",
    body: `${pct(DAILY_LOSS_PCT)} of your baseline, counted down from your balance at 00:00 UTC.`,
  },
  {
    title: "Max loss limit",
    body: `A fixed floor at ${pct(MAX_LOSS_PCT)} below your baseline. It never trails.`,
  },
  {
    title: "Profit target",
    body: `Reach +${pct(TARGET_PCT)} with no open positions to graduate to a funded account. No time limit.`,
  },
  {
    title: "Payouts",
    body: `${pct(TRADER_SHARE)} of realized profit, from $${MIN_PAYOUT_USD}, paid in USDC on Arbitrum ${PAYOUT_REVIEW_DAYS} days after you request.`,
  },
  {
    title: "Breach and rebuy",
    body: `A breach closes the account. Your next challenge is ${REBUY_DISCOUNT_PCT}% off.`,
  },
  {
    title: "Manual trading only",
    body: `No bots, copy trading or shared accounts. Accounts with no trade in ${INACTIVITY_DAYS} days close.`,
  },
];

export function RulesSummary() {
  return (
    <section>
      <SectionHeading
        title="Rules summary"
        description="The same rules apply at every size"
        action={
          <Link
            href="/rules"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Full trading rules
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        }
      />
      <Card className="grid gap-px overflow-hidden bg-border sm:grid-cols-2 lg:grid-cols-3">
        {RULES.map((r) => (
          <div key={r.title} className="bg-card p-4 sm:p-5">
            <h3 className="text-sm font-medium">{r.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
          </div>
        ))}
      </Card>
    </section>
  );
}
