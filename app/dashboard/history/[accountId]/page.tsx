import type { Metadata } from "next";

import { AccountStatement } from "@/components/dashboard/account-statement";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Statement" };

/** Read-only account statement (PRD §10.6). */
export default async function StatementPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params;
  return (
    <div>
      <PageHeader title="Statement" description="Summary, equity curve, trades and payouts for one account" />
      <AccountStatement accountId={decodeURIComponent(accountId)} />
    </div>
  );
}
