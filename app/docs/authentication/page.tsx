import Link from "next/link";

import { CodeBlock } from "@/components/docs/code-block";
import { ApiTester } from "@/components/docs/api-tester";
import { Callout, DocSection, Endpoint } from "@/components/docs/blocks";
import { DocsLink } from "@/components/docs/docs-link";

export const metadata = { title: "Authentication" };

const GATEWAY = (process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:5400").replace(/\/$/, "");

export default function AuthDocsPage() {
  return (
    <>
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Getting started</p>
            <h1 className="text-3xl font-semibold tracking-tight">Authentication</h1>
          </div>
          <DocsLink href="/login" label="Try it" />
        </div>
        <p className="text-lg text-muted-foreground">
          Same as GM Markets: the <strong>Flo gateway</strong> verifies the Privy
          identity token. This app only stores that token and sends it as{" "}
          <code>Authorization: Bearer</code> to <code>/van</code>.
        </p>
      </header>

      <DocSection
        title="Sign in"
        description="Privy issues the identity token. The dashboard BFF copies it into an httpOnly cookie and every Vanta call goes through the gateway."
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Trader signs in with Privy (same app as GM Markets).</li>
          <li>
            This UI stores the identity token and calls{" "}
            <code>{GATEWAY}/van/v2/me</code> with{" "}
            <code>Authorization: Bearer &lt;token&gt;</code>.
          </li>
          <li>
            The gateway checks the JWT, injects <code>x-user-id</code> /{" "}
            <code>x-user-address</code> / <code>x-user-role</code>, and proxies to
            Vanta.
          </li>
        </ol>
        <Callout type="info" title="No app OAuth">
          There is no client id, client secret, or <code>/v2/oauth/token</code>.
          Desk bots use a Vanta-minted <code>X-Api-Key</code> on{" "}
          <code>/van/v2/trading/*</code> only.
        </Callout>
      </DocSection>

      <DocSection title="Who am I?" description="First authenticated call after login. Provisions the Vanta user and claims the $10K notional test desk.">
        <Endpoint method="GET" path="/v2/me" auth="user">
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl ${GATEWAY}/van/v2/me \\
  -H "Authorization: Bearer <privy_identity_token>"`}
          />
          <CodeBlock
            lang="typescript"
            filename="lib/hsc/client.ts"
            code={`import { auth } from "@/lib/hsc/client";

const me = await auth.me();`}
          />
          <ApiTester operation="auth.me" method="GET" path="/v2/me" />
        </Endpoint>
      </DocSection>

      <Callout type="tip" title="Configure this app">
        Set <code>NEXT_PUBLIC_PRIVY_APP_ID</code> and{" "}
        <code>NEXT_PUBLIC_GATEWAY_URL</code> (default{" "}
        <code>http://localhost:5400</code>). See the{" "}
        <Link href="/docs/quickstart">Quickstart</Link>.
      </Callout>
    </>
  );
}
