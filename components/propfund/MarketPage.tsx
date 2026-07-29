import Image from "next/image";
import { HeroDotField } from "./HeroDotField";
import { MaterialIcon } from "./MaterialIcon";
import { PageFrame, PricingGrid, StartEvaluationButton } from "./SiteChrome";
import type { MarketContent } from "./site-data";

const currencyFlags: Record<string, string> = {
  AUD: "au",
  CAD: "ca",
  CHF: "ch",
  EUR: "eu",
  GBP: "gb",
  JPY: "jp",
  MXN: "mx",
  NZD: "nz",
  USD: "us",
};

const cryptoLogoSlugs: Record<string, string> = {
  AAVE: "aave-aave",
  ADA: "cardano-ada",
  ALGO: "algorand-algo",
  ARB: "arbitrum-arb",
  AVAX: "avalanche-avax",
  ASTER: "aster-aster",
  BNB: "bnb-bnb",
  BTC: "bitcoin-btc",
  CRV: "curve-dao-token-crv",
  DOGE: "dogecoin-doge",
  DOT: "polkadot-new-dot",
  ENA: "ethena-ena",
  ETH: "ethereum-eth",
  HYPE: "hyperliquid-hype",
  kPEPE: "pepe-pepe",
  LINK: "chainlink-link",
  LTC: "litecoin-ltc",
  NEAR: "near-protocol-near",
  PUMP: "pump-fun-pump",
  SOL: "solana-sol",
  SUI: "sui-sui",
  TAO: "bittensor-tao",
  TON: "toncoin-ton",
  TRX: "tron-trx",
  UNI: "uniswap-uni",
  WLD: "worldcoin-org-wld",
  XMR: "monero-xmr",
  XRP: "xrp-xrp",
  ZEC: "zcash-zec",
  ZRO: "layerzero-zro",
};

const commodityIcons: Record<string, string> = {
  GOLD: "diamond",
  SILVER: "diamond",
  COPPER: "hardware",
  PLATINUM: "workspace_premium",
  NATGAS: "propane_tank",
  WTIOIL: "oil_barrel",
};

const equityIcons: Record<string, string> = {
  Technology: "memory",
  Financials: "account_balance",
  Consumer: "shopping_bag",
  Communications: "cell_tower",
  Healthcare: "health_and_safety",
  Industrials: "factory",
  Staples: "shopping_cart",
  Energy: "bolt",
  Materials: "category",
  Utilities: "water_drop",
  "Real Estate": "domain",
  "Sector ETFs": "donut_large",
};

function InstrumentMark({ item, market }: { item: string; market: MarketContent }) {
  if (market.slug === "forex") {
    return (
      <span className="instrument-marks forex-marks" aria-hidden="true">
        {item.split("/").map((currency) => (
          <span
            className="instrument-logo"
            key={currency}
            style={{ backgroundImage: `url(https://flagcdn.com/${currencyFlags[currency]}.svg)` }}
          />
        ))}
      </span>
    );
  }

  if (market.slug === "crypto") {
    const slug = cryptoLogoSlugs[item];
    return (
      <span className="instrument-marks crypto-marks" aria-hidden="true">
        <span className="instrument-logo" style={{ backgroundImage: `url(https://cryptologos.cc/logos/${slug}-logo.svg?v=040)` }} />
      </span>
    );
  }

  return (
    <span className="instrument-marks equity-marks" aria-hidden="true">
      <MaterialIcon name={(market.slug === "commodities" ? commodityIcons[item] : equityIcons[item]) ?? "monitoring"} />
    </span>
  );
}

const metricIcons = ["grid_view", "flag", "shield", "schedule"];


const marketIllustrations: Record<string, string> = {
  forex: "/illustrations/forex.png",
  crypto: "/illustrations/crypto.png",
  equities: "/illustrations/equities.png",
  commodities: "/illustrations/commodities.png",
};

function MarketFeatureVisual({ title, body, market }: { title: string; body: string; market: MarketContent }) {
  const copy = `${title} ${body}`.toLowerCase();

  if (
    (market.slug === "equities" && copy.includes("plenty to trade")) ||
    (market.slug === "commodities" && copy.includes("metals and energy"))
  ) {
    return (
      <div className={`route-feature-visual feature-market-cloud feature-market-cloud-${market.slug}`} aria-hidden="true">
        {market.instruments.map((item) => (
          <span className="feature-market-dot" key={item}>
            <MaterialIcon name={(market.slug === "commodities" ? commodityIcons[item] : equityIcons[item]) ?? "monitoring"} />
          </span>
        ))}
      </div>
    );
  }
  if (copy.includes("target") || copy.includes("10%") || copy.includes("8%")) {
    return (
      <div className="route-feature-visual feature-target" aria-hidden="true">
        <svg viewBox="0 0 320 104" role="presentation">
          <line x1="0" y1="78" x2="320" y2="78" />
          <line className="target-line" x1="0" y1="24" x2="320" y2="24" />
          <path d="M0 82 C38 80 52 87 82 68 S130 68 158 54 S204 58 230 42 S278 42 320 13" />
        </svg>
      </div>
    );
  }

  if (copy.includes("deadline") || copy.includes("countdown") || copy.includes("minimum number")) {
    return (
      <div className="route-feature-visual feature-clock" aria-hidden="true">
        <svg viewBox="0 0 320 118" role="presentation">
          <circle cx="160" cy="59" r="45" />
          <line className="clock-hand clock-hour" x1="160" y1="59" x2="160" y2="33" />
          <line className="clock-hand clock-minute" x1="160" y1="59" x2="184" y2="59" />
          <circle className="clock-center" cx="160" cy="59" r="4" />
          <path className="clock-orbit" d="M107 59a53 53 0 1 1 106 0" />
        </svg>
      </div>
    );
  }

  if (copy.includes("week") || copy.includes("open") || copy.includes("overnight") || copy.includes("reward") || copy.includes("seven")) {
    return (
      <div className="route-feature-visual feature-rhythm" aria-hidden="true">
        <div className="feature-day-track">{[1, 2, 3, 4, 5, 6, 7].map((day) => <i key={day} />)}</div>
      </div>
    );
  }

  if (copy.includes("automation") || copy.includes("manual") || copy.includes("bots") || copy.includes("your way") || copy.includes("process") || copy.includes("control")) {
    return (
      <div className="route-feature-visual feature-controls" aria-hidden="true">
        <span><i /></span><span><i /></span><span><i /></span>
      </div>
    );
  }

  return (
    <div className="route-feature-visual feature-freedom" aria-hidden="true">
      <div className="feature-signal"><i /><i /><i /><i /><i /></div>
    </div>
  );
}
export function MarketPage({ market }: { market: MarketContent }) {
  const supportedLabel = market.slug === "forex" ? "Currency pairs" : market.slug === "crypto" ? "Crypto markets" : market.slug === "commodities" ? "Commodities" : "Stocks and ETFs";
  return (
    <PageFrame>
      <section className="route-hero">
        <HeroDotField />
        <div className="route-container route-hero-grid">
          <div><h1>{market.headline}</h1><p>{market.intro}</p><div className="route-actions"><StartEvaluationButton className="route-primary" /><a className="route-secondary" href="/rules">See all rules</a></div></div>
          <div className="market-route-illustration"><Image src={marketIllustrations[market.slug]} alt={`${market.name} market illustration`} width={2500} height={2500} sizes="(max-width: 760px) 90vw, 520px" unoptimized priority /></div>
        </div>
      </section>
      <section className="route-metrics"><div className="route-container"><div><MaterialIcon className="route-metric-icon" name={metricIcons[0]} /><strong>{market.count}</strong><span>{supportedLabel}</span></div><div><MaterialIcon className="route-metric-icon" name={metricIcons[1]} /><strong>{market.target}</strong><span>Performance target</span></div><div><MaterialIcon className="route-metric-icon" name={metricIcons[2]} /><strong>5%</strong><span>Evaluation drawdown</span></div><div><MaterialIcon className="route-metric-icon" name={metricIcons[3]} /><strong>{market.hours}</strong><span>Trading availability</span></div></div></section>
      <section className="route-section"><div className="route-container"><div className="route-section-head"><h2>What matters in {market.name.toLowerCase()}.</h2><p>The target, the hours, and the freedom to trade your own way.</p></div><div className="route-feature-grid">{market.groups.map((group) => <article key={group.title}><MarketFeatureVisual title={group.title} body={group.body} market={market} /><h3>{group.title}</h3><p>{group.body}</p></article>)}</div></div></section>
      <section className="route-section route-section-muted"><div className="route-container"><div className="route-section-head"><h2>Markets available.</h2><p>Choose the instruments you already know.</p></div><div className={`instrument-cloud instrument-cloud-${market.slug}`}>{market.instruments.map(item => <span className="instrument-item" key={item}><InstrumentMark item={item} market={market} /><span className="instrument-label">{item}</span></span>)}</div></div></section>
      <section className="route-section"><div className="route-container"><div className="route-section-head"><h2>Start at the size that suits you.</h2><p>The rules stay the same at every account size.</p></div><PricingGrid compact /></div></section>
    </PageFrame>
  );
}