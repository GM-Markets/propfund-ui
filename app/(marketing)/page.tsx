"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HeroDotField } from "@/components/propfund/HeroDotField";
import { PricingGrid, SiteFooter, SiteHeader, StartChallengeLink } from "@/components/propfund/SiteChrome";
import { paymentSummary, rulesSummary } from "@/components/propfund/site-data";

const questions = [
  { q: "How do I sign in and pay?", a: `Sign in with ${paymentSummary.signIn}. Every trader gets a Propfund wallet. Pay the challenge fee by card or with ${paymentSummary.stablecoins}.` },
  { q: "Do I need to verify my identity to start?", a: "No. There is no identity check at sign-in, when you pay, or while you trade. You verify your identity once, when you request your first payout." },
  { q: "Is the account live capital?", a: "No. Both the challenge and the funded account are simulated. Payouts are based on realized simulated profit on the funded account." },
  { q: "What do I need to pass?", a: `Reach +${rulesSummary.target} with no open positions, without hitting the ${rulesSummary.dailyLoss} daily loss limit or the ${rulesSummary.maxLoss} max loss limit. There is one phase and no deadline.` },
  { q: "Can I hold through news or the weekend?", a: "Yes, as long as the market is open and the position stays inside the published limits." },
  { q: "Can I use a bot or expert advisor?", a: "No. Every order must be placed by hand in the Propfund terminal. Bots, expert advisors, scripts, and API order placement are account violations." },
  { q: "What happens if I hit a loss limit?", a: `Open positions close and the account locks. You can start a new challenge at any size for ${rulesSummary.rebuyDiscount} off the fee.` },
  { q: "When can I request a payout?", a: `On a funded account, once realized profit is at least ${rulesSummary.minPayout} and you have no open positions. You receive ${rulesSummary.traderSplit}, paid in ${rulesSummary.payout} 7 calendar days after the request. Your first payout request includes a one-time identity check.` },
];

function EvaluationVisual() {
  return (
    <div className="evaluation-ui" aria-hidden="true">
      <div className="micro-score"><span>Progress</span><strong><span className="score-start">6.4%</span><span className="score-finish">9.2%</span></strong></div>
      <div className="progress"><i /></div>
      <div className="visual-caption"><span>Start</span><span>Target {rulesSummary.target}</span></div>
    </div>
  );
}

function RulesVisual() {
  return (
    <div className="rules-ui bounds-ui" aria-hidden="true">
      <div className="bound-label bound-label-upper"><span>Target</span><strong>{rulesSummary.target}</strong></div>
      <div className="bound-label bound-label-lower"><span>Max loss</span><strong>{rulesSummary.maxLoss}</strong></div>
      <svg viewBox="0 0 360 120" role="presentation">
        <line className="bound bound-upper" x1="0" y1="29" x2="360" y2="29" />
        <line className="bound bound-lower" x1="0" y1="94" x2="360" y2="94" />
        <path className="trade-path" d="M0 84 C32 81 48 91 73 76 S118 73 143 62 S183 67 207 51 S249 57 274 40 S318 45 360 14" />
      </svg>
    </div>
  );
}

function PayoutVisual() {
  return (
    <div className="rewards-ui" aria-hidden="true">
      <div className="reward-head"><span>Payout review</span><strong>Day 07</strong></div>
      <div className="day-track">{[1, 2, 3, 4, 5, 6, 7].map(day => <i className={day < 6 ? "complete" : "pending"} key={day} />)}</div>
    </div>
  );
}

function SplitVisual() {
  return (
    <div className="rules-ui" aria-hidden="true">
      <div className="rule-stat"><span>You</span><strong>{rulesSummary.traderSplit}</strong></div>
      <div className="rule-stat"><span>Propfund</span><strong>{rulesSummary.propfundSplit}</strong></div>
      <div className="visual-caption"><span>Realized profit</span><span>{rulesSummary.payout}</span></div>
    </div>
  );
}

const heroFeatures = [
  { title: "One challenge", body: `Hit the ${rulesSummary.target} target without crossing a loss limit. That’s it.`, visual: <EvaluationVisual /> },
  { title: "No deadline", body: "Trade when the setup is there, not because the clock is running.", visual: <RulesVisual /> },
  { title: "Paid 7 days after you request", body: `Request realized profit from ${rulesSummary.minPayout} on a funded account. It is paid 7 days later.`, visual: <PayoutVisual /> },
  { title: `${rulesSummary.traderSplit} payout split`, body: `You keep ${rulesSummary.traderSplit} of realized profit on your funded account. Propfund keeps ${rulesSummary.propfundSplit}.`, visual: <SplitVisual /> },
];

const journeyTabs = [
  {
    label: "Challenge",
    title: "Hit one target. Then move on.",
    body: `Pick a package, hit the ${rulesSummary.target} target, and stay inside the ${rulesSummary.dailyLoss} daily and ${rulesSummary.maxLoss} max loss limits. There is no second phase and no clock pushing you into a trade.`,
    stats: [["Profit target", rulesSummary.target], ["Daily / max loss", `${rulesSummary.dailyLoss} / ${rulesSummary.maxLoss}`], ["Trading period", "Unlimited"]],
    statement: "Challenge statement",
    balanceLabel: "Simulated challenge balance",
    balance: "$25,000",
    footer: [["Target", rulesSummary.target], ["Max loss", rulesSummary.maxLoss], ["Time", "Unlimited"]],
  },
  {
    label: "Funded account",
    title: "The test is over. Now trade.",
    body: "Graduate with no open positions and a funded account opens at your package size. Challenge profit is not paid out. There is no profit target, and the same loss limits apply.",
    stats: [["Account size", "Your package size"], ["Loss limits", `${rulesSummary.dailyLoss} daily · ${rulesSummary.maxLoss} max`], ["Profit target", "None"]],
    statement: "Funded account",
    balanceLabel: "Funded account balance",
    balance: "$106,200",
    footer: [["Status", "Active"], ["Daily loss", rulesSummary.dailyLoss], ["Max loss", rulesSummary.maxLoss]],
  },
  {
    label: "Payouts",
    title: "Request your profit. Paid 7 days later.",
    body: `Once realized profit reaches ${rulesSummary.minPayout} and you have no open positions, request a payout. You receive ${rulesSummary.traderSplit}, paid in ${rulesSummary.payout} 7 calendar days after the request.`,
    stats: [["Your split", rulesSummary.traderSplit], ["Minimum payout", rulesSummary.minPayout], ["Paid", "7 days after request"]],
    statement: "Payout summary",
    balanceLabel: "Realized simulated profit",
    balance: "$6,200",
    footer: [["Split", rulesSummary.traderSplit], ["Paid", "Request + 7 days"], ["Status", "Under review"]],
  },
];

function JourneyVisual({ index }: { index: number }) {
  if (index === 1) {
    return (
      <div className="journey-visual journey-scale" aria-hidden="true">
        <div className="journey-scale-bars">
          <div><span>Floor $95K</span></div>
          <div><span>Start $100K</span></div>
          <div><span>Now $106K</span></div>
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="journey-visual journey-rewards" aria-hidden="true">
        <div className="journey-reward-head"><span>Payout review</span><strong>Day 07</strong></div>
        <div className="journey-reward-track">{[1, 2, 3, 4, 5, 6, 7].map((day) => <i key={day} />)}</div>
      </div>
    );
  }

  return (
    <div className="journey-visual journey-evaluation" aria-hidden="true">
      <svg viewBox="0 0 560 150" role="presentation">
        <line x1="0" y1="122" x2="560" y2="122" />
        <line x1="0" y1="30" x2="560" y2="30" />
        <path d="M0 128 C55 122 76 138 118 108 S182 104 224 79 S300 96 337 58 S405 65 450 36 S512 50 560 17" />
      </svg>
    </div>
  );
}

const markets = [
  { name: "Forex", body: "Twenty-nine pairs across the global sessions you already trade.", detail: "See Forex", href: "/forex", illustration: "/illustrations/forex.png" },
  { name: "Crypto", body: "Thirty crypto markets, open around the clock.", detail: "See Crypto", href: "/crypto", illustration: "/illustrations/crypto.png" },
  { name: "Equities", body: "More than 1,000 US stocks and sector ETFs.", detail: "See Equities", href: "/equities", illustration: "/illustrations/equities.png" },
  { name: "Commodities", body: "Six metals and energy markets for macro-driven setups.", detail: "See Commodities", href: "/commodities", illustration: "/illustrations/commodities.png" },
];

const comparisons = [
  { feature: "Challenge", typical: "Often two phases", propfund: "One challenge" },
  { feature: "Payout split", typical: "Varies by program", propfund: `${rulesSummary.traderSplit} to you, ${rulesSummary.propfundSplit} to Propfund` },
  { feature: "Trading period", typical: "Fixed deadline", propfund: "No deadline" },
  { feature: "Max loss", typical: "Often trails your highest balance", propfund: `Fixed floor ${rulesSummary.maxLoss} below the account size` },
];

export default function Home() {
  const [activeJourney, setActiveJourney] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const journey = journeyTabs[activeJourney];

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />

      <main id="main-content">
      <div className="dark-shell">
        <section className="hero">
          <HeroDotField />
          <div className="hero-laser-content">
            <div className="hero-copy">
              <h1>Pass once.<br />Trade your strategy.<br />Keep {rulesSummary.traderSplit} of the profit.</h1>
              <p>One challenge. No deadline. Each payout is paid 7 days after you request it.</p>
              <div className="hero-actions">
                <StartChallengeLink className="pill pill-light pill-large" />
                <Link className="hero-numbers-link" href="/transparency">See the numbers <span aria-hidden="true">→</span></Link>
              </div>
            </div>
            <div className="hero-feature-grid" aria-label="Program highlights">
              {heroFeatures.map(feature => (
                <article key={feature.title}>
                  <div className="hero-feature-visual">{feature.visual}</div>
                  <div className="hero-feature-copy"><h2>{feature.title}</h2><p>{feature.body}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="product-section" id="model">
        <div className="section-intro section-intro-light"><h2>One challenge. Then you trade.</h2></div>
        <div className="product-layout">
          <div className="product-tabs" role="tablist" aria-label="Program journey">
            {journeyTabs.map((tab, index) => (
              <button className={activeJourney === index ? "active" : ""} id={`journey-tab-${index}`} key={tab.label} onClick={() => setActiveJourney(index)} role="tab" aria-selected={activeJourney === index} aria-controls="journey-panel" type="button"><span>0{index + 1}</span>{tab.label}</button>
            ))}
          </div>
          <div className="product-panel" key={activeJourney} id="journey-panel" role="tabpanel" aria-labelledby={`journey-tab-${activeJourney}`}>
            <div className="product-copy">
              <h3>{journey.title}</h3>
              <p>{journey.body}</p>
              <dl>{journey.stats.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            </div>
            <div className="statement-stage">
              <div className="statement-card">
                <header><span>Propfund</span><span>{journey.statement}</span></header>
                <div className="statement-account"><span>Account</span><strong>{journey.balance}</strong><p>{journey.balanceLabel}</p></div>
                <JourneyVisual index={activeJourney} />
                <div className="statement-data">{journey.footer.map(([label, value]) => <span key={label}>{label}<strong>{value}</strong></span>)}</div>
              </div>
              <div className="stage-note"><span>Rules visible before checkout</span><a href="#comparison">Compare the model <span aria-hidden="true">→</span></a></div>
            </div>
          </div>
        </div>
      </section>

      <section className="markets-section" id="markets">
        <div className="section-intro section-intro-light"><h2>Trade the markets you know.</h2></div>
        <div className="market-bento">
          {markets.map((market) => (
            <a className="market-card" href={market.href} key={market.name}>
              <Image className="market-card-illustration" src={market.illustration} alt="" width={2500} height={2500} sizes="(max-width: 760px) 55vw, 340px" unoptimized aria-hidden="true" />
              <div className="market-card-copy"><h3>{market.name}</h3><p>{market.body}</p><span>{market.detail} <i aria-hidden="true">→</i></span></div>
            </a>
          ))}
        </div>
      </section>

      <section className="accounts-section" id="accounts">
        <div className="section-intro section-intro-light"><h2>Pick your starting balance.</h2></div>
        <PricingGrid className="home-pricing-grid" />
        <p className="home-payment-note">Sign in with {paymentSummary.signIn}. Pay by card or with {paymentSummary.stablecoins}.</p>
      </section>

      <section className="comparison-table-section" id="comparison">
        <div className="comparison-table-inner">
          <div className="comparison-table-head"><h2>A prop challenge without the usual maze.</h2><p>One phase, no deadline, and the same limits at every account size.</p></div>
          <div className="comparison-table-wrap">
            <table>
              <thead><tr><th scope="col">What matters</th><th scope="col">Typical challenge</th><th scope="col">Propfund</th></tr></thead>
              <tbody>{comparisons.map(item => <tr key={item.feature}><th scope="row">{item.feature}</th><td data-label="Typical challenge">{item.typical}</td><td data-label="Propfund">{item.propfund}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="faq-intro"><h2>A few things traders usually ask.</h2></div>
        <div className="faq-list">{questions.map((item, index) => {
          const isOpen = openFaq === index;
          return (
            <div className={`faq-item ${isOpen ? "open" : ""}`} key={item.q}>
              <button className="faq-question" type="button" aria-expanded={isOpen} aria-controls={`faq-answer-${index}`} onClick={() => setOpenFaq(isOpen ? null : index)}><span>{item.q}</span><i aria-hidden="true">+</i></button>
              <div className="faq-answer" id={`faq-answer-${index}`} aria-hidden={!isOpen}><div><p>{item.a}</p></div></div>
            </div>
          );
        })}</div>
      </section>

      <section className="closing-section"><h2>Ready when you are.<br /><span>Pick an account and start.</span></h2><StartChallengeLink className="data-cta"><span className="data-cta-icon">P</span><span>Start your challenge<small>Pay by card or stablecoin</small></span><i aria-hidden="true">→</i></StartChallengeLink></section>
      </main>
      <SiteFooter />
    </>
  );
}