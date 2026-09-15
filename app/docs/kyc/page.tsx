import { CodeBlock } from "@/components/docs/code-block";
import { ApiTester } from "@/components/docs/api-tester";
import { Callout, DocSection, Endpoint } from "@/components/docs/blocks";
import { DocsLink } from "@/components/docs/docs-link";

export const metadata = { title: "Identity / KYC" };

export default function KycDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Flows</p>
            <h1 className="text-3xl font-semibold tracking-tight">Identity / KYC</h1>
          </div>
          <DocsLink href="/dashboard/kyc" label="Open in app" />
        </div>
        <p className="text-lg text-muted-foreground">
          Verify a trader&apos;s identity with Sumsub before they fund or trade.
          You mint a short-lived applicant token, render the Sumsub WebSDK, and
          poll status until <code>verified</code>.
        </p>
      </header>

      <DocSection title="How it works">
        <ol className="list-inside list-decimal space-y-1.5 text-sm text-muted-foreground">
          <li>Request a Sumsub access token for the signed-in user.</li>
          <li>Render the Sumsub WebSDK with that token (handled client-side).</li>
          <li>Sumsub posts a webhook to the API as review completes.</li>
          <li>Poll <code>GET /v2/kyc/status</code> (or listen for the webhook) until verified.</li>
        </ol>
        <Callout type="info" title="Statuses">
          <code>unverified</code> → <code>processing</code> →{" "}
          <code>needs_input</code> → <code>verified</code> / <code>failed</code>.
        </Callout>
      </DocSection>

      <DocSection title="Mint an applicant token">
        <Endpoint method="POST" path="/v2/kyc/sumsub/token" auth="user">
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X POST http://localhost:5400/van/v2/kyc/stripe/session \\
  -H "Authorization: Bearer <privy_identity_token>"`}
          />
          <CodeBlock
            lang="typescript"
            filename="lib/hsc/client.ts"
            code={`import { kyc } from "@/lib/hsc/client";

const { token, level_name } = await kyc.sumsubToken();
// pass token to <SumsubWebSdk accessToken={token} ... />`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{
  "token": "_act-sbx-...",
  "user_id": "usr_...",
  "level_name": "basic-kyc-level",
  "applicant_id": "5f9...c1"
}`}
          />
        </Endpoint>
      </DocSection>

      <DocSection title="Check verification status">
        <Endpoint method="GET" path="/v2/kyc/status" auth="user">
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{
  "user_id": "usr_...",
  "kyc_provider": "sumsub",
  "kyc_status": "verified",
  "kyc_verified_at": "2026-06-22T18:04:11Z",
  "kyc_failure_reason": null
}`}
          />
          <ApiTester operation="kyc.status" method="GET" path="/v2/kyc/status" />
        </Endpoint>
      </DocSection>

      <Callout type="tip" title="Get notified instead of polling">
        Register a webhook for the <code>kyc.updated</code> event so you don&apos;t
        have to poll. See <a href="/docs/webhooks">Webhooks</a>.
      </Callout>
    </>
  );
}
