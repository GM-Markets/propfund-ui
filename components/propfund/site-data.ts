export type PricingPlan = {
  size: string;
  fee: string;
  target: string;
  drawdown: string;
  scale: string;
};

export const pricingPlans: PricingPlan[] = [
  { size: "$5K", fee: "$12", target: "8-10%", drawdown: "5%", scale: "Up to $2.5M" },
  { size: "$10K", fee: "$19.50", target: "8-10%", drawdown: "5%", scale: "Up to $2.5M" },
  { size: "$25K", fee: "$42", target: "8-10%", drawdown: "5%", scale: "Up to $2.5M" },
  { size: "$50K", fee: "$79.50", target: "8-10%", drawdown: "5%", scale: "Up to $2.5M" },
  { size: "$100K", fee: "$149.50", target: "8-10%", drawdown: "5%", scale: "Up to $2.5M" },
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
    headline: "Trade the contracts behind the macro move.",
    intro: "Trade six metals and energy markets. The target is 10%, the evaluation has no deadline, and the rules stay the same at every account size.",
    count: "6",
    target: "10%",
    hours: "Global session",
    instruments: ["GOLD", "SILVER", "COPPER", "PLATINUM", "NATGAS", "WTIOIL"],
    groups: [
      { title: "Metals and energy", body: "Trade six contracts across precious metals, energy, and industrial metals." },
      { title: "One 10% target", body: "Hit 10% without crossing the 5% evaluation loss limit." },
      { title: "Weekly rewards", body: "Request eligible rewards every seven trading days after you pass." },
    ],
  },
  crypto: {
    name: "Crypto",
    slug: "crypto",
    headline: "Trade crypto on your schedule.",
    intro: "Trade 30 supported crypto markets around the clock. Hit a 10% target, stay inside the loss limits, and take as long as you need.",
    count: "30",
    target: "10%",
    hours: "24 / 7",
    instruments: ["BTC", "ETH", "SOL", "ASTER", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK", "DOT", "TON", "TRX", "LTC", "TAO", "SUI", "ARB", "NEAR", "ALGO", "UNI", "AAVE", "CRV", "HYPE", "XMR", "ZEC", "ENA", "ZRO", "WLD", "PUMP", "kPEPE"],
    groups: [
      { title: "Open all week", body: "Trade supported crypto markets seven days a week." },
      { title: "A 10% target", body: "Hit 10% without crossing the 5% evaluation loss limit." },
      { title: "Trade your way", body: "Trade manually or use your own automation. No third-party copy trading." },
    ],
  },
  forex: {
    name: "Forex",
    slug: "forex",
    headline: "Trade your session. Take your time.",
    intro: "Trade 29 major and cross currency pairs. The Forex target is 8%, and there is no deadline to reach it.",
    count: "29",
    target: "8%",
    hours: "FX session",
    instruments: ["AUD/USD", "EUR/USD", "GBP/USD", "NZD/USD", "USD/CAD", "USD/CHF", "USD/JPY", "USD/MXN", "AUD/JPY", "CAD/JPY", "CHF/JPY", "EUR/JPY", "GBP/JPY", "NZD/JPY", "EUR/AUD", "EUR/CAD", "EUR/CHF", "EUR/GBP", "EUR/NZD", "GBP/AUD", "GBP/CAD", "GBP/CHF", "GBP/NZD", "AUD/CAD", "AUD/CHF", "AUD/NZD", "CAD/CHF", "NZD/CAD", "NZD/CHF"],
    groups: [
      { title: "An 8% target", body: "Hit 8% without crossing the 5% evaluation loss limit." },
      { title: "No countdown", body: "No deadline and no minimum number of trading days." },
      { title: "Hold overnight", body: "Hold through news, overnight, or weekends within the account limits." },
    ],
  },
  equities: {
    name: "Equities",
    slug: "equities",
    headline: "More than 1,000 ways to find your setup.",
    intro: "Trade more than 1,000 US stocks and sector ETFs. The target is 10%, and the evaluation has no deadline.",
    count: "1,000+",
    target: "10%",
    hours: "US session",
    instruments: ["Technology", "Financials", "Consumer", "Communications", "Healthcare", "Industrials", "Staples", "Energy", "Materials", "Utilities", "Real Estate", "Sector ETFs"],
    groups: [
      { title: "Plenty to trade", body: "Trade Russell 1000 names and supported sector ETFs." },
      { title: "One 10% target", body: "Hit 10% without crossing the 5% evaluation loss limit." },
      { title: "Weekly rewards", body: "Request eligible rewards every seven trading days after you pass." },
    ],
  },
};