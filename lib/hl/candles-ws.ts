import { hyperliquidWsUrl } from "@/lib/hl/all-mids";
import { parseHlCandles, type HlCandle, type HlCandleInterval } from "@/lib/hl/info";

const PING_MS = 20_000;
const RECONNECT_MS = 1_500;

function parseWsCandle(raw: unknown): HlCandle | null {
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as { channel?: unknown; data?: unknown };
  if (payload.channel !== "candle") return null;
  const rows = parseHlCandles([payload.data]);
  return rows[0] ?? null;
}

/** Live Hyperliquid candle stream for one coin + interval. */
export function subscribeHlCandle(
  coin: string,
  interval: HlCandleInterval,
  onCandle: (candle: HlCandle) => void,
): () => void {
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
      socket?.send(
        JSON.stringify({
          method: "subscribe",
          subscription: { type: "candle", coin, interval },
        }),
      );
      if (ping) clearInterval(ping);
      ping = setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ method: "ping" }));
        }
      }, PING_MS);
    });
    socket.addEventListener("message", (event) => {
      const candle = parseWsCandle(event.data);
      if (candle) onCandle(candle);
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
