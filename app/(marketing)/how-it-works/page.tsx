import type { Metadata } from "next";
import Image from "next/image";
import { HeroDotField } from "@/components/propfund/HeroDotField";
import { PageFrame, StartEvaluationButton } from "@/components/propfund/SiteChrome";

export const metadata: Metadata = {
  title: "How it works | Propfund",
  description: "See how the Propfund evaluation, scaled account, and weekly reward cycle work.",
};

const steps = [
  {
    title: "Choose your account",
    body: "Pick a market and balance. Every target, limit, and evaluation fee is visible before checkout.",
    points: ["$5K to $100K", "Four markets", "Terms up front"],
    illustration: "/illustrations/workflow.png",
  },
  {
    title: "Trade the setup",
    body: "Trade manually or run your own automation. News, overnight, and weekend holds are allowed inside the account limits.",
    points: ["Your own strategy", "News trading", "Overnight holds"],
  },
  {
    title: "Pass one evaluation",
    body: "Reach the market target without breaching either 5% static loss limit. There is no second phase and no deadline.",
    points: ["One target", "Two static limits", "Take your time"],
  },
  {
    title: "Request rewards weekly",
    body: "Move to a simulated scaled account. After seven trading days, request 100% of eligible rewards, then repeat each week.",
    points: ["Seven trading days", "100% eligible split", "Up to $2.5M"],
    illustration: "/illustrations/steps.png",
  },
];

function StepVisual({ index, illustration }: { index: number; illustration?: string }) {
  if (illustration) {
    return (
      <div className="how-step-visual how-step-image" aria-hidden="true">
        <Image src={illustration} alt="" width={2500} height={2500} sizes="(max-width: 760px) 42vw, 420px" unoptimized />
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="how-step-visual how-step-window" aria-hidden="true">
        <div className="how-instrument-head"><span>Trading window</span><strong><i /> Open</strong></div>
        <div className="how-window-track">
          <i className="how-window-progress" />
          <span><i />News</span>
          <span><i />Overnight</span>
          <span><i />Weekend</span>
        </div>
        <div className="how-window-foot"><span>Trade when the setup is there</span><strong>Within your limits</strong></div>
      </div>
    );
  }

  return (
    <div className="how-step-visual how-step-pass" aria-hidden="true">
      <div className="how-instrument-head"><span>Evaluation progress</span><strong>One phase</strong></div>
      <svg viewBox="0 0 360 120" role="presentation">
        <line className="how-pass-target" x1="0" y1="30" x2="360" y2="30" />
        <line className="how-pass-limit" x1="0" y1="94" x2="360" y2="94" />
        <path d="M0 86 C38 83 50 91 78 73 S126 73 151 60 S194 66 221 50 S266 55 291 38 S326 41 360 16" />
        <circle className="how-pass-marker" cx="360" cy="16" r="4" />
      </svg>
      <div className="how-pass-foot"><span>5% static limits</span><strong>Target reached</strong></div>
    </div>
  );
}
export default function HowItWorksPage() {
  return (
    <PageFrame>
      <section className="route-hero">
        <HeroDotField />
        <div className="route-container">
          <h1>How Propfund works.</h1>
          <p>Choose an account, reach the target, and move to a simulated scaled account. Reward requests open after seven trading days.</p>
          <div className="route-actions">
            <StartEvaluationButton className="route-primary" />
            <a className="route-secondary" href="/rules">Read the rules</a>
          </div>
        </div>
      </section>
      <section className="route-section how-section">
        <div className="route-container">
          <div className="how-journey-head">
            <h2>From evaluation to weekly rewards.</h2>
            <p>One clear path, with the rules visible at every stage.</p>
          </div>
          <div className="how-program-strip" aria-label="Program summary">
            <div><span>Evaluation</span><strong>One phase</strong></div>
            <div><span>Trading period</span><strong>Unlimited</strong></div>
            <div><span>Eligible split</span><strong>100%</strong></div>
            <div><span>Scaling</span><strong>Up to $2.5M</strong></div>
          </div>
          <div className="how-steps">
            {steps.map((step, index) => (
              <article className={`how-step-card has-visual ${step.illustration ? "has-illustration" : ""}`} key={step.title}>
                <StepVisual index={index} illustration={step.illustration} />
                <div className="how-step-copy"><h3>{step.title}</h3><p>{step.body}</p></div>
                <ul>{step.points.map((point) => <li key={point}>{point}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PageFrame>
  );
}