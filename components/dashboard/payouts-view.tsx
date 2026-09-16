"use client";

import * as React from "react";
import { toast } from "sonner";

import { EligibilityPanel } from "@/components/dashboard/eligibility-panel";
import { IdentityStep } from "@/components/dashboard/identity-step";
import { PayoutHistory } from "@/components/dashboard/payout-history";
import { PayoutRequestSheet } from "@/components/dashboard/payout-request-sheet";
import { PayoutReviewCard } from "@/components/dashboard/payout-review-card";
import { Row, SectionHeading } from "@/components/dashboard/primitives";
import { PayoutsSkeleton } from "@/components/dashboard/skeletons";
import { Card } from "@/components/ui/card";
import { errorMessage } from "@/lib/errors";
import { formatPct } from "@/lib/propfund/format";
import type { PayoutPreview } from "@/lib/propfund/mock";
import {
  actions,
  useAccountMetrics,
  useActiveAccount,
  useKyc,
  usePayoutUnderReview,
  usePayouts,
  useUser,
} from "@/lib/propfund/hooks";
import { MIN_PAYOUT_USD, PAYOUT_REVIEW_DAYS, TRADER_SHARE } from "@/lib/propfund/rules";
import { payoutChecklist } from "@/lib/propfund/view/payouts";

/** Payouts (PRD §8, §10.4). */
export function PayoutsView() {
  const user = useUser();
  const active = useActiveAccount();
  const metrics = useAccountMetrics(active?.id);
  const kyc = useKyc();
  const payouts = usePayouts();
  const underReview = usePayoutUnderReview();
  const [preview, setPreview] = React.useState<PayoutPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = React.useState(false);

  if (
    user === undefined ||
    active === undefined ||
    kyc === undefined ||
    payouts === undefined ||
    underReview === undefined ||
    (active && !metrics)
  ) {
    return <PayoutsSkeleton />;
  }

  const funded = !!active && active.phase === "funded";
  const liveMetrics = active && metrics ? metrics : null;
  const checklist = payoutChecklist({
    phase: active?.phase ?? null,
    active: active?.status === "active",
    kycStatus: kyc.status,
    flat: liveMetrics?.flat ?? true,
    realizedProfitUsd: liveMetrics?.realizedProfit ?? 0,
    hasPayoutUnderReview: !!underReview,
  });

  async function openRequest() {
    setLoadingPreview(true);
    try {
      const p = await actions.getPayoutPreview();
      if (p) setPreview(p);
      else toast.error("You don't have an active account.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoadingPreview(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <EligibilityPanel
            items={checklist.items}
            eligible={checklist.eligible}
            realizedProfitUsd={liveMetrics?.realizedProfit ?? 0}
            onRequest={() => void openRequest()}
            requesting={loadingPreview}
            note={user.barred ? "Payouts are closed on this profile after a confirmed violation." : null}
          />
          {funded && <IdentityStep kyc={kyc} barred={user.barred} />}
        </div>
        <div className={underReview ? "order-first flex min-w-0 flex-col gap-4 lg:order-none" : "flex min-w-0 flex-col gap-4"}>
          {underReview && <PayoutReviewCard payout={underReview} />}
          <PayoutTermsCard />
        </div>
      </div>

      <section>
        <SectionHeading title="Payout history" description="Every payout request and its status" />
        <PayoutHistory payouts={payouts} />
      </section>

      <PayoutRequestSheet preview={preview} onOpenChange={(open) => !open && setPreview(null)} />
    </div>
  );
}

function PayoutTermsCard() {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">Payout terms</h2>
      <p className="text-xs text-muted-foreground">How funded account payouts work</p>
      <dl className="mt-3">
        <Row label="Your share" value={formatPct(TRADER_SHARE, 0)} />
        <Row label="Minimum" value={`$${MIN_PAYOUT_USD} realized profit`} />
        <Row label="Paid in" value="USDC on Arbitrum" />
        <Row label="Pay date" value={`${PAYOUT_REVIEW_DAYS} days after request`} />
        <Row label="Identity check" value="Once, first payout" />
      </dl>
    </Card>
  );
}
