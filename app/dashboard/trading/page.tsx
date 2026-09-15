import { redirect } from "next/navigation";

import { DocsLink } from "@/components/docs/docs-link";
import { PageHeader } from "@/components/page-header";
import * as hsc from "@/lib/hsc/client";

import { TradingTerminal } from "./TradingTerminal";

type Props = { searchParams: Promise<{ prop?: string }> };

export default async function TradingPage({ searchParams }: Props) {
  const { prop } = await searchParams;
  const me = await hsc.auth.me().catch(() => null);
  const accounts = me?.prop_accounts ?? (await hsc.payments.listPropAccounts().catch(() => []));
  if (accounts.length === 0) {
    redirect("/dashboard/checkout");
  }
  const selected = accounts.find((a) => a.id === prop) ?? accounts[0];
  const status = me
    ? { signed: me.agreement_signed, version: me.agreement_version }
    : await hsc.agreements
        .status()
        .then((row) => ({ signed: row.signed, version: row.agreement_version }))
        .catch(() => ({ signed: false, version: null }));
  return (
    <div>
      <PageHeader
        className="mb-4 sm:mb-8"
        title="Trading terminal"
        description="Virtual perps sized in USDC, filled against live Hyperliquid marks. Create a desk API key to automate the same orders."
        actions={<DocsLink href="/docs/trading" />}
      />
      <TradingTerminal
        accounts={accounts}
        initialId={selected.id}
        agreementSigned={status.signed}
        agreementVersion={status.version ?? "2026-09-01"}
      />
    </div>
  );
}
