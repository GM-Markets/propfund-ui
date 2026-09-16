"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { PhaseBadge } from "@/components/dashboard/badges";
import { Card } from "@/components/ui/card";
import { formatDate, formatUsd } from "@/lib/propfund/format";
import { getPackage } from "@/lib/propfund/rules";
import type { Account } from "@/lib/propfund/types";

export function RecentAccounts({ accounts }: { accounts: Account[] }) {
  return (
    <Card className="divide-y divide-border overflow-hidden" data-testid="recent-accounts">
      {accounts.map((a) => {
        const pkg = getPackage(a.packageId);
        return (
          <Link
            key={a.id}
            href={`/dashboard/history/${a.id}`}
            className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {pkg?.name} · {formatUsd(a.accountSize)}
                </span>
                <PhaseBadge phase={a.phase} className="hidden sm:inline-flex" />
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Started {formatDate(a.createdAt)}
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {a.status === "active" ? "In use" : `Last used ${formatDate(a.closedAt ?? a.createdAt)}`}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        );
      })}
    </Card>
  );
}
