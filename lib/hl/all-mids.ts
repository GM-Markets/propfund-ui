import { parseHypMids, type HypMids } from "@/lib/hyp/mids";

const DEFAULT_WS = "wss://api.hyperliquid.xyz/ws";
const DEFAULT_INFO = "https://api.hyperliquid.xyz/info";
const PING_MS = 20_000;
const RECONNECT_MS = 1_500;

export function hyperliquidWsUrl(): string {
  return process.env.NEXT_PUBLIC_HYPERLIQUID_WS_URL?.trim() || DEFAULT_WS;
}

export function hyperliquidInfoUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_HYPERLIQUID_INFO_URL?.trim();
  if (explicit) return explicit;
  const ws = hyperliquidWsUrl();
  if (ws.startsWith("wss://")) return `${ws.replace(/^wss:\/\//, "https://").replace(/\/ws\/?$/, "")}/info`;
  if (ws.startsWith("ws://")) return `${ws.replace(/^ws:\/\//, "http://").replace(/\/ws\/?$/, "")}/info`;
  return DEFAULT_INFO;
}

/** Latest Hyperliquid mids (REST). Used as a 2s UI pulse when the socket is quiet. */
export async function fetchHlAllMids(): Promise<HypMids | null> {
  const response = await fetch(hyperliquidInfoUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "allMids" }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return null;
  return parseHypMids(await response.json());
}

/**
 * One browser socket to Hyperliquid `allMids`. Desk marks must not wait on Flo `/hyp`.
 */
export function subscribeHlAllMids(onMids: (mids: HypMids) => void): () => void {
  if (typeof window === "undefined") return () => {};

  let stopped = false;
  let socket: WebSocket | null = null;
  let ping: ReturnType<typeof setInterval> | null = null;
  let reconnect: ReturnType<typeof setTimeout> | null = null;

  const clearTimers = () => {
    if (ping) clearInterval(ping);
    if (reconnect) clearTimeout(reconnect);
    ping = null;
    reconnect = null;
  };

  const connect = () => {
    if (stopped) return;
    socket = new WebSocket(hyperliquidWsUrl());
    socket.addEventListener("open", () => {
      socket?.send(JSON.stringify({ method: "subscribe", subscription: { type: "allMids" } }));
      if (ping) clearInterval(ping);
      ping = setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ method: "ping" }));
        }
      }, PING_MS);
    });
    socket.addEventListener("message", (event) => {
      const mids = parseHypMids(event.data);
      if (mids) onMids(mids);
    });
    socket.addEventListener("close", () => {
      clearTimers();
      if (stopped || reconnect) return;
      reconnect = setTimeout(() => {
        reconnect = null;
        connect();
      }, RECONNECT_MS);
    });
  };

  connect();
  return () => {
    stopped = true;
    clearTimers();
    socket?.close();
    socket = null;
  };
}
