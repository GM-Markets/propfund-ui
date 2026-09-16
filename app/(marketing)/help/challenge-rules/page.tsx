import Link from "next/link";

import { HelpArticle, helpMetadata } from "@/components/docs/article";
import { Callout, DataTable, DocSection } from "@/components/docs/blocks";
import { ACTIVITY_DAYS, challengePackages, formatUsd, rulesSummary } from "@/components/propfund/site-data";

export const metadata = helpMetadata("challenge-rules");

const elite = challengePackages[challengePackages.length - 1];

export default function ChallengeRulesPage() {
  return (
    <HelpArticle slug="challenge-rules">
      <DocSection id="summary" title="The rules at a glance">
        <DataTable
          head={["Rule", "Value"]}
          rows={[
            ["Profit target", `+${rulesSummary.target} of the baseline, with no open positions`],
            ["Daily loss limit", `${rulesSummary.dailyLoss} of the baseline, counted down from the start-of-day balance`],
            ["Max loss limit", `A fixed floor ${rulesSummary.maxLoss} below the baseline. It never trails.`],
            ["Time limit", "None, and no minimum number of trading days"],
            ["Inactivity", `Closed after ${ACTIVITY_DAYS} days with no trade`],
            ["Trading", "Manual orders only. News trading and holding overnight or over a weekend are allowed."],
          ]}
        />
      </DocSection>

      <DocSection id="terms" title="Terms used in the rules">
        <DataTable
          head={["Term", "Meaning"]}
          rows={[
            ["Baseline (B)", "The account size at purchase. On a funded account it resets at each payout."],
            ["Balance", "Cash after closed trades and payouts."],
            ["Equity", "Balance plus unrealized profit or loss on open positions. Every limit check uses equity, on every price tick."],
            ["Day", "00:00:00 to 23:59:59 UTC."],
            ["Start-of-day reference (SOD)", "Your balance at 00:00 UTC, less any payout debited later that day."],
            ["Flat", "No open positions and no working orders."],
          ]}
        />
      </DocSection>

      <DocSection id="loss-limits" title="Daily and max loss limits">
        <p>You breach the daily loss limit when equity is at or below SOD minus {rulesSummary.dailyLoss} of B. The dollar amount is fixed at {rulesSummary.dailyLoss} of B and counts down from SOD, so a profitable day does not raise it.</p>
        <p>You breach the max loss limit when equity is at or below {100 - parseInt(rulesSummary.maxLoss, 10)}% of B, however much profit came before.</p>
        <p>Each limit has a meter in the terminal. It stays neutral below 70% used, turns amber at 70% and red at 90%. There is no pop-up before a breach.</p>
      </DocSection>

      <DocSection id="elite-example" title={`Worked example: ${elite.name}`} description={`A ${formatUsd(elite.accountSize)} account, so B = ${formatUsd(elite.accountSize)}.`}>
        <DataTable
          head={["Moment", "What happens"]}
          rows={[
            ["Purchase", `Daily loss limit ${formatUsd(elite.dailyLoss)}. Max loss floor ${formatUsd(elite.accountSize - elite.maxLoss)}. Target ${formatUsd(elite.accountSize + elite.target)}.`],
            ["Day 1 close", "You finish the day with a balance of $101,200 and no open positions."],
            ["Day 2, 00:00 UTC", `SOD is $101,200. The daily limit is hit at $101,200 − ${formatUsd(elite.dailyLoss)} = $98,200 equity.`],
            ["Day 2, midday", "An open trade takes equity to $98,500. You have used $2,700 of $3,000 (90%), so the daily meter is red. No breach yet."],
            ["Day 2, later", "If equity touches $98,200, the account breaches, even if price gaps below it."],
            ["Any day", `If equity ever reaches ${formatUsd(elite.accountSize - elite.maxLoss)}, the max loss limit breaches, even after earlier profit.`],
            ["Target", `Equity at ${formatUsd(elite.accountSize + elite.target)} or more with no open positions graduates the account.`],
          ]}
        />
      </DocSection>

      <DocSection id="breach" title="What happens on a breach">
        <ul>
          <li>Every position closes at the current price and all orders are cancelled.</li>
          <li>The account becomes read-only. The breach is final.</li>
          <li>A breach screen shows the rule you hit, the time, your equity and the limit, your equity curve and stats.</li>
          <li>You can start a new challenge of any size at the rebuy fee, {rulesSummary.rebuyDiscount} off.</li>
        </ul>
      </DocSection>

      <DocSection id="passing" title="Passing the challenge">
        <p>You pass when equity is at least {rulesSummary.target} above B, you are flat and the violation check is clean. If you reach the target with positions or orders still open, a banner reads &ldquo;Target reached. Close positions and cancel orders to graduate.&rdquo; See <Link href="/help/funded-account">Funded account</Link>.</p>
        <Callout type="tip" title="The full rules">
          The <Link href="/rules">Trading Rules</Link> page lists every rule in one place.
        </Callout>
      </DocSection>
    </HelpArticle>
  );
}
