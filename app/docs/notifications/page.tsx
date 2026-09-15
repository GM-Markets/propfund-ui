import { CodeBlock } from "@/components/docs/code-block";
import { Callout, DocSection, Endpoint, ParamTable } from "@/components/docs/blocks";

export const metadata = { title: "Notifications" };

export default function NotificationsDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Flows</p>
        <h1 className="text-3xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-lg text-muted-foreground">
          Send transactional email to your users and optionally fan the same
          event out to your registered webhook endpoints — one call, two
          channels.
        </p>
      </header>

      <DocSection title="Send a notification">
        <Endpoint method="POST" path="/v2/notifications/send" auth="app">
          <ParamTable
            title="Request body"
            rows={[
              { name: "user_id", type: "string", required: false, desc: "Target user (resolves email)" },
              { name: "email", type: "string", required: false, desc: "Explicit recipient address" },
              { name: "subject", type: "string", required: true, desc: "Email subject" },
              { name: "html", type: "string", required: true, desc: "HTML body" },
              { name: "text", type: "string", required: false, desc: "Plain-text fallback" },
              { name: "fanout_event", type: "string", required: false, desc: "Webhook event type to emit" },
              { name: "payload", type: "object", required: false, desc: "Data for the webhook event" },
            ]}
          />
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl -X POST http://localhost:5400/van/v2/notifications/send \\
  -H "Authorization: Bearer <privy_identity_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "trader@example.com",
    "subject": "Your account is funded",
    "html": "<h1>Congrats!</h1><p>You are now funded.</p>",
    "fanout_event": "account.funded",
    "payload": { "prop_account_id": "prop_123" }
  }'`}
          />
          <CodeBlock
            lang="json"
            filename="200 OK"
            code={`{ "email_sent": true, "webhook_deliveries_queued": 2 }`}
          />
        </Endpoint>
      </DocSection>

      <Callout type="tip" title="Provide a recipient">
        Pass either <code>user_id</code> (we resolve the email) or an explicit
        <code> email</code>. Add <code>fanout_event</code> to also notify your
        backend via <a href="/docs/webhooks">webhooks</a>.
      </Callout>
    </>
  );
}
