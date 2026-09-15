import { CodeBlock } from "@/components/docs/code-block";
import { Callout, DocSection, Endpoint } from "@/components/docs/blocks";

export const metadata = { title: "Lifecycle" };

export default function LifecycleDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Flows</p>
        <h1 className="text-3xl font-semibold tracking-tight">Account lifecycle</h1>
        <p className="text-lg text-muted-foreground">
          Funded accounts move through states as traders hit (or miss) targets:
          <code> evaluation</code> → <code>funded</code> → <code>eliminated</code>.
          Sync the latest state from the validator on demand.
        </p>
      </header>

      <DocSection title="Sync status">
        <Endpoint method="POST" path="/v2/lifecycle/sync/{prop_account_id}" auth="user">
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X POST http://localhost:5400/van/v2/lifecycle/sync/prop_123 \\
  -H "Authorization: Bearer <privy_identity_token>"`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{
  "prop_account_id": "prop_123",
  "status": "funded",
  "subaccount_id": 42,
  "synthetic_hotkey": "5F..."
}`}
          />
        </Endpoint>
      </DocSection>

      <Callout type="info" title="When to call this">
        Call after a trading session, or on a schedule, to reflect promotions and
        eliminations in your UI. Status also updates passively as the validator
        reports results.
      </Callout>
    </>
  );
}
