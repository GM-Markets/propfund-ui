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

beforeEach(() => {
  cookieValue.mockReturnValue("privy-id-token");
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("fetchGatewayMe", () => {
  it("calls /api/users/me with the session bearer", async () => {
    const calls: Request[] = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(new Request(input as RequestInfo | URL, init));
      return new Response(
        JSON.stringify({
          success: true,
          profile: {
            userId: "u1",
            address: "0xabc",
            displayName: "Ada",
            sourceType: "email",
            source: "ada@example.com",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const { fetchGatewayMe } = await import("./client");
    await expect(fetchGatewayMe()).resolves.toMatchObject({
      userId: "u1",
      address: "0xabc",
      displayName: "Ada",
    });
    expect(calls[0].url).toContain("/api/users/me");
    expect(calls[0].headers.get("authorization")).toBe("Bearer privy-id-token");
  });

  it("throws when the gateway rejects the token", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ type: "UNAUTHORIZED", message: "No Privy embedded Ethereum wallet" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    ) as unknown as typeof fetch;

    const { fetchGatewayMe, GatewayApiError } = await import("./client");
    await expect(fetchGatewayMe()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    });
    expect(new GatewayApiError(1, "x", "y")).toBeInstanceOf(Error);
  });
});
