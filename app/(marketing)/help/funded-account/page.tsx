import Link from "next/link";

import { HelpArticle, helpMetadata } from "@/components/docs/article";
import { Callout, DataTable, DocSection } from "@/components/docs/blocks";
import { ACTIVITY_DAYS, challengePackages, formatUsd, rulesSummary, TRADER_SPLIT_PCT } from "@/components/propfund/site-data";

export const metadata = helpMetadata("funded-account");

const plus = challengePackages.find((plan) => plan.id === "plus") ?? challengePackages[2];
const exampleProfit = 1_400;

export default function FundedAccountPage() {
  return (
    <HelpArticle slug="funded-account">
      <DocSection id="graduation" title="Graduation">
        <p>Your challenge graduates when all three are true:</p>
        <ul>
          <li>equity is at least {rulesSummary.target} above the baseline</li>
          <li>you have no open positions and no working orders</li>
          <li>the violation check is clean</li>
        </ul>
        <p>The graduation screen shows your funded account size, the payout rules and a Go to funded account button. Challenge profit is not paid out.</p>
      </DocSection>

      <DocSection id="funded-rules" title="How the funded account works">
        <DataTable
          head={["Rule", "Funded account"]}
          rows={[
            ["Account size", "Your package size. There is no scaling plan."],
            ["Baseline (B)", "Starts at the package size and resets at each payout."],
            ["Profit target", "None."],
            ["Loss limits", `The same as the challenge: ${rulesSummary.dailyLoss} daily and a fixed ${rulesSummary.maxLoss} max loss floor, both measured from B.`],
            ["Payout split", `${rulesSummary.traderSplit} to you, ${rulesSummary.propfundSplit} to Propfund.`],
            ["Inactivity", `Closed after ${ACTIVITY_DAYS} days with no trade.`],
          ]}
        />
      </DocSection>

      <DocSection id="baseline-reset" title={`Example: a payout on a ${plus.label} account`}>
        <p>You have a {formatUsd(plus.accountSize)} funded account. After some trades you are flat with a balance of {formatUsd(plus.accountSize + exampleProfit)}, so realized profit is {formatUsd(exampleProfit)}.</p>
        <DataTable
          head={["Step", "Result"]}
          rows={[
            ["You request a payout", `${formatUsd(exampleProfit)} is debited. You are owed ${formatUsd(exampleProfit * TRADER_SPLIT_PCT)}; Propfund keeps ${formatUsd(exampleProfit * (1 - TRADER_SPLIT_PCT))}.`],
            ["Balance and B", `Both are now ${formatUsd(plus.accountSize)}.`],
            ["New limits", `Daily loss ${formatUsd(plus.dailyLoss)} from SOD, which also drops by ${formatUsd(exampleProfit)} for that day. Max loss floor ${formatUsd(plus.accountSize - plus.maxLoss)}.`],
            ["Paid", `7 days later in ${rulesSummary.payout}.`],
          ]}
        />
      </DocSection>

      <DocSection id="breach-on-funded" title="If a funded account breaches">
        <p>A breach closes the funded account in the same way as a challenge and unlocks the rebuy fee on a new challenge. A payout already under review is not cancelled by the breach; it is still paid unless a violation is confirmed.</p>
        <Callout type="tip" title="Next">
          Read <Link href="/help/payouts-and-identity-verification">Payouts and identity verification</Link> before your first request.
        </Callout>
      </DocSection>
    </HelpArticle>
  );
}
