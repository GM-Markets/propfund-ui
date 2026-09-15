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

export const metadata = { title: "Introduction" };

const GATEWAY = (process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:5400").replace(
  /\/$/,
  "",
);

const FLOWS = [
  {
    href: "/docs/quickstart",
    title: "Quickstart",
    desc: "Get the API and this app running locally in ~10 minutes.",
  },
  {
    href: "/docs/authentication",
    title: "Authentication",
    desc: "Privy identity token through the Flo gateway — no app OAuth.",
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
    desc: "Issue scoped programmatic credentials for your traders.",
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
              Sign in with Privy
            </h2>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-5">
            <p className="text-sm text-muted-foreground">
              Same identity as GM Markets. This app stores the Privy identity
              token and sends it as <code>Authorization: Bearer</code> to{" "}
              <code>{GATEWAY}/van</code>. The Flo gateway verifies the JWT and
              proxies to Vanta — there is no app <code>client_id</code> /{" "}
              <code>client_secret</code>.
            </p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>
                Set <code>NEXT_PUBLIC_PRIVY_APP_ID</code> and{" "}
                <code>NEXT_PUBLIC_GATEWAY_URL</code>.
              </li>
              <li>
                Run the Flo gateway and Vanta, then open{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
                .
              </li>
              <li>
                First <code>GET /van/v2/me</code> attaches the user and claims
                the complimentary $10K notional test desk.
              </li>
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              Desk bots use a Vanta-minted <code>X-Api-Key</code> on{" "}
              <code>/van/v2/trading/*</code> only. See the{" "}
              <Link href="/docs/quickstart">Quickstart</Link>.
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
            code={`curl http://localhost:5400/van/v2/me \\
  -H "Authorization: Bearer <privy_identity_token>"`}
          />
          <Callout type="tip" title="Auth is on the gateway">
            Send the Privy identity token. The Flo gateway verifies it and proxies{" "}
            <code>/van</code> to Vanta. See{" "}
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
