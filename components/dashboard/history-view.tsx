"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, History } from "lucide-react";

import { OutcomeBadge, PhaseBadge } from "@/components/dashboard/badges";
import { MobileCard, Row } from "@/components/dashboard/primitives";
import { HistorySkeleton } from "@/components/dashboard/skeletons";
import { EmptyState } from "@/components/empty-state";
import { startRouteProgress } from "@/components/top-progress-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatUsd } from "@/lib/propfund/format";
import { useAccounts } from "@/lib/propfund/hooks";
import { REBUY_DISCOUNT_PCT, getPackage } from "@/lib/propfund/rules";
import type { Account } from "@/lib/propfund/types";

export function FeePaid({ account }: { account: Account }) {
  if (account.phase === "funded" && account.parentAccountId) {
    return <span className="text-muted-foreground">Included (graduated)</span>;
  }
  return (
    <span className="font-mono tabular-nums">
      {formatUsd(account.feePaidUsd)}
      {account.pricing === "rebuy" && (
        <span className="ml-1.5 font-sans text-xs text-primary">Rebuy · {REBUY_DISCOUNT_PCT}% off</span>
      )}
    </span>
  );
}

/** History (PRD §10.6): every account; a row opens its read-only statement. */
export function HistoryView() {
  const accounts = useAccounts();
  const router = useRouter();

  if (accounts === undefined) return <HistorySkeleton />;
  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No accounts yet"
        description="Your challenge and funded accounts will show here with their outcome and statement."
        action={
          <Button asChild>
            <Link href="/dashboard/challenges">Pick a package</Link>
          </Button>
        }
      />
    );
  }

  const open = (id: string) => {
    startRouteProgress();
    router.push(`/dashboard/history/${id}`);
  };

  return (
    <>
      <Card className="hidden overflow-hidden md:block" data-testid="history-table">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Account</TableHead>
              <TableHead>Fee paid</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Ended</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Statement</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((a) => {
              const pkg = getPackage(a.packageId);
              return (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => open(a.id)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/history/${a.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {pkg?.name} · {formatUsd(a.accountSize)}
                      </Link>
                      <PhaseBadge phase={a.phase} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <FeePaid account={a} />
                  </TableCell>
                  <TableCell>
                    <OutcomeBadge status={a.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(a.createdAt)}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {a.closedAt ? formatDate(a.closedAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <ul className="flex flex-col gap-3 md:hidden" data-testid="history-cards">
        {accounts.map((a) => {
          const pkg = getPackage(a.packageId);
          return (
            <li key={a.id}>
              <Link href={`/dashboard/history/${a.id}`} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <MobileCard className="transition-colors hover:border-primary/30">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {pkg?.name} · {formatUsd(a.accountSize)}
                      </span>
                      <PhaseBadge phase={a.phase} />
                    </span>
                    <OutcomeBadge status={a.status} />
                  </div>
                  <dl className="mt-2">
                    <Row label="Fee paid" value={<FeePaid account={a} />} />
                    <Row label="Started" value={formatDate(a.createdAt)} />
                    <Row label="Ended" value={a.closedAt ? formatDate(a.closedAt) : "—"} />
                  </dl>
                </MobileCard>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
