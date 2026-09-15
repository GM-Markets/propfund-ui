import { DocsLink } from "@/components/docs/docs-link";
import { PageHeader } from "@/components/page-header";
import * as hsc from "@/lib/hsc/client";

import { ApiKeysClient } from "./ApiKeysClient";

export default async function ApiKeysPage() {
  const [keys, me] = await Promise.all([
    hsc.apiKeys.list().catch(() => []),
    hsc.auth.me().catch(() => null),
  ]);
  const accounts = me?.prop_accounts ?? [];
  return (
    <div>
      <PageHeader
        title="API keys"
        description="Programmatic trading access. Keep your secrets safe — they're shown only once."
        actions={<DocsLink href="/docs/api-keys" />}
      />
      <ApiKeysClient
        keys={keys}
        accounts={accounts.map((a) => ({ id: a.id, label: `${a.tier_id} · ${a.asset_class}` }))}
      />
    </div>
  );
}
