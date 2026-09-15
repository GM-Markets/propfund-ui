import { describe, expect, it, vi } from "vitest";

import { createTtlCache } from "./ttl-cache";

describe("createTtlCache", () => {
  it("returns the cached value and dedupes in-flight loads", async () => {
    const cache = createTtlCache(60_000);
    const load = vi.fn(async () => "ok");
    const [a, b] = await Promise.all([cache.remember("me", load), cache.remember("me", load)]);
    expect(a).toBe("ok");
    expect(b).toBe("ok");
    expect(load).toHaveBeenCalledTimes(1);
    await expect(cache.remember("me", load)).resolves.toBe("ok");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("invalidates by prefix", async () => {
    const cache = createTtlCache(60_000);
    const load = vi.fn(async () => 1);
    await cache.remember("van:me:tok", load);
    cache.invalidate("van:me");
    await cache.remember("van:me:tok", load);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
