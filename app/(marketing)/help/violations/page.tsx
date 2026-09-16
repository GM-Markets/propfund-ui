import Link from "next/link";

import { HelpArticle, helpMetadata } from "@/components/docs/article";
import { Callout, DataTable, DocSection } from "@/components/docs/blocks";

export const metadata = helpMetadata("violations");

export default function ViolationsPage() {
  return (
    <HelpArticle slug="violations">
      <DocSection id="the-eight-violations" title="The eight violations" description="Checked on every account, and in full during each payout review and before graduation.">
        <DataTable
          head={["Code", "Violation", "Covers"]}
          rows={[
            ["V1", "Algorithmic or automated trading", "Bots, expert advisors, scripts, API order placement, macros, auto-clickers and browser automation. Every order is placed by hand in the terminal."],
            ["V2", "Wash or cross-account hedging", "Opposite positions in the same instrument across accounts you control, family or friends' accounts, or coordinated with other traders."],
            ["V3", "Multiple identities", "More than one profile per person, or the same device, IP, wallet, payment method or verified identity behind different profiles."],
            ["V4", "Copy and signal trading", "Mirroring another trader, trade copiers, paid signal groups and coordinated group trading."],
            ["V5", "Account sharing or paid passing", "Anyone else logging in or trading, or paying someone to pass or manage the account."],
            ["V6", "Exploiting the platform", "Stale or wrong prices, latency arbitrage and deliberately exploiting bugs."],
            ["V7", "Payment abuse", "Card chargebacks or disputes, stolen cards or wallets, and funds linked to sanctioned addresses."],
            ["V8", "Restricted access", "Using Propfund from a restricted jurisdiction, or using a VPN or proxy to hide your location."],
          ]}
        />
      </DocSection>

      <DocSection id="allowed" title="What is allowed">
        <ul>
          <li>Manual trading in the Propfund terminal.</li>
          <li>News trading.</li>
          <li>Holding positions overnight or over a weekend while the market is open.</li>
        </ul>
      </DocSection>

      <DocSection id="consequences" title="If a violation is confirmed">
        <ul>
          <li>Every payout under review is voided and the profit is forfeited.</li>
          <li>All of your accounts are terminated.</li>
          <li>Fees are not refunded.</li>
          <li>No rebuy is offered.</li>
          <li>You can&apos;t buy a challenge again.</li>
          <li>Payouts already paid are not reversed on-chain, but Propfund can recover them under the <Link href="/terms-of-service">Terms of Service</Link>.</li>
        </ul>
        <p>A violation screen appears over the terminal with the violation code, a plain-language reason, the voided amount and the appeal contact. It has no rebuy button.</p>
        <Callout type="info" title="Appeals">
          If you believe a violation was flagged in error, email support@propfund.io with your violation code and any details that help us review it.
        </Callout>
      </DocSection>
    </HelpArticle>
  );
}
