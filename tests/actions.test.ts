import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, delete: () => undefined }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/session", () => ({
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
  getSessionTokenFromCookie: vi.fn(),
}));
vi.mock("@/lib/hsc/client", () => ({
  auth: { me: vi.fn().mockResolvedValue({ user_id: "usr_1" }) },
  HscApiError: class HscApiError extends Error {},
}));

import { setSessionCookie } from "@/lib/session";
import { establishSessionAction } from "@/app/actions/auth";

describe("auth actions", () => {
  it("establishSessionAction stores the Privy identity token", async () => {
    const r = await establishSessionAction("privy-tok");
    expect(r.ok).toBe(true);
    expect(setSessionCookie).toHaveBeenCalledWith("privy-tok", null);
  });
});
