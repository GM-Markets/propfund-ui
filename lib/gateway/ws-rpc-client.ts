import { buildGatewayWsAuthUrl, buildGatewayWsUrl, isGatewayWsEnabled } from "@/lib/gateway/ws";

type Pending = {
  resolve: (data: unknown) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const CONNECT_TIMEOUT_MS = 12_000;
const AUTH_TIMEOUT_MS = 12_000;
const RECONNECT_MIN_MS = 1_000;
const RECONNECT_MAX_MS = 20_000;

type ChannelListener = (payload: unknown) => void;

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/**
 * One gateway WebSocket for public streams.
 * HMAC unlock goes through `/api/gateway/ws-auth` — secret stays server-side.
 */
class GatewayWsRpcClient {
  private ws: WebSocket | null = null;
  private ready: Promise<void> | null = null;
  private readyResolve: (() => void) | null = null;
  private readyReject: ((err: Error) => void) | null = null;
  private pending = new Map<string, Pending>();
  private nextId = 1;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  private authTimer: ReturnType<typeof setTimeout> | null = null;
  private authenticated = false;
  private channels = new Map<string, Set<ChannelListener>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelayMs = RECONNECT_MIN_MS;

  subscribe(channel: string, listener: ChannelListener): () => void {
    if (!isGatewayWsEnabled()) return () => {};

    const listeners = this.channels.get(channel) ?? new Set<ChannelListener>();
    listeners.add(listener);
    this.channels.set(channel, listeners);
    void this.openChannel(channel);

    return () => {
      const current = this.channels.get(channel);
      if (!current) return;
      current.delete(listener);
      if (current.size > 0) return;
      this.channels.delete(channel);
      try {
        this.send({ method: "unsubscribe", params: { path: channel } });
      } catch {
        // Socket already gone; the gateway drops the subscription on close.
      }
      if (this.channels.size === 0) this.clearReconnect();
    };
  }

  private async openChannel(channel: string): Promise<void> {
    try {
      await this.ensureReady();
    } catch {
      this.scheduleReconnect();
      return;
    }
    if (!this.channels.has(channel)) return;
    try {
      this.send({ method: "subscribe", params: { path: channel } });
    } catch {
      this.scheduleReconnect();
    }
  }

  private resubscribeAll(): void {
    for (const channel of this.channels.keys()) {
      try {
        this.send({ method: "subscribe", params: { path: channel } });
      } catch {
        this.scheduleReconnect();
        return;
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.channels.size === 0 || this.reconnectTimer) return;
    const delay = this.reconnectDelayMs;
    this.reconnectDelayMs = Math.min(delay * 2, RECONNECT_MAX_MS);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.channels.size === 0) return;
      void this.ensureReady().catch(() => this.scheduleReconnect());
    }, delay);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.reconnectDelayMs = RECONNECT_MIN_MS;
  }

  private dispatchChannel(data: Record<string, unknown>): boolean {
    if (data.event !== "message" || typeof data.channel !== "string") return false;
    const listeners = this.channels.get(data.channel);
    if (listeners) {
      for (const listener of listeners) listener(data.payload);
    }
    return true;
  }

  private ensureReady(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN && this.authenticated && this.ready) {
      return this.ready;
    }
    if (this.ready && this.ws && this.ws.readyState <= WebSocket.OPEN) {
      return this.ready;
    }
    this.startConnect();
    return this.ready!;
  }

  private startConnect(): void {
    this.resetSocket();
    this.ready = new Promise<void>((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    this.authenticated = false;

    let ws: WebSocket;
    try {
      ws = new WebSocket(buildGatewayWsUrl());
    } catch (err) {
      this.failReady(err instanceof Error ? err : new Error(String(err)));
      return;
    }
    this.ws = ws;

    this.connectTimer = setTimeout(() => {
      this.failReady(new Error("gateway WS connect timeout"));
      ws.close();
    }, CONNECT_TIMEOUT_MS);

    ws.onmessage = (ev) => {
      void this.onMessage(ev.data);
    };

    ws.onerror = () => {
      if (!this.authenticated) this.failReady(new Error("gateway WS connection error"));
    };

    ws.onclose = () => {
      this.rejectAllPending(new Error("gateway WS closed"));
      if (!this.authenticated) this.failReady(new Error("gateway WS closed before ready"));
      this.ws = null;
      this.ready = null;
      this.authenticated = false;
      this.clearTimers();
      this.scheduleReconnect();
    };
  }

  private async onMessage(raw: unknown): Promise<void> {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : String(raw)) as Record<string, unknown>;
    } catch {
      return;
    }

    const id = msg.id != null ? String(msg.id) : "";
    if (id && this.pending.has(id)) {
      const pending = this.pending.get(id)!;
      this.pending.delete(id);
      clearTimeout(pending.timer);
      if (msg.success === true) pending.resolve(msg.data);
      else pending.reject(new Error("gateway WS request failed"));
      return;
    }

    const data = asRecord(msg.data);
    if (msg.success !== true || !data) return;
    if (this.dispatchChannel(data)) return;
    if (data.event === "connected") await this.handleConnected(data);
  }

  private async handleConnected(data: Record<string, unknown>): Promise<void> {
    if (data.authRequired !== true) {
      this.markReady();
      return;
    }

    const challenge = asRecord(data.challenge);
    const nonce = typeof challenge?.nonce === "string" ? challenge.nonce : "";
    const ts = typeof challenge?.ts === "number" ? challenge.ts : Number(challenge?.ts);
    if (!nonce || !Number.isFinite(ts)) {
      this.failReady(new Error("gateway WS challenge missing"));
      return;
    }

    this.authTimer = setTimeout(() => {
      this.failReady(new Error("gateway WS auth timeout"));
      this.ws?.close();
    }, AUTH_TIMEOUT_MS);

    try {
      const mac = await this.fetchMac(nonce, ts);
      const id = String(this.nextId++);
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error("gateway WS auth response timeout"));
        }, AUTH_TIMEOUT_MS);
        this.pending.set(id, {
          resolve: (payload) => {
            const d = asRecord(payload);
            if (d?.event === "authenticated") resolve();
            else reject(new Error("gateway WS auth rejected"));
          },
          reject,
          timer,
        });
        this.send({ id, method: "auth", params: { nonce, ts, mac } });
      });
      this.markReady();
    } catch (err) {
      this.failReady(err instanceof Error ? err : new Error(String(err)));
      this.ws?.close();
    }
  }

  private async fetchMac(nonce: string, ts: number): Promise<string> {
    const res = await fetch(buildGatewayWsAuthUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nonce, ts }),
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as { mac?: string; error?: string } | null;
    if (!res.ok || !json?.mac) {
      throw new Error(json?.error?.trim() || `gateway WS auth BFF ${res.status}`);
    }
    return json.mac;
  }

  private markReady(): void {
    this.clearTimers();
    this.authenticated = true;
    this.reconnectDelayMs = RECONNECT_MIN_MS;
    this.readyResolve?.();
    this.readyResolve = null;
    this.readyReject = null;
    this.resubscribeAll();
  }

  private failReady(err: Error): void {
    this.clearTimers();
    this.readyReject?.(err);
    this.readyResolve = null;
    this.readyReject = null;
    this.ready = null;
    this.authenticated = false;
  }

  private send(payload: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("gateway WS not open");
    }
    this.ws.send(JSON.stringify(payload));
  }

  private rejectAllPending(err: Error): void {
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(err);
      this.pending.delete(id);
    }
  }

  private clearTimers(): void {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
    if (this.authTimer) {
      clearTimeout(this.authTimer);
      this.authTimer = null;
    }
  }

  private resetSocket(): void {
    this.clearTimers();
    this.rejectAllPending(new Error("gateway WS reconnecting"));
    if (this.ws) {
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.authenticated = false;
  }
}

const gatewayWsRpcClient = new GatewayWsRpcClient();

export function subscribeGatewayChannel(
  channel: string,
  listener: (payload: unknown) => void,
): () => void {
  return gatewayWsRpcClient.subscribe(channel, listener);
}
