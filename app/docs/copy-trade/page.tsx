import Link from "next/link";

import { CodeBlock } from "@/components/docs/code-block";
import { Callout, DocSection, Endpoint, ParamTable, RouteTable } from "@/components/docs/blocks";
import { DocsLink } from "@/components/docs/docs-link";
import { DESK_API_KEY_PLACEHOLDER, DESK_API_KEY_ROUTES, PUBLIC_GATEWAY_ORIGIN, docsVanUrl } from "@/lib/docs/public-api";

export const metadata = { title: "Copy trade" };

export default function CopyTradeDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Flows</p>
            <h1 className="text-3xl font-semibold tracking-tight">Copy trade</h1>
          </div>
          <DocsLink href="/dashboard/copy-trade" label="Open in app" />
        </div>
        <p className="text-lg text-muted-foreground">
          Subscribe a desk to a Hyperliquid address. New leader fills are
          scaled by USD notional onto the current prop account. Bots call{" "}
          <code>{PUBLIC_GATEWAY_ORIGIN}</code> with an API key.
        </p>
      </header>

      <Callout type="info" title="Call with an API key">
        Same <code>X-Api-Key</code> as trading. Full list on{" "}
        <Link href="/docs/api-keys">API keys</Link>.
      </Callout>
      <RouteTable
        title="Copy-trade routes"
        rows={DESK_API_KEY_ROUTES.filter((row) => row.path.startsWith("/v2/copy-trade"))}
      />

      <Callout type="info" title="Sidecar, not the order path">
        Copy-trade polls <code>userFills</code> and calls the same virtual{" "}
        <code>placeOrder</code> as the ticket. It does not backfill unless you
        pass <code>from_ms</code>.
      </Callout>

      <DocSection title="Start copying">
        <Endpoint method="POST" path="/v2/copy-trade/subscriptions" auth="desk">
          <ParamTable
            title="Request body"
            rows={[
              { name: "leader_address", type: "string", required: true, desc: "0x Hyperliquid address" },
              { name: "scale_bps", type: "number", required: false, desc: "Follower size vs leader. 10000 = 1:1" },
              { name: "alloc_usd", type: "number", required: false, desc: "Max USD of this desk that may be copied. 0 = no cap" },
              { name: "markets", type: '"all" | "perp" | "spot"', required: false, desc: "Which books to copy. Default all" },
              { name: "max_leverage", type: "number", required: false, desc: "Cap on copied perp leverage (default 5)" },
              { name: "from_ms", type: "number", required: false, desc: "Fill cursor. Defaults to now" },
            ]}
          />
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X POST ${docsVanUrl("/v2/copy-trade/subscriptions")} \\
  -H "X-Api-Key: ${DESK_API_KEY_PLACEHOLDER}" \\
  -H "X-Prop-Account: prop_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "leader_address": "0x0000000000000000000000000000000000000001",
    "scale_bps": 10000,
    "alloc_usd": 2500,
    "markets": "perp"
  }'`}
          />
        </Endpoint>
      </DocSection>

      <DocSection title="Pause, resume, stop">
        <Endpoint method="POST" path="/v2/copy-trade/subscriptions/:id" auth="desk">
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X POST ${docsVanUrl("/v2/copy-trade/subscriptions/copy_...")} \\
  -H "X-Api-Key: ${DESK_API_KEY_PLACEHOLDER}" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "paused" }'`}
          />
        </Endpoint>
        <p className="text-sm text-muted-foreground">
          List with <code>GET /v2/copy-trade/subscriptions</code>. Fills:{" "}
          <code>GET /v2/copy-trade/subscriptions/:id/fills</code>. Manage the
          same flow in the{" "}
          <Link href="/dashboard/copy-trade" className="text-primary hover:underline">
            app
          </Link>
          .
        </p>
      </DocSection>
    </>
  );
}
