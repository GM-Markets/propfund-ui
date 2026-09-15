type Slot<T> = { exp: number; value?: T; inflight?: Promise<T> };

const DEFAULT_TTL_MS = 45_000;

/** Process-local TTL cache with in-flight dedupe. Server and browser each have their own map. */
export function createTtlCache(defaultTtlMs = DEFAULT_TTL_MS) {
  const map = new Map<string, Slot<unknown>>();

  async function remember<T>(key: string, load: () => Promise<T>, ttlMs = defaultTtlMs): Promise<T> {
    const now = Date.now();
    const hit = map.get(key) as Slot<T> | undefined;
    if (hit?.value !== undefined && hit.exp > now) return hit.value;
    if (hit?.inflight) return hit.inflight;
    const inflight = load()
      .then((value) => {
        map.set(key, { value, exp: Date.now() + ttlMs });
        return value;
      })
      .catch((err) => {
        map.delete(key);
        throw err;
      });
    map.set(key, { inflight, exp: 0 });
    return inflight;
  }

  function invalidate(...prefixes: string[]): void {
    if (prefixes.length === 0) {
      map.clear();
      return;
    }
    for (const key of [...map.keys()]) {
      if (prefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}:`) || key.startsWith(prefix))) {
        map.delete(key);
      }
    }
  }

  return { remember, invalidate };
}

export const readCache = createTtlCache();
export const READ_TTL_MS = DEFAULT_TTL_MS;
export const TIERS_TTL_MS = 5 * 60_000;
