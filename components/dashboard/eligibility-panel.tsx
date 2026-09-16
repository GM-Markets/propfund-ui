"use client";

import { CheckCircle2, Circle, Info } from "lucide-react";

import { SectionHeading, Stat, pnlClass } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPct, formatSignedUsd, formatUsd } from "@/lib/propfund/format";
import { TRADER_SHARE, splitProfit } from "@/lib/propfund/rules";
import type { ChecklistItem } from "@/lib/propfund/view/payouts";
import { cn } from "@/lib/utils";

/** Payout eligibility as a calm checklist (PRD §8). Blockers are hints, never red banners. */
export function EligibilityPanel({
  items,
  eligible,
  realizedProfitUsd,
  onRequest,
  requesting,
  note,
}: {
  items: ChecklistItem[];
  eligible: boolean;
  realizedProfitUsd: number;
  onRequest: () => void;
  requesting: boolean;
  /** Calm explanation shown above the checklist (e.g. payouts closed after a violation). */
  note?: string | null;
}) {
  const share = splitProfit(Math.max(0, realizedProfitUsd)).trader;
  return (
    <Card className="p-5 sm:p-6" data-testid="payout-eligibility">
      <SectionHeading title="Payout eligibility" description="What's needed before you request a payout" />
      <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/20 p-4">
        <Stat
          label="Realized profit"
          value={formatSignedUsd(realizedProfitUsd)}
          valueClassName={cn("text-lg", pnlClass(realizedProfitUsd))}
        />
        <Stat
          label={`You receive (${formatPct(TRADER_SHARE, 0)})`}
          value={formatUsd(share, 2)}
          valueClassName="text-lg"
        />
      </div>
      {note && (
        <p className="mt-4 flex gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground" role="status">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {note}
        </p>
      )}
      <ul className="mt-5 flex flex-col gap-3" aria-label="Payout requirements">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3">
            {item.met ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            ) : (
              <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <div className={cn("text-sm", item.met ? "text-foreground" : "text-foreground/90")}>
                {item.label}
                <span className="sr-only">{item.met ? " (done)" : " (not yet)"}</span>
              </div>
              {!item.met && <div className="mt-0.5 text-xs text-muted-foreground">{item.hint}</div>}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="button" disabled={!eligible} loading={requesting} onClick={onRequest} className="sm:w-auto">
          Request payout
        </Button>
        {!eligible && (
          <span className="text-xs text-muted-foreground">Opens when every item above is ticked.</span>
        )}
      </div>
    </Card>
  );
}
