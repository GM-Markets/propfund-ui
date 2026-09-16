"use client";

import { Banknote } from "lucide-react";

import { PayoutStatusBadge } from "@/components/dashboard/badges";
import { ExternalTextLink, MobileCard, Row } from "@/components/dashboard/primitives";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatDayDate, formatUsd, truncateAddress } from "@/lib/propfund/format";
import { arbiscanTxUrl } from "@/lib/propfund/rules";
import type { Payout } from "@/lib/propfund/types";
import { PAYOUT_STATUS_MEANING } from "@/lib/propfund/view/payouts";

function TxCell({ payout }: { payout: Payout }) {
  if (payout.status === "paid" && payout.txHash) {
    return <ExternalTextLink href={arbiscanTxUrl(payout.txHash)}>{truncateAddress(payout.txHash, 6, 4)}</ExternalTextLink>;
  }
  if (payout.status === "under_review") {
    return <span className="text-muted-foreground">Pays {formatDayDate(payout.paysAt)}</span>;
  }
  return <span className="text-muted-foreground">—</span>;
}

/** Payout history (PRD §10.4): table on desktop, stacked cards on mobile. */
export function PayoutHistory({ payouts, emptyDescription }: { payouts: Payout[]; emptyDescription?: string }) {
  if (payouts.length === 0) {
    return (
      <EmptyState
        icon={Banknote}
        title="No payouts yet"
        description={emptyDescription ?? "Payout requests from your funded account will show here."}
      />
    );
  }

  return (
    <>
      <Card className="hidden overflow-hidden md:block" data-testid="payout-history-table">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Requested</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Your share</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Transaction</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="whitespace-nowrap">{formatDate(p.requestedAt)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatUsd(p.profitUsd, 2)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatUsd(p.traderUsd, 2)}</TableCell>
                <TableCell>
                  <PayoutStatusBadge status={p.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <TxCell payout={p} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ul className="flex flex-col gap-3 md:hidden" data-testid="payout-history-cards">
        {payouts.map((p) => (
          <li key={p.id}>
            <MobileCard>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{formatDate(p.requestedAt)}</span>
                <PayoutStatusBadge status={p.status} withTooltip={false} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{PAYOUT_STATUS_MEANING[p.status]}</p>
              <dl className="mt-2">
                <Row label="Amount" value={<span className="font-mono tabular-nums">{formatUsd(p.profitUsd, 2)}</span>} />
                <Row label="Your share" value={<span className="font-mono tabular-nums">{formatUsd(p.traderUsd, 2)}</span>} />
                <Row label="Transaction" value={<TxCell payout={p} />} />
              </dl>
            </MobileCard>
          </li>
        ))}
      </ul>
    </>
  );
}
