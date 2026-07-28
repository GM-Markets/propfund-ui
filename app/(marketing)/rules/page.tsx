import type { Metadata } from "next";
import { HeroDotField } from "@/components/propfund/HeroDotField";
import { PageFrame, StartEvaluationButton } from "@/components/propfund/SiteChrome";

export const metadata: Metadata = {
  title: "Trading rules | Propfund",
  description: "The Propfund evaluation and scaled-account rules in plain English.",
};

const evaluationRules = [
  ["Performance target", "8% for Forex. 10% for Crypto, Equities, and Commodities."],
  ["Daily loss limit", "5% of the account balance, measured using the calculation shown in the trader portal."],
  ["Trailing drawdown", "5% end-of-day trailing drawdown during the evaluation."],
  ["Trading period", "Unlimited. There is no minimum number of trading days."],
  ["Activity", "Place at least one trade every 60 days to keep the account active."],
];

const scaledRules = [
  ["Profit target", "None. After you pass, there is no target to keep chasing."],
  ["Daily loss limit", "5% of the account balance."],
  ["Trailing drawdown", "8% end-of-day trailing drawdown."],
  ["Reward cycle", "Your first eligible reward request comes after seven trading days. You can request again every week."],
  ["Eligible split", "You receive 100% of eligible realized simulated profits, subject to the account checks."],
];

const strategyRules = [
  {
    title: "Trade the setups you know",
    body: "Trade manually, around news, overnight, or over the weekend when the market is open and the account stays inside its limits.",
  },
  {
    title: "Use automation you built",
    body: "Your own bots, expert advisors, and algorithms are allowed. The strategy must be yours and remain under your control.",
  },
  {
    title: "Do not copy another trader",
    body: "Third-party signals, account mirroring, coordinated trading, and services that reproduce someone else’s orders are not allowed.",
  },
  {
    title: "Keep the account to yourself",
    body: "Do not share, transfer, or sell your login. The account belongs to one trader, and that trader is responsible for every order.",
  },
];

export default function RulesPage() {
  return (
    <PageFrame>
      <section className="route-hero rules-hero">
        <HeroDotField />
        <div className="route-container">
          <h1>Trading rules.</h1>
          <p>Everything you need to pass and keep your account in good standing.</p>
          <div className="route-actions">
            <StartEvaluationButton className="route-primary" />
            <a className="route-secondary" href="/how-it-works">See how it works</a>
          </div>
        </div>
      </section>

      <section className="rules-overview">
        <div className="route-container">
          <article><strong>1</strong><span>Evaluation phase</span></article>
          <article><strong>5%</strong><span>Evaluation loss limits</span></article>
          <article><strong>Unlimited</strong><span>Time to pass</span></article>
          <article><strong>Weekly</strong><span>Reward requests</span></article>
        </div>
      </section>

      <section className="route-section">
        <div className="route-container">
          <div className="route-section-head"><h2>While you’re being evaluated.</h2><p>Hit the target without crossing either loss limit.</p></div>
          <div className="rules-table">
            {evaluationRules.map(([label, value]) => <div key={label}><strong>{label}</strong><p>{value}</p></div>)}
          </div>
        </div>
      </section>

      <section className="route-section route-section-dark">
        <div className="route-container">
          <div className="route-section-head"><h2>After you pass.</h2><p>The target disappears. The risk limits and weekly rhythm remain.</p></div>
          <div className="rules-table rules-table-dark">
            {scaledRules.map(([label, value]) => <div key={label}><strong>{label}</strong><p>{value}</p></div>)}
          </div>
        </div>
      </section>

      <section className="route-section" id="tradeable-markets">
        <div className="route-container">
          <div className="route-section-head"><h2>How you can trade.</h2><p>Use your own process. Keep the account personal.</p></div>
          <div className="route-feature-grid strategy-grid">
            {strategyRules.map((rule) => <article key={rule.title}><h3>{rule.title}</h3><p>{rule.body}</p></article>)}
          </div>
          <p className="rules-note">The trader portal shows the live calculation for every account limit. If a value there differs from this summary, the portal value applies.</p>
        </div>
      </section>
    </PageFrame>
  );
}