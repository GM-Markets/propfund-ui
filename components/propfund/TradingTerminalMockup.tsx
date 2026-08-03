"use client";

import Image from "next/image";
import { type CSSProperties, useState } from "react";

type TerminalMarket = "Forex" | "Crypto" | "Equities" | "Commodities";
type OrderSide = "Buy" | "Sell";
type OrderType = "Market" | "Limit";
type BlotterTab = "Positions" | "Orders";

type TerminalInstrument = {
  symbol: string; name: string; price: string; change: string;
  direction: "up" | "down"; bid: string; ask: string; chart: number[];
};

const terminalMarkets: Record<TerminalMarket, TerminalInstrument[]> = {
  Forex: [
    { symbol: "EUR/USD", name: "Euro / US Dollar", price: "1.15784", change: "+0.42%", direction: "up", bid: "1.15779", ask: "1.15789", chart: [20,22,21,28,31,29,38,42,40,47,45,54,58,56,65,68,66,72,69,77] },
    { symbol: "GBP/JPY", name: "Pound / Yen", price: "202.318", change: "+0.18%", direction: "up", bid: "202.300", ask: "202.336", chart: [34,31,36,39,37,43,47,44,51,50,57,54,62,64,67,72,69,75,73,78] },
    { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", price: "1.37204", change: "-0.11%", direction: "down", bid: "1.37198", ask: "1.37210", chart: [68,65,66,60,62,56,52,55,48,46,49,42,39,41,34,31,35,29,32,27] },
    { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", price: "0.64821", change: "+0.09%", direction: "up", bid: "0.64816", ask: "0.64826", chart: [27,29,26,34,31,38,36,43,41,47,45,53,50,57,55,61,59,65,63,69] },
  ],
  Crypto: [
    { symbol: "BTC/USD", name: "Bitcoin", price: "114,840.20", change: "+1.26%", direction: "up", bid: "114,832.10", ask: "114,848.30", chart: [19,24,22,30,28,36,43,40,48,54,52,61,57,68,65,75,72,80,77,84] },
    { symbol: "ETH/USD", name: "Ethereum", price: "3,820.44", change: "+0.72%", direction: "up", bid: "3,818.91", ask: "3,821.97", chart: [28,27,34,32,39,37,46,43,51,49,58,60,57,67,65,71,69,76,73,79] },
    { symbol: "SOL/USD", name: "Solana", price: "171.10", change: "-0.34%", direction: "down", bid: "170.98", ask: "171.22", chart: [68,64,66,61,57,59,51,54,46,44,48,39,42,36,34,30,33,27,29,24] },
    { symbol: "AAVE/USD", name: "Aave", price: "312.62", change: "+0.61%", direction: "up", bid: "312.50", ask: "312.74", chart: [23,26,24,31,29,37,34,42,39,48,45,53,51,59,56,64,62,68,66,72] },
  ],
  Equities: [
    { symbol: "NVDA", name: "NVIDIA", price: "180.52", change: "+1.08%", direction: "up", bid: "180.48", ask: "180.56", chart: [21,19,27,30,28,37,41,39,48,45,53,59,56,64,69,73,70,78,75,82] },
    { symbol: "AAPL", name: "Apple", price: "212.43", change: "+0.31%", direction: "up", bid: "212.39", ask: "212.47", chart: [31,29,34,33,39,42,40,47,45,51,54,52,58,60,63,68,65,71,69,74] },
    { symbol: "MSFT", name: "Microsoft", price: "536.18", change: "-0.14%", direction: "down", bid: "536.10", ask: "536.26", chart: [66,68,63,61,64,57,59,53,50,52,46,44,47,39,37,34,38,31,33,28] },
    { symbol: "AMZN", name: "Amazon", price: "226.13", change: "+0.47%", direction: "up", bid: "226.08", ask: "226.18", chart: [25,23,30,28,35,33,41,38,47,44,52,50,58,55,64,62,69,67,74,72] },
  ],
  Commodities: [
    { symbol: "GOLD", name: "Gold", price: "3,322.50", change: "+0.58%", direction: "up", bid: "3,321.90", ask: "3,323.10", chart: [23,26,24,32,35,33,42,39,49,46,55,59,57,65,62,71,68,76,73,81] },
    { symbol: "SILVER", name: "Silver", price: "36.70", change: "+0.22%", direction: "up", bid: "36.66", ask: "36.74", chart: [29,27,33,36,34,41,39,46,44,52,49,58,55,63,61,68,66,72,70,75] },
    { symbol: "WTIOIL", name: "WTI Crude Oil", price: "66.82", change: "-0.47%", direction: "down", bid: "66.78", ask: "66.86", chart: [72,68,70,63,65,58,61,54,51,53,47,49,41,38,40,33,36,30,32,27] },
    { symbol: "COPPER", name: "Copper", price: "5.58", change: "+0.36%", direction: "up", bid: "5.56", ask: "5.60", chart: [24,22,29,27,34,32,40,37,45,43,51,48,56,54,62,59,67,64,71,69] },
  ],
};

const terminalMarks: Record<string, Array<{ src?: string; label: string }>> = {
  "EUR/USD": [{ src: "/markets/eu.svg", label: "EU" }, { src: "/markets/us.svg", label: "US" }],
  "GBP/JPY": [{ src: "/markets/gb.svg", label: "GB" }, { src: "/markets/jp.svg", label: "JP" }],
  "USD/CAD": [{ src: "/markets/us.svg", label: "US" }, { src: "/markets/ca.svg", label: "CA" }],
  "AUD/USD": [{ src: "/markets/au.svg", label: "AU" }, { src: "/markets/us.svg", label: "US" }],
  "BTC/USD": [{ src: "/markets/bitcoin.svg", label: "BTC" }],
  "ETH/USD": [{ src: "/markets/ethereum.svg", label: "ETH" }],
  "SOL/USD": [{ src: "/markets/solana.svg", label: "SOL" }],
  "AAVE/USD": [{ label: "A" }],
  NVDA: [{ src: "/markets/nvidia.svg", label: "NV" }],
  AAPL: [{ src: "/markets/apple.svg", label: "AP" }],
  MSFT: [{ label: "MS" }], AMZN: [{ label: "AM" }],
  GOLD: [{ label: "Au" }], SILVER: [{ label: "Ag" }],
  WTIOIL: [{ label: "WTI" }], COPPER: [{ label: "Cu" }],
};

const leverageOptions = ["1x", "2x", "5x", "10x"];
const timeframeOptions = ["1m", "5m", "15m", "1H", "4H", "1D"];

type Candle = {
  x: number; openY: number; closeY: number; highY: number; lowY: number;
  bodyY: number; bodyHeight: number; volumeHeight: number; up: boolean; closeValue: number;
};

function seededRandom(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}
function parsePrice(value: string) { return Number(value.replaceAll(",", "")); }
function priceDecimals(value: string) {
  const decimal = value.split(".")[1]?.length ?? 0;
  return Math.min(decimal, parsePrice(value) < 10 ? 5 : 2);
}
function formatPrice(value: number, source: string) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: priceDecimals(source),
    maximumFractionDigits: priceDecimals(source),
  });
}

function buildCandles(instrument: TerminalInstrument, timeframeIndex: number) {
  const count = 42;
  const finalPrice = parsePrice(instrument.price);
  const direction = instrument.direction === "up" ? 1 : -1;
  const startPrice = finalPrice * (1 - direction * (0.0055 + timeframeIndex * 0.00055));
  const travel = finalPrice - startPrice;
  const noiseUnit = finalPrice * (finalPrice < 2 ? 0.00042 : finalPrice > 10000 ? 0.0019 : 0.00125);
  const values: number[] = [];

  for (let index = 0; index < count; index += 1) {
    const progress = index / (count - 1);
    const eased = progress * progress * (3 - 2 * progress);
    const mapped = instrument.chart[Math.round(progress * (instrument.chart.length - 1))];
    const mappedCenter = (mapped - 50) / 50;
    const wave = Math.sin(index * 0.82 + timeframeIndex * 0.6) * noiseUnit * 0.55;
    const micro = (seededRandom(index + timeframeIndex * 97 + instrument.symbol.length * 13) - 0.5) * noiseUnit * 0.9;
    values.push(startPrice + travel * eased + mappedCenter * noiseUnit * 0.7 + wave + micro);
  }
  values[count - 1] = finalPrice;

  const raw = values.flatMap((close, index) => {
    const open = index === 0 ? close - direction * noiseUnit * 0.3 : values[index - 1];
    const wick = noiseUnit * (0.55 + seededRandom(index * 4 + 9) * 1.2);
    return [open, close, Math.max(open, close) + wick, Math.min(open, close) - wick * 0.82];
  });
  const minimum = Math.min(...raw);
  const maximum = Math.max(...raw);
  const span = maximum - minimum || 1;
  const round = (value: number) => Number(value.toFixed(3));
  const scaleY = (value: number) => round(294 - ((value - minimum) / span) * 264);
  const step = 900 / count;
  const bodyWidth = Math.max(4, Math.min(11, step * 0.52));

  const candles: Candle[] = values.map((close, index) => {
    const open = index === 0 ? close - direction * noiseUnit * 0.3 : values[index - 1];
    const wick = noiseUnit * (0.55 + seededRandom(index * 4 + 9) * 1.2);
    const high = Math.max(open, close) + wick;
    const low = Math.min(open, close) - wick * 0.82;
    const openY = scaleY(open);
    const closeY = scaleY(close);
    return {
      x: round(step * index + step / 2), openY, closeY, highY: scaleY(high), lowY: scaleY(low),
      bodyY: round(Math.min(openY, closeY)), bodyHeight: round(Math.max(2.6, Math.abs(closeY - openY))),
      volumeHeight: round(7 + seededRandom(index * 6 + timeframeIndex) * 35),
      up: close >= open, closeValue: close,
    };
  });

  const smaPoints = candles.map((candle, index) => {
    const slice = values.slice(Math.max(0, index - 7), index + 1);
    const average = slice.reduce((total, value) => total + value, 0) / slice.length;
    return `${candle.x},${scaleY(average)}`;
  }).join(" ");
  const priceAxis = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    return { y: 30 + ratio * 264, label: formatPrice(maximum - span * ratio, instrument.price) };
  });
  return { candles, bodyWidth, currentY: scaleY(values.at(-1) ?? finalPrice), smaPoints, priceAxis };
}

function MarketMarks({ symbol }: { symbol: string }) {
  const marks = terminalMarks[symbol] ?? [{ label: symbol.slice(0, 2) }];
  return (
    <span className="terminal-market-marks" aria-hidden="true" data-count={marks.length}>
      {marks.map((mark, index) => (
        <span className="terminal-market-mark" key={`${mark.label}-${index}`}>
          {mark.src ? <Image alt="" src={mark.src} width={28} height={28} unoptimized /> : <i>{mark.label}</i>}
        </span>
      ))}
    </span>
  );
}

export function TradingTerminalMockup() {
  const [market, setMarket] = useState<TerminalMarket>("Forex");
  const [instrumentIndex, setInstrumentIndex] = useState(0);
  const [side, setSide] = useState<OrderSide>("Buy");
  const [orderType, setOrderType] = useState<OrderType>("Market");
  const [leverage, setLeverage] = useState("5x");
  const [timeframe, setTimeframe] = useState("1H");
  const [orderState, setOrderState] = useState<"ready" | "filled">("ready");
  const [blotterTab, setBlotterTab] = useState<BlotterTab>("Positions");
  const [hasStop, setHasStop] = useState(true);
  const [hasTarget, setHasTarget] = useState(false);
  const [orderSize, setOrderSize] = useState(0.25);
  const [riskPercent, setRiskPercent] = useState(0.75);
  const [stopPercent, setStopPercent] = useState(5);
  const [targetPercent, setTargetPercent] = useState(8);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const instrument = terminalMarkets[market][instrumentIndex];
  const timeframeIndex = timeframeOptions.indexOf(timeframe);
  const { candles, bodyWidth, currentY, smaPoints, priceAxis } = buildCandles(instrument, timeframeIndex);
  const hoverCandle = hoverIndex === null ? null : candles[hoverIndex];
  const leverageNumber = Number(leverage.replace("x", ""));
  const estimatedMargin = orderSize * 2150 / leverageNumber;
  const riskAllocation = 25000 * riskPercent / 100;  const terminalPrice = parsePrice(instrument.price);
  const bookStep = terminalPrice * (terminalPrice > 10000 ? 0.00008 : terminalPrice > 100 ? 0.00018 : 0.000035);
  const askLevels = Array.from({ length: 7 }, (_, index) => ({
    price: formatPrice(terminalPrice + bookStep * (7 - index), instrument.price),
    size: (0.18 + seededRandom(index + instrument.symbol.length) * 4.8).toFixed(3),
    depth: 28 + seededRandom(index + 41) * 66,
  }));
  const bidLevels = Array.from({ length: 7 }, (_, index) => ({
    price: formatPrice(terminalPrice - bookStep * (index + 1), instrument.price),
    size: (0.18 + seededRandom(index + instrument.symbol.length + 80) * 4.8).toFixed(3),
    depth: 28 + seededRandom(index + 121) * 66,
  }));

  function resetOrder() { setOrderState("ready"); setBlotterTab("Positions"); }
  function changeMarket(nextMarket: TerminalMarket) {
    setMarket(nextMarket); setInstrumentIndex(0); setHoverIndex(null); resetOrder();
  }
  function rangeStyle(progress: number) {
    return { "--range-progress": `${Math.max(0, Math.min(100, progress))}%` } as CSSProperties;
  }

  return (
    <div className="trading-terminal trading-terminal-pro" aria-label="Interactive simulated trading terminal">
      <div className="trading-terminal-head">
        <div className="terminal-brand"><span className="terminal-brand-mark" aria-hidden="true">✦</span><strong>Propfund</strong><span>Trade</span></div>
        <div className="terminal-account-metrics" aria-label="Simulated account metrics">
          <span><small>Balance</small><strong>$25,000.00</strong></span>
          <span><small>Equity</small><strong>$25,118.40</strong></span>
          <span><small>Daily P&amp;L</small><strong className="up">+$118.40</strong></span>
          <span><small>Drawdown used</small><strong>0.47%</strong></span>
        </div>
        <span className="trading-terminal-status">Simulated</span>
      </div>

      <div className="terminal-challenge-strip" aria-label="Evaluation progress">
        <span className="terminal-challenge-name"><i /> Evaluation 0248</span>
        <span>Phase <strong>1</strong></span>
        <span>Profit target <strong className="up">6.4% / 8%</strong></span>
        <span>Drawdown used <strong>0.47% / 5%</strong></span>
        <span>To target <strong className="up">$400.00</strong></span>
        <button type="button">Rules</button>
      </div>

      <div className="trading-terminal-tabs" aria-label="Market type">
        {(Object.keys(terminalMarkets) as TerminalMarket[]).map((item) => (
          <button className={market === item ? "active" : ""} key={item} onClick={() => changeMarket(item)} type="button">{item}</button>
        ))}
        <span className="terminal-session"><i /> Market open</span>
      </div>

      <div className="trading-terminal-grid">
        <aside className="terminal-watchlist" aria-label={`${market} instruments`}>
          <div className="terminal-watchlist-head"><span>Watchlist</span><small>{market}</small></div>
          <label className="terminal-search"><span aria-hidden="true">⌕</span><input aria-label="Search watchlist" placeholder="Search markets" /></label>
          {terminalMarkets[market].map((item, index) => (
            <button className={instrumentIndex === index ? "active" : ""} key={item.symbol} onClick={() => { setInstrumentIndex(index); setHoverIndex(null); resetOrder(); }} type="button">
              <MarketMarks symbol={item.symbol} />
              <span><strong>{item.symbol}</strong><small>{item.name}</small></span>
              <span><strong>{item.price}</strong><small className={item.direction}>{item.change}</small></span>
            </button>
          ))}
          <div className="terminal-watchlist-foot"><span>Spread</span><strong>0.8</strong><small>Normal</small></div>
        </aside>

        <div className="terminal-center">
          <section className="terminal-chart" aria-label={`${instrument.symbol} simulated price chart`}>
            <div className="terminal-chart-head">
              <div className="terminal-chart-identity"><MarketMarks symbol={instrument.symbol} /><span><small>{instrument.name}</small><strong>{instrument.symbol}</strong></span></div>
              <div><strong>{hoverCandle ? formatPrice(hoverCandle.closeValue, instrument.price) : instrument.price}</strong><span className={instrument.direction}>{instrument.change}</span></div>
            </div>
            <div className="terminal-chart-tools" aria-label="Chart timeframe">
              {timeframeOptions.map((item) => <button className={timeframe === item ? "active" : ""} key={item} onClick={() => { setTimeframe(item); setHoverIndex(null); }} type="button">{item}</button>)}
              <span /><button type="button">SMA 20</button><button type="button">Candles</button>
            </div>
            <svg
              onMouseLeave={() => setHoverIndex(null)}
              onMouseMove={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                const relative = (event.clientX - bounds.left) / bounds.width;
                setHoverIndex(Math.max(0, Math.min(candles.length - 1, Math.floor(relative * candles.length))));
              }}
              viewBox="0 0 960 360" role="img" aria-label={`${instrument.symbol} simulated candlestick chart`}
            >
              <rect className="terminal-session-shade" height="304" width="170" x="492" y="0" />
              {[30,96,162,228,294].map((y) => <line className="terminal-grid-line" key={`h-${y}`} x1="0" x2="914" y1={y} y2={y} />)}
              {[120,240,360,480,600,720,840].map((x) => <line className="terminal-grid-line" key={`v-${x}`} x1={x} x2={x} y1="0" y2="304" />)}
              <polyline className="terminal-sma-line" points={smaPoints} />
              <g key={`${instrument.symbol}-${timeframe}`} className="terminal-candles">
                {candles.map((candle, index) => (
                  <g className={candle.up ? "up" : "down"} key={index} style={{ "--candle-index": index } as CSSProperties}>
                    <line className="terminal-candle-wick" x1={candle.x} x2={candle.x} y1={candle.highY} y2={candle.lowY} />
                    <rect className="terminal-candle-body" height={candle.bodyHeight} width={bodyWidth} x={candle.x - bodyWidth / 2} y={candle.bodyY} />
                    <rect className="terminal-volume-bar" height={candle.volumeHeight} width={bodyWidth} x={candle.x - bodyWidth / 2} y={356 - candle.volumeHeight} />
                  </g>
                ))}
              </g>
              {priceAxis.map((item) => <text className="terminal-axis-price" key={item.y} x="952" y={item.y + 3} textAnchor="end">{item.label}</text>)}
              <line className="terminal-current-line" x1="0" x2="914" y1={currentY} y2={currentY} />
              <circle className="terminal-current-dot" cx="900" cy={currentY} r="3.5" />
              {hoverCandle && <g className="terminal-crosshair">
                <line x1={hoverCandle.x} x2={hoverCandle.x} y1="0" y2="304" />
                <line x1="0" x2="914" y1={hoverCandle.closeY} y2={hoverCandle.closeY} />
                <circle cx={hoverCandle.x} cy={hoverCandle.closeY} r="4" />
              </g>}
              <text className="terminal-current-price" x="910" y={Math.max(14, currentY - 7)} textAnchor="end">{instrument.price}</text>
            </svg>
            <div className="terminal-chart-foot"><span>Simulated market stream</span><span>SMA</span><strong>20</strong><span>Bid / ask</span><strong>{instrument.bid} / {instrument.ask}</strong></div>
          </section>

          <section className="terminal-blotter" aria-label="Positions and orders">
            <div className="terminal-blotter-tabs">
              {(["Positions","Orders"] as const).map((item) => <button className={blotterTab === item ? "active" : ""} key={item} onClick={() => setBlotterTab(item)} type="button">{item}{item === "Positions" && orderState === "filled" ? " 1" : ""}</button>)}
              <span>Simulated account</span>
            </div>
            <div className="terminal-position-head"><span>Market</span><span>Side</span><span>Size</span><span>Entry</span><span>Leverage</span><span>P&amp;L</span><span /></div>
            {orderState === "filled" ? <div className="terminal-position-row">
              <strong>{instrument.symbol}</strong><span className={side === "Buy" ? "up" : "down"}>{side}</span><span>{orderSize.toFixed(2)}</span><span>{side === "Buy" ? instrument.ask : instrument.bid}</span><span>{leverage}</span><strong className="up">+$42.80</strong><button onClick={() => setOrderState("ready")} type="button">Close</button>
            </div> : <div className="terminal-position-empty"><strong>No open positions</strong><span>Your simulated trades will appear here.</span></div>}
          </section>
        </div>

        <aside className="terminal-orderbook" aria-label={`${instrument.symbol} simulated order book`}>
          <div className="terminal-orderbook-tabs"><button className="active" type="button">Order book</button><button type="button">Trades</button></div>
          <div className="terminal-orderbook-head"><span>Price</span><span>Size</span></div>
          <div className="terminal-orderbook-levels asks">
            {askLevels.map((level) => (
              <div key={level.price} style={{ "--book-depth": `${level.depth}%` } as CSSProperties}><strong>{level.price}</strong><span>{level.size}</span></div>
            ))}
          </div>
          <div className="terminal-orderbook-spread"><span>Spread</span><strong>{instrument.direction === "up" ? "+0.08%" : "−0.08%"}</strong></div>
          <div className="terminal-orderbook-levels bids">
            {bidLevels.map((level) => (
              <div key={level.price} style={{ "--book-depth": `${level.depth}%` } as CSSProperties}><strong>{level.price}</strong><span>{level.size}</span></div>
            ))}
          </div>
          <div className="terminal-orderbook-foot"><span>24h volume</span><strong>{market === "Crypto" ? "$2.16B" : "$418.2M"}</strong></div>
        </aside>
        <aside className="terminal-order" aria-label="Simulated order ticket">
          <div className="terminal-order-head"><span>Order ticket</span><strong>{instrument.symbol}</strong></div>
          <div className="terminal-order-type" aria-label="Order type">
            {(["Market","Limit"] as const).map((item) => <button className={orderType === item ? "active" : ""} key={item} onClick={() => { setOrderType(item); resetOrder(); }} type="button">{item}</button>)}
          </div>
          <div className="terminal-side" aria-label="Order side">
            {(["Buy","Sell"] as const).map((item) => <button className={side === item ? "active" : ""} key={item} onClick={() => { setSide(item); resetOrder(); }} type="button">{item}</button>)}
          </div>
          <dl className="terminal-quote"><div><dt>Bid</dt><dd>{instrument.bid}</dd></div><div><dt>Ask</dt><dd>{instrument.ask}</dd></div></dl>
          {orderType === "Limit" && <label className="terminal-field"><span>Limit price</span><input aria-label="Limit price" defaultValue={instrument.bid} inputMode="decimal" /></label>}

          <label className="terminal-slider-field">
            <span>Order size <output>{orderSize.toFixed(2)} lots</output></span>
            <input aria-label="Order size" max="1" min="0.05" onInput={(event) => { setOrderSize(Number(event.currentTarget.value)); resetOrder(); }} step="0.05" style={rangeStyle(((orderSize - 0.05) / 0.95) * 100)} type="range" value={orderSize} />
            <small><span>0.05</span><span>1.00</span></small>
          </label>

          <div className="terminal-leverage"><span>Leverage</span><div>
            {leverageOptions.map((item) => <button className={leverage === item ? "active" : ""} key={item} onClick={() => { setLeverage(item); resetOrder(); }} type="button">{item}</button>)}
          </div></div>

          <label className="terminal-slider-field terminal-risk-slider">
            <span>Risk per trade <output>{riskPercent.toFixed(2)}%</output></span>
            <input aria-label="Risk per trade" max="2" min="0.25" onInput={(event) => { setRiskPercent(Number(event.currentTarget.value)); resetOrder(); }} step="0.25" style={rangeStyle(((riskPercent - 0.25) / 1.75) * 100)} type="range" value={riskPercent} />
            <small><span>0.25%</span><span>2.00%</span></small>
          </label>

          <div className="terminal-risk-controls">
            <label>
              <input checked={hasStop} onChange={(event) => setHasStop(event.target.checked)} type="checkbox" /><span>Stop loss</span>
              <input aria-label="Stop loss percentage" disabled={!hasStop} max="8" min="1" onInput={(event) => { setStopPercent(Number(event.currentTarget.value)); resetOrder(); }} step="1" style={rangeStyle(((stopPercent - 1) / 7) * 100)} type="range" value={stopPercent} />
              <strong>{hasStop ? `${stopPercent}%` : "Off"}</strong>
            </label>
            <label>
              <input checked={hasTarget} onChange={(event) => setHasTarget(event.target.checked)} type="checkbox" /><span>Take profit</span>
              <input aria-label="Take profit percentage" disabled={!hasTarget} max="16" min="2" onInput={(event) => { setTargetPercent(Number(event.currentTarget.value)); resetOrder(); }} step="1" style={rangeStyle(((targetPercent - 2) / 14) * 100)} type="range" value={targetPercent} />
              <strong>{hasTarget ? `${targetPercent}%` : "Off"}</strong>
            </label>
          </div>

          <dl className="terminal-order-summary">
            <div><dt>Estimated margin</dt><dd>${estimatedMargin.toFixed(2)}</dd></div>
            <div><dt>Risk allocation</dt><dd>${riskAllocation.toFixed(2)}</dd></div>
          </dl>
          <button className={`terminal-submit ${orderState}`} onClick={() => { setOrderState("filled"); setBlotterTab("Positions"); }} type="button">
            {orderState === "filled" ? "Position opened" : `${side} ${instrument.symbol}`}
          </button>
          <p className="terminal-order-note">Orders and prices are simulated for this preview.</p>
        </aside>
      </div>
    </div>
  );
}
