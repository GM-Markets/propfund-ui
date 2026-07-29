"use client";

import Link from "next/link";
import { createContext, useContext, useState } from "react";
import { EvaluationDialog } from "./EvaluationDialog";
import { MaterialIcon } from "./MaterialIcon";
import { pricingPlans } from "./site-data";

type StartActionProps = { onStart?: () => void };
type EvaluationContextValue = { openForm: (account?: string) => void };

const EvaluationContext = createContext<EvaluationContextValue>({ openForm: () => undefined });

function useEvaluation() {
  return useContext(EvaluationContext);
}

export function StartEvaluationButton({ className = "", label = "Start evaluation", account }: { className?: string; label?: string; account?: string }) {
  const { openForm } = useEvaluation();
  return <button className={className} onClick={() => openForm(account)} type="button">{label}</button>;
}

export function SiteHeader({ onStart }: StartActionProps) {
  return (
    <>
      <div className="announcement">
        <span>One evaluation. No countdown.</span>
        <a href="/pricing">View pricing <MaterialIcon className="inline-icon" name="arrow_forward" /></a>
      </div>
      <div className="header-shell">
        <header className="site-header">
          <Link className="wordmark" href="/" aria-label="Propfund home"><span className="wordmark-mark" aria-hidden="true">P</span><span>Propfund</span></Link>
          <nav className="desktop-nav" aria-label="Primary navigation"><a href="/how-it-works">How it works</a><a href="/forex">Forex</a><a href="/crypto">Crypto</a><a href="/equities">Equities</a><a href="/commodities">Commodities</a><a href="/rules">Rules</a></nav>
          <div className="header-actions"><button className="header-primary" onClick={onStart} type="button">Start evaluation</button></div>
          <details className="mobile-menu"><summary>Menu</summary><nav><a href="/how-it-works">How it works</a><a href="/forex">Forex</a><a href="/crypto">Crypto</a><a href="/equities">Equities</a><a href="/commodities">Commodities</a><a href="/rules">Rules</a><button onClick={onStart} type="button">Start evaluation</button></nav></details>
        </header>
      </div>
    </>
  );
}

export function SiteFooter({ onStart }: StartActionProps) {
  return (
    <footer>
      <div className="footer-top inner-footer-top">
        <div className="footer-brand"><span className="wordmark-mark">P</span><h2>For traders who already have a process.</h2><button className="pill pill-light" onClick={onStart} type="button">Start evaluation</button></div>
        <div className="footer-links">
          <div><strong>Program</strong><a href="/how-it-works">How it works</a><a href="/pricing">Pricing</a><a href="/rules">Rules</a></div>
          <div><strong>Markets</strong><a href="/forex">Forex</a><a href="/crypto">Crypto</a><a href="/equities">Equities</a><a href="/commodities">Commodities</a></div>
          <div><strong>Legal</strong><a href="/privacy-policy">Privacy</a><a href="/terms-of-service">Terms</a><a href="/refund-policy">Refunds</a></div>
        </div>
      </div>
      <div className="footer-bottom"><small>© 2026 Propfund. Simulated trading only. Propfund does not provide financial services or investment advice.</small><div><a href="/privacy-policy">Privacy</a><a href="/terms-of-service">Terms</a></div></div>
    </footer>
  );
}

export function PricingGrid({ compact = false }: { compact?: boolean }) {
  const { openForm } = useEvaluation();

  return (
    <div className={`route-pricing-grid ${compact ? "compact" : ""}`}>
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
  );
}

export function PageFrame({ children }: { children: React.ReactNode }) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("$25K");

  function openForm(account = "$25K") {
    setSelectedAccount(account);
    setFormOpen(true);
  }

  return (
    <EvaluationContext.Provider value={{ openForm }}>
      <SiteHeader onStart={() => openForm()} />
      <main className="route-page">{children}</main>
      <SiteFooter onStart={() => openForm()} />
      <EvaluationDialog
        key={`${formOpen}-${selectedAccount}`}
        open={formOpen}
        initialAccount={selectedAccount}
        onClose={() => setFormOpen(false)}
      />
    </EvaluationContext.Provider>
  );
}