"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Info } from "lucide-react";

import { CheckoutSheet } from "@/components/dashboard/checkout-sheet";
import { PackageCard } from "@/components/dashboard/package-card";
import { RulesSummary } from "@/components/dashboard/rules-summary";
import { ChallengesSkeleton } from "@/components/dashboard/skeletons";
import { formatUsd } from "@/lib/propfund/format";
import { useActiveAccount, useRebuyOffer, useUser } from "@/lib/propfund/hooks";
import { PACKAGES, getPackage, isPackageId } from "@/lib/propfund/rules";
import type { PackageId } from "@/lib/propfund/types";
import { BARRED_CHECKOUT_COPY, checkoutView } from "@/lib/propfund/view/checkout";

/** `?package=<id>` preselects a package and opens checkout. */
const PACKAGE_PARAM = "package";

function readPackageParam(value: string | null): PackageId | null {
  return value && isPackageId(value) ? value : null;
}

/** Challenges (PRD §10.2): five package cards, rules summary, checkout sheet. */
export function ChallengesView() {
  const user = useUser();
  const active = useActiveAccount();
  const offer = useRebuyOffer();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const param = readPackageParam(searchParams.get(PACKAGE_PARAM));
  const [selectedId, setSelectedId] = React.useState<PackageId | null>(param);

  // Follow in-app links that change ?package= while this page is mounted.
  React.useEffect(() => {
    if (param) setSelectedId(param);
  }, [param]);

  const setSelection = React.useCallback(
    (id: PackageId | null) => {
      setSelectedId(id);
      const next = new URLSearchParams(searchParams.toString());
      if (id) next.set(PACKAGE_PARAM, id);
      else next.delete(PACKAGE_PARAM);
      const qs = next.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, searchParams],
  );

  if (user === undefined || active === undefined || offer === undefined) return <ChallengesSkeleton />;

  const views = PACKAGES.map((pkg) => ({
    pkg,
    view: checkoutView({
      pkg,
      hasRebuyOffer: !!offer,
      depositCreditUsd: user.depositCreditUsd,
      barred: user.barred,
      hasActiveAccount: !!active,
    }),
  }));
  const selected = views.find((v) => v.pkg.id === selectedId) ?? null;
  const activePkg = active ? getPackage(active.packageId) : null;

  return (
    <div className="flex flex-col gap-8">
      {(user.barred || active || user.depositCreditUsd > 0) && (
        <div className="flex flex-col gap-2">
          {user.barred ? (
            <Notice>{BARRED_CHECKOUT_COPY}</Notice>
          ) : active ? (
            <Notice>
              You already have an active account ({activePkg?.name} · {formatUsd(active.accountSize)}). Checkout opens again
              once it closes.{" "}
              <Link href="/dashboard/terminal" className="font-medium text-primary underline-offset-4 hover:underline">
                Go to terminal
              </Link>
            </Notice>
          ) : null}
          {!user.barred && user.depositCreditUsd > 0 && (
            <Notice>
              Deposit balance of {formatUsd(user.depositCreditUsd, 2)} is applied at checkout.
            </Notice>
          )}
        </div>
      )}

      <section aria-label="Packages">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {views.map(({ pkg, view }) => (
            <li key={pkg.id} className="min-w-0">
              <PackageCard pkg={pkg} view={view} selected={selectedId === pkg.id} onSelect={() => setSelection(pkg.id)} />
            </li>
          ))}
        </ul>
      </section>

      <RulesSummary />

      <CheckoutSheet
        pkg={selected?.pkg ?? null}
        view={selected?.view ?? null}
        onOpenChange={(open) => {
          if (!open) setSelection(null);
        }}
      />
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground" role="status">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
