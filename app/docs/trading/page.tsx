import { CodeBlock } from "@/components/docs/code-block";
import { ApiTester } from "@/components/docs/api-tester";
import { Callout, DocSection, Endpoint, ParamTable } from "@/components/docs/blocks";
import { DocsLink } from "@/components/docs/docs-link";

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
          Submit orders, manage positions, and read the live trading desk for a
          funded prop account. Orders are routed to the validator network and
          reflected back in positions/history.
        </p>
      </header>

      <Callout type="warning" title="Always send X-Prop-Account">
        Trading endpoints act on a specific funded account. Pass its id in the{" "}
        <code>X-Prop-Account</code> header. Get ids from{" "}
        <a href="/docs/checkout">prop accounts</a>.
      </Callout>

      <Callout type="info" title="trade_pair uses the wire id">
        Use the validator&apos;s wire id (e.g. <code>BTCUSD</code>), not a display
        label like <code>BTC/USD</code>. Sending the wrong format returns{" "}
        <code>400 Bad Request</code>.
      </Callout>

      <DocSection title="Submit an order">
        <Endpoint method="POST" path="/v2/trading/orders" auth="user">
          <ParamTable
            title="Request body"
            rows={[
              { name: "trade_pair", type: "string", required: true, desc: 'Wire id, e.g. "BTCUSD"' },
              { name: "order_type", type: '"LONG" | "SHORT" | "FLAT"', required: true, desc: "Direction" },
              { name: "leverage", type: "number", required: false, desc: "Size by leverage…" },
              { name: "value", type: "number", required: false, desc: "…or by notional value…" },
              { name: "quantity", type: "number", required: false, desc: "…or by quantity (pick one)" },
              { name: "execution_type", type: "string", required: false, desc: 'MARKET (default), LIMIT, STOP_LIMIT, BRACKET…' },
              { name: "limit_price", type: "number", required: false, desc: "For LIMIT / STOP_LIMIT" },
              { name: "stop_price", type: "number", required: false, desc: "For STOP_LIMIT" },
              { name: "take_profit", type: "number", required: false, desc: "Optional TP price" },
              { name: "stop_loss", type: "number", required: false, desc: "Optional SL price" },
            ]}
          />
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X POST http://localhost:5400/van/v2/trading/orders \\
  -H "Authorization: Bearer <privy_identity_token>" \\
  -H "X-Prop-Account: prop_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "trade_pair": "BTCUSD",
    "order_type": "LONG",
    "leverage": 1.0,
    "execution_type": "MARKET"
  }'`}
          />
          <CodeBlock
            lang="typescript"
            filename="lib/hsc/client.ts"
            code={`import { trading } from "@/lib/hsc/client";

await trading.submit(
  { trade_pair: "BTCUSD", order_type: "LONG", leverage: 1.0, execution_type: "MARKET" },
  propAccountId,
);`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{ "success": true, "order_uuid": "ord_...", "message": null, "processing_time": 0.42 }`}
          />
        </Endpoint>
      </DocSection>

      <DocSection title="Manage positions & orders">
        <ParamTable
          title="Endpoints"
          rows={[
            { name: "POST /v2/trading/orders/close", type: "body { trade_pair }", desc: "Flatten a position" },
            { name: "POST /v2/trading/orders/bulk-close", type: "body { position_uuids }", desc: "Close many at once" },
            { name: "DELETE /v2/trading/orders/{uuid}", type: "?trade_pair=…", desc: "Cancel a resting order" },
            { name: "POST /v2/trading/orders/{uuid}/edit", type: "body { trade_pair, order_type, … }", desc: "Edit a resting order" },
            { name: "POST /v2/trading/orders/tp-sl", type: "body { trade_pair, take_profit?, stop_loss? }", desc: "Attach TP/SL" },
          ]}
        />
      </DocSection>

      <DocSection title="Read the desk" description="Reads accept X-Prop-Account and return snapshots. desk-poll bundles everything in one round-trip — ideal for a UI refresh loop.">
        <Endpoint method="GET" path="/v2/trading/desk-poll" auth="user">
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
          <code>GET /v2/trading/balance</code>.
        </p>
      </DocSection>
    </>
  );
}
