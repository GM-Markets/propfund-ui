import { DocsLink } from "@/components/docs/docs-link";
import { PageHeader } from "@/components/page-header";
import * as hsc from "@/lib/hsc/client";

import { CheckoutPicker, type Tier } from "./CheckoutPicker";

function labelFor(tier: { id: string; account_size: number; price_cents: number }): string {
  if (tier.price_cents === 0) return "Free trial";
  const size = tier.account_size >= 1000 ? `$${(tier.account_size / 1000).toFixed(0)}K` : `$${tier.account_size}`;
  return `${size} evaluation`;
}

export default async function CheckoutPage() {
  const [tiers, me] = await Promise.all([
    hsc.payments.listTiers().catch(() => []),
    hsc.auth.me().catch(() => null),
  ]);
  const agreement = {
    signed: me?.agreement_signed ?? false,
    agreement_version: me?.agreement_version ?? "2026-09-01",
  };

  const mapped: Tier[] = tiers
    .filter((t) => t.active && t.price_cents > 0)
    .sort((a, b) => a.price_cents - b.price_cents || a.account_size - b.account_size)
    .map((t) => ({
      id: t.id,
      label: labelFor(t),
      account_size: t.account_size,
      amount_cents: t.price_cents,
      asset_class: t.asset_class,
      market: t.market,
      popular: t.id === "tier_25k",
      features: [
        `$${t.account_size.toLocaleString()} simulated`,
        `${t.market} markets`,
        t.price_cents === 0 ? "No card required" : "One-phase evaluation · 100% split",
      ],
    }));

  return (
    <div>
      <PageHeader
        title="Choose your challenge"
        description={
          me?.dev_simulate
            ? "Development — confirm payment success or failure instead of Privy. A $10K test desk is already on your dashboard."
            : "A $10K notional test account is already on your dashboard. Buy a challenge for a paid evaluation — pass once, no deadline, up to $2.5M scale."
        }
        actions={<DocsLink href="/docs/checkout" />}
      />
      <CheckoutPicker
        tiers={mapped}
        agreementSigned={agreement.signed}
        agreementVersion={agreement.agreement_version ?? "2026-09-01"}
        devSimulate={me?.dev_simulate === true}
      />
    </div>
  );
}
