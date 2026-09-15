import Link from "next/link";

import { CodeBlock } from "@/components/docs/code-block";
import { Callout, DocSection, RouteTable } from "@/components/docs/blocks";
import { DESK_API_KEY_PLACEHOLDER, DESK_API_KEY_ROUTES, PUBLIC_GATEWAY_ORIGIN, PUBLIC_VAN_BASE, docsVanUrl } from "@/lib/docs/public-api";

export const metadata = { title: "Quickstart" };

export default function QuickstartPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Getting started</p>
        <h1 className="text-3xl font-semibold tracking-tight">Quickstart</h1>
        <p className="text-lg text-muted-foreground">
          Mint a desk API key in PropFund, then call{" "}
          <code>{PUBLIC_GATEWAY_ORIGIN}</code>. Bots do not use Privy.
        </p>
      </header>

      <Callout type="info" title="What you'll need">
        A PropFund login to create a key, then <code>curl</code> (or any HTTP
        client) against <code>{PUBLIC_GATEWAY_ORIGIN}</code>.
      </Callout>

      <DocSection
        title="1. Create an API key"
        description="Sign in, open API keys, and copy key_id.key_secret. The secret is shown once."
      >
        <p className="text-sm text-muted-foreground">
          Use the{" "}
          <Link href="/dashboard/api-keys">API keys</Link> page or the trading
          desk card. Optionally bind the key to one <code>prop_account_id</code>.
        </p>
      </DocSection>

      <DocSection title="2. Call the gateway">
        <CodeBlock
          lang="bash"
          filename="curl"
          code={`curl ${docsVanUrl("/v2/trading/desk-poll")} \\
  -H "X-Api-Key: ${DESK_API_KEY_PLACEHOLDER}" \\
  -H "X-Prop-Account: prop_..."`}
        />
        <Callout type="tip" title="Base URL">
          <code>{PUBLIC_VAN_BASE}</code> — host <code>{PUBLIC_GATEWAY_ORIGIN}</code>,
          prefix <code>/van</code>, header <code>X-Api-Key</code> on trading
          and copy-trade routes.
        </Callout>
        <RouteTable title="Routes the key can call" rows={DESK_API_KEY_ROUTES} />
      </DocSection>

      <DocSection title="3. Place an order">
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
      </DocSection>

      <DocSection title="Next steps">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>
            <Link href="/docs/authentication">Authentication</Link> — API key vs
            dashboard Privy.
          </li>
          <li>
            <Link href="/docs/api-keys">API keys</Link> — mint, list, revoke.
          </li>
          <li>
            <Link href="/docs/trading">Trading</Link> — orders, close, desk-poll.
          </li>
          <li>
            <Link href="/docs/copy-trade">Copy trade</Link> — follow a Hyperliquid address.
          </li>
        </ul>
      </DocSection>
    </>
  );
}
