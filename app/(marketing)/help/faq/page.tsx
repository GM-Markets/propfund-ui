import Link from "next/link";

import { HelpArticle, helpMetadata } from "@/components/docs/article";
import { DocSection } from "@/components/docs/blocks";
import { ACTIVITY_DAYS, challengePackages, formatUsd, paymentSummary, rulesSummary } from "@/components/propfund/site-data";

export const metadata = helpMetadata("faq");

const faqs: { group: string; id: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    group: "Accounts and pricing",
    id: "accounts-and-pricing",
    items: [
      { q: "Is there a free trial?", a: "No. Every account starts with a paid fee." },
      { q: "How much does a challenge cost?", a: `From ${formatUsd(challengePackages[0].fee)} for a ${formatUsd(challengePackages[0].accountSize)} account to ${formatUsd(challengePackages[challengePackages.length - 1].fee)} for a ${formatUsd(challengePackages[challengePackages.length - 1].accountSize)} account. The rules are the same at every size.` },
      { q: "Can I hold more than one account?", a: "No. You can have one active account, challenge or funded, at a time." },
      { q: "Is the account real money?", a: "No. Challenge and funded accounts are simulated. Payouts are based on realized profit on your funded account." },
      { q: "Can I get a refund?", a: <>Fees are non-refundable, including after a breach. See the <Link href="/refund-policy">Refund Policy</Link> for the limited cases we review.</> },
    ],
  },
  {
    group: "Signing in and paying",
    id: "signing-in-and-paying",
    items: [
      { q: "How do I sign in?", a: `With ${paymentSummary.signIn}. Every trader gets a Propfund wallet.` },
      { q: "Do I need to verify my identity to start?", a: "No. There is no identity check at sign-in, when you pay or while you trade. You verify once, at your first payout request." },
      { q: "Which payment methods can I use?", a: `Card, or ${paymentSummary.stablecoins}.` },
      { q: "I sent funds on the wrong network. What now?", a: <>Contact support@propfund.io with the chain and transaction hash. Transfers on unsupported chains or tokens may not be recoverable. See <Link href="/help/paying-for-a-challenge">Paying for a challenge</Link>.</> },
      { q: "I sent more than the fee.", a: "The extra is kept as a deposit balance for your next purchase." },
    ],
  },
  {
    group: "Trading and rules",
    id: "trading-and-rules",
    items: [
      { q: "Is there a time limit?", a: `No, and there is no minimum number of trading days. An account with no trade in ${ACTIVITY_DAYS} days is closed for inactivity.` },
      { q: "Can I use a bot or trade copier?", a: "No. Every order must be placed by hand. Automated trading (V1) and copy trading (V4) are violations." },
      { q: "Can I hold over the weekend or trade the news?", a: "Yes, while the market is open and the account stays inside its limits." },
      { q: "Does the max loss limit trail my profit?", a: `No. It is a fixed floor ${rulesSummary.maxLoss} below the baseline.` },
    ],
  },
  {
    group: "Payouts",
    id: "payouts",
    items: [
      { q: "How much do I keep?", a: `${rulesSummary.traderSplit} of realized profit on your funded account.` },
      { q: "What is the minimum payout?", a: `${rulesSummary.minPayout} of realized profit.` },
      { q: "When am I paid?", a: "7 calendar days after you submit the request." },
      { q: "Which network are payouts sent on?", a: `${rulesSummary.payout} only, to your Propfund wallet or another Arbitrum address you control.` },
      { q: "Where can I see Propfund's payout figures?", a: <>On the <Link href="/transparency">Transparency</Link> page.</> },
    ],
  },
];

export default function FaqPage() {
  return (
    <HelpArticle slug="faq">
      {faqs.map((group) => (
        <DocSection id={group.id} key={group.id} title={group.group}>
          <dl className="help-faq">
            {group.items.map((item) => (
              <div key={item.q}>
                <dt>{item.q}</dt>
                <dd>{item.a}</dd>
              </div>
            ))}
          </dl>
        </DocSection>
      ))}
    </HelpArticle>
  );
}
