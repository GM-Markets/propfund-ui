"use client";

import Link from "next/link";
import Image from "next/image";
import { MaterialIcon } from "./MaterialIcon";
import { pricingPlans } from "./site-data";

const LOGIN_HREF = "/login";

const marketNavigation = [
  { href: "/forex", label: "Forex", detail: "29 currency pairs", icon: "trending_up" },
  { href: "/crypto", label: "Crypto", detail: "30 supported markets", icon: "donut_large" },
  { href: "/equities", label: "Equities", detail: "US stocks and ETFs", icon: "monitoring" },
  { href: "/commodities", label: "Commodities", detail: "Metals and energy", icon: "oil_barrel" },
];

function loginHref(account?: string): string {
  if (!account) return LOGIN_HREF;
  return `${LOGIN_HREF}?account=${encodeURIComponent(account)}`;
}

export function StartEvaluationButton({
  className = "",
  label = "Start evaluation",
  account,
}: {
  className?: string;
  label?: string;
  account?: string;
}) {
  return (
    <Link className={className} href={loginHref(account)}>
      {label}
    </Link>
  );
}

export function SiteHeader() {
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
          <div className="header-actions">
            <Link className="header-primary" href={LOGIN_HREF}>Start evaluation</Link>
          </div>
          <details className="mobile-menu">
            <summary>Menu</summary>
            <nav>
              <details className="mobile-markets">
                <summary>Markets <span className="markets-nav-chevron" aria-hidden="true" /></summary>
                <div>
                  {marketNavigation.map((market) => (
                    <a href={market.href} key={market.href}>
                      <MaterialIcon name={market.icon} />
                      {market.label}
                    </a>
                  ))}
                </div>
              </details>
              <a href="/how-it-works">How it works</a>
              <a href="/rules">Rules</a>
              <Link href={LOGIN_HREF}>Start evaluation</Link>
            </nav>
          </details>
        </header>
      </div>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div className="footer-top inner-footer-top">
        <div className="footer-brand">
          <Image className="brand-wordmark footer-wordmark" src="/brand/propfund-wordmark-dark.svg" alt="Propfund" width={201} height={36} />
          <h2>Ready when<br />your setup is.</h2>
          <p>Choose an account, pass once, and trade on your terms.</p>
          <Link className="footer-primary" href={LOGIN_HREF}>
            Start evaluation <MaterialIcon name="arrow_forward" />
          </Link>
        </div>
        <div className="footer-links">
          <div><strong>Program</strong><a href="/how-it-works">How it works</a><Link href="/#points">Propfund Points</Link><a href="/pricing">Pricing</a><a href="/rules">Rules</a></div>
          <div><strong>Markets</strong><a href="/forex">Forex</a><a href="/crypto">Crypto</a><a href="/equities">Equities</a><a href="/commodities">Commodities</a></div>
          <div><strong>Legal</strong><a href="/privacy-policy">Privacy</a><a href="/terms-of-service">Terms</a><a href="/refund-policy">Refunds</a></div>
        </div>
      </div>
      <div className="footer-bottom">
        <small>© 2026 Propfund. Simulated trading only. Propfund does not provide financial services or investment advice.</small>
        <div><a href="/privacy-policy">Privacy</a><a href="/terms-of-service">Terms</a></div>
      </div>
    </footer>
  );
}

export function PricingGrid({ compact = false }: { compact?: boolean }) {
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
          <Link href={loginHref(plan.size)}>
            Start with {plan.size} <MaterialIcon name="arrow_forward" />
          </Link>
        </article>
      ))}
    </div>
  );
}

export function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="route-page">{children}</main>
      <SiteFooter />
    </>
  );
}
