/**
 * localStorage access for the mock service. Every read and write is wrapped:
 * storage can be missing (SSR), blocked (private mode) or full. A failed read
 * behaves like empty storage; a failed write is reported to the caller-provided
 * handler but never breaks the in-memory state.
 */

export const STORAGE_PREFIX = "propfund:v1";

export const storageKeys = {
  user: (userId: string) => `${STORAGE_PREFIX}:user:${userId}`,
  clockOffset: `${STORAGE_PREFIX}:clock-offset`,
  prices: `${STORAGE_PREFIX}:prices`,
  testSession: `${STORAGE_PREFIX}:test-session`,
} as const;

function getStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readJson<T>(key: string): T | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Returns false when the write failed (quota, blocked storage). */
export function writeJson(key: string, value: unknown): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Blocked storage: nothing to remove.
  }
}

/** Remove every key written by the mock service. */
export function removeAllMockKeys(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(`${STORAGE_PREFIX}:`)) keys.push(k);
    }
    keys.forEach((k) => storage.removeItem(k));
  } catch {
    // Blocked storage: nothing to remove.
  }
}
