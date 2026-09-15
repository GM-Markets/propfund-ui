import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "privy-tok" }) }),
}));
vi.mock("server-only", () => ({}));

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function mockResponses(responses: Array<{ status?: number; json: unknown }>) {
  const calls: Request[] = [];
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(input as RequestInfo | URL, init);
    calls.push(req);
    const r = responses.shift()!;
    return new Response(JSON.stringify(r.json), {
      status: r.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return calls;
}

describe("vanta client", () => {
  it("calls /v2/me with the Privy session bearer", async () => {
    const calls = mockResponses([{ json: { user_id: "u1", source: "0xabc", app_id: "a1" } }]);
    const { auth } = await import("@/lib/hsc/client");
    const me = await auth.me();
    expect(me.user_id).toBe("u1");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("/v2/me");
    expect(calls[0].headers.get("authorization")).toBe("Bearer privy-tok");
  });

  it("throws HscApiError with detail.code on 4xx", async () => {
    mockResponses([
      {
        status: 401,
        json: { detail: { code: "V2_BAD", message: "nope", retryable: false } },
      },
    ]);
    const { HscApiError, auth } = await import("@/lib/hsc/client");
    await expect(auth.me()).rejects.toBeInstanceOf(HscApiError);
  });
});
