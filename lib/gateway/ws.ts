export function isGatewayWsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return process.env.NEXT_PUBLIC_GATEWAY_WS_ENABLED !== "false";
}

export function buildGatewayWsUrl(): string {
  const http = (process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:6701").replace(/\/$/, "");
  const wsOrigin = http.startsWith("https://")
    ? `wss://${http.slice("https://".length)}`
    : http.startsWith("http://")
      ? `ws://${http.slice("http://".length)}`
      : http;
  return `${wsOrigin}/api/ws`;
}

export function buildGatewayWsAuthUrl(): string {
  return "/api/gateway/ws-auth";
}
