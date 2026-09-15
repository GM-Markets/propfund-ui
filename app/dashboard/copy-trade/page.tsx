import { DocsLink } from "@/components/docs/docs-link";
import { PageHeader } from "@/components/page-header";

import { CopyTradeClient } from "./CopyTradeClient";

type Props = { searchParams: Promise<{ prop?: string }> };

export default async function CopyTradePage({ searchParams }: Props) {
  const { prop } = await searchParams;
  return (
    <div>
      <PageHeader
        title="Copy trade"
        description="Pick how much of this desk to copy with, then follow a Hyperliquid address."
        actions={<DocsLink href="/docs/copy-trade" />}
      />
      <CopyTradeClient initialAccountId={prop} />
    </div>
  );
}
