/**
 * The 12 simulated markets (PRD §12) with reference prices and tick sizes.
 */
import type { Market } from "@/lib/propfund/types";

export const MARKETS: readonly Market[] = [
  { symbol: "BTC", displayName: "BTC/USD", name: "Bitcoin", assetClass: "crypto", tickSize: 0.1, quote: "USD", referencePrice: 97_850 },
  { symbol: "ETH", displayName: "ETH/USD", name: "Ether", assetClass: "crypto", tickSize: 0.01, quote: "USD", referencePrice: 3_420 },
  { symbol: "SOL", displayName: "SOL/USD", name: "Solana", assetClass: "crypto", tickSize: 0.01, quote: "USD", referencePrice: 184.5 },
  { symbol: "XRP", displayName: "XRP/USD", name: "XRP", assetClass: "crypto", tickSize: 0.0001, quote: "USD", referencePrice: 2.4515 },
  { symbol: "EURUSD", displayName: "EUR/USD", name: "Euro / US Dollar", assetClass: "forex", tickSize: 0.00001, quote: "USD", referencePrice: 1.16542 },
  { symbol: "GBPUSD", displayName: "GBP/USD", name: "British Pound / US Dollar", assetClass: "forex", tickSize: 0.00001, quote: "USD", referencePrice: 1.35218 },
  { symbol: "USDJPY", displayName: "USD/JPY", name: "US Dollar / Japanese Yen", assetClass: "forex", tickSize: 0.001, quote: "JPY", referencePrice: 147.315 },
  { symbol: "XAUUSD", displayName: "XAU/USD", name: "Gold", assetClass: "commodities", tickSize: 0.01, quote: "USD", referencePrice: 3_648.2 },
  { symbol: "WTI", displayName: "WTI", name: "WTI Crude Oil", assetClass: "commodities", tickSize: 0.01, quote: "USD", referencePrice: 63.84 },
  { symbol: "NVDA", displayName: "NVDA", name: "NVIDIA", assetClass: "equities", tickSize: 0.01, quote: "USD", referencePrice: 177.42 },
  { symbol: "AAPL", displayName: "AAPL", name: "Apple", assetClass: "equities", tickSize: 0.01, quote: "USD", referencePrice: 234.07 },
  { symbol: "TSLA", displayName: "TSLA", name: "Tesla", assetClass: "equities", tickSize: 0.01, quote: "USD", referencePrice: 395.94 },
];

export const DEFAULT_SYMBOL = "BTC";

export function getMarket(symbol: string): Market | undefined {
  return MARKETS.find((m) => m.symbol === symbol);
}

export function roundToTick(price: number, tickSize: number): number {
  const decimals = tickSize >= 1 ? 0 : Math.round(-Math.log10(tickSize));
  return Number((Math.round(price / tickSize) * tickSize).toFixed(decimals));
}
