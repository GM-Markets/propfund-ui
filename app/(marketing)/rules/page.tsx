import type { Metadata } from "next";
import { HeroDotField } from "@/components/propfund/HeroDotField";
import Link from "next/link";
import { PageFrame, StartChallengeLink } from "@/components/propfund/SiteChrome";
import { ACTIVITY_DAYS, rulesSummary } from "@/components/propfund/site-data";

export const metadata: Metadata = {
  title: "Trading rules | Propfund",
  description: "The Propfund challenge, funded account, payout, and violation rules in plain English.",
};

const challengeRules = [
  ["Profit target", `${rulesSummary.target} of the account size in every market: Forex, Crypto, Equities, and Commodities.`],
  ["Daily loss limit", `${rulesSummary.dailyLoss} of the account size, counted down from your balance at 00:00 UTC. Open positions count toward it. On a $100,000 account that starts the day at $101,200, the limit is hit at $98,200 equity.`],
  ["Max loss limit", `A fixed floor ${rulesSummary.maxLoss} below the account size. It does not trail your high point: on a $100,000 account the floor stays at $95,000, however much profit came first.`],
  ["Graduation", `Reach +${rulesSummary.target} with no open positions. Challenge profit is not paid out. A funded account opens at your package size.`],
  ["Trading period", "Unlimited. There is no minimum number of trading days."],
  ["Activity", `Place at least one trade every ${ACTIVITY_DAYS} days. An account with no trade in ${ACTIVITY_DAYS} days is closed for inactivity.`],
  ["One active account", "You can hold one active account, challenge or funded, at a time. You can buy a new challenge once the current account has closed."],
  ["If you hit a loss limit", `Every open position closes and the account locks. You can start a new challenge at any size for ${rulesSummary.rebuyDiscount} off the fee.`],
];

const fundedRules = [
  ["Account size", "Your package size. There is no scaling plan."],
  ["Profit target", "None. After you pass, there is no target to keep chasing."],
  ["Loss limits", `The same as the challenge: ${rulesSummary.dailyLoss} daily loss from the 00:00 UTC balance and a fixed ${rulesSummary.maxLoss} max loss floor. Hitting either one closes open positions and locks the account.`],
  ["Payout split", `You receive ${rulesSummary.traderSplit} of realized profit. Propfund keeps ${rulesSummary.propfundSplit}.`],
  ["Payout requests", `Request your full realized profit once it is at least ${rulesSummary.minPayout}, with no open positions and no other payout pending.`],
  ["Payment date", `Paid in ${rulesSummary.payout} 7 calendar days after the request. A request on Tue 15 Sep is paid on Tue 22 Sep. The 7 days are a review window for account violations. You can keep trading during the review.`],
  ["Payout address", "Your Propfund wallet by default. You can enter another address, but it must be an Arbitrum address you control. Payouts sent to a wrong address may not be recoverable."],
  ["Identity verification", "Not needed to sign in, buy a challenge, or trade. You verify your identity once, as the first step of your first payout request, and later payouts reuse it. The 7 days start when the request is submitted."],
];

const strategyRules = [
  {
    title: "Trade the setups you know",
    body: "Manual trading, news trading, and holding overnight or over the weekend when the market is open are allowed, as long as the account stays inside its limits.",
  },
  {
    title: "Place every order by hand",
    body: "Automated trading is not allowed. Bots, expert advisors, scripts, API order placement, and macros all count as violations.",
  },
  {
    title: "Do not copy another trader",
    body: "Third-party signals, trade copiers, account mirroring, and coordinated group trading are not allowed.",
  },
  {
    title: "Keep the account to yourself",
    body: "Do not share, transfer, or sell your login. The account belongs to one trader, and that trader is responsible for every order.",
  },
];

const violations = [
  ["V1 · Automated trading", "Bots, expert advisors, scripts, API order placement, macros, auto-clickers, and browser automation. Every order must be placed by hand in the Propfund terminal."],
  ["V2 · Wash or cross-account hedging", "Holding opposite positions in the same instrument across two or more accounts, including accounts of family, friends, or other traders."],
  ["V3 · Multiple identities", "More than one profile per person, or the same device, IP, wallet, payment method, or identity behind different profiles."],
  ["V4 · Copy and signal trading", "Mirroring another trader’s orders, trade copiers, paid signal groups, or coordinated group trading."],
  ["V5 · Account sharing or passing services", "Letting anyone else log in or trade, or paying a service to pass the challenge or manage the funded account."],
  ["V6 · Exploiting the platform", "Trading on stale or wrong prices, latency arbitrage, or deliberately exploiting bugs or pricing errors."],
  ["V7 · Payment abuse", "Chargebacks or disputes on the fee, stolen cards or wallets, or funds tied to sanctioned addresses."],
  ["V8 · Restricted access", "Trading from a restricted country, or using a VPN or proxy to hide your location."],
  ["If a violation is confirmed", "Every payout under review on any of your accounts is voided and the profit is forfeited. All of your accounts are closed, fees are not refunded, no rebuy discount is offered, and you cannot buy new challenges. Payouts already paid can be recovered under the Terms of Service. You will see the violation code and reason, and you can appeal to support@propfund.io."],
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
            <StartChallengeLink className="route-primary" />
            <a className="route-secondary" href="/how-it-works">See how it works</a>
          </div>
        </div>
      </section>

      <section className="rules-overview">
        <div className="route-container">
          <article><strong>{rulesSummary.target}</strong><span>Profit target</span></article>
          <article><strong>{rulesSummary.dailyLoss} / {rulesSummary.maxLoss}</strong><span>Daily / max loss limit</span></article>
          <article><strong>Unlimited</strong><span>Time to pass</span></article>
          <article><strong>{rulesSummary.traderSplit}</strong><span>Payout split</span></article>
        </div>
      </section>

      <section className="route-section">
        <div className="route-container">
          <div className="route-section-head"><h2>During the challenge.</h2><p>Hit the target without crossing either loss limit.</p></div>
          <div className="rules-table">
            {challengeRules.map(([label, value]) => <div key={label}><strong>{label}</strong><p>{value}</p></div>)}
          </div>
        </div>
      </section>

      <section className="route-section route-section-dark" id="payouts">
        <div className="route-container">
          <div className="route-section-head"><h2>After you pass.</h2><p>The target disappears. The same loss limits remain, and payouts begin.</p></div>
          <div className="rules-table rules-table-dark">
            {fundedRules.map(([label, value]) => <div key={label}><strong>{label}</strong><p>{value}</p></div>)}
          </div>
        </div>
      </section>

      <section className="route-section" id="tradeable-markets">
        <div className="route-container">
          <div className="route-section-head"><h2>How you can trade.</h2><p>Trade by hand. Keep the account personal.</p></div>
          <div className="route-feature-grid strategy-grid">
            {strategyRules.map((rule) => <article key={rule.title}><h3>{rule.title}</h3><p>{rule.body}</p></article>)}
          </div>
        </div>
      </section>

      <section className="route-section route-section-muted" id="violations">
        <div className="route-container">
          <div className="route-section-head"><h2>Account violations.</h2><p>These are checked on every account and in full during each payout review.</p></div>
          <div className="rules-table">
            {violations.map(([label, value]) => <div key={label}><strong>{label}</strong><p>{value}</p></div>)}
          </div>
          <p className="rules-note">Read the full terms in the <Link href="/terms-of-service">Terms of Service</Link>, or browse the <Link href="/help/violations">help article on violations</Link>. The trader portal shows the live calculation for every account limit. If a value there differs from this summary, the portal value applies.</p>
        </div>
      </section>
    </PageFrame>
  );
}
