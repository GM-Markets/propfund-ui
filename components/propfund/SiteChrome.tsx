"use client";

import Link from "next/link";
import Image from "next/image";
import { createContext, useContext, useState } from "react";
import { EvaluationDialog } from "./EvaluationDialog";
import { MaterialIcon } from "./MaterialIcon";
import { pricingPlans } from "./site-data";

type StartActionProps = { onStart?: () => void };
type EvaluationContextValue = { openForm: (account?: string) => void };

const EvaluationContext = createContext<EvaluationContextValue>({ openForm: () => undefined });

const marketNavigation = [
  { href: "/forex", label: "Forex", detail: "29 currency pairs", icon: "trending_up" },
  { href: "/crypto", label: "Crypto", detail: "30 supported markets", icon: "donut_large" },
  { href: "/equities", label: "Equities", detail: "US stocks and ETFs", icon: "monitoring" },
  { href: "/commodities", label: "Commodities", detail: "Metals and energy", icon: "oil_barrel" },
];

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
        <span>Evaluations from $24. No second phase or deadline.</span>
        <a href="/pricing">View pricing <MaterialIcon className="inline-icon" name="arrow_forward" /></a>
      </div>
      <div className="header-shell">
        <header className="site-header">
          <Link className="wordmark" href="/" aria-label="Propfund home">
            <Image className="brand-wordmark" src="/brand/propfund-wordmark-light.svg" alt="Propfund" width={201} height={36} priority />
          </Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <div className="markets-nav">
              <button type="button" aria-haspopup="true">Markets <span className="markets-nav-chevron" aria-hidden="true" /></button>
              <div className="markets-nav-menu">
                <div className="markets-nav-head"><span>Trade the markets you know</span><small>One evaluation. Four asset classes.</small></div>
                <div className="markets-nav-grid">
                  {marketNavigation.map((market) => (
                    <a href={market.href} key={market.href}>
                      <MaterialIcon name={market.icon} />
                      <span><strong>{market.label}</strong><small>{market.detail}</small></span>
                      <MaterialIcon className="markets-nav-arrow" name="arrow_forward" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <a href="/how-it-works">How it works</a>
            <a href="/rules">Rules</a>
          </nav>
          <div className="header-actions"><button className="header-primary" onClick={onStart} type="button">Start evaluation</button></div>
          <details className="mobile-menu"><summary>Menu</summary><nav><details className="mobile-markets"><summary>Markets <span className="markets-nav-chevron" aria-hidden="true" /></summary><div>{marketNavigation.map((market) => <a href={market.href} key={market.href}><MaterialIcon name={market.icon} />{market.label}</a>)}</div></details><a href="/how-it-works">How it works</a><a href="/rules">Rules</a><button onClick={onStart} type="button">Start evaluation</button></nav></details>
        </header>
      </div>
    </>
  );
}

export function SiteFooter({ onStart }: StartActionProps) {
  return (
    <footer>
      <div className="footer-top inner-footer-top">
        <div className="footer-brand"><Image className="brand-wordmark footer-wordmark" src="/brand/propfund-wordmark-dark.svg" alt="Propfund" width={201} height={36} /><h2>Ready when<br />your setup is.</h2><p>Choose an account, pass once, and trade on your terms.</p><button className="footer-primary" onClick={onStart} type="button">Start evaluation <MaterialIcon name="arrow_forward" /></button></div>
        <div className="footer-links">
          <div><strong>Program</strong><a href="/how-it-works">How it works</a><Link href="/#points">Propfund Points</Link><a href="/pricing">Pricing</a><a href="/rules">Rules</a></div>
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
          <div className="route-price"><strong>{plan.fee}</strong><small><s>{plan.previousFee}</s> one-time fee</small></div>
          <dl>
            <div><dt><MaterialIcon name="flag" />Target</dt><dd>{plan.target}</dd></div>
            <div><dt><MaterialIcon name="shield" />Static limits</dt><dd>{plan.drawdown}</dd></div>
            <div><dt><MaterialIcon name="schedule" />Time</dt><dd>Unlimited</dd></div>
            <div><dt><MaterialIcon name="trending_up" />Scaling</dt><dd>{plan.scale}</dd></div>
          </dl>
          <button onClick={() => openForm(plan.size)} type="button">Start with {plan.size} <MaterialIcon name="arrow_forward" /></button>
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