import type { Metadata } from "next";
import Image from "next/image";
import { HeroDotField } from "@/components/propfund/HeroDotField";
import { PageFrame, StartChallengeLink } from "@/components/propfund/SiteChrome";
import { paymentSummary, rulesSummary } from "@/components/propfund/site-data";

export const metadata: Metadata = {
  title: "How it works | Propfund",
  description: "Four clear steps from challenge to funded account payouts.",
};

const steps = [
  {
    title: "Sign in and pick a package.",
    body: `Sign in with ${paymentSummary.signIn}; every trader gets a Propfund wallet. Pick an account size from $5,000 to $100,000 and pay the fee by card or with ${paymentSummary.stablecoins}. The target and loss limits are the same at every size and shown before you pay.`,
    points: [`${rulesSummary.target} target in every market`, `${rulesSummary.dailyLoss} daily, ${rulesSummary.maxLoss} max loss`, "Card or stablecoin"],
    illustration: "/illustrations/workflow.png",
  },
  {
    title: "Trade to the target.",
    body: `Trade the setups you already know, by hand. Graduate by reaching +${rulesSummary.target} with no open positions, without crossing either loss limit.`,
    points: ["Manual trading only", "News trading allowed", "No minimum trading days"],
  },
  {
    title: "Move to a funded account.",
    body: `Once you pass, the target disappears. Challenge profit is not paid out; your funded account opens at your package size with the same ${rulesSummary.dailyLoss} daily and ${rulesSummary.maxLoss} max loss limits.`,
    points: ["No second phase", "No ongoing target", "Same loss limits"],
  },
  {
    title: "Request payouts.",
    body: `Request your full realized profit once it reaches ${rulesSummary.minPayout}. You receive ${rulesSummary.traderSplit}, paid in ${rulesSummary.payout} 7 calendar days after the request. Your first request includes a one-time identity check.`,
    points: [`${rulesSummary.traderSplit} trader split`, `${rulesSummary.minPayout} minimum`, `Paid in ${rulesSummary.payout}`],
    illustration: "/illustrations/steps.png",
  },
];

export default function HowItWorksPage() {
  return (
    <PageFrame>
      <section className="route-hero">
        <HeroDotField />
        <div className="route-container">
          <h1>Pass once. Know what comes next.</h1>
          <p>One target, one set of loss limits, and a clear route to payouts.</p>
          <div className="route-actions">
            <StartChallengeLink className="route-primary" />
            <a className="route-secondary" href="/rules">Read the rules</a>
          </div>
        </div>
      </section>
      <section className="route-section how-section">
        <div className="route-container how-steps">
          {steps.map((step) => (
            <article className={step.illustration ? "how-step-card has-illustration" : "how-step-card"} key={step.title}>
              <div className="how-step-copy"><h2>{step.title}</h2><p>{step.body}</p></div>
              {step.illustration ? <Image src={step.illustration} alt="" width={2500} height={2500} sizes="(max-width: 760px) 42vw, 420px" unoptimized aria-hidden="true" /> : null}
              <ul>{step.points.map((point) => <li key={point}>{point}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>
      <section className="route-callout">
        <div className="route-container">
          <h2>No second phase. No countdown.</h2>
          <p>The challenge checks whether you can reach a target without losing control of risk. Take the trades you actually want to take.</p>
          <StartChallengeLink className="route-primary" />
        </div>
      </section>
    </PageFrame>
  );
}