import Link from "next/link";

import { HelpArticle, helpMetadata } from "@/components/docs/article";
import { Callout, DataTable, DocSection, Steps } from "@/components/docs/blocks";
import { depositChains, paymentSummary, rulesSummary } from "@/components/propfund/site-data";

export const metadata = helpMetadata("paying-for-a-challenge");

export default function PayingForAChallengePage() {
  return (
    <HelpArticle slug="paying-for-a-challenge">
      <DocSection id="ways-to-pay" title="Ways to pay">
        <p>Pay the challenge fee with a stablecoin deposit or by card. Either way, you tick &ldquo;I agree to the Trading Rules and Terms&rdquo; before paying, and your challenge account opens as soon as the payment is confirmed.</p>
        <ul>
          <li>You can hold one active account, challenge or funded, at a time. While one is open, checkout shows &ldquo;You already have an active account.&rdquo;</li>
          <li>Checkout is not available from restricted countries.</li>
          <li>Fees are non-refundable, including after a breach or a violation. See the <Link href="/refund-policy">Refund Policy</Link>.</li>
        </ul>
      </DocSection>

      <DocSection id="supported-chains" title="Supported chains and tokens" description="1 USDC = 1 USDT = $1 for fee purposes.">
        <DataTable
          caption="Stablecoin deposits"
          head={["Chain", "Tokens", "Confirmations needed"]}
          rows={depositChains.map((chain) => [chain.name, chain.tokens.join(", "), String(chain.confirmations)])}
        />
        <Callout type="warning" title="Wrong network or token">
          {paymentSummary.depositWarning} Tokens sent on any other chain, or any other token sent to your deposit address, may not be recoverable. Check the network in your wallet before you send.
        </Callout>
      </DocSection>

      <DocSection id="deposit-steps" title="Paying with a stablecoin">
        <Steps
          items={[
            { title: "Choose a package", body: "On the Challenges page, pick a package and choose to pay with crypto." },
            { title: "Pick how to send", body: "Pay from your Propfund wallet or a connected wallet by choosing the chain and token and confirming the transfer. Or choose Send from anywhere to get your deposit address, a QR code and the exact amount." },
            { title: "Wait for confirmations", body: "The status moves from Waiting for deposit to Confirming (for example 4 of 12) to Confirmed." },
            { title: "Start trading", body: "Once the deposit is confirmed, your challenge account is created and the terminal opens." },
          ]}
        />
        <ul>
          <li>Your deposit address is the same on all four chains.</li>
          <li>The network fee is paid by you, the sender. Send enough that the amount received covers the fee.</li>
          <li>If you send more than the fee, the extra is kept as a deposit balance for your next purchase. It can&apos;t be withdrawn at this time.</li>
        </ul>
      </DocSection>

      <DocSection id="card" title="Paying by card">
        <p>Choose Pay by card to open a hosted checkout run by our card payment processor. Propfund never shows card number fields and never sees your full card number; your payment history shows only the card brand, the last 4 digits and the status. The account is created when the payment succeeds.</p>
        <Callout type="info" title="Card disputes">
          Please contact support@propfund.io before disputing a charge. A chargeback on a fee is a payment abuse violation (V7).
        </Callout>
      </DocSection>

      <DocSection id="rebuy" title="Rebuy pricing">
        <p>After a breach, your next challenge of any size costs the rebuy fee, {rulesSummary.rebuyDiscount} below the full fee. Checkout shows the full fee struck through, the rebuy fee and &ldquo;Rebuy discount: {rulesSummary.rebuyDiscount} off&rdquo;. The offer stays open until your next purchase and is not offered after a violation.</p>
      </DocSection>
    </HelpArticle>
  );
}
