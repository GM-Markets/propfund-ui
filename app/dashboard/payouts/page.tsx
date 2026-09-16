import type { Metadata } from "next";

import { PayoutsView } from "@/components/dashboard/payouts-view";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Payouts" };

/** Payouts (PRD §8, §10.4): eligibility, identity step, request sheet, under review, history. */
export default function PayoutsPage() {
  return (
    <div>
      <PageHeader
        title="Payouts"
        description="80% of realized profit, paid in USDC on Arbitrum 7 days after you request"
      />
      <PayoutsView />
    </div>
  );
}
