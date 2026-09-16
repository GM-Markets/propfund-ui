import Link from "next/link";
import { MaterialIcon } from "./MaterialIcon";
import { SiteTile, SiteWordmark } from "@/components/propfund/SiteMark";
import { challengeHref, challengePackages, featuredPackageLabel, formatUsd, rulesSummary } from "./site-data";

const primaryNav = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/forex", label: "Forex" },
  { href: "/crypto", label: "Crypto" },
  { href: "/equities", label: "Equities" },
  { href: "/commodities", label: "Commodities" },
  { href: "/rules", label: "Rules" },
  { href: "/transparency", label: "Transparency" },
  { href: "/help", label: "Help" },
];

/** "Start challenge" CTA. Goes to the dashboard challenges page, which shows sign-in when needed. */
export function StartChallengeLink({
  className = "",
  label = "Start challenge",
  packageId,
  children,
}: {
  className?: string;
  label?: string;
  packageId?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link className={className} href={challengeHref(packageId)}>
      {children ?? label}
    </Link>
  );
}

export function SiteHeader() {
  return (
    <>
      <div className="announcement">
        <span>One challenge. No countdown.</span>
        <Link href="/pricing">View pricing <MaterialIcon className="inline-icon" name="arrow_forward" /></Link>
      </div>
      <div className="header-shell">
        <header className="site-header">
          <Link className="wordmark" href="/" aria-label="Propfund home"><SiteTile /><SiteWordmark /></Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {primaryNav.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          </nav>
          <div className="header-actions"><StartChallengeLink className="header-primary" /></div>
          <details className="mobile-menu">
            <summary>Menu</summary>
            <nav aria-label="Mobile navigation">
              {primaryNav.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
              <StartChallengeLink className="mobile-menu-cta" />
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
        <div className="footer-brand"><SiteTile size={34} /><h2>For traders who already have a process.</h2><StartChallengeLink className="pill pill-light" /></div>
        <div className="footer-links">
          <div><strong>Program</strong><Link href="/how-it-works">How it works</Link><Link href="/pricing">Pricing</Link><Link href="/rules">Rules</Link><Link href="/transparency">Transparency</Link><Link href="/help">Help</Link></div>
          <div><strong>Markets</strong><Link href="/forex">Forex</Link><Link href="/crypto">Crypto</Link><Link href="/equities">Equities</Link><Link href="/commodities">Commodities</Link></div>
          <div><strong>Legal</strong><Link href="/privacy-policy">Privacy</Link><Link href="/terms-of-service">Terms</Link><Link href="/refund-policy">Refunds</Link></div>
        </div>
      </div>
      <div className="footer-bottom"><small>© 2026 Propfund. Simulated trading only. Propfund does not provide financial services or investment advice.</small><div><Link href="/transparency">Transparency</Link><Link href="/help">Help</Link><Link href="/privacy-policy">Privacy</Link><Link href="/terms-of-service">Terms</Link></div></div>
    </footer>
  );
}

export function PricingGrid({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <div className={`route-pricing-grid ${compact ? "compact" : ""} ${className}`.trim()}>
      {challengePackages.map((plan) => (
        <article className={plan.label === featuredPackageLabel ? "featured" : ""} key={plan.label}>
          <div className="route-plan-head"><h3>{plan.label}</h3></div>
          <p>{plan.name} · {formatUsd(plan.accountSize)} account</p>
          <div className="route-price"><strong>{formatUsd(plan.fee)}</strong><small>challenge fee</small><small>{formatUsd(plan.rebuyFee)} rebuy after a breach</small></div>
          <dl>
            <div><dt><MaterialIcon name="flag" />Target</dt><dd>{formatUsd(plan.target)} · {rulesSummary.target}</dd></div>
            <div><dt><MaterialIcon name="shield" />Daily loss</dt><dd>{formatUsd(plan.dailyLoss)} · {rulesSummary.dailyLoss}</dd></div>
            <div><dt><MaterialIcon name="health_and_safety" />Max loss</dt><dd>{formatUsd(plan.maxLoss)} · {rulesSummary.maxLoss}</dd></div>
            <div><dt><MaterialIcon name="schedule" />Time</dt><dd>Unlimited</dd></div>
          </dl>
          <StartChallengeLink className="route-plan-cta" packageId={plan.id}>Start {plan.label} challenge <MaterialIcon name="arrow_forward" /></StartChallengeLink>
        </article>
      ))}
    </div>
  );
}

export function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main className="route-page" id="main-content">{children}</main>
      <SiteFooter />
    </>
  );
}
