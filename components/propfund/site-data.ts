export type PricingPlan = {
  size: string;
  fee: string;
  previousFee: string;
  target: string;
  drawdown: string;
  scale: string;
};

export const pricingPlans: PricingPlan[] = [
  { size: "$5K", fee: "$24", previousFee: "$59", target: "8-10%", drawdown: "2 × 5%", scale: "Up to $2.5M" },
  { size: "$10K", fee: "$39", previousFee: "$99", target: "8-10%", drawdown: "2 × 5%", scale: "Up to $2.5M" },
  { size: "$25K", fee: "$84", previousFee: "$199", target: "8-10%", drawdown: "2 × 5%", scale: "Up to $2.5M" },
  { size: "$50K", fee: "$159", previousFee: "$349", target: "8-10%", drawdown: "2 × 5%", scale: "Up to $2.5M" },
  { size: "$100K", fee: "$299", previousFee: "$599", target: "8-10%", drawdown: "2 × 5%", scale: "Up to $2.5M" },
];

export type MarketContent = {
  name: string;
  slug: string;
  headline: string;
  intro: string;
  count: string;
  target: string;
  hours: string;
  instruments: string[];
  groups: { title: string; body: string }[];
};

export const marketContent: Record<string, MarketContent> = {
  commodities: {
    name: "Commodities",
    slug: "commodities",
    headline: "Trade metals and energy.",
    intro: "Choose from six commodity contracts. The evaluation target is 10%, with no deadline and two 5% static loss limits.",
    count: "6",
    target: "10%",
    hours: "Global session",
    instruments: ["GOLD", "SILVER", "COPPER", "PLATINUM", "NATGAS", "WTIOIL"],
    groups: [
      { title: "Six supported contracts", body: "Trade gold, silver, copper, platinum, natural gas, and WTI oil." },
      { title: "A 10% target", body: "Reach the target without breaching either 5% static loss limit." },
      { title: "Weekly reward requests", body: "After you pass, complete seven trading days before your first eligible request." },
    ],
  },
  crypto: {
    name: "Crypto",
    slug: "crypto",
    headline: "Trade crypto seven days a week.",
    intro: "Choose from 30 supported crypto markets. The evaluation target is 10%, with no deadline and two 5% static loss limits.",
    count: "30",
    target: "10%",
    hours: "24 / 7",
    instruments: ["BTC", "ETH", "SOL", "ASTER", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "DOT", "TON", "TRX", "LTC", "TAO", "SUI", "ARB", "NEAR", "ALGO", "UNI", "AAVE", "CRV", "HYPE", "XMR", "ZEC", "ENA", "ZRO", "WLD", "PUMP", "kPEPE"],
    groups: [
      { title: "30 supported markets", body: "Trade majors and selected alts whenever your setup appears." },
      { title: "A 10% target", body: "Reach the target without breaching either 5% static loss limit." },
      { title: "Manual, algo, or both", body: "Trade manually or run automation you built and control." },
    ],
  },
  forex: {
    name: "Forex",
    slug: "forex",
    headline: "Trade 29 FX pairs.",
    intro: "The Forex evaluation target is 8%. There is no deadline, and positions can stay open through news, nights, and weekends.",
    count: "29",
    target: "8%",
    hours: "FX session",
    instruments: ["AUD/USD", "EUR/USD", "GBP/USD", "NZD/USD", "USD/CAD", "USD/CHF", "USD/JPY", "USD/MXN", "AUD/JPY", "CAD/JPY", "CHF/JPY", "EUR/JPY", "GBP/JPY", "NZD/JPY", "EUR/AUD", "EUR/CAD", "EUR/CHF", "EUR/GBP", "EUR/NZD", "GBP/AUD", "GBP/CAD", "GBP/CHF", "GBP/NZD", "AUD/CAD", "AUD/CHF", "AUD/NZD", "CAD/CHF", "NZD/CAD", "NZD/CHF"],
    groups: [
      { title: "29 major and cross pairs", body: "Trade the sessions and currency pairs already in your playbook." },
      { title: "An 8% target", body: "Reach the target without breaching either 5% static loss limit." },
      { title: "Hold positions when needed", body: "Trade news and hold overnight or over weekends while staying inside the limits." },
    ],
  },
  equities: {
    name: "Equities",
    slug: "equities",
    headline: "Trade US stocks and sector ETFs.",
    intro: "Choose from more than 1,000 supported names. The evaluation target is 10%, with no deadline and two 5% static loss limits.",
    count: "1,000+",
    target: "10%",
    hours: "US session",
    instruments: ["Technology", "Financials", "Consumer", "Communications", "Healthcare", "Industrials", "Staples", "Energy", "Materials", "Utilities", "Real Estate", "Sector ETFs"],
    groups: [
      { title: "More than 1,000 names", body: "Trade Russell 1000 companies and supported sector ETFs." },
      { title: "A 10% target", body: "Reach the target without breaching either 5% static loss limit." },
      { title: "Seven trading days", body: "After you pass, complete seven trading days before your first eligible request." },
    ],
  },
};