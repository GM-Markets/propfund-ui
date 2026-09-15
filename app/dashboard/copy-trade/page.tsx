import dynamic from "next/dynamic";

import { DocsLink } from "@/components/docs/docs-link";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import * as hsc from "@/lib/hsc/client";
import type { BrowserMe } from "@/lib/vanta/browser";

const CopyTradeClient = dynamic(
  () => import("./CopyTradeClient").then((m) => ({ default: m.CopyTradeClient })),
  { loading: () => <Skeleton className="h-48 rounded-xl" /> },
);

type Props = { searchParams: Promise<{ prop?: string }> };

export default async function CopyTradePage({ searchParams }: Props) {
  const [{ prop }, me] = await Promise.all([searchParams, hsc.auth.me().catch(() => null)]);
  const initialMe: BrowserMe | null = me
    ? {
        user_id: me.user_id,
        agreement_signed: me.agreement_signed,
        agreement_version: me.agreement_version,
        prop_accounts: me.prop_accounts.map((a) => ({
          id: a.id,
          tier_id: a.tier_id,
          asset_class: a.asset_class,
          account_size: a.account_size,
          status: a.status,
          is_test: a.is_test,
        })),
      }
    : null;
  return (
    <div>
      <PageHeader
        title="Copy trade"
        description="Pick how much of this desk to copy with, then follow a Hyperliquid address."
        actions={<DocsLink href="/docs/copy-trade" />}
      />
      <CopyTradeClient initialAccountId={prop} initialMe={initialMe} />
    </div>
  );
}
