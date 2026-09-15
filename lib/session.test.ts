import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A tiny in-memory cookie jar that mirrors the bits of the Next cookies() API
// that session.ts touches (set / delete / get).
type SetArgs = {
  name: string;
  value: string;
  httpOnly?: boolean;
  sameSite?: string;
  secure?: boolean;
  path?: string;
  expires?: Date;
};
const store = new Map<string, SetArgs>();
const jar = {
  set: vi.fn((args: SetArgs) => store.set(args.name, args)),
  delete: vi.fn((name: string) => store.delete(name)),
  get: vi.fn((name: string) => {
    const v = store.get(name);
    return v ? { name, value: v.value } : undefined;
  }),
};

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => jar }));

import {
  clearSessionCookie,
  getSessionTokenFromCookie,
  setSessionCookie,
} from "./session";

const COOKIE = "vanta_privy_session";

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
});
afterEach(() => vi.restoreAllMocks());

describe("setSessionCookie", () => {
  it("writes an httpOnly, lax cookie under the configured name", async () => {
    const expires = new Date(Date.now() + 60_000).toISOString();
    await setSessionCookie("tok-123", expires);

    expect(jar.set).toHaveBeenCalledTimes(1);
    const args = jar.set.mock.calls[0][0];
    expect(args.name).toBe(COOKIE);
    expect(args.value).toBe("tok-123");
    expect(args.httpOnly).toBe(true);
    expect(args.sameSite).toBe("lax");
    expect(args.path).toBe("/");
    expect(args.expires).toEqual(new Date(expires));
  });

  it("defaults the expiry ~24h out when none is provided", async () => {
    const before = Date.now();
    await setSessionCookie("tok", null);
    const args = jar.set.mock.calls[0][0];
    const ms = (args.expires as Date).getTime() - before;
    // 24h ± a small scheduling delta.
    expect(ms).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(ms).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 5_000);
  });
});

describe("getSessionTokenFromCookie", () => {
  it("returns the stored token", async () => {
    await setSessionCookie("tok-xyz", null);
    await expect(getSessionTokenFromCookie()).resolves.toBe("tok-xyz");
  });

  it("returns undefined when no cookie is set", async () => {
    await expect(getSessionTokenFromCookie()).resolves.toBeUndefined();
  });
});

describe("clearSessionCookie", () => {
  it("expires the session cookie", async () => {
    await setSessionCookie("tok", null);
    await clearSessionCookie();
    expect(jar.set).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: COOKIE,
        value: "",
        maxAge: 0,
      }),
    );
    await expect(getSessionTokenFromCookie()).resolves.toBeUndefined();
  });
});
