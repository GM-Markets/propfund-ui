import type { Metadata } from "next";
import Image from "next/image";
import { HeroDotField } from "@/components/propfund/HeroDotField";
import { PageFrame, StartEvaluationButton } from "@/components/propfund/SiteChrome";
import { MaterialIcon } from "@/components/propfund/MaterialIcon";

export const metadata: Metadata = {
  title: "Trading rules | Propfund",
  description: "Read every Propfund evaluation, scaled-account, strategy, and reward rule before you trade.",
};

const evaluationRules = [
  ["Performance target", "8% for Forex. 10% for Crypto, Equities, and Commodities."],
  ["Balance loss limit", "Your balance cannot fall more than 5% below the starting account balance at any time."],
  ["Equity loss limit", "At the daily 12:00 AM UTC check, equity including unrealized P&L cannot be more than 5% below the starting balance."],
  ["Trading period", "Unlimited. There is no minimum number of trading days."],
  ["Consistency rule", "None. You can generate any share of the target in a single trading day."],
  ["Activity", "Place at least one trade every 60 days to keep the account active."],
];

const scaledRules = [
  ["Performance target", "None. Once you pass, there is no target to keep chasing."],
  ["Balance loss limit", "The same static 5% balance loss limit applies."],
  ["Equity loss limit", "The same static 5% equity loss limit is checked daily at 12:00 AM UTC."],
  ["Reward cycle", "Your first eligible reward request comes after seven trading days. You can then request again every week."],
  ["Eligible split", "You receive 100% of eligible realized simulated profits, subject to the account checks."],
  ["Scaling", "Quarterly scaling requires at least a 5% return and a Sharpe ratio of 1 or above."],
];

const strategyRules = [
  {
    icon: "schedule",
    title: "Trade when the setup is there",
    body: "Scalp, swing, trade the news, or hold overnight and over the weekend. The account limits still apply.",
    visual: "sessions",
  },
  {
    icon: "tune",
    title: "Use the tools you built",
    body: "Your own bots, expert advisors, and algorithms are welcome. You stay in control of the strategy and every order.",
    visual: "automation",
  },
  {
    icon: "trending_up",
    title: "Keep the strategy yours",
    body: "Mirror your own trades across your own accounts. Third-party signals and services that reproduce another trader's orders are not allowed.",
    visual: "strategy",
  },
  {
    icon: "shield",
    title: "One trader, one account",
    body: "Keep your login private. The account belongs to one trader, and that trader remains responsible for every order.",
    visual: "identity",
  },
];

function StrategyVisual({ type }: { type: string }) {
  if (type === "sessions") {
    return (
      <div className="rule-motion rule-motion-session" aria-hidden="true">
        <div className="rule-clock">
          <svg viewBox="0 0 160 160" role="presentation">
            <circle className="rule-clock-track" cx="80" cy="80" r="56" pathLength="100" />
            <circle className="rule-clock-progress" cx="80" cy="80" r="56" pathLength="100" />
          </svg>
          <i className="rule-clock-hand" />
          <strong>24H</strong>
        </div>
        <div className="rule-session-list">
          {[
            ["News", "Open"],
            ["Overnight", "Hold"],
            ["Weekend", "Hold"],
          ].map(([label, state]) => (
            <span key={label}><i /><strong>{label}</strong><small>{state}</small></span>
          ))}
        </div>
      </div>
    );
  }

  if (type === "automation") {
    return (
      <div className="rule-motion rule-motion-automation" aria-hidden="true">
        <div className="rule-automation-head"><span>Execution</span><strong><i /> Ready</strong></div>
        <div className="rule-automation-mode"><small>Mode</small><strong>Automated</strong></div>
        <div className="rule-automation-flow">
          <i className="rule-automation-line" />
          <b className="rule-automation-pulse" />
          <span><i />Signal</span>
          <span><i />Risk check</span>
          <span><i />Order</span>
        </div>
        <div className="rule-automation-foot"><span>Your logic</span><strong>In control</strong></div>
      </div>
    );
  }

  if (type === "strategy") {
    return (
      <div className="rule-motion rule-motion-compare" aria-hidden="true">
        <div className="rule-compare-status"><span>Blocked</span><strong>Allowed</strong></div>
        <div className="rule-compare-stage">
          <div className="rule-compare-panel rule-compare-external">
            <small>Third-party</small>
            <strong>External control</strong>
            <span>Not allowed</span>
          </div>
          <div className="rule-compare-panel rule-compare-owned">
            <small>Yours</small>
            <strong>Your strategy</strong>
            <span>Private access</span>
          </div>
          <i className="rule-compare-divider"><span>&lt;&gt;</span></i>
        </div>
      </div>
    );
  }

  return (
    <div className="rule-motion rule-motion-identity" aria-hidden="true">
      <i className="rule-identity-scan" />
      <i className="rule-identity-corner rule-identity-corner-a" />
      <i className="rule-identity-corner rule-identity-corner-b" />
      <div className="rule-identity-card">
        <div className="rule-identity-mark">
          <Image src="/brand/propfund-mark-dark.svg" alt="" width={35} height={31} />
        </div>
        <div className="rule-identity-name">
          <span>Account holder</span>
          <strong>Verified trader</strong>
        </div>
        <div className="rule-identity-seal"><i>OK</i><span>Verified</span></div>
      </div>
    </div>
  );
}
export default function RulesPage() {
  return (
    <PageFrame>
      <section className="route-hero rules-hero">
        <HeroDotField />
        <div className="route-container">
          <h1>Propfund trading rules.</h1>
          <p>Everything you need before you begin: performance targets, loss limits, permitted strategies, and reward eligibility.</p>
          <div className="route-actions">
            <StartEvaluationButton className="route-primary" />
            <a className="route-secondary" href="/how-it-works">See how it works</a>
          </div>
        </div>
      </section>

      <section className="rules-overview">
        <div className="route-container">
          <article><strong>1</strong><span>Evaluation phase</span></article>
          <article><strong>2 × 5%</strong><span>Static loss limits</span></article>
          <article><strong>Unlimited</strong><span>Trading period</span></article>
          <article><strong>Weekly</strong><span>Eligible request cycle</span></article>
        </div>
      </section>

      <section className="route-section">
        <div className="route-container">
          <div className="route-section-head"><h2>Evaluation rules</h2><p>Reach the market target without breaching either 5% static loss limit.</p></div>
          <div className="rules-table">
            {evaluationRules.map(([label, value]) => <div key={label}><strong>{label}</strong><p>{value}</p></div>)}
          </div>
        </div>
      </section>

      <section className="route-section route-section-dark">
        <div className="route-container">
          <div className="route-section-head"><h2>Scaled account rules</h2><p>After you pass, the target is removed. The two static loss limits remain.</p></div>
          <div className="rules-table rules-table-dark">
            {scaledRules.map(([label, value]) => <div key={label}><strong>{label}</strong><p>{value}</p></div>)}
          </div>
        </div>
      </section>

      <section className="route-section" id="tradeable-markets">
        <div className="route-container">
          <div className="route-section-head strategy-section-head"><h2>Trade your way. Keep it yours.</h2><p>The format is flexible. The strategy and account ownership are not.</p></div>
          <div className="strategy-grid rules-motion-grid">
            {strategyRules.map((rule) => <article key={rule.title}>
              <div className="strategy-copy"><MaterialIcon name={rule.icon} className="strategy-icon" /><h3>{rule.title}</h3><p>{rule.body}</p></div>
              <StrategyVisual type={rule.visual} />
            </article>)}
          </div>
          <p className="rules-note">The trader portal shows the live calculation for every account limit. If a value there differs from this summary, the portal value applies.</p>
        </div>
      </section>
    </PageFrame>
  );
}