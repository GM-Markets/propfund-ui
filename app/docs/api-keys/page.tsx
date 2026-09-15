import { CodeBlock } from "@/components/docs/code-block";
import { ApiTester } from "@/components/docs/api-tester";
import { Callout, DocSection, Endpoint, ParamTable } from "@/components/docs/blocks";
import { DocsLink } from "@/components/docs/docs-link";

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
          Issue scoped programmatic credentials so a trader (or their bot) can
          call the API directly — optionally bound to a single prop account.
        </p>
      </header>

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
  "key_id": "hsk_live_...",
  "key_secret": "sk_live_...   // shown ONCE — store it now",
  "prop_account_id": "prop_..."
}`}
          />
          <Callout type="warning" title="The secret is shown once">
            Capture <code>key_secret</code> at creation time. It is hashed at rest
            and can never be retrieved again — rotate by revoking and re-creating.
          </Callout>
        </Endpoint>
      </DocSection>

      <DocSection title="List keys">
        <Endpoint method="GET" path="/v2/api-keys" auth="user">
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`[
  { "id": "key_...", "label": "Trading bot", "key_id": "hsk_live_...", "revoked_at": null }
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
            code={`curl -X DELETE http://localhost:5400/van/v2/api-keys/key_... \\
  -H "Authorization: Bearer <privy_identity_token>"`}
          />
          <CodeBlock lang="json" filename="200 OK" code={`{ "revoked": true }`} />
        </Endpoint>
      </DocSection>
    </>
  );
}
