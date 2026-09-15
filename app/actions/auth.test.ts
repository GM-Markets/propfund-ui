import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));
const { setSessionCookie, clearSessionCookie } = vi.hoisted(() => ({
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

const { me } = vi.hoisted(() => ({ me: vi.fn() }));

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/session", () => ({ setSessionCookie, clearSessionCookie }));
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
    me.mockResolvedValueOnce({ user_id: "usr_1" });
    const r = await establishSessionAction("privy-token");
    expect(r).toEqual({ ok: true });
    expect(setSessionCookie).toHaveBeenCalledWith("privy-token", null);
    expect(me).toHaveBeenCalled();
  });

  it("clears the cookie when the gateway rejects the token", async () => {
    const { HscApiError } = await import("@/lib/hsc/client");
    me.mockRejectedValueOnce(new HscApiError(401, "UNAUTHORIZED", "Unauthorized"));
    const r = await establishSessionAction("privy-token");
    expect(r).toMatchObject({ ok: false, message: "Unauthorized" });
    expect(clearSessionCookie).toHaveBeenCalled();
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
