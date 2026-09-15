import Link from "next/link";

import { CodeBlock } from "@/components/docs/code-block";
import { Callout, DocSection } from "@/components/docs/blocks";

export const metadata = { title: "Quickstart" };

export default function QuickstartPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Getting started</p>
        <h1 className="text-3xl font-semibold tracking-tight">Quickstart</h1>
        <p className="text-lg text-muted-foreground">
          Run this app against the Flo gateway and Vanta. Auth is Privy — the
          gateway verifies the identity token and proxies <code>/van</code>.
        </p>
      </header>

      <Callout type="info" title="What you'll need">
        Node 20+ with <code>pnpm</code>, a running Flo gateway (default{" "}
        <code>http://localhost:5400</code>), Vanta behind it, and the same Privy
        app id as GM Markets.
      </Callout>

      <DocSection
        title="1. Start the gateway and Vanta"
        description="This UI never talks to Vanta directly. All /van calls go through the Flo gateway."
      >
        <CodeBlock
          lang="bash"
          filename="flo"
          code={`# gateway — verifies Privy JWT, injects x-user-*, proxies /van
# vanta — desk, checkout, KYC (AWS Secrets Manager, not dotenv)`}
        />
        <Callout type="tip" title="No second login">
          There is no <code>client_id</code>, <code>client_secret</code>, or{" "}
          <code>/v2/oauth/token</code>. Desk bots use a Vanta-minted{" "}
          <code>X-Api-Key</code> on <code>/van/v2/trading/*</code> only.
        </Callout>
      </DocSection>

      <DocSection title="2. Configure & run this app">
        <CodeBlock
          lang="bash"
          filename="propfund-ui/.env.local"
          code={`NEXT_PUBLIC_GATEWAY_URL=http://localhost:5400
VANTA_API_BASE_URL=http://localhost:5400/van
NEXT_PUBLIC_PRIVY_APP_ID=
SESSION_COOKIE_NAME=vanta_privy_session`}
        />
        <CodeBlock
          lang="bash"
          filename="propfund-ui"
          code={`pnpm install
pnpm dev          # http://localhost:3000`}
        />
      </DocSection>

      <DocSection title="3. Sign in">
        <p className="text-sm text-muted-foreground">
          Open <Link href="/login">/login</Link>, continue with Privy, then call{" "}
          <code>GET /van/v2/me</code>. That attaches the user to the Flo tenant
          and claims the complimentary $10K notional test desk.
        </p>
        <CodeBlock
          lang="bash"
          filename="curl"
          code={`curl http://localhost:5400/van/v2/me \\
  -H "Authorization: Bearer <privy_identity_token>"`}
        />
      </DocSection>

      <DocSection title="Next steps">
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>
            <Link href="/docs/authentication">Authentication</Link> — how the
            gateway Bearer path works.
          </li>
          <li>
            <Link href="/docs/kyc">Identity / KYC</Link> — verify a trader.
          </li>
          <li>
            <Link href="/docs/checkout">Checkout</Link> — sell a paid challenge.
          </li>
        </ul>
      </DocSection>
    </>
  );
}
