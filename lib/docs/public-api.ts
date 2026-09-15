/** Public Flo gateway traders and bots call. */
export const PUBLIC_GATEWAY_ORIGIN = "https://gate.propfund.io";

/** Vanta desk API prefix on the public gateway. */
export const PUBLIC_VAN_BASE = `${PUBLIC_GATEWAY_ORIGIN}/van`;

export const DESK_API_KEY_PLACEHOLDER = "<key_id>.<key_secret>";

export function docsVanUrl(path: string): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${PUBLIC_VAN_BASE}${suffix}`;
}

/** Routes that accept a minted desk `X-Api-Key` on the public gateway. */
export const DESK_API_KEY_ROUTES = [
  { method: "POST", path: "/v2/trading/orders", summary: "Submit a perp or USDC spot order." },
  { method: "POST", path: "/v2/trading/close", summary: "Market-close one open position." },
  { method: "GET", path: "/v2/trading/positions", summary: "Open positions on the desk." },
  { method: "GET", path: "/v2/trading/balance", summary: "Cash, equity, margin, and rules." },
  { method: "GET", path: "/v2/trading/history", summary: "Closed positions." },
  { method: "GET", path: "/v2/trading/desk-poll", summary: "Positions, resting orders, history, and balance." },
  { method: "POST", path: "/v2/copy-trade/subscriptions", summary: "Start copying a Hyperliquid address." },
  { method: "GET", path: "/v2/copy-trade/subscriptions", summary: "List copy-trade subscriptions." },
  { method: "POST", path: "/v2/copy-trade/subscriptions/{id}", summary: "Pause, resume, or stop a subscription." },
  { method: "GET", path: "/v2/copy-trade/subscriptions/{id}/fills", summary: "Copied, skipped, and failed fills." },
] as const;
