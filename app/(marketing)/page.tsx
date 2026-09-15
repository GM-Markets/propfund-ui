"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HeroDotField } from "@/components/propfund/HeroDotField";
import { MaterialIcon } from "@/components/propfund/MaterialIcon";
import { TradingTerminalMockup } from "@/components/propfund/TradingTerminalMockup";
import { PointsProgram } from "@/components/propfund/PointsProgram";
import { SiteFooter, SiteHeader } from "@/components/propfund/SiteChrome";
import { pricingPlans } from "@/components/propfund/site-data";



const questions = [
  { q: "Is this live trading capital?", a: "No. Both the evaluation and scaled account are simulated. Eligible rewards are based on qualifying realized simulated performance." },
  { q: "What do I need to pass?", a: "Reach 8% in Forex or 10% in another supported market without breaching either 5% static loss limit. There is no second phase or deadline." },
  { q: "Can I trade news, hold positions, or use an algo?", a: "Yes. You can trade news, hold overnight or over the weekend, and use automation you built and control." },
  { q: "When can I request a reward?", a: "Your first eligible request opens after seven trading days on the scaled account. You can then request again every week." },
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
  { title: "A single evaluation phase", body: "Reach 8% in Forex or 10% in another supported market.", visual: <EvaluationVisual /> },
  { title: "Two static 5% loss limits", body: "The balance and daily equity limits are measured from the starting balance.", visual: <RulesVisual /> },
  { title: "Weekly reward requests", body: "Your first eligible request opens after seven trading days on the scaled account.", visual: <RewardsVisual /> },
  { title: "Scaling up to $2.5M", body: "Qualifying quarterly performance can increase the simulated account balance.", visual: <ScaleVisual /> },
];

function JourneyEvaluationStoryVisual() {
  return (
    <div className="journey-story-visual journey-story-evaluation" aria-hidden="true">
      <div className="story-evaluation-head">
        <span>Evaluation progress</span>
        <strong>
          <span className="story-score story-score-start">6.4%</span>
          <span className="story-score story-score-finish">9.2%</span>
          <small>/ 8.0%</small>
        </strong>
      </div>
      <svg viewBox="0 0 640 230" role="presentation">
        <line className="story-bound story-target" x1="0" y1="58" x2="640" y2="58" />
        <line className="story-bound story-drawdown" x1="0" y1="190" x2="640" y2="190" />
        <path className="story-trade-path" d="M0 176 C52 164 70 184 112 150 S182 160 226 123 S298 139 341 101 S414 116 460 77 S522 91 558 55 S608 45 640 20" />
        <circle className="story-target-dot" cx="640" cy="20" r="6" />
      </svg>
      <div className="story-evaluation-foot"><span>5% static loss limits</span><strong>Target reached</strong></div>
    </div>
  );
}

function JourneyScaleStoryVisual() {
  return (
    <div className="journey-story-visual journey-story-scale" aria-hidden="true">
      <div className="story-scale-rail" />
      <div className="story-allocation story-allocation-start"><span>Start</span><strong>$25K</strong><small>simulated</small></div>
      <div className="story-allocation story-allocation-mid"><span>Grow</span><strong>$500K</strong><small>simulated</small></div>
      <div className="story-allocation story-allocation-max"><span>Scale</span><strong>$2.5M</strong><small>maximum simulated</small></div>
    </div>
  );
}

function JourneyRewardsStoryVisual() {
  return (
    <div className="journey-story-visual journey-story-rewards" aria-hidden="true">
      <div className="story-reward-cycle">
        <span>Trading days</span>
        <div className="story-reward-track">{[1, 2, 3, 4, 5, 6, 7].map((day) => <i key={day}><small>{day}</small></i>)}</div>
      </div>
      <div className="story-reward-request"><span>Reward request</span><strong>Eligible</strong><small>100% of eligible rewards</small></div>
    </div>
  );
}

const markets = [
  { name: "Forex", body: "29 major and cross pairs with an 8% evaluation target.", detail: "Explore Forex", href: "/forex", illustration: "/illustrations/forex.png" },
  { name: "Crypto", body: "30 supported markets available seven days a week.", detail: "Explore Crypto", href: "/crypto", illustration: "/illustrations/crypto.png" },
  { name: "Equities", body: "More than 1,000 US stocks and supported sector ETFs.", detail: "Explore Equities", href: "/equities", illustration: "/illustrations/equities.png" },
  { name: "Commodities", body: "Gold, silver, energy, and industrial metals across global sessions.", detail: "Explore Commodities", href: "/commodities", illustration: "/illustrations/commodities.png" },
];

const marketTape = [
  ["EUR / USD", "Forex"],
  ["BTC", "Crypto"],
  ["GOLD", "Commodities"],
  ["US equities", "1,000+ names"],
  ["ETH", "Crypto"],
  ["GBP / JPY", "Forex"],
  ["WTI OIL", "Commodities"],
  ["Sector ETFs", "Equities"],
];

const comparisons = [
  { feature: "Evaluation structure", typical: "Often two phases", propfund: "One phase" },
  { feature: "Reward split", typical: "Firm keeps a share", propfund: "100% of eligible rewards" },
  { feature: "Time limit", typical: "A fixed deadline", propfund: "None" },
  { feature: "Scaling ceiling", typical: "Varies by program", propfund: "Up to $2.5M simulated" },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main id="main-content">

      <div className="dark-shell">
        <section className="hero">
          <HeroDotField />
          <div className="hero-laser-content">
            <div className="hero-primary-grid hero-primary-stack">
              <div className="hero-copy">
                <h1>Pass the evaluation.<br />Keep trading your strategy.</h1>
                <p>No second phase or deadline. After you pass, trade seven days and request 100% of eligible rewards each week.</p>
                <div className="hero-actions">
                  <Link className="pill pill-light pill-large" href="/login">Start evaluation</Link>
                  <a className="hero-secondary" href="/rules">See the rules <MaterialIcon name="arrow_forward" /></a>
                </div>
              </div>
              <div className="hero-terminal-stage"><TradingTerminalMockup /></div>
            </div>
          </div>
        </section>
        <section className="hero-feature-section" aria-label="Program highlights">
          <div className="hero-feature-section-head">
            <h2>Know the path before you place a trade.</h2>
          </div>
          <div className="hero-feature-grid">
            {heroFeatures.map(feature => (
              <article key={feature.title}>
                <div className="hero-feature-visual">{feature.visual}</div>
                <div className="hero-feature-copy"><h2>{feature.title}</h2><p>{feature.body}</p></div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="market-tape" aria-label="Markets available on Propfund">
        <div className="market-tape-track">
          {[...marketTape, ...marketTape].map(([symbol, market], index) => {
            const duplicate = index >= marketTape.length;
            return (
              <span aria-hidden={duplicate || undefined} key={`${symbol}-${index}`}>
                <strong>{symbol}</strong>
                <small>{market}</small>
              </span>
            );
          })}
        </div>
      </section>

      <section className="product-section" id="model">
        <div className="section-intro section-intro-light"><h2>One evaluation. Then you trade.</h2><p>Pass once, move to a scaled account, and request eligible rewards every week.</p></div>
        <div className="journey-story">
          <article className="journey-story-card">
            <div className="journey-story-copy"><span>Evaluation</span><h3>Reach one target.</h3><p>Hit 8% in Forex or 10% in another market without crossing either 5% static loss limit.</p></div>
            <JourneyEvaluationStoryVisual />
              <div className="stage-note"><span>Rules visible before checkout</span><a href="#comparison">Compare the model <span aria-hidden="true">→</span></a></div>
          </article>
          <article className="journey-story-card">
            <div className="journey-story-copy"><span>Scaled account</span><h3>Keep your strategy.</h3><p>The target disappears after you pass. Trade the same way while the two static loss limits stay in place.</p></div>
            <JourneyScaleStoryVisual />
          </article>
          <article className="journey-story-card">
            <div className="journey-story-copy"><span>Rewards</span><h3>Request every week.</h3><p>Trade for seven days, then request 100% of eligible realized simulated profits while the account remains eligible.</p></div>
            <JourneyRewardsStoryVisual />
          </article>
        </div>
      </section>

      <PointsProgram />

      <section className="markets-section" id="markets">
        <div className="section-intro section-intro-light"><h2>Trade the markets you know.</h2><p>Choose from Forex, crypto, US equities, and commodities without changing evaluation accounts.</p></div>
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
        <div className="section-intro section-intro-light"><h2>Choose your account size.</h2><p>The rules stay the same from $5K to $100K. Only the starting simulated balance and fee change.</p></div>
        <div className="route-pricing-grid home-pricing-grid">
          {pricingPlans.map((plan) => (
            <article className={plan.size === "$25K" ? "featured" : ""} key={plan.size}>
              <div className="route-plan-head"><h3>{plan.size}</h3></div>
              <p>Starting simulated balance</p>
              <div className="route-price"><strong>{plan.fee}</strong><small><s>{plan.previousFee}</s> one-time fee</small></div>
              <dl>
                <div><dt><MaterialIcon name="flag" />Target</dt><dd>{plan.target}</dd></div>
                <div><dt><MaterialIcon name="shield" />Static limits</dt><dd>{plan.drawdown}</dd></div>
                <div><dt><MaterialIcon name="schedule" />Time</dt><dd>Unlimited</dd></div>
                <div><dt><MaterialIcon name="trending_up" />Scaling</dt><dd>{plan.scale}</dd></div>
              </dl>
              <Link href={`/login?account=${encodeURIComponent(plan.size)}`}>Start with {plan.size} <MaterialIcon name="arrow_forward" /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="comparison-table-section" id="comparison">
        <div className="comparison-table-inner">
          <div className="comparison-table-head"><h2>Compare the terms before you start.</h2><p>See the evaluation structure, time limit, reward split, and scaling ceiling side by side.</p></div>
          <div className="comparison-table-wrap">
            <table>
              <thead><tr><th scope="col">Program term</th><th scope="col">Typical challenge</th><th scope="col">Propfund</th></tr></thead>
              <tbody>{comparisons.map(item => <tr key={item.feature}><th scope="row">{item.feature}</th><td data-label="Typical challenge">{item.typical}</td><td data-label="Propfund">{item.propfund}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="faq-intro"><h2>Questions traders usually ask.</h2></div>
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
      </main>
      <SiteFooter />
    </>
  );
}