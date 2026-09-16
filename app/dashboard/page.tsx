import type { Metadata } from "next";

import { OverviewView } from "@/components/dashboard/overview-view";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Overview" };

/** Overview (PRD §10.1): active account, payout under review, rebuy offer, recent accounts. */
export default function OverviewPage() {
  return (
    <div>
      <PageHeader title="Overview" description="Your active account, offers and recent accounts" />
      <OverviewView />
    </div>
  );
}
