"use client";

import Link from "next/link";
import { AlertOctagon, ArrowLeft, FileQuestion, ShieldAlert } from "lucide-react";

import { OutcomeBadge, PhaseBadge } from "@/components/dashboard/badges";
import { EquityCurve, type EquityCurveReference } from "@/components/dashboard/equity-curve";
import { FeePaid } from "@/components/dashboard/history-view";
import { PayoutHistory } from "@/components/dashboard/payout-history";
import { MobileCard, Row, SectionHeading, Stat, pnlClass } from "@/components/dashboard/primitives";
import { StatementSkeleton } from "@/components/dashboard/skeletons";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APPEAL_CONTACT_EMAIL } from "@/lib/propfund/config";
import { formatDate, formatDateTime, formatPct, formatPrice, formatSignedUsd, formatUsd } from "@/lib/propfund/format";
import { useAccount, useFills, usePayments, usePayouts } from "@/lib/propfund/hooks";
import { getMarket } from "@/lib/propfund/markets";
import { VIOLATIONS, getPackage, maxBreachLevel, targetLevel } from "@/lib/propfund/rules";
import type { Account, Fill } from "@/lib/propfund/types";
import { FILL_KIND_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/propfund/view/labels";

const BREACH_RULE_LABEL = { daily: "Daily loss limit", max: "Max loss limit" } as const;

/** Read-only account statement (PRD §10.6). */
export function AccountStatement({ accountId }: { accountId: string }) {
  const account = useAccount(accountId);
  const fills = useFills(accountId);
  const payouts = usePayouts();
  const payments = usePayments();

  if (account === undefined || fills === undefined || payouts === undefined || payments === undefined) {
    return <StatementSkeleton />;
  }

  if (account === null) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="Statement not found"
        description="This account isn't on your profile. It may have been removed when test data was reset."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard/history">Back to history</Link>
          </Button>
        }
      />
    );
  }

  const pkg = getPackage(account.packageId);
  const accountPayouts = payouts.filter((p) => p.accountId === account.id);
  const payment = account.paymentId ? (payments.find((p) => p.id === account.paymentId) ?? null) : null;
  const { stats } = account;
  const decided = stats.wins + stats.losses;

  const references: EquityCurveReference[] = [
    { id: "baseline", label: "Baseline", value: account.baseline, tone: "muted" },
    { id: "floor", label: "Max loss floor", value: maxBreachLevel(account.baseline), tone: "destructive" },
  ];
  if (account.phase === "challenge") {
    references.push({ id: "target", label: "Target", value: targetLevel(account.baseline), tone: "success" });
  }

  return (
    <div className="flex flex-col gap-8" data-testid="account-statement">
      <div>
        <Link
          href="/dashboard/history"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All accounts
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <h2 className="text-xl font-semibold tracking-tight">
            {pkg?.name} · {formatUsd(account.accountSize)}
          </h2>
          <PhaseBadge phase={account.phase} />
          <OutcomeBadge status={account.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Started {formatDate(account.createdAt)}
          {account.closedAt ? ` · ended ${formatDate(account.closedAt)}` : ""} · read-only statement
        </p>
      </div>

      {account.breach && <BreachDetails account={account} />}
      {account.violation && <ViolationDetails account={account} />}

      <Card className="grid grid-cols-2 gap-x-4 gap-y-5 p-5 sm:grid-cols-3 sm:p-6 lg:grid-cols-5">
        <Stat label="Fee paid" value={<FeePaid account={account} />} />
        <Stat
          label="Payment"
          value={account.parentAccountId ? "With challenge" : payment ? PAYMENT_METHOD_LABEL[payment.method] : "—"}
        />
        <Stat label="Baseline" value={formatUsd(account.baseline, 2)} />
        <Stat label={account.status === "active" ? "Balance" : "Final balance"} value={formatUsd(account.balance, 2)} />
        <Stat
          label="Realized P&L"
          value={formatSignedUsd(stats.realizedPnl)}
          valueClassName={pnlClass(stats.realizedPnl)}
        />
        <Stat label="Trades" value={stats.trades} />
        <Stat label="Win rate" value={decided ? formatPct(stats.wins / decided, 0) : "—"} />
        <Stat label="Best trade" value={formatSignedUsd(stats.bestTrade)} valueClassName={pnlClass(stats.bestTrade)} />
        <Stat label="Worst trade" value={formatSignedUsd(stats.worstTrade)} valueClassName={pnlClass(stats.worstTrade)} />
        <Stat label="Volume" value={formatUsd(stats.volumeUsd)} />
      </Card>

      <section>
        <SectionHeading title="Equity curve" description="Sampled equity over the life of the account" />
        <Card className="p-4 sm:p-5">
          <EquityCurve points={account.equityCurve} references={references} />
        </Card>
      </section>

      <section>
        <SectionHeading title="Trades" description="Every fill on this account, newest first" />
        <TradesTable fills={fills} />
      </section>

      <section>
        <SectionHeading title="Payouts" description="Payouts requested from this account" />
        <PayoutHistory
          payouts={accountPayouts}
          emptyDescription={
            account.phase === "funded" ? "No payouts were requested from this account." : "Challenge accounts don't pay out."
          }
        />
      </section>
    </div>
  );
}

function BreachDetails({ account }: { account: Account }) {
  const b = account.breach;
  if (!b) return null;
  return (
    <Card className="p-5" data-testid="breach-details">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <AlertOctagon className="size-4 text-destructive" aria-hidden="true" />
        Breach details
      </div>
      <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
        <Row label="Rule" value={BREACH_RULE_LABEL[b.rule]} />
        <Row label="Time" value={formatDateTime(b.at)} />
        <Row label="Equity at breach" value={<span className="font-mono tabular-nums">{formatUsd(b.equity, 2)}</span>} />
        <Row label="Limit" value={<span className="font-mono tabular-nums">{formatUsd(b.limit, 2)}</span>} />
      </dl>
    </Card>
  );
}

function ViolationDetails({ account }: { account: Account }) {
  const v = account.violation;
  if (!v) return null;
  return (
    <Card className="p-5" data-testid="violation-details">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldAlert className="size-4 text-destructive" aria-hidden="true" />
        Violation details
      </div>
      <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
        <Row label="Violation" value={`${v.code} · ${VIOLATIONS[v.code].title}`} />
        <Row label="Time" value={formatDateTime(v.at)} />
        <Row label="Payouts voided" value={<span className="font-mono tabular-nums">{formatUsd(v.voidedUsd, 2)}</span>} />
        <Row
          label="Appeals"
          value={
            <a href={`mailto:${APPEAL_CONTACT_EMAIL}`} className="text-primary underline-offset-4 hover:underline">
              {APPEAL_CONTACT_EMAIL}
            </a>
          }
        />
      </dl>
      <p className="mt-3 text-sm text-muted-foreground">{v.reason}</p>
    </Card>
  );
}

function marketName(symbol: string): string {
  return getMarket(symbol)?.displayName ?? symbol;
}

function fillPrice(f: Fill): string {
  const m = getMarket(f.symbol);
  return m ? formatPrice(f.price, m.tickSize) : "—";
}

function TradesTable({ fills }: { fills: Fill[] }) {
  if (fills.length === 0) {
    return <EmptyState title="No trades" description="No orders were filled on this account." />;
  }
  return (
    <>
      <Card className="hidden overflow-hidden md:block" data-testid="trades-table">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Time</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Notional</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Realized P&amp;L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fills.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(f.at)}</TableCell>
                <TableCell className="whitespace-nowrap">{f.kind === "adjustment" ? "—" : marketName(f.symbol)}</TableCell>
                <TableCell className={f.side === "buy" ? "text-success" : "text-destructive"}>
                  {f.kind === "adjustment" ? "—" : f.side === "buy" ? "Buy" : "Sell"}
                </TableCell>
                <TableCell className="whitespace-nowrap">{FILL_KIND_LABEL[f.kind]}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {f.kind === "adjustment" ? "—" : formatUsd(f.notionalUsd, 2)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {f.kind === "adjustment" ? "—" : fillPrice(f)}
                </TableCell>
                <TableCell className={`text-right font-mono tabular-nums ${pnlClass(f.realizedPnl)}`}>
                  {formatSignedUsd(f.realizedPnl)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <ul className="flex flex-col gap-3 md:hidden" data-testid="trades-cards">
        {fills.map((f) => (
          <li key={f.id}>
            <MobileCard>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">
                  {f.kind === "adjustment" ? FILL_KIND_LABEL[f.kind] : `${f.side === "buy" ? "Buy" : "Sell"} ${marketName(f.symbol)}`}
                </span>
                <span className={`font-mono tabular-nums ${pnlClass(f.realizedPnl)}`}>{formatSignedUsd(f.realizedPnl)}</span>
              </div>
              <dl className="mt-2">
                <Row label="Time" value={formatDateTime(f.at)} />
                {f.kind !== "adjustment" && (
                  <>
                    <Row label="Type" value={FILL_KIND_LABEL[f.kind]} />
                    <Row label="Notional" value={<span className="font-mono tabular-nums">{formatUsd(f.notionalUsd, 2)}</span>} />
                    <Row label="Price" value={<span className="font-mono tabular-nums">{fillPrice(f)}</span>} />
                  </>
                )}
              </dl>
            </MobileCard>
          </li>
        ))}
      </ul>
    </>
  );
}
