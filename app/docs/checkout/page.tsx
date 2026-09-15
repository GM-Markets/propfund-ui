import { CodeBlock } from "@/components/docs/code-block";
import { ApiTester } from "@/components/docs/api-tester";
import { Callout, DocSection, Endpoint, ParamTable } from "@/components/docs/blocks";
import { DocsLink } from "@/components/docs/docs-link";

export const metadata = { title: "Checkout & accounts" };

export default function CheckoutDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Flows</p>
            <h1 className="text-3xl font-semibold tracking-tight">Checkout &amp; accounts</h1>
          </div>
          <DocsLink href="/dashboard/checkout" label="Open in app" />
        </div>
        <p className="text-lg text-muted-foreground">
          Sell prop-trading challenges with Stripe. Create a PaymentIntent,
          collect payment with Stripe Elements, and a funded prop account is
          provisioned automatically when the payment succeeds.
        </p>
      </header>

      <DocSection title="How it works">
        <ol className="list-inside list-decimal space-y-1.5 text-sm text-muted-foreground">
          <li>Call <code>POST /v2/payments/checkout</code> to create a PaymentIntent.</li>
          <li>Confirm payment in the browser with the returned <code>client_secret</code> + Stripe Elements.</li>
          <li>Stripe fires <code>payment_intent.succeeded</code> → the API provisions a prop account.</li>
          <li>Poll <code>GET /v2/payments/prop-accounts</code> until the new account appears.</li>
        </ol>
        <Callout type="warning" title="Provisioning is async">
          The account is created by the webhook, not the checkout call. Poll
          (this app waits up to ~30s) or listen for the <code>payment.succeeded</code>{" "}
          webhook before redirecting the user.
        </Callout>
      </DocSection>

      <DocSection title="Create a checkout (PaymentIntent)">
        <Endpoint method="POST" path="/v2/payments/checkout" auth="user">
          <ParamTable
            title="Request body"
            rows={[
              { name: "tier_id", type: "string", required: true, desc: "Challenge tier identifier" },
              { name: "market", type: "string", required: true, desc: 'e.g. "crypto"' },
              { name: "asset_class", type: "string", required: true, desc: 'e.g. "crypto" / "forex"' },
              { name: "account_size", type: "number", required: true, desc: "Funded account size in USD" },
              { name: "amount_cents", type: "number", required: true, desc: "Price charged, in cents" },
              { name: "currency", type: "string", required: false, desc: 'Defaults to "usd"' },
            ]}
          />
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X POST http://localhost:5400/van/v2/payments/checkout \\
  -H "Authorization: Bearer <privy_identity_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tier_id": "tier_25k",
    "market": "crypto",
    "asset_class": "crypto",
    "account_size": 25000,
    "amount_cents": 19900,
    "currency": "usd"
  }'`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{
  "payment_id": "pay_...",
  "stripe_payment_intent_id": "pi_...",
  "client_secret": "pi_..._secret_...",
  "amount_cents": 19900,
  "currency": "usd",
  "status": "requires_payment_method"
}`}
          />
          <CodeBlock
            lang="typescript"
            filename="confirm in the browser"
            code={`import { loadStripe } from "@stripe/stripe-js";

const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
// render <Elements options={{ clientSecret }}> with <PaymentElement />, then:
await stripe.confirmPayment({ elements, redirect: "if_required" });`}
          />
        </Endpoint>
      </DocSection>

      <DocSection title="Create a free account" description="Provision a no-charge account (e.g. for demos or comped traders) without Stripe.">
        <Endpoint method="POST" path="/v2/payments/free" auth="user">
          <CodeBlock
            lang="json"
            filename="Request body"
            code={`{ "tier_id": "tier_demo", "asset_class": "crypto", "account_size": 10000 }`}
          />
        </Endpoint>
      </DocSection>

      <DocSection title="List prop accounts">
        <Endpoint method="GET" path="/v2/payments/prop-accounts" auth="user">
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`[
  {
    "id": "prop_...",
    "tier_id": "tier_25k",
    "asset_class": "crypto",
    "account_size": 25000,
    "status": "active",
    "subaccount_id": 42,
    "subaccount_uuid": "9c1...",
    "synthetic_hotkey": "5F...",
    "stripe_payment_intent_id": "pi_..."
  }
]`}
          />
          <ApiTester
            operation="payments.listPropAccounts"
            method="GET"
            path="/v2/payments/prop-accounts"
          />
        </Endpoint>
        <p className="text-sm text-muted-foreground">
          Fetch one by id with <code>GET /v2/payments/prop-accounts/{`{id}`}</code>.
        </p>
      </DocSection>
    </>
  );
}
