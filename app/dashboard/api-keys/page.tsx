import { DocsLink } from "@/components/docs/docs-link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROGRAMMATIC_TRADING } from "@/lib/features";
import * as hsc from "@/lib/hsc/client";

import { ApiKeysClient } from "./ApiKeysClient";

export default async function ApiKeysPage() {
  if (!PROGRAMMATIC_TRADING) {
    return (
      <div>
        <PageHeader
          title="API keys"
          description="Programmatic trading access is turned off."
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Not available</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Desk API keys are disabled. Place trades from the terminal in the app.
          </CardContent>
        </Card>
      </div>
    );
  }

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
