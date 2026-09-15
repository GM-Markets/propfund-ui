import Link from "next/link";

import { CodeBlock } from "@/components/docs/code-block";
import { ApiTester } from "@/components/docs/api-tester";
import { Callout, DocSection, Endpoint } from "@/components/docs/blocks";
import { DocsLink } from "@/components/docs/docs-link";
import { DESK_API_KEY_PLACEHOLDER, PUBLIC_GATEWAY_ORIGIN, docsVanUrl } from "@/lib/docs/public-api";

export const metadata = { title: "Authentication" };

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
          Programmatic calls go to <code>{PUBLIC_GATEWAY_ORIGIN}</code>. Desk
          bots send a minted <code>X-Api-Key</code>. The dashboard signs in with
          Privy and uses a Bearer token only to create that key.
        </p>
      </header>

      <DocSection
        title="Call the gateway with an API key"
        description="Mint a key in the dashboard, then call /van/v2/trading/* on gate.propfund.io. No Privy token on the bot."
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Sign in at PropFund and create a key under{" "}
            <Link href="/dashboard/api-keys">API keys</Link>. Save{" "}
            <code>key_id.key_secret</code> — the secret is shown once.
          </li>
          <li>
            Send <code>X-Api-Key: {DESK_API_KEY_PLACEHOLDER}</code> to{" "}
            <code>{docsVanUrl("/v2/trading/*")}</code>.
          </li>
          <li>
            Include <code>X-Prop-Account</code> when the key is not already bound
            to one desk.
          </li>
        </ol>
        <CodeBlock
          lang="bash"
          filename="curl"
          code={`curl ${docsVanUrl("/v2/trading/desk-poll")} \\
  -H "X-Api-Key: ${DESK_API_KEY_PLACEHOLDER}" \\
  -H "X-Prop-Account: prop_..."`}
        />
        <Callout type="warning" title="Trading routes only">
          <code>X-Api-Key</code> is accepted on <code>/van/v2/trading/*</code>{" "}
          only. Auth, KYC, checkout, payouts, and key admin reject it with{" "}
          <code>401</code>.
        </Callout>
      </DocSection>

      <DocSection
        title="Dashboard sign-in"
        description="Privy issues the identity token. The UI stores it and the gateway verifies it before proxying /van."
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Trader signs in with Privy.</li>
          <li>
            The UI calls <code>{docsVanUrl("/v2/me")}</code> with{" "}
            <code>Authorization: Bearer &lt;token&gt;</code>.
          </li>
          <li>
            The gateway checks the JWT, injects <code>x-user-*</code>, and
            proxies to Vanta.
          </li>
        </ol>
      </DocSection>

      <DocSection title="Who am I?" description="First authenticated dashboard call after login. Provisions the user and claims the $10K notional test desk.">
        <Endpoint method="GET" path="/v2/me" auth="user">
          <CodeBlock
            lang="bash"
            filename="curl"
            code={`curl ${docsVanUrl("/v2/me")} \\
  -H "Authorization: Bearer <privy_identity_token>"`}
          />
          <ApiTester operation="auth.me" method="GET" path="/v2/me" />
        </Endpoint>
      </DocSection>

      <Callout type="tip" title="Base URL">
        Production API: <code>{PUBLIC_GATEWAY_ORIGIN}</code>. All desk routes are
        under <code>/van</code>. See <Link href="/docs/api-keys">API keys</Link>{" "}
        and <Link href="/docs/trading">Trading</Link>.
      </Callout>
    </>
  );
}
