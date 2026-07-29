import type { Metadata } from "next";
import Image from "next/image";
import { HeroDotField } from "@/components/propfund/HeroDotField";
import { PageFrame, StartEvaluationButton } from "@/components/propfund/SiteChrome";

export const metadata: Metadata = {
  title: "How it works | Propfund",
  description: "Four clear steps from evaluation to weekly reward requests.",
};

const steps = [
  {
    title: "Choose your market.",
    body: "Pick what you want to trade and your starting balance. The target and loss limits are shown before checkout.",
    points: ["8% Forex target", "10% target elsewhere", "No deadline"],
    illustration: "/illustrations/workflow.png",
  },
  {
    title: "Trade to the target.",
    body: "Trade the setups you already know. Pass once by hitting the target without crossing either loss limit.",
    points: ["Manual trading", "Your own bots and EAs", "News trading"],
  },
  {
    title: "Move to a scaled account.",
    body: "Once you pass, the target disappears. Keep the account inside its daily and trailing limits while you trade.",
    points: ["No second phase", "No ongoing target", "Seven-day cycles"],
  },
  {
    title: "Request rewards weekly.",
    body: "After seven trading days, request eligible rewards every week and keep building toward a $2.5M simulated account.",
    points: ["Weekly requests", "100% eligible split", "Quarterly scaling reviews"],
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
          <p>One target, one set of loss limits, and a clear route to weekly reward requests.</p>
          <div className="route-actions">
            <StartEvaluationButton className="route-primary" />
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
          <p>The evaluation checks whether you can reach a target without losing control of risk. Take the trades you actually want to take.</p>
          <StartEvaluationButton className="route-primary" />
        </div>
      </section>
    </PageFrame>
  );
}