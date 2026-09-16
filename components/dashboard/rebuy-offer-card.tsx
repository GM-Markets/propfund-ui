"use client";

import Link from "next/link";
import { Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/propfund/format";
import { checkoutPrice, getPackage } from "@/lib/propfund/rules";
import type { Account } from "@/lib/propfund/types";
import { cn } from "@/lib/utils";

/** Open rebuy offer (PRD §7): the breached package's fee struck through, the rebuy fee and the discount. */
export function RebuyOfferCard({ fromAccount, className }: { fromAccount: Account | null; className?: string }) {
  const pkg = getPackage(fromAccount?.packageId ?? "core");
  if (!pkg) return null;
  const price = checkoutPrice(pkg, true);

  return (
    <Card className={cn("p-5", className)} data-testid="rebuy-offer-card">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Tag className="size-4" aria-hidden="true" />
        </span>
        Rebuy offer
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {price.discountLabel}. Applies to any package until your next purchase.
      </p>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <span className="text-sm">
          {pkg.name} · {formatUsd(pkg.accountSize)}
        </span>
        <span className="flex items-baseline gap-2 font-mono tabular-nums">
          <s className="text-sm text-muted-foreground" aria-label={`Full fee ${formatUsd(price.fullFee)}`}>
            {formatUsd(price.fullFee)}
          </s>
          <span className="text-lg font-semibold">{formatUsd(price.rebuyFee)}</span>
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button asChild size="sm" className="sm:flex-1">
          <Link href={`/dashboard/challenges?package=${pkg.id}`}>Rebuy {pkg.name}</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="sm:flex-1">
          <Link href="/dashboard/challenges">All packages</Link>
        </Button>
      </div>
    </Card>
  );
}
