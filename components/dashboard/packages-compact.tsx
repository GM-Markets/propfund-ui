import Link from "next/link";

import { formatUsd } from "@/lib/propfund/format";
import { PACKAGES } from "@/lib/propfund/rules";

/** The five packages in compact form (Overview empty state). Each opens checkout on Challenges. */
export function PackagesCompact() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-testid="packages-compact">
      {PACKAGES.map((pkg) => (
        <li key={pkg.id} className="min-w-0">
          <Link
            href={`/dashboard/challenges?package=${pkg.id}`}
            className="flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="text-xs text-muted-foreground">{pkg.name}</span>
            <span className="mt-1 font-mono text-lg font-semibold tabular-nums">{formatUsd(pkg.accountSize)}</span>
            <span className="mt-3 text-xs text-muted-foreground">
              Fee <span className="font-mono text-foreground tabular-nums">{formatUsd(pkg.fee)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
