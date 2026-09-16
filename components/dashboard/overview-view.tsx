"use client";

import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";

import { ActiveAccountCard } from "@/components/dashboard/active-account-card";
import { PackagesCompact } from "@/components/dashboard/packages-compact";
import { PayoutReviewCard } from "@/components/dashboard/payout-review-card";
import { SectionHeading } from "@/components/dashboard/primitives";
import { RebuyOfferCard } from "@/components/dashboard/rebuy-offer-card";
import { RecentAccounts } from "@/components/dashboard/recent-accounts";
import { OverviewSkeleton } from "@/components/dashboard/skeletons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate, formatUsd } from "@/lib/propfund/format";
import { useAccounts, useActiveAccount, usePayoutUnderReview, useRebuyOffer, useUser } from "@/lib/propfund/hooks";
import { getPackage } from "@/lib/propfund/rules";
import type { Account } from "@/lib/propfund/types";
import { BARRED_CHECKOUT_COPY } from "@/lib/propfund/view/checkout";

const RECENT_LIMIT = 5;

/**
 * Overview (PRD §10.1). Mobile stack order: active account → payout under
 * review → rebuy offer → recent accounts. On desktop the two offers sit in
 * the right column beside the account card.
 */
export function OverviewView() {
  const user = useUser();
  const accounts = useAccounts();
  const active = useActiveAccount();
  const offer = useRebuyOffer();
  const payout = usePayoutUnderReview();

  if (user === undefined || accounts === undefined || active === undefined || offer === undefined || payout === undefined) {
    return <OverviewSkeleton />;
  }

  if (accounts.length === 0) {
    return (
      <section data-testid="overview-empty">
        <SectionHeading title="Challenges" description="Pick a package to start trading" />
        <PackagesCompact />
        <p className="mt-4 text-sm text-muted-foreground">
          Same rules at every size.{" "}
          <Link href="/dashboard/challenges" className="font-medium text-primary underline-offset-4 hover:underline">
            Compare packages
          </Link>
        </p>
      </section>
    );
  }

  const fromAccount = offer ? (accounts.find((a) => a.id === offer.fromAccountId) ?? null) : null;
  const hasSide = !!payout || !!offer;

  return (
    <div className="flex flex-col gap-8">
      <div className={hasSide ? "grid gap-4 lg:grid-cols-3" : "grid gap-4"}>
        <div className={hasSide ? "min-w-0 lg:col-span-2" : "min-w-0"}>
          {active ? <ActiveAccountCard account={active} /> : <NoActiveAccountCard latest={accounts[0]} barred={user.barred} />}
        </div>
        {hasSide && (
          <div className="flex min-w-0 flex-col gap-4">
            {payout && <PayoutReviewCard payout={payout} showLink />}
            {offer && <RebuyOfferCard fromAccount={fromAccount} />}
          </div>
        )}
      </div>

      <section>
        <SectionHeading
          title="Recent accounts"
          description="Your latest challenge and funded accounts"
          action={
            <Link
              href="/dashboard/history"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              All history
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        />
        <RecentAccounts accounts={accounts.slice(0, RECENT_LIMIT)} />
      </section>
    </div>
  );
}

function NoActiveAccountCard({ latest, barred }: { latest: Account; barred: boolean }) {
  const pkg = getPackage(latest.packageId);
  return (
    <Card className="p-5 sm:p-6" data-testid="no-active-account">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Trophy className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight">No active account</h2>
          <p className="text-sm text-muted-foreground">
            {barred ? "Your accounts are closed." : "Start a new challenge to trade again."}
          </p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
        <span className="min-w-0 truncate">
          {pkg?.name} · {formatUsd(latest.accountSize)}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          Last used {formatDate(latest.closedAt ?? latest.createdAt)}
        </span>
      </div>
      {barred ? (
        <p className="mt-5 text-sm text-muted-foreground">{BARRED_CHECKOUT_COPY}</p>
      ) : (
        <Button asChild className="mt-5 w-full sm:w-auto">
          <Link href="/dashboard/challenges">Pick a package</Link>
        </Button>
      )}
    </Card>
  );
}
