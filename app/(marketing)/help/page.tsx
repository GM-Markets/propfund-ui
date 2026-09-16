import type { Metadata } from "next";
import Link from "next/link";

import { MaterialIcon } from "@/components/propfund/MaterialIcon";
import { HELP_NAV } from "@/lib/docs/nav";

export const metadata: Metadata = {
  title: "Help center | Propfund",
  description: "Guides for signing in, paying for a challenge, the trading rules, funded accounts, payouts and identity verification.",
};

export default function HelpIndexPage() {
  return (
    <article className="help-article" data-help-article>
      <header className="help-article-head">
        <p>Propfund help</p>
        <h1>Help center</h1>
        <span>Guides for every step, from signing in to your first payout.</span>
      </header>
      <div className="help-article-body">
        {HELP_NAV.map((group) => {
          const headingId = group.title.toLowerCase().replace(/\s+/g, "-");
          return (
          <section className="help-section" aria-labelledby={headingId} key={group.title}>
            <h2 id={headingId}>{group.title}</h2>
            <div className="help-card-grid">
              {group.items.map((item) => (
                <Link className="help-card" href={item.href} key={item.href}>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                  <MaterialIcon name="arrow_forward" />
                </Link>
              ))}
            </div>
          </section>
          );
        })}
      </div>
      <footer className="help-article-foot">
        <p>Still need help? Email <a href="mailto:support@propfund.io">support@propfund.io</a>.</p>
      </footer>
    </article>
  );
}
