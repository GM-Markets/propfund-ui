import type { Metadata } from "next";
import { HeroDotField } from "@/components/propfund/HeroDotField";
import { PageFrame, PricingGrid } from "@/components/propfund/SiteChrome";

export const metadata: Metadata = {
  title: "Evaluation pricing | Propfund",
  description: "Compare Propfund evaluation balances, one-time fees, targets, and account rules.",
};

export default function PricingPage() {
  return (
    <PageFrame>
      <section className="route-hero">
        <HeroDotField />
        <div className="route-container">
          <h1>Evaluation accounts and fees.</h1>
          <p>Choose a starting simulated balance. Every account size uses the same loss limits, reward split, and scaling rules.</p>
        </div>
      </section>
      <section className="route-section">
        <div className="route-container">
          <PricingGrid />
          <p className="pricing-note">Your fee buys access to a simulated evaluation. It is not a deposit or investment. The target is 8% for Forex and 10% for every other supported market.</p>
        </div>
      </section>
      <section className="route-metrics pricing-metrics">
        <div className="route-container">
          <div><strong>1</strong><span>Evaluation phase</span></div>
          <div><strong>100%</strong><span>Eligible reward split</span></div>
          <div><strong>7 days</strong><span>To first eligible request</span></div>
          <div><strong>$2.5M</strong><span>Simulated scaling ceiling</span></div>
        </div>
      </section>
    </PageFrame>
  );
}