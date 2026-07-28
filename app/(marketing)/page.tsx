"use client";

import Image from "next/image";
import { useState } from "react";
import { HeroDotField } from "@/components/propfund/HeroDotField";
import { EvaluationDialog } from "@/components/propfund/EvaluationDialog";
import { MaterialIcon } from "@/components/propfund/MaterialIcon";
import { SiteFooter, SiteHeader } from "@/components/propfund/SiteChrome";
import { pricingPlans } from "@/components/propfund/site-data";



const questions = [
  { q: "Is the account live capital?", a: "No. Both the evaluation and scaled account are simulated. Reward requests are based on eligible simulated profits." },
  { q: "What do I need to pass?", a: "Hit your market’s target without breaching the daily loss or trailing drawdown limit. There is one phase and no deadline." },
  { q: "Can I hold through news or the weekend?", a: "Yes, as long as the market is open and the position stays inside the published limits." },
  { q: "When can I request a reward?", a: "After seven trading days on a scaled account. From then on, eligible rewards can be requested every week." },
];

function EvaluationVisual() {
  return (
    <div className="evaluation-ui" aria-hidden="true">
      <div className="micro-score"><span>Progress</span><strong><span className="score-start">6.4%</span><span className="score-finish">9.2%</span></strong></div>
      <div className="progress"><i /></div>
      <div className="visual-caption"><span>Start</span><span>Target 8%</span></div>
    </div>
  );
}

function RulesVisual() {
  return (
    <div className="rules-ui bounds-ui" aria-hidden="true">
      <div className="bound-label bound-label-upper"><span>Target</span><strong>8-10%</strong></div>
      <div className="bound-label bound-label-lower"><span>Drawdown</span><strong>5%</strong></div>
      <svg viewBox="0 0 360 120" role="presentation">
        <line className="bound bound-upper" x1="0" y1="29" x2="360" y2="29" />
        <line className="bound bound-lower" x1="0" y1="94" x2="360" y2="94" />
        <path className="trade-path" d="M0 84 C32 81 48 91 73 76 S118 73 143 62 S183 67 207 51 S249 57 274 40 S318 45 360 14" />
      </svg>
    </div>
  );
}

function RewardsVisual() {
  return (
    <div className="rewards-ui" aria-hidden="true">
      <div className="reward-head"><span>Weekly rhythm</span><strong>Day 07</strong></div>
      <div className="day-track">{[1, 2, 3, 4, 5, 6, 7].map(day => <i className={day < 6 ? "complete" : "pending"} key={day} />)}</div>
    </div>
  );
}

function ScaleVisual() {
  return (
    <div className="scale-ui" aria-hidden="true">
      <div><span>$25K</span><i /></div>
      <div><span>$500K</span><i /></div>
      <div className="scale-max"><span>$2.5M</span></div>
    </div>
  );
}

const heroFeatures = [
  { title: "One evaluation", body: "Hit the target without crossing drawdown. That’s it.", visual: <EvaluationVisual /> },
  { title: "No deadline", body: "Trade when the setup is there, not because the clock is running.", visual: <RulesVisual /> },
  { title: "Weekly rewards", body: "After seven trading days, eligible rewards can be requested every week.", visual: <RewardsVisual /> },
  { title: "Grow to $2.5M", body: "Keep performing and your simulated account can grow with you.", visual: <ScaleVisual /> },
];

const journeyTabs = [
  {
    label: "Evaluation",
    title: "Hit one target. Then move on.",
    body: "Pick an account, hit the target, and stay inside the loss limits. There is no second phase and no clock pushing you into a trade.",
    stats: [["Performance target", "8-10%"], ["Maximum drawdown", "5%"], ["Trading period", "Unlimited"]],
    statement: "Evaluation statement",
    balanceLabel: "Simulated evaluation balance",
    balance: "$25,000",
    footer: [["Target", "8%"], ["Drawdown", "5%"], ["Time", "Unlimited"]],
  },
  {
    label: "Scaled account",
    title: "The test is over. Now trade.",
    body: "Pass the evaluation and you move straight to a simulated scaled account. There is no second test and no ongoing profit target.",
    stats: [["Starting allocation", "Account based"], ["Maximum scaling", "$2.5M"], ["Environment", "Simulated"]],
    statement: "Scaled account",
    balanceLabel: "Current simulated allocation",
    balance: "$100,000",
    footer: [["Status", "Active"], ["Drawdown", "5%"], ["Scale", "Up to $2.5M"]],
  },
  {
    label: "Rewards",
    title: "A weekly rhythm, not a long wait.",
    body: "Trade for seven days, then request any eligible rewards. Keep the account in good standing and you can request again the following week.",
    stats: [["First eligibility", "7 trading days"], ["Eligible split", "100%"], ["Request cycle", "Weekly"]],
    statement: "Reward summary",
    balanceLabel: "Eligible simulated performance",
    balance: "$8,420",
    footer: [["Split", "100%"], ["Cycle", "Weekly"], ["Status", "Eligible"]],
  },
];

function JourneyVisual({ index }: { index: number }) {
  if (index === 1) {
    return (
      <div className="journey-visual journey-scale" aria-hidden="true">
        <div className="journey-scale-bars">
          <div><span>$25K</span></div>
          <div><span>$500K</span></div>
          <div><span>$2.5M</span></div>
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="journey-visual journey-rewards" aria-hidden="true">
        <div className="journey-reward-head"><span>Eligible request</span><strong>Day 07</strong></div>
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
  { feature: "Evaluation", typical: "Often two phases", propfund: "One evaluation" },
  { feature: "Reward split", typical: "Firm takes a share", propfund: "100% eligible rewards" },
  { feature: "Trading period", typical: "Fixed deadline", propfund: "No deadline" },
  { feature: "Scaling", typical: "Depends on the program", propfund: "Up to $2.5M simulated" },
];

export default function Home() {
  const [activeJourney, setActiveJourney] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("$25K");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const journey = journeyTabs[activeJourney];

  function openForm(account = "$25K") {
    setSelectedAccount(account);
    setFormOpen(true);
  }

  return (
    <main>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader onStart={() => openForm()} />

      <div className="dark-shell">
        <section className="hero" id="main-content">
          <HeroDotField />
          <div className="hero-laser-content">
            <div className="hero-copy">
              <h1>Pass once.<br />Trade your strategy.<br />Keep the upside.</h1>
              <p>One evaluation. No deadline. Eligible reward requests every week.</p>
              <button className="pill pill-light pill-large" onClick={() => openForm()} type="button">Start evaluation</button>
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
        <div className="section-intro section-intro-light"><h2>One evaluation. Then you trade.</h2></div>
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
        <div className="route-pricing-grid home-pricing-grid">
          {pricingPlans.map((plan) => (
            <article className={plan.size === "$25K" ? "featured" : ""} key={plan.size}>
              <div className="route-plan-head"><h3>{plan.size}</h3></div>
              <p>Starting simulated balance</p>
              <div className="route-price"><strong>{plan.fee}</strong><small>evaluation fee</small></div>
              <dl>
                <div><dt><MaterialIcon name="flag" />Target</dt><dd>{plan.target}</dd></div>
                <div><dt><MaterialIcon name="shield" />Drawdown</dt><dd>{plan.drawdown}</dd></div>
                <div><dt><MaterialIcon name="schedule" />Time</dt><dd>Unlimited</dd></div>
                <div><dt><MaterialIcon name="trending_up" />Scaling</dt><dd>{plan.scale}</dd></div>
              </dl>
              <button onClick={() => openForm(plan.size)} type="button">Start {plan.size} evaluation <MaterialIcon name="arrow_forward" /></button>
            </article>
          ))}
        </div>
      </section>

      <section className="comparison-table-section" id="comparison">
        <div className="comparison-table-inner">
          <div className="comparison-table-head"><h2>A prop evaluation without the usual maze.</h2><p>One phase, no deadline, and the same straightforward limits at every account size.</p></div>
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

      <section className="closing-section"><h2>Ready when you are.<br /><span>Pick an account and start.</span></h2><button className="data-cta" onClick={() => openForm()} type="button"><span className="data-cta-icon">P</span><span>Start your evaluation<small>Choose an account and markets</small></span><i aria-hidden="true">→</i></button></section>
      <EvaluationDialog key={`${formOpen}-${selectedAccount}`} open={formOpen} initialAccount={selectedAccount} onClose={() => setFormOpen(false)} />
      <SiteFooter onStart={() => openForm()} />
    </main>
  );
}