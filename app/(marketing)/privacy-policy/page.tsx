import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/propfund/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy | Propfund",
  description: "What personal information Propfund collects, why, who it is shared with, and the choices you have.",
};

const sections: LegalSection[] = [
  {
    title: "Scope",
    paragraphs: ["This policy explains how Propfund collects, uses, shares and protects personal information when you visit the site, sign in, pay for a challenge, trade a simulated account, request a payout or contact support. Propfund is responsible for the personal information described here."],
  },
  {
    title: "Information we collect",
    paragraphs: ["We collect only what we need to run your account, apply the rules and pay you. Depending on how you use Propfund, this includes:"],
    bullets: [
      "Sign-in data from our authentication provider: your email address if you use email; your name, email address and profile picture if you use Google; the addresses of wallets you connect; and the public address of your Propfund wallet. We never receive your wallet's private key.",
      "Device and network data: IP address, approximate location derived from it, browser and device type, and similar signals. We use these to block restricted countries and to detect shared accounts, multiple identities (V3) and hidden locations (V8).",
      "Trading activity in your simulated accounts: orders, fills, positions, balances, limit checks, breaches, graduations and payout requests.",
      "Card payments: card details are entered in the card payment processor's hosted checkout and handled by that processor. Propfund receives only the card brand, the last 4 digits and the payment status.",
      "Stablecoin deposits: the chain, token, amount, sending address, your deposit address and the transaction hash.",
      "Identity verification data, collected only when you request your first payout: an image of your government ID, a selfie and liveness check, your date of birth and country of residence. The identity verification provider collects this data and returns the result to us, together with sanctions and politically exposed person screening results.",
      "Payout data: the Arbitrum address you choose, payout amounts, statuses and transaction hashes.",
      "Support messages and anything you choose to send us.",
    ],
    after: ["We do not ask for identity documents at sign-in, at checkout or while you trade."],
  },
  {
    title: "How we use information",
    paragraphs: ["We use personal information to:"],
    bullets: [
      "create and run your account, your Propfund wallet and your simulated trading accounts",
      "take payments and credit deposits",
      "apply the trading rules and check for account violations, including during payout reviews and before graduation",
      "prevent fraud, payment abuse, sanctions breaches and access from restricted countries",
      "verify your identity at your first payout and send payouts",
      "answer support requests and send service messages about your account",
      "meet legal, tax, accounting and regulatory obligations, and establish or defend legal claims",
      "keep the service secure and fix problems",
    ],
    after: ["We do not sell personal information and do not use it for third-party advertising."],
  },
  {
    title: "Public blockchain data",
    paragraphs: [
      "Stablecoin deposits and USDC payouts are recorded on public blockchains. Anyone can see the addresses, amounts and transaction hashes on those ledgers, and neither Propfund nor anyone else can change or erase them.",
      <>The <Link href="/transparency">Transparency</Link> page shows aggregate figures and, for recent payouts, the date, the amount, an anonymized trader ID such as T-4F2A and the transaction hash. It never shows names or email addresses.</>,
    ],
  },
  {
    title: "When we share information",
    paragraphs: ["We share personal information only with service providers that work for us under contract and only for that work, grouped by role:"],
    bullets: [
      "an authentication and wallet infrastructure provider",
      "a card payment processor",
      "an identity verification and sanctions screening provider",
      "blockchain infrastructure and analytics providers used to detect deposits, send payouts and screen addresses",
      "hosting, storage, security, email and customer support providers",
      "professional advisers such as lawyers and accountants",
    ],
    after: ["We may also disclose information when the law requires it, to protect traders or the service, to investigate fraud or a violation, or as part of a merger, sale or reorganization, subject to this policy."],
  },
  {
    title: "International transfers",
    paragraphs: ["Propfund and its providers operate in several countries, so your information may be processed outside the country where you live. When we transfer information across borders we use contractual and other safeguards required by applicable law."],
  },
  {
    title: "How long we keep information",
    paragraphs: ["We keep information for as long as your account is open and afterwards only as long as needed for the purposes above. Identity verification records, payment and payout records and screening results are kept for as long as anti-money-laundering, tax and accounting laws require. Trading records are kept as long as needed to review payouts, handle appeals and defend claims. Public blockchain records cannot be deleted."],
  },
  {
    title: "Security",
    paragraphs: ["We use administrative, technical and organizational measures to protect personal information, including encryption in transit, access controls and keeping card and identity data with specialist providers. No system is completely secure, so please keep your sign-in method and any exported wallet key safe and tell us promptly if you suspect misuse."],
  },
  {
    title: "Your rights",
    paragraphs: [
      "Depending on where you live, you may have the right to access, correct, delete or get a copy of your personal information, to restrict or object to certain uses, and to withdraw consent where we rely on it. You may also complain to your local data protection authority.",
      "To make a request, email support@propfund.io from the address linked to your account. We may need to verify your identity first. Some information may be kept where the law requires it, for example verification and payout records, and blockchain records cannot be erased.",
    ],
  },
  {
    title: "Cookies and local storage",
    paragraphs: ["We use cookies and browser storage that the service needs to work:"],
    bullets: [
      "session storage that keeps you signed in",
      "preferences such as your selected chain, market or layout",
      "test-mode data: while Propfund runs in test mode, your simulated accounts, deposits and payouts are saved in your browser's local storage on your device",
    ],
    after: ["You can clear cookies and local storage in your browser settings. Clearing them signs you out and, in test mode, removes the test data saved on that device."],
  },
  {
    title: "Children",
    paragraphs: ["Propfund is only for people aged 18 or over. We do not knowingly collect information from anyone under 18. If you believe a minor has signed up, contact us and we will close the account."],
  },
  {
    title: "Changes to this policy",
    paragraphs: ["We may update this policy when the service or the law changes. We will post the new version with a new effective date and give notice on the site or in the app for material changes."],
  },
  {
    title: "Contact",
    paragraphs: ["Questions and privacy requests can be sent to support@propfund.io."],
  },
];

export default function PrivacyPolicyPage() {
  return <LegalPage title="Privacy policy" intro="What we collect, why we use it, who we share it with and the choices you have." sections={sections} />;
}
