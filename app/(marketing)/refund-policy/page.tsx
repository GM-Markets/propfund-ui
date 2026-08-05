import type { Metadata } from "next";
import { LegalPage } from "@/components/propfund/LegalPage";

export const metadata: Metadata = {
  title: "Refund policy | Propfund",
  description: "When a Propfund evaluation fee may be eligible for a refund.",
};

const sections = [
  {
    title: "What the fee covers",
    paragraphs: ["An evaluation fee pays for access to the selected simulated trading evaluation. It is not a deposit, investment, or stored balance. Because access is delivered digitally, fees are generally final once evaluation credentials are issued or the evaluation is used, except where law requires otherwise."],
  },
  {
    title: "When we may issue a refund",
    paragraphs: ["We will review a refund request when there is a duplicate charge, an unauthorized payment reported promptly, a material service failure that prevented access before the evaluation was used, or another circumstance where applicable law requires a refund."],
  },
  {
    title: "What is not refundable",
    paragraphs: ["A fee is not refundable merely because an evaluation was failed, a trading rule was breached, a user changed their mind after access was delivered, an account became inactive, market conditions changed, or the user’s device, internet connection, or third-party software did not work as expected."],
  },
  {
    title: "How to request review",
    paragraphs: ["Email support@propfund.com within seven days of the charge. Include your account email, evaluation size, transaction date, and a short explanation. Do not include complete card or bank details. We may ask for additional information needed to verify the transaction."],
  },
  {
    title: "Processing",
    paragraphs: ["Approved refunds are returned to the original payment method. Timing depends on the payment provider and your bank. Fees charged by banks, card networks, currency conversion providers, or other third parties may not be recoverable."],
  },
  {
    title: "Chargebacks and fraud",
    paragraphs: ["Contact us before opening a payment dispute so we can review the issue. Fraudulent, abusive, or knowingly false refund claims may lead to account restriction and may be reported to payment or legal authorities."],
  },
  {
    title: "Your statutory rights",
    paragraphs: ["Nothing in this policy limits a refund, cancellation, or consumer right that cannot be waived under applicable law. Questions can be sent to support@propfund.com."],
  },
];

export default function RefundPolicyPage() {
  return <LegalPage title="Refund policy" intro="When an evaluation fee can be reviewed for a refund." sections={sections} />;
}
