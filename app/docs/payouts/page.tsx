import { CodeBlock } from "@/components/docs/code-block";
import { ApiTester } from "@/components/docs/api-tester";
import { Callout, DocSection, Endpoint } from "@/components/docs/blocks";
import { DocsLink } from "@/components/docs/docs-link";
import { docsVanUrl } from "@/lib/docs/public-api";

export const metadata = { title: "Payouts & Connect" };

export default function PayoutsDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Flows</p>
            <h1 className="text-3xl font-semibold tracking-tight">Payouts &amp; Connect</h1>
          </div>
          <DocsLink href="/dashboard/payouts" label="Open in app" />
        </div>
        <p className="text-lg text-muted-foreground">
          Onboard a trader as a Stripe Connect payee, then pay out the trading
          profit they&apos;ve earned. The payout amount is computed by the
          validator — it&apos;s an <strong>estimate you read</strong>, not an
          arbitrary amount the user requests.
        </p>
      </header>

      <DocSection title="How it works">
        <ol className="list-inside list-decimal space-y-1.5 text-sm text-muted-foreground">
          <li>Create a Connect account → redirect the user to the Stripe onboarding link.</li>
          <li>Stripe sends them back to <code>/dashboard/payouts</code> when done.</li>
          <li>The API self-heals status from Stripe on the next list call (webhooks don&apos;t reach localhost).</li>
          <li>Read the estimated payout owed; transfer it once <code>payouts_enabled</code> is true.</li>
        </ol>
      </DocSection>

      <DocSection title="Create a Connect account">
        <Endpoint method="POST" path="/v2/connect/accounts" auth="user">
          <CodeBlock
            lang="json"
            filename="Request body"
            code={`{ "country": "US" }`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{
  "id": "con_...",
  "stripe_account_id": "acct_...",
  "onboarding_url": "https://connect.stripe.com/setup/...",
  "status": "pending",
  "payouts_enabled": false,
  "charges_enabled": false,
  "details_submitted": false
}`}
          />
          <Callout type="tip" title="Resuming onboarding">
            If a link expires, get a fresh one from{" "}
            <code>POST /v2/connect/accounts/{`{stripe_account_id}`}/onboarding-link</code>.
          </Callout>
        </Endpoint>
      </DocSection>

      <DocSection title="List Connect accounts">
        <Endpoint method="GET" path="/v2/connect/accounts" auth="user">
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`[
  {
    "id": "con_...",
    "stripe_account_id": "acct_...",
    "status": "active",
    "payouts_enabled": true,
    "charges_enabled": true,
    "details_submitted": true,
    "bank_name": "STRIPE TEST BANK",
    "last4": "6789",
    "country": "US"
  }
]`}
          />
          <ApiTester operation="connect.list" method="GET" path="/v2/connect/accounts" />
        </Endpoint>
      </DocSection>

      <DocSection title="Estimated payout (read-only)" description="The amount owed is computed from realized trading profit via the validator's high-water-mark. Read it; don't invent it.">
        <Endpoint method="GET" path="/v2/payouts/estimate" auth="user">
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl ${docsVanUrl("/v2/payouts/estimate")} \\
  -H "Authorization: Bearer <privy_identity_token>" \\
  -H "X-Prop-Account: prop_..."`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{ "amount_usd": 412.50, "amount_cents": 41250, "currency": "usd", "available": true }`}
          />
          <ApiTester operation="payouts.estimate" method="GET" path="/v2/payouts/estimate" />
        </Endpoint>
      </DocSection>

      <DocSection title="Payout history">
        <Endpoint method="GET" path="/v2/payouts" auth="user">
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`[
  {
    "id": "po_...",
    "amount_cents": 41250,
    "currency": "usd",
    "status": "paid",
    "stripe_transfer_id": "tr_...",
    "failure_reason": null,
    "requested_at": "2026-06-20T00:00:00Z",
    "completed_at": "2026-06-20T00:00:05Z"
  }
]`}
          />
          <ApiTester operation="payouts.list" method="GET" path="/v2/payouts" />
        </Endpoint>
      </DocSection>
    </>
  );
}
