/**
 * Behavioral tests for the Vanta BFF client: Privy/session injection,
 * error envelopes, 204, and X-Prop-Account.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieValue = vi.fn<() => string | undefined>(() => undefined);

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => {
      const value = cookieValue();
      return value ? { value } : undefined;
    },
  }),
}));

const originalFetch = globalThis.fetch;

type Resp = { status?: number; json?: unknown; text?: string };

function mockResponses(responses: Resp[]) {
  const calls: Request[] = [];
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(new Request(input as RequestInfo | URL, init));
    const r = responses.shift()!;
    const status = r.status ?? 200;
    if (status === 204) return new Response(null, { status: 204 });
    const bodyText = r.text ?? JSON.stringify(r.json ?? null);
    return new Response(bodyText, {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return calls;
}

beforeEach(() => {
  cookieValue.mockReturnValue(undefined);
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("vanta() request helper", () => {
  it("attaches the Privy session cookie as Bearer on user-authed calls", async () => {
    cookieValue.mockReturnValue("privy-id-token");
    const calls = mockResponses([{ json: { user_id: "u1" } }]);
    const { auth } = await import("./client");
    await auth.me();
    expect(calls[0].url).toContain("/v2/me");
    expect(calls[0].headers.get("authorization")).toBe("Bearer privy-id-token");
  });

  it("sends a JSON body + content-type when `json` is provided", async () => {
    const calls = mockResponses([{ json: { payment_id: "p1" } }]);
    const { payments } = await import("./client");
    await payments.checkout({
      tier_id: "tier_25k",
      market: "crypto",
      asset_class: "crypto",
      account_size: 25_000,
      amount_cents: 8400,
    });
    expect(calls[0].headers.get("content-type")).toBe("application/json");
    await expect(calls[0].json()).resolves.toMatchObject({ tier_id: "tier_25k", amount_cents: 8400 });
  });

  it("parses the FastAPI `detail` error envelope", async () => {
    mockResponses([{ status: 409, json: { detail: { code: "V2_AGREEMENT_REQUIRED", message: "sign", retryable: false } } }]);
    const { auth, HscApiError } = await import("./client");
    await expect(auth.me()).rejects.toMatchObject({ code: "V2_AGREEMENT_REQUIRED", status: 409 });
    expect(new HscApiError(1, "x", "y")).toBeInstanceOf(Error);
  });

  it("parses the platform `error` envelope and retryable flag", async () => {
    mockResponses([{ status: 502, json: { error: { code: "V2_UPSTREAM", message: "down", retryable: true } } }]);
    const { auth } = await import("./client");
    await expect(auth.me()).rejects.toMatchObject({
      code: "V2_UPSTREAM",
      status: 502,
      retryable: true,
    });
  });

  it("parses the gateway { type, message } envelope", async () => {
    mockResponses([
      { status: 500, json: { type: "INTERNAL_ERROR", message: "could not provision gateway user", statusCode: 500 } },
    ]);
    const { auth } = await import("./client");
    await expect(auth.me()).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      status: 500,
      message: "could not provision gateway user",
    });
  });

  it("falls back to UNKNOWN + status text when the error body has no envelope", async () => {
    mockResponses([{ status: 500, text: "" }]);
    const { auth } = await import("./client");
    await expect(auth.me()).rejects.toMatchObject({ code: "UNKNOWN", status: 500 });
  });

  it("returns undefined for a 204 No Content (e.g. DELETE)", async () => {
    mockResponses([{ status: 204 }]);
    const { apiKeys } = await import("./client");
    await expect(apiKeys.revoke("k1")).resolves.toBeUndefined();
  });

  it("adds the X-Prop-Account header when a prop account id is passed", async () => {
    const calls = mockResponses([{ json: { positions: [] } }]);
    const { trading } = await import("./client");
    await trading.positions("prop-1");
    expect(calls[0].headers.get("x-prop-account")).toBe("prop-1");
  });

  it("omits X-Prop-Account when no id is passed", async () => {
    const calls = mockResponses([{ json: { positions: [] } }]);
    const { trading } = await import("./client");
    await trading.positions();
    expect(calls[0].headers.get("x-prop-account")).toBeNull();
  });

  it("closes on POST /v2/trading/close", async () => {
    const calls = mockResponses([{ json: { status: "ok" } }]);
    const { trading } = await import("./client");
    await trading.close({ trade_pair: "BTC", market_type: "perp" }, "prop-1");
    expect(calls[0].url).toContain("/v2/trading/close");
    expect(calls[0].method).toBe("POST");
  });
});
