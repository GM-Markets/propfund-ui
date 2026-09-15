import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import { DocsLink } from "@/components/docs/docs-link";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import * as hsc from "@/lib/hsc/client";

const TradingTerminal = dynamic(
  () => import("./TradingTerminal").then((m) => ({ default: m.TradingTerminal })),
  { loading: () => <Skeleton className="h-[28rem] rounded-xl" /> },
);

type Props = { searchParams: Promise<{ prop?: string }> };

export default async function TradingPage({ searchParams }: Props) {
  const { prop } = await searchParams;
  const me = await hsc.auth.me().catch(() => null);
  const accounts = me?.prop_accounts ?? [];
  if (accounts.length === 0) {
    redirect("/dashboard/checkout");
  }
  const selected = accounts.find((a) => a.id === prop) ?? accounts[0];
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
        agreementSigned={Boolean(me?.agreement_signed)}
        agreementVersion={me?.agreement_version ?? "2026-09-01"}
      />
    </div>
  );
}
