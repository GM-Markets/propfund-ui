import Link from "next/link";

import { CodeBlock } from "@/components/docs/code-block";
import { ApiTester } from "@/components/docs/api-tester";
import { Callout, DocSection, Endpoint, ParamTable } from "@/components/docs/blocks";
import { DocsLink } from "@/components/docs/docs-link";
import { DESK_API_KEY_PLACEHOLDER, PUBLIC_GATEWAY_ORIGIN, docsVanUrl } from "@/lib/docs/public-api";

export const metadata = { title: "API keys" };

export default function ApiKeysDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Flows</p>
            <h1 className="text-3xl font-semibold tracking-tight">API keys</h1>
          </div>
          <DocsLink href="/dashboard/api-keys" label="Open in app" />
        </div>
        <p className="text-lg text-muted-foreground">
          Mint a desk key in the app, then call{" "}
          <code>{PUBLIC_GATEWAY_ORIGIN}</code> with{" "}
          <code>X-Api-Key: {DESK_API_KEY_PLACEHOLDER}</code>. The secret is
          shown once.
        </p>
      </header>

      <DocSection
        title="Use the key"
        description="Bots never send a Privy token. Concatenate key_id and key_secret with a dot."
      >
        <CodeBlock
          lang="bash"
          filename="curl"
          code={`curl -X POST ${docsVanUrl("/v2/trading/orders")} \\
  -H "X-Api-Key: ${DESK_API_KEY_PLACEHOLDER}" \\
  -H "X-Prop-Account: prop_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "trade_pair": "BTC",
    "market_type": "perp",
    "side": "buy",
    "value": 200,
    "leverage": 20
  }'`}
        />
        <Callout type="info" title="Where to send it">
          Host <code>{PUBLIC_GATEWAY_ORIGIN}</code>, path prefix{" "}
          <code>/van</code>, header <code>X-Api-Key</code>. Trading routes only
          — see <Link href="/docs/trading">Trading</Link>.
        </Callout>
      </DocSection>

      <DocSection title="Create a key">
        <Endpoint method="POST" path="/v2/api-keys" auth="user">
          <ParamTable
            title="Request body"
            rows={[
              { name: "label", type: "string", required: true, desc: "Human-readable name" },
              { name: "prop_account_id", type: "string", required: false, desc: "Scope the key to one account" },
            ]}
          />
          <CodeBlock
            lang="json"
            filename="200 OK — secret shown once"
            code={`{
  "id": "key_...",
  "label": "Trading bot",
  "key_id": "key_...",
  "key_secret": "…shown once",
  "key": "key_....secret",
  "prop_account_id": "prop_..."
}`}
          />
          <Callout type="warning" title="The secret is shown once">
            Store <code>key</code> (or <code>key_id.key_secret</code>) immediately.
            It is hashed at rest and cannot be retrieved again — rotate by
            revoking and creating a new key.
          </Callout>
        </Endpoint>
      </DocSection>

      <DocSection title="List keys">
        <Endpoint method="GET" path="/v2/api-keys" auth="user">
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`[
  { "id": "key_...", "label": "Trading bot", "key_id": "key_...", "revoked_at": null }
]`}
          />
          <ApiTester operation="apiKeys.list" method="GET" path="/v2/api-keys" />
        </Endpoint>
      </DocSection>

      <DocSection title="Revoke a key">
        <Endpoint method="DELETE" path="/v2/api-keys/{id}" auth="user">
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X DELETE ${docsVanUrl("/v2/api-keys/key_...")} \\
  -H "Authorization: Bearer <privy_identity_token>"`}
          />
          <CodeBlock lang="json" filename="200 OK" code={`{ "revoked": true }`} />
        </Endpoint>
      </DocSection>
    </>
  );
}
