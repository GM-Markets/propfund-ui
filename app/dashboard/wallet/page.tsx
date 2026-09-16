import type { Metadata } from "next";

import { WalletView } from "@/components/dashboard/wallet-view";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Wallet" };

/** Wallet (PRD §10.5): Propfund wallet, balances per chain, deposit and payment history. */
export default function WalletPage() {
  return (
    <div>
      <PageHeader title="Wallet" description="Your Propfund wallet, balances and payment records" />
      <WalletView />
    </div>
  );
}
