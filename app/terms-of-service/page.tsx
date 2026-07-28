import type { Metadata } from "next";
import { LegalPage } from "../../components/propfund/LegalPage";

export const metadata: Metadata = {
  title: "Terms of service | Propfund",
  description: "The terms that govern access to Propfund evaluations and simulated accounts.",
};

const sections = [
  {
    title: "Agreement and eligibility",
    paragraphs: ["These terms govern your use of Propfund. By creating an account, purchasing an evaluation, or using the service, you agree to these terms and the published trading rules. You must have legal capacity to enter this agreement and meet any age, identity, residency, and sanctions requirements shown during signup."],
  },
  {
    title: "A simulated trading service",
    paragraphs: ["Propfund provides skill evaluations and simulated trading accounts. Account balances, positions, and performance shown in the service are simulated unless expressly stated otherwise. Propfund is not a broker, bank, investment adviser, or custodian, and does not accept deposits or provide investment advice."],
  },
  {
    title: "Accounts and identity",
    paragraphs: ["You must provide accurate information, keep your credentials secure, and use only your own account. We may request identity, payment, or eligibility verification. Accounts may not be sold, transferred, shared, or operated on behalf of another person."],
  },
  {
    title: "Evaluations, fees, and rules",
    paragraphs: ["An evaluation fee purchases access to the selected simulated evaluation. It is not a deposit or investment and does not guarantee that you will pass, receive a scaled account, receive a reward, or make money. Targets, drawdowns, supported markets, and other requirements are displayed before purchase and may differ by market."],
  },
  {
    title: "Prohibited conduct",
    paragraphs: ["You may not manipulate the service, exploit pricing or data errors, misrepresent identity, share access, use third-party copy trading, coordinate trades across unrelated accounts, evade limits, interfere with systems, or use the service unlawfully. Original strategies and personally controlled automation are permitted where the published rules allow them."],
  },
  {
    title: "Scaled accounts, rewards, and scaling",
    paragraphs: ["Passing an evaluation may make you eligible for a simulated scaled account, subject to verification and account checks. Reward eligibility is based on qualifying realized simulated performance and the published cycle. Scaling is discretionary and depends on the performance and risk criteria shown in the program rules."],
  },
  {
    title: "Payments and refunds",
    paragraphs: ["You authorize the listed evaluation charge at checkout and are responsible for taxes, bank fees, and accurate billing information. Refund eligibility is governed by the Refund Policy. Starting or using an evaluation may limit refund rights where permitted by law."],
  },
  {
    title: "Suspension and termination",
    paragraphs: ["We may pause, restrict, or close an account when necessary to protect the service, investigate a rule breach, comply with law, address payment disputes, or prevent fraud. We may invalidate activity or deny a reward when reliable account data shows prohibited conduct or a published rule breach."],
  },
  {
    title: "Intellectual property",
    paragraphs: ["Propfund and its licensors own the service, site design, software, content, and trademarks. These terms give you a limited, personal, revocable right to use the service for its intended purpose. They do not transfer ownership of any Propfund materials."],
  },
  {
    title: "Disclaimers and liability",
    paragraphs: ["The service is provided on an “as available” basis to the extent permitted by law. Market data, infrastructure, and third-party services can be delayed or unavailable. Propfund is not responsible for trading decisions made outside the service. To the maximum extent permitted by law, Propfund is not liable for indirect, incidental, special, consequential, or lost-profit damages."],
  },
  {
    title: "Changes, law, and contact",
    paragraphs: ["We may update the service, rules, or these terms. Material changes will apply prospectively unless law or security requires otherwise. The governing law and dispute forum will be those presented during checkout for your contracting Propfund entity. Questions can be sent to support@propfund.com."],
  },
];

export default function TermsOfServicePage() {
  return <LegalPage title="Terms of service" intro="The ground rules for using Propfund evaluations and scaled accounts." sections={sections} />;
}
