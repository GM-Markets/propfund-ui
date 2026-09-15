import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Webhook,
} from "lucide-react";

import { CodeBlock } from "@/components/docs/code-block";
import { Callout } from "@/components/docs/blocks";
import { DESK_API_KEY_PLACEHOLDER, PUBLIC_GATEWAY_ORIGIN, docsVanUrl } from "@/lib/docs/public-api";

export const metadata = { title: "Introduction" };

const FLOWS = [
  {
    href: "/docs/quickstart",
    title: "Quickstart",
    desc: "Mint an API key and call gate.propfund.io in a few minutes.",
  },
  {
    href: "/docs/authentication",
    title: "Authentication",
    desc: "X-Api-Key on gate.propfund.io for bots. Privy only to mint the key.",
    icon: KeyRound,
  },
  {
    href: "/docs/kyc",
    title: "Identity / KYC",
    desc: "Verify a trader's identity with Sumsub before they trade.",
    icon: ShieldCheck,
  },
  {
    href: "/docs/checkout",
    title: "Checkout & accounts",
    desc: "Sell prop challenges with Stripe and provision accounts.",
    icon: CreditCard,
  },
  {
    href: "/docs/trading",
    title: "Trading",
    desc: "Submit orders, manage positions and poll the trading desk.",
  },
  {
    href: "/docs/payouts",
    title: "Payouts & Connect",
    desc: "Onboard payees via Stripe Connect and send earned profit.",
  },
  {
    href: "/docs/api-keys",
    title: "API keys",
    desc: "Mint key_id.key_secret and call trading and copy-trade APIs.",
    icon: KeyRound,
  },
  {
    href: "/docs/webhooks",
    title: "Webhooks",
    desc: "Receive real-time events: KYC, payments, payouts, trades.",
    icon: Webhook,
  },
  {
    href: "/docs/api-reference",
    title: "Full API reference",
    desc: "Search every endpoint, copy cURL, and run reads live.",
  },
];

export default function DocsIndexPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Hyperscaled API</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Build a prop-trading business on our infrastructure
        </h1>
        <p className="text-lg text-muted-foreground">
          The Hyperscaled API gives you everything behind a modern prop firm —
          identity verification, payments, funded accounts, live trading, and
          payouts — behind one multi-tenant REST API. This is the documentation
          for the same endpoints that power the <strong>Propfund</strong> reference
          app you&apos;re looking at.
        </p>
      </header>

      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Every call is authenticated, multi-tenant, and isolated to your app.
          You bring the UI; we run the regulated, capital, and market plumbing.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              1
            </span>
            <h2 className="text-lg font-semibold tracking-tight">
              Get an API key
            </h2>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-5">
            <p className="text-sm text-muted-foreground">
              Sign in to PropFund, mint a desk key, then call{" "}
              <code>{PUBLIC_GATEWAY_ORIGIN}</code> with{" "}
              <code>X-Api-Key: {DESK_API_KEY_PLACEHOLDER}</code>. The gateway
              proxies <code>/van</code> to the virtual desk. Keys work on{" "}
              <code>/van/v2/trading/*</code> and{" "}
              <code>/van/v2/copy-trade/*</code>.
            </p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>{" "}
                and open{" "}
                <Link href="/dashboard/api-keys" className="text-primary hover:underline">
                  API keys
                </Link>
                .
              </li>
              <li>
                Copy <code>key_id.key_secret</code> — the secret is shown once.
              </li>
              <li>
                Send requests to <code>{docsVanUrl("/v2/trading/*")}</code> or{" "}
                <code>{docsVanUrl("/v2/copy-trade/*")}</code>. See the full
                list on <Link href="/docs/api-keys">API keys</Link>.
              </li>
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              Dashboard session auth is Privy Bearer. Bots never send that
              token. See the <Link href="/docs/quickstart">Quickstart</Link>.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
              2
            </span>
            <h2 className="text-lg font-semibold tracking-tight">
              Make your first request
            </h2>
          </div>
          <CodeBlock
            lang="bash"
            filename="Your first request"
            code={`curl ${docsVanUrl("/v2/trading/desk-poll")} \\
  -H "X-Api-Key: ${DESK_API_KEY_PLACEHOLDER}" \\
  -H "X-Prop-Account: prop_..."`}
          />
          <Callout type="tip" title="Auth is on the gateway">
            Host <code>{PUBLIC_GATEWAY_ORIGIN}</code>, header{" "}
            <code>X-Api-Key</code>. See{" "}
            <Link href="/docs/authentication">Authentication</Link>.
          </Callout>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Explore the flows</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {FLOWS.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group rounded-xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/40 hover:bg-card"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{f.title}</h3>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
