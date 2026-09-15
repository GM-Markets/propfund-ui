import Link from "next/link";

import { CodeBlock } from "@/components/docs/code-block";
import { ApiTester } from "@/components/docs/api-tester";
import { Callout, DocSection, Endpoint, ParamTable } from "@/components/docs/blocks";
import { DocsLink } from "@/components/docs/docs-link";
import { DESK_API_KEY_PLACEHOLDER, PUBLIC_GATEWAY_ORIGIN, docsVanUrl } from "@/lib/docs/public-api";

export const metadata = { title: "Trading" };

export default function TradingDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Flows</p>
            <h1 className="text-3xl font-semibold tracking-tight">Trading</h1>
          </div>
          <DocsLink href="/dashboard/trading" label="Open in app" />
        </div>
        <p className="text-lg text-muted-foreground">
          Virtual perps and USDC spots on the PropFund desk. Bots call{" "}
          <code>{PUBLIC_GATEWAY_ORIGIN}</code> with an API key. Fills are
          marked against live Hyperliquid mids.
        </p>
      </header>

      <Callout type="info" title="Authenticate at the gateway">
        <code>X-Api-Key: {DESK_API_KEY_PLACEHOLDER}</code> on{" "}
        <code>{docsVanUrl("/v2/trading/*")}</code>. Mint the key in the{" "}
        <Link href="/docs/api-keys">API keys</Link> flow. Also send{" "}
        <code>X-Prop-Account</code> unless the key is bound to one desk.
      </Callout>

      <Callout type="info" title="trade_pair is the Hyperliquid coin">
        Use the catalog coin (<code>BTC</code>, <code>ETH</code>,{" "}
        <code>SOL</code>), not a display label like <code>BTC/USD</code>.
      </Callout>

      <DocSection title="Submit an order">
        <Endpoint method="POST" path="/v2/trading/orders" auth="desk">
          <ParamTable
            title="Request body"
            rows={[
              { name: "trade_pair", type: "string", required: true, desc: 'Coin, e.g. "BTC"' },
              { name: "market_type", type: '"perp" | "spot"', required: true, desc: "Book" },
              { name: "side", type: '"buy" | "sell"', required: true, desc: "Perp long/short or spot buy/sell" },
              { name: "value", type: "number", required: false, desc: "USDC notional (margin × leverage for perps)" },
              { name: "quantity", type: "number", required: false, desc: "Coin size (use value or quantity)" },
              { name: "leverage", type: "number", required: false, desc: "Perp leverage, 1…HL max for that coin" },
            ]}
          />
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
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{ "success": true, "order_uuid": "ord_...", "message": null, "processing_time": 0.42 }`}
          />
        </Endpoint>
      </DocSection>

      <DocSection title="Close a position">
        <Endpoint method="POST" path="/v2/trading/close" auth="desk">
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X POST ${docsVanUrl("/v2/trading/close")} \\
  -H "X-Api-Key: ${DESK_API_KEY_PLACEHOLDER}" \\
  -H "X-Prop-Account: prop_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "trade_pair": "BTC", "market_type": "perp" }'`}
          />
        </Endpoint>
      </DocSection>

      <DocSection title="Read the desk" description="desk-poll bundles positions, orders, history, and balance in one round-trip.">
        <Endpoint method="GET" path="/v2/trading/desk-poll" auth="desk">
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl ${docsVanUrl("/v2/trading/desk-poll")} \\
  -H "X-Api-Key: ${DESK_API_KEY_PLACEHOLDER}" \\
  -H "X-Prop-Account: prop_..."`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{
  "positions": [ /* open positions */ ],
  "orders": [ /* resting orders */ ],
  "history": [ /* closed positions */ ],
  "balance": { "account_size": 25000, "status": "active" }
}`}
          />
          <ApiTester
            operation="trading.deskPoll"
            method="GET"
            path="/v2/trading/desk-poll"
          />
        </Endpoint>
        <p className="text-sm text-muted-foreground">
          Individual reads: <code>GET /v2/trading/positions</code>,{" "}
          <code>GET /v2/trading/orders</code>,{" "}
          <code>GET /v2/trading/history</code>,{" "}
          <code>GET /v2/trading/balance</code>,{" "}
          <code>GET /v2/trading/markets</code> (public, no key).
        </p>
      </DocSection>
    </>
  );
}
