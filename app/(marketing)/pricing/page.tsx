import type { Metadata } from "next";
import { HeroDotField } from "@/components/propfund/HeroDotField";
import { PageFrame, PricingGrid } from "@/components/propfund/SiteChrome";
import { challengePackages, depositChains, formatUsd, paymentSummary, rulesSummary } from "@/components/propfund/site-data";

const entryPackage = challengePackages[0];

export const metadata: Metadata = {
  title: "Challenge pricing | Propfund",
  description: `Propfund challenge fees start at ${formatUsd(entryPackage.fee)} for a ${formatUsd(entryPackage.accountSize)} account.`,
};

export default function PricingPage() {
  return (
    <PageFrame>
      <section className="route-hero">
        <HeroDotField />
        <div className="route-container">
          <h1>Pick a balance. See the full price.</h1>
          <p>One fee gets you into a one-step challenge. The rules stay the same at every account size.</p>
        </div>
      </section>
      <section className="route-section">
        <div className="route-container">
          <PricingGrid />
          <p className="pricing-note">Pay by card or with {paymentSummary.stablecoins}. The fee pays for access to a simulated challenge. It is not a deposit or investment, and it is not refundable. The target is {rulesSummary.target} for every market. If an account hits a loss limit, your next challenge at any size costs {rulesSummary.rebuyDiscount} less. The rebuy price does not apply after an account is closed for a rule violation.</p>
        </div>
      </section>
      <section className="route-section route-section-muted" id="payment">
        <div className="route-container">
          <div className="route-section-head"><h2>Ways to pay.</h2><p>Card or stablecoin. Your account opens as soon as the payment is confirmed.</p></div>
          <div className="rules-table">
            <div><strong>Card</strong><p>Pay in a hosted card checkout run by our card payment processor. Propfund never sees your full card number.</p></div>
            {depositChains.map((chain) => (
              <div key={chain.id}><strong>{chain.tokens.join(" or ")} on {chain.name}</strong><p>Counts after {chain.confirmations} {chain.confirmations === 1 ? "confirmation" : "confirmations"}. 1 {chain.tokens[0]} = 1 {chain.tokens[1]} = $1. The network fee is paid by the sender.</p></div>
            ))}
            <div><strong>Overpayment</strong><p>Anything you send above the fee is kept as a deposit balance for your next purchase.</p></div>
          </div>
          <p className="rules-note">{paymentSummary.depositWarning} Sign-in and payment never ask for identity documents; you verify your identity once, at your first payout request.</p>
        </div>
      </section>
      <section className="route-metrics pricing-metrics">
        <div className="route-container">
          <div><strong>1</strong><span>Challenge phase</span></div>
          <div><strong>{rulesSummary.traderSplit}</strong><span>Payout split</span></div>
          <div><strong>{rulesSummary.reviewDays}</strong><span>From payout request to payment</span></div>
          <div><strong>{rulesSummary.dailyLoss} / {rulesSummary.maxLoss}</strong><span>Daily / max loss limit</span></div>
        </div>
      </section>
    </PageFrame>
  );
}
