import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeSocket {
  static instances: FakeSocket[] = [];
  static OPEN = 1;
  readyState = 0;
  readonly sent: unknown[] = [];
  private readonly listeners = new Map<string, Array<(event: { data?: unknown }) => void>>();

  constructor(public readonly url: string) {
    FakeSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = FakeSocket.OPEN;
      this.emit("open");
    });
  }

  addEventListener(type: string, handler: (event: { data?: unknown }) => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push(handler);
    this.listeners.set(type, list);
  }

  send(raw: string): void {
    this.sent.push(JSON.parse(raw));
  }

  close(): void {
    this.readyState = 3;
    this.emit("close");
  }

  emit(type: string, data?: unknown): void {
    for (const handler of this.listeners.get(type) ?? []) handler({ data });
  }
}

describe("subscribeHlAllMids", () => {
  const OriginalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    FakeSocket.instances = [];
    globalThis.WebSocket = FakeSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = OriginalWebSocket;
    vi.unstubAllGlobals();
  });

  it("fetchHlAllMids posts type allMids and parses the map", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ BTC: "76956.5", "@107": "0.2" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { fetchHlAllMids } = await import("./all-mids");
    await expect(fetchHlAllMids()).resolves.toEqual({ BTC: "76956.5", "@107": "0.2" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.hyperliquid.xyz/info",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ type: "allMids" }),
      }),
    );
  });

  it("subscribes allMids and fans HL frames to the listener", async () => {
    const { subscribeHlAllMids } = await import("./all-mids");
    const onMids = vi.fn();
    const stop = subscribeHlAllMids(onMids);
    await Promise.resolve();
    const fake = FakeSocket.instances[0];
    expect(fake.url).toBe("wss://api.hyperliquid.xyz/ws");
    expect(fake.sent).toEqual([{ method: "subscribe", subscription: { type: "allMids" } }]);
    fake.emit("message", JSON.stringify({ channel: "allMids", data: { mids: { BTC: "76956.5", SOL: "100.67" } } }));
    expect(onMids).toHaveBeenCalledWith({ BTC: "76956.5", SOL: "100.67" });
    stop();
  });
});
