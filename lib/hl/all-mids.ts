import { parseHypMids, type HypMids } from "@/lib/hyp/mids";

const DEFAULT_WS = "wss://api.hyperliquid.xyz/ws";
const PING_MS = 20_000;
const RECONNECT_MS = 1_500;

export function hyperliquidWsUrl(): string {
  return process.env.NEXT_PUBLIC_HYPERLIQUID_WS_URL?.trim() || DEFAULT_WS;
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
