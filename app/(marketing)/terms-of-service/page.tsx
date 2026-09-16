import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/propfund/LegalPage";
import {
  ACTIVITY_DAYS,
  challengePackages,
  formatUsd,
  paymentSummary,
  PAYOUT_REVIEW_DAYS,
  rulesSummary,
} from "@/components/propfund/site-data";

export const metadata: Metadata = {
  title: "Terms of service | Propfund",
  description: "The terms that govern Propfund sign-in, challenges, funded accounts, payments and payouts.",
};

const packageList = challengePackages.map((plan) => `${plan.name} (${formatUsd(plan.accountSize)} account): ${formatUsd(plan.fee)} fee, ${formatUsd(plan.rebuyFee)} rebuy fee`);

const sections: LegalSection[] = [
  {
    title: "Who we are and these terms",
    paragraphs: [
      "Propfund runs one-step trading challenges on simulated accounts. These terms are an agreement between you and Propfund. They apply when you visit the site, sign in, pay for a challenge, trade in the Propfund terminal, or request a payout.",
      <>By using the service you agree to these terms, the <Link href="/rules">Trading Rules</Link>, the <Link href="/privacy-policy">Privacy Policy</Link> and the <Link href="/refund-policy">Refund Policy</Link>. If you do not agree, do not use the service.</>,
    ],
  },
  {
    title: "Eligibility",
    paragraphs: ["To use Propfund you must:"],
    bullets: [
      "be at least 18 years old and able to enter a binding agreement",
      "not live in, or access the service from, a restricted country or region",
      "not be subject to sanctions, and not act for anyone who is",
      "use the service for yourself, not on behalf of another person",
    ],
    after: ["We check location at checkout and during trading, and we check identity, sanctions and politically exposed person status at your first payout request. We may refuse or close an account that does not meet these requirements."],
  },
  {
    title: "Sign-in and your Propfund wallet",
    paragraphs: [
      `You sign in with ${paymentSummary.signIn}. Sign-in is provided through a third-party authentication provider. Signing in never asks for identity documents.`,
      "Every trader gets a Propfund wallet, a self-custody crypto wallet created for your account and secured through the authentication provider. You are responsible for keeping access to your sign-in method and any wallet you connect.",
      "If you export your Propfund wallet's private key, anyone who obtains it can move the funds in that wallet. Propfund cannot recover a lost or exposed key and cannot reverse transfers made with it. Keep exported keys offline and private.",
    ],
  },
  {
    title: "A simulated trading service",
    paragraphs: [
      "Challenge accounts and funded accounts are simulated. Balances, positions, fills and profit shown in the terminal are simulated. Propfund does not place orders in real markets on your behalf, and you never trade Propfund's money or your own money through the terminal.",
      "Propfund is not a broker, exchange, bank, investment adviser or custodian. Nothing on the site or in the service is investment, financial, legal or tax advice. Past results, including figures on the Transparency page, do not predict future results.",
    ],
  },
  {
    title: "Packages and fees",
    paragraphs: ["There are five challenge packages. The rules are the same at every size. The fee pays for access to a simulated challenge; it is not a deposit or an investment."],
    bullets: packageList,
    after: [`The fee is round(1% of the account size) minus $1. After a breach, the next challenge of any size costs the rebuy fee, which is ${rulesSummary.rebuyDiscount} lower. Prices shown at checkout apply to that purchase.`],
  },
  {
    title: "Paying with a stablecoin deposit",
    paragraphs: [
      `You can pay the fee with ${paymentSummary.stablecoins}. 1 USDC and 1 USDT each count as $1. You can pay from your Propfund wallet, from a connected wallet, or by sending funds to your personal deposit address.`,
    ],
    bullets: [
      "Only the listed tokens on the listed chains are supported. Tokens sent on another chain, or other tokens sent to your deposit address, may be lost and may not be recoverable.",
      "A deposit counts once it has the required confirmations: Arbitrum 1, Base 1, Ethereum 12, BNB Chain 15.",
      "The sender pays the network fee. A deposit must cover the fee in full after network fees.",
      "Any amount above the fee is credited to your Propfund deposit balance for a later purchase. The deposit balance is not withdrawable at this time.",
      "Blockchain transfers cannot be reversed by Propfund once they are sent.",
    ],
  },
  {
    title: "Paying by card",
    paragraphs: ["Card payments are processed in a hosted checkout run by a third-party card payment processor. Propfund does not see or store your full card number. The processor's terms may also apply to your payment. Your account is created when the payment succeeds."],
  },
  {
    title: "One active account",
    paragraphs: ["Each person may hold one Propfund profile and one active account, challenge or funded, at a time. Checkout is disabled while you have an active account. Accounts may not be sold, transferred, shared or run for someone else."],
  },
  {
    title: "Challenge rules and breach",
    paragraphs: [
      <>The full rules are on the <Link href="/rules">Trading Rules</Link> page and form part of these terms. In summary: the profit target is {rulesSummary.target} of the account size; the daily loss limit is {rulesSummary.dailyLoss} of the baseline, counted from the balance at 00:00 UTC; the max loss limit is a fixed floor {rulesSummary.maxLoss} below the baseline that does not trail. Every limit check uses equity, including open positions, on every price tick.</>,
      "If equity reaches a loss limit, every position is closed at the current price, all orders are cancelled and the account becomes read-only. A breach is final, including when price gaps through the limit.",
      `After a breach you can buy a new challenge of any size at the rebuy fee. The rebuy offer stays open until your next purchase. It is not offered after an account is terminated for a violation.`,
    ],
  },
  {
    title: "Graduation and the funded account",
    paragraphs: [
      `You graduate when equity is at least ${rulesSummary.target} above the baseline, the account has no open positions or working orders, and the violation check is clean. Challenge profit is not paid out.`,
      "A simulated funded account then opens at your package size, with the same loss limits and no profit target. There is no scaling plan, no time limit and no minimum number of trading days.",
    ],
  },
  {
    title: "Payouts",
    paragraphs: ["On a funded account you can request a payout when all of these are true: identity verification has passed, the account has no open positions or working orders, realized profit is at least " + rulesSummary.minPayout + ", and no other payout is under review."],
    bullets: [
      `Each request is for 100% of realized profit. When you submit it, the profit is debited from the balance; you receive ${rulesSummary.traderSplit} and Propfund keeps ${rulesSummary.propfundSplit}. The baseline resets to the new balance.`,
      "Identity verification happens once, as the first step of your first payout request, through a third-party identity verification provider. It covers a government ID, a selfie liveness check, sanctions and politically exposed person screening, and your country of residence. Later payouts reuse it.",
      `Payouts are reviewed for ${PAYOUT_REVIEW_DAYS} calendar days from the day you submit the request and are paid on day ${PAYOUT_REVIEW_DAYS}. For example, a request on Tuesday 15 September is paid on Tuesday 22 September. You can keep trading during the review, and those trades are reviewed too.`,
      `Payouts are paid only in ${rulesSummary.payout}. The default address is your Propfund wallet. If you enter another address, you confirm that you control it on Arbitrum. You are responsible for giving a correct Arbitrum address; funds sent to an address you entered cannot be recovered by Propfund.`,
      "A breach during the review does not cancel the payout. A confirmed violation does.",
      "Returned: a payout that fails for a reason other than a violation, for example a rejected address, is credited back to your balance and you can request it again.",
      "Voided: a payout under review when a violation is confirmed is cancelled and the profit is forfeited.",
    ],
  },
  {
    title: "Account violations",
    paragraphs: ["Every order must be placed by hand in the Propfund terminal. The following are violations. They are checked on every account, in full during each payout review and before graduation."],
    bullets: [
      "V1 · Algorithmic or automated trading: bots, expert advisors, scripts, API order placement, macros, auto-clickers or browser automation.",
      "V2 · Wash or cross-account hedging: opposite positions in the same instrument across accounts you control, accounts of family or friends, or in coordination with other traders.",
      "V3 · Multiple identities: more than one profile per person, or the same device, IP address, wallet, payment method or verified identity behind different profiles.",
      "V4 · Copy and signal trading: mirroring another trader, trade copiers, paid signal groups or coordinated group trading.",
      "V5 · Account sharing or paid passing: anyone else logging in or trading, or paying someone to pass or manage the account.",
      "V6 · Exploiting the platform: trading on stale or wrong prices, latency arbitrage, or deliberately exploiting bugs.",
      "V7 · Payment abuse: card chargebacks or disputes, stolen cards or wallets, or funds linked to sanctioned addresses.",
      "V8 · Restricted access: using the service from a restricted jurisdiction, or using a VPN or proxy to hide your location.",
    ],
    after: ["Manual trading, news trading, and holding positions overnight or over a weekend while the market is open are allowed within the limits."],
  },
  {
    title: "Consequences of a violation",
    paragraphs: ["If we confirm a violation:"],
    bullets: [
      "every payout under review on any of your accounts is voided and the profit is forfeited",
      "all of your accounts are terminated and become read-only",
      "fees are not refunded and no rebuy is offered",
      "you may not buy new challenges",
      "payouts already paid for trading affected by the violation must be repaid on request, and we may take steps to recover them",
    ],
    after: ["Payouts already sent are not reversed on-chain. You will see the violation code and a plain-language reason. You can appeal by emailing support@propfund.io."],
  },
  {
    title: "Inactivity",
    paragraphs: [`An account with no trade in ${ACTIVITY_DAYS} days is closed for inactivity. There is no time limit otherwise. The fee is not refunded.`],
  },
  {
    title: "Fees are non-refundable",
    paragraphs: [<>Challenge fees are non-refundable, including after a breach, a violation or an inactivity closure, except as set out in the <Link href="/refund-policy">Refund Policy</Link> or where the law requires a refund.</>],
  },
  {
    title: "Taxes",
    paragraphs: ["You are responsible for any taxes that apply to payouts you receive and to your use of the service. We may collect tax information or issue tax documents where the law requires it."],
  },
  {
    title: "Suspension and termination",
    paragraphs: ["We may pause, restrict or close your access while we investigate a possible violation, a payment dispute, suspected fraud or a legal requirement, or to protect the service and other traders. You can stop using the service at any time. Sections that by their nature should survive, including payout recovery, disclaimers and limitation of liability, survive termination."],
  },
  {
    title: "Intellectual property",
    paragraphs: ["Propfund and its licensors own the service, the terminal, the site, its content and the Propfund name. These terms give you a limited, personal, non-transferable and revocable right to use the service as intended. You may not copy, scrape, reverse engineer or resell any part of it."],
  },
  {
    title: "Disclaimers",
    paragraphs: ["The service is provided as available. Simulated prices, market data, networks, blockchains and third-party services can be delayed, wrong or unavailable. To the extent the law allows, we make no promise that the service will be uninterrupted or error-free, or that you will pass a challenge, receive a funded account or earn a payout."],
  },
  {
    title: "Limitation of liability",
    paragraphs: ["To the extent the law allows, Propfund is not liable for indirect, incidental, special or consequential losses, lost profits, or losses caused by your wallet, your keys, an address you entered, or a transfer on an unsupported chain or token. Nothing in these terms limits liability that cannot be limited by law."],
  },
  {
    title: "Changes to these terms",
    paragraphs: ["We may update the service, the rules or these terms. We will post the new version with a new effective date and, for material changes, give notice on the site or in the app. Changes apply from the effective date and do not change the rules for a payout already under review."],
  },
  {
    title: "Governing law",
    paragraphs: ["The governing law and dispute forum will be those presented during checkout for your contracting Propfund entity."],
  },
  {
    title: "Contact",
    paragraphs: ["Questions, appeals and notices can be sent to support@propfund.io."],
  },
];

export default function TermsOfServicePage() {
  return <LegalPage title="Terms of service" intro="The terms for signing in, paying for a challenge, trading simulated accounts and receiving payouts." sections={sections} />;
}
