import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/propfund/LegalPage";
import { paymentSummary } from "@/components/propfund/site-data";

export const metadata: Metadata = {
  title: "Refund policy | Propfund",
  description: "Propfund challenge fees are non-refundable. How card charges and stablecoin deposits are handled, and the limited cases we review.",
};

const sections: LegalSection[] = [
  {
    title: "What the fee covers",
    paragraphs: ["A challenge fee pays for access to the selected simulated challenge. It is not a deposit or an investment. Challenge fees are non-refundable once the challenge account is created, except where the law requires otherwise."],
  },
  {
    title: "What is not refundable",
    paragraphs: ["A fee is not refunded because a challenge was failed, an account hit the daily or max loss limit, an account was terminated for a violation, an account was closed for inactivity, you changed your mind after the account was created, market conditions changed, or your device, connection or wallet did not work as expected. The rebuy fee offered after a breach is a discount on a new challenge, not a refund of an earlier fee."],
  },
  {
    title: "Stablecoin deposits",
    paragraphs: [`You can pay with ${paymentSummary.stablecoins}. Blockchain transfers cannot be reversed, so crypto payments work differently from card payments:`],
    bullets: [
      "Fees paid with a stablecoin deposit are not refunded.",
      `Tokens sent on an unsupported chain, unsupported tokens, or funds sent to the wrong address may be lost. Propfund cannot reverse these transfers and may not be able to recover them. ${paymentSummary.depositWarning}`,
      "If you send more than the fee, the extra is credited to your Propfund deposit balance and can be used for your next purchase. The deposit balance is not withdrawable at this time.",
      "Network fees are paid by the sender and are not refunded.",
    ],
  },
  {
    title: "When we review a card charge",
    paragraphs: ["We will review a card charge when there is a duplicate charge, a payment you did not authorize that you report promptly, a service failure on our side that stopped the challenge account from being created, or another case where the law requires a refund."],
  },
  {
    title: "How to ask for a review",
    paragraphs: ["Email support@propfund.io within seven days of the payment. Include the email or wallet you sign in with, the package, the payment date, and for a deposit the chain and transaction hash. Never send a full card number, a private key or a recovery phrase."],
  },
  {
    title: "Processing",
    paragraphs: ["Approved card refunds go back to the original card through the card payment processor. Timing depends on the processor and your bank. Fees charged by banks, card networks or currency conversion may not be recoverable."],
  },
  {
    title: "Chargebacks and fraud",
    paragraphs: [<>Please contact us before opening a card dispute so we can look into it. Chargebacks and disputes on a fee are a payment abuse violation (V7) under the <Link href="/terms-of-service">Terms of Service</Link> and lead to termination of all accounts and voided payouts.</>],
  },
  {
    title: "Your statutory rights",
    paragraphs: ["Nothing in this policy limits a refund, cancellation or consumer right that cannot be waived under applicable law. Questions can be sent to support@propfund.io."],
  },
];

export default function RefundPolicyPage() {
  return <LegalPage title="Refund policy" intro="Challenge fees are non-refundable. Here is how card and stablecoin payments are handled and the limited cases we review." sections={sections} />;
}
