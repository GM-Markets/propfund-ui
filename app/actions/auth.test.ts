import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));
const { setSessionCookie, clearSessionCookie } = vi.hoisted(() => ({
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

const { me } = vi.hoisted(() => ({ me: vi.fn() }));
const { fetchGatewayMe } = vi.hoisted(() => ({ fetchGatewayMe: vi.fn() }));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/session", () => ({ setSessionCookie, clearSessionCookie }));
vi.mock("@/lib/gateway/client", () => ({
  fetchGatewayMe,
  GatewayApiError: class GatewayApiError extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));
vi.mock("@/lib/hsc/client", () => ({
  auth: { me },
  HscApiError: class HscApiError extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
    ) {
      super(message);
    }
  },
}));

import { establishSessionAction, logoutAction } from "./auth";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

describe("establishSessionAction", () => {
  it("stores the Privy identity token after the gateway accepts it", async () => {
    fetchGatewayMe.mockResolvedValueOnce({ userId: "u1", address: "0xabc" });
    me.mockResolvedValueOnce({ user_id: "usr_1" });
    const r = await establishSessionAction("privy-token");
    expect(r).toEqual({ ok: true });
    expect(setSessionCookie).toHaveBeenCalledWith("privy-token", null);
    expect(fetchGatewayMe).toHaveBeenCalledWith("privy-token");
    expect(me).toHaveBeenCalled();
  });

  it("still signs in when /van is down after /users/me succeeds", async () => {
    fetchGatewayMe.mockResolvedValueOnce({ userId: "u1", address: "0xabc" });
    const { HscApiError } = await import("@/lib/hsc/client");
    me.mockRejectedValueOnce(new HscApiError(504, "GATEWAY_UNREACHABLE", "Could not reach /van"));
    const r = await establishSessionAction("privy-token");
    expect(r).toEqual({ ok: true });
    expect(clearSessionCookie).not.toHaveBeenCalled();
  });

  it("clears the cookie when the gateway rejects the token", async () => {
    const { GatewayApiError } = await import("@/lib/gateway/client");
    fetchGatewayMe.mockRejectedValueOnce(new GatewayApiError(401, "UNAUTHORIZED", "Unauthorized"));
    const r = await establishSessionAction("privy-token");
    expect(r).toMatchObject({ ok: false, message: "Unauthorized" });
    expect(clearSessionCookie).toHaveBeenCalled();
    expect(me).not.toHaveBeenCalled();
  });

  it("rejects an empty token", async () => {
    const r = await establishSessionAction("  ");
    expect(r).toMatchObject({ ok: false, code: "UNKNOWN" });
    expect(setSessionCookie).not.toHaveBeenCalled();
  });
});

describe("logoutAction", () => {
  it("clears the session cookie and redirects to login", async () => {
    await logoutAction();
    expect(clearSessionCookie).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login?signedOut=1");
  });
});
