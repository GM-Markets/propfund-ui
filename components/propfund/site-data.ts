/**
 * Single source of truth for Propfund marketing numbers and payment facts.
 * Mirrors docs/PRD.md §3 (packages), §4 (payments), §7 (limits) and §8 (payouts).
 */

export const TARGET_PCT = 0.1;
export const DAILY_LOSS_PCT = 0.03;
export const MAX_LOSS_PCT = 0.05;
export const TRADER_SPLIT_PCT = 0.8;
export const REBUY_DISCOUNT_PCT = 0.2;
export const MIN_PAYOUT_USD = 50;
export const PAYOUT_REVIEW_DAYS = 7;
export const ACTIVITY_DAYS = 60;

/** fee = round(0.01 × account size) − 1 */
export function challengeFee(accountSize: number): number {
  return Math.round(0.01 * accountSize) - 1;
}

/** rebuy fee = round(0.8 × 0.01 × account size) − 1 */
export function rebuyFee(accountSize: number): number {
  return Math.round((1 - REBUY_DISCOUNT_PCT) * 0.01 * accountSize) - 1;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function formatUsd(value: number): string {
  return usd.format(value);
}

export function formatPct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export const PAYOUT_TOKEN = "USDC";
export const PAYOUT_CHAIN = "Arbitrum";

export type DepositChainId = "arbitrum" | "ethereum" | "base" | "bnb";

export type DepositChain = {
  id: DepositChainId;
  name: string;
  tokens: readonly ["USDC", "USDT"];
  /** Confirmations required before the deposit counts (PRD §4). */
  confirmations: number;
  /** Block explorer origin, no trailing slash. */
  explorer: string;
};

export const depositChains: DepositChain[] = [
  { id: "arbitrum", name: "Arbitrum", tokens: ["USDC", "USDT"], confirmations: 1, explorer: "https://arbiscan.io" },
  { id: "ethereum", name: "Ethereum", tokens: ["USDC", "USDT"], confirmations: 12, explorer: "https://etherscan.io" },
  { id: "base", name: "Base", tokens: ["USDC", "USDT"], confirmations: 1, explorer: "https://basescan.org" },
  { id: "bnb", name: "BNB Chain", tokens: ["USDC", "USDT"], confirmations: 15, explorer: "https://bscscan.com" },
];

function listWithOr(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
}

export const paymentSummary = {
  tokens: "USDC or USDT",
  chains: listWithOr(depositChains.map((chain) => chain.name)),
  /** "USDC or USDT on Arbitrum, Ethereum, Base or BNB Chain" */
  stablecoins: `USDC or USDT on ${listWithOr(depositChains.map((chain) => chain.name))}`,
  payout: `${PAYOUT_TOKEN} on ${PAYOUT_CHAIN}`,
  signIn: "email, Google or a wallet",
  depositWarning: `Send only USDC or USDT on ${listWithOr(depositChains.map((chain) => chain.name))}. Other tokens or chains can be lost.`,
} as const;

/** Where every "Start challenge" CTA goes. The dashboard shows sign-in when needed. */
export const START_CHALLENGE_PATH = "/dashboard/challenges";

export function challengeHref(packageId?: string): string {
  return packageId ? `${START_CHALLENGE_PATH}?package=${encodeURIComponent(packageId)}` : START_CHALLENGE_PATH;
}

export const rulesSummary = {
  target: formatPct(TARGET_PCT),
  dailyLoss: formatPct(DAILY_LOSS_PCT),
  maxLoss: formatPct(MAX_LOSS_PCT),
  traderSplit: formatPct(TRADER_SPLIT_PCT),
  propfundSplit: formatPct(1 - TRADER_SPLIT_PCT),
  rebuyDiscount: formatPct(REBUY_DISCOUNT_PCT),
  minPayout: formatUsd(MIN_PAYOUT_USD),
  reviewDays: `${PAYOUT_REVIEW_DAYS} days`,
  payout: `${PAYOUT_TOKEN} on ${PAYOUT_CHAIN}`,
} as const;

export type ChallengePackage = {
  /** Stable lowercase id used in `?package=` links, e.g. "plus". */
  id: string;
  name: string;
  /** Short label used on cards, e.g. "$25K". */
  label: string;
  accountSize: number;
  fee: number;
  rebuyFee: number;
  dailyLoss: number;
  maxLoss: number;
  target: number;
};

function buildPackage(name: string, accountSize: number): ChallengePackage {
  return {
    id: name.toLowerCase(),
    name,
    label: `$${accountSize / 1000}K`,
    accountSize,
    fee: challengeFee(accountSize),
    rebuyFee: rebuyFee(accountSize),
    dailyLoss: Math.round(DAILY_LOSS_PCT * accountSize),
    maxLoss: Math.round(MAX_LOSS_PCT * accountSize),
    target: Math.round(TARGET_PCT * accountSize),
  };
}

export const challengePackages: ChallengePackage[] = [
  buildPackage("Starter", 5_000),
  buildPackage("Core", 10_000),
  buildPackage("Plus", 25_000),
  buildPackage("Pro", 50_000),
  buildPackage("Elite", 100_000),
];

export const featuredPackageLabel = "$25K";
export const featuredPackageId = "plus";

export type MarketContent = {
  name: string;
  slug: string;
  headline: string;
  intro: string;
  count: string;
  hours: string;
  instruments: string[];
  groups: { title: string; body: string }[];
};

const targetGroupBody = `Hit ${rulesSummary.target} without crossing the ${rulesSummary.dailyLoss} daily or ${rulesSummary.maxLoss} max loss limit.`;
const payoutGroup = {
  title: "Payouts on a funded account",
  body: `Request realized profit from ${rulesSummary.minPayout}. You keep ${rulesSummary.traderSplit}, paid in ${rulesSummary.payout} 7 days after the request.`,
};

export const marketContent: Record<string, MarketContent> = {
  commodities: {
    name: "Commodities",
    slug: "commodities",
    headline: "Trade the contracts behind the macro move.",
    intro: `Trade six metals and energy markets. The target is ${rulesSummary.target}, the challenge has no deadline, and the rules stay the same at every account size.`,
    count: "6",
    hours: "Global session",
    instruments: ["GOLD", "SILVER", "COPPER", "PLATINUM", "NATGAS", "WTIOIL"],
    groups: [
      { title: "Metals and energy", body: "Trade six contracts across precious metals, energy, and industrial metals." },
      { title: `One ${rulesSummary.target} target`, body: targetGroupBody },
      payoutGroup,
    ],
  },
  crypto: {
    name: "Crypto",
    slug: "crypto",
    headline: "Trade crypto on your schedule.",
    intro: `Trade 30 supported crypto markets around the clock. Hit a ${rulesSummary.target} target, stay inside the loss limits, and take as long as you need.`,
    count: "30",
    hours: "24 / 7",
    instruments: ["BTC", "ETH", "SOL", "ASTER", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "DOT", "TON", "TRX", "LTC", "TAO", "SUI", "ARB", "NEAR", "ALGO", "UNI", "AAVE", "CRV", "HYPE", "XMR", "ZEC", "ENA", "ZRO", "WLD", "PUMP", "kPEPE"],
    groups: [
      { title: "Open all week", body: "Trade supported crypto markets seven days a week." },
      { title: `A ${rulesSummary.target} target`, body: targetGroupBody },
      { title: "Manual trading only", body: "Place every order yourself in the Propfund terminal. Bots, scripts, and copy trading are not allowed." },
    ],
  },
  forex: {
    name: "Forex",
    slug: "forex",
    headline: "Trade your session. Take your time.",
    intro: `Trade 29 major and cross currency pairs. The target is ${rulesSummary.target}, the same as every other market, and there is no deadline to reach it.`,
    count: "29",
    hours: "FX session",
    instruments: ["AUD/USD", "EUR/USD", "GBP/USD", "NZD/USD", "USD/CAD", "USD/CHF", "USD/JPY", "USD/MXN", "AUD/JPY", "CAD/JPY", "CHF/JPY", "EUR/JPY", "GBP/JPY", "NZD/JPY", "EUR/AUD", "EUR/CAD", "EUR/CHF", "EUR/GBP", "EUR/NZD", "GBP/AUD", "GBP/CAD", "GBP/CHF", "GBP/NZD", "AUD/CAD", "AUD/CHF", "AUD/NZD", "CAD/CHF", "NZD/CAD", "NZD/CHF"],
    groups: [
      { title: `A ${rulesSummary.target} target`, body: targetGroupBody },
      { title: "No countdown", body: "No deadline and no minimum number of trading days." },
      { title: "Hold overnight", body: "Hold through news, overnight, or weekends while the market is open and the account stays inside its limits." },
    ],
  },
  equities: {
    name: "Equities",
    slug: "equities",
    headline: "More than 1,000 ways to find your setup.",
    intro: `Trade more than 1,000 US stocks and sector ETFs. The target is ${rulesSummary.target}, and the challenge has no deadline.`,
    count: "1,000+",
    hours: "US session",
    instruments: ["Technology", "Financials", "Consumer", "Communications", "Healthcare", "Industrials", "Staples", "Energy", "Materials", "Utilities", "Real Estate", "Sector ETFs"],
    groups: [
      { title: "Plenty to trade", body: "Trade Russell 1000 names and supported sector ETFs." },
      { title: `One ${rulesSummary.target} target`, body: targetGroupBody },
      payoutGroup,
    ],
  },
};
