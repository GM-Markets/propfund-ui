import Link from "next/link";

import { HelpArticle, helpMetadata } from "@/components/docs/article";
import { Callout, DataTable, DocSection, Steps } from "@/components/docs/blocks";
import { challengePackages, formatUsd, paymentSummary, rulesSummary } from "@/components/propfund/site-data";

export const metadata = helpMetadata("getting-started");

export default function GettingStartedPage() {
  return (
    <HelpArticle slug="getting-started">
      <DocSection id="what-propfund-is" title="What Propfund is">
        <p>Propfund is a one-step trading challenge on a simulated account. You pay a fee, trade in the Propfund terminal and aim for a {rulesSummary.target} profit target without hitting a loss limit. Pass, and you get a funded account where you can request payouts of realized profit: {rulesSummary.traderSplit} to you, {rulesSummary.propfundSplit} to Propfund, paid in {rulesSummary.payout}.</p>
        <p>There is no free trial, no second phase, no deadline and no scaling plan. Every order is placed by hand.</p>
      </DocSection>

      <DocSection id="how-it-works" title="From sign-in to payout">
        <Steps
          items={[
            { title: "Sign in", body: <>Sign in with {paymentSummary.signIn}. Your Propfund wallet is created on your first sign-in. See <Link href="/help/sign-in-and-wallet">Sign-in and wallet</Link>.</> },
            { title: "Pick a package and pay", body: <>Choose an account size and pay the fee by card or with {paymentSummary.stablecoins}. See <Link href="/help/paying-for-a-challenge">Paying for a challenge</Link>.</> },
            { title: "Trade the challenge", body: <>Reach +{rulesSummary.target} with no open positions while staying inside the {rulesSummary.dailyLoss} daily and {rulesSummary.maxLoss} max loss limits. See <Link href="/help/challenge-rules">Challenge rules</Link>.</> },
            { title: "Trade the funded account", body: <>Your funded account opens at your package size with the same loss limits and no target. See <Link href="/help/funded-account">Funded account</Link>.</> },
            { title: "Request payouts", body: <>Request your realized profit from {rulesSummary.minPayout}. Your first request includes a one-time identity check, and each payout is paid 7 days after you request it. See <Link href="/help/payouts-and-identity-verification">Payouts and identity verification</Link>.</> },
          ]}
        />
      </DocSection>

      <DocSection id="packages" title="Packages" description="The rules are the same at every size. Only the dollar amounts change.">
        <DataTable
          caption="Challenge packages"
          head={["Package", "Account size", "Fee", "Rebuy fee", "Target"]}
          rows={challengePackages.map((plan) => [plan.name, formatUsd(plan.accountSize), formatUsd(plan.fee), formatUsd(plan.rebuyFee), formatUsd(plan.target)])}
        />
        <p>The rebuy fee is {rulesSummary.rebuyDiscount} lower and applies to your next challenge of any size after a breach. Compare packages on the <Link href="/pricing">pricing page</Link>.</p>
      </DocSection>

      <DocSection id="what-you-need" title="What you need">
        <ul>
          <li>An email address, a Google account or a crypto wallet to sign in.</li>
          <li>A card, or {paymentSummary.stablecoins}, to pay the fee.</li>
          <li>Nothing else to start. You are not asked for identity documents until your first payout request.</li>
        </ul>
        <Callout type="info" title="Simulated accounts">
          Challenge and funded accounts are simulated. Propfund does not place orders in real markets for you. Payouts are based on realized profit on your funded account.
        </Callout>
      </DocSection>
    </HelpArticle>
  );
}
