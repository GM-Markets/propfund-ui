import type { Metadata } from "next";
import { HeroDotField } from "../../components/propfund/HeroDotField";
import { PageFrame, PricingGrid } from "../../components/propfund/SiteChrome";

export const metadata: Metadata = {
  title: "Evaluation pricing | Propfund",
  description: "Propfund evaluation fees start at $12.",
};

export default function PricingPage() {
  return (
    <PageFrame>
      <section className="route-hero">
        <HeroDotField />
        <div className="route-container">
          <h1>Pick a balance. See the full price.</h1>
          <p>One fee gets you into a one-step evaluation. The rules stay the same at every account size.</p>
        </div>
      </section>
      <section className="route-section">
        <div className="route-container">
          <PricingGrid />
          <p className="pricing-note">The fee pays for access to a simulated evaluation. It is not a deposit or investment. The target is 8% for Forex and 10% for Crypto, Equities, and Commodities.</p>
        </div>
      </section>
      <section className="route-metrics pricing-metrics">
        <div className="route-container">
          <div><strong>1</strong><span>Evaluation phase</span></div>
          <div><strong>100%</strong><span>Eligible reward split</span></div>
          <div><strong>7 days</strong><span>First reward request</span></div>
          <div><strong>$2.5M</strong><span>Maximum simulated account</span></div>
        </div>
      </section>
    </PageFrame>
  );
}