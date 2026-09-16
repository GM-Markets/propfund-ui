import Link from "next/link";

import { HelpArticle, helpMetadata } from "@/components/docs/article";
import { Callout, DataTable, DocSection, Steps } from "@/components/docs/blocks";
import { rulesSummary } from "@/components/propfund/site-data";

export const metadata = helpMetadata("payouts-and-identity-verification");

export default function PayoutsPage() {
  return (
    <HelpArticle slug="payouts-and-identity-verification">
      <DocSection id="when-you-can-request" title="When you can request a payout">
        <p>You can request a payout when all of these are true:</p>
        <ul>
          <li>the account is funded</li>
          <li>your identity is verified</li>
          <li>you have no open positions and no working orders</li>
          <li>realized profit (balance minus baseline) is at least {rulesSummary.minPayout}</li>
          <li>no other payout is under review</li>
        </ul>
        <p>Each request is for 100% of realized profit. You receive {rulesSummary.traderSplit}; Propfund keeps {rulesSummary.propfundSplit}.</p>
      </DocSection>

      <DocSection id="identity-verification" title="Identity verification" description="Once, as the first step of your first payout request. Later payouts reuse it.">
        <p>Verification runs through our identity verification provider and checks a government ID, a selfie liveness check, sanctions and politically exposed person screening, and your country of residence. It is never required to sign in, pay or trade.</p>
        <DataTable
          head={["Status", "What it means"]}
          rows={[
            ["Not started", "You haven't begun verification."],
            ["In review", "Your documents are being checked."],
            ["Verified", "You can request payouts."],
            ["Needs more info", "Something was unclear. Resubmit the requested item."],
            ["Rejected", "Verification did not pass. You can try again; your funded account keeps trading, but you can't request a payout until verification passes."],
          ]}
        />
        <Callout type="warning" title="Rejections handled as violations">
          A rejection because you are in a restricted country or are a sanctioned person, or because your identity is already used on another profile, is handled as a violation (V8, V7 or V3). See <Link href="/help/violations">Violations</Link>.
        </Callout>
      </DocSection>

      <DocSection id="request" title="Requesting a payout">
        <Steps
          items={[
            { title: "Review the request", body: "The request sheet shows your profit, the 80/20 split, your new baseline and limits, the payout address and the pay date." },
            { title: "Choose the address", body: `Payouts are sent in ${rulesSummary.payout}. The default is your Propfund wallet. To use another address, enter an Arbitrum address and tick “I control this address on Arbitrum”. The address is locked for that request.` },
            { title: "Submit", body: "The profit is debited from your balance, your baseline resets to the new balance, and the status becomes Under review · pays DD MMM." },
          ]}
        />
        <Callout type="warning" title="Check your Arbitrum address">
          Only enter an address that can receive USDC on Arbitrum. You are responsible for the address you enter, and funds sent to a wrong address may not be recoverable.
        </Callout>
      </DocSection>

      <DocSection id="timeline" title="The 7-day review">
        <p>The 7 days start the day you submit. A request on Tue 15 Sep shows &ldquo;Under review · pays 22 Sep&rdquo; and is paid on Tue 22 Sep. During the review your trades on all accounts are checked for violations. You can keep trading; a breach during the review does not cancel the payout, but a confirmed violation does.</p>
      </DocSection>

      <DocSection id="statuses" title="Payout statuses">
        <DataTable
          head={["Status", "Meaning", "Balance effect"]}
          rows={[
            ["Under review", "Day 0 to day 7, violation checks running", "Profit already debited"],
            ["Paid", `Sent on day 7 in ${rulesSummary.payout}, with the transaction linked on arbiscan.io`, "None"],
            ["Voided", "A violation was confirmed", "Profit forfeited"],
            ["Returned", "Failed for a reason other than a violation, for example the address was rejected", "Profit credited back; request again"],
          ]}
        />
      </DocSection>
    </HelpArticle>
  );
}
